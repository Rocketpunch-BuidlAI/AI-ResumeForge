import { NextRequest, NextResponse } from 'next/server';
import { streamText } from 'ai';
import { z } from 'zod';
import axios from 'axios';
import { AI_AGENT_URL } from '@/utils/config';
import { anthropic } from '@ai-sdk/anthropic';
import { zodToJsonSchema } from 'zod-to-json-schema';
// note. Using AI SDK to generate cover letter (streaming method)

// Request type definition
type CoverLetterSection = {
  selfIntroduction: string;
  motivation: string;
  relevantExperience: string;
  futureAspirations: string;
  targetCompany: string | null;
  department: string | null;
  position: string | null;
  customPrompt: string;
  skills: string;
  experience: string;
};

// Response schema definition
const coverLetterSchema = z.object({
  text: z.string().describe('Generated cover letter content'),
  sources: z
    .array(
      z.object({
        id: z.string().describe('Referenced template ID'),
        contributions: z.number().describe('Contribution percentage'),
      })
    )
    .describe('Reference template information')
    .optional(),
});

export const maxDuration = 300;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { payload, body: { role, experience }, modelParams } = body;

    const response = await axios.post(`${AI_AGENT_URL}/coverletters`, {
      role: role,
      experience: experience,
    });

    const data = await response.data;

    console.log('data', data);

    // Parse request data
    const jsonData = payload as CoverLetterSection;

    // Validate required fields are non-blank
    const requiredFields = [
      'selfIntroduction',
      'motivation',
      'relevantExperience',
      'futureAspirations',
    ] as const;

    for (const field of requiredFields) {
      const value = jsonData[field];
      if (typeof value !== 'string' || !value.trim()) {
        return NextResponse.json(
          { status: 'error', message: `${field} is required and cannot be empty` },
          { status: 400 }
        );
      }
    }

    console.log('data', data);

    // Compose prompt
    let systemPrompt = `
You are an experienced cover letter writer with 10 years of experience. You know how to write cover letters for different jobs and careers. Your task is to generate a Korean-style cover letter based on the data provided by the client, tailored to the job and career.
It should be written in English, follow the item structure below, and the sentences should flow naturally and smoothly as if written by a human being. The item names should be written in paragraph form under the following headings: **Introduction**\n\n, **Motivation and Fit**\n\n, **Experiences**\n\n, and **Career Aspirations**\n\n. Always include the heading for each section and write the content with line breaks (paragraphs).
`;

    // Add reference examples only if data exists and is not empty
    if (data && Object.keys(data).length > 0) {
      systemPrompt += `
REFERENCE EXAMPLES:
The following examples from previous cover letters are specifically tailored to this person's job segment and career level. These are highly relevant references that you should actively utilize. These examples contain optimal patterns, expressions, and content structures for this specific career context, so incorporate them actively while adapting to the user's specific information. Important: Prioritize reference examples from the same job role as the client. If none are available, you may consult examples from closely related roles as secondary sources. You must first identify the characteristics of the target job, and never reference content that is unrelated to the intended position:
${JSON.stringify(data, null, 2)}

ADDITIONAL OUTPUT REQUIREMENTS:
If you used any of the reference examples provided, list the ID of each example and the percentage (%) contribution it made to your generated text in the 'sources' field. For example: [{"id": "example1", "contributions": 30}, {"id": "example2", "contributions": 20}]. The total contribution percentage does not need to equal 100% if other sources or original content were also used. The total contribution percentage must not exceed 100%, and the contribution percentage should be calculated approximately in proportion to the word counts used from each reference.
`;
    }

    systemPrompt += `
Terms of the request:
Component 1: Introduction
- Include: university major, applying job title (position)
- Optional: spark of interest, personal values, vision, personality traits
- Do not hallucinate or assume information if not provided by the user
- Write at least 300 words
Component 2: Motivation and Fit
- Include: company-specific interest, reasons for applying, personal strengths
- Write at least 300 words
Component 3: Experiences
- Include: school projects, competitions, extracurriculars, or work-related activities (if user input)
- Use the problem–solution–learning format when writing about experiences.
Always describe what the experience was in detail, explain the problem or challenge that occurred, how you addressed or solved it, and what you learned from it.
- Include: professional skills (spoken languages, programming languages, certifications, tools, soft skills) (if user input)
- Important: Do not exaggerate or invent experience and skills unless it is provided
- Write at least 500 words
Component 4: Career Aspirations
- Include: growth goals, intended contributions, and long-term vision
- Write at least 300 words
- This is the only section that may end with a brief summary sentence (30–50 words)
Formatting and Writing Style:
- Always prioritize user-provided information above all else. Reference examples may be used to guide tone and structure, but never override or substitute the user's actual input.
- Do not include introductory or concluding sentences in Components 1–3
- Use varied sentence structure (avoid repeating "I do" or "I am" or overlapped structure more than 3 times)
- Don't use more than 2 hyphens in the entire text
- Calibrate skill levels and tone to match the applicant's experience
- Adjust skills and levels appropriately according to job function and domain
- For skills, focus on tool/language names + actual usage experience and effects
- End naturally with aspirations (no need for a separate closing sentence)
- Focus on specific tool/language usage over generic claims
- Avoid overemphasizing achievements; if included, ensure they are number-driven and realistic (e.g., increased MOU by x, increased MOU by 10% - don't use the example used in the final cover letter every time)
- If you are a senior (5+ years), write at a level that naturally reflects your years of experience

CONTENT REQUIREMENTS:
**Introduction**\n\n: ${jsonData.selfIntroduction}
**Motivation and Fit**\n\n: ${jsonData.motivation}
**Experiences**\n\n: ${jsonData.relevantExperience}
**Career Aspirations**\n\n: ${jsonData.futureAspirations}
`;

    if (jsonData.targetCompany || jsonData.department || jsonData.position) {
      systemPrompt += `
POSITION-SPECIFIC CONTEXT:
- Target Company: ${jsonData.targetCompany || 'Not specified'}
- Target Department: ${jsonData.department || 'Not specified'}
- Target Position: ${jsonData.position || 'Not specified'}
- Key Skills: ${jsonData.skills || 'Not specified'}
- Experience Level: ${jsonData.experience === 'S' ? 'Senior (5+ years)' : 'Junior'}
`;
    }

    if (jsonData.customPrompt) {
      systemPrompt += `
ADDITIONAL REQUIREMENTS:
${jsonData.customPrompt}
`;
    }

    // JSON 형식 안내를 시스템 프롬프트에 추가
    const jsonFormat = JSON.stringify(zodToJsonSchema(coverLetterSchema));
    systemPrompt += `\nReturn your response only in this JSON format: ${jsonFormat}`;

    console.log('프롬프트', systemPrompt);

    // streamText 사용하여 응답 생성
    const result = streamText({
      model: anthropic('claude-3-7-sonnet-20250219'),
      prompt: systemPrompt,
      temperature: modelParams?.temperature ?? 0.7,
      maxTokens: modelParams?.max_tokens ?? 4000,
      onError({ error }) {
        console.error('Streaming error:', error);
      },
    });

    // 스트림 응답 반환
    return result.toTextStreamResponse();
  } catch (error) {
    console.error('Edit error:', error);
    return NextResponse.json(
      { status: 'error', message: 'Failed to process cover letter generation request.' },
      { status: 500 }
    );
  }
}

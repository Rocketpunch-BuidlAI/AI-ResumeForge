import { NextRequest, NextResponse } from 'next/server';
import { streamObject } from 'ai';
import { openai } from '@ai-sdk/openai';
import { z } from 'zod';
import axios from 'axios';
import { AI_AGENT_URL } from '@/utils/config';

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
  sources: z.array(
    z.object({
      id: z.string().describe('Referenced template ID'),
      contributions: z.number().describe('Contribution percentage')
    })
  ).describe('Reference template information')
});

export const maxDuration = 300;

export async function POST(request: NextRequest) {
  try {

    const body = await request.json();

    const { payload, body: { role, experience } } = body;

    const response = await axios.post(`${AI_AGENT_URL}/coverletters`, {
      role: role,
      experience: experience,
    });

    const data = await response.data;

    console.log("data", data)

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

    // Compose prompt
    let systemPrompt = `
You are an experienced cover letter writer with 10 years of experience. You know how to write cover letters for different jobs and careers. Your task is to generate a Korean-style cover letter based on the data provided by the client, tailored to the job and career.
It should be written in English, follow the item structure below, and the sentences should flow naturally and smoothly as if written by a human being. The item names should be written in paragraph form under the following headings: 1. Introduction, 2. Motivation and Fit, 3. Experiences, and 4. Career Aspirations.
`;

    // Add reference examples only if data exists and is not empty
    if (data && Object.keys(data).length > 0) {
      systemPrompt += `
REFERENCE EXAMPLES:
The following examples from previous cover letters are specifically tailored to this person's job role and career level. These are highly relevant references that you should actively utilize. These examples contain optimal patterns, expressions, and content structures for this specific career context, so incorporate them actively while adapting to the user's specific information:
${JSON.stringify(data, null, 2)}
`;
    }

    systemPrompt += `
Terms of the request:
- Four (4) components:
 1. Introduction (major, job title, spark of interest, values, vision, personality)
 2. Motivation and Fit (company information, interest, reasons for applying, strengths, professional skills - spoken language, programming language, certifications, soft skills, etc.)
 3. Experiences (school projects, competitions, activities, previous work or work-related experiences - describe and solve problems during these activities and what you learned)
   * Do not exaggerate your relevant experience unless you enter it yourself ← Important!
 4. Career Aspirations (growth goals, contribution points, long-term career goals)
Writing style:
- First person using information provided by the client.
- Use hyphens (-) no more than 2 times in the whole text
- Avoid repetition of sentence structure (I do / I am) and excessive AI language
- If you are a senior (5+ years), write at a level that naturally reflects your years of experience
- Adjust skills and levels appropriately according to job function and domain
- For skills, focus on tool/language names + actual usage experience and effects
- End naturally with aspirations (no need for a separate closing sentence)
- Don't overemphasize achievements
- When writing about accomplishments, be clear and number-driven (e.g., increased MOU by x, increased MOU by 10% - don't use the example used in the final cover letter every time)

ADDITIONAL OUTPUT REQUIREMENTS:
If you used any of the reference examples provided, list the ID of each example and the percentage (%) contribution it made to your generated text in the 'sources' field. For example: [{"id": "example1", "contributions": 30}, {"id": "example2", "contributions": 20}]. The total contribution percentage does not need to equal 100% if other sources or original content were also used.

CONTENT REQUIREMENTS:
1. Introduction: ${jsonData.selfIntroduction}
2. Motivation and Fit: ${jsonData.motivation}
3. Experiences: ${jsonData.relevantExperience}
4. Career Aspirations: ${jsonData.futureAspirations}
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
    
console.log("프롬프트", systemPrompt);

    // Generate cover letter using AI model (streaming method)
    const result = streamObject({
      model: openai('gpt-4o'),
      schema: coverLetterSchema,
      schemaName: 'CoverLetter',
      schemaDescription: 'Cover letter generation result',
      prompt: systemPrompt,
      onError({ error }) {
        console.error('Streaming error:', error);
      },
    });

    return result.toTextStreamResponse();
  } catch (error) {
    console.error('Edit error:', error);
    return NextResponse.json(
      { status: 'error', message: 'Failed to process cover letter generation request.' },
      { status: 500 }
    );
  }
}

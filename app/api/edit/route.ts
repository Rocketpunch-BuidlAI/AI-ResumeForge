import { NextRequest, NextResponse } from 'next/server';
import { streamObject } from 'ai';
import { openai } from '@ai-sdk/openai';
import { z } from 'zod';
import console from 'console';

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
    // Parse request data
    const jsonData = (await request.json()) as CoverLetterSection;

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
You are an expert cover letter writer specializing in Korean-style English cover letters. Your task is to create a compelling, professional cover letter that effectively showcases the candidate's qualifications and fit for the position.

STRUCTURE REQUIREMENTS:
1. Introduction
   - Academic background and key qualifications
   - Core values and professional identity
   - Career vision and personal strengths
   - Maximum 2-3 concise paragraphs

2. Motivation and Fit
   - Specific reasons for applying to this company/position
   - Alignment with company values and goals
   - Relevant skills and competencies
   - Professional achievements and certifications
   - Maximum 2-3 focused paragraphs

3. Experiences
   - Key projects and achievements
   - Problem-solving examples
   - Learning outcomes and growth
   - Quantifiable results where possible
   - Maximum 2-3 detailed paragraphs

4. Career Aspirations
   - Short-term goals and contributions
   - Long-term career vision
   - Professional development plans
   - Maximum 1-2 forward-looking paragraphs

WRITING STYLE GUIDELINES:
- Use active voice and strong action verbs
- Maintain professional yet engaging tone
- Focus on concrete achievements and results
- Limit hyphen usage to maximum 2 instances
- Avoid repetitive sentence structures
- Write naturally, as if by a human
- Adapt language complexity based on experience level
- End with forward-looking statements

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

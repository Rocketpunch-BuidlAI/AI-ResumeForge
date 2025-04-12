import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

const AI_AGENT_URL = process.env.AI_AGENT_BASE_URL;

// note. 다른 자기소개서 IP를 활용하여 새로운 자기소개서 생성

// 요청 타입 정의
type CoverLetterSection = {
  selfIntroduction: string;
  motivation: string;
  relevantExperience: string;
  futureAspirations: string;
  targetCompany: string | null;
  department: string | null;
  position: string | null;
  customPrompt: string;
};

export async function POST(request: NextRequest) {
  try {
    // 요청 데이터 파싱
    const jsonData = (await request.json()) as CoverLetterSection;

    // 필수 필드 non-blank 검증
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

    const response = await axios.post(`${AI_AGENT_URL}/edit`, {
      selfIntroduction: jsonData.selfIntroduction,
      motivation: jsonData.motivation,
      relevantExperience: jsonData.relevantExperience,
      futureAspirations: jsonData.futureAspirations,
      ...(jsonData.targetCompany || jsonData.department || jsonData.position ? {
        metadata: {
          targetCompany: jsonData.targetCompany,
          department: jsonData.department,
          position: jsonData.position,
        }
      } : {}),
      customPrompt: jsonData.customPrompt,
    });

    const aiAgentResponse = response.data;

    if (response.status !== 200) {
      return NextResponse.json(
        { status: 'error', message: 'Failed to process edit request' },
        { status: 400 }
      );
    }

    // 성공 응답 반환
    return NextResponse.json(aiAgentResponse, { status: 200 });
  } catch (error) {
    console.error('Edit error:', error);
    return NextResponse.json(
      { status: 'error', message: 'Failed to process edit request' },
      { status: 500 }
    );
  }
}

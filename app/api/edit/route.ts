import { NextRequest, NextResponse } from 'next/server';
import { PdfManager } from '@/utils/PdfManager';
import axios from 'axios';

const AI_AGENT_URL = process.env.AI_AGENT_BASE_URL;

// 응답 타입 정의
interface SourceContribution {
  id: string;
  contributions: number;
}

interface EditResponse {
  enhanced_cover_letter: string;
  used_sources: SourceContribution[];
}

export async function POST(request: NextRequest) {
  try {
    // FormData 파싱
    const formData = await request.formData();
    
    // 파일 및 메타데이터 추출
    const original_cover_letter = formData.get('original_cover_letter') as File;
    const metadataStr = JSON.parse(formData.get('metadata') as string);
    
    // 필수 필드 검증
    if (!original_cover_letter) {
      return NextResponse.json(
        { status: 'error', message: 'Original cover letter file is required' },
        { status: 400 }
      );
    }
    
    if (!metadataStr) {
      return NextResponse.json(
        { status: 'error', message: 'Metadata is required' },
        { status: 400 }
      );
    }
    
    // 메타데이터 파싱
    try {
      JSON.parse(metadataStr); // 메타데이터 유효성 검사만 수행
    } catch {
      return NextResponse.json(
        { status: 'error', message: 'Invalid metadata format' },
        { status: 400 }
      );
    }
    
    // PDF 텍스트 추출
    const pdfBytes = new Uint8Array(await original_cover_letter.arrayBuffer());
    const extractedText = await PdfManager.extractTextFromBytes(pdfBytes); // 텍스트 추출 확인

    const response = await axios.post(`${AI_AGENT_URL}/edit`, {
      original_cover_letter: extractedText,
      metadata: metadataStr
    });

    if(response.status !== 200) {
      return NextResponse.json(
        { status: 'error', message: 'Failed to process edit request' },
        { status: 400 }
      );
    }

    const aiAgentResponse = response.data;
    
    
    // 성공 응답 반환
    return NextResponse.json(response);
    
  } catch (error) {
    console.error('Edit error:', error);
    return NextResponse.json(
      { status: 'error', message: 'Failed to process edit request' },
      { status: 500 }
    );
  }
}
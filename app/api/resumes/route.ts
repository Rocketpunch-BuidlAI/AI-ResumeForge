// app/api/resumes/route.ts
import { NextResponse } from 'next/server';
import {
  getCoverletter,
  saveCoverletter,
  getLatestCoverletterByCidAndUserId,
  saveCoverletterText,
  type ResumeMetadata,
} from '@/db';
import { put } from '@vercel/blob';
import axios from 'axios';
import { PdfManager } from '@/utils/PdfManager';
import { AI_AGENT_URL } from '@/utils/config';
import console from 'console';

export async function GET(request: Request) {
  try {
    // URL에서 쿼리 파라미터 가져오기
    const url = new URL(request.url);
    const userId = url.searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // 데이터베이스에서 해당 사용자의 이력서 가져오기
    const resumes = await getCoverletter(Number(userId));

    // 응답 데이터 구성
    return NextResponse.json({ resumes });
  } catch (error) {
    console.error('Error fetching resumes:', error);
    return NextResponse.json({ error: 'Failed to fetch resumes' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const userId = formData.get('userId') as string;
    const metadata = formData.get('metadata') as string;

    console.log('Received upload request - userId:', userId);
    console.log('Received file:', file ? `${file.name} (${file.size} bytes)` : 'No file');
    console.log('metadata:', metadata);

    if (!file || !userId) {
      return NextResponse.json({ error: 'File and user ID are required.' }, { status: 400 });
    }

    console.log('Uploading file to blob storage...');
    const blob = await put(file.name, file, {
      access: 'public',
      allowOverwrite: true,
    });

    const cid = blob.url.split('/').pop() ?? blob.url;
    console.log('File uploaded to blob storage, cid:', cid);

    // Save to database with metadata
    console.log('Saving to database...');
    await saveCoverletter(Number(userId), cid, blob.url, metadata);

    const savedCoverletter = await getLatestCoverletterByCidAndUserId(Number(userId));
    console.log('Saved to database, coverletter id:', savedCoverletter?.id);

    if (!savedCoverletter) {
      return NextResponse.json({ error: 'Coverletter not found.' }, { status: 400 });
    }

    console.log('Extracting text from PDF...');
    // Convert File to ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();
    const pdfBytes = new Uint8Array(arrayBuffer);

    try {
      console.log('PdfManager.extractTextFromBytes', pdfBytes);
      const extractedText = await PdfManager.extractTextFromBytes(pdfBytes);
      console.log('Text extracted successfully', extractedText);

      // 추출된 텍스트를 새 테이블에 저장
      console.log('Saving extracted text to database...');
      await saveCoverletterText(savedCoverletter.id, extractedText);
      console.log('Text saved to database successfully');

      // upload cover letter to pinecone
      console.log('Uploading to AI agent:', AI_AGENT_URL);
      const response = await axios.post(`${AI_AGENT_URL}/upload`, {
        text: extractedText,
        id: savedCoverletter.id.toString(),
        role: (savedCoverletter.metadata as ResumeMetadata).jobTitle,
        experience: (savedCoverletter.metadata as ResumeMetadata).yearsOfExperience,
      });

      const aiAgentResponse = response.data;
      console.log('AI agent response:', aiAgentResponse);

      if (aiAgentResponse.status !== 'success') {
        console.error('AI agent returned error:', aiAgentResponse);
        return NextResponse.json(
          { status: 'error', message: aiAgentResponse.message },
          { status: 400 }
        );
      }
    } catch (pdfError) {
      console.error('Error processing PDF:', pdfError);
      return NextResponse.json(
        {
          status: 'error',
          message:
            'Error processing PDF file: ' +
            (pdfError instanceof Error ? pdfError.message : String(pdfError)),
        },
        { status: 400 }
      );
    }

    // Return both CID and complete uploadResponse
    return NextResponse.json({ url: blob.url, cid });
  } catch (error) {
    console.error('Error uploading file:', error);
    // 자세한 오류 로깅
    if (error instanceof Error) {
      console.error('Error name:', error.name);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }

    return NextResponse.json(
      {
        status: 'error',
        message:
          'An error occurred while uploading the file: ' +
          (error instanceof Error ? error.message : String(error)),
      },
      { status: 500 }
    );
  }
}

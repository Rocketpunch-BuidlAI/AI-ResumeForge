// app/api/resumes/route.ts
import { NextResponse } from 'next/server';
import { getCoverletter, saveCoverletter, getLatestCoverletterByCidAndUserId, type ResumeMetadata } from '@/db';
import { put } from '@vercel/blob';
import axios from 'axios';
import { PdfManager } from '@/utils/PdfManager';
import { AI_AGENT_URL } from '@/utils/config';


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

    console.log('metadata', metadata);

    if (!file || !userId) {
      return NextResponse.json('File and user ID are required.', { status: 400 });
    }

    const blob = await put(file.name, file, {
      access: 'public',
      allowOverwrite: true,
    });

    const cid = blob.url.split('/').pop() ?? blob.url;

    console.log('cid', cid);

    // Save to database with metadata
    await saveCoverletter(Number(userId), cid, blob.url, metadata);

    const savedCoverletter = await getLatestCoverletterByCidAndUserId(Number(userId));

    if(!savedCoverletter) {
      return NextResponse.json('Coverletter not found.', { status: 400 });
    }

    // // Convert File to ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();
    const pdfBytes = new Uint8Array(arrayBuffer);
    const extractedText = await PdfManager.extractTextFromBytes(pdfBytes);

    // // upload cover letter to pinecone
    const response = await axios.post(`${AI_AGENT_URL}/upload`, {
      text: extractedText,
      id: savedCoverletter.id.toString(),
      role: (savedCoverletter.metadata as ResumeMetadata).jobTitle,
      experience: (savedCoverletter.metadata as ResumeMetadata).yearsOfExperience
    });

    const aiAgentResponse = response.data;

    if (aiAgentResponse.status !== 'success') {
      return NextResponse.json(
        { status: 'error', message: aiAgentResponse.message },
        { status: 400 }
      );
    }
    
    // Return both CID and complete uploadResponse
    return NextResponse.json({ url: blob.url, cid });
  } catch (error) {
    console.error('Error uploading file:', error);
    return NextResponse.json('An error occurred while uploading the file.', { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import { saveCoverletter, saveCoverletterWithReferences } from '@/db';
import { AI_AGENT_URL } from '@/utils/config';
import { put } from '@vercel/blob';
import axios from 'axios';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const text = formData.get('text') as string;
    const userId = formData.get('userId') as string;
    const referencesJson = formData.get('references') as string;
    const metadata = formData.get('metadata') as string;

    if (!file || !text || !referencesJson || !metadata) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // references JSON 파싱
    const references = JSON.parse(referencesJson);

    // TODO: Story IP 등록

    console.log('Uploading file to blob storage...');
    const blob = await put(file.name, file, {
      access: 'public',
      allowOverwrite: true,
    });

    // CID와 파일 경로 추출
    const cid = blob.url.split('/').pop() ?? blob.url;
    const filePath = blob.url;
    
    // 데이터베이스에 Coverletter 정보 저장
    const savedCoverletterId = await saveCoverletter(Number(userId), cid, filePath, metadata);

    const metadataObj = JSON.parse(metadata);

    console.log('Uploading to AI agent:', AI_AGENT_URL);
    const response = await axios.post(`${AI_AGENT_URL}/upload`, {
      text: text,
      id: savedCoverletterId,
      role: metadataObj.jobTitle,
      experience: metadataObj.yearsOfExperience,
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

    // 이력서 텍스트와 참조 정보 저장
    await saveCoverletterWithReferences(
      savedCoverletterId,
      text,
      references.map((ref: { id: number; contribution: number }) => ({
        referencedId: ref.id,
        contribution: ref.contribution
      }))
    );

    

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error saving coverletter text and references:', error);
    return NextResponse.json(
      { error: 'Failed to save coverletter text and references' },
      { status: 500 }
    );
  }
}

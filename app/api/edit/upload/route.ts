import { NextResponse } from 'next/server';
import { saveCoverletterWithReferences } from '@/db';
import { AI_AGENT_URL } from '@/utils/config';
import axios from 'axios';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const text = formData.get('text') as string;
    const referencesJson = formData.get('references') as string;
    const role = formData.get('role') as string;
    const experience = formData.get('experience') as string;

    if (!file || !text || !referencesJson) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // references JSON 파싱
    const references = JSON.parse(referencesJson);

    // TODO: Story IP 등록
    // TODO: coverletter db에 저장
    const coverletterId = 1; // 임시 ID, 실제로는 DB에서 생성된 ID를 사용해야 함

    console.log('Uploading to AI agent:', AI_AGENT_URL);
    const response = await axios.post(`${AI_AGENT_URL}/upload`, {
      text: text,
      id: coverletterId,
      role: role,
      experience: experience,
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
      coverletterId,
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

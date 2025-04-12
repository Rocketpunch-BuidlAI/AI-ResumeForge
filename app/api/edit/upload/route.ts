import { NextResponse } from 'next/server';
import { saveCoverletterWithReferences } from '@/db';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const text = formData.get('text') as string;
    const referencesJson = formData.get('references') as string;

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

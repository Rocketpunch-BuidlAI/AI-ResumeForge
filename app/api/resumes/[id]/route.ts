// app/api/resumes/[id]/route.ts
import { NextResponse } from 'next/server';
import { getCoverletterById } from '@/db';

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const id = params.id;

    if (!id) {
      return NextResponse.json({ error: 'Resume ID is required' }, { status: 400 });
    }

    // 특정 ID의 이력서 가져오기
    const resumes = await getCoverletterById(Number(id));

    if (!resumes || resumes.length === 0) {
      return NextResponse.json({ error: 'Resume not found' }, { status: 404 });
    }

    // 응답 데이터 구성
    return NextResponse.json({ resume: resumes[0] });
  } catch (error) {
    console.error('Error fetching resume:', error);
    return NextResponse.json({ error: 'Failed to fetch resume' }, { status: 500 });
  }
}

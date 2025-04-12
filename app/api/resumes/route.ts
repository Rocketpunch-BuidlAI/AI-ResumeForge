// app/api/resumes/route.ts
import { NextResponse } from 'next/server';
import { getCoverletter } from '@/db';

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

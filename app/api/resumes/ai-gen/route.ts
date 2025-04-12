import { NextResponse } from 'next/server';
import { getResume } from '@/db';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');

  if (!userId) {
    return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
  }

  const resumes = await getResume(Number(userId));

  const aiGeneratedResumes = resumes.filter(r => r.aiGenerated).map(r => {
    return {
      id: r.id,
      jobTitle: r.jobTitle,
      createdAt: r.created_at,
    }
  });

  return NextResponse.json(aiGeneratedResumes);
}

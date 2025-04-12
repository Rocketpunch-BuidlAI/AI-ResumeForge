import { NextResponse } from 'next/server';
import { getResume, getUserIPs, getRoyaltiesByIpIds } from '@/db';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');

  if (!userId) {
    return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
  }

  const resume = await getResume(Number(userId));

  const uploadedResumeCount = resume.filter(r => !r.aiGenerated).length;
  const aiGeneratedResumeCount = resume.filter(r => r.aiGenerated).length;

  // 사용자의 IP 목록 조회
  const userIPs = await getUserIPs(Number(userId));
    
  // IP ID 목록 추출
  const ipIds = userIPs.map(ip => ip.id);

  // 모든 IP에 대한 로열티 정보를 한 번에 조회
  const royalties = await getRoyaltiesByIpIds(ipIds);

  const recentRewards = royalties
    .sort((a, b) => {
      const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
      const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
      return dateB - dateA;
    })
    .slice(0, 3)
    .map(r => ({
      amount: r.amount,
      createdAt: r.created_at || new Date().toISOString(),
    }));

  return NextResponse.json({ 
    uploadedResumeCount,
    aiGeneratedResumeCount,
    recentRewards
  });
}

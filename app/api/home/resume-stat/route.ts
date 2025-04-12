import { NextResponse } from 'next/server';
import { getResume, getUserIPs, getRoyaltiesByIpIds } from '@/db';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');

  if (!userId) {
    return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
  }

  const resume = await getResume(Number(userId));

  const uploadedResumeCount = resume.filter((r) => !r.aiGenerated).length;
  const aiGeneratedResumeCount = resume.filter((r) => r.aiGenerated).length;

  // Get user's IP list
  const userIPs = await getUserIPs(Number(userId));

  // Extract IP IDs
  const ipIds = userIPs.map((ip) => ip.id);

  // Get all royalty information for IPs at once
  const royalties = await getRoyaltiesByIpIds(ipIds);

  const recentRewards = royalties
    .sort((a, b) => {
      const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
      const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
      return dateB - dateA;
    })
    .slice(0, 3)
    .map((r) => ({
      amount: Number(r.amount) * 0.001,
      createdAt: r.created_at ? new Date(r.created_at).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
    }));

  return NextResponse.json({
    uploadedResumeCount,
    aiGeneratedResumeCount,
    recentRewards,
  });
}

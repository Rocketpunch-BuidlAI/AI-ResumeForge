import { NextResponse } from 'next/server';
import { getUserIPs, getRoyaltiesByIpIds } from '@/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // 사용자의 IP 목록 조회
    const userIPs = await getUserIPs(Number(userId));
    
    // IP ID 목록 추출
    const ipIds = userIPs.map(ip => ip.id);

    // 모든 IP에 대한 로열티 정보를 한 번에 조회
    const royalties = await getRoyaltiesByIpIds(ipIds);

    // 최근 5개의 로열티 정보만 선택하고 날짜순으로 정렬
    const recentRoyalties = royalties
      .sort((a, b) => (b.created_at ? new Date(b.created_at).getTime() : 0) - (a.created_at ? new Date(a.created_at).getTime() : 0))
      .slice(0, 5)
      .map(royalty => ({
        id: royalty.id,
        amount: Number(royalty.amount) * 0.001, // Convert to WIP
        date: royalty.created_at ? new Date(royalty.created_at).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        }) : 'N/A',
        txHash: royalty.txHash
      }));

    return NextResponse.json(recentRoyalties);
  } catch (error) {
    console.error('[RECENT_ROYALTIES_GET]', error);
    return new NextResponse("Internal Error", { status: 500 });
  }
} 
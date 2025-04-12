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

    // 일자별 로열티 데이터 생성
    const dailyRoyalties = royalties.reduce((acc, royalty) => {
      const date = royalty.created_at ? new Date(royalty.created_at).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
      
      if (!acc[date]) {
        acc[date] = {
          date,
          total_amount: 0,
          count: 0,
          royalties: []
        };
      }
      
      acc[date].total_amount += Number(royalty.amount);
      acc[date].count += 1;
      acc[date].royalties.push(royalty);
      
      return acc;
    }, {} as Record<string, { date: string; total_amount: number; count: number; royalties: typeof royalties }>);

    type DailyRoyalty = {
      date: string;
      total_amount: number;
      count: number;
    };

    // 날짜순으로 정렬
    const sortedDailyRoyalties = (Object.values(dailyRoyalties) as DailyRoyalty[]).sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    // 오늘로부터 3일 이전 날짜 계산
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
    const threeDaysAgoStr = threeDaysAgo.toISOString().split('T')[0];

    // 3일 이전 날짜까지만 필터링
    const filteredDailyRoyalties = sortedDailyRoyalties.filter(daily => 
      daily.date >= threeDaysAgoStr
    );

    // 누락된 날짜 추가
    const dates = [];
    const currentDate = new Date(threeDaysAgo);
    
    while (currentDate <= new Date()) {
      dates.push(currentDate.toISOString().split('T')[0]);
      currentDate.setDate(currentDate.getDate() + 1);
    }

    // 모든 날짜에 대해 데이터가 있는지 확인하고 없는 경우 0으로 추가
    const completeDailyRoyalties = dates.map(date => {
      const existingData = filteredDailyRoyalties.find(daily => daily.date === date);
      if (existingData) {
        return existingData;
      }
      return {
        date,
        total_amount: 0,
        count: 0,
      };
    });

    const totalRewards = completeDailyRoyalties.reduce((acc, daily) => acc + daily.total_amount, 0);

    // 마지막 날과 그 전날의 보상 차이 계산
    let rewardChangePercent = 0;
    if (completeDailyRoyalties.length >= 2) {
      const lastDay = completeDailyRoyalties[completeDailyRoyalties.length - 1];
      const previousDay = completeDailyRoyalties[completeDailyRoyalties.length - 2];
      
      if (previousDay.total_amount > 0) {
        rewardChangePercent = ((lastDay.total_amount - previousDay.total_amount) / previousDay.total_amount) * 100;
      }
    }

    return NextResponse.json({
      totalRewards: totalRewards,
      dailyRoyalties: completeDailyRoyalties,
      rewardChangePercent: Number(rewardChangePercent.toFixed(2))
    });
  } catch (error) {
    console.error('[REWARDS_GET]', error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

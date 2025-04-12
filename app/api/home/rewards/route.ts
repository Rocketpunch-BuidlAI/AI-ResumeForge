import { NextResponse } from 'next/server';
import { getUserIPs, getRoyaltiesByIpIds } from '@/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    // Get user's IP list
    const userIPs = await getUserIPs(Number(userId));

    // Extract IP IDs
    const ipIds = userIPs.map((ip) => ip.id);

    // Get all royalty information for IPs at once
    const royalties = await getRoyaltiesByIpIds(ipIds);

    // Create daily royalty data
    const dailyRoyalties = royalties.reduce(
      (acc, royalty) => {
        const date = royalty.created_at
          ? new Date(royalty.created_at).toISOString().split('T')[0]
          : new Date().toISOString().split('T')[0];

        if (!acc[date]) {
          acc[date] = {
            date,
            total_amount: 0,
            count: 0,
            royalties: [],
          };
        }

        acc[date].total_amount += Number(royalty.amount) * 0.001;
        acc[date].count += 1;
        acc[date].royalties.push(royalty);

        return acc;
      },
      {} as Record<
        string,
        { date: string; total_amount: number; count: number; royalties: typeof royalties }
      >
    );

    type DailyRoyalty = {
      date: string;
      total_amount: number;
      count: number;
    };

    // Sort by date
    const sortedDailyRoyalties = (Object.values(dailyRoyalties) as DailyRoyalty[]).sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    // Calculate date from 3 days ago
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
    const threeDaysAgoStr = threeDaysAgo.toISOString().split('T')[0];

    // Filter until 3 days ago
    const filteredDailyRoyalties = sortedDailyRoyalties.filter(
      (daily) => daily.date >= threeDaysAgoStr
    );

    // Add missing dates
    const dates = [];
    const currentDate = new Date(threeDaysAgo);

    while (currentDate <= new Date()) {
      dates.push(currentDate.toISOString().split('T')[0]);
      currentDate.setDate(currentDate.getDate() + 1);
    }

    // Check if data exists for all dates and add 0 for missing dates
    const completeDailyRoyalties = dates.map((date) => {
      const existingData = filteredDailyRoyalties.find((daily) => daily.date === date);
      if (existingData) {
        return existingData;
      }
      return {
        date,
        total_amount: 0,
        count: 0,
      };
    });

    const totalRewards = parseFloat(
      completeDailyRoyalties.reduce((acc, daily) => acc + daily.total_amount, 0).toFixed(3)
    );

    // Calculate the difference between the last day and the previous day's rewards
    let rewardChangePercent = 0;
    if (completeDailyRoyalties.length >= 2) {
      const lastDay = completeDailyRoyalties[completeDailyRoyalties.length - 1];
      const previousDay = completeDailyRoyalties[completeDailyRoyalties.length - 2];

      if (previousDay.total_amount === 0) {
        // When previous day is 0, show the actual increase amount
        rewardChangePercent = lastDay.total_amount * 100;
      } else {
        rewardChangePercent =
          ((lastDay.total_amount - previousDay.total_amount) / previousDay.total_amount) * 100;
      }
    }

    console.log('completeDailyRoyalties', completeDailyRoyalties);

    return NextResponse.json({
      totalRewards: totalRewards,
      dailyRoyalties: completeDailyRoyalties,
      rewardChangePercent: Number(rewardChangePercent.toFixed(2)),
    });
  } catch (error) {
    console.error('[REWARDS_GET]', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
}

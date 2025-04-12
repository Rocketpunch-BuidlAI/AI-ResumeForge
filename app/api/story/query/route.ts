import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { type, value } = await request.json();

    if (!type || !value) {
      return NextResponse.json({ error: '검색 유형과 값이 필요합니다' }, { status: 400 });
    }

    if (type === 'ipId') {
      try {
        // Story Protocol SDK 사용하여 정보 반환
        // 상세 정보를 얻기 힘들므로 기본 정보만 반환
        return NextResponse.json({
          ipId: value,
          message: `IP ID ${value}에 대한 정보는 Story Protocol 서버에서 직접 확인할 수 있습니다.`,
          verificationLinks: [
            {
              name: 'Story Protocol 웹사이트',
              url: 'https://story.xyz',
            },
            {
              name: 'Story Protocol Docs',
              url: 'https://docs.story.xyz',
            },
          ],
        });
      } catch (ipError) {
        console.error('Error getting IP info:', ipError);
        return NextResponse.json(
          { error: '해당 IP ID에 대한 정보를 찾을 수 없습니다' },
          { status: 404 }
        );
      }
    } else if (type === 'txHash') {
      // 트랜잭션 해시 처리
      return NextResponse.json({
        txHash: value,
        message: `트랜잭션 해시 ${value}에 대한 정보는 Story Protocol 서버에서 직접 확인할 수 있습니다.`,
        verificationLinks: [
          {
            name: 'Story Protocol 웹사이트',
            url: 'https://story.xyz',
          },
          {
            name: 'Story Protocol Docs',
            url: 'https://docs.story.xyz',
          },
        ],
      });
    } else {
      return NextResponse.json({ error: '지원하지 않는 검색 유형입니다' }, { status: 400 });
    }
  } catch (error) {
    console.error('Error querying IP asset:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '정보 조회 중 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}

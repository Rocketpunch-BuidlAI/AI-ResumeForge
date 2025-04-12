import { NextResponse } from 'next/server';
import { getWalletAddressByEmail } from '@/utils/privy';
import { client } from '@/utils/config';

export async function POST(request: Request) {
  try {
    const { email, tokenId, licenseTokenIds, cid } = await request.json();

    if (!email || !tokenId || !licenseTokenIds || !cid) {
      return NextResponse.json(
        { error: '필수 파라미터가 누락되었습니다.' },
        { status: 400 }
      );
    }

    // 이메일로 지갑 주소 가져오기
    const walletAddress = await getWalletAddressByEmail(email);
    if (!walletAddress) {
      return NextResponse.json(
        { error: '지갑 주소를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // 라이센스 토큰 ID 배열로 변환
    const licenseTokenIdsArray = licenseTokenIds.split(',').map((id: string) => id.trim());

    // 파생 IP 자산 등록
    const response = await client.ipAsset.registerIpAndMakeDerivativeWithLicenseTokens({
      nftContract: walletAddress as `0x${string}`,
      tokenId: tokenId,
      licenseTokenIds: licenseTokenIdsArray,
      ipMetadata: {
        ipMetadataURI: cid,
      },
      maxRts: 100000000,
      txOptions: { waitForTransaction: true },
    });

    return NextResponse.json({
      txHash: response.txHash,
      ipId: response.ipId,
    });
  } catch (error) {
    console.error('파생 IP 자산 등록 중 오류 발생:', error);
    return NextResponse.json(
      { error: '파생 IP 자산 등록에 실패했습니다.' + error },
      { status: 500 }
    );
  }
} 
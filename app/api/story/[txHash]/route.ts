import { NextResponse } from 'next/server';
import { http, createPublicClient, decodeEventLog, parseAbiItem } from 'viem';
import { aeneid } from '@story-protocol/core-sdk';
import { getTxInfo } from '../route';

// Aeneid 네트워크를 위한 Public Client 생성
const publicClient = createPublicClient({
  chain: aeneid,
  transport: http(process.env.RPC_PROVIDER_URL),
});

// IP Asset 등록 이벤트 ABI
const ipAssetRegisteredAbi = parseAbiItem(
  'event IPAssetRegistered(address indexed nftContract, uint256 indexed tokenId, address indexed ipId)'
);

// License Terms 등록 이벤트 ABI
const licenseTermsLinkedAbi = parseAbiItem(
  'event LicenseTermsLinked(address indexed ipId, uint256 licenseTermsId)'
);

export async function GET(request: Request, { params }: { params: { txHash: string } }) {
  try {
    const txHash = (await params).txHash;

    if (!txHash) {
      return NextResponse.json({ error: 'Transaction hash is required' }, { status: 400 });
    }

    // viem을 사용하여 트랜잭션 영수증 조회
    const receipt = await publicClient.getTransactionReceipt({
      hash: txHash as `0x${string}`,
    });

    if (!receipt) {
      // 트랜잭션이 아직 처리되지 않음
      return NextResponse.json({
        status: 'pending',
        message: '트랜잭션이 아직 처리 중입니다. 잠시 후 다시 시도해 주세요.',
      });
    }

    // 트랜잭션 성공 여부 확인 (viem에서 status는 0 또는 1)
    if (Number(receipt.status) === 1) {
      // 1 = success, 0 = failure
      // 1. 먼저 메모리에 저장된 정보가 있는지 확인
      const storedInfo = getTxInfo(txHash);

      if (
        storedInfo &&
        (storedInfo.ipId || storedInfo.tokenId || storedInfo.licenseTermsIds?.length)
      ) {
        // 저장된 정보가 있으면 바로 반환
        return NextResponse.json({
          status: 'success',
          txHash: txHash,
          blockNumber: receipt.blockNumber.toString(),
          ipId: storedInfo.ipId,
          tokenId: storedInfo.tokenId,
          licenseTermsIds: storedInfo.licenseTermsIds,
          message: 'IP 자산이 성공적으로 등록되었습니다.',
        });
      }

      // 2. 저장된 정보가 없으면 트랜잭션 로그에서 추출 시도
      let ipId = '';
      let tokenId = '';
      const licenseTermsIds: string[] = [];

      // 각 로그를 순회하면서 필요한 이벤트 데이터 추출
      for (const log of receipt.logs) {
        try {
          // IP Asset 등록 이벤트 확인
          const ipAssetEvent = decodeEventLog({
            abi: [ipAssetRegisteredAbi],
            data: log.data,
            topics: log.topics,
          });

          if (ipAssetEvent.eventName === 'IPAssetRegistered') {
            ipId = ipAssetEvent.args.ipId;
            tokenId = ipAssetEvent.args.tokenId.toString();
          }

          // License Terms 연결 이벤트 확인
          const licenseTermsEvent = decodeEventLog({
            abi: [licenseTermsLinkedAbi],
            data: log.data,
            topics: log.topics,
          });

          if (licenseTermsEvent.eventName === 'LicenseTermsLinked') {
            licenseTermsIds.push(licenseTermsEvent.args.licenseTermsId.toString());
          }
        } catch {
          // 이벤트 디코딩 실패는 무시 (다른 이벤트일 수 있음)
          continue;
        }
      }

      // 추출한 정보를 사용하지만, 이벤트에서 추출하지 못한 경우 추가 정보 없이 응답
      // Story Protocol SDK는 현재 트랜잭션 해시로 직접 조회하는 기능을 제공하지 않음

      return NextResponse.json({
        status: 'success',
        txHash: txHash,
        blockNumber: receipt.blockNumber.toString(),
        ipId: ipId,
        tokenId: tokenId,
        licenseTermsIds: licenseTermsIds,
        message: 'IP 자산이 성공적으로 등록되었습니다.',
      });
    } else {
      // 트랜잭션 실패
      return NextResponse.json(
        {
          status: 'failed',
          txHash: txHash,
          message: '트랜잭션이 실패했습니다.',
        },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Error getting transaction:', error instanceof Error ? error.message : error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to get transaction details' },
      { status: 500 }
    );
  }
}

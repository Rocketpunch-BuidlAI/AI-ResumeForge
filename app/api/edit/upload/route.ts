import { NextResponse } from 'next/server';
import {
  getIpAssetByCid,
  getIpAssetByIpId,
  saveCoverletter,
  saveCoverletterWithReferences,
  saveIpAsset,
  saveIpReference,
  saveRoyalty,
} from '@/db';
import { AI_AGENT_URL, client, publicClient, stroyAccount, walletClient } from '@/utils/config';
import { put } from '@vercel/blob';
import axios from 'axios';
import { WIP_TOKEN_ADDRESS } from '@story-protocol/core-sdk';
import { zeroAddress } from 'viem';
import { defaultNftContractAbi } from '@/utils/defaultNftContractAbi';
import { creativeCommonsAttribution } from '@/utils/terms';
import { v4 as uuidv4 } from 'uuid';
import { taskStatusMap } from './taskStatus';

export const maxDuration = 300;
export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const pdf = formData.get('pdf') as File;
    const text = formData.get('text') as string;
    const walletAddress = formData.get('walletAddress') as string;
    const userId = formData.get('userId') as string;
    const referencesJson = formData.get('references') as string;
    const metadata = formData.get('metadata') as string;

    if (!pdf || !text || !walletAddress || !userId || !referencesJson || !metadata) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // 작업 ID 생성
    const taskId = uuidv4();
    
    // 작업 상태 초기화
    taskStatusMap.set(taskId, {
      status: 'pending',
      step: '요청 처리 시작',
      progress: 5
    });

    // 비동기 처리 시작 - 응답은 즉시 반환
    processUpload(taskId, pdf, text, walletAddress, userId, referencesJson, metadata).catch(error => {
      console.error('Processing error:', error);
      taskStatusMap.set(taskId, {
        status: 'failed',
        step: '처리 중 오류 발생',
        progress: 0,
        error: error.message || '알 수 없는 오류가 발생했습니다'
      });
    });

    // 작업 ID 반환
    return NextResponse.json({ 
      success: true, 
      taskId,
      message: '작업이 시작되었습니다. 상태를 확인하려면 작업 ID를 사용하세요.'
    });

  } catch (error) {
    console.error('Error initializing upload:', error);
    return NextResponse.json(
      { error: 'Failed to initialize upload process' },
      { status: 500 }
    );
  }
}

// 비동기 처리 함수
async function processUpload(
  taskId: string,
  pdf: File,
  text: string,
  walletAddress: string,
  userId: string,
  referencesJson: string,
  metadata: string
) {
  try {
    // 상태 업데이트: 참조 분석 시작
    taskStatusMap.set(taskId, {
      status: 'processing',
      step: '참조 문서 분석 중...',
      progress: 10
    });

    // references JSON 파싱
    const references = JSON.parse(referencesJson);

    // contributions 값이 높은 상위 3개만 선택
    const topReferences = references
      .sort(
        (a: { contributions: number }, b: { contributions: number }) =>
          b.contributions - a.contributions
      )
      .slice(0, 3);

    // 상태 업데이트: 파일 업로드 시작
    taskStatusMap.set(taskId, {
      status: 'processing',
      step: '파일 스토리지에 업로드 중...',
      progress: 20
    });

    console.log('Uploading file to blob storage...', pdf, pdf.name);
    const blob = await put(pdf.name, pdf, {
      access: 'public',
      allowOverwrite: true,
    });

    // CID와 파일 경로 추출
    const cid = blob.url.split('/').pop() ?? blob.url;
    const filePath = blob.url;

    // 상태 업데이트: 데이터베이스 저장 시작
    taskStatusMap.set(taskId, {
      status: 'processing',
      step: '데이터베이스에 문서 정보 저장 중...',
      progress: 30
    });

    // 데이터베이스에 Coverletter 정보 저장
    const savedCoverletterId = await saveCoverletter(Number(userId), cid, filePath, metadata, true);

    const metadataObj = JSON.parse(metadata);

    // 상태 업데이트: AI 에이전트 전송 중
    taskStatusMap.set(taskId, {
      status: 'processing',
      step: 'AI 분석 서비스로 문서 전송 중...',
      progress: 40
    });

    console.log('Uploading to AI agent:', AI_AGENT_URL, {
      text: text,
      id: savedCoverletterId,
      role: metadataObj.role,
      experience: metadataObj.experience,
    });

    const response = await axios.post(`${AI_AGENT_URL}/upload`, {
      text: text,
      id: String(savedCoverletterId),
      role: metadataObj.role,
      experience: metadataObj.experience,
    });

    console.log('response', response);

    const aiAgentResponse = response.data;
    console.log('AI agent response:', aiAgentResponse);

    if (aiAgentResponse.status !== 'success') {
      console.error('AI agent returned error:', aiAgentResponse);
      taskStatusMap.set(taskId, {
        status: 'failed',
        step: 'AI 에이전트 처리 실패',
        progress: 0,
        error: aiAgentResponse.message || 'AI 에이전트 오류'
      });
      return;
    }

    // 상태 업데이트: 참조 정보 저장 중
    taskStatusMap.set(taskId, {
      status: 'processing',
      step: '참조 정보 및 이력서 텍스트 저장 중...',
      progress: 50
    });

    // 이력서 텍스트와 참조 정보 저장
    await saveCoverletterWithReferences(savedCoverletterId, text, topReferences);

    // 상태 업데이트: IP 에셋 정보 수집 중
    taskStatusMap.set(taskId, {
      status: 'processing',
      step: 'IP 에셋 정보 수집 중...',
      progress: 60
    });

    // Get all IP asset information for references
    const ipAssets = [];
    for (const ref of topReferences) {
      const ipAsset = await getIpAssetByCid(ref.id);
      if (!ipAsset || !ipAsset[0]) {
        console.error(`IP asset not found for ID: ${ref.id}`);
        continue;
      }
      ipAssets.push({
        ...ipAsset[0],
        contribution: ref.contributions,
      });
    }

    // 상태 업데이트: 라이센스 토큰 발행 중
    taskStatusMap.set(taskId, {
      status: 'processing',
      step: '라이센스 토큰 발행 중...',
      progress: 70
    });

    // Mint license tokens for each IP asset
    const licenseTokenIds = [];
    for (const ipAsset of ipAssets) {
      const response = await client.license.mintLicenseTokens({
        licenseTermsId: ipAsset.licenseTermId,
        licensorIpId: ipAsset.ipId as `0x${string}`,
        amount: 1,
        maxMintingFee: 0,
        maxRevenueShare: 100, // default
        txOptions: { waitForTransaction: true },
      });

      console.log('License minted:', {
        'Transaction Hash': response.txHash,
        'License Token IDs': response.licenseTokenIds,
      });

      // 상태 업데이트: 토큰 승인 중
      taskStatusMap.set(taskId, {
        status: 'processing',
        step: '토큰 승인 처리 중...',
        progress: 75
      });

      // Approve license token
      const { request: approveRequest } = await publicClient.simulateContract({
        address: '0xFe3838BFb30B34170F00030B52eA4893d8aAC6bC',
        abi: defaultNftContractAbi,
        functionName: 'approve',
        args: [
          '0x9e2d496f72C547C2C535B167e06ED8729B374a4f', // contract
          response.licenseTokenIds![0], // tokenId
        ],
        account: stroyAccount,
      });

      // Execute approval transaction
      const hash2 = await walletClient.writeContract({ ...approveRequest, account: stroyAccount });

      // Wait for approval transaction
      const receipt2 = await publicClient.waitForTransactionReceipt({
        hash: hash2,
      });

      console.log('Total license token limit set:', {
        Receipt: receipt2,
      });

      licenseTokenIds.push(response.licenseTokenIds![0]);
    }

    // 상태 업데이트: 파생 IP 에셋 등록 중
    taskStatusMap.set(taskId, {
      status: 'processing',
      step: '파생 IP 에셋 등록 중...',
      progress: 80
    });

    // if there are license token IDs, register derivative IP asset with all license tokens
    if (licenseTokenIds.length > 0) {
      // Register derivative IP asset with all license tokens
      const child = await client.ipAsset.mintAndRegisterIpAndMakeDerivativeWithLicenseTokens({
        spgNftContract: process.env.STORY_SPG_NFT_CONTRACT as `0x${string}`,
        licenseTokenIds: licenseTokenIds,
        ipMetadata: {
          ipMetadataURI: savedCoverletterId.toString(),
        },
        maxRts: 100_000_000,
        txOptions: { waitForTransaction: true },
        recipient: walletAddress as `0x${string}`,
      });

      // 상태 업데이트: IP 에셋 저장 중
      taskStatusMap.set(taskId, {
        status: 'processing',
        step: 'IP 에셋 정보 데이터베이스에 저장 중...',
        progress: 85
      });

      // Save IP asset to database
      const savedIpAsset = await saveIpAsset(
        Number(userId),
        Number(child.tokenId),
        Number(ipAssets[0].licenseTermId),
        savedCoverletterId.toString(),
        child.ipId || '',
        child.txHash || ''
      );

      // 상태 업데이트: IP 참조 정보 저장 중
      taskStatusMap.set(taskId, {
        status: 'processing',
        step: 'IP 참조 정보 저장 중...',
        progress: 90
      });

      // Save IP references to database
      for (const ipAsset of ipAssets) {
        if (savedIpAsset && savedIpAsset.length > 0) {
          // Get parent IP asset ID from database
          const parentIpAsset = await getIpAssetByIpId(ipAsset.ipId);
          if (parentIpAsset && parentIpAsset.length > 0) {
            await saveIpReference(savedIpAsset[0].id, parentIpAsset[0].id);
          }
        }
      }

      // 상태 업데이트: 로열티 처리 중
      taskStatusMap.set(taskId, {
        status: 'processing',
        step: '로열티 지급 처리 중...',
        progress: 95
      });

      // Process royalties for each IP asset
      for (const ipAsset of ipAssets) {
        const payRoyalty = await client.royalty.payRoyaltyOnBehalf({
          receiverIpId: ipAsset.ipId as `0x${string}`,
          payerIpId: zeroAddress,
          token: WIP_TOKEN_ADDRESS,
          amount: ipAsset.contribution * 1000000000000000,
          txOptions: { waitForTransaction: true },
        });

        console.log('Paid royalty:', {
          'Transaction Hash': payRoyalty.txHash,
        });

        const parentClaimRevenue = await client.royalty.claimAllRevenue({
          ancestorIpId: ipAsset.ipId as `0x${string}`,
          claimer: ipAsset.ipId as `0x${string}`,
          childIpIds: [],
          royaltyPolicies: ['0xBe54FB168b3c982b7AaE60dB6CF75Bd8447b390E'],
          currencyTokens: [WIP_TOKEN_ADDRESS],
        });

        console.log('Parent claimed revenue receipt:', parentClaimRevenue);

        const parentIpAsset = await getIpAssetByIpId(ipAsset.ipId);
        // Save royalty information
        await saveRoyalty(
          parentIpAsset[0].id,
          savedIpAsset[0].id,
          Number(ipAsset.contribution),
          payRoyalty.txHash || '',
          parentClaimRevenue.txHashes[0] || ''
        );
      }
    } else {
      // 상태 업데이트: PIL 조건으로 IP 에셋 등록 중
      taskStatusMap.set(taskId, {
        status: 'processing',
        step: 'PIL 조건으로 IP 에셋 등록 중...',
        progress: 90
      });

      const response = await client.ipAsset.mintAndRegisterIpAssetWithPilTerms({
        spgNftContract: process.env.STORY_SPG_NFT_CONTRACT as `0x${string}`,
        ipMetadata: {
          ipMetadataURI: savedCoverletterId.toString(),
        },
        recipient: walletAddress as `0x${string}`,
        licenseTermsData: [
          {
            terms: creativeCommonsAttribution.terms,
          },
        ],
        allowDuplicates: true,
        txOptions: {
          waitForTransaction: true,
        },
      });

      // 라이선스와 함께 등록된 경우 licenseTermId 저장
      await saveIpAsset(
        Number(userId),
        Number(response.tokenId),
        response.licenseTermsIds && response.licenseTermsIds.length > 0
          ? Number(response.licenseTermsIds[0])
          : 0,
        savedCoverletterId.toString(),
        response.ipId || '',
        response.txHash || ''
      );
    }

    // 상태 업데이트: 완료
    taskStatusMap.set(taskId, {
      status: 'completed',
      step: '모든 작업이 성공적으로 완료되었습니다!',
      progress: 100
    });

  } catch (error) {
    console.error('Error processing upload:', error);
    taskStatusMap.set(taskId, {
      status: 'failed',
      step: '처리 중 오류 발생',
      progress: 0,
      error: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다'
    });
  }
}

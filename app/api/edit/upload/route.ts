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

    // Initialize task status
    taskStatusMap.set(taskId, {
      status: 'pending',
      step: 'Starting request processing',
      progress: 5,
    });

    // Start asynchronous processing - return response immediately
    processUpload(taskId, pdf, text, walletAddress, userId, referencesJson, metadata).catch(
      (error) => {
        console.error('Processing error:', error);
        taskStatusMap.set(taskId, {
          status: 'failed',
          step: 'Error occurred during processing',
          progress: 0,
          error: error.message || 'An unknown error occurred',
        });
      }
    );

    // Return task ID
    return NextResponse.json({
      success: true,
      taskId,
      message: 'Task has started. Please use the task ID to check the status.',
    });
  } catch (error) {
    console.error('Error initializing upload:', error);
    return NextResponse.json({ error: 'Failed to initialize upload process' }, { status: 500 });
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
    // Update status: Starting reference analysis
    taskStatusMap.set(taskId, {
      status: 'processing',
      step: 'Analyzing reference documents...',
      progress: 10,
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

    // Update status: Starting file upload
    taskStatusMap.set(taskId, {
      status: 'processing',
      step: 'Uploading to file storage...',
      progress: 20,
    });

    console.log('Uploading file to blob storage...', pdf, pdf.name);
    const blob = await put(pdf.name, pdf, {
      access: 'public',
      allowOverwrite: true,
    });

    // CID와 파일 경로 추출
    const cid = blob.url.split('/').pop() ?? blob.url;
    const filePath = blob.url;

    // Update status: Starting database storage
    taskStatusMap.set(taskId, {
      status: 'processing',
      step: 'Saving document information to database...',
      progress: 30,
    });

    // 데이터베이스에 Coverletter 정보 저장
    const savedCoverletterId = await saveCoverletter(Number(userId), cid, filePath, metadata, true);

    const metadataObj = JSON.parse(metadata);

    // Update status: Sending to AI agent
    taskStatusMap.set(taskId, {
      status: 'processing',
      step: 'Sending document to AI analysis service...',
      progress: 40,
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
        step: 'AI agent processing failed',
        progress: 0,
        error: aiAgentResponse.message || 'AI agent error',
      });
      return;
    }

    // Update status: Saving reference information
    taskStatusMap.set(taskId, {
      status: 'processing',
      step: 'Saving reference information and resume text...',
      progress: 50,
    });

    // 이력서 텍스트와 참조 정보 저장
    await saveCoverletterWithReferences(savedCoverletterId, text, topReferences);

    // Update status: Collecting IP asset information
    taskStatusMap.set(taskId, {
      status: 'processing',
      step: 'Collecting IP asset information...',
      progress: 60,
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

    // Update status: Minting license tokens
    taskStatusMap.set(taskId, {
      status: 'processing',
      step: 'Minting license tokens...',
      progress: 70,
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

      // Update status: Processing token approval
      taskStatusMap.set(taskId, {
        status: 'processing',
        step: 'Processing token approval...',
        progress: 75,
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

    // Update status: Registering derivative IP asset
    taskStatusMap.set(taskId, {
      status: 'processing',
      step: 'Registering derivative IP asset...',
      progress: 80,
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

      // Update status: Saving IP asset
      taskStatusMap.set(taskId, {
        status: 'processing',
        step: 'Saving IP asset information ...',
        progress: 85,
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

      // Update status: Saving IP reference information
      taskStatusMap.set(taskId, {
        status: 'processing',
        step: 'Saving IP reference information...',
        progress: 90,
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

      // Update status: Processing royalties
      taskStatusMap.set(taskId, {
        status: 'processing',
        step: 'Processing royalty payments...',
        progress: 95,
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
      // Update status: Registering IP asset with PIL terms
      taskStatusMap.set(taskId, {
        status: 'processing',
        step: 'Registering IP asset with PIL terms...',
        progress: 90,
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

    // Update status: Completed
    taskStatusMap.set(taskId, {
      status: 'completed',
      step: 'All tasks completed successfully!',
      progress: 100,
    });
  } catch (error) {
    console.error('Error processing upload:', error);
    taskStatusMap.set(taskId, {
      status: 'failed',
      step: 'Error occurred during processing',
      progress: 0,
      error: error instanceof Error ? error.message : 'An unknown error occurred',
    });
  }
}

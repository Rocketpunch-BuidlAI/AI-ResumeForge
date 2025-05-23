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

    // 파일 업로드
    console.log('Uploading file to blob storage...', pdf, pdf.name);
    let blob;
    try {
      blob = await put(pdf.name, pdf, {
        access: 'public',
        allowOverwrite: true,
      });
    } catch (error: any) {
      console.error('Blob storage upload error:', error);
      throw new Error(`Failed to upload file: ${error.message || 'Unknown upload error'}`);
    }

    // CID와 파일 경로 추출
    const cid = blob.url.split('/').pop() ?? blob.url;
    const filePath = blob.url;

    // 데이터베이스에 Coverletter 정보 저장
    let savedCoverletterId;
    try {
      savedCoverletterId = await saveCoverletter(Number(userId), cid, filePath, metadata, true);
    } catch (error: any) {
      console.error('Database save error:', error);
      if (error.code === 'CONNECTION_CLOSED' || error.errno === 'CONNECTION_CLOSED') {
        console.error('Database connection closed unexpectedly:', {
          code: error.code,
          errno: error.errno,
          address: error.address,
          port: error.port
        });
      }
      throw new Error(`Database operation failed: ${error.message || 'Unknown database error'}`);
    }

    const metadataObj = JSON.parse(metadata);

    // AI 에이전트로 전송
    console.log('Uploading to AI agent:', AI_AGENT_URL, {
      text: text,
      id: savedCoverletterId,
      role: metadataObj.role,
      experience: metadataObj.experience,
    });

    let response;
    try {
      response = await axios.post(`${AI_AGENT_URL}/upload`, {
        text: text,
        id: String(savedCoverletterId),
        role: metadataObj.role,
        experience: metadataObj.experience,
      });
    } catch (error: any) {
      console.error('AI agent API error:', error);
      throw new Error(`AI agent request failed: ${error.message || 'Unknown API error'}`);
    }

    console.log('response', response);

    const aiAgentResponse = response.data;
    console.log('AI agent response:', aiAgentResponse);

    if (aiAgentResponse.status !== 'success') {
      console.error('AI agent returned error:', aiAgentResponse);
      throw new Error(aiAgentResponse.message || 'AI agent error');
    }

    // references JSON 파싱
    const references = JSON.parse(referencesJson);

    // contributions 값이 높은 상위 3개만 선택
    const topReferences = references
      .sort(
        (a: { contributions: number }, b: { contributions: number }) =>
          b.contributions - a.contributions
      )
      .slice(0, 3);

    // 이력서 텍스트와 참조 정보 저장
    try {
      await saveCoverletterWithReferences(savedCoverletterId, text, topReferences);
    } catch (error: any) {
      console.error('Save references error:', error);
      throw new Error(`Failed to save references: ${error.message || 'Unknown reference error'}`);
    }

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

      // Save IP asset to database
      const savedIpAsset = await saveIpAsset(
        Number(userId),
        Number(child.tokenId),
        Number(ipAssets[0].licenseTermId),
        savedCoverletterId.toString(),
        child.ipId || '',
        child.txHash || ''
      );

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
      // Register IP asset with PIL terms
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

      // Save IP asset with license terms
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

    return NextResponse.json({
      success: true,
      message: 'Upload completed successfully',
    });
  } catch (error: any) {
    console.error('Error processing upload:', error);
    if (error.code) {
      console.error('Error code:', error.code);
      console.error('Error errno:', error.errno);
    }
    if (error.stack) {
      console.error('Error stack:', error.stack);
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'An unknown error occurred' },
      { status: 500 }
    );
  }
}

// app/api/resumes/route.ts
import { NextResponse } from 'next/server';
import {
  getCoverletter,
  saveCoverletter,
  getLatestCoverletterByCidAndUserId,
  saveCoverletterText,
  type ResumeMetadata,
  saveIpAsset,
  getRoyaltiesByIpIds,
  getUserIPs,
} from '@/db';
import { put } from '@vercel/blob';
import axios from 'axios';
import { PdfManager } from '@/utils/PdfManager';
import { AI_AGENT_URL, client } from '@/utils/config';
import console from 'console';
import { creativeCommonsAttribution } from '@/utils/terms';

// Royalty 인터페이스 정의
interface Royalty {
  id: number;
  parentIpId: number;
  childIpId: number;
  amount: number | string | null;
  txHash: string;
  revenueReceipt: string | null;
  created_at?: Date | string | null;
  updated_at?: Date | string | null;
}

export async function GET(request: Request) {
  try {
    // Get query parameters from URL
    const url = new URL(request.url);
    const userId = url.searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // Get resumes from database for the user
    const resumes = await getCoverletter(Number(userId));
    
    // Get user's IP list
    const userIPs = await getUserIPs(Number(userId));

    // Extract IP ID list
    const ipIds = userIPs.map(ip => ip.id);

    // Get royalty information for all IPs at once
    const royalties = await getRoyaltiesByIpIds(ipIds);
    
    // IP ID를 키로 하고 royalty 리스트를 값으로 하는 Map 생성
    const ipRoyaltiesMap = new Map<number, Royalty[]>();
    
    // royalty 데이터를 IP ID 별로 분류하여 Map에 저장
    royalties.forEach(royalty => {
      const ipId = royalty.parentIpId;
      if (!ipRoyaltiesMap.has(ipId)) {
        ipRoyaltiesMap.set(ipId, []);
      }
      ipRoyaltiesMap.get(ipId)?.push(royalty);
    });
    
    // 각 IP ID별 rewardAmount와 referenceCount 계산
    const ipStatsMap = new Map<number, { rewardAmount: number, referenceCount: number }>();
    
    ipRoyaltiesMap.forEach((royalties, ipId) => {
      // rewardAmount: royalty 총합 계산 (amount * 0.001)
      const rewardAmount = royalties.reduce((sum, royalty) => sum + Number(royalty.amount) * 0.001, 0);
      
      // referenceCount: royalty 개수 계산
      const referenceCount = royalties.length;
      
      ipStatsMap.set(ipId, { rewardAmount, referenceCount });
    });
    
    // 이력서 데이터에 각 IP의 rewardAmount와 referenceCount 추가
    const decoratedResumes = resumes.map(resume => {
      // 이력서와 관련된 IP ID 찾기
      const relatedIPs = userIPs.filter(ip => ip.userId === resume.userId);
      const relatedIpIds = relatedIPs.map(ip => ip.id);
      
      // 관련 IP들의 rewardAmount와 referenceCount 합계 계산
      let totalRewardAmount = 0;
      let totalReferenceCount = 0;
      
      relatedIpIds.forEach(ipId => {
        const stats = ipStatsMap.get(ipId);
        if (stats) {
          totalRewardAmount += stats.rewardAmount;
          totalReferenceCount += stats.referenceCount;
        }
      });
      
      return {
        ...resume,
        referenceCount: totalReferenceCount,
        rewardAmount: totalRewardAmount
      };
    });

    // Compose response data
    return NextResponse.json({ resumes: decoratedResumes });
  } catch (error) {
    console.error('Error fetching resumes:', error);
    return NextResponse.json({ error: 'Failed to fetch resumes' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const userId = formData.get('userId') as string;
    const metadata = formData.get('metadata') as string;
    const walletAddress = formData.get('walletAddress') as string;
    console.log('Received upload request - userId:', userId);
    console.log('Received file:', file ? `${file.name} (${file.size} bytes)` : 'No file');
    console.log('metadata:', metadata);

    if (!file || !userId) {
      return NextResponse.json({ error: 'File and user ID are required.' }, { status: 400 });
    }

    console.log('Uploading file to blob storage...');
    const blob = await put(file.name, file, {
      access: 'public',
      allowOverwrite: true,
    });

    const cid = blob.url.split('/').pop() ?? blob.url;
    console.log('File uploaded to blob storage, cid:', cid);

    // Save to database with metadata
    console.log('Saving to database...');
    await saveCoverletter(Number(userId), cid, blob.url, metadata, false);

    const savedCoverletter = await getLatestCoverletterByCidAndUserId(Number(userId));
    console.log('Saved to database, coverletter id:', savedCoverletter?.id);

    if (!savedCoverletter) {
      return NextResponse.json({ error: 'Coverletter not found.' }, { status: 400 });
    }

    console.log('Extracting text from PDF...');
    // Convert File to ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();
    const pdfBytes = new Uint8Array(arrayBuffer);

    try {
      console.log('PdfManager.extractTextFromBytes', pdfBytes);
      const extractedText = await PdfManager.extractTextFromBytes(pdfBytes);
      console.log('Text extracted successfully', extractedText);

      console.log('Saving extracted text to database...');
      await saveCoverletterText(savedCoverletter.id, extractedText);
      console.log('Text saved to database successfully');

      // upload cover letter to pinecone
      console.log('Uploading to AI agent:', AI_AGENT_URL);
      const response = await axios.post(`${AI_AGENT_URL}/upload`, {
        text: extractedText,
        id: savedCoverletter.id.toString(),
        role: (savedCoverletter.metadata as ResumeMetadata).jobTitle,
        experience: (savedCoverletter.metadata as ResumeMetadata).yearsOfExperience,
      });

      const aiAgentResponse = response.data;
      console.log('AI agent response:', aiAgentResponse);

      if (aiAgentResponse.status !== 'success') {
        console.error('AI agent returned error:', aiAgentResponse);
        return NextResponse.json(
          { status: 'error', message: aiAgentResponse.message },
          { status: 400 }
        );
      }
    } catch (pdfError) {
      console.error('Error processing PDF:', pdfError);
      return NextResponse.json(
        {
          status: 'error',
          message:
            'Error processing PDF file: ' +
            (pdfError instanceof Error ? pdfError.message : String(pdfError)),
        },
        { status: 400 }
      );
    }

    // Return both CID and complete uploadResponse
    try {
      const response = await client.ipAsset.mintAndRegisterIpAssetWithPilTerms({
        spgNftContract: process.env.STORY_SPG_NFT_CONTRACT as `0x${string}`,
        ipMetadata: {
          ipMetadataURI: savedCoverletter.id.toString(),
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
        savedCoverletter.id.toString(),
        response.ipId || '',
        response.txHash || ''
      );
    } catch (error) {
      console.error('Error processing Story IP:', error);
      return NextResponse.json(
        {
          status: 'error',
          message:
            'Error processing Story IP : ' +
            (error instanceof Error ? error.message : String(error)),
        },
        { status: 400 }
      );
    }

    return NextResponse.json({ url: blob.url, cid });
  } catch (error) {
    console.error('Error uploading file:', error);
    // 자세한 오류 로깅
    if (error instanceof Error) {
      console.error('Error name:', error.name);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }

    return NextResponse.json(
      {
        status: 'error',
        message:
          'An error occurred while uploading the file: ' +
          (error instanceof Error ? error.message : String(error)),
      },
      { status: 500 }
    );
  }
}

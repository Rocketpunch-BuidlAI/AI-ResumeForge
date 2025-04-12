import { NextResponse } from 'next/server';
import { client } from '@/utils/config';
import { creativeCommonsAttribution } from '@/utils/terms';
import { saveIpAsset } from '@/db';

export async function POST(request: Request) {
  try {
    const { cid, walletAddress, userId, withoutLicense } = await request.json();

    if (!cid || !walletAddress || !userId) {
      return NextResponse.json(
        { error: 'CID, wallet address, and user ID are required' },
        { status: 400 }
      );
    }

    // Log each step for debugging
    console.log('Attempting to register IP with CID:', cid, 'for wallet:', walletAddress);

    try {
      const spgNftContract = process.env.STORY_SPG_NFT_CONTRACT;
      console.log('Using SPG contract:', spgNftContract);

      let response;
      if (withoutLicense) {
        // 라이선스 없이 IP 자산 등록
        response = await client.ipAsset.mintAndRegisterIp({
          spgNftContract: spgNftContract as `0x${string}`,
          ipMetadata: {
            ipMetadataURI: cid,
          },
          recipient: walletAddress as `0x${string}`,
          allowDuplicates: true,
          txOptions: {
            waitForTransaction: true,
          },
        });

        // 라이선스 없이 등록된 경우 licenseTermId는 0으로 저장
        await saveIpAsset(
          userId,
          Number(response.tokenId),
          0,
          cid,
          response.ipId || '',
          response.txHash || ''
        );
      } else {
        // 라이선스와 함께 IP 자산 등록
        response = await client.ipAsset.mintAndRegisterIpAssetWithPilTerms({
          spgNftContract: spgNftContract as `0x${string}`,
          ipMetadata: {
            ipMetadataURI: cid,
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
          userId,
          Number(response.tokenId),
          response.licenseTermsIds && response.licenseTermsIds.length > 0 
            ? Number(response.licenseTermsIds[0]) 
            : 0,
          cid,
          response.ipId || '',
          response.txHash || ''
        );
      }

      // Log detailed response structure
      console.log(
        'Successfully registered IP. Full response:',
        JSON.stringify(
          response,
          (key, value) => (typeof value === 'bigint' ? value.toString() : value),
          2
        )
      );
      console.log('ipId:', response.ipId);
      console.log('tokenId:', response.tokenId);
      console.log('txHash:', response.txHash);
      if (!withoutLicense) {
        console.log('licenseTermsIds:', response.licenseTermsIds);
      }

      // Response structure for client
      const clientResponse = {
        ipId: response.ipId,
        tokenId: response.tokenId ? response.tokenId.toString() : undefined,
        txHash: response.txHash,
        licenseTermsIds: !withoutLicense && response.licenseTermsIds
          ? response.licenseTermsIds.map((id) => id.toString())
          : undefined,
      };

      return NextResponse.json(clientResponse);
    } catch (mintError) {
      console.error('Error in mint process:', mintError);

      if (mintError instanceof Error) {
        console.error('Error details:', mintError.message);
        console.error('Error stack:', mintError.stack);
      }

      return NextResponse.json(
        {
          error:
            mintError instanceof Error ? mintError.message : 'Failed to mint and register IP asset',
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error registering IP asset:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to register IP asset' },
      { status: 500 }
    );
  }
}

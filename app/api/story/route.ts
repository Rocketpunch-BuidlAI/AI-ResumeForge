import { NextResponse } from 'next/server';
import { client } from '@/utils/config';
import { creativeCommonsAttribution } from '@/utils/terms';
import { saveIpAsset } from '@/db';
import { MintAndRegisterIpAssetWithPilTermsResponse } from '@story-protocol/core-sdk';
import { encryptCID } from '@/utils/encryption';

export async function POST(request: Request) {
  try {
    const { cid, walletAddress, userId, withoutLicense } = await request.json();

    if (!cid || !walletAddress || !userId) {
      return NextResponse.json(
        { error: 'CID, wallet address, and user ID are required' },
        { status: 400 }
      );
    }

    // Encrypt CID
    const encryptedCID = encryptCID(cid);

    // Log each step for debugging
    console.log('Attempting to register IP with CID:', cid, 'for wallet:', walletAddress);

    try {
      const spgNftContract = process.env.STORY_SPG_NFT_CONTRACT;
      console.log('Using SPG contract:', spgNftContract);

      let response: MintAndRegisterIpAssetWithPilTermsResponse;
      if (withoutLicense) {
        // Register IP asset without license
        response = await client.ipAsset.mintAndRegisterIp({
          spgNftContract: spgNftContract as `0x${string}`,
          ipMetadata: {
            ipMetadataURI: encryptedCID,
          },
          recipient: walletAddress as `0x${string}`,
          allowDuplicates: true,
          txOptions: {
            waitForTransaction: true,
          },
        });

        // Save with licenseTermId as 0 when registered without license
        await saveIpAsset(
          userId,
          Number(response.tokenId),
          0,
          encryptedCID, // Save encrypted CID
          response.ipId || '',
          response.txHash || ''
        );
      } else {
        // Register IP asset with license
        response = await client.ipAsset.mintAndRegisterIpAssetWithPilTerms({
          spgNftContract: spgNftContract as `0x${string}`,
          ipMetadata: {
            ipMetadataURI: encryptedCID,
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

        // Save with licenseTermId when registered with license
        await saveIpAsset(
          userId,
          Number(response.tokenId),
          response.licenseTermsIds && response.licenseTermsIds.length > 0
            ? Number(response.licenseTermsIds[0])
            : 0,
          encryptedCID, // Save encrypted CID
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
        licenseTermsIds:
          !withoutLicense && response.licenseTermsIds
            ? response.licenseTermsIds.map((id: bigint) => id.toString())
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

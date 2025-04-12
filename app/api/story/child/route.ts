import { NextResponse } from 'next/server';
import { getWalletAddressByEmail } from '@/utils/privy';
import { client } from '@/utils/config';

export async function POST(request: Request) {
  try {
    const { email, tokenId, licenseTokenIds, cid } = await request.json();

    if (!email || !tokenId || !licenseTokenIds || !cid) {
      return NextResponse.json(
        { error: 'Required parameters are missing' },
        { status: 400 }
      );
    }

    // Get wallet address by email
    const walletAddress = await getWalletAddressByEmail(email);
    if (!walletAddress) {
      return NextResponse.json(
        { error: 'Wallet address not found' },
        { status: 404 }
      );
    }

    // Convert license token IDs to array
    const licenseTokenIdsArray = licenseTokenIds.split(',').map((id: string) => id.trim());

    // Register derivative IP asset
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
    console.error('Error registering derivative IP asset:', error);
    return NextResponse.json(
      { error: 'Failed to register derivative IP asset: ' + error },
      { status: 500 }
    );
  }
} 
import { NextResponse } from 'next/server';
import { getWalletAddressByEmail } from '@/utils/privy';
import { client, stroyAccount } from '@/utils/config';
import { publicClient, walletClient } from '@/utils/config';
import { defaultNftContractAbi } from '@/utils/defaultNftContractAbi';

export async function POST(request: Request) {
  try {
    const { email, licenseTermsId, licensorIpId, cid, maxMintingFee } = await request.json();

    if (!email || !licenseTermsId || !licensorIpId || !cid || maxMintingFee === undefined) {
      return NextResponse.json({ error: 'Required parameters are missing' }, { status: 400 });
    }

    // Get wallet address by email
    const walletAddress = await getWalletAddressByEmail(email);
    if (!walletAddress) {
      return NextResponse.json({ error: 'Wallet address not found' }, { status: 404 });
    }

    // Mint license tokens
    const response = await client.license.mintLicenseTokens({
      licenseTermsId: licenseTermsId,
      licensorIpId: licensorIpId,
      amount: 1,
      maxMintingFee: BigInt(maxMintingFee), // Use the value directly
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

    // Register derivative IP asset
    const child = await client.ipAsset.mintAndRegisterIpAndMakeDerivativeWithLicenseTokens({
      spgNftContract: process.env.STORY_SPG_NFT_CONTRACT as `0x${string}`,
      licenseTokenIds: response.licenseTokenIds!,
      ipMetadata: {
        ipMetadataURI: cid
      },
      maxRts: 100_000_000,
      txOptions: { waitForTransaction: true },
      recipient: walletAddress as `0x${string}`,
    });

    return NextResponse.json({
      txHash: child.txHash,
      ipId: child.ipId,
      tokenId: child.tokenId?.toString() || '',
    });
  } catch (error) {
    console.error('Error registering derivative IP asset:', error);
    return NextResponse.json(
      { error: 'Failed to register derivative IP asset: ' + error },
      { status: 500 }
    );
  }
}

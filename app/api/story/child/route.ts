import { NextResponse } from 'next/server';
import { getWalletAddressByEmail } from '@/utils/privy';
import { client, stroyAccount } from '@/utils/config';
import { publicClient, walletClient } from '@/utils/config';
import { defaultNftContractAbi } from '@/utils/defaultNftContractAbi';
import { WIP_TOKEN_ADDRESS } from '@story-protocol/core-sdk'
import { saveIpAsset, saveIpReference, getIpAssetByIpId, saveRoyalty } from '@/db';
import { zeroAddress } from 'viem'
import { encryptCID } from '@/utils/encryption';
import { MintAndRegisterIpAssetWithPilTermsResponse } from '@story-protocol/core-sdk';

export async function POST(request: Request) {
  try {
    const { email, licenseInfos, cid, userId } = await request.json();

    if (!email || !licenseInfos || !Array.isArray(licenseInfos) || licenseInfos.length === 0 || !cid || !userId) {
      return NextResponse.json({ error: 'Required parameters are missing' }, { status: 400 });
    }

    // Get wallet address by email
    const walletAddress = await getWalletAddressByEmail(email);
    if (!walletAddress) {
      return NextResponse.json({ error: 'Wallet address not found' }, { status: 404 });
    }

    // Mint license tokens for each license info
    const licenseTokenIds = [];
    for (const licenseInfo of licenseInfos) {
      const response = await client.license.mintLicenseTokens({
        licenseTermsId: licenseInfo.licenseTermsId,
        licensorIpId: licenseInfo.licensorIpId,
        amount: 1,
        maxMintingFee: BigInt(licenseInfo.maxMintingFee),
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

    // Register derivative IP asset with all license tokens
    const child = await client.ipAsset.mintAndRegisterIpAndMakeDerivativeWithLicenseTokens({
      spgNftContract: process.env.STORY_SPG_NFT_CONTRACT as `0x${string}`,
      licenseTokenIds: licenseTokenIds,
      ipMetadata: {
        ipMetadataURI: encryptCID(cid)
      },
      maxRts: 100_000_000,
      txOptions: { waitForTransaction: true },
      recipient: walletAddress as `0x${string}`,
    });

    // Save IP asset to database
    const savedIpAsset = await saveIpAsset(
      userId,
      Number(child.tokenId),
      Number(licenseInfos[0].licenseTermsId),
      cid,
      child.ipId || '',
      child.txHash || ''
    );

    // Save IP references to database
    for (const licenseInfo of licenseInfos) {
      if (savedIpAsset && savedIpAsset.length > 0) {
        // Get parent IP asset ID from database
        const parentIpAsset = await getIpAssetByIpId(licenseInfo.licensorIpId);
        if (parentIpAsset && parentIpAsset.length > 0) {
          await saveIpReference(
            savedIpAsset[0].id,
            parentIpAsset[0].id
          );
        }
      }
    }

    for (const licenseInfo of licenseInfos) {
        const payRoyalty = await client.royalty.payRoyaltyOnBehalf({
              receiverIpId: licenseInfo.licensorIpId as `0x${string}`,
              payerIpId: zeroAddress,
              token: WIP_TOKEN_ADDRESS,
              amount: licenseInfo.maxMintingFee,
              txOptions: { waitForTransaction: true },
        })

        console.log('Paid royalty:', {
              'Transaction Hash': payRoyalty.txHash,
        })

        const parentClaimRevenue = await client.royalty.claimAllRevenue({
              ancestorIpId: licenseInfo.licensorIpId,
              claimer: licenseInfo.licensorIpId,
              childIpIds: [],
              royaltyPolicies: ["0xBe54FB168b3c982b7AaE60dB6CF75Bd8447b390E"],
              currencyTokens: [WIP_TOKEN_ADDRESS],
        })

        console.log('Parent claimed revenue receipt:', parentClaimRevenue)

        const parentIpAsset = await getIpAssetByIpId(licenseInfo.licensorIpId);
        // Save royalty information
        await saveRoyalty(
          parentIpAsset[0].id,
          savedIpAsset[0].id,
          Number(licenseInfo.maxMintingFee),
          payRoyalty.txHash || '',
          parentClaimRevenue.txHashes[0] || '',
        );
    }

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

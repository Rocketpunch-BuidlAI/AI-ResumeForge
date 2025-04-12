import { NextResponse } from 'next/server';
import { client } from '@/utils/config';
import { getWalletAddressByEmail } from '@/utils/privy';

// Convert BigInt to string for JSON serialization
function replaceBigInt(key: string, value: any) {
  if (typeof value === 'bigint') {
    return value.toString();
  }
  return value;
}

export async function POST(request: Request) {
  try {
    const { licenses, receiverEmail } = await request.json();

    if (!licenses || !Array.isArray(licenses) || licenses.length === 0 || !receiverEmail) {
      return NextResponse.json(
        { error: 'licenses array and receiverEmail are required' },
        { status: 400 }
      );
    }

    // Get receiver wallet address from email
    const receiverWallet = await getWalletAddressByEmail(receiverEmail);

    if (!receiverWallet) {
      return NextResponse.json({ error: 'Receiver wallet address not found' }, { status: 404 });
    }

    // Process licenses sequentially
    const responses = [];
    const allLicenseTokenIds = [];
    let lastTxHash = '';
    let lastReceipt = null;

    for (const license of licenses) {
      const { licenseTermsId, licensorIpId, maxMintingFee } = license;

      if (!licenseTermsId || !licensorIpId) {
        throw new Error('licenseTermsId and licensorIpId are required for each license');
      }

      try {
        const response = await client.license.mintLicenseTokens({
          licenseTermsId: licenseTermsId,
          licensorIpId: licensorIpId as `0x${string}`,
          receiver: receiverWallet as `0x${string}`,
          amount: 1, // default to 1
          maxMintingFee: maxMintingFee ? BigInt(maxMintingFee) : BigInt(0),
          maxRevenueShare: 100, // default
          txOptions: {
            waitForTransaction: true,
          },
        });

        // Convert BigInt values to strings to prevent serialization errors
        const responseData = JSON.parse(JSON.stringify(response, replaceBigInt));

        // Collect license token IDs
        if (responseData.licenseTokenIds && Array.isArray(responseData.licenseTokenIds)) {
          allLicenseTokenIds.push(...responseData.licenseTokenIds);
        }

        lastTxHash = responseData.txHash;
        lastReceipt = responseData.receipt;

        responses.push(responseData);
      } catch (err) {
        console.error(`Failed to mint license for terms ${licenseTermsId}:`, err);
        responses.push({
          error: err instanceof Error ? err.message : 'Failed to mint license token',
          licenseTermsId,
          licensorIpId,
        });
      }
    }

    // Combine all responses into a single response
    const combinedResponse = {
      txHash: lastTxHash,
      licenseTokenIds: allLicenseTokenIds,
      receipt: lastReceipt,
      individualResponses: responses,
    };

    return NextResponse.json(combinedResponse);
  } catch (error) {
    console.error('License token creation error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create license tokens' },
      { status: 500 }
    );
  }
}

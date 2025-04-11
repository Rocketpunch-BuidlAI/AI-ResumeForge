import { NextResponse } from "next/server";
import { client } from "@/utils/config";
import { zeroAddress } from "viem";

const creativeCommonsAttribution = {
  terms: {
    transferable: true,
    royaltyPolicy: "0xBe54FB168b3c982b7AaE60dB6CF75Bd8447b390E" as `0x${string}`,
    defaultMintingFee: 0,
    expiration: 0,
    commercialUse: true,
    commercialAttribution: true,
    commercializerChecker: zeroAddress,
    commercializerCheckerData: "0x" as `0x${string}`,
    commercialRevShare: 0,
    commercialRevCeiling: 0,
    derivativesAllowed: true,
    derivativesAttribution: true,
    derivativesApproval: false,
    derivativesReciprocal: true,
    derivativeRevCelling: 0,
    derivativeRevCeiling: 0,
    currency: "0x1514000000000000000000000000000000000000" as `0x${string}`,
    uri: "https://github.com/piplabs/pil-document/blob/998c13e6ee1d04eb817aefd1fe16dfe8be3cd7a2/off-chain-terms/CC-BY.json",
  }
};

export async function POST(request: Request) {
  try {
    const { cid, walletAddress } = await request.json();

    if (!cid || !walletAddress) {
      return NextResponse.json({ error: 'CID and wallet address are required' }, { status: 400 });
    }

    // Register IP asset with Creative Commons license
    const response = await client.ipAsset.mintAndRegisterIpAssetWithPilTerms({
      spgNftContract: "0xB727a753083a24D007d204B4220eC09B101C1407", // Sepolia testnet SPG NFT contract
      ipMetadata: {
        ipMetadataURI: cid,
      },
      recipient: walletAddress as `0x${string}`,
      licenseTermsData: [
        creativeCommonsAttribution
      ],
    });

    return NextResponse.json({
      ipId: response.ipId,
      tokenId: response.tokenId,
      txHash: response.txHash,
    });
  } catch (error) {
    console.error("Error registering IP asset:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to register IP asset" },
      { status: 500 }
    );
  }
}

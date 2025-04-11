import { NextResponse } from "next/server";
import { client } from "@/utils/config";

export async function POST(request: Request) {
  try {
    const { cid, walletAddress } = await request.json();

    if (!cid || !walletAddress) {
      return NextResponse.json(
        { error: "CID and wallet address are required" },
        { status: 400 }
      );
    }

    // Register IP asset with Creative Commons license
    const response = await client.ipAsset.mintAndRegisterIpAssetWithPilTerms({
      spgNftContract: process.env.STORY_NFT_CONTRACT as `0x${string}`,
      allowDuplicates: true,
      ipMetadata: {
        ipMetadataURI: "",
        ipMetadataHash: "0x",
      },
      recipient: "0x",
      licenseTermsData: [
        {
          licenseTerms: "CC-BY",
          licenseTermsURI: "",
        },
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
      { error: "Failed to register IP asset" },
      { status: 500 }
    );
  }
} 
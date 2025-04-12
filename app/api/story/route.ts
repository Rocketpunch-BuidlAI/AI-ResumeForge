import { NextResponse } from "next/server";
import { client } from "@/utils/config";
import { creativeCommonsAttribution } from "@/utils/terms";

export async function POST(request: Request) {
  try {
    const { cid, walletAddress } = await request.json();

    if (!cid || !walletAddress) {
      return NextResponse.json({ error: 'CID and wallet address are required' }, { status: 400 });
    }

    // Log each step for debugging
    console.log("Attempting to register IP with CID:", cid, "for wallet:", walletAddress);

    // Register IP asset with Creative Commons license
    try {
      const spgNftContract = process.env.STORY_SPG_NFT_CONTRACT;
      
      console.log("Using SPG contract:", spgNftContract);
      
      // Call mintAndRegisterIpAssetWithPilTerms function
      // - Mints NFT, registers IP, and connects license terms
      // - SDK handles mintFeeToken function call
      const response = await client.ipAsset.mintAndRegisterIpAssetWithPilTerms({
        spgNftContract: spgNftContract as `0x${string}`,
        ipMetadata: {
          ipMetadataURI: cid,
        },
        recipient: walletAddress as `0x${string}`,
        licenseTermsData: [
          { 
            terms: creativeCommonsAttribution.terms
          }
        ],
        allowDuplicates: true,
        txOptions: {
          waitForTransaction: true // Wait for transaction completion
        }
      });

      // Log detailed response structure
      console.log("Successfully registered IP. Full response:", JSON.stringify(response, (key, value) => 
        typeof value === 'bigint' ? value.toString() : value
      , 2));
      console.log("ipId:", response.ipId);
      console.log("tokenId:", response.tokenId);
      console.log("txHash:", response.txHash);
      console.log("licenseTermsIds:", response.licenseTermsIds);

      // Response structure for client
      const clientResponse = {
        ipId: response.ipId,
        tokenId: response.tokenId ? response.tokenId.toString() : undefined,
        txHash: response.txHash,
        licenseTermsIds: response.licenseTermsIds ? 
          response.licenseTermsIds.map(id => id.toString()) : undefined
      };

      return NextResponse.json(clientResponse);
    } catch (mintError) {
      console.error("Error in mint process:", mintError);
      
      // Log detailed error information
      if (mintError instanceof Error) {
        console.error("Error details:", mintError.message);
        console.error("Error stack:", mintError.stack);
      }
      
      return NextResponse.json(
        { error: mintError instanceof Error ? mintError.message : "Failed to mint and register IP asset" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error registering IP asset:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to register IP asset" },
      { status: 500 }
    );
  }
}
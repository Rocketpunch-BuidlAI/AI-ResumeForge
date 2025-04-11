import { NextResponse } from "next/server";
import { client } from "@/utils/config";
import { zeroAddress } from "viem";

const creativeCommonsAttribution = {
  terms: {
    transferable: true,
    royaltyPolicy: "0xBe54FB168b3c982b7AaE60dB6CF75Bd8447b390E" as `0x${string}`,
    defaultMintingFee: BigInt(0),
    expiration: BigInt(0),
    commercialUse: true,
    commercialAttribution: true,
    commercializerChecker: zeroAddress,
    commercializerCheckerData: "0x" as `0x${string}`,
    commercialRevShare: 0,
    commercialRevCeiling: BigInt(0),
    derivativesAllowed: true,
    derivativesAttribution: true,
    derivativesApproval: false,
    derivativesReciprocal: true,
    derivativeRevCeiling: BigInt(0),
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

    // 각 단계별로 로깅하여 문제 추적
    console.log("Attempting to register IP with CID:", cid, "for wallet:", walletAddress);

    // Register IP asset with Creative Commons license
    try {
      // SPG 컨트랙트 주소 (Aeneid 테스트넷)
      // Story Protocol 공식 문서에서 제공하는 SPG NFT 컨트랙트 주소
      const spgNftContract = "0xc32A8a0FF3beDDDa58393d022aF433e78739FAbc";
      
      console.log("Using SPG contract:", spgNftContract);
      
      // mintAndRegisterIpAssetWithPilTerms 함수 호출
      // - NFT를 발행하고, IP로 등록하고, 라이센스 약관을 연결하는 기능
      // - mintFeeToken 함수 직접 호출을 하지 않고 SDK가 처리하도록 함
      const response = await client.ipAsset.mintAndRegisterIpAssetWithPilTerms({
        spgNftContract: spgNftContract,
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
          waitForTransaction: true // 트랜잭션 완료 대기
        }
      });

      // 응답 구조 자세히 로깅
      console.log("Successfully registered IP. Full response:", JSON.stringify(response, (key, value) => 
        typeof value === 'bigint' ? value.toString() : value
      , 2));
      console.log("ipId:", response.ipId);
      console.log("tokenId:", response.tokenId);
      console.log("txHash:", response.txHash);
      console.log("licenseTermsIds:", response.licenseTermsIds);

      // 클라이언트에게 전송할 응답 구조
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
      
      // 자세한 오류 정보 로깅
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
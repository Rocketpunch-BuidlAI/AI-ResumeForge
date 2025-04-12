import { zeroAddress } from 'viem';

export const creativeCommonsAttribution = {
  terms: {
    transferable: true,
    royaltyPolicy: process.env.STORY_ROYALTY_POLICY as `0x${string}`,
    defaultMintingFee: BigInt(0),
    expiration: BigInt(0),
    commercialUse: true,
    commercialAttribution: true,
    commercializerChecker: zeroAddress,
    commercializerCheckerData: zeroAddress,
    commercialRevShare: 0,
    commercialRevCeiling: BigInt(0),
    derivativesAllowed: true,
    derivativesAttribution: true,
    derivativesApproval: false,
    derivativesReciprocal: true,
    derivativeRevCeiling: BigInt(0),
    currency: process.env.STORY_CURRENCY as `0x${string}`,
    uri: 'https://github.com/piplabs/pil-document/blob/998c13e6ee1d04eb817aefd1fe16dfe8be3cd7a2/off-chain-terms/CC-BY.json',
  },
};

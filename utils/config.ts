import { PinataSDK } from 'pinata';
import { http } from 'viem';
import { Account, privateKeyToAccount, Address } from 'viem/accounts';
import { StoryClient, StoryConfig } from '@story-protocol/core-sdk';

export const pinata = new PinataSDK({
  pinataJwt: process.env.PINATA_JWT,
  pinataGateway: process.env.NEXT_PUBLIC_GATEWAY_URL,
});

// 메타데이터 타입 정의
export interface PinataMetadata {
  name: string;
  keyvalues: {
    referenceCids: string[];
  };
}

// 업로드 옵션 타입 정의
export interface UploadOptions {
  pinataMetadata?: PinataMetadata;
}

// Story RPC 설정
const privateKey: Address = `0x${process.env.WALLET_PRIVATE_KEY}`;
const account: Account = privateKeyToAccount(privateKey);

const config: StoryConfig = {
  account: account, // the account object from above
  transport: http(process.env.RPC_PROVIDER_URL),
  chainId: 'aeneid',
};
export const client = StoryClient.newClient(config);

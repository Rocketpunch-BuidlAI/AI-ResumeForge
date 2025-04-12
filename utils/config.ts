import { PinataSDK } from 'pinata';
import { http } from 'viem';
import { Account, privateKeyToAccount, Address } from 'viem/accounts';
import { StoryClient, StoryConfig } from '@story-protocol/core-sdk';

export const pinata = new PinataSDK({
  pinataJwt: process.env.PINATA_JWT,
  pinataGateway: process.env.NEXT_PUBLIC_GATEWAY_URL,
});

// Define metadata type
export interface PinataMetadata {
  name: string;
  keyvalues: {
    referenceCids: string[];
  };
}

// Define upload options type
export interface UploadOptions {
  pinataMetadata?: PinataMetadata;
}

// Story RPC configuration
const privateKey: Address = `0x${process.env.WALLET_PRIVATE_KEY}`;
const account: Account = privateKeyToAccount(privateKey);

const config: StoryConfig = {
  account: account, // Account object from above
  transport: http(process.env.RPC_PROVIDER_URL),
  chainId: 'aeneid', // Aeneid testnet
};
export const client = StoryClient.newClient(config);


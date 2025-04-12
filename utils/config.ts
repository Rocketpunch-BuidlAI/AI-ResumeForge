import { http } from 'viem';
import { Account, privateKeyToAccount, Address } from 'viem/accounts';
import { StoryClient, StoryConfig } from '@story-protocol/core-sdk';
import { createPublicClient, createWalletClient } from 'viem';
import { aeneid } from '@story-protocol/core-sdk';

// Story RPC configuration
const privateKey: Address = `0x${process.env.WALLET_PRIVATE_KEY}`;
const account: Account = privateKeyToAccount(privateKey);

export const stroyAccount: Account = privateKeyToAccount(
  `0x${process.env.WALLET_PRIVATE_KEY}` as Address
);

const config: StoryConfig = {
  account: account, // Account object from above
  transport: http(process.env.RPC_PROVIDER_URL),
  chainId: 'aeneid', // Aeneid testnet
};
export const client = StoryClient.newClient(config);

// Create public client
export const publicClient = createPublicClient({
  chain: aeneid,
  transport: http(process.env.RPC_PROVIDER_URL),
});

// Create wallet client
export const walletClient = createWalletClient({
  chain: aeneid,
  transport: http(process.env.RPC_PROVIDER_URL),
  account: account,
});

export const AI_AGENT_URL = process.env.AI_AGENT_BASE_URL;

import { PrivyClient } from '@privy-io/server-auth';

export const getPrivyClient = () => {
  return new PrivyClient(process.env.PRIVY_APP_ID!, process.env.PRIVY_API_SECRET!, {
    apiURL: 'https://auth.privy.io',
  });
};

interface Wallet {
  address: string;
  type: string;
  chain?: string;
}

export async function getWalletAddressByEmail(email: string): Promise<string | null> {
  try {
    const privy = getPrivyClient();
    const user = await privy.getUserByEmail(email);
    if (!user) {
      return null;
    }
    
    const wallet = user.linkedAccounts?.find((account) => account.type === 'wallet');
    return wallet?.address || null;
  } catch (error) {
    console.error('Error getting wallet address:', error);
    return null;
  }
} 
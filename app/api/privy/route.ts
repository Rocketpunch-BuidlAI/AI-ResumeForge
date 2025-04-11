import { NextResponse } from 'next/server';
import { PrivyClient } from '@privy-io/server-auth';

// Initialize Privy client
const privy = new PrivyClient(process.env.PRIVY_APP_ID!, process.env.PRIVY_API_SECRET!, {
  apiURL: 'https://auth.privy.io',
});

interface Wallet {
  address: string;
  type: string;
  chain?: string;
}

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    // Get user by email
    const user = await privy.getUserByEmail(email);

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get user's wallets from user object
    const wallets = user.linkedAccounts?.filter((account) => account.type === 'wallet') || [];

    return NextResponse.json({
      userId: user.id,
      wallets: wallets.map((wallet: Wallet) => ({
        address: wallet.address,
        type: wallet.type,
        chain: wallet.chain,
      })),
    });
  } catch (error) {
    console.error('Error fetching user wallets:', error);
    return NextResponse.json({ error: 'Failed to fetch user wallets' }, { status: 500 });
  }
}

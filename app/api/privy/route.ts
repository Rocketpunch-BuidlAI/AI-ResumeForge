import { NextResponse } from 'next/server';
import { getPrivyClient } from '@/utils/privy';

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

    const privy = getPrivyClient();
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

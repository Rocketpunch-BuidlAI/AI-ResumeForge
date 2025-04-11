'use client';

import { PropsWithChildren } from 'react';
import { PrivyProvider } from '@privy-io/react-auth';
import { aeneid } from '@story-protocol/core-sdk';

const PrivyAuthProvider: React.FC<PropsWithChildren> = ({ children }) => {
  return (
    <PrivyProvider
      appId={process.env.NEXT_PUBLIC_PRIVY_APP_ID || ''}
      clientId={process.env.NEXT_PUBLIC_PRIVY_CLIENT_ID || ''}
      config={{
        appearance: {
          theme: 'light',
          accentColor: '#676FFF',
          // logo: 'https://your-logo-url'
        },
        // Create embedded wallets for users who don't have a wallet
        embeddedWallets: {
          createOnLogin: 'users-without-wallets',
        },
        defaultChain: aeneid,
        supportedChains: [aeneid],
      }}
    >
      {children}
    </PrivyProvider>
  );
};

export default PrivyAuthProvider;

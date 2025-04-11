'use client';

import { useState } from 'react';

interface RegisterResult {
  ipId?: string;
  tokenId?: string;
  txHash?: string;
  licenseTermsIds?: string[];
  status?: string;
  message?: string;
}

export default function IpRegisterPage() {
  const [email, setEmail] = useState('');
  const [cid, setCid] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<RegisterResult | null>(null);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setResult(null);

    try {
      // 1. 이메일로 지갑 주소 조회
      const walletResponse = await fetch('/api/privy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      if (!walletResponse.ok) {
        throw new Error('Failed to fetch wallet address');
      }

      const walletData = await walletResponse.json();
      const walletAddress = walletData.wallets[0].address;

      // 2. IP 자산 등록
      const registerResponse = await fetch('/api/story', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          cid,
          walletAddress,
        }),
      });

      if (!registerResponse.ok) {
        const errorData = await registerResponse.json();
        throw new Error(errorData.error || 'Failed to register IP asset');
      }

      const registerData = await registerResponse.json();
      setResult(registerData);
    } catch (err) {
      console.error('Registration error:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-8">
        <h2 className="text-2xl font-bold text-center mb-8">IP 자산 등록</h2>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              이메일
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              required
            />
          </div>

          <div>
            <label htmlFor="cid" className="block text-sm font-medium text-gray-700">
              CID
            </label>
            <input
              type="text"
              id="cid"
              value={cid}
              onChange={(e) => setCid(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
          >
            {loading ? '등록 중...' : 'IP 자산 등록'}
          </button>
        </form>

        {error && (
          <div className="mt-4 p-4 bg-red-50 text-red-700 rounded-md">
            {error}
          </div>
        )}

        {result && (
          <div className="mt-4 p-4 bg-green-50 text-green-700 rounded-md">
            <h3 className="font-bold">등록 성공!</h3>
            <div className="mt-2 text-sm">
              {result.ipId && (
                <p className="mb-1">
                  <span className="font-semibold">IP ID:</span> {result.ipId}
                </p>
              )}
              {result.tokenId && (
                <p className="mb-1">
                  <span className="font-semibold">Token ID:</span> {result.tokenId}
                </p>
              )}
              {result.txHash && (
                <p className="mb-1">
                  <span className="font-semibold">Transaction Hash:</span>{" "}
                  <a 
                    href={`https://aeneid.story.xyz/tx/${result.txHash}`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-500 hover:underline"
                  >
                    {result.txHash.substring(0, 10)}...{result.txHash.substring(result.txHash.length - 8)}
                  </a>
                </p>
              )}
              {result.licenseTermsIds && result.licenseTermsIds.length > 0 && (
                <p className="mb-1">
                  <span className="font-semibold">License Terms IDs:</span> {result.licenseTermsIds.join(', ')}
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 
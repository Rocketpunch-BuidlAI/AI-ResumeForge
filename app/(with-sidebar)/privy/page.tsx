'use client';

import { useState } from 'react';

interface Wallet {
  address: string;
  type: string;
  chain?: string;
}

interface PrivyResponse {
  userId: string;
  wallets: Wallet[];
}

export default function PrivyPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<PrivyResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('/api/privy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch wallet information');
      }

      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen p-8">
      <div className="mx-auto max-w-md">
        <h1 className="mb-6 text-2xl font-bold">Find Wallet by Email</h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Email
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

          <button
            type="submit"
            disabled={loading}
            className="flex w-full justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:outline-none disabled:opacity-50"
          >
            {loading ? 'Loading...' : 'Find Wallet'}
          </button>
        </form>

        {error && <div className="mt-4 rounded-md bg-red-50 p-4 text-red-700">{error}</div>}

        {result && (
          <div className="mt-6">
            <h2 className="mb-2 text-lg font-semibold">Results</h2>
            <div className="rounded-md bg-gray-50 p-4">
              <p className="mb-2">
                <span className="font-medium">User ID:</span> {result.userId}
              </p>
              <div>
                <span className="font-medium">Wallets:</span>
                <ul className="mt-2 space-y-2">
                  {result.wallets.map((wallet: Wallet, index: number) => (
                    <li key={index} className="rounded-md bg-white p-3 shadow">
                      <p>
                        <span className="font-medium">Address:</span> {wallet.address}
                      </p>
                      <p>
                        <span className="font-medium">Type:</span> {wallet.type}
                      </p>
                      <p>
                        <span className="font-medium">Chain:</span> {wallet.chain}
                      </p>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

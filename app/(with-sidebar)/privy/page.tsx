"use client";

import { useState } from "react";

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
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<PrivyResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch("/api/privy", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch wallet information");
      }

      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-md mx-auto">
        <h1 className="text-2xl font-bold mb-6">Find Wallet by Email</h1>
        
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
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
          >
            {loading ? "Loading..." : "Find Wallet"}
          </button>
        </form>

        {error && (
          <div className="mt-4 p-4 bg-red-50 text-red-700 rounded-md">
            {error}
          </div>
        )}

        {result && (
          <div className="mt-6">
            <h2 className="text-lg font-semibold mb-2">Results</h2>
            <div className="bg-gray-50 p-4 rounded-md">
              <p className="mb-2">
                <span className="font-medium">User ID:</span> {result.userId}
              </p>
              <div>
                <span className="font-medium">Wallets:</span>
                <ul className="mt-2 space-y-2">
                  {result.wallets.map((wallet: Wallet, index: number) => (
                    <li key={index} className="bg-white p-3 rounded-md shadow">
                      <p><span className="font-medium">Address:</span> {wallet.address}</p>
                      <p><span className="font-medium">Type:</span> {wallet.type}</p>
                      <p><span className="font-medium">Chain:</span> {wallet.chain}</p>
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
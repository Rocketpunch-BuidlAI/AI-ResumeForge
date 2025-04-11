'use client';

import { useState } from 'react';

export default function IpQueryPage() {
  const [txHash, setTxHash] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setResult(null);

    try {
      const response = await fetch(`/api/story/${txHash}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch IP asset');
      }

      const data = await response.json();
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-8">
        <h2 className="text-2xl font-bold text-center mb-8">IP 자산 조회</h2>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="txHash" className="block text-sm font-medium text-gray-700">
              트랜잭션 해시
            </label>
            <input
              type="text"
              id="txHash"
              value={txHash}
              onChange={(e) => setTxHash(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              required
              placeholder="0x..."
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
          >
            {loading ? '조회 중...' : 'IP 자산 조회'}
          </button>
        </form>

        {error && (
          <div className="mt-4 p-4 bg-red-50 text-red-700 rounded-md">
            {error}
          </div>
        )}

        {result && (
          <div className="mt-4 p-4 bg-green-50 text-green-700 rounded-md">
            <h3 className="font-bold">조회 결과</h3>
            <div className="mt-2 space-y-2">
              <p><span className="font-semibold">상태:</span> {result.status}</p>
              <p><span className="font-semibold">IP ID:</span> {result.ipId}</p>
              <p><span className="font-semibold">토큰 ID:</span> {result.tokenId}</p>
              {result.ipAsset && (
                <div className="mt-4 border-t pt-4">
                  <h4 className="font-semibold">IP 자산 정보</h4>
                  <p><span className="font-semibold">이름:</span> {result.ipAsset.name}</p>
                  <p><span className="font-semibold">설명:</span> {result.ipAsset.description}</p>
                  <p><span className="font-semibold">미디어 URL:</span> {result.ipAsset.mediaUrl}</p>
                  <p><span className="font-semibold">소유자:</span> {result.ipAsset.owner}</p>
                  <p><span className="font-semibold">생성일:</span> {new Date(result.ipAsset.createdAt).toLocaleString()}</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 
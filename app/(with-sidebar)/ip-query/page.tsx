'use client';

import { useState } from 'react';

interface IPAssetInfo {
  ipId?: string;
  tokenId?: string;
  txHash?: string;
  message?: string;
  verificationLinks?: Array<{
    name: string;
    url: string;
  }>;
}

export default function IpQueryPage() {
  const [searchType, setSearchType] = useState<'ipId' | 'txHash'>('ipId');
  const [searchValue, setSearchValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<IPAssetInfo | null>(null);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setResult(null);

    try {
      const response = await fetch(`/api/story/query`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          type: searchType,
          value: searchValue
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch IP asset information');
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
        <h2 className="text-2xl font-bold text-center mb-8">IP 자산 정보 조회</h2>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex space-x-4">
            <div className="flex items-center">
              <input
                id="ipId"
                type="radio"
                name="searchType"
                value="ipId"
                checked={searchType === 'ipId'}
                onChange={() => setSearchType('ipId')}
                className="mr-2"
              />
              <label htmlFor="ipId">IP ID</label>
            </div>
            <div className="flex items-center">
              <input
                id="txHash"
                type="radio"
                name="searchType"
                value="txHash"
                checked={searchType === 'txHash'}
                onChange={() => setSearchType('txHash')}
                className="mr-2"
              />
              <label htmlFor="txHash">트랜잭션 해시</label>
            </div>
          </div>

          <div>
            <label htmlFor="searchValue" className="block text-sm font-medium text-gray-700">
              {searchType === 'ipId' ? 'IP ID' : '트랜잭션 해시'}
            </label>
            <input
              type="text"
              id="searchValue"
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              placeholder={searchType === 'ipId' ? '0x...' : '0x...'}
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
          >
            {loading ? '조회 중...' : 'IP 자산 정보 조회'}
          </button>
        </form>

        {error && (
          <div className="mt-4 p-4 bg-red-50 text-red-700 rounded-md">
            {error}
          </div>
        )}

        {result && (
          <div className="mt-4 p-4 bg-green-50 text-green-700 rounded-md">
            <h3 className="font-bold text-lg">IP 자산 정보</h3>
            <div className="mt-4 space-y-3 text-sm">
              {result.ipId && (
                <div className="flex flex-col">
                  <span className="font-semibold">IP ID:</span>
                  <span className="break-all">{result.ipId}</span>
                </div>
              )}
              
              {result.tokenId && (
                <div className="flex flex-col">
                  <span className="font-semibold">토큰 ID:</span>
                  <span>{result.tokenId}</span>
                </div>
              )}
              
              {result.txHash && (
                <div className="flex flex-col">
                  <span className="font-semibold">트랜잭션 해시:</span>
                  <span className="break-all">{result.txHash}</span>
                </div>
              )}
              
              {result.message && (
                <div className="flex flex-col mt-2 text-blue-700">
                  <p>{result.message}</p>
                </div>
              )}
              
              {result.verificationLinks && result.verificationLinks.length > 0 && (
                <div className="mt-4">
                  <span className="font-semibold">IP 자산 확인 링크:</span>
                  <ul className="mt-2 space-y-2">
                    {result.verificationLinks.map((link, index) => (
                      <li key={index}>
                        <a 
                          href={link.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-500 hover:underline"
                        >
                          {link.name}
                        </a>
                      </li>
                    ))}
                  </ul>
                  <p className="mt-3 text-xs text-gray-600">
                    참고: Story Protocol Explorer(aeneid.story.xyz)에 직접 접속이 어려울 수 있습니다. 
                    접속이 안 될 경우 나중에 다시 시도해보세요.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 
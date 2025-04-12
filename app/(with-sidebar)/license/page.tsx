'use client';

import { useState } from 'react';

interface LicenseInput {
  licenseTermsId: string;
  licensorIpId: string;
  maxMintingFee: string;
}

interface LicenseResponse {
  txHash: string;
  licenseTokenIds: string[];
  receipt: any;
  individualResponses: any[];
}

export default function LicensePage() {
  const [licenseInputs, setLicenseInputs] = useState<LicenseInput[]>([{ licenseTermsId: '', licensorIpId: '', maxMintingFee: '' }]);
  const [receiverEmail, setReceiverEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [responseData, setResponseData] = useState<LicenseResponse | null>(null);

  const addLicenseInput = () => {
    setLicenseInputs([...licenseInputs, { licenseTermsId: '', licensorIpId: '', maxMintingFee: '' }]);
  };

  const removeLicenseInput = (index: number) => {
    if (licenseInputs.length > 1) {
      setLicenseInputs(licenseInputs.filter((_, i) => i !== index));
    }
  };

  const updateLicenseInput = (index: number, field: keyof LicenseInput, value: string) => {
    const newInputs = [...licenseInputs];
    newInputs[index][field] = value;
    setLicenseInputs(newInputs);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    setResponseData(null);

    try {
      const response = await fetch('/api/story/license', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          licenses: licenseInputs.map(input => ({
            licenseTermsId: input.licenseTermsId,
            licensorIpId: input.licensorIpId,
            maxMintingFee: input.maxMintingFee || '0',
          })),
          receiverEmail,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create licenses');
      }

      setResponseData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto bg-white rounded-xl shadow-md overflow-hidden md:max-w-2xl p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Issue Licenses</h1>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {licenseInputs.map((input, index) => (
            <div key={index} className="border-b pb-4">
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-lg font-medium text-gray-700">License #{index + 1}</h3>
                {licenseInputs.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeLicenseInput(index)}
                    className="text-red-600 hover:text-red-800"
                  >
                    Remove
                  </button>
                )}
              </div>
              
              <div className="space-y-4">
                <div>
                  <label htmlFor={`licenseTermsId-${index}`} className="block text-sm font-medium text-gray-700">
                    License Terms ID
                  </label>
                  <input
                    type="text"
                    id={`licenseTermsId-${index}`}
                    value={input.licenseTermsId}
                    onChange={(e) => updateLicenseInput(index, 'licenseTermsId', e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    required
                  />
                </div>

                <div>
                  <label htmlFor={`licensorIpId-${index}`} className="block text-sm font-medium text-gray-700">
                    IP Asset ID
                  </label>
                  <input
                    type="text"
                    id={`licensorIpId-${index}`}
                    value={input.licensorIpId}
                    onChange={(e) => updateLicenseInput(index, 'licensorIpId', e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    required
                  />
                </div>

                <div>
                  <label htmlFor={`maxMintingFee-${index}`} className="block text-sm font-medium text-gray-700">
                    Maximum Minting Fee (Optional)
                  </label>
                  <input
                    type="text"
                    id={`maxMintingFee-${index}`}
                    value={input.maxMintingFee}
                    onChange={(e) => updateLicenseInput(index, 'maxMintingFee', e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    placeholder="0"
                  />
                </div>
              </div>
            </div>
          ))}

          <button
            type="button"
            onClick={addLicenseInput}
            className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Add Another License
          </button>

          <div>
            <label htmlFor="receiverEmail" className="block text-sm font-medium text-gray-700">
              Receiver Email
            </label>
            <input
              type="email"
              id="receiverEmail"
              value={receiverEmail}
              onChange={(e) => setReceiverEmail(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              required
            />
          </div>

          {error && (
            <div className="text-red-500 text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
          >
            {loading ? 'Processing...' : 'Issue Licenses'}
          </button>
        </form>

        {responseData && (
          <div className="mt-8 p-4 bg-green-50 rounded-lg">
            <h2 className="text-lg font-semibold text-green-800 mb-2">Licenses Issued Successfully</h2>
            <div className="space-y-4">
              <div>
                <h3 className="text-md font-medium text-green-700 mb-1">Transaction Hash</h3>
                <pre className="text-sm text-green-700 overflow-auto">
                  {responseData.txHash}
                </pre>
              </div>
              
              <div>
                <h3 className="text-md font-medium text-green-700 mb-1">License Token IDs</h3>
                <pre className="text-sm text-green-700 overflow-auto">
                  {JSON.stringify(responseData.licenseTokenIds, null, 2)}
                </pre>
              </div>

              <div>
                <h3 className="text-md font-medium text-green-700 mb-1">Transaction Receipt</h3>
                <pre className="text-sm text-green-700 overflow-auto">
                  {JSON.stringify(responseData.receipt, null, 2)}
                </pre>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 
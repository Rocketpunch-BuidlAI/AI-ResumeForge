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
  receipt: string;
  individualResponses: string[];
}

export default function LicensePage() {
  const [licenseInputs, setLicenseInputs] = useState<LicenseInput[]>([
    { licenseTermsId: '', licensorIpId: '', maxMintingFee: '' },
  ]);
  const [receiverEmail, setReceiverEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [responseData, setResponseData] = useState<LicenseResponse | null>(null);

  const addLicenseInput = () => {
    setLicenseInputs([
      ...licenseInputs,
      { licenseTermsId: '', licensorIpId: '', maxMintingFee: '' },
    ]);
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
          licenses: licenseInputs.map((input) => ({
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
    <div className="min-h-screen bg-gray-100 px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-md overflow-hidden rounded-xl bg-white p-6 shadow-md md:max-w-2xl">
        <h1 className="mb-6 text-2xl font-bold text-gray-900">Issue Licenses</h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          {licenseInputs.map((input, index) => (
            <div key={index} className="border-b pb-4">
              <div className="mb-2 flex items-center justify-between">
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
                  <label
                    htmlFor={`licenseTermsId-${index}`}
                    className="block text-sm font-medium text-gray-700"
                  >
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
                  <label
                    htmlFor={`licensorIpId-${index}`}
                    className="block text-sm font-medium text-gray-700"
                  >
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
                  <label
                    htmlFor={`maxMintingFee-${index}`}
                    className="block text-sm font-medium text-gray-700"
                  >
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
            className="flex w-full justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:outline-none"
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

          {error && <div className="text-sm text-red-500">{error}</div>}

          <button
            type="submit"
            disabled={loading}
            className="flex w-full justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:outline-none disabled:opacity-50"
          >
            {loading ? 'Processing...' : 'Issue Licenses'}
          </button>
        </form>

        {responseData && (
          <div className="mt-8 rounded-lg bg-green-50 p-4">
            <h2 className="mb-2 text-lg font-semibold text-green-800">
              Licenses Issued Successfully
            </h2>
            <div className="space-y-4">
              <div>
                <h3 className="text-md mb-1 font-medium text-green-700">Transaction Hash</h3>
                <pre className="overflow-auto text-sm text-green-700">{responseData.txHash}</pre>
              </div>

              <div>
                <h3 className="text-md mb-1 font-medium text-green-700">License Token IDs</h3>
                <pre className="overflow-auto text-sm text-green-700">
                  {JSON.stringify(responseData.licenseTokenIds, null, 2)}
                </pre>
              </div>

              <div>
                <h3 className="text-md mb-1 font-medium text-green-700">Transaction Receipt</h3>
                <pre className="overflow-auto text-sm text-green-700">
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

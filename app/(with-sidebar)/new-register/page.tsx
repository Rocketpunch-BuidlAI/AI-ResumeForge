'use client';

import { useState } from 'react';
// import { usePrivy } from '@privy-io/react-auth';

// Type definitions
interface LicenseResult {
  licenseTokenIds: string[];
  txHash: string;
}

interface RegisterResult {
  ipId: string;
  tokenId: string;
  txHash: string;
}

export default function ConnectPage() {
  // const { user } = usePrivy();

  // Step management
  const [step, setStep] = useState(1); // 1: License creation, 2: Derivative IP registration

  // License creation step state
  const [licenseFormData, setLicenseFormData] = useState({
    licensorEmail: '',
    receiverEmail: '',
    licenseTermsId: '',
    maxMintingFee: '',
  });

  // Derivative IP registration step state
  const [registerFormData, setRegisterFormData] = useState({
    licensorIpId: '',
    receiver: '',
    licenseTokenIds: '',
    cid: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [licenseResult, setLicenseResult] = useState<LicenseResult | null>(null);
  const [registerResult, setRegisterResult] = useState<RegisterResult | null>(null);

  // License token creation process
  const handleLicenseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/story/license', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(licenseFormData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create license token');
      }

      setLicenseResult(data);

      // Pre-set form data for next step
      setRegisterFormData((prev) => ({
        ...prev,
        licensorIpId: data.licensorIpId || '',
        licenseTokenIds: data.licenseTokenIds?.join(',') || '',
        receiver: data.receiver || '',
      }));

      // Move to next step
      setStep(2);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  // Derivative IP registration process
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/story/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...registerFormData,
          licenseTermsIds: registerFormData.licenseTokenIds.split(',').map((id) => id.trim()),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to register derivative IP');
      }

      setRegisterResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  // Reset to start
  const handleReset = () => {
    setStep(1);
    setLicenseResult(null);
    setRegisterResult(null);
    setError('');
  };

  return (
    <div className="container mx-auto p-6">
      <h1 className="mb-6 text-3xl font-bold">
        AI Contribution License and Derivative IP Registration
      </h1>

      {/* Step indicator */}
      <div className="mb-8 flex">
        <div
          className={`flex-1 p-4 text-center ${step === 1 ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
        >
          1. License Token Creation
        </div>
        <div
          className={`flex-1 p-4 text-center ${step === 2 ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
        >
          2. Derivative IP Registration
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className="mb-4 rounded border border-red-400 bg-red-100 px-4 py-3 text-red-700">
          {error}
        </div>
      )}

      {/* Step 1: License Token Creation */}
      {step === 1 && (
        <div className="rounded-lg bg-white p-6 shadow-md">
          <h2 className="mb-4 text-xl font-bold">License Token Creation</h2>
          <form onSubmit={handleLicenseSubmit} className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Licensor Email</label>
              <input
                type="email"
                value={licenseFormData.licensorEmail}
                onChange={(e) =>
                  setLicenseFormData({ ...licenseFormData, licensorEmail: e.target.value })
                }
                className="w-full rounded-md border border-gray-300 px-3 py-2"
                placeholder="Enter licensor's email"
                required
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Receiver Email</label>
              <input
                type="email"
                value={licenseFormData.receiverEmail}
                onChange={(e) =>
                  setLicenseFormData({ ...licenseFormData, receiverEmail: e.target.value })
                }
                className="w-full rounded-md border border-gray-300 px-3 py-2"
                placeholder="Enter receiver's email"
                required
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                License Terms ID
              </label>
              <input
                type="text"
                value={licenseFormData.licenseTermsId}
                onChange={(e) =>
                  setLicenseFormData({ ...licenseFormData, licenseTermsId: e.target.value })
                }
                className="w-full rounded-md border border-gray-300 px-3 py-2"
                placeholder="Enter license terms ID"
                required
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Max Minting Fee
              </label>
              <input
                type="text"
                value={licenseFormData.maxMintingFee}
                onChange={(e) =>
                  setLicenseFormData({ ...licenseFormData, maxMintingFee: e.target.value })
                }
                className="w-full rounded-md border border-gray-300 px-3 py-2"
                placeholder="Enter max minting fee (default: 0)"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-md bg-blue-500 px-4 py-2 text-white hover:bg-blue-600 disabled:bg-blue-300"
            >
              {loading ? 'Processing...' : 'Create License Token'}
            </button>
          </form>
        </div>
      )}

      {/* Step 2: Derivative IP Registration */}
      {step === 2 && (
        <div className="rounded-lg bg-white p-6 shadow-md">
          <h2 className="mb-4 text-xl font-bold">Derivative IP Registration</h2>

          {/* License creation result display */}
          {licenseResult && (
            <div className="mb-4 rounded border border-green-400 bg-green-100 px-4 py-3 text-green-700">
              <p>
                <strong>License Token ID:</strong> {licenseResult.licenseTokenIds?.join(', ')}
              </p>
              <p>
                <strong>Transaction Hash:</strong> {licenseResult.txHash}
              </p>
            </div>
          )}

          <form onSubmit={handleRegisterSubmit} className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Original IP ID (Token ID)
              </label>
              <input
                type="text"
                value={registerFormData.licensorIpId}
                onChange={(e) =>
                  setRegisterFormData({ ...registerFormData, licensorIpId: e.target.value })
                }
                className="w-full rounded-md border border-gray-300 px-3 py-2"
                placeholder="Enter original IP ID (Token ID)"
                required
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Recipient Wallet Address
              </label>
              <input
                type="text"
                value={registerFormData.receiver}
                onChange={(e) =>
                  setRegisterFormData({ ...registerFormData, receiver: e.target.value })
                }
                className="w-full rounded-md border border-gray-300 px-3 py-2"
                placeholder="Enter recipient wallet address"
                required
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                License Token IDs (comma-separated)
              </label>
              <input
                type="text"
                value={registerFormData.licenseTokenIds}
                onChange={(e) =>
                  setRegisterFormData({ ...registerFormData, licenseTokenIds: e.target.value })
                }
                className="w-full rounded-md border border-gray-300 px-3 py-2"
                placeholder="Enter license token IDs separated by commas"
                required
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">IPFS CID</label>
              <input
                type="text"
                value={registerFormData.cid}
                onChange={(e) => setRegisterFormData({ ...registerFormData, cid: e.target.value })}
                className="w-full rounded-md border border-gray-300 px-3 py-2"
                placeholder="Enter IPFS CID"
                required
              />
              <p className="mt-1 text-xs text-gray-500">
                The entered CID will be stored in the mediaHash field of the IPA metadata.
              </p>
            </div>

            <div className="flex space-x-4">
              <button
                type="button"
                onClick={handleReset}
                className="flex-1 rounded-md bg-gray-500 px-4 py-2 text-white hover:bg-gray-600"
              >
                Back to Start
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 rounded-md bg-blue-500 px-4 py-2 text-white hover:bg-blue-600 disabled:bg-blue-300"
              >
                {loading ? 'Processing...' : 'Register Derivative IP'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Derivative IP registration result */}
      {registerResult && (
        <div className="mt-6 rounded-lg bg-white p-6 shadow-md">
          <h2 className="mb-4 text-xl font-bold">Registration Result</h2>
          <div className="rounded border border-green-400 bg-green-100 px-4 py-3 text-green-700">
            <p>
              <strong>IP ID:</strong> {registerResult.ipId}
            </p>
            <p>
              <strong>Token ID:</strong> {registerResult.tokenId}
            </p>
            <p>
              <strong>Transaction Hash:</strong> {registerResult.txHash}
            </p>
          </div>
          <button
            onClick={handleReset}
            className="mt-4 w-full rounded-md bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
          >
            Start Over
          </button>
        </div>
      )}
    </div>
  );
}

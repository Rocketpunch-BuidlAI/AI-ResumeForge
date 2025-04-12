'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Plus, Trash2 } from 'lucide-react';
import { useSession } from 'next-auth/react';

interface LicenseInfo {
  licenseTermsId: string;
  licensorIpId: string;
  maxMintingFee: string;
}

export default function DerivativePage() {
  const [licenseInfos, setLicenseInfos] = useState<LicenseInfo[]>([
    { licenseTermsId: '', licensorIpId: '', maxMintingFee: '' },
  ]);
  const [formData, setFormData] = useState({
    email: '',
    cid: '',
  });
  const [response, setResponse] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const { data: session } = useSession();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch('/api/story/child', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          licenseInfos,
          cid: formData.cid,
          userId: session?.user?.id,
        }),
      });

      const data = await response.json();
      if (response.ok) {
        setResponse(data);
        toast.success('Derivative IP asset has been successfully registered');
      } else {
        toast.error(data.error || 'Failed to register derivative IP asset');
      }
    } catch (error) {
      toast.error('An error occurred');
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleLicenseInfoChange = (index: number, field: keyof LicenseInfo, value: string) => {
    setLicenseInfos((prev) => {
      const newLicenseInfos = [...prev];
      newLicenseInfos[index] = {
        ...newLicenseInfos[index],
        [field]: value,
      };
      return newLicenseInfos;
    });
  };

  const addLicenseInfo = () => {
    setLicenseInfos((prev) => [
      ...prev,
      { licenseTermsId: '', licensorIpId: '', maxMintingFee: '' },
    ]);
  };

  const removeLicenseInfo = (index: number) => {
    setLicenseInfos((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="container mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle>Derivative IP Asset Registration</CardTitle>
          <CardDescription>
            Register a derivative IP asset using the original IP asset and license tokens.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {licenseInfos.map((licenseInfo, index) => (
              <div key={index} className="space-y-4 rounded-lg border p-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">License Info {index + 1}</h3>
                  {index > 0 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeLicenseInfo(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`licenseTermsId-${index}`}>License Terms ID</Label>
                  <Input
                    id={`licenseTermsId-${index}`}
                    value={licenseInfo.licenseTermsId}
                    onChange={(e) =>
                      handleLicenseInfoChange(index, 'licenseTermsId', e.target.value)
                    }
                    placeholder="1300"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`licensorIpId-${index}`}>Licensor IP ID</Label>
                  <Input
                    id={`licensorIpId-${index}`}
                    value={licenseInfo.licensorIpId}
                    onChange={(e) => handleLicenseInfoChange(index, 'licensorIpId', e.target.value)}
                    placeholder="0x7A348A2d734C30c7D2abEe6FBaA3C0dF73a407a2"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`maxMintingFee-${index}`}>Max Minting Fee</Label>
                  <Input
                    id={`maxMintingFee-${index}`}
                    type="number"
                    value={licenseInfo.maxMintingFee}
                    onChange={(e) =>
                      handleLicenseInfoChange(index, 'maxMintingFee', e.target.value)
                    }
                    placeholder="0"
                    required
                  />
                  <p className="text-muted-foreground text-sm">
                    Enter the maximum minting fee in wei. Set to 0 to disable.
                  </p>
                </div>
              </div>
            ))}

            <Button type="button" variant="outline" onClick={addLicenseInfo} className="w-full">
              <Plus className="mr-2 h-4 w-4" />
              Add License Info
            </Button>

            <div className="space-y-2">
              <Label htmlFor="email">Recipient Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="user@example.com"
                required
              />
              <p className="text-muted-foreground text-sm">
                Enter the email address of the recipient who will receive the license token.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="cid">IPFS CID</Label>
              <Input
                id="cid"
                name="cid"
                value={formData.cid}
                onChange={handleChange}
                placeholder="Qm..."
                required
              />
            </div>

            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Registering...' : 'Register Derivative IP Asset'}
            </Button>
          </form>

          {response && (
            <div className="mt-6 space-y-2">
              <h3 className="text-lg font-semibold">Registration Result</h3>
              <pre className="bg-muted overflow-auto rounded-md p-4">
                {JSON.stringify(response, null, 2)}
              </pre>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';

export default function DerivativePage() {
  const [formData, setFormData] = useState({
    email: '',
    licenseTermsId: '',
    licensorIpId: '',
    cid: '',
    maxMintingFee: '',
  });
  const [response, setResponse] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const res = await fetch('/api/story/child', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (res.ok) {
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
            <div className="space-y-2">
              <Label htmlFor="licenseTermsId">License Terms ID</Label>
              <Input
                id="licenseTermsId"
                name="licenseTermsId"
                value={formData.licenseTermsId}
                onChange={handleChange}
                placeholder="1300"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="licensorIpId">Licensor IP ID</Label>
              <Input
                id="licensorIpId"
                name="licensorIpId"
                value={formData.licensorIpId}
                onChange={handleChange}
                placeholder="0x7A348A2d734C30c7D2abEe6FBaA3C0dF73a407a2"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="maxMintingFee">Max Minting Fee (in ETH)</Label>
              <Input
                id="maxMintingFee"
                name="maxMintingFee"
                type="number"
                value={formData.maxMintingFee}
                onChange={handleChange}
                placeholder="0"
                required
              />
              <p className="text-muted-foreground text-sm">
                Enter the maximum minting fee in wei. Set to 0 to disable.
              </p>
            </div>

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

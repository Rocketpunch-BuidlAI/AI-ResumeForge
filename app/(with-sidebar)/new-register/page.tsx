'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

export default function NewRegisterPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    spgNftContract: '',
    parentIpIds: '',
    licenseTermsIds: '',
    ipMetadataURI: '',
  });
  const [response, setResponse] = useState(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch('/api/story/new-register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          spgNftContract: formData.spgNftContract,
          parentIpIds: formData.parentIpIds.split(',').map(id => id.trim()),
          licenseTermsIds: formData.licenseTermsIds.split(',').map(id => id.trim()),
          ipMetadataURI: formData.ipMetadataURI,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to create derivative IP');
      }

      setResponse(data);
      toast.success('Derivative IP created successfully');
    } catch (error) {
      console.error('Error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to create derivative IP');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle>Create Derivative IP</CardTitle>
          <CardDescription>
            Create a derivative IP asset from an existing IP asset.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="spgNftContract">SPG NFT Contract Address</Label>
              <Input
                id="spgNftContract"
                value={formData.spgNftContract}
                onChange={(e) => setFormData({ ...formData, spgNftContract: e.target.value })}
                placeholder="0x..."
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="parentIpIds">Parent IP IDs (comma-separated)</Label>
              <Input
                id="parentIpIds"
                value={formData.parentIpIds}
                onChange={(e) => setFormData({ ...formData, parentIpIds: e.target.value })}
                placeholder="0x..., 0x..."
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="licenseTermsIds">License Terms IDs (comma-separated)</Label>
              <Input
                id="licenseTermsIds"
                value={formData.licenseTermsIds}
                onChange={(e) => setFormData({ ...formData, licenseTermsIds: e.target.value })}
                placeholder="1, 2, 3"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="ipMetadataURI">IP Metadata URI</Label>
              <Input
                id="ipMetadataURI"
                value={formData.ipMetadataURI}
                onChange={(e) => setFormData({ ...formData, ipMetadataURI: e.target.value })}
                placeholder="ipfs://..."
                required
              />
            </div>

            <Button type="submit" disabled={isLoading} className="w-full">
              {isLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Create Derivative IP
            </Button>
          </form>

          {response && (
            <div className="mt-6 space-y-2">
              <h3 className="text-lg font-semibold">Result</h3>
              <pre className="bg-muted p-4 rounded-md overflow-auto">
                {JSON.stringify(response, null, 2)}
              </pre>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

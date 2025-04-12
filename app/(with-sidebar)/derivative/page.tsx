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
    tokenId: '',
    licenseTokenIds: '',
    cid: '',
  });
  const [response, setResponse] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const res = await fetch('/api/story/derivative', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (res.ok) {
        setResponse(data);
        toast.success('파생 IP 자산이 성공적으로 등록되었습니다.');
      } else {
        toast.error(data.error || '파생 IP 자산 등록에 실패했습니다.');
      }
    } catch (error) {
      toast.error('오류가 발생했습니다.');
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  return (
    <div className="container mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle>파생 IP 자산 등록</CardTitle>
          <CardDescription>
            원본 IP 자산과 라이선스 토큰을 사용하여 파생 IP 자산을 등록합니다.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">이메일</Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="user@example.com"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="tokenId">토큰 ID</Label>
              <Input
                id="tokenId"
                name="tokenId"
                value={formData.tokenId}
                onChange={handleChange}
                placeholder="1"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="licenseTokenIds">라이선스 토큰 ID들</Label>
              <Input
                id="licenseTokenIds"
                name="licenseTokenIds"
                value={formData.licenseTokenIds}
                onChange={handleChange}
                placeholder="1,2,3"
                required
              />
              <p className="text-sm text-muted-foreground">
                콤마로 구분하여 여러 라이선스 토큰 ID를 입력하세요.
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
              {isLoading ? '등록 중...' : '파생 IP 자산 등록'}
            </Button>
          </form>

          {response && (
            <div className="mt-6 space-y-2">
              <h3 className="text-lg font-semibold">등록 결과</h3>
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
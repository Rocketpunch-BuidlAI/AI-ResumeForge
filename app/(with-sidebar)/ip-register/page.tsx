'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';

export default function IpRegisterPage() {
  const { data: session } = useSession();
  const [formData, setFormData] = useState({
    email: '',
    cid: '',
  });
  const [response, setResponse] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!session?.user?.id) {
      toast.error('로그인이 필요합니다.');
      return;
    }

    setIsLoading(true);

    try {
      // 1. 이메일로 지갑 주소 조회
      const walletResponse = await fetch('/api/privy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: formData.email }),
      });

      if (!walletResponse.ok) {
        throw new Error('지갑 주소 조회에 실패했습니다.');
      }

      const walletData = await walletResponse.json();
      const walletAddress = walletData.wallets[0].address;

      // 2. IP 자산 등록
      const registerResponse = await fetch('/api/story', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          cid: formData.cid,
          walletAddress,
          userId: session.user.id,
        }),
      });

      if (!registerResponse.ok) {
        const errorData = await registerResponse.json();
        throw new Error(errorData.error || 'IP 자산 등록에 실패했습니다.');
      }

      const registerData = await registerResponse.json();
      setResponse(registerData);
      toast.success('IP 자산이 성공적으로 등록되었습니다.');
    } catch (error) {
      console.error('Registration error:', error);
      toast.error(error instanceof Error ? error.message : 'IP 자산 등록에 실패했습니다.');
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
          <CardTitle>IP 자산 등록</CardTitle>
          <CardDescription>
            IPFS에 업로드된 파일을 IP 자산으로 등록합니다.
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

            <Button type="submit" disabled={isLoading || !session?.user?.id}>
              {isLoading ? '등록 중...' : 'IP 자산 등록'}
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

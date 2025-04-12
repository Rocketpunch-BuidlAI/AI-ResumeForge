'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';

const translations = {
  title: {
    ko: '파생 IP 자산 등록',
    en: 'Derivative IP Asset Registration',
  },
  description: {
    ko: '원본 IP 자산과 라이선스 토큰을 사용하여 파생 IP 자산을 등록합니다.',
    en: 'Register a derivative IP asset using the original IP asset and license tokens.',
  },
  email: {
    ko: '이메일',
    en: 'Email',
  },
  tokenId: {
    ko: '토큰 ID',
    en: 'Token ID',
  },
  licenseTokenIds: {
    ko: '라이선스 토큰 ID들',
    en: 'License Token IDs',
  },
  licenseTokenIdsDescription: {
    ko: '콤마로 구분하여 여러 라이선스 토큰 ID를 입력하세요.',
    en: 'Enter multiple license token IDs separated by commas.',
  },
  cid: {
    ko: 'IPFS CID',
    en: 'IPFS CID',
  },
  submit: {
    ko: '파생 IP 자산 등록',
    en: 'Register Derivative IP Asset',
  },
  loading: {
    ko: '등록 중...',
    en: 'Registering...',
  },
  result: {
    ko: '등록 결과',
    en: 'Registration Result',
  },
  success: {
    ko: '파생 IP 자산이 성공적으로 등록되었습니다.',
    en: 'Derivative IP asset has been successfully registered.',
  },
  error: {
    ko: '파생 IP 자산 등록에 실패했습니다.',
    en: 'Failed to register derivative IP asset.',
  },
};

export default function DerivativePage() {
  const [formData, setFormData] = useState({
    email: '',
    tokenId: '',
    licenseTokenIds: '',
    cid: '',
  });
  const [response, setResponse] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [language, setLanguage] = useState<'ko' | 'en'>('ko');

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
        toast.success(translations.success[language]);
      } else {
        toast.error(data.error || translations.error[language]);
      }
    } catch (error) {
      toast.error(translations.error[language]);
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
      <div className="mb-4 flex justify-end">
        <Button
          variant="outline"
          onClick={() => setLanguage(language === 'ko' ? 'en' : 'ko')}
        >
          {language === 'ko' ? 'English' : '한국어'}
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{translations.title[language]}</CardTitle>
          <CardDescription>
            {translations.description[language]}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">{translations.email[language]}</Label>
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
              <Label htmlFor="tokenId">{translations.tokenId[language]}</Label>
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
              <Label htmlFor="licenseTokenIds">{translations.licenseTokenIds[language]}</Label>
              <Input
                id="licenseTokenIds"
                name="licenseTokenIds"
                value={formData.licenseTokenIds}
                onChange={handleChange}
                placeholder="1,2,3"
                required
              />
              <p className="text-sm text-muted-foreground">
                {translations.licenseTokenIdsDescription[language]}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="cid">{translations.cid[language]}</Label>
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
              {isLoading ? translations.loading[language] : translations.submit[language]}
            </Button>
          </form>

          {response && (
            <div className="mt-6 space-y-2">
              <h3 className="text-lg font-semibold">{translations.result[language]}</h3>
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
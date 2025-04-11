'use client';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { startTransition, useActionState } from 'react';
import { login } from '@/app/actions/auth';
import Link from 'next/link';
import { useLoginWithEmail } from '@privy-io/react-auth';
import { useState, useCallback } from 'react';
import { EmailVerificationDialog } from './email-verification-dialog';

export function LoginForm({ className, ...props }: React.ComponentPropsWithoutRef<'form'>) {
  const { sendCode } = useLoginWithEmail();
  const [state, formAction, isPending] = useActionState(login, null);
  const [showVerificationDialog, setShowVerificationDialog] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isVerifiying, setIsVerifiying] = useState(false);
  console.log(state);

  const handleSubmit = useCallback(
    async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      setIsVerifiying(true);
      const formData = new FormData(e.currentTarget);
      const email = formData.get('email') as string;
      const password = formData.get('password') as string;

      setEmail(email);
      setPassword(password);
      setError('');

      try {
        // 먼저 이메일과 비밀번호 확인
        const response = await fetch('/api/check-credentials', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email, password }),
        });

        const data = await response.json();

        if (!data.success) {
          setError(data.error || 'Invalid email or password');
          return;
        }

        // 자격 증명이 확인된 후에만 인증 코드 전송
        await sendCode({ email });
        setShowVerificationDialog(true);
      } catch (error) {
        console.error('Failed to send verification code:', error);
        setError('Failed to send verification code. Please try again.');
      } finally {
        setIsVerifiying(false);
      }
    },
    [sendCode]
  );

  const handleVerificationSuccess = useCallback(() => {
    startTransition(() => {
      formAction({ email, password });
    });
  }, [email, formAction, password]);

  return (
    <div className="flex flex-col gap-6">
      <form className={cn('flex flex-col gap-6', className)} onSubmit={handleSubmit} {...props}>
        <div className="flex flex-col items-center gap-2 text-center">
          <h1 className="text-2xl font-bold">Login to your account</h1>
          <p className="text-muted-foreground text-sm text-balance">
            Enter your email below to login to your account
          </p>
        </div>
        {error && <div className="text-center text-sm text-red-500">{error}</div>}
        <div className="grid gap-6">
          <div className="grid gap-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" placeholder="m@example.com" required />
          </div>
          <div className="grid gap-2">
            <div className="flex items-center">
              <Label htmlFor="password">Password</Label>
              <a href="#" className="ml-auto text-sm underline-offset-4 hover:underline">
                Forgot your password?
              </a>
            </div>
            <Input id="password" name="password" type="password" required />
          </div>
          <Button
            type="submit"
            className="w-full cursor-pointer"
            disabled={isPending || isVerifiying}
          >
            {isPending ? 'Processing...' : isVerifiying ? 'Verifying...' : 'Login'}
          </Button>
        </div>
      </form>
      <div className="text-center text-sm">
        Don&apos;t have an account?{' '}
        <Link href="/signup" className="underline underline-offset-4">
          Sign up
        </Link>
      </div>
      <EmailVerificationDialog
        email={email}
        isOpen={showVerificationDialog}
        onOpenChange={setShowVerificationDialog}
        onVerificationSuccess={handleVerificationSuccess}
      />
    </div>
  );
}

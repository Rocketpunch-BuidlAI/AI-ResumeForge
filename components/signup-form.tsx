'use client';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useActionState } from 'react';
import { signup, checkEmail, checkPassword } from '@/app/actions/auth';
import Link from 'next/link';
import { useLoginWithEmail } from '@privy-io/react-auth';
import { useState, startTransition, useCallback } from 'react';
import { EmailVerificationDialog } from './email-verification-dialog';
interface SignupFormProps extends React.ComponentPropsWithoutRef<'form'> {
  className?: string;
}

export function SignupForm({ className, ...props }: SignupFormProps) {
  const { sendCode } = useLoginWithEmail();
  const [state, formAction, isPending] = useActionState(signup, null);
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
      const confirmPassword = formData.get('confirm-password') as string;

      const passwordCheckResult = await checkPassword(password, confirmPassword);
      if (passwordCheckResult.error) {
        setError(passwordCheckResult.error);
        setIsVerifiying(false);
        return;
      }

      const emailCheckResult = await checkEmail(email);
      if (emailCheckResult.error) {
        setError(emailCheckResult.error);
        setIsVerifiying(false);
        return;
      }

      setEmail(email);
      setPassword(password);
      setError('');

      try {
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
  }, [password, email, formAction]);

  return (
    <div className="flex flex-col gap-6">
      <form className={cn('flex flex-col', className)} onSubmit={handleSubmit} {...props}>
        <div className="mb-3 flex flex-col items-center gap-2 text-center">
          <h1 className="text-2xl font-bold">Create Account</h1>
          <p className="text-muted-foreground text-sm text-balance">
            Enter your information below to create your account
          </p>
        </div>
        {error && <div className="text-center text-sm text-red-500">{error}</div>}
        <div className="mt-3 grid gap-6">
          <div className="grid gap-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="example@example.com"
              required
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="password">Password</Label>
            <Input id="password" name="password" type="password" required />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="confirm-password">Confirm Password</Label>
            <Input id="confirm-password" name="confirm-password" type="password" required />
          </div>
          <Button
            type="submit"
            className="w-full cursor-pointer"
            disabled={isPending || isVerifiying}
          >
            {isPending ? 'Processing...' : isVerifiying ? 'Verifying...' : 'Sign Up'}
          </Button>
        </div>
        <div className="mt-6 text-center text-sm">
          Already have an account?{' '}
          <Link href="/login" className="underline underline-offset-4">
            Sign in
          </Link>
        </div>
      </form>
      <EmailVerificationDialog
        email={email}
        isOpen={showVerificationDialog}
        onOpenChange={setShowVerificationDialog}
        onVerificationSuccess={handleVerificationSuccess}
      />
    </div>
  );
}

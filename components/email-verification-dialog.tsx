import { useState } from 'react';
import { useLoginWithEmail } from '@privy-io/react-auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface EmailVerificationDialogProps {
  email: string;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onVerificationSuccess: () => void;
}

export function EmailVerificationDialog({
  email,
  isOpen,
  onOpenChange,
  onVerificationSuccess,
}: EmailVerificationDialogProps) {
  const { loginWithCode } = useLoginWithEmail();
  const [verificationCode, setVerificationCode] = useState('');
  const [verificationError, setVerificationError] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);

  const handleVerification = async () => {
    setIsVerifying(true);
    setVerificationError('');

    try {
      console.log('Verification code:', verificationCode);
      await loginWithCode({ code: verificationCode });
      onVerificationSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error('Verification failed:', error);
      setVerificationError('Invalid verification code. Please try again.');
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Email Verification</DialogTitle>
          <DialogDescription>Please enter the verification code sent to {email}</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 pt-4">
          <div className="grid gap-2">
            <Label htmlFor="verification-code">Verification Code</Label>
            <Input
              id="verification-code"
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value)}
              placeholder="Enter verification code"
              maxLength={6}
            />
            {verificationError && <p className="text-sm text-red-500">{verificationError}</p>}
          </div>
          <Button
            className="w-full cursor-pointer"
            onClick={handleVerification}
            disabled={isVerifying}
          >
            {isVerifying ? (
              <>
                <svg
                  className="mr-3 -ml-1 h-5 w-5 animate-spin text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Verifying...
              </>
            ) : (
              'Verify'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

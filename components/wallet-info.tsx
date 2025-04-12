import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Wallet, Copy, ExternalLink, Clock, CheckCircle2, ArrowUpRight, ArrowDownLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useState } from 'react';

interface WalletInfoProps {
  address: string;
  totalReward: number;
}

export function WalletInfo({ address, totalReward }: WalletInfoProps) {
  const [copied, setCopied] = useState(false);

  // Creating mock data for gas info and wallet info
  const mockGasInfo = {
    standard: '21',
    fast: '25',
    rapid: '30',
  };

  const mockTransactions = [
    { type: 'in', amount: '0.1', date: 'Yesterday', status: 'completed' },
    { type: 'out', amount: '0.05', date: '3 days ago', status: 'completed' },
  ];

  // Function to copy wallet address
  const copyAddress = () => {
    navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Display shortened address (first 6 chars + ... + last 4 chars)
  const shortAddress = `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between gap-2 text-xl">
          <div className="flex items-center gap-2">
            <Wallet className="h-5 w-5 text-primary" />
            Wallet Info
          </div>
          <Badge variant="outline" className="px-2 py-0.5 text-xs">
            <span className="size-2 rounded-full bg-green-500 mr-1"></span>Connected
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="space-y-2">
            <h3 className="text-muted-foreground text-xs font-medium">Wallet Address</h3>
            <div className="flex items-center gap-1.5">
              <p className="text-sm font-medium">{shortAddress}</p>
              <div className="flex items-center gap-1">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={copyAddress}>
                        {copied ? <CheckCircle2 className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>{copied ? 'Copied!' : 'Copy Address'}</TooltipContent>
                  </Tooltip>
                </TooltipProvider>

                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => window.open(`https://etherscan.io/address/${address}`, '_blank')}
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>View on Etherscan</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </div>
          </div>
          
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-muted-foreground text-xs font-medium">Total Reward Amount</h3>
              <p className="text-2xl font-bold">{totalReward} ETH</p>
            </div>
            <div className="text-right">
              <h3 className="text-muted-foreground text-xs font-medium">USD Equivalent</h3>
              <p className="text-lg font-medium">$3,415.20</p>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-muted-foreground text-xs font-medium">Current Gas Fee</h3>
              <Badge variant="secondary" className="flex items-center gap-1 px-2 py-0.5 text-xs">
                <Clock className="h-3 w-3" /> Updated 5 mins ago
              </Badge>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div className="rounded-md border p-2 text-center">
                <p className="text-muted-foreground text-xs">Standard</p>
                <p className="text-sm font-medium">{mockGasInfo.standard} Gwei</p>
              </div>
              <div className="rounded-md border bg-primary/5 p-2 text-center">
                <p className="text-muted-foreground text-xs">Fast</p>
                <p className="text-sm font-medium">{mockGasInfo.fast} Gwei</p>
              </div>
              <div className="rounded-md border p-2 text-center">
                <p className="text-muted-foreground text-xs">Rapid</p>
                <p className="text-sm font-medium">{mockGasInfo.rapid} Gwei</p>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="text-muted-foreground text-xs font-medium">Recent Transactions</h3>
            <div className="space-y-2">
              {mockTransactions.map((tx, index) => (
                <div key={index} className="flex items-center justify-between rounded-md border p-2">
                  <div className="flex items-center gap-2">
                    <div className={cn(
                      "flex h-6 w-6 items-center justify-center rounded-full",
                      tx.type === 'in' ? "bg-green-100" : "bg-orange-100"
                    )}>
                      {tx.type === 'in' ? (
                        <ArrowDownLeft className="h-3.5 w-3.5 text-green-600" />
                      ) : (
                        <ArrowUpRight className="h-3.5 w-3.5 text-orange-600" />
                      )}
                    </div>
                    <div>
                      <p className="text-xs font-medium">
                        {tx.type === 'in' ? 'Received' : 'Sent'}
                      </p>
                      <p className="text-muted-foreground text-xs">{tx.date}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-medium">
                      {tx.type === 'in' ? '+' : '-'}{tx.amount} ETH
                    </p>
                    <p className="text-muted-foreground text-xs">
                      {tx.status === 'completed' ? (
                        <span className="flex items-center justify-end gap-0.5 text-green-600">
                          <CheckCircle2 className="h-3 w-3" /> Completed
                        </span>
                      ) : (
                        <span className="flex items-center justify-end gap-0.5 text-orange-600">
                          <Clock className="h-3 w-3" /> In Progress
                        </span>
                      )}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <Button variant="outline" size="sm" className="w-full">
            <ExternalLink className="mr-1 h-3.5 w-3.5" />
            View All Transactions
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

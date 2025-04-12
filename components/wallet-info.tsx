import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Wallet, Copy, ExternalLink, CheckCircle2, ArrowDownLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Skeleton } from '@/components/ui/skeleton';

interface WalletInfoProps {
  address: string;
}

interface RecentRoyalty {
  id: number;
  amount: number;
  date: string;
  txHash: string;
}

export function WalletInfo({ address }: WalletInfoProps) {
  const [copied, setCopied] = useState(false);
  const [totalReward, setTotalReward] = useState(0);
  const [recentRoyalties, setRecentRoyalties] = useState<RecentRoyalty[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { data: session } = useSession();

  useEffect(() => {
    const fetchData = async () => {
      if (session?.user?.id) {
        try {
          setIsLoading(true);
          // Total rewards 가져오기
          const rewardsResponse = await fetch(`/api/home/rewards?userId=${session.user.id}`);
          const rewardsData = await rewardsResponse.json();
          setTotalReward(rewardsData.totalRewards);

          // Recent royalties 가져오기
          const royaltiesResponse = await fetch(`/api/home/recent-royalties?userId=${session.user.id}`);
          const royaltiesData = await royaltiesResponse.json();
          setRecentRoyalties(royaltiesData);
        } catch (error) {
          console.error('Error fetching data:', error);
        } finally {
          setIsLoading(false);
        }
      }
    };

    fetchData();
  }, [session?.user?.id]);

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
              {isLoading ? (
                <Skeleton className="h-5 w-24" />
              ) : (
                <p className="text-sm font-medium">{shortAddress}</p>
              )}
              <div className="flex items-center gap-1">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-6 w-6" 
                        onClick={copyAddress}
                        disabled={isLoading}
                      >
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
                        onClick={() => window.open(`https://aeneid.storyscan.io/address/${address}`, '_blank')}
                        disabled={isLoading}
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>View on Storyscan</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </div>
          </div>
          
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-muted-foreground text-xs font-medium">Total Reward Amount</h3>
              {isLoading ? (
                <Skeleton className="h-8 w-35" />
              ) : (
                <p className="text-2xl font-bold">{totalReward} ETH</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="text-muted-foreground text-xs font-medium">Recent Royalties</h3>
            <div className="space-y-2">
              {isLoading ? (
                <>
                  <Skeleton className="h-[50px] w-full" />
                  <Skeleton className="h-[50px] w-full" />
                  <Skeleton className="h-[50px] w-full" />
                  <Skeleton className="h-[50px] w-full" />
                  <Skeleton className="h-[50px] w-full" />
                </>
              ) : (
                <>
                  {recentRoyalties.map((royalty) => (
                    <div key={royalty.id} className="flex items-center justify-between rounded-md border p-2">
                      <div className="flex items-center gap-2">
                        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-green-100">
                          <ArrowDownLeft className="h-3.5 w-3.5 text-green-600" />
                        </div>
                        <div>
                          <p className="text-xs font-medium">Received</p>
                          <p className="text-muted-foreground text-xs">{royalty.date}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-medium">+{royalty.amount} ETH</p>
                        <p className="text-muted-foreground text-xs">
                          <span className="flex items-center justify-end gap-0.5 text-green-600">
                            <CheckCircle2 className="h-3 w-3" /> Completed
                          </span>
                        </p>
                      </div>
                    </div>
                  ))}
                </>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

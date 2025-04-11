import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Wallet } from "lucide-react"

interface WalletInfoProps {
  address: string
  totalReward: number
}

export function WalletInfo({ address, totalReward }: WalletInfoProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wallet className="h-5 w-5" />
          지갑 정보
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-medium text-muted-foreground">지갑 주소</h3>
            <p className="text-sm break-all">{address}</p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-muted-foreground">총 보상 금액</h3>
            <p className="text-2xl font-bold">{totalReward} ETH</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
} 
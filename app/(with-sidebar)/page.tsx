import { ResumeTable } from '@/components/resume-table';
import { WalletInfo } from '@/components/wallet-info';
import { RewardChart } from '@/components/reward-chart';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// 임시 데이터
const mockResumes = [
  {
    id: '1',
    fileName: '프론트엔드 개발자 이력서.pdf',
    rewardAmount: 0.5,
    referenceCount: 10,
    createdAt: '2024-04-01',
    updatedAt: '2024-04-10',
  },
  {
    id: '2',
    fileName: '백엔드 개발자 이력서.pdf',
    rewardAmount: 0.3,
    referenceCount: 5,
    createdAt: '2024-04-05',
    updatedAt: '2024-04-08',
  },
];

const mockRewardData = [
  { date: '2024-04-01', amount: 0.5 },
  { date: '2024-04-05', amount: 0.3 },
  { date: '2024-04-10', amount: 0.2 },
];

export default function Page() {
  return (
    <div className="flex flex-1 flex-col gap-4 p-4">
      <div className="grid gap-4 md:grid-cols-2">
        <WalletInfo address="0x1234...5678" totalReward={1.0} />
        <div className="rounded-xl border p-4">
          <h3 className="mb-4 text-lg font-semibold">보상 이력</h3>
          <RewardChart data={mockRewardData} />
        </div>
      </div>
      <Tabs defaultValue="resumes">
        <TabsList>
          <TabsTrigger value="resumes">자기소개서 목록</TabsTrigger>
          <TabsTrigger value="rewards">보상 이력</TabsTrigger>
        </TabsList>
        <TabsContent value="resumes">
          <ResumeTable resumes={mockResumes} />
        </TabsContent>
        <TabsContent value="rewards">
          <div className="rounded-xl border p-4">
            <RewardChart data={mockRewardData} />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

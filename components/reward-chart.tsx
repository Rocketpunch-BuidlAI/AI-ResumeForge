'use client';

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

interface RewardData {
  date: string;
  amount: number;
}

interface RewardChartProps {
  data: RewardData[];
}

export function RewardChart({ data }: RewardChartProps) {
  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" tickFormatter={(value) => new Date(value).toLocaleDateString()} />
          <YAxis />
          <Tooltip
            formatter={(value: number) => [`${value} ETH`, '보상 금액']}
            labelFormatter={(label) => new Date(label).toLocaleDateString()}
          />
          <Line type="monotone" dataKey="amount" stroke="#8884d8" strokeWidth={2} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

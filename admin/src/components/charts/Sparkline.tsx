import { LineChart, Line } from 'recharts';

interface SparklineProps {
  data: number[];
  color?: string;
  height?: number;
}

export function Sparkline({ data, color = '#6b7280', height = 32 }: SparklineProps) {
  const chartData = data.map((v, i) => ({ i, v }));
  return (
    <LineChart width={80} height={height} data={chartData}>
      <Line type="monotone" dataKey="v" stroke={color} strokeWidth={1.5} dot={false} isAnimationActive={false} />
    </LineChart>
  );
}

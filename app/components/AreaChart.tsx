import {
  AreaChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  Area
} from 'recharts';

interface AreaMetric {
  name: string;
  Sales: number;
}

interface AreaChartProps {
  metrics?: AreaMetric[];
}

export function AreaChartDisplay({ metrics }: AreaChartProps) {
  // Debug logging
  console.log('AreaChartDisplay received:', {
    metricsLength: metrics?.length,
    sampleData: metrics?.[0],
    allMetrics: metrics
  });

  // Handle empty or missing data
  if (!metrics || metrics.length === 0) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <s-text color="subdued">No data available for this time period</s-text>
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={350}>
      <AreaChart
        data={metrics}
        margin={{
          top: 20,
          right: 30,
          left: 20,
          bottom: 5,
        }}
      >
        <XAxis dataKey="name" />
        <YAxis />
        <Tooltip />
        <Area
          type="monotone"
          dataKey="Sales"
          stroke="#8884d8"
          fill="#8884d8"
          fillOpacity={0.6}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
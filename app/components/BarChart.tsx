import { BarChart, Bar, Rectangle, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface BarMetric {
  name: string;
  uv: number;
  pv: number;
  amt: number;
}

interface BarChartProps {
  metrics?: BarMetric[];
  title: string;
}
// #endregion
export function BarChartDisplay({ metrics, title }: BarChartProps) {
  return (
    <s-section heading={title}>
      <s-box border="base" borderRadius="base" padding="base">
        <ResponsiveContainer width="100%" height={250}>
          <BarChart
            style={{ width: '100%', maxWidth: '700px', maxHeight: '70vh', aspectRatio: 1.618 }}
            responsive
            data={metrics}
            margin={{
              top: 5,
              right: 0,
              left: 0,
              bottom: 5,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis width="auto" />
            <Tooltip />
            <Legend />
            <Bar dataKey="pv" fill="#8884d8" activeBar={<Rectangle fill="pink" stroke="blue" />} />
            <Bar dataKey="uv" fill="#82ca9d" activeBar={<Rectangle fill="gold" stroke="purple" />} />
          </BarChart>
        </ResponsiveContainer>
      </s-box>
    </s-section>
  );
};
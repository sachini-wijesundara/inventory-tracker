import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { format, parseISO } from 'date-fns';
import type { StockTrendPoint } from '../types';

interface Props {
  data: StockTrendPoint[];
  loading?: boolean;
}

export function StockTrendChart({ data, loading }: Props) {
  if (loading) {
    return (
      <div className="h-64 flex items-center justify-center">
        <div className="skeleton w-full h-48 rounded" />
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-ash font-mono text-sm">
        No movement data yet — record stock movements to see trends
      </div>
    );
  }

  const chartData = data.map(d => ({
    ...d,
    label: format(parseISO(d.date), 'MMM d'),
  }));

  return (
    <ResponsiveContainer width="100%" height={260}>
      <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
        <defs>
          <linearGradient id="colorIn" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#4DCFA0" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#4DCFA0" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="colorOut" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#FF5C5C" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#FF5C5C" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#1E1E2A" />
        <XAxis dataKey="label" tick={{ fill: '#8B8BA0', fontSize: 11 }} axisLine={{ stroke: '#4A4A60' }} />
        <YAxis tick={{ fill: '#8B8BA0', fontSize: 11 }} axisLine={{ stroke: '#4A4A60' }} />
        <Tooltip
          contentStyle={{ background: '#16161E', border: '1px solid #1E1E2A', borderRadius: 8, fontSize: 12 }}
          labelStyle={{ color: '#F4F3F0' }}
          itemStyle={{ color: '#B8B8CC' }}
        />
        <Legend wrapperStyle={{ fontSize: 12, color: '#8B8BA0' }} />
        <Area type="monotone" dataKey="stock_in" name="Stock In" stroke="#4DCFA0" fill="url(#colorIn)" strokeWidth={2} />
        <Area type="monotone" dataKey="stock_out" name="Stock Out" stroke="#FF5C5C" fill="url(#colorOut)" strokeWidth={2} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

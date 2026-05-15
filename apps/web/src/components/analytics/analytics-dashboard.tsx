'use client';

import { motion } from 'framer-motion';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, RadarChart,
  PolarGrid, PolarAngleAxis, Radar,
} from 'recharts';

const bountyByCategory = [
  { name: 'Bug Fix', value: 34, color: '#ef4444' },
  { name: 'Feature', value: 28, color: '#8b5cf6' },
  { name: 'Testing', value: 18, color: '#06b6d4' },
  { name: 'Docs', value: 12, color: '#10b981' },
  { name: 'Security', value: 8, color: '#f59e0b' },
];

const payoutData = [
  { month: 'Jan', amount: 12400 },
  { month: 'Feb', amount: 18200 },
  { month: 'Mar', amount: 15800 },
  { month: 'Apr', amount: 24600 },
  { month: 'May', amount: 31200 },
  { month: 'Jun', amount: 28900 },
];

const radarData = [
  { subject: 'Bug Fix', A: 85 },
  { subject: 'Feature', A: 72 },
  { subject: 'Testing', A: 90 },
  { subject: 'Security', A: 60 },
  { subject: 'Docs', A: 78 },
  { subject: 'DevOps', A: 55 },
];

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number }>; label?: string }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass rounded-xl p-3 text-xs border border-white/10">
      <div className="text-white/60 mb-1">{label}</div>
      <div className="text-white font-medium">${payload[0]?.value?.toLocaleString()}</div>
    </div>
  );
};

export function AnalyticsDashboard() {
  return (
    <div className="space-y-6 max-w-[1200px]">
      <div>
        <h1 className="text-2xl font-bold text-white">Analytics</h1>
        <p className="text-white/40 text-sm mt-1">Ecosystem metrics and insights</p>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Payouts', value: '$131,100', sub: 'All time' },
          { label: 'Avg Bounty Value', value: '$1,240', sub: 'Last 30 days' },
          { label: 'Success Rate', value: '78.4%', sub: 'Completed / Total' },
          { label: 'Avg Delivery', value: '6.2 days', sub: 'Median time' },
        ].map((kpi, i) => (
          <motion.div
            key={kpi.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            className="glass rounded-xl p-5"
          >
            <div className="text-2xl font-bold text-white mb-1">{kpi.value}</div>
            <div className="text-sm text-white/60">{kpi.label}</div>
            <div className="text-xs text-white/30 mt-0.5">{kpi.sub}</div>
          </motion.div>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Payout chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="lg:col-span-2 glass rounded-xl p-6"
        >
          <h3 className="text-sm font-semibold text-white mb-5">Monthly Payouts</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={payoutData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="month" tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="amount" fill="url(#barGradient)" radius={[4, 4, 0, 0]} />
              <defs>
                <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#8b5cf6" />
                  <stop offset="100%" stopColor="#6366f1" stopOpacity={0.6} />
                </linearGradient>
              </defs>
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Category pie */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="glass rounded-xl p-6"
        >
          <h3 className="text-sm font-semibold text-white mb-5">By Category</h3>
          <ResponsiveContainer width="100%" height={160}>
            <PieChart>
              <Pie
                data={bountyByCategory}
                cx="50%"
                cy="50%"
                innerRadius={45}
                outerRadius={70}
                paddingAngle={3}
                dataKey="value"
              >
                {bountyByCategory.map((entry, i) => (
                  <Cell key={i} fill={entry.color} fillOpacity={0.85} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-1.5 mt-2">
            {bountyByCategory.map((cat) => (
              <div key={cat.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ background: cat.color }} />
                  <span className="text-white/50">{cat.name}</span>
                </div>
                <span className="text-white/70">{cat.value}%</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Radar chart */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="glass rounded-xl p-6"
      >
        <h3 className="text-sm font-semibold text-white mb-5">Completion Rate by Category</h3>
        <ResponsiveContainer width="100%" height={280}>
          <RadarChart data={radarData}>
            <PolarGrid stroke="rgba(255,255,255,0.06)" />
            <PolarAngleAxis dataKey="subject" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }} />
            <Radar name="Rate" dataKey="A" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.15} strokeWidth={2} />
          </RadarChart>
        </ResponsiveContainer>
      </motion.div>
    </div>
  );
}

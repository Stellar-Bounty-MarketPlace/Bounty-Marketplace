'use client';

import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, DollarSign, Users, GitPullRequest, Star } from 'lucide-react';
import { cn } from '@bounty/ui';

const metrics = [
  {
    label: 'Total Value Locked',
    value: '$124,500',
    change: '+12.4%',
    trend: 'up',
    icon: DollarSign,
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/20',
  },
  {
    label: 'Active Bounties',
    value: '47',
    change: '+8',
    trend: 'up',
    icon: Star,
    color: 'text-violet-400',
    bg: 'bg-violet-500/10',
    border: 'border-violet-500/20',
  },
  {
    label: 'Contributors',
    value: '1,284',
    change: '+23',
    trend: 'up',
    icon: Users,
    color: 'text-cyan-400',
    bg: 'bg-cyan-500/10',
    border: 'border-cyan-500/20',
  },
  {
    label: 'PRs Verified',
    value: '892',
    change: '-3',
    trend: 'down',
    icon: GitPullRequest,
    color: 'text-amber-400',
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/20',
  },
];

export function DashboardMetrics() {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {metrics.map((metric, i) => (
        <motion.div
          key={metric.label}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.08 }}
          className="glass rounded-xl p-5 glass-hover"
        >
          <div className="flex items-start justify-between mb-4">
            <div className={cn('p-2 rounded-lg border', metric.bg, metric.border)}>
              <metric.icon className={cn('w-4 h-4', metric.color)} />
            </div>
            <div
              className={cn(
                'flex items-center gap-1 text-xs font-medium',
                metric.trend === 'up' ? 'text-emerald-400' : 'text-red-400',
              )}
            >
              {metric.trend === 'up' ? (
                <TrendingUp className="w-3 h-3" />
              ) : (
                <TrendingDown className="w-3 h-3" />
              )}
              {metric.change}
            </div>
          </div>
          <div className="text-2xl font-bold text-white mb-1">{metric.value}</div>
          <div className="text-xs text-white/40">{metric.label}</div>
        </motion.div>
      ))}
    </div>
  );
}

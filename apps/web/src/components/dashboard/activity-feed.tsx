'use client';

import { motion } from 'framer-motion';
import { GitMerge, DollarSign, UserPlus, AlertTriangle, Star } from 'lucide-react';
import { formatRelativeTime } from '@bounty/shared';

const activities = [
  {
    id: '1',
    type: 'BOUNTY_COMPLETED',
    icon: Star,
    color: 'text-emerald-400 bg-emerald-500/10',
    actor: 'bob-dev',
    subject: 'Fix memory leak in event handler',
    amount: '$800',
    time: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
  },
  {
    id: '2',
    type: 'PR_MERGED',
    icon: GitMerge,
    color: 'text-violet-400 bg-violet-500/10',
    actor: 'alice-rust',
    subject: 'Implement token vesting contract',
    amount: null,
    time: new Date(Date.now() - 23 * 60 * 1000).toISOString(),
  },
  {
    id: '3',
    type: 'PAYOUT_RELEASED',
    icon: DollarSign,
    color: 'text-cyan-400 bg-cyan-500/10',
    actor: 'stellar-foundation',
    subject: 'Add comprehensive test suite',
    amount: '$1,500',
    time: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
  },
  {
    id: '4',
    type: 'BOUNTY_ASSIGNED',
    icon: UserPlus,
    color: 'text-amber-400 bg-amber-500/10',
    actor: 'carol-dev',
    subject: 'Optimize AMM price calculation',
    amount: '$600',
    time: new Date(Date.now() - 4 * 3600 * 1000).toISOString(),
  },
  {
    id: '5',
    type: 'DISPUTE_OPENED',
    icon: AlertTriangle,
    color: 'text-red-400 bg-red-500/10',
    actor: 'dave-maintainer',
    subject: 'Security audit for oracle contract',
    amount: null,
    time: new Date(Date.now() - 6 * 3600 * 1000).toISOString(),
  },
];

const typeLabels: Record<string, string> = {
  BOUNTY_COMPLETED: 'completed bounty',
  PR_MERGED: 'merged PR for',
  PAYOUT_RELEASED: 'received payout for',
  BOUNTY_ASSIGNED: 'was assigned to',
  DISPUTE_OPENED: 'opened dispute on',
};

export function BountyActivityFeed() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="glass rounded-xl p-6"
    >
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-sm font-semibold text-white">Live Activity</h3>
        <div className="flex items-center gap-1.5 text-xs text-emerald-400">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          Live
        </div>
      </div>

      <div className="space-y-3">
        {activities.map((activity, i) => (
          <motion.div
            key={activity.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.06 }}
            className="flex items-start gap-3 p-3 rounded-lg hover:bg-white/[0.03] transition-colors"
          >
            <div className={`p-1.5 rounded-lg ${activity.color} shrink-0`}>
              <activity.icon className="w-3.5 h-3.5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-white/80">
                <span className="font-medium text-white">{activity.actor}</span>
                {' '}{typeLabels[activity.type]}{' '}
                <span className="text-white/60 truncate">{activity.subject}</span>
              </p>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-xs text-white/30">{formatRelativeTime(activity.time)}</span>
                {activity.amount && (
                  <span className="text-xs font-medium text-emerald-400">{activity.amount}</span>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

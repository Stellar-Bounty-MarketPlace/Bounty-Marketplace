'use client';

import { motion } from 'framer-motion';
import { Trophy } from 'lucide-react';
import { Badge } from '@bounty/ui';

const leaders = [
  { rank: 1, username: 'bob-dev', displayName: 'Bob Martinez', score: 1850, tier: 'EXPERT', earned: '$12,500', avatar: null },
  { rank: 2, username: 'alice-rust', displayName: 'Alice Chen', score: 1620, tier: 'EXPERT', earned: '$9,800', avatar: null },
  { rank: 3, username: 'carol-dev', displayName: 'Carol Kim', score: 1340, tier: 'TRUSTED', earned: '$7,200', avatar: null },
  { rank: 4, username: 'dave-sol', displayName: 'Dave Patel', score: 980, tier: 'TRUSTED', earned: '$5,100', avatar: null },
  { rank: 5, username: 'eve-wasm', displayName: 'Eve Torres', score: 720, tier: 'TRUSTED', earned: '$3,400', avatar: null },
];

const tierVariant: Record<string, 'newcomer' | 'contributor' | 'trusted' | 'expert' | 'elite'> = {
  NEWCOMER: 'newcomer',
  CONTRIBUTOR: 'contributor',
  TRUSTED: 'trusted',
  EXPERT: 'expert',
  ELITE: 'elite',
};

const rankColors = ['text-amber-400', 'text-slate-300', 'text-amber-600'];

export function ContributorLeaderboard() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.35 }}
      className="glass rounded-xl p-5"
    >
      <div className="flex items-center gap-2 mb-5">
        <Trophy className="w-4 h-4 text-amber-400" />
        <h3 className="text-sm font-semibold text-white">Top Contributors</h3>
      </div>

      <div className="space-y-2">
        {leaders.map((leader, i) => (
          <motion.div
            key={leader.username}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.06 }}
            className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-white/[0.04] transition-colors cursor-pointer"
          >
            <span className={`text-sm font-bold w-5 text-center ${rankColors[i] ?? 'text-white/30'}`}>
              {leader.rank}
            </span>
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="text-xs font-medium text-white truncate">{leader.displayName}</div>
              <div className="text-xs text-white/30">@{leader.username}</div>
            </div>
            <div className="text-right">
              <Badge variant={tierVariant[leader.tier] ?? 'newcomer'} className="text-[10px] px-1.5 py-0">
                {leader.tier}
              </Badge>
              <div className="text-xs text-white/40 mt-0.5">{leader.score} pts</div>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

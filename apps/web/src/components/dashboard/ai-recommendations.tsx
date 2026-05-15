'use client';

import { motion } from 'framer-motion';
import { Sparkles, ArrowRight } from 'lucide-react';
import Link from 'next/link';

const recommendations = [
  {
    id: '1',
    title: 'Fix memory leak in event handler',
    fitScore: 0.94,
    amount: '$800',
    reason: 'Expert in Rust, 3 similar fixes',
  },
  {
    id: '2',
    title: 'Implement token vesting contract',
    fitScore: 0.87,
    amount: '$2,500',
    reason: 'Soroban experience, high reputation',
  },
  {
    id: '3',
    title: 'Add comprehensive test suite',
    fitScore: 0.81,
    amount: '$1,200',
    reason: 'Testing specialist, fast delivery',
  },
];

export function AIRecommendations() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.25 }}
      className="glass rounded-xl p-5"
    >
      <div className="flex items-center gap-2 mb-5">
        <div className="p-1.5 rounded-lg bg-violet-500/10 border border-violet-500/20">
          <Sparkles className="w-3.5 h-3.5 text-violet-400" />
        </div>
        <h3 className="text-sm font-semibold text-white">AI Recommendations</h3>
      </div>

      <div className="space-y-3">
        {recommendations.map((rec, i) => (
          <motion.div
            key={rec.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: i * 0.1 }}
          >
            <Link href={`/bounties/${rec.id}`}>
              <div className="p-3 rounded-lg border border-white/[0.06] hover:border-violet-500/30 hover:bg-violet-500/5 transition-all group">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <p className="text-xs font-medium text-white leading-snug line-clamp-2">
                    {rec.title}
                  </p>
                  <ArrowRight className="w-3 h-3 text-white/20 group-hover:text-violet-400 shrink-0 mt-0.5 transition-colors" />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-white/40">{rec.reason}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-emerald-400">{rec.amount}</span>
                    <div className="flex items-center gap-1">
                      <div className="w-12 h-1 rounded-full bg-white/10 overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-violet-500 to-indigo-500 rounded-full"
                          style={{ width: `${rec.fitScore * 100}%` }}
                        />
                      </div>
                      <span className="text-[10px] text-violet-400">{Math.round(rec.fitScore * 100)}%</span>
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

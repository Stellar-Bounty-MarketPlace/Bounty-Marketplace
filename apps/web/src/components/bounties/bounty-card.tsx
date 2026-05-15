'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Clock, GitPullRequest, User, ExternalLink } from 'lucide-react';
import { Badge } from '@bounty/ui';
import { formatCurrency, formatRelativeTime } from '@bounty/shared';
import type { BountyStatus, BountyDifficulty, BountyCategory } from '@bounty/shared';

interface BountyCardProps {
  bounty: {
    id: string;
    title: string;
    description: string;
    status: BountyStatus;
    difficulty: BountyDifficulty;
    category: BountyCategory;
    amount: number;
    currency: string;
    tags: string[];
    repository: { fullName: string; language: string | null };
    creator: { displayName: string; avatarUrl: string | null; githubUsername: string };
    assignee: { user: { displayName: string; avatarUrl: string | null }; reputationTier: string } | null;
    createdAt: string;
    expiresAt: string | null;
    _count: { pullRequests: number };
  };
}

const statusConfig: Record<string, { label: string; variant: 'success' | 'warning' | 'info' | 'secondary' | 'destructive' }> = {
  OPEN: { label: 'Open', variant: 'success' },
  IN_PROGRESS: { label: 'In Progress', variant: 'warning' },
  IN_REVIEW: { label: 'In Review', variant: 'info' },
  COMPLETED: { label: 'Completed', variant: 'secondary' },
  DISPUTED: { label: 'Disputed', variant: 'destructive' },
  CANCELLED: { label: 'Cancelled', variant: 'secondary' },
};

const difficultyColors: Record<string, string> = {
  BEGINNER: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
  INTERMEDIATE: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
  ADVANCED: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
  EXPERT: 'text-red-400 bg-red-500/10 border-red-500/20',
};

export function BountyCard({ bounty }: BountyCardProps) {
  const status = statusConfig[bounty.status] ?? { label: bounty.status, variant: 'secondary' as const };

  return (
    <Link href={`/bounties/${bounty.id}`}>
      <motion.div
        whileHover={{ y: -2 }}
        className="glass rounded-xl p-5 glass-hover cursor-pointer group h-full flex flex-col"
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant={status.variant}>{status.label}</Badge>
            <span className={`text-xs px-2 py-0.5 rounded-full border ${difficultyColors[bounty.difficulty] ?? ''}`}>
              {bounty.difficulty}
            </span>
          </div>
          <div className="text-right shrink-0">
            <div className="text-lg font-bold text-white">
              {formatCurrency(bounty.amount, bounty.currency)}
            </div>
            <div className="text-xs text-white/30">{bounty.currency}</div>
          </div>
        </div>

        {/* Title */}
        <h3 className="text-sm font-semibold text-white mb-2 leading-snug group-hover:text-violet-300 transition-colors line-clamp-2">
          {bounty.title}
        </h3>

        {/* Description */}
        <p className="text-xs text-white/40 leading-relaxed mb-4 line-clamp-2 flex-1">
          {bounty.description}
        </p>

        {/* Tags */}
        <div className="flex flex-wrap gap-1.5 mb-4">
          {bounty.tags.slice(0, 4).map((tag) => (
            <span
              key={tag}
              className="text-xs px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-white/40"
            >
              {tag}
            </span>
          ))}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between text-xs text-white/30 pt-3 border-t border-white/[0.06]">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              <User className="w-3 h-3" />
              <span>{bounty.creator.githubUsername}</span>
            </div>
            <div className="flex items-center gap-1">
              <GitPullRequest className="w-3 h-3" />
              <span>{bounty._count.pullRequests}</span>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            <span>{formatRelativeTime(bounty.createdAt)}</span>
          </div>
        </div>

        {/* Repo */}
        <div className="mt-2 flex items-center gap-1 text-xs text-white/20">
          <ExternalLink className="w-3 h-3" />
          <span>{bounty.repository.fullName}</span>
          {bounty.repository.language && (
            <span className="ml-auto">{bounty.repository.language}</span>
          )}
        </div>
      </motion.div>
    </Link>
  );
}

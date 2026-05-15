'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Filter, SlidersHorizontal, Plus } from 'lucide-react';
import { Button, Input, Badge } from '@bounty/ui';
import { BountyCard } from './bounty-card';
import { BountyDifficulty, BountyCategory, BountyStatus } from '@bounty/shared';

const MOCK_BOUNTIES = [
  {
    id: '1',
    title: 'Implement token vesting contract with cliff period',
    description: 'Build a production-grade token vesting contract on Soroban with configurable cliff periods, linear vesting schedules, and emergency revocation capabilities.',
    status: BountyStatus.OPEN,
    difficulty: BountyDifficulty.ADVANCED,
    category: BountyCategory.FEATURE,
    amount: 2500,
    currency: 'USDC',
    tags: ['rust', 'soroban', 'defi'],
    repository: { fullName: 'stellar/soroban-examples', language: 'Rust' },
    creator: { displayName: 'Alice Chen', avatarUrl: null, githubUsername: 'alice-maintainer' },
    assignee: null,
    createdAt: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString(),
    expiresAt: new Date(Date.now() + 28 * 24 * 3600 * 1000).toISOString(),
    _count: { pullRequests: 2 },
  },
  {
    id: '2',
    title: 'Fix memory leak in WebSocket event subscription handler',
    description: 'Investigate and fix the memory leak reported in the WebSocket event subscription handler that causes OOM after ~48h of uptime.',
    status: BountyStatus.OPEN,
    difficulty: BountyDifficulty.INTERMEDIATE,
    category: BountyCategory.BUG_FIX,
    amount: 800,
    currency: 'USDC',
    tags: ['rust', 'memory', 'websocket'],
    repository: { fullName: 'stellar/soroban-examples', language: 'Rust' },
    creator: { displayName: 'Alice Chen', avatarUrl: null, githubUsername: 'alice-maintainer' },
    assignee: null,
    createdAt: new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString(),
    expiresAt: new Date(Date.now() + 25 * 24 * 3600 * 1000).toISOString(),
    _count: { pullRequests: 0 },
  },
  {
    id: '3',
    title: 'Add comprehensive test suite for AMM contract',
    description: 'Write a complete test suite covering edge cases, invariants, and fuzz testing for the automated market maker contract.',
    status: BountyStatus.IN_PROGRESS,
    difficulty: BountyDifficulty.ADVANCED,
    category: BountyCategory.TESTING,
    amount: 1500,
    currency: 'USDC',
    tags: ['rust', 'testing', 'amm'],
    repository: { fullName: 'stellar/soroban-examples', language: 'Rust' },
    creator: { displayName: 'Alice Chen', avatarUrl: null, githubUsername: 'alice-maintainer' },
    assignee: { user: { displayName: 'Bob Martinez', avatarUrl: null }, reputationTier: 'EXPERT' },
    createdAt: new Date(Date.now() - 8 * 24 * 3600 * 1000).toISOString(),
    expiresAt: new Date(Date.now() + 22 * 24 * 3600 * 1000).toISOString(),
    _count: { pullRequests: 1 },
  },
  {
    id: '4',
    title: 'Improve documentation for Soroban SDK',
    description: 'Rewrite and expand the Soroban SDK documentation with better examples, tutorials, and API reference.',
    status: BountyStatus.OPEN,
    difficulty: BountyDifficulty.BEGINNER,
    category: BountyCategory.DOCUMENTATION,
    amount: 400,
    currency: 'USDC',
    tags: ['documentation', 'sdk'],
    repository: { fullName: 'stellar/soroban-sdk', language: 'Rust' },
    creator: { displayName: 'Stellar Foundation', avatarUrl: null, githubUsername: 'stellar-foundation' },
    assignee: null,
    createdAt: new Date(Date.now() - 1 * 24 * 3600 * 1000).toISOString(),
    expiresAt: new Date(Date.now() + 29 * 24 * 3600 * 1000).toISOString(),
    _count: { pullRequests: 0 },
  },
];

const difficultyFilters = Object.values(BountyDifficulty);
const categoryFilters = Object.values(BountyCategory).slice(0, 6);

export function BountyExplorer() {
  const [search, setSearch] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const filtered = MOCK_BOUNTIES.filter((b) => {
    if (search && !b.title.toLowerCase().includes(search.toLowerCase())) return false;
    if (selectedDifficulty && b.difficulty !== selectedDifficulty) return false;
    if (selectedCategory && b.category !== selectedCategory) return false;
    return true;
  });

  return (
    <div className="space-y-6 max-w-[1200px]">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Bounty Explorer</h1>
          <p className="text-white/40 text-sm mt-1">{filtered.length} bounties available</p>
        </div>
        <Button size="sm" className="gap-2">
          <Plus className="w-4 h-4" />
          Post bounty
        </Button>
      </div>

      {/* Filters */}
      <div className="glass rounded-xl p-4 space-y-4">
        <div className="flex gap-3">
          <Input
            icon={<Search className="w-4 h-4" />}
            placeholder="Search bounties..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1"
          />
          <Button variant="outline" size="default" className="gap-2 shrink-0">
            <SlidersHorizontal className="w-4 h-4" />
            Filters
          </Button>
        </div>

        {/* Quick filters */}
        <div className="flex flex-wrap gap-2">
          <span className="text-xs text-white/40 self-center mr-1">Difficulty:</span>
          {difficultyFilters.map((d) => (
            <button
              key={d}
              onClick={() => setSelectedDifficulty(selectedDifficulty === d ? null : d)}
              className={`text-xs px-2.5 py-1 rounded-full border transition-all ${
                selectedDifficulty === d
                  ? 'border-violet-500/50 bg-violet-500/15 text-violet-300'
                  : 'border-white/10 bg-white/5 text-white/50 hover:border-white/20'
              }`}
            >
              {d}
            </button>
          ))}
        </div>
      </div>

      {/* Bounty grid */}
      <div className="grid md:grid-cols-2 gap-4">
        <AnimatePresence mode="popLayout">
          {filtered.map((bounty, i) => (
            <motion.div
              key={bounty.id}
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ delay: i * 0.05 }}
            >
              <BountyCard bounty={bounty as Parameters<typeof BountyCard>[0]['bounty']} />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-20 text-white/30">
          <Search className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p>No bounties match your filters</p>
        </div>
      )}
    </div>
  );
}

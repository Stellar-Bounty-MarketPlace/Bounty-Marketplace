'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { ArrowRight, Github, Sparkles, Shield, Zap } from 'lucide-react';
import { Button } from '@bounty/ui';

const floatingCards = [
  {
    id: 1,
    title: 'Fix memory leak in event handler',
    amount: '$800',
    currency: 'USDC',
    tag: 'Bug Fix',
    tagColor: 'text-red-400 bg-red-500/10 border-red-500/20',
    delay: 0,
    x: '-translate-x-4',
  },
  {
    id: 2,
    title: 'Implement token vesting contract',
    amount: '$2,500',
    currency: 'USDC',
    tag: 'Feature',
    tagColor: 'text-violet-400 bg-violet-500/10 border-violet-500/20',
    delay: 0.15,
    x: 'translate-x-4',
  },
  {
    id: 3,
    title: 'Add comprehensive test suite',
    amount: '$1,200',
    currency: 'USDC',
    tag: 'Testing',
    tagColor: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20',
    delay: 0.3,
    x: '-translate-x-2',
  },
];

export function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center pt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 w-full">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left: Copy */}
          <div>
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-violet-500/30 bg-violet-500/10 text-violet-300 text-sm mb-8"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>AI-powered bounty coordination</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            </motion.div>

            {/* Headline */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-5xl sm:text-6xl lg:text-7xl font-bold leading-[1.05] tracking-tight mb-6"
            >
              <span className="text-white">Fund the</span>
              <br />
              <span className="text-gradient">future of</span>
              <br />
              <span className="text-white">open source</span>
            </motion.h1>

            {/* Subheadline */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="text-lg text-white/50 leading-relaxed mb-10 max-w-lg"
            >
              Match contributors to OSS tasks with AI precision. Automate escrow on Stellar,
              verify PRs, and build verifiable reputation — all in one platform.
            </motion.p>

            {/* CTAs */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="flex flex-wrap gap-4 mb-12"
            >
              <Link href="/auth/login">
                <Button size="lg" variant="glow" className="gap-2">
                  <Github className="w-5 h-5" />
                  Connect with GitHub
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
              <Link href="/bounties">
                <Button size="lg" variant="outline" className="gap-2">
                  Explore bounties
                </Button>
              </Link>
            </motion.div>

            {/* Trust signals */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.5 }}
              className="flex flex-wrap items-center gap-6 text-sm text-white/40"
            >
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-emerald-400" />
                <span>Soroban smart contracts</span>
              </div>
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-violet-400" />
                <span>AI-powered matching</span>
              </div>
              <div className="flex items-center gap-2">
                <Github className="w-4 h-4 text-white/40" />
                <span>GitHub native</span>
              </div>
            </motion.div>
          </div>

          {/* Right: Floating bounty cards */}
          <div className="relative hidden lg:block">
            <div className="relative h-[520px]">
              {/* Glow orb */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-violet-600/20 rounded-full blur-[80px]" />

              {floatingCards.map((card, i) => (
                <motion.div
                  key={card.id}
                  initial={{ opacity: 0, y: 40, x: 0 }}
                  animate={{
                    opacity: 1,
                    y: [0, -8, 0],
                    x: 0,
                  }}
                  transition={{
                    opacity: { duration: 0.5, delay: card.delay + 0.4 },
                    y: {
                      duration: 4 + i,
                      repeat: Infinity,
                      ease: 'easeInOut',
                      delay: card.delay,
                    },
                  }}
                  className={`absolute glass rounded-2xl p-5 w-72 shadow-2xl ${
                    i === 0
                      ? 'top-8 left-0'
                      : i === 1
                      ? 'top-1/2 -translate-y-1/2 right-0'
                      : 'bottom-8 left-12'
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <span
                      className={`text-xs font-medium px-2 py-0.5 rounded-full border ${card.tagColor}`}
                    >
                      {card.tag}
                    </span>
                    <div className="text-right">
                      <div className="text-lg font-bold text-white">{card.amount}</div>
                      <div className="text-xs text-white/40">{card.currency}</div>
                    </div>
                  </div>
                  <p className="text-sm text-white/80 font-medium leading-snug">{card.title}</p>
                  <div className="mt-3 flex items-center gap-2">
                    <div className="flex -space-x-1.5">
                      {[1, 2, 3].map((j) => (
                        <div
                          key={j}
                          className="w-5 h-5 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 border border-white/10"
                        />
                      ))}
                    </div>
                    <span className="text-xs text-white/40">3 applicants</span>
                    <div className="ml-auto flex items-center gap-1 text-xs text-emerald-400">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      Open
                    </div>
                  </div>
                </motion.div>
              ))}

              {/* AI match indicator */}
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 1, duration: 0.4 }}
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 glass rounded-xl px-4 py-2.5 flex items-center gap-2 border-violet-500/30 bg-violet-500/10"
              >
                <Sparkles className="w-4 h-4 text-violet-400" />
                <span className="text-sm text-violet-300 font-medium">AI matching active</span>
                <div className="w-2 h-2 rounded-full bg-violet-400 animate-pulse" />
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

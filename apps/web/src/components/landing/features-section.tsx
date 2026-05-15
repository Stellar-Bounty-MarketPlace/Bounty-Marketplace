'use client';

import { motion } from 'framer-motion';
import {
  Brain,
  Shield,
  GitMerge,
  Star,
  BarChart3,
  Zap,
  Lock,
  Cpu,
} from 'lucide-react';

const features = [
  {
    icon: Brain,
    title: 'AI Contributor Matching',
    description:
      'Semantic embeddings analyze GitHub history, language proficiency, and contribution patterns to surface the best contributors for every bounty.',
    color: 'from-violet-500 to-purple-600',
    glow: 'shadow-violet-500/20',
    tags: ['Embeddings', 'Vector Search', 'GPT-4o'],
  },
  {
    icon: Shield,
    title: 'Smart Escrow on Stellar',
    description:
      'Soroban smart contracts hold funds in trustless escrow with milestone-based releases, dispute resolution, and automatic expiry.',
    color: 'from-cyan-500 to-blue-600',
    glow: 'shadow-cyan-500/20',
    tags: ['Soroban', 'USDC', 'Non-custodial'],
  },
  {
    icon: GitMerge,
    title: 'PR Verification Engine',
    description:
      'Automatically verify linked PRs, detect spam submissions, validate merge state, and compute quality signals from commit history.',
    color: 'from-emerald-500 to-teal-600',
    glow: 'shadow-emerald-500/20',
    tags: ['GitHub API', 'Spam Detection', 'Quality Score'],
  },
  {
    icon: Star,
    title: 'On-chain Reputation',
    description:
      'Verifiable contributor reputation stored on Stellar. Track success rates, delivery speed, maintainer ratings, and dispute history.',
    color: 'from-amber-500 to-orange-600',
    glow: 'shadow-amber-500/20',
    tags: ['Soroban', 'Reputation Tiers', 'Immutable'],
  },
  {
    icon: BarChart3,
    title: 'Advanced Analytics',
    description:
      'Real-time dashboards with bounty flows, contributor rankings, ecosystem activity, and repo intelligence powered by live data.',
    color: 'from-pink-500 to-rose-600',
    glow: 'shadow-pink-500/20',
    tags: ['Real-time', 'Charts', 'Heatmaps'],
  },
  {
    icon: Cpu,
    title: 'Repo Intelligence',
    description:
      'AI-generated repository summaries, tech stack analysis, contributor diversity scores, and actionable recommendations for maintainers.',
    color: 'from-indigo-500 to-violet-600',
    glow: 'shadow-indigo-500/20',
    tags: ['AI Analysis', 'Health Score', 'Insights'],
  },
];

export function FeaturesSection() {
  return (
    <section id="features" className="py-32">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-20"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/10 bg-white/5 text-white/60 text-sm mb-6">
            <Zap className="w-3.5 h-3.5 text-violet-400" />
            Platform capabilities
          </div>
          <h2 className="text-4xl sm:text-5xl font-bold text-white mb-4">
            Everything you need to{' '}
            <span className="text-gradient">coordinate bounties</span>
          </h2>
          <p className="text-lg text-white/40 max-w-2xl mx-auto">
            From AI-powered matching to on-chain escrow — a complete platform for the
            decentralized open-source economy.
          </p>
        </motion.div>

        {/* Feature grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.08 }}
              whileHover={{ y: -4 }}
              className="group relative glass rounded-2xl p-6 glass-hover cursor-default"
            >
              {/* Icon */}
              <div
                className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-5 shadow-lg ${feature.glow} group-hover:scale-110 transition-transform duration-200`}
              >
                <feature.icon className="w-6 h-6 text-white" />
              </div>

              <h3 className="text-lg font-semibold text-white mb-2">{feature.title}</h3>
              <p className="text-sm text-white/50 leading-relaxed mb-4">{feature.description}</p>

              {/* Tags */}
              <div className="flex flex-wrap gap-1.5">
                {feature.tags.map((tag) => (
                  <span
                    key={tag}
                    className="text-xs px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-white/50"
                  >
                    {tag}
                  </span>
                ))}
              </div>

              {/* Hover glow */}
              <div
                className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${feature.color} opacity-0 group-hover:opacity-[0.04] transition-opacity duration-300 pointer-events-none`}
              />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

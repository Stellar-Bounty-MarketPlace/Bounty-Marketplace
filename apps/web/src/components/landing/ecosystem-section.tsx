'use client';

import { motion } from 'framer-motion';

const ecosystemNodes = [
  { id: 'maintainer', label: 'Maintainer', x: 50, y: 10, color: '#8b5cf6', size: 48 },
  { id: 'bounty', label: 'Bounty', x: 50, y: 50, color: '#06b6d4', size: 56 },
  { id: 'escrow', label: 'Escrow', x: 20, y: 70, color: '#10b981', size: 40 },
  { id: 'contributor1', label: 'Contributor', x: 80, y: 70, color: '#f59e0b', size: 40 },
  { id: 'ai', label: 'AI Engine', x: 20, y: 30, color: '#ec4899', size: 44 },
  { id: 'github', label: 'GitHub', x: 80, y: 30, color: '#6366f1', size: 44 },
];

const connections = [
  { from: 'maintainer', to: 'bounty' },
  { from: 'bounty', to: 'escrow' },
  { from: 'bounty', to: 'contributor1' },
  { from: 'ai', to: 'bounty' },
  { from: 'github', to: 'bounty' },
  { from: 'escrow', to: 'contributor1' },
];

export function EcosystemSection() {
  return (
    <section id="ecosystem" className="py-32">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left: SVG visualization */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="relative"
          >
            <div className="glass rounded-3xl p-8 aspect-square max-w-md mx-auto">
              <svg viewBox="0 0 100 100" className="w-full h-full">
                {/* Connection lines */}
                {connections.map((conn, i) => {
                  const from = ecosystemNodes.find((n) => n.id === conn.from)!;
                  const to = ecosystemNodes.find((n) => n.id === conn.to)!;
                  return (
                    <motion.line
                      key={i}
                      x1={from.x}
                      y1={from.y}
                      x2={to.x}
                      y2={to.y}
                      stroke="rgba(255,255,255,0.1)"
                      strokeWidth="0.5"
                      initial={{ pathLength: 0, opacity: 0 }}
                      whileInView={{ pathLength: 1, opacity: 1 }}
                      viewport={{ once: true }}
                      transition={{ duration: 1, delay: i * 0.15 }}
                    />
                  );
                })}

                {/* Animated data flow dots */}
                {connections.map((conn, i) => {
                  const from = ecosystemNodes.find((n) => n.id === conn.from)!;
                  const to = ecosystemNodes.find((n) => n.id === conn.to)!;
                  return (
                    <motion.circle
                      key={`dot-${i}`}
                      r="0.8"
                      fill="rgba(139,92,246,0.8)"
                      initial={{ x: from.x, y: from.y, opacity: 0 }}
                      animate={{
                        x: [from.x, to.x],
                        y: [from.y, to.y],
                        opacity: [0, 1, 0],
                      }}
                      transition={{
                        duration: 2,
                        delay: i * 0.4,
                        repeat: Infinity,
                        repeatDelay: 1,
                      }}
                    />
                  );
                })}

                {/* Nodes */}
                {ecosystemNodes.map((node, i) => (
                  <motion.g
                    key={node.id}
                    initial={{ opacity: 0, scale: 0 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: i * 0.1 + 0.3 }}
                  >
                    <circle
                      cx={node.x}
                      cy={node.y}
                      r={node.size / 10}
                      fill={node.color}
                      fillOpacity={0.15}
                      stroke={node.color}
                      strokeWidth="0.5"
                      strokeOpacity={0.6}
                    />
                    <circle
                      cx={node.x}
                      cy={node.y}
                      r={node.size / 20}
                      fill={node.color}
                      fillOpacity={0.8}
                    />
                    <text
                      x={node.x}
                      y={node.y + node.size / 10 + 3}
                      textAnchor="middle"
                      fill="rgba(255,255,255,0.6)"
                      fontSize="3"
                      fontFamily="system-ui"
                    >
                      {node.label}
                    </text>
                  </motion.g>
                ))}
              </svg>
            </div>
          </motion.div>

          {/* Right: Copy */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/10 bg-white/5 text-white/60 text-sm mb-6">
              Ecosystem
            </div>
            <h2 className="text-4xl font-bold text-white mb-6">
              A connected{' '}
              <span className="text-gradient-cyan">coordination layer</span>
              {' '}for OSS
            </h2>
            <p className="text-white/50 leading-relaxed mb-8">
              BountyHub connects maintainers, contributors, AI systems, and blockchain
              infrastructure into a seamless coordination layer. Every interaction is
              transparent, verifiable, and incentive-aligned.
            </p>

            <div className="space-y-4">
              {[
                { title: 'Maintainers', desc: 'Post bounties, fund escrow, review PRs, rate contributors' },
                { title: 'Contributors', desc: 'Discover opportunities, build reputation, earn on-chain' },
                { title: 'AI Engine', desc: 'Match, classify, detect spam, assess risk automatically' },
                { title: 'Smart Contracts', desc: 'Trustless escrow, milestone payouts, dispute resolution' },
              ].map((item, i) => (
                <motion.div
                  key={item.title}
                  initial={{ opacity: 0, x: 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="flex gap-4 p-4 glass rounded-xl glass-hover"
                >
                  <div className="w-2 h-2 rounded-full bg-violet-400 mt-1.5 shrink-0" />
                  <div>
                    <div className="text-sm font-semibold text-white mb-0.5">{item.title}</div>
                    <div className="text-sm text-white/40">{item.desc}</div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

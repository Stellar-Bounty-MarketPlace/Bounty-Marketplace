'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { ArrowRight, Github } from 'lucide-react';
import { Button } from '@bounty/ui';

export function CTASection() {
  return (
    <section className="py-32">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="relative glass rounded-3xl p-12 overflow-hidden"
        >
          {/* Background glow */}
          <div className="absolute inset-0 bg-gradient-to-br from-violet-600/10 via-transparent to-cyan-600/10 pointer-events-none" />
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-px bg-gradient-to-r from-transparent via-violet-500/50 to-transparent" />

          <h2 className="text-4xl sm:text-5xl font-bold text-white mb-4">
            Ready to build the{' '}
            <span className="text-gradient">future of OSS</span>?
          </h2>
          <p className="text-lg text-white/50 mb-10 max-w-xl mx-auto">
            Join thousands of contributors and maintainers already coordinating on BountyHub.
          </p>

          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/auth/login">
              <Button size="xl" variant="glow" className="gap-2">
                <Github className="w-5 h-5" />
                Start with GitHub
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
            <Link href="/bounties">
              <Button size="xl" variant="outline">
                Browse bounties
              </Button>
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

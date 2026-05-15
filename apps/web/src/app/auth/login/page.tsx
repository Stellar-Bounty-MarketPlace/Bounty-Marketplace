'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { Github, Zap, Shield, Star, ArrowLeft } from 'lucide-react';
import { Button } from '@bounty/ui';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

export default function LoginPage() {
  const handleGitHubLogin = () => {
    window.location.href = `${API_URL}/api/v1/auth/github`;
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#050510] relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-violet-600/10 rounded-full blur-[100px]" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-cyan-600/8 rounded-full blur-[80px]" />
      </div>

      <div className="relative w-full max-w-md px-4">
        {/* Back link */}
        <Link href="/" className="inline-flex items-center gap-2 text-sm text-white/40 hover:text-white mb-8 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Back to home
        </Link>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass rounded-2xl p-8"
        >
          {/* Logo */}
          <div className="flex items-center gap-2.5 mb-8">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/30">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-xl text-white">
              Bounty<span className="text-gradient">Hub</span>
            </span>
          </div>

          <h1 className="text-2xl font-bold text-white mb-2">Welcome back</h1>
          <p className="text-white/50 text-sm mb-8">
            Sign in with your GitHub account to access the platform.
          </p>

          <Button
            size="lg"
            className="w-full gap-3"
            onClick={handleGitHubLogin}
          >
            <Github className="w-5 h-5" />
            Continue with GitHub
          </Button>

          {/* Trust signals */}
          <div className="mt-8 pt-6 border-t border-white/[0.06] space-y-3">
            {[
              { icon: Shield, text: 'Non-custodial — your keys, your funds' },
              { icon: Star, text: 'Reputation stored on Stellar blockchain' },
              { icon: Github, text: 'GitHub OAuth — no password required' },
            ].map((item) => (
              <div key={item.text} className="flex items-center gap-3 text-xs text-white/40">
                <item.icon className="w-3.5 h-3.5 shrink-0" />
                {item.text}
              </div>
            ))}
          </div>
        </motion.div>

        <p className="text-center text-xs text-white/20 mt-6">
          By signing in, you agree to our{' '}
          <Link href="/terms" className="underline hover:text-white/40">Terms</Link>
          {' '}and{' '}
          <Link href="/privacy" className="underline hover:text-white/40">Privacy Policy</Link>
        </p>
      </div>
    </div>
  );
}

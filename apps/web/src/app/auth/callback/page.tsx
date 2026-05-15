'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { Zap } from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';
import { api } from '@/lib/api';

export default function AuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setTokens, setUser } = useAuthStore();

  useEffect(() => {
    const accessToken = searchParams.get('access_token');
    const refreshToken = searchParams.get('refresh_token');

    if (!accessToken || !refreshToken) {
      router.replace('/auth/login');
      return;
    }

    setTokens(accessToken, refreshToken);

    api.auth.me().then(({ data }) => {
      setUser(data);
      router.replace('/dashboard');
    }).catch(() => {
      router.replace('/auth/login');
    });
  }, [searchParams, setTokens, setUser, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#050510]">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center"
      >
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
          className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center mx-auto mb-4"
        >
          <Zap className="w-6 h-6 text-white" />
        </motion.div>
        <p className="text-white/50 text-sm">Signing you in...</p>
      </motion.div>
    </div>
  );
}

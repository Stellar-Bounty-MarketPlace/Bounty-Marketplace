import Link from 'next/link';
import { Zap, Github, Twitter } from 'lucide-react';

export function LandingFooter() {
  return (
    <footer className="border-t border-white/[0.06] py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center">
              <Zap className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-bold text-white">BountyHub</span>
          </div>

          <div className="flex items-center gap-6 text-sm text-white/40">
            <Link href="/privacy" className="hover:text-white transition-colors">Privacy</Link>
            <Link href="/terms" className="hover:text-white transition-colors">Terms</Link>
            <Link href="/docs" className="hover:text-white transition-colors">Docs</Link>
            <Link href="/blog" className="hover:text-white transition-colors">Blog</Link>
          </div>

          <div className="flex items-center gap-3">
            <a href="https://github.com/bountyhub" target="_blank" rel="noopener noreferrer"
              className="p-2 text-white/40 hover:text-white hover:bg-white/5 rounded-lg transition-all">
              <Github className="w-4 h-4" />
            </a>
            <a href="https://twitter.com/bountyhub" target="_blank" rel="noopener noreferrer"
              className="p-2 text-white/40 hover:text-white hover:bg-white/5 rounded-lg transition-all">
              <Twitter className="w-4 h-4" />
            </a>
          </div>
        </div>
        <div className="mt-8 text-center text-xs text-white/20">
          © {new Date().getFullYear()} BountyHub. Built on Stellar Soroban.
        </div>
      </div>
    </footer>
  );
}

'use client';

import { Bell, Search, Command } from 'lucide-react';
import { Button } from '@bounty/ui';

export function AppHeader() {
  return (
    <header className="h-16 flex items-center justify-between px-6 border-b border-white/[0.06] bg-[#050510]/80 backdrop-blur-xl shrink-0">
      {/* Search */}
      <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-white/10 bg-white/5 text-white/40 text-sm w-64 cursor-pointer hover:border-white/20 transition-colors">
        <Search className="w-4 h-4" />
        <span>Search bounties...</span>
        <div className="ml-auto flex items-center gap-1 text-xs">
          <Command className="w-3 h-3" />
          <span>K</span>
        </div>
      </div>

      {/* Right actions */}
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-violet-400" />
        </Button>
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 cursor-pointer" />
      </div>
    </header>
  );
}

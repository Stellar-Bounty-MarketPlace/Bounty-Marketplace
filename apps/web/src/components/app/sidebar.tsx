'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  LayoutDashboard,
  Search,
  BarChart3,
  GitBranch,
  User,
  Settings,
  Zap,
  Bell,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@bounty/ui';

const navItems = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Bounties', href: '/bounties', icon: Search },
  { label: 'Analytics', href: '/analytics', icon: BarChart3 },
  { label: 'Repositories', href: '/repositories', icon: GitBranch },
  { label: 'Profile', href: '/profile', icon: User },
];

const bottomItems = [
  { label: 'Settings', href: '/settings', icon: Settings },
];

export function AppSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-60 shrink-0 flex flex-col border-r border-white/[0.06] bg-[#050510]">
      {/* Logo */}
      <div className="h-16 flex items-center px-5 border-b border-white/[0.06]">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="relative">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/30">
              <Zap className="w-4 h-4 text-white" />
            </div>
          </div>
          <span className="font-bold text-white">
            Bounty<span className="text-gradient">Hub</span>
          </span>
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {navItems.map((item) => {
          const active = pathname.startsWith(item.href);
          return (
            <Link key={item.href} href={item.href}>
              <motion.div
                whileHover={{ x: 2 }}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-150',
                  active
                    ? 'bg-violet-500/15 text-violet-300 border border-violet-500/20'
                    : 'text-white/50 hover:text-white hover:bg-white/5',
                )}
              >
                <item.icon className={cn('w-4 h-4', active && 'text-violet-400')} />
                {item.label}
                {active && <ChevronRight className="w-3 h-3 ml-auto text-violet-400/60" />}
              </motion.div>
            </Link>
          );
        })}
      </nav>

      {/* Bottom */}
      <div className="px-3 py-4 border-t border-white/[0.06] space-y-0.5">
        {bottomItems.map((item) => (
          <Link key={item.href} href={item.href}>
            <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-white/50 hover:text-white hover:bg-white/5 transition-all">
              <item.icon className="w-4 h-4" />
              {item.label}
            </div>
          </Link>
        ))}

        {/* User avatar placeholder */}
        <div className="flex items-center gap-3 px-3 py-2.5 mt-2">
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600" />
          <div className="flex-1 min-w-0">
            <div className="text-xs font-medium text-white truncate">User</div>
            <div className="text-xs text-white/30 truncate">contributor</div>
          </div>
        </div>
      </div>
    </aside>
  );
}

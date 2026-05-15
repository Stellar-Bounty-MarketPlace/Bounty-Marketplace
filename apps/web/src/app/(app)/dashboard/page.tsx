import { Metadata } from 'next';
import { DashboardMetrics } from '@/components/dashboard/metrics';
import { BountyActivityFeed } from '@/components/dashboard/activity-feed';
import { ContributorLeaderboard } from '@/components/dashboard/leaderboard';
import { AIRecommendations } from '@/components/dashboard/ai-recommendations';
import { BountyStatusChart } from '@/components/dashboard/bounty-status-chart';

export const metadata: Metadata = { title: 'Dashboard' };

export default function DashboardPage() {
  return (
    <div className="space-y-6 max-w-[1400px]">
      <div>
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <p className="text-white/40 text-sm mt-1">Platform overview and live metrics</p>
      </div>

      {/* Top metrics */}
      <DashboardMetrics />

      {/* Main grid */}
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <BountyStatusChart />
          <BountyActivityFeed />
        </div>
        <div className="space-y-6">
          <AIRecommendations />
          <ContributorLeaderboard />
        </div>
      </div>
    </div>
  );
}

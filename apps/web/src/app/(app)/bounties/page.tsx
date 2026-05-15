import { Metadata } from 'next';
import { BountyExplorer } from '@/components/bounties/bounty-explorer';

export const metadata: Metadata = { title: 'Bounty Explorer' };

export default function BountiesPage() {
  return <BountyExplorer />;
}

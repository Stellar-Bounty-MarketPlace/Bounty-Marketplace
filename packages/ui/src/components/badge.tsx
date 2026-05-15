import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../lib/utils';

const badgeVariants = cva(
  'inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
  {
    variants: {
      variant: {
        default: 'border-violet-500/30 bg-violet-500/10 text-violet-300',
        secondary: 'border-white/10 bg-white/5 text-white/70',
        destructive: 'border-red-500/30 bg-red-500/10 text-red-400',
        success: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400',
        warning: 'border-amber-500/30 bg-amber-500/10 text-amber-400',
        info: 'border-cyan-500/30 bg-cyan-500/10 text-cyan-400',
        outline: 'border-white/20 text-white/70',
        // Reputation tiers
        newcomer: 'border-gray-500/30 bg-gray-500/10 text-gray-400',
        contributor: 'border-blue-500/30 bg-blue-500/10 text-blue-400',
        trusted: 'border-purple-500/30 bg-purple-500/10 text-purple-400',
        expert: 'border-amber-500/30 bg-amber-500/10 text-amber-400',
        elite: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };

import { cn } from '../lib/utils';

function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'animate-pulse rounded-lg bg-gradient-to-r from-white/5 via-white/10 to-white/5 bg-[length:200%_100%]',
        className,
      )}
      style={{
        animation: 'shimmer 2s infinite linear',
      }}
      {...props}
    />
  );
}

export { Skeleton };

import { cn } from '../../lib/utils';

export const Skeleton = ({ className }: { className?: string }) => {
  return (
    <div 
      className={cn(
        "rounded-[10px] animate-pulse relative overflow-hidden",
        "bg-elevated/50 border border-border/50",
        className
      )}
    >
      <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-hover to-transparent" />
    </div>
  );
};

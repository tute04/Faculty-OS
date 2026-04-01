import React from 'react';
import { cn, countdownMeta } from '../../lib/utils';
import { Clock } from 'lucide-react';

interface CountdownChipProps {
  days: number;
  className?: string;
}

export const CountdownChip: React.FC<CountdownChipProps> = ({ days, className }) => {
  const meta = countdownMeta(days);
  return (
    <div
      className={cn(
        'inline-flex items-center gap-1.5 px-2 py-1 rounded-[6px] text-xs font-semibold whitespace-nowrap',
        className
      )}
      style={{ color: meta.color, backgroundColor: meta.bg }}
    >
      <Clock size={12} strokeWidth={2.5} />
      <span>{meta.label}</span>
    </div>
  );
};

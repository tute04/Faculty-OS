import React from 'react';
import { cn } from '../../lib/utils';
import { Clock } from 'lucide-react';

interface CountdownChipProps {
  days: number;
  className?: string;
  date?: string;
}

export const CountdownChip: React.FC<CountdownChipProps> = ({ days, className, date }) => {
  if (days > 30) {
    return <span className="text-[11px] text-text-muted font-medium whitespace-nowrap">{date}</span>;
  }

  if (days > 14) {
    return (
      <div className={cn('inline-flex items-center gap-1 text-[#6a5e48] text-[11px] font-medium whitespace-nowrap', className)}>
        <Clock size={10} strokeWidth={2.5} />
        <span>{days}d</span>
      </div>
    );
  }

  if (days >= 8) {
    return (
      <div className={cn('inline-flex items-center px-2 py-0.5 rounded-[6px] bg-[#f59e0b] text-[#1a0f00] text-[11px] font-medium whitespace-nowrap', className)}>
        {days}d
      </div>
    );
  }

  if (days >= 0) {
    return (
      <div className={cn('inline-flex items-center px-2.5 py-1 rounded-[6px] bg-[#ef4444] text-white text-[11px] font-semibold whitespace-nowrap shadow-sm', className)}>
        {days === 0 ? 'Hoy' : `${days}d`}
      </div>
    );
  }

  return <span className="text-[11px] text-text-faint italic font-medium">Vencido</span>;
};

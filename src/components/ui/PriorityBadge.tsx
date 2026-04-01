import React from 'react';
import { Flame } from 'lucide-react';
import { cn } from '../../lib/utils';

export const PriorityBadge = ({ score }: { score: number }) => {
  let colorClass = '';
  let label = '';
  
  if (score <= 30) {
    colorClass = 'text-text-muted bg-surface border-border';
    label = 'Tranquilo';
  } else if (score <= 60) {
    colorClass = 'text-amber bg-amber/10 border-amber/20';
    label = 'A arrancar';
  } else if (score <= 80) {
    colorClass = 'text-orange bg-orange/10 border-orange/20';
    label = 'Urgente';
  } else {
    colorClass = 'text-red bg-red/10 border-red/20 animate-pulse';
    label = 'CRÍTICO';
  }

  return (
    <div className={cn("inline-flex items-center gap-1.5 px-2 py-0.5 rounded-[6px] border text-[11px] font-bold tracking-wide uppercase", colorClass)} title={`Prioridad: ${score}/100`}>
      <Flame size={12} strokeWidth={2.5} />
      <span>{score} {label}</span>
    </div>
  );
};

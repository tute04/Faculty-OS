import React from 'react';
import { cn } from '../../lib/utils';

type BadgeVariant =
  | 'pendiente'
  | 'aprobado'
  | 'libre'
  | 'desaprobado'
  | 'parcial'
  | 'final'
  | 'TP'
  | 'recuperatorio'
  | 'academico'
  | 'personal'
  | 'emprendimiento'
  | 'default';

const vStyles: Record<string, string> = {
  // statuses
  pendiente: 'bg-yellow/10 text-yellow border border-yellow/20',
  aprobado: 'bg-green/10 text-green border border-green/20',
  desaprobado: 'bg-red/10 text-red border border-red/20',
  libre: 'bg-border text-text-secondary border border-border-accent',
  
  // types
  parcial: 'bg-amber/10 text-amber border border-amber/20',
  final: 'bg-red/10 text-red border border-red/20',
  TP: 'bg-amber-soft/10 text-amber-soft border border-amber-soft/20',
  recuperatorio: 'bg-orange/10 text-orange border border-orange/20',
  
  // goal categories
  academico: 'bg-amber/10 text-amber border border-amber/20',
  personal: 'bg-border text-text-secondary border border-border-accent',
  emprendimiento: 'bg-orange/10 text-orange border border-orange/20',

  default: 'bg-surface text-text-muted border border-border',
};

interface BadgeProps {
  variant?: BadgeVariant;
  children: React.ReactNode;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({ variant = 'default', children, className }) => (
  <span className={cn('inline-flex items-center px-2 py-0.5 rounded-[6px] text-[11px] font-medium tracking-[0.5px]', 
    vStyles[variant] ?? vStyles.default, 
    className
  )}>
    {children}
  </span>
);

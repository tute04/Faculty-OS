import React from 'react';
import { cn } from '../../lib/utils';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'ghost' | 'danger';
  size?: 'sm' | 'md';
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'ghost',
  size = 'md',
  className,
  children,
  ...props
}) => {
  return (
    <button
      className={cn(
        'btn',
        variant === 'primary' && 'btn-primary',
        variant === 'ghost' && 'btn-ghost',
        variant === 'danger' && 'btn-danger',
        size === 'sm' && 'px-3 py-1.5 text-xs rounded-[6px]',
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
};

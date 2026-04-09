import React from 'react';

export const typeStyles: Record<string, { bg: string; border: string; text: string; weight: number; uppercase: boolean; rowTint?: string }> = {
  parcial: {
    bg: '#2a1a08',
    border: '#f59e0b',
    text: '#f59e0b',
    weight: 600,
    uppercase: true,
    rowTint: 'rgba(245, 158, 11, 0.03)',
  },
  final: {
    bg: '#2a0808',
    border: '#ef4444',
    text: '#ef4444',
    weight: 600,
    uppercase: true,
    rowTint: 'rgba(239, 68, 68, 0.04)',
  },
  TP: {
    bg: 'transparent',
    border: '#3a3028',
    text: '#6a5e48',
    weight: 400,
    uppercase: false,
    rowTint: undefined,
  },
  recuperatorio: {
    bg: 'transparent',
    border: '#3a3028',
    text: '#6a5e48',
    weight: 400,
    uppercase: false,
    rowTint: undefined,
  },
};

export const ExamTypeBadge: React.FC<{ type: string }> = ({ type }) => {
  const s = typeStyles[type] ?? typeStyles['TP'];
  return (
    <span
      style={{
        background: s.bg,
        border: `1px solid ${s.border}`,
        color: s.text,
        fontWeight: s.weight,
        padding: '2px 7px',
        borderRadius: 5,
        fontSize: 10,
        letterSpacing: s.uppercase ? '0.08em' : undefined,
        textTransform: s.uppercase ? 'uppercase' : 'none',
        display: 'inline-flex',
        alignItems: 'center',
      }}
    >
      {type}
    </span>
  );
};

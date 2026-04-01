import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../../lib/utils';

// --- Subcomponent: AnimatedNumber ---------------------------------------------
const AnimatedNumber: React.FC<{ n: number }> = ({ n }) => {
  const [count, setCount] = useState(0);
  useEffect(() => {
    const start = 0;
    const duration = 1000;
    const startTime = performance.now();
    const animate = (time: number) => {
      const elapsed = time - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easing = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      setCount(Math.round(start + (n - start) * easing));
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [n]);
  return <span>{count}</span>;
};

// --- Subcomponent: StatCard ---------------------------------------------------
interface StatCardProps {
  label: string;
  value: number | string;
  suffix?: string;
  sublabel?: string;
  className?: string;
}

const StatCard: React.FC<StatCardProps> = ({ label, value, suffix, sublabel, className }) => (
  <motion.div 
    variants={{ hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } }} 
    className={cn("card flex flex-col justify-between min-h-[110px] group transition-all duration-300", className)}
  >
    <p className="label text-text-secondary group-hover:text-amber transition-colors">{label}</p>
    <div className="mt-auto">
      <h3 className="text-3xl font-semibold tracking-tight text-text-primary">
        {typeof value === 'number' ? <AnimatedNumber n={value} /> : value}
        {suffix && <span className="text-xl text-text-muted ml-0.5">{suffix}</span>}
      </h3>
      {sublabel && <p className="text-xs text-text-secondary mt-1">{sublabel}</p>}
    </div>
  </motion.div>
);

// --- Component: StatCardsRow --------------------------------------------------
interface StatCardsRowProps {
  examsCount: number;
  pendingCount: number;
  avg: string | number;
  gradedCount: number;
  weeklyLoad: number;
  nextExamDays?: number;
  nextExamSubject?: string;
}

export const StatCardsRow: React.FC<StatCardsRowProps> = ({
  examsCount,
  pendingCount,
  avg,
  gradedCount,
  weeklyLoad,
  nextExamDays,
  nextExamSubject
}) => {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard 
        label="Total Exámenes" 
        value={examsCount} 
        sublabel={`${pendingCount} pendientes`} 
      />
      <StatCard 
        label="Promedio" 
        value={avg} 
        sublabel={`${gradedCount} notas cargadas`} 
      />
      <StatCard 
        label="Carga Semanal" 
        value={weeklyLoad} 
        suffix="h" 
        sublabel="Estudio + Facultad"
        className={weeklyLoad > 40 ? "border-red/30 bg-red/5" : weeklyLoad > 30 ? "border-amber/30 bg-amber/5" : ""} 
      />
      <StatCard 
        label="Próximo desafío" 
        value={nextExamDays !== undefined ? nextExamDays : "–"} 
        suffix={nextExamDays !== undefined ? "días" : ""}
        sublabel={nextExamSubject ? `${nextExamSubject.split(' ')[0]}...` : "No hay exámenes"} 
        className={nextExamDays !== undefined ? "hover:border-amber/50 relative cursor-pointer" : ""}
      />
    </div>
  );
};

import React from 'react';
import { Calendar } from 'lucide-react';
import { WeekBlock } from '../../../types';
import { CAT_COLORS, cn } from '../../../lib/utils';

interface MiniPlannerProps {
  blocks: WeekBlock[];
}

/**
 * Visualizador compacto de la carga semanal del estudiante.
 * Muestra bloques de Facultad, Estudio, Proyecto, Emprendimiento.
 */
export const MiniPlanner: React.FC<MiniPlannerProps> = ({ blocks }) => {
  const days = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];
  const grid = Array.from({ length: 7 }, () => Array.from({ length: 3 }, () => null as string | null));
  
  // Mapear bloques a la grilla semanal 7x3
  blocks.forEach(b => {
    const slot = b.startHour < 13 ? 0 : b.startHour < 18 ? 1 : 2;
    if (b.day >= 0 && b.day <= 6) {
      grid[b.day][slot] = b.category;
    }
  });

  return (
    <div className="card mt-6">
      <div className="flex items-center gap-3 mb-4">
        <Calendar size={18} className="text-text-muted" />
        <h2 className="text-sm font-semibold tracking-[-0.2px] text-text-primary">Carga Semanal</h2>
      </div>
      <div className="flex justify-between items-start gap-2">
        {grid.map((daySlots, d) => (
          <div key={d} className="flex flex-col gap-1.5 flex-1 items-center">
            <span className="text-[10px] uppercase font-medium text-text-faint">{days[d]}</span>
            {daySlots.map((cat, i) => (
              <div 
                key={i} 
                className="w-full aspect-[2/1] rounded max-w-[40px] transition-all hover:brightness-110"
                style={{ 
                  backgroundColor: cat && CAT_COLORS[cat] ? CAT_COLORS[cat] : 'transparent', 
                  opacity: cat ? 0.9 : 1, 
                  ...(cat ? {} : { backgroundColor: 'var(--bg-elevated)', border: '0.5px solid var(--border)' }) 
                }}
              />
            ))}
          </div>
        ))}
      </div>
      
      {/* Leyenda de Categorías */}
      <div className="flex flex-wrap gap-x-4 gap-y-2 mt-5 justify-center">
        {Object.entries(CAT_COLORS).map(([cat, color]) => (
           <div key={cat} className="flex items-center gap-1.5 label text-[9px] capitalize text-text-muted">
             <span 
               className="w-1.5 h-1.5 rounded-full" 
               style={{ backgroundColor: color }} 
             />
             {cat}
           </div>
        ))}
      </div>
    </div>
  );
};

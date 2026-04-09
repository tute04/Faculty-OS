import React, { useMemo } from 'react';
import { useExams } from '../hooks/useExams';
import { daysUntil, cn, formatDateES } from '../lib/utils';
import { Info } from 'lucide-react';

export const Timeline = () => {
  const { exams } = useExams();
  
  const timelineData = useMemo(() => {
    const now = new Date();
    // Cuatrimestre 1: March 1 (2) to July 31 (6)
    // Cuatrimestre 2: August 1 (7) to December 15 (11)
    const currentMonth = now.getMonth();
    const isC1 = currentMonth < 7;
    const year = now.getFullYear();
    
    const startDate = new Date(year, isC1 ? 2 : 7, 1);
    const endDate = new Date(year, isC1 ? 6 : 11, isC1 ? 31 : 15);
    
    const totalMs = endDate.getTime() - startDate.getTime();
    const totalDays = Math.round(totalMs / (1000 * 60 * 60 * 24));
    
    const todayMs = now.getTime() - startDate.getTime();
    const todayPercent = Math.max(0, Math.min(100, (todayMs / totalMs) * 100));
    
    // Filter pending exams in this semester
    const semesterExams = exams
      .filter(e => e.status === 'pendiente')
      .map(e => {
        const d = new Date(e.date);
        const percent = Math.max(0, Math.min(100, ((d.getTime() - startDate.getTime()) / totalMs) * 100));
        return { ...e, percent, d };
      })
      .filter(e => e.percent >= 0 && e.percent <= 100)
      .sort((a, b) => a.d.getTime() - b.d.getTime());

    // Stagger pills vertically based on collision (40px overlap detection roughly translates to ~5% depending on screen, let's use a dynamic logic)
    const rows: { endPercent: number }[] = [];
    const minGap = 8; // approx percent gap needed to avoid overlap
    const layoutExams = semesterExams.map(ex => {
      let rowIndex = -1;
      for (let i = 0; i < 4; i++) { // try up to 4 rows
        if (!rows[i] || rows[i].endPercent < ex.percent - minGap) {
          rowIndex = i;
          rows[i] = { endPercent: ex.percent };
          break;
        }
      }
      if (rowIndex === -1) {
        rowIndex = 3; // cap at bottom row
        rows[3].endPercent = ex.percent;
      }
      return { ...ex, rowIndex }; 
    });

    // Weeks for the bottom bar
    const totalWeeks = Math.ceil(totalDays / 7);
    const weeks = Array.from({ length: totalWeeks }).map((_, i) => {
      const weekPercent = ((i * 7) / totalDays) * 100;
      const examsInWeek = layoutExams.filter(e => e.percent >= weekPercent && e.percent < weekPercent + (7/totalDays)*100).length;
      return { number: i + 1, percent: weekPercent, examsCount: examsInWeek };
    });

    return { isC1, startDate, endDate, totalDays, todayPercent, exams: layoutExams, weeks };
  }, [exams]);

  // Generate density heatmap logic using the specific dates approach requested:
  const heatmapWeeks = Array.from({ length: 22 }, (_, i) => i + 1);
  const examCountPerWeek = heatmapWeeks.map(weekNum => {
    const now = new Date();
    const isC1 = now.getMonth() < 7;
    const year = now.getFullYear();
    const semesterStart = new Date(year, isC1 ? 2 : 7, 1);
    const weekStart = new Date(semesterStart);
    weekStart.setDate(semesterStart.getDate() + (weekNum - 1) * 7);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    
    return exams.filter(e => {
      const d = new Date(e.date);
      return d >= weekStart && d <= weekEnd && e.status === 'pendiente';
    }).length;
  });

  return (
    <div className="space-y-6 pb-20">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight text-text-primary">Timeline del cuatrimestre</h1>
        <p className="text-text-muted mt-1 text-[13px]">
          {timelineData.isC1 ? 'Primer' : 'Segundo'} Cuatrimestre ({timelineData.startDate.toLocaleDateString('es-AR', { month: 'long' })} - {timelineData.endDate.toLocaleDateString('es-AR', { month: 'long' })})
        </p>
      </header>

      {timelineData.exams.length === 0 ? (
        <div className="bg-elevated border border-dashed border-border p-12 rounded-card text-center text-text-muted text-sm mt-8">
          <Info className="mx-auto mb-2 opacity-50" size={24} />
          <p>Cargá tus exámenes para ver el cuatrimestre</p>
        </div>
      ) : (
        <div className="flex flex-col gap-12 mt-8">
          
          {/* Timeline Bar Area */}
          <div className="relative w-full pt-[120px] pb-12 bg-elevated border border-border rounded-xl px-4 sm:px-8">
            
            {/* The main bar */}
            <div className="relative h-1.5 w-full bg-border rounded-full">
              
              {/* Today Marker */}
              {timelineData.todayPercent > 0 && timelineData.todayPercent < 100 && (
                <div 
                  className="absolute top-0 bottom-0 w-px bg-amber border-l border-dashed border-amber/50 z-10 translate-y-[-100%] h-40"
                  style={{ left: `${timelineData.todayPercent}%` }}
                >
                  <span className="absolute -top-6 -left-3 text-[10px] font-bold text-amber bg-amber/10 px-1.5 py-0.5 rounded">Hoy</span>
                </div>
              )}

              {/* Week ticks */}
              {timelineData.weeks.map((w: { number: number, percent: number }) => (
                <div key={w.number} className="absolute top-1.5 w-px h-2 bg-text-muted/30" style={{ left: `${w.percent}%` }}>
                  <span className="absolute top-3 -translate-x-1/2 text-[9px] text-text-faint font-medium">S{w.number}</span>
                </div>
              ))}

              {/* Exams Pills */}
              {timelineData.exams.map((ex: { id: string, date: string, type: string, subject: string, percent: number, rowIndex: number }) => {
                const d = daysUntil(ex.date);
                const colorClass = d < 7 ? 'bg-red text-[#17130b]' : d < 14 ? 'bg-amber text-[#17130b]' : d < 30 ? 'bg-green text-[#17130b]' : 'bg-surface text-text-primary border border-border';
                
                return (
                  <div 
                    key={ex.id} 
                    className={cn(
                      "absolute flex items-center justify-center -translate-x-1/2 rounded-full px-2.5 py-1 text-[10px] font-bold shadow-sm whitespace-nowrap cursor-pointer z-20 group hover:z-30 transition-transform hover:scale-105 overflow-hidden text-ellipsis max-w-[120px] min-w-[80px]",
                      ex.type === 'TP' ? "border border-dashed bg-surface text-text-primary border-text-muted/50" : colorClass
                    )}
                    style={{ left: `${ex.percent}%`, top: `${(ex.rowIndex * -28) - 24}px` }}
                  >
                    <span className="truncate">{ex.subject.substring(0, 16)}{ex.subject.length > 16 ? '...' : ''}</span>
                    
                    {/* Tooltip */}
                    <div className="absolute opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto bottom-full mb-1 left-1/2 -translate-x-1/2 bg-elevated text-text-primary border border-border px-3 py-2 rounded-lg shadow-xl min-w-[150px] transition-opacity">
                      <p className="font-bold text-xs truncate mb-1">{ex.subject}</p>
                      <p className="text-[10px] text-text-secondary">{formatDateES(ex.date)}</p>
                      <p className={cn("text-[10px] font-medium mt-1", d < 7 ? "text-red" : d < 14 ? "text-amber" : "text-green")}>
                        Faltan {d} días
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Density Heatmap */}
          <div className="bg-elevated border border-border p-5 rounded-xl">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-text-muted mb-4">Densidad de Exámenes</h3>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, height: 80, padding: '0 16px' }}>
              {heatmapWeeks.map((week, i) => {
                const count = examCountPerWeek[i];
                const height = count === 0 ? 8 : count === 1 ? 28 : count === 2 ? 44 : 56;
                const color = count === 0 ? 'var(--bg-hover)' 
                            : count >= 3 ? 'var(--red)' 
                            : 'var(--amber)';
                return (
                  <div key={week} style={{ flex: 1, display: 'flex', flexDirection: 'column', 
                    alignItems: 'center', gap: 4 }}>
                    {count > 0 && (
                      <span style={{ fontSize: 10, color: color, fontWeight: 'bold' }}>{count}</span>
                    )}
                    <div style={{ width: '100%', height, background: color, 
                      borderRadius: 3, opacity: count === 0 ? 0.4 : 1 }} />
                    <span style={{ fontSize: 9, color: 'var(--text-muted)' }}>S{week}</span>
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      )}
    </div>
  );
};

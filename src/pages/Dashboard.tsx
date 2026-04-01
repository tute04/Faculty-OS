import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { BookOpen, CheckCircle2, ArrowRight, Flame, CalendarPlus } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useExams } from '../hooks/useExams';
import { useWeekBlocks } from '../hooks/useWeekBlocks';
import { useHabits } from '../hooks/useHabits';
import { useMaterias } from '../hooks/useMaterias';
import { useAuth } from '../lib/auth';
import { cn, daysUntil, greetingES, formatDateES, generateGoogleCalendarUrl } from '../lib/utils';
import { CountdownChip } from '../components/ui/CountdownChip';
import { PriorityBadge } from '../components/ui/PriorityBadge';
import { calculatePriorityScore } from '../lib/priority';
import { QuickLinks } from '../components/dashboard/QuickLinks';

// Feature Components
import { StatCardsRow } from '../features/dashboard/components/StatCardsRow';
import { MiniPlanner } from '../features/dashboard/components/MiniPlanner';
import { Modal } from '../components/ui/Modal';
import { Button } from '../components/ui/Button';

// ─── Dashboard ──────────────────────────────────────────────────────────────────
export const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const { exams, subjectStatuses, loading: examsLoading } = useExams();
  const { blocks, loading: blocksLoading } = useWeekBlocks();
  const { habits, toggleDay, loading: habitsLoading } = useHabits();
  const { materias } = useMaterias();

  const [dismissedAlerts, setDismissedAlerts] = useState<Set<string>>(new Set());

  const now = new Date();
  const upcomingExams = exams
    .filter((e) => e.status === 'pendiente' && new Date(e.date) >= new Date(new Date().setHours(0,0,0,0)))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 4);

  const priorityExams = exams
    .filter(e => e.status === 'pendiente')
    .map(e => ({ ...e, priority: calculatePriorityScore(e, blocks) }))
    .sort((a, b) => b.priority - a.priority)
    .slice(0, 3);

  const pendingCount = exams.filter(e => e.status === 'pendiente').length;
  const graded = exams.filter(e => typeof e.grade === 'number');
  const avg = graded.length > 0 ? (graded.reduce((acc,e) => acc + e.grade!, 0) / graded.length).toFixed(1) : '–';

  const weeklyLoad = blocks
    .filter(b => b.category === 'facultad' || b.category === 'estudio')
    .reduce((acc, b) => acc + (b.endHour - b.startHour), 0);

  const containerVars = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.05 } } };

  const activeAlerts = subjectStatuses.filter(s => 
    (s.hasLost || s.currentFails === s.maxFails - 1) && !dismissedAlerts.has(s.subject)
  );

  if (examsLoading || blocksLoading || habitsLoading) {
    return (
      <div className="max-w-6xl mx-auto h-full flex flex-col pt-8 animate-pulse">
        <div className="h-10 w-48 bg-elevated rounded mb-8" />
        <div className="flex-1 min-h-0 pr-1 flex flex-col gap-6 w-full pb-12">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(k => <div key={k} className="h-[110px] bg-elevated rounded-card" />)}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            <div className="lg:col-span-3 h-[400px] bg-elevated rounded-card" />
            <div className="lg:col-span-2 h-[400px] bg-elevated rounded-card" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto h-full flex flex-col">
      {/* Header */}
      <header className="mb-8 pt-2 shrink-0">
        <p className="text-amber-soft font-medium tracking-[0.5px] text-[11px] uppercase mb-1 flex items-center gap-2">
          <span>{formatDateES(now.toISOString())}</span>
          <span className="w-1 h-1 rounded-full bg-border-accent" />
          <span>Primer Cuatrimestre</span>
        </p>
        <h1 className="text-2xl font-semibold tracking-[-0.5px] text-text-primary">
          {greetingES()}, {user?.user_metadata?.full_name?.split(' ')[0] || 'Estudiante'}.
        </h1>
      </header>

      {/* Main Grid */}
      <div className="flex-1 overflow-y-auto min-h-0 pr-1">
        <motion.div variants={containerVars} initial="hidden" animate="show" className="flex flex-col gap-6 pb-12">
          
          {/* Regularidad Alerts */}
          {activeAlerts.length > 0 && (
            <div className="flex flex-col gap-2">
              {activeAlerts.map(alert => (
                <div key={alert.subject} className={cn("rounded-[10px] p-3 flex flex-col md:flex-row md:items-center justify-between gap-3 text-sm border", alert.hasLost ? "bg-red/10 border-red/20 text-red" : "bg-amber/10 border-amber/20 text-amber")}>
                  <div className="flex items-center gap-2 font-medium">
                    <span>{alert.hasLost ? '🔴' : '⚠️'}</span>
                    <span>
                      {alert.hasLost 
                        ? `Perdiste la regularidad en ${alert.subject}. Contactá a tu departamento.` 
                        : `Estás en riesgo de perder la regularidad en ${alert.subject}. ${alert.currentFails} desaprobados de máximo ${alert.maxFails} permitidos.`}
                    </span>
                  </div>
                  <div className="flex gap-4">
                    <Link to="/examenes" className="hover:underline font-bold">Ver detalle</Link>
                    <button onClick={() => setDismissedAlerts(prev => new Set(prev).add(alert.subject))} className="hover:opacity-75">✕</button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Stats Row */}
          <StatCardsRow 
            examsCount={exams.length}
            pendingCount={pendingCount}
            avg={avg}
            gradedCount={graded.length}
            weeklyLoad={weeklyLoad}
            nextExamDays={upcomingExams.length > 0 ? daysUntil(upcomingExams[0].date) : undefined}
            nextExamSubject={upcomingExams.length > 0 ? upcomingExams[0].subject : undefined}
          />

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            {/* Left: Upcoming Exams */}
            <motion.div variants={{ hidden: { opacity: 0 }, show: { opacity: 1 } }} className="lg:col-span-3 card">
              <div className="flex items-center gap-3 mb-6">
                <BookOpen size={18} className="text-text-muted" />
                <h2 className="text-sm font-semibold tracking-[-0.2px] text-text-primary">Próximos Exámenes</h2>
              </div>
              <div className="flex flex-col gap-3">
                {upcomingExams.length === 0 && <p className="text-xs text-text-muted">No hay exámenes programados.</p>}
                {upcomingExams.map(ex => (
                  <div key={ex.id} className="flex items-center justify-between p-3 rounded-card bg-base border border-border/50 hover:border-border transition-colors group">
                    <div className="flex flex-col gap-1 min-w-0 pr-4">
                      <p className="text-[13px] font-medium text-text-primary truncate">{ex.subject}</p>
                      <div className="flex items-center gap-2 text-[11px] text-text-muted">
                        <span className="uppercase tracking-wide">{ex.type}</span>
                        <span>·</span>
                        <span>{formatDateES(ex.date)}</span>
                      </div>
                      <a 
                        href={generateGoogleCalendarUrl(ex)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 text-[10px] text-amber-soft font-bold mt-1 hover:text-amber transition-colors opacity-0 group-hover:opacity-100"
                      >
                        <CalendarPlus size={12} />
                        Agendar en Calendar
                      </a>
                    </div>
                    <CountdownChip days={daysUntil(ex.date)} className="opacity-90 group-hover:opacity-100" />
                  </div>
                ))}
              </div>
              <Link to="/examenes" className="flex items-center gap-2 text-[11px] font-bold text-amber hover:underline mt-6">
                Ver todos los exámenes <ArrowRight size={12} />
              </Link>
            </motion.div>

            {/* Right: Habits & Priority */}
            <motion.div variants={{ hidden: { opacity: 0 }, show: { opacity: 1 } }} className="lg:col-span-2 flex flex-col gap-6">
              <div className="card">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 size={18} className="text-text-muted" />
                    <h2 className="text-sm font-semibold tracking-[-0.2px] text-text-primary">Hábitos</h2>
                  </div>
                </div>
                <div className="flex flex-col gap-4">
                  {habits.map(h => {
                    const completed = h.completedDays.filter(Boolean).length;
                    const pct = Math.min((completed / h.targetDays) * 100, 100);
                    return (
                      <div key={h.id} className="flex flex-col gap-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-medium text-text-primary">{h.label}</span>
                          <span className="text-text-muted">{completed}/{h.targetDays}</span>
                        </div>
                        <div className="progress-track">
                          <div className="progress-fill" style={{ width: `${pct}%`, backgroundColor: h.color }} />
                        </div>
                        <div className="flex justify-between mt-1">
                          {['L', 'M', 'X', 'J', 'V', 'S', 'D'].map((d, i) => (
                            <button
                              key={i}
                              className={cn("w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold transition-all border", h.completedDays[i] ? "border-transparent text-[#17130b]" : "bg-elevated text-text-muted border-border")}
                              style={h.completedDays[i] ? { backgroundColor: h.color } : {}}
                              onClick={() => toggleDay(h.id, i)}
                            >
                              {d}
                            </button>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="card flex-1">
                <div className="flex items-center gap-3 mb-6">
                  <Flame size={18} className="text-amber" />
                  <h2 className="text-sm font-semibold tracking-[-0.2px] text-text-primary">Qué estudiar hoy</h2>
                </div>
                <div className="flex flex-col gap-3">
                  {priorityExams.length === 0 ? (
                    <p className="text-xs text-text-muted">No hay exámenes próximos.</p>
                  ) : (
                    priorityExams.map(ex => {
                      const materia = materias.find(m => m.name === ex.subject);
                      const pendingEntregas = materia ? materia.entregas.filter(e => !e.done && daysUntil(e.dueDate) <= 7 && daysUntil(e.dueDate) >= 0).sort((a,b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()) : [];
                      return (
                        <div key={ex.id} className="flex flex-col p-2 rounded-[8px] border border-border bg-base group hover:border-border-accent transition-colors">
                          <div className="flex justify-between items-center w-full">
                            <div className="flex flex-col gap-1 min-w-0 pr-2">
                               <span className="text-[13px] font-medium text-text-primary truncate">{ex.subject}</span>
                               <span className="text-[11px] text-text-muted capitalize">{ex.type}</span>
                            </div>
                            <div className="flex flex-col items-end gap-1 shrink-0">
                               <PriorityBadge score={ex.priority} />
                               {daysUntil(ex.date) <= 1 ? (
                                 <Link to={`/modo-examen/${ex.id}`} className="text-[10px] text-amber font-bold hover:underline">Modo examen →</Link>
                               ) : (
                                 <span className="text-[10px] text-text-faint">{daysUntil(ex.date)} días</span>
                               )}
                            </div>
                          </div>
                          {pendingEntregas.length > 0 && (
                            <div className="flex flex-col gap-1 border-t border-border pt-2 mt-2">
                              {pendingEntregas.slice(0, 2).map(ent => (
                                <span key={ent.id} className="text-[11px] text-text-muted truncate">⚡ {ent.title} — {daysUntil(ent.dueDate)} días</span>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </motion.div>
          </div>

          <QuickLinks materias={materias} />

          <motion.div variants={{ hidden: { opacity: 0 }, show: { opacity: 1 } }}>
            <MiniPlanner blocks={blocks} />
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};

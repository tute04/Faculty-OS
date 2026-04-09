import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, BookOpen, Brain, Calendar, CheckCircle2, ChevronRight, Clock, Plus, Package } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useExams } from '../hooks/useExams';
import { useWeekBlocks } from '../hooks/useWeekBlocks';

import { useMaterias } from '../hooks/useMaterias';
import { useAuth } from '../lib/auth';
import { supabase } from '../lib/supabase';
import { cn, daysUntil, greetingES, formatDateES, generateGoogleCalendarUrl, getCuatrimestre, getUserFirstName } from '../lib/utils';
import { CountdownChip } from '../components/ui/CountdownChip';
import { ExamTypeBadge } from '../components/ui/ExamTypeBadge';
import { calculatePriorityScore } from '../lib/priority';


// Feature Components
import { StatCardsRow } from '../features/dashboard/components/StatCardsRow';
import { MiniPlanner } from '../features/dashboard/components/MiniPlanner';

// ─── Dashboard ──────────────────────────────────────────────────────────────────
export const Dashboard: React.FC = () => {
  const { profile, user } = useAuth();
  const { exams, subjectStatuses, loading: examsLoading, refetch: refetchExams } = useExams();
  const { blocks, loading: blocksLoading, refetch: refetchWeekBlocks } = useWeekBlocks();

  const [dismissedAlerts, setDismissedAlerts] = useState<Set<string>>(new Set());
  const { materias, updateEntrega } = useMaterias();

  useEffect(() => {
    // Seeding logic removed to prevent auto-creation when exams are deleted
  }, [user?.id]);

  const now = new Date();

  const upcomingExams = exams
    .filter((e) => e.status === 'pendiente' && e.type !== 'TP' && new Date(e.date) >= new Date(new Date().setHours(0,0,0,0)))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 4);

  const pendingAll = exams
    .filter((e) => e.status === 'pendiente' && new Date(e.date) >= new Date(new Date().setHours(0,0,0,0)))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const priorityExams = exams
    .filter(e => e.status === 'pendiente' && e.type !== 'TP')
    .map(e => ({ ...e, priority: calculatePriorityScore(e, blocks) }))
    .sort((a, b) => b.priority - a.priority)
    .slice(0, 3);

  const pendingCount = exams.filter(e => e.status === 'pendiente').length;
  const graded = exams.filter(e => typeof e.grade === 'number');
  const avg = graded.length > 0 ? (graded.reduce((acc,e) => acc + e.grade!, 0) / graded.length).toFixed(1) : '–';
  const weeklyLoad = blocks
    .filter(b => b.category === 'facultad' || b.category === 'estudio')
    .reduce((acc, b) => acc + (b.endHour - b.startHour), 0);

  const heroExam = pendingAll[0];
  const heroDays = heroExam ? daysUntil(heroExam.date) : -1;
  const heroPriority = heroExam ? calculatePriorityScore(heroExam, blocks) : 0;

  const containerVars = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.05 } } };
  const activeAlerts = subjectStatuses.filter(s => (s.hasLost || s.currentFails === s.maxFails - 1) && !dismissedAlerts.has(s.subject));

  const firstName = getUserFirstName(profile, user);

  // ── Próximas Entregas ───────────────────────────────────────────────────────
  type EntregaFlat = { id: string; title: string; dueDate: string; done: boolean; notes?: string; materiaId: string; materiaName: string; color: string; isTP?: boolean };

  const pendingEntregas: EntregaFlat[] = [
    ...materias.flatMap(m => m.entregas.map(e => ({ ...e, materiaId: m.id, materiaName: m.name, color: m.color, isTP: false }))),
    ...exams.filter(e => e.type === 'TP' && e.status === 'pendiente').map(e => ({
      id: e.id,
      title: e.subject,
      dueDate: e.date,
      done: false,
      notes: e.notes,
      materiaId: e.id,
      materiaName: "Examen",
      color: "var(--text-muted)",
      isTP: true
    }))
  ]
    .filter(e => !e.done)
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
    .slice(0, 4);

  const [checkingId, setCheckingId] = useState<string | null>(null);

  const handleEntregaDone = async (materiaId: string, entregaId: string) => {
    setCheckingId(entregaId);
    await updateEntrega(materiaId, entregaId, { done: true });
    setCheckingId(null);
  };

  const isStagedLoading = (examsLoading && blocksLoading);

  if (isStagedLoading) {
    return (
      <div className="max-w-6xl mx-auto h-full flex flex-col pt-8 animate-pulse page-container overflow-y-auto">
        <div className="h-10 w-48 bg-elevated rounded mb-8" />
        <div className="flex-1 min-h-0 pr-1 flex flex-col gap-6 w-full pb-12">
          <div className="h-[200px] bg-elevated rounded-card" />
          <div className="grid grid-cols-3 gap-4">
             {[1,2,3].map(k => <div key={k} className="h-20 bg-elevated rounded-card" />)}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            <div className="lg:col-span-3 h-[400px] bg-elevated rounded-card" />
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
          <span>{getCuatrimestre()}</span>
        </p>
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold tracking-[-0.5px] text-text-primary">
            {greetingES()}, {firstName}.
          </h1>
        </div>
      </header>

      {/* Main Grid */}
      <div className="flex-1 overflow-y-auto min-h-0 pr-1 page-container">
        <motion.div variants={containerVars} initial="hidden" animate="show" className="flex flex-col gap-8 pb-12">
          
          {/* Regularidad Alerts */}
          {activeAlerts.length > 0 && (
            <div className="flex flex-col gap-2">
              {activeAlerts.map(alert => (
                <div key={alert.subject} className={cn("rounded-[10px] p-3 flex flex-col md:flex-row md:items-center justify-between gap-3 text-sm border", alert.hasLost ? "bg-red/10 border-red/20 text-red" : "bg-amber/10 border-amber/20 text-amber")}>
                  <div className="flex items-center gap-2 font-medium">
                    <span>{alert.hasLost ? '🔴' : '⚠️'}</span>
                    <span>{alert.hasLost ? `Perdiste la regularidad en ${alert.subject}.` : `Riesgo en ${alert.subject}. ${alert.currentFails}/${alert.maxFails} fallos.`}</span>
                  </div>
                  <Link to="/examenes" className="hover:underline font-bold shrink-0">Ver detalle</Link>
                </div>
              ))}
            </div>
          )}

          <div className="flex flex-col gap-6">
            {heroExam && heroDays >= 0 && heroDays <= 30 ? (
              <Link to="/examenes" className="card border-accent/30 bg-accent/5 p-8 flex flex-col md:flex-row justify-between items-center group relative overflow-hidden transition-all hover:bg-accent/10">
                <div className="flex flex-col gap-2 text-center md:text-left mb-6 md:mb-0 relative z-10 w-full md:w-auto">
                  <div className="flex items-center justify-center md:justify-start gap-2 mb-1">
                    <span className="px-2.5 py-1 rounded-[6px] bg-accent text-white text-[11px] font-bold uppercase tracking-wider">{heroExam.type === 'TP' ? 'ENTREGA' : heroExam.type}</span>
                  </div>
                  <h2 className="text-[24px] font-medium text-text-primary">{heroExam.subject}</h2>
                  <p className="text-[13px] text-text-muted mt-1">{formatDateES(heroExam.date)}</p>
                </div>
                <div className="flex flex-col items-center md:items-end relative z-10 p-2 min-w-[140px]">
                  <span className="text-[64px] font-semibold text-accent leading-none tracking-tight">{heroDays}</span>
                  <span className="text-[11px] font-bold text-text-muted uppercase tracking-widest mt-2">DÍAS</span>
                </div>
              </Link>
            ) : (
              <StatCardsRow 
                examsCount={exams.length} pendingCount={pendingCount} avg={avg} gradedCount={graded.length} weeklyLoad={weeklyLoad}
                nextExamDays={heroDays >= 0 ? heroDays : undefined} nextExamSubject={heroExam?.subject}
              />
            )}

            {/* Secondary Stats Row (only if Hero is visible) */}
            {heroExam && heroDays >= 0 && heroDays <= 30 && (
              <div className="grid grid-cols-3 gap-6">
                <div className="card p-5 flex flex-col items-center justify-center text-center">
                  <p className="text-[11px] uppercase tracking-widest font-bold text-text-muted mb-1">Por Hacer</p>
                  <p className="text-[28px] font-bold text-text-primary">{pendingCount}</p>
                </div>
                <div className="card p-5 flex flex-col items-center justify-center text-center">
                  <p className="text-[11px] uppercase tracking-widest font-bold text-text-muted mb-1">Carga Semanal</p>
                  <p className="text-[28px] font-bold text-text-primary">{weeklyLoad === 0 ? "—" : <>{weeklyLoad}<span className="text-[16px] text-text-muted ml-1">h/sem</span></>}</p>
                </div>
                <div className="card p-5 flex flex-col items-center justify-center text-center">
                  <p className="text-[11px] uppercase tracking-widest font-bold text-text-muted mb-1">Aprobados</p>
                  <p className="text-[28px] font-bold text-text-primary">{graded.length}</p>
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left: Upcoming Exams */}
            <motion.div variants={{ hidden: { opacity: 0 }, show: { opacity: 1 } }} className="card h-fit">
              <div className="flex items-center gap-3 mb-6">
                <BookOpen size={18} className="text-text-muted" />
                <h2 className="text-sm font-semibold tracking-wide text-text-primary uppercase">Próximos Exámenes</h2>
              </div>
              <div className="flex flex-col gap-3">
                {upcomingExams.length === 0 && (
                  <div className="bg-surface border border-dashed border-amber/50 rounded-[12px] p-5 text-center flex flex-col items-center justify-center gap-2">
                    <p className="text-[13px] text-text-secondary">No hay exámenes programados.</p>
                    <Link to="/examenes?add=true" className="text-amber font-medium text-[13px] hover:underline">Agregá tu primer examen</Link>
                  </div>
                )}
                {upcomingExams.map(ex => {
                  const d = daysUntil(ex.date);
                  return (
                    <Link key={ex.id} to="/examenes" className="flex items-center justify-between p-3 rounded-card hover:bg-hover transition-colors group h-[56px] gap-4">
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className={cn("px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider shrink-0", 
                          ex.type === 'parcial' ? "bg-amber/10 text-amber" : 
                          ex.type === 'final' ? "bg-red/10 text-red" : 
                          "bg-surface border border-border text-text-muted"
                        )}>
                          {ex.type}
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="text-[14px] font-medium text-text-primary truncate">{ex.subject}</span>
                          {ex.notes && <span className="text-[12px] text-text-muted truncate mt-0.5">{ex.notes}</span>}
                        </div>
                      </div>
                      <div className="flex items-center gap-4 shrink-0">
                        <span className="text-[12px] text-text-muted">{formatDateES(ex.date)}</span>
                        {d < 0 ? (
                           <span className="px-2 py-0.5 rounded-[6px] text-[11px] font-bold uppercase tracking-widest bg-surface text-text-muted border border-border">Pasado</span>
                        ) : d < 7 ? (
                           <span className="px-2 py-0.5 rounded-[6px] text-[11px] font-bold text-white bg-[#ef4444] tracking-widest">{d}d</span>
                        ) : d < 14 ? (
                           <span className="px-2 py-0.5 rounded-[6px] text-[11px] font-bold text-[#1a0f00] bg-[#f59e0b] tracking-widest">{d}d</span>
                        ) : d < 31 ? (
                           <span className="text-[12px] font-medium text-text-muted flex items-center gap-1"><Clock size={12}/>{d}d</span>
                        ) : null}
                      </div>
                    </Link>
                  );
                })}
              </div>
              <Link to="/examenes" className="flex items-center gap-2 text-[12px] font-bold text-accent hover:underline mt-6">
                Ver todos los exámenes <ArrowRight size={14} />
              </Link>
            </motion.div>

            {/* Right: Hábitos, Entregas & Priority */}
            <motion.div variants={{ hidden: { opacity: 0 }, show: { opacity: 1 } }} className="flex flex-col gap-6">
              
              {/* ── Próximas Entregas ─────────────────────────────────────── */}
              <div className="card">
                <div className="flex items-center gap-3 mb-5">
                  <Package size={18} className="text-text-muted" />
                  <h2 className="text-sm font-semibold tracking-wide text-text-primary uppercase">Próximas Entregas</h2>
                </div>
                <div className="flex flex-col gap-2">
                  {pendingEntregas.length === 0 && (
                    <p className="text-xs text-text-muted italic">No hay entregas pendientes. ¡Todo al día!</p>
                  )}
                  {pendingEntregas.map(e => {
                    const due = new Date(e.dueDate);
                    const diffDays = Math.ceil((due.getTime() - Date.now()) / 86400000);
                    
                    if (e.isTP) {
                      return (
                        <div key={e.id} className="flex items-center justify-between p-3 rounded-card hover:bg-hover transition-colors group h-[56px] gap-4">
                          <div className="flex items-center gap-3 min-w-0 flex-1">
                            <div className="px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider shrink-0 bg-transparent border border-border text-text-muted">
                              TP
                            </div>
                            <div className="flex flex-col min-w-0">
                              <span className="text-[14px] font-medium text-text-primary truncate">{e.title}</span>
                              {e.notes && <span className="text-[12px] text-text-muted truncate mt-0.5">{e.notes}</span>}
                            </div>
                          </div>
                          <div className="flex items-center gap-4 shrink-0">
                            <span className="text-[12px] text-text-muted hidden sm:inline-block">{formatDateES(e.dueDate)}</span>
                            {diffDays < 0 ? (
                               <span className="px-2 py-0.5 rounded-[6px] text-[11px] font-bold uppercase tracking-widest bg-surface text-text-muted border border-border">Pasado</span>
                            ) : diffDays < 7 ? (
                               <span className="px-2 py-0.5 rounded-[6px] text-xs font-medium bg-red/10 text-red border border-red/20">{diffDays}d</span>
                            ) : diffDays < 14 ? (
                               <span className="px-2 py-0.5 rounded-[6px] text-xs font-medium bg-amber/10 text-amber border border-amber/20">{diffDays}d</span>
                            ) : (
                               <span className="px-2 py-0.5 rounded-[6px] text-xs font-medium bg-surface text-text-muted border border-border">{diffDays}d</span>
                            )}
                          </div>
                        </div>
                      );
                    }

                    const isOverdue = diffDays < 0;
                    const isUrgent = diffDays >= 0 && diffDays <= 2;
                    return (
                      <div key={e.id} className="flex items-center gap-3 p-3 rounded-[10px] border border-border/50 bg-base group hover:border-border transition-colors">
                        <button
                          onClick={() => handleEntregaDone(e.materiaId, e.id)}
                          disabled={checkingId === e.id}
                          className="shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all hover:scale-110 active:scale-95"
                          style={{ borderColor: e.color }}
                          aria-label={`Marcar "${e.title}" como entregada`}
                        >
                          {checkingId === e.id && <span className="w-3 h-3 rounded-full animate-pulse" style={{ backgroundColor: e.color }} />}
                        </button>
                        <div className="flex flex-col min-w-0 flex-1">
                          <span className="text-[14px] font-semibold text-text-primary truncate flex items-center gap-2">
                            {e.title}
                          </span>
                          <span className="text-[12px] text-text-muted truncate mt-0.5">{e.materiaName}</span>
                        </div>
                        <span className={cn(
                          "text-[12px] font-bold uppercase shrink-0 ml-1 px-2 py-1 rounded-[6px] border",
                          isOverdue ? "text-red bg-red/10 border-red/20" : isUrgent ? "text-accent bg-accent/10 border-accent/20" : "text-text-muted bg-elevated border-border"
                        )}>
                          {isOverdue ? `hace ${Math.abs(diffDays)}d` : diffDays === 0 ? "hoy" : `en ${diffDays}d`}
                        </span>
                      </div>
                    );
                  })}
                </div>
                <Link to="/materias" className="flex items-center justify-end gap-2 text-[12px] font-bold text-accent hover:underline mt-4">
                  Ir a Materias <ArrowRight size={14} />
                </Link>
              </div>

              <div className="card">
                <div className="flex items-center gap-3 mb-6">
                   <h2 className="text-sm font-semibold tracking-wide text-text-primary uppercase">Foco de Estudio Sugerido</h2>
                </div>
                <div className="flex flex-col gap-3">
                  {priorityExams.length === 0 ? (
                    <p className="text-xs text-text-muted italic">No hay exámenes próximos a preparar.</p>
                  ) : (
                    priorityExams.map(ex => {
                      if (ex.priority <= 30) return null;
                      return (
                        <div key={ex.id} className="flex flex-col p-3 rounded-[10px] border border-border bg-base">
                           <div className="flex justify-between items-start w-full">
                            <div className="flex flex-col gap-0.5 min-w-0 pr-2">
                               <span className="text-[14px] font-semibold text-text-primary truncate">{ex.subject}</span>
                               <span className="text-[12px] text-text-muted uppercase font-medium mt-0.5">{ex.type}</span>
                            </div>
                            <div className="flex items-center gap-2 shrink-0 h-5">
                               <div className={cn("w-2.5 h-2.5 rounded-full", ex.priority > 60 ? "bg-red animate-pulse" : "bg-accent")} />
                               <span className={cn("text-[12px] font-bold uppercase tracking-tight", ex.priority > 60 ? "text-red" : "text-text-secondary")}>
                                 {ex.priority > 60 ? "Estudiá hoy" : "Esta semana"}
                               </span>
                            </div>
                          </div>
                        </div>
                      );
                    }).filter(Boolean)
                  )}
                  {priorityExams.every(ex => ex.priority <= 30) && (
                    <p className="text-[12px] text-text-muted italic ml-1 font-medium">Todo bajo control. Buen trabajo.</p>
                  )}
                </div>
              </div>
            </motion.div>
          </div>

          <motion.div variants={{ hidden: { opacity: 0 }, show: { opacity: 1 } }} className="hidden md:block">
            <MiniPlanner blocks={blocks} />
          </motion.div>
          
        </motion.div>
      </div>
    </div>
  );
};

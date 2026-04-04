import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { BookOpen, CheckCircle2, ArrowRight, CalendarPlus, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useExams } from '../hooks/useExams';
import { useWeekBlocks } from '../hooks/useWeekBlocks';
import { useHabits } from '../hooks/useHabits';
import { useMaterias } from '../hooks/useMaterias';
import { useAuth } from '../lib/auth';
import { cn, daysUntil, greetingES, formatDateES, generateGoogleCalendarUrl, getCuatrimestre, getUserFirstName } from '../lib/utils';
import { CountdownChip } from '../components/ui/CountdownChip';
import { calculatePriorityScore } from '../lib/priority';
import { QuickLinks } from '../components/dashboard/QuickLinks';

// Feature Components
import { StatCardsRow } from '../features/dashboard/components/StatCardsRow';
import { MiniPlanner } from '../features/dashboard/components/MiniPlanner';

// ─── Dashboard ──────────────────────────────────────────────────────────────────
export const Dashboard: React.FC = () => {
  const { profile } = useAuth();
  const { exams, subjectStatuses, loading: examsLoading } = useExams();
  const { blocks, loading: blocksLoading } = useWeekBlocks();
  const { habits, toggleDay, loading: habitsLoading } = useHabits();
  const [dismissedAlerts, setDismissedAlerts] = useState<Set<string>>(new Set());
  const { materias } = useMaterias();

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

  const heroExam = upcomingExams[0];
  const heroDays = heroExam ? daysUntil(heroExam.date) : -1;
  const heroPriority = heroExam ? calculatePriorityScore(heroExam, blocks) : 0;

  const containerVars = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.05 } } };
  const activeAlerts = subjectStatuses.filter(s => (s.hasLost || s.currentFails === s.maxFails - 1) && !dismissedAlerts.has(s.subject));

  const firstName = getUserFirstName(profile);

  const isStagedLoading = (examsLoading && blocksLoading && habitsLoading);

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
          <button 
            onClick={() => window.dispatchEvent(new KeyboardEvent('keydown', { key: 'i', ctrlKey: true }))}
            className="hidden md:flex items-center gap-2 text-[10px] uppercase font-bold text-text-muted hover:text-amber transition-colors bg-elevated px-3 py-1.5 rounded-lg border border-border"
          >
            <Plus size={12} />
            Importar Fechas
          </button>
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

          {/* New Hero Section */}
          <div className="flex flex-col gap-6">
            {heroExam && heroDays >= 0 && heroDays <= 30 ? (
              <Link to="/examenes" className="card relative overflow-hidden bg-gradient-to-br from-amber/10 to-transparent border-amber/20 hover:border-amber/40 transition-all p-8 md:p-10 flex flex-col md:flex-row justify-between items-center group">
                <div className="flex flex-col gap-3 text-center md:text-left mb-6 md:mb-0">
                  <div className="flex items-center justify-center md:justify-start gap-2">
                    <span className="px-2 py-0.5 rounded-[4px] bg-amber/10 text-amber text-[10px] font-bold uppercase tracking-widest leading-none">{heroExam.type}</span>
                  </div>
                  <h2 className="text-[22px] md:text-[26px] font-medium text-text-primary leading-tight max-w-[400px] tracking-tight">{heroExam.subject}</h2>
                  <p className={cn(
                    "text-[15px] font-medium opacity-90",
                    heroPriority > 60 ? "text-red" : heroPriority > 30 ? "text-amber" : "text-text-muted"
                  )}>
                    {heroPriority > 60 ? "Deberías estudiar hoy." : heroPriority > 30 ? "Empezá esta semana." : "Todavía tenés tiempo."}
                  </p>
                </div>
                <div className="flex flex-col items-center md:items-end">
                  <span className="text-[54px] md:text-[72px] font-bold text-amber leading-none transition-transform group-hover:scale-105 duration-300">{heroDays}</span>
                  <span className="text-[12px] md:text-[14px] font-bold text-text-muted uppercase tracking-[0.2em] -mt-1 md:-mt-2">días</span>
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
              <div className="grid grid-cols-3 gap-4">
                <div className="card p-3 md:p-4 flex flex-col items-center justify-center text-center">
                  <p className="label mb-0.5">Pendientes</p>
                  <p className="text-xl md:text-2xl font-bold text-text-primary">{pendingCount}</p>
                </div>
                <div className="card p-3 md:p-4 flex flex-col items-center justify-center text-center">
                  <p className="label mb-0.5">Carga Semanal</p>
                  <p className="text-xl md:text-2xl font-bold text-text-primary">{weeklyLoad}<span className="text-sm ml-1 text-text-muted font-normal">h</span></p>
                </div>
                <div className="card p-3 md:p-4 flex flex-col items-center justify-center text-center">
                  <p className="label mb-0.5">Aprobados</p>
                  <p className="text-xl md:text-2xl font-bold text-text-primary">{graded.length}</p>
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            {/* Left: Upcoming Exams */}
            <motion.div variants={{ hidden: { opacity: 0 }, show: { opacity: 1 } }} className="lg:col-span-3 card h-fit">
              <div className="flex items-center gap-3 mb-6">
                < BookOpen size={18} className="text-text-muted" />
                <h2 className="text-sm font-semibold tracking-[-0.2px] text-text-primary">Próximos Exámenes</h2>
              </div>
              <div className="flex flex-col gap-3">
                {upcomingExams.length === 0 && <p className="text-xs text-text-muted">No hay exámenes programados.</p>}
                {upcomingExams.map(ex => (
                  <div key={ex.id} className="flex items-center justify-between p-3 rounded-card bg-base border border-border/50 hover:border-border transition-colors group">
                    <div className="flex flex-col gap-1 min-w-0 pr-4">
                      <p className="text-[13px] font-medium text-text-primary truncate">{ex.subject}</p>
                      <div className="flex items-center gap-2 text-[11px] text-text-muted">
                        <span className="uppercase tracking-wide font-semibold">{ex.type}</span>
                        <span>·</span>
                        <span>{formatDateES(ex.date)}</span>
                      </div>
                      <a 
                        href={generateGoogleCalendarUrl(ex)} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-1.5 text-[10px] text-amber-soft font-bold mt-1.5 opacity-70 hover:opacity-100 transition-all"
                      >
                        <CalendarPlus size={12} className="text-amber" />
                        Agendar en Calendar
                      </a>
                    </div>
                    <CountdownChip days={daysUntil(ex.date)} date={formatDateES(ex.date)} className="opacity-90 group-hover:opacity-100" />
                  </div>
                ))}
              </div>
              <Link to="/examenes" className="flex items-center gap-2 text-[11px] font-bold text-amber hover:underline mt-6 uppercase tracking-wider">
                Ver todos <ArrowRight size={12} />
              </Link>
            </motion.div>

            {/* Right: Habits & Priority (Hide on mobile or move below) */}
            <motion.div variants={{ hidden: { opacity: 0 }, show: { opacity: 1 } }} className="lg:col-span-2 flex-col gap-6 hidden md:flex">
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

              <div className="card">
                <div className="flex items-center gap-3 mb-6">
                   <h2 className="text-sm font-semibold tracking-[-0.2px] text-text-primary uppercase tracking-wider">Qué estudiar hoy</h2>
                </div>
                <div className="flex flex-col gap-3">
                  {priorityExams.length === 0 ? (
                    <p className="text-xs text-text-muted italic">No hay exámenes próximos.</p>
                  ) : (
                    priorityExams.map(ex => {
                      if (ex.priority <= 30) return null;
                      return (
                        <div key={ex.id} className="flex flex-col p-3 rounded-[10px] border border-border bg-base group hover:border-amber/20 transition-colors">
                           <div className="flex justify-between items-start w-full">
                            <div className="flex flex-col gap-0.5 min-w-0 pr-2">
                               <span className="text-[13px] font-semibold text-text-primary truncate">{ex.subject}</span>
                               <span className="text-[11px] text-text-muted uppercase font-medium">{ex.type}</span>
                            </div>
                            <div className="flex items-center gap-2 shrink-0 h-5">
                               <div className={cn("w-2 h-2 rounded-full", ex.priority > 60 ? "bg-red animate-pulse" : "bg-amber")} />
                               <span className={cn("text-[11px] font-bold uppercase tracking-tight", ex.priority > 60 ? "text-red" : "text-amber")}>
                                 {ex.priority > 60 ? "Estudiá hoy" : "Empezá esta semana"}
                               </span>
                            </div>
                          </div>
                        </div>
                      );
                    }).filter(Boolean)
                  )}
                  {priorityExams.every(ex => ex.priority <= 30) && (
                    <p className="text-[11px] text-text-muted italic ml-1">Todo bajo control.</p>
                  )}
                </div>
              </div>
            </motion.div>
          </div>

          <QuickLinks materias={materias} />

          <motion.div variants={{ hidden: { opacity: 0 }, show: { opacity: 1 } }} className="hidden md:block">
            <MiniPlanner blocks={blocks} />
          </motion.div>
          
          {/* Mobile redundant but secondary section */}
          <div className="md:hidden flex flex-col gap-6">
            <div className="card">
              <h2 className="text-xs font-bold text-text-muted uppercase tracking-widest mb-4">Hábitos</h2>
              {/* ... habits could go here in condensed form ... */}
              <p className="text-center text-xs text-text-muted p-4 border border-dashed border-border rounded-lg">Ver más en PC</p>
            </div>
          </div>
          
        </motion.div>
      </div>
    </div>
  );
};

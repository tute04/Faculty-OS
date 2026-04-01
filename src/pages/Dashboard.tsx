import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { BookOpen, Calendar, CheckCircle2, ArrowRight, Flame } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useExams } from '../hooks/useExams';
import { useWeekBlocks } from '../hooks/useWeekBlocks';
import { useHabits } from '../hooks/useHabits';
import { useMaterias } from '../hooks/useMaterias';
import { useAuth } from '../lib/auth';
import { SEED_EXAMS, SEED_BLOCKS, SEED_HABITS } from '../lib/seed';
import { cn, daysUntil, CAT_COLORS, greetingES, formatDateES } from '../lib/utils';
import { CountdownChip } from '../components/ui/CountdownChip';
import { PriorityBadge } from '../components/ui/PriorityBadge';
import { calculatePriorityScore } from '../lib/priority';
import { requestNotificationPermission, scheduleExamReminders } from '../lib/notifications';
import { Button } from '../components/ui/Button';
import { Skeleton } from '../components/ui/Skeleton';

// ─── Stat Card w/ Animated Number ──────────────────────────────────────────────
interface StatCardProps {
  label: string;
  value: number | string;
  suffix?: string;
  sublabel?: string;
  colorClass?: string;
}

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

const StatCard: React.FC<StatCardProps> = ({ label, value, suffix, sublabel, colorClass }) => (
  <motion.div variants={{ hidden: { opacity: 0, scale: 0.95 }, show: { opacity: 1, scale: 1 } }} className={cn("card flex flex-col justify-between min-h-[110px]", colorClass)}>
    <p className="label">{label}</p>
    <div className="mt-auto">
      <h3 className="text-3xl font-semibold tracking-tight text-text-primary">
        {typeof value === 'number' ? <AnimatedNumber n={value} /> : value}
        {suffix && <span className="text-xl text-text-muted ml-0.5">{suffix}</span>}
      </h3>
      {sublabel && <p className="text-xs text-text-secondary mt-1">{sublabel}</p>}
    </div>
  </motion.div>
);

// ─── Mini Planner Component ────────────────────────────────────────────────────
export const MiniPlanner: React.FC<{ blocks: any[] }> = ({ blocks }) => {
  const days = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];
  const grid = Array.from({ length: 7 }, () => Array.from({ length: 3 }, () => null as string | null));
  
  blocks.forEach(b => {
    const slot = b.startHour < 13 ? 0 : b.startHour < 18 ? 1 : 2;
    grid[b.day][slot] = b.category;
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
                className="w-full aspect-[2/1] rounded max-w-[40px] transition-colors"
                style={{ backgroundColor: cat ? `var(--accent${cat==='estudio'?'-orange':cat==='emprendimiento'?'-soft':cat==='proyecto'?'-green':''})` : 'transparent', opacity: cat ? 0.9 : 1, ...(cat?{}: { backgroundColor: 'var(--bg-elevated)', border: '0.5px solid var(--border)'}) }}
              />
            ))}
          </div>
        ))}
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-2 mt-5 justify-center">
        {Object.keys(CAT_COLORS).map(cat => (
           <div key={cat} className="flex items-center gap-1.5 label text-[9px]">
             <span className={cn("w-1.5 h-1.5 rounded-full", cat==='facultad'?'bg-amber':cat==='estudio'?'bg-orange':cat==='proyecto'?'bg-green':cat==='emprendimiento'?'bg-amber-soft':'bg-text-muted')} />
             {cat}
           </div>
        ))}
      </div>
    </div>
  );
};

// ─── Page ──────────────────────────────────────────────────────────────────────
export const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const { exams, subjectStatuses, addExam, loading: examsLoading } = useExams();
  const { blocks, addBlock, loading: blocksLoading } = useWeekBlocks();
  const { habits, toggleDay, addHabit, loading: habitsLoading } = useHabits();
  const { materias } = useMaterias();

  // Seed Logic
  useEffect(() => {
    const seed = async () => {
      if (!user) return;
      const key = `fos-seeded-${user.id}`;
      if (localStorage.getItem(key)) return;
      if (examsLoading || blocksLoading || habitsLoading) return;
      
      if (exams.length === 0 && blocks.length === 0 && habits.length === 0) {
        for (const e of SEED_EXAMS) await addExam(e);
        for (const b of SEED_BLOCKS) await addBlock(b as any);
        for (const h of SEED_HABITS) await addHabit(h);
        localStorage.setItem(key, 'true');
      } else {
        localStorage.setItem(key, 'true');
      }
    };
    seed();
  }, [user, exams.length, blocks.length, habits.length, examsLoading, blocksLoading, habitsLoading]);
  const [showNotifBanner, setShowNotifBanner] = useState(false);
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

  useEffect(() => {
    const t = setTimeout(() => {
      if ('Notification' in window && Notification.permission === 'default') {
        if (!localStorage.getItem('fos-notif-dismissed')) {
          setShowNotifBanner(true);
        }
      }
    }, 30000);
    return () => clearTimeout(t);
  }, []);

  const handleNotifActivar = async () => {
    setShowNotifBanner(false);
    const granted = await requestNotificationPermission();
    if (granted) scheduleExamReminders(exams);
  };

  const handleNotifDismiss = () => {
    setShowNotifBanner(false);
    localStorage.setItem('fos-notif-dismissed', 'true');
  };

  const activeAlerts = subjectStatuses.filter(s => 
    (s.hasLost || s.currentFails === s.maxFails - 1) && !dismissedAlerts.has(s.subject)
  );

  if (examsLoading || blocksLoading || habitsLoading) {
    return (
      <div className="max-w-6xl mx-auto h-full flex flex-col pt-8">
        <Skeleton className="h-10 w-48 mb-8" />
        <div className="flex-1 min-h-0 pr-1 flex flex-col gap-6 w-full pb-12">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(k => <Skeleton key={k} className="h-[110px]" />)}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            <Skeleton className="lg:col-span-3 h-[400px]" />
            <Skeleton className="lg:col-span-2 h-[400px]" />
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
          {greetingES()}, {user?.user_metadata?.full_name?.split(' ')[0] || 'Mateo'}.
        </h1>
      </header>

      {/* Main Grid */}
      <div className="flex-1 overflow-y-auto min-h-0 pr-1">
        <motion.div variants={containerVars} initial="hidden" animate="show" className="flex flex-col gap-6 pb-12">
          
          {showNotifBanner && (
            <div className="bg-elevated border border-border rounded-[10px] p-3 flex flex-col md:flex-row md:items-center justify-between gap-3 text-sm">
              <span className="text-text-primary font-medium">Activá recordatorios para no perderte ningún parcial</span>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={handleNotifDismiss}>Ahora no</Button>
                <Button variant="primary" size="sm" onClick={handleNotifActivar} className="!bg-amber !text-[#17130b]">Activar</Button>
              </div>
            </div>
          )}

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
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard label="Total Exámenes" value={exams.length} sublabel={`${pendingCount} pendientes`} />
            <StatCard label="Promedio" value={avg} sublabel={`${graded.length} notas cargadas`} />
            <StatCard 
              label="Carga Semanal" 
              value={weeklyLoad} suffix="h" sublabel="Estudio + Facultad"
              colorClass={weeklyLoad > 40 ? "border-[rgba(239,68,68,0.3)] bg-[rgba(239,68,68,0.05)]" : weeklyLoad > 35 ? "border-[rgba(245,158,11,0.3)] bg-[rgba(245,158,11,0.05)]" : ""} 
            />
            {upcomingExams.length > 0 ? (
               <Link to="/examenes" className="block group">
                 <StatCard 
                   label="Próximo desafío" 
                   value={daysUntil(upcomingExams[0].date)} suffix="días" 
                   sublabel={upcomingExams[0].subject.split(' ')[0] + '...'} 
                   colorClass="hover:border-amber/50 transition-colors relative"
                 />
                 <div className="absolute top-4 right-4 text-amber opacity-0 group-hover:opacity-100 transition-opacity translate-x-1 group-hover:translate-x-0">
                   <ArrowRight size={16} />
                 </div>
               </Link>
            ) : (
               <StatCard label="Próximo desafío" value="–" sublabel="No hay exámenes" />
            )}
          </div>

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
                      <div className="flex gap-2 text-[11px] text-text-muted">
                        <span className="uppercase tracking-wide">{ex.type}</span>
                        <span>·</span>
                        <span>{formatDateES(ex.date)}</span>
                      </div>
                    </div>
                    <CountdownChip days={daysUntil(ex.date)} className="opacity-90 group-hover:opacity-100" />
                  </div>
                ))}
              </div>
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
                              {pendingEntregas.length > 2 && <span className="text-[10px] text-text-faint">+ {pendingEntregas.length - 2} más</span>}
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

          <motion.div variants={{ hidden: { opacity: 0 }, show: { opacity: 1 } }}>
            <MiniPlanner blocks={blocks} />
          </motion.div>

        </motion.div>
      </div>
    </div>
  );
};

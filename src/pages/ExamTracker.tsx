import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Plus, Pencil, Trash2, LayoutList, ChevronDown, ChevronRight, Share2, Info } from 'lucide-react';
import { useExams } from '../hooks/useExams';
import { useWeekBlocks } from '../hooks/useWeekBlocks';
import type { Exam, ExamStatus, ExamType } from '../types';
import { formatDateES, daysUntil, cn } from '../lib/utils';
import { encodeExamToShareLink } from '../lib/share';
import { calculatePriorityScore } from '../lib/priority';
import { Badge } from '../components/ui/Badge';
import { PriorityBadge } from '../components/ui/PriorityBadge';
import { useToast } from '../components/ui/Toast';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';


const TYPES: ExamType[] = ['parcial', 'final', 'TP', 'recuperatorio'];
const STATUSES: ExamStatus[] = ['pendiente', 'aprobado', 'desaprobado', 'libre'];

// ─── Sub-components ─────────────────────────────────────────────────────────────
const SegmentedControl = ({ options, value, onChange }: { options: string[], value: string, onChange: (v: string) => void }) => (
  <div className="flex bg-base p-1 rounded-card border border-border">
    {options.map(opt => (
      <button
        key={opt}
        type="button"
        onClick={() => onChange(opt)}
        className={cn("flex-1 text-xs font-medium py-1.5 rounded-[10px] capitalize transition-all", value === opt ? "bg-surface text-text-primary shadow-sm border border-border/50" : "text-text-muted hover:text-text-secondary")}
      >
        {opt}
      </button>
    ))}
  </div>
);

const CustomCountdownChip = ({ date, status }: { date: string, status: string }) => {
  const d = daysUntil(date);
  if (status !== 'pendiente' || d < 0) return <span className="px-2 py-0.5 rounded-[6px] text-xs font-medium bg-surface text-text-muted border border-border">{d < 0 ? 'Pasado' : `${d}d`}</span>;
  if (d < 7) return <span className="px-2 py-0.5 rounded-[6px] text-xs font-medium bg-red/10 text-red border border-red/20">{d}d</span>;
  if (d < 14) return <span className="px-2 py-0.5 rounded-[6px] text-xs font-medium bg-amber/10 text-amber border border-amber/20">{d}d</span>;
  if (d < 30) return <span className="px-2 py-0.5 rounded-[6px] text-xs font-medium bg-green/10 text-green border border-green/20">{d}d</span>;
  return <span className="px-2 py-0.5 rounded-[6px] text-xs font-medium bg-surface text-text-muted border border-border">{d}d</span>;
};

// ─── Modal Form ─────────────────────────────────────────────────────────────────
interface FormProps { initial?: Partial<Exam>; onSave: (d: Omit<Exam, 'id'>) => void; onCancel: () => void; subjects: string[] }
const ExamForm: React.FC<FormProps> = ({ initial, onSave, onCancel, subjects }) => {
  const [f, setF] = useState<Omit<Exam, 'id'>>({
    subject: initial?.subject || (subjects[0] || ''),
    type: initial?.type || 'parcial',
    status: initial?.status || 'pendiente',
    date: initial?.date ? initial.date.split('T')[0] : new Date().toISOString().split('T')[0],
    notes: initial?.notes || '',
    grade: initial?.grade
  });
  const [isNewSubject, setIsNewSubject] = useState(f.subject === '' || !subjects.includes(f.subject));
  const [newSub, setNewSub] = useState(isNewSubject ? f.subject : '');

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ ...f, subject: isNewSubject ? newSub : f.subject, date: new Date(f.date).toISOString() });
  };

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      <div>
        <label className="label mb-1.5 block">Materia</label>
        {!isNewSubject ? (
          <select className="input" value={f.subject} onChange={e => {
            if (e.target.value === 'NEW') { setIsNewSubject(true); setNewSub(''); }
            else setF({...f, subject: e.target.value});
          }}>
            {subjects.map(s => <option key={s} value={s}>{s}</option>)}
            <option value="NEW">+ Nueva materia...</option>
          </select>
        ) : (
          <div className="flex gap-2">
            <input className="input flex-1" autoFocus value={newSub} onChange={e => setNewSub(e.target.value)} required placeholder="Nombre de la materia" />
            {subjects.length > 0 && <Button type="button" variant="ghost" onClick={() => { setIsNewSubject(false); setF({...f, subject: subjects[0]}); }}>N</Button>}
          </div>
        )}
      </div>
      <div>
        <label className="label mb-1.5 block">Tipo</label>
        <SegmentedControl options={TYPES} value={f.type} onChange={v => setF({...f, type: v as ExamType})} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label mb-1.5 block">Estado</label>
          <select className="input" value={f.status} onChange={e => {
            const st = e.target.value as ExamStatus;
            setF({...f, status: st, grade: (st==='aprobado'||st==='desaprobado') ? f.grade : undefined});
          }}>
            {STATUSES.map(s => <option key={s} value={s} className="capitalize">{s}</option>)}
          </select>
        </div>
        <div>
          <label className="label mb-1.5 block">Fecha</label>
          <input type="date" className="input" value={f.date} onChange={e => setF({...f, date: e.target.value})} required />
        </div>
      </div>
      {(f.status === 'aprobado' || f.status === 'desaprobado') && (
        <motion.div initial={{opacity:0, height:0}} animate={{opacity:1, height:'auto'}}>
          <label className="label mb-1.5 block">Nota</label>
          <input type="number" min="1" max="10" step="0.25" className="input" placeholder="Ej: 8" value={f.grade ?? ''} onChange={e => setF({...f, grade: e.target.value ? Number(e.target.value) : undefined})} required />
        </motion.div>
      )}
      <div>
        <label className="label mb-1.5 block flex justify-between">Notas (opcional) <span className="text-[10px] text-text-faint">{f.notes?.length ?? 0}/200</span></label>
        <textarea maxLength={200} rows={2} className="input resize-none" value={f.notes ?? ''} onChange={e => setF({...f, notes: e.target.value})} placeholder="Temario..." />
      </div>
      <div className="flex justify-end gap-2 mt-2">
        <Button type="button" variant="ghost" onClick={onCancel}>Cancelar</Button>
        <Button type="submit" variant="primary">Guardar</Button>
      </div>
    </form>
  );
};

// ─── Tracker Page ──────────────────────────────────────────────────────────────
export const ExamTracker: React.FC = () => {
  const { exams, addExam, updateExam, deleteExam } = useExams();
  const { blocks } = useWeekBlocks();
  const { showToast } = useToast();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Exam | null>(null);

  // Filters state
  const [tab, setTab] = useState<'Todos' | 'Pendientes' | 'Aprobados' | 'Desaprobados' | 'Libres' | 'Regularidad'>('Todos');
  const [subjectFilter, setSubjectFilter] = useState('Todas');
  const [typeFilter, setTypeFilter] = useState('Todos');

  const { subjectStatuses, updateSubjectStatus } = useExams();
  const [showRegExplainer, setShowRegExplainer] = useState(() => !localStorage.getItem('fos-reg-explainer'));

  const dismissRegExplainer = () => {
    setShowRegExplainer(false);
    localStorage.setItem('fos-reg-explainer', 'true');
  };

  // stats
  const pend = exams.filter(e => e.status === 'pendiente').length;
  const apro = exams.filter(e => e.status === 'aprobado').length;
  const desa = exams.filter(e => e.status === 'desaprobado').length;
  const graded = exams.filter(e => typeof e.grade === 'number');
  const avg = graded.length ? (graded.reduce((a,b)=>a+b.grade!,0)/graded.length).toFixed(1) : '–';

  // filtering
  const filtered = exams.filter(e => {
    if (tab !== 'Todos' && e.status !== tab.toLowerCase().replace(/s$/, '')) return false;
    if (subjectFilter !== 'Todas' && e.subject !== subjectFilter) return false;
    if (typeFilter !== 'Todos' && e.type !== typeFilter.toLowerCase()) return false;
    return true;
  });

  // group
  const grouped = filtered.reduce((acc, ex) => {
    if (!acc[ex.subject]) acc[ex.subject] = [];
    acc[ex.subject].push(ex);
    return acc;
  }, {} as Record<string, Exam[]>);

  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  const toggleSub = (s: string) => setCollapsed(prev => ({ ...prev, [s]: !prev[s] }));

  const handleShare = (ex: Exam) => {
    const link = encodeExamToShareLink(ex);
    navigator.clipboard.writeText(link);
    showToast('Link copiado — compartilo con tus compañeros');
  };

  const subjects = Array.from(new Set(exams.map(e => e.subject)));

  return (
    <div className="max-w-4xl mx-auto h-full flex flex-col">
      {/* Top summary bar */}
      <header className="mb-6 flex flex-col md:flex-row md:items-end justify-between gap-4 shrink-0">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-text-primary flex items-center gap-2 mb-2">
            <LayoutList size={22} className="text-amber" /> 
            Exámenes
          </h1>
          <div className="flex flex-wrap gap-4 text-[13px] font-medium text-text-secondary bg-surface border border-border px-4 py-2 rounded-card">
            <span><strong className="text-text-primary">{pend}</strong> pendientes</span>
            <span><strong className="text-green">{apro}</strong> aprobados</span>
            <span><strong className="text-red">{desa}</strong> desaprobados</span>
            <span>Promedio: <strong className="text-amber">{avg}</strong></span>
          </div>
        </div>
        <Button variant="primary" onClick={() => { setEditing(null); setModalOpen(true); }} className="!bg-amber !text-[#17130b] hover:!bg-amber-soft font-semibold">
          <Plus size={16} /> Agregar examen
        </Button>
      </header>

      {/* Filter bar */}
      <div className="flex flex-col gap-3 mb-6 shrink-0">
        <div className="flex overflow-x-auto gap-4 border-b border-border text-[13px] font-medium no-scrollbar pb-1">
          {['Todos', 'Pendientes', 'Aprobados', 'Desaprobados', 'Libres', 'Regularidad'].map(t => (
            <button key={t} onClick={() => setTab(t as 'Todos' | 'Pendientes' | 'Aprobados' | 'Desaprobados' | 'Libres' | 'Regularidad')} className={cn("px-1 pb-2 relative transition-colors whitespace-nowrap", tab === t ? "text-amber" : "text-text-muted hover:text-text-primary")}>
              {t}
              {tab === t && <motion.div layoutId="tab-indicator" className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber rounded-t" />}
            </button>
          ))}
        </div>
        {tab !== 'Regularidad' && (
          <div className="flex gap-2 mt-3">
            <select className="input !bg-elevated !py-1.5 flex-1 min-w-[120px]" value={subjectFilter} onChange={e=>setSubjectFilter(e.target.value)}>
              <option value="Todas">Todas las materias</option>
              {subjects.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <select className="input !bg-elevated !py-1.5 flex-1 min-w-[120px]" value={typeFilter} onChange={e=>setTypeFilter(e.target.value)}>
              <option value="Todos">Todos los tipos</option>
              {TYPES.map(t => <option key={t} value={t} className="capitalize">{t}</option>)}
            </select>
          </div>
        )}
      </div>

      {/* List / Regularidad View */}
      <div className="flex-1 overflow-y-auto pr-1 pb-8 flex flex-col gap-5">
        {tab === 'Regularidad' ? (
          <div className="flex flex-col gap-4">
            {showRegExplainer && (
              <div className="bg-amber/10 border border-amber/20 text-amber p-3 rounded-card text-sm flex gap-3 items-start relative">
                <Info size={16} className="mt-0.5 shrink-0" />
                <p>Faculty OS monitorea tu regularidad por materia. Configurá el máximo de aplazos permitidos según tu facultad.</p>
                <button onClick={dismissRegExplainer} className="absolute top-3 right-3 opacity-70 hover:opacity-100">✕</button>
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {subjectStatuses.map(status => (
                <div key={status.subject} className="bg-elevated border border-border p-4 rounded-card flex flex-col gap-3">
                  <div className="flex items-start justify-between">
                    <h3 className="font-semibold text-text-primary text-[15px]">{status.subject}</h3>
                    <span className={cn("text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded border", 
                      status.hasLost ? "text-red border-red/30 bg-red/10" : 
                      status.currentFails >= status.maxFails - 1 ? "text-amber border-amber/30 bg-amber/10" : 
                      "text-green border-green/30 bg-green/10"
                    )}>
                      {status.hasLost ? 'Perdida' : status.currentFails >= status.maxFails - 1 ? 'En riesgo' : 'Regular'}
                    </span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <div className="flex justify-between items-center text-xs text-text-muted">
                      <span>Aplazos: {status.currentFails} / {status.maxFails}</span>
                      <button onClick={() => {
                        const newMax = prompt(`Máximo de aplazos para ${status.subject}:`, status.maxFails.toString());
                        if (newMax && !isNaN(parseInt(newMax))) {
                          updateSubjectStatus(status.subject, { maxFails: parseInt(newMax) });
                        }
                      }} className="hover:text-amber ml-2" title="Editar máximo permitido"><Pencil size={12}/></button>
                    </div>
                    <div className="h-1.5 w-full bg-border rounded-full overflow-hidden">
                      <div className="h-full bg-red transition-all" style={{ width: `${Math.min(100, (status.currentFails / status.maxFails) * 100)}%` }} />
                    </div>
                  </div>
                  <input type="text" className="input !bg-base !text-xs !py-1.5 !px-2 mt-auto" placeholder="Nota rápida (ej: necesito 6 en el final)" value={status.customNote || ''} onChange={e => updateSubjectStatus(status.subject, { customNote: e.target.value })} />
                </div>
              ))}
            </div>
            {subjectStatuses.length === 0 && <p className="text-text-muted text-sm text-center py-10">No hay materias registradas aún.</p>}
          </div>
        ) : (
          <AnimatePresence>
          {Object.keys(grouped).length === 0 ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-20 text-center flex flex-col items-center">
              <p className="text-text-secondary text-sm mb-2">No hay exámenes</p>
              <button onClick={() => { setEditing(null); setModalOpen(true); }} className="text-amber text-sm font-medium hover:underline inline-flex items-center gap-1">Agregá tu primer examen <ChevronRight size={14}/></button>
            </motion.div>
          ) : (
            Object.entries(grouped).map(([sub, list]) => {
              const isCol = collapsed[sub] ?? list.every(e => e.status === 'aprobado');
              return (
                <div key={sub} className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <button onClick={() => toggleSub(sub)} className="flex items-center gap-2 text-text-primary uppercase text-[12px] font-bold tracking-widest hover:text-amber transition-colors group">
                      <motion.div animate={{ rotate: isCol ? -90 : 0 }} className="text-text-muted group-hover:text-amber"><ChevronDown size={14} /></motion.div>
                      {sub}
                      <span className="bg-surface border border-border px-1.5 py-0.5 rounded text-[10px] text-text-muted normal-case font-medium">{list.length}</span>
                    </button>
                    <Link to={`/materias?subject=${encodeURIComponent(sub)}`} className="text-[11px] font-bold text-amber hover:underline flex items-center gap-1">Ver materia <ChevronRight size={12}/></Link>
                  </div>
                  <AnimatePresence initial={false}>
                    {!isCol && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="flex flex-col gap-2 overflow-hidden">
                        {list.sort((a,b)=>new Date(a.date).getTime()-new Date(b.date).getTime()).map((ex) => {
                          const days = daysUntil(ex.date);
                          const isUrgent = ex.status === 'pendiente' && days <= 7 && days >= 0;
                          const isSoon = ex.status === 'pendiente' && days > 7 && days <= 14;
                          
                          return (
                            <div 
                              key={ex.id} 
                              className={cn(
                                "flex flex-col md:flex-row items-center justify-between bg-surface border border-border rounded-[12px] p-4 group hover:border-amber/20 transition-all gap-4 relative overflow-hidden",
                                isUrgent && "border-l-[4px] border-l-red",
                                isSoon && "border-l-[4px] border-l-amber",
                                ex.status !== 'pendiente' && "opacity-60"
                              )}
                            >
                              <div className="flex flex-col gap-1 min-w-0 flex-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="text-[15px] font-bold text-text-primary tracking-tight">
                                    {ex.type} {ex.status === 'aprobado' && '✅'}
                                  </span>
                                  <span className="text-[11px] font-bold text-text-faint uppercase tracking-widest">{formatDateES(ex.date)}</span>
                                </div>
                                {ex.notes && <p className="text-[12px] text-text-muted truncate max-w-[400px]">{ex.notes}</p>}
                                {ex.status === 'pendiente' && days >= 0 && (
                                  <p className={cn("text-[11px] font-bold uppercase", isUrgent ? "text-red" : isSoon ? "text-amber" : "text-text-faint")}>
                                    {days === 0 ? 'Es hoy' : days === 1 ? 'Mañana' : `Faltan ${days} días`}
                                  </p>
                                )}
                              </div>

                              <div className="flex items-center gap-6 shrink-0">
                                <div className="flex flex-col items-end gap-1">
                                  {ex.grade !== undefined && (
                                    <div className="flex items-center gap-1.5">
                                      <span className="text-[11px] font-bold text-text-faint uppercase">Nota</span>
                                      <span className={cn("text-xl font-black", ex.grade >= 4 ? "text-green" : "text-red")}>{ex.grade}</span>
                                    </div>
                                  )}
                                  <span className={cn(
                                    "text-[10px] font-black uppercase tracking-tighter px-2 py-0.5 rounded border",
                                    ex.status === 'pendiente' ? "bg-amber/10 border-amber/20 text-amber" :
                                    ex.status === 'aprobado' ? "bg-green/10 border-green/20 text-green" :
                                    ex.status === 'desaprobado' ? "bg-red/10 border-red/20 text-red" : "bg-elevated border-border text-text-muted"
                                  )}>
                                    {ex.status}
                                  </span>
                                </div>
                                <div className="flex gap-1 md:opacity-0 group-hover:opacity-100 transition-opacity">
                                  <button onClick={() => handleShare(ex)} className="p-2 text-text-muted hover:text-amber bg-elevated rounded-lg border border-border shadow-sm transition-colors"><Share2 size={14}/></button>
                                  <button onClick={() => { setEditing(ex); setModalOpen(true); }} className="p-2 text-text-muted hover:text-text-primary bg-elevated rounded-lg border border-border shadow-sm transition-colors"><Pencil size={14}/></button>
                                  <button onClick={() => deleteExam(ex.id)} className="p-2 text-text-muted hover:text-red bg-elevated rounded-lg border border-border shadow-sm transition-colors"><Trash2 size={14}/></button>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })
          )}
        </AnimatePresence>
        )}
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Editar Examen' : 'Nuevo Examen'}>
        <ExamForm initial={editing ?? undefined} onSave={d => { if (editing) { updateExam(editing.id, d); } else { addExam(d); } setModalOpen(false); }} onCancel={() => setModalOpen(false)} subjects={subjects} />
      </Modal>
    </div>
  );
};

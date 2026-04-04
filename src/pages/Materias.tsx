import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, Plus, Trash2, ExternalLink, Play, CheckCircle2, Circle, Type, Database as DriveIcon } from 'lucide-react';
import { useMaterias, Materia, Recurso, NotaRapida } from '../hooks/useMaterias';
import { Modal } from '../components/ui/Modal';
import { Button } from '../components/ui/Button';
import { cn, daysUntil } from '../lib/utils';
import { useLocation } from 'react-router-dom';

const DEFAULT_COLORS = ['#f59e0b', '#fb923c', '#4ade80', '#2dd4bf', '#8b5cf6', '#ec4899'];

const CustomCountdownChip = ({ date, done }: { date: string, done: boolean }) => {
  const d = Math.max(0, daysUntil(date));
  if (done) return <span className="px-2 py-0.5 rounded-[6px] text-[11px] font-medium bg-surface text-text-muted border border-border">Hecho</span>;
  if (d < 3) return <span className="px-2.5 py-1 rounded-[6px] text-[11px] font-bold bg-red text-white shadow-sm">{d === 0 ? 'Hoy' : `${d}d`}</span>;
  if (d < 7) return <span className="px-2.5 py-1 rounded-[6px] text-[11px] font-bold bg-amber text-[#1a0f00] shadow-sm">{d}d</span>;
  return <span className="px-2 pyr-1 rounded-[6px] text-[11px] font-medium text-text-muted flex items-center gap-1.5"><Play size={10} className="rotate-90 fill-current opacity-20" /> {d}d</span>;
};

// --- Sub-components ---
const DebouncedNota = ({ nota, materiaId, onUpdate, onDelete }: { nota: NotaRapida, materiaId: string, onUpdate: (m: string, n: string, c: string) => void, onDelete: (m: string, n: string) => void }) => {
  const [content, setContent] = useState(nota.content);
  const [saved, setSaved] = useState(false);
  const timeoutRef = useRef<number | null>(null);

  useEffect(() => {
    setContent(nota.content);
  }, [nota.id, nota.content]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setContent(val);
    if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
    timeoutRef.current = window.setTimeout(() => {
      onUpdate(materiaId, nota.id, val);
      setSaved(true);
      setTimeout(() => setSaved(false), 1500);
    }, 800);
  };

  return (
    <div className="bg-surface relative group border border-border rounded-[12px] flex flex-col focus-within:border-amber/50 transition-colors shadow-sm">
      <textarea
        className="w-full bg-transparent p-4 text-[14px] text-text-primary placeholder-text-muted outline-none min-h-[160px] resize-none leading-relaxed"
        placeholder="Escribí tus apuntes, fórmulas o recordatorios..."
        value={content}
        onChange={handleChange}
      />
      <div className="flex justify-between items-center px-4 pb-3 pt-1 h-8">
        <div className="flex-1">
          <AnimatePresence>
            {saved && (
              <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-[10px] text-green flex items-center gap-1.5 font-bold uppercase tracking-wider">
                <div className="w-1.5 h-1.5 rounded-full bg-green animate-pulse" /> Guardado
              </motion.span>
            )}
          </AnimatePresence>
        </div>
        <span className="text-[10px] text-text-faint font-medium uppercase tracking-widest">
          {new Date(nota.updatedAt).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>
      <button 
        onClick={() => onDelete(materiaId, nota.id)}
        className="absolute top-3 right-3 p-2 text-text-muted hover:text-red opacity-0 group-hover:opacity-100 transition-opacity bg-surface border border-border rounded-lg shadow-sm"
      >
        <Trash2 size={14} />
      </button>
    </div>
  );
};

export const Materias: React.FC = () => {
  const { 
    materias, addMateria, deleteMateria,
    addEntrega, updateEntrega, deleteEntrega,
    addRecurso, deleteRecurso,
    addNota, updateNota, deleteNota
  } = useMaterias();
  
  const location = useLocation();
  const [selectedMateriaId, setSelectedMateriaId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'entregas' | 'notas' | 'recursos'>('entregas');
  
  const [modalMateria, setModalMateria] = useState(false);
  const [modalEntrega, setModalEntrega] = useState(false);
  const [modalRecurso, setModalRecurso] = useState(false);
  
  const [fMateria, setFMateria] = useState({ name: '', color: DEFAULT_COLORS[0] });
  const [fEntrega, setFEntrega] = useState({ title: '', dueDate: new Date().toISOString().split('T')[0], notes: '' });
  const [fRecurso, setFRecurso] = useState({ label: '', url: '', type: 'drive' as Recurso['type'] });

  useEffect(() => {
    if (materias.length > 0 && !selectedMateriaId) {
      const searchParams = new URLSearchParams(location.search);
      const subj = searchParams.get('subject');
      if (subj) {
        const found = materias.find(m => m.name === subj);
        if (found) {
          setSelectedMateriaId(found.id);
          return;
        }
      }
      setSelectedMateriaId(materias[0].id);
    }
  }, [materias, location.search, selectedMateriaId]);

  // Persistir Tab por materia
  useEffect(() => {
    if (selectedMateriaId) {
      const savedTab = localStorage.getItem(`materias_tab_${selectedMateriaId}`);
      if (savedTab) setActiveTab(savedTab as any);
    }
  }, [selectedMateriaId]);

  const handleTabChange = (tab: 'entregas' | 'notas' | 'recursos') => {
    setActiveTab(tab);
    if (selectedMateriaId) localStorage.setItem(`materias_tab_${selectedMateriaId}`, tab);
  };

  const activeMateria = materias.find(m => m.id === selectedMateriaId) || materias[0];

  const handleSaveMateria = (e: React.FormEvent) => {
    e.preventDefault();
    addMateria(fMateria.name, fMateria.color);
    setModalMateria(false);
    setFMateria({ name: '', color: DEFAULT_COLORS[0] });
  };

  const handleSaveEntrega = (e: React.FormEvent) => {
    e.preventDefault();
    addEntrega(activeMateria.id, { ...fEntrega, done: false, dueDate: new Date(fEntrega.dueDate).toISOString() });
    setModalEntrega(false);
    setFEntrega({ title: '', dueDate: new Date().toISOString().split('T')[0], notes: '' });
  };

  const handleSaveRecurso = (e: React.FormEvent) => {
    e.preventDefault();
    let url = fRecurso.url;
    if (!url.startsWith('http')) url = 'https://' + url;
    addRecurso(activeMateria.id, { ...fRecurso, url });
    setModalRecurso(false);
    setFRecurso({ label: '', url: '', type: 'drive' });
  };

  const pendingEntregasCount = (m: Materia) => m?.entregas.filter(e => !e.done).length || 0;

  return (
    <div className="h-full flex flex-col md:flex-row gap-6 max-w-[1200px] mx-auto page-container">
      {/* Left Column (Desktop) */}
      <div className="shrink-0 md:w-[280px] flex flex-col md:border-r border-border md:pr-4 h-auto md:h-full overflow-hidden">
        <h1 className="text-2xl font-bold tracking-tight text-text-primary flex items-center gap-3 mb-8 shrink-0">
          <BookOpen size={24} className="text-amber" /> 
          Materias
        </h1>
        
        <div className="flex md:flex-col overflow-x-auto md:overflow-y-auto gap-2 pb-2 md:pb-6 no-scrollbar flex-1 items-start md:items-stretch">
          {materias.map(mat => (
            <button 
              key={mat.id}
              onClick={() => setSelectedMateriaId(mat.id)}
              className={cn(
                "flex items-center gap-3 p-3.5 rounded-card text-left transition-all whitespace-nowrap min-w-[210px] md:min-w-0 border",
                selectedMateriaId === mat.id ? "bg-hover border-transparent ring-1 ring-amber/20" : "bg-surface border-border hover:border-amber/30 text-text-secondary hover:text-text-primary",
              )}
            >
              <div className="w-2.5 h-2.5 rounded-full shrink-0 shadow-sm" style={{ backgroundColor: mat.color }} />
              <span className="flex-1 font-semibold text-[14px] truncate" title={mat.name}>{mat.name}</span>
              {pendingEntregasCount(mat) > 0 && (
                <span className="bg-amber/10 text-amber text-[10px] font-bold px-1.5 py-0.5 rounded-full border border-amber/20 shrink-0">
                  {pendingEntregasCount(mat)}
                </span>
              )}
            </button>
          ))}
          
          <button 
            onClick={() => setModalMateria(true)}
            className="flex items-center gap-2 p-3.5 text-text-muted hover:text-amber border border-dashed border-border hover:border-amber/30 rounded-card justify-center text-sm font-bold transition-all shrink-0 whitespace-nowrap md:mt-2 bg-surface/50"
          >
            <Plus size={16} /> <span>Nueva materia</span>
          </button>
        </div>
      </div>

      {/* Right Column */}
      {activeMateria ? (
        <div className="flex-1 flex flex-col gap-6 pb-12 overflow-y-auto no-scrollbar md:h-full">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-2xl font-bold text-text-primary flex items-center gap-3 tracking-tight">
                <div className="w-4 h-4 rounded-full shadow-inner" style={{ backgroundColor: activeMateria.color }} />
                {activeMateria.name}
              </h2>
              <button onClick={() => { if(confirm('¿Eliminar materia?')) deleteMateria(activeMateria.id) }} className="p-2 text-text-muted hover:text-red hover:bg-hover rounded-lg transition-colors border border-transparent hover:border-border">
                <Trash2 size={16} />
              </button>
            </div>
            
            {/* Tabs */}
            <div className="flex items-center gap-8 mt-6 border-b border-border">
              {[
                { id: 'entregas', label: 'Entregas', count: activeMateria.entregas.filter(e => !e.done).length },
                { id: 'notas', label: 'Notas', count: activeMateria.notas.length },
                { id: 'recursos', label: 'Recursos', count: activeMateria.recursos.length }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id as any)}
                  className={cn(
                    "pb-3 text-sm font-bold transition-all relative flex items-center gap-2",
                    activeTab === tab.id ? "text-amber" : "text-text-muted hover:text-text-secondary"
                  )}
                >
                  {tab.label}
                  {tab.count > 0 && (
                    <span className={cn("text-[10px] px-1.5 py-0.5 rounded-full border", activeTab === tab.id ? "bg-amber/10 border-amber/20" : "bg-elevated border-border")}>
                      {tab.count}
                    </span>
                  )}
                  {activeTab === tab.id && (
                    <motion.div layoutId="tab-underline" className="absolute bottom-0 left-0 right-0 h-[2px] bg-amber rounded-full" />
                  )}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 min-h-0">
            <AnimatePresence mode="wait">
              {activeTab === 'entregas' && (
                <motion.section key="entregas" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.15 }} className="flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <p className="text-[12px] font-bold text-text-faint uppercase tracking-widest leading-none">Pendientes y realizadas</p>
                    <button onClick={() => setModalEntrega(true)} className="btn bg-amber hover:bg-amber-soft text-[#1a0f00] text-[11px] h-8 px-4 font-bold !rounded-full transition-all shadow-sm">
                      <Plus size={14} /> Nueva Entrega
                    </button>
                  </div>
                  
                  <div className="flex flex-col gap-2.5">
                    {activeMateria.entregas.length === 0 ? (
                      <div className="flex flex-col items-center justify-center p-12 border border-dashed border-border rounded-[16px] text-text-muted text-center grayscale opacity-80">
                        <CheckCircle2 size={32} className="mb-3 opacity-20" />
                        <p className="text-[13px] font-medium">No hay entregas registradas</p>
                        <p className="text-[11px] opacity-60">¡Agregá una para empezar el seguimiento!</p>
                      </div>
                    ) : (
                      activeMateria.entregas
                        .sort((a, b) => Number(a.done) - Number(b.done) || new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
                        .map(ent => (
                        <div key={ent.id} className={cn("group flex items-start gap-4 p-4 bg-surface border border-border rounded-[14px] transition-all hover:shadow-md", ent.done ? "opacity-50 grayscale" : "shadow-sm")}>
                          <button onClick={() => updateEntrega(activeMateria.id, ent.id, { done: !ent.done })} className={cn("mt-0.5 shrink-0 transition-all transform hover:scale-110", ent.done ? "text-green" : "text-text-faint hover:text-amber")}>
                            {ent.done ? <CheckCircle2 size={20} /> : <Circle size={20} />}
                          </button>
                          <div className="flex-1 min-w-0 flex justify-between items-start gap-4">
                            <div className="flex flex-col gap-1.5">
                              <span className={cn("text-[15px] font-semibold transition-all tracking-tight", ent.done ? "line-through text-text-muted" : "text-text-primary")}>
                                {ent.title}
                              </span>
                              {ent.notes && <span className="text-[12px] text-text-muted line-clamp-2 max-w-[500px] leading-relaxed">{ent.notes}</span>}
                            </div>
                            <div className="flex gap-4 items-center shrink-0 h-full">
                              <CustomCountdownChip date={ent.dueDate} done={ent.done} />
                              <button onClick={() => deleteEntrega(activeMateria.id, ent.id)} className="p-2 text-text-muted hover:text-red opacity-0 group-hover:opacity-100 transition-opacity bg-elevated rounded-lg shadow-sm border border-border">
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </motion.section>
              )}

              {activeTab === 'notas' && (
                <motion.section key="notas" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.15 }} className="flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <p className="text-[12px] font-bold text-text-faint uppercase tracking-widest leading-none">Bloc de notas rápidas</p>
                    <button onClick={() => addNota(activeMateria.id)} className="btn bg-surface hover:bg-hover text-text-primary text-[11px] h-8 px-4 font-bold !rounded-full transition-all border border-border shadow-sm">
                      <Plus size={14} /> Nueva nota
                    </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {activeMateria.notas.length === 0 ? (
                      <button onClick={() => addNota(activeMateria.id)} className="md:col-span-2 flex flex-col items-center justify-center p-12 border border-dashed border-border rounded-[16px] text-text-muted text-center hover:border-amber/30 transition-colors">
                        <Type size={32} className="mb-3 opacity-20" />
                        <p className="text-[13px] font-medium">Escribí tus primeros apuntes</p>
                      </button>
                    ) : (
                      activeMateria.notas.map(nota => (
                        <DebouncedNota key={nota.id} nota={nota} materiaId={activeMateria.id} onUpdate={updateNota} onDelete={deleteNota} />
                      ))
                    )}
                  </div>
                </motion.section>
              )}

              {activeTab === 'recursos' && (
                <motion.section key="recursos" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.15 }} className="flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <p className="text-[12px] font-bold text-text-faint uppercase tracking-widest leading-none">Material y Enlaces</p>
                    <button onClick={() => setModalRecurso(true)} className="btn bg-surface hover:bg-hover text-text-primary text-[11px] h-8 px-4 font-bold !rounded-full transition-all border border-border shadow-sm">
                      <Plus size={14} /> Agregar link
                    </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-3 bg-elevated border border-border rounded-[16px]">
                    {activeMateria.recursos.length === 0 ? (
                      <div className="md:col-span-2 text-center p-10 text-text-muted">
                        <DriveIcon size={32} className="mx-auto mb-3 opacity-10" />
                        <p className="text-[13px] font-medium">No hay recursos guardados</p>
                      </div>
                    ) : (
                      activeMateria.recursos.map(rec => (
                        <div key={rec.id} className="group relative flex items-center gap-4 p-3 bg-surface hover:bg-hover rounded-[12px] transition-all border border-transparent hover:border-border cursor-pointer shadow-sm" onClick={() => window.open(rec.url, '_blank')}>
                          <div className="shrink-0">
                            {rec.type === 'drive' ? <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-[#0F9D58]/10 text-[#0F9D58]"><DriveIcon size={16}/></div> :
                             rec.type === 'notion' ? <div className="w-8 h-8 rounded-lg border border-border flex items-center justify-center bg-transparent text-text-secondary"><Type size={16}/></div> :
                             rec.type === 'youtube' ? <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-red/10 text-red"><Play size={16} className="ml-0.5 fill-current"/></div> :
                             <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-blue-500/10 text-blue-500"><ExternalLink size={16}/></div>}
                          </div>
                          <div className="flex-1 min-w-0 flex flex-col justify-center">
                            <span className="text-[14px] font-semibold text-text-primary leading-tight truncate">{rec.label}</span>
                            <span className="text-[11px] text-text-muted leading-tight truncate mt-1 opacity-70">{rec.url}</span>
                          </div>
                          <button onClick={(e) => { e.stopPropagation(); deleteRecurso(activeMateria.id, rec.id); }} className="absolute right-3 p-2 text-text-muted hover:text-red opacity-0 group-hover:opacity-100 transition-opacity bg-surface border border-border rounded-lg shadow-sm">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </motion.section>
              )}
            </AnimatePresence>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center text-text-muted text-sm border-2 border-dashed border-border rounded-[24px] bg-elevated/30">
          <div className="flex flex-col items-center gap-3">
             <BookOpen size={48} className="opacity-10" />
             <p className="font-medium">Seleccioná una materia para ver su organización</p>
          </div>
        </div>
      )}

      {/* Modals remains largely the same but with refined radius */}
      <Modal open={modalMateria} onClose={() => setModalMateria(false)} title="Nueva Materia">
        <form onSubmit={handleSaveMateria} className="flex flex-col gap-5 p-1">
          <div>
            <label className="label mb-2 block">Nombre de la cursada</label>
            <input autoFocus className="input h-11" required value={fMateria.name} onChange={e => setFMateria({...fMateria, name: e.target.value})} placeholder="Ej: Análisis Matemático II" />
          </div>
          <div>
            <label className="label mb-2 block">Color identificador</label>
            <div className="flex gap-2.5">
              {DEFAULT_COLORS.map(c => (
                <button
                  key={c} type="button" onClick={() => setFMateria({...fMateria, color: c})}
                  className={cn("w-9 h-9 rounded-full border-2 transition-all shadow-sm", fMateria.color === c ? "scale-110" : "border-transparent opacity-60 hover:opacity-100")}
                  style={{ backgroundColor: c, borderColor: fMateria.color === c ? 'white' : 'transparent' }}
                />
              ))}
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-border">
            <Button type="button" variant="ghost" onClick={() => setModalMateria(false)} className="h-10 px-6">Cancelar</Button>
            <Button type="submit" variant="primary" className="h-10 px-6">Crear Materia</Button>
          </div>
        </form>
      </Modal>

      <Modal open={modalEntrega} onClose={() => setModalEntrega(false)} title="Nueva Entrega">
        <form onSubmit={handleSaveEntrega} className="flex flex-col gap-4 p-1">
          <div>
            <label className="label mb-2 block">Título de la entrega</label>
            <input autoFocus className="input h-11" required value={fEntrega.title} onChange={e => setFEntrega({...fEntrega, title: e.target.value})} placeholder="Ej: TP 3 - Dinámica" />
          </div>
          <div>
            <label className="label mb-2 block">Fecha Límite</label>
            <input type="date" className="input h-11" required value={fEntrega.dueDate} onChange={e => setFEntrega({...fEntrega, dueDate: e.target.value})} />
          </div>
          <div>
            <label className="label mb-2 block">Notas u observaciones</label>
            <textarea className="input resize-none p-3" rows={3} value={fEntrega.notes} onChange={e => setFEntrega({...fEntrega, notes: e.target.value})} placeholder="Link de descarga, consignas, etc." />
          </div>
          <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-border">
            <Button type="button" variant="ghost" onClick={() => setModalEntrega(false)} className="h-10 px-6">Cancelar</Button>
            <Button type="submit" variant="primary" className="h-10 px-6 font-bold">Guardar Entrega</Button>
          </div>
        </form>
      </Modal>

      <Modal open={modalRecurso} onClose={() => setModalRecurso(false)} title="Nuevo Recurso">
        <form onSubmit={handleSaveRecurso} className="flex flex-col gap-4 p-1">
          <div>
            <label className="label mb-2 block">Nombre del recurso</label>
            <input autoFocus className="input h-11" required value={fRecurso.label} onChange={e => setFRecurso({...fRecurso, label: e.target.value})} placeholder="Ej: Carpeta Drive" />
          </div>
          <div>
            <label className="label mb-2 block">Link (URL)</label>
            <input type="url" className="input h-11" required value={fRecurso.url} onChange={e => setFRecurso({...fRecurso, url: e.target.value})} placeholder="https://..." />
          </div>
          <div>
            <label className="label mb-2 block">Tipo de recurso</label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'drive', label: 'Google Drive' },
                { id: 'notion', label: 'Notion' },
                { id: 'youtube', label: 'YouTube' },
                { id: 'link', label: 'Otro Link' }
              ].map(type => (
                <button
                  key={type.id} type="button" onClick={() => setFRecurso({...fRecurso, type: type.id as any})}
                  className={cn("h-10 rounded-xl border text-[13px] font-semibold transition-all px-3 text-left flex items-center justify-between", fRecurso.type === type.id ? "border-amber bg-amber/10 text-amber shadow-sm" : "border-border text-text-muted hover:border-amber/30")}
                >
                  {type.label}
                  {fRecurso.type === type.id && <div className="w-1.5 h-1.5 rounded-full bg-amber" />}
                </button>
              ))}
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-border">
            <Button type="button" variant="ghost" onClick={() => setModalRecurso(false)} className="h-10 px-6">Cancelar</Button>
            <Button type="submit" variant="primary" className="h-10 px-6">Agregar</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

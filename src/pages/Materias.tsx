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
  const d = daysUntil(date);
  if (done) return <span className="px-2 py-0.5 rounded-[6px] text-xs font-medium bg-surface text-text-muted border border-border">{d < 0 ? 'Pasado' : `${d}d`}</span>;
  if (d < 0) return <span className="px-2 py-0.5 rounded-[6px] text-xs font-medium bg-red/10 text-red border border-red/20">Vencido</span>;
  if (d < 3) return <span className="px-2 py-0.5 rounded-[6px] text-xs font-medium bg-red/10 text-red border border-red/20">{d}d</span>;
  if (d < 7) return <span className="px-2 py-0.5 rounded-[6px] text-xs font-medium bg-amber/10 text-amber border border-amber/20">{d}d</span>;
  return <span className="px-2 py-0.5 rounded-[6px] text-xs font-medium bg-green/10 text-green border border-green/20">{d}d</span>;
};

// --- Sub-components ---
const DebouncedNota = ({ nota, materiaId, onUpdate, onDelete }: { nota: NotaRapida, materiaId: string, onUpdate: (m: string, n: string, c: string) => void, onDelete: (m: string, n: string) => void }) => {
  const [content, setContent] = useState(nota.content);
  const [saved, setSaved] = useState(false);
  const timeoutRef = useRef<number | null>(null);

  useEffect(() => {
    // Sync external changes if needed
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setContent(nota.content);
  // eslint-disable-next-line react-hooks/exhaustive-deps
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
    <div className="bg-surface relative group border border-border rounded-[10px] flex flex-col focus-within:border-amber/50 transition-colors">
      <textarea
        className="w-full bg-transparent p-3 text-sm text-text-primary placeholder-text-muted outline-none min-h-[100px] resize-none"
        placeholder="Escribí tus apuntes, fórmulas o recordatorios..."
        value={content}
        onChange={handleChange}
      />
      <div className="flex justify-between items-center px-3 pb-2 pt-1 h-6">
        <div className="flex-1">
          <AnimatePresence>
            {saved && (
              <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-[10px] text-green flex items-center gap-1">
                <div className="w-1.5 h-1.5 rounded-full bg-green" /> Guardado
              </motion.span>
            )}
          </AnimatePresence>
        </div>
        <span className="text-[10px] text-text-faint pointer-events-none">
          {new Date(nota.updatedAt).toLocaleDateString('es-AR', { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>
      <button 
        onClick={() => onDelete(materiaId, nota.id)}
        className="absolute top-2 right-2 p-1.5 text-text-muted hover:text-red opacity-0 group-hover:opacity-100 transition-opacity bg-surface rounded"
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
  const [modalMateria, setModalMateria] = useState(false);
  const [modalEntrega, setModalEntrega] = useState(false);
  const [modalRecurso, setModalRecurso] = useState(false);
  
  const [fMateria, setFMateria] = useState({ name: '', color: DEFAULT_COLORS[0] });
  const [fEntrega, setFEntrega] = useState({ title: '', dueDate: new Date().toISOString().split('T')[0], notes: '' });
  const [fRecurso, setFRecurso] = useState({ label: '', url: '', type: 'drive' as Recurso['type'] });

  useEffect(() => {
    if (materias.length > 0 && !selectedMateriaId) {
      // Check query params
      const searchParams = new URLSearchParams(location.search);
      const subj = searchParams.get('subject');
      if (subj) {
        const found = materias.find(m => m.name === subj);
        if (found) {
          // eslint-disable-next-line react-hooks/set-state-in-effect
          setSelectedMateriaId(found.id);
          return;
        }
      }
      setSelectedMateriaId(materias[0].id);
    }
  }, [materias, location.search, selectedMateriaId]);

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

  const pendingEntregasCount = (m: Materia) => m.entregas.filter(e => !e.done).length;

  return (
    <div className="h-full flex flex-col md:flex-row gap-6 max-w-[1200px] mx-auto">
      {/* Left Column (Desktop) / Top Horizontal List (Mobile) */}
      <div className="shrink-0 md:w-[280px] flex flex-col md:border-r border-border md:pr-4 h-auto md:h-full">
        <h1 className="text-2xl font-semibold tracking-tight text-text-primary flex items-center gap-2 mb-6 shrink-0 shrink-0">
          <BookOpen size={22} className="text-amber" /> 
          Materias
        </h1>
        
        <div className="flex md:flex-col overflow-x-auto md:overflow-y-auto gap-2 pb-2 md:pb-0 no-scrollbar flex-1 items-start md:items-stretch">
          {materias.map(mat => (
            <button 
              key={mat.id}
              onClick={() => setSelectedMateriaId(mat.id)}
              className={cn(
                "flex items-center gap-3 p-3 rounded-card text-left transition-colors whitespace-nowrap min-w-[200px] md:min-w-0 border border-transparent shrink-0",
                selectedMateriaId === mat.id ? "bg-hover border-l-4 rounded-l-sm" : "bg-elevated border-border hover:border-amber/30 text-text-secondary hover:text-text-primary",
              )}
              style={selectedMateriaId === mat.id ? { borderLeftColor: mat.color } : {}}
            >
              <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: mat.color }} />
              <span className="flex-1 font-medium text-[14px] truncate" title={mat.name}>{mat.name}</span>
              {pendingEntregasCount(mat) > 0 && (
                <span className="bg-surface border border-border text-[10px] font-bold px-1.5 py-0.5 rounded text-text-muted shrink-0">
                  {pendingEntregasCount(mat)}
                </span>
              )}
            </button>
          ))}
          
          <button 
            onClick={() => setModalMateria(true)}
            className="flex items-center gap-2 p-3 text-text-muted hover:text-amber border border-dashed border-border hover:border-amber/30 rounded-card justify-center text-sm font-medium transition-colors shrink-0 whitespace-nowrap md:mt-2"
          >
            <Plus size={16} /> <span className="hidden md:inline">Nueva materia</span><span className="md:hidden">Nueva</span>
          </button>
        </div>
      </div>

      {/* Right Column */}
      {activeMateria ? (
        <div className="flex-1 flex flex-col gap-8 pb-10 overflow-y-auto no-scrollbar md:h-full">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-2xl font-bold text-text-primary flex items-center gap-3">
                <div className="w-4 h-4 rounded-full" style={{ backgroundColor: activeMateria.color }} />
                {activeMateria.name}
              </h2>
              <button onClick={() => { if(confirm('¿Eliminar materia?')) deleteMateria(activeMateria.id) }} className="p-2 text-text-muted hover:text-red hover:bg-hover rounded-md transition-colors">
                <Trash2 size={16} />
              </button>
            </div>
            <div className="h-[1px] w-full bg-border" />
          </div>

          <div className="flex flex-col xl:flex-row gap-6">
            {/* Sec 1 & 2 container */}
            <div className="flex flex-col gap-8 flex-1">
              
              {/* Entregas */}
              <section>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="label flex items-center gap-2">Entregas y TPs</h3>
                  <button onClick={() => setModalEntrega(true)} className="btn hover:bg-amber text-[11px] h-7 px-3 bg-amber/10 text-amber font-semibold !rounded-full transition-colors border border-amber/20">
                    <Plus size={12} /> Agregar
                  </button>
                </div>
                
                <div className="flex flex-col gap-2">
                  {activeMateria.entregas.length === 0 ? (
                    <div className="text-center p-6 border border-dashed border-border rounded-card text-text-muted text-[13px]">
                      No hay entregas pendientes
                    </div>
                  ) : (
                    activeMateria.entregas
                      .sort((a, b) => Number(a.done) - Number(b.done) || new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
                      .map(ent => (
                      <div key={ent.id} className={cn("group flex items-start gap-3 p-3 bg-elevated border border-border rounded-[10px] transition-opacity", ent.done && "opacity-60")}>
                        <button onClick={() => updateEntrega(activeMateria.id, ent.id, { done: !ent.done })} className={cn("mt-0.5 shrink-0 transition-colors", ent.done ? "text-green" : "text-text-muted hover:text-accent")}>
                          {ent.done ? <CheckCircle2 size={18} /> : <Circle size={18} />}
                        </button>
                        <div className="flex-1 min-w-0 flex justify-between items-start gap-4">
                          <div className="flex flex-col gap-1">
                            <span className={cn("text-[14px] font-medium transition-all", ent.done ? "line-through text-text-muted" : "text-text-primary")}>
                              {ent.title}
                            </span>
                            {ent.notes && <span className="text-[12px] text-text-muted truncate max-w-[200px] xl:max-w-[300px]">{ent.notes}</span>}
                          </div>
                          <div className="flex gap-3 items-center shrink-0">
                            <CustomCountdownChip date={ent.dueDate} done={ent.done} />
                            <button onClick={() => deleteEntrega(activeMateria.id, ent.id)} className="p-1 text-text-muted hover:text-red opacity-0 group-hover:opacity-100 transition-opacity">
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </section>

              {/* Recursos */}
              <section>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="label flex items-center gap-2">Recursos</h3>
                  <button onClick={() => setModalRecurso(true)} className="btn hover:bg-surface text-[11px] h-7 px-3 text-text-muted font-semibold !rounded-full transition-colors border border-border">
                    <Plus size={12} /> Agregar link
                  </button>
                </div>

                <div className="flex flex-col gap-1.5 bg-elevated p-1.5 border border-border rounded-[14px]">
                  {activeMateria.recursos.length === 0 ? (
                    <div className="text-center p-6 text-text-muted text-[13px]">
                      Pegá links a tus materiales de estudio
                    </div>
                  ) : (
                    activeMateria.recursos.map(rec => (
                      <div key={rec.id} className="group relative flex items-center gap-3 p-2.5 px-3 bg-surface hover:bg-hover rounded-[10px] transition-colors overflow-hidden border border-transparent hover:border-border cursor-pointer" onClick={() => window.open(rec.url, '_blank')}>
                        <div className="shrink-0">
                          {rec.type === 'drive' ? <div className="w-6 h-6 rounded flex items-center justify-center bg-[#0F9D58]/10 text-[#0F9D58]"><DriveIcon size={12}/></div> :
                           rec.type === 'notion' ? <div className="w-6 h-6 rounded border border-border flex items-center justify-center bg-transparent text-text-secondary"><Type size={12}/></div> :
                           rec.type === 'youtube' ? <div className="w-6 h-6 rounded flex items-center justify-center bg-red/10 text-red"><Play size={12} className="ml-0.5 fill-current"/></div> :
                           <div className="w-6 h-6 rounded flex items-center justify-center bg-blue-500/10 text-blue-500"><ExternalLink size={12}/></div>}
                        </div>
                        <div className="flex-1 min-w-0 flex flex-col justify-center">
                          <span className="text-[13px] font-medium text-text-primary leading-tight truncate">{rec.label}</span>
                          <span className="text-[11px] text-text-muted leading-tight truncate mt-0.5 max-w-[200px] xl:max-w-full">{rec.url}</span>
                        </div>
                        <button onClick={(e) => { e.stopPropagation(); deleteRecurso(activeMateria.id, rec.id); }} className="absolute right-3 p-1.5 text-text-muted hover:text-red opacity-0 group-hover:opacity-100 transition-opacity bg-surface rounded shadow-sm">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </section>

            </div>

            {/* Notas Rápidas */}
            <div className="flex-1 max-w-full xl:max-w-[400px]">
              <div className="flex items-center justify-between mb-4">
                <h3 className="label flex items-center gap-2">Notas Rápidas</h3>
                <button onClick={() => addNota(activeMateria.id)} className="btn hover:bg-surface text-[11px] h-7 px-3 text-text-muted font-semibold !rounded-full transition-colors border border-border">
                  <Plus size={12} /> Nueva nota
                </button>
              </div>

              <div className="flex flex-col gap-4">
                {activeMateria.notas.length === 0 ? (
                  <button onClick={() => addNota(activeMateria.id)} className="w-full text-left p-6 border border-dashed border-border hover:border-amber/30 rounded-card text-text-muted text-[13px] transition-colors focus:outline-none">
                    Escribí tus apuntes, fórmulas o recordatorios
                  </button>
                ) : (
                  activeMateria.notas.map(nota => (
                    <DebouncedNota 
                      key={nota.id} 
                      nota={nota} 
                      materiaId={activeMateria.id} 
                      onUpdate={updateNota} 
                      onDelete={deleteNota} 
                    />
                  ))
                )}
              </div>
            </div>

          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center text-text-muted text-sm border border-dashed border-border rounded-[14px]">
          Seleccioná o creá una materia para ver sus detalles.
        </div>
      )}

      {/* Modals */}
      <Modal open={modalMateria} onClose={() => setModalMateria(false)} title="Nueva Materia">
        <form onSubmit={handleSaveMateria} className="flex flex-col gap-4">
          <div>
            <label className="label mb-1.5 block">Nombre</label>
            <input autoFocus className="input" required value={fMateria.name} onChange={e => setFMateria({...fMateria, name: e.target.value})} placeholder="Ej: Análisis Matemático II" />
          </div>
          <div>
            <label className="label mb-1.5 block">Color</label>
            <div className="flex gap-2">
              {DEFAULT_COLORS.map(c => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setFMateria({...fMateria, color: c})}
                  className={cn("w-8 h-8 rounded-full border-2 transition-all", fMateria.color === c ? "scale-110" : "border-transparent opacity-70")}
                  style={{ backgroundColor: c, borderColor: fMateria.color === c ? c : 'transparent', outline: fMateria.color === c ? '2px solid var(--bg-surface)' : 'none', outlineOffset: '-4px' }}
                />
              ))}
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button type="button" variant="ghost" onClick={() => setModalMateria(false)}>Cancelar</Button>
            <Button type="submit" variant="primary">Guardar</Button>
          </div>
        </form>
      </Modal>

      <Modal open={modalEntrega} onClose={() => setModalEntrega(false)} title="Nueva Entrega">
        <form onSubmit={handleSaveEntrega} className="flex flex-col gap-4">
          <div>
            <label className="label mb-1.5 block">Título</label>
            <input autoFocus className="input" required value={fEntrega.title} onChange={e => setFEntrega({...fEntrega, title: e.target.value})} placeholder="Ej: TP 3 - Dinámica" />
          </div>
          <div>
            <label className="label mb-1.5 block">Fecha Límite</label>
            <input type="date" className="input" required value={fEntrega.dueDate} onChange={e => setFEntrega({...fEntrega, dueDate: e.target.value})} />
          </div>
          <div>
            <label className="label mb-1.5 block">Notas (opcional)</label>
            <textarea className="input resize-none" rows={2} value={fEntrega.notes} onChange={e => setFEntrega({...fEntrega, notes: e.target.value})} />
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button type="button" variant="ghost" onClick={() => setModalEntrega(false)}>Cancelar</Button>
            <Button type="submit" variant="primary">Guardar</Button>
          </div>
        </form>
      </Modal>

      <Modal open={modalRecurso} onClose={() => setModalRecurso(false)} title="Nuevo Recurso">
        <form onSubmit={handleSaveRecurso} className="flex flex-col gap-4">
          <div>
            <label className="label mb-1.5 block">Etiqueta</label>
            <input autoFocus className="input" required value={fRecurso.label} onChange={e => setFRecurso({...fRecurso, label: e.target.value})} placeholder="¿Cómo se llama este recurso?" />
          </div>
          <div>
            <label className="label mb-1.5 block">URL</label>
            <input type="url" className="input" required value={fRecurso.url} onChange={e => setFRecurso({...fRecurso, url: e.target.value})} placeholder="https://..." />
          </div>
          <div>
            <label className="label mb-1.5 block">Tipo</label>
            <select className="input" value={fRecurso.type} onChange={e => setFRecurso({...fRecurso, type: e.target.value as Recurso['type']})}>
              <option value="drive">Drive</option>
              <option value="notion">Notion</option>
              <option value="youtube">YouTube</option>
              <option value="link">Otro Enlace</option>
            </select>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button type="button" variant="ghost" onClick={() => setModalRecurso(false)}>Cancelar</Button>
            <Button type="submit" variant="primary">Guardar</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

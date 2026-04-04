import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X, AlertOctagon } from 'lucide-react';
import { useWeekBlocks } from '../hooks/useWeekBlocks';
import type { WeekBlock, BlockCategory } from '../types';
import { cn, CAT_COLORS } from '../lib/utils';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';

const DAYS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
const HOURS = Array.from({ length: 17 }, (_, i) => i + 7);

// ─── Modal Form ─────────────────────────────────────────────────────────────────
const BlockForm: React.FC<{ initial: Partial<WeekBlock>, onSave: (d: Omit<WeekBlock, 'id'>) => Promise<void> | void, onCancel: () => void }> = ({ initial, onSave, onCancel }) => {
  const [saving, setSaving] = useState(false);
  const [f, setF] = useState({ 
    day: initial.day ?? 0, 
    startHour: initial.startHour ?? 8, 
    endHour: initial.endHour ?? 10, 
    category: (initial.category ?? 'estudio') as BlockCategory, 
    label: initial.label ?? '' 
  });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (f.endHour <= f.startHour) return alert('La hora de fin debe ser posterior al inicio');
    setSaving(true);
    await onSave(f as Omit<WeekBlock, 'id'>);
    // UI clears on unmount or in parent
  };

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label mb-1.5 block">Día</label>
          <select className="input" value={f.day} onChange={e => setF({...f, day: Number(e.target.value) as WeekBlock['day']})}>
            {DAYS.map((d, i) => <option key={i} value={i}>{d}</option>)}
          </select>
        </div>
        <div>
          <label className="label mb-1.5 block">Categoría</label>
          <select className="input" value={f.category} onChange={e => setF({...f, category: e.target.value as BlockCategory})}>
            {Object.keys(CAT_COLORS).map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label mb-1.5 block">Inicio</label>
          <select className="input" value={f.startHour} onChange={e => setF({...f, startHour: Number(e.target.value)})}>
            {HOURS.map(h => <option key={h} value={h}>{h}:00</option>)}
          </select>
        </div>
        <div>
          <label className="label mb-1.5 block">Fin</label>
          <select className="input" value={f.endHour} onChange={e => setF({...f, endHour: Number(e.target.value)})}>
            {HOURS.filter(h => h > f.startHour).map(h => <option key={h} value={h}>{h}:00</option>)}
          </select>
        </div>
      </div>
      <div>
        <label className="label mb-1.5 block">Etiqueta</label>
        <input className="input" value={f.label} onChange={e=>setF({...f, label: e.target.value})} required placeholder="Ej: Laboratorio de Física" />
      </div>
      <div className="flex justify-end gap-2 mt-2">
        <Button type="button" variant="ghost" onClick={onCancel} disabled={saving}>Cancelar</Button>
        <Button type="submit" variant="primary" disabled={saving}>{saving ? 'Agendando...' : 'Agendar'}</Button>
      </div>
    </form>
  );
};

// ─── Planner Page ──────────────────────────────────────────────────────────────
export const WeeklyPlanner: React.FC = () => {
  const { blocks, addBlock, deleteBlock } = useWeekBlocks();
  const [modalOpen, setModalOpen] = useState(false);
  const [clickedCell, setClickedCell] = useState<{ day: number; hour: number } | null>(null);

  const load = blocks.filter(b => b.category === 'estudio' || b.category === 'facultad').reduce((a, b) => a + (b.endHour - b.startHour), 0);
  const heavyOverload = load > 45;

  const handleCellClick = (d: number, h: number) => { setClickedCell({ day: d, hour: h }); setModalOpen(true); };
  const ROW_H = 48; // px

  return (
    <div className="max-w-7xl mx-auto h-full flex flex-col pb-4">
      <header className="mb-4 flex flex-col md:flex-row md:items-end justify-between gap-4 shrink-0">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-text-primary mb-1">Planificador</h1>
        </div>
        <Button variant="primary" onClick={() => { setClickedCell(null); setModalOpen(true); }}>
          <Plus size={16} /> Nuevo Bloque
        </Button>
      </header>

      {/* Warning */}
      {load > 35 && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} 
          className={cn("px-4 py-3 rounded-card mb-4 flex items-center gap-3 border text-[13px] font-medium", 
             heavyOverload ? "bg-red/10 border-red/20 text-red" : "bg-amber/10 border-amber/20 text-amber")}>
          <AlertOctagon size={16} />
          <span>Atención: Llevas {load}h semanales de carga académica. {heavyOverload ? 'Considera priorizar descansos.' : 'Estás cerca del límite recomendado.'}</span>
        </motion.div>
      )}

      {/* Grid container */}
      <div className="flex-1 overflow-auto rounded-card border border-border bg-base w-full">
        <div className="min-w-[800px] flex text-text-muted text-[11px] font-semibold tracking-wide border-b border-border sticky top-0 bg-base/95 backdrop-blur z-20">
          <div className="w-12 shrink-0 border-r border-border" />
          {DAYS.map(d => (
            <div key={d} className="flex-1 py-3 text-center uppercase tracking-widest">{d.slice(0,3)}</div>
          ))}
        </div>
        
        <div className="min-w-[800px] flex relative bg-surface">
          {/* Time axis */}
          <div className="w-12 shrink-0 flex flex-col border-r border-border bg-base z-10">
            {HOURS.map(h => (
              <div key={h} style={{ height: ROW_H }} className="relative border-b border-border/30">
                <span className="absolute -top-2.5 right-2 text-[10px] text-text-faint">{h}:00</span>
              </div>
            ))}
          </div>

          {/* Days */}
          {DAYS.map((_, dayIdx) => (
            <div key={dayIdx} className="flex-1 relative border-r border-border/30 last:border-r-0">
              {HOURS.map((h, i) => (
                <div key={h} style={{ height: ROW_H, top: i * ROW_H }} 
                     className="absolute w-full border-b border-border/10 cursor-pointer hover:bg-[rgba(255,255,255,0.02)] transition-colors"
                     onClick={() => handleCellClick(dayIdx, h)} />
              ))}
              
              {/* Blocks */}
              <AnimatePresence>
                {blocks.filter(b => b.day === dayIdx).map(b => {
                  const top = (b.startHour - 7) * ROW_H;
                  const height = (b.endHour - b.startHour) * ROW_H;
                  const color = CAT_COLORS[b.category];
                  return (
                    <motion.div
                      key={b.id}
                      initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
                      className="absolute left-[2px] right-[2px] rounded-[6px] overflow-hidden group shadow-md"
                      style={{ top: top + 1, height: height - 2, borderLeft: `3px solid ${color}`, backgroundColor: 'rgba(23, 19, 11, 0.95)', borderTop: '0.5px solid #2e2010', borderRight: '0.5px solid #2e2010', borderBottom: '0.5px solid #2e2010' }}
                    >
                      <div className="absolute top-0 right-0 w-8 h-8 opacity-0 group-hover:opacity-100 bg-gradient-to-bl from-red/80 to-transparent transition-opacity flex items-start justify-end p-1 z-10 z-10 cursor-pointer" onClick={() => deleteBlock(b.id)}>
                        <X size={12} className="text-white drop-shadow" />
                      </div>
                      <div className="w-full h-full p-[6px] flex flex-col relative z-0">
                        <span className="text-[11px] font-semibold leading-tight line-clamp-2" style={{ color }}>{b.label}</span>
                        {height > 50 && <span className="text-[9px] text-text-muted mt-0.5">{b.startHour}h — {b.endHour}h</span>}
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Agendar Bloque" size="sm">
        <BlockForm 
          initial={clickedCell ? { day: clickedCell.day as WeekBlock['day'], startHour: clickedCell.hour, endHour: Math.min(clickedCell.hour + 2, 23) } : {}}
          onSave={async d => { await addBlock(d); setModalOpen(false); }}
          onCancel={() => setModalOpen(false)}
        />
      </Modal>
    </div>
  );
};

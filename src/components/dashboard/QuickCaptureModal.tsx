import React, { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Loader2, Plus, Calendar, BookOpen } from 'lucide-react';
import { useExams } from '../../hooks/useExams';
import { useMaterias } from '../../hooks/useMaterias';
import { ExamType } from '../../types';

interface QuickCaptureModalProps {
  open: boolean;
  onClose: () => void;
}

export const QuickCaptureModal: React.FC<QuickCaptureModalProps> = ({ open, onClose }) => {
  const { addExam } = useExams();
  const { materias, addEntrega } = useMaterias();
  
  const [type, setType] = useState<'Examen' | 'TP'>('Examen');
  const [subject, setSubject] = useState('');
  const [date, setDate] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && materias.length > 0 && !subject) {
      setSubject(materias[0].name);
    }
  }, [open, materias, subject]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject || !date) return;
    
    setLoading(true);
    try {
      if (type === 'Examen') {
        await addExam({
          subject,
          type: 'parcial',
          date,
          status: 'pendiente'
        });
      } else {
        const materia = materias.find(m => m.name === subject);
        if (materia) {
          await addEntrega(materia.id, {
            title: 'Nuevo TP',
            dueDate: date,
            done: false
          });
        }
      }
      onClose();
      // Reset
      setDate('');
      setType('Examen');
    } catch (error) {
      
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Carga Rápida">
      <form onSubmit={handleSubmit} className="flex flex-col gap-5 py-2">
        <div className="flex bg-elevated p-1 rounded-xl border border-border">
          {['Examen', 'TP'].map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setType(t as any)}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                type === t ? 'bg-base text-text-primary shadow-sm' : 'text-text-muted hover:text-text-secondary'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        <div className="space-y-1.5">
          <label className="text-[10px] font-bold uppercase tracking-wider text-text-faint ml-1">Materia</label>
          <div className="relative">
            <BookOpen size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" />
            <select
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full h-12 bg-base border border-border rounded-xl pl-11 pr-4 text-sm focus:border-amber transition-colors outline-none appearance-none"
              required
            >
              <option value="" disabled>Seleccioná una materia</option>
              {materias.map((m) => (
                <option key={m.id} value={m.name}>{m.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-[10px] font-bold uppercase tracking-wider text-text-faint ml-1">Fecha</label>
          <div className="relative">
            <Calendar size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" />
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full h-12 bg-base border border-border rounded-xl pl-11 pr-4 text-sm focus:border-amber transition-colors outline-none"
              required
            />
          </div>
        </div>

        <Button
          type="submit"
          variant="primary"
          className="w-full h-12 !bg-amber !text-[#17130b] font-bold mt-2"
          disabled={loading || !subject || !date}
        >
          {loading ? <Loader2 className="animate-spin size-4" /> : (
            <div className="flex items-center gap-2">
              <Plus size={16} />
              <span>Guardar {type}</span>
            </div>
          )}
        </Button>
      </form>
    </Modal>
  );
};

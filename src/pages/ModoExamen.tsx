import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useExams } from '../hooks/useExams';
import { motion, AnimatePresence } from 'framer-motion';
import { Modal } from '../components/ui/Modal';
import { Button } from '../components/ui/Button';
import { ArrowLeft, Check } from 'lucide-react';
import { useToast } from '../components/ui/Toast';
import { cn } from '../lib/utils';

export const ModoExamen = () => {
  const { examId } = useParams();
  const navigate = useNavigate();
  const { exams, updateExam } = useExams();
  const { showToast } = useToast();

  const exam = exams.find(e => e.id === examId);
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0, total: 0 });
  const [notes, setNotes] = useState(() => localStorage.getItem(`fos-modo-notes-${examId}`) || exam?.notes || '');
  const [modalOpen, setModalOpen] = useState(false);
  const [result, setResult] = useState<{ status: string, grade?: number }>({ status: 'aprobado' });
  const timerRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    if (!exam || exam.status !== 'pendiente') {
      navigate('/dashboard', { replace: true });
      return;
    }

    const calculateTime = () => {
      const now = new Date().getTime();
      const target = new Date(exam.date).getTime();
      const diff = target - now;

      if (diff <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0, total: 0 });
        return;
      }

      setTimeLeft({
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((diff % (1000 * 60)) / 1000),
        total: diff
      });
    };

    calculateTime();
    timerRef.current = window.setInterval(calculateTime, 1000);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !modalOpen) {
        navigate('/dashboard');
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      clearInterval(timerRef.current);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [exam, navigate, modalOpen]);

  useEffect(() => {
    const t = setTimeout(() => {
      localStorage.setItem(`fos-modo-notes-${examId}`, notes);
    }, 500);
    return () => clearTimeout(t);
  }, [notes, examId]);

  if (!exam) return null;

  const handleMarkAsDone = () => {
    updateExam(exam.id, { 
      status: result.status as "pendiente" | "aprobado" | "desaprobado" | "libre", 
      grade: (result.status === 'aprobado' || result.status === 'desaprobado') ? result.grade : undefined,
      notes: notes // Save the edited notes back to the exam
    });
    showToast('Examen marcado como rendido');
    navigate('/dashboard');
  };

  const isCritical = timeLeft.total > 0 && timeLeft.total < 3600000; // < 1 hour
  
  // Format top string
  let timeStr = '';
  if (timeLeft.days > 0) {
    timeStr = `${timeLeft.days} días, ${timeLeft.hours} hr`;
  } else if (timeLeft.total > 0) {
    timeStr = `${timeLeft.hours.toString().padStart(2, '0')}:${timeLeft.minutes.toString().padStart(2, '0')}:${timeLeft.seconds.toString().padStart(2, '0')}`;
  } else {
    timeStr = '00:00:00';
  }

  return (
    <div className="fixed inset-0 bg-[#0a0a0a] z-[100] flex flex-col p-8 md:p-12 text-text-primary h-screen overflow-hidden">
      
      <div className="flex-1 flex flex-col w-full max-w-3xl mx-auto items-center justify-center -mt-10">
        <p className="text-amber uppercase font-semibold text-xs tracking-[3px] mb-6">Modo Examen</p>
        <h1 className="text-3xl md:text-5xl font-display font-bold text-center mb-4">{exam.subject}</h1>
        <span className="bg-surface border border-border px-3 py-1 rounded text-sm text-text-muted capitalize mb-12">{exam.type}</span>

        <motion.div 
          animate={isCritical ? { scale: [1, 1.02, 1] } : {}} 
          transition={{ repeat: Infinity, duration: 2 }}
          className={cn("text-[60px] md:text-[80px] font-bold font-mono tracking-tighter tabular-nums mb-12", isCritical ? "text-red" : "text-amber")}
        >
          {timeStr}
        </motion.div>

        <div className="w-full max-w-2xl flex flex-col gap-3">
          <label className="text-text-muted text-sm font-medium">Notas de esta materia</label>
          <textarea 
            className="w-full bg-[#111] border border-[#222] rounded-xl p-4 text-text-primary min-h-[160px] resize-none focus:outline-none focus:border-amber/50 transition-colors"
            placeholder="Escribí un resumen rápido, temas que no te podés olvidar..."
            value={notes}
            onChange={e => setNotes(e.target.value)}
          />
        </div>
      </div>

      <div className="w-full max-w-4xl mx-auto flex items-center justify-between shrink-0">
        <button onClick={() => navigate('/dashboard')} className="flex items-center gap-2 text-text-muted hover:text-text-primary transition-colors text-sm font-medium">
          <ArrowLeft size={16} /> Salir del modo examen
        </button>
        <Button variant="primary" onClick={() => setModalOpen(true)} className="!bg-amber !text-[#17130b] gap-2">
          <Check size={16} /> Marcar como rendido
        </Button>
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="¿Cómo te fue?">
        <div className="flex flex-col gap-4">
          <div>
            <label className="label mb-1.5 block">Resultado</label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {['aprobado', 'desaprobado', 'libre', 'ausente'].map(st => (
                <button
                  key={st}
                  onClick={() => setResult({ ...result, status: st })}
                  className={cn("px-3 py-2 border rounded-card text-sm font-medium capitalize transition-colors", result.status === st ? "border-amber bg-amber/10 text-amber" : "border-border bg-base text-text-muted hover:text-text-primary")}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>
          <AnimatePresence>
            {(result.status === 'aprobado' || result.status === 'desaprobado') && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden relative">
                <div className="pt-2">
                  <label className="label mb-1.5 block">Nota final</label>
                  <input 
                    type="number" 
                    min="1" max="10" step="0.25" 
                    className="input w-full" 
                    placeholder="Ej: 8" 
                    value={result.grade ?? ''} 
                    onChange={e => setResult({ ...result, grade: e.target.value ? Number(e.target.value) : undefined })} 
                    autoFocus
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="ghost" onClick={() => setModalOpen(false)}>Cancelar</Button>
            <Button variant="primary" onClick={handleMarkAsDone} disabled={(result.status === 'aprobado' || result.status === 'desaprobado') && !result.grade} className="!bg-amber !text-[#17130b]">Confirmar</Button>
          </div>
        </div>
      </Modal>

    </div>
  );
};

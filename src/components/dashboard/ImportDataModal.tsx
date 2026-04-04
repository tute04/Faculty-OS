import React, { useState, useRef } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Loader2, Clipboard, Check, AlertCircle, Upload, FileText } from 'lucide-react';
import { useExams } from '../../hooks/useExams';
import { useMaterias } from '../../hooks/useMaterias';
import { Subject, ExamType } from '../../types';
import { formatDateES } from '../../lib/utils';

interface ImportedEvent {
  subject: string;
  date: string;
  type: ExamType;
  originalText: string;
}

interface ImportDataModalProps {
  open: boolean;
  onClose: () => void;
}

export const ImportDataModal: React.FC<ImportDataModalProps> = ({ open, onClose }) => {
  const { materias } = useMaterias();
  const { addExam } = useExams();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [rawText, setRawText] = useState('');
  const [suggestions, setSuggestions] = useState<ImportedEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'input' | 'confirm'>('input');

  const sanitizeTitle = (title: string) => {
    return title
      .replace(/^Se cierra /i, '')
      .replace(/^Abre /i, '')
      .replace(/^Vence /i, '')
      .replace(/^PRÁCTICO - /i, '')
      .trim();
  };

  const parseContent = (text: string) => {
    const lines = text.split('\n');
    const found: ImportedEvent[] = [];
    
    if (text.includes('BEGIN:VEVENT')) {
      const events = text.split('BEGIN:VEVENT');
      events.shift();
      
      events.forEach(ev => {
        const summaryMatch = ev.match(/SUMMARY:(.*)/);
        const dateMatch = ev.match(/DTSTART[:;](VALUE=DATE:)?(\d{8})/);
        
        if (summaryMatch && dateMatch) {
          const summary = summaryMatch[1].trim();
          const rawDate = dateMatch[2];
          const isoDate = `${rawDate.slice(0, 4)}-${rawDate.slice(4, 6)}-${rawDate.slice(6, 8)}`;
          
          const subject = materias.find(m => 
            summary.toLowerCase().includes(m.name.toLowerCase()) ||
            m.name.split(' ').some(word => word.length > 3 && summary.toLowerCase().includes(word.toLowerCase()))
          );
          
          found.push({
            subject: subject?.name || "", 
            date: isoDate,
            type: summary.toLowerCase().includes('final') ? 'final' : 'parcial',
            originalText: sanitizeTitle(summary)
          });
        }
      });
    } else {
      const dateRegex = /(\d{1,2})\/(\d{1,2})(\/(\d{2,4}))?/;
      lines.forEach(line => {
        const dateMatch = line.match(dateRegex);
        if (dateMatch) {
          let day = dateMatch[1].padStart(2, '0');
          let month = dateMatch[2].padStart(2, '0');
          let year = dateMatch[4] || new Date().getFullYear().toString();
          if (year.length === 2) year = '20' + year;
          const isoDate = `${year}-${month}-${day}`;
          
          const subject = materias.find(m => 
            line.toLowerCase().includes(m.name.toLowerCase()) ||
            m.name.split(' ').some(word => word.length > 3 && line.toLowerCase().includes(word.toLowerCase()))
          );

          found.push({
            subject: subject?.name || "",
            date: isoDate,
            type: line.toLowerCase().includes('final') ? 'final' : 'parcial',
            originalText: sanitizeTitle(line.trim())
          });
        }
      });
    }

    setSuggestions(found);
    setStep('confirm');
  };

  const updateSuggestion = (index: number, subject: string) => {
    setSuggestions(prev => prev.map((s, i) => i === index ? { ...s, subject } : s));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => parseContent(event.target?.result as string);
    reader.readAsText(file);
  };

  const handleSave = async () => {
    setLoading(true);
    for (const sug of suggestions) {
      if (!sug.subject) continue; // No guardar sin materia
      await addExam({
        subject: sug.subject as Subject,
        date: sug.date,
        type: sug.type,
        status: 'pendiente'
      });
    }
    setLoading(false);
    onClose();
    setStep('input');
    setRawText('');
    setSuggestions([]);
  };

  return (
    <Modal open={open} onClose={onClose} title="Importar Fechas (Moodle/PDF)">
      <div className="flex flex-col gap-4 py-2">
        {step === 'input' ? (
          <>
            <p className="text-xs text-text-muted leading-relaxed">
              Pegá el texto de tu aula virtual o subí el archivo **.ics** que te dio Moodle.
            </p>
            
            <div className="grid grid-cols-2 gap-3 mb-2">
              <button onClick={() => fileInputRef.current?.click()} className="flex flex-col items-center justify-center gap-2 p-4 border-2 border-dashed border-border rounded-xl hover:border-amber group transition-all">
                <Upload size={20} className="text-text-muted group-hover:text-amber" />
                <span className="text-[10px] font-bold uppercase text-text-muted group-hover:text-amber">Subir .ics</span>
                <input ref={fileInputRef} type="file" accept=".ics" onChange={handleFileUpload} className="hidden" />
              </button>
              <div className="flex flex-col items-center justify-center gap-2 p-4 border border-border bg-elevated rounded-xl">
                 <FileText size={20} className="text-text-faint" />
                 <span className="text-[10px] font-bold uppercase text-text-faint">O pegá texto</span>
              </div>
            </div>

            <textarea value={rawText} onChange={(e) => setRawText(e.target.value)} placeholder="Ej: 15/05 Parcial de Análisis Matemático..." className="w-full h-32 bg-base border border-border rounded-xl p-4 text-sm text-text-primary focus:border-amber transition-colors outline-none resize-none placeholder:text-text-faint" />
            <Button onClick={() => parseContent(rawText)} disabled={!rawText.trim()} variant="primary" className="!bg-amber !text-[#17130b] font-bold">Procesar texto pegado</Button>
          </>
        ) : (
          <>
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-text-primary">Confirmar Eventos ({suggestions.length})</p>
              <button onClick={() => setStep('input')} className="text-[10px] text-amber uppercase font-bold hover:underline">Volver</button>
            </div>
            <div className="flex flex-col gap-2 max-h-[350px] overflow-y-auto pr-1">
              {suggestions.length === 0 ? (
                <div className="flex flex-col items-center gap-2 py-8 text-text-muted">
                  <AlertCircle size={24} /><p className="text-xs">No identificamos eventos.</p>
                </div>
              ) : (
                suggestions.map((sug, i) => (
                  <div key={i} className={`p-3 rounded-lg border flex flex-col gap-2 transition-colors ${sug.subject ? 'bg-elevated border-border' : 'bg-amber/5 border-amber/30'}`}>
                    <div className="flex justify-between items-start gap-3">
                      <div className="flex-1 min-w-0">
                         <p className="text-[10px] text-text-muted mb-1 italic truncate">"{sug.originalText}"</p>
                         <select 
                            value={sug.subject} 
                            onChange={(e) => updateSuggestion(i, e.target.value)}
                            className={`w-full h-8 bg-base border rounded-md px-2 text-[11px] outline-none ${!sug.subject ? 'border-amber/50 text-amber' : 'border-border text-text-primary'}`}
                         >
                            <option value="">-- Seleccionar Materia --</option>
                            {materias.map(m => <option key={m.id} value={m.name}>{m.name}</option>)}
                         </select>
                      </div>
                      <span className="text-[10px] font-bold text-text-muted whitespace-nowrap bg-base px-2 py-1 rounded border border-border">{formatDateES(sug.date)}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
            <Button onClick={handleSave} disabled={loading || suggestions.length === 0 || suggestions.some(s => !s.subject)} variant="primary" className="!bg-amber !text-[#17130b] font-bold mt-2">
              {loading ? <Loader2 className="animate-spin size-4" /> : `Guardar ${suggestions.length} eventos`}
            </Button>
            {suggestions.some(s => !s.subject) && <p className="text-[10px] text-amber text-center">Asigná una materia a todos los eventos para guardar.</p>}
          </>
        )}
      </div>
    </Modal>
  );
};

import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function daysUntil(iso: string): number {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const t = new Date(iso);
  t.setHours(0, 0, 0, 0);
  return Math.ceil((t.getTime() - now.getTime()) / 86_400_000);
}

export function formatDateES(iso: string): string {
  return new Date(iso).toLocaleDateString('es-AR', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
}

export function greetingES(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Buenos días';
  if (h < 19) return 'Buenas tardes';
  return 'Buenas noches';
}

/** Color for countdown chips: red <7, amber <14, green ≤30, amber-soft >30 */
export function countdownMeta(days: number): { label: string; color: string; bg: string } {
  if (days < 0)  return { label: 'Vencido',              color: '#5a4e3a', bg: 'rgba(90,78,58,0.2)' };
  if (days === 0) return { label: '¡Hoy!',               color: '#ef4444', bg: 'rgba(239,68,68,0.15)' };
  if (days < 7)  return { label: `${days}d`,             color: '#ef4444', bg: 'rgba(239,68,68,0.15)' };
  if (days < 14) return { label: `${days}d`,             color: '#f59e0b', bg: 'rgba(245,158,11,0.15)' };
  if (days <= 30) return { label: `${days}d`,            color: '#4ade80', bg: 'rgba(74,222,128,0.15)' };
  return           { label: `${days}d`,                  color: '#d4a86a', bg: 'rgba(212,168,106,0.15)' };
}


export const CAT_COLORS: Record<string, string> = {
  facultad:       '#f59e0b',
  estudio:        '#fb923c',
  proyecto:       '#4ade80',
  emprendimiento: '#d4a86a',
  libre:          '#5a4e3a',
};

/**
 * Genera una URL para agendar un examen en Google Calendar (Formato Web App)
 */
export function generateGoogleCalendarUrl(exam: { subject: string; type: string; date: string }): string {
  const base = "https://calendar.google.com/calendar/render?action=TEMPLATE";
  
  const title = encodeURIComponent(`Examen: ${exam.type} - ${exam.subject} | Faculty OS`);
  
  // Formato Google: YYYYMMDDTHHMMSSZ
  // Asumimos las 12:00 UTC (~09:00 AR) por defecto, y 2 horas de duración
  const startDate = new Date(exam.date);
  startDate.setUTCHours(12, 0, 0); 
  
  const endDate = new Date(startDate);
  endDate.setUTCHours(14, 0, 0); // +2 horas

  const format = (d: Date) => d.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
  const dates = `${format(startDate)}/${format(endDate)}`;
  
  const details = encodeURIComponent(
    `📅 Recordatorio de examen generado por Faculty OS.\n\nMateria: ${exam.subject}\nTipo: ${exam.type}\n\n¡Muchos éxitos!`
  );

  return `${base}&text=${title}&dates=${dates}&details=${details}`;
}

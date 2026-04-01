import type { Exam } from '../types';

export async function requestNotificationPermission(): Promise<boolean> {
  if (!('Notification' in window)) return false;
  if (Notification.permission === 'granted') return true;
  if (Notification.permission === 'denied') return false;
  
  const perm = await Notification.requestPermission();
  return perm === 'granted';
}

export function scheduleExamReminders(exams: Exam[]): void {
  if (!('Notification' in window) || Notification.permission !== 'granted') return;
  
  // Clear any previously scheduled timeouts (for SPA re-renders)
  if ((window as unknown as { _fosTimeouts?: number[] })._fosTimeouts) {
    (window as unknown as { _fosTimeouts?: number[] })._fosTimeouts!.forEach((t: number) => clearTimeout(t));
  }
  (window as unknown as { _fosTimeouts?: number[] })._fosTimeouts = [];

  const storedNotifs: string[] = JSON.parse(localStorage.getItem('fos-notif-ids') || '[]');
  const now = new Date().getTime();

  exams.forEach(exam => {
    if (exam.status !== 'pendiente') return;
    const examDate = new Date(exam.date).getTime();
    
    // Notifications we want to trigger:
    const checks = [
      { daysLeft: 7, title: `📚 ${exam.subject}`, body: `${exam.type} en 7 días. Hora de arrancar.` },
      { daysLeft: 3, title: `⚠️ ${exam.subject}`, body: `${exam.type} en 3 días. ¿Cómo va el repaso?` },
      { daysLeft: 1, title: `🔴 Mañana es ${exam.type} de ${exam.subject}`, body: `Última noche.` },
    ];

    checks.forEach(({ daysLeft, title, body }) => {
      const targetTime = examDate - (daysLeft * 24 * 60 * 60 * 1000);
      const notifId = `exam-${exam.id}-${daysLeft}d`;
      
      // If the target time is in the future, and we haven't already sent/scheduled it:
      if (targetTime > now && !storedNotifs.includes(notifId)) {
        const delay = targetTime - now;
        
        // Browsers limit setTimeout maximum to about 24 days (2147483647 ms)
        if (delay > 2147483647) return; 

        const timeoutId = setTimeout(() => {
          new Notification(title, {
            body,
            icon: '/favicon.ico',
            badge: '/favicon.ico',
            tag: notifId
          });
          
          const currentNotifs = JSON.parse(localStorage.getItem('fos-notif-ids') || '[]');
          localStorage.setItem('fos-notif-ids', JSON.stringify([...currentNotifs, notifId]));
        }, delay);
        
        (window as unknown as { _fosTimeouts?: number[] })._fosTimeouts!.push(timeoutId);
      }
    });
  });
}

export function clearAllReminders(): void {
  if ((window as unknown as { _fosTimeouts?: number[] })._fosTimeouts) {
    (window as unknown as { _fosTimeouts?: number[] })._fosTimeouts!.forEach((t: number) => clearTimeout(t));
    (window as unknown as { _fosTimeouts?: number[] })._fosTimeouts = [];
  }
}

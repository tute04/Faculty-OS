import type { Exam, WeekBlock } from '../types';

export function calculatePriorityScore(exam: Exam, weekBlocks: WeekBlock[]): number {
  if (exam.status !== 'pendiente') return 0;

  const now = new Date();
  const examDate = new Date(exam.date);
  
  // Calculate days difference safely
  const diffTime = examDate.getTime() - now.getTime();
  const daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  // If exam is today or in the past, it's peak priority
  if (daysLeft <= 0) return 100;

  // Calculate hours studied for this subject this week
  // "Loose" match: if any word in the block label matches a word in the subject
  const subjectWords = exam.subject.toLowerCase().split(' ').filter(w => w.length > 3);
  
  const hoursStudied = weekBlocks.reduce((acc, block) => {
    if (block.category !== 'estudio') return acc;
    const lbl = block.label.toLowerCase();
    
    const matches = subjectWords.some(w => lbl.includes(w));
    if (matches || subjectWords.length === 0 /* fallback */) {
      return acc + (block.endHour - block.startHour);
    }
    return acc;
  }, 0);

  // Score formula
  // (100 / daysLeft) * (1 + 1 / max(hours, 0.5))
  // The less days left -> higher score
  // The less hours studied -> higher multiplier
  let score = (100 / daysLeft) * (1 + (1 / Math.max(hoursStudied, 0.5)));
  
  // Clamp between 0 and 100
  score = Math.max(0, Math.min(100, Math.round(score)));
  
  return score;
}

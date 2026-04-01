import type { Exam } from '../types';

export function encodeExamToShareLink(exam: Exam): string {
  const data = {
    subject: exam.subject,
    type: exam.type,
    date: exam.date,
    notes: exam.notes
  };
  const encoded = btoa(encodeURIComponent(JSON.stringify(data)));
  return `${window.location.origin}?import=${encoded}`;
}

export function decodeShareLink(encoded: string): Partial<Exam> | null {
  try {
    return JSON.parse(decodeURIComponent(atob(encoded)));
  } catch {
    return null;
  }
}

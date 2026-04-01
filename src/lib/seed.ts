import { Exam, WeekBlock, Habit } from '../types';

const now = () => new Date();
const addDays = (d: number) => {
  const t = now();
  t.setDate(t.getDate() + d);
  return t.toISOString();
};

export const SEED_EXAMS: Exam[] = [
  { id: 's1', subject: 'Estática y Resistencia de Materiales', type: 'parcial', status: 'pendiente', date: addDays(11), notes: 'Capítulos 3-7: vigas, columnas, torsión' },
  { id: 's2', subject: 'Mecánica y Mecanismos',                type: 'TP',      status: 'pendiente', date: addDays(19), notes: 'TP integrador bielas y manivelas' },
  { id: 's3', subject: 'Electrotecnia y Máquinas Eléctricas',  type: 'parcial', status: 'pendiente', date: addDays(34) },
  { id: 's4', subject: 'Estática y Resistencia de Materiales', type: 'parcial', status: 'pendiente', date: addDays(55), notes: '2do Parcial — toda la unidad 4' },
  { id: 's5', subject: 'Mecánica y Mecanismos',                type: 'parcial', status: 'pendiente', date: addDays(41) },
];

export const SEED_BLOCKS: WeekBlock[] = [
  // Monday — Estática clase + estudio tarde
  { id: 'b1',  day: 0, startHour: 8,  endHour: 10, category: 'facultad', label: 'Estática (clase)' },
  { id: 'b2',  day: 0, startHour: 14, endHour: 17, category: 'estudio',  label: 'Repaso Estática' },
  { id: 'b3',  day: 1, startHour: 9,  endHour: 11, category: 'facultad', label: 'Mecánica (clase)' },
  { id: 'b4',  day: 1, startHour: 18, endHour: 20, category: 'proyecto',   label: 'Proyecto Final' },
  // Wednesday — Electrotecnia + emprendimiento noche
  { id: 'b5',  day: 2, startHour: 10, endHour: 12, category: 'facultad',       label: 'Electrotecnia (clase)' },
  { id: 'b6',  day: 2, startHour: 14, endHour: 16, category: 'estudio',        label: 'Estudio libre' },
  { id: 'b7',  day: 2, startHour: 20, endHour: 22, category: 'emprendimiento', label: 'ITrium Sprint' },
  // Thursday — Mecánica clase + repaso
  { id: 'b8',  day: 3, startHour: 8,  endHour: 10, category: 'facultad', label: 'Mecánica Lab' },
  { id: 'b9',  day: 3, startHour: 15, endHour: 17, category: 'estudio',  label: 'Repaso Mecánica' },
  // Friday — Estática + libre
  { id: 'b10', day: 4, startHour: 9,  endHour: 11, category: 'facultad', label: 'Estática Lab' },
  { id: 'b11', day: 4, startHour: 16, endHour: 18, category: 'estudio',  label: 'Estudio Electro' },
  // Saturday — Proyectos
  { id: 'b12', day: 5, startHour: 10, endHour: 12, category: 'proyecto',   label: 'Reunión Equipo' },
  // Sunday — Emprendimiento
  { id: 'b13', day: 6, startHour: 15, endHour: 17, category: 'emprendimiento', label: 'ITrium – plan semana' },
  { id: 'b14', day: 6, startHour: 20, endHour: 22, category: 'libre',    label: 'Relax / series' },
];

export const SEED_HABITS: Habit[] = [
  { id: 'h1', label: 'Estudiar 3h',     targetDays: 7, completedDays: [true, true, true, false, true, false, false],  color: '#f59e0b' },
  { id: 'h2', label: 'Repasar apuntes', targetDays: 7, completedDays: [true, false, true, true, true, false, false],  color: '#fb923c' },
  { id: 'h3', label: 'Lectura',         targetDays: 7, completedDays: [true, true, true, true, true, false, false], color: '#4ade80' },
  { id: 'h4', label: 'Emprendimiento',  targetDays: 5, completedDays: [true, false, true, false, true, false, false],  color: '#d4a86a' },
];

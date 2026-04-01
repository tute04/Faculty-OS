export type Subject =
  | "Estática y Resistencia de Materiales"
  | "Mecánica y Mecanismos"
  | "Electrotecnia y Máquinas Eléctricas"
  | string;

export type ExamType = "parcial" | "final" | "TP" | "recuperatorio";
export type ExamStatus = "pendiente" | "aprobado" | "libre" | "desaprobado" | "ausente";

export interface Exam {
  id: string;
  subject: Subject;
  type: ExamType;
  status: ExamStatus;
  date: string;
  grade?: number;
  notes?: string;
}

export interface SubjectStatus {
  subject: string;
  maxFails: number;
  currentFails: number;
  hasLost: boolean;
  customNote?: string;
}

export type BlockCategory =
  | "facultad"
  | "estudio"
  | "proyecto"
  | "emprendimiento"
  | "libre";

export interface WeekBlock {
  id: string;
  day: 0 | 1 | 2 | 3 | 4 | 5 | 6;
  startHour: number;
  endHour: number;
  category: BlockCategory;
  label: string;
}

export interface Habit {
  id: string;
  label: string;
  targetDays: number;
  completedDays: boolean[];
  color: string;
}

export interface Goal {
  id: string;
  title: string;
  description?: string;
  deadline?: string;
  progress: number;
  category: "academico" | "personal" | "emprendimiento";
}

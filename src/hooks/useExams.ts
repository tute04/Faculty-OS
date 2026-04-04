import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/auth'
import type { Exam, SubjectStatus } from '../types'

const normalizeName = (name: string) =>
  name.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

interface ExamFilters {
  subject: string;
  status: string;
  type: string;
}

const calculateSubjectStatuses = (exams: Exam[]): SubjectStatus[] => {
  const subjects = new Set(exams.map(e => e.subject).filter(Boolean));
  const newStatuses: SubjectStatus[] = [];

  subjects.forEach(subject => {
    newStatuses.push({
      subject,
      maxFails: 2,
      currentFails: 0,
      hasLost: false,
    });
  });

  return newStatuses.map(status => {
    const fails = exams.filter(e => e.subject === status.subject && (e.status === 'desaprobado' || e.status === 'ausente')).length;
    return {
      ...status,
      currentFails: fails,
      hasLost: fails >= status.maxFails,
    };
  });
};

export function useExams() {
  const { user } = useAuth()
  const [exams, setExams] = useState<Exam[]>([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState<ExamFilters>({ subject: '', status: '', type: '' })

  useEffect(() => {
    if (!user?.id) {
      setLoading(false)
      return
    }

    let cancelled = false
    const timeout = setTimeout(() => {
      if (!cancelled) {
        console.warn('useExams: Fetch timed out.')
        setLoading(false)
      }
    }, 5000)

    fetchExams().finally(() => {
      cancelled = true
      clearTimeout(timeout)
    })

    return () => { cancelled = true; clearTimeout(timeout) }
  }, [user?.id])

  const fetchExams = async () => {
    if (!user?.id) return
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('exams')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: true })
      
      if (error) {
        console.error('useExams error:', error)
        return
      }
      setExams(data ?? [])
    } catch (err) {
      console.error('useExams unexpected error:', err)
    } finally {
      setLoading(false)
    }
  }

  const addExam = async (exam: Omit<Exam, 'id'>) => {
    // Asegurar que la materia exista antes de crear el examen
    if (exam.subject) {
      // Find existing materia (case insensitive)
      const { data: existingMaterias } = await supabase
        .from('materias')
        .select('id, name')
        .eq('user_id', user!.id);
      
      const normalizedNew = normalizeName(exam.subject);
      const duplicate = existingMaterias?.find(m => normalizeName(m.name) === normalizedNew);

      if (!duplicate) {
        // Colores por defecto para auto-creación
        const defaultColors = ['#f59e0b', '#fb923c', '#4ade80', '#2dd4bf', '#8b5cf6', '#ec4899'];
        const randomColor = defaultColors[Math.floor(Math.random() * defaultColors.length)];

        const { error: matError } = await supabase.from('materias').insert({
          user_id: user!.id,
          name: exam.subject.trim(),
          color: randomColor
        });

        if (matError) {
          console.error("Error auto-creando materia (¿RLS?):", matError);
        }
      }
    }

    const { data: examData, error } = await supabase
      .from('exams')
      .insert({ ...exam, user_id: user!.id })
      .select()
      .single()

    if (error) {
      console.error(error)
      return
    }

    if (examData) {
      setExams(prev => [...prev, examData])
      // UX: Pedir permiso de notificación solo al crear un examen real
      if ('Notification' in window && Notification.permission === 'default') {
        import('../lib/notifications').then(({ requestNotificationPermission }) => {
          requestNotificationPermission();
        });
      }
    }
  }

  const updateExam = async (id: string, updates: Partial<Exam>) => {
    const { data, error } = await supabase
      .from('exams')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    if (error) {
      console.error(error)
      return
    }
    if (data) setExams(prev => prev.map(e => e.id === id ? data : e))
  }

  const deleteExam = async (id: string) => {
    const { error } = await supabase.from('exams').delete().eq('id', id)
    if (error) {
      console.error(error)
      return
    }
    setExams(prev => prev.filter(e => e.id !== id))
  }

  const updateSubjectStatus = (subject: string, updates: Partial<SubjectStatus>) => {
    // Actually subject statuses are computed, no persistent storage in supabase based on schema.
    // If we need to support custom Note, we might need a db change, but sticking to schema.
  }

  const subjectStatuses = calculateSubjectStatuses(exams)

  return { exams, loading, addExam, updateExam, deleteExam, refetch: fetchExams, filters, setFilters, subjectStatuses, updateSubjectStatus }
}

export function useFilteredExams(exams: Exam[], filters: ExamFilters) {
  return exams.filter((e) => {
    if (filters.subject && e.subject !== filters.subject) return false;
    if (filters.status && e.status !== filters.status) return false;
    if (filters.type && e.type !== filters.type) return false;
    return true;
  });
}

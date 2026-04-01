import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/auth'
import type { Exam, SubjectStatus } from '../types'

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
    if (!user) return
    fetchExams()
  }, [user])

  const fetchExams = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('exams')
      .select('*')
      .eq('user_id', user!.id)
      .order('date', { ascending: true })
    if (error) {
      console.error(error)
      setLoading(false)
      return
    }
    setExams(data ?? [])
    setLoading(false)
  }

  const addExam = async (exam: Omit<Exam, 'id'>) => {
    const { data, error } = await supabase
      .from('exams')
      .insert({ ...exam, user_id: user!.id })
      .select()
      .single()
    if (error) {
      console.error(error)
      return
    }
    if (data) setExams(prev => [...prev, data])
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

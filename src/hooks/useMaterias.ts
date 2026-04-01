import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/auth'

export interface Entrega {
  id: string;
  title: string;
  dueDate: string;
  done: boolean;
  notes?: string;
}

export interface Recurso {
  id: string;
  label: string;
  url: string;
  type: 'drive' | 'notion' | 'link' | 'youtube' | 'other';
}

export interface NotaRapida {
  id: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export interface Materia {
  id: string;
  name: string;
  color: string;
  entregas: Entrega[];
  recursos: Recurso[];
  notas: NotaRapida[];
}

const DEFAULT_COLORS = ['#f59e0b', '#fb923c', '#4ade80', '#2dd4bf', '#8b5cf6', '#ec4899'];

export function useMaterias() {
  const { user } = useAuth()
  const [materias, setMaterias] = useState<Materia[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    fetchMaterias()
  }, [user])

  const fetchMaterias = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('materias')
      .select(`
        id, name, color,
        entregas (id, title, due_date, done, notes),
        recursos (id, label, url, type),
        notas (id, content, created_at, updated_at)
      `)
      .eq('user_id', user!.id)
      .order('created_at', { ascending: true })
    
    if (error) {
      console.error(error)
      setLoading(false)
      return
    }

    const mapped: Materia[] = (data ?? []).map((m: any) => ({
      id: m.id,
      name: m.name,
      color: m.color,
      entregas: (m.entregas || []).map((e: any) => ({
        id: e.id,
        title: e.title,
        dueDate: e.due_date,
        done: e.done,
        notes: e.notes
      })),
      recursos: (m.recursos || []).map((r: any) => ({
        id: r.id,
        label: r.label,
        url: r.url,
        type: r.type
      })),
      notas: (m.notas || []).map((n: any) => ({
        id: n.id,
        content: n.content,
        createdAt: n.created_at,
        updatedAt: n.updated_at
      }))
    }))
    
    setMaterias(mapped)
    setLoading(false)
  }

  const addMateria = async (name: string, color: string) => {
    const { data, error } = await supabase
      .from('materias')
      .insert({ user_id: user!.id, name, color })
      .select()
      .single()
    if (error) return console.error(error)
    if (data) {
      setMaterias(prev => [...prev, { id: data.id, name: data.name, color: data.color, entregas: [], recursos: [], notas: [] }])
    }
  }

  const updateMateria = async (id: string, updates: Partial<Materia>) => {
    const dbUpdates: any = {}
    if (updates.name !== undefined) dbUpdates.name = updates.name
    if (updates.color !== undefined) dbUpdates.color = updates.color

    const { data, error } = await supabase
      .from('materias')
      .update(dbUpdates)
      .eq('id', id)
      .select()
      .single()
    
    if (error) return console.error(error)
    if (data) {
      setMaterias(prev => prev.map(m => m.id === id ? { ...m, name: data.name, color: data.color } : m))
    }
  }

  const deleteMateria = async (id: string) => {
    const { error } = await supabase.from('materias').delete().eq('id', id)
    if (error) return console.error(error)
    setMaterias(prev => prev.filter(m => m.id !== id))
  }

  const addEntrega = async (materiaId: string, entrega: Omit<Entrega, 'id'>) => {
    const { data, error } = await supabase
      .from('entregas')
      .insert({
        materia_id: materiaId,
        user_id: user!.id,
        title: entrega.title,
        due_date: entrega.dueDate,
        done: entrega.done,
        notes: entrega.notes
      })
      .select()
      .single()
    if (error) return console.error(error)
    setMaterias(prev => prev.map(m => m.id === materiaId ? {
      ...m,
      entregas: [...m.entregas, { id: data.id, title: data.title, dueDate: data.due_date, done: data.done, notes: data.notes }]
    } : m))
  }

  const updateEntrega = async (materiaId: string, entregaId: string, updates: Partial<Entrega>) => {
    const dbUpdates: any = {}
    if (updates.title !== undefined) dbUpdates.title = updates.title
    if (updates.dueDate !== undefined) dbUpdates.due_date = updates.dueDate
    if (updates.done !== undefined) dbUpdates.done = updates.done
    if (updates.notes !== undefined) dbUpdates.notes = updates.notes

    const { data, error } = await supabase
      .from('entregas')
      .update(dbUpdates)
      .eq('id', entregaId)
      .select()
      .single()
    if (error) return console.error(error)
    setMaterias(prev => prev.map(m => m.id === materiaId ? {
      ...m,
      entregas: m.entregas.map(e => e.id === entregaId ? { ...e, ...updates } : e)
    } : m))
  }

  const deleteEntrega = async (materiaId: string, entregaId: string) => {
    const { error } = await supabase.from('entregas').delete().eq('id', entregaId)
    if (error) return console.error(error)
    setMaterias(prev => prev.map(m => m.id === materiaId ? {
      ...m,
      entregas: m.entregas.filter(e => e.id !== entregaId)
    } : m))
  }

  const addRecurso = async (materiaId: string, recurso: Omit<Recurso, 'id'>) => {
    const { data, error } = await supabase
      .from('recursos')
      .insert({
        materia_id: materiaId,
        user_id: user!.id,
        label: recurso.label,
        url: recurso.url,
        type: recurso.type
      })
      .select()
      .single()
    if (error) return console.error(error)
    setMaterias(prev => prev.map(m => m.id === materiaId ? {
      ...m,
      recursos: [...m.recursos, { id: data.id, label: data.label, url: data.url, type: data.type as any }]
    } : m))
  }

  const deleteRecurso = async (materiaId: string, recursoId: string) => {
    const { error } = await supabase.from('recursos').delete().eq('id', recursoId)
    if (error) return console.error(error)
    setMaterias(prev => prev.map(m => m.id === materiaId ? {
      ...m,
      recursos: m.recursos.filter(r => r.id !== recursoId)
    } : m))
  }

  const addNota = async (materiaId: string) => {
    const { data, error } = await supabase
      .from('notas')
      .insert({
        materia_id: materiaId,
        user_id: user!.id,
        content: ''
      })
      .select()
      .single()
    if (error) return console.error(error)
    setMaterias(prev => prev.map(m => m.id === materiaId ? {
      ...m,
      notas: [{ id: data.id, content: data.content, createdAt: data.created_at, updatedAt: data.updated_at }, ...m.notas]
    } : m))
  }

  const updateNota = async (materiaId: string, notaId: string, content: string) => {
    const { data, error } = await supabase
      .from('notas')
      .update({ content })
      .eq('id', notaId)
      .select()
      .single()
    if (error) return console.error(error)
    setMaterias(prev => prev.map(m => m.id === materiaId ? {
      ...m,
      notas: m.notas.map(n => n.id === notaId ? { ...n, content: data.content, updatedAt: data.updated_at } : n)
    } : m))
  }

  const deleteNota = async (materiaId: string, notaId: string) => {
    const { error } = await supabase.from('notas').delete().eq('id', notaId)
    if (error) return console.error(error)
    setMaterias(prev => prev.map(m => m.id === materiaId ? {
      ...m,
      notas: m.notas.filter(n => n.id !== notaId)
    } : m))
  }

  const syncWithSubjects = async (subjects: string[]) => {
    for (let i = 0; i < subjects.length; i++) {
      const subj = subjects[i];
      if (!materias.find(m => m.name === subj)) {
        let forcedColor = DEFAULT_COLORS[i % DEFAULT_COLORS.length];
        if (subj.includes('Estática')) forcedColor = '#f59e0b';
        else if (subj.includes('Mecánica')) forcedColor = '#fb923c';
        else if (subj.includes('Electrotecnia')) forcedColor = '#4ade80';

        await addMateria(subj, forcedColor);
      }
    }
  }

  return {
    materias, loading, addMateria, updateMateria, deleteMateria,
    addEntrega, updateEntrega, deleteEntrega,
    addRecurso, deleteRecurso,
    addNota, updateNota, deleteNota,
    syncWithSubjects, refetch: fetchMaterias
  }
}

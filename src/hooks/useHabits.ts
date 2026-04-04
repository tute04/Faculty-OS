import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/auth'
import type { Habit } from '../types'

export function useHabits() {
  const { user } = useAuth()
  const [habits, setHabits] = useState<Habit[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user?.id) return; // Bloquear fetch si no hay usuario confirmado

    const timeout = setTimeout(() => {
      if (loading) {
        console.warn('useHabits: Fetch timed out.')
        setLoading(false)
      }
    }, 5000)

    fetchHabits().finally(() => {
      clearTimeout(timeout)
      setLoading(false)
    })
  }, [user?.id])

  const fetchHabits = async () => {
    if (!user?.id) return
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('habits')
        .select('id, label, target_days, completed_days, color')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true })
      
      if (error) {
        console.error('useHabits error:', error)
        return
      }
      
      const mapped = (data ?? []).map((h: any) => ({
        id: h.id,
        label: h.label,
        targetDays: h.target_days,
        completedDays: h.completed_days,
        color: h.color
      }))
      setHabits(mapped)
    } catch (err) {
      console.error('useHabits unexpected error:', err)
    } finally {
      setLoading(false)
    }
  }

  const addHabit = async (habit: Omit<Habit, 'id'>) => {
    const { data, error } = await supabase
      .from('habits')
      .insert({
        user_id: user!.id,
        label: habit.label,
        target_days: habit.targetDays,
        completed_days: habit.completedDays,
        color: habit.color
      })
      .select()
      .single()
    
    if (error) {
      console.error(error)
      return
    }
    if (data) {
      setHabits(prev => [...prev, {
        id: data.id,
        label: data.label,
        targetDays: data.target_days,
        completedDays: data.completed_days,
        color: data.color
      }])
    }
  }

  const updateHabit = async (id: string, updates: Partial<Habit>) => {
    const dbUpdates: any = {}
    if (updates.label !== undefined) dbUpdates.label = updates.label
    if (updates.targetDays !== undefined) dbUpdates.target_days = updates.targetDays
    if (updates.completedDays !== undefined) dbUpdates.completed_days = updates.completedDays
    if (updates.color !== undefined) dbUpdates.color = updates.color

    const { data, error } = await supabase
      .from('habits')
      .update(dbUpdates)
      .eq('id', id)
      .select()
      .single()
    if (error) {
      console.error(error)
      return
    }
    if (data) {
      setHabits(prev => prev.map(h => h.id === id ? {
        id: data.id,
        label: data.label,
        targetDays: data.target_days,
        completedDays: data.completed_days,
        color: data.color
      } : h))
    }
  }

  const deleteHabit = async (id: string) => {
    const { error } = await supabase.from('habits').delete().eq('id', id)
    if (error) {
      console.error(error)
      return
    }
    setHabits(prev => prev.filter(h => h.id !== id))
  }

  const toggleDay = async (habitId: string, dayIndex: number) => {
    const habit = habits.find(h => h.id === habitId)
    if (!habit) return
    const newCompleted = [...habit.completedDays]
    newCompleted[dayIndex] = !newCompleted[dayIndex]
    
    // optimistically update local state
    setHabits(prev => prev.map(h => h.id === habitId ? { ...h, completedDays: newCompleted } : h))
    
    const { error } = await supabase
      .from('habits')
      .update({ completed_days: newCompleted })
      .eq('id', habitId)
    
    if (error) {
      console.error(error)
      // revert if error
      setHabits(prev => prev.map(h => h.id === habitId ? { ...h, completedDays: habit.completedDays } : h))
    }
  }

  return { habits, loading, addHabit, updateHabit, deleteHabit, toggleDay, refetch: fetchHabits }
}

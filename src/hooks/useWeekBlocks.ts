import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/auth'
import type { WeekBlock } from '../types'

export function useWeekBlocks() {
  const { user } = useAuth()
  const [blocks, setBlocks] = useState<WeekBlock[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user?.id) {
      setLoading(false)
      return
    }

    const timeout = setTimeout(() => {
      if (loading) {
        console.warn('useWeekBlocks: Fetch timed out.')
        setLoading(false)
      }
    }, 5000)

    fetchBlocks().finally(() => {
      clearTimeout(timeout)
      setLoading(false)
    })
  }, [user?.id])

  const fetchBlocks = async () => {
    if (!user?.id) return
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('week_blocks')
        .select('id, day, start_hour, end_hour, category, label')
        .eq('user_id', user.id)
      
      if (error) {
        console.error('useWeekBlocks error:', error)
        return
      }
      
      const mapped = (data ?? []).map((b: any) => ({
        id: b.id,
        day: b.day as WeekBlock['day'],
        startHour: b.start_hour,
        endHour: b.end_hour,
        category: b.category,
        label: b.label
      } as WeekBlock))
      setBlocks(mapped)
    } catch (err) {
      console.error('useWeekBlocks unexpected error:', err)
    } finally {
      setLoading(false)
    }
  }

  const addBlock = async (block: Omit<WeekBlock, 'id'>) => {
    const { data, error } = await supabase
      .from('week_blocks')
      .insert({ 
        user_id: user!.id,
        day: block.day,
        start_hour: block.startHour,
        end_hour: block.endHour,
        category: block.category,
        label: block.label
      })
      .select()
      .single()
    if (error) {
      console.error(error)
      return
    }
    if (data) {
      setBlocks(prev => [...prev, {
        id: data.id,
        day: data.day as WeekBlock['day'],
        startHour: data.start_hour,
        endHour: data.end_hour,
        category: data.category as any,
        label: data.label
      }])
    }
  }

  const updateBlock = async (id: string, updates: Partial<WeekBlock>) => {
    const dbUpdates: any = {}
    if (updates.day !== undefined) dbUpdates.day = updates.day
    if (updates.startHour !== undefined) dbUpdates.start_hour = updates.startHour
    if (updates.endHour !== undefined) dbUpdates.end_hour = updates.endHour
    if (updates.category !== undefined) dbUpdates.category = updates.category
    if (updates.label !== undefined) dbUpdates.label = updates.label

    const { data, error } = await supabase
      .from('week_blocks')
      .update(dbUpdates)
      .eq('id', id)
      .select()
      .single()
    
    if (error) {
      console.error(error)
      return
    }
    if (data) {
      setBlocks(prev => prev.map(b => b.id === id ? {
        id: data.id,
        day: data.day as WeekBlock['day'],
        startHour: data.start_hour,
        endHour: data.end_hour,
        category: data.category as any,
        label: data.label
      } : b))
    }
  }

  const deleteBlock = async (id: string) => {
    const { error } = await supabase.from('week_blocks').delete().eq('id', id)
    if (error) {
      console.error(error)
      return
    }
    setBlocks(prev => prev.filter(b => b.id !== id))
  }

  return { blocks, loading, addBlock, updateBlock, deleteBlock, refetch: fetchBlocks }
}

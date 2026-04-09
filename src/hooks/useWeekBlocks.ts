import { useEffect, useState, useCallback, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/auth'
import type { WeekBlock } from '../types'

export function useWeekBlocks() {
  const { user, session } = useAuth()
  const [blocks, setBlocks] = useState<WeekBlock[]>([])
  const [loading, setLoading] = useState(true)
  const retryRef = useRef(false);

  const fetchBlocks = useCallback(async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('week_blocks')
        .select('id, day, startHour, endHour, category, label')
        .eq('user_id', user.id)
      
      if (error) {
        setLoading(false);
        return
      }
      
      if ((!data || data.length === 0) && user?.id && !retryRef.current) {
        retryRef.current = true;
        setTimeout(() => fetchBlocks(), 1000);
      }
      
      const mapped = (data ?? []).map((b: any) => ({
        id: b.id,
        day: b.day as WeekBlock['day'],
        startHour: b.startHour,
        endHour: b.endHour,
        category: b.category,
        label: b.label
      } as WeekBlock))
      setBlocks(mapped)
    } catch (err) {
      
    } finally {
      setLoading(false)
    }
  }, [user?.id, session?.access_token]);

  useEffect(() => {
    if (!user || !user.id) {
       setLoading(false);
       return;
    }
    fetchBlocks();
  }, [fetchBlocks, user?.id, session?.access_token]);

  const addBlock = async (block: Omit<WeekBlock, 'id'>) => {
    const { data, error } = await supabase
      .from('week_blocks')
      .insert({ 
        user_id: user!.id,
        day: block.day,
        startHour: block.startHour,
        endHour: block.endHour,
        category: block.category,
        label: block.label
      })
      .select()
      .single()
    if (error) {
      
      return
    }
    if (data) {
      setBlocks(prev => [...prev, {
        id: data.id,
        day: data.day as WeekBlock['day'],
        startHour: data.startHour,
        endHour: data.endHour,
        category: data.category as any,
        label: data.label
      }])
    }
  }

  const updateBlock = async (id: string, updates: Partial<WeekBlock>) => {
    const dbUpdates: any = {}
    if (updates.day !== undefined) dbUpdates.day = updates.day
    if (updates.startHour !== undefined) dbUpdates.startHour = updates.startHour
    if (updates.endHour !== undefined) dbUpdates.endHour = updates.endHour
    if (updates.category !== undefined) dbUpdates.category = updates.category
    if (updates.label !== undefined) dbUpdates.label = updates.label

    const { data, error } = await supabase
      .from('week_blocks')
      .update(dbUpdates)
      .eq('id', id)
      .select()
      .single()
    
    if (error) {
      
      return
    }
    if (data) {
      setBlocks(prev => prev.map(b => b.id === id ? {
        id: data.id,
        day: data.day as WeekBlock['day'],
        startHour: data.startHour,
        endHour: data.endHour,
        category: data.category as any,
        label: data.label
      } : b))
    }
  }

  const deleteBlock = async (id: string) => {
    const { error } = await supabase.from('week_blocks').delete().eq('id', id)
    if (error) {
      
      return
    }
    setBlocks(prev => prev.filter(b => b.id !== id))
  }

  return { blocks, loading, addBlock, updateBlock, deleteBlock, refetch: fetchBlocks }
}

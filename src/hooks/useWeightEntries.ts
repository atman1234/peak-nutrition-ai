import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { useAuthContext } from '../components/auth/AuthContext'
import { useProfile } from './useProfile'
import { Database } from '../types/supabase'
import { formatWeight, getDisplayUnits } from '../lib/units'
import { Units } from '../types/profile'

type WeightEntry = Database['public']['Tables']['weight_entries']['Row']
type NewWeightEntry = Database['public']['Tables']['weight_entries']['Insert']

export function useWeightEntries() {
  const { user } = useAuthContext()
  const { profile } = useProfile()
  const queryClient = useQueryClient()
  
  // Get user's preferred units
  const userUnits: Units = (profile?.preferred_units as Units) || 'metric'
  const displayUnits = getDisplayUnits(userUnits)

  // Fetch all weight entries for the current user
  const { data: weightEntries = [], isLoading, error } = useQuery({
    queryKey: ['weight-entries', user?.id],
    queryFn: async () => {
      if (!user) return []

      const { data, error } = await supabase
        .from('weight_entries')
        .select('*')
        .eq('user_id', user.id)
        .order('recorded_at', { ascending: false })

      if (error) throw error
      return data as WeightEntry[]
    },
    enabled: !!user,
  })

  // Get latest weight entry
  const latestWeight = weightEntries[0] || null

  // Get weight entries for a specific date range
  const getWeightEntriesInRange = async (startDate: string, endDate: string) => {
    if (!user) return []

    // Note: For weight entries, we assume startDate and endDate are already 
    // in the format needed. Weight entries typically use date-only strings
    // rather than full timestamps, so this should work as-is.
    const { data, error } = await supabase
      .from('weight_entries')
      .select('*')
      .eq('user_id', user.id)
      .gte('recorded_at', startDate)
      .lte('recorded_at', endDate)
      .order('recorded_at', { ascending: true })

    if (error) throw error
    return data as WeightEntry[]
  }

  // Add or update weight entry (handles same-day updates)
  const addWeightEntry = useMutation({
    mutationFn: async (entry: Omit<NewWeightEntry, 'user_id'>) => {
      if (!user) throw new Error('User not authenticated')

      // Use local date for weight entry dates
      const recordedAt = entry.recorded_at || (() => {
        const now = new Date()
        const year = now.getFullYear()
        const month = String(now.getMonth() + 1).padStart(2, '0')
        const day = String(now.getDate()).padStart(2, '0')
        return `${year}-${month}-${day}`
      })()

      // First, check if an entry already exists for this date
      const { data: existingEntry } = await supabase
        .from('weight_entries')
        .select('id')
        .eq('user_id', user.id)
        .eq('recorded_at', recordedAt)
        .single()

      if (existingEntry) {
        // Update existing entry
        const { data, error } = await supabase
          .from('weight_entries')
          .update({
            weight: entry.weight,
            body_fat_percentage: entry.body_fat_percentage,
            muscle_mass: entry.muscle_mass,
            notes: entry.notes,
          })
          .eq('id', existingEntry.id)
          .select()
          .single()

        if (error) throw error
        return data
      } else {
        // Create new entry
        const { data, error } = await supabase
          .from('weight_entries')
          .insert({
            ...entry,
            user_id: user.id,
            recorded_at: recordedAt,
          })
          .select()
          .single()

        if (error) throw error
        return data
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['weight-entries', user?.id] })
    },
  })

  // Update weight entry
  const updateWeightEntry = useMutation({
    mutationFn: async ({ id, ...updates }: { id: string } & Partial<WeightEntry>) => {
      if (!user) throw new Error('User not authenticated')

      const { data, error } = await supabase
        .from('weight_entries')
        .update(updates)
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['weight-entries', user?.id] })
    },
  })

  // Delete weight entry
  const deleteWeightEntry = useMutation({
    mutationFn: async (id: string) => {
      if (!user) throw new Error('User not authenticated')

      const { error } = await supabase
        .from('weight_entries')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['weight-entries', user?.id] })
    },
  })

  // Calculate weight change statistics
  const getWeightStats = () => {
    const latestEntry = weightEntries[0]
    
    if (!latestEntry) {
      return {
        totalChange: 0,
        weeklyAvgChange: 0,
        monthlyChange: 0,
        trend: 'stable' as 'gaining' | 'losing' | 'stable',
      }
    }

    // For total change, use oldest entry to latest
    const oldestEntry = weightEntries[weightEntries.length - 1]
    const totalChange = weightEntries.length > 1 
      ? latestEntry.weight - oldestEntry.weight 
      : 0

    // Calculate weekly average change
    const daysElapsed = weightEntries.length > 1 
      ? Math.max(1, (new Date(latestEntry.recorded_at).getTime() - new Date(oldestEntry.recorded_at).getTime()) / (1000 * 60 * 60 * 24))
      : 1
    const weeklyAvgChange = (totalChange / daysElapsed) * 7

    // Calculate 30-day change using proper baseline
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    
    // Find the baseline weight for 30-day comparison
    let baselineWeight: number
    
    // Look for the last entry before 30 days ago
    const entriesBeforeThirtyDays = weightEntries.filter(entry => {
      const entryDate = entry.recorded_at.includes('T') 
        ? new Date(entry.recorded_at)
        : new Date(entry.recorded_at + 'T12:00:00')
      return entryDate < thirtyDaysAgo
    })
    
    if (entriesBeforeThirtyDays.length > 0) {
      // Use the most recent entry before 30 days ago
      baselineWeight = entriesBeforeThirtyDays[0].weight
    } else if (profile?.initial_weight) {
      // Use initial weight if no entries before 30 days ago
      baselineWeight = profile.initial_weight
    } else if (profile?.current_weight) {
      // Fallback to profile current weight if no initial weight
      baselineWeight = profile.current_weight
    } else {
      // If no profile weights, compare to oldest entry
      baselineWeight = oldestEntry ? oldestEntry.weight : latestEntry.weight
    }
    
    const monthlyChange = latestEntry.weight - baselineWeight

    // Determine trend
    let trend: 'gaining' | 'losing' | 'stable' = 'stable'
    if (weeklyAvgChange > 0.1) trend = 'gaining'
    else if (weeklyAvgChange < -0.1) trend = 'losing'

    return {
      totalChange,
      weeklyAvgChange,
      monthlyChange,
      trend,
    }
  }

  return {
    weightEntries,
    latestWeight,
    isLoading,
    error,
    addWeightEntry: addWeightEntry.mutate,
    updateWeightEntry: updateWeightEntry.mutate,
    deleteWeightEntry: deleteWeightEntry.mutate,
    isAdding: addWeightEntry.isPending,
    isUpdating: updateWeightEntry.isPending,
    isDeleting: deleteWeightEntry.isPending,
    getWeightEntriesInRange,
    getWeightStats,
    // Unit-aware helpers
    userUnits,
    displayUnits,
    formatWeight: (weight: number) => formatWeight(weight, userUnits),
  }
}
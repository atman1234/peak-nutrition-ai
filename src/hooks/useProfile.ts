
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { useAuthContext } from '../components/auth/AuthContext'
import type { UserProfile, CalorieTargets } from '../types/profile'
import { calculateAllTargets } from '../lib/calculations'

export function useProfile() {
  const { user } = useAuthContext()
  const queryClient = useQueryClient()

  // Fetch user profile
  const {
    data: profile,
    isLoading,
    error
  } = useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async (): Promise<UserProfile | null> => {
      if (!user?.id) return null

      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (error && error.code !== 'PGRST116') {
        throw error
      }

      return data
    },
    enabled: !!user?.id,
  })

  // Create or update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (profileData: Partial<UserProfile>) => {
      console.log('📡 useProfile: Starting profile update mutation')
      console.log('📋 useProfile: Profile data to save:', profileData)
      
      if (!user?.id) {
        const error = new Error('User not authenticated')
        console.error('❌ useProfile: User not authenticated:', error)
        throw error
      }

      // Calculate targets if we have enough data
      let calculatedTargets = {}
      if (
        profileData.current_weight &&
        profileData.height &&
        profileData.age &&
        profileData.gender &&
        profileData.activity_level &&
        profileData.primary_goal
      ) {
        // Convert to metric for calculations if needed
        let weightForCalc = profileData.current_weight
        let heightForCalc = profileData.height
        
        if (profileData.preferred_units === 'imperial') {
          weightForCalc = profileData.current_weight * 0.453592 // lbs to kg
          heightForCalc = profileData.height * 2.54 // inches to cm
        }
        
        const targets = calculateAllTargets(
          weightForCalc,
          heightForCalc,
          profileData.age,
          profileData.gender,
          profileData.activity_level,
          profileData.primary_goal
        )

        calculatedTargets = {
          daily_calorie_target: targets.dailyCalories,
          protein_target_g: targets.proteinGrams,
          carb_target_g: targets.carbGrams,
          fat_target_g: targets.fatGrams,
        }
      }

      const updateData = {
        ...profileData,
        ...calculatedTargets,
        id: user.id,
      }

      console.log('📋 useProfile: Final update data:', updateData)
      console.log('🔍 useProfile: Data validation check:')
      console.log('  - User ID:', user.id)
      console.log('  - Data keys:', Object.keys(updateData))
      console.log('  - Data types:', Object.entries(updateData).map(([key, value]) => `${key}: ${typeof value} (${value})`))
      console.log('📡 useProfile: Sending to Supabase...')
      
      const { data, error } = await supabase
        .from('user_profiles')
        .upsert(updateData, { 
          onConflict: 'id',
          ignoreDuplicates: false 
        })
        .select()
        .single()

      if (error) {
        console.error('💥 useProfile: Supabase error:', error)
        console.error('💥 useProfile: Error details:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        })
        throw error
      }
      
      console.log('✅ useProfile: Profile update successful:', data)
      return data
    },
    onSuccess: (data) => {
      console.log('🎉 useProfile: Mutation success callback triggered:', data)
      queryClient.invalidateQueries({ queryKey: ['profile', user?.id] })
      console.log('🔄 useProfile: Profile cache invalidated')
    },
    onError: (error) => {
      console.error('💥 useProfile: Mutation error callback triggered:', error)
    },
  })

  // Check if profile is complete
  const isProfileComplete = (profile: UserProfile | null | undefined): boolean => {
    if (!profile) return false
    
    return !!(
      profile.height &&
      profile.current_weight &&
      profile.age &&
      profile.gender &&
      profile.activity_level &&
      profile.primary_goal
    )
  }

  // Get calculated targets from current profile
  const getCalculatedTargets = (): CalorieTargets | null => {
    if (!profile || !isProfileComplete(profile)) return null

    try {
      // Convert to metric for calculations if needed
      let weightForCalc = profile.current_weight!
      let heightForCalc = profile.height!
      
      if (profile.preferred_units === 'imperial') {
        weightForCalc = profile.current_weight! * 0.453592 // lbs to kg
        heightForCalc = profile.height! * 2.54 // inches to cm
      }
      
      return calculateAllTargets(
        weightForCalc,
        heightForCalc,
        profile.age!,
        profile.gender!,
        profile.activity_level!,
        profile.primary_goal!
      )
    } catch (error) {
      console.error('Error calculating targets:', error)
      return null
    }
  }

  return {
    profile,
    isLoading,
    error,
    updateProfile: updateProfileMutation.mutate,
    isUpdating: updateProfileMutation.isPending,
    updateError: updateProfileMutation.error,
    isProfileComplete: isProfileComplete(profile),
    calculatedTargets: getCalculatedTargets(),
  }
}

export function useWeightEntries() {
  const { user } = useAuthContext()
  const queryClient = useQueryClient()

  // Fetch weight entries
  const {
    data: weightEntries = [],
    isLoading,
    error
  } = useQuery({
    queryKey: ['weightEntries', user?.id],
    queryFn: async () => {
      if (!user?.id) return []

      const { data, error } = await supabase
        .from('weight_entries')
        .select('*')
        .eq('user_id', user.id)
        .order('recorded_at', { ascending: false })
        .limit(30) // Last 30 entries

      if (error) throw error
      return data || []
    },
    enabled: !!user?.id,
  })

  // Add weight entry mutation
  const addWeightMutation = useMutation({
    mutationFn: async (weightData: {
      weight_kg: number
      recorded_at?: string
      body_fat_percentage?: number
      notes?: string
    }) => {
      if (!user?.id) throw new Error('User not authenticated')

      const { data, error } = await supabase
        .from('weight_entries')
        .insert({
          user_id: user.id,
          ...weightData,
        })
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['weightEntries', user?.id] })
    },
  })

  // Update weight entry mutation
  const updateWeightMutation = useMutation({
    mutationFn: async ({ id, ...updateData }: {
      id: string
      weight_kg?: number
      body_fat_percentage?: number
      notes?: string
    }) => {
      const { data, error } = await supabase
        .from('weight_entries')
        .update(updateData)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['weightEntries', user?.id] })
    },
  })

  // Delete weight entry mutation
  const deleteWeightMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('weight_entries')
        .delete()
        .eq('id', id)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['weightEntries', user?.id] })
    },
  })

  return {
    weightEntries,
    isLoading,
    error,
    addWeight: addWeightMutation.mutate,
    isAdding: addWeightMutation.isPending,
    addError: addWeightMutation.error,
    updateWeight: updateWeightMutation.mutate,
    isUpdating: updateWeightMutation.isPending,
    updateError: updateWeightMutation.error,
    deleteWeight: deleteWeightMutation.mutate,
    isDeleting: deleteWeightMutation.isPending,
    deleteError: deleteWeightMutation.error,
    latestWeight: weightEntries[0],
  }
}
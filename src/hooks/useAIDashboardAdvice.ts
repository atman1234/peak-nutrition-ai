import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { useAuthContext } from '../components/auth/AuthContext'
import { useUserTier } from './useUserTier'

export interface DashboardAdviceData {
  advice_id: string
  daily_focus: string[]
  meal_suggestions: {
    breakfast?: string[]
    lunch?: string[]
    dinner?: string[]
    snacks?: string[]
  }
  macro_priorities: {
    priority: 'protein' | 'carbs' | 'fat' | 'balanced'
    reason: string
    target_grams?: number
  }
  hydration_reminder?: string
  motivational_message: string
  quick_tips: string[]
  recent_patterns?: {
    trend: string
    recommendation: string
  }
  confidence_score: number
  created_at: string
  is_refresh: boolean
  refreshes_remaining?: number
  processing_time_ms?: number
  error?: string
}

export interface DashboardAdviceUsage {
  has_initial_advice: boolean
  refreshes_used: number
  refreshes_remaining: number
  refresh_limit: number
  can_refresh: boolean
}

export function useAIDashboardAdvice() {
  const { user } = useAuthContext()
  const { hasAIFeatures } = useUserTier()
  const queryClient = useQueryClient()
  const [lastAdviceData, setLastAdviceData] = useState<DashboardAdviceData | null>(null)

  // Get today's date for dashboard advice
  const today = new Date().toISOString().split('T')[0]

  // Get latest dashboard advice for today
  const { 
    data: dashboardAdvice, 
    isLoading: isLoadingAdvice, 
    error: adviceError,
    refetch: refetchAdvice 
  } = useQuery({
    queryKey: ['dashboard-advice', user?.id, today],
    queryFn: async (): Promise<DashboardAdviceData | null> => {
      if (!user?.id) {
        throw new Error('User not authenticated')
      }

      const { data, error } = await supabase
        .rpc('get_latest_ai_content', {
          user_uuid: user.id,
          p_feature_type: 'dashboard_advice',
          p_date: today
        })

      if (error) {
        console.error('Error fetching dashboard advice:', error)
        return null
      }

      if (!data || data.length === 0 || !data[0]?.content_data) {
        return null
      }

      const adviceData = data[0]
      return {
        advice_id: adviceData.content_id,
        ...adviceData.content_data,
        created_at: adviceData.created_at,
        is_refresh: adviceData.is_refresh || false
      }
    },
    enabled: !!user?.id && hasAIFeatures(),
    staleTime: 1000 * 60 * 5, // 5 minutes
  })

  // Get dashboard advice usage stats
  const { 
    data: usageStats, 
    isLoading: isLoadingUsage,
    refetch: refetchUsage 
  } = useQuery({
    queryKey: ['dashboard-advice-usage', user?.id, today],
    queryFn: async (): Promise<DashboardAdviceUsage> => {
      if (!user?.id) {
        throw new Error('User not authenticated')
      }

      const { data, error } = await supabase
        .rpc('can_refresh_ai_content', {
          user_uuid: user.id,
          p_feature_type: 'dashboard_advice'
        })

      if (error) {
        console.error('Error checking refresh capability:', error)
        throw error
      }

      if (!data || data.length === 0) {
        return {
          has_initial_advice: false,
          refreshes_used: 0,
          refreshes_remaining: 0,
          refresh_limit: 0,
          can_refresh: false
        }
      }

      const usageData = data[0]
      return {
        has_initial_advice: usageData.has_initial_content || false,
        refreshes_used: usageData.refreshes_used || 0,
        refreshes_remaining: usageData.refreshes_remaining || 0,
        refresh_limit: usageData.refresh_limit || 0,
        can_refresh: usageData.can_refresh || false
      }
    },
    enabled: !!user?.id && hasAIFeatures(),
    staleTime: 1000 * 30, // 30 seconds
  })

  // Generate dashboard advice mutation
  const generateAdviceMutation = useMutation({
    mutationFn: async ({ userGuidance }: { userGuidance?: string } = {}): Promise<DashboardAdviceData> => {
      if (!user?.id) {
        throw new Error('User not authenticated')
      }

      if (!hasAIFeatures()) {
        throw new Error('AI features require Pro subscription')
      }

      const { data, error } = await supabase.functions.invoke('ai-dashboard-advice', {
        body: { 
          user_id: user.id,
          is_refresh: false,
          user_guidance: userGuidance
        }
      })

      if (error) {
        console.error('Dashboard advice generation error:', error)
        
        if (error.message?.includes('limit exceeded')) {
          throw new Error('Dashboard advice limit exceeded. Please upgrade to Pro or wait until tomorrow.')
        }
        
        throw new Error(error.message || 'Failed to generate dashboard advice')
      }

      if (data.error) {
        throw new Error(data.error)
      }

      return data
    },
    onSuccess: (data) => {
      setLastAdviceData(data)
      // Refetch both advice and usage data
      refetchAdvice()
      refetchUsage()
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['dashboard-advice', user?.id] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-advice-usage', user?.id] })
    },
  })

  // Refresh dashboard advice mutation
  const refreshAdviceMutation = useMutation({
    mutationFn: async ({ userGuidance }: { userGuidance?: string } = {}): Promise<DashboardAdviceData> => {
      if (!user?.id) {
        throw new Error('User not authenticated')
      }

      if (!hasAIFeatures()) {
        throw new Error('AI features require Pro subscription')
      }

      // Check if user can refresh
      if (!usageStats?.can_refresh) {
        throw new Error('No refreshes remaining for today. Please upgrade to Pro for more refreshes.')
      }

      const { data, error } = await supabase.functions.invoke('ai-dashboard-advice', {
        body: { 
          user_id: user.id,
          is_refresh: true,
          user_guidance: userGuidance,
          previous_response_id: dashboardAdvice?.advice_id
        }
      })

      if (error) {
        console.error('Dashboard advice refresh error:', error)
        
        if (error.message?.includes('limit exceeded')) {
          throw new Error('Dashboard advice refresh limit exceeded. Please wait until tomorrow.')
        }
        
        throw new Error(error.message || 'Failed to refresh dashboard advice')
      }

      if (data.error) {
        throw new Error(data.error)
      }

      return data
    },
    onSuccess: (data) => {
      setLastAdviceData(data)
      // Refetch both advice and usage data
      refetchAdvice()
      refetchUsage()
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['dashboard-advice', user?.id] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-advice-usage', user?.id] })
    },
  })

  // Helper function to clear last advice data
  const clearLastAdvice = () => {
    setLastAdviceData(null)
  }

  // Helper function to get guidance suggestions for the UI
  const getGuidanceSuggestions = () => {
    return [
      "Quick breakfast ideas",
      "Meal prep suggestions", 
      "Eating out tomorrow",
      "Low carb options",
      "High protein meals",
      "Budget-friendly meals",
      "30-minute meals",
      "Vegetarian options"
    ]
  }

  return {
    // Data
    dashboardAdvice: lastAdviceData || dashboardAdvice,
    usageStats,
    
    // Loading states
    isLoadingAdvice,
    isLoadingUsage,
    isGenerating: generateAdviceMutation.isPending,
    isRefreshing: refreshAdviceMutation.isPending,
    
    // Error states
    adviceError,
    generateError: generateAdviceMutation.error,
    refreshError: refreshAdviceMutation.error,
    
    // Actions
    generateAdvice: generateAdviceMutation.mutate,
    refreshAdvice: refreshAdviceMutation.mutate,
    clearLastAdvice,
    refetchAdvice,
    refetchUsage,
    getGuidanceSuggestions,
    
    // Computed properties
    hasAdvice: !!(lastAdviceData || dashboardAdvice),
    canGenerate: hasAIFeatures() && (!usageStats || !usageStats.has_initial_advice),
    canRefresh: hasAIFeatures() && usageStats?.can_refresh,
    refreshesRemaining: usageStats?.refreshes_remaining || 0,
    refreshLimit: usageStats?.refresh_limit || 0,
  }
}
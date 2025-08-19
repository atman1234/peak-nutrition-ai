import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { useAuthContext } from '../components/auth/AuthContext'
import { useUserTier } from './useUserTier'

export interface DailyReviewData {
  review_id: string
  date: string
  analysis: {
    total_calories: number
    total_protein: number
    total_carbs: number
    total_fat: number
    goal_calories?: number
    goal_protein?: number
    goal_carbs?: number
    goal_fat?: number
  }
  achievements: string[]
  improvements: string[]
  tomorrow_focus: string[]
  personalized_advice: string
  confidence_score: number
  created_at: string
  is_refresh: boolean
  refreshes_remaining?: number
  processing_time_ms?: number
  error?: string
}

export interface DailyReviewUsage {
  has_initial_review: boolean
  refreshes_used: number
  refreshes_remaining: number
  refresh_limit: number
  can_refresh: boolean
}

export function useAIDailyReview(date?: string) {
  const { user } = useAuthContext()
  const { hasAIFeatures } = useUserTier()
  const queryClient = useQueryClient()
  const [lastReviewData, setLastReviewData] = useState<DailyReviewData | null>(null)

  // Default to yesterday if no date provided
  const targetDate = date || new Date(Date.now() - 86400000).toISOString().split('T')[0]

  // Get latest daily review for the date
  const { 
    data: dailyReview, 
    isLoading: isLoadingReview, 
    error: reviewError,
    refetch: refetchReview 
  } = useQuery({
    queryKey: ['daily-review', user?.id, targetDate],
    queryFn: async (): Promise<DailyReviewData | null> => {
      if (!user?.id) {
        throw new Error('User not authenticated')
      }

      const { data, error } = await supabase
        .rpc('get_latest_ai_content', {
          user_uuid: user.id,
          p_feature_type: 'daily_review',
          p_date: targetDate
        })

      if (error) {
        console.error('Error fetching daily review:', error)
        return null
      }

      if (!data || data.length === 0 || !data[0]?.content_data) {
        return null
      }

      const reviewData = data[0]

      return {
        review_id: reviewData.content_id,
        date: targetDate,
        ...reviewData.content_data,
        created_at: reviewData.created_at,
        is_refresh: reviewData.is_refresh || false
      }
    },
    enabled: !!user?.id && hasAIFeatures(),
    staleTime: 1000 * 60 * 5, // 5 minutes
  })

  // Get daily review usage stats
  const { 
    data: usageStats, 
    isLoading: isLoadingUsage,
    refetch: refetchUsage 
  } = useQuery({
    queryKey: ['daily-review-usage', user?.id, targetDate],
    queryFn: async (): Promise<DailyReviewUsage> => {
      if (!user?.id) {
        throw new Error('User not authenticated')
      }

      const { data, error } = await supabase
        .rpc('can_refresh_ai_content', {
          user_uuid: user.id,
          p_feature_type: 'daily_review'
        })

      if (error) {
        console.error('Error checking refresh capability:', error)
        throw error
      }

      if (!data || data.length === 0) {
        return {
          has_initial_review: false,
          refreshes_used: 0,
          refreshes_remaining: 0,
          refresh_limit: 0,
          can_refresh: false
        }
      }

      const usageData = data[0]
      return {
        has_initial_review: usageData.has_initial_content || false,
        refreshes_used: usageData.refreshes_used || 0,
        refreshes_remaining: usageData.refreshes_remaining || 0,
        refresh_limit: usageData.refresh_limit || 0,
        can_refresh: usageData.can_refresh || false
      }
    },
    enabled: !!user?.id && hasAIFeatures(),
    staleTime: 1000 * 30, // 30 seconds
  })

  // Generate daily review mutation
  const generateReviewMutation = useMutation({
    mutationFn: async ({ userGuidance }: { userGuidance?: string } = {}): Promise<DailyReviewData> => {
      if (!user?.id) {
        throw new Error('User not authenticated')
      }

      if (!hasAIFeatures()) {
        throw new Error('AI features require Pro subscription')
      }

      const { data, error } = await supabase.functions.invoke('ai-daily-review', {
        body: { 
          user_id: user.id,
          date: targetDate,
          is_refresh: false,
          user_guidance: userGuidance
        }
      })

      if (error) {
        console.error('Daily review generation error:', error)
        
        if (error.message?.includes('limit exceeded')) {
          throw new Error('Daily review limit exceeded. Please upgrade to Pro or wait until tomorrow.')
        }
        
        throw new Error(error.message || 'Failed to generate daily review')
      }

      if (data.error) {
        throw new Error(data.error)
      }

      return data
    },
    onSuccess: (data) => {
      setLastReviewData(data)
      // Refetch both review and usage data
      refetchReview()
      refetchUsage()
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['daily-review', user?.id] })
      queryClient.invalidateQueries({ queryKey: ['daily-review-usage', user?.id] })
    },
  })

  // Refresh daily review mutation
  const refreshReviewMutation = useMutation({
    mutationFn: async ({ userGuidance }: { userGuidance?: string } = {}): Promise<DailyReviewData> => {
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

      const { data, error } = await supabase.functions.invoke('ai-daily-review', {
        body: { 
          user_id: user.id,
          date: targetDate,
          is_refresh: true,
          user_guidance: userGuidance,
          previous_response_id: dailyReview?.review_id
        }
      })

      if (error) {
        console.error('Daily review refresh error:', error)
        
        if (error.message?.includes('limit exceeded')) {
          throw new Error('Daily review refresh limit exceeded. Please wait until tomorrow.')
        }
        
        throw new Error(error.message || 'Failed to refresh daily review')
      }

      if (data.error) {
        throw new Error(data.error)
      }

      return data
    },
    onSuccess: (data) => {
      setLastReviewData(data)
      // Refetch both review and usage data
      refetchReview()
      refetchUsage()
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['daily-review', user?.id] })
      queryClient.invalidateQueries({ queryKey: ['daily-review-usage', user?.id] })
    },
  })

  // Helper function to clear last review data
  const clearLastReview = () => {
    setLastReviewData(null)
  }

  return {
    // Data
    dailyReview: lastReviewData || dailyReview,
    usageStats,
    
    // Loading states
    isLoadingReview,
    isLoadingUsage,
    isGenerating: generateReviewMutation.isPending,
    isRefreshing: refreshReviewMutation.isPending,
    
    // Error states
    reviewError,
    generateError: generateReviewMutation.error,
    refreshError: refreshReviewMutation.error,
    
    // Actions
    generateReview: generateReviewMutation.mutate,
    refreshReview: refreshReviewMutation.mutate,
    clearLastReview,
    refetchReview,
    refetchUsage,
    
    // Computed properties
    hasReview: !!(lastReviewData || dailyReview),
    canGenerate: hasAIFeatures() && (!usageStats || !usageStats.has_initial_review),
    canRefresh: hasAIFeatures() && usageStats?.can_refresh,
    refreshesRemaining: usageStats?.refreshes_remaining || 0,
    refreshLimit: usageStats?.refresh_limit || 0,
  }
}
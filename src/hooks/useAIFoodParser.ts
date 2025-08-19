import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { useAuthContext } from '../components/auth/AuthContext'
import { useUserTier } from './useUserTier'

export interface ParsedFoodData {
  food_name: string
  brand?: string
  calories: number
  protein: number
  carbs: number
  fat: number
  fiber?: number
  portion_grams: number
  confidence_score: number
  source: string
  ingredients?: string[]
  suggestions?: string[]
  ingredient_breakdown?: Array<{
    name: string
    amount: string
    grams: number
    calories: number
    protein: number
    carbs: number
    fat: number
    usda_verified?: boolean
    usda_food_name?: string
  }>
  notes?: string
  reasoning?: string
  cached?: boolean
  processing_time_ms?: number
  validation_error?: string
  tokens_used?: number
  error?: string
  usda_validation?: {
    validated_ingredients: number
    total_ingredients: number
    validation_percentage: number
  }
}

export interface AIUsageStats {
  ai_enabled: boolean
  tier: string
  requests_used: number
  requests_remaining: number
  requests_limit: number
  reset_date: string
  daily_usage?: Array<{
    date: string
    count: number
    types: string[]
  }>
}

export function useAIFoodParser() {
  const { user } = useAuthContext()
  const { hasAIFeatures } = useUserTier()
  const queryClient = useQueryClient()
  const [lastParsedFood, setLastParsedFood] = useState<ParsedFoodData | null>(null)

  // Get AI usage statistics
  const { 
    data: aiUsageStats, 
    isLoading: isLoadingUsage, 
    error: usageError,
    refetch: refetchUsage 
  } = useQuery({
    queryKey: ['ai-usage-stats', user?.id],
    queryFn: async (): Promise<AIUsageStats> => {
      if (!user?.id) {
        throw new Error('User not authenticated')
      }

      const { data, error } = await supabase.functions.invoke('check-ai-usage', {
        body: { user_id: user.id }
      })

      if (error) {
        console.error('AI usage check error:', error)
        throw new Error(error.message || 'Failed to check AI usage')
      }

      return data
    },
    enabled: !!user?.id && hasAIFeatures(),
    staleTime: 1000 * 60, // 1 minute
    refetchOnWindowFocus: true,
  })

  // Parse food mutation
  const parseFoodMutation = useMutation({
    mutationFn: async ({ input, forceRefresh = false }: { input: string, forceRefresh?: boolean }): Promise<ParsedFoodData> => {
      if (!user?.id) {
        throw new Error('User not authenticated')
      }

      if (!hasAIFeatures()) {
        throw new Error('AI features require Pro subscription')
      }

      if (!input?.trim()) {
        throw new Error('Please enter a food description')
      }

      // Check if user has remaining requests (only for non-cache requests)
      if (!forceRefresh && aiUsageStats && aiUsageStats.requests_remaining <= 0) {
        throw new Error(`AI request limit reached. You have used all ${aiUsageStats.requests_limit} requests for this month. Limit resets on ${aiUsageStats.reset_date}.`)
      }

      const { data, error } = await supabase.functions.invoke('parse-food-ingredients', {
        body: { 
          query: input.trim(),
          user_id: user.id,
          force_refresh: forceRefresh
        }
      })

      if (error) {
        console.error('Food parsing error:', error)
        
        // Handle specific error types
        if (error.message?.includes('limit exceeded')) {
          throw new Error('AI request limit exceeded. Please upgrade to Pro or wait for next month.')
        }
        
        throw new Error(error.message || 'Failed to parse food description')
      }

      return data
    },
    onSuccess: (data) => {
      setLastParsedFood(data)
      
      // Invalidate usage stats to get updated counts
      queryClient.invalidateQueries({ queryKey: ['ai-usage-stats', user?.id] })
      
      // Also refetch usage stats immediately for UI updates
      refetchUsage()
    },
    onError: (error) => {
      console.error('Parse food mutation error:', error)
    }
  })

  // Helper function to check if user can make AI request
  const canMakeRequest = (): boolean => {
    if (!hasAIFeatures()) return false
    if (!aiUsageStats) return false
    return aiUsageStats.ai_enabled && aiUsageStats.requests_remaining > 0
  }

  // Helper function to get user-friendly error message
  const getUsageStatusMessage = (): string => {
    if (!hasAIFeatures()) {
      return 'AI features require a Pro subscription'
    }
    
    if (!aiUsageStats) {
      return 'Loading AI usage information...'
    }
    
    if (!aiUsageStats.ai_enabled) {
      return 'AI features are not enabled for your account'
    }
    
    if (aiUsageStats.requests_remaining <= 0) {
      return `You've used all ${aiUsageStats.requests_limit} AI requests this month. Limit resets on ${new Date(aiUsageStats.reset_date).toLocaleDateString()}`
    }
    
    return `${aiUsageStats.requests_remaining} AI requests remaining this month`
  }

  // Helper function to convert parsed food to QuickFoodAdd format
  const convertToFoodLogFormat = (parsedFood: ParsedFoodData) => {
    return {
      food_name: parsedFood.food_name,
      brand: parsedFood.brand || '',
      portion_grams: parsedFood.portion_grams,
      calories_consumed: Math.round(parsedFood.calories),
      protein_consumed: Math.round(parsedFood.protein * 10) / 10,
      carbs_consumed: Math.round(parsedFood.carbs * 10) / 10,
      fat_consumed: Math.round(parsedFood.fat * 10) / 10,
      fiber_consumed: parsedFood.fiber ? Math.round(parsedFood.fiber * 10) / 10 : undefined,
      // Include ingredients and notes from AI parsing
      ingredients: parsedFood.ingredient_breakdown || null,
      notes: parsedFood.reasoning || parsedFood.notes || '',
      // Add confidence info as metadata
      ai_parsed: true,
      confidence_score: parsedFood.confidence_score,
      source: parsedFood.source,
      cached: parsedFood.cached || false
    }
  }

  return {
    // Core functions
    parseFood: (input: string, forceRefresh = false) => parseFoodMutation.mutate({ input, forceRefresh }),
    parseFoodAsync: (input: string, forceRefresh = false) => parseFoodMutation.mutateAsync({ input, forceRefresh }),
    
    // State
    isParsingFood: parseFoodMutation.isPending,
    parseError: parseFoodMutation.error,
    lastParsedFood,
    
    // Usage stats
    aiUsageStats,
    isLoadingUsage,
    usageError,
    refetchUsage,
    
    // Helper functions
    canMakeRequest: canMakeRequest(),
    hasAIFeatures: hasAIFeatures(),
    getUsageStatusMessage,
    convertToFoodLogFormat,
    
    // Quick access to key stats
    requestsRemaining: aiUsageStats?.requests_remaining ?? 0,
    requestsLimit: aiUsageStats?.requests_limit ?? 0,
    tier: aiUsageStats?.tier ?? 'free',
    
    // Reset function for clearing last parsed food
    clearLastParsed: () => setLastParsedFood(null)
  }
}
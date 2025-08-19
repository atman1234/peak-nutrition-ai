import { useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { useAuthContext } from '../components/auth/AuthContext'

export type UserTier = 'free' | 'pro'

export interface TierLimits {
  tier: UserTier
  max_favorites: number
  max_weight_entries_per_month: number
  max_food_logs_per_day: number
  ai_features_enabled: boolean
  ai_food_search_monthly: number
  ai_daily_review_per_day: number
  ai_daily_review_refreshes_per_day: number
  ai_dashboard_advice_per_day: number
  ai_dashboard_advice_refreshes_per_day: number
}

const DEFAULT_TIER_LIMITS: Record<UserTier, TierLimits> = {
  free: {
    tier: 'free',
    max_favorites: 10,
    max_weight_entries_per_month: 31,
    max_food_logs_per_day: 50,
    ai_features_enabled: true,
    ai_food_search_monthly: 10,
    ai_daily_review_per_day: 1,
    ai_daily_review_refreshes_per_day: 0,
    ai_dashboard_advice_per_day: 1,
    ai_dashboard_advice_refreshes_per_day: 0,
  },
  pro: {
    tier: 'pro',
    max_favorites: 20,
    max_weight_entries_per_month: 100,
    max_food_logs_per_day: 200,
    ai_features_enabled: true,
    ai_food_search_monthly: 100,
    ai_daily_review_per_day: 1,
    ai_daily_review_refreshes_per_day: 5,
    ai_dashboard_advice_per_day: 1,
    ai_dashboard_advice_refreshes_per_day: 5,
  },
}

export function useUserTier() {
  const { user } = useAuthContext()
  const queryClient = useQueryClient()

  // Fetch user tier and limits
  const {
    data: tierLimits,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['userTier', user?.id],
    queryFn: async (): Promise<TierLimits> => {
      if (!user?.id) {
        console.log('No user ID, returning free tier')
        return DEFAULT_TIER_LIMITS.free
      }

      try {
        console.log('Fetching user tier for user:', user.id)
        
        // First try to get from the helper function
        const { data: limits, error: limitsError } = await supabase
          .rpc('get_user_tier_limits', { user_uuid: user.id })
          .single()

        if (!limitsError && limits) {
          console.log('Got tier limits from RPC:', limits)
          return limits as TierLimits
        }

        console.log('RPC failed, trying fallback:', limitsError)

        // Fallback: get user tier from profile and use default limits
        const { data: profile, error: profileError } = await supabase
          .from('user_profiles')
          .select('user_tier')
          .eq('id', user.id)
          .single()

        if (profileError) {
          console.error('Profile fetch error:', profileError)
          throw profileError
        }

        const userTier = (profile?.user_tier as UserTier) || 'free'
        console.log('Got user tier from profile:', userTier)
        return DEFAULT_TIER_LIMITS[userTier]
      } catch (err) {
        console.warn('Failed to fetch user tier, defaulting to free:', err)
        return DEFAULT_TIER_LIMITS.free
      }
    },
    enabled: !!user?.id,
    staleTime: 1000, // Consider data stale after 1 second
    refetchOnMount: 'always', // Always refetch on mount
    refetchOnWindowFocus: true, // Refetch when window gains focus
  })

  // Function to manually refresh tier data
  const refreshTier = () => {
    return refetch()
  }

  // Function to invalidate cache (useful after payments)
  const invalidateTierCache = () => {
    queryClient.invalidateQueries({ queryKey: ['userTier', user?.id] })
  }

  // Helper functions
  const isFree = tierLimits?.tier === 'free'
  const isPro = tierLimits?.tier === 'pro'
  
  const canAddFavorite = (currentCount: number) => {
    return currentCount < (tierLimits?.max_favorites || DEFAULT_TIER_LIMITS.free.max_favorites)
  }

  const getFavoritesLimit = () => {
    return tierLimits?.max_favorites || DEFAULT_TIER_LIMITS.free.max_favorites
  }

  const getFavoritesRemaining = (currentCount: number) => {
    const limit = getFavoritesLimit()
    return Math.max(0, limit - currentCount)
  }

  const hasAIFeatures = () => {
    return tierLimits?.ai_features_enabled || false
  }

  const getAIRequestsLimit = () => {
    return tierLimits?.ai_food_search_monthly || 0
  }

  return {
    tierLimits: tierLimits || DEFAULT_TIER_LIMITS.free,
    isLoading,
    error,
    isFree,
    isPro,
    canAddFavorite,
    getFavoritesLimit,
    getFavoritesRemaining,
    hasAIFeatures,
    getAIRequestsLimit,
    refreshTier,
    invalidateTierCache,
  }
}
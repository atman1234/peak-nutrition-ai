import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { useAuthContext } from '../components/auth/AuthContext'

interface PortionHistoryData {
  food_item_id: string
  food_name: string
  avg_portion: number
  most_common_portion: number
  recent_avg_portion: number // Last 30 days weighted
  frequency: number
  last_used: string
}

interface PortionSuggestion {
  suggested_portion: number
  confidence: 'high' | 'medium' | 'low'
  reason: string
}

export function usePortionHistory() {
  const { user } = useAuthContext()

  // Fetch portion history data for the user
  const {
    data: portionHistory = [],
    isLoading,
    error
  } = useQuery({
    queryKey: ['portionHistory', user?.id],
    queryFn: async (): Promise<PortionHistoryData[]> => {
      if (!user?.id) return []

      const { data, error } = await supabase
        .from('food_logs')
        .select(`
          food_item_id,
          food_name,
          portion_grams,
          logged_at
        `)
        .eq('user_id', user.id)
        .not('food_item_id', 'is', null)
        .order('logged_at', { ascending: false })
        .limit(1000) // Last 1000 entries should be sufficient

      if (error) throw error

      // Process the data to create portion statistics
      const portionStats = new Map<string, {
        food_item_id: string
        food_name: string
        portions: number[]
        recent_portions: number[] // Last 30 days
        last_used: string
      }>()

      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

      data?.forEach(log => {
        if (!log.food_item_id || !log.portion_grams) return

        const key = log.food_item_id
        const logDate = new Date(log.logged_at)
        
        if (!portionStats.has(key)) {
          portionStats.set(key, {
            food_item_id: log.food_item_id,
            food_name: log.food_name,
            portions: [],
            recent_portions: [],
            last_used: log.logged_at
          })
        }

        const stats = portionStats.get(key)!
        stats.portions.push(log.portion_grams)
        
        if (logDate > thirtyDaysAgo) {
          stats.recent_portions.push(log.portion_grams)
        }

        // Update last used if this is more recent
        if (new Date(log.logged_at) > new Date(stats.last_used)) {
          stats.last_used = log.logged_at
        }
      })

      // Convert to final format with calculated statistics
      return Array.from(portionStats.values()).map(stats => {
        const portions = stats.portions.sort((a, b) => a - b)
        const recentPortions = stats.recent_portions.sort((a, b) => a - b)
        
        // Calculate average portion
        const avgPortion = portions.reduce((sum, p) => sum + p, 0) / portions.length
        
        // Calculate most common portion (mode)
        const portionCounts = new Map<number, number>()
        portions.forEach(p => {
          // Round to nearest 5g for grouping similar portions
          const rounded = Math.round(p / 5) * 5
          portionCounts.set(rounded, (portionCounts.get(rounded) || 0) + 1)
        })
        const mostCommonPortion = Array.from(portionCounts.entries())
          .sort((a, b) => b[1] - a[1])[0]?.[0] || avgPortion

        // Calculate recent average (last 30 days) with higher weight
        const recentAvgPortion = recentPortions.length > 0
          ? recentPortions.reduce((sum, p) => sum + p, 0) / recentPortions.length
          : avgPortion

        return {
          food_item_id: stats.food_item_id,
          food_name: stats.food_name,
          avg_portion: Math.round(avgPortion),
          most_common_portion: Math.round(mostCommonPortion),
          recent_avg_portion: Math.round(recentAvgPortion),
          frequency: portions.length,
          last_used: stats.last_used
        }
      }).sort((a, b) => b.frequency - a.frequency) // Sort by frequency
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  })

  // Function to get smart portion suggestion for a specific food
  const getPortionSuggestion = (foodItemId: string, foodName?: string): PortionSuggestion => {
    if (!foodItemId) {
      return {
        suggested_portion: 100,
        confidence: 'low',
        reason: 'Default portion (no food selected)'
      }
    }

    const history = portionHistory.find(h => h.food_item_id === foodItemId)
    
    if (!history) {
      // No history for this specific food, try to find similar foods by name
      if (foodName) {
        const similarFoods = portionHistory.filter(h => 
          h.food_name.toLowerCase().includes(foodName.toLowerCase().split(' ')[0]) ||
          foodName.toLowerCase().includes(h.food_name.toLowerCase().split(' ')[0])
        )
        
        if (similarFoods.length > 0) {
          const avgSimilarPortion = Math.round(
            similarFoods.reduce((sum, f) => sum + f.recent_avg_portion, 0) / similarFoods.length
          )
          return {
            suggested_portion: avgSimilarPortion,
            confidence: 'medium',
            reason: `Based on similar foods (${similarFoods.length} matches)`
          }
        }
      }
      
      return {
        suggested_portion: 100,
        confidence: 'low',
        reason: 'Default portion (no history available)'
      }
    }

    // We have history for this food
    let suggestedPortion: number
    let confidence: 'high' | 'medium' | 'low'
    let reason: string

    if (history.frequency >= 5) {
      // High confidence: lots of data, use recent average
      suggestedPortion = history.recent_avg_portion
      confidence = 'high'
      reason = `Your usual portion (${history.frequency} times)`
    } else if (history.frequency >= 2) {
      // Medium confidence: some data, blend recent and overall average
      suggestedPortion = Math.round((history.recent_avg_portion + history.avg_portion) / 2)
      confidence = 'medium' 
      reason = `Based on previous ${history.frequency} servings`
    } else {
      // Low confidence: limited data, use the one portion we have
      suggestedPortion = history.most_common_portion
      confidence = 'low'
      reason = 'Based on your last serving'
    }

    // Ensure reasonable bounds (25g to 500g)
    suggestedPortion = Math.max(25, Math.min(500, suggestedPortion))

    return {
      suggested_portion: suggestedPortion,
      confidence,
      reason
    }
  }

  // Function to get typical portion for favorites integration
  const getTypicalPortion = (foodItemId: string): number => {
    const suggestion = getPortionSuggestion(foodItemId)
    return suggestion.suggested_portion
  }

  // Function to check if we have good portion data for a food
  const hasGoodPortionData = (foodItemId: string): boolean => {
    const history = portionHistory.find(h => h.food_item_id === foodItemId)
    return !!(history && history.frequency >= 2)
  }

  return {
    portionHistory,
    isLoading,
    error,
    getPortionSuggestion,
    getTypicalPortion,
    hasGoodPortionData,
  }
}
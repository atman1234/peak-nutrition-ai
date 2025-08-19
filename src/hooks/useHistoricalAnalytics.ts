/**
 * Main hook for fetching and processing historical analytics data
 */

import { useQuery } from '@tanstack/react-query'
import { useMemo } from 'react'
import { supabase } from '../lib/supabase'
import { useAuthContext } from '../components/auth/AuthContext'
import { useProfile } from './useProfile'
import { getLocalDateRangeForQuery } from '../lib/date-utils'
import {
  calculateDailyGoalAchievement,
  calculateStreakData,
  calculateConsistencyScore,
  getDateRangeForPeriod,
  formatGoalAchievementChartData,
  formatMacroTrendsChartData,
  formatHeatmapData,
  generateInsights
} from '../lib/historical-analytics'
import type {
  HistoricalMetrics,
  HistoricalAnalyticsConfig,
  TimePeriod,
  DailyGoalAchievement
} from '../types/historical-analytics'
import type { Database } from '../types/supabase'

type FoodLog = Database['public']['Tables']['food_logs']['Row']

export function useHistoricalAnalytics(config: HistoricalAnalyticsConfig) {
  const { user } = useAuthContext()
  const { profile } = useProfile()

  // Determine date range
  const dateRange = useMemo(() => {
    if (config.timePeriod === 'custom' && config.customDateRange) {
      return config.customDateRange
    }
    return getDateRangeForPeriod(config.timePeriod)
  }, [config.timePeriod, config.customDateRange])

  // Fetch food logs for the date range
  const {
    data: foodLogs = [],
    isLoading: isLoadingFoodLogs,
    error: foodLogsError
  } = useQuery({
    queryKey: ['historicalFoodLogs', user?.id, dateRange.start, dateRange.end],
    queryFn: async (): Promise<FoodLog[]> => {
      if (!user?.id) return []

      // Convert local date range to UTC timestamp range for querying
      const { start: startUTC } = getLocalDateRangeForQuery(dateRange.start)
      const { start: endRangeUTC } = getLocalDateRangeForQuery(dateRange.end)

      const { data, error } = await supabase
        .from('food_logs')
        .select('*')
        .eq('user_id', user.id)
        .gte('logged_at', startUTC)
        .lte('logged_at', endRangeUTC)
        .order('logged_at', { ascending: true })

      if (error) throw error
      return data || []
    },
    enabled: !!user?.id && !!profile,
    staleTime: 1000 * 60 * 5, // 5 minutes
  })

  // Process historical data
  const historicalMetrics = useMemo((): HistoricalMetrics | null => {
    if (!profile || foodLogs.length === 0) return null

    // Generate all dates in the range
    const dates: string[] = []
    const start = new Date(dateRange.start)
    const end = new Date(dateRange.end)
    
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      dates.push(d.toISOString().split('T')[0])
    }

    // Filter out food logs with null logged_at dates and calculate daily goal achievements
    const validFoodLogs = foodLogs.filter(log => log.logged_at !== null) as Array<Omit<FoodLog, 'logged_at'> & { logged_at: string }>
    const dailyGoals: DailyGoalAchievement[] = dates.map(date =>
      calculateDailyGoalAchievement(date, validFoodLogs, profile)
    )

    // Calculate streaks for each goal type
    const streaks = config.goalTypes.map(goalType =>
      calculateStreakData(goalType, dailyGoals)
    )

    // Calculate consistency scores
    const consistency = config.goalTypes.map(goalType =>
      calculateConsistencyScore(goalType, dailyGoals, config.timePeriod)
    )

    // Generate insights
    const insights = generateInsights(streaks, consistency, dailyGoals)

    return {
      dateRange,
      timePeriod: config.timePeriod,
      dailyGoals,
      streaks: config.includeStreaks ? streaks : [],
      consistency: config.includeConsistency ? consistency : [],
      trends: [], // TODO: Implement trend analysis
      comparisons: [], // TODO: Implement period comparisons
      insights
    }
  }, [foodLogs, profile, dateRange, config])

  // Chart data formatters
  const chartData = useMemo(() => {
    if (!historicalMetrics) return null

    return {
      goalAchievement: formatGoalAchievementChartData(historicalMetrics.dailyGoals),
      macroTrends: formatMacroTrendsChartData(historicalMetrics.dailyGoals),
      heatmap: formatHeatmapData(historicalMetrics.dailyGoals)
    }
  }, [historicalMetrics])

  // Summary statistics
  const summary = useMemo(() => {
    if (!historicalMetrics) return null

    const { dailyGoals } = historicalMetrics
    const totalDays = dailyGoals.length
    const daysWithData = dailyGoals.filter(day => 
      day.calories.actual > 0 || day.protein.actual > 0 || day.carbs.actual > 0 || day.fat.actual > 0
    ).length

    const averageOverallScore = totalDays > 0
      ? dailyGoals.reduce((sum, day) => sum + day.overallScore, 0) / totalDays
      : 0

    const bestDay = dailyGoals.reduce((best, current) =>
      current.overallScore > best.overallScore ? current : best
    )

    const averageCalories = daysWithData > 0
      ? dailyGoals.reduce((sum, day) => sum + day.calories.actual, 0) / daysWithData
      : 0

    return {
      totalDays,
      daysWithData,
      averageOverallScore: Math.round(averageOverallScore),
      bestDay,
      averageCalories: Math.round(averageCalories),
      dataCompleteness: totalDays > 0 ? Math.round((daysWithData / totalDays) * 100) : 0
    }
  }, [historicalMetrics])

  const isLoading = isLoadingFoodLogs
  const error = foodLogsError

  return {
    historicalMetrics,
    chartData,
    summary,
    foodLogs, // Add raw food logs for chart components
    isLoading,
    error,
    dateRange
  }
}

/**
 * Specialized hook for goal achievement analytics
 */
export function useGoalAchievement(timePeriod: TimePeriod = '30d') {
  const config: HistoricalAnalyticsConfig = {
    timePeriod,
    includeStreaks: true,
    includeConsistency: true,
    includeTrends: false,
    includeComparisons: false,
    goalTypes: ['calories', 'protein', 'carbs', 'fat']
  }

  const { historicalMetrics, chartData, summary, isLoading, error } = useHistoricalAnalytics(config)

  const goalAchievementData = useMemo(() => {
    if (!historicalMetrics || !chartData) return null

    const { streaks, consistency } = historicalMetrics
    
    return {
      chartData: chartData.goalAchievement,
      streaks,
      consistency,
      summary
    }
  }, [historicalMetrics, chartData, summary])

  return {
    goalAchievementData,
    isLoading,
    error
  }
}

/**
 * Hook for time period utilities
 */
export function useTimePeriodUtils() {
  const getTimePeriodLabel = (period: TimePeriod): string => {
    switch (period) {
      case '7d': return 'Last 7 days'
      case '30d': return 'Last 30 days'
      case '90d': return 'Last 90 days'
      case '6m': return 'Last 6 months'
      case '1y': return 'Last year'
      case 'custom': return 'Custom range'
      default: return 'Unknown period'
    }
  }

  const getTimePeriodOptions = (): Array<{ value: TimePeriod; label: string }> => [
    { value: '7d', label: 'Last 7 days' },
    { value: '30d', label: 'Last 30 days' },
    { value: '90d', label: 'Last 90 days' },
    { value: '6m', label: 'Last 6 months' },
    { value: '1y', label: 'Last year' }
  ]

  return {
    getTimePeriodLabel,
    getTimePeriodOptions
  }
}
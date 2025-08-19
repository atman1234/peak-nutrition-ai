/**
 * TypeScript interfaces for historical analytics data structures
 */

export type TimePeriod = '7d' | '30d' | '90d' | '6m' | '1y' | 'custom'

export type MacroType = 'protein' | 'carbs' | 'fat'

export type GoalType = 'calories' | 'protein' | 'carbs' | 'fat'

export interface DateRange {
  start: string // YYYY-MM-DD format
  end: string   // YYYY-MM-DD format
}

/**
 * Daily goal achievement data
 */
export interface DailyGoalAchievement {
  date: string // YYYY-MM-DD format
  calories: {
    target: number
    actual: number
    percentage: number
    achieved: boolean
  }
  protein: {
    target: number
    actual: number
    percentage: number
    achieved: boolean
  }
  carbs: {
    target: number
    actual: number
    percentage: number
    achieved: boolean
  }
  fat: {
    target: number
    actual: number
    percentage: number
    achieved: boolean
  }
  overallScore: number // 0-100, percentage of goals achieved
}

/**
 * Streak tracking data
 */
export interface StreakData {
  goalType: GoalType
  currentStreak: number
  longestStreak: number
  lastAchievedDate: string | null
  streakHistory: Array<{
    startDate: string
    endDate: string
    length: number
  }>
}

/**
 * Consistency scoring metrics
 */
export interface ConsistencyScore {
  goalType: GoalType
  period: TimePeriod
  score: number // 0-100
  totalDays: number
  achievedDays: number
  averagePercentage: number
  standardDeviation: number
  trend: 'improving' | 'declining' | 'stable'
}

/**
 * Trend analysis data
 */
export interface TrendAnalysis {
  metric: string
  direction: 'up' | 'down' | 'stable'
  strength: 'weak' | 'moderate' | 'strong'
  changePercentage: number
  movingAverage: number[]
  confidence: number // 0-100
}

/**
 * Period comparison data
 */
export interface ComparativeData {
  metric: string
  currentPeriod: {
    label: string
    value: number
    dateRange: DateRange
  }
  previousPeriod: {
    label: string
    value: number
    dateRange: DateRange
  }
  change: {
    absolute: number
    percentage: number
    isImprovement: boolean
  }
}

/**
 * Aggregated historical metrics
 */
export interface HistoricalMetrics {
  dateRange: DateRange
  timePeriod: TimePeriod
  dailyGoals: DailyGoalAchievement[]
  streaks: StreakData[]
  consistency: ConsistencyScore[]
  trends: TrendAnalysis[]
  comparisons: ComparativeData[]
  insights: string[]
}

/**
 * Chart data formats
 */
export interface GoalAchievementChartData {
  date: string
  calories: number
  protein: number
  carbs: number
  fat: number
  overall: number
}

export interface MacroTrendsChartData {
  date: string
  proteinTarget: number
  proteinActual: number
  carbsTarget: number
  carbsActual: number
  fatTarget: number
  fatActual: number
}

export interface HeatmapData {
  date: string
  value: number // 0-100 achievement percentage
  level: 0 | 1 | 2 | 3 | 4 // Color intensity level
}

/**
 * Configuration for historical analytics queries
 */
export interface HistoricalAnalyticsConfig {
  timePeriod: TimePeriod
  customDateRange?: DateRange
  includeStreaks: boolean
  includeConsistency: boolean
  includeTrends: boolean
  includeComparisons: boolean
  goalTypes: GoalType[]
}

/**
 * Response format for historical analytics API
 */
export interface HistoricalAnalyticsResponse {
  success: boolean
  data: HistoricalMetrics | null
  error?: string
  processingTime?: number
  cacheHit?: boolean
}
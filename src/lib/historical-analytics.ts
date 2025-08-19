/**
 * Core calculation functions for historical analytics
 */

import { 
  DailyGoalAchievement, 
  StreakData, 
  ConsistencyScore, 
  TrendAnalysis, 
  DateRange,
  TimePeriod,
  GoalType,
  GoalAchievementChartData,
  MacroTrendsChartData,
  HeatmapData
} from '../types/historical-analytics'
import { getLocalDateFromUTC, getTodayLocalDate } from './date-utils'

type FoodLog = {
  id: string
  logged_at: string
  calories_consumed: number | null
  protein_consumed: number | null
  carbs_consumed: number | null
  fat_consumed: number | null
}

type UserProfile = {
  daily_calorie_target: number | null
  protein_target_g: number | null
  carb_target_g: number | null
  fat_target_g: number | null
}

/**
 * Calculate daily goal achievement for a specific date
 */
export function calculateDailyGoalAchievement(
  date: string,
  foodLogs: FoodLog[],
  profile: UserProfile
): DailyGoalAchievement {
  // Filter logs for the specific date
  const dayLogs = foodLogs.filter(log => {
    const logDate = getLocalDateFromUTC(log.logged_at)
    return logDate === date
  })

  // Calculate totals for the day
  const totals = dayLogs.reduce((acc, log) => ({
    calories: acc.calories + (log.calories_consumed || 0),
    protein: acc.protein + (log.protein_consumed || 0),
    carbs: acc.carbs + (log.carbs_consumed || 0),
    fat: acc.fat + (log.fat_consumed || 0),
  }), { calories: 0, protein: 0, carbs: 0, fat: 0 })

  // Calculate achievement percentages
  const caloriesAchievement = {
    target: profile.daily_calorie_target || 0,
    actual: totals.calories,
    percentage: profile.daily_calorie_target ? (totals.calories / profile.daily_calorie_target) * 100 : 0,
    achieved: profile.daily_calorie_target ? totals.calories >= profile.daily_calorie_target * 0.9 : false
  }

  const proteinAchievement = {
    target: profile.protein_target_g || 0,
    actual: totals.protein,
    percentage: profile.protein_target_g ? (totals.protein / profile.protein_target_g) * 100 : 0,
    achieved: profile.protein_target_g ? totals.protein >= profile.protein_target_g * 0.9 : false
  }

  const carbsAchievement = {
    target: profile.carb_target_g || 0,
    actual: totals.carbs,
    percentage: profile.carb_target_g ? (totals.carbs / profile.carb_target_g) * 100 : 0,
    achieved: profile.carb_target_g ? totals.carbs >= profile.carb_target_g * 0.9 : false
  }

  const fatAchievement = {
    target: profile.fat_target_g || 0,
    actual: totals.fat,
    percentage: profile.fat_target_g ? (totals.fat / profile.fat_target_g) * 100 : 0,
    achieved: profile.fat_target_g ? totals.fat >= profile.fat_target_g * 0.9 : false
  }

  // Calculate overall score
  const achievements = [caloriesAchievement, proteinAchievement, carbsAchievement, fatAchievement]
  const achievedGoals = achievements.filter(a => a.achieved).length
  const totalGoals = achievements.filter(a => a.target > 0).length
  const overallScore = totalGoals > 0 ? (achievedGoals / totalGoals) * 100 : 0

  return {
    date,
    calories: caloriesAchievement,
    protein: proteinAchievement,
    carbs: carbsAchievement,
    fat: fatAchievement,
    overallScore
  }
}

/**
 * Calculate streak data for a specific goal type
 */
export function calculateStreakData(
  goalType: GoalType,
  dailyAchievements: DailyGoalAchievement[]
): StreakData {
  const sortedAchievements = [...dailyAchievements].sort((a, b) => 
    new Date(a.date).getTime() - new Date(b.date).getTime()
  )

  let currentStreak = 0
  let longestStreak = 0
  let lastAchievedDate: string | null = null
  const streakHistory: Array<{ startDate: string; endDate: string; length: number }> = []

  let streakStart: string | null = null
  let streakLength = 0

  for (const achievement of sortedAchievements) {
    const isAchieved = achievement[goalType].achieved

    if (isAchieved) {
      lastAchievedDate = achievement.date
      
      if (streakStart === null) {
        streakStart = achievement.date
        streakLength = 1
      } else {
        streakLength++
      }
    } else {
      if (streakStart !== null && streakLength > 0) {
        // End of streak
        const lastDate = sortedAchievements[sortedAchievements.indexOf(achievement) - 1]?.date || streakStart
        streakHistory.push({
          startDate: streakStart,
          endDate: lastDate,
          length: streakLength
        })
        
        if (streakLength > longestStreak) {
          longestStreak = streakLength
        }
        
        streakStart = null
        streakLength = 0
      }
    }
  }

  // Handle ongoing streak
  if (streakStart !== null && streakLength > 0) {
    const lastDate = sortedAchievements[sortedAchievements.length - 1]?.date || streakStart
    streakHistory.push({
      startDate: streakStart,
      endDate: lastDate,
      length: streakLength
    })
    
    if (streakLength > longestStreak) {
      longestStreak = streakLength
    }
    
    currentStreak = streakLength
  }

  return {
    goalType,
    currentStreak,
    longestStreak,
    lastAchievedDate,
    streakHistory
  }
}

/**
 * Calculate consistency score for a goal type over a time period
 */
export function calculateConsistencyScore(
  goalType: GoalType,
  dailyAchievements: DailyGoalAchievement[],
  timePeriod: TimePeriod
): ConsistencyScore {
  const achievements = dailyAchievements.filter(a => a[goalType].target > 0)
  const totalDays = achievements.length
  const achievedDays = achievements.filter(a => a[goalType].achieved).length
  
  const percentages = achievements.map(a => a[goalType].percentage)
  const averagePercentage = percentages.length > 0 
    ? percentages.reduce((sum, p) => sum + p, 0) / percentages.length 
    : 0

  // Calculate standard deviation
  const variance = percentages.length > 0
    ? percentages.reduce((sum, p) => sum + Math.pow(p - averagePercentage, 2), 0) / percentages.length
    : 0
  const standardDeviation = Math.sqrt(variance)

  // Calculate score (0-100)
  const achievementRate = totalDays > 0 ? (achievedDays / totalDays) * 100 : 0
  const consistencyFactor = Math.max(0, 100 - standardDeviation) // Lower deviation = higher consistency
  const score = (achievementRate * 0.7) + (consistencyFactor * 0.3)

  // Determine trend (simple implementation - could be enhanced)
  const recentDays = achievements.slice(-7)
  const olderDays = achievements.slice(-14, -7)
  const recentRate = recentDays.length > 0 ? (recentDays.filter(a => a[goalType].achieved).length / recentDays.length) : 0
  const olderRate = olderDays.length > 0 ? (olderDays.filter(a => a[goalType].achieved).length / olderDays.length) : 0
  
  let trend: 'improving' | 'declining' | 'stable' = 'stable'
  if (recentRate > olderRate + 0.1) trend = 'improving'
  else if (recentRate < olderRate - 0.1) trend = 'declining'

  return {
    goalType,
    period: timePeriod,
    score,
    totalDays,
    achievedDays,
    averagePercentage,
    standardDeviation,
    trend
  }
}

/**
 * Generate date range for a given time period
 */
export function getDateRangeForPeriod(timePeriod: TimePeriod): DateRange {
  const today = new Date()
  const end = getTodayLocalDate()
  
  let start: string
  
  switch (timePeriod) {
    case '7d':
      start = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      break
    case '30d':
      start = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      break
    case '90d':
      start = new Date(today.getTime() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      break
    case '6m':
      const sixMonthsAgo = new Date(today)
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)
      start = sixMonthsAgo.toISOString().split('T')[0]
      break
    case '1y':
      const oneYearAgo = new Date(today)
      oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1)
      start = oneYearAgo.toISOString().split('T')[0]
      break
    default:
      start = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  }

  return { start, end }
}

/**
 * Convert daily achievements to chart data format
 */
export function formatGoalAchievementChartData(
  dailyAchievements: DailyGoalAchievement[]
): GoalAchievementChartData[] {
  return dailyAchievements.map(day => ({
    date: day.date,
    calories: Math.round(day.calories.percentage),
    protein: Math.round(day.protein.percentage),
    carbs: Math.round(day.carbs.percentage),
    fat: Math.round(day.fat.percentage),
    overall: Math.round(day.overallScore)
  }))
}

/**
 * Convert daily achievements to macro trends chart data
 */
export function formatMacroTrendsChartData(
  dailyAchievements: DailyGoalAchievement[]
): MacroTrendsChartData[] {
  return dailyAchievements.map(day => ({
    date: day.date,
    proteinTarget: day.protein.target,
    proteinActual: day.protein.actual,
    carbsTarget: day.carbs.target,
    carbsActual: day.carbs.actual,
    fatTarget: day.fat.target,
    fatActual: day.fat.actual
  }))
}

/**
 * Convert daily achievements to heatmap data
 */
export function formatHeatmapData(
  dailyAchievements: DailyGoalAchievement[]
): HeatmapData[] {
  return dailyAchievements.map(day => {
    const value = day.overallScore
    let level: 0 | 1 | 2 | 3 | 4
    
    if (value >= 90) level = 4
    else if (value >= 75) level = 3
    else if (value >= 50) level = 2
    else if (value >= 25) level = 1
    else level = 0

    return {
      date: day.date,
      value,
      level
    }
  })
}

/**
 * Analyze patterns in daily achievements
 */
export function analyzePatterns(dailyAchievements: DailyGoalAchievement[]): {
  weekdayPatterns: Record<string, { averageScore: number; bestGoal: string; worstGoal: string }>
  monthlyTrends: { improving: boolean; slope: number }
  seasonalPatterns: Record<string, number>
  problemDays: string[]
  successFactors: string[]
} {
  // Weekday patterns
  const weekdayData: Record<string, DailyGoalAchievement[]> = {
    Sunday: [], Monday: [], Tuesday: [], Wednesday: [], Thursday: [], Friday: [], Saturday: []
  }
  
  dailyAchievements.forEach(day => {
    const dayOfWeek = new Date(day.date).toLocaleDateString('en-US', { weekday: 'long' })
    weekdayData[dayOfWeek].push(day)
  })

  const weekdayPatterns: Record<string, { averageScore: number; bestGoal: string; worstGoal: string }> = {}
  Object.entries(weekdayData).forEach(([day, achievements]) => {
    if (achievements.length === 0) return
    
    const avgScore = achievements.reduce((sum, a) => sum + a.overallScore, 0) / achievements.length
    const goalScores = {
      calories: achievements.reduce((sum, a) => sum + a.calories.percentage, 0) / achievements.length,
      protein: achievements.reduce((sum, a) => sum + a.protein.percentage, 0) / achievements.length,
      carbs: achievements.reduce((sum, a) => sum + a.carbs.percentage, 0) / achievements.length,
      fat: achievements.reduce((sum, a) => sum + a.fat.percentage, 0) / achievements.length
    }
    
    const bestGoal = Object.entries(goalScores).reduce((best, [goal, score]) => 
      score > goalScores[best as keyof typeof goalScores] ? goal : best, 'calories'
    )
    const worstGoal = Object.entries(goalScores).reduce((worst, [goal, score]) => 
      score < goalScores[worst as keyof typeof goalScores] ? goal : worst, 'calories'
    )
    
    weekdayPatterns[day] = { averageScore: avgScore, bestGoal, worstGoal }
  })

  // Monthly trends (simple linear regression)
  const sortedAchievements = [...dailyAchievements].sort((a, b) => 
    new Date(a.date).getTime() - new Date(b.date).getTime()
  )
  
  let monthlyTrends = { improving: false, slope: 0 }
  if (sortedAchievements.length >= 14) {
    const xValues = sortedAchievements.map((_, i) => i)
    const yValues = sortedAchievements.map(a => a.overallScore)
    const n = xValues.length
    
    const sumX = xValues.reduce((sum, x) => sum + x, 0)
    const sumY = yValues.reduce((sum, y) => sum + y, 0)
    const sumXY = xValues.reduce((sum, x, i) => sum + x * yValues[i], 0)
    const sumXX = xValues.reduce((sum, x) => sum + x * x, 0)
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX)
    monthlyTrends = { improving: slope > 0, slope }
  }

  // Seasonal patterns (by month)
  const monthlyData: Record<string, DailyGoalAchievement[]> = {}
  dailyAchievements.forEach(day => {
    const month = new Date(day.date).toLocaleDateString('en-US', { month: 'long' })
    if (!monthlyData[month]) monthlyData[month] = []
    monthlyData[month].push(day)
  })

  const seasonalPatterns: Record<string, number> = {}
  Object.entries(monthlyData).forEach(([month, achievements]) => {
    seasonalPatterns[month] = achievements.length > 0 
      ? achievements.reduce((sum, a) => sum + a.overallScore, 0) / achievements.length
      : 0
  })

  // Problem days (consistently low performance)
  const problemDays = Object.entries(weekdayPatterns)
    .filter(([_, data]) => data.averageScore < 60)
    .map(([day, _]) => day)

  // Success factors
  const successFactors: string[] = []
  const bestWeekday = Object.entries(weekdayPatterns).reduce((best, [day, data]) => 
    data.averageScore > (weekdayPatterns[best[0]]?.averageScore || 0) ? [day, data] : best
  , ['', { averageScore: 0, bestGoal: '', worstGoal: '' }])
  
  if (bestWeekday[1].averageScore > 75) {
    successFactors.push(`${bestWeekday[0]}s are your strongest days`)
  }

  const consistentGoal = Object.entries(weekdayData).reduce((consistent, [_, achievements]) => {
    if (achievements.length === 0) return consistent
    const goalScores = {
      calories: achievements.reduce((sum, a) => sum + (a.calories.achieved ? 1 : 0), 0) / achievements.length,
      protein: achievements.reduce((sum, a) => sum + (a.protein.achieved ? 1 : 0), 0) / achievements.length,
      carbs: achievements.reduce((sum, a) => sum + (a.carbs.achieved ? 1 : 0), 0) / achievements.length,
      fat: achievements.reduce((sum, a) => sum + (a.fat.achieved ? 1 : 0), 0) / achievements.length
    }
    
    Object.entries(goalScores).forEach(([goal, score]) => {
      if (score > 0.8) consistent[goal] = (consistent[goal] || 0) + 1
    })
    
    return consistent
  }, {} as Record<string, number>)

  const mostConsistentGoal = Object.entries(consistentGoal).reduce((best, [goal, count]) => 
    count > (consistentGoal[best] || 0) ? goal : best, ''
  )
  
  if (mostConsistentGoal && consistentGoal[mostConsistentGoal] >= 5) {
    successFactors.push(`${mostConsistentGoal} is your most consistent goal`)
  }

  return {
    weekdayPatterns,
    monthlyTrends,
    seasonalPatterns,
    problemDays,
    successFactors
  }
}

/**
 * Generate automated insights based on historical data and patterns
 */
export function generateInsights(
  streaks: StreakData[],
  consistency: ConsistencyScore[],
  dailyAchievements: DailyGoalAchievement[]
): string[] {
  const insights: string[] = []
  const patterns = analyzePatterns(dailyAchievements)

  // Streak insights
  const bestStreak = streaks.reduce((best, current) => 
    current.longestStreak > best.longestStreak ? current : best
  )
  if (bestStreak.longestStreak > 0) {
    insights.push(`Your longest streak was ${bestStreak.longestStreak} days for ${bestStreak.goalType}!`)
  }

  // Active streaks
  const activeStreaks = streaks.filter(s => s.currentStreak > 0)
  if (activeStreaks.length > 0) {
    const bestActive = activeStreaks.reduce((best, current) => 
      current.currentStreak > best.currentStreak ? current : best
    )
    insights.push(`You're currently on a ${bestActive.currentStreak}-day ${bestActive.goalType} streak! 🔥`)
  }

  // Consistency insights
  const bestConsistency = consistency.reduce((best, current) => 
    current.score > best.score ? current : best
  )
  if (bestConsistency.score > 80) {
    insights.push(`Excellent consistency in ${bestConsistency.goalType} - ${Math.round(bestConsistency.score)}% score!`)
  }

  // Improvement insights
  const improvingGoals = consistency.filter(c => c.trend === 'improving')
  if (improvingGoals.length > 0) {
    insights.push(`You're improving in ${improvingGoals.map(g => g.goalType).join(', ')}. Keep it up!`)
  }

  // Declining goals (needs attention)
  const decliningGoals = consistency.filter(c => c.trend === 'declining')
  if (decliningGoals.length > 0) {
    insights.push(`Consider focusing on ${decliningGoals.map(g => g.goalType).join(', ')} - showing declining trend`)
  }

  // Achievement rate insights
  const recentAchievements = dailyAchievements.slice(-7)
  const achievementRate = recentAchievements.length > 0 
    ? (recentAchievements.filter(a => a.overallScore >= 75).length / recentAchievements.length) * 100
    : 0
    
  if (achievementRate >= 80) {
    insights.push(`Great week! You hit your goals ${Math.round(achievementRate)}% of the time.`)
  } else if (achievementRate < 50) {
    insights.push(`This week was challenging - only ${Math.round(achievementRate)}% goal achievement. Tomorrow is a fresh start!`)
  }

  // Weekly pattern insights
  if (patterns.problemDays.length > 0) {
    insights.push(`${patterns.problemDays.join(' and ')} tend to be challenging days for you`)
  }

  // Success factors
  patterns.successFactors.forEach(factor => {
    insights.push(factor)
  })

  // Monthly trend insights
  if (patterns.monthlyTrends.improving) {
    insights.push(`Your performance is trending upward overall - excellent progress!`)
  } else if (patterns.monthlyTrends.slope < -0.5) {
    insights.push(`Performance has been declining recently - consider reviewing your approach`)
  }

  // Goal-specific insights
  const goalPerformance = ['calories', 'protein', 'carbs', 'fat'].map(goal => {
    const achieved = dailyAchievements.filter(d => {
      const goalData = d[goal as keyof DailyGoalAchievement];
      return typeof goalData === 'object' && goalData !== null && 'achieved' in goalData ? goalData.achieved : false;
    }).length
    const total = dailyAchievements.filter(d => {
      const goalData = d[goal as keyof DailyGoalAchievement];
      return typeof goalData === 'object' && goalData !== null && 'target' in goalData ? goalData.target > 0 : false;
    }).length
    const rate = total > 0 ? (achieved / total) * 100 : 0
    return { goal, rate, achieved, total }
  })

  const bestGoal = goalPerformance.reduce((best, current) => 
    current.rate > best.rate ? current : best
  )
  const worstGoal = goalPerformance.reduce((worst, current) => 
    current.rate < worst.rate ? current : worst
  )

  if (bestGoal.rate > 80) {
    insights.push(`${bestGoal.goal} is your strongest area with ${Math.round(bestGoal.rate)}% achievement`)
  }

  if (worstGoal.rate < 50 && worstGoal.total > 0) {
    insights.push(`${worstGoal.goal} needs attention - only ${Math.round(worstGoal.rate)}% achievement rate`)
  }

  // Limit insights to avoid overwhelming
  return insights.slice(0, 8)
}

/**
 * Calculate advanced trend analysis
 */
export function calculateTrendAnalysis(
  dailyAchievements: DailyGoalAchievement[],
  goalType: GoalType
): TrendAnalysis {
  const sortedAchievements = [...dailyAchievements]
    .filter(a => (a[goalType] as any).target > 0)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

  if (sortedAchievements.length < 7) {
    return {
      metric: goalType,
      direction: 'stable',
      strength: 'weak',
      changePercentage: 0,
      movingAverage: [],
      confidence: 0
    }
  }

  // Calculate moving averages
  const windowSize = Math.min(7, Math.floor(sortedAchievements.length / 3))
  const movingAverages: number[] = []
  
  for (let i = windowSize - 1; i < sortedAchievements.length; i++) {
    const window = sortedAchievements.slice(i - windowSize + 1, i + 1)
    const avg = window.reduce((sum, a) => sum + (a[goalType] as any).percentage, 0) / window.length
    movingAverages.push(avg)
  }

  // Calculate trend using linear regression on moving averages
  const n = movingAverages.length
  const xValues = movingAverages.map((_, i) => i)
  const yValues = movingAverages
  
  const sumX = xValues.reduce((sum, x) => sum + x, 0)
  const sumY = yValues.reduce((sum, y) => sum + y, 0)
  const sumXY = xValues.reduce((sum, x, i) => sum + x * yValues[i], 0)
  const sumXX = xValues.reduce((sum, x) => sum + x * x, 0)
  
  const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX)
  const intercept = (sumY - slope * sumX) / n
  
  // Calculate R-squared for confidence
  const meanY = sumY / n
  const ssRes = yValues.reduce((sum, y, i) => {
    const predicted = slope * i + intercept
    return sum + Math.pow(y - predicted, 2)
  }, 0)
  const ssTot = yValues.reduce((sum, y) => sum + Math.pow(y - meanY, 2), 0)
  const rSquared = ssTot > 0 ? 1 - (ssRes / ssTot) : 0

  // Determine direction and strength
  const direction: 'up' | 'down' | 'stable' = 
    slope > 0.5 ? 'up' : slope < -0.5 ? 'down' : 'stable'
  
  const strengthValue = Math.abs(slope)
  const strength: 'weak' | 'moderate' | 'strong' = 
    strengthValue < 0.5 ? 'weak' : strengthValue < 1.5 ? 'moderate' : 'strong'
  const confidence = Math.max(0, Math.min(100, rSquared * 100))

  // Generate predictions for next 7 days
  const predictions: Array<{ date: string; predicted: number; confidence: number }> = []
  const lastDate = new Date(sortedAchievements[sortedAchievements.length - 1].date)
  
  for (let i = 1; i <= 7; i++) {
    const futureDate = new Date(lastDate)
    futureDate.setDate(lastDate.getDate() + i)
    
    const predicted = slope * (movingAverages.length + i - 1) + intercept
    const predictionConfidence = Math.max(0, confidence - (i * 5)) // Decrease confidence over time
    
    predictions.push({
      date: futureDate.toISOString().split('T')[0],
      predicted: Math.max(0, Math.min(150, predicted)), // Clamp between 0-150%
      confidence: predictionConfidence
    })
  }

  return {
    metric: goalType,
    direction,
    strength,
    changePercentage: strengthValue * 100,
    movingAverage: movingAverages,
    confidence
  }
}
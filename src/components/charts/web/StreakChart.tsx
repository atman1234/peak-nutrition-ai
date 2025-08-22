/**
 * Visual representation of goal achievement streaks
 * Features: Current streaks, longest streaks, streak history
 */

import { useMemo } from 'react'
import { useGoalAchievement } from '@/hooks/useHistoricalAnalytics'
import type { TimePeriod, StreakData, GoalType } from '@/types/historical-analytics'
import { 
  Zap, 
  Trophy, 
  Calendar, 
  TrendingUp,
  Flame,
  Target,
  Award
} from 'lucide-react'

interface StreakChartProps {
  timePeriod?: TimePeriod
  showHistory?: boolean
}

const GOAL_COLORS = {
  calories: 'bg-amber-500',
  protein: 'bg-emerald-500',
  carbs: 'bg-blue-500',
  fat: 'bg-violet-500'
}

const GOAL_ICONS = {
  calories: Zap,
  protein: Target,
  carbs: Calendar,
  fat: Award
}

const GOAL_LABELS = {
  calories: 'Calories',
  protein: 'Protein',
  carbs: 'Carbs',
  fat: 'Fat'
}

export function StreakChart({ timePeriod = '30d', showHistory = true }: StreakChartProps) {
  const { goalAchievementData, isLoading, error } = useGoalAchievement(timePeriod)

  // Sort streaks by current streak length
  const sortedStreaks = useMemo(() => {
    if (!goalAchievementData?.streaks) return []
    
    return [...goalAchievementData.streaks].sort((a, b) => 
      b.currentStreak - a.currentStreak
    )
  }, [goalAchievementData])

  // Find best performing streak
  const bestStreak = useMemo(() => {
    if (!goalAchievementData?.streaks) return null
    
    return goalAchievementData.streaks.reduce((best, current) =>
      current.longestStreak > best.longestStreak ? current : best
    )
  }, [goalAchievementData])

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded w-32 animate-pulse"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="bg-slate-200 dark:bg-slate-700 rounded-lg h-24 animate-pulse"></div>
          ))}
        </div>
      </div>
    )
  }

  if (error || !goalAchievementData) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
        <p className="text-red-800 dark:text-red-200 text-sm">
          Failed to load streak data. Please try again.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Flame className="h-5 w-5 text-orange-500" />
          <h3 className="text-lg font-semibold text-midnight dark:text-white">
            Goal Achievement Streaks
          </h3>
        </div>
        
        {bestStreak && bestStreak.longestStreak > 0 && (
          <div className="flex items-center space-x-2 bg-gradient-to-r from-orange-100 to-red-100 dark:from-orange-900/20 dark:to-red-900/20 px-3 py-1 rounded-full">
            <Trophy className="h-4 w-4 text-orange-600 dark:text-orange-400" />
            <span className="text-sm font-medium text-orange-800 dark:text-orange-200">
              Best: {bestStreak.longestStreak} days ({GOAL_LABELS[bestStreak.goalType]})
            </span>
          </div>
        )}
      </div>

      {/* Current Streaks Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {sortedStreaks.map((streak) => {
          const IconComponent = GOAL_ICONS[streak.goalType]
          const colorClass = GOAL_COLORS[streak.goalType]
          const isActive = streak.currentStreak > 0
          
          return (
            <div
              key={streak.goalType}
              className={`relative overflow-hidden rounded-lg border-2 transition-all ${
                isActive
                  ? 'border-orange-200 dark:border-orange-800 bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20'
                  : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800'
              }`}
            >
              {/* Streak flame effect for active streaks */}
              {isActive && (
                <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-bl from-orange-400/20 to-transparent rounded-bl-full"></div>
              )}
              
              <div className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <div className={`p-2 rounded-lg ${colorClass} bg-opacity-10`}>
                      <IconComponent className={`h-4 w-4 text-${colorClass.split('-')[1]}-600`} />
                    </div>
                    <span className="font-medium text-midnight dark:text-white">
                      {GOAL_LABELS[streak.goalType]}
                    </span>
                  </div>
                  
                  {isActive && (
                    <Flame className="h-4 w-4 text-orange-500 animate-pulse" />
                  )}
                </div>

                {/* Current Streak */}
                <div className="space-y-2">
                  <div>
                    <p className="text-xs text-slate-600 dark:text-slate-400">Current Streak</p>
                    <p className={`text-2xl font-bold ${
                      isActive ? 'text-orange-600 dark:text-orange-400' : 'text-slate-400'
                    }`}>
                      {streak.currentStreak}
                      <span className="text-sm font-normal ml-1">
                        {streak.currentStreak === 1 ? 'day' : 'days'}
                      </span>
                    </p>
                  </div>

                  {/* Longest Streak */}
                  <div>
                    <p className="text-xs text-slate-600 dark:text-slate-400">Personal Best</p>
                    <div className="flex items-center space-x-2">
                      <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                        {streak.longestStreak} days
                      </p>
                      {streak.longestStreak > streak.currentStreak && (
                        <TrendingUp className="h-3 w-3 text-slate-500" />
                      )}
                    </div>
                  </div>

                  {/* Last Achieved */}
                  {streak.lastAchievedDate && (
                    <div>
                      <p className="text-xs text-slate-600 dark:text-slate-400">Last Achieved</p>
                      <p className="text-xs text-slate-500 dark:text-slate-500">
                        {new Date(streak.lastAchievedDate).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric'
                        })}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Streak History */}
      {showHistory && (
        <div className="space-y-4">
          <h4 className="text-md font-semibold text-midnight dark:text-white flex items-center space-x-2">
            <Calendar className="h-4 w-4 text-slate-600" />
            <span>Recent Streak History</span>
          </h4>
          
          <div className="space-y-3">
            {sortedStreaks
              .filter(streak => streak.streakHistory.length > 0)
              .slice(0, 2) // Show top 2 goals with streak history
              .map((streak) => (
                <div key={streak.goalType} className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-medium text-slate-800 dark:text-slate-200">
                      {GOAL_LABELS[streak.goalType]} Streaks
                    </span>
                    <span className="text-xs text-slate-500">
                      {streak.streakHistory.length} total streak{streak.streakHistory.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                  
                  <div className="space-y-2">
                    {streak.streakHistory
                      .slice(-3) // Show last 3 streaks
                      .reverse()
                      .map((history, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between py-2 px-3 bg-white dark:bg-slate-800 rounded border"
                        >
                          <div className="flex items-center space-x-3">
                            <div className={`w-2 h-2 rounded-full ${GOAL_COLORS[streak.goalType]}`}></div>
                            <span className="text-sm text-slate-700 dark:text-slate-300">
                              {history.length} day{history.length !== 1 ? 's' : ''}
                            </span>
                          </div>
                          <span className="text-xs text-slate-500">
                            {new Date(history.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - {new Date(history.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          </span>
                        </div>
                      ))}
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Motivational Message */}
      {sortedStreaks.some(s => s.currentStreak > 0) && (
        <div className="bg-gradient-to-r from-orange-100 to-amber-100 dark:from-orange-900/20 dark:to-amber-900/20 rounded-lg p-4 border border-orange-200 dark:border-orange-800">
          <div className="flex items-center space-x-3">
            <Flame className="h-5 w-5 text-orange-600 dark:text-orange-400" />
            <div>
              <p className="font-medium text-orange-800 dark:text-orange-200">
                You're on a roll! 🔥
              </p>
              <p className="text-sm text-orange-700 dark:text-orange-300">
                Keep up the great work to maintain your streaks!
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
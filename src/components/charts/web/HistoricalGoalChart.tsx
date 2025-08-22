/**
 * Multi-line chart showing goal achievement percentages over time
 * Features: Time period selector, goal type toggles, trend lines
 */

import { useState, useMemo } from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine
} from 'recharts'
import { useGoalAchievement, useTimePeriodUtils } from '@/hooks/useHistoricalAnalytics'
import type { TimePeriod, GoalType } from '@/types/historical-analytics'
import { Target, TrendingUp, Calendar, Eye, EyeOff } from 'lucide-react'

interface HistoricalGoalChartProps {
  defaultTimePeriod?: TimePeriod
  showControls?: boolean
  height?: number
}

const GOAL_COLORS = {
  calories: '#f59e0b', // amber
  protein: '#10b981', // emerald
  carbs: '#3b82f6',   // blue
  fat: '#8b5cf6',     // violet
  overall: '#ef4444'  // red
}

const GOAL_LABELS = {
  calories: 'Calories',
  protein: 'Protein',
  carbs: 'Carbs',
  fat: 'Fat',
  overall: 'Overall'
}

export function HistoricalGoalChart({ 
  defaultTimePeriod = '30d',
  showControls = true,
  height = 400
}: HistoricalGoalChartProps) {
  const [timePeriod, setTimePeriod] = useState<TimePeriod>(defaultTimePeriod)
  const [visibleGoals, setVisibleGoals] = useState<Set<string>>(
    new Set(['calories', 'protein', 'overall'])
  )
  
  const { goalAchievementData, isLoading, error } = useGoalAchievement(timePeriod)
  const { getTimePeriodOptions } = useTimePeriodUtils()

  // Format data for chart
  const chartData = useMemo(() => {
    if (!goalAchievementData?.chartData) return []
    
    return goalAchievementData.chartData.map(day => ({
      ...day,
      date: new Date(day.date).toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      })
    }))
  }, [goalAchievementData])

  // Toggle goal visibility
  const toggleGoalVisibility = (goal: string) => {
    const newVisible = new Set(visibleGoals)
    if (newVisible.has(goal)) {
      newVisible.delete(goal)
    } else {
      newVisible.add(goal)
    }
    setVisibleGoals(newVisible)
  }

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-slate-800 p-3 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700">
          <p className="text-sm font-medium text-midnight dark:text-white mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {entry.value}%
            </p>
          ))}
        </div>
      )
    }
    return null
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        {showControls && (
          <div className="flex items-center justify-between">
            <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded w-32 animate-pulse"></div>
            <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded w-40 animate-pulse"></div>
          </div>
        )}
        <div className="bg-slate-200 dark:bg-slate-700 rounded animate-pulse" style={{ height }}></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
        <p className="text-red-800 dark:text-red-200 text-sm">
          Failed to load goal achievement data. Please try again.
        </p>
      </div>
    )
  }

  if (!goalAchievementData || chartData.length === 0) {
    return (
      <div className="bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg p-8">
        <div className="text-center">
          <Target className="h-12 w-12 text-slate-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100 mb-2">
            No Goal Data Available
          </h3>
          <p className="text-slate-600 dark:text-slate-400">
            Start logging your food to see goal achievement trends.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {showControls && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <TrendingUp className="h-5 w-5 text-gold" />
            <h3 className="text-lg font-semibold text-midnight dark:text-white">
              Goal Achievement Trends
            </h3>
          </div>
          
          <div className="flex items-center space-x-4">
            {/* Time Period Selector */}
            <div className="flex items-center space-x-2">
              <Calendar className="h-4 w-4 text-slate-600 dark:text-slate-400" />
              <select
                value={timePeriod}
                onChange={(e) => setTimePeriod(e.target.value as TimePeriod)}
                className="input-elegant py-1 px-2 text-sm"
              >
                {getTimePeriodOptions().map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Goal Toggle Buttons */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm text-slate-600 dark:text-slate-400 mr-2">Show:</span>
        {Object.entries(GOAL_LABELS).map(([key, label]) => (
          <button
            key={key}
            onClick={() => toggleGoalVisibility(key)}
            className={`flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-medium transition-colors ${
              visibleGoals.has(key)
                ? 'bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-150 dark:hover:bg-slate-700'
            }`}
          >
            {visibleGoals.has(key) ? (
              <Eye className="h-3 w-3" />
            ) : (
              <EyeOff className="h-3 w-3" />
            )}
            <span style={{ color: visibleGoals.has(key) ? GOAL_COLORS[key as keyof typeof GOAL_COLORS] : undefined }}>
              {label}
            </span>
          </button>
        ))}
      </div>

      {/* Chart */}
      <div className="bg-white dark:bg-slate-800 rounded-lg p-4">
        <ResponsiveContainer width="100%" height={height}>
          <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200 dark:stroke-slate-700" />
            <XAxis 
              dataKey="date" 
              className="text-xs"
              tick={{ fill: 'currentColor' }}
            />
            <YAxis 
              domain={[0, 150]}
              className="text-xs"
              tick={{ fill: 'currentColor' }}
              tickFormatter={(value) => `${value}%`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            
            {/* 100% achievement reference line */}
            <ReferenceLine 
              y={100} 
              stroke="#10b981" 
              strokeDasharray="5 5"
              strokeOpacity={0.6}
            />
            
            {/* Goal achievement lines */}
            {visibleGoals.has('calories') && (
              <Line
                type="monotone"
                dataKey="calories"
                stroke={GOAL_COLORS.calories}
                strokeWidth={2}
                dot={{ fill: GOAL_COLORS.calories, strokeWidth: 0, r: 3 }}
                activeDot={{ r: 5 }}
                name="Calories"
              />
            )}
            
            {visibleGoals.has('protein') && (
              <Line
                type="monotone"
                dataKey="protein"
                stroke={GOAL_COLORS.protein}
                strokeWidth={2}
                dot={{ fill: GOAL_COLORS.protein, strokeWidth: 0, r: 3 }}
                activeDot={{ r: 5 }}
                name="Protein"
              />
            )}
            
            {visibleGoals.has('carbs') && (
              <Line
                type="monotone"
                dataKey="carbs"
                stroke={GOAL_COLORS.carbs}
                strokeWidth={2}
                dot={{ fill: GOAL_COLORS.carbs, strokeWidth: 0, r: 3 }}
                activeDot={{ r: 5 }}
                name="Carbs"
              />
            )}
            
            {visibleGoals.has('fat') && (
              <Line
                type="monotone"
                dataKey="fat"
                stroke={GOAL_COLORS.fat}
                strokeWidth={2}
                dot={{ fill: GOAL_COLORS.fat, strokeWidth: 0, r: 3 }}
                activeDot={{ r: 5 }}
                name="Fat"
              />
            )}
            
            {visibleGoals.has('overall') && (
              <Line
                type="monotone"
                dataKey="overall"
                stroke={GOAL_COLORS.overall}
                strokeWidth={3}
                dot={{ fill: GOAL_COLORS.overall, strokeWidth: 0, r: 4 }}
                activeDot={{ r: 6 }}
                name="Overall"
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Quick Stats */}
      {goalAchievementData.summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-3">
            <p className="text-xs text-slate-600 dark:text-slate-400">Average Score</p>
            <p className="text-lg font-semibold text-midnight dark:text-white">
              {goalAchievementData.summary.averageOverallScore}%
            </p>
          </div>
          
          <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-3">
            <p className="text-xs text-slate-600 dark:text-slate-400">Days with Data</p>
            <p className="text-lg font-semibold text-midnight dark:text-white">
              {goalAchievementData.summary.daysWithData}/{goalAchievementData.summary.totalDays}
            </p>
          </div>
          
          <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-3">
            <p className="text-xs text-slate-600 dark:text-slate-400">Best Day</p>
            <p className="text-lg font-semibold text-midnight dark:text-white">
              {Math.round(goalAchievementData.summary.bestDay.overallScore)}%
            </p>
          </div>
          
          <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-3">
            <p className="text-xs text-slate-600 dark:text-slate-400">Avg Calories</p>
            <p className="text-lg font-semibold text-midnight dark:text-white">
              {goalAchievementData.summary.averageCalories}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
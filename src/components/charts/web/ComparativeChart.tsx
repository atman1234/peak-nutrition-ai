/**
 * Side-by-side period comparison chart
 * Features: Time period selection, metric comparison, trend analysis
 */

import { useState, useMemo } from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line
} from 'recharts'
import { useHistoricalAnalytics, useTimePeriodUtils } from '@/hooks/useHistoricalAnalytics'
import type { TimePeriod } from '@/types/historical-analytics'
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  Calendar, 
  ArrowRight,
  Minus,
  Target
} from 'lucide-react'

interface ComparativeChartProps {
  defaultComparison?: 'week-vs-week' | 'month-vs-month' | 'period-vs-period'
  height?: number
}

type ComparisonType = 'week-vs-week' | 'month-vs-month' | 'period-vs-period'
type MetricType = 'achievement-rate' | 'average-score' | 'consistency' | 'streak-length'

const COMPARISON_OPTIONS = [
  { value: 'week-vs-week', label: 'This Week vs Last Week' },
  { value: 'month-vs-month', label: 'This Month vs Last Month' },
  { value: 'period-vs-period', label: 'Custom Period Comparison' }
]

const METRIC_OPTIONS = [
  { value: 'achievement-rate', label: 'Goal Achievement Rate', unit: '%' },
  { value: 'average-score', label: 'Average Overall Score', unit: '%' },
  { value: 'consistency', label: 'Consistency Score', unit: '%' },
  { value: 'streak-length', label: 'Average Streak Length', unit: ' days' }
]

const GOAL_COLORS = {
  calories: '#f59e0b',
  protein: '#10b981', 
  carbs: '#3b82f6',
  fat: '#8b5cf6'
}

export function ComparativeChart({ 
  defaultComparison = 'week-vs-week',
  height = 400
}: ComparativeChartProps) {
  const [comparison, setComparison] = useState<ComparisonType>(defaultComparison)
  const [metric, setMetric] = useState<MetricType>('achievement-rate')
  const [customPeriod, setCustomPeriod] = useState<TimePeriod>('30d')

  // Calculate date ranges for comparison periods
  const { currentPeriod, previousPeriod } = useMemo(() => {
    const today = new Date()
    
    if (comparison === 'week-vs-week') {
      // Current week (Monday to Sunday)
      const currentWeekStart = new Date(today)
      currentWeekStart.setDate(today.getDate() - today.getDay() + 1)
      const currentWeekEnd = new Date(currentWeekStart)
      currentWeekEnd.setDate(currentWeekStart.getDate() + 6)
      
      // Previous week
      const previousWeekStart = new Date(currentWeekStart)
      previousWeekStart.setDate(currentWeekStart.getDate() - 7)
      const previousWeekEnd = new Date(previousWeekStart)
      previousWeekEnd.setDate(previousWeekStart.getDate() + 6)
      
      return {
        currentPeriod: {
          start: currentWeekStart.toISOString().split('T')[0],
          end: currentWeekEnd.toISOString().split('T')[0]
        },
        previousPeriod: {
          start: previousWeekStart.toISOString().split('T')[0],
          end: previousWeekEnd.toISOString().split('T')[0]
        }
      }
    } else if (comparison === 'month-vs-month') {
      // Current month
      const currentMonthStart = new Date(today.getFullYear(), today.getMonth(), 1)
      const currentMonthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0)
      
      // Previous month
      const previousMonthStart = new Date(today.getFullYear(), today.getMonth() - 1, 1)
      const previousMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0)
      
      return {
        currentPeriod: {
          start: currentMonthStart.toISOString().split('T')[0],
          end: currentMonthEnd.toISOString().split('T')[0]
        },
        previousPeriod: {
          start: previousMonthStart.toISOString().split('T')[0],
          end: previousMonthEnd.toISOString().split('T')[0]
        }
      }
    } else {
      // Custom period comparison
      const days = customPeriod === '7d' ? 7 : customPeriod === '30d' ? 30 : 90
      
      const currentEnd = today.toISOString().split('T')[0]
      const currentStart = new Date(today.getTime() - (days - 1) * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      
      const previousEnd = new Date(today.getTime() - days * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      const previousStart = new Date(today.getTime() - (days * 2 - 1) * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      
      return {
        currentPeriod: { start: currentStart, end: currentEnd },
        previousPeriod: { start: previousStart, end: previousEnd }
      }
    }
  }, [comparison, customPeriod])

  // Fetch data for both periods
  const currentConfig = {
    timePeriod: 'custom' as TimePeriod,
    customDateRange: currentPeriod,
    includeStreaks: true,
    includeConsistency: true,
    includeTrends: false,
    includeComparisons: false,
    goalTypes: ['calories', 'protein', 'carbs', 'fat'] as const
  }

  const previousConfig = {
    timePeriod: 'custom' as TimePeriod,
    customDateRange: previousPeriod,
    includeStreaks: true,
    includeConsistency: true,
    includeTrends: false,
    includeComparisons: false,
    goalTypes: ['calories', 'protein', 'carbs', 'fat'] as const
  }

  const { 
    historicalMetrics: currentMetrics, 
    isLoading: isLoadingCurrent, 
    error: errorCurrent 
  } = useHistoricalAnalytics(currentConfig)

  const { 
    historicalMetrics: previousMetrics, 
    isLoading: isLoadingPrevious, 
    error: errorPrevious 
  } = useHistoricalAnalytics(previousConfig)

  const { getTimePeriodOptions } = useTimePeriodUtils()

  // Process comparison data
  const comparisonData = useMemo(() => {
    if (!currentMetrics || !previousMetrics) return null

    const goals = ['calories', 'protein', 'carbs', 'fat'] as const
    const data = goals.map(goal => {
      const currentData = getCurrentMetricValue(goal, currentMetrics, metric)
      const previousData = getPreviousMetricValue(goal, previousMetrics, metric)
      
      const change = currentData - previousData
      const changePercent = previousData > 0 ? (change / previousData) * 100 : 0
      
      return {
        goal: goal.charAt(0).toUpperCase() + goal.slice(1),
        current: Math.round(currentData * 10) / 10,
        previous: Math.round(previousData * 10) / 10,
        change: Math.round(change * 10) / 10,
        changePercent: Math.round(changePercent * 10) / 10,
        color: GOAL_COLORS[goal]
      }
    })

    return data
  }, [currentMetrics, previousMetrics, metric])

  const isLoading = isLoadingCurrent || isLoadingPrevious
  const error = errorCurrent || errorPrevious

  // Helper functions
  function getCurrentMetricValue(goal: string, metrics: any, metricType: MetricType): number {
    switch (metricType) {
      case 'achievement-rate':
        const achieved = metrics.dailyGoals.filter((d: any) => d[goal].achieved).length
        const total = metrics.dailyGoals.filter((d: any) => d[goal].target > 0).length
        return total > 0 ? (achieved / total) * 100 : 0
        
      case 'average-score':
        const scores = metrics.dailyGoals.map((d: any) => d[goal].percentage)
        return scores.length > 0 ? scores.reduce((sum: number, s: number) => sum + s, 0) / scores.length : 0
        
      case 'consistency':
        const consistency = metrics.consistency.find((c: any) => c.goalType === goal)
        return consistency ? consistency.score : 0
        
      case 'streak-length':
        const streak = metrics.streaks.find((s: any) => s.goalType === goal)
        return streak ? streak.currentStreak : 0
        
      default:
        return 0
    }
  }

  function getPreviousMetricValue(goal: string, metrics: any, metricType: MetricType): number {
    return getCurrentMetricValue(goal, metrics, metricType)
  }

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="bg-white dark:bg-slate-800 p-3 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700">
          <p className="text-sm font-medium text-midnight dark:text-white mb-2">{label}</p>
          <div className="space-y-1">
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Current: <span className="font-medium">{data.current}{METRIC_OPTIONS.find(m => m.value === metric)?.unit}</span>
            </p>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Previous: <span className="font-medium">{data.previous}{METRIC_OPTIONS.find(m => m.value === metric)?.unit}</span>
            </p>
            <p className={`text-sm font-medium ${
              data.changePercent > 0 ? 'text-emerald-600' : data.changePercent < 0 ? 'text-red-600' : 'text-slate-600'
            }`}>
              Change: {data.changePercent > 0 ? '+' : ''}{data.changePercent}%
            </p>
          </div>
        </div>
      )
    }
    return null
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded w-48 animate-pulse"></div>
          <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded w-40 animate-pulse"></div>
        </div>
        <div className="bg-slate-200 dark:bg-slate-700 rounded animate-pulse" style={{ height }}></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
        <p className="text-red-800 dark:text-red-200 text-sm">
          Failed to load comparison data. Please try again.
        </p>
      </div>
    )
  }

  if (!comparisonData) {
    return (
      <div className="bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg p-8">
        <div className="text-center">
          <Target className="h-12 w-12 text-slate-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100 mb-2">
            No Comparison Data Available
          </h3>
          <p className="text-slate-600 dark:text-slate-400">
            Need data from both periods to create comparison.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header with Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <BarChart3 className="h-5 w-5 text-indigo-600" />
          <h3 className="text-lg font-semibold text-midnight dark:text-white">
            Period Comparison
          </h3>
        </div>
        
        <div className="flex items-center space-x-4">
          {/* Comparison Type */}
          <select
            value={comparison}
            onChange={(e) => setComparison(e.target.value as ComparisonType)}
            className="input-elegant py-1 px-2 text-sm"
          >
            {COMPARISON_OPTIONS.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          {/* Custom Period Selector (only for period-vs-period) */}
          {comparison === 'period-vs-period' && (
            <select
              value={customPeriod}
              onChange={(e) => setCustomPeriod(e.target.value as TimePeriod)}
              className="input-elegant py-1 px-2 text-sm"
            >
              {getTimePeriodOptions().filter(opt => opt.value !== '6m' && opt.value !== '1y').map(option => (
                <option key={option.value} value={option.value}>
                  {option.label.replace('Last ', '')}
                </option>
              ))}
            </select>
          )}

          {/* Metric Selector */}
          <select
            value={metric}
            onChange={(e) => setMetric(e.target.value as MetricType)}
            className="input-elegant py-1 px-2 text-sm"
          >
            {METRIC_OPTIONS.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Period Labels */}
      <div className="flex items-center justify-center space-x-4 text-sm text-slate-600 dark:text-slate-400">
        <span className="font-medium">Previous Period</span>
        <ArrowRight className="h-4 w-4" />
        <span className="font-medium">Current Period</span>
      </div>

      {/* Chart */}
      <div className="bg-white dark:bg-slate-800 rounded-lg p-4">
        <ResponsiveContainer width="100%" height={height}>
          <BarChart data={comparisonData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200 dark:stroke-slate-700" />
            <XAxis 
              dataKey="goal" 
              className="text-xs"
              tick={{ fill: 'currentColor' }}
            />
            <YAxis 
              className="text-xs"
              tick={{ fill: 'currentColor' }}
              tickFormatter={(value) => `${value}${METRIC_OPTIONS.find(m => m.value === metric)?.unit}`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            
            <Bar
              dataKey="previous"
              fill="#94a3b8"
              name="Previous Period"
              opacity={0.7}
              radius={[2, 2, 0, 0]}
            />
            <Bar
              dataKey="current"
              fill="#3b82f6"
              name="Current Period"
              radius={[2, 2, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {comparisonData.map((data) => {
          const isImproving = data.changePercent > 0
          const isStable = Math.abs(data.changePercent) < 5
          const TrendIcon = isStable ? Minus : isImproving ? TrendingUp : TrendingDown
          const trendColor = isStable ? 'text-slate-500' : isImproving ? 'text-emerald-500' : 'text-red-500'
          
          return (
            <div key={data.goal} className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-slate-800 dark:text-slate-200">
                  {data.goal}
                </span>
                <div className={`flex items-center space-x-1 ${trendColor}`}>
                  <TrendIcon className="h-4 w-4" />
                  <span className="text-sm font-medium">
                    {Math.abs(data.changePercent)}%
                  </span>
                </div>
              </div>
              
              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600 dark:text-slate-400">Current:</span>
                  <span className="font-semibold">
                    {data.current}{METRIC_OPTIONS.find(m => m.value === metric)?.unit}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600 dark:text-slate-400">Previous:</span>
                  <span>{data.previous}{METRIC_OPTIONS.find(m => m.value === metric)?.unit}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600 dark:text-slate-400">Change:</span>
                  <span className={`font-medium ${trendColor}`}>
                    {data.change > 0 ? '+' : ''}{data.change}{METRIC_OPTIONS.find(m => m.value === metric)?.unit}
                  </span>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
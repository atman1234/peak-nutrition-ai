import { useMemo } from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart,
  ReferenceLine,
} from 'recharts'
import { useWeightEntries } from '@/hooks/useWeightEntries'
import { useProfile } from '@/hooks/useProfile'
import { getLocalDateFromUTC } from '@/lib/date-utils'
import { ChartWrapper, useChartTheme } from './ChartWrapper'

interface WeightChartProps {
  days?: number // Number of days to show (default: 30)
  showGoal?: boolean
  chartType?: 'line' | 'area'
}

export function WeightChart({ days = 30, showGoal = true, chartType = 'area' }: WeightChartProps) {
  const { weightEntries, displayUnits } = useWeightEntries()
  const { profile } = useProfile()
  const chartTheme = useChartTheme()

  const chartData = useMemo(() => {
    if (weightEntries.length === 0) return []

    // Filter entries to the specified time range (using local dates)
    const cutoffLocalDate = new Date()
    cutoffLocalDate.setDate(cutoffLocalDate.getDate() - days)
    const cutoffDateString = cutoffLocalDate.toISOString().split('T')[0]

    const filteredEntries = weightEntries
      .filter(entry => {
        if (!entry.recorded_at) return false
        
        // For weight entries, recorded_at is typically a date string (YYYY-MM-DD)
        // or timestamp. Convert to local date for comparison
        let entryLocalDate: string
        if (entry.recorded_at.includes('T')) {
          // It's a timestamp - convert UTC to local date
          entryLocalDate = getLocalDateFromUTC(entry.recorded_at)
        } else {
          // It's already a date string
          entryLocalDate = entry.recorded_at
        }
        
        return entryLocalDate >= cutoffDateString
      })
      .sort((a, b) => {
        if (!a.recorded_at || !b.recorded_at) return 0
        
        // Sort by date (handle both date strings and timestamps)
        const getComparableDate = (dateString: string) => {
          if (dateString.includes('T')) {
            return new Date(dateString)
          } else {
            return new Date(dateString + 'T12:00:00')
          }
        }
        
        const dateA = getComparableDate(a.recorded_at)
        const dateB = getComparableDate(b.recorded_at)
        return dateA.getTime() - dateB.getTime()
      })

    return filteredEntries.map(entry => {
      if (!entry.recorded_at) return { date: '', weight: 0, goal: null }
      
      // Create a display date - for weight entries this should be consistent
      let displayDate: Date
      if (entry.recorded_at.includes('T')) {
        // It's a timestamp - use the UTC date but display as local
        displayDate = new Date(entry.recorded_at)
      } else {
        // It's a date string - treat as local date
        displayDate = new Date(entry.recorded_at + 'T12:00:00')
      }
        
      return {
        date: displayDate.toLocaleDateString('en-US', { 
          month: 'short', 
          day: 'numeric' 
        }),
        weight: Number(entry.weight),
        goal: profile?.target_weight ? Number(profile.target_weight) : null,
      }
    })
  }, [weightEntries, days, profile])

  if (chartData.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-slate-500 dark:text-slate-400">
        <p>No weight data available for the selected period</p>
      </div>
    )
  }

  // Calculate min and max for Y-axis with some padding
  const weights = chartData.map(d => Number(d.weight))
  const allWeights = [...weights]
  if (showGoal && profile?.target_weight) {
    allWeights.push(Number(profile.target_weight))
  }
  const minWeight = Math.min(...allWeights) - (displayUnits.weightSuffix === 'lbs' ? 5 : 2)
  const maxWeight = Math.max(...allWeights) + (displayUnits.weightSuffix === 'lbs' ? 5 : 2)

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-slate-800 p-3 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700">
          <p className="text-sm font-medium text-midnight dark:text-white">{label}</p>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Weight: <span className="font-semibold text-gold">{payload[0].value.toFixed(1)} {displayUnits.weightSuffix}</span>
          </p>
          {showGoal && profile?.target_weight && (
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Goal: <span className="font-semibold text-emerald-500">{Number(profile.target_weight)?.toFixed(1)} {displayUnits.weightSuffix}</span>
            </p>
          )}
        </div>
      )
    }
    return null
  }

  const ChartComponent = chartType === 'area' ? AreaChart : LineChart
  const DataComponent = chartType === 'area' ? Area : Line

  return (
    <ChartWrapper>
      <ResponsiveContainer width="100%" height={300}>
        <ChartComponent
          data={chartData}
          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.grid} />
          <XAxis 
            dataKey="date" 
            tick={{ fill: chartTheme.text, fontSize: 12 }}
            axisLine={{ stroke: chartTheme.grid }}
            tickLine={{ stroke: chartTheme.grid }}
          />
          <YAxis 
            domain={[minWeight, maxWeight]}
            tick={{ fill: chartTheme.text, fontSize: 12 }}
            tickFormatter={(value) => `${value.toFixed(0)} ${displayUnits.weightSuffix}`}
            axisLine={{ stroke: chartTheme.grid }}
            tickLine={{ stroke: chartTheme.grid }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend 
            wrapperStyle={{ color: chartTheme.text }}
            iconType="rect"
          />
        
        {showGoal && profile?.target_weight && (
          <ReferenceLine 
            y={Number(profile.target_weight)} 
            stroke="#10b981" 
            strokeDasharray="5 5"
            label={{ value: "Goal", position: "right", fill: '#10b981' }}
          />
        )}
        
        <DataComponent
          type="monotone"
          dataKey="weight"
          stroke="#f59e0b"
          fill="#f59e0b"
          fillOpacity={chartType === 'area' ? 0.3 : 0}
          strokeWidth={2}
          name="Weight"
          dot={{ fill: '#f59e0b', strokeWidth: 2, r: 4 }}
          activeDot={{ r: 6 }}
        />
      </ChartComponent>
    </ResponsiveContainer>
    </ChartWrapper>
  )
}
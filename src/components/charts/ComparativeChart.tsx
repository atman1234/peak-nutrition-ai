import React, { useMemo, useState } from 'react';
import { View, Dimensions, TouchableOpacity, Text } from 'react-native';
import {
  VictoryBar,
  VictoryChart,
  VictoryAxis,
  VictoryLabel,
  VictoryContainer,
  VictoryTooltip,
  VictoryGroup,
} from 'victory-native';
import { format, subDays, startOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';
import { useChartTheme, useChartColors, chartFormatters } from './common/ChartTheme';
import { ChartContainer, ChartLegend, ChartEmptyState } from './common/ChartContainer';
import { useFoodLogs } from '@/hooks/useFoodLogs';
import { useWeightEntries } from '@/hooks/useWeightEntries';
import { useProfile } from '@/hooks/useProfile';

const { width: screenWidth } = Dimensions.get('window');

interface ComparativeChartProps {
  comparisonType?: 'week' | 'month';
  metricType?: 'calories' | 'weight' | 'macros';
  height?: number;
}

const comparisonOptions = [
  { label: 'This vs Last Week', value: 'week' },
  { label: 'This vs Last Month', value: 'month' },
];

const metricOptions = [
  { label: 'Calories', value: 'calories' },
  { label: 'Weight', value: 'weight' },
  { label: 'Macros', value: 'macros' },
];

export const ComparativeChart: React.FC<ComparativeChartProps> = ({
  comparisonType = 'week',
  metricType = 'calories',
  height = 350,
}) => {
  const [selectedComparison, setSelectedComparison] = useState(comparisonType);
  const [selectedMetric, setSelectedMetric] = useState(metricType);
  
  const chartTheme = useChartTheme();
  const chartColors = useChartColors();
  const { profile } = useProfile();
  const { foodLogs, loading: foodLoading, error: foodError } = useFoodLogs();
  const { weightEntries, loading: weightLoading, error: weightError } = useWeightEntries();

  const loading = foodLoading || weightLoading;
  const error = foodError || weightError;

  // Calculate comparison periods
  const periods = useMemo(() => {
    const today = new Date();
    
    if (selectedComparison === 'week') {
      const thisWeekStart = startOfWeek(today);
      const thisWeekEnd = endOfWeek(today);
      const lastWeekStart = startOfWeek(subDays(today, 7));
      const lastWeekEnd = endOfWeek(subDays(today, 7));
      
      return {
        current: { start: thisWeekStart, end: thisWeekEnd, label: 'This Week' },
        previous: { start: lastWeekStart, end: lastWeekEnd, label: 'Last Week' },
      };
    } else {
      const thisMonthStart = startOfMonth(today);
      const thisMonthEnd = endOfMonth(today);
      const lastMonthStart = startOfMonth(subDays(thisMonthStart, 1));
      const lastMonthEnd = endOfMonth(subDays(thisMonthStart, 1));
      
      return {
        current: { start: thisMonthStart, end: thisMonthEnd, label: 'This Month' },
        previous: { start: lastMonthStart, end: lastMonthEnd, label: 'Last Month' },
      };
    }
  }, [selectedComparison]);

  // Prepare chart data based on metric type
  const chartData = useMemo(() => {
    if (selectedMetric === 'calories') {
      // Calculate calories for each period
      const calculateCalories = (start: Date, end: Date) => {
        const periodLogs = foodLogs?.filter(log => {
          const logDate = new Date(log.created_at);
          return logDate >= start && logDate <= end;
        }) || [];

        return periodLogs.reduce((total, log) => {
          return total + (log.food_item?.calories || 0) * (log.quantity || 0);
        }, 0);
      };

      const currentCalories = calculateCalories(periods.current.start, periods.current.end);
      const previousCalories = calculateCalories(periods.previous.start, periods.previous.end);

      return [
        {
          x: periods.previous.label,
          y: Math.round(previousCalories),
          label: chartFormatters.calories(previousCalories),
          color: chartColors.palette[1],
        },
        {
          x: periods.current.label,
          y: Math.round(currentCalories),
          label: chartFormatters.calories(currentCalories),
          color: chartColors.palette[0],
        },
      ];
    } 
    
    else if (selectedMetric === 'weight') {
      // Calculate average weight for each period
      const calculateWeight = (start: Date, end: Date) => {
        const periodEntries = weightEntries?.filter(entry => {
          const entryDate = new Date(entry.date);
          return entryDate >= start && entryDate <= end;
        }) || [];

        if (periodEntries.length === 0) return 0;
        
        const totalWeight = periodEntries.reduce((sum, entry) => sum + entry.weight, 0);
        return totalWeight / periodEntries.length;
      };

      const currentWeight = calculateWeight(periods.current.start, periods.current.end);
      const previousWeight = calculateWeight(periods.previous.start, periods.previous.end);
      const weightUnit = profile?.preferred_units === 'imperial' ? 'lbs' : 'kg';

      return [
        {
          x: periods.previous.label,
          y: parseFloat(previousWeight.toFixed(1)),
          label: chartFormatters.weight(previousWeight, weightUnit),
          color: chartColors.palette[1],
        },
        {
          x: periods.current.label,
          y: parseFloat(currentWeight.toFixed(1)),
          label: chartFormatters.weight(currentWeight, weightUnit),
          color: chartColors.palette[0],
        },
      ];
    } 
    
    else { // macros
      // Calculate macros for each period
      const calculateMacros = (start: Date, end: Date) => {
        const periodLogs = foodLogs?.filter(log => {
          const logDate = new Date(log.created_at);
          return logDate >= start && logDate <= end;
        }) || [];

        return periodLogs.reduce((totals, log) => {
          const food = log.food_item;
          const quantity = log.quantity || 0;
          
          if (food) {
            totals.protein += (food.protein || 0) * quantity;
            totals.carbs += (food.carbohydrates || 0) * quantity;
            totals.fat += (food.fat || 0) * quantity;
          }
          
          return totals;
        }, { protein: 0, carbs: 0, fat: 0 });
      };

      const currentMacros = calculateMacros(periods.current.start, periods.current.end);
      const previousMacros = calculateMacros(periods.previous.start, periods.previous.end);

      return [
        {
          category: 'Protein',
          [periods.previous.label]: Math.round(previousMacros.protein),
          [periods.current.label]: Math.round(currentMacros.protein),
          color: chartColors.macros.protein,
        },
        {
          category: 'Carbs',
          [periods.previous.label]: Math.round(previousMacros.carbs),
          [periods.current.label]: Math.round(currentMacros.carbs),
          color: chartColors.macros.carbs,
        },
        {
          category: 'Fat',
          [periods.previous.label]: Math.round(previousMacros.fat),
          [periods.current.label]: Math.round(currentMacros.fat),
          color: chartColors.macros.fat,
        },
      ];
    }
  }, [selectedMetric, periods, foodLogs, weightEntries, profile, chartColors]);

  // Calculate percentage change
  const percentageChange = useMemo(() => {
    if (selectedMetric === 'macros') return null;
    
    const [previous, current] = chartData;
    if (!previous || !current || previous.y === 0) return null;
    
    return Math.round(((current.y - previous.y) / previous.y) * 100);
  }, [chartData, selectedMetric]);

  // Calculate max Y value for chart domain
  const maxY = useMemo(() => {
    if (selectedMetric === 'macros') {
      const allValues = chartData.flatMap(d => [
        d[periods.previous.label], 
        d[periods.current.label]
      ]);
      const max = Math.max(...allValues);
      return Math.ceil(max / 10) * 10;
    } else {
      const max = Math.max(...chartData.map(d => d.y));
      return Math.ceil(max * 1.1);
    }
  }, [chartData, selectedMetric, periods]);

  if (loading) {
    return (
      <ChartContainer
        title="Period Comparison"
        subtitle={`${periods.current.label} vs ${periods.previous.label}`}
        loading={true}
        height={height}
      />
    );
  }

  if (error) {
    return (
      <ChartContainer
        title="Period Comparison"
        subtitle={`${periods.current.label} vs ${periods.previous.label}`}
        error="Failed to load comparison data"
        height={height}
      />
    );
  }

  const isEmpty = selectedMetric === 'macros' 
    ? chartData.every(d => d[periods.previous.label] === 0 && d[periods.current.label] === 0)
    : chartData.every(d => d.y === 0);

  if (isEmpty) {
    return (
      <ChartContainer
        title="Period Comparison"
        subtitle={`${periods.current.label} vs ${periods.previous.label}`}
        height={height}
        actions={
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <View style={{ flexDirection: 'row', backgroundColor: chartTheme.axis.style.axis.stroke, borderRadius: 8, padding: 2 }}>
              {comparisonOptions.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  onPress={() => setSelectedComparison(option.value as 'week' | 'month')}
                  style={{
                    paddingHorizontal: 8,
                    paddingVertical: 4,
                    borderRadius: 6,
                    backgroundColor: selectedComparison === option.value ? chartColors.primary : 'transparent',
                  }}
                >
                  <Text style={{ 
                    fontSize: 10, 
                    fontWeight: '500',
                    color: selectedComparison === option.value ? '#FFFFFF' : chartTheme.axis.style.tickLabels.fill,
                  }}>
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={{ flexDirection: 'row', backgroundColor: chartTheme.axis.style.axis.stroke, borderRadius: 8, padding: 2 }}>
              {metricOptions.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  onPress={() => setSelectedMetric(option.value as 'calories' | 'weight' | 'macros')}
                  style={{
                    paddingHorizontal: 8,
                    paddingVertical: 4,
                    borderRadius: 6,
                    backgroundColor: selectedMetric === option.value ? chartColors.primary : 'transparent',
                  }}
                >
                  <Text style={{ 
                    fontSize: 10, 
                    fontWeight: '500',
                    color: selectedMetric === option.value ? '#FFFFFF' : chartTheme.axis.style.tickLabels.fill,
                  }}>
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        }
      >
        <ChartEmptyState message="No data available for comparison" />
      </ChartContainer>
    );
  }

  const chartWidth = Math.min(screenWidth - 64, 350);

  return (
    <ChartContainer
      title="Period Comparison"
      subtitle={`${periods.current.label} vs ${periods.previous.label}`}
      height={height}
      noPadding={false}
      actions={
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <View style={{ flexDirection: 'row', backgroundColor: chartTheme.axis.style.axis.stroke, borderRadius: 8, padding: 2 }}>
            {comparisonOptions.map((option) => (
              <TouchableOpacity
                key={option.value}
                onPress={() => setSelectedComparison(option.value as 'week' | 'month')}
                style={{
                  paddingHorizontal: 8,
                  paddingVertical: 4,
                  borderRadius: 6,
                  backgroundColor: selectedComparison === option.value ? chartColors.primary : 'transparent',
                }}
              >
                <Text style={{ 
                  fontSize: 10, 
                  fontWeight: '500',
                  color: selectedComparison === option.value ? '#FFFFFF' : chartTheme.axis.style.tickLabels.fill,
                }}>
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <View style={{ flexDirection: 'row', backgroundColor: chartTheme.axis.style.axis.stroke, borderRadius: 8, padding: 2 }}>
            {metricOptions.map((option) => (
              <TouchableOpacity
                key={option.value}
                onPress={() => setSelectedMetric(option.value as 'calories' | 'weight' | 'macros')}
                style={{
                  paddingHorizontal: 8,
                  paddingVertical: 4,
                  borderRadius: 6,
                  backgroundColor: selectedMetric === option.value ? chartColors.primary : 'transparent',
                }}
              >
                <Text style={{ 
                  fontSize: 10, 
                  fontWeight: '500',
                  color: selectedMetric === option.value ? '#FFFFFF' : chartTheme.axis.style.tickLabels.fill,
                }}>
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      }
    >
      {selectedMetric === 'macros' ? (
        // Grouped bar chart for macros
        <VictoryChart
          theme={chartTheme}
          width={chartWidth}
          height={height - 80}
          padding={{ left: 70, bottom: 60, right: 40, top: 20 }}
          domain={{ y: [0, maxY] }}
        >
          <VictoryAxis
            dependentAxis={false}
            style={{
              axis: chartTheme.axis.style.axis,
              tickLabels: chartTheme.axis.style.tickLabels,
              grid: { stroke: 'transparent' },
            }}
          />
          
          <VictoryAxis
            dependentAxis
            style={{
              axis: chartTheme.axis.style.axis,
              tickLabels: chartTheme.axis.style.tickLabels,
              grid: chartTheme.axis.style.grid,
            }}
            label="Grams"
            axisLabelComponent={
              <VictoryLabel
                dy={-30}
                style={chartTheme.axis.style.axisLabel}
              />
            }
          />
          
          <VictoryGroup offset={20} colorScale={[chartColors.palette[1], chartColors.palette[0]]}>
            <VictoryBar
              data={chartData.map(d => ({ x: d.category, y: d[periods.previous.label] }))}
              barWidth={15}
            />
            <VictoryBar
              data={chartData.map(d => ({ x: d.category, y: d[periods.current.label] }))}
              barWidth={15}
            />
          </VictoryGroup>
        </VictoryChart>
      ) : (
        // Simple bar chart for calories/weight
        <VictoryChart
          theme={chartTheme}
          width={chartWidth}
          height={height - 80}
          padding={{ left: 70, bottom: 60, right: 40, top: 20 }}
          domain={{ y: [0, maxY] }}
        >
          <VictoryAxis
            dependentAxis={false}
            style={{
              axis: chartTheme.axis.style.axis,
              tickLabels: chartTheme.axis.style.tickLabels,
              grid: { stroke: 'transparent' },
            }}
          />
          
          <VictoryAxis
            dependentAxis
            style={{
              axis: chartTheme.axis.style.axis,
              tickLabels: chartTheme.axis.style.tickLabels,
              grid: chartTheme.axis.style.grid,
            }}
            label={selectedMetric === 'calories' ? 'Calories' : `Weight (${profile?.preferred_units === 'imperial' ? 'lbs' : 'kg'})`}
            axisLabelComponent={
              <VictoryLabel
                dy={-30}
                style={chartTheme.axis.style.axisLabel}
              />
            }
            tickFormat={(t) => selectedMetric === 'calories' ? chartFormatters.abbreviateNumber(t) : t.toString()}
          />
          
          <VictoryBar
            data={chartData}
            style={{
              data: {
                fill: ({ datum }) => datum.color,
              },
            }}
            barWidth={60}
            cornerRadius={{ top: 4 }}
            labelComponent={
              <VictoryLabel
                dy={-5}
                style={{
                  fontSize: 11,
                  fill: chartTheme.axis.style.tickLabels.fill,
                  fontWeight: '500',
                }}
              />
            }
            labelFormat={({ datum }) => datum.label}
            animate={{
              duration: 800,
              onLoad: { duration: 500 },
            }}
          />
        </VictoryChart>
      )}
      
      {/* Summary Stats */}
      {selectedMetric !== 'macros' && percentageChange !== null && (
        <View style={{
          alignItems: 'center',
          paddingVertical: 12,
          borderTopWidth: 1,
          borderTopColor: chartTheme.axis.style.axis.stroke,
        }}>
          <Text style={{
            fontSize: 12,
            color: chartTheme.axis.style.tickLabels.fill,
          }}>
            Change from {periods.previous.label}
          </Text>
          <Text style={{
            fontSize: 18,
            fontWeight: '600',
            color: percentageChange >= 0 
              ? (selectedMetric === 'weight' ? chartColors.calories.high : chartColors.calories.medium)
              : (selectedMetric === 'weight' ? chartColors.calories.medium : chartColors.calories.high),
          }}>
            {percentageChange > 0 ? '+' : ''}{percentageChange}%
          </Text>
        </View>
      )}
      
      {/* Macro Legend */}
      {selectedMetric === 'macros' && (
        <ChartLegend
          data={[
            { label: periods.previous.label, color: chartColors.palette[1] },
            { label: periods.current.label, color: chartColors.palette[0] },
          ]}
          horizontal={true}
        />
      )}
    </ChartContainer>
  );
};
import React, { useMemo, useState } from 'react';
import { View, Dimensions, ScrollView, Text } from 'react-native';
import {
  VictoryBar,
  VictoryChart,
  VictoryAxis,
  VictoryLabel,
  VictoryLine,
  VictoryContainer,
  VictoryTooltip,
  VictoryVoronoiContainer,
} from 'victory-native';
import { format, subDays, startOfDay } from 'date-fns';
import { useChartTheme, useChartColors, chartFormatters } from './common/ChartTheme';
import { ChartContainer, ChartPeriodSelector, ChartEmptyState } from './common/ChartContainer';
import { useFoodLogs } from '@/hooks/useFoodLogs';
import { useProfile } from '@/hooks/useProfile';

const { width: screenWidth } = Dimensions.get('window');

interface CalorieChartProps {
  days?: number;
  showTarget?: boolean;
  height?: number;
}

const periodOptions = [
  { label: '7D', value: '7' },
  { label: '14D', value: '14' },
  { label: '30D', value: '30' },
];

export const CalorieChart: React.FC<CalorieChartProps> = ({
  days = 7,
  showTarget = true,
  height = 300,
}) => {
  const [selectedPeriod, setSelectedPeriod] = useState(days.toString());
  const chartTheme = useChartTheme();
  const chartColors = useChartColors();
  const { profile } = useProfile();
  const { foodLogs, loading, error } = useFoodLogs();

  // Calculate daily calorie target
  const dailyTarget = profile?.target_calories || 2000;

  // Prepare chart data
  const chartData = useMemo(() => {
    const periodDays = parseInt(selectedPeriod);
    const today = startOfDay(new Date());
    const data = [];

    // Generate data for each day in the period
    for (let i = periodDays - 1; i >= 0; i--) {
      const date = subDays(today, i);
      const dateStr = format(date, 'yyyy-MM-dd');
      
      // Filter food logs for this date
      const dayLogs = foodLogs?.filter(log => {
        const logDate = format(new Date(log.created_at), 'yyyy-MM-dd');
        return logDate === dateStr;
      }) || [];

      // Calculate total calories for the day
      const totalCalories = dayLogs.reduce((sum, log) => {
        return sum + (log.food_item?.calories || 0) * (log.quantity || 0);
      }, 0);

      data.push({
        x: format(date, 'MMM dd'),
        y: Math.round(totalCalories),
        date: date,
        label: `${Math.round(totalCalories)} cal`,
        percentage: Math.round((totalCalories / dailyTarget) * 100),
      });
    }

    return data;
  }, [foodLogs, selectedPeriod, dailyTarget]);

  // Determine bar colors based on target achievement
  const getBarColor = (datum: any) => {
    const percentage = (datum.y / dailyTarget) * 100;
    if (percentage < 90) return chartColors.calories.low;
    if (percentage <= 110) return chartColors.calories.medium;
    return chartColors.calories.high;
  };

  // Calculate max Y value for chart domain
  const maxY = useMemo(() => {
    const maxValue = Math.max(...chartData.map(d => d.y), dailyTarget);
    return Math.ceil(maxValue / 500) * 500; // Round up to nearest 500
  }, [chartData, dailyTarget]);

  if (loading) {
    return (
      <ChartContainer
        title="Daily Calories"
        subtitle={`Target: ${dailyTarget} cal/day`}
        loading={true}
        height={height}
      />
    );
  }

  if (error) {
    return (
      <ChartContainer
        title="Daily Calories"
        subtitle={`Target: ${dailyTarget} cal/day`}
        error="Failed to load calorie data"
        height={height}
      />
    );
  }

  if (chartData.every(d => d.y === 0)) {
    return (
      <ChartContainer
        title="Daily Calories"
        subtitle={`Target: ${dailyTarget} cal/day`}
        height={height}
        actions={
          <ChartPeriodSelector
            periods={periodOptions}
            selectedPeriod={selectedPeriod}
            onPeriodChange={setSelectedPeriod}
          />
        }
      >
        <ChartEmptyState message="No calorie data available for this period" />
      </ChartContainer>
    );
  }

  const chartWidth = Math.max(screenWidth - 32, 350);
  const barWidth = Math.max(20, (chartWidth - 100) / chartData.length - 10);

  return (
    <ChartContainer
      title="Daily Calories"
      subtitle={`Target: ${dailyTarget} cal/day`}
      height={height}
      noPadding={true}
      actions={
        <ChartPeriodSelector
          periods={periodOptions}
          selectedPeriod={selectedPeriod}
          onPeriodChange={setSelectedPeriod}
        />
      }
    >
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={{ paddingHorizontal: 16 }}>
          <VictoryChart
            theme={chartTheme}
            width={chartWidth}
            height={height}
            padding={{ left: 70, bottom: 60, right: 40, top: 20 }}
            domain={{ y: [0, maxY] }}
            containerComponent={
              <VictoryVoronoiContainer
                labels={({ datum }) => `${datum.label}\n${datum.percentage}% of target`}
                labelComponent={
                  <VictoryTooltip
                    cornerRadius={4}
                    flyoutStyle={{
                      stroke: chartTheme.tooltip.flyoutStyle.stroke,
                      fill: chartTheme.tooltip.flyoutStyle.fill,
                    }}
                    style={{
                      fontSize: 11,
                      fill: chartTheme.tooltip.style.fill,
                    }}
                  />
                }
              />
            }
          >
            {/* X Axis */}
            <VictoryAxis
              dependentAxis={false}
              style={{
                axis: chartTheme.axis.style.axis,
                tickLabels: {
                  ...chartTheme.axis.style.tickLabels,
                  angle: chartData.length > 7 ? -45 : 0,
                  textAnchor: chartData.length > 7 ? 'end' : 'middle',
                },
                grid: { stroke: 'transparent' },
              }}
              fixLabelOverlap={true}
            />
            
            {/* Y Axis */}
            <VictoryAxis
              dependentAxis
              style={{
                axis: chartTheme.axis.style.axis,
                tickLabels: chartTheme.axis.style.tickLabels,
                grid: chartTheme.axis.style.grid,
              }}
              tickFormat={(t) => chartFormatters.abbreviateNumber(t)}
              label="Calories"
              axisLabelComponent={
                <VictoryLabel
                  dy={-30}
                  style={chartTheme.axis.style.axisLabel}
                />
              }
            />
            
            {/* Target Line */}
            {showTarget && (
              <VictoryLine
                data={[
                  { x: chartData[0]?.x, y: dailyTarget },
                  { x: chartData[chartData.length - 1]?.x, y: dailyTarget },
                ]}
                style={{
                  data: {
                    stroke: chartColors.calories.target,
                    strokeWidth: 2,
                    strokeDasharray: '5,5',
                  },
                }}
              />
            )}
            
            {/* Bar Chart */}
            <VictoryBar
              data={chartData}
              style={{
                data: {
                  fill: ({ datum }) => getBarColor(datum),
                  width: barWidth,
                },
              }}
              cornerRadius={{ top: 4 }}
              animate={{
                duration: 800,
                onLoad: { duration: 500 },
              }}
            />
          </VictoryChart>
        </View>
      </ScrollView>
      
      {/* Summary Stats */}
      <View style={{ 
        flexDirection: 'row', 
        justifyContent: 'space-around', 
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderTopWidth: 1,
        borderTopColor: chartTheme.axis.style.axis.stroke,
      }}>
        <View style={{ alignItems: 'center' }}>
          <Text style={{ fontSize: 12, color: chartTheme.axis.style.tickLabels.fill }}>
            Average
          </Text>
          <Text style={{ fontSize: 16, fontWeight: '600', color: chartTheme.axis.style.axisLabel.fill }}>
            {chartFormatters.calories(
              chartData.reduce((sum, d) => sum + d.y, 0) / chartData.length
            )}
          </Text>
        </View>
        <View style={{ alignItems: 'center' }}>
          <Text style={{ fontSize: 12, color: chartTheme.axis.style.tickLabels.fill }}>
            Total
          </Text>
          <Text style={{ fontSize: 16, fontWeight: '600', color: chartTheme.axis.style.axisLabel.fill }}>
            {chartFormatters.abbreviateNumber(
              chartData.reduce((sum, d) => sum + d.y, 0)
            )}
          </Text>
        </View>
        <View style={{ alignItems: 'center' }}>
          <Text style={{ fontSize: 12, color: chartTheme.axis.style.tickLabels.fill }}>
            Days on Target
          </Text>
          <Text style={{ fontSize: 16, fontWeight: '600', color: chartTheme.axis.style.axisLabel.fill }}>
            {chartData.filter(d => d.y >= dailyTarget * 0.9 && d.y <= dailyTarget * 1.1).length}
          </Text>
        </View>
      </View>
    </ChartContainer>
  );
};
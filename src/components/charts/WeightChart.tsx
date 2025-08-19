import React, { useMemo, useState } from 'react';
import { View, Dimensions, ScrollView, Text, TouchableOpacity } from 'react-native';
import {
  VictoryLine,
  VictoryArea,
  VictoryChart,
  VictoryAxis,
  VictoryLabel,
  VictoryScatter,
  VictoryContainer,
  VictoryTooltip,
  VictoryVoronoiContainer,
} from 'victory-native';
import { format, subDays, startOfDay } from 'date-fns';
import { useChartTheme, useChartColors, chartFormatters } from './common/ChartTheme';
import { ChartContainer, ChartPeriodSelector, ChartEmptyState } from './common/ChartContainer';
import { useWeightEntries } from '@/hooks/useWeightEntries';
import { useProfile } from '@/hooks/useProfile';

const { width: screenWidth } = Dimensions.get('window');

interface WeightChartProps {
  days?: number;
  showGoal?: boolean;
  chartType?: 'line' | 'area';
  height?: number;
}

const periodOptions = [
  { label: '7D', value: '7' },
  { label: '30D', value: '30' },
  { label: '90D', value: '90' },
];

export const WeightChart: React.FC<WeightChartProps> = ({
  days = 30,
  showGoal = true,
  chartType: initialChartType = 'line',
  height = 300,
}) => {
  const [selectedPeriod, setSelectedPeriod] = useState(days.toString());
  const [chartType, setChartType] = useState(initialChartType);
  const chartTheme = useChartTheme();
  const chartColors = useChartColors();
  const { profile } = useProfile();
  const { weightEntries, loading, error } = useWeightEntries();

  // Get weight goal and units
  const weightGoal = profile?.target_weight || 0;
  const weightUnit = profile?.preferred_units === 'imperial' ? 'lbs' : 'kg';

  // Prepare chart data
  const chartData = useMemo(() => {
    const periodDays = parseInt(selectedPeriod);
    const today = startOfDay(new Date());
    const data = [];

    // Sort weight entries by date
    const sortedEntries = [...(weightEntries || [])].sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    // Get entries within the period
    for (let i = periodDays - 1; i >= 0; i--) {
      const date = subDays(today, i);
      const dateStr = format(date, 'yyyy-MM-dd');
      
      // Find weight entry for this date
      const entry = sortedEntries.find(e => 
        format(new Date(e.date), 'yyyy-MM-dd') === dateStr
      );

      if (entry) {
        const weight = weightUnit === 'kg' && entry.weight 
          ? entry.weight * 0.453592 // Convert lbs to kg if needed
          : entry.weight;

        data.push({
          x: format(date, 'MMM dd'),
          y: parseFloat(weight.toFixed(1)),
          date: date,
          label: chartFormatters.weight(weight, weightUnit),
        });
      }
    }

    // If no data points, return empty array
    if (data.length === 0) return [];

    // Fill in missing data points with interpolation
    const filledData = [];
    for (let i = 0; i < data.length; i++) {
      filledData.push(data[i]);
      
      // Check if there's a gap to the next point
      if (i < data.length - 1) {
        const currentDate = data[i].date;
        const nextDate = data[i + 1].date;
        const daysDiff = Math.floor((nextDate - currentDate) / (1000 * 60 * 60 * 24));
        
        // If gap is more than 1 day, interpolate
        if (daysDiff > 1) {
          const weightDiff = data[i + 1].y - data[i].y;
          const weightPerDay = weightDiff / daysDiff;
          
          for (let j = 1; j < daysDiff; j++) {
            const interpolatedDate = new Date(currentDate);
            interpolatedDate.setDate(interpolatedDate.getDate() + j);
            const interpolatedWeight = data[i].y + (weightPerDay * j);
            
            filledData.push({
              x: format(interpolatedDate, 'MMM dd'),
              y: parseFloat(interpolatedWeight.toFixed(1)),
              date: interpolatedDate,
              label: chartFormatters.weight(interpolatedWeight, weightUnit),
              interpolated: true,
            });
          }
        }
      }
    }

    return filledData;
  }, [weightEntries, selectedPeriod, weightUnit]);

  // Calculate min/max for Y axis domain
  const { minY, maxY } = useMemo(() => {
    if (chartData.length === 0) {
      return { minY: 0, maxY: 100 };
    }
    
    const weights = [...chartData.map(d => d.y), weightGoal].filter(w => w > 0);
    const min = Math.min(...weights);
    const max = Math.max(...weights);
    const padding = (max - min) * 0.1 || 5;
    
    return {
      minY: Math.floor(min - padding),
      maxY: Math.ceil(max + padding),
    };
  }, [chartData, weightGoal]);

  // Calculate trend line
  const trendData = useMemo(() => {
    if (chartData.length < 2) return [];
    
    // Simple linear regression for trend line
    const n = chartData.length;
    const sumX = chartData.reduce((sum, _, i) => sum + i, 0);
    const sumY = chartData.reduce((sum, d) => sum + d.y, 0);
    const sumXY = chartData.reduce((sum, d, i) => sum + i * d.y, 0);
    const sumX2 = chartData.reduce((sum, _, i) => sum + i * i, 0);
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;
    
    return [
      { x: chartData[0].x, y: intercept },
      { x: chartData[chartData.length - 1].x, y: intercept + slope * (n - 1) },
    ];
  }, [chartData]);

  if (loading) {
    return (
      <ChartContainer
        title="Weight Progress"
        subtitle={weightGoal ? `Goal: ${chartFormatters.weight(weightGoal, weightUnit)}` : undefined}
        loading={true}
        height={height}
      />
    );
  }

  if (error) {
    return (
      <ChartContainer
        title="Weight Progress"
        subtitle={weightGoal ? `Goal: ${chartFormatters.weight(weightGoal, weightUnit)}` : undefined}
        error="Failed to load weight data"
        height={height}
      />
    );
  }

  if (chartData.length === 0) {
    return (
      <ChartContainer
        title="Weight Progress"
        subtitle={weightGoal ? `Goal: ${chartFormatters.weight(weightGoal, weightUnit)}` : undefined}
        height={height}
        actions={
          <ChartPeriodSelector
            periods={periodOptions}
            selectedPeriod={selectedPeriod}
            onPeriodChange={setSelectedPeriod}
          />
        }
      >
        <ChartEmptyState message="No weight entries for this period" />
      </ChartContainer>
    );
  }

  const chartWidth = Math.max(screenWidth - 32, 350);

  return (
    <ChartContainer
      title="Weight Progress"
      subtitle={weightGoal ? `Goal: ${chartFormatters.weight(weightGoal, weightUnit)}` : undefined}
      height={height}
      noPadding={true}
      actions={
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <View style={{ flexDirection: 'row', backgroundColor: chartTheme.axis.style.axis.stroke, borderRadius: 8, padding: 2 }}>
            <TouchableOpacity
              onPress={() => setChartType('line')}
              style={{
                paddingHorizontal: 12,
                paddingVertical: 6,
                borderRadius: 6,
                backgroundColor: chartType === 'line' ? chartColors.weight.actual : 'transparent',
              }}
            >
              <Text style={{ 
                fontSize: 12, 
                fontWeight: '500',
                color: chartType === 'line' ? '#FFFFFF' : chartTheme.axis.style.tickLabels.fill,
              }}>
                Line
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setChartType('area')}
              style={{
                paddingHorizontal: 12,
                paddingVertical: 6,
                borderRadius: 6,
                backgroundColor: chartType === 'area' ? chartColors.weight.actual : 'transparent',
              }}
            >
              <Text style={{ 
                fontSize: 12, 
                fontWeight: '500',
                color: chartType === 'area' ? '#FFFFFF' : chartTheme.axis.style.tickLabels.fill,
              }}>
                Area
              </Text>
            </TouchableOpacity>
          </View>
          <ChartPeriodSelector
            periods={periodOptions}
            selectedPeriod={selectedPeriod}
            onPeriodChange={setSelectedPeriod}
          />
        </View>
      }
    >
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={{ paddingHorizontal: 16 }}>
          <VictoryChart
            theme={chartTheme}
            width={chartWidth}
            height={height}
            padding={{ left: 70, bottom: 60, right: 40, top: 20 }}
            domain={{ y: [minY, maxY] }}
            containerComponent={
              <VictoryVoronoiContainer
                labels={({ datum }) => datum.label}
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
                  angle: chartData.length > 14 ? -45 : 0,
                  textAnchor: chartData.length > 14 ? 'end' : 'middle',
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
              tickFormat={(t) => t.toString()}
              label={`Weight (${weightUnit})`}
              axisLabelComponent={
                <VictoryLabel
                  dy={-30}
                  style={chartTheme.axis.style.axisLabel}
                />
              }
            />
            
            {/* Goal Line */}
            {showGoal && weightGoal > 0 && (
              <VictoryLine
                data={[
                  { x: chartData[0]?.x, y: weightGoal },
                  { x: chartData[chartData.length - 1]?.x, y: weightGoal },
                ]}
                style={{
                  data: {
                    stroke: chartColors.weight.goal,
                    strokeWidth: 2,
                    strokeDasharray: '5,5',
                  },
                }}
              />
            )}
            
            {/* Trend Line */}
            {trendData.length > 0 && (
              <VictoryLine
                data={trendData}
                style={{
                  data: {
                    stroke: chartColors.weight.trend,
                    strokeWidth: 1,
                    strokeDasharray: '2,2',
                    opacity: 0.5,
                  },
                }}
              />
            )}
            
            {/* Main Chart */}
            {chartType === 'area' ? (
              <VictoryArea
                data={chartData}
                style={{
                  data: {
                    fill: chartColors.weight.actual,
                    fillOpacity: 0.3,
                    stroke: chartColors.weight.actual,
                    strokeWidth: 2,
                  },
                }}
                interpolation="monotoneX"
                animate={{
                  duration: 800,
                  onLoad: { duration: 500 },
                }}
              />
            ) : (
              <VictoryLine
                data={chartData}
                style={{
                  data: {
                    stroke: chartColors.weight.actual,
                    strokeWidth: 2,
                  },
                }}
                interpolation="monotoneX"
                animate={{
                  duration: 800,
                  onLoad: { duration: 500 },
                }}
              />
            )}
            
            {/* Data Points */}
            <VictoryScatter
              data={chartData.filter(d => !d.interpolated)}
              size={4}
              style={{
                data: {
                  fill: chartColors.weight.actual,
                  stroke: chartTheme.axis.style.axis.stroke,
                  strokeWidth: 2,
                },
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
            Current
          </Text>
          <Text style={{ fontSize: 16, fontWeight: '600', color: chartTheme.axis.style.axisLabel.fill }}>
            {chartData.length > 0 ? chartFormatters.weight(chartData[chartData.length - 1].y, weightUnit) : '--'}
          </Text>
        </View>
        <View style={{ alignItems: 'center' }}>
          <Text style={{ fontSize: 12, color: chartTheme.axis.style.tickLabels.fill }}>
            Change
          </Text>
          <Text style={{ 
            fontSize: 16, 
            fontWeight: '600', 
            color: chartData.length > 1 && chartData[chartData.length - 1].y < chartData[0].y 
              ? chartColors.weight.goal 
              : chartColors.calories.high 
          }}>
            {chartData.length > 1 
              ? `${(chartData[chartData.length - 1].y - chartData[0].y > 0 ? '+' : '')}${(chartData[chartData.length - 1].y - chartData[0].y).toFixed(1)} ${weightUnit}`
              : '--'}
          </Text>
        </View>
        {weightGoal > 0 && (
          <View style={{ alignItems: 'center' }}>
            <Text style={{ fontSize: 12, color: chartTheme.axis.style.tickLabels.fill }}>
              To Goal
            </Text>
            <Text style={{ fontSize: 16, fontWeight: '600', color: chartTheme.axis.style.axisLabel.fill }}>
              {chartData.length > 0 
                ? chartFormatters.weight(Math.abs(chartData[chartData.length - 1].y - weightGoal), weightUnit)
                : '--'}
            </Text>
          </View>
        )}
      </View>
    </ChartContainer>
  );
};
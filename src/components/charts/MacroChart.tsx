import React, { useMemo, useState } from 'react';
import { View, Dimensions, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { PolarChart, Pie } from 'victory-native';
import { format, startOfDay } from 'date-fns';
import { useChartColors, chartFormatters } from './common/ChartTheme';
import { ChartContainer, ChartLegend, ChartEmptyState } from './common/ChartContainer';
import { useHistoricalAnalytics } from '@/hooks/useHistoricalAnalytics';
import { useProfile } from '@/hooks/useProfile';
import { useTheme } from '@/constants/theme';

const { width: screenWidth } = Dimensions.get('window');

interface MacroChartProps {
  date?: Date;
  showTargets?: boolean;
  height?: number;
}

export const MacroChart: React.FC<MacroChartProps> = ({
  date = new Date(),
  showTargets = true,
  height = 350,
}) => {
  const chartColors = useChartColors();
  const { colors } = useTheme();
  const { profile } = useProfile();
  
  // Get the date for historical analytics
  const dateString = format(date, 'yyyy-MM-dd');
  
  // Use historical analytics for the selected date
  const { foodLogs, isLoading } = useHistoricalAnalytics({
    timePeriod: 'custom',
    customDateRange: { start: dateString, end: dateString },
    includeStreaks: false,
    includeConsistency: false,
    includeTrends: false,
    includeComparisons: false,
    goalTypes: ['calories', 'protein', 'carbs', 'fat'],
  });

  // Calculate macro data for the selected date
  const macroData = useMemo(() => {
    if (isLoading || !foodLogs) {
      return {
        actual: { protein: 0, carbs: 0, fat: 0, calories: 0 },
      };
    }

    // Calculate total macros for the day from historical analytics data
    const totals = foodLogs.reduce((acc, log) => {
      acc.protein += log.protein_consumed || 0;
      acc.carbs += log.carbs_consumed || 0;
      acc.fat += log.fat_consumed || 0;
      acc.calories += log.calories_consumed || 0;
      return acc;
    }, { protein: 0, carbs: 0, fat: 0, calories: 0 });

    return {
      actual: {
        protein: Math.round(totals.protein),
        carbs: Math.round(totals.carbs),
        fat: Math.round(totals.fat),
        calories: Math.round(totals.calories),
      },
    };
  }, [foodLogs, isLoading]);

  // Prepare pie chart data
  const pieData = useMemo(() => {
    const { actual } = macroData;
    const total = (actual.protein * 4) + (actual.carbs * 4) + (actual.fat * 9);
    
    if (total === 0) return [];
    
    return [
      {
        label: 'Protein',
        value: actual.protein * 4,
        grams: actual.protein,
        percentage: Math.round((actual.protein * 4) / total * 100),
        color: chartColors.macros.protein,
      },
      {
        label: 'Carbs',
        value: actual.carbs * 4,
        grams: actual.carbs,
        percentage: Math.round((actual.carbs * 4) / total * 100),
        color: chartColors.macros.carbs,
      },
      {
        label: 'Fat',
        value: actual.fat * 9,
        grams: actual.fat,
        percentage: Math.round((actual.fat * 9) / total * 100),
        color: chartColors.macros.fat,
      },
    ].filter(item => item.value > 0);
  }, [macroData, chartColors]);

  const isEmpty = macroData.actual.protein === 0 && 
                  macroData.actual.carbs === 0 && 
                  macroData.actual.fat === 0;

  if (isEmpty) {
    return (
      <ChartContainer
        title="Macro Distribution"
        subtitle={format(date, 'MMMM dd, yyyy')}
        height={height}
      >
        <ChartEmptyState message="No macro data available for this date" />
      </ChartContainer>
    );
  }

  const styles = StyleSheet.create({
    chartWrapper: {
      alignItems: 'center',
      paddingVertical: 20,
    },
    centerLabel: {
      position: 'absolute',
      alignItems: 'center',
    },
    centerValue: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.text,
    },
    centerText: {
      fontSize: 12,
      color: colors.textSecondary,
    },
  });

  const chartWidth = Math.min(screenWidth - 64, 300);

  return (
    <ChartContainer
      title="Macro Distribution"
      subtitle={format(date, 'MMMM dd, yyyy')}
      height={height}
      noPadding={false}
    >
      <View style={styles.chartWrapper}>
        <PolarChart
          data={pieData}
          colorKey="color"
          labelKey="label"
          valueKey="value"
        >
          <Pie.Chart innerRadius={60} />
        </PolarChart>
        
        {/* Center label */}
        <View style={[styles.centerLabel, { top: height / 2 - 20 }]}>
          <Text style={styles.centerValue}>
            {chartFormatters.calories(macroData.actual.calories)}
          </Text>
          <Text style={styles.centerText}>Total</Text>
        </View>
      </View>

      {/* Legend */}
      <ChartLegend
        data={pieData.map(d => ({
          label: d.label,
          color: d.color,
          value: `${d.grams}g (${d.percentage}%)`,
        }))}
        horizontal={true}
      />
    </ChartContainer>
  );
};
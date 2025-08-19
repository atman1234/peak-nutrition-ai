import React, { useMemo, useState } from 'react';
import { View, ScrollView, Text, StyleSheet } from 'react-native';
import { CartesianChart, Line } from 'victory-native';
import { format, subDays, startOfDay } from 'date-fns';
import { useChartColors } from './common/ChartTheme';
import { ChartContainer, ChartPeriodSelector, ChartEmptyState } from './common/ChartContainer';
import { useHistoricalAnalytics } from '@/hooks/useHistoricalAnalytics';
import { useTheme } from '@/constants/theme';


interface MacroTrendsChartProps {
  days?: number;
  showTargets?: boolean;
  height?: number;
}

const periodOptions = [
  { label: '7D', value: '7' },
  { label: '14D', value: '14' },
  { label: '30D', value: '30' },
];

export const MacroTrendsChart: React.FC<MacroTrendsChartProps> = ({
  days = 14,
  height = 350,
}) => {
  const [selectedPeriod, setSelectedPeriod] = useState(days.toString());
  const chartColors = useChartColors();
  const { colors } = useTheme();
  
  // Use historical analytics for the selected period
  const periodDays = parseInt(selectedPeriod);
  const timePeriod = periodDays <= 7 ? '7d' : periodDays <= 30 ? '30d' : '90d';
  const { foodLogs, isLoading } = useHistoricalAnalytics({
    timePeriod,
    includeStreaks: false,
    includeConsistency: false,
    includeTrends: false,
    includeComparisons: false,
    goalTypes: ['protein', 'carbs', 'fat'],
  });

  // Simplified chart without press interactions for now

  // Prepare trend data
  const trendData = useMemo(() => {
    if (isLoading || !foodLogs) return [];

    const currentPeriodDays = parseInt(selectedPeriod);
    const today = startOfDay(new Date());
    const data = [];

    // Generate data for each day in the period
    for (let i = currentPeriodDays - 1; i >= 0; i--) {
      const date = subDays(today, i);
      const dateStr = format(date, 'yyyy-MM-dd');
      
      // Filter food logs for this date from historical analytics data
      const dayLogs = foodLogs.filter(log => {
        const timestamp = log.logged_at || log.created_at;
        if (!timestamp) return false;
        const logDate = format(new Date(timestamp), 'yyyy-MM-dd');
        return logDate === dateStr;
      });

      // Calculate total macros for the day
      const totals = dayLogs.reduce((acc, log) => {
        acc.protein += log.protein_consumed || 0;
        acc.carbs += log.carbs_consumed || 0;
        acc.fat += log.fat_consumed || 0;
        return acc;
      }, { protein: 0, carbs: 0, fat: 0 });

      data.push({
        day: format(date, 'MMM dd'),
        protein: Math.round(totals.protein),
        carbs: Math.round(totals.carbs),
        fat: Math.round(totals.fat),
        date: date,
      });
    }

    return data;
  }, [foodLogs, selectedPeriod, isLoading]);

  const isEmpty = trendData.every(d => d.protein === 0 && d.carbs === 0 && d.fat === 0);

  if (isEmpty) {
    return (
      <ChartContainer
        title="Macro Trends"
        subtitle="Daily macro intake over time"
        height={height}
        actions={
          <ChartPeriodSelector
            periods={periodOptions}
            selectedPeriod={selectedPeriod}
            onPeriodChange={setSelectedPeriod}
          />
        }
      >
        <ChartEmptyState message="No macro data available for this period" />
      </ChartContainer>
    );
  }

  const styles = StyleSheet.create({
    chartWrapper: {
      paddingHorizontal: 16,
    },
    legendContainer: {
      flexDirection: 'row',
      justifyContent: 'center',
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    legendItem: {
      alignItems: 'center',
      marginHorizontal: 12,
    },
    legendDot: {
      width: 12,
      height: 12,
      borderRadius: 6,
      marginBottom: 4,
    },
    legendLabel: {
      fontSize: 11,
      color: colors.textSecondary,
    },
    legendValue: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.text,
    },
  });

  // Calculate averages for legend
  const averages = useMemo(() => {
    if (trendData.length === 0) return { protein: 0, carbs: 0, fat: 0 };
    
    return {
      protein: Math.round(trendData.reduce((sum, d) => sum + d.protein, 0) / trendData.length),
      carbs: Math.round(trendData.reduce((sum, d) => sum + d.carbs, 0) / trendData.length),
      fat: Math.round(trendData.reduce((sum, d) => sum + d.fat, 0) / trendData.length),
    };
  }, [trendData]);

  return (
    <ChartContainer
      title="Macro Trends"
      subtitle="Daily macro intake over time"
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
        <View style={styles.chartWrapper}>
          <CartesianChart
            data={trendData}
            xKey="day"
            yKeys={["protein"]}
            domainPadding={{ left: 50, right: 50, top: 20, bottom: 50 }}
          >
            {({ points }) => (
              <>
                {/* Protein Line - only showing protein for simplicity */}
                <Line
                  points={points.protein}
                  color={chartColors.macros.protein}
                  strokeWidth={2}
                />
              </>
            )}
          </CartesianChart>
        </View>
      </ScrollView>
      
      {/* Legend */}
      <View style={styles.legendContainer}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: chartColors.macros.protein }]} />
          <Text style={styles.legendLabel}>Protein</Text>
          <Text style={styles.legendValue}>{averages.protein}g</Text>
          <Text style={styles.legendLabel}>avg</Text>
        </View>
      </View>
    </ChartContainer>
  );
};
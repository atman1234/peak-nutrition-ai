import React, { useState, useMemo } from 'react';
import { View, ScrollView, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme } from '@/constants/theme';

// Import all chart components
import { CalorieChart } from '@/components/charts/CalorieChart';
import { WeightChart } from '@/components/charts/WeightChart';
import { MacroChart } from '@/components/charts/MacroChart';
import { MacroTrendsChart } from '@/components/charts/MacroTrendsChart';
import { ComparativeChart } from '@/components/charts/ComparativeChart';
import { HistoricalGoalChart } from '@/components/charts/HistoricalGoalChart';
import { AIReviewTab } from '@/components/analytics/AIReviewTab';

export default function AnalyticsScreen() {
  const { colors } = useTheme();
  const [selectedTab, setSelectedTab] = useState('overview');

  const styles = useMemo(() => StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      paddingHorizontal: 16,
      paddingTop: 16,
      paddingBottom: 8,
    },
    title: {
      fontSize: 28,
      fontWeight: '700',
      color: colors.text,
      marginBottom: 8,
    },
    subtitle: {
      fontSize: 16,
      color: colors.textSecondary,
      marginBottom: 16,
    },
    tabContainer: {
      flexDirection: 'row',
      backgroundColor: colors.card,
      borderRadius: 12,
      padding: 4,
      marginBottom: 16,
    },
    tab: {
      flex: 1,
      paddingVertical: 8,
      paddingHorizontal: 12,
      borderRadius: 8,
      alignItems: 'center',
    },
    activeTab: {
      backgroundColor: colors.primary,
    },
    tabText: {
      fontSize: 14,
      fontWeight: '500',
      color: colors.textSecondary,
    },
    activeTabText: {
      color: '#FFFFFF',
    },
    scrollContent: {
      paddingHorizontal: 16,
      paddingBottom: 32,
    },
    sectionTitle: {
      fontSize: 20,
      fontWeight: '600',
      color: colors.text,
      marginTop: 24,
      marginBottom: 16,
    },
    chartSpacing: {
      marginBottom: 24,
    },
  }), [colors]);

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'trends', label: 'Trends' },
    { id: 'goals', label: 'Goals' },
    { id: 'compare', label: 'Compare' },
    { id: 'ai-review', label: 'AI Review' },
  ];

  const renderOverviewTab = () => (
    <>
      <Text style={styles.sectionTitle}>Daily Progress</Text>
      <View style={styles.chartSpacing}>
        <CalorieChart days={7} showTarget={true} />
      </View>
      
      <View style={styles.chartSpacing}>
        <MacroChart showTargets={true} />
      </View>
      
      <Text style={styles.sectionTitle}>Weight Progress</Text>
      <View style={styles.chartSpacing}>
        <WeightChart days={30} showGoal={true} chartType="line" />
      </View>
    </>
  );

  const renderTrendsTab = () => (
    <>
      <Text style={styles.sectionTitle}>Nutrition Trends</Text>
      <View style={styles.chartSpacing}>
        <CalorieChart days={30} showTarget={true} />
      </View>
      
      <View style={styles.chartSpacing}>
        <MacroTrendsChart days={14} showTargets={true} />
      </View>
      
      <Text style={styles.sectionTitle}>Weight Trends</Text>
      <View style={styles.chartSpacing}>
        <WeightChart days={90} showGoal={true} chartType="area" />
      </View>
    </>
  );

  const renderGoalsTab = () => (
    <>
      <Text style={styles.sectionTitle}>Goal Achievement</Text>
      <View style={styles.chartSpacing}>
        <HistoricalGoalChart days={30} goalType="calories" />
      </View>
      
      <View style={styles.chartSpacing}>
        <HistoricalGoalChart days={30} goalType="protein" />
      </View>
      
      <View style={styles.chartSpacing}>
        <HistoricalGoalChart days={90} goalType="weight" />
      </View>
    </>
  );

  const renderCompareTab = () => (
    <>
      <Text style={styles.sectionTitle}>Period Comparisons</Text>
      <View style={styles.chartSpacing}>
        <ComparativeChart comparisonType="week" metricType="calories" />
      </View>
      
      <View style={styles.chartSpacing}>
        <ComparativeChart comparisonType="month" metricType="macros" />
      </View>
      
      <View style={styles.chartSpacing}>
        <ComparativeChart comparisonType="week" metricType="weight" />
      </View>
    </>
  );

  const renderAIReviewTab = () => (
    <AIReviewTab initialTimePeriod="30d" />
  );

  const renderTabContent = () => {
    switch (selectedTab) {
      case 'overview':
        return renderOverviewTab();
      case 'trends':
        return renderTrendsTab();
      case 'goals':
        return renderGoalsTab();
      case 'compare':
        return renderCompareTab();
      case 'ai-review':
        return renderAIReviewTab();
      default:
        return renderOverviewTab();
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Analytics</Text>
        <Text style={styles.subtitle}>Track your progress and analyze your nutrition journey</Text>
        
        <View style={styles.tabContainer}>
          {tabs.map((tab) => (
            <TouchableOpacity
              key={tab.id}
              style={[styles.tab, selectedTab === tab.id && styles.activeTab]}
              onPress={() => setSelectedTab(tab.id)}
            >
              <Text style={[
                styles.tabText,
                selectedTab === tab.id && styles.activeTabText
              ]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <ScrollView 
        style={{ flex: 1 }}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {renderTabContent()}
      </ScrollView>
    </View>
  );
}
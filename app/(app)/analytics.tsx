import React, { useState, useMemo } from 'react';
import { View, ScrollView, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme } from '@/constants/theme';
import { MaterialCommunityIcons } from '@expo/vector-icons';

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
      paddingVertical: 10,
      paddingHorizontal: 8,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
    },
    activeTab: {
      backgroundColor: colors.primary + '15',
      shadowColor: colors.primary,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 2,
    },
    tabText: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.textSecondary,
      textAlign: 'center',
    },
    activeTabText: {
      color: colors.primary,
      fontWeight: '700',
    },
    scrollContent: {
      paddingHorizontal: 16,
      paddingBottom: 32,
    },
    sectionTitle: {
      fontSize: 20,
      fontWeight: '700',
      color: colors.text,
      marginTop: 24,
      marginBottom: 16,
    },
    chartSpacing: {
      marginBottom: 24,
    },
    chartCard: {
      backgroundColor: colors.card,
      borderRadius: 16,
      overflow: 'hidden',
    },
    headerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 8,
    },
    sectionIcon: {
      marginRight: 8,
    },
  }), [colors]);

  const tabs = [
    { id: 'overview', label: 'Overview', icon: 'view-dashboard' },
    { id: 'trends', label: 'Trends', icon: 'trending-up' },
    { id: 'goals', label: 'Goals', icon: 'target' },
    { id: 'compare', label: 'Compare', icon: 'compare' },
    { id: 'ai-review', label: 'AI Review', icon: 'brain' },
  ];

  const renderOverviewTab = () => (
    <>
      <View style={[styles.sectionTitle, { flexDirection: 'row', alignItems: 'center' }]}>
        <MaterialCommunityIcons 
          name="chart-line" 
          size={22} 
          color="#3B82F6" 
          style={styles.sectionIcon} 
        />
        <Text style={styles.sectionTitle}>Daily Progress</Text>
      </View>
      <View style={styles.chartSpacing}>
        <View style={styles.chartCard}>
          <CalorieChart days={7} showTarget={true} />
        </View>
      </View>
      
      <View style={styles.chartSpacing}>
        <View style={styles.chartCard}>
          <MacroChart showTargets={true} />
        </View>
      </View>
      
      <View style={[styles.sectionTitle, { flexDirection: 'row', alignItems: 'center' }]}>
        <MaterialCommunityIcons 
          name="scale" 
          size={22} 
          color="#10B981" 
          style={styles.sectionIcon} 
        />
        <Text style={styles.sectionTitle}>Weight Progress</Text>
      </View>
      <View style={styles.chartSpacing}>
        <View style={styles.chartCard}>
          <WeightChart days={30} showGoal={true} />
        </View>
      </View>
    </>
  );

  const renderTrendsTab = () => (
    <>
      <View style={[styles.sectionTitle, { flexDirection: 'row', alignItems: 'center' }]}>
        <MaterialCommunityIcons 
          name="trending-up" 
          size={22} 
          color="#8B5CF6" 
          style={styles.sectionIcon} 
        />
        <Text style={styles.sectionTitle}>Nutrition Trends</Text>
      </View>
      <View style={styles.chartSpacing}>
        <View style={styles.chartCard}>
          <CalorieChart days={30} showTarget={true} />
        </View>
      </View>
      
      <View style={styles.chartSpacing}>
        <View style={styles.chartCard}>
          <MacroTrendsChart days={14} showTargets={true} />
        </View>
      </View>
      
      <View style={[styles.sectionTitle, { flexDirection: 'row', alignItems: 'center' }]}>
        <MaterialCommunityIcons 
          name="scale" 
          size={22} 
          color="#F59E0B" 
          style={styles.sectionIcon} 
        />
        <Text style={styles.sectionTitle}>Weight Trends</Text>
      </View>
      <View style={styles.chartSpacing}>
        <View style={styles.chartCard}>
          <WeightChart days={90} showGoal={true} />
        </View>
      </View>
    </>
  );

  const renderGoalsTab = () => (
    <>
      <View style={[styles.sectionTitle, { flexDirection: 'row', alignItems: 'center' }]}>
        <MaterialCommunityIcons 
          name="target" 
          size={22} 
          color="#EF4444" 
          style={styles.sectionIcon} 
        />
        <Text style={styles.sectionTitle}>Goal Achievement</Text>
      </View>
      <View style={styles.chartSpacing}>
        <View style={styles.chartCard}>
          <HistoricalGoalChart days={30} goalType="calories" />
        </View>
      </View>
      
      <View style={styles.chartSpacing}>
        <View style={styles.chartCard}>
          <HistoricalGoalChart days={30} goalType="protein" />
        </View>
      </View>
      
      <View style={styles.chartSpacing}>
        <View style={styles.chartCard}>
          <HistoricalGoalChart days={90} goalType="weight" />
        </View>
      </View>
    </>
  );

  const renderCompareTab = () => (
    <>
      <View style={[styles.sectionTitle, { flexDirection: 'row', alignItems: 'center' }]}>
        <MaterialCommunityIcons 
          name="compare" 
          size={22} 
          color="#06B6D4" 
          style={styles.sectionIcon} 
        />
        <Text style={styles.sectionTitle}>Period Comparisons</Text>
      </View>
      <View style={styles.chartSpacing}>
        <View style={styles.chartCard}>
          <ComparativeChart comparisonType="week" metricType="calories" />
        </View>
      </View>
      
      <View style={styles.chartSpacing}>
        <View style={styles.chartCard}>
          <ComparativeChart comparisonType="month" metricType="macros" />
        </View>
      </View>
      
      <View style={styles.chartSpacing}>
        <View style={styles.chartCard}>
          <ComparativeChart comparisonType="week" metricType="weight" />
        </View>
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
        <View style={styles.headerRow}>
          <MaterialCommunityIcons name="chart-line" size={28} color={colors.primary} />
          <Text style={styles.title}>Analytics</Text>
        </View>
        <Text style={styles.subtitle}>Track your progress and analyze your nutrition journey</Text>
        
        <View style={styles.tabContainer}>
          {tabs.map((tab) => (
            <TouchableOpacity
              key={tab.id}
              style={[styles.tab, selectedTab === tab.id && styles.activeTab]}
              onPress={() => setSelectedTab(tab.id)}
            >
              <MaterialCommunityIcons 
                name={tab.icon as any} 
                size={18} 
                color={selectedTab === tab.id ? colors.primary : colors.textSecondary} 
                style={{ marginBottom: 4 }}
              />
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
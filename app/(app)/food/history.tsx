import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList } from 'react-native';
import { Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useFoodLogs } from '../../../src/hooks/useFoodLogs';
import { getTodayLocalDate } from '../../../src/lib/date-utils';
import { Colors, TextStyles, Spacing } from '../../../src/constants';
import { LoadingSpinner, Card, Button } from '../../../src/components/ui';
import { TodaysFoodLog } from '../../../src/components/food';

export default function FoodHistory() {
  const [selectedDate, setSelectedDate] = useState(getTodayLocalDate());
  const { foodLogs, dailySummary, isLoading, refetch } = useFoodLogs(selectedDate);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString + 'T00:00:00');
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    const isToday = dateString === getTodayLocalDate();
    const isYesterday = dateString === yesterday.toISOString().split('T')[0];
    
    if (isToday) return 'Today';
    if (isYesterday) return 'Yesterday';
    
    return date.toLocaleDateString([], { 
      weekday: 'long', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const navigateDate = (direction: 'prev' | 'next') => {
    const currentDate = new Date(selectedDate + 'T00:00:00');
    if (direction === 'prev') {
      currentDate.setDate(currentDate.getDate() - 1);
    } else {
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    const newDateString = currentDate.toISOString().split('T')[0];
    setSelectedDate(newDateString);
  };

  const isToday = selectedDate === getTodayLocalDate();
  const isFuture = new Date(selectedDate + 'T00:00:00') > new Date();

  if (isLoading) {
    return (
      <View style={styles.container}>
        <Stack.Screen 
          options={{
            title: 'Food History',
            headerShown: true,
            headerStyle: {
              backgroundColor: Colors.midnight,
            },
            headerTintColor: Colors.surface,
          }}
        />
        <LoadingSpinner fullscreen text="Loading food history..." />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen 
        options={{
          title: 'Food History',
          headerShown: true,
          headerStyle: {
            backgroundColor: Colors.midnight,
          },
          headerTintColor: Colors.surface,
        }}
      />
      
      <View style={styles.dateNavigator}>
        <TouchableOpacity
          style={styles.navButton}
          onPress={() => navigateDate('prev')}
        >
          <Ionicons name="chevron-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        
        <View style={styles.dateInfo}>
          <Text style={styles.dateText}>{formatDate(selectedDate)}</Text>
          <Text style={styles.dateSubtext}>
            {new Date(selectedDate + 'T00:00:00').toLocaleDateString()}
          </Text>
        </View>
        
        <TouchableOpacity
          style={[styles.navButton, isFuture && styles.navButtonDisabled]}
          onPress={() => navigateDate('next')}
          disabled={isFuture}
        >
          <Ionicons 
            name="chevron-forward" 
            size={24} 
            color={isFuture ? Colors.textSecondary : Colors.text} 
          />
        </TouchableOpacity>
      </View>

      {foodLogs.length > 0 ? (
        <View style={styles.summaryCard}>
          <Card style={styles.daySummary}>
            <View style={styles.summaryHeader}>
              <Text style={styles.summaryTitle}>Daily Summary</Text>
              <Text style={styles.summarySubtitle}>
                {foodLogs.length} {foodLogs.length === 1 ? 'item' : 'items'} logged
              </Text>
            </View>
            
            <View style={styles.summaryStats}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{Math.round(dailySummary.totalCalories)}</Text>
                <Text style={styles.statLabel}>Calories</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{Math.round(dailySummary.totalProtein)}g</Text>
                <Text style={styles.statLabel}>Protein</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{Math.round(dailySummary.totalCarbs)}g</Text>
                <Text style={styles.statLabel}>Carbs</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{Math.round(dailySummary.totalFat)}g</Text>
                <Text style={styles.statLabel}>Fat</Text>
              </View>
            </View>
          </Card>
        </View>
      ) : null}

      <View style={styles.foodLogContainer}>
        {foodLogs.length > 0 ? (
          <TodaysFoodLog
            onRefresh={refetch}
            refreshing={false}
          />
        ) : (
          <Card style={styles.emptyState}>
            <Ionicons name="restaurant-outline" size={48} color={Colors.textSecondary} />
            <Text style={styles.emptyTitle}>
              No foods logged {isToday ? 'today' : 'on this date'}
            </Text>
            <Text style={styles.emptySubtext}>
              {isToday 
                ? 'Start tracking your meals to see your daily progress'
                : 'Try a different date or start logging meals today'
              }
            </Text>
            {isToday && (
              <Button
                title="Log Food Now"
                onPress={() => {/* Navigate to food logging */}}
                variant="primary"
                style={styles.emptyButton}
              />
            )}
          </Card>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  dateNavigator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  navButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.backgroundSecondary,
  },
  navButtonDisabled: {
    opacity: 0.5,
  },
  dateInfo: {
    alignItems: 'center',
    flex: 1,
  },
  dateText: {
    ...TextStyles.h4,
    color: Colors.text,
    fontWeight: '600',
  },
  dateSubtext: {
    ...TextStyles.caption,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
  },
  summaryCard: {
    padding: Spacing.md,
  },
  daySummary: {
    padding: Spacing.md,
  },
  summaryHeader: {
    marginBottom: Spacing.md,
  },
  summaryTitle: {
    ...TextStyles.h4,
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  summarySubtitle: {
    ...TextStyles.caption,
    color: Colors.textSecondary,
  },
  summaryStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    ...TextStyles.body,
    color: Colors.text,
    fontWeight: '700',
    fontSize: 18,
    marginBottom: Spacing.xs,
  },
  statLabel: {
    ...TextStyles.caption,
    color: Colors.textSecondary,
    fontSize: 11,
  },
  foodLogContainer: {
    flex: 1,
    paddingHorizontal: Spacing.md,
  },
  emptyState: {
    padding: Spacing.xl,
    alignItems: 'center',
    marginTop: Spacing.xl,
  },
  emptyTitle: {
    ...TextStyles.h4,
    color: Colors.text,
    textAlign: 'center',
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
  },
  emptySubtext: {
    ...TextStyles.body,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: Spacing.lg,
  },
  emptyButton: {
    minWidth: 150,
  },
});
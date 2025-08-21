import React from 'react';
import { View, StyleSheet, Dimensions, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { QuickFoodAdd, TodaysFoodLog } from '../../../src/components/food';
import { useTheme, Spacing } from '../../../src/constants';

const { width } = Dimensions.get('window');
const isTablet = width >= 768;

export default function FoodLogScreen() {
  const router = useRouter();
  const { colors } = useTheme();

  const handleSuccess = () => {
    // Don't navigate away - let user continue adding foods
    // The TodaysFoodLog will automatically update with new entries
  };

  const handleCancel = () => {
    // Navigate back to dashboard
    router.push('/');
  };

  const handleEditEntry = (entryId: string) => {
    // TODO: Implement edit functionality
    console.log('Edit entry:', entryId);
  };

  const handleDeleteEntry = (entryId: string) => {
    // TODO: Implement delete functionality  
    console.log('Delete entry:', entryId);
  };

  const styles = React.useMemo(() => StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    tabletContainer: {
      flexDirection: 'row',
      gap: Spacing.lg,
      padding: Spacing.md,
    },
    mobileContainer: {
      flex: 1,
    },
    leftColumn: {
      flex: Platform.OS === 'web' ? 0.4 : 1,
      minWidth: Platform.OS === 'web' ? 400 : undefined,
    },
    rightColumn: {
      flex: Platform.OS === 'web' ? 0.6 : 1,
      minWidth: Platform.OS === 'web' ? 500 : undefined,
    },
  }), [colors]);

  if (isTablet && Platform.OS === 'web') {
    return (
      <View style={styles.container}>
        <View style={styles.tabletContainer}>
          <View style={styles.leftColumn}>
            <QuickFoodAdd
              onSuccess={handleSuccess}
              onCancel={handleCancel}
              showAsFavorite={true}
            />
          </View>
          <View style={styles.rightColumn}>
            <TodaysFoodLog
              onEditEntry={handleEditEntry}
              onDeleteEntry={handleDeleteEntry}
            />
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.mobileContainer}>
        <QuickFoodAdd
          onSuccess={handleSuccess}
          onCancel={handleCancel}
          showAsFavorite={true}
        />
      </View>
    </View>
  );
}
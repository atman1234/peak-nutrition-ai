import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { QuickFoodAdd } from '../../../src/components/food';
import { useTheme } from '../../../src/constants';

export default function FoodLogScreen() {
  const router = useRouter();
  const { colors } = useTheme();

  const handleSuccess = () => {
    // Navigate back to dashboard to see the updated stats
    router.push('/');
  };

  const handleCancel = () => {
    // Navigate back to dashboard
    router.push('/');
  };

  const styles = React.useMemo(() => StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
  }), [colors]);

  return (
    <View style={styles.container}>
      <QuickFoodAdd
        onSuccess={handleSuccess}
        onCancel={handleCancel}
        showAsFavorite={true}
      />
    </View>
  );
}
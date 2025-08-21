import React, { useCallback } from 'react';
import { View, Text, StyleSheet, Pressable, Alert, Platform } from 'react-native';
import * as Haptics from 'expo-haptics';

// Platform-specific imports
let Gesture, GestureDetector, Animated, useSharedValue, useAnimatedStyle, withSpring, runOnJS, interpolateColor;

if (Platform.OS !== 'web') {
  const gestureHandler = require('react-native-gesture-handler');
  const reanimated = require('react-native-reanimated');
  
  Gesture = gestureHandler.Gesture;
  GestureDetector = gestureHandler.GestureDetector;
  Animated = reanimated.default;
  useSharedValue = reanimated.useSharedValue;
  useAnimatedStyle = reanimated.useAnimatedStyle;
  withSpring = reanimated.withSpring;
  runOnJS = reanimated.runOnJS;
  interpolateColor = reanimated.interpolateColor;
} else {
  // Web fallbacks
  Animated = View;
  useSharedValue = (val) => ({ value: val });
  useAnimatedStyle = (fn) => ({});
  withSpring = (val) => val;
  runOnJS = (fn) => fn;
  interpolateColor = () => '#000';
  Gesture = { Pan: () => ({ onUpdate: () => {}, onEnd: () => {} }) };
  GestureDetector = ({ children }) => children;
}

import { Ionicons } from '@expo/vector-icons';
import { FoodLog } from '../../types/food';
import { useTheme, TextStyles, Spacing } from '../../constants';

interface SwipeableFoodEntryProps {
  foodLog: FoodLog;
  onEdit?: (entryId: string) => void;
  onDelete?: (entryId: string) => void;
  onDuplicate?: (entryId: string) => void;
  onAddToFavorites?: (entryId: string) => void;
  showDetails?: boolean;
  enableHapticFeedback?: boolean;
}

export function SwipeableFoodEntry({
  foodLog,
  onEdit,
  onDelete,
  onDuplicate,
  onAddToFavorites,
  showDetails = false,
  enableHapticFeedback = true,
}: SwipeableFoodEntryProps) {
  const { colors } = useTheme();
  const translateX = useSharedValue(0);
  const scale = useSharedValue(1);
  
  // Action thresholds
  const EDIT_THRESHOLD = 80;
  const DELETE_THRESHOLD = -120;
  const DUPLICATE_THRESHOLD = 160;
  
  const hapticFeedback = useCallback(async (type: 'selection' | 'light' | 'medium' | 'heavy' = 'light') => {
    if (!enableHapticFeedback) return;
    
    switch (type) {
      case 'selection':
        await Haptics.selectionAsync();
        break;
      case 'light':
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        break;
      case 'medium':
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        break;
      case 'heavy':
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        break;
    }
  }, [enableHapticFeedback]);

  const handleEdit = useCallback(() => {
    hapticFeedback('medium');
    onEdit?.(foodLog.id);
  }, [foodLog.id, onEdit, hapticFeedback]);

  const handleDelete = useCallback(() => {
    Alert.alert(
      'Delete Food Entry',
      `Are you sure you want to delete "${foodLog.food_name}"?`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
          onPress: () => hapticFeedback('light'),
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            hapticFeedback('heavy');
            onDelete?.(foodLog.id);
          },
        },
      ]
    );
  }, [foodLog, onDelete, hapticFeedback]);

  const handleDuplicate = useCallback(() => {
    hapticFeedback('medium');
    onDuplicate?.(foodLog.id);
  }, [foodLog.id, onDuplicate, hapticFeedback]);

  const handleAddToFavorites = useCallback(() => {
    hapticFeedback('selection');
    onAddToFavorites?.(foodLog.id);
  }, [foodLog.id, onAddToFavorites, hapticFeedback]);

  const panGesture = Gesture.Pan()
    .onBegin(() => {
      hapticFeedback('selection');
    })
    .onUpdate((event) => {
      translateX.value = event.translationX;
      
      // Scale effect for feedback
      const absTranslation = Math.abs(event.translationX);
      scale.value = withSpring(1 + absTranslation * 0.001);
      
      // Haptic feedback at thresholds
      if (Math.abs(event.translationX) > EDIT_THRESHOLD && Math.abs(translateX.value) <= EDIT_THRESHOLD) {
        runOnJS(hapticFeedback)('light');
      }
      if (Math.abs(event.translationX) > DELETE_THRESHOLD && Math.abs(translateX.value) <= DELETE_THRESHOLD) {
        runOnJS(hapticFeedback)('medium');
      }
    })
    .onEnd((event) => {
      const { translationX, velocityX } = event;
      
      // Determine action based on swipe distance and velocity
      if (translationX > DUPLICATE_THRESHOLD && onDuplicate) {
        runOnJS(handleDuplicate)();
      } else if (translationX > EDIT_THRESHOLD && onEdit) {
        runOnJS(handleEdit)();
      } else if (translationX < DELETE_THRESHOLD && onDelete) {
        runOnJS(handleDelete)();
      }
      
      // Reset position
      translateX.value = withSpring(0, { damping: 20, stiffness: 200 });
      scale.value = withSpring(1, { damping: 20, stiffness: 200 });
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { scale: scale.value },
    ],
  }));

  const backgroundStyle = useAnimatedStyle(() => {
    const backgroundColor = interpolateColor(
      translateX.value,
      [-DELETE_THRESHOLD, 0, EDIT_THRESHOLD, DUPLICATE_THRESHOLD],
      [colors.error, colors.surface, colors.primary, colors.success]
    );
    
    return { backgroundColor };
  });

  const formatTime = useCallback((timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }, []);

  return (
    <View style={styles.container}>
      {/* Background actions */}
      <Animated.View style={[styles.backgroundActions, backgroundStyle]}>
        {/* Left action - Delete */}
        {translateX.value < -EDIT_THRESHOLD && onDelete && (
          <View style={[styles.actionContainer, styles.leftAction]}>
            <Ionicons name="trash-outline" size={24} color={colors.white} />
            <Text style={[styles.actionText, { color: colors.white }]}>Delete</Text>
          </View>
        )}
        
        {/* Right actions */}
        {translateX.value > EDIT_THRESHOLD && (
          <View style={[styles.actionContainer, styles.rightActions]}>
            {/* Edit */}
            {onEdit && (
              <View style={styles.actionItem}>
                <Ionicons name="create-outline" size={24} color={colors.white} />
                <Text style={[styles.actionText, { color: colors.white }]}>Edit</Text>
              </View>
            )}
            
            {/* Duplicate */}
            {translateX.value > DUPLICATE_THRESHOLD && onDuplicate && (
              <View style={styles.actionItem}>
                <Ionicons name="copy-outline" size={24} color={colors.white} />
                <Text style={[styles.actionText, { color: colors.white }]}>Duplicate</Text>
              </View>
            )}
          </View>
        )}
      </Animated.View>

      {/* Main content */}
      <GestureDetector gesture={panGesture}>
        <Animated.View style={[styles.contentContainer, animatedStyle]}>
          <View style={[styles.card, { backgroundColor: colors.surface }]}>
            <View style={styles.header}>
              <View style={styles.foodInfo}>
                <Text style={[styles.foodName, { color: colors.text }]} numberOfLines={1}>
                  {foodLog.food_name}
                </Text>
                {foodLog.brand && (
                  <Text style={[styles.brandName, { color: colors.textSecondary }]} numberOfLines={1}>
                    {foodLog.brand}
                  </Text>
                )}
              </View>
              
              <View style={styles.quickActions}>
                {onAddToFavorites && (
                  <Pressable style={styles.quickAction} onPress={handleAddToFavorites}>
                    <Ionicons name="heart-outline" size={20} color={colors.textSecondary} />
                  </Pressable>
                )}
                
                <Text style={[styles.timestamp, { color: colors.textTertiary }]}>
                  {formatTime(foodLog.logged_at)}
                </Text>
              </View>
            </View>

            <View style={styles.nutrition}>
              <View style={styles.portion}>
                <Text style={[styles.portionText, { color: colors.text }]}>
                  {foodLog.portion_grams}g
                </Text>
                <Text style={[styles.caloriesText, { color: colors.primary }]}>
                  {Math.round(foodLog.calories_consumed)} cal
                </Text>
              </View>
              
              {(showDetails || foodLog.protein_consumed || foodLog.carbs_consumed || foodLog.fat_consumed) && (
                <View style={styles.macros}>
                  {foodLog.protein_consumed && (
                    <Text style={[styles.macroText, { color: colors.textSecondary }]}>
                      P: {Math.round(foodLog.protein_consumed)}g
                    </Text>
                  )}
                  {foodLog.carbs_consumed && (
                    <Text style={[styles.macroText, { color: colors.textSecondary }]}>
                      C: {Math.round(foodLog.carbs_consumed)}g
                    </Text>
                  )}
                  {foodLog.fat_consumed && (
                    <Text style={[styles.macroText, { color: colors.textSecondary }]}>
                      F: {Math.round(foodLog.fat_consumed)}g
                    </Text>
                  )}
                </View>
              )}
            </View>

            {showDetails && foodLog.notes && (
              <View style={styles.notesContainer}>
                <Text style={[styles.notes, { color: colors.textSecondary }]} numberOfLines={2}>
                  {foodLog.notes}
                </Text>
              </View>
            )}

            {/* Swipe indicator */}
            <View style={styles.swipeIndicator}>
              <View style={[styles.swipeHandle, { backgroundColor: colors.border }]} />
            </View>
          </View>
        </Animated.View>
      </GestureDetector>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: Spacing.xs,
  },
  backgroundActions: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: Spacing.borderRadius.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
  },
  actionContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  leftAction: {
    flexDirection: 'column',
  },
  rightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xl,
  },
  actionItem: {
    alignItems: 'center',
  },
  actionText: {
    ...TextStyles.caption,
    fontWeight: '600',
    marginTop: Spacing.xs,
  },
  contentContainer: {
    backgroundColor: 'transparent',
  },
  card: {
    padding: Spacing.md,
    borderRadius: Spacing.borderRadius.md,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.sm,
  },
  foodInfo: {
    flex: 1,
    marginRight: Spacing.md,
  },
  foodName: {
    ...TextStyles.body,
    fontWeight: '600',
    marginBottom: 2,
  },
  brandName: {
    ...TextStyles.caption,
  },
  quickActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  quickAction: {
    padding: Spacing.xs,
  },
  timestamp: {
    ...TextStyles.caption,
    fontSize: 11,
  },
  nutrition: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  portion: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: Spacing.sm,
  },
  portionText: {
    ...TextStyles.body,
    fontWeight: '500',
  },
  caloriesText: {
    ...TextStyles.body,
    fontWeight: '700',
  },
  macros: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  macroText: {
    ...TextStyles.caption,
    fontSize: 11,
  },
  notesContainer: {
    marginTop: Spacing.sm,
    paddingTop: Spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#e0e0e0',
  },
  notes: {
    ...TextStyles.caption,
    lineHeight: 16,
    fontStyle: 'italic',
  },
  swipeIndicator: {
    position: 'absolute',
    right: Spacing.md,
    top: '50%',
    transform: [{ translateY: -1 }],
  },
  swipeHandle: {
    width: 3,
    height: 20,
    borderRadius: 1.5,
  },
});
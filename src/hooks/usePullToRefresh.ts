import { useState, useCallback } from 'react';
import * as Haptics from 'expo-haptics';

interface UsePullToRefreshOptions {
  onRefresh: () => Promise<void> | void;
  enableHapticFeedback?: boolean;
  minimumRefreshTime?: number; // Minimum time to show refreshing state (for better UX)
}

interface PullToRefreshState {
  isRefreshing: boolean;
  refresh: () => Promise<void>;
  refreshControl: {
    refreshing: boolean;
    onRefresh: () => void;
  };
}

export function usePullToRefresh({
  onRefresh,
  enableHapticFeedback = true,
  minimumRefreshTime = 800, // 800ms minimum
}: UsePullToRefreshOptions): PullToRefreshState {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const refresh = useCallback(async () => {
    if (isRefreshing) return;

    setIsRefreshing(true);
    
    // Haptic feedback at the start of refresh
    if (enableHapticFeedback) {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    const startTime = Date.now();

    try {
      await onRefresh();
    } catch (error) {
      console.warn('Refresh failed:', error);
      
      // Error haptic feedback
      if (enableHapticFeedback) {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    }

    // Ensure minimum refresh time for better UX
    const elapsedTime = Date.now() - startTime;
    if (elapsedTime < minimumRefreshTime) {
      await new Promise(resolve => setTimeout(resolve, minimumRefreshTime - elapsedTime));
    }

    setIsRefreshing(false);
    
    // Success haptic feedback
    if (enableHapticFeedback) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  }, [isRefreshing, onRefresh, enableHapticFeedback, minimumRefreshTime]);

  const refreshControl = {
    refreshing: isRefreshing,
    onRefresh: refresh,
  };

  return {
    isRefreshing,
    refresh,
    refreshControl,
  };
}
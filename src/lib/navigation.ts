import { router } from 'expo-router';

export const navigation = {
  navigate: (path: string) => router.push(path as any),
  replace: (path: string) => router.replace(path as any),
  back: () => router.back(),
  canGoBack: () => router.canGoBack(),
  
  // Auth flow navigation
  goToLogin: () => router.replace('/login'),
  goToSignup: () => router.replace('/signup'),
  goToDashboard: () => router.replace('/'),
  goToProfileSetup: () => router.replace('/profile/setup'),
  
  // Main app navigation
  goToFood: () => router.push('/food'),
  goToFoodHistory: () => router.push('/food/history'),
  goToAnalytics: () => router.push('/analytics'),
  goToProfile: () => router.push('/profile'),
  
  // Helper to clear navigation stack and go to auth
  resetToAuth: () => {
    router.replace('/login');
  },
  
  // Helper to clear navigation stack and go to app
  resetToApp: () => {
    router.replace('/');
  },
};

// Type-safe route params helper
export function getRouteParams<T = Record<string, string>>(): T {
  // This would be implemented with useLocalSearchParams in the actual component
  return {} as T;
}
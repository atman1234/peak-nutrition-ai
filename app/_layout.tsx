import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '../src/components/auth/AuthContext';
import * as SplashScreen from 'expo-splash-screen';
import * as Linking from 'expo-linking';
import '../global.css'; // NativeWind global styles

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

// Deep linking configuration
export const unstable_settings = {
  initialRouteName: 'index',
};

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 2,
    },
  },
});

export default function RootLayout() {
  useEffect(() => {
    // Hide splash screen after a short delay
    const timeout = setTimeout(() => {
      SplashScreen.hideAsync();
    }, 1000);

    return () => clearTimeout(timeout);
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Stack
          screenOptions={{
            headerShown: false,
            animation: 'slide_from_right',
          }}
        >
          <Stack.Screen 
            name="index" 
            options={{ 
              headerShown: false 
            }} 
          />
          <Stack.Screen 
            name="(auth)" 
            options={{ 
              headerShown: false,
              animation: 'fade',
            }} 
          />
          <Stack.Screen 
            name="(app)" 
            options={{ 
              headerShown: false 
            }} 
          />
        </Stack>
      </AuthProvider>
    </QueryClientProvider>
  );
}
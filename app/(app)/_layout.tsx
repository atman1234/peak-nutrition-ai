import { useEffect } from 'react';
import { Tabs, useRouter, useSegments } from 'expo-router';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuthContext } from '../../src/components/auth/AuthContext';
import { useProfile } from '../../src/hooks/useProfile';

export default function AppLayout() {
  const { user, loading: authLoading } = useAuthContext();
  const { profile, isLoading: profileLoading } = useProfile();
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    console.log('App layout effect - authLoading:', authLoading, 'user:', !!user, 'profileLoading:', profileLoading, 'profile:', !!profile, 'segments:', segments);
    if (!authLoading) {
      // If not authenticated, redirect to login
      if (!user) {
        console.log('No user in app layout, redirecting to login');
        router.replace('/login');
      }
      // If authenticated but no profile and not on setup page, redirect to profile setup
      else if (!profileLoading && !profile && !segments.includes('setup')) {
        console.log('User authenticated but no profile, redirecting to setup');
        router.replace('/profile/setup');
      } else if (user && profile) {
        console.log('User authenticated with profile, staying in app');
      }
    }
  }, [user, authLoading, profile, profileLoading, segments]);

  // Show loading screen while checking auth and profile
  if (authLoading || (user && profileLoading)) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#F59E0B" />
      </View>
    );
  }

  // Don't render tabs if user is not authenticated
  if (!user) {
    return null;
  }

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#F59E0B',
        tabBarInactiveTintColor: '#64748B',
        tabBarStyle: {
          backgroundColor: '#0F172A',
          borderTopColor: '#334155',
          borderTopWidth: 1,
          paddingTop: 5,
          paddingBottom: 5,
          height: 60,
        },
        headerStyle: {
          backgroundColor: '#0F172A',
        },
        headerTintColor: 'white',
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'home' : 'home-outline'} size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="food"
        options={{
          title: 'Food',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'restaurant' : 'restaurant-outline'} size={24} color={color} />
          ),
          headerShown: false,
        }}
      />
      <Tabs.Screen
        name="analytics"
        options={{
          title: 'Analytics',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'analytics' : 'analytics-outline'} size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'person' : 'person-outline'} size={24} color={color} />
          ),
          headerShown: false,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
});
import { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthContext } from '../src/components/auth/AuthContext';

export default function Index() {
  const router = useRouter();
  const { user, loading } = useAuthContext();

  useEffect(() => {
    console.log('Root navigation effect - loading:', loading, 'user:', !!user);
    if (!loading) {
      // Redirect based on authentication status
      if (user) {
        console.log('User authenticated, navigating to app');
        router.replace('/(app)');
      } else {
        console.log('User not authenticated, navigating to login');
        router.replace('/(auth)/login');
      }
    }
  }, [user, loading]);

  // Show loading screen while checking auth
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#F59E0B" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0F172A',
  },
});
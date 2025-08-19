import { useRouter, useSegments, useLocalSearchParams } from 'expo-router';
import { useCallback } from 'react';
import { useAuthContext } from '../components/auth/AuthContext';

export function useNavigationHelpers() {
  const router = useRouter();
  const segments = useSegments();
  const params = useLocalSearchParams();
  const { user } = useAuthContext();

  const isInAuthGroup = segments[0] === '(auth)';
  const isInAppGroup = segments[0] === '(app)';
  const currentPath = '/' + segments.join('/');

  const navigateWithAuth = useCallback((path: string) => {
    if (!user && !path.startsWith('/login') && !path.startsWith('/signup')) {
      router.replace('/login');
    } else {
      router.push(path as any);
    }
  }, [user]);

  const replaceWithAuth = useCallback((path: string) => {
    if (!user && !path.startsWith('/login') && !path.startsWith('/signup')) {
      router.replace('/login');
    } else {
      router.replace(path as any);
    }
  }, [user]);

  const signOutAndRedirect = useCallback(async () => {
    // This will be handled by the auth state listener
    router.replace('/login');
  }, []);

  return {
    router,
    segments,
    params,
    isInAuthGroup,
    isInAppGroup,
    currentPath,
    navigateWithAuth,
    replaceWithAuth,
    signOutAndRedirect,
  };
}
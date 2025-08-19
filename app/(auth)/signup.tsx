import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Alert,
} from 'react-native';
import { Link, useRouter } from 'expo-router';
import { useAuthContext } from '../../src/components/auth/AuthContext';
import { Button, Input, LoadingSpinner } from '../../src/components/ui';
import { Colors, TextStyles, Spacing } from '../../src/constants';

export default function SignupScreen() {
  const router = useRouter();
  const { signUp } = useAuthContext();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const validateForm = () => {
    if (!email || !password || !confirmPassword) {
      Alert.alert('Error', 'Please fill in all fields');
      return false;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return false;
    }

    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters long');
      return false;
    }

    return true;
  };

  const handleSignup = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      const { error } = await signUp(email, password);
      
      if (error) {
        Alert.alert('Signup Failed', error.message);
      } else {
        Alert.alert(
          'Success!',
          'Account created successfully. Please check your email to verify your account.',
          [
            {
              text: 'OK',
              onPress: () => router.replace('/(auth)/login'),
            },
          ]
        );
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner fullscreen text="Creating your account..." />;
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <Text style={styles.title}>Join FitTracker!</Text>
          <Text style={styles.subtitle}>
            Create your account to start your health journey
          </Text>
        </View>

        <View style={styles.form}>
          <Input
            label="Email"
            placeholder="Enter your email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            leftIcon="mail"
          />

          <Input
            label="Password"
            placeholder="Create a password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            showPasswordToggle
            leftIcon="lock-closed"
            helperText="Must be at least 6 characters"
          />

          <Input
            label="Confirm Password"
            placeholder="Confirm your password"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
            showPasswordToggle
            leftIcon="lock-closed"
          />

          <Button
            title="Create Account"
            onPress={handleSignup}
            loading={loading}
            style={styles.signupButton}
          />
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Already have an account?{' '}
            <Link href="/(auth)/login" style={styles.link}>
              Sign in
            </Link>
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: Spacing.padding.screen,
  },
  header: {
    alignItems: 'center',
    marginBottom: Spacing['3xl'],
  },
  title: {
    ...TextStyles.h1,
    color: Colors.text,
    marginBottom: Spacing.md,
    textAlign: 'center',
  },
  subtitle: {
    ...TextStyles.body,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  form: {
    marginBottom: Spacing['2xl'],
  },
  signupButton: {
    marginTop: Spacing.lg,
  },
  footer: {
    alignItems: 'center',
  },
  footerText: {
    ...TextStyles.body,
    color: Colors.textSecondary,
  },
  link: {
    color: Colors.gold,
    fontWeight: '600',
  },
});
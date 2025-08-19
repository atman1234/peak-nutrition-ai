import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { useAuthContext } from '../../../src/components/auth/AuthContext';
import { useProfile } from '../../../src/hooks/useProfile';
import { supabase } from '../../../src/lib/supabase';
import { useQueryClient } from '@tanstack/react-query';

export default function ProfileSetup() {
  const router = useRouter();
  const { user } = useAuthContext();
  const queryClient = useQueryClient();
  
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    age: '',
    weight: '',
    height: '',
    activityLevel: 'moderate',
    goal: 'maintain',
    dailyCalorieTarget: '2000',
  });

  const handleSubmit = async () => {
    if (!user) return;

    // Basic validation
    if (!formData.age || !formData.weight || !formData.height) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('user_profiles')
        .upsert({
          user_id: user.id,
          age: parseInt(formData.age),
          weight: parseFloat(formData.weight),
          height: parseFloat(formData.height),
          activity_level: formData.activityLevel,
          goal: formData.goal,
          daily_calorie_target: parseInt(formData.dailyCalorieTarget),
          updated_at: new Date().toISOString(),
        });

      if (error) throw error;

      await queryClient.invalidateQueries({ queryKey: ['profile'] });
      router.replace('/');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to save profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Stack.Screen 
        options={{
          title: 'Complete Your Profile',
          headerShown: true,
          headerStyle: {
            backgroundColor: '#0F172A',
          },
          headerTintColor: 'white',
          headerLeft: () => null, // Prevent going back
        }}
      />
      <ScrollView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Welcome! 👋</Text>
          <Text style={styles.subtitle}>
            Let's set up your profile to personalize your experience
          </Text>
        </View>

        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Age *</Text>
            <TextInput
              style={styles.input}
              value={formData.age}
              onChangeText={(text) => setFormData({ ...formData, age: text })}
              placeholder="Enter your age"
              keyboardType="numeric"
              placeholderTextColor="#94A3B8"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Weight (kg) *</Text>
            <TextInput
              style={styles.input}
              value={formData.weight}
              onChangeText={(text) => setFormData({ ...formData, weight: text })}
              placeholder="Enter your weight"
              keyboardType="decimal-pad"
              placeholderTextColor="#94A3B8"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Height (cm) *</Text>
            <TextInput
              style={styles.input}
              value={formData.height}
              onChangeText={(text) => setFormData({ ...formData, height: text })}
              placeholder="Enter your height"
              keyboardType="numeric"
              placeholderTextColor="#94A3B8"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Activity Level</Text>
            <View style={styles.buttonGroup}>
              {['sedentary', 'light', 'moderate', 'active', 'very_active'].map((level) => (
                <TouchableOpacity
                  key={level}
                  style={[
                    styles.optionButton,
                    formData.activityLevel === level && styles.optionButtonActive,
                  ]}
                  onPress={() => setFormData({ ...formData, activityLevel: level })}
                >
                  <Text
                    style={[
                      styles.optionText,
                      formData.activityLevel === level && styles.optionTextActive,
                    ]}
                  >
                    {level.replace('_', ' ')}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Goal</Text>
            <View style={styles.buttonGroup}>
              {['lose', 'maintain', 'gain'].map((goal) => (
                <TouchableOpacity
                  key={goal}
                  style={[
                    styles.optionButton,
                    formData.goal === goal && styles.optionButtonActive,
                  ]}
                  onPress={() => setFormData({ ...formData, goal })}
                >
                  <Text
                    style={[
                      styles.optionText,
                      formData.goal === goal && styles.optionTextActive,
                    ]}
                  >
                    {goal === 'lose' ? 'Lose Weight' : goal === 'gain' ? 'Gain Weight' : 'Maintain'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Daily Calorie Target</Text>
            <TextInput
              style={styles.input}
              value={formData.dailyCalorieTarget}
              onChangeText={(text) => setFormData({ ...formData, dailyCalorieTarget: text })}
              placeholder="Enter daily calorie target"
              keyboardType="numeric"
              placeholderTextColor="#94A3B8"
            />
          </View>

          <TouchableOpacity
            style={[styles.submitButton, loading && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={styles.submitButtonText}>Complete Setup</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    padding: 20,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#0F172A',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#64748B',
    lineHeight: 22,
  },
  form: {
    padding: 20,
  },
  inputGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0F172A',
    marginBottom: 8,
  },
  input: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: '#0F172A',
  },
  buttonGroup: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  optionButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: 'white',
  },
  optionButtonActive: {
    backgroundColor: '#F59E0B',
    borderColor: '#F59E0B',
  },
  optionText: {
    fontSize: 14,
    color: '#64748B',
    textTransform: 'capitalize',
  },
  optionTextActive: {
    color: 'white',
    fontWeight: '600',
  },
  submitButton: {
    backgroundColor: '#F59E0B',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 20,
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Switch,
  Alert,
  Platform,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, TextStyles, Spacing } from '../../../src/constants';
import { Card, LoadingSpinner } from '../../../src/components/ui';
import { UpgradeModal } from '../../../src/components/ui/UpgradeModal';
import { useProfile } from '../../../src/hooks/useProfile';
import { useUserTier } from '../../../src/hooks/useUserTier';
import { 
  getDisplayUnits, 
  formatHeight, 
  formatWeight 
} from '../../../src/lib/units';
import type { Units } from '../../../src/types/profile';

// Profile validation schema
const profileUpdateSchema = z.object({
  first_name: z.string().min(1, 'First name is required'),
  last_name: z.string().min(1, 'Last name is required'),
  age: z.number().min(13, 'Must be at least 13 years old').max(120, 'Age must be realistic'),
  gender: z.enum(['male', 'female', 'other']),
  height: z.number().min(36, 'Height too low').max(300, 'Height too high'),
  current_weight: z.number().min(30, 'Weight too low').max(1000, 'Weight too high'),
  activity_level: z.enum(['sedentary', 'light', 'moderate', 'active', 'very_active']),
  primary_goal: z.enum(['weight_loss', 'weight_gain', 'muscle_gain', 'maintenance']),
  target_weight: z.number().min(30, 'Target weight too low').max(1000, 'Target weight too high').optional(),
  preferred_units: z.enum(['imperial', 'metric']),
  dietary_restrictions: z.array(z.string()).optional(),
});

type ProfileUpdateData = z.infer<typeof profileUpdateSchema>;

const COMMON_DIETARY_RESTRICTIONS = [
  'Vegetarian',
  'Vegan', 
  'Pescatarian',
  'Gluten-free',
  'Dairy-free',
  'Nut-free',
  'Soy-free',
  'Keto',
  'Paleo',
  'Low-carb',
  'Kosher',
  'Halal'
];

export default function ProfileScreen() {
  const { colors } = useTheme();
  const { profile, updateProfile, isUpdating, calculatedTargets } = useProfile();
  const { tierLimits, isFree, isPro, hasAIFeatures, getAIRequestsLimit, refreshTier, invalidateTierCache } = useUserTier();
  
  const [isEditing, setIsEditing] = useState(false);
  const [units, setUnits] = useState<Units>('imperial');
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [selectedRestrictions, setSelectedRestrictions] = useState<string[]>([]);
  const [customRestriction, setCustomRestriction] = useState('');

  const displayUnits = getDisplayUnits(units);

  const {
    control,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<ProfileUpdateData>({
    resolver: zodResolver(profileUpdateSchema),
  });

  // Check for payment success and refresh tier data
  useEffect(() => {
    if (Platform.OS === 'web') {
      const urlParams = new URLSearchParams(window.location.search);
      const paymentStatus = urlParams.get('payment');
      
      if (paymentStatus === 'success') {
        console.log('Payment success detected, refreshing tier data');
        invalidateTierCache();
        refreshTier();
        
        // Clean up URL
        window.history.replaceState({}, document.title, window.location.pathname);
        
        // Show success message
        setTimeout(() => {
          Alert.alert('Payment Successful', '🎉 Your Pro features are now active!');
        }, 1000);
      }
    }
  }, [invalidateTierCache, refreshTier]);

  // Set units and populate form when profile loads
  useEffect(() => {
    if (profile) {
      const profileUnits = profile.preferred_units || 'imperial';
      setUnits(profileUnits);
      
      const formData = {
        first_name: profile.first_name || '',
        last_name: profile.last_name || '',
        age: profile.age || 25,
        gender: profile.gender || 'other',
        height: profile.height || 0,
        current_weight: profile.current_weight || 0,
        activity_level: profile.activity_level || 'moderate',
        primary_goal: profile.primary_goal || 'maintenance',
        target_weight: profile.target_weight || undefined,
        preferred_units: profileUnits,
        dietary_restrictions: profile.dietary_restrictions || [],
      };
      
      setSelectedRestrictions(profile.dietary_restrictions || []);
      reset(formData);
    }
  }, [profile, reset]);

  // Watch units changes and update display
  const watchedUnits = watch('preferred_units');
  useEffect(() => {
    if (watchedUnits && watchedUnits !== units) {
      setUnits(watchedUnits);
    }
  }, [watchedUnits, units]);

  const handleRestrictionToggle = (restriction: string) => {
    const currentRestrictions = selectedRestrictions;
    const newRestrictions = currentRestrictions.includes(restriction)
      ? currentRestrictions.filter(r => r !== restriction)
      : [...currentRestrictions, restriction];
    
    setSelectedRestrictions(newRestrictions);
    setValue('dietary_restrictions', newRestrictions);
  };

  const handleAddCustomRestriction = () => {
    if (customRestriction.trim() && !selectedRestrictions.includes(customRestriction.trim())) {
      const newRestrictions = [...selectedRestrictions, customRestriction.trim()];
      setSelectedRestrictions(newRestrictions);
      setValue('dietary_restrictions', newRestrictions);
      setCustomRestriction('');
    }
  };

  const handleRemoveRestriction = (restriction: string) => {
    const newRestrictions = selectedRestrictions.filter(r => r !== restriction);
    setSelectedRestrictions(newRestrictions);
    setValue('dietary_restrictions', newRestrictions);
  };

  const onSubmit = async (data: ProfileUpdateData) => {
    const profileData = {
      first_name: data.first_name,
      last_name: data.last_name,
      age: data.age,
      gender: data.gender,
      height: data.height,
      current_weight: data.current_weight,
      target_weight: data.target_weight || null,
      activity_level: data.activity_level,
      primary_goal: data.primary_goal,
      preferred_units: data.preferred_units,
      dietary_restrictions: data.dietary_restrictions || [],
    };

    updateProfile(profileData, {
      onSuccess: () => {
        setIsEditing(false);
      }
    });
  };

  const handleCancel = () => {
    reset();
    setIsEditing(false);
  };

  const activityLabels = {
    sedentary: 'Sedentary (little/no exercise)',
    light: 'Lightly Active (light exercise 1-3 days/week)',
    moderate: 'Moderately Active (moderate exercise 3-5 days/week)',
    active: 'Active (hard exercise 4-5 days/week)', 
    very_active: 'Very Active (hard exercise 6-7 days/week)',
  };

  const goalLabels = {
    weight_loss: 'Lose Weight',
    maintenance: 'Maintain Weight',
    weight_gain: 'Gain Weight',
    muscle_gain: 'Gain Muscle',
  };

  const styles = React.useMemo(() => StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    scrollContent: {
      padding: Spacing.lg,
      paddingBottom: Spacing.xl + 80, // Account for tab bar
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: Spacing.lg,
    },
    headerContent: {
      flex: 1,
    },
    title: {
      ...TextStyles.h1,
      color: colors.text,
      marginBottom: Spacing.xs,
    },
    subtitle: {
      ...TextStyles.body,
      color: colors.textSecondary,
    },
    editButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.sm,
      backgroundColor: colors.gold,
      paddingHorizontal: Spacing.lg,
      paddingVertical: Spacing.md,
      borderRadius: Spacing.borderRadius.sm,
    },
    editButtonText: {
      ...TextStyles.body,
      color: '#FFFFFF',
      fontWeight: '600',
    },
    contentGrid: {
      gap: Spacing.lg,
    },
    mainCard: {
      padding: 0,
    },
    formHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: Spacing.lg,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    formTitle: {
      ...TextStyles.h3,
      color: colors.text,
    },
    formActions: {
      flexDirection: 'row',
      gap: Spacing.sm,
    },
    cancelButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.xs,
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.sm,
      borderRadius: Spacing.borderRadius.sm,
      borderWidth: 1,
      borderColor: colors.border,
    },
    cancelText: {
      ...TextStyles.body,
      color: colors.textSecondary,
      fontWeight: '500',
    },
    saveButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.xs,
      backgroundColor: colors.gold,
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.sm,
      borderRadius: Spacing.borderRadius.sm,
    },
    saveButtonDisabled: {
      opacity: 0.5,
    },
    saveText: {
      ...TextStyles.body,
      color: '#FFFFFF',
      fontWeight: '600',
    },
    formContent: {
      padding: Spacing.lg,
      gap: Spacing.lg,
    },
    displayContent: {
      padding: Spacing.lg,
      gap: Spacing.lg,
    },
    displayTitle: {
      ...TextStyles.h3,
      color: colors.text,
      marginBottom: Spacing.md,
    },
    fieldSection: {
      gap: Spacing.md,
    },
    fieldLabel: {
      ...TextStyles.body,
      color: colors.text,
      fontWeight: '600',
      marginBottom: Spacing.sm,
    },
    fieldDescription: {
      ...TextStyles.caption,
      color: colors.textSecondary,
      marginBottom: Spacing.md,
    },
    input: {
      backgroundColor: colors.background,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: Spacing.borderRadius.sm,
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.sm,
      ...TextStyles.body,
      color: colors.text,
    },
    inputError: {
      borderColor: colors.crimson,
    },
    errorText: {
      ...TextStyles.caption,
      color: colors.crimson,
      marginTop: Spacing.xs,
    },
    fieldRow: {
      flexDirection: 'row',
      gap: Spacing.md,
    },
    fieldHalf: {
      flex: 1,
    },
    unitsToggle: {
      flexDirection: 'row',
      backgroundColor: colors.backgroundSecondary,
      borderRadius: Spacing.borderRadius.sm,
      padding: Spacing.xs,
      marginBottom: Spacing.md,
    },
    unitsOption: {
      flex: 1,
      paddingVertical: Spacing.sm,
      paddingHorizontal: Spacing.md,
      borderRadius: Spacing.borderRadius.xs,
      alignItems: 'center',
    },
    unitsOptionActive: {
      backgroundColor: colors.surface,
    },
    unitsText: {
      ...TextStyles.body,
      color: colors.textSecondary,
      fontWeight: '500',
    },
    unitsTextActive: {
      color: colors.text,
      fontWeight: '600',
    },
    picker: {
      backgroundColor: colors.background,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: Spacing.borderRadius.sm,
      color: colors.text,
    },
    restrictionsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: Spacing.sm,
      marginBottom: Spacing.lg,
    },
    restrictionChip: {
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.sm,
      borderRadius: Spacing.borderRadius.full,
      borderWidth: 2,
    },
    restrictionChipInactive: {
      borderColor: colors.border,
      backgroundColor: colors.surface,
    },
    restrictionChipActive: {
      borderColor: colors.gold,
      backgroundColor: `${colors.gold}20`,
    },
    restrictionText: {
      ...TextStyles.body,
      fontWeight: '500',
    },
    restrictionTextInactive: {
      color: colors.textSecondary,
    },
    restrictionTextActive: {
      color: colors.gold,
    },
    customRestrictionRow: {
      flexDirection: 'row',
      gap: Spacing.sm,
      marginBottom: Spacing.md,
    },
    customRestrictionInput: {
      flex: 1,
    },
    addButton: {
      backgroundColor: colors.gold,
      paddingHorizontal: Spacing.lg,
      paddingVertical: Spacing.sm,
      borderRadius: Spacing.borderRadius.sm,
      alignItems: 'center',
      justifyContent: 'center',
    },
    addButtonDisabled: {
      backgroundColor: colors.backgroundSecondary,
    },
    addButtonText: {
      ...TextStyles.body,
      color: '#FFFFFF',
      fontWeight: '600',
    },
    addButtonTextDisabled: {
      color: colors.textSecondary,
    },
    selectedRestrictions: {
      marginTop: Spacing.md,
    },
    selectedTitle: {
      ...TextStyles.body,
      color: colors.text,
      fontWeight: '600',
      marginBottom: Spacing.sm,
    },
    selectedList: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: Spacing.sm,
    },
    selectedChip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.xs,
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.sm,
      backgroundColor: `${colors.gold}20`,
      borderColor: colors.gold,
      borderWidth: 1,
      borderRadius: Spacing.borderRadius.full,
    },
    selectedChipText: {
      ...TextStyles.body,
      color: colors.gold,
      fontWeight: '500',
    },
    removeButton: {
      padding: Spacing.xs,
    },
    displayGrid: {
      gap: Spacing.md,
    },
    displayRow: {
      flexDirection: 'row',
      gap: Spacing.lg,
    },
    displayField: {
      flex: 1,
    },
    displayFieldLabel: {
      ...TextStyles.caption,
      color: colors.textSecondary,
      fontWeight: '600',
      marginBottom: Spacing.xs,
    },
    displayFieldValue: {
      ...TextStyles.body,
      color: colors.text,
      fontWeight: '500',
    },
    sideCards: {
      gap: Spacing.lg,
    },
    statsCard: {
      padding: Spacing.lg,
    },
    statsHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.md,
      marginBottom: Spacing.md,
    },
    statsIcon: {
      width: 40,
      height: 40,
      borderRadius: Spacing.borderRadius.sm,
      alignItems: 'center',
      justifyContent: 'center',
    },
    statsTitle: {
      ...TextStyles.h4,
      color: colors.text,
    },
    statsContent: {
      gap: Spacing.sm,
    },
    statRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    statLabel: {
      ...TextStyles.body,
      color: colors.textSecondary,
    },
    statValue: {
      ...TextStyles.body,
      color: colors.text,
      fontWeight: '600',
    },
    upgradeButton: {
      backgroundColor: colors.gold,
      paddingVertical: Spacing.md,
      paddingHorizontal: Spacing.lg,
      borderRadius: Spacing.borderRadius.sm,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: Spacing.sm,
      marginTop: Spacing.md,
    },
    upgradeButtonText: {
      ...TextStyles.body,
      color: '#FFFFFF',
      fontWeight: '600',
    },
    upgradeSubtext: {
      ...TextStyles.caption,
      color: 'rgba(255, 255, 255, 0.9)',
      textAlign: 'center',
      marginTop: Spacing.xs,
    },
    proMessage: {
      alignItems: 'center',
      marginTop: Spacing.md,
    },
    proTitle: {
      ...TextStyles.body,
      color: colors.gold,
      fontWeight: '600',
      marginBottom: Spacing.xs,
    },
    proSubtitle: {
      ...TextStyles.caption,
      color: colors.textSecondary,
      textAlign: 'center',
    },
    manageButton: {
      borderWidth: 1,
      borderColor: colors.border,
      paddingVertical: Spacing.sm,
      paddingHorizontal: Spacing.md,
      borderRadius: Spacing.borderRadius.sm,
      alignItems: 'center',
      marginTop: Spacing.sm,
    },
    manageButtonText: {
      ...TextStyles.body,
      color: colors.textSecondary,
      fontWeight: '500',
    },
  }), [colors]);

  if (!profile) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center', padding: Spacing.xl }]}>
        <Card style={{ padding: Spacing.xl, alignItems: 'center' }}>
          <Ionicons name="person" size={64} color={colors.gold} style={{ marginBottom: Spacing.md }} />
          <Text style={[styles.title, { textAlign: 'center', marginBottom: Spacing.sm }]}>
            Profile Not Found
          </Text>
          <Text style={[styles.subtitle, { textAlign: 'center' }]}>
            Please complete your profile setup first.
          </Text>
        </Card>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <Text style={styles.title}>My Profile</Text>
            <Text style={styles.subtitle}>
              Manage your personal information and fitness goals.
            </Text>
          </View>
          {!isEditing && (
            <TouchableOpacity
              style={styles.editButton}
              onPress={() => setIsEditing(true)}
            >
              <Ionicons name="pencil" size={16} color="#FFFFFF" />
              <Text style={styles.editButtonText}>Edit</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.contentGrid}>
          {/* Main Profile Card */}
          <Card style={styles.mainCard}>
            {isEditing ? (
              <>
                <View style={styles.formHeader}>
                  <Text style={styles.formTitle}>Edit Profile</Text>
                  <View style={styles.formActions}>
                    <TouchableOpacity
                      style={styles.cancelButton}
                      onPress={handleCancel}
                    >
                      <Ionicons name="close" size={16} color={colors.textSecondary} />
                      <Text style={styles.cancelText}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.saveButton, isUpdating && styles.saveButtonDisabled]}
                      onPress={handleSubmit(onSubmit)}
                      disabled={isUpdating}
                    >
                      {isUpdating ? (
                        <LoadingSpinner size="small" color="#FFFFFF" />
                      ) : (
                        <Ionicons name="save" size={16} color="#FFFFFF" />
                      )}
                      <Text style={styles.saveText}>
                        {isUpdating ? 'Saving...' : 'Save'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={styles.formContent}>
                  {/* Units Toggle */}
                  <View style={styles.fieldSection}>
                    <Text style={styles.fieldLabel}>Measurement Units</Text>
                    <View style={styles.unitsToggle}>
                      <Controller
                        name="preferred_units"
                        control={control}
                        render={({ field: { value, onChange } }) => (
                          <>
                            <TouchableOpacity
                              style={[styles.unitsOption, value === 'imperial' && styles.unitsOptionActive]}
                              onPress={() => onChange('imperial')}
                            >
                              <Text
                                style={[styles.unitsText, value === 'imperial' && styles.unitsTextActive]}
                              >
                                Imperial (ft/lbs)
                              </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                              style={[styles.unitsOption, value === 'metric' && styles.unitsOptionActive]}
                              onPress={() => onChange('metric')}
                            >
                              <Text
                                style={[styles.unitsText, value === 'metric' && styles.unitsTextActive]}
                              >
                                Metric (cm/kg)
                              </Text>
                            </TouchableOpacity>
                          </>
                        )}
                      />
                    </View>
                  </View>

                  {/* Name Fields */}
                  <View style={styles.fieldRow}>
                    <View style={styles.fieldHalf}>
                      <Text style={styles.fieldLabel}>First Name</Text>
                      <Controller
                        name="first_name"
                        control={control}
                        render={({ field: { value, onChange } }) => (
                          <TextInput
                            style={[styles.input, errors.first_name && styles.inputError]}
                            value={value}
                            onChangeText={onChange}
                            placeholder="John"
                            placeholderTextColor={colors.textSecondary}
                          />
                        )}
                      />
                      {errors.first_name && (
                        <Text style={styles.errorText}>{errors.first_name.message}</Text>
                      )}
                    </View>
                    <View style={styles.fieldHalf}>
                      <Text style={styles.fieldLabel}>Last Name</Text>
                      <Controller
                        name="last_name"
                        control={control}
                        render={({ field: { value, onChange } }) => (
                          <TextInput
                            style={[styles.input, errors.last_name && styles.inputError]}
                            value={value}
                            onChangeText={onChange}
                            placeholder="Doe"
                            placeholderTextColor={colors.textSecondary}
                          />
                        )}
                      />
                      {errors.last_name && (
                        <Text style={styles.errorText}>{errors.last_name.message}</Text>
                      )}
                    </View>
                  </View>

                  {/* Personal Info */}
                  <View style={styles.fieldRow}>
                    <View style={styles.fieldHalf}>
                      <Text style={styles.fieldLabel}>Age</Text>
                      <Controller
                        name="age"
                        control={control}
                        render={({ field: { value, onChange } }) => (
                          <TextInput
                            style={[styles.input, errors.age && styles.inputError]}
                            value={value?.toString()}
                            onChangeText={(text) => onChange(parseInt(text) || 0)}
                            placeholder="25"
                            placeholderTextColor={colors.textSecondary}
                            keyboardType="numeric"
                          />
                        )}
                      />
                      {errors.age && (
                        <Text style={styles.errorText}>{errors.age.message}</Text>
                      )}
                    </View>
                    <View style={styles.fieldHalf}>
                      <Text style={styles.fieldLabel}>Gender</Text>
                      <Controller
                        name="gender"
                        control={control}
                        render={({ field: { value, onChange } }) => (
                          <View style={styles.picker}>
                            {Platform.OS === 'ios' ? (
                              <Picker
                                selectedValue={value}
                                onValueChange={onChange}
                                style={styles.picker}
                              >
                                <Picker.Item label="Male" value="male" />
                                <Picker.Item label="Female" value="female" />
                                <Picker.Item label="Other" value="other" />
                              </Picker>
                            ) : (
                              <select
                                value={value}
                                onChange={(e) => onChange(e.target.value)}
                                style={{
                                  width: '100%',
                                  padding: Spacing.sm,
                                  border: 'none',
                                  backgroundColor: 'transparent',
                                  color: colors.text,
                                }}
                              >
                                <option value="male">Male</option>
                                <option value="female">Female</option>
                                <option value="other">Other</option>
                              </select>
                            )}
                          </View>
                        )}
                      />
                    </View>
                  </View>

                  {/* Physical Stats */}
                  <View style={styles.fieldRow}>
                    <View style={styles.fieldHalf}>
                      <Text style={styles.fieldLabel}>Height ({displayUnits.heightSuffix})</Text>
                      <Controller
                        name="height"
                        control={control}
                        render={({ field: { value, onChange } }) => (
                          <TextInput
                            style={[styles.input, errors.height && styles.inputError]}
                            value={value?.toString()}
                            onChangeText={(text) => onChange(parseFloat(text) || 0)}
                            placeholder={units === 'imperial' ? '70' : '170'}
                            placeholderTextColor={colors.textSecondary}
                            keyboardType="numeric"
                          />
                        )}
                      />
                      {errors.height && (
                        <Text style={styles.errorText}>{errors.height.message}</Text>
                      )}
                    </View>
                    <View style={styles.fieldHalf}>
                      <Text style={styles.fieldLabel}>Current Weight ({displayUnits.weightSuffix})</Text>
                      <Controller
                        name="current_weight"
                        control={control}
                        render={({ field: { value, onChange } }) => (
                          <TextInput
                            style={[styles.input, errors.current_weight && styles.inputError]}
                            value={value?.toString()}
                            onChangeText={(text) => onChange(parseFloat(text) || 0)}
                            placeholder={units === 'imperial' ? '150' : '70'}
                            placeholderTextColor={colors.textSecondary}
                            keyboardType="numeric"
                          />
                        )}
                      />
                      {errors.current_weight && (
                        <Text style={styles.errorText}>{errors.current_weight.message}</Text>
                      )}
                    </View>
                  </View>

                  <View style={styles.fieldSection}>
                    <Text style={styles.fieldLabel}>Target Weight ({displayUnits.weightSuffix})</Text>
                    <Controller
                      name="target_weight"
                      control={control}
                      render={({ field: { value, onChange } }) => (
                        <TextInput
                          style={[styles.input, errors.target_weight && styles.inputError]}
                          value={value?.toString()}
                          onChangeText={(text) => onChange(parseFloat(text) || undefined)}
                          placeholder="Optional"
                          placeholderTextColor={colors.textSecondary}
                          keyboardType="numeric"
                        />
                      )}
                    />
                    {errors.target_weight && (
                      <Text style={styles.errorText}>{errors.target_weight.message}</Text>
                    )}
                  </View>

                  {/* Goals */}
                  <View style={styles.fieldSection}>
                    <Text style={styles.fieldLabel}>Activity Level</Text>
                    <Controller
                      name="activity_level"
                      control={control}
                      render={({ field: { value, onChange } }) => (
                        <View style={styles.picker}>
                          {Platform.OS === 'ios' ? (
                            <Picker
                              selectedValue={value}
                              onValueChange={onChange}
                              style={styles.picker}
                            >
                              {Object.entries(activityLabels).map(([val, label]) => (
                                <Picker.Item key={val} label={label} value={val} />
                              ))}
                            </Picker>
                          ) : (
                            <select
                              value={value}
                              onChange={(e) => onChange(e.target.value)}
                              style={{
                                width: '100%',
                                padding: Spacing.sm,
                                border: 'none',
                                backgroundColor: 'transparent',
                                color: colors.text,
                              }}
                            >
                              {Object.entries(activityLabels).map(([val, label]) => (
                                <option key={val} value={val}>{label}</option>
                              ))}
                            </select>
                          )}
                        </View>
                      )}
                    />
                  </View>

                  <View style={styles.fieldSection}>
                    <Text style={styles.fieldLabel}>Fitness Goal</Text>
                    <Controller
                      name="primary_goal"
                      control={control}
                      render={({ field: { value, onChange } }) => (
                        <View style={styles.picker}>
                          {Platform.OS === 'ios' ? (
                            <Picker
                              selectedValue={value}
                              onValueChange={onChange}
                              style={styles.picker}
                            >
                              {Object.entries(goalLabels).map(([val, label]) => (
                                <Picker.Item key={val} label={label} value={val} />
                              ))}
                            </Picker>
                          ) : (
                            <select
                              value={value}
                              onChange={(e) => onChange(e.target.value)}
                              style={{
                                width: '100%',
                                padding: Spacing.sm,
                                border: 'none',
                                backgroundColor: 'transparent',
                                color: colors.text,
                              }}
                            >
                              {Object.entries(goalLabels).map(([val, label]) => (
                                <option key={val} value={val}>{label}</option>
                              ))}
                            </select>
                          )}
                        </View>
                      )}
                    />
                  </View>

                  {/* Dietary Restrictions */}
                  <View style={styles.fieldSection}>
                    <Text style={styles.fieldLabel}>Dietary Restrictions (Optional)</Text>
                    <Text style={styles.fieldDescription}>
                      Select any dietary restrictions you follow. This helps our AI provide better meal suggestions.
                    </Text>
                    
                    {/* Common Restrictions */}
                    <View style={styles.restrictionsGrid}>
                      {COMMON_DIETARY_RESTRICTIONS.map((restriction) => {
                        const isSelected = selectedRestrictions.includes(restriction);
                        return (
                          <TouchableOpacity
                            key={restriction}
                            style={[
                              styles.restrictionChip,
                              isSelected ? styles.restrictionChipActive : styles.restrictionChipInactive,
                            ]}
                            onPress={() => handleRestrictionToggle(restriction)}
                          >
                            <Text
                              style={[
                                styles.restrictionText,
                                isSelected ? styles.restrictionTextActive : styles.restrictionTextInactive,
                              ]}
                            >
                              {restriction}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>

                    {/* Custom Restriction Input */}
                    <Text style={styles.fieldLabel}>Add Custom Restriction</Text>
                    <View style={styles.customRestrictionRow}>
                      <TextInput
                        style={[styles.input, styles.customRestrictionInput]}
                        value={customRestriction}
                        onChangeText={setCustomRestriction}
                        placeholder="e.g., No shellfish, Low sodium"
                        placeholderTextColor={colors.textSecondary}
                        onSubmitEditing={handleAddCustomRestriction}
                      />
                      <TouchableOpacity
                        style={[
                          styles.addButton,
                          !customRestriction.trim() && styles.addButtonDisabled,
                        ]}
                        onPress={handleAddCustomRestriction}
                        disabled={!customRestriction.trim()}
                      >
                        <Text
                          style={[
                            styles.addButtonText,
                            !customRestriction.trim() && styles.addButtonTextDisabled,
                          ]}
                        >
                          Add
                        </Text>
                      </TouchableOpacity>
                    </View>

                    {/* Selected Restrictions */}
                    {selectedRestrictions.length > 0 && (
                      <View style={styles.selectedRestrictions}>
                        <Text style={styles.selectedTitle}>Selected Restrictions</Text>
                        <View style={styles.selectedList}>
                          {selectedRestrictions.map((restriction) => (
                            <View key={restriction} style={styles.selectedChip}>
                              <Text style={styles.selectedChipText}>{restriction}</Text>
                              <TouchableOpacity
                                style={styles.removeButton}
                                onPress={() => handleRemoveRestriction(restriction)}
                              >
                                <Ionicons name="close" size={14} color={colors.gold} />
                              </TouchableOpacity>
                            </View>
                          ))}
                        </View>
                      </View>
                    )}
                  </View>
                </View>
              </>
            ) : (
              <View style={styles.displayContent}>
                <Text style={styles.displayTitle}>Profile Information</Text>
                
                <View style={styles.displayGrid}>
                  <View style={styles.displayRow}>
                    <View style={styles.displayField}>
                      <Text style={styles.displayFieldLabel}>Name</Text>
                      <Text style={styles.displayFieldValue}>
                        {profile.first_name} {profile.last_name}
                      </Text>
                    </View>
                    <View style={styles.displayField}>
                      <Text style={styles.displayFieldLabel}>Age</Text>
                      <Text style={styles.displayFieldValue}>
                        {profile.age} years old
                      </Text>
                    </View>
                  </View>

                  <View style={styles.displayRow}>
                    <View style={styles.displayField}>
                      <Text style={styles.displayFieldLabel}>Gender</Text>
                      <Text style={styles.displayFieldValue}>
                        {profile.gender?.charAt(0).toUpperCase() + profile.gender?.slice(1)}
                      </Text>
                    </View>
                    <View style={styles.displayField}>
                      <Text style={styles.displayFieldLabel}>Units</Text>
                      <Text style={styles.displayFieldValue}>
                        {profile.preferred_units?.charAt(0).toUpperCase() + profile.preferred_units?.slice(1) || 'Imperial'}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.displayRow}>
                    <View style={styles.displayField}>
                      <Text style={styles.displayFieldLabel}>Height</Text>
                      <Text style={styles.displayFieldValue}>
                        {formatHeight(profile.height, profile.preferred_units || 'imperial')}
                      </Text>
                    </View>
                    <View style={styles.displayField}>
                      <Text style={styles.displayFieldLabel}>Current Weight</Text>
                      <Text style={styles.displayFieldValue}>
                        {formatWeight(profile.current_weight, profile.preferred_units || 'imperial')}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.displayRow}>
                    <View style={styles.displayField}>
                      <Text style={styles.displayFieldLabel}>Target Weight</Text>
                      <Text style={styles.displayFieldValue}>
                        {profile.target_weight 
                          ? formatWeight(profile.target_weight, profile.preferred_units || 'imperial')
                          : 'Not set'
                        }
                      </Text>
                    </View>
                    <View style={styles.displayField}>
                      <Text style={styles.displayFieldLabel}>Account Tier</Text>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm }}>
                        <Ionicons 
                          name={isPro ? 'diamond' : 'star'} 
                          size={16} 
                          color={isPro ? colors.gold : colors.textSecondary} 
                        />
                        <Text style={styles.displayFieldValue}>
                          {isPro ? 'Pro' : 'Free'}
                        </Text>
                      </View>
                    </View>
                  </View>

                  <View style={styles.displayField}>
                    <Text style={styles.displayFieldLabel}>Activity Level</Text>
                    <Text style={styles.displayFieldValue}>
                      {profile.activity_level ? activityLabels[profile.activity_level] : 'Not set'}
                    </Text>
                  </View>

                  <View style={styles.displayField}>
                    <Text style={styles.displayFieldLabel}>Fitness Goal</Text>
                    <Text style={styles.displayFieldValue}>
                      {profile.primary_goal ? goalLabels[profile.primary_goal] : 'Not set'}
                    </Text>
                  </View>

                  <View style={styles.displayField}>
                    <Text style={styles.displayFieldLabel}>Dietary Restrictions</Text>
                    {profile.dietary_restrictions && profile.dietary_restrictions.length > 0 ? (
                      <View style={styles.selectedList}>
                        {profile.dietary_restrictions.map((restriction) => (
                          <View key={restriction} style={styles.selectedChip}>
                            <Text style={styles.selectedChipText}>{restriction}</Text>
                          </View>
                        ))}
                      </View>
                    ) : (
                      <Text style={styles.displayFieldValue}>
                        None specified
                      </Text>
                    )}
                  </View>
                </View>
              </View>
            )}
          </Card>

          {/* Stats Cards */}
          <View style={styles.sideCards}>
            {/* Daily Targets Card */}
            <Card style={styles.statsCard}>
              <View style={styles.statsHeader}>
                <View style={[styles.statsIcon, { backgroundColor: `${colors.gold}20` }]}>
                  <Ionicons name="trending-up" size={20} color={colors.gold} />
                </View>
                <Text style={styles.statsTitle}>Daily Targets</Text>
              </View>
              <View style={styles.statsContent}>
                <View style={styles.statRow}>
                  <Text style={styles.statLabel}>Calories</Text>
                  <Text style={styles.statValue}>
                    {calculatedTargets 
                      ? calculatedTargets.dailyCalories.toLocaleString() 
                      : profile.daily_calorie_target?.toLocaleString() || '--'
                    }
                  </Text>
                </View>
                <View style={styles.statRow}>
                  <Text style={styles.statLabel}>Protein</Text>
                  <Text style={styles.statValue}>
                    {calculatedTargets 
                      ? `${calculatedTargets.proteinGrams}g` 
                      : `${profile.protein_target_g || '--'}g`
                    }
                  </Text>
                </View>
                <View style={styles.statRow}>
                  <Text style={styles.statLabel}>Carbs</Text>
                  <Text style={styles.statValue}>
                    {calculatedTargets 
                      ? `${calculatedTargets.carbGrams}g` 
                      : `${profile.carb_target_g || '--'}g`
                    }
                  </Text>
                </View>
                <View style={styles.statRow}>
                  <Text style={styles.statLabel}>Fat</Text>
                  <Text style={styles.statValue}>
                    {calculatedTargets 
                      ? `${calculatedTargets.fatGrams}g` 
                      : `${profile.fat_target_g || '--'}g`
                    }
                  </Text>
                </View>
              </View>
            </Card>

            {/* Metabolism Card */}
            <Card style={styles.statsCard}>
              <View style={styles.statsHeader}>
                <View style={[styles.statsIcon, { backgroundColor: `${colors.sage}20` }]}>
                  <Ionicons name="speedometer" size={20} color={colors.sage} />
                </View>
                <Text style={styles.statsTitle}>Metabolism</Text>
              </View>
              <View style={styles.statsContent}>
                <View style={styles.statRow}>
                  <Text style={styles.statLabel}>BMR</Text>
                  <Text style={styles.statValue}>
                    {calculatedTargets 
                      ? `${calculatedTargets.bmr.toLocaleString()} cal/day` 
                      : '-- cal/day'
                    }
                  </Text>
                </View>
                <View style={styles.statRow}>
                  <Text style={styles.statLabel}>TDEE</Text>
                  <Text style={styles.statValue}>
                    {calculatedTargets 
                      ? `${Math.round(calculatedTargets.tdee).toLocaleString()} cal/day` 
                      : '-- cal/day'
                    }
                  </Text>
                </View>
              </View>
            </Card>

            {/* Account Tier Card */}
            <Card style={styles.statsCard}>
              <View style={styles.statsHeader}>
                <View style={[
                  styles.statsIcon, 
                  { backgroundColor: isPro ? `${colors.gold}20` : colors.backgroundSecondary }
                ]}>
                  <Ionicons 
                    name={isPro ? 'crown' : 'star'} 
                    size={20} 
                    color={isPro ? colors.gold : colors.textSecondary} 
                  />
                </View>
                <Text style={styles.statsTitle}>
                  {isPro ? 'Pro Account' : 'Free Account'}
                </Text>
              </View>
              <View style={styles.statsContent}>
                <View style={styles.statRow}>
                  <Text style={styles.statLabel}>Favorites Limit</Text>
                  <Text style={styles.statValue}>
                    {tierLimits.max_favorites}
                  </Text>
                </View>
                <View style={styles.statRow}>
                  <Text style={styles.statLabel}>Daily Food Logs</Text>
                  <Text style={styles.statValue}>
                    {tierLimits.max_food_logs_per_day}
                  </Text>
                </View>
                <View style={styles.statRow}>
                  <Text style={styles.statLabel}>Monthly Weight Entries</Text>
                  <Text style={styles.statValue}>
                    {tierLimits.max_weight_entries_per_month}
                  </Text>
                </View>
                <View style={styles.statRow}>
                  <Text style={styles.statLabel}>AI Features</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.xs }}>
                    {hasAIFeatures() ? (
                      <>
                        <Ionicons name="bulb" size={16} color={colors.gold} />
                        <Text style={styles.statValue}>
                          {getAIRequestsLimit()}/month
                        </Text>
                      </>
                    ) : (
                      <Text style={[styles.statValue, { color: colors.textSecondary }]}>
                        Not available
                      </Text>
                    )}
                  </View>
                </View>

                {isFree && (
                  <TouchableOpacity
                    style={styles.upgradeButton}
                    onPress={() => setShowUpgradeModal(true)}
                  >
                    <Ionicons name="sparkles" size={16} color="#FFFFFF" />
                    <View style={{ flex: 1, alignItems: 'center' }}>
                      <Text style={styles.upgradeButtonText}>Upgrade to Pro</Text>
                      <Text style={styles.upgradeSubtext}>
                        Get AI features, 2x favorites & more!
                      </Text>
                    </View>
                  </TouchableOpacity>
                )}
                
                {isPro && (
                  <View style={styles.proMessage}>
                    <Text style={styles.proTitle}>✨ Pro Active</Text>
                    <Text style={styles.proSubtitle}>Enjoying all premium features</Text>
                    <TouchableOpacity
                      style={styles.manageButton}
                      onPress={() => {
                        Alert.alert(
                          'Manage Subscription',
                          'This will open Stripe Customer Portal to manage your subscription. Continue?',
                          [
                            { text: 'Cancel', style: 'cancel' },
                            { 
                              text: 'Continue', 
                              onPress: () => {
                                Alert.alert(
                                  'Customer Portal',
                                  'Customer Portal integration needed - contact support to cancel subscription.'
                                );
                              }
                            }
                          ]
                        );
                      }}
                    >
                      <Text style={styles.manageButtonText}>Manage Subscription</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            </Card>
          </View>
        </View>
      </ScrollView>

      {/* Upgrade Modal */}
      <UpgradeModal
        visible={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        currentTier={tierLimits.tier}
      />
    </View>
  );
}
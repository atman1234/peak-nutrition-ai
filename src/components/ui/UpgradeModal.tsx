import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  TouchableWithoutFeedback,
  ScrollView,
  StyleSheet,
  Platform,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, TextStyles, Spacing } from '../../constants';
import { useStripeCheckout, type BillingPeriod } from '../../hooks/useStripeCheckout';
import { LoadingSpinner } from './LoadingSpinner';

interface UpgradeModalProps {
  visible: boolean;
  onClose: () => void;
  currentTier: 'free' | 'pro';
}

interface Feature {
  icon: keyof typeof Ionicons.glyphMap;
  text: string;
  included: boolean;
}

export function UpgradeModal({ visible, onClose, currentTier }: UpgradeModalProps) {
  const { colors } = useTheme();
  const [selectedPlan, setSelectedPlan] = useState<'free' | 'pro' | null>(null);
  const [billingPeriod, setBillingPeriod] = useState<BillingPeriod>('monthly');
  const { initiateCheckout, isLoading: isProcessingStripe, error: stripeError } = useStripeCheckout();

  const handleUpgrade = async () => {
    if (!selectedPlan || selectedPlan === 'free') return;
    
    try {
      await initiateCheckout(selectedPlan, billingPeriod);
      // Checkout will redirect to Stripe, no need to close modal
    } catch (error) {
      console.error('Checkout failed:', error);
      Alert.alert('Payment Error', 'Failed to start checkout process. Please try again.');
    }
  };

  const features = {
    free: [
      { icon: 'heart', text: '10 Favorite Foods', included: true },
      { icon: 'bar-chart', text: '50 Daily Food Logs', included: true },
      { icon: 'star', text: '31 Monthly Weight Entries', included: true },
      { icon: 'bulb', text: 'AI Food Analysis', included: false },
      { icon: 'flash', text: 'Smart Recommendations', included: false },
      { icon: 'crown', text: 'Priority Support', included: false },
    ] as Feature[],
    pro: [
      { icon: 'heart', text: '20 Favorite Foods', included: true },
      { icon: 'bar-chart', text: '200 Daily Food Logs', included: true },
      { icon: 'star', text: '100 Monthly Weight Entries', included: true },
      { icon: 'bulb', text: 'AI Food Analysis (100/month)', included: true },
      { icon: 'flash', text: 'Smart Recommendations', included: true },
      { icon: 'crown', text: 'Priority Support', included: true },
    ] as Feature[],
  };

  const styles = React.useMemo(() => StyleSheet.create({
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
      padding: Spacing.md,
    },
    modalContainer: {
      width: '100%',
      maxWidth: Platform.OS === 'web' ? 800 : undefined,
      maxHeight: '90%',
      backgroundColor: colors.surface,
      borderRadius: Spacing.borderRadius.lg,
      overflow: 'hidden',
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: Spacing.lg,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      backgroundColor: colors.backgroundSecondary,
    },
    headerContent: {
      flex: 1,
    },
    title: {
      ...TextStyles.h2,
      color: colors.text,
      marginBottom: Spacing.xs,
    },
    subtitle: {
      ...TextStyles.body,
      color: colors.textSecondary,
    },
    closeButton: {
      padding: Spacing.sm,
      borderRadius: Spacing.borderRadius.sm,
    },
    content: {
      flex: 1,
    },
    scrollContent: {
      padding: Spacing.lg,
    },
    popularBadge: {
      position: 'absolute',
      top: -10,
      left: '50%',
      transform: [{ translateX: -50 }],
      backgroundColor: colors.gold,
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.xs,
      borderRadius: Spacing.borderRadius.full,
      zIndex: 10,
    },
    popularText: {
      ...TextStyles.caption,
      color: '#FFFFFF',
      fontWeight: '600',
    },
    plansContainer: {
      gap: Spacing.lg,
      marginTop: Spacing.lg,
    },
    planCard: {
      borderWidth: 2,
      borderRadius: Spacing.borderRadius.lg,
      padding: Spacing.lg,
      position: 'relative',
    },
    planCardFree: {
      borderColor: colors.border,
      backgroundColor: colors.surface,
    },
    planCardPro: {
      borderColor: colors.gold,
      backgroundColor: `${colors.gold}10`,
    },
    planCardSelected: {
      borderColor: colors.gold,
      backgroundColor: `${colors.gold}15`,
    },
    planCardCurrent: {
      borderColor: colors.border,
      backgroundColor: colors.backgroundSecondary,
    },
    planHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: Spacing.md,
    },
    planHeaderLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.md,
    },
    planIcon: {
      padding: Spacing.sm,
      borderRadius: Spacing.borderRadius.sm,
    },
    planIconFree: {
      backgroundColor: colors.backgroundSecondary,
    },
    planIconPro: {
      backgroundColor: `${colors.gold}20`,
    },
    planTitle: {
      ...TextStyles.h3,
      color: colors.text,
      marginBottom: Spacing.xs,
    },
    planDescription: {
      ...TextStyles.caption,
      color: colors.textSecondary,
    },
    currentBadge: {
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.xs,
      borderRadius: Spacing.borderRadius.full,
      backgroundColor: colors.backgroundSecondary,
    },
    currentBadgeText: {
      ...TextStyles.caption,
      color: colors.text,
      fontWeight: '600',
    },
    priceSection: {
      marginBottom: Spacing.lg,
    },
    billingToggle: {
      flexDirection: 'row',
      backgroundColor: colors.backgroundSecondary,
      borderRadius: Spacing.borderRadius.sm,
      padding: Spacing.xs,
      marginBottom: Spacing.md,
    },
    billingOption: {
      flex: 1,
      paddingVertical: Spacing.sm,
      paddingHorizontal: Spacing.md,
      borderRadius: Spacing.borderRadius.xs,
      alignItems: 'center',
      flexDirection: 'row',
      justifyContent: 'center',
      gap: Spacing.xs,
    },
    billingOptionActive: {
      backgroundColor: colors.surface,
    },
    billingOptionText: {
      ...TextStyles.body,
      color: colors.textSecondary,
      fontWeight: '500',
    },
    billingOptionTextActive: {
      color: colors.text,
      fontWeight: '600',
    },
    saveBadge: {
      backgroundColor: colors.gold,
      paddingHorizontal: Spacing.sm,
      paddingVertical: 2,
      borderRadius: Spacing.borderRadius.xs,
    },
    saveBadgeText: {
      ...TextStyles.caption,
      color: '#FFFFFF',
      fontSize: 10,
      fontWeight: '600',
    },
    priceContainer: {
      flexDirection: 'row',
      alignItems: 'baseline',
      marginBottom: Spacing.xs,
    },
    price: {
      ...TextStyles.h1,
      color: colors.text,
      fontWeight: '700',
    },
    priceUnit: {
      ...TextStyles.body,
      color: colors.textSecondary,
      marginLeft: Spacing.sm,
    },
    yearlyNote: {
      ...TextStyles.caption,
      color: colors.gold,
      fontWeight: '500',
    },
    featuresList: {
      gap: Spacing.md,
      marginBottom: Spacing.lg,
    },
    featureItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.md,
    },
    featureIcon: {
      width: 24,
      height: 24,
      borderRadius: Spacing.borderRadius.xs,
      alignItems: 'center',
      justifyContent: 'center',
    },
    featureIconIncluded: {
      backgroundColor: `${colors.sage}20`,
    },
    featureIconExcluded: {
      backgroundColor: colors.backgroundSecondary,
    },
    featureText: {
      ...TextStyles.body,
      flex: 1,
    },
    featureTextIncluded: {
      color: colors.text,
    },
    featureTextExcluded: {
      color: colors.textSecondary,
    },
    selectedIndicator: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.sm,
      marginTop: Spacing.md,
    },
    selectedDot: {
      width: 16,
      height: 16,
      borderRadius: 8,
      backgroundColor: colors.gold,
      borderWidth: 2,
      borderColor: colors.gold,
      alignItems: 'center',
      justifyContent: 'center',
    },
    selectedDotInner: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: '#FFFFFF',
    },
    selectedText: {
      ...TextStyles.body,
      color: colors.text,
      fontWeight: '600',
    },
    footer: {
      padding: Spacing.lg,
      borderTopWidth: 1,
      borderTopColor: colors.border,
      gap: Spacing.md,
    },
    securityNote: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.sm,
      marginBottom: Spacing.sm,
    },
    securityText: {
      ...TextStyles.caption,
      color: colors.textSecondary,
    },
    actionButtons: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      gap: Spacing.md,
    },
    cancelButton: {
      paddingVertical: Spacing.md,
      paddingHorizontal: Spacing.lg,
    },
    cancelText: {
      ...TextStyles.body,
      color: colors.textSecondary,
      fontWeight: '500',
    },
    upgradeButton: {
      backgroundColor: colors.gold,
      paddingVertical: Spacing.md,
      paddingHorizontal: Spacing.xl,
      borderRadius: Spacing.borderRadius.sm,
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.sm,
    },
    upgradeButtonDisabled: {
      opacity: 0.5,
    },
    upgradeText: {
      ...TextStyles.body,
      color: '#FFFFFF',
      fontWeight: '600',
    },
    proMessage: {
      alignItems: 'center',
      padding: Spacing.xl,
    },
    proTitle: {
      ...TextStyles.h3,
      color: colors.gold,
      marginBottom: Spacing.sm,
    },
    proSubtitle: {
      ...TextStyles.body,
      color: colors.textSecondary,
      textAlign: 'center',
    },
    errorText: {
      ...TextStyles.caption,
      color: colors.crimson,
      textAlign: 'center',
    },
  }), [colors]);

  if (!visible) return null;

  const renderPlanCard = (plan: 'free' | 'pro') => {
    const isPro = plan === 'pro';
    const isSelected = selectedPlan === plan;
    const isCurrent = currentTier === plan;
    const planFeatures = features[plan];

    return (
      <TouchableOpacity
        key={plan}
        onPress={() => setSelectedPlan(plan)}
        style={[
          styles.planCard,
          isPro ? styles.planCardPro : styles.planCardFree,
          isSelected && styles.planCardSelected,
          isCurrent && styles.planCardCurrent,
        ]}
        activeOpacity={0.8}
      >
        {isPro && (
          <View style={styles.popularBadge}>
            <Text style={styles.popularText}>Most Popular</Text>
          </View>
        )}

        <View style={styles.planHeader}>
          <View style={styles.planHeaderLeft}>
            <View style={[styles.planIcon, isPro ? styles.planIconPro : styles.planIconFree]}>
              <Ionicons
                name={isPro ? 'crown' : 'star'}
                size={20}
                color={isPro ? colors.gold : colors.textSecondary}
              />
            </View>
            <View>
              <Text style={styles.planTitle}>{isPro ? 'Pro' : 'Free'}</Text>
              <Text style={styles.planDescription}>
                {isPro ? 'Advanced features + AI' : 'Basic tracking'}
              </Text>
            </View>
          </View>
          {isCurrent && (
            <View style={styles.currentBadge}>
              <Text style={styles.currentBadgeText}>Current Plan</Text>
            </View>
          )}
        </View>

        {isPro ? (
          <View style={styles.priceSection}>
            <View style={styles.billingToggle}>
              <TouchableOpacity
                style={[
                  styles.billingOption,
                  billingPeriod === 'monthly' && styles.billingOptionActive,
                ]}
                onPress={() => setBillingPeriod('monthly')}
              >
                <Text
                  style={[
                    styles.billingOptionText,
                    billingPeriod === 'monthly' && styles.billingOptionTextActive,
                  ]}
                >
                  Monthly
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.billingOption,
                  billingPeriod === 'yearly' && styles.billingOptionActive,
                ]}
                onPress={() => setBillingPeriod('yearly')}
              >
                <Text
                  style={[
                    styles.billingOptionText,
                    billingPeriod === 'yearly' && styles.billingOptionTextActive,
                  ]}
                >
                  Yearly
                </Text>
                <View style={styles.saveBadge}>
                  <Text style={styles.saveBadgeText}>-20%</Text>
                </View>
              </TouchableOpacity>
            </View>

            <View style={styles.priceContainer}>
              <Text style={styles.price}>
                ${billingPeriod === 'yearly' ? '95.90' : '9.99'}
              </Text>
              <Text style={styles.priceUnit}>
                /{billingPeriod === 'yearly' ? 'year' : 'month'}
              </Text>
            </View>
            {billingPeriod === 'yearly' && (
              <Text style={styles.yearlyNote}>
                $7.99/month billed annually • Save $23.98
              </Text>
            )}
          </View>
        ) : (
          <View style={styles.priceSection}>
            <View style={styles.priceContainer}>
              <Text style={styles.price}>$0</Text>
              <Text style={styles.priceUnit}>/month</Text>
            </View>
          </View>
        )}

        <View style={styles.featuresList}>
          {planFeatures.map((feature, index) => (
            <View key={index} style={styles.featureItem}>
              <View
                style={[
                  styles.featureIcon,
                  feature.included ? styles.featureIconIncluded : styles.featureIconExcluded,
                ]}
              >
                <Ionicons
                  name={feature.included ? 'checkmark' : 'close'}
                  size={14}
                  color={feature.included ? colors.sage : colors.textSecondary}
                />
              </View>
              <Text
                style={[
                  styles.featureText,
                  feature.included ? styles.featureTextIncluded : styles.featureTextExcluded,
                ]}
              >
                {feature.text}
              </Text>
            </View>
          ))}
        </View>

        {isSelected && (
          <View style={styles.selectedIndicator}>
            <View style={styles.selectedDot}>
              <View style={styles.selectedDotInner} />
            </View>
            <Text style={styles.selectedText}>Selected</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.modalOverlay}>
          <TouchableWithoutFeedback onPress={() => {}}>
            <View style={styles.modalContainer}>
              <View style={styles.header}>
                <View style={styles.headerContent}>
                  <Text style={styles.title}>Upgrade Your Account</Text>
                  <Text style={styles.subtitle}>
                    Unlock powerful features to supercharge your fitness journey
                  </Text>
                </View>
                <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                  <Ionicons name="close" size={24} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
                {currentTier === 'pro' ? (
                  <View style={styles.proMessage}>
                    <Text style={styles.proTitle}>🎉 You're already a Pro member!</Text>
                    <Text style={styles.proSubtitle}>
                      Enjoy all the premium features and thank you for your support.
                    </Text>
                  </View>
                ) : (
                  <View style={styles.plansContainer}>
                    {renderPlanCard('free')}
                    {renderPlanCard('pro')}
                  </View>
                )}
              </ScrollView>

              {currentTier !== 'pro' && (
                <View style={styles.footer}>
                  <View style={styles.securityNote}>
                    <Ionicons name="shield-checkmark" size={16} color={colors.sage} />
                    <Text style={styles.securityText}>Secure payment powered by Stripe</Text>
                  </View>
                  <View style={styles.securityNote}>
                    <Ionicons name="checkmark-circle" size={16} color={colors.sage} />
                    <Text style={styles.securityText}>Cancel anytime, no hidden fees</Text>
                  </View>

                  {stripeError && (
                    <Text style={styles.errorText}>{stripeError}</Text>
                  )}

                  <View style={styles.actionButtons}>
                    <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
                      <Text style={styles.cancelText}>Maybe Later</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        styles.upgradeButton,
                        (!selectedPlan || selectedPlan === 'free' || isProcessingStripe) &&
                          styles.upgradeButtonDisabled,
                      ]}
                      onPress={handleUpgrade}
                      disabled={!selectedPlan || selectedPlan === 'free' || isProcessingStripe}
                    >
                      {isProcessingStripe ? (
                        <>
                          <LoadingSpinner size="small" color="#FFFFFF" />
                          <Text style={styles.upgradeText}>Creating Checkout...</Text>
                        </>
                      ) : (
                        <>
                          <Ionicons name="card" size={16} color="#FFFFFF" />
                          <Text style={styles.upgradeText}>Pay with Stripe</Text>
                        </>
                      )}
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}
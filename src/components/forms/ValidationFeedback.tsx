import React from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, TextStyles, Spacing } from '../../constants';
import { ValidationResult } from '../../hooks/useAdvancedValidation';

interface ValidationFeedbackProps {
  validation: ValidationResult;
  showScore?: boolean;
  compact?: boolean;
}

export function ValidationFeedback({ 
  validation, 
  showScore = true, 
  compact = false 
}: ValidationFeedbackProps) {
  const { errors, warnings, infos, score, isValid } = validation;
  
  const hasErrors = Object.keys(errors).length > 0;
  const hasWarnings = Object.keys(warnings).length > 0;
  const hasInfos = Object.keys(infos).length > 0;
  
  if (!hasErrors && !hasWarnings && !hasInfos && isValid) {
    return null; // Don't show anything if everything is perfect
  }

  const getScoreColor = (score: number): string => {
    if (score >= 80) return Colors.success;
    if (score >= 60) return Colors.warning;
    return Colors.error;
  };

  const getScoreLabel = (score: number): string => {
    if (score >= 90) return 'Excellent';
    if (score >= 80) return 'Good';
    if (score >= 60) return 'Fair';
    if (score >= 40) return 'Needs Improvement';
    return 'Poor';
  };

  const ValidationMessage = ({ 
    message, 
    type 
  }: { 
    message: string; 
    type: 'error' | 'warning' | 'info' 
  }) => {
    const getIcon = () => {
      switch (type) {
        case 'error':
          return 'alert-circle';
        case 'warning':
          return 'warning';
        case 'info':
          return 'information-circle';
      }
    };

    const getColor = () => {
      switch (type) {
        case 'error':
          return Colors.error;
        case 'warning':
          return Colors.warning;
        case 'info':
          return Colors.info;
      }
    };

    return (
      <View style={[styles.messageContainer, { borderLeftColor: getColor() }]}>
        <Ionicons 
          name={getIcon()} 
          size={16} 
          color={getColor()} 
          style={styles.messageIcon}
        />
        <Text style={[styles.messageText, { color: getColor() }]}>
          {message}
        </Text>
      </View>
    );
  };

  return (
    <Animated.View style={[styles.container, compact && styles.compactContainer]}>
      {showScore && (
        <View style={styles.scoreContainer}>
          <View style={styles.scoreHeader}>
            <Text style={styles.scoreLabel}>Form Completeness</Text>
            <View style={[styles.scoreBadge, { backgroundColor: getScoreColor(score) }]}>
              <Text style={styles.scoreText}>{score}%</Text>
            </View>
          </View>
          
          <View style={styles.progressBar}>
            <View 
              style={[
                styles.progressFill, 
                { 
                  width: `${score}%`,
                  backgroundColor: getScoreColor(score),
                }
              ]} 
            />
          </View>
          
          <Text style={[styles.scoreDescription, { color: getScoreColor(score) }]}>
            {getScoreLabel(score)}
          </Text>
        </View>
      )}

      {/* Error Messages */}
      {Object.values(errors).map((message, index) => (
        <ValidationMessage 
          key={`error-${index}`} 
          message={message} 
          type="error" 
        />
      ))}

      {/* Warning Messages */}
      {Object.values(warnings).map((message, index) => (
        <ValidationMessage 
          key={`warning-${index}`} 
          message={message} 
          type="warning" 
        />
      ))}

      {/* Info Messages */}
      {Object.values(infos).map((message, index) => (
        <ValidationMessage 
          key={`info-${index}`} 
          message={message} 
          type="info" 
        />
      ))}

      {/* Success Message */}
      {isValid && hasErrors === false && hasWarnings === false && (
        <View style={[styles.messageContainer, { borderLeftColor: Colors.success }]}>
          <Ionicons 
            name="checkmark-circle" 
            size={16} 
            color={Colors.success} 
            style={styles.messageIcon}
          />
          <Text style={[styles.messageText, { color: Colors.success }]}>
            All validations passed! Ready to submit.
          </Text>
        </View>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.surface,
    borderRadius: Spacing.borderRadius.md,
    padding: Spacing.md,
    marginVertical: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  compactContainer: {
    padding: Spacing.sm,
    marginVertical: Spacing.xs,
  },
  scoreContainer: {
    marginBottom: Spacing.md,
  },
  scoreHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  scoreLabel: {
    ...TextStyles.label,
    color: Colors.text,
  },
  scoreBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: Spacing.borderRadius.sm,
  },
  scoreText: {
    ...TextStyles.caption,
    color: Colors.white,
    fontWeight: '600',
  },
  progressBar: {
    height: 4,
    backgroundColor: Colors.border,
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: Spacing.xs,
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  scoreDescription: {
    ...TextStyles.caption,
    textAlign: 'center',
    fontWeight: '500',
  },
  messageContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingLeft: Spacing.sm,
    paddingVertical: Spacing.xs,
    marginBottom: Spacing.xs,
    borderLeftWidth: 3,
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: Spacing.borderRadius.sm,
  },
  messageIcon: {
    marginRight: Spacing.sm,
    marginTop: 1,
  },
  messageText: {
    ...TextStyles.caption,
    flex: 1,
    lineHeight: 16,
  },
});
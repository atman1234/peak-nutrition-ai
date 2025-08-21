import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

export type HapticFeedbackType = 
  | 'selection'
  | 'light'
  | 'medium' 
  | 'heavy'
  | 'success'
  | 'warning'
  | 'error'
  | 'button_press'
  | 'swipe_action'
  | 'form_submit'
  | 'delete_action'
  | 'add_to_favorites'
  | 'toggle_switch'
  | 'navigation'
  | 'refresh_start'
  | 'refresh_complete';

interface HapticSettings {
  enabled: boolean;
  intensity: 'light' | 'medium' | 'heavy';
}

class HapticManager {
  private settings: HapticSettings = {
    enabled: true,
    intensity: 'medium',
  };

  public configure(settings: Partial<HapticSettings>) {
    this.settings = { ...this.settings, ...settings };
  }

  public async trigger(type: HapticFeedbackType): Promise<void> {
    if (!this.settings.enabled || Platform.OS === 'web') {
      return;
    }

    try {
      switch (type) {
        case 'selection':
          await Haptics.selectionAsync();
          break;

        case 'light':
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          break;

        case 'medium':
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          break;

        case 'heavy':
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
          break;

        case 'success':
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          break;

        case 'warning':
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          break;

        case 'error':
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
          break;

        // Context-specific patterns
        case 'button_press':
          await this.buttonPress();
          break;

        case 'swipe_action':
          await this.swipeAction();
          break;

        case 'form_submit':
          await this.formSubmit();
          break;

        case 'delete_action':
          await this.deleteAction();
          break;

        case 'add_to_favorites':
          await this.addToFavorites();
          break;

        case 'toggle_switch':
          await this.toggleSwitch();
          break;

        case 'navigation':
          await this.navigation();
          break;

        case 'refresh_start':
          await this.refreshStart();
          break;

        case 'refresh_complete':
          await this.refreshComplete();
          break;

        default:
          await Haptics.selectionAsync();
      }
    } catch (error) {
      console.warn('Haptic feedback failed:', error);
    }
  }

  // Context-specific haptic patterns
  private async buttonPress(): Promise<void> {
    switch (this.settings.intensity) {
      case 'light':
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        break;
      case 'medium':
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        break;
      case 'heavy':
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        break;
    }
  }

  private async swipeAction(): Promise<void> {
    // Quick double tap for swipe actions
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setTimeout(async () => {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }, 50);
  }

  private async formSubmit(): Promise<void> {
    // Success pattern for form submission
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setTimeout(async () => {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }, 100);
  }

  private async deleteAction(): Promise<void> {
    // Warning pattern for destructive actions
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setTimeout(async () => {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    }, 150);
  }

  private async addToFavorites(): Promise<void> {
    // Gentle success pattern
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setTimeout(async () => {
      await Haptics.selectionAsync();
    }, 100);
  }

  private async toggleSwitch(): Promise<void> {
    // Quick selection feedback
    await Haptics.selectionAsync();
  }

  private async navigation(): Promise<void> {
    // Subtle navigation feedback
    if (this.settings.intensity !== 'light') {
      await Haptics.selectionAsync();
    }
  }

  private async refreshStart(): Promise<void> {
    // Start of refresh action
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }

  private async refreshComplete(): Promise<void> {
    // Completion of refresh with success
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }

  // Utility methods
  public async customPattern(pattern: { type: Haptics.ImpactFeedbackStyle | Haptics.NotificationFeedbackType; delay?: number }[]): Promise<void> {
    if (!this.settings.enabled || Platform.OS === 'web') {
      return;
    }

    for (let i = 0; i < pattern.length; i++) {
      const { type, delay = 0 } = pattern[i];
      
      if (i > 0 && delay > 0) {
        await new Promise(resolve => setTimeout(resolve, delay));
      }

      try {
        if (type === Haptics.NotificationFeedbackType.Success || 
            type === Haptics.NotificationFeedbackType.Warning || 
            type === Haptics.NotificationFeedbackType.Error) {
          await Haptics.notificationAsync(type as Haptics.NotificationFeedbackType);
        } else {
          await Haptics.impactAsync(type as Haptics.ImpactFeedbackStyle);
        }
      } catch (error) {
        console.warn('Custom haptic pattern failed:', error);
      }
    }
  }

  public isEnabled(): boolean {
    return this.settings.enabled && Platform.OS !== 'web';
  }

  public getSettings(): HapticSettings {
    return { ...this.settings };
  }
}

// Global haptic manager instance
export const hapticManager = new HapticManager();

// Convenience function for quick haptic feedback
export const haptic = (type: HapticFeedbackType): Promise<void> => {
  return hapticManager.trigger(type);
};

// React hook for haptic feedback
export function useHapticFeedback(enabled: boolean = true) {
  const trigger = async (type: HapticFeedbackType) => {
    if (enabled) {
      await haptic(type);
    }
  };

  return {
    trigger,
    isEnabled: () => enabled && hapticManager.isEnabled(),
  };
}

// Food tracking specific haptic patterns
export const foodTrackingHaptics = {
  async addFood(): Promise<void> {
    await haptic('form_submit');
  },

  async editFood(): Promise<void> {
    await haptic('button_press');
  },

  async deleteFood(): Promise<void> {
    await haptic('delete_action');
  },

  async addToFavorites(): Promise<void> {
    await haptic('add_to_favorites');
  },

  async removeFromFavorites(): Promise<void> {
    await haptic('light');
  },

  async swipeToAction(): Promise<void> {
    await haptic('swipe_action');
  },

  async portionChange(): Promise<void> {
    await haptic('selection');
  },

  async mealTypeChange(): Promise<void> {
    await haptic('toggle_switch');
  },

  async searchResult(): Promise<void> {
    await haptic('selection');
  },

  async validationError(): Promise<void> {
    await haptic('error');
  },

  async validationSuccess(): Promise<void> {
    await haptic('success');
  },
};
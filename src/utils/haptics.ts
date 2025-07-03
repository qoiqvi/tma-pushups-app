// Enhanced haptic feedback utilities
export const haptics = {
  // Light impact for button presses, toggles
  light: () => {
    if (typeof window !== 'undefined' && window.Telegram?.WebApp?.HapticFeedback) {
      window.Telegram.WebApp.HapticFeedback.impactOccurred('light');
    }
  },

  // Medium impact for important actions
  medium: () => {
    if (typeof window !== 'undefined' && window.Telegram?.WebApp?.HapticFeedback) {
      window.Telegram.WebApp.HapticFeedback.impactOccurred('medium');
    }
  },

  // Heavy impact for significant actions
  heavy: () => {
    if (typeof window !== 'undefined' && window.Telegram?.WebApp?.HapticFeedback) {
      window.Telegram.WebApp.HapticFeedback.impactOccurred('heavy');
    }
  },

  // Selection feedback for tabs, pickers
  selection: () => {
    if (typeof window !== 'undefined' && window.Telegram?.WebApp?.HapticFeedback) {
      window.Telegram.WebApp.HapticFeedback.selectionChanged();
    }
  },

  // Success notification
  success: () => {
    if (typeof window !== 'undefined' && window.Telegram?.WebApp?.HapticFeedback) {
      window.Telegram.WebApp.HapticFeedback.notificationOccurred('success');
    }
  },

  // Warning notification
  warning: () => {
    if (typeof window !== 'undefined' && window.Telegram?.WebApp?.HapticFeedback) {
      window.Telegram.WebApp.HapticFeedback.notificationOccurred('warning');
    }
  },

  // Error notification
  error: () => {
    if (typeof window !== 'undefined' && window.Telegram?.WebApp?.HapticFeedback) {
      window.Telegram.WebApp.HapticFeedback.notificationOccurred('error');
    }
  },

  // Contextual haptics for specific actions
  workoutStart: () => haptics.medium(),
  workoutFinish: () => haptics.success(),
  setAdded: () => haptics.light(),
  setDeleted: () => haptics.warning(),
  photoUploaded: () => haptics.success(),
  settingsSaved: () => haptics.light(),
  navigationChange: () => haptics.selection(),
  buttonPress: () => haptics.light(),
  cardTap: () => haptics.light(),
  swipeAction: () => haptics.selection(),
};
import toast from 'react-hot-toast';

// Utility functions for consistent toast messaging
export const showToast = {
  success: (message: string) => {
    toast.success(message);
    
    // Haptic feedback if available
    if (typeof window !== 'undefined' && window.Telegram?.WebApp?.HapticFeedback) {
      window.Telegram.WebApp.HapticFeedback.notificationOccurred('success');
    }
  },

  error: (message: string) => {
    toast.error(message);
    
    // Haptic feedback if available
    if (typeof window !== 'undefined' && window.Telegram?.WebApp?.HapticFeedback) {
      window.Telegram.WebApp.HapticFeedback.notificationOccurred('error');
    }
  },

  loading: (message: string) => {
    return toast.loading(message);
  },

  dismiss: (toastId?: string) => {
    toast.dismiss(toastId);
  },

  promise: <T>(
    promise: Promise<T>,
    messages: {
      loading: string;
      success: string | ((data: T) => string);
      error: string | ((error: any) => string);
    }
  ) => {
    return toast.promise(promise, messages).then((result) => {
      // Success haptic feedback
      if (typeof window !== 'undefined' && window.Telegram?.WebApp?.HapticFeedback) {
        window.Telegram.WebApp.HapticFeedback.notificationOccurred('success');
      }
      return result;
    }).catch((error) => {
      // Error haptic feedback
      if (typeof window !== 'undefined' && window.Telegram?.WebApp?.HapticFeedback) {
        window.Telegram.WebApp.HapticFeedback.notificationOccurred('error');
      }
      throw error;
    });
  }
};

// Predefined messages for common actions
export const toastMessages = {
  // Workout messages
  workout: {
    started: '🚀 Тренировка началась!',
    paused: '⏸️ Тренировка приостановлена',
    resumed: '▶️ Тренировка продолжена',
    finished: '🎉 Тренировка завершена!',
    cancelled: '❌ Тренировка отменена',
    setAdded: '✅ Подход добавлен',
    setUpdated: '📝 Подход обновлен',
    setDeleted: '🗑️ Подход удален',
  },

  // Photo messages
  photo: {
    uploading: '📸 Загружаем фото...',
    uploaded: '✅ Фото загружено!',
    processing: '🔄 Обрабатываем фото...',
    processed: '🎨 Фото готово к публикации!',
    uploadError: '❌ Не удалось загрузить фото',
    processError: '❌ Ошибка обработки фото',
  },

  // Settings messages
  settings: {
    saved: '✅ Настройки сохранены',
    saveError: '❌ Ошибка сохранения настроек',
    themeChanged: '🎨 Тема изменена',
    reminderSet: '🔔 Напоминание установлено',
    reminderRemoved: '🔕 Напоминание отключено',
  },

  // Share messages
  share: {
    copied: '📋 Скопировано в буфер обмена',
    downloaded: '💾 Изображение скачано',
    shared: '📤 Результат опубликован!',
    shareError: '❌ Ошибка при публикации',
  },

  // Network messages
  network: {
    offline: '📴 Нет подключения к интернету',
    online: '🌐 Соединение восстановлено',
    syncError: '⚠️ Ошибка синхронизации данных',
    syncSuccess: '✅ Данные синхронизированы',
  },

  // Generic messages
  generic: {
    success: '✅ Успешно!',
    error: '❌ Что-то пошло не так',
    loading: '⏳ Загрузка...',
    saving: '💾 Сохранение...',
    processing: '🔄 Обработка...',
  }
};
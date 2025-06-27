/**
 * Основные цвета приложения для трекинга отжиманий
 * Розовая цветовая схема
 */

export const colors = {
  // Основной розовый цвет
  primary: {
    50: '#FDF2F8',
    100: '#FCE7F3',
    200: '#FBCFE8',
    300: '#F9A8D4',
    400: '#F472B6',
    500: '#EC4899', // Основной
    600: '#DB2777',
    700: '#BE185D',
    800: '#9D174D',
    900: '#831843',
    950: '#500724',
  },
  
  // Серые цвета для второстепенных элементов
  gray: {
    50: '#F9FAFB',
    100: '#F3F4F6',
    200: '#E5E7EB',
    300: '#D1D5DB',
    400: '#9CA3AF',
    500: '#6B7280',
    600: '#4B5563',
    700: '#374151',
    800: '#1F2937',
    900: '#111827',
    950: '#030712',
  },
  
  // Цвета статусов
  success: '#10B981', // Emerald 500
  warning: '#F59E0B', // Amber 500
  error: '#EF4444',   // Red 500
  info: '#3B82F6',    // Blue 500
  
  // Градиенты
  gradients: {
    primary: 'linear-gradient(135deg, #EC4899 0%, #F9A8D4 100%)',
    primaryDark: 'linear-gradient(135deg, #EC4899 0%, #BE185D 100%)',
    surface: 'linear-gradient(180deg, #FFFFFF 0%, #FDF2F8 100%)',
  }
} as const

// Тип для цветов
export type ColorScheme = typeof colors
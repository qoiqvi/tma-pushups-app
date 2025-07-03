'use client';

import { FC } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Activity, 
  BarChart3, 
  Camera, 
  Trophy, 
  Target, 
  Plus,
  Zap 
} from 'lucide-react';
import { motion } from 'framer-motion';

interface EmptyStateProps {
  variant?: 'workouts' | 'stats' | 'photos' | 'records' | 'sets' | 'generic';
  title?: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
  showAction?: boolean;
  className?: string;
}

export const EmptyState: FC<EmptyStateProps> = ({
  variant = 'generic',
  title,
  message,
  actionLabel,
  onAction,
  showAction = true,
  className
}) => {
  const getEmptyConfig = () => {
    switch (variant) {
      case 'workouts':
        return {
          icon: <Activity className="h-16 w-16" />,
          defaultTitle: 'Пока нет тренировок',
          defaultMessage: 'Начните свой путь к лучшей физической форме! Создайте первую тренировку и отслеживайте свой прогресс.',
          defaultActionLabel: 'Начать тренировку',
          gradient: 'from-pink-100 to-purple-100 dark:from-pink-950/20 dark:to-purple-950/20',
          iconColor: 'text-pink-500'
        };
      case 'stats':
        return {
          icon: <BarChart3 className="h-16 w-16" />,
          defaultTitle: 'Статистика пуста',
          defaultMessage: 'Выполните несколько тренировок, чтобы увидеть свой прогресс и достижения в графиках и статистике.',
          defaultActionLabel: 'К тренировкам',
          gradient: 'from-blue-100 to-cyan-100 dark:from-blue-950/20 dark:to-cyan-950/20',
          iconColor: 'text-blue-500'
        };
      case 'photos':
        return {
          icon: <Camera className="h-16 w-16" />,
          defaultTitle: 'Нет фотографий',
          defaultMessage: 'Добавьте фото своей тренировки, чтобы отслеживать визуальный прогресс и делиться достижениями.',
          defaultActionLabel: 'Добавить фото',
          gradient: 'from-green-100 to-emerald-100 dark:from-green-950/20 dark:to-emerald-950/20',
          iconColor: 'text-green-500'
        };
      case 'records':
        return {
          icon: <Trophy className="h-16 w-16" />,
          defaultTitle: 'Пока нет рекордов',
          defaultMessage: 'Продолжайте тренироваться, чтобы установить свои первые личные рекорды и достижения!',
          defaultActionLabel: 'Начать тренировку',
          gradient: 'from-yellow-100 to-orange-100 dark:from-yellow-950/20 dark:to-orange-950/20',
          iconColor: 'text-yellow-500'
        };
      case 'sets':
        return {
          icon: <Target className="h-16 w-16" />,
          defaultTitle: 'Нет подходов',
          defaultMessage: 'Добавьте первый подход, чтобы начать тренировку. Каждый подход приближает вас к цели!',
          defaultActionLabel: 'Добавить подход',
          gradient: 'from-purple-100 to-pink-100 dark:from-purple-950/20 dark:to-pink-950/20',
          iconColor: 'text-purple-500'
        };
      default:
        return {
          icon: <Zap className="h-16 w-16" />,
          defaultTitle: 'Пусто',
          defaultMessage: 'Здесь пока ничего нет. Начните использовать приложение, чтобы увидеть результаты.',
          defaultActionLabel: 'Начать',
          gradient: 'from-gray-100 to-slate-100 dark:from-gray-950/20 dark:to-slate-950/20',
          iconColor: 'text-gray-500'
        };
    }
  };

  const config = getEmptyConfig();
  const finalTitle = title || config.defaultTitle;
  const finalMessage = message || config.defaultMessage;
  const finalActionLabel = actionLabel || config.defaultActionLabel;

  const handleAction = () => {
    if (onAction) {
      onAction();
      
      // Haptic feedback if available
      if (typeof window !== 'undefined' && window.Telegram?.WebApp?.HapticFeedback) {
        window.Telegram.WebApp.HapticFeedback.impactOccurred('light');
      }
    }
  };

  // Floating animation for the icon
  const floatingAnimation = {
    y: [0, -10, 0],
    transition: {
      duration: 3,
      repeat: Infinity
    }
  };

  // Pulse animation for the background
  const pulseAnimation = {
    scale: [1, 1.05, 1],
    opacity: [0.5, 0.7, 0.5],
    transition: {
      duration: 4,
      repeat: Infinity
    }
  };

  return (
    <Card className={className}>
      <CardContent className="p-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center space-y-6"
        >
          {/* Animated Background */}
          <div className="relative">
            <motion.div
              animate={pulseAnimation}
              className={`absolute inset-0 w-32 h-32 mx-auto rounded-full bg-gradient-to-br ${config.gradient} blur-xl`}
            />
            
            {/* Icon with Animation */}
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ 
                duration: 0.6, 
                delay: 0.2,
                type: "spring",
                stiffness: 200 
              }}
              className="relative flex justify-center"
            >
              <motion.div
                animate={floatingAnimation}
                className={`p-6 rounded-full bg-gradient-to-br ${config.gradient} ${config.iconColor}`}
              >
                {config.icon}
              </motion.div>
            </motion.div>
          </div>

          {/* Content */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="space-y-4"
          >
            <h3 className="text-xl font-semibold text-foreground">
              {finalTitle}
            </h3>
            <p className="text-muted-foreground text-sm max-w-md mx-auto leading-relaxed">
              {finalMessage}
            </p>
          </motion.div>

          {/* Action Button */}
          {showAction && onAction && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              <Button
                onClick={handleAction}
                className="bg-pink-gradient hover:opacity-90 text-white"
                size="lg"
              >
                <Plus className="mr-2 h-4 w-4" />
                {finalActionLabel}
              </Button>
            </motion.div>
          )}

          {/* Motivational Message */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="text-xs text-muted-foreground space-y-1"
          >
            {variant === 'workouts' && (
              <div className="space-y-1">
                <p>💪 Каждый эксперт когда-то был новичком</p>
                <p>🚀 Ваше путешествие начинается с первого шага</p>
              </div>
            )}
            {variant === 'stats' && (
              <div className="space-y-1">
                <p>📈 Прогресс измеряется постоянством</p>
                <p>🎯 Ваши первые тренировки создадут основу для роста</p>
              </div>
            )}
            {variant === 'records' && (
              <div className="space-y-1">
                <p>🏆 Рекорды создаются каждый день</p>
                <p>💯 Ваш следующий подход может стать новым достижением</p>
              </div>
            )}
          </motion.div>
        </motion.div>
      </CardContent>
    </Card>
  );
};
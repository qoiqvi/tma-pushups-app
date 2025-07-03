'use client';

import { FC } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { AlertTriangle, RefreshCw, HelpCircle, Wifi } from 'lucide-react';
import { motion } from 'framer-motion';

interface ErrorStateProps {
  title?: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
  showSupport?: boolean;
  variant?: 'network' | 'api' | 'generic' | 'permission';
  className?: string;
}

export const ErrorState: FC<ErrorStateProps> = ({
  title,
  message,
  actionLabel = 'Повторить',
  onAction,
  showSupport = true,
  variant = 'generic',
  className
}) => {
  const getErrorConfig = () => {
    switch (variant) {
      case 'network':
        return {
          icon: <Wifi className="h-12 w-12 text-destructive" />,
          defaultTitle: 'Нет подключения',
          defaultMessage: 'Проверьте интернет-соединение и попробуйте снова',
          iconColor: 'text-orange-500'
        };
      case 'api':
        return {
          icon: <AlertTriangle className="h-12 w-12 text-destructive" />,
          defaultTitle: 'Ошибка сервера',
          defaultMessage: 'Что-то пошло не так. Мы уже работаем над исправлением',
          iconColor: 'text-red-500'
        };
      case 'permission':
        return {
          icon: <AlertTriangle className="h-12 w-12 text-destructive" />,
          defaultTitle: 'Нет доступа',
          defaultMessage: 'У вас нет прав для выполнения этого действия',
          iconColor: 'text-yellow-500'
        };
      default:
        return {
          icon: <AlertTriangle className="h-12 w-12 text-destructive" />,
          defaultTitle: 'Что-то пошло не так',
          defaultMessage: 'Произошла непредвиденная ошибка. Попробуйте еще раз',
          iconColor: 'text-red-500'
        };
    }
  };

  const config = getErrorConfig();
  const finalTitle = title || config.defaultTitle;
  const finalMessage = message || config.defaultMessage;

  const handleAction = () => {
    if (onAction) {
      onAction();
      
      // Haptic feedback if available
      if (typeof window !== 'undefined' && window.Telegram?.WebApp?.HapticFeedback) {
        window.Telegram.WebApp.HapticFeedback.impactOccurred('light');
      }
    }
  };

  const handleSupport = () => {
    // Open Telegram support or help
    if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
      window.Telegram.WebApp.openTelegramLink('https://t.me/pushupstracker_support');
    }
    
    // Haptic feedback if available
    if (typeof window !== 'undefined' && window.Telegram?.WebApp?.HapticFeedback) {
      window.Telegram.WebApp.HapticFeedback.impactOccurred('light');
    }
  };

  return (
    <Card className={className}>
      <CardContent className="p-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center space-y-6"
        >
          {/* Error Icon with Animation */}
          <motion.div
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ 
              duration: 0.5, 
              delay: 0.1,
              type: "spring",
              stiffness: 200 
            }}
            className="flex justify-center"
          >
            <div className={`p-4 rounded-full bg-destructive/10 ${config.iconColor}`}>
              {config.icon}
            </div>
          </motion.div>

          {/* Error Content */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="space-y-3"
          >
            <h3 className="text-lg font-semibold text-foreground">
              {finalTitle}
            </h3>
            <p className="text-muted-foreground text-sm max-w-sm mx-auto leading-relaxed">
              {finalMessage}
            </p>
          </motion.div>

          {/* Action Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="space-y-3"
          >
            {onAction && (
              <Button
                onClick={handleAction}
                className="bg-pink-gradient hover:opacity-90 text-white"
                size="sm"
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                {actionLabel}
              </Button>
            )}

            {showSupport && (
              <div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleSupport}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <HelpCircle className="mr-2 h-4 w-4" />
                  Связаться с поддержкой
                </Button>
              </div>
            )}
          </motion.div>

          {/* Additional Info */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="text-xs text-muted-foreground"
          >
            Если проблема повторяется, попробуйте перезапустить приложение
          </motion.div>
        </motion.div>
      </CardContent>
    </Card>
  );
};
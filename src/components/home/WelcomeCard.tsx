'use client';

import { FC, useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { TelegramUser } from '@/types/telegram';

interface WelcomeCardProps {
  className?: string;
}

export const WelcomeCard: FC<WelcomeCardProps> = ({ className }) => {
  const [user, setUser] = useState<TelegramUser | null>(null);
  const [greeting, setGreeting] = useState('');

  useEffect(() => {
    // Get user data from Telegram WebApp
    if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
      const telegramUser = window.Telegram.WebApp.initDataUnsafe?.user;
      if (telegramUser) {
        setUser(telegramUser);
      }
    }

    // Set greeting based on time of day
    const hour = new Date().getHours();
    if (hour < 12) {
      setGreeting('Доброе утро');
    } else if (hour < 18) {
      setGreeting('Добрый день');
    } else {
      setGreeting('Добрый вечер');
    }
  }, []);

  const getUserName = () => {
    if (!user) return 'Пользователь';
    return user.first_name || user.username || 'Пользователь';
  };

  return (
    <Card className={className}>
      <CardContent className="p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-pink-gradient mb-2">
            {greeting}, {getUserName()}! 💪
          </h1>
          <p className="text-muted-foreground mb-4">
            Готов к новой тренировке?
          </p>
          <div className="text-sm text-muted-foreground">
            Каждый день - шаг к лучшей версии себя
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
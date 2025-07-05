'use client';

import { useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { getTelegramUserId } from '@/lib/auth/client';
import { useRouter } from 'next/navigation';

export default function AuthPage() {
  const router = useRouter();
  
  useEffect(() => {
    // Проверяем, авторизован ли пользователь
    const userId = getTelegramUserId();
    if (userId) {
      router.push('/');
    }
  }, [router]);
  
  return (
    <div className="p-4 max-w-md mx-auto">
      <Card>
        <CardHeader>
          <CardTitle className="text-center">PushUps Tracker</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-center text-muted-foreground">
            Для использования приложения откройте его через Telegram бота.
          </p>
          
          <div className="space-y-2">
            <h3 className="font-semibold">Как начать:</h3>
            <ol className="list-decimal list-inside space-y-1 text-sm">
              <li>Откройте бота @pushups_tracker_bot</li>
              <li>Нажмите кнопку &quot;Начать&quot; или отправьте /start</li>
              <li>Нажмите кнопку &quot;🚀 Открыть приложение&quot;</li>
            </ol>
          </div>
          
          <Button 
            className="w-full" 
            onClick={() => window.open('https://t.me/pushups_tracker_bot', '_blank')}
          >
            Открыть бота в Telegram
          </Button>
          
          <p className="text-xs text-center text-muted-foreground">
            Приложение работает только через Telegram для обеспечения безопасности ваших данных.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
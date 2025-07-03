'use client';

import { FC } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Info, ExternalLink, Heart, Code, Shield, HelpCircle } from 'lucide-react';

interface AboutSectionProps {
  className?: string;
}

export const AboutSection: FC<AboutSectionProps> = ({ className }) => {
  const handleOpenLink = (url: string) => {
    // Use Telegram's openLink method if available
    if (typeof window !== 'undefined' && window.Telegram?.WebApp?.openLink) {
      window.Telegram.WebApp.openLink(url);
    } else {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
    
    // Haptic feedback if available
    if (typeof window !== 'undefined' && window.Telegram?.WebApp?.HapticFeedback) {
      window.Telegram.WebApp.HapticFeedback.selectionChanged();
    }
  };

  const appVersion = process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0';
  const buildDate = process.env.NEXT_PUBLIC_BUILD_DATE || new Date().toISOString().split('T')[0];

  const links = [
    {
      title: 'Поддержка',
      description: 'Есть вопросы? Напишите нам',
      icon: <HelpCircle className="h-4 w-4" />,
      url: 'https://t.me/pushups_tracker_support', // Replace with actual support channel
      color: 'text-blue-600'
    },
    {
      title: 'Политика конфиденциальности',
      description: 'Как мы обрабатываем ваши данные',
      icon: <Shield className="h-4 w-4" />,
      url: 'https://example.com/privacy', // Replace with actual privacy policy
      color: 'text-green-600'
    },
    {
      title: 'Исходный код',
      description: 'Приложение с открытым исходным кодом',
      icon: <Code className="h-4 w-4" />,
      url: 'https://github.com/example/pushups-tracker', // Replace with actual repo
      color: 'text-purple-600'
    }
  ];

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Info className="h-5 w-5 text-primary" />
          О приложении
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* App Info */}
        <div className="text-center space-y-2">
          <div className="text-2xl font-bold text-pink-gradient">
            💪 Pushups Tracker
          </div>
          <p className="text-muted-foreground">
            Отслеживайте свой прогресс в отжиманиях
          </p>
          <div className="text-sm text-muted-foreground space-y-1">
            <div>Версия: {appVersion}</div>
            <div>Сборка: {buildDate}</div>
          </div>
        </div>

        {/* Links */}
        <div className="space-y-2">
          {links.map((link, index) => (
            <Button
              key={index}
              variant="ghost"
              className="w-full justify-start p-4 h-auto"
              onClick={() => handleOpenLink(link.url)}
            >
              <div className="flex items-center gap-3 w-full">
                <div className={`${link.color} flex-shrink-0`}>
                  {link.icon}
                </div>
                <div className="flex-1 text-left">
                  <div className="font-medium">{link.title}</div>
                  <div className="text-sm text-muted-foreground">
                    {link.description}
                  </div>
                </div>
                <ExternalLink className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              </div>
            </Button>
          ))}
        </div>

        {/* Made with love */}
        <div className="text-center pt-4 border-t border-border">
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <span>Сделано с</span>
            <Heart className="h-4 w-4 text-red-500 fill-current" />
            <span>для здорового образа жизни</span>
          </div>
        </div>

        {/* Technical info */}
        <div className="text-xs text-muted-foreground space-y-1">
          <div className="flex justify-between">
            <span>Платформа:</span>
            <span>Telegram Mini App</span>
          </div>
          <div className="flex justify-between">
            <span>Технологии:</span>
            <span>Next.js, React, TypeScript</span>
          </div>
          <div className="flex justify-between">
            <span>База данных:</span>
            <span>Supabase</span>
          </div>
          {typeof window !== 'undefined' && window.Telegram?.WebApp && (
            <>
              <div className="flex justify-between">
                <span>Telegram Web App:</span>
                <span>v{window.Telegram.WebApp.version}</span>
              </div>
              <div className="flex justify-between">
                <span>Платформа TG:</span>
                <span>{window.Telegram.WebApp.platform}</span>
              </div>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
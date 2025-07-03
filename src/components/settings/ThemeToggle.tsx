'use client';

import { FC, useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Sun, Moon, Palette } from 'lucide-react';

interface ThemeToggleProps {
  className?: string;
}

type Theme = 'light' | 'dark' | 'auto';

export const ThemeToggle: FC<ThemeToggleProps> = ({ className }) => {
  const [currentTheme, setCurrentTheme] = useState<Theme>('auto');
  const [telegramTheme, setTelegramTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    // Get theme from localStorage or default to auto
    const savedTheme = localStorage.getItem('theme') as Theme;
    if (savedTheme && ['light', 'dark', 'auto'].includes(savedTheme)) {
      setCurrentTheme(savedTheme);
    }

    // Get Telegram theme
    if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
      const tgTheme = window.Telegram.WebApp.colorScheme || 'light';
      setTelegramTheme(tgTheme);
    }

    // Apply theme
    applyTheme(savedTheme || 'auto');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const applyTheme = (theme: Theme) => {
    const html = document.documentElement;
    
    if (theme === 'auto') {
      // Use Telegram's theme
      if (telegramTheme === 'dark') {
        html.classList.add('dark');
      } else {
        html.classList.remove('dark');
      }
    } else if (theme === 'dark') {
      html.classList.add('dark');
    } else {
      html.classList.remove('dark');
    }
  };

  const handleThemeChange = (theme: Theme) => {
    setCurrentTheme(theme);
    localStorage.setItem('theme', theme);
    applyTheme(theme);
    
    // Haptic feedback if available
    if (typeof window !== 'undefined' && window.Telegram?.WebApp?.HapticFeedback) {
      window.Telegram.WebApp.HapticFeedback.selectionChanged();
    }
  };

  const getThemeDescription = (theme: Theme) => {
    switch (theme) {
      case 'light':
        return 'Всегда светлая тема';
      case 'dark':
        return 'Всегда тёмная тема';
      case 'auto':
        return `Как в Telegram (сейчас ${telegramTheme === 'dark' ? 'тёмная' : 'светлая'})`;
      default:
        return '';
    }
  };

  const themes: { value: Theme; label: string; icon: React.ReactNode }[] = [
    {
      value: 'light',
      label: 'Светлая',
      icon: <Sun className="h-4 w-4" />
    },
    {
      value: 'dark',
      label: 'Тёмная',
      icon: <Moon className="h-4 w-4" />
    },
    {
      value: 'auto',
      label: 'Авто',
      icon: <Palette className="h-4 w-4" />
    }
  ];

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Palette className="h-5 w-5 text-primary" />
          Тема оформления
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current theme info */}
        <div className="text-sm text-muted-foreground">
          {getThemeDescription(currentTheme)}
        </div>

        {/* Theme selection */}
        <div className="grid grid-cols-3 gap-2">
          {themes.map((theme) => (
            <Button
              key={theme.value}
              variant={currentTheme === theme.value ? "default" : "outline"}
              size="sm"
              onClick={() => handleThemeChange(theme.value)}
              className={`flex flex-col gap-1 h-auto py-3 ${
                currentTheme === theme.value 
                  ? "bg-primary text-primary-foreground" 
                  : ""
              }`}
            >
              {theme.icon}
              <span className="text-xs">{theme.label}</span>
            </Button>
          ))}
        </div>

        {/* Additional info */}
        <div className="text-xs text-muted-foreground space-y-1">
          <p>
            💡 Автоматическая тема следует настройкам Telegram
          </p>
          {currentTheme === 'auto' && (
            <p>
              Текущая тема Telegram: <strong>{telegramTheme === 'dark' ? 'Тёмная' : 'Светлая'}</strong>
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
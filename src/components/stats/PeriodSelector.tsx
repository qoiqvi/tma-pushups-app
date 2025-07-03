'use client';

import { FC } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export type Period = 'week' | 'month' | 'all';

interface PeriodSelectorProps {
  selectedPeriod: Period;
  onPeriodChange: (period: Period) => void;
  className?: string;
}

export const PeriodSelector: FC<PeriodSelectorProps> = ({
  selectedPeriod,
  onPeriodChange,
  className
}) => {
  const periods: { value: Period; label: string }[] = [
    { value: 'week', label: 'Неделя' },
    { value: 'month', label: 'Месяц' },
    { value: 'all', label: 'Всё время' }
  ];

  const handlePeriodChange = (period: Period) => {
    onPeriodChange(period);
    
    // Haptic feedback if available
    if (typeof window !== 'undefined' && window.Telegram?.WebApp?.HapticFeedback) {
      window.Telegram.WebApp.HapticFeedback.selectionChanged();
    }
  };

  return (
    <Card className={className}>
      <CardContent className="p-3">
        <div className="flex space-x-1 bg-accent/50 rounded-lg p-1">
          {periods.map((period) => (
            <Button
              key={period.value}
              variant={selectedPeriod === period.value ? "default" : "ghost"}
              size="sm"
              onClick={() => handlePeriodChange(period.value)}
              className={`flex-1 h-8 text-sm font-medium transition-all ${
                selectedPeriod === period.value
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-background/50"
              }`}
            >
              {period.label}
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
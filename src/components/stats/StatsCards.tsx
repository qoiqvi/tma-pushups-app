'use client';

import { FC, useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Trophy, Target, TrendingUp, Zap, Activity } from 'lucide-react';
import { SkeletonCard } from '@/components/shared/SkeletonCard';
import { Period } from './PeriodSelector';
import { usePeriodStats } from '@/hooks/useStats';

interface StatsCardsProps {
  period: Period;
  className?: string;
}

interface StatCardProps {
  title: string;
  value: number;
  unit: string;
  icon: React.ReactNode;
  color: string;
  isLoading?: boolean;
}

const StatCard: FC<StatCardProps> = ({ title, value, unit, icon, color, isLoading }) => {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    if (isLoading) return;
    
    let start = 0;
    const end = value;
    const duration = 1000; // 1 second
    const increment = end / (duration / 16); // 60fps

    const timer = setInterval(() => {
      start += increment;
      if (start >= end) {
        setDisplayValue(end);
        clearInterval(timer);
      } else {
        setDisplayValue(Math.floor(start));
      }
    }, 16);

    return () => clearInterval(timer);
  }, [value, isLoading]);

  if (isLoading) {
    return <SkeletonCard className="h-24" />;
  }

  return (
    <Card className="relative overflow-hidden">
      <div className={`absolute top-0 left-0 w-1 h-full ${color}`} />
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm text-muted-foreground">
          {icon}
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-1">
          <div className="text-2xl font-bold text-foreground">
            {displayValue.toLocaleString()}
          </div>
          <div className="text-xs text-muted-foreground">
            {unit}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export const StatsCards: FC<StatsCardsProps> = ({ period, className }) => {
  const { data: stats, isLoading, error } = usePeriodStats(period);

  const getPeriodLabel = () => {
    switch (period) {
      case 'week': return 'за неделю';
      case 'month': return 'за месяц';
      case 'all': return 'за всё время';
      default: return '';
    }
  };

  if (error) {
    return (
      <Card className={className}>
        <CardContent className="p-6 text-center">
          <div className="text-muted-foreground">
            Не удалось загрузить статистику
          </div>
        </CardContent>
      </Card>
    );
  }

  const cardsData = [
    {
      title: 'Тренировки',
      value: stats?.workouts_count || 0,
      unit: getPeriodLabel(),
      icon: <Activity className="h-4 w-4" />,
      color: 'bg-blue-500'
    },
    {
      title: 'Повторения',
      value: stats?.total_reps || 0,
      unit: getPeriodLabel(),
      icon: <Target className="h-4 w-4" />,
      color: 'bg-primary'
    },
    {
      title: 'Среднее',
      value: Math.round(stats?.avg_reps || 0),
      unit: 'за тренировку',
      icon: <TrendingUp className="h-4 w-4" />,
      color: 'bg-green-500'
    },
    {
      title: 'Подходы',
      value: stats?.total_sets || 0,
      unit: getPeriodLabel(),
      icon: <Zap className="h-4 w-4" />,
      color: 'bg-purple-500'
    }
  ];

  return (
    <div className={`grid gap-4 md:grid-cols-2 lg:grid-cols-4 ${className}`}>
      {cardsData.map((card, index) => (
        <StatCard
          key={index}
          title={card.title}
          value={card.value}
          unit={card.unit}
          icon={card.icon}
          color={card.color}
          isLoading={isLoading}
        />
      ))}
    </div>
  );
};
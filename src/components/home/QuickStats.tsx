'use client';

import { FC } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, TrendingUp, Zap } from 'lucide-react';
import { useOverallStats } from '@/hooks/useStats';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { SkeletonCard } from '@/components/shared/SkeletonCard';
import { Button } from '@/components/ui/button';

interface QuickStatsProps {
  className?: string;
}

export const QuickStats: FC<QuickStatsProps> = ({ className }) => {
  const { data: stats, isLoading, error, refetch } = useOverallStats();

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-3">
        <SkeletonCard lines={1} />
        <SkeletonCard lines={1} />
        <SkeletonCard lines={1} />
      </div>
    );
  }

  if (error) {
    return (
      <Card className={className}>
        <CardContent className="p-6 text-center">
          <p className="text-muted-foreground mb-4">
            Ошибка загрузки статистики
          </p>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => refetch()}
          >
            Повторить
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Default stats if no data
  const defaultStats = {
    total_workouts: 0,
    total_reps: 0,
    current_streak: 0,
    max_streak: 0,
    avg_reps_per_workout: 0,
    personal_best_reps: 0,
  };

  const displayStats = stats || defaultStats;

  return (
    <div className={`grid gap-4 md:grid-cols-3 ${className}`}>
      {/* Today's Activity */}
      <Card className="border-pink-200">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm">
            <Zap className="h-4 w-4 text-primary" />
            Сегодня
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-primary">
            {displayStats.total_workouts > 0 ? displayStats.personal_best_reps : 0}
          </div>
          <p className="text-xs text-muted-foreground">повторений</p>
        </CardContent>
      </Card>

      {/* Weekly Total */}
      <Card className="border-pink-200">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm">
            <Calendar className="h-4 w-4 text-primary" />
            Эта неделя
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-primary">
            {displayStats.total_reps}
          </div>
          <p className="text-xs text-muted-foreground">всего повторений</p>
        </CardContent>
      </Card>

      {/* Current Streak */}
      <Card className="border-pink-200">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm">
            <TrendingUp className="h-4 w-4 text-primary" />
            Серия
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-primary">
            {displayStats.current_streak}
          </div>
          <p className="text-xs text-muted-foreground">
            {displayStats.current_streak === 1 ? 'день' : 'дней'} подряд
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
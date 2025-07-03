'use client';

import { FC } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Activity, Clock, Calendar } from 'lucide-react';
import { useWorkouts } from '@/hooks/useWorkouts';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { SkeletonCard } from '@/components/shared/SkeletonCard';
import { EmptyState } from '@/components/shared/EmptyState';
import { ErrorState } from '@/components/shared/ErrorState';
import { Button } from '@/components/ui/button';
import { Link } from '@/components/Link/Link';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { useRouter } from 'next/navigation';

interface LastWorkoutCardProps {
  className?: string;
}

export const LastWorkoutCard: FC<LastWorkoutCardProps> = ({ className }) => {
  const { data: workoutsData, isLoading, error, refetch } = useWorkouts(1, 0);
  const router = useRouter();

  if (isLoading) {
    return <SkeletonCard className={className} />;
  }

  if (error) {
    return (
      <ErrorState
        title="Ошибка загрузки"
        message="Не удалось загрузить последнюю тренировку"
        onAction={refetch}
        className={className}
      />
    );
  }

  const lastWorkout = workoutsData?.workouts?.[0];

  if (!lastWorkout) {
    return (
      <EmptyState
        variant="workouts"
        title="Пока нет тренировок"
        message="Начните свой фитнес-путь! Создайте первую тренировку и отслеживайте прогресс."
        actionLabel="Начать тренировку"
        onAction={() => router.push('/workout')}
        className={className}
      />
    );
  }

  const formatDuration = (seconds?: number) => {
    if (!seconds) return 'Н/Д';
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffInHours = Math.abs(now.getTime() - date.getTime()) / (1000 * 60 * 60);
      
      if (diffInHours < 24) {
        return 'Сегодня';
      } else if (diffInHours < 48) {
        return 'Вчера';
      } else {
        return format(date, 'd MMMM', { locale: ru });
      }
    } catch {
      return 'Недавно';
    }
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary" />
            Последняя тренировка
          </span>
          <Link href="/stats">
            <Button variant="ghost" size="sm">
              Все тренировки
            </Button>
          </Link>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Main stats */}
          <div className="flex justify-between items-center">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">
                {lastWorkout.total_reps}
              </div>
              <div className="text-sm text-muted-foreground">повторений</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">
                {lastWorkout.total_sets}
              </div>
              <div className="text-sm text-muted-foreground">подходов</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">
                {formatDuration(lastWorkout.duration_seconds)}
              </div>
              <div className="text-sm text-muted-foreground">минут</div>
            </div>
          </div>

          {/* Date and time */}
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              {formatDate(lastWorkout.started_at)}
            </div>
            {lastWorkout.duration_seconds && (
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                {formatDuration(lastWorkout.duration_seconds)}
              </div>
            )}
          </div>

          {/* Notes if available */}
          {lastWorkout.notes && (
            <div className="text-sm text-muted-foreground italic">
              &ldquo;{lastWorkout.notes}&rdquo;
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
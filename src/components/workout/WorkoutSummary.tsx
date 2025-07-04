'use client';

import { FC } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Trophy, Clock, Target, TrendingUp, Zap, Award } from 'lucide-react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

interface WorkoutData {
  id: string;
  started_at: string;
  finished_at?: string;
  duration_seconds?: number;
  total_reps: number;
  total_sets: number;
  notes?: string;
  sets?: Array<{
    id: string;
    set_number: number;
    reps: number;
  }>;
}

interface WorkoutSummaryProps {
  workout: WorkoutData;
  previousWorkout?: WorkoutData;
  personalBest?: number;
  className?: string;
}

export const WorkoutSummary: FC<WorkoutSummaryProps> = ({
  workout,
  previousWorkout,
  personalBest,
  className
}) => {
  const formatDuration = (seconds?: number) => {
    if (!seconds) return '0:00';
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'EEEE, d MMMM, HH:mm', { locale: ru });
    } catch {
      return 'Сегодня';
    }
  };

  const getAverageReps = () => {
    if (!workout.sets || workout.sets.length === 0) return 0;
    return Math.round((workout.total_reps / workout.total_sets) * 10) / 10;
  };

  const getMaxReps = () => {
    if (!workout.sets || workout.sets.length === 0) return 0;
    return Math.max(...workout.sets.map(set => set.reps));
  };

  const getImprovementMessage = () => {
    if (!previousWorkout) return 'Отличное начало! 💪';
    
    const repsDiff = workout.total_reps - previousWorkout.total_reps;
    const setsDiff = workout.total_sets - previousWorkout.total_sets;
    
    if (repsDiff > 0) {
      return `Супер! На ${repsDiff} повторений больше! 🚀`;
    } else if (setsDiff > 0) {
      return `Отлично! На ${setsDiff} подход${setsDiff === 1 ? '' : setsDiff < 5 ? 'а' : 'ов'} больше! 💯`;
    } else if (repsDiff === 0) {
      return 'Стабильный результат! 👏';
    } else {
      return 'Каждая тренировка важна! 💪';
    }
  };

  const isNewPersonalBest = personalBest ? workout.total_reps > personalBest : true;

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Celebration Header */}
      <Card className="bg-gradient-to-r from-pink-50 to-purple-50 border-pink-200">
        <CardContent className="p-6 text-center">
          <div className="mb-4">
            {isNewPersonalBest ? (
              <div className="text-4xl">🏆</div>
            ) : (
              <div className="text-4xl">💪</div>
            )}
          </div>
          <h2 className="text-2xl font-bold text-pink-gradient mb-2">
            {isNewPersonalBest ? 'Новый рекорд!' : 'Тренировка завершена!'}
          </h2>
          <p className="text-muted-foreground">
            {getImprovementMessage()}
          </p>
        </CardContent>
      </Card>

      {/* Main Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-pink-200">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Target className="h-4 w-4 text-primary" />
              Повторения
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary">
              {workout.total_reps}
            </div>
            {previousWorkout && (
              <div className="text-sm text-muted-foreground">
                {workout.total_reps > previousWorkout.total_reps ? (
                  <span className="text-green-600">
                    +{workout.total_reps - previousWorkout.total_reps} от прошлой
                  </span>
                ) : workout.total_reps === previousWorkout.total_reps ? (
                  <span>Как в прошлый раз</span>
                ) : (
                  <span className="text-amber-600">
                    {workout.total_reps - previousWorkout.total_reps} от прошлой
                  </span>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-pink-200">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Zap className="h-4 w-4 text-primary" />
              Подходы
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary">
              {workout.total_sets}
            </div>
            <div className="text-sm text-muted-foreground">
              Среднее: {getAverageReps()} повторений
            </div>
          </CardContent>
        </Card>

        <Card className="border-pink-200">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Clock className="h-4 w-4 text-primary" />
              Время
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary">
              {formatDuration(workout.duration_seconds)}
            </div>
            <div className="text-sm text-muted-foreground">
              Макс: {getMaxReps()} повторений
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Breakdown */}
      {workout.sets && workout.sets.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Разбивка по подходам
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2">
              {workout.sets.map((set) => (
                <div
                  key={set.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-accent/50"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
                      {set.set_number}
                    </div>
                    <span className="font-medium">{set.reps} повторений</span>
                  </div>
                  {set.reps === getMaxReps() && (
                    <Award className="h-4 w-4 text-yellow-500" />
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Workout Details */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-primary" />
            Детали тренировки
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Дата и время:</span>
            <span className="font-medium">{formatDate(workout.started_at)}</span>
          </div>
          
          <div className="flex justify-between">
            <span className="text-muted-foreground">Продолжительность:</span>
            <span className="font-medium">{formatDuration(workout.duration_seconds)}</span>
          </div>
          
          <div className="flex justify-between">
            <span className="text-muted-foreground">Всего подходов:</span>
            <span className="font-medium">{workout.total_sets}</span>
          </div>
          
          <div className="flex justify-between">
            <span className="text-muted-foreground">Всего повторений:</span>
            <span className="font-medium text-primary">{workout.total_reps}</span>
          </div>

          {workout.duration_seconds && workout.total_reps > 0 && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Темп:</span>
              <span className="font-medium">
                {Math.round((workout.total_reps / (workout.duration_seconds / 60)) * 10) / 10} повторений/мин
              </span>
            </div>
          )}

          {workout.notes && (
            <>
              <hr className="border-border" />
              <div>
                <span className="text-muted-foreground block mb-1">Заметки:</span>
                <span className="italic">&ldquo;{workout.notes}&rdquo;</span>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
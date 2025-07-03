'use client';

import { FC } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Trophy, Clock, Target, Flame, Calendar, Medal } from 'lucide-react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { usePersonalRecords } from '@/hooks/useStats';
import { SkeletonCard } from '@/components/shared/SkeletonCard';

interface PersonalRecordsProps {
  className?: string;
}

interface RecordItemProps {
  icon: React.ReactNode;
  title: string;
  value: string;
  description: string;
  date?: string;
  isRecord?: boolean;
}

const RecordItem: FC<RecordItemProps> = ({ 
  icon, 
  title, 
  value, 
  description, 
  date, 
  isRecord = false 
}) => {
  return (
    <div className="flex items-center space-x-4 p-4 rounded-lg border border-border hover:bg-accent/50 transition-colors">
      <div className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center ${
        isRecord ? 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400' : 'bg-accent text-muted-foreground'
      }`}>
        {icon}
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h3 className="font-medium text-foreground">{title}</h3>
          {isRecord && <Medal className="h-4 w-4 text-yellow-500" />}
        </div>
        <p className="text-sm text-muted-foreground">{description}</p>
        {date && (
          <p className="text-xs text-muted-foreground mt-1">
            {format(new Date(date), 'd MMMM yyyy, HH:mm', { locale: ru })}
          </p>
        )}
      </div>
      
      <div className={`text-right ${isRecord ? 'text-yellow-600 dark:text-yellow-400' : 'text-foreground'}`}>
        <div className="font-bold text-lg">{value}</div>
      </div>
    </div>
  );
};

export const PersonalRecords: FC<PersonalRecordsProps> = ({ className }) => {
  const { data: records, isLoading, error } = usePersonalRecords();

  const formatDuration = (seconds?: number) => {
    if (!seconds) return '0 мин';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours > 0) {
      return `${hours}ч ${minutes}м`;
    }
    return `${minutes} мин`;
  };

  if (isLoading) {
    return <SkeletonCard className={`h-96 ${className}`} />;
  }

  if (error) {
    return (
      <Card className={className}>
        <CardContent className="p-6 text-center">
          <div className="text-muted-foreground">
            Не удалось загрузить достижения
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!records) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-primary" />
            Личные достижения
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-40">
          <div className="text-center text-muted-foreground">
            <Trophy className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>Пока нет достижений</p>
            <p className="text-sm">Начните тренироваться!</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const achievementsData = [
    {
      icon: <Trophy className="h-6 w-6" />,
      title: 'Максимум повторений',
      value: records.most_reps?.total_reps?.toString() || '0',
      description: 'Лучший результат за тренировку',
      date: records.most_reps?.started_at,
      isRecord: true
    },
    {
      icon: <Clock className="h-6 w-6" />,
      title: 'Самая долгая тренировка',
      value: formatDuration(records.longest_workout?.duration_seconds),
      description: `${records.longest_workout?.total_reps || 0} повторений`,
      date: records.longest_workout?.started_at,
      isRecord: false
    },
    {
      icon: <Target className="h-6 w-6" />,
      title: 'Больше всего подходов',
      value: records.most_sets?.total_sets?.toString() || '0',
      description: `${records.most_sets?.total_reps || 0} повторений за ${records.most_sets?.total_sets || 0} подходов`,
      date: records.most_sets?.started_at,
      isRecord: false
    },
    {
      icon: <Flame className="h-6 w-6" />,
      title: 'Текущая серия',
      value: records.current_streak?.toString() || '0',
      description: records.current_streak > 0 ? 'дней подряд' : 'Начните новую серию!',
      isRecord: (records.current_streak || 0) >= 7
    },
    {
      icon: <Calendar className="h-6 w-6" />,
      title: 'Всего тренировок',
      value: records.total_workouts?.toString() || '0',
      description: `${records.total_reps || 0} повторений за всё время`,
      isRecord: (records.total_workouts || 0) >= 10
    }
  ];

  // Filter out records with no meaningful data
  const validAchievements = achievementsData.filter(achievement => {
    const numValue = parseInt(achievement.value);
    return !isNaN(numValue) && numValue > 0;
  });

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-primary" />
          Личные достижения
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {validAchievements.length > 0 ? (
          validAchievements.map((achievement, index) => (
            <RecordItem
              key={index}
              icon={achievement.icon}
              title={achievement.title}
              value={achievement.value}
              description={achievement.description}
              date={achievement.date}
              isRecord={achievement.isRecord}
            />
          ))
        ) : (
          <div className="text-center text-muted-foreground py-8">
            <Trophy className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>Пока нет достижений</p>
            <p className="text-sm">Начните тренироваться чтобы установить первые рекорды!</p>
          </div>
        )}
        
        {/* Motivation section */}
        {validAchievements.length > 0 && (
          <div className="mt-6 p-4 bg-gradient-to-r from-pink-50 to-purple-50 dark:from-pink-950/20 dark:to-purple-950/20 rounded-lg border border-pink-200/50">
            <div className="text-center">
              <Trophy className="h-6 w-6 mx-auto mb-2 text-primary" />
              <p className="text-sm font-medium text-foreground">
                Продолжайте тренироваться!
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Каждая тренировка приближает вас к новым рекордам
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
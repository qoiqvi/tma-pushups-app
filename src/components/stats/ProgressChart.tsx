'use client';

import { FC, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { TrendingUp, BarChart3, Activity } from 'lucide-react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { Period } from './PeriodSelector';
import { useWorkoutHistory } from '@/hooks/useStats';
import { SkeletonCard } from '@/components/shared/SkeletonCard';

interface ProgressChartProps {
  period: Period;
  className?: string;
}

type ChartType = 'line' | 'bar' | 'area';

interface ChartData {
  date: string;
  reps: number;
  sets: number;
  formattedDate: string;
  workoutId: string;
}

interface WorkoutData {
  id: string;
  started_at: string;
  total_reps: number;
  total_sets: number;
}

export const ProgressChart: FC<ProgressChartProps> = ({ period, className }) => {
  const [chartType, setChartType] = useState<ChartType>('area');
  const { data: workouts, isLoading, error } = useWorkoutHistory(period);

  const formatDateForChart = (dateString: string) => {
    const date = new Date(dateString);
    switch (period) {
      case 'week':
        return format(date, 'EEE', { locale: ru }); // Mon, Tue, etc.
      case 'month':
        return format(date, 'd MMM', { locale: ru }); // 1 Jan, 2 Jan, etc.
      case 'all':
        return format(date, 'MMM yy', { locale: ru }); // Jan 24, Feb 24, etc.
      default:
        return format(date, 'd MMM', { locale: ru });
    }
  };

  const chartData: ChartData[] = workouts?.map((workout: WorkoutData) => ({
    date: workout.started_at,
    reps: workout.total_reps,
    sets: workout.total_sets,
    formattedDate: formatDateForChart(workout.started_at),
    workoutId: workout.id
  })) || [];

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-background border border-border rounded-lg p-3 shadow-lg">
          <p className="font-medium text-foreground">
            {format(new Date(data.date), 'EEEE, d MMMM', { locale: ru })}
          </p>
          <p className="text-primary">
            Повторения: <span className="font-bold">{data.reps}</span>
          </p>
          <p className="text-muted-foreground">
            Подходы: <span className="font-medium">{data.sets}</span>
          </p>
        </div>
      );
    }
    return null;
  };

  const handleChartTypeChange = (type: ChartType) => {
    setChartType(type);
    
    // Haptic feedback if available
    if (typeof window !== 'undefined' && window.Telegram?.WebApp?.HapticFeedback) {
      window.Telegram.WebApp.HapticFeedback.selectionChanged();
    }
  };

  const renderChart = () => {
    const commonProps = {
      data: chartData,
      margin: { top: 5, right: 5, left: 5, bottom: 5 }
    };

    switch (chartType) {
      case 'line':
        return (
          <LineChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis 
              dataKey="formattedDate" 
              stroke="hsl(var(--muted-foreground))"
              fontSize={12}
            />
            <YAxis 
              stroke="hsl(var(--muted-foreground))"
              fontSize={12}
            />
            <Tooltip content={<CustomTooltip />} />
            <Line 
              type="monotone" 
              dataKey="reps" 
              stroke="hsl(var(--primary))" 
              strokeWidth={2}
              dot={{ fill: 'hsl(var(--primary))', strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, stroke: 'hsl(var(--primary))', strokeWidth: 2 }}
            />
          </LineChart>
        );

      case 'bar':
        return (
          <BarChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis 
              dataKey="formattedDate" 
              stroke="hsl(var(--muted-foreground))"
              fontSize={12}
            />
            <YAxis 
              stroke="hsl(var(--muted-foreground))"
              fontSize={12}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar 
              dataKey="reps" 
              fill="hsl(var(--primary))"
              radius={[2, 2, 0, 0]}
            />
          </BarChart>
        );

      case 'area':
        return (
          <AreaChart {...commonProps}>
            <defs>
              <linearGradient id="colorReps" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis 
              dataKey="formattedDate" 
              stroke="hsl(var(--muted-foreground))"
              fontSize={12}
            />
            <YAxis 
              stroke="hsl(var(--muted-foreground))"
              fontSize={12}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area 
              type="monotone" 
              dataKey="reps" 
              stroke="hsl(var(--primary))" 
              strokeWidth={2}
              fillOpacity={1} 
              fill="url(#colorReps)" 
            />
          </AreaChart>
        );

      default:
        return <div>Chart type not supported</div>;
    }
  };

  if (isLoading) {
    return <SkeletonCard className={`h-80 ${className}`} />;
  }

  if (error) {
    return (
      <Card className={className}>
        <CardContent className="p-6 text-center">
          <div className="text-muted-foreground">
            Не удалось загрузить данные графика
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!chartData.length) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Прогресс тренировок
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-40">
          <div className="text-center text-muted-foreground">
            <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>Нет данных для отображения</p>
            <p className="text-sm">Начните тренироваться!</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Прогресс тренировок
          </CardTitle>
          
          {/* Chart type selector */}
          <div className="flex gap-1">
            <Button
              variant={chartType === 'area' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleChartTypeChange('area')}
              className="h-8 w-8 p-0"
            >
              <TrendingUp className="h-4 w-4" />
            </Button>
            <Button
              variant={chartType === 'line' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleChartTypeChange('line')}
              className="h-8 w-8 p-0"
            >
              <Activity className="h-4 w-4" />
            </Button>
            <Button
              variant={chartType === 'bar' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleChartTypeChange('bar')}
              className="h-8 w-8 p-0"
            >
              <BarChart3 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            {renderChart()}
          </ResponsiveContainer>
        </div>
        
        {/* Chart info */}
        <div className="mt-4 text-center text-sm text-muted-foreground">
          {chartData.length} тренировок{chartData.length === 1 ? 'а' : chartData.length < 5 ? 'и' : ''}
        </div>
      </CardContent>
    </Card>
  );
};
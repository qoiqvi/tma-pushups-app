'use client';

import { FC } from 'react';
import { Button } from '@/components/ui/button';
import { CheckCircle2, X } from 'lucide-react';

interface WorkoutControlsProps {
  /**
   * Number of sets completed
   */
  setsCount: number;
  /**
   * Total reps completed
   */
  totalReps: number;
  /**
   * Callback when workout is finished
   */
  onFinishWorkout: () => void;
  /**
   * Callback when workout is cancelled
   */
  onCancelWorkout: () => void;
  /**
   * Whether the controls are disabled
   * @default false
   */
  disabled?: boolean;
  /**
   * Whether the workout is being saved
   * @default false
   */
  isLoading?: boolean;
  /**
   * Additional CSS classes
   */
  className?: string;
}

export const WorkoutControls: FC<WorkoutControlsProps> = ({
  setsCount,
  totalReps,
  onFinishWorkout,
  onCancelWorkout,
  disabled = false,
  isLoading = false,
  className
}) => {
  const handleFinishWorkout = () => {
    onFinishWorkout();
    
    // Haptic feedback if available
    if (typeof window !== 'undefined' && window.Telegram?.WebApp?.HapticFeedback) {
      window.Telegram.WebApp.HapticFeedback.notificationOccurred('success');
    }
  };

  const handleCancelWorkout = () => {
    const confirmMessage = setsCount > 0 
      ? `Вы уверены, что хотите отменить тренировку? Все данные о ${setsCount} ${setsCount === 1 ? 'подходе' : setsCount < 5 ? 'подходах' : 'подходах'} и ${totalReps} повторениях будут потеряны.`
      : 'Вы уверены, что хотите отменить тренировку?';

    if (window.confirm(confirmMessage)) {
      onCancelWorkout();
      
      // Haptic feedback if available
      if (typeof window !== 'undefined' && window.Telegram?.WebApp?.HapticFeedback) {
        window.Telegram.WebApp.HapticFeedback.notificationOccurred('warning');
      }
    }
  };

  const canFinishWorkout = setsCount > 0 && totalReps > 0;

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Summary */}
      {setsCount > 0 && (
        <div className="bg-accent/50 rounded-lg p-4 text-center">
          <div className="text-sm text-muted-foreground mb-1">
            Готово к завершению
          </div>
          <div className="text-lg font-semibold">
            {setsCount} {setsCount === 1 ? 'подход' : setsCount < 5 ? 'подхода' : 'подходов'} • {totalReps} повторений
          </div>
        </div>
      )}

      {/* Control buttons */}
      <div className="space-y-3">
        {/* Finish Workout Button */}
        <Button
          size="lg"
          onClick={handleFinishWorkout}
          disabled={!canFinishWorkout || disabled || isLoading}
          className="w-full bg-green-600 hover:bg-green-700 text-white"
        >
          <CheckCircle2 className="mr-2 h-5 w-5" />
          {isLoading ? 'Сохранение...' : 'Завершить тренировку'}
        </Button>

        {/* Cancel Workout Button */}
        <Button
          variant="ghost"
          size="lg"
          onClick={handleCancelWorkout}
          disabled={disabled || isLoading}
          className="w-full text-destructive hover:text-destructive hover:bg-destructive/10"
        >
          <X className="mr-2 h-5 w-5" />
          Отменить тренировку
        </Button>
      </div>

      {/* Hints */}
      {setsCount === 0 && (
        <div className="text-center text-sm text-muted-foreground">
          Добавьте хотя бы один подход для завершения тренировки
        </div>
      )}
    </div>
  );
};
'use client';

import { FC, useEffect, useState, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Play, Pause } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface TimerProps {
  /**
   * Callback to receive duration updates in seconds
   */
  onDurationChange?: (seconds: number) => void;
  /**
   * Auto-start the timer when component mounts
   * @default true
   */
  autoStart?: boolean;
  /**
   * Initial time in seconds
   * @default 0
   */
  initialTime?: number;
  /**
   * Additional CSS classes
   */
  className?: string;
}

export const Timer: FC<TimerProps> = ({
  onDurationChange,
  autoStart = true,
  initialTime = 0,
  className
}) => {
  const [seconds, setSeconds] = useState(initialTime);
  const [isRunning, setIsRunning] = useState(autoStart);

  // Format time as MM:SS
  const formatTime = useCallback((totalSeconds: number): string => {
    const minutes = Math.floor(totalSeconds / 60);
    const remainingSeconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  }, []);

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isRunning) {
      interval = setInterval(() => {
        setSeconds(prevSeconds => {
          const newSeconds = prevSeconds + 1;
          onDurationChange?.(newSeconds);
          return newSeconds;
        });
      }, 1000);
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [isRunning, onDurationChange]);

  const toggleTimer = () => {
    setIsRunning(!isRunning);
    
    // Haptic feedback if available
    if (typeof window !== 'undefined' && window.Telegram?.WebApp?.HapticFeedback) {
      window.Telegram.WebApp.HapticFeedback.selectionChanged();
    }
  };

  const resetTimer = () => {
    setSeconds(initialTime);
    setIsRunning(false);
    onDurationChange?.(initialTime);
    
    // Haptic feedback if available
    if (typeof window !== 'undefined' && window.Telegram?.WebApp?.HapticFeedback) {
      window.Telegram.WebApp.HapticFeedback.notificationOccurred('warning');
    }
  };

  return (
    <Card className={className}>
      <CardContent className="p-6">
        <div className="text-center space-y-4">
          {/* Timer Display */}
          <div className="text-6xl font-bold text-pink-gradient font-mono">
            {formatTime(seconds)}
          </div>
          
          {/* Timer Label */}
          <div className="text-muted-foreground">
            Время тренировки
          </div>

          {/* Timer Controls */}
          <div className="flex justify-center gap-4">
            <Button
              variant="outline"
              size="sm"
              onClick={toggleTimer}
              className="flex items-center gap-2"
            >
              {isRunning ? (
                <>
                  <Pause className="h-4 w-4" />
                  Пауза
                </>
              ) : (
                <>
                  <Play className="h-4 w-4" />
                  Старт
                </>
              )}
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={resetTimer}
              disabled={seconds === initialTime}
            >
              Сброс
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
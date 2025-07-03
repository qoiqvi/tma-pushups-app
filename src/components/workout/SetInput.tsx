'use client';

import { FC, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Minus } from 'lucide-react';

interface SetInputProps {
  /**
   * Callback when a set is added
   */
  onAddSet: (reps: number) => void;
  /**
   * Whether the component is disabled
   * @default false
   */
  disabled?: boolean;
  /**
   * Additional CSS classes
   */
  className?: string;
}

export const SetInput: FC<SetInputProps> = ({
  onAddSet,
  disabled = false,
  className
}) => {
  const [reps, setReps] = useState(10);

  const adjustReps = (delta: number) => {
    const newReps = Math.max(1, Math.min(999, reps + delta));
    setReps(newReps);
    
    // Haptic feedback if available
    if (typeof window !== 'undefined' && window.Telegram?.WebApp?.HapticFeedback) {
      window.Telegram.WebApp.HapticFeedback.selectionChanged();
    }
  };

  const handleAddSet = () => {
    if (reps > 0 && !disabled) {
      onAddSet(reps);
      
      // Haptic feedback if available
      if (typeof window !== 'undefined' && window.Telegram?.WebApp?.HapticFeedback) {
        window.Telegram.WebApp.HapticFeedback.notificationOccurred('success');
      }
    }
  };

  const handleInputChange = (value: string) => {
    const numValue = parseInt(value);
    if (!isNaN(numValue) && numValue >= 1 && numValue <= 999) {
      setReps(numValue);
    } else if (value === '') {
      setReps(1);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAddSet();
    }
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-center">Добавить подход</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Rep Counter */}
        <div className="space-y-4">
          <div className="text-center">
            <div className="text-sm text-muted-foreground mb-2">
              Количество повторений
            </div>
            
            {/* Large adjustment buttons */}
            <div className="flex items-center justify-center gap-4">
              <Button
                variant="outline"
                size="lg"
                onClick={() => adjustReps(-5)}
                disabled={disabled || reps <= 5}
                className="h-12 w-12 rounded-full p-0"
              >
                <Minus className="h-6 w-6" />
              </Button>
              
              <Button
                variant="outline"
                size="lg"
                onClick={() => adjustReps(-1)}
                disabled={disabled || reps <= 1}
                className="h-12 w-12 rounded-full p-0"
              >
                <Minus className="h-4 w-4" />
              </Button>

              {/* Rep input/display */}
              <div className="flex flex-col items-center">
                <Input
                  type="number"
                  value={reps}
                  onChange={(e) => handleInputChange(e.target.value)}
                  onKeyPress={handleKeyPress}
                  disabled={disabled}
                  min={1}
                  max={999}
                  className="text-center text-2xl font-bold w-20 h-12 border-2 border-primary"
                />
              </div>

              <Button
                variant="outline"
                size="lg"
                onClick={() => adjustReps(1)}
                disabled={disabled || reps >= 999}
                className="h-12 w-12 rounded-full p-0"
              >
                <Plus className="h-4 w-4" />
              </Button>
              
              <Button
                variant="outline"
                size="lg"
                onClick={() => adjustReps(5)}
                disabled={disabled || reps >= 995}
                className="h-12 w-12 rounded-full p-0"
              >
                <Plus className="h-6 w-6" />
              </Button>
            </div>
          </div>

          {/* Quick preset buttons */}
          <div className="flex justify-center gap-2">
            {[5, 10, 15, 20, 25].map((preset) => (
              <Button
                key={preset}
                variant="ghost"
                size="sm"
                onClick={() => setReps(preset)}
                disabled={disabled}
                className="text-xs"
              >
                {preset}
              </Button>
            ))}
          </div>
        </div>

        {/* Add Set Button */}
        <Button
          size="lg"
          onClick={handleAddSet}
          disabled={disabled || reps < 1}
          className="w-full bg-pink-gradient hover:opacity-90 transition-opacity"
        >
          <Plus className="mr-2 h-5 w-5" />
          Добавить подход ({reps} повторений)
        </Button>
      </CardContent>
    </Card>
  );
};
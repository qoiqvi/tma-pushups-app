'use client';

import { FC, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Trash2, Edit3, Check, X } from 'lucide-react';

export interface WorkoutSet {
  id: string;
  setNumber: number;
  reps: number;
}

interface SetsListProps {
  /**
   * Array of sets to display
   */
  sets: WorkoutSet[];
  /**
   * Callback when a set is updated
   */
  onUpdateSet: (setId: string, reps: number) => void;
  /**
   * Callback when a set is deleted
   */
  onDeleteSet: (setId: string) => void;
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

export const SetsList: FC<SetsListProps> = ({
  sets,
  onUpdateSet,
  onDeleteSet,
  disabled = false,
  className
}) => {
  const [editingSetId, setEditingSetId] = useState<string | null>(null);
  const [editingReps, setEditingReps] = useState<number>(0);

  const totalReps = sets.reduce((sum, set) => sum + set.reps, 0);

  const startEdit = (set: WorkoutSet) => {
    setEditingSetId(set.id);
    setEditingReps(set.reps);
    
    // Haptic feedback if available
    if (typeof window !== 'undefined' && window.Telegram?.WebApp?.HapticFeedback) {
      window.Telegram.WebApp.HapticFeedback.selectionChanged();
    }
  };

  const cancelEdit = () => {
    setEditingSetId(null);
    setEditingReps(0);
  };

  const saveEdit = () => {
    if (editingSetId && editingReps > 0) {
      onUpdateSet(editingSetId, editingReps);
      setEditingSetId(null);
      setEditingReps(0);
      
      // Haptic feedback if available
      if (typeof window !== 'undefined' && window.Telegram?.WebApp?.HapticFeedback) {
        window.Telegram.WebApp.HapticFeedback.notificationOccurred('success');
      }
    }
  };

  const handleDelete = (setId: string) => {
    onDeleteSet(setId);
    
    // Haptic feedback if available
    if (typeof window !== 'undefined' && window.Telegram?.WebApp?.HapticFeedback) {
      window.Telegram.WebApp.HapticFeedback.notificationOccurred('warning');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      saveEdit();
    } else if (e.key === 'Escape') {
      cancelEdit();
    }
  };

  if (sets.length === 0) {
    return (
      <Card className={className}>
        <CardContent className="p-6 text-center">
          <p className="text-muted-foreground">
            Подходы пока не добавлены
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          <span>Подходы ({sets.length})</span>
          <span className="text-primary font-bold">
            {totalReps} повторений
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {sets.map((set) => (
          <div
            key={set.id}
            className="flex items-center justify-between p-3 border border-border rounded-lg bg-card"
          >
            {/* Set number */}
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-bold">
                {set.setNumber}
              </div>
              
              {/* Reps display/edit */}
              {editingSetId === set.id ? (
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    value={editingReps}
                    onChange={(e) => setEditingReps(parseInt(e.target.value) || 0)}
                    onKeyPress={handleKeyPress}
                    min={1}
                    max={999}
                    className="w-20 h-8 text-center"
                    autoFocus
                  />
                  <span className="text-sm text-muted-foreground">повторений</span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-lg">{set.reps}</span>
                  <span className="text-sm text-muted-foreground">
                    {set.reps === 1 ? 'повторение' : 
                     set.reps < 5 ? 'повторения' : 'повторений'}
                  </span>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1">
              {editingSetId === set.id ? (
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={saveEdit}
                    disabled={editingReps < 1}
                    className="h-8 w-8 p-0 text-green-600 hover:text-green-700"
                  >
                    <Check className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={cancelEdit}
                    className="h-8 w-8 p-0 text-gray-600 hover:text-gray-700"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => startEdit(set)}
                    disabled={disabled}
                    className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
                  >
                    <Edit3 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(set.id)}
                    disabled={disabled}
                    className="h-8 w-8 p-0 text-destructive hover:text-destructive/80"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </>
              )}
            </div>
          </div>
        ))}

        {/* Summary */}
        {sets.length > 1 && (
          <div className="pt-3 border-t border-border">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Всего подходов:</span>
              <span className="font-semibold">{sets.length}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Всего повторений:</span>
              <span className="font-semibold text-primary">{totalReps}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Среднее за подход:</span>
              <span className="font-semibold">
                {Math.round((totalReps / sets.length) * 10) / 10}
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
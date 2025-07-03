'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Layout } from '@/components/layout';
import { Timer, SetInput, SetsList, WorkoutControls } from '@/components/workout';
import { useWorkoutStore } from '@/stores/workoutStore';
import { useCreateWorkout, useUpdateWorkout, useActiveWorkout } from '@/hooks/useWorkouts';
import { LoadingSpinner } from '@/components/shared';

export default function WorkoutPage() {
  const router = useRouter();
  const [currentDuration, setCurrentDuration] = useState(0);
  
  // Store state
  const {
    currentWorkout,
    isLoading: storeLoading,
    error,
    startWorkout,
    addSet,
    updateSet,
    deleteSet,
    finishWorkout,
    cancelWorkout,
    setLoading,
    setError,
    getTotalReps,
    getTotalSets
  } = useWorkoutStore();

  // API hooks
  const createWorkoutMutation = useCreateWorkout();
  const updateWorkoutMutation = useUpdateWorkout(currentWorkout?.id || '');
  const { data: activeWorkoutData } = useActiveWorkout();

  // Initialize workout on mount
  useEffect(() => {
    const initializeWorkout = async () => {
      if (currentWorkout) return; // Already have a workout

      try {
        setLoading(true);
        setError(null);

        // Check if there's an active workout
        if (activeWorkoutData) {
          // Resume existing workout
          startWorkout(activeWorkoutData.id);
        } else {
          // Create new workout
          const newWorkout = await createWorkoutMutation.mutateAsync({
            started_at: new Date().toISOString()
          });
          startWorkout(newWorkout.id);
        }
      } catch (err) {
        setError('Не удалось создать тренировку');
        console.error('Failed to initialize workout:', err);
      } finally {
        setLoading(false);
      }
    };

    initializeWorkout();
  }, [currentWorkout, activeWorkoutData, startWorkout, createWorkoutMutation, setLoading, setError]);

  const handleAddSet = (reps: number) => {
    if (!currentWorkout) return;
    addSet(reps);
  };

  const handleUpdateSet = (setId: string, reps: number) => {
    if (!currentWorkout) return;
    updateSet(setId, reps);
  };

  const handleDeleteSet = (setId: string) => {
    if (!currentWorkout) return;
    deleteSet(setId);
  };

  const handleFinishWorkout = async () => {
    if (!currentWorkout) return;

    try {
      setLoading(true);
      setError(null);

      // Get final workout data
      const workoutResult = finishWorkout();
      
      // Update workout in database
      await updateWorkoutMutation.mutateAsync({
        finished_at: new Date().toISOString(),
        duration_seconds: workoutResult.duration,
        total_reps: workoutResult.totalReps,
        total_sets: workoutResult.totalSets
      });

      // Navigate to results page
      router.push(`/workout/result/${currentWorkout.id}`);
    } catch (err) {
      setError('Не удалось сохранить тренировку');
      console.error('Failed to finish workout:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelWorkout = () => {
    cancelWorkout();
    router.push('/');
  };

  const isLoading = storeLoading || createWorkoutMutation.isPending || updateWorkoutMutation.isPending;

  if (isLoading && !currentWorkout) {
    return (
      <Layout back>
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-center min-h-[50vh]">
            <div className="text-center space-y-4">
              <LoadingSpinner size="lg" />
              <p className="text-muted-foreground">Подготовка тренировки...</p>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (error && !currentWorkout) {
    return (
      <Layout back>
        <div className="container mx-auto px-4 py-6">
          <div className="text-center space-y-4">
            <p className="text-destructive">{error}</p>
            <button 
              onClick={() => router.push('/')}
              className="text-primary hover:underline"
            >
              Вернуться на главную
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  if (!currentWorkout) {
    return (
      <Layout back>
        <div className="container mx-auto px-4 py-6">
          <div className="text-center space-y-4">
            <p className="text-muted-foreground">Тренировка не найдена</p>
            <button 
              onClick={() => router.push('/')}
              className="text-primary hover:underline"
            >
              Вернуться на главную
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout back>
      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-2xl font-bold text-primary mb-2">Тренировка</h1>
          <p className="text-muted-foreground">
            Добавляйте подходы и отслеживайте прогресс
          </p>
        </div>

        {/* Timer */}
        <Timer 
          onDurationChange={setCurrentDuration}
          autoStart={true}
        />

        {/* Add Set */}
        <SetInput 
          onAddSet={handleAddSet}
          disabled={isLoading}
        />

        {/* Sets List */}
        <SetsList
          sets={currentWorkout.sets}
          onUpdateSet={handleUpdateSet}
          onDeleteSet={handleDeleteSet}
          disabled={isLoading}
        />

        {/* Workout Controls */}
        <WorkoutControls
          setsCount={getTotalSets()}
          totalReps={getTotalReps()}
          onFinishWorkout={handleFinishWorkout}
          onCancelWorkout={handleCancelWorkout}
          disabled={false}
          isLoading={isLoading}
        />

        {/* Error Display */}
        {error && (
          <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 text-center">
            <p className="text-destructive text-sm">{error}</p>
          </div>
        )}
      </div>
    </Layout>
  );
}
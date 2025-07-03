'use client';

import { Layout } from '@/components/layout';
import { WorkoutSummary } from '@/components/workout/WorkoutSummary';
import { PhotoUpload } from '@/components/workout/PhotoUpload';
import { ShareCard } from '@/components/workout/ShareCard';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { useParams } from 'next/navigation';
import { useWorkout } from '@/hooks/useWorkouts';
import { useWorkoutPhotos, useProcessPhoto } from '@/hooks/usePhotos';
import { useState } from 'react';

export default function WorkoutResultPage() {
  const params = useParams();
  const workoutId = params.id as string;
  const [uploadedPhotoId, setUploadedPhotoId] = useState<string | null>(null);

  const { data: workout, isLoading, error } = useWorkout(workoutId);
  const { data: photos, refetch: refetchPhotos } = useWorkoutPhotos(workoutId);
  const processPhotoMutation = useProcessPhoto();

  const currentPhoto = photos?.[0] || null;

  const handlePhotoUploaded = (photoUrl: string, photoId: string) => {
    setUploadedPhotoId(photoId);
    refetchPhotos();
    
    // Trigger photo processing
    processPhotoMutation.mutate(photoId);
  };

  const handleRefreshPhoto = () => {
    refetchPhotos();
    if (currentPhoto) {
      processPhotoMutation.mutate(currentPhoto.id);
    }
  };

  if (isLoading) {
    return (
      <Layout back>
        <div className="container mx-auto px-4 py-6">
          <LoadingSpinner />
        </div>
      </Layout>
    );
  }

  if (error || !workout) {
    return (
      <Layout back>
        <div className="container mx-auto px-4 py-6">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-destructive mb-4">Ошибка</h1>
            <p className="text-muted-foreground">
              Не удалось загрузить данные тренировки
            </p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout back>
      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* Workout Summary */}
        <WorkoutSummary 
          workout={workout}
        />
        
        {/* Photo Upload */}
        <PhotoUpload
          workoutId={workoutId}
          onPhotoUploaded={handlePhotoUploaded}
        />
        
        {/* Share Card */}
        <ShareCard
          workout={workout}
          photo={currentPhoto || undefined}
          onRefreshPhoto={handleRefreshPhoto}
        />
      </div>
    </Layout>
  );
}
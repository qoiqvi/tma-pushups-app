'use client';

import { Layout } from '@/components/layout';
import { useParams } from 'next/navigation';

export default function WorkoutResultPage() {
  const params = useParams();
  const workoutId = params.id as string;

  return (
    <Layout back>
      <div className="container mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold text-primary mb-6">Результат тренировки</h1>
        <p className="text-muted-foreground mb-4">
          Workout ID: {workoutId}
        </p>
        <p className="text-muted-foreground">
          Этот экран будет реализован в Phase 6
        </p>
      </div>
    </Layout>
  );
}
'use client';

import { Layout } from '@/components/layout';
import { Button } from '@/components/ui/button';
import { Activity } from 'lucide-react';
import { Link } from '@/components/Link/Link';
import { WelcomeCard, QuickStats, LastWorkoutCard } from '@/components/home';

export default function Home() {
  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-b from-background to-accent/20">
        <div className="container mx-auto px-4 py-6 space-y-6">
          {/* Welcome Card */}
          <WelcomeCard />

          {/* Start Workout Button */}
          <div className="flex justify-center">
            <Link href="/workout">
              <Button size="lg" className="bg-pink-gradient shadow-lg">
                <Activity className="mr-2" />
                Начать тренировку
              </Button>
            </Link>
          </div>

          {/* Quick Stats */}
          <QuickStats />

          {/* Last Workout */}
          <LastWorkoutCard />
        </div>
      </div>
    </Layout>
  );
}

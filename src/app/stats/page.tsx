'use client';

import { useState } from 'react';
import { Layout } from '@/components/layout';
import { PeriodSelector, Period } from '@/components/stats/PeriodSelector';
import { StatsCards } from '@/components/stats/StatsCards';
import { ProgressChart } from '@/components/stats/ProgressChart';
import { PersonalRecords } from '@/components/stats/PersonalRecords';
import { BarChart3 } from 'lucide-react';

export default function StatsPage() {
  const [selectedPeriod, setSelectedPeriod] = useState<Period>('month');

  return (
    <Layout back>
      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <BarChart3 className="h-8 w-8 text-primary" />
          <h1 className="text-2xl font-bold text-primary">Статистика</h1>
        </div>

        {/* Period Selector */}
        <PeriodSelector 
          selectedPeriod={selectedPeriod}
          onPeriodChange={setSelectedPeriod}
        />

        {/* Stats Cards */}
        <StatsCards period={selectedPeriod} />

        {/* Progress Chart */}
        <ProgressChart period={selectedPeriod} />

        {/* Personal Records */}
        <PersonalRecords />
      </div>
    </Layout>
  );
}
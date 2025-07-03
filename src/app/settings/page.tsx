'use client';

import { Layout } from '@/components/layout';
import { 
  ProfileSection, 
  ReminderSettings, 
  ThemeToggle, 
  AboutSection 
} from '@/components/settings';

export default function SettingsPage() {
  return (
    <Layout back>
      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-2xl font-bold text-primary mb-2">Настройки</h1>
          <p className="text-muted-foreground">
            Персонализируйте своё приложение
          </p>
        </div>

        {/* Profile Section */}
        <ProfileSection />

        {/* Reminder Settings */}
        <ReminderSettings />

        {/* Theme Toggle */}
        <ThemeToggle />

        {/* About Section */}
        <AboutSection />
      </div>
    </Layout>
  );
}
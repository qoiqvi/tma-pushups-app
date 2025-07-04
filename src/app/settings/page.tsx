'use client';

import { Layout } from '@/components/layout';
import { 
  ProfileSection, 
  ReminderSettings, 
  ThemeToggle, 
  AboutSection 
} from '@/components/settings';
import { Link } from '@/components/Link/Link';
import { Button } from '@/components/ui/button';
import { Bug } from 'lucide-react';

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

        {/* Debug Link - всегда показываем для отладки */}
        <div className="pt-4 border-t">
          <Link href="/debug">
            <Button variant="outline" className="w-full">
              <Bug className="h-4 w-4 mr-2" />
              Debug Page
            </Button>
          </Link>
        </div>
      </div>
    </Layout>
  );
}
'use client';

import { FC, useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Bell, Clock, Calendar, Save, Loader2 } from 'lucide-react';
import { useReminderSettings, useUpdateReminderSettings } from '@/hooks/useReminders';
import { LoadingSpinner } from '@/components/shared';

interface ReminderSettingsProps {
  className?: string;
}

const DAYS_OF_WEEK = [
  { value: 1, label: 'Пн', full: 'Понедельник' },
  { value: 2, label: 'Вт', full: 'Вторник' },
  { value: 3, label: 'Ср', full: 'Среда' },
  { value: 4, label: 'Чт', full: 'Четверг' },
  { value: 5, label: 'Пт', full: 'Пятница' },
  { value: 6, label: 'Сб', full: 'Суббота' },
  { value: 7, label: 'Вс', full: 'Воскресенье' },
];

export const ReminderSettings: FC<ReminderSettingsProps> = ({ className }) => {
  const { data: settings, isLoading, error } = useReminderSettings();
  const updateMutation = useUpdateReminderSettings();

  const [enabled, setEnabled] = useState(true);
  const [selectedDays, setSelectedDays] = useState<number[]>([1, 3, 5]);
  const [reminderTime, setReminderTime] = useState('09:00');
  const [hasChanges, setHasChanges] = useState(false);

  // Update local state when settings are loaded
  useEffect(() => {
    if (settings) {
      setEnabled(settings.enabled);
      setSelectedDays(settings.days_of_week);
      // Convert HH:MM:SS to HH:MM for input
      setReminderTime(settings.reminder_time.slice(0, 5));
    }
  }, [settings]);

  // Track changes
  useEffect(() => {
    if (!settings) return;
    
    const timeChanged = reminderTime !== settings.reminder_time.slice(0, 5);
    const daysChanged = JSON.stringify(selectedDays.sort()) !== JSON.stringify(settings.days_of_week.sort());
    const enabledChanged = enabled !== settings.enabled;
    
    setHasChanges(timeChanged || daysChanged || enabledChanged);
  }, [settings, enabled, selectedDays, reminderTime]);

  const handleDayToggle = (day: number) => {
    setSelectedDays(prev => {
      if (prev.includes(day)) {
        return prev.filter(d => d !== day);
      } else {
        return [...prev, day].sort();
      }
    });
  };

  const handleSaveSettings = async () => {
    try {
      await updateMutation.mutateAsync({
        enabled,
        days_of_week: selectedDays,
        reminder_time: `${reminderTime}:00`
      });
      
      // Haptic feedback if available
      if (typeof window !== 'undefined' && window.Telegram?.WebApp?.HapticFeedback) {
        window.Telegram.WebApp.HapticFeedback.notificationOccurred('success');
      }
    } catch (error) {
      console.error('Failed to save reminder settings:', error);
      
      // Haptic feedback if available
      if (typeof window !== 'undefined' && window.Telegram?.WebApp?.HapticFeedback) {
        window.Telegram.WebApp.HapticFeedback.notificationOccurred('error');
      }
    }
  };

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-primary" />
            Напоминания
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <LoadingSpinner />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-primary" />
            Напоминания
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">
            <p className="text-destructive text-sm mb-4">
              Ошибка загрузки настроек
            </p>
            <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
              Повторить
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5 text-primary" />
          Напоминания о тренировках
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Enable/Disable Toggle */}
        <div className="flex items-center justify-between">
          <div>
            <Label className="text-base font-medium">Включить напоминания</Label>
            <p className="text-sm text-muted-foreground">
              Получать уведомления о тренировках
            </p>
          </div>
          <Button
            variant={enabled ? "default" : "outline"}
            size="sm"
            onClick={() => setEnabled(!enabled)}
            className={enabled ? "bg-green-600 hover:bg-green-700" : ""}
          >
            {enabled ? 'Включено' : 'Выключено'}
          </Button>
        </div>

        {enabled && (
          <>
            {/* Time Selection */}
            <div className="space-y-3">
              <Label className="flex items-center gap-2 text-base font-medium">
                <Clock className="h-4 w-4" />
                Время напоминания
              </Label>
              <Input
                type="time"
                value={reminderTime}
                onChange={(e) => setReminderTime(e.target.value)}
                className="w-full"
              />
            </div>

            {/* Days Selection */}
            <div className="space-y-3">
              <Label className="flex items-center gap-2 text-base font-medium">
                <Calendar className="h-4 w-4" />
                Дни недели
              </Label>
              <div className="grid grid-cols-7 gap-2">
                {DAYS_OF_WEEK.map((day) => (
                  <Button
                    key={day.value}
                    variant={selectedDays.includes(day.value) ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleDayToggle(day.value)}
                    className={`p-2 h-10 ${
                      selectedDays.includes(day.value) 
                        ? "bg-primary text-primary-foreground" 
                        : ""
                    }`}
                    title={day.full}
                  >
                    {day.label}
                  </Button>
                ))}
              </div>
              
              {selectedDays.length === 0 && (
                <p className="text-sm text-amber-600">
                  Выберите хотя бы один день для напоминаний
                </p>
              )}
            </div>

            {/* Timezone info */}
            {settings?.timezone && (
              <div className="text-sm text-muted-foreground">
                🌐 Часовой пояс: {settings.timezone}
              </div>
            )}
          </>
        )}

        {/* Save Button */}
        <Button
          onClick={handleSaveSettings}
          disabled={!hasChanges || updateMutation.isPending || (enabled && selectedDays.length === 0)}
          className="w-full bg-pink-gradient hover:opacity-90"
        >
          {updateMutation.isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Сохранение...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Сохранить настройки
            </>
          )}
        </Button>

        {/* Success message */}
        {updateMutation.isSuccess && (
          <div className="text-center text-sm text-green-600">
            ✅ Настройки сохранены
          </div>
        )}

        {/* Error message */}
        {updateMutation.isError && (
          <div className="text-center text-sm text-destructive">
            ❌ Ошибка сохранения настроек
          </div>
        )}
      </CardContent>
    </Card>
  );
};
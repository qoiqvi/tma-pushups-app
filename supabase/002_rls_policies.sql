-- Файл: supabase/migrations/002_rls_policies.sql

-- Включаем RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reminder_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_stats ENABLE ROW LEVEL SECURITY;

-- Для Telegram Mini App используем service_role, так как аутентификация через Telegram
-- Политики разрешают доступ только для service_role

-- Политики для users
CREATE POLICY "Service role has full access to users" ON public.users
  FOR ALL USING (auth.role() = 'service_role');

-- Политики для workouts
CREATE POLICY "Service role has full access to workouts" ON public.workouts
  FOR ALL USING (auth.role() = 'service_role');

-- Политики для sets
CREATE POLICY "Service role has full access to sets" ON public.sets
  FOR ALL USING (auth.role() = 'service_role');

-- Политики для reminder_settings
CREATE POLICY "Service role has full access to reminder_settings" ON public.reminder_settings
  FOR ALL USING (auth.role() = 'service_role');

-- Политики для workout_photos
CREATE POLICY "Service role has full access to workout_photos" ON public.workout_photos
  FOR ALL USING (auth.role() = 'service_role');

-- Политики для user_stats
CREATE POLICY "Service role has full access to user_stats" ON public.user_stats
  FOR ALL USING (auth.role() = 'service_role');
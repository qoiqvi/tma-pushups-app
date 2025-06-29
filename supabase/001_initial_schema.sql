-- Файл: supabase/migrations/001_initial_schema.sql

-- Включаем расширения
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Таблица пользователей
CREATE TABLE public.users (
  telegram_id BIGINT PRIMARY KEY,
  username TEXT,
  first_name TEXT,
  last_name TEXT,
  language_code TEXT DEFAULT 'ru',
  is_premium BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Таблица тренировок
CREATE TABLE public.workouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id BIGINT NOT NULL REFERENCES public.users(telegram_id) ON DELETE CASCADE,
  started_at TIMESTAMPTZ NOT NULL,
  finished_at TIMESTAMPTZ,
  duration_seconds INT,
  total_reps INT NOT NULL DEFAULT 0,
  total_sets INT NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Индексы для workouts
CREATE INDEX idx_workouts_user_id ON public.workouts(user_id);
CREATE INDEX idx_workouts_started_at ON public.workouts(started_at DESC);

-- Таблица подходов
CREATE TABLE public.sets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workout_id UUID NOT NULL REFERENCES public.workouts(id) ON DELETE CASCADE,
  set_number INT NOT NULL,
  reps INT NOT NULL,
  rest_seconds INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Уникальность номера подхода в рамках тренировки
  UNIQUE(workout_id, set_number)
);

-- Индекс для sets
CREATE INDEX idx_sets_workout_id ON public.sets(workout_id);

-- Таблица настроек напоминаний
CREATE TABLE public.reminder_settings (
  user_id BIGINT PRIMARY KEY REFERENCES public.users(telegram_id) ON DELETE CASCADE,
  days_of_week INT[] DEFAULT '{1,3,5}',
  reminder_time TIME DEFAULT '09:00:00',
  timezone TEXT DEFAULT 'Europe/Moscow',
  enabled BOOLEAN DEFAULT true,
  last_sent_at DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Таблица фотографий тренировок
CREATE TABLE public.workout_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workout_id UUID NOT NULL REFERENCES public.workouts(id) ON DELETE CASCADE,
  original_url TEXT NOT NULL,
  processed_url TEXT,
  stats_overlay_applied BOOLEAN DEFAULT false,
  processing_status TEXT DEFAULT 'pending', -- pending, processing, completed, failed
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Индекс для photos
CREATE INDEX idx_photos_workout_id ON public.workout_photos(workout_id);

-- Таблица статистики (для кеширования)
CREATE TABLE public.user_stats (
  user_id BIGINT PRIMARY KEY REFERENCES public.users(telegram_id) ON DELETE CASCADE,
  total_workouts INT DEFAULT 0,
  total_reps INT DEFAULT 0,
  current_streak INT DEFAULT 0,
  max_streak INT DEFAULT 0,
  last_workout_date DATE,
  avg_reps_per_workout FLOAT DEFAULT 0,
  personal_best_reps INT DEFAULT 0,
  personal_best_date DATE,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Функция для обновления updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Триггеры для автообновления updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_reminder_settings_updated_at BEFORE UPDATE ON public.reminder_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
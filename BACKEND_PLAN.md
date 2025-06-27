# План реализации Backend функционала для Pushups Tracker

## 📋 Обзор
Детальный план реализации всех backend компонентов для Telegram Mini App трекера отжиманий. План оптимизирован для выполнения AI агентом с четкими шагами и проверками.

## 🎯 Цели Backend
1. Настройка Supabase с полной схемой БД
2. Реализация аутентификации через Telegram
3. API endpoints для всех операций
4. Система хранения изображений
5. Бот для напоминаний

## 📊 Архитектура Backend

### 1. Supabase Setup (Приоритет: КРИТИЧЕСКИЙ)

#### 1.1 Создание проекта Supabase
```bash
# Файл: .env.local
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_key
```

#### 1.2 Схема базы данных
```sql
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
```

#### 1.3 Row Level Security (RLS)
```sql
-- Файл: supabase/migrations/002_rls_policies.sql

-- Включаем RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reminder_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_stats ENABLE ROW LEVEL SECURITY;

-- Политики для users
CREATE POLICY "Users can view own profile" ON public.users
  FOR SELECT USING (telegram_id = auth.uid()::BIGINT);

CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE USING (telegram_id = auth.uid()::BIGINT);

-- Политики для workouts
CREATE POLICY "Users can view own workouts" ON public.workouts
  FOR SELECT USING (user_id = auth.uid()::BIGINT);

CREATE POLICY "Users can create own workouts" ON public.workouts
  FOR INSERT WITH CHECK (user_id = auth.uid()::BIGINT);

CREATE POLICY "Users can update own workouts" ON public.workouts
  FOR UPDATE USING (user_id = auth.uid()::BIGINT);

CREATE POLICY "Users can delete own workouts" ON public.workouts
  FOR DELETE USING (user_id = auth.uid()::BIGINT);

-- Аналогичные политики для других таблиц...
```

### 2. Supabase Client Configuration

#### 2.1 Базовый клиент
```typescript
// Файл: src/lib/supabase/client.ts
import { createClient } from '@supabase/supabase-js'
import { Database } from './types'

export const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    }
  }
)
```

#### 2.2 Типы для TypeScript
```typescript
// Файл: src/lib/supabase/types.ts
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          telegram_id: number
          username: string | null
          first_name: string | null
          last_name: string | null
          language_code: string
          is_premium: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          telegram_id: number
          username?: string | null
          first_name?: string | null
          last_name?: string | null
          language_code?: string
          is_premium?: boolean
        }
        Update: {
          username?: string | null
          first_name?: string | null
          last_name?: string | null
          language_code?: string
          is_premium?: boolean
        }
      }
      workouts: {
        Row: {
          id: string
          user_id: number
          started_at: string
          finished_at: string | null
          duration_seconds: number | null
          total_reps: number
          total_sets: number
          notes: string | null
          created_at: string
        }
        Insert: {
          user_id: number
          started_at: string
          finished_at?: string | null
          duration_seconds?: number | null
          total_reps?: number
          total_sets?: number
          notes?: string | null
        }
        Update: {
          finished_at?: string | null
          duration_seconds?: number | null
          total_reps?: number
          total_sets?: number
          notes?: string | null
        }
      }
      // ... остальные таблицы
    }
  }
}
```

### 3. Telegram Authentication

#### 3.1 Валидация InitData
```typescript
// Файл: src/lib/telegram/auth.ts
import crypto from 'crypto'

interface TelegramUser {
  id: number
  first_name: string
  last_name?: string
  username?: string
  language_code?: string
  is_premium?: boolean
}

export function validateTelegramWebAppData(initData: string): TelegramUser | null {
  const urlParams = new URLSearchParams(initData)
  const hash = urlParams.get('hash')
  urlParams.delete('hash')
  
  // Сортируем параметры
  const checkString = Array.from(urlParams.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`)
    .join('\n')
  
  // Проверяем подпись
  const secretKey = crypto
    .createHmac('sha256', 'WebAppData')
    .update(process.env.TELEGRAM_BOT_TOKEN!)
    .digest()
  
  const calculatedHash = crypto
    .createHmac('sha256', secretKey)
    .update(checkString)
    .digest('hex')
  
  if (calculatedHash !== hash) {
    return null
  }
  
  // Парсим user data
  const userString = urlParams.get('user')
  if (!userString) return null
  
  try {
    return JSON.parse(userString) as TelegramUser
  } catch {
    return null
  }
}
```

#### 3.2 Middleware для аутентификации
```typescript
// Файл: src/middleware.ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { validateTelegramWebAppData } from '@/lib/telegram/auth'

export function middleware(request: NextRequest) {
  // Пропускаем статику и API routes
  if (request.nextUrl.pathname.startsWith('/_next') ||
      request.nextUrl.pathname.startsWith('/api/auth')) {
    return NextResponse.next()
  }
  
  // Получаем initData из заголовка
  const initData = request.headers.get('X-Telegram-Init-Data')
  
  if (!initData) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    )
  }
  
  const user = validateTelegramWebAppData(initData)
  
  if (!user) {
    return NextResponse.json(
      { error: 'Invalid init data' },
      { status: 401 }
    )
  }
  
  // Добавляем user в заголовки для использования в API
  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('X-User-Id', user.id.toString())
  requestHeaders.set('X-User-Data', JSON.stringify(user))
  
  return NextResponse.next({
    request: {
      headers: requestHeaders,
    }
  })
}

export const config = {
  matcher: ['/api/:path*']
}
```

### 4. API Routes Implementation

#### 4.1 Структура API
```
src/app/api/
├── auth/
│   └── telegram/
│       └── route.ts      # POST - Авторизация через Telegram
├── workouts/
│   ├── route.ts          # GET, POST - Список тренировок, создание
│   └── [id]/
│       ├── route.ts      # GET, PUT, DELETE - Операции с тренировкой
│       └── sets/
│           └── route.ts  # GET, POST - Подходы тренировки
├── stats/
│   └── route.ts          # GET - Статистика пользователя
├── reminders/
│   └── route.ts          # GET, PUT - Настройки напоминаний
└── photos/
    ├── upload/
    │   └── route.ts      # POST - Загрузка фото
    └── process/
        └── route.ts      # POST - Обработка фото
```

#### 4.2 Авторизация
```typescript
// Файл: src/app/api/auth/telegram/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { validateTelegramWebAppData } from '@/lib/telegram/auth'
import { supabase } from '@/lib/supabase/client'

export async function POST(request: NextRequest) {
  const { initData } = await request.json()
  
  const user = validateTelegramWebAppData(initData)
  if (!user) {
    return NextResponse.json({ error: 'Invalid auth data' }, { status: 401 })
  }
  
  // Создаем или обновляем пользователя
  const { data, error } = await supabase
    .from('users')
    .upsert({
      telegram_id: user.id,
      username: user.username,
      first_name: user.first_name,
      last_name: user.last_name,
      language_code: user.language_code,
      is_premium: user.is_premium
    }, {
      onConflict: 'telegram_id'
    })
    .select()
    .single()
  
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  
  // Создаем JWT токен для Supabase
  const { data: { session }, error: sessionError } = await supabase.auth.signInWithPassword({
    email: `${user.id}@telegram.user`,
    password: process.env.TELEGRAM_USER_PASSWORD! // Общий пароль для всех
  })
  
  return NextResponse.json({ 
    user: data,
    session 
  })
}
```

#### 4.3 CRUD операции для тренировок
```typescript
// Файл: src/app/api/workouts/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase/client'

// GET /api/workouts - Получить список тренировок
export async function GET(request: NextRequest) {
  const userId = request.headers.get('X-User-Id')
  const { searchParams } = new URL(request.url)
  const limit = parseInt(searchParams.get('limit') || '10')
  const offset = parseInt(searchParams.get('offset') || '0')
  
  const { data, error, count } = await supabase
    .from('workouts')
    .select('*, sets(*)', { count: 'exact' })
    .eq('user_id', userId)
    .order('started_at', { ascending: false })
    .range(offset, offset + limit - 1)
  
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  
  return NextResponse.json({ 
    data,
    count,
    limit,
    offset 
  })
}

// POST /api/workouts - Создать новую тренировку
export async function POST(request: NextRequest) {
  const userId = request.headers.get('X-User-Id')
  const body = await request.json()
  
  const { data: workout, error } = await supabase
    .from('workouts')
    .insert({
      user_id: parseInt(userId!),
      started_at: new Date().toISOString(),
      notes: body.notes
    })
    .select()
    .single()
  
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  
  return NextResponse.json(workout, { status: 201 })
}
```

### 5. Система хранения и обработки изображений

#### 5.1 Загрузка изображений
```typescript
// Файл: src/app/api/photos/upload/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase/client'

export async function POST(request: NextRequest) {
  const userId = request.headers.get('X-User-Id')
  const formData = await request.formData()
  const file = formData.get('file') as File
  const workoutId = formData.get('workoutId') as string
  
  if (!file || !workoutId) {
    return NextResponse.json(
      { error: 'File and workoutId are required' },
      { status: 400 }
    )
  }
  
  // Генерируем уникальное имя
  const fileName = `${userId}/${workoutId}/${Date.now()}-${file.name}`
  
  // Загружаем в Supabase Storage
  const { data: uploadData, error: uploadError } = await supabase.storage
    .from('workout-photos')
    .upload(fileName, file, {
      contentType: file.type,
      upsert: false
    })
  
  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 })
  }
  
  // Получаем публичный URL
  const { data: { publicUrl } } = supabase.storage
    .from('workout-photos')
    .getPublicUrl(fileName)
  
  // Сохраняем в БД
  const { data: photo, error: dbError } = await supabase
    .from('workout_photos')
    .insert({
      workout_id: workoutId,
      original_url: publicUrl,
      processing_status: 'pending'
    })
    .select()
    .single()
  
  if (dbError) {
    return NextResponse.json({ error: dbError.message }, { status: 500 })
  }
  
  // Запускаем обработку в фоне
  fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/photos/process`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ photoId: photo.id })
  })
  
  return NextResponse.json(photo)
}
```

#### 5.2 Обработка изображений с наложением статистики
```typescript
// Файл: src/app/api/photos/process/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createCanvas, loadImage } from 'canvas'
import { supabase } from '@/lib/supabase/client'

export async function POST(request: NextRequest) {
  const { photoId } = await request.json()
  
  // Получаем данные фото и тренировки
  const { data: photo } = await supabase
    .from('workout_photos')
    .select('*, workouts(*, sets(*))')
    .eq('id', photoId)
    .single()
  
  if (!photo) {
    return NextResponse.json({ error: 'Photo not found' }, { status: 404 })
  }
  
  try {
    // Загружаем оригинальное изображение
    const image = await loadImage(photo.original_url)
    const canvas = createCanvas(image.width, image.height)
    const ctx = canvas.getContext('2d')
    
    // Рисуем оригинальное изображение
    ctx.drawImage(image, 0, 0)
    
    // Добавляем полупрозрачный оверлей
    ctx.fillStyle = 'rgba(236, 72, 153, 0.9)' // Розовый с прозрачностью
    ctx.fillRect(0, image.height - 300, image.width, 300)
    
    // Добавляем текст со статистикой
    ctx.fillStyle = 'white'
    ctx.font = 'bold 48px Arial'
    ctx.textAlign = 'center'
    
    const workout = photo.workouts
    const duration = Math.floor(workout.duration_seconds / 60)
    
    ctx.fillText(`${workout.total_reps} ПОВТОРЕНИЙ`, image.width / 2, image.height - 200)
    ctx.font = '36px Arial'
    ctx.fillText(`${workout.total_sets} подходов • ${duration} минут`, image.width / 2, image.height - 140)
    
    // Добавляем дату
    ctx.font = '24px Arial'
    const date = new Date(workout.started_at).toLocaleDateString('ru-RU')
    ctx.fillText(date, image.width / 2, image.height - 80)
    
    // Добавляем логотип/водяной знак
    ctx.font = 'bold 20px Arial'
    ctx.textAlign = 'right'
    ctx.fillText('Pushups Tracker', image.width - 20, image.height - 20)
    
    // Конвертируем в Buffer
    const buffer = canvas.toBuffer('image/jpeg', { quality: 0.9 })
    
    // Загружаем обработанное изображение
    const processedFileName = `processed/${photo.id}.jpg`
    const { error: uploadError } = await supabase.storage
      .from('workout-photos')
      .upload(processedFileName, buffer, {
        contentType: 'image/jpeg',
        upsert: true
      })
    
    if (uploadError) throw uploadError
    
    const { data: { publicUrl } } = supabase.storage
      .from('workout-photos')
      .getPublicUrl(processedFileName)
    
    // Обновляем запись в БД
    await supabase
      .from('workout_photos')
      .update({
        processed_url: publicUrl,
        stats_overlay_applied: true,
        processing_status: 'completed'
      })
      .eq('id', photoId)
    
    return NextResponse.json({ success: true, url: publicUrl })
    
  } catch (error) {
    // Обновляем статус на failed
    await supabase
      .from('workout_photos')
      .update({ processing_status: 'failed' })
      .eq('id', photoId)
    
    return NextResponse.json(
      { error: 'Processing failed' },
      { status: 500 }
    )
  }
}
```

### 6. Статистика и аналитика

#### 6.1 API для статистики
```typescript
// Файл: src/app/api/stats/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase/client'
import { startOfWeek, endOfWeek, subDays } from 'date-fns'

export async function GET(request: NextRequest) {
  const userId = request.headers.get('X-User-Id')
  const { searchParams } = new URL(request.url)
  const period = searchParams.get('period') || 'week' // week, month, all
  
  let dateFilter = {}
  const now = new Date()
  
  switch (period) {
    case 'week':
      dateFilter = {
        gte: startOfWeek(now, { weekStartsOn: 1 }).toISOString(),
        lte: endOfWeek(now, { weekStartsOn: 1 }).toISOString()
      }
      break
    case 'month':
      dateFilter = {
        gte: subDays(now, 30).toISOString(),
        lte: now.toISOString()
      }
      break
  }
  
  // Получаем тренировки за период
  const { data: workouts } = await supabase
    .from('workouts')
    .select('*')
    .eq('user_id', userId)
    .gte('started_at', dateFilter.gte || '1970-01-01')
    .lte('started_at', dateFilter.lte || now.toISOString())
    .order('started_at', { ascending: true })
  
  // Получаем общую статистику
  const { data: stats } = await supabase
    .from('user_stats')
    .select('*')
    .eq('user_id', userId)
    .single()
  
  // Подготавливаем данные для графика
  const chartData = workouts?.map(w => ({
    date: new Date(w.started_at).toLocaleDateString(),
    reps: w.total_reps,
    sets: w.total_sets
  })) || []
  
  return NextResponse.json({
    stats: stats || {
      total_workouts: 0,
      total_reps: 0,
      current_streak: 0,
      max_streak: 0,
      avg_reps_per_workout: 0,
      personal_best_reps: 0
    },
    chartData,
    period
  })
}
```

### 7. Telegram Bot для напоминаний

#### 7.1 Структура бота
```
bot/
├── src/
│   ├── index.ts          # Точка входа
│   ├── bot.ts            # Инициализация бота
│   ├── scheduler.ts      # Планировщик напоминаний
│   ├── handlers/         # Обработчики команд
│   │   ├── start.ts
│   │   ├── settings.ts
│   │   └── stats.ts
│   └── services/         # Сервисы
│       ├── database.ts
│       └── notifications.ts
├── package.json
└── tsconfig.json
```

#### 7.2 Основной файл бота
```typescript
// Файл: bot/src/index.ts
import { Telegraf } from 'telegraf'
import { CronJob } from 'cron'
import { createClient } from '@supabase/supabase-js'
import { startScheduler } from './scheduler'
import { handleStart, handleSettings, handleStats } from './handlers'

const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN!)
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Команды бота
bot.command('start', handleStart)
bot.command('settings', handleSettings)
bot.command('stats', handleStats)

// Запускаем планировщик
startScheduler(bot, supabase)

// Запускаем бота
bot.launch()

process.once('SIGINT', () => bot.stop('SIGINT'))
process.once('SIGTERM', () => bot.stop('SIGTERM'))
```

#### 7.3 Планировщик напоминаний
```typescript
// Файл: bot/src/scheduler.ts
import { Telegraf } from 'telegraf'
import { CronJob } from 'cron'
import { SupabaseClient } from '@supabase/supabase-js'
import { format, utcToZonedTime } from 'date-fns-tz'

export function startScheduler(bot: Telegraf, supabase: SupabaseClient) {
  // Запускаем каждую минуту
  new CronJob('* * * * *', async () => {
    const now = new Date()
    const currentMinute = format(now, 'HH:mm')
    const currentDay = now.getDay()
    
    // Получаем пользователей для напоминания
    const { data: reminders } = await supabase
      .from('reminder_settings')
      .select('*, users(*)')
      .eq('enabled', true)
      .contains('days_of_week', [currentDay])
    
    if (!reminders) return
    
    for (const reminder of reminders) {
      // Проверяем время с учетом часового пояса
      const userTime = utcToZonedTime(now, reminder.timezone)
      const userMinute = format(userTime, 'HH:mm')
      
      if (userMinute === reminder.reminder_time.slice(0, 5)) {
        // Проверяем, не отправляли ли уже сегодня
        const today = format(now, 'yyyy-MM-dd')
        if (reminder.last_sent_at === today) continue
        
        // Отправляем напоминание
        try {
          await bot.telegram.sendMessage(
            reminder.user_id,
            '💪 Время для тренировки!\n\n' +
            'Не забудьте сделать отжимания сегодня. ' +
            'Откройте приложение, чтобы начать тренировку.',
            {
              reply_markup: {
                inline_keyboard: [[
                  { 
                    text: 'Открыть приложение', 
                    web_app: { url: process.env.WEBAPP_URL! } 
                  }
                ]]
              }
            }
          )
          
          // Обновляем last_sent_at
          await supabase
            .from('reminder_settings')
            .update({ last_sent_at: today })
            .eq('user_id', reminder.user_id)
            
        } catch (error) {
          console.error(`Failed to send reminder to ${reminder.user_id}:`, error)
        }
      }
    }
  }).start()
}
```

### 8. Утилиты и хелперы

#### 8.1 Хуки для работы с данными
```typescript
// Файл: src/hooks/useWorkouts.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase/client'

export function useWorkouts(userId: number) {
  return useQuery({
    queryKey: ['workouts', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('workouts')
        .select('*, sets(*)')
        .eq('user_id', userId)
        .order('started_at', { ascending: false })
        .limit(10)
      
      if (error) throw error
      return data
    }
  })
}

export function useCreateWorkout() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (data: { userId: number; notes?: string }) => {
      const response = await fetch('/api/workouts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
      
      if (!response.ok) throw new Error('Failed to create workout')
      return response.json()
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: ['workouts', variables.userId] 
      })
    }
  })
}
```

### 9. Тестирование и деплой

#### 9.1 Тестовые данные
```sql
-- Файл: supabase/seed.sql
-- Тестовый пользователь
INSERT INTO public.users (telegram_id, username, first_name) 
VALUES (123456789, 'test_user', 'Test');

-- Тестовые тренировки
INSERT INTO public.workouts (user_id, started_at, finished_at, duration_seconds, total_reps, total_sets)
VALUES 
  (123456789, NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day' + INTERVAL '30 minutes', 1800, 100, 4),
  (123456789, NOW() - INTERVAL '3 days', NOW() - INTERVAL '3 days' + INTERVAL '25 minutes', 1500, 80, 3);
```

#### 9.2 Переменные окружения
```bash
# Файл: .env.local
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx
SUPABASE_SERVICE_ROLE_KEY=xxx

# Telegram
TELEGRAM_BOT_TOKEN=xxx
TELEGRAM_USER_PASSWORD=secure_password_for_all_users

# App
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
WEBAPP_URL=https://t.me/your_bot/app

# Для бота
DATABASE_URL=postgresql://xxx
```

### 10. Чеклист для AI агента

- [ ] Создать аккаунт Supabase
- [ ] Выполнить все SQL миграции
- [ ] Настроить Storage bucket для фото
- [ ] Создать .env.local с переменными
- [ ] Установить зависимости для обработки изображений: `npm install canvas`
- [ ] Создать все API endpoints
- [ ] Настроить middleware для аутентификации
- [ ] Создать хуки для работы с данными
- [ ] Развернуть бота на отдельном сервере
- [ ] Настроить webhook для бота
- [ ] Протестировать все endpoints
- [ ] Настроить CORS для API

## 📝 Важные заметки

1. **Безопасность**: Всегда валидировать Telegram InitData на сервере
2. **Производительность**: Использовать индексы в БД для быстрых запросов
3. **Масштабирование**: Кешировать статистику в отдельной таблице
4. **Обработка изображений**: Выполнять в фоновом режиме
5. **Напоминания**: Учитывать часовые пояса пользователей
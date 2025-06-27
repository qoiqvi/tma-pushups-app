# 💪 Telegram Mini App для трекинга отжиманий

## 📋 Обзор проекта
Telegram Mini App для отслеживания прогресса в отжиманиях с розовым дизайном, интеграцией с Supabase для хранения данных и системой уведомлений через Telegram Bot API.

## 🎯 Основные функции
- ✅ Авторизация через Telegram (автоматическая)
- 📊 Трекинг тренировок (подходы, повторения, время)
- 📈 Визуализация прогресса (графики за неделю/месяц)
- 🔔 Система напоминаний о тренировках
- 📸 Генерация изображений с результатами тренировки
- 🎨 Розовый дизайн (pink theme)

## 🏗️ Архитектура системы

### База данных (Supabase)
```sql
-- Пользователи
CREATE TABLE users (
  telegram_id BIGINT PRIMARY KEY,
  username TEXT,
  first_name TEXT,
  last_name TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Тренировки
CREATE TABLE workouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id BIGINT REFERENCES users(telegram_id),
  date TIMESTAMP DEFAULT NOW(),
  duration_seconds INT NOT NULL,
  total_reps INT NOT NULL,
  total_sets INT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Подходы
CREATE TABLE sets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workout_id UUID REFERENCES workouts(id) ON DELETE CASCADE,
  set_number INT NOT NULL,
  reps INT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Настройки напоминаний
CREATE TABLE reminder_settings (
  user_id BIGINT PRIMARY KEY REFERENCES users(telegram_id),
  days_of_week INT[] DEFAULT '{1,3,5}', -- 0=Вс, 1=Пн, ..., 6=Сб
  reminder_time TIME DEFAULT '09:00:00',
  timezone TEXT DEFAULT 'UTC',
  enabled BOOLEAN DEFAULT true,
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Фотографии тренировок
CREATE TABLE workout_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workout_id UUID REFERENCES workouts(id) ON DELETE CASCADE,
  photo_url TEXT NOT NULL,
  stats_overlay_applied BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Технологический стек
- **Frontend**: Next.js 15, React 18, TypeScript
- **UI библиотеки**: 
  - Telegram UI Kit (@telegram-apps/telegram-ui)
  - Tailwind CSS для кастомизации
- **База данных**: Supabase (PostgreSQL + Storage)
- **Графики**: Recharts
- **Управление состоянием**: Zustand
- **Формы**: React Hook Form
- **Даты**: date-fns
- **Обработка изображений**: Canvas API

## 🎨 Дизайн-система (Розовая тема)

### Цветовая палитра
```css
:root {
  /* Основные цвета */
  --primary: #EC4899;        /* Pink 500 */
  --primary-light: #F9A8D4;  /* Pink 300 */
  --primary-dark: #BE185D;   /* Pink 700 */
  
  /* Дополнительные цвета */
  --secondary: #9CA3AF;      /* Gray 400 */
  --secondary-light: #D1D5DB; /* Gray 300 */
  --secondary-dark: #6B7280;  /* Gray 500 */
  
  /* Фоновые цвета */
  --background: #FDF2F8;     /* Pink 50 */
  --surface: #FFFFFF;
  --surface-secondary: #FCE7F3; /* Pink 100 */
  
  /* Текст */
  --text-primary: #1F2937;   /* Gray 800 */
  --text-secondary: #6B7280; /* Gray 500 */
  --text-on-primary: #FFFFFF;
  
  /* Статусы */
  --success: #10B981;        /* Emerald 500 */
  --warning: #F59E0B;        /* Amber 500 */
  --error: #EF4444;          /* Red 500 */
  
  /* Тени и границы */
  --shadow-sm: 0 1px 2px 0 rgba(236, 72, 153, 0.05);
  --shadow-md: 0 4px 6px -1px rgba(236, 72, 153, 0.1);
  --border-radius: 12px;
}
```

## 📱 Структура экранов

### 1. Главный экран (`/`)
- Приветствие пользователя
- Кнопка "Начать тренировку" (большая, акцентная)
- Карточка последней тренировки
- Быстрые статистики (тренировок на этой неделе, всего повторений)
- Навигация внизу

### 2. Экран тренировки (`/workout`)
- Таймер тренировки (крупный, в центре)
- Список подходов с возможностью редактирования
- Кнопка добавления подхода
- Поле ввода количества повторений
- Кнопка "Завершить тренировку"

### 3. Экран статистики (`/stats`)
- Переключатель периода (неделя/месяц/все время)
- График прогресса (линейный/столбчатый)
- Карточки с метриками:
  - Общее количество тренировок
  - Общее количество повторений
  - Средние показатели
  - Личные рекорды

### 4. Экран настроек (`/settings`)
- Профиль пользователя
- Настройки напоминаний:
  - Выбор дней недели
  - Время напоминания
  - Включение/выключение
- О приложении

### 5. Экран результата тренировки (`/workout/result/[id]`)
- Сводка тренировки
- Загрузка фото
- Предпросмотр с наложенной статистикой
- Кнопка "Поделиться в Telegram"

## 🚀 План реализации

### Этап 1: Базовая настройка (День 1-2)
- [x] Очистка boilerplate кода
- [ ] Установка необходимых зависимостей:
  ```bash
  npm install @supabase/supabase-js @supabase/auth-helpers-nextjs
  npm install recharts date-fns zustand react-hook-form
  npm install @types/canvas-confetti canvas-confetti
  npm install lucide-react
  ```
- [ ] Настройка Supabase:
  - Создание проекта
  - Настройка схемы БД
  - Настройка политик безопасности (RLS)
- [ ] Создание базовой структуры папок
- [ ] Настройка переменных окружения
- [ ] Реализация розовой темы

### Этап 2: Аутентификация (День 3)
- [ ] Создание хука useAuth для работы с Telegram initData
- [ ] Middleware для проверки авторизации
- [ ] Автоматическое создание/обновление пользователя в БД
- [ ] Защищенные маршруты

### Этап 3: Основной функционал (День 4-6)
- [ ] Главный экран:
  - Компонент приветствия
  - Кнопка начала тренировки
  - Карточка последней тренировки
  - Быстрая статистика
- [ ] Экран тренировки:
  - Компонент таймера
  - Управление подходами
  - Форма ввода повторений
  - Сохранение в БД
- [ ] Навигация между экранами

### Этап 4: Статистика и визуализация (День 7-9)
- [ ] Интеграция Recharts
- [ ] Компоненты графиков:
  - График прогресса по дням
  - График общего количества повторений
- [ ] Агрегация данных на стороне БД
- [ ] Карточки с метриками
- [ ] Фильтры по периодам

### Этап 5: Генерация изображений (День 10-12)
- [ ] Настройка Supabase Storage
- [ ] Компонент загрузки фото
- [ ] Canvas API для наложения статистики:
  - Красивый оверлей с градиентом
  - Текст со статистикой
  - Логотип/водяной знак
- [ ] Сохранение готового изображения
- [ ] Интеграция с Telegram sharing API

### Этап 6: Система напоминаний (День 13-15)
- [ ] Создание отдельного сервиса для бота:
  - Node.js + Express
  - node-telegram-bot-api
  - node-cron для планировщика
- [ ] API endpoints для управления настройками
- [ ] UI компоненты настроек напоминаний
- [ ] Синхронизация с часовым поясом пользователя

### Этап 7: Оптимизация и тестирование (День 16-17)
- [ ] Оптимизация загрузки данных
- [ ] Кеширование на клиенте
- [ ] Progressive Web App функции
- [ ] Обработка ошибок
- [ ] Логирование
- [ ] Тестирование на разных устройствах

### Этап 8: Деплой (День 18)
- [ ] Настройка CI/CD
- [ ] Деплой на Vercel
- [ ] Деплой бота на VPS/Cloud
- [ ] Настройка мониторинга
- [ ] Документация

## 📁 Структура проекта
```
tma-pushups-app/
├── src/
│   ├── app/
│   │   ├── workout/
│   │   │   ├── page.tsx
│   │   │   └── result/[id]/
│   │   │       └── page.tsx
│   │   ├── stats/
│   │   │   └── page.tsx
│   │   ├── settings/
│   │   │   └── page.tsx
│   │   └── api/
│   │       └── auth/
│   │           └── telegram/
│   │               └── route.ts
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Navigation.tsx
│   │   │   └── Header.tsx
│   │   ├── workout/
│   │   │   ├── Timer.tsx
│   │   │   ├── SetsList.tsx
│   │   │   ├── SetInput.tsx
│   │   │   └── WorkoutSummary.tsx
│   │   ├── stats/
│   │   │   ├── ProgressChart.tsx
│   │   │   ├── StatsCard.tsx
│   │   │   └── PeriodSelector.tsx
│   │   ├── settings/
│   │   │   ├── ReminderSettings.tsx
│   │   │   └── ProfileInfo.tsx
│   │   └── shared/
│   │       ├── Button.tsx
│   │       ├── Card.tsx
│   │       └── Input.tsx
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts
│   │   │   ├── types.ts
│   │   │   └── queries.ts
│   │   ├── telegram/
│   │   │   ├── auth.ts
│   │   │   └── utils.ts
│   │   └── utils/
│   │       ├── dates.ts
│   │       └── stats.ts
│   ├── hooks/
│   │   ├── useAuth.ts
│   │   ├── useWorkout.ts
│   │   ├── useStats.ts
│   │   └── useSupabase.ts
│   ├── stores/
│   │   ├── workoutStore.ts
│   │   └── userStore.ts
│   └── styles/
│       ├── theme.css
│       └── globals.css
├── bot/
│   ├── src/
│   │   ├── index.js
│   │   ├── scheduler.js
│   │   └── notifications.js
│   └── package.json
└── supabase/
    └── migrations/
        └── 001_initial_schema.sql
```

## 🔒 Безопасность
- Валидация initData на сервере
- Row Level Security (RLS) в Supabase
- Ограничение размера загружаемых изображений
- Rate limiting для API endpoints
- Шифрование чувствительных данных

## 📊 Метрики для отслеживания
- DAU/MAU (Daily/Monthly Active Users)
- Retention rate
- Среднее количество тренировок на пользователя
- Процент пользователей с включенными напоминаниями
- Процент пользователей, делящихся результатами

## 🚨 Возможные проблемы и решения
1. **Offline режим**: Использовать localStorage для временного хранения
2. **Большие изображения**: Сжатие на клиенте перед загрузкой
3. **Часовые пояса**: Хранить время в UTC, конвертировать на клиенте
4. **Производительность графиков**: Виртуализация при большом количестве данных

## 📝 Дополнительные идеи для развития
- [ ] Социальные функции (рейтинги, соревнования)
- [ ] Различные типы упражнений
- [ ] Программы тренировок
- [ ] Интеграция с фитнес-трекерами
- [ ] Достижения и награды
- [ ] Экспорт данных в CSV/PDF
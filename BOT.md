# План реализации Telegram Bot в Next.js

## 📋 Обзор
Реализация Telegram бота для напоминаний о тренировках в рамках Next.js приложения с использованием webhook API и внешнего планировщика.

## 🎯 Цели
1. Обработка команд бота (/start, /settings, /stats)
2. Система напоминаний с учетом часовых поясов
3. Интеграция с существующей базой данных
4. Минимальная инфраструктура (MVP подход)

## 🏗️ Архитектура

### Компоненты системы:
```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Telegram      │────│   Next.js API    │────│   Supabase      │
│   Webhook       │    │   Routes         │    │   Database      │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                              │
                       ┌──────────────────┐
                       │  GitHub Actions  │
                       │  Cron Scheduler  │
                       └──────────────────┘
```

## 📂 Структура файлов

```
src/
├── app/api/bot/
│   ├── webhook/
│   │   └── route.ts          # Webhook endpoint для Telegram
│   ├── reminders/
│   │   └── route.ts          # API для отправки напоминаний
│   └── commands/
│       └── route.ts          # Обработка команд (опционально)
├── lib/bot/
│   ├── telegram.ts           # Telegram API client
│   ├── handlers.ts           # Обработчики команд
│   ├── reminders.ts          # Логика напоминаний
│   └── utils.ts              # Утилиты бота
└── types/
    └── bot.ts                # Типы для бота

.github/workflows/
└── bot-reminders.yml         # GitHub Actions для cron
```

## 🚀 Этапы реализации

### Этап 1: Базовая настройка

#### 1.1 Установка зависимостей
```bash
npm install node-telegram-bot-api date-fns-tz
npm install -D @types/node-telegram-bot-api
```

#### 1.2 Переменные окружения
```bash
# .env.local
TELEGRAM_BOT_TOKEN=your_bot_token
TELEGRAM_WEBHOOK_SECRET=random_secret_string
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
```

#### 1.3 Настройка webhook
```typescript
// src/lib/bot/telegram.ts
import TelegramBot from 'node-telegram-bot-api'

export const telegramBot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN!, {
  webHook: false // Используем webhook через API routes
})

export async function setWebhook() {
  const webhookUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/bot/webhook`
  await telegramBot.setWebHook(webhookUrl, {
    secret_token: process.env.TELEGRAM_WEBHOOK_SECRET
  })
}
```

### Этап 2: Webhook API Route

#### 2.1 Основной webhook endpoint
```typescript
// src/app/api/bot/webhook/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { handleBotUpdate } from '@/lib/bot/handlers'
import { verifyTelegramWebhook } from '@/lib/bot/utils'

export async function POST(request: NextRequest) {
  // Проверяем подпись Telegram
  const isValid = await verifyTelegramWebhook(request)
  if (!isValid) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const update = await request.json()
    await handleBotUpdate(update)
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Bot webhook error:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
```

#### 2.2 Верификация webhook
```typescript
// src/lib/bot/utils.ts
import crypto from 'crypto'

export async function verifyTelegramWebhook(request: NextRequest): Promise<boolean> {
  const secretToken = process.env.TELEGRAM_WEBHOOK_SECRET
  if (!secretToken) return false

  const headerToken = request.headers.get('X-Telegram-Bot-Api-Secret-Token')
  return headerToken === secretToken
}
```

### Этап 3: Обработчики команд

#### 3.1 Основной обработчик
```typescript
// src/lib/bot/handlers.ts
import { telegramBot } from './telegram'
import { supabaseAdmin } from '@/lib/supabase'
import { BotUpdate, BotMessage } from '@/types/bot'

export async function handleBotUpdate(update: BotUpdate) {
  if (update.message) {
    await handleMessage(update.message)
  }
}

async function handleMessage(message: BotMessage) {
  const chatId = message.chat.id
  const text = message.text
  const user = message.from

  // Создаем/обновляем пользователя в БД
  await upsertUser(user)

  if (text?.startsWith('/')) {
    await handleCommand(chatId, text, user)
  }
}

async function handleCommand(chatId: number, command: string, user: any) {
  const [cmd, ...args] = command.split(' ')

  switch (cmd) {
    case '/start':
      await handleStartCommand(chatId, user)
      break
    case '/settings':
      await handleSettingsCommand(chatId, user.id)
      break
    case '/stats':
      await handleStatsCommand(chatId, user.id)
      break
    default:
      await telegramBot.sendMessage(chatId, 'Неизвестная команда. Используйте /start для начала.')
  }
}
```

#### 3.2 Команда /start
```typescript
async function handleStartCommand(chatId: number, user: any) {
  const welcomeText = `
🏋️ Добро пожаловать в Pushups Tracker!

Этот бот поможет вам отслеживать тренировки отжиманий и напомнит о них в нужное время.

Доступные команды:
/settings - Настройка напоминаний
/stats - Ваша статистика

Откройте приложение для начала тренировки:
  `

  const keyboard = {
    inline_keyboard: [[
      { 
        text: '🚀 Открыть приложение', 
        web_app: { url: process.env.NEXT_PUBLIC_APP_URL! }
      }
    ]]
  }

  await telegramBot.sendMessage(chatId, welcomeText, {
    reply_markup: keyboard,
    parse_mode: 'HTML'
  })
}
```

#### 3.3 Команда /settings
```typescript
async function handleSettingsCommand(chatId: number, userId: number) {
  const { data: settings } = await supabaseAdmin
    .from('reminder_settings')
    .select('*')
    .eq('user_id', userId)
    .single()

  const currentSettings = settings || {
    days_of_week: [1, 3, 5],
    reminder_time: '09:00:00',
    timezone: 'Europe/Moscow',
    enabled: true
  }

  const daysText = currentSettings.days_of_week
    .map((day: number) => ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'][day])
    .join(', ')

  const settingsText = `
⚙️ Настройки напоминаний

🗓️ Дни: ${daysText}
⏰ Время: ${currentSettings.reminder_time.slice(0, 5)}
🌍 Часовой пояс: ${currentSettings.timezone}
🔔 Включены: ${currentSettings.enabled ? 'Да' : 'Нет'}

Для изменения настроек откройте приложение.
  `

  const keyboard = {
    inline_keyboard: [[
      { 
        text: '⚙️ Изменить настройки', 
        web_app: { url: `${process.env.NEXT_PUBLIC_APP_URL!}/settings` }
      }
    ]]
  }

  await telegramBot.sendMessage(chatId, settingsText, {
    reply_markup: keyboard
  })
}
```

### Этап 4: Система напоминаний

#### 4.1 API для отправки напоминаний
```typescript
// src/app/api/bot/reminders/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { sendReminders } from '@/lib/bot/reminders'

export async function POST(request: NextRequest) {
  // Проверяем авторизацию (GitHub Actions)
  const authHeader = request.headers.get('Authorization')
  const expectedToken = `Bearer ${process.env.CRON_SECRET}`
  
  if (authHeader !== expectedToken) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const result = await sendReminders()
    return NextResponse.json(result)
  } catch (error) {
    console.error('Reminders error:', error)
    return NextResponse.json({ error: 'Failed to send reminders' }, { status: 500 })
  }
}
```

#### 4.2 Логика отправки напоминаний
```typescript
// src/lib/bot/reminders.ts
import { format, utcToZonedTime } from 'date-fns-tz'
import { telegramBot } from './telegram'
import { supabaseAdmin } from '@/lib/supabase'

export async function sendReminders() {
  const now = new Date()
  const currentDay = now.getDay()
  
  // Получаем все активные настройки напоминаний
  const { data: settings, error } = await supabaseAdmin
    .from('reminder_settings')
    .select('*, users(*)')
    .eq('enabled', true)
    .contains('days_of_week', [currentDay])

  if (error || !settings) {
    return { sent: 0, errors: 0 }
  }

  let sent = 0
  let errors = 0

  for (const setting of settings) {
    try {
      // Проверяем время с учетом часового пояса
      const userTime = utcToZonedTime(now, setting.timezone)
      const userHour = format(userTime, 'HH:mm')
      const reminderTime = setting.reminder_time.slice(0, 5)

      // Допускаем погрешность ±5 минут
      if (isTimeMatch(userHour, reminderTime)) {
        // Проверяем, не отправляли ли уже сегодня
        const today = format(now, 'yyyy-MM-dd')
        if (setting.last_sent_at === today) continue

        await sendReminderMessage(setting.user_id, setting.users?.first_name)
        
        // Обновляем last_sent_at
        await supabaseAdmin
          .from('reminder_settings')
          .update({ last_sent_at: today })
          .eq('user_id', setting.user_id)

        sent++
      }
    } catch (err) {
      console.error(`Failed to send reminder to ${setting.user_id}:`, err)
      errors++
    }
  }

  return { sent, errors }
}

function isTimeMatch(currentTime: string, targetTime: string): boolean {
  const [currentHour, currentMin] = currentTime.split(':').map(Number)
  const [targetHour, targetMin] = targetTime.split(':').map(Number)
  
  const currentMinutes = currentHour * 60 + currentMin
  const targetMinutes = targetHour * 60 + targetMin
  
  // Допуск ±5 минут
  return Math.abs(currentMinutes - targetMinutes) <= 5
}

async function sendReminderMessage(userId: number, firstName?: string) {
  const name = firstName ? `, ${firstName}` : ''
  
  const message = `
💪 Время для тренировки${name}!

Не забудьте сделать отжимания сегодня. Даже небольшая тренировка лучше, чем никакой!

Откройте приложение, чтобы начать:
  `

  const keyboard = {
    inline_keyboard: [[
      { 
        text: '🏋️ Начать тренировку', 
        web_app: { url: process.env.NEXT_PUBLIC_APP_URL! }
      }
    ]]
  }

  await telegramBot.sendMessage(userId, message, {
    reply_markup: keyboard
  })
}
```

### Этап 5: GitHub Actions планировщик

#### 5.1 Workflow файл
```yaml
# .github/workflows/bot-reminders.yml
name: Bot Reminders

on:
  schedule:
    # Каждые 10 минут в рабочие часы (UTC)
    - cron: '*/10 6-18 * * *'
  workflow_dispatch: # Ручной запуск

jobs:
  send-reminders:
    runs-on: ubuntu-latest
    steps:
      - name: Send reminders
        run: |
          curl -X POST "${{ secrets.APP_URL }}/api/bot/reminders" \
            -H "Authorization: Bearer ${{ secrets.CRON_SECRET }}" \
            -H "Content-Type: application/json"
```

#### 5.2 GitHub Secrets
Добавить в Settings → Secrets:
- `APP_URL`: https://your-app.vercel.app
- `CRON_SECRET`: случайная строка для авторизации

### Этап 6: Типы и интерфейсы

#### 6.1 TypeScript типы
```typescript
// src/types/bot.ts
export interface BotUpdate {
  update_id: number
  message?: BotMessage
}

export interface BotMessage {
  message_id: number
  from: BotUser
  chat: BotChat
  text?: string
  date: number
}

export interface BotUser {
  id: number
  is_bot: boolean
  first_name: string
  last_name?: string
  username?: string
  language_code?: string
  is_premium?: boolean
}

export interface BotChat {
  id: number
  type: 'private' | 'group' | 'supergroup' | 'channel'
  first_name?: string
  last_name?: string
  username?: string
}
```

## 🧪 Тестирование

### Локальное тестирование
```bash
# 1. Установить ngrok для webhook
npm install -g ngrok
ngrok http 3000

# 2. Установить webhook URL
curl -X POST "https://api.telegram.org/bot<TOKEN>/setWebhook" \
  -d "url=https://your-ngrok-url.ngrok.io/api/bot/webhook" \
  -d "secret_token=your_secret"

# 3. Тестировать команды в Telegram
```

### Тестирование напоминаний
```bash
# Ручной вызов API
curl -X POST "http://localhost:3000/api/bot/reminders" \
  -H "Authorization: Bearer your_secret" \
  -H "Content-Type: application/json"
```

## 📝 Чеклист реализации

- [ ] Установить зависимости
- [ ] Создать bot token в @BotFather
- [ ] Настроить переменные окружения
- [ ] Реализовать webhook API route
- [ ] Создать обработчики команд (/start, /settings)
- [ ] Реализовать систему напоминаний
- [ ] Настроить GitHub Actions
- [ ] Добавить секреты в GitHub
- [ ] Протестировать webhook локально
- [ ] Развернуть на Vercel
- [ ] Установить webhook в production
- [ ] Протестировать напоминания

## ⚠️ Важные моменты

1. **Безопасность**: Всегда проверять webhook подпись
2. **Rate limiting**: Telegram ограничивает 30 сообщений/секунду
3. **Error handling**: Обрабатывать ошибки API gracefully
4. **Мониторинг**: Логировать важные события
5. **Backup**: GitHub Actions может не сработать - добавить fallback

## 🔮 Будущие улучшения

1. **Интерактивные настройки** через inline клавиатуры
2. **Статистика прямо в боте** с графиками
3. **Мотивационные сообщения** с достижениями
4. **Групповые чаты** для командных тренировок
5. **Переход на отдельный сервис** при росте аудитории
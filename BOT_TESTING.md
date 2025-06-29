# Инструкция по тестированию Telegram бота

## 🚀 Быстрый старт

### 1. Настройка локального тестирования

#### Установка ngrok
```bash
# macOS
brew install ngrok

# Или скачать с https://ngrok.com/download
```

#### Запуск туннеля
```bash
# Запустить приложение
npm run dev

# В отдельном терминале запустить ngrok
ngrok http 3000
```

Скопируйте HTTPS URL (например: `https://abc123.ngrok.io`)

### 2. Установка webhook

```bash
# Установить webhook
curl -X POST "http://localhost:3000/api/bot/setup" \
  -H "Authorization: Bearer CronJobSecretKey456$%^" \
  -H "Content-Type: application/json"

# Проверить статус webhook
curl "http://localhost:3000/api/bot/setup"
```

### 3. Тестирование команд

Откройте бота в Telegram: [@pushups_tracker_bot](https://t.me/pushups_tracker_bot)

Доступные команды:
- `/start` - Приветствие и запуск
- `/settings` - Настройки напоминаний
- `/stats` - Статистика тренировок
- `/help` - Справка

## 🧪 Тестирование напоминаний

### Локальное тестирование
```bash
# Вызвать API напоминаний вручную
curl -X POST "http://localhost:3000/api/bot/reminders" \
  -H "Authorization: Bearer CronJobSecretKey456$%^" \
  -H "Content-Type: application/json"
```

### Проверка логики времени
1. Создайте тестовую запись в `reminder_settings`
2. Установите `reminder_time` на текущее время + 1 минута
3. Запустите API напоминаний

## 🛠️ Отладка

### Просмотр логов
```bash
# Next.js логи
npm run dev

# Проверить webhook info
curl "http://localhost:3000/api/bot/setup"
```

### Частые проблемы

#### Webhook не работает
1. Проверьте, что ngrok запущен
2. Обновите `NEXT_PUBLIC_APP_URL` в `.env.local`
3. Переустановите webhook

#### Команды не отвечают
1. Проверьте логи в консоли Next.js
2. Убедитесь, что `TELEGRAM_BOT_TOKEN` правильный
3. Проверьте подключение к Supabase

#### Напоминания не отправляются
1. Проверьте настройки в БД
2. Убедитесь, что время и часовой пояс правильные
3. Проверьте `last_sent_at` - не отправлено ли уже сегодня

## 📝 Тестовый чеклист

- [ ] Webhook установлен и отвечает
- [ ] Команда `/start` работает
- [ ] Команда `/settings` показывает настройки
- [ ] Команда `/stats` показывает статистику
- [ ] Кнопки открывают Web App
- [ ] API напоминаний возвращает успешный ответ
- [ ] Напоминания отправляются в правильное время

## 🚀 Production деплой

### 1. Обновить переменные окружения на Vercel
```
TELEGRAM_BOT_TOKEN=...
TELEGRAM_WEBHOOK_SECRET=...
CRON_SECRET=...
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
```

### 2. Установить production webhook
```bash
# После деплоя
curl -X POST "https://your-app.vercel.app/api/bot/setup" \
  -H "Authorization: Bearer YOUR_CRON_SECRET" \
  -H "Content-Type: application/json"
```

### 3. Настроить GitHub Secrets
В репозитории: Settings → Secrets → Actions
- `APP_URL`: https://your-app.vercel.app
- `CRON_SECRET`: тот же, что в Vercel

## 🔍 Полезные команды

### Telegram Bot API
```bash
# Получить информацию о боте
curl "https://api.telegram.org/bot<TOKEN>/getMe"

# Получить webhook info
curl "https://api.telegram.org/bot<TOKEN>/getWebhookInfo"

# Удалить webhook
curl "https://api.telegram.org/bot<TOKEN>/deleteWebhook"
```

### Supabase проверки
```sql
-- Проверить настройки напоминаний
SELECT * FROM reminder_settings WHERE enabled = true;

-- Проверить пользователей
SELECT * FROM users ORDER BY created_at DESC LIMIT 10;

-- Проверить статистику
SELECT * FROM user_stats;
```
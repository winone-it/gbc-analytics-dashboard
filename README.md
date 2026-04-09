# GBC Analytics Dashboard

Мини-дашборд заказов с интеграцией RetailCRM, Supabase, Vercel и Telegram-бота.  
Тестовое задание — AI Tools Specialist.

## Стек

- **Frontend**: Next.js 16, React 19, Tailwind CSS 4, Chart.js
- **Backend**: Supabase (PostgreSQL), RetailCRM API v5
- **Deploy**: Vercel
- **Notifications**: Telegram Bot API

## Быстрый старт

### 1. Клонирование и установка

```bash
git clone https://github.com/<your-username>/gbc-analytics-dashboard.git
cd gbc-analytics-dashboard
bun install
```

### 2. Настройка `.env`

```bash
cp .env.example .env
```

Заполни переменные:

| Переменная | Откуда взять |
|---|---|
| `RETAILCRM_URL` | Адрес вашего RetailCRM (напр. `https://myshop.retailcrm.ru`) |
| `RETAILCRM_API_KEY` | RetailCRM → Настройки → Интеграция → API ключи |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Settings → API → Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Settings → API → anon public |
| `SUPABASE_SERVICE_KEY` | Supabase → Settings → API → service_role secret |
| `TELEGRAM_BOT_TOKEN` | @BotFather → /newbot |
| `TELEGRAM_CHAT_ID` | Запусти `bun run scripts/telegram-bot.ts --get-chat-id` |

### 3. Создание таблицы в Supabase

Открой Supabase Dashboard → SQL Editor → New Query, вставь содержимое `scripts/setup-supabase.sql` и запусти.

### 4. Загрузка заказов в RetailCRM

```bash
bun run scripts/upload-to-retailcrm.ts
```

Загрузит 50 тестовых заказов из `mock_orders.json`.

### 5. Синхронизация RetailCRM → Supabase

```bash
bun run scripts/sync-retailcrm-to-supabase.ts
```

### 6. Запуск дашборда

```bash
bun run dev
```

Открой http://localhost:3000 — увидишь графики заказов.

### 7. Telegram-бот

```bash
# Получить chat_id (сначала напиши /start боту)
bun run scripts/telegram-bot.ts --get-chat-id

# Тестовое уведомление
bun run scripts/telegram-bot.ts --test

# Мониторинг новых заказов > 50,000 ₸
bun run scripts/telegram-bot.ts
```

Также есть webhook-эндпоинт `/api/webhook` — можно настроить в RetailCRM триггер.

### 8. Деплой на Vercel

```bash
# Через CLI
bunx vercel

# Или через GitHub: подключи репо в Vercel Dashboard
```

Не забудь добавить все env-переменные в Vercel → Settings → Environment Variables.

## Структура проекта

```
├── mock_orders.json              # 50 тестовых заказов
├── scripts/
│   ├── upload-to-retailcrm.ts    # Шаг 2: загрузка в RetailCRM
│   ├── sync-retailcrm-to-supabase.ts  # Шаг 3: синхронизация
│   ├── setup-supabase.sql        # SQL для создания таблицы
│   └── telegram-bot.ts           # Шаг 5: Telegram уведомления
├── src/
│   ├── app/
│   │   ├── page.tsx              # Главная страница
│   │   ├── components/
│   │   │   └── Dashboard.tsx     # Дашборд с графиками
│   │   └── api/
│   │       ├── orders/route.ts   # API: данные для дашборда
│   │       └── webhook/route.ts  # Webhook для RetailCRM
│   └── lib/
│       └── supabase.ts           # Supabase клиент
└── .env.example
```

## Дашборд показывает

- **KPI-карточки**: общая выручка, кол-во заказов, средний чек, заказы > 50K
- **Заказы по городам** (Doughnut chart)
- **Выручка по источникам** (Bar chart — instagram, google, tiktok, direct, referral)
- **Распределение сумм заказов** (гистограмма)
- **Топ товаров по выручке** (горизонтальный bar chart)
- **Таблица заказов** с подсветкой крупных (> 50K ₸)

## Промпты для Claude Code

Проект был создан целиком с помощью Claude Code (Claude Opus 4.6). Основные промпты:

1. **"ознакомься и выполни тестовое"** — Claude прочитал README тестового задания, проанализировал mock_orders.json и спланировал архитектуру
2. **"можешь сам все сделать"** — Claude создал весь код: скрипты интеграции, дашборд, Telegram-бота

### Где застрял и как решил

- **Python не запускался на Windows** — переключился на Bun (TypeScript runtime), который был установлен в системе
- **Кодировка mock_orders.json** — файл в UTF-8 с кириллицей, на Windows нужно явно указывать encoding
- **Next.js 16 + Chart.js** — Chart.js требует регистрации компонентов (`ChartJS.register(...)`) в клиентском компоненте с `"use client"`
- **RetailCRM rate limits** — добавил задержку 600ms каждые 5 запросов при загрузке заказов

## Результат

- Ссылка на дашборд: _[вставить после деплоя]_
- Ссылка на репо: _[этот репозиторий]_
- Скриншот Telegram: _[вставить]_

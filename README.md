# QuestWallet

Веб-приложение для личного роста и накоплений в формате RPG-игры. Выполняй квесты — получай деньги и опыт. Копи на цели. Прокачивай навыки.

## Стек

- Vite + React 19 + TypeScript
- Tailwind v4
- Supabase (Auth + Postgres)
- framer-motion, canvas-confetti, lucide-react
- Vitest для юнит-тестов

## Локальная разработка

```bash
npm install
cp .env.example .env
# заполни .env реальными ключами Supabase

npm run dev      # http://localhost:5173
npm test         # юнит-тесты
npm run build    # production build
```

## Структура

- `src/auth/` — экраны входа/регистрации/сброса пароля
- `src/finance/` — чистые финансовые функции + игровые механики (XP, streak)
- `src/storage/` — слой работы с Supabase + localStorage-кэш + конфликты версий
- `src/state/` — React Context для управления состоянием
- `src/screens/` — экраны вкладок (Dashboard, Quests, Skills, Goals, Wallet, Settings)
- `src/dashboard/`, `src/quests/`, `src/skills/`, `src/goals/`, `src/wallet/`, `src/settings/` — компоненты по фичам
- `src/components/` — общие UI-компоненты (Modal)
- `src/lib/` — утилиты (даты, форматирование, seed-данные)

## Деплой

Vercel автоматически определяет Vite-проект. Добавь переменные `VITE_SUPABASE_URL` и `VITE_SUPABASE_ANON_KEY` в Project Settings → Environment Variables.

## Лицензия

Личный проект.

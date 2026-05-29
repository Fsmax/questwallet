# QuestWallet

Веб-приложение для личного роста в формате RPG-игры. Выполняй квесты, прокачивай навыки и закрывай дела дня — получай **опыт**, поднимай уровень и держи серию (деньги в геймификацию не входят). Параллельно веди финансы: пополняй кошелёк, копи на цели, отслеживай расходы по категориям, регулярные платежи и долги (кто должен тебе и кому должен ты) — всё связано с балансом кошелька.

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
- `src/screens/` — экраны 4 вкладок: Мой день, Личный рост (квесты + навыки), Финансы (кошелёк + цели + долги), Настройки
- `src/myday/`, `src/dashboard/`, `src/quests/`, `src/skills/`, `src/goals/`, `src/wallet/`, `src/debts/`, `src/settings/` — компоненты по фичам
- `src/components/` — общие UI-компоненты (Modal)
- `src/lib/` — утилиты (даты, форматирование, seed-данные)

## База данных

Схема и политики безопасности — в `supabase/migrations/`. Безопасность приложения
держится на **Row-Level Security**: клиент работает под публичным anon-ключом, поэтому
RLS обязан быть включён, иначе любой пользователь получит доступ к чужим данным.
Применить: `supabase db push` (или прогнать SQL вручную в SQL Editor).

## Деплой

Vercel автоматически определяет Vite-проект. Добавь переменные `VITE_SUPABASE_URL` и `VITE_SUPABASE_ANON_KEY` в Project Settings → Environment Variables.

## Лицензия

Личный проект.

-- QuestWallet — схема БД и политики безопасности (RLS).
-- Эта миграция фиксирует то, на что рассчитывает клиент (src/storage/storage.ts).
-- Безопасность приложения целиком держится на RLS: клиент работает под публичным
-- anon-ключом, поэтому каждая строка должна быть доступна ТОЛЬКО её владельцу.

-- ============================================================
-- Таблица состояния пользователя (одна строка на пользователя)
-- ============================================================
create table if not exists public.user_state (
  user_id       uuid        primary key references auth.users (id) on delete cascade,
  state         jsonb       not null,
  state_version bigint      not null default 1,
  updated_at    timestamptz not null default now()
);

-- Обновлять updated_at при каждом апдейте
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_user_state_touch on public.user_state;
create trigger trg_user_state_touch
  before update on public.user_state
  for each row execute function public.touch_updated_at();

alter table public.user_state enable row level security;

drop policy if exists "user_state owner select" on public.user_state;
create policy "user_state owner select" on public.user_state
  for select using (auth.uid() = user_id);

drop policy if exists "user_state owner insert" on public.user_state;
create policy "user_state owner insert" on public.user_state
  for insert with check (auth.uid() = user_id);

drop policy if exists "user_state owner update" on public.user_state;
create policy "user_state owner update" on public.user_state
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "user_state owner delete" on public.user_state;
create policy "user_state owner delete" on public.user_state
  for delete using (auth.uid() = user_id);

-- ============================================================
-- Журнал транзакций (полная история; id генерируется клиентом)
-- ============================================================
create table if not exists public.transactions (
  id         uuid        primary key,
  user_id    uuid        not null references auth.users (id) on delete cascade,
  type       text        not null check (type in ('earn', 'spend', 'save', 'withdraw')),
  amount     numeric     not null check (amount > 0),
  label      text        not null,
  created_at timestamptz not null default now()
);

create index if not exists transactions_user_created_idx
  on public.transactions (user_id, created_at desc);

alter table public.transactions enable row level security;

drop policy if exists "transactions owner select" on public.transactions;
create policy "transactions owner select" on public.transactions
  for select using (auth.uid() = user_id);

drop policy if exists "transactions owner insert" on public.transactions;
create policy "transactions owner insert" on public.transactions
  for insert with check (auth.uid() = user_id);

drop policy if exists "transactions owner delete" on public.transactions;
create policy "transactions owner delete" on public.transactions
  for delete using (auth.uid() = user_id);

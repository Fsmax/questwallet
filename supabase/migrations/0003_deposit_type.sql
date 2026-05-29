-- QuestWallet: пополнение кошелька (тип 'deposit').
-- Миграция самодостаточна и идемпотентна: безопасно применять даже если 0002 ещё
-- не накатывали — колонка category добавится при необходимости, а CHECK пересоздастся
-- сразу со всеми девятью типами операций.

alter table public.transactions
  add column if not exists category text;

alter table public.transactions
  drop constraint if exists transactions_type_check;

alter table public.transactions
  add constraint transactions_type_check
  check (type in (
    'earn', 'spend', 'save', 'withdraw',
    'lend', 'collect', 'borrow', 'settle',
    'deposit'
  ));

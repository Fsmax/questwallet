-- QuestWallet v2: категории расходов + долги.
-- Категории/регулярные расходы/долги хранятся в user_state.state (jsonb) и миграции БД
-- не требуют. Меняется только таблица transactions: добавляется категория траты и
-- новые типы операций для движения долгов по балансу.

-- Категория траты (id из state.expenseCategories); null для не-расходов.
alter table public.transactions
  add column if not exists category text;

-- Расширяем допустимые типы: lend/collect (дал/вернули) и borrow/settle (взял/отдал).
alter table public.transactions
  drop constraint if exists transactions_type_check;

alter table public.transactions
  add constraint transactions_type_check
  check (type in ('earn', 'spend', 'save', 'withdraw', 'lend', 'collect', 'borrow', 'settle'));

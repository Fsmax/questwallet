-- QuestWallet: UPDATE-политика для журнала транзакций.
-- Без неё ручная правка расхода/пополнения (storage.updateTransaction) под RLS
-- затрагивала 0 строк и молча НЕ обновляла журнал: список «Кошелёк» показывал
-- новое значение (из user_state.state), а «Статистика» (читает из этой таблицы) —
-- старое. Политика идемпотентна: безопасно применять повторно.

drop policy if exists "transactions owner update" on public.transactions;
create policy "transactions owner update" on public.transactions
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

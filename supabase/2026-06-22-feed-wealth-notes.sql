alter type public.account_type add value if not exists 'crypto';

drop policy if exists "Owners manage own budgets" on public.budgets;
drop policy if exists "Members manage shared or own budgets" on public.budgets;

create policy "Members manage shared or own budgets"
on public.budgets for update
using (public.is_household_member(household_id) and (owner_id = auth.uid() or is_shared))
with check (public.is_household_member(household_id) and (owner_id = auth.uid() or is_shared));

create table if not exists public.financial_notes (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  target_type text not null check (target_type in ('transaction', 'account', 'goal', 'household')),
  target_id uuid,
  body text not null,
  is_shared boolean not null default true,
  owner_id uuid not null references public.profiles(id),
  created_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now()
);

create table if not exists public.net_worth_snapshots (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  snapshot_on date not null default current_date,
  assets numeric(12, 2) not null default 0,
  liabilities numeric(12, 2) not null default 0,
  net_worth numeric(12, 2) generated always as (assets - liabilities) stored,
  created_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now(),
  unique (household_id, snapshot_on)
);

create table if not exists public.notification_preferences (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  frequency text not null default 'daily' check (frequency in ('instant', 'daily', 'weekly')),
  budget_alerts boolean not null default true,
  bills boolean not null default true,
  goals boolean not null default true,
  achievements boolean not null default true,
  household_activity boolean not null default true,
  insights boolean not null default true,
  recurring_transactions boolean not null default true,
  updated_at timestamptz not null default now(),
  unique (household_id, user_id)
);

create table if not exists public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  user_agent text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists financial_notes_household_idx on public.financial_notes(household_id, created_at desc);
create index if not exists financial_notes_target_idx on public.financial_notes(target_type, target_id);
create index if not exists net_worth_snapshots_household_idx on public.net_worth_snapshots(household_id, snapshot_on desc);
create index if not exists notification_preferences_user_idx on public.notification_preferences(user_id, household_id);
create index if not exists push_subscriptions_user_idx on public.push_subscriptions(user_id, household_id);

alter table public.financial_notes enable row level security;
alter table public.net_worth_snapshots enable row level security;
alter table public.notification_preferences enable row level security;
alter table public.push_subscriptions enable row level security;

drop policy if exists "Members view allowed financial notes" on public.financial_notes;
drop policy if exists "Members create financial notes" on public.financial_notes;
drop policy if exists "Owners delete own financial notes" on public.financial_notes;
drop policy if exists "Members view net worth snapshots" on public.net_worth_snapshots;
drop policy if exists "Members create net worth snapshots" on public.net_worth_snapshots;
drop policy if exists "Members update net worth snapshots" on public.net_worth_snapshots;
drop policy if exists "Users view own notification preferences" on public.notification_preferences;
drop policy if exists "Users upsert own notification preferences" on public.notification_preferences;
drop policy if exists "Users update own notification preferences" on public.notification_preferences;
drop policy if exists "Users view own push subscriptions" on public.push_subscriptions;
drop policy if exists "Users create own push subscriptions" on public.push_subscriptions;
drop policy if exists "Users update own push subscriptions" on public.push_subscriptions;
drop policy if exists "Users delete own push subscriptions" on public.push_subscriptions;

create policy "Members view allowed financial notes"
on public.financial_notes for select
using (public.is_household_member(household_id) and public.can_view_private(owner_id, is_shared));

create policy "Members create financial notes"
on public.financial_notes for insert
with check (public.is_household_member(household_id) and owner_id = auth.uid() and created_by = auth.uid());

create policy "Owners delete own financial notes"
on public.financial_notes for delete
using (public.is_household_member(household_id) and owner_id = auth.uid());

create policy "Members view net worth snapshots"
on public.net_worth_snapshots for select
using (public.is_household_member(household_id));

create policy "Members create net worth snapshots"
on public.net_worth_snapshots for insert
with check (public.is_household_member(household_id) and created_by = auth.uid());

create policy "Members update net worth snapshots"
on public.net_worth_snapshots for update
using (public.is_household_member(household_id))
with check (public.is_household_member(household_id));

create policy "Users view own notification preferences"
on public.notification_preferences for select
using (public.is_household_member(household_id) and user_id = auth.uid());

create policy "Users upsert own notification preferences"
on public.notification_preferences for insert
with check (public.is_household_member(household_id) and user_id = auth.uid());

create policy "Users update own notification preferences"
on public.notification_preferences for update
using (public.is_household_member(household_id) and user_id = auth.uid())
with check (public.is_household_member(household_id) and user_id = auth.uid());

create policy "Users view own push subscriptions"
on public.push_subscriptions for select
using (public.is_household_member(household_id) and user_id = auth.uid());

create policy "Users create own push subscriptions"
on public.push_subscriptions for insert
with check (public.is_household_member(household_id) and user_id = auth.uid());

create policy "Users update own push subscriptions"
on public.push_subscriptions for update
using (public.is_household_member(household_id) and user_id = auth.uid())
with check (public.is_household_member(household_id) and user_id = auth.uid());

create policy "Users delete own push subscriptions"
on public.push_subscriptions for delete
using (public.is_household_member(household_id) and user_id = auth.uid());

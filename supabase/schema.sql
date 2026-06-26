create extension if not exists pgcrypto;

create type member_role as enum ('owner', 'member');
create type money_kind as enum ('income', 'expense');
create type account_type as enum ('checking', 'savings', 'credit', 'cash', 'investment', 'crypto', 'loan');
create type invitation_status as enum ('pending', 'accepted', 'revoked');
create type recurring_frequency as enum ('weekly', 'biweekly', 'monthly', 'yearly');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.households (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.household_members (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role member_role not null default 'member',
  joined_at timestamptz not null default now(),
  unique (household_id, user_id)
);

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  name text not null,
  color text not null default '#007aff',
  icon text not null default 'circle',
  kind money_kind not null,
  created_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now(),
  unique (household_id, name, kind)
);

create table public.accounts (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  name text not null,
  type account_type not null,
  balance numeric(12, 2) not null default 0,
  is_shared boolean not null default true,
  owner_id uuid not null references public.profiles(id),
  created_by uuid not null references public.profiles(id),
  updated_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.transactions (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  account_id uuid references public.accounts(id) on delete set null,
  category_id uuid references public.categories(id) on delete set null,
  amount numeric(12, 2) not null check (amount >= 0),
  kind money_kind not null,
  description text not null,
  occurred_on date not null default current_date,
  is_shared boolean not null default true,
  owner_id uuid not null references public.profiles(id),
  created_by uuid not null references public.profiles(id),
  updated_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.transaction_receipts (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  transaction_id uuid not null references public.transactions(id) on delete cascade,
  storage_path text not null unique,
  file_name text not null,
  content_type text not null,
  size_bytes integer not null default 0,
  created_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now()
);

create table public.budgets (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  category_id uuid not null references public.categories(id) on delete cascade,
  month date not null,
  amount numeric(12, 2) not null check (amount >= 0),
  is_shared boolean not null default true,
  owner_id uuid not null references public.profiles(id),
  created_by uuid not null references public.profiles(id),
  updated_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (household_id, category_id, month)
);

create table public.recurring_items (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  account_id uuid references public.accounts(id) on delete set null,
  category_id uuid references public.categories(id) on delete set null,
  amount numeric(12, 2) not null check (amount >= 0),
  kind money_kind not null,
  description text not null,
  frequency recurring_frequency not null,
  next_due_on date not null,
  is_shared boolean not null default true,
  owner_id uuid not null references public.profiles(id),
  created_by uuid not null references public.profiles(id),
  updated_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.invitations (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  email text not null,
  token text not null unique,
  status invitation_status not null default 'pending',
  role member_role not null default 'member',
  invited_by uuid not null references public.profiles(id),
  accepted_by uuid references public.profiles(id),
  expires_at timestamptz not null,
  created_at timestamptz not null default now(),
  accepted_at timestamptz
);

create table public.goals (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  name text not null,
  target_amount numeric(12, 2) not null check (target_amount > 0),
  target_date date,
  color text not null default '#007aff',
  icon text not null default 'flag',
  is_shared boolean not null default true,
  owner_id uuid not null references public.profiles(id),
  created_by uuid not null references public.profiles(id),
  updated_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.goal_contributions (
  id uuid primary key default gen_random_uuid(),
  goal_id uuid not null references public.goals(id) on delete cascade,
  household_id uuid not null references public.households(id) on delete cascade,
  amount numeric(12, 2) not null check (amount > 0),
  note text,
  contributed_on date not null default current_date,
  created_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now()
);

create table public.financial_notes (
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

create table public.net_worth_snapshots (
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

create table public.notification_preferences (
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

create table public.notification_reads (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  notification_id text not null,
  read_at timestamptz not null default now(),
  unique (household_id, user_id, notification_id)
);

create table public.push_subscriptions (
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

create index accounts_household_idx on public.accounts(household_id);
create index transactions_household_date_idx on public.transactions(household_id, occurred_on desc);
create index transaction_receipts_transaction_idx on public.transaction_receipts(transaction_id);
create index budgets_household_month_idx on public.budgets(household_id, month);
create index invitations_token_idx on public.invitations(token);
create index goals_household_idx on public.goals(household_id);
create index goal_contributions_goal_idx on public.goal_contributions(goal_id);
create index financial_notes_household_idx on public.financial_notes(household_id, created_at desc);
create index financial_notes_target_idx on public.financial_notes(target_type, target_id);
create index net_worth_snapshots_household_idx on public.net_worth_snapshots(household_id, snapshot_on desc);
create index notification_preferences_user_idx on public.notification_preferences(user_id, household_id);
create index notification_reads_user_idx on public.notification_reads(user_id, household_id);
create index push_subscriptions_user_idx on public.push_subscriptions(user_id, household_id);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('receipts', 'receipts', false, 5242880, array['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name')
  on conflict (id) do update set email = excluded.email;
  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

create or replace function public.is_household_member(target_household uuid)
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1
    from public.household_members
    where household_id = target_household
      and user_id = auth.uid()
  );
$$;

create or replace function public.can_view_private(owner uuid, shared boolean)
returns boolean
language sql
stable
as $$
  select shared or owner = auth.uid();
$$;

alter table public.profiles enable row level security;
alter table public.households enable row level security;
alter table public.household_members enable row level security;
alter table public.categories enable row level security;
alter table public.accounts enable row level security;
alter table public.transactions enable row level security;
alter table public.transaction_receipts enable row level security;
alter table public.budgets enable row level security;
alter table public.recurring_items enable row level security;
alter table public.invitations enable row level security;
alter table public.goals enable row level security;
alter table public.goal_contributions enable row level security;
alter table public.financial_notes enable row level security;
alter table public.net_worth_snapshots enable row level security;
alter table public.notification_preferences enable row level security;
alter table public.notification_reads enable row level security;
alter table public.push_subscriptions enable row level security;

create policy "Profiles are visible to household members"
on public.profiles for select
using (
  id = auth.uid()
  or exists (
    select 1
    from public.household_members me
    join public.household_members them on them.household_id = me.household_id
    where me.user_id = auth.uid()
      and them.user_id = profiles.id
  )
);

create policy "Users update own profile"
on public.profiles for update
using (id = auth.uid())
with check (id = auth.uid());

create policy "Members view households"
on public.households for select
using (public.is_household_member(id) or created_by = auth.uid());

create policy "Users create households"
on public.households for insert
with check (created_by = auth.uid());

create policy "Owners update households"
on public.households for update
using (
  exists (
    select 1 from public.household_members
    where household_id = households.id and user_id = auth.uid() and role = 'owner'
  )
);

create policy "Members view household memberships"
on public.household_members for select
using (public.is_household_member(household_id));

create policy "Users join as themselves"
on public.household_members for insert
with check (user_id = auth.uid());

create policy "Members manage categories"
on public.categories for all
using (public.is_household_member(household_id))
with check (public.is_household_member(household_id) and created_by = auth.uid());

create policy "Members view allowed accounts"
on public.accounts for select
using (public.is_household_member(household_id) and public.can_view_private(owner_id, is_shared));

create policy "Members create accounts"
on public.accounts for insert
with check (public.is_household_member(household_id) and owner_id = auth.uid() and created_by = auth.uid());

create policy "Owners manage own accounts"
on public.accounts for update
using (public.is_household_member(household_id) and owner_id = auth.uid())
with check (public.is_household_member(household_id) and owner_id = auth.uid());

create policy "Owners delete own accounts"
on public.accounts for delete
using (public.is_household_member(household_id) and owner_id = auth.uid());

create policy "Members view allowed transactions"
on public.transactions for select
using (public.is_household_member(household_id) and public.can_view_private(owner_id, is_shared));

create policy "Members create transactions"
on public.transactions for insert
with check (public.is_household_member(household_id) and owner_id = auth.uid() and created_by = auth.uid());

create policy "Owners manage own transactions"
on public.transactions for update
using (public.is_household_member(household_id) and owner_id = auth.uid())
with check (public.is_household_member(household_id) and owner_id = auth.uid());

create policy "Owners delete own transactions"
on public.transactions for delete
using (public.is_household_member(household_id) and owner_id = auth.uid());

create policy "Members view allowed transaction receipts"
on public.transaction_receipts for select
using (
  public.is_household_member(household_id)
  and exists (
    select 1 from public.transactions
    where transactions.id = transaction_receipts.transaction_id
      and public.can_view_private(transactions.owner_id, transactions.is_shared)
  )
);

create policy "Members create transaction receipts"
on public.transaction_receipts for insert
with check (public.is_household_member(household_id) and created_by = auth.uid());

create policy "Owners delete own transaction receipts"
on public.transaction_receipts for delete
using (public.is_household_member(household_id) and created_by = auth.uid());

create policy "Members view allowed budgets"
on public.budgets for select
using (public.is_household_member(household_id) and public.can_view_private(owner_id, is_shared));

create policy "Members create budgets"
on public.budgets for insert
with check (public.is_household_member(household_id) and owner_id = auth.uid() and created_by = auth.uid());

create policy "Members manage shared or own budgets"
on public.budgets for update
using (public.is_household_member(household_id) and (owner_id = auth.uid() or is_shared))
with check (public.is_household_member(household_id) and (owner_id = auth.uid() or is_shared));

create policy "Members view allowed recurring items"
on public.recurring_items for select
using (public.is_household_member(household_id) and public.can_view_private(owner_id, is_shared));

create policy "Members create recurring items"
on public.recurring_items for insert
with check (public.is_household_member(household_id) and owner_id = auth.uid() and created_by = auth.uid());

create policy "Owners manage own recurring items"
on public.recurring_items for update
using (public.is_household_member(household_id) and owner_id = auth.uid())
with check (public.is_household_member(household_id) and owner_id = auth.uid());

create policy "Owners delete own recurring items"
on public.recurring_items for delete
using (public.is_household_member(household_id) and owner_id = auth.uid());

create policy "Members view invitations"
on public.invitations for select
using (public.is_household_member(household_id));

create policy "Invitees view pending invitations"
on public.invitations for select
using (
  status = 'pending'
  and expires_at > now()
  and lower(email) = lower(auth.jwt()->>'email')
);

create policy "Members create invitations"
on public.invitations for insert
with check (public.is_household_member(household_id) and invited_by = auth.uid());

create policy "Invitees can accept invitations"
on public.invitations for update
using (status = 'pending')
with check (accepted_by = auth.uid());

create policy "Members delete pending invitations"
on public.invitations for delete
using (public.is_household_member(household_id) and status = 'pending');

create policy "Members view allowed goals"
on public.goals for select
using (public.is_household_member(household_id) and public.can_view_private(owner_id, is_shared));

create policy "Members create goals"
on public.goals for insert
with check (public.is_household_member(household_id) and owner_id = auth.uid() and created_by = auth.uid());

create policy "Owners manage own goals"
on public.goals for update
using (public.is_household_member(household_id) and owner_id = auth.uid())
with check (public.is_household_member(household_id) and owner_id = auth.uid());

create policy "Owners delete own goals"
on public.goals for delete
using (public.is_household_member(household_id) and owner_id = auth.uid());

create policy "Members view goal contributions"
on public.goal_contributions for select
using (public.is_household_member(household_id));

create policy "Members create goal contributions"
on public.goal_contributions for insert
with check (public.is_household_member(household_id) and created_by = auth.uid());

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

create policy "Users view own notification reads"
on public.notification_reads for select
using (public.is_household_member(household_id) and user_id = auth.uid());

create policy "Users create own notification reads"
on public.notification_reads for insert
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

create policy "Household members upload receipt files"
on storage.objects for insert
with check (
  bucket_id = 'receipts'
  and public.is_household_member((split_part(name, '/', 1))::uuid)
);

create policy "Household members view receipt files"
on storage.objects for select
using (
  bucket_id = 'receipts'
  and public.is_household_member((split_part(name, '/', 1))::uuid)
);

create policy "Household members delete receipt files"
on storage.objects for delete
using (
  bucket_id = 'receipts'
  and public.is_household_member((split_part(name, '/', 1))::uuid)
);

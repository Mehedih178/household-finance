create extension if not exists pgcrypto;

create type member_role as enum ('owner', 'member');
create type money_kind as enum ('income', 'expense');
create type account_type as enum ('checking', 'savings', 'credit', 'cash', 'investment', 'loan');
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

create index accounts_household_idx on public.accounts(household_id);
create index transactions_household_date_idx on public.transactions(household_id, occurred_on desc);
create index budgets_household_month_idx on public.budgets(household_id, month);
create index invitations_token_idx on public.invitations(token);
create index goals_household_idx on public.goals(household_id);
create index goal_contributions_goal_idx on public.goal_contributions(goal_id);

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
alter table public.budgets enable row level security;
alter table public.recurring_items enable row level security;
alter table public.invitations enable row level security;
alter table public.goals enable row level security;
alter table public.goal_contributions enable row level security;

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

create policy "Members view allowed budgets"
on public.budgets for select
using (public.is_household_member(household_id) and public.can_view_private(owner_id, is_shared));

create policy "Members create budgets"
on public.budgets for insert
with check (public.is_household_member(household_id) and owner_id = auth.uid() and created_by = auth.uid());

create policy "Owners manage own budgets"
on public.budgets for update
using (public.is_household_member(household_id) and owner_id = auth.uid())
with check (public.is_household_member(household_id) and owner_id = auth.uid());

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

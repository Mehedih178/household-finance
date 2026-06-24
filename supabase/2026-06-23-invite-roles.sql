alter table public.invitations
add column if not exists role public.member_role not null default 'member';

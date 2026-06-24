drop policy if exists "Members delete pending invitations" on public.invitations;

create policy "Members delete pending invitations"
on public.invitations for delete
using (public.is_household_member(household_id) and status = 'pending');

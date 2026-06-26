create policy "Owners delete own recurring items"
on public.recurring_items for delete
using (public.is_household_member(household_id) and owner_id = auth.uid());

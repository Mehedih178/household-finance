update public.transactions
set is_shared = true,
    updated_at = now()
where is_shared = false;

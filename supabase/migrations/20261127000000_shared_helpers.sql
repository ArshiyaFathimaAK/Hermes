-- Shared by every table. Owner: project lead. Don't change without asking.

-- Keeps updated_at current on any table that has the column.
create function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

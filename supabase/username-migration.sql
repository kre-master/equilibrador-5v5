alter table public.profiles
add column if not exists username text;

create unique index if not exists profiles_username_unique
on public.profiles (lower(username))
where username is not null and username <> '';

create or replace function public.email_for_login(login_value text)
returns text
language sql
security definer
set search_path = public
as $$
  select case
    when position('@' in trim(login_value)) > 0 then lower(trim(login_value))
    else (
      select email
      from public.profiles
      where lower(username) = lower(trim(login_value))
      limit 1
    )
  end;
$$;

grant execute on function public.email_for_login(text) to anon, authenticated;

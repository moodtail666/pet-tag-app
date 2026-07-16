-- Tailvori production hardening. Safe to run more than once.

alter table public.tags alter column activation_code drop not null;

alter table public.profiles add column if not exists terms_accepted_at timestamptz;
alter table public.profiles add column if not exists terms_version text;
alter table public.profiles add column if not exists privacy_accepted_at timestamptz;
alter table public.profiles add column if not exists privacy_version text;

create index if not exists scan_events_ip_scanned_at_idx
  on public.scan_events(ip_hash, scanned_at desc);
create index if not exists activation_attempts_ip_time_idx
  on public.activation_attempts(ip_hash, attempted_at desc);
create index if not exists activation_attempts_time_idx
  on public.activation_attempts(attempted_at);

create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (
    user_id, email, terms_accepted_at, terms_version, privacy_accepted_at, privacy_version
  ) values (
    new.id,
    coalesce(new.email, ''),
    nullif(new.raw_user_meta_data ->> 'terms_accepted_at', '')::timestamptz,
    new.raw_user_meta_data ->> 'terms_version',
    nullif(new.raw_user_meta_data ->> 'privacy_accepted_at', '')::timestamptz,
    new.raw_user_meta_data ->> 'privacy_version'
  )
  on conflict (user_id) do update set
    email = excluded.email,
    updated_at = now();
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert or update of email on auth.users
  for each row execute procedure public.handle_new_auth_user();

update storage.buckets
set public = true,
    file_size_limit = 5242880,
    allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp']
where id = 'pet-photos';

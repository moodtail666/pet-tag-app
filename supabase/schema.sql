create extension if not exists "pgcrypto";

create table if not exists tags (
  id uuid primary key default gen_random_uuid(),
  tag_id text not null unique,
  activation_code text not null,
  owner_email text,
  status text not null default 'unactivated' check (status in ('unactivated', 'active', 'lost', 'disabled')),
  activated_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists pets (
  id uuid primary key default gen_random_uuid(),
  tag_id text not null unique references tags(tag_id) on delete cascade,
  owner_email text not null,
  name text not null default 'My Pet',
  photo_url text,
  breed text,
  age text,
  sex text,
  address text,
  about text,
  contact_name_1 text,
  contact_phone_1 text,
  contact_name_2 text,
  contact_phone_2 text,
  contact_email text,
  show_phone boolean not null default true,
  show_address boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists scan_events (
  id uuid primary key default gen_random_uuid(),
  tag_id text not null references tags(tag_id) on delete cascade,
  pet_id uuid references pets(id) on delete set null,
  scanned_at timestamptz not null default now(),
  latitude double precision,
  longitude double precision,
  map_url text,
  ip_address text,
  user_agent text,
  location_permission text,
  notification_status text,
  created_at timestamptz not null default now()
);

insert into tags (tag_id, activation_code, status)
values
  ('10000001', 'A7K9', 'unactivated'),
  ('10000002', 'M3Q8', 'unactivated'),
  ('99999993', 'ABCD', 'unactivated')
on conflict (tag_id) do nothing;

alter table tags enable row level security;
alter table pets enable row level security;
alter table scan_events enable row level security;

create policy "public read active tags" on tags
for select using (true);

create policy "public read pets" on pets
for select using (true);

create policy "public create scan events" on scan_events
for insert with check (true);

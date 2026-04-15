// This file contains the SQL schema for the Supabase database used in the project.
/*
create table entries (
  id uuid primary key default gen_random_uuid(),
  side text not null check (side in ('chime', 'cashapp')),
  number text,
  name text not null,
  amount numeric(10,2) not null default 0,
  created_at timestamptz default now()
);

create table daily_records (
  id uuid primary key default gen_random_uuid(),
  date date not null,
  day_name text not null,
  chime_total numeric(10,2) not null default 0,
  cashapp_total numeric(10,2) not null default 0,
  note text,
  created_at timestamptz default now()
);

alter table entries add column tag text;
alter table entries add column chime_number text;

-- New table to store daily snapshots of entries
create table daily_snapshots (
  id uuid primary key default gen_random_uuid(),
  record_id uuid references daily_records(id) on delete cascade,
  side text not null,
  number text,
  name text,
  amount numeric(10,2),
  tag text,
  chime_number text,
  created_at timestamptz default now()
);
*/
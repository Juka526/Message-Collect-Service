create table if not exists public.messages_213c66c3 (
  id text primary key,
  group_name text not null,
  message text not null,
  created_at timestamptz not null default now(),
  is_anonymous boolean not null default true
);

create index if not exists messages_213c66c3_created_at_idx
  on public.messages_213c66c3 (created_at);

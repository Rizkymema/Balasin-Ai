create table if not exists public.app_config (
  id integer primary key,
  data_json jsonb not null,
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.knowledge_faqs (
  id text primary key,
  data_json jsonb not null,
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.knowledge_documents (
  id text primary key,
  data_json jsonb not null,
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.knowledge_chunks (
  id text primary key,
  document_id text not null,
  chunk_index integer not null,
  content text not null,
  metadata_json jsonb not null,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.conversations (
  id text primary key,
  data_json jsonb not null,
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.customers (
  id text primary key,
  data_json jsonb not null,
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.bookings (
  id text primary key,
  data_json jsonb not null,
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.tickets (
  id text primary key,
  data_json jsonb not null,
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.products (
  id text primary key,
  data_json jsonb not null,
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.services (
  id text primary key,
  data_json jsonb not null,
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.broadcasts (
  id text primary key,
  data_json jsonb not null,
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.jobs (
  id text primary key,
  type text not null,
  payload_json jsonb not null,
  payload_hash text not null,
  status text not null,
  run_at timestamptz not null,
  attempts integer not null default 0,
  last_error text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists jobs_due_idx
  on public.jobs (status, run_at);

create unique index if not exists jobs_dedup_idx
  on public.jobs (type, payload_hash, status);

create table if not exists public.webhook_events (
  id text primary key,
  source text not null,
  payload_json jsonb not null,
  normalized_json jsonb,
  status text not null,
  created_at timestamptz not null default timezone('utc', now())
);

insert into public.app_config (id, data_json, updated_at)
values (1, '{}'::jsonb, timezone('utc', now()))
on conflict (id) do nothing;

grant usage on schema public to anon, authenticated;
grant all on table
  public.app_config,
  public.knowledge_faqs,
  public.knowledge_documents,
  public.knowledge_chunks,
  public.conversations,
  public.customers,
  public.bookings,
  public.tickets,
  public.products,
  public.services,
  public.broadcasts,
  public.jobs,
  public.webhook_events
to anon, authenticated;

alter table public.app_config enable row level security;
alter table public.knowledge_faqs enable row level security;
alter table public.knowledge_documents enable row level security;
alter table public.knowledge_chunks enable row level security;
alter table public.conversations enable row level security;
alter table public.customers enable row level security;
alter table public.bookings enable row level security;
alter table public.tickets enable row level security;
alter table public.products enable row level security;
alter table public.services enable row level security;
alter table public.broadcasts enable row level security;
alter table public.jobs enable row level security;
alter table public.webhook_events enable row level security;

drop policy if exists "balesin_app_config_all" on public.app_config;
create policy "balesin_app_config_all" on public.app_config
for all to anon, authenticated
using (true)
with check (true);

drop policy if exists "balesin_knowledge_faqs_all" on public.knowledge_faqs;
create policy "balesin_knowledge_faqs_all" on public.knowledge_faqs
for all to anon, authenticated
using (true)
with check (true);

drop policy if exists "balesin_knowledge_documents_all" on public.knowledge_documents;
create policy "balesin_knowledge_documents_all" on public.knowledge_documents
for all to anon, authenticated
using (true)
with check (true);

drop policy if exists "balesin_knowledge_chunks_all" on public.knowledge_chunks;
create policy "balesin_knowledge_chunks_all" on public.knowledge_chunks
for all to anon, authenticated
using (true)
with check (true);

drop policy if exists "balesin_conversations_all" on public.conversations;
create policy "balesin_conversations_all" on public.conversations
for all to anon, authenticated
using (true)
with check (true);

drop policy if exists "balesin_customers_all" on public.customers;
create policy "balesin_customers_all" on public.customers
for all to anon, authenticated
using (true)
with check (true);

drop policy if exists "balesin_bookings_all" on public.bookings;
create policy "balesin_bookings_all" on public.bookings
for all to anon, authenticated
using (true)
with check (true);

drop policy if exists "balesin_tickets_all" on public.tickets;
create policy "balesin_tickets_all" on public.tickets
for all to anon, authenticated
using (true)
with check (true);

drop policy if exists "balesin_products_all" on public.products;
create policy "balesin_products_all" on public.products
for all to anon, authenticated
using (true)
with check (true);

drop policy if exists "balesin_services_all" on public.services;
create policy "balesin_services_all" on public.services
for all to anon, authenticated
using (true)
with check (true);

drop policy if exists "balesin_broadcasts_all" on public.broadcasts;
create policy "balesin_broadcasts_all" on public.broadcasts
for all to anon, authenticated
using (true)
with check (true);

drop policy if exists "balesin_jobs_all" on public.jobs;
create policy "balesin_jobs_all" on public.jobs
for all to anon, authenticated
using (true)
with check (true);

drop policy if exists "balesin_webhook_events_all" on public.webhook_events;
create policy "balesin_webhook_events_all" on public.webhook_events
for all to anon, authenticated
using (true)
with check (true);

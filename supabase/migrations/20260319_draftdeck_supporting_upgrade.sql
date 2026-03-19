create extension if not exists pgcrypto;

alter table if exists public.posts
  add column if not exists revision_number integer not null default 1;

create table if not exists public.draft_sources (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  kind text not null check (kind in ('PASTE', 'FILE')),
  label text not null,
  content text not null,
  content_length integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.ai_runs (
  id uuid primary key default gen_random_uuid(),
  post_id uuid references public.posts(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  action text not null check (
    action in ('SUMMARIZE', 'DEVELOPER_REWRITE', 'TRANSLATE', 'SOURCE_TO_DRAFT')
  ),
  status text not null check (status in ('SUCCESS', 'ERROR')),
  input_excerpt text not null,
  output_text text not null default '',
  selection_text text,
  source_id uuid references public.draft_sources(id) on delete set null,
  error_message text,
  created_at timestamptz not null default now()
);

create table if not exists public.draft_revisions (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  revision_number integer not null,
  title text not null,
  content text not null,
  trigger text not null check (
    trigger in ('CREATE', 'AUTOSAVE', 'AI_APPLY', 'AI_APPEND', 'SOURCE_IMPORT')
  ),
  ai_run_id uuid references public.ai_runs(id) on delete set null,
  source_id uuid references public.draft_sources(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (post_id, revision_number)
);

create index if not exists idx_draft_sources_post_created
  on public.draft_sources (post_id, created_at desc);

create index if not exists idx_ai_runs_post_created
  on public.ai_runs (post_id, created_at desc);

create index if not exists idx_ai_runs_user_created
  on public.ai_runs (user_id, created_at desc);

create index if not exists idx_draft_revisions_post_revision
  on public.draft_revisions (post_id, revision_number desc);

alter table public.posts enable row level security;
alter table public.draft_sources enable row level security;
alter table public.ai_runs enable row level security;
alter table public.draft_revisions enable row level security;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'draft_sources'
      and policyname = 'draft_sources_owner_all'
  ) then
    create policy draft_sources_owner_all on public.draft_sources
      using (auth.uid() = user_id)
      with check (auth.uid() = user_id);
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'ai_runs'
      and policyname = 'ai_runs_owner_all'
  ) then
    create policy ai_runs_owner_all on public.ai_runs
      using (auth.uid() = user_id)
      with check (auth.uid() = user_id);
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'draft_revisions'
      and policyname = 'draft_revisions_owner_all'
  ) then
    create policy draft_revisions_owner_all on public.draft_revisions
      using (auth.uid() = user_id)
      with check (auth.uid() = user_id);
  end if;
end
$$;

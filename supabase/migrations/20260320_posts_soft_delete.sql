alter table if exists public.posts
  add column if not exists deleted_at timestamptz;

create index if not exists idx_posts_user_deleted
  on public.posts (user_id, deleted_at desc, updated_at desc);

-- Private, per-user folders for organizing whiteboards.
--
-- Folders are an owner-only organizational tool: the public gallery stays a
-- flat list, so folder names and structure are never exposed alongside a
-- shared whiteboard. Deleting a folder keeps its whiteboards by moving them
-- back to "Unfiled" (folder_id becomes NULL).

create table if not exists public.whiteboard_folders (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.users(id) on delete cascade,
  name       text not null check (char_length(name) between 1 and 100),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists whiteboard_folders_user_idx
  on public.whiteboard_folders (user_id, name);

-- One folder per name per user, case-insensitively — "System Design" and
-- "system design" are the same folder.
create unique index if not exists whiteboard_folders_user_name_idx
  on public.whiteboard_folders (user_id, lower(name));

alter table public.whiteboards
  add column if not exists folder_id uuid
  references public.whiteboard_folders(id) on delete set null;

create index if not exists whiteboards_user_folder_idx
  on public.whiteboards (user_id, folder_id);

-- Same posture as public.whiteboards (migration 20260915000008): the app
-- queries with the service-role key and authorizes in the API routes.
alter table public.whiteboard_folders disable row level security;

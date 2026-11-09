-- In-app feedback form submissions. Anyone (signed in or guest) may submit;
-- nobody can read or modify submissions through the API. The maintainer
-- reviews them in Supabase Studio's Table Editor (or a future admin page
-- using the service key), where row-level security doesn't apply.
create table public.feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid null references auth.users(id) on delete set null,
  category text not null check (category in ('bug', 'idea', 'confusing', 'praise', 'other')),
  message text not null check (char_length(message) between 1 and 4000),
  email text null check (email is null or char_length(email) <= 320),
  page_url text null,
  algorithm text null,
  language text null,
  created_at timestamptz not null default now()
);

create index feedback_created_idx on public.feedback (created_at desc);

alter table public.feedback enable row level security;

grant insert on public.feedback to anon, authenticated;

create policy "Anyone can submit feedback"
  on public.feedback for insert
  to anon, authenticated
  with check (user_id is null or user_id = (select auth.uid()));

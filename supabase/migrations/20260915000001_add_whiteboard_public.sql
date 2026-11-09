alter table public.whiteboards
  add column public boolean not null default false;

-- Allow anon (unauthenticated) read access to public whiteboards for the gallery.
-- RLS already handles user-scoped CRUD for authenticated users.
create policy "Anyone can view public whiteboards"
  on public.whiteboards for select
  to anon, authenticated
  using (public = true);

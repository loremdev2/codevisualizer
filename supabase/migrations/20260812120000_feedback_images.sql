-- Feedback screenshots. Images live in Supabase Storage (the `feedback-images`
-- bucket, public so the stored URL is directly viewable); the feedback row
-- references the file by URL. The bucket is public so the URL is clickable
-- straight from Supabase Studio — URLs are unguessable UUIDs, and feedback
-- itself stays insert-only.
alter table public.feedback add column if not exists image_url text null;

insert into storage.buckets (id, name, public)
values ('feedback-images', 'feedback-images', true)
on conflict (id) do nothing;

create policy "Anyone can upload feedback images"
  on storage.objects for insert
  to anon, authenticated
  with check (bucket_id = 'feedback-images');

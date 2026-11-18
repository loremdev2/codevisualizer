-- Keep whiteboard images out of the JSONB scene snapshot. The bucket stays
-- private; the application issues short-lived signed upload/download URLs
-- only after checking whiteboard ownership or public visibility.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'whiteboard-assets',
  'whiteboard-assets',
  false,
  26214400,
  array['image/png', 'image/jpeg', 'image/webp', 'image/gif', 'image/svg+xml']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

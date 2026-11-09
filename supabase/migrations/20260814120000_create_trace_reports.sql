-- One-click "This trace was wrong" reports. The visualizer stores only a
-- SHA-256 hash of the offending code (plus run context) so reports can be
-- grouped and reproduced by code identity without shipping raw source to the
-- analytics pipeline. Anyone may report; nobody can read or modify reports
-- through the API — the maintainer reviews them in Supabase Studio (or a
-- future admin page using the service key), where RLS doesn't apply.
create table public.trace_reports (
  id uuid primary key default gen_random_uuid(),
  code_hash text not null check (char_length(code_hash) between 8 and 128),
  input_hash text null check (input_hash is null or char_length(input_hash) between 8 and 128),
  language text null,
  template text null,
  outcome text null check (
    outcome is null or outcome in ('success', 'zero_steps', 'step_limit', 'timeout', 'error', 'instrument_error')
  ),
  error text null,
  note text null check (note is null or char_length(note) <= 2000),
  created_at timestamptz not null default now()
);

create index trace_reports_created_idx on public.trace_reports (created_at desc);
create index trace_reports_code_hash_idx on public.trace_reports (code_hash);

alter table public.trace_reports enable row level security;

grant insert on public.trace_reports to anon, authenticated;

create policy "Anyone can report a bad trace"
  on public.trace_reports for insert
  to anon, authenticated
  with check (true);

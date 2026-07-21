-- ============================================================================
-- MCCTI CoopEco - COMPLETE Supabase setup (run this ONE file, top to bottom)
-- ============================================================================
-- This creates the data table and applies every access policy for Stages 2-5.
-- Run it once in the Supabase SQL editor (open a New query, paste, click Run).
-- It replaces the need to run supabase_stage3/4/5.sql separately.
-- Re-running it is safe: it drops and recreates the policies each time, and
-- "create table if not exists" leaves existing data untouched.
-- ============================================================================

-- 1) The data table -----------------------------------------------------------
create table if not exists kv (
  key text primary key,
  value jsonb,
  user_id uuid references auth.users(id),
  updated_at timestamptz default now()
);

alter table kv enable row level security;

-- 2) Private rows: each person's own profile (profile:<uid>) ------------------
drop policy if exists "own rows read"   on kv;
drop policy if exists "own rows write"  on kv;
drop policy if exists "own rows update" on kv;

create policy "own rows read"   on kv for select using (auth.uid() = user_id);
create policy "own rows write"  on kv for insert with check (auth.uid() = user_id);
create policy "own rows update" on kv for update using (auth.uid() = user_id);

-- 3) Shared registry and audit (coop:, audit:) --------------------------------
drop policy if exists "registry read"   on kv;
drop policy if exists "registry write"  on kv;
drop policy if exists "registry update" on kv;

create policy "registry read"   on kv for select to authenticated
  using (key like 'coop:%' or key like 'audit:%');
create policy "registry write"  on kv for insert to authenticated
  with check (key like 'coop:%' or key like 'audit:%');
create policy "registry update" on kv for update to authenticated
  using (key like 'coop:%');

-- 4) Member analytics and integrations (member:, integration:) ----------------
drop policy if exists "members read"   on kv;
drop policy if exists "members write"  on kv;
drop policy if exists "members update" on kv;
drop policy if exists "members delete" on kv;

create policy "members read"   on kv for select to authenticated
  using (key like 'member:%' or key like 'integration:%' or key like 'accelerator:%');
create policy "members write"  on kv for insert to authenticated
  with check (key like 'member:%' or key like 'integration:%' or key like 'accelerator:%');
create policy "members update" on kv for update to authenticated
  using (key like 'member:%' or key like 'integration:%' or key like 'accelerator:%');
create policy "members delete" on kv for delete to authenticated
  using (key like 'member:%' and user_id = auth.uid());

-- 5) LASMECO loans and the escrow (loan:, escrow:) ----------------------------
drop policy if exists "loans read"   on kv;
drop policy if exists "loans write"  on kv;
drop policy if exists "loans update" on kv;

create policy "loans read"   on kv for select to authenticated
  using (key like 'loan:%' or key like 'escrow:%' or key like 'wallet:%' or key like 'ticket:%' or key like 'notif:%' or key like 'doc:%');
create policy "loans write"  on kv for insert to authenticated
  with check (key like 'loan:%' or key like 'escrow:%' or key like 'wallet:%' or key like 'ticket:%' or key like 'notif:%' or key like 'doc:%');
create policy "loans update" on kv for update to authenticated
  using (key like 'loan:%' or key like 'escrow:%' or key like 'wallet:%' or key like 'ticket:%' or key like 'notif:%' or key like 'doc:%');

-- 6) Value chains, opportunities and snapshots (chain:, opp:, oppr:, snap:) ----
-- These prefixes were added with the Value Chain Cooperative feature. Without them the
-- database silently rejects every write and the app shows "No value chains yet".
drop policy if exists "chains read"   on kv;
drop policy if exists "chains write"  on kv;
drop policy if exists "chains update" on kv;
drop policy if exists "chains delete" on kv;

create policy "chains read"   on kv for select to authenticated
  using (key like 'chain:%' or key like 'opp:%' or key like 'oppr:%' or key like 'snap:%' or key like 'snapsweep:%' or key like 'accelwallet:%' or key like 'guarantee:%');
create policy "chains write"  on kv for insert to authenticated
  with check (key like 'chain:%' or key like 'opp:%' or key like 'oppr:%' or key like 'snap:%' or key like 'snapsweep:%' or key like 'accelwallet:%' or key like 'guarantee:%');
create policy "chains update" on kv for update to authenticated
  using (key like 'chain:%' or key like 'opp:%' or key like 'oppr:%' or key like 'snap:%' or key like 'snapsweep:%' or key like 'accelwallet:%' or key like 'guarantee:%');
create policy "chains delete" on kv for delete to authenticated
  using (key like 'chain:%' or key like 'opp:%' or key like 'oppr:%' or key like 'snap:%' or key like 'snapsweep:%' or key like 'accelwallet:%' or key like 'guarantee:%');

-- 7) Public value chain directory (anonymous read) -----------------------------
-- The public directory lists Active value chains to visitors who are not signed in.
-- Chain records hold no personal or financial data: name, sector, stages, anchor,
-- coordinator and aggregate counts only. Cooperative and member tables stay private.
drop policy if exists "chains public read" on kv;
create policy "chains public read" on kv for select to anon
  using (key like 'chain:%');

-- If you do NOT want a public chain directory, drop the policy above:
--   drop policy if exists "chains public read" on kv;
-- The signed-in Value chains pages keep working either way.

-- Done. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in Vercel, redeploy,
-- and the app will use this database instead of demo mode.

-- ============================================================
-- Document storage (Supabase Storage) for cooperative uploads
-- ============================================================
insert into storage.buckets (id, name, public)
values ('coop-docs', 'coop-docs', false)
on conflict (id) do update set public = false;

-- Reviewer roles that may view any KYC/loan document (in addition to the uploader).
create or replace function public.is_doc_reviewer() returns boolean
  language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.kv
    where key = 'profile:' || (auth.uid())::text
      and (value->>'role') in ('officer','sterling','boi','leadership','accelerator')
  );
$$;

-- Read: only the uploader (owner) or an authorised reviewer. No public/anon access.
drop policy if exists "coop_docs_read" on storage.objects;
create policy "coop_docs_read" on storage.objects
  for select to authenticated using (
    bucket_id = 'coop-docs' and (owner = auth.uid() or public.is_doc_reviewer())
  );

-- Insert: any signed-in user may upload (their upload is owned by them).
drop policy if exists "coop_docs_insert" on storage.objects;
create policy "coop_docs_insert" on storage.objects
  for insert to authenticated with check (bucket_id = 'coop-docs');

-- Delete: only the uploader or an authorised reviewer.
drop policy if exists "coop_docs_delete" on storage.objects;
create policy "coop_docs_delete" on storage.objects
  for delete to authenticated using (
    bucket_id = 'coop-docs' and (owner = auth.uid() or public.is_doc_reviewer())
  );

-- FALLBACK (if reviewers cannot see documents after the above): comment out the two
-- policies above and use this permissive authenticated-only read instead:
--   drop policy if exists "coop_docs_read" on storage.objects;
--   create policy "coop_docs_read" on storage.objects
--     for select to authenticated using (bucket_id = 'coop-docs');

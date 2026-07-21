-- MCCTI CoopEco - Stage 3 registry visibility
-- Profiles stay private (Stage 2 policies). Registry and audit rows are shared
-- so cooperative officers and auditors can review societies filed by others.
-- Run this once in the Supabase SQL editor.

alter table kv enable row level security;

drop policy if exists "registry read"   on kv;
drop policy if exists "registry write"  on kv;
drop policy if exists "registry update" on kv;

create policy "registry read"   on kv for select to authenticated
  using (key like 'coop:%' or key like 'audit:%');
create policy "registry write"  on kv for insert to authenticated
  with check (key like 'coop:%' or key like 'audit:%');
create policy "registry update" on kv for update to authenticated
  using (key like 'coop:%');

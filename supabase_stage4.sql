-- MCCTI CoopEco - Stage 4 shared visibility for member analytics and integrations
-- Profiles stay private. Member records, integration status and audit rows are
-- shared so officers and leadership can see the QooP-sourced analytics.
-- Run this once in the Supabase SQL editor, after the Stage 3 policies.

alter table kv enable row level security;

drop policy if exists "members read"      on kv;
drop policy if exists "members write"     on kv;
drop policy if exists "members update"    on kv;
drop policy if exists "members delete"    on kv;
drop policy if exists "integration read"  on kv;
drop policy if exists "integration write" on kv;

create policy "members read"   on kv for select to authenticated
  using (key like 'member:%' or key like 'integration:%');
create policy "members write"  on kv for insert to authenticated
  with check (key like 'member:%' or key like 'integration:%');
create policy "members update" on kv for update to authenticated
  using (key like 'member:%' or key like 'integration:%');
create policy "members delete" on kv for delete to authenticated
  using (key like 'member:%' and user_id = auth.uid());

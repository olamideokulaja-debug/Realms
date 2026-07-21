-- MCCTI CoopEco - Stage 5 shared visibility for LASMECO loans and the escrow
-- Loan and escrow records are shared so the Accelerator, Directorate (officer),
-- Sterling Bank, Bank of Industry, Asset Matrix and leadership can all act on the
-- same pipeline. Run once, after the Stage 3 and Stage 4 policies.

alter table kv enable row level security;

drop policy if exists "loans read"   on kv;
drop policy if exists "loans write"  on kv;
drop policy if exists "loans update" on kv;

create policy "loans read"   on kv for select to authenticated using (key like 'loan:%' or key like 'escrow:%');
create policy "loans write"  on kv for insert to authenticated with check (key like 'loan:%' or key like 'escrow:%');
create policy "loans update" on kv for update to authenticated using (key like 'loan:%' or key like 'escrow:%');

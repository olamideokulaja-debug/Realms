# "No value chains yet" on the live site — fix

## What went wrong
Your Supabase database uses row-level security that only allows specific key prefixes
(`coop:`, `member:`, `loan:`, `doc:` and so on). The Value Chain feature introduced NEW
prefixes that were never added to that policy:

- `chain:`      value chains
- `opp:` `oppr:` opportunity board posts and responses
- `snap:` `snapsweep:` monthly contribution snapshots

So the database refused every chain write, and the app showed "No value chains yet".
It worked in demo mode (browser storage, no security policy), which is why testing missed it.

## Fix it in two minutes
1. Deploy the latest build (upload the zip to GitHub as usual).
2. Supabase -> SQL Editor -> New query.
3. Paste the whole of `supabase_setup.sql` and Run.
   (Safe to re-run: it drops and recreates policies, and does not touch your data.)
4. Reload the app and hard-refresh (Ctrl/Cmd+Shift+R).
5. Sign in as leadership -> Value chains. Seven chains should now appear, one per LASMECO
   sector, created automatically.

If you would rather run only the new part, this is the relevant block:

```sql
drop policy if exists "chains read"   on kv;
drop policy if exists "chains write"  on kv;
drop policy if exists "chains update" on kv;
drop policy if exists "chains delete" on kv;

create policy "chains read"   on kv for select to authenticated
  using (key like 'chain:%' or key like 'opp:%' or key like 'oppr:%' or key like 'snap:%' or key like 'snapsweep:%');
create policy "chains write"  on kv for insert to authenticated
  with check (key like 'chain:%' or key like 'opp:%' or key like 'oppr:%' or key like 'snap:%' or key like 'snapsweep:%');
create policy "chains update" on kv for update to authenticated
  using (key like 'chain:%' or key like 'opp:%' or key like 'oppr:%' or key like 'snap:%' or key like 'snapsweep:%');
create policy "chains delete" on kv for delete to authenticated
  using (key like 'chain:%' or key like 'opp:%' or key like 'oppr:%' or key like 'snap:%' or key like 'snapsweep:%');
```

## Also fixed: silent failures
The app was ignoring the database's response on every save, so a refused write looked
like nothing happened. It now reports the error in the browser console, and the Value
chains page tells you to re-run supabase_setup.sql if the list is unexpectedly empty.

**Note:** the contributions trend on cooperative Overview pages was affected by the same
gap (`snap:` keys). It will start recording once the policy is in place.

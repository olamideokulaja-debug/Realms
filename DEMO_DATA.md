# Demo data vs real data

## What was wrong
The app seeded demo records (13 fictional societies, members, loans, documents) into
**whatever database it was connected to** — including your live Supabase. It also fell
back to the SEKAT/QooP *sample feeds* whenever those real APIs weren't configured,
injecting more fictional cooperatives. That is why the live app "still shows demo data".

## How it works now
A single flag decides:

```
DEMO_DATA = (no Supabase connected)  OR  VITE_DEMO_DATA = "true"
```

| Build | Demo data? |
|---|---|
| No Supabase keys (preview/review build) | **Yes** — seeded sample data, so the app is explorable |
| Live Supabase, no `VITE_DEMO_DATA` | **No** — nothing fictional is ever written |
| Live Supabase + `VITE_DEMO_DATA=true` | Yes — opt-in only, for a staging database |

When demo data is active, a **"Demo data"** badge shows in the sidebar, so nobody can
mistake sample records for the real registry.

Sample-feed ingestion is now blocked on live too: SEKAT/QooP only write records when the
real API actually returns data.

## Keeping the demo data for now (current choice)
Add this in Vercel -> Settings -> Environment Variables, then Redeploy:

    VITE_DEMO_DATA = true

The live site keeps its seeded sample data and shows a "Demo data" badge in the sidebar.
Delete the variable when you are ready to go live, then run the cleanup below.

While demo data is on, Partner Reviewers can also open documents (the records are
fictional). The moment demo data is off, document access for reviewers closes
automatically - no further change needed.

## Go live: clean out the demo rows already in your database
The flag stops NEW demo data. Rows already seeded must be deleted once.

1. Deploy this build (no `VITE_DEMO_DATA` variable set in Vercel).
2. Supabase → SQL Editor → run:

```sql
delete from public.kv
where key like 'coop:%'
   or key like 'member:%'
   or key like 'loan:%'
   or key like 'doc:%'
   or key like 'audit:%'
   or key like 'ticket:%'
   or key like 'notif:%'
   or key like 'wallet:%'
   or key like 'escrow:%'
   or key like 'accelerator:%'
   or key like 'snap:%'
   or key like 'snapsweep:%'
   or key like 'integration:%';
```

3. Reload the app and hard-refresh (Ctrl/Cmd+Shift+R).
4. The registry is now empty and will only fill with real records.

**Check before running:** this deletes EVERYTHING of those types. If real cooperatives
have already registered on the live site, do not run it as-is — filter to the seeded rows
instead (seeded cooperatives have `value->>'createdBy' = 'seed@mccti.lg.gov.ng'`,
seeded members `createdBy like 'demo.%'`, seeded loans `createdBy like '%@coopeco.ng'`).
Take a backup first (Supabase → Database → Backups).

## For the QooP / SEKAT review
Use a **separate Vercel project from the same repo with no Supabase keys**. It runs on
demo data automatically, shows the "Demo data" badge, and touches no real records.

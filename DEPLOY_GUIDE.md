# Realms Field — Stages 1 and 2

The public Realms website for REALMS Healthcare Services Consulting Limited, plus staff sign-in and the role-aware workspace. A Vite + React + Supabase project, built as a single-file `src/App.jsx`, ready to deploy to Vercel.

## What is in this build
- **Tabbed public site.** The top bar has a tab for each page (Home, Process, Services, About, Contact) so each page stands alone with limited scrolling.
- **Staff sign-in (Stage 2).** Sign in or create an account, then choose your role from five cards: Team Leader, Field Monitor, RHSC HQ, HEFAMAA Reviewer, Facility Proprietor.
- **Per-user identity.** Each signed-in person is greeted by name and role. You can map specific emails to a name and title in the `IDENTITY` object in `src/App.jsx`.
- **Role-aware dashboard.** Each role sees its own set of tools, tagged with the stage in which they unlock.
- Brand-locked to Lora and RHSC purple on white, using your real logo from `public/`.

## Demo mode vs real accounts
The app runs in **demo mode** until you add Supabase keys. In demo mode, any email signs in (no password needed) and the role is saved in the browser, so you can preview the whole flow immediately. Once you add the two keys below, it switches automatically to **real Supabase accounts**.

## Two things to complete before publishing
1. **Coverage figures.** In `src/App.jsx`, find `EDIT: replace each value with a verified figure` and replace each dash on the Home tab.
2. **Contact details.** In `src/App.jsx`, find `EDIT: add real contact details` on the Contact tab.

## Set up Supabase (for real accounts)
1. Create a free project at supabase.com.
2. In the project, open **Project Settings → API** and copy the Project URL and the anon public key.
3. In Vercel, open your project's **Settings → Environment Variables** and add:
   - `VITE_SUPABASE_URL` = your Project URL
   - `VITE_SUPABASE_ANON_KEY` = your anon public key
4. In Supabase, open the **SQL Editor** and run this once to create the store for roles:

```sql
create table if not exists kv (
  user_id uuid references auth.users(id) on delete cascade,
  k text not null,
  v jsonb,
  updated_at timestamptz default now(),
  primary key (user_id, k)
);
alter table kv enable row level security;
create policy "own rows" on kv
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
```

5. Optional: in **Authentication → Providers → Email**, turn email confirmation on or off to suit your rollout.
6. Redeploy on Vercel so the new environment variables take effect.

## Run it on your computer (optional)
1. Install Node.js 18 or newer from nodejs.org.
2. Open a terminal in this folder.
3. Type `npm install`, then `npm run dev`, and open the address it prints.

## Put it online with Vercel
1. Create free accounts at github.com and vercel.com.
2. On GitHub, create a new repository named `realms-field`.
3. Upload every file and folder from this project **including the `public` folder**, but not `node_modules`, `dist` or `.vercel`.
4. On Vercel, **Add New… → Project**, import the repository, leave the detected Vite settings, and **Deploy**.
5. Add the two environment variables above when you are ready for real accounts, then redeploy.

## Next stage
Stage 3 (Map) adds facility-list ingestion, area clustering and route planning onto the Field Monitor and Team Leader dashboards.

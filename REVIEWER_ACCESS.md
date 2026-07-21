# Partner review access — QooP & SEKAT

Read-only access to the **Leadership workspace** for partner review, with an automatic expiry.

## Accounts

| Reviewer | Email |
|---|---|
| QooP | `review.qoop@coopeco.ng` |
| SEKAT | `review.sekat@coopeco.ng` |

On the sign-in screen they choose the **Partner Reviewer** role card, enter the email above, and set a password.

## Expiry — this is the control you edit

In `src/App.jsx`:

```js
const REVIEW_ACCESS_UNTIL = '2026-07-31T23:59:59+01:00'
```

- After this moment, both accounts are blocked at sign-in with a clear message, and any reviewer still signed in is logged out.
- **To extend:** change the date, commit, redeploy.
- **To revoke immediately:** set the date to any past date (e.g. `'2020-01-01T00:00:00+01:00'`), commit, redeploy. Also delete the two accounts in Supabase → Authentication → Users.

## What a reviewer CAN do
- See the whole Leadership workspace: Overview, action queue, registry-wide trend, Applications, Accelerators, Members, LASMECO, Portfolio monitoring, Service levels, Risk & fraud, Revenue & billing, Reports & exports.
- Search, filter, select rows and export CSV; open records to read them.

## What a reviewer CANNOT do (enforced in the app)
- **Open any KYC / cooperative document** — a privacy notice appears instead (NDPR).
- Approve, return, classify tiers, set NAV, appoint/suspend accelerators.
- Collect payments, notify members, or purge data.
- Reach Data retention or Integrations at all.

## Recommended: review on a DEMO deployment, not live
The safest way to run this review is a **second Vercel deployment with no Supabase keys** — the app then runs in demo mode against seeded sample data, so QooP and SEKAT review the real interface without touching any citizen's personal data.

1. Vercel → New Project → same GitHub repo.
2. Do **not** set `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY`.
3. Deploy. Share that URL.
4. Anyone can sign in with the reviewer emails and any password (demo mode).
5. Delete the project when the review ends.

## If you must review against live data
1. Deploy the current build.
2. Supabase → Authentication → Users → **Add user** for each email above, set a password, share it privately (not by email).
3. Confirm each reviewer's profile role reads `reviewer`.
4. Re-run `supabase_setup.sql`. The storage policy only grants document access to officer/sterling/boi/leadership/accelerator — `reviewer` is deliberately excluded, so KYC files stay locked at the database level too.
5. On/after the expiry date, delete both users.

**Note:** giving external partners access to real member data may require a data-sharing agreement under NDPR. Confirm with your data-protection officer before using the live option. This is not legal advice.

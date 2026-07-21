# MCCTI CoopEco - Deploy Guide (final build, Stages 1 to 9)

A real, deployable Vite + React project. You do not need to code. Follow one
step at a time.

## What you have now
- Stage 1: the landing and brand, with the Lagos State and MCCTI marks and Lora.
- Stage 2: accounts and the entry flow. "Which best describes you?" role page,
  sign-in and account creation, role saved per account, per-official identity by
  email, and a role-aware dashboard. It runs in demo mode until you add the two
  Supabase keys, so you can try it immediately.
- Stage 3: the Cooperative Registry and Governance module. Societies register and
  get a tracking ID; officers examine, approve or return with sign-off; societies
  file annual returns; auditors examine and sign off; every action is written to a
  timestamped audit trail; officers and leadership see area-office oversight.
  In demo mode a few sample societies are seeded so the officer queue is not empty.
  It also connects to SEKAT one way: once linked, all society, profile and audit
  data flows from SEKAT into MCCTI as read-only mirrors, marked with a SEKAT badge.
- Stage 4: the Member and MSME Analytics module (the QooP layer). QooP is treated
  exactly like SEKAT, a one-way source (QooP into MCCTI): members and their MSME
  profiles flow in as read-only mirrors with a QooP badge. Members onboard with
  KYC and MSME details and receive an explainable, advisory credit score. The app
  is GDPR-aligned (consent banner and sign-up consent, a privacy notice, and
  Download my data and Delete my data controls). Leadership can switch across all
  users with a "View as" tool.
- Stage 5: LASMECO Financing and the Accelerator role. A new Accelerator Programme
  login recruits and trains MSMEs and recommends a loan amount. The full pipeline
  runs Applied to In training to Shortlisted (Accelerator), to Cooperative
  validated with the 25% guarantee (officer), then across the three financial
  partners: Sterling Bank does KYC and assessment and applies the 50% guarantee,
  the Bank of Industry grants final approval and funds, and Sterling then disburses
  to the beneficiary. Asset Matrix MFB runs the platform revenue escrow and
  distributes it on the 50/15/15/10/10 formula. Each of the nine roles has its own
  login, and several people can log into each organisation. Members apply from
  their dashboard. Cooperatives now carry a join fee.

## Run it on your own computer (optional)
1. Install Node.js (version 18 or newer) from nodejs.org.
2. Open a terminal in this folder.
3. Type `npm install` and press enter.
4. Type `npm run dev` and press enter, then open the link shown.

## Put it online with GitHub and Vercel

### Step 1 - Create a GitHub repository
1. Go to github.com and sign in. Click "+" then "New repository".
2. Name it `mccti-coopeco`. Click "Create repository".

### Step 2 - Upload this project
1. Click "uploading an existing file".
2. Drag in every file and folder except `node_modules` and `dist`.
3. Click "Commit changes".

### Step 3 - Deploy with Vercel
1. Go to vercel.com and sign in with GitHub.
2. "Add New" then "Project". Import `mccti-coopeco`.
3. Leave the settings as they are. Click "Deploy".
4. Vercel gives you a live web address.

### Step 4 - Update later
Upload changed files to the same repository. Vercel redeploys automatically.

## Turn on real accounts (Supabase)
Until you do this, the site works in demo mode and accounts are saved only in the
visitor's own browser. To store real accounts:

1. Go to supabase.com, create a free account, then create a new project.
2. In the project, open Settings, then API. Copy the "Project URL" and the
   "anon public" key.
3. Create the data table and all access policies in one step. In Supabase open
   the SQL editor, click New query, paste the ENTIRE contents of the file
   `supabase_setup.sql` included in this project, and click Run. This creates the
   `kv` table and every policy for Stages 2 to 5 at once, so you do not need to run
   the separate stage files. (If you see "relation kv does not exist", it means a
   stage file was run before this one; just run `supabase_setup.sql` and you are
   set. Re-running it is safe.)

4. Add the keys to Vercel. Open your project on vercel.com, then Settings, then
   Environment Variables, and add:
   - VITE_SUPABASE_URL = your Project URL
   - VITE_SUPABASE_ANON_KEY = your anon public key
5. Redeploy. The demo-mode notice disappears once the keys are present.

## Database policies (live mode only)
`supabase_setup.sql` in step 3 already applies every access policy: private
profiles, the shared registry and audit rows, member analytics and integrations,
and the LASMECO loans and escrow. The separate `supabase_stage3.sql`,
`supabase_stage4.sql` and `supabase_stage5.sql` files are kept only for reference;
you do not need them if you ran `supabase_setup.sql`. In demo mode nothing is
needed; the app works in your browser without Supabase.

Security note, flagged for human oversight: at this stage approval controls are
enforced in the interface (a society cannot see the approve button; only officers
can). Server-side role enforcement through the AI proxy and a service role is
scheduled for a later stage before real data goes live. This is a compliance item,
not legal advice.

Tip: for quick testing without email links, in Supabase under Authentication,
Providers, Email, you can turn off "Confirm email". Leave it on for production.

## QooP integration (one-way)
QooP is the source for member and MSME analytics and is handled just like SEKAT:
data flows only from QooP into MCCTI. Synced members carry a QooP badge and are
read-only. Officers and leadership can run a sync from the Integrations tab. To
connect the live source, set QOOP_API_URL and QOOP_API_KEY (the endpoint is
`api/qoop-sync.js`, which never writes back). Until then a representative sample
is ingested so you can see the flow.

## Credit scoring and GDPR
Member credit scores are explainable and advisory. A cooperative officer reviews
before a score affects LASMECO eligibility, so it is not a solely automated
decision. The app includes a consent banner, a consent step at sign-up, a privacy
notice (footer and consent banner), and Download my data and Delete my data
controls in the member and society dashboards. Institutional cooperative records
are retained under the Ministry's public task; personal member data is erasable.
This supports GDPR and NDPR principles but is not legal advice; confirm the KYC
provider terms and data-sharing agreements with your team before going live.

## SEKAT integration (one-way)
SEKAT is the source of the legacy cooperative registry and audit records. In
MCCTI CoopEco data flows in one direction only, SEKAT into MCCTI. Ingested
societies appear alongside native ones, carry a SEKAT badge, and are read-only
here (registration and audit changes are made in SEKAT and flow in on the next
sync). Each SEKAT society brings its full dataset: registration and Reg. No.,
custodian and trustees, bank information, and the audit inputs (income and
expenses, balance sheet, disposal of surplus, trial balance, personal ledger
balances, comparative analysis, additional information) with examination,
approval and signature.

Until SEKAT provides live access, the platform ingests a representative sample so
you can see the flow. To connect the live source, set SEKAT_API_URL and
SEKAT_API_KEY (in .env.local for local use, and in Vercel for the live site). The
ingestion endpoint is `api/sekat-sync.js`; it never writes back to SEKAT. Officers
and leadership can trigger a sync from the SEKAT sync panel in their dashboard.

Compliance, flagged for human oversight: the data-flow direction, retention, and
NDPR handling should be governed by the SEKAT integration and data-sharing
agreement before live data is ingested. This is not legal advice.

## The three financial partners (separate logins)
LASMECO involves three distinct organisations, each with its own login. Several
staff can log into each: anyone who signs up and picks that organisation's role
(or is listed in the OFFICIALS map near the top of `src/App.jsx`) gets that
workspace.
- Sterling Bank (role: Sterling Bank). Receives validated applications, runs KYC
  and assessment, applies the 50% guarantee, and disburses to the beneficiary once
  the Bank of Industry has approved.
- Bank of Industry (role: Bank of Industry). Provides the loan; grants final
  approval and funding after Sterling's assessment. It does not disburse.
- Asset Matrix MFB (role: Asset Matrix MFB). Holds the platform revenue escrow.
  All fees accrue here and are distributed on the 50/15/15/10/10 formula (Lagos
  State 50, Asset Matrix 15, Imade/Catridge 15, QooP 10, SEKAT 10). It records
  distributions; live settlement connects through Paystack or Flutterwave.

Example logins already recognised: sterling@lasmeco.ng, boi@lasmeco.ng,
escrow@assetmatrix.ng (any password in demo). You can also just sign up and pick
the role. In live mode each person creates their own account under that role.

## Cooperative fees
Joining the platform carries a one-time cooperative registration fee of 50,000
Naira, shown as an outstanding banner on the society dashboard with a Pay button
(a demo stub until Paystack or Flutterwave is connected). Annual returns filing is
15,000 Naira per year, and CAP15 regulatory processing is 2.5% of surplus. These
figures come from the platform revenue model and can be changed in COOP_FEES near
the top of `src/App.jsx`. Consider waiving or reducing the join fee for societies
in the Ikorodu, Epe, Badagry and Ibeju-Lekki priority corridors to drive inclusion.

For LASMECO, there are no upfront fees to the borrower. On disbursement, a 200,000
Naira Accelerator fee and a 1% BOI appraisal fee are deducted, and the borrower
provides 10% cash collateral; the guarantee stack is 25% cooperative and 50%
Sterling, at 9% fixed. The app shows the full breakdown at approval and disbursement.

## Turn on the LASMECO pipeline (Stage 5, live mode only)
The LASMECO loan and escrow policies are already included in `supabase_setup.sql`,
so no extra step is needed. Not needed in demo mode.

Payments: when you are ready to take real fee payments, add PAYSTACK_SECRET_KEY or
FLUTTERWAVE_SECRET_KEY and we will wire the Pay buttons to live checkout.

## Look, Leadership analytics and approvals
The interface is a light, white-surface design with green as the accent (buttons,
bars, chips, the active tab) and gold as a subtle secondary. The Lagos State seal
appears as a faint watermark. To adjust the palette, edit the CSS variables in the
:root block near the top of the styles in `src/App.jsx` (--green accent, --gold
secondary, --ink the page, --ink-2 the card surface, --cream the text).

The Leadership / Admin dashboard has a Girard-style workspace switcher at the top:
pick any role, cooperative society or member and you drop into that workspace with
a "Viewing as" banner and an Exit. Cooperative applications are now approved or
rejected by Leadership: officers examine and record findings, and Leadership makes
the final decision after reviewing the documents, on the Applications tab. The
footer no longer shows revenue-split details.

The Leadership / Admin dashboard opens on an Overview of live analytics across the
whole platform: KPI tiles (societies, members profiled, LASMECO disbursed, escrow
accrued), donut charts for registration status, CAP15 compliance, registry source
and KYC, bar charts for area offices, member credit bands, the LASMECO pipeline,
applications by sector and the escrow distribution, and a six-month registrations
trend. These update automatically from the registry, members, loans and escrow.

## Landing page: Leadership, About and motion
The landing page now has a Leadership section with the Honourable Commissioner,
the Permanent Secretary and the Director of Cooperatives (photos in `public/` as
leader-hc.jpg, leader-ps.jpg and leader-dir.jpg — replace these files to update a
portrait), and an About section with expandable entries for the Ministry, LASMECO,
SEKAT, QooP and the platform. The nav links (Leadership, About, Platform, Roles)
smooth-scroll to each section. Headline figures count up on scroll, sections fade
in as they enter view, and cards lift on hover; all motion respects the visitor's
reduced-motion setting. When you upload to GitHub, include the `public/` folder so
the portraits ship with the site.

## Stage 6: Digital Wallet & esusu
Members now have a digital wallet (balance, add funds, and Save to cooperative)
with a transaction history. Each cooperative has a savings pool with a rotating
esusu / ajo: members save into the pool from their wallets, and the society (or
leadership) disburses the pool to each member in turn. Wallet and pool movements
are demo transactions until Paystack or Flutterwave is connected via
PAYSTACK_SECRET_KEY or FLUTTERWAVE_SECRET_KEY; the same keys will drive the
cooperative fee payments. The database policies for wallets are already included
in `supabase_setup.sql` (the wallet: rows), so no extra SQL step is needed.

## Stage 7: Support & grievance redress
Every signed-in user has a Help & support button in their dashboard. Members and
partners get a help concierge (an optional AI assistant, an FAQ, and a Raise a
ticket form) and can track their own tickets. Officers and leadership get a
support desk: open/in-progress/escalated/resolved counts, the ticket queue, a
threaded conversation, and actions to reply, resolve, or escalate to leadership.
This implements the LASMECO grievance-redress mechanism. The AI concierge answers
when ANTHROPIC_API_KEY is set on the server; otherwise it points people to the FAQ
or a ticket. The database policy for tickets is already in `supabase_setup.sql`.

## Final build: navigation, pricing and polish
- Left sidebar: once signed in, the app uses a left navigation rail (Workspace,
  Help & support, and Privacy & data for members and societies), with the person’s
  identity and Sign out at the bottom. The government letterhead stays on top.
- Pricing: the landing page has a Pricing section setting out the eight revenue
  streams (registration, annual returns, CAP15 processing, LASMECO portal,
  directory search, wallet, analytics subscriptions, and partner onboarding).
- Escrow reconciliation: Asset Matrix now reconciles wallet payments too. Wallet
  funding earns a 1% fee that accrues to the escrow alongside registration,
  returns and disbursement-portal fees, and a Payments throughput panel shows
  funding, esusu payouts and disbursed value.
- Leadership analytics: two new KPIs (Payments processed and Open support tickets)
  and a Support tickets chart, alongside the registry, compliance, member, LASMECO
  and escrow analytics.
- Polish: favicon and page title set to the Lagos seal and platform name, scroll
  animations and count-ups, and consistent light-theme contrast throughout.

To adjust fees in one place, edit COOP_FEES and the PRICING list near the top of
`src/App.jsx`.

## Sidebar navigation and per-role dashboards
Every role’s section navigation now lives in the left sidebar (not horizontal
tabs). Each role opens on an Overview dashboard with its own analytics:
- Society: members, contributions, CAP15 status, and a returns chart.
- Member: credit score, band and a score gauge.
- Officer: registry stat cards with registration-status, CAP15 and area-office charts.
- Auditor: returns and CAP15 compliance.
- Accelerator / Sterling / Bank of Industry: loan stats with pipeline-by-stage and by-sector charts.
- Asset Matrix: revenue-by-stream donut and payments throughput, plus a Distribution section.
- Leadership: the full platform analytics (six KPIs and multiple charts).
The sidebar also carries Help & support (all roles) and Privacy & data (members
and societies). To change a role’s sections, edit ROLE_NAV near the workspace map
in `src/App.jsx`.

## Payments (Paystack, test mode)
Inbound payments run through Paystack. The cooperative registration fee and member
wallet funding are wired; disbursements use bank rails, not card checkout. With no
keys the app falls back to demo success so everything keeps working.
To enable test mode: in Vercel add VITE_PAYSTACK_PUBLIC_KEY (pk_test_...) and
PAYSTACK_SECRET_KEY (sk_test_...), redeploy, and set your Paystack webhook URL to
https://YOUR-DOMAIN/api/paystack/webhook. Pay with a Paystack test card to confirm
the popup -> server verify -> paid path, then switch to live keys. Endpoints live
in api/paystack/ (verify, init, webhook); the secret key is server-only. Harden the
webhook to raw-body signature verification before processing high-value live events.

## Notifications (in-app + SMS/WhatsApp)
Every role has a Notifications item in the sidebar with an unread badge. Events
raise notifications automatically: member welcome on onboarding, LASMECO
application received and every status change, new support ticket (to officers and
leadership) and ticket updates back to the person who raised it, and cooperative
approval/return back to the society. Notifications always appear in-app; when a
phone number and a provider are configured they are also sent by SMS or WhatsApp
via /api/notify. Configure Termii (TERMII_API_KEY, TERMII_SENDER_ID) or Twilio
(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_FROM, TWILIO_WHATSAPP_FROM). With no
provider set, notifications are delivered in-app only. The notif: database policy
is already in supabase_setup.sql.

## Live SEKAT/QooP and BVN/NIN KYC
The SEKAT and QooP syncs now pull from the live APIs when configured, and fall back
to the representative sample otherwise. Set SEKAT_API_URL + SEKAT_API_KEY and
QOOP_API_URL + QOOP_API_KEY in Vercel; the Integrations panel shows a "Live API"
pill once a source returns data (otherwise "Sample feed"). The connectors expect
the record shapes documented in api/sekat-sync.js and api/qoop-sync.js.

Member onboarding verifies BVN and NIN through /api/kyc-verify. Set DOJAH_APP_ID +
DOJAH_API_KEY for live verification (VerifyMe/Youverify can be added the same way);
with no provider it does a format check only, so onboarding still works. KYC status
(Verified / Partial / Unverified) flows into the member profile and the credit score.

## Loan repayment tracking
On disbursement, Sterling sets a tenor and the platform generates a reducing-balance
amortisation schedule at 9%. The loan detail then shows the schedule (per-installment
principal, interest, due date and Paid/Due/Overdue status), outstanding balance,
next installment, and arrears. Repayments can be recorded by the borrower (card via
Paystack, or demo) or by Sterling/an officer (manual); the loan moves to Repaying and
then Completed automatically as it is paid down. If a loan falls into arrears, the
recovery waterfall is shown and Sterling or leadership can record a default, applying
the waterfall: borrower collateral (10%) -> cooperative guarantee (25%) -> Sterling
guarantee (50%), with any shortfall flagged. Portfolio outstanding and arrears appear
as KPIs on the leadership analytics and the financial partners' overviews.

## Reporting & exports
Leadership has a Reports & exports section; officers have a Reports section. CSV
downloads cover the cooperative registry, members & analytics, the LASMECO portfolio
(with outstanding and arrears), and escrow & distribution. Files open in Excel or
Google Sheets and reflect live data at the moment of download. Leadership can also
generate a printable Board Pack: an executive summary (KPIs, registration status,
LASMECO pipeline, escrow and SPV distribution) that opens a print view — choose
"Save as PDF". No extra services or keys are needed for reporting.

## Public verification directory & loan calculator
- Verify a cooperative: a public page (no login), reachable from the header "Verify
  a co-op" link and the footer. Anyone can search by registration/tracking number or
  name and see registration standing, CAP15 compliance and register source. It never
  discloses members, bank or financial details. Note: in live Supabase mode, allow
  anonymous read of cooperative standing (a public read policy or a dedicated public
  endpoint) so logged-out visitors can search; it works out of the box in demo mode.
- LASMECO repayment calculator: members get an indicative calculator on the LASMECO
  finance page — enter amount and tenor to preview monthly repayment, total repayable,
  interest and net-after-fees, using the same 9% reducing-balance model as real loans.

## Risk & fraud monitoring
Officers and leadership have a Risk & fraud section that heuristically flags: members
sharing a phone number, the same name across multiple cooperatives, members with
multiple active LASMECO applications, loans in arrears or default, and loan requests
disproportionate to turnover. Flags are graded high/medium/low and are advisory (for
human review, not an accusation). BVN/NIN numbers are never stored in the browser, so
production-grade duplicate-identity detection should run server-side via the KYC
provider; the heuristics here catch many patterns without holding sensitive numbers.

## Governance service levels (SLAs)
Leadership has a Service levels section tracking turnaround against targets:
cooperative approvals (14 days), grievance resolution (3 days) and LASMECO
application-to-disbursement (30 days). Each shows average time, percent within
target, and how many are breaching, with a live list of cases past target so they
can be actioned. Targets are configurable in SLA_TARGETS near the top of the SLA
code in src/App.jsx.

## Bulk CSV import
Under Integrations, officers and leadership can migrate data from CSV. Choose
Cooperatives or Members, paste CSV or upload a .csv file, Load template to see the
expected headers, Preview to validate (rows without a name are skipped), then Import.
Imported records are tagged "Bulk import"; members come in Unverified until KYC is
run, and cooperatives pass through the normal approval flow. Check the Risk & fraud
view and de-duplicate before large batches.

## Document uploads (Supabase Storage)
Societies can upload documents (by-laws, registration certificate, trustee IDs,
financial statements) from their cooperative page; officers and leadership see and
can Verify or Remove them during review. Files go to Supabase Storage when
configured; in demo mode small files preview in-browser. To enable live storage,
run supabase_setup.sql (it creates the PRIVATE "coop-docs" bucket and authenticated-only policies) or create a bucket named coop-docs in the Supabase dashboard. Max 5MB per
file. Document metadata is stored under the doc: policy already in the SQL.

## Automated esusu rotation
A cooperative can start an esusu/ajo rotation: the platform fixes the member order
and a monthly schedule, showing who is paid when (Paid / Due / Upcoming). The due
payout pays the pool to the next member in turn and notifies them. In production a
scheduled job (cron) processes each due payout automatically; in-app the society
triggers the due payout. Movements are demo until payments are connected.

## Multilingual foundation
A language switcher in the header offers English, Yoruba, Igbo, Hausa and Nigerian
Pidgin, and the choice persists. It uses a per-key translation table (I18N in
src/App.jsx) with automatic English fallback, so untranslated strings stay in
English rather than breaking. Currently the landing hero, navigation and primary
calls-to-action are translated with PROVISIONAL copy, and a visible note says so.
Important: have the Ministry's language team review and complete the translations
before public launch — add reviewed strings to the I18N table (each key takes yo/ig/
ha/pcm values). Governance and legal wording should not rely on machine translation.
Note: two-factor login was intentionally not added (email + password retained).

## Demo data (pre-go-live)
The platform seeds a full set of demonstration data once, for every user, in both
demo and live (Supabase) mode, so every view is populated: cooperatives across all
statuses and area offices, members with varied KYC and credit bands, LASMECO loans
across every pipeline stage (including disbursed with schedules, repaying, completed,
in-arrears and defaulted with recovery), wallets and an active esusu rotation,
support tickets in every status, notifications, and uploaded-document records. This
fixes empty/incomplete sections that previously appeared for live users (seeding used
to be skipped when Supabase was configured). The seed runs exactly once, guarded by
the integration:seed-v5 marker, so it never duplicates. When you are ready to go live
for real, clear the demo rows: in Supabase SQL Editor run
`delete from kv where key like 'coop:%' or key like 'member:%' or key like 'loan:%'
or key like 'ticket:%' or key like 'notif:%' or key like 'doc:%' or key like 'wallet:%'
or key like 'audit:%' or key like 'accelerator:%' or key = 'integration:seed-v5';` then reload. (Ask before running
this against real data.)

## Landing navigation (pages, not scrolling)
The top-banner links (Modules, Pricing, Leadership, About, Platform) now switch to
distinct pages instead of scrolling down one long page. Home shows the hero, the
headline figures, the area-office lens and the closing quote; each link opens its own
page with the active tab highlighted, and the brand logo returns Home. On phones the
links appear as a scrollable strip beneath the top bar so every page stays reachable.

## LASMECO priority sectors & accelerator routing
The LASMECO application now uses the eight official priority sectors from the LASMECO
guideline as a preloaded dropdown (no typing): Agriculture; Manufacturing & Light
Industry; Healthcare & Life Sciences; Digital Economy & ICT; Circular Economy &
Environment; Creative Industries & Tourism; Training & Education; and General MSME
Services. A member selects a sector, then selects an accelerator that covers that
sector. Accelerators choose the sectors they support on first sign-in (sector picker),
so member applications route to the right accelerator automatically. Eight demo
accelerators are seeded, one per sector, so members pick the specific accelerator
for their sector and accelerators see every application in the sectors they support.

## Leadership: view-as and returning
When leadership opens another workspace via "Open a workspace as", a green "Return to
my workspace" button appears at the top of the sidebar (in addition to the Exit view
banner), so it is always an obvious selection to get back to the leadership overview.

## LASMECO documents, KYC checklist & billing
On each LASMECO loan, an "Application documents & KYC" section lets the member submit
the required documents (valid ID, BVN confirmation, passport photo, business
registration, 6-month bank statement, cooperative membership letter). The Accelerator,
Sterling Bank and BOI all see the submitted set; Sterling verifies each item for KYC,
and BOI sees the verified documents. A live qualification checklist shows what is met
and what is outstanding (KYC, each document, credit score, cooperative membership), and
an accelerator or Sterling can "Notify member of outstanding items" to prompt a
resubmit via in-app notification and SMS. A "Revenue & billing" section (leadership)
lists all eight revenue streams with accrued amounts and a pay-on-request Paystack
collect action per stream. Table headings no longer wrap. The accelerator's pipeline
(actionable) and all-loans (all stages) tabs are now clearly distinct.

Privacy note: KYC documents are sensitive. For production, store them in a PRIVATE
Supabase Storage bucket with signed URLs and a retention policy (NDPR), not the public
demo bucket. Confirm the exact required-document list and the qualification thresholds
with Sterling's KYC/underwriting policy before go-live.

## KYC document storage is private
Documents (including KYC) are stored in a PRIVATE Supabase Storage bucket. Uploads
save only the file path; viewing generates a short-lived 5-minute signed URL on
demand, and storage access is restricted to authenticated platform users. Re-running
supabase_setup.sql will convert a previously public coop-docs bucket to private. In
demo mode (no Supabase) small files preview in-browser only. If you want document
access limited further (e.g. only the owning member plus officers/Sterling/BOI rather
than all signed-in users), that can be layered with per-object RLS keyed on the path.

## Owner + reviewer access & KYC retention
Access: after re-running supabase_setup.sql, a KYC/loan document can be read (and its
signed link minted) only by the member who uploaded it OR by an authorised reviewer
role (officer, Sterling, BOI, leadership, accelerator), enforced by the
is_doc_reviewer() function and per-object storage policies. If reviewers report they
cannot see documents, swap to the permissive authenticated-only read policy noted
(commented) at the bottom of the storage section in supabase_setup.sql, and check that
each reviewer has a profile row with the expected role.

Retention: leadership has a Data retention section. Loan/KYC documents are kept for
KYC_RETENTION_MONTHS (default 60 = 5 years) after an application closes (completed/declined/
defaulted), then deleted; cooperative governance documents are retained. Use the
"Purge expired documents" button for on-demand cleanup. For unattended enforcement,
schedule it server-side with Supabase pg_cron (adapt and TEST before enabling):

  -- requires the pg_cron and http/storage privileges; run in Supabase SQL editor
  select cron.schedule('purge-kyc-docs','0 3 * * *', $$ -- 60-month (5-year) retention
    with expired as (
      select d.key as dkey, (d.value->>'path') as path
      from public.kv d
      join public.kv l
        on l.key = 'loan:' || split_part(substr(d.key,5),':',1)
      where d.key like 'doc:%'
        and (l.value->>'status') in ('Completed','Declined','Default')
        and (l.value->>'updatedAt')::timestamptz < now() - interval '60 months'
    )
    , del_obj as (delete from storage.objects where name in (select path from expired) returning 1)
    delete from public.kv where key in (select dkey from expired);
  $$);

Confirm the retention period with your data-protection officer before enabling.

## RAC alignment (Sterling Bank Risk Acceptance Criteria)
The platform is being aligned to the Sterling Bank LASMECO RAC as the source of truth.
Done in this phase:
- Sectors: the RAC target-market list (Agriculture, Manufacturing, Health, Tourism,
  Service Delivery, Circular Economy, Digital Economy) with one accelerator per sector.
- Product variants: Working Capital (24 months, 3-month moratorium) and Asset Finance /
  Term Loan (36 months, 6-month moratorium). Repayment schedules model interest-only
  during the moratorium, then equal principal + interest.
- Documents: the RAC document set (ID, BVN, 12-month bank statements, credit-bureau
  report, cooperative letter of introduction, CAC, licences, cash-flow analysis,
  statement of net worth, asset register/invoices, insurance, photo).
- Eligibility checklist per loan: accelerator + cooperative recommendation, 12+ months
  trading (no startups), acceptable credit profile, and key documents.
- Facility-limit guidance from turnover (WC up to 30%/15%, Asset up to 50%/25% of
  annualised average monthly turnover). Loan cap N10m; Sterling guarantee cap N5m (50%).

Two items to confirm with Sterling: (a) the N5m "single obligor limit" is read as the
50% guarantee cap on a N10m maximum loan; (b) the facility-limit basis is read as a
percentage of ANNUALISED average monthly turnover (the RAC wording says "monthly").

Governance layer (now built):
- Cooperative Tier A/B/C classification (set on the cooperative, with NAV) and
  nomination limits (A 20 / B 10 / C 5), further capped by NAV / (25% x reference loan).
- Portfolio monitoring (Sterling, BOI, leadership): NPL ratio and loss norm with RAC
  thresholds - review at 5% NPL, suspend at 10%; loss-norm cap 1%; NPL loan list.
- Per-loan security & guarantee checklist (Sterling ticks): 50%/25% guarantees, 10%
  cash deposit, 15% lien, asset+credit-life insurance, GSI mandate, personal guarantee.
- Accelerator appointment by Sterling: self-registered accelerators are Pending until
  appointed; members can only route to Appointed accelerators.
- BOI fund management fee (2.5% p.a., shown quarterly) in Revenue & billing and escrow.
Note: demo NPL/loss-norm read high because the seed intentionally includes stressed
loans; both are computed live from real repayment data.

## RAC confirmations locked in
Following confirmation: max loan N10m (single-obligor guarantee N5m = 50%); facility
limit = % of annualised turnover; NPL = default or 90 days / 3 installments overdue;
BOI management fee = 2.5% of disbursed (proxy); RAC 7 sectors; moratorium interest kept.
Built in this batch:
- Cooperative Tier/NAV classification is MCCTI-only (officer/leadership), not Sterling.
- Accelerator appointment is by MCCTI (Ministry). Accelerators self-register (Pending),
  submit appointment documents (CAC, 3-yr audited accounts, CVs, cover letter, permits),
  and MCCTI reviews and appoints; members can only route to Appointed accelerators.
- Cooperative admission gates (approved by MCCTI, 12+ months, clean credit, focal
  person, tier, NAV) are enforced: an unadmitted cooperative cannot nominate members.
- Cooperative 25% guarantee liability is tracked per cooperative (contingent on active
  loans; crystallised on default).
- Scheme caps surfaced: global guarantee utilisation vs N5bn; single-obligor guarantee
  N5m implied by the N10m loan ceiling.
- Disbursement destination captured: beneficiary Sterling account (and supplier/vendor
  account for asset finance) recorded on the loan at disbursement.

## Sign-in performance (fixed)
Login and initial load no longer wait for demo data to seed. The dashboard renders
immediately and seed/refresh runs in the background, so sign-in is instant even on the
first load after a version bump (which clears and re-seeds the demo batch). The
cooperative Overview now shows an illustrated summary with charts: nomination capacity,
loan portfolio, membership mix, a real monthly contributions trend, guarantee exposure and annual returns.

## Contributions history
The cooperative contributions trend is now backed by real monthly snapshots (kv keys
snap:<trackingId>:<YYYY-MM>). A snapshot for the current month is recorded whenever the
cooperative Overview loads, so the trend accumulates over time; the demo seeds six
months of history so the curve is populated immediately. In addition, a once-a-month
sweep (guarded by a snapsweep:<YYYY-MM> marker) records a snapshot for EVERY cooperative
the first time anyone loads the app in a new month, so trends fill in even for
cooperatives that never sign in themselves.

For fully unattended capture (even if no one logs in during a month), schedule it
server-side with Supabase pg_cron (adapt/TEST before enabling):

  -- first of each month at 02:00: snapshot every cooperative
  select cron.schedule('coop-contrib-snapshot','0 2 1 * *', $$
    insert into public.kv (key, value)
    select 'snap:' || (value->>'trackingId') || ':' || to_char(now(),'YYYY-MM'),
           jsonb_build_object('coopId', value->>'trackingId',
             'month', to_char(now(),'YYYY-MM'),
             'contributions', (value->>'contributions'),
             'members', (value->>'members'), 'at', now())
    from public.kv where key like 'coop:%'
    on conflict (key) do update set value = excluded.value;
  $$);

## Value Chain Cooperatives
A Value Chain Cooperative bundles primary cooperatives, their MSME members and partner
firms (e.g. an anchor buyer) into one coordinated unit, organised by stage.

- Cooperatives are assigned AUTOMATICALLY. A cooperative joins a chain if EITHER:
  (a) its own registered sector maps to that chain (COOP_SECTOR_TO_CHAIN), OR
  (b) any of its members applied for LASMECO in that sector, i.e. through that sector's
      accelerator. A hospital cooperative registered under "Services" that applies via the
      Health Accelerator therefore appears in the Health chain, at Care & Service Delivery.
  Each cooperative shows WHY it is there ("Via Health Accelerator" / "By sector" /
  "Added by MCCTI"). MCCTI can add, remove, or move a cooperative between stages by hand;
  those overrides are remembered and always win.
- This accelerator route is what populates Health, Tourism and Digital Economy chains,
  since no cooperative registers under those names.
- Stages come from a per-sector template (CHAIN_STAGE_TEMPLATES) and are editable.
- Chains are PROVISIONED AUTOMATICALLY: one per RAC sector, created on load and kept in
  place (idempotent). This runs in live too - chains are structural, not sample data.
  MCCTI can still create extra chains; accelerators can propose (Proposed) for approval.
- A cooperative may belong to several chains.
- Metrics per chain: jobs supported, combined annual turnover, NPL across the chain,
  and combined NAV (indicative only - it does NOT pool guarantees for credit).
- Fees: CHAIN_FEES registration N50,000 / annual N25,000 are PLACEHOLDERS. Confirm the
  real figures with MCCTI before go-live.
- Sectors with no cooperative mapping (e.g. Circular Economy, Health, Tourism, Digital)
  start empty by design; MCCTI adds cooperatives manually, or the mapping is extended.

### Opportunity board (built)
Every chain has an opportunity board. Cooperatives, members, accelerators and MCCTI can
post a Request for quote, an Offtake offer or a Bulk purchase pool, with quantity, unit,
indicative value and a closing date. Anyone else in the chain can respond with a note and
a price; the poster is notified and can close the opportunity. Reviewers see it read-only.

Cooperatives and members now have their own "Value chains" tab showing only the chains
their cooperative belongs to.

### Public chain directory (built)
The public "Verify a cooperative" page now also lists Active value chains: name, sector,
stages, anchor buyer and scale (cooperatives / members / jobs). No member names, no
cooperative finances, no contacts.

It reads ONLY chain: records. Aggregate counts are denormalised onto each chain by staff
views, so the public page never touches the cooperative or member tables. supabase_setup.sql
grants anonymous read on chain: only - to switch the directory off, drop the
"chains public read" policy; signed-in pages keep working.

Still to build: the chain registration fee in Revenue & billing (amounts not yet confirmed).

## Layout width
Dashboard content was capped at 1120px, which left roughly 230px unused on wide admin
monitors. The cap is now 1560px, so tables, KPI rows and chart grids fill the screen.
Prose is capped at 95 characters per line so it stays readable at that width.

## Landing page: no commercial figures
The public landing page no longer carries the platform's commercial model. Removed:
- the Pricing page and its nav tab (the eight priced revenue streams)
- the headline band item "N655M -> N1B+ Year 1 to Year 3"
- the band item "8 Platform revenue streams" (now "21 Cooperative area offices")
- "self-funding from Year 1" in the hero footer and the Platform page
- the Platform page eyebrow "From fragmentation to N1 billion", and step 03 rewritten
  from "self-funding IGR" to oversight and inclusion

Pricing still lives where it belongs: leadership -> Revenue & billing (signed in).
The PRICING constant is unchanged, so nothing else is affected.

Deliberately kept (LASMECO programme facts, not platform pricing): the N10bn LASMECO
initiative in the Governor's biography, and loans "up to N10,000,000 at 9%" in Modules
and the FAQ. Say the word if these should go too.

## Accelerator dashboard (dynamic charts)
The accelerator Overview now opens with a live dashboard computed from that accelerator's
own loans: KPI row (sponsored MSMEs, disbursed value, earned to date, approval rate), an
application-pipeline bar chart, an approval-outcomes donut, a by-sector donut, and a
six-month disbursement-value trend line. All update automatically as loans move through
the pipeline. Rating (stars) and Earnings/drawdown sit below it.

Charts reuse the shared primitives (Donut, Bars, MiniArea, CHART_C). The society and
leadership overviews already use these; Sterling and BOI use the loan-stage overview.
The member overview is the remaining candidate for the same treatment.

## Document view, notifications, AI assessment & PDF letters
- View before approving: every document row an approver sees has a View button that opens
  the file in a preview modal. Sample records show a representative preview so the flow is
  demonstrable without real files.
- Notifications open as a message with a 'Go to...' button that jumps straight to the
  relevant screen (e.g. a guarantee approval links the member to LASMECO finance; a new
  request links the cooperative to its guarantee requests).
- AI guarantee assessment: in the approval box, 'Assess this member' calls Claude (Sonnet)
  with the member's tenure, contributions and business facts and returns a balanced,
  advisory view with a soft suggestion. Leadership-only; never auto-approves; the human
  decision and written justification remain required.
- Guarantee letter is now written by AI in professional British English and rendered as a
  PDF on the cooperative's typeset letterhead (name, area office, ref), via the browser's
  Save-as-PDF. A fixed fallback letter is used if the AI call is unavailable.
  Note: the AI features call the Anthropic API and only run in the deployed app, not in a
  local file preview. Allow pop-ups for the PDF letter.

## Richer demo data (contributions & lending-ready cooperatives)
Seeded members now carry a contribution history (total saved, monthly amount, months paid,
and a consistency percentage), so the AI guarantee assessment has real figures and can be
decisive. Four cooperatives are seeded lending-ready (approved + MCCTI-approved audit +
1-year existence): Kosofe Poultry, Oshodi Market Women, Ikeja Hospital Staff, and Eti-Osa
Fashion. Eligible test members include Grace Umeh (Kosofe), Folake Adisa & Chidi Okafor
(Oshodi), and Ngozi Balogun (Ikeja). Seed is now seed-v12 - Rebuild sample data to load it.

## Guarantee eligibility & workflow
Members can only apply for LASMECO finance when ALL of the following hold:
- The member has been in business 12+ months AND a cooperative member 6+ months.
- Their cooperative is MCCTI-approved, has an MCCTI-approved independent audit (annual),
  and has existed 1+ year to issue the 25% guarantee.
If not, the Apply button is disabled with an explanatory toast.

Guarantee ceiling: a cooperative can guarantee 25% of members' loans only up to the size
of its members' contributions. Committed guarantees (approved-and-onwards) count against
it; completed loans free capacity. e.g. a N1,000,000 pool backs four N1,000,000 loans.
A member requesting more than the available ceiling is toasted and blocked.

Workflow: member requests a guarantee -> cooperative leadership (or MCCTI leadership via
the cooperative record) approves WITH written evidence -> a guarantee letter is generated
-> the member downloads it and uploads it as a mandatory LASMECO document.

MCCTI can: approve the independent audit, confirm the cooperative's 1-year existence, and
override a guarantee ceiling with a logged reason. New key prefix guarantee: has an RLS
policy in supabase_setup.sql (re-run it on live). Registration now collects DOB, address,
member-since and business-start dates to drive the tenure checks.

## Accelerator earnings & drawdown
Accelerators now see, on their Overview and a dedicated Earnings tab: total earned, amount
transferred out, available balance, and the list of fee-earning loans. The fee is the
facilitation fee per disbursed loan (apFee in loanBreakdown), earned once a sponsored MSME's
loan is disbursed. A "Draw down / transfer to account" action captures a destination bank
account and records the transfer, reducing the available balance. Transfers are stored under
the accelwallet: key prefix (a new prefix; its RLS policy is in supabase_setup.sql; re-run
the SQL on live or transfers will be rejected). In live operation this routes to the
programme settlement account for payout.

## Accelerator rating
Each accelerator now carries an approval rating: the share of the MSMEs it sponsored that
were approved for a loan (reached bank assessment or beyond), out of those with a decided
outcome. Shown as stars + percentage on MCCTI -> Accelerators. Applications still in
training/coop-validation are counted as "in pipeline" and excluded until they have an
outcome. Attribution: a loan belongs to an accelerator by apEmail/apName, or by sector.

## Mandatory credit-clearance letter
LASMECO documents now include a "Credit clearance letter (no outstanding loans)": a letter
from a licensed credit bureau confirming the applicant is not owing money and has no other
loan pending. The MEMBER uploads it alongside their other documents (same flow as before).
It is MANDATORY: the qualification checklist will not pass until the letter is uploaded AND
verified by Sterling Bank. It is marked "(mandatory)" in both the checklist and the member's
upload guide.

## Environment variables
See `.env.example`. For local testing copy it to `.env.local` and fill it in.
- VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY - accounts and data (Stage 2).
- ANTHROPIC_API_KEY - server-side AI proxy, used from Stage 3. Never shown to
  the browser.

## Per-official identity
The dashboard greets each person by name, title and office. Known officials are
matched by their sign-in email in the OFFICIALS list near the top of
`src/App.jsx`. Edit that list, or add real emails, to personalise each account.
Anyone not listed gets a sensible name from their email and their chosen role.

## Branding assets
The Lagos State coat of arms and the MCCTI logo live in the `public` folder
(lagos-seal.png, mccti-logo.png, seal-watermark.png). Replace a file with the
same name to swap a mark. The display face is Lora.

## Notes
- British English throughout. Currency shown as the naira symbol.
- All figures on the landing page are illustrative pending live data.
- SPV revenue split shown (Lagos State 50%, Asset Matrix MFB 15%, Imade / Catridge
  15%, QooP 10%, SEKAT 10%) is a display value, subject to final agreement.
- Compliance items (KYC and NDPR data privacy, CAP15 Lagos Cooperative Law,
  LASMECO terms, escrow handling, audit-trail integrity) are flagged as they
  arise. This is not legal advice.

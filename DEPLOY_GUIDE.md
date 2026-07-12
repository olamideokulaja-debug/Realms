# Realms Field — Stage 1 (landing page)

This is the public Realms website for REALMS Healthcare Services Consulting Limited. It is a Vite + React project, built as a single-file `src/App.jsx`, ready to deploy to Vercel.

## What is in this stage
- The full public landing page: hero, mandate, the four-stage process (Map, Engage, Monitor, Debrief), the four service pillars, a coverage snapshot, the why-RHSC principles, an enquiry block and a footer.
- Brand-locked to Lora, RHSC purple on white, with a restrained blue accent from the logo wave.
- A "Staff sign-in" entry point that will connect to the Realms Field tool in Stage 2.

## Two things to complete before publishing
1. **Coverage figures.** In `src/App.jsx`, find the comment `EDIT: replace each value with a verified figure`. Replace the dash in each stat with a real number.
2. **Contact details.** In `src/App.jsx`, find the comment `EDIT: add real contact details`. Replace the email, phone and office lines.

## Run it on your computer (optional)
1. Install Node.js 18 or newer from nodejs.org.
2. Open a terminal in this folder.
3. Type `npm install` and press enter.
4. Type `npm run dev` and press enter, then open the address it prints.

## Put it online with Vercel
1. Create a free account at github.com and at vercel.com.
2. On GitHub, click **New repository**, name it `realms-field`, and create it.
3. On the new repository page, click **uploading an existing file**, then drag in every file and folder from this project except `node_modules`, `dist` and `.vercel` (those are not included in the zip anyway). Click **Commit changes**.
4. On Vercel, click **Add New… → Project**, choose your `realms-field` repository, and click **Import**.
5. Leave the settings as they are (Vercel detects Vite automatically) and click **Deploy**.
6. When it finishes, Vercel gives you a live web address. That is your site.

## Environment variables
Stage 1 needs none. Stage 2 will add two Supabase values, listed in `.env.example`.

## Next stage
Stage 2 adds Supabase sign-in and the role picker (Team Leader, Field Monitor, RHSC HQ, HEFAMAA Reviewer, Facility Proprietor), then the Map, Engage, Monitor and Debrief tools follow in later stages.

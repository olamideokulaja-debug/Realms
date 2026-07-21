# Health / Tourism / Digital Economy chains are empty — fix

## Why
No cooperative registers under "Health". Those chains fill by the ACCELERATOR route: a
cooperative joins Health when one of its members applies for LASMECO through the Health
Accelerator (member.lasmecoSector = 'Health').

Earlier builds had a bug: the seed wrote members WITHOUT lasmecoSector. Your database was
seeded by one of those builds, and seeding never repeats itself once marked done — so the
sample hospital cooperative has no Health sector attached, and the Health chain stays empty.

## Fix (30 seconds, no SQL)
1. Deploy the latest build.
2. Sign in as leadership -> **Integrations** -> **Rebuild sample data** -> confirm.
3. The page reloads. Go to **Value chains** -> Lagos Health Value Chain.
   You should now see **Ikeja Hospital Staff Multipurpose Coop** at *Care & Service
   Delivery*, tagged "Via Health Accelerator".

"Rebuild sample data" replaces the demo records with a corrected set. It does NOT delete
cooperatives, members or loans created by real users, and only appears while sample data
is switched on (VITE_DEMO_DATA=true).

## Expected once real cooperatives use the platform
Health, Tourism and Digital Economy chains will fill on their own as members apply through
those accelerators. Empty is the correct state until somebody applies.

MCCTI can also put any cooperative into any chain by hand: Value chains -> open a chain ->
"Add a cooperative". Manual additions and removals always win over the automatic mapping.

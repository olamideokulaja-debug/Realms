import React, { useState, useEffect, useRef, useCallback } from 'react'
import { createClient } from '@supabase/supabase-js'

/* ============================================================================
   MCCTI CoopEco - single-file application (src/App.jsx)
   Stage 1: Landing and brand
   Stage 2: Deployable stack and entry flow (Supabase auth + kv, roles, identity)
   Stage 3: Cooperative Registry & Governance (SEKAT layer) - registration,
            society dashboard, annual returns, officer review/approval, auditor
            examination, timestamped audit trail, area-office oversight
   ==========================================================================*/

/* ------------------------------ config -------------------------------- */
const SB_URL = import.meta.env.VITE_SUPABASE_URL
const SB_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY
const supa = SB_URL && SB_KEY ? createClient(SB_URL, SB_KEY) : null
const hasSupabase = Boolean(supa)
/* Demo/sample data.
   - No Supabase (preview/demo build): always ON, so the app is explorable.
   - Live Supabase: OFF unless VITE_DEMO_DATA="true". A production database must never be
     seeded with fictional cooperatives, members or loans. */
const DEMO_DATA = !hasSupabase || String(import.meta.env.VITE_DEMO_DATA || '').toLowerCase() === 'true'

/* --------------------------- content data ----------------------------- */
const AREA_LENS = [
  { id: 'state', label: 'State-wide', tag: 'All 21 area offices', coops: '13,000', members: '150,000+', active: '~15%', corridor: false },
  { id: 'ikeja', label: 'Ikeja', tag: 'Headquarters, Alausa', coops: '2,140', members: '31,400', active: '31%', corridor: false },
  { id: 'ikorodu', label: 'Ikorodu', tag: 'Priority corridor', coops: '1,080', members: '12,600', active: '9%', corridor: true },
  { id: 'epe', label: 'Epe', tag: 'Priority corridor', coops: '640', members: '7,300', active: '6%', corridor: true },
  { id: 'badagry', label: 'Badagry', tag: 'Priority corridor', coops: '520', members: '5,900', active: '5%', corridor: true },
  { id: 'ibeju', label: 'Ibeju-Lekki', tag: 'Priority corridor', coops: '410', members: '4,700', active: '4%', corridor: true },
]
const REGISTER = [
  { name: 'Omoluabi Traders Multipurpose Coop', office: 'Ikeja', id: 'LAG-CS-24-018842', status: 'Approved' },
  { name: 'Idera Market Women Cooperative Society', office: 'Mushin', id: 'LAG-CS-24-019110', status: 'Under review' },
  { name: 'Ajo Isokan Savings Coop', office: 'Ikorodu', id: 'LAG-CS-24-019204', status: 'Annual returns due' },
  { name: 'Eko Artisans Thrift and Credit Coop', office: 'Lagos Island', id: 'LAG-CS-24-019260', status: 'Approved' },
  { name: 'Badagry Fishers Multipurpose Coop', office: 'Badagry', id: 'LAG-CS-24-019318', status: 'KYC pending' },
  { name: 'Epe Farmers Produce Cooperative', office: 'Epe', id: 'LAG-CS-24-019377', status: 'Under review' },
  { name: 'Alaba Traders Investment Coop', office: 'Ojo', id: 'LAG-CS-24-019401', status: 'Approved' },
  { name: 'Ilaje Transport Owners Coop', office: 'Ibeju-Lekki', id: 'LAG-CS-24-019455', status: 'Registration filed' },
  { name: 'Idumota Textile Merchants Coop', office: 'Lagos Island', id: 'LAG-CS-24-019488', status: 'Annual returns due' },
  { name: 'Surulere Caterers and Vendors Coop', office: 'Surulere', id: 'LAG-CS-24-019512', status: 'Approved' },
]
const MODULES = [
  { n: '01', title: 'Cooperative Registry & Governance', lens: 'SEKAT layer', ai: false, body: 'Online registration with a tracking ID, by-laws and trustees, area-office assignment, annual returns and CAP15 supervision, with officer review and a timestamped audit trail on every action.' },
  { n: '02', title: 'Member & MSME Analytics', lens: 'QooP layer', ai: true, body: 'Member onboarding and KYC, enterprise profiling across turnover, employment, sector and cash flow, and an AI credit score that sets a lending threshold and risk band.' },
  { n: '03', title: 'LASMECO Financing', lens: 'Access to finance', ai: false, body: 'The seven-step journey from intent to disbursement. Loans up to ₦10,000,000 at 9% per annum, eligibility gated on cooperative membership and platform compliance, human approval at disbursement.' },
  { n: '04', title: 'Digital Wallet & Payments', lens: 'No-cash by design', ai: false, body: 'Member savings and contributions, esusu and ajo cycles digitised, transfers, withdrawals and escrow, settled through Paystack and Flutterwave. Every flow traceable, no cash handling.' },
  { n: '05', title: 'Marketplace & Directory', lens: 'Commerce and search', ai: false, body: 'A searchable cooperative directory with premium listings and a coop-merchant marketplace, opening government-linked commerce to societies across all 57 LGAs and LCDAs.' },
  { n: '06', title: 'Governance Intelligence', lens: 'For leadership', ai: true, body: 'Real-time dashboards for the Director, Permanent Secretary, Honourable Commissioner and Governor’s office. Cooperative activity, loan performance, MSME health per LGA and fraud alerts.' },
]
const ROLES = [
  { id: 'society', icon: 'society', title: 'Cooperative Society', desc: 'Register, file returns, manage members and contributions.', defaultTitle: 'Society Administrator' },
  { id: 'member', icon: 'member', title: 'Member / MSME', desc: 'Onboard, get profiled and scored, save and apply for LASMECO.', defaultTitle: 'Cooperative Member' },
  { id: 'officer', icon: 'officer', title: 'Cooperative Officer', desc: 'Review, audit and approve across the 21 area offices.', defaultTitle: 'Cooperative Officer' },
  { id: 'auditor', icon: 'auditor', title: 'Auditor', desc: 'Examine financial returns and sign off on the audit trail.', defaultTitle: 'Cooperative Auditor' },
  { id: 'sterling', icon: 'partner', title: 'Sterling Bank', desc: 'KYC and assessment, 50% guarantee, and disbursement.', defaultTitle: 'Sterling Bank' },
  { id: 'boi', icon: 'boi', title: 'Bank of Industry', desc: 'Final approval and loan funding for LASMECO.', defaultTitle: 'Bank of Industry' },
  { id: 'assetmatrix', icon: 'vault', title: 'Asset Matrix MFB', desc: 'Platform revenue escrow and distribution.', defaultTitle: 'Asset Matrix MFB' },
  { id: 'accelerator', icon: 'accelerator', title: 'Accelerator Programme', desc: 'Recruit, train and prepare MSMEs; recommend loan amounts.', defaultTitle: 'Accelerator Programme' },
  { id: 'leadership', icon: 'leadership', title: 'Leadership / Admin', desc: 'Real-time oversight of the cooperative economy.', defaultTitle: 'MCCTI Leadership' },
  { id: 'reviewer', icon: 'leadership', title: 'Partner Reviewer', desc: 'Time-limited, read-only review of the Leadership workspace.', defaultTitle: 'Partner Reviewer' },
]
const PERSONAS = [
  ['Cooperative societies', 'One registration, one record, one audit trail.'],
  ['Members and MSMEs', 'A profile, a score, and a route to finance.'],
  ['Cooperative officers', 'Every society across 21 offices, in view.'],
  ['Auditors', 'Returns examined, sign-off recorded.'],
  ['State leadership', 'The cooperative economy, in real time.'],
]
/* Review access: time-limited, read-only Leadership view for partner review (QooP, SEKAT).
   Change REVIEW_ACCESS_UNTIL to extend or revoke. Reviewers cannot open KYC documents or change any record. */
const REVIEW_ACCESS_UNTIL = '2026-07-31T23:59:59+01:00'
function reviewAccessExpired() { return Date.now() > new Date(REVIEW_ACCESS_UNTIL).getTime() }
function reviewDaysLeft() { return Math.max(0, Math.ceil((new Date(REVIEW_ACCESS_UNTIL).getTime() - Date.now()) / 86400000)) }
const OFFICIALS = {
  'review.qoop@coopeco.ng': { name: 'QooP Review', title: 'Reviewer (QooP)', office: 'QooP', role: 'reviewer' },
  'review.sekat@coopeco.ng': { name: 'SEKAT Review', title: 'Reviewer (SEKAT)', office: 'SEKAT', role: 'reviewer' },
  'commissioner@mccti.lg.gov.ng': { name: 'Honourable Commissioner', title: 'Honourable Commissioner', office: 'MCCTI', role: 'leadership' },
  'permsec@mccti.lg.gov.ng': { name: 'Permanent Secretary', title: 'Permanent Secretary', office: 'MCCTI', role: 'leadership' },
  'director@mccti.lg.gov.ng': { name: 'Director of Cooperatives', title: 'Director, Cooperative Services', office: 'Directorate of Cooperative Services', role: 'officer' },
  'registrar@mccti.lg.gov.ng': { name: 'Area Registrar', title: 'Cooperative Officer', office: 'Ikeja Area Office', role: 'officer' },
  'boi@lasmeco.ng': { name: 'Bank of Industry', title: 'BOI Loan Officer', office: 'Bank of Industry', role: 'boi' },
  'sterling@lasmeco.ng': { name: 'Sterling Bank', title: 'Sterling Loan Officer', office: 'Sterling Bank', role: 'sterling' },
  'escrow@assetmatrix.ng': { name: 'Asset Matrix MFB', title: 'Escrow Administrator', office: 'Asset Matrix Microfinance Bank', role: 'assetmatrix' },
}
const ROLE_CAPS = {
  member: ['Complete KYC and MSME profile', 'View your credit score and band', 'Save and contribute (esusu / ajo)', 'Apply for LASMECO finance'],
  partner: ['Process disbursements', 'Manage escrow and settlement', 'Oversee wallet transactions', 'Reconcile the revenue account'],
}

/* --------------------------- Stage 3 config --------------------------- */
const AREA_OFFICES = ['Alausa (HQ)', 'Ikeja', 'Mushin', 'Ikorodu', 'Epe', 'Badagry', 'Ibeju-Lekki', 'Lagos Island', 'Surulere', 'Ojo', 'Agege', 'Oshodi', 'Kosofe', 'Alimosho', 'Eti-Osa', 'Somolu', 'Apapa', 'Amuwo-Odofin', 'Ifako-Ijaiye', 'Lagos Mainland', 'Ajeromi']
const SECTORS = ['Trade', 'Thrift & Credit', 'Artisan', 'Agriculture', 'Transport', 'Manufacturing', 'Processing', 'Services', 'Multipurpose']
const LASMECO_SECTORS = ['Agriculture', 'Manufacturing', 'Health', 'Tourism', 'Service Delivery', 'Circular Economy', 'Digital Economy']
/* ---- Value Chain Cooperatives -------------------------------------------
   A Value Chain Cooperative bundles primary cooperatives, their MSME members and
   non-cooperative firms (e.g. an anchor buyer) into one coordinated commercial unit,
   organised by stage. Cooperatives are assigned AUTOMATICALLY from their sector;
   MCCTI can add or remove any cooperative by hand.
   Designed to be upgradeable to a registered secondary cooperative under CAP 15. */
const CHAIN_STAGE_TEMPLATES = {
  'Agriculture': ['Inputs & Supply', 'Production', 'Aggregation', 'Processing', 'Logistics & Storage', 'Distribution & Market'],
  'Manufacturing': ['Raw Materials', 'Production', 'Packaging & Quality', 'Logistics & Storage', 'Distribution & Market', 'Support Services'],
  'Health': ['Supply & Equipment', 'Care & Service Delivery', 'Pharmacy & Distribution', 'Logistics & Storage', 'Support Services'],
  'Tourism': ['Accommodation', 'Transport & Mobility', 'Attractions & Experiences', 'Food & Hospitality', 'Marketing & Booking'],
  'Service Delivery': ['Inputs & Tools', 'Service Provision', 'Logistics & Storage', 'Distribution & Market', 'Support Services'],
  'Circular Economy': ['Collection', 'Sorting & Aggregation', 'Recycling & Processing', 'Remanufacturing', 'Distribution & Market'],
  'Digital Economy': ['Infrastructure', 'Development & Production', 'Platforms & Services', 'Distribution & Market', 'Support Services'],
}
// Which value chain a cooperative's own sector belongs to. null = MCCTI assigns by hand.
const COOP_SECTOR_TO_CHAIN = { 'Agriculture': 'Agriculture', 'Processing': 'Manufacturing', 'Manufacturing': 'Manufacturing', 'Artisan': 'Manufacturing', 'Trade': 'Service Delivery', 'Transport': 'Service Delivery', 'Services': 'Service Delivery', 'Thrift & Credit': null, 'Multipurpose': null }
// Where in the chain a cooperative most likely sits, matched against that chain's stages.
const COOP_SECTOR_TO_STAGE = { 'Agriculture': 'Production', 'Manufacturing': 'Production', 'Artisan': 'Production', 'Processing': 'Processing', 'Transport': 'Logistics', 'Trade': 'Distribution', 'Services': 'Support', 'Thrift & Credit': 'Support', 'Multipurpose': 'Distribution' }
const CHAIN_FEES = { registration: 50000, annual: 25000 } // PLACEHOLDER - confirm with MCCTI before go-live
const CHAIN_STATUSES = ['Proposed', 'Active', 'Suspended']
function chainSectorForCoop(coop) { return COOP_SECTOR_TO_CHAIN[coop && coop.sector] || null }
function inferChainStage(coop, chain) {
  const stages = (chain && chain.stages) || []
  if (chainSectorForCoop(coop) === chain.sector) { // its own trade tells us where it sits
    const want = COOP_SECTOR_TO_STAGE[coop && coop.sector] || 'Production'
    const hit = stages.find((s) => s.toLowerCase().indexOf(want.toLowerCase()) > -1)
    if (hit) return hit
  }
  return stages[1] || stages[0] || '' // routed in via its accelerator: default to the core delivery stage
}
async function listChains() { return (await kvList('chain:')).filter(Boolean) }
async function saveChain(rec, ctx, action) {
  const id = rec.chainId || 'VC-' + Math.random().toString(36).slice(2, 7).toUpperCase()
  const next = { ...rec, chainId: id, updatedAt: new Date().toISOString(), createdAt: rec.createdAt || new Date().toISOString(), createdBy: rec.createdBy || (ctx && ctx.email) }
  await kvSet('chain:' + id, next)
  if (action && ctx) await addAudit({ trackingId: id, action, by: ctx.name, role: ctx.role, note: rec.name || '' })
  return next
}
/* A cooperative belongs to a chain if EITHER:
   - its own registered sector maps to the chain's sector (COOP_SECTOR_TO_CHAIN), OR
   - any of its members applied for LASMECO in that sector, i.e. through that sector's
     accelerator (a hospital coop applying via the Health Accelerator joins Health), OR
   - MCCTI added it by hand.
   Manual removals always win. */
function chainCoopsVia(chain, loans, members) {
  const s = new Set()
  ;(loans || []).forEach((l) => { if (l.sector === chain.sector && l.coop) s.add(l.coop) })       // applied for LASMECO in this sector
  ;(members || []).forEach((m) => { if (m.lasmecoSector === chain.sector && m.coop) s.add(m.coop) }) // profiled under this sector's accelerator
  return s
}
function chainCoops(chain, coops, loans, members) {
  const added = chain.added || [], removed = chain.removed || [], via = chainCoopsVia(chain, loans, members)
  return coops.filter((c) => (removed.indexOf(c.trackingId) === -1) && (chainSectorForCoop(c) === chain.sector || via.has(c.name) || added.indexOf(c.trackingId) > -1))
}
function chainCoopSource(chain, coop, loans, members) {
  if (chainCoopsVia(chain, loans, members).has(coop.name)) return 'Via ' + chain.sector + ' Accelerator'
  if ((chain.added || []).indexOf(coop.trackingId) > -1) return 'Added by MCCTI'
  return 'By sector'
}
function chainMembers(chain, coops, members, loans) {
  const names = chainCoops(chain, coops, loans, members).map((c) => c.name)
  return members.filter((m) => names.indexOf(m.coop) > -1 || m.lasmecoSector === chain.sector)
}
function chainMetrics(chain, coops, members, loans) {
  const cs = chainCoops(chain, coops, loans, members), ms = chainMembers(chain, coops, members, loans)
  const names = cs.map((c) => c.name)
  const ls = (loans || []).filter((l) => names.indexOf(l.coop) > -1)
  const jobs = ms.reduce((a, m) => a + ((m.msme && m.msme.employees) || 0), 0)
  const turnover = ms.reduce((a, m) => a + (((m.msme && m.msme.monthlyTurnover) || 0) * 12), 0)
  const npl = nplMetrics(ls)
  const nav = cs.reduce((a, c) => a + (c.nav || 0), 0)
  return { coops: cs, members: ms, loans: ls, jobs, turnover, nav, npl, contributions: cs.reduce((a, c) => a + (c.contributions || 0), 0) }
}
const STATUS_CLASS = { 'Filed': 'st-filed', 'Under review': 'st-review', 'Approved': 'st-approved', 'Returned': 'st-returned' }
const CAP15_CLASS = { 'Compliant': 'st-approved', 'Returns due': 'st-review', 'Under audit': 'st-filed' }
const LOAN_STATUS_CLASS = { 'Applied': 'st-filed', 'In training': 'st-review', 'Shortlisted': 'st-review', 'Coop validated': 'st-review', 'Bank assessment': 'st-review', 'BOI approved': 'st-approved', 'Disbursed': 'st-approved', 'Repaying': 'st-approved', 'Completed': 'st-approved', 'Declined': 'st-returned', 'Default': 'st-returned' }
const TICKET_STATUS_CLASS = { 'Open': 'st-review', 'In progress': 'st-filed', 'Resolved': 'st-approved', 'Escalated': 'st-returned' }

const SEED_COOPS = [
  { name: 'Omoluabi Traders Multipurpose Coop', areaOffice: 'Ikeja', sector: 'Trade', status: 'Filed', cap15: 'Returns due', members: 212, contributions: 4800000, custodian: 'B. Ajomale', trustees: ['A. Ogun', 'K. Meadows'] },
  { name: 'Idera Market Women Cooperative Society', areaOffice: 'Mushin', sector: 'Trade', status: 'Under review', cap15: 'Under audit', members: 340, contributions: 9200000, custodian: 'E. Emilia', trustees: ['T. Okafor'] },
  { name: 'Ajo Isokan Savings Coop', areaOffice: 'Ikorodu', sector: 'Thrift & Credit', status: 'Filed', cap15: 'Returns due', members: 98, contributions: 2100000, custodian: 'G. Onuoha', trustees: ['D. Oguntoye'] },
  { name: 'Eko Artisans Thrift and Credit Coop', areaOffice: 'Lagos Island', sector: 'Artisan', status: 'Approved', cap15: 'Compliant', members: 156, contributions: 6400000, custodian: 'S. Bello', trustees: ['R. Ade', 'M. Uche'] },
]

/* ------------------------------ helpers ------------------------------- */
function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false)
  useEffect(() => {
    const m = window.matchMedia('(prefers-reduced-motion: reduce)')
    const on = () => setReduced(m.matches); on()
    m.addEventListener?.('change', on)
    return () => m.removeEventListener?.('change', on)
  }, [])
  return reduced
}
const initials = (n) => (n || '?').split(/\s+/).filter(Boolean).slice(0, 2).map((s) => s[0].toUpperCase()).join('')
const deriveName = (email) => ((email || '').split('@')[0] || 'Member').split(/[._-]+/).filter(Boolean).map((s) => s[0].toUpperCase() + s.slice(1)).join(' ')
function greeting() { const h = new Date().getHours(); return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening' }
const roleTitle = (id) => (ROLES.find((r) => r.id === id) || {}).title || id
const isReviewer = (ctx) => !!ctx && ctx.role === 'reviewer'
const fmtNaira = (n) => '₦' + Number(n || 0).toLocaleString('en-NG')
const fmtDate = (iso) => { try { return new Date(iso).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) } catch { return iso } }
function genTrackingId() { const yy = String(new Date().getFullYear()).slice(2); const n = String(Math.floor(Math.random() * 1000000)).padStart(6, '0'); return 'LAG-CS-' + yy + '-' + n }
const cx = (...a) => a.filter(Boolean).join(' ')

/* --------------------------- storage layer ---------------------------- */
const LS = {
  get(k, f) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : f } catch { return f } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)) } catch {} },
  del(k) { try { localStorage.removeItem(k) } catch {} },
}
const MEM = { read: () => LS.get('coopeco.kv', {}), write: (o) => LS.set('coopeco.kv', o) }
async function kvGet(key) {
  if (supa) { const { data } = await supa.from('kv').select('value').eq('key', key).maybeSingle(); return data?.value ?? null }
  return MEM.read()[key] ?? null
}
let _kvBlocked = null // last write the database refused (usually a missing RLS policy for a key prefix)
async function kvSet(key, value, uid) {
  if (supa) {
    const { error } = await supa.from('kv').upsert({ key, value, user_id: uid ?? null, updated_at: new Date().toISOString() })
    if (error) {
      _kvBlocked = { key, message: error.message, at: new Date().toISOString() }
      console.warn('CoopEco: the database refused to save "' + key + '" — ' + error.message + '. Re-run supabase_setup.sql; the key prefix may have no RLS policy.')
      throw new Error(error.message)
    }
    return
  }
  const o = MEM.read(); o[key] = value; MEM.write(o)
}
function kvBlocked() { return _kvBlocked }
async function kvList(prefix) {
  if (supa) { const { data } = await supa.from('kv').select('value').like('key', prefix + '%'); return (data || []).map((r) => r.value) }
  const o = MEM.read(); return Object.keys(o).filter((k) => k.startsWith(prefix)).map((k) => o[k])
}
async function kvDelete(key) {
  if (supa) { await supa.from('kv').delete().eq('key', key); return }
  const o = MEM.read(); delete o[key]; MEM.write(o)
}

/* ---------------------------- data layer ------------------------------ */
function buildProfile(email, role, name) {
  const official = OFFICIALS[(email || '').toLowerCase()]
  const finalRole = official?.role || role || 'member'
  return { email, role: finalRole, name: official?.name || name || deriveName(email), title: official?.title || (ROLES.find((r) => r.id === finalRole)?.defaultTitle) || 'Member', office: official?.office || 'Lagos State' }
}
async function loadProfile(uid, email, meta) {
  if (supa) { const { data } = await supa.from('kv').select('value').eq('key', 'profile:' + uid).maybeSingle(); if (data?.value) return data.value; return buildProfile(email, meta?.role, meta?.name) }
  return buildProfile(email)
}
async function saveProfile(uid, profile) { if (supa) await supa.from('kv').upsert({ key: 'profile:' + uid, value: profile, user_id: uid, updated_at: new Date().toISOString() }) }
async function loadSession() {
  if (supa) {
    const { data } = await supa.auth.getSession(); const user = data?.session?.user; if (!user) return null
    return { email: user.email, id: user.id, profile: await loadProfile(user.id, user.email, user.user_metadata) }
  }
  const email = LS.get('coopeco.session', null); if (!email) return null
  const u = LS.get('coopeco.users', {})[email]; if (!u) return null
  return { email, id: 'demo:' + email, profile: buildProfile(email, u.role, u.name) }
}
async function signUp(email, password, role, name) {
  email = email.trim().toLowerCase()
  if (OFFICIALS[email] && OFFICIALS[email].role === 'reviewer' && reviewAccessExpired()) throw new Error('This review access expired on ' + new Date(REVIEW_ACCESS_UNTIL).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) + '. Contact MCCTI to extend it.')
  if (supa) {
    const { data, error } = await supa.auth.signUp({ email, password, options: { data: { role, name } } }); if (error) throw new Error(error.message)
    const user = data.user; const profile = buildProfile(email, role, name); if (user) await saveProfile(user.id, profile)
    if (!data.session) return { pending: true, profile }; return { email, id: user.id, profile }
  }
  const users = LS.get('coopeco.users', {}); users[email] = { email, password, role, name }; LS.set('coopeco.users', users); LS.set('coopeco.session', email)
  return { email, id: 'demo:' + email, profile: buildProfile(email, role, name) }
}
async function signIn(email, password, chosenRole) {
  email = email.trim().toLowerCase()
  if (OFFICIALS[email] && OFFICIALS[email].role === 'reviewer' && reviewAccessExpired()) throw new Error('This review access expired on ' + new Date(REVIEW_ACCESS_UNTIL).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) + '. Contact MCCTI to extend it.')
  if (supa) {
    const { data, error } = await supa.auth.signInWithPassword({ email, password }); if (error) throw new Error(error.message)
    const user = data.user; const profile = await loadProfile(user.id, email, user.user_metadata)
    if (chosenRole && !OFFICIALS[email]) { profile.role = chosenRole; await saveProfile(user.id, profile) }
    return { email, id: user.id, profile }
  }
  const u = LS.get('coopeco.users', {})[email]; if (!u) throw new Error('No account found for that email. Create one first.')
  if (u.password && password && u.password !== password) throw new Error('That password does not match our records.')
  LS.set('coopeco.session', email); return { email, id: 'demo:' + email, profile: buildProfile(email, chosenRole || u.role, u.name) }
}
async function signOutNow() { if (supa) await supa.auth.signOut(); else LS.del('coopeco.session') }

/* registry */
async function addAudit(e) { const id = 'audit:' + Date.now() + '-' + Math.random().toString(36).slice(2, 7); await kvSet(id, { ...e, at: e.at || new Date().toISOString() }) }
async function listAudit(trackingId) { const all = await kvList('audit:'); const f = trackingId ? all.filter((a) => a.trackingId === trackingId) : all; return f.sort((a, b) => (a.at < b.at ? 1 : -1)) }
async function listCoops() { return (await kvList('coop:')).sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1)) }
async function getCoop(id) { return await kvGet('coop:' + id) }
async function createCoop(rec, ctx) {
  const trackingId = genTrackingId(); const now = new Date().toISOString()
  const record = { trackingId, source: 'MCCTI', regNo: null, status: 'Filed', cap15: 'Returns due', members: 0, contributions: 0, trustees: [], returns: null, registrationFee: COOP_FEES.registration, feeStatus: 'Invoiced', createdBy: ctx.email, createdAt: now, updatedAt: now, ...rec }
  await kvSet('coop:' + trackingId, record, ctx.uid)
  await addAudit({ trackingId, action: 'Registration filed', by: ctx.name, role: ctx.role, note: '' })
  return record
}
async function updateCoop(id, patch, ctx, action, note) {
  const cur = await getCoop(id); if (!cur) return null
  const next = { ...cur, ...patch, updatedAt: new Date().toISOString() }
  await kvSet('coop:' + id, next, cur.user_id)
  if (action) await addAudit({ trackingId: id, action, by: ctx.name, role: ctx.role, note: note || '' })
  if (patch.status && ['Approved', 'Returned'].includes(patch.status) && cur.createdBy && !cur.createdBy.includes('@system') && !cur.createdBy.includes('seed@')) {
    await notify({ to: cur.createdBy, title: 'Cooperative application ' + (patch.status === 'Approved' ? 'approved' : 'returned'), body: cur.name + ' (' + id + ')', event: 'coop' })
  }
  return next
}
async function fileReturns(id, returns, ctx) {
  return updateCoop(id, { returns: { ...returns, filedBy: ctx.name, filedAt: new Date().toISOString() }, cap15: 'Under audit' }, ctx, 'Annual returns filed', '')
}
async function seedDemoRegistry() {
  if (supa) return
  if ((await kvList('coop:')).length) return
  const base = Date.now() - 6 * 86400000
  for (let i = 0; i < SEED_COOPS.length; i++) {
    const s = SEED_COOPS[i]; const id = genTrackingId(); const created = new Date(base + i * 86400000).toISOString()
    await kvSet('coop:' + id, { trackingId: id, source: 'MCCTI', regNo: null, returns: null, createdBy: 'seed@mccti.lg.gov.ng', createdAt: created, updatedAt: created, ...s })
    await addAudit({ trackingId: id, action: 'Registration filed', by: s.custodian, role: 'society', note: '', at: created })
    if (s.status !== 'Filed') await addAudit({ trackingId: id, action: 'Begin examination', by: 'Area Registrar', role: 'officer', note: '', at: new Date(base + i * 86400000 + 3600000).toISOString() })
    if (s.status === 'Approved') await addAudit({ trackingId: id, action: 'Approved and signed off', by: 'Director of Cooperatives', role: 'officer', note: 'Compliant with CAP15', at: new Date(base + i * 86400000 + 7200000).toISOString() })
  }
  await syncFromSekat({ name: 'SEKAT gateway', role: 'officer', email: 'sekat@system' }, true)
  await syncFromQoop({ name: 'QooP gateway', role: 'officer', email: 'qoop@system' }, true)
  await seedDemoLoans()
}

/* ------------------- SEKAT -> MCCTI integration (one-way) ------------------
   SEKAT is the source of truth for the legacy registry and audit data. Data
   flows in one direction, SEKAT into MCCTI. Ingested societies are mirrored
   read-only. The sample feed below stands in for the live SEKAT API/DB until
   SEKAT_API_URL and SEKAT_API_KEY are configured; the field shape mirrors the
   MicMac Coop Portal dataset (registration, custodian, trustees, bank, and the
   full audit inputs with examination, approval and signature). */
const SEKAT_FEED = [
  { regNo: 'LSCS/IK/0453', name: 'Ikeja Grand Traders Cooperative', areaOffice: 'Ikeja', sector: 'Trade', custodian: 'F. Adekoyeni', trustees: ['A. Bello', 'K. Nwosu'], members: 410, contributions: 15200000, bank: { name: 'Asset Matrix MFB', accountName: 'Ikeja Grand Traders Coop', accountNumber: '0142xxxx88' }, status: 'Approved', cap15: 'Compliant', createdAt: '2019-11-04T09:00:00Z', audit: { income: 18400000, expenses: 12600000, balanceSheet: 31200000, disposalOfSurplus: 3200000, trialBalance: 31200000, personalLedgerBalances: 15200000, comparativeAnalysis: [{ year: 2022, surplus: 4100000 }, { year: 2023, surplus: 5800000 }], additionalInformation: 'Clean audit. No qualifications.', examinedBy: 'Area Auditor, Ikeja', approvedBy: 'Director of Cooperatives', signature: 'DoC/2024/0451' } },
  { regNo: 'LSCS/SR/1188', name: 'Surulere United Artisans Coop', areaOffice: 'Surulere', sector: 'Artisan', custodian: 'M. Oladipo', trustees: ['J. Ekene'], members: 268, contributions: 8900000, bank: { name: 'Asset Matrix MFB', accountName: 'Surulere United Artisans', accountNumber: '0142xxxx12' }, status: 'Approved', cap15: 'Compliant', createdAt: '2020-03-19T09:00:00Z', audit: { income: 9600000, expenses: 7100000, balanceSheet: 14800000, disposalOfSurplus: 1400000, trialBalance: 14800000, personalLedgerBalances: 8900000, comparativeAnalysis: [{ year: 2022, surplus: 1900000 }, { year: 2023, surplus: 2500000 }], additionalInformation: 'Minor disclosure on asset revaluation.', examinedBy: 'Area Auditor, Surulere', approvedBy: 'Director of Cooperatives', signature: 'DoC/2024/1180' } },
  { regNo: 'LSCS/IB/0761', name: 'Ibeju-Lekki Farmers Multipurpose Coop', areaOffice: 'Ibeju-Lekki', sector: 'Agriculture', custodian: 'S. Ilaje', trustees: ['O. Fela', 'B. Ade'], members: 134, contributions: 3600000, bank: { name: 'Asset Matrix MFB', accountName: 'Ibeju-Lekki Farmers Coop', accountNumber: '0142xxxx55' }, status: 'Under review', cap15: 'Under audit', createdAt: '2021-07-08T09:00:00Z', audit: { income: 4200000, expenses: 3100000, balanceSheet: 6900000, disposalOfSurplus: 500000, trialBalance: 6900000, personalLedgerBalances: 3600000, comparativeAnalysis: [{ year: 2023, surplus: 1100000 }], additionalInformation: 'Awaiting superior approval.', examinedBy: 'Area Auditor, Ibeju-Lekki', approvedBy: '', signature: '' } },
  { regNo: 'LSCS/LI/0209', name: 'Idumota Textile Merchants Coop', areaOffice: 'Lagos Island', sector: 'Trade', custodian: 'C. Nnaji', trustees: ['R. Uche', 'P. Sanni'], members: 512, contributions: 21400000, bank: { name: 'Asset Matrix MFB', accountName: 'Idumota Textile Merchants', accountNumber: '0142xxxx77' }, status: 'Approved', cap15: 'Compliant', createdAt: '2018-06-14T09:00:00Z', audit: { income: 26800000, expenses: 19200000, balanceSheet: 44500000, disposalOfSurplus: 4600000, trialBalance: 44500000, personalLedgerBalances: 21400000, comparativeAnalysis: [{ year: 2022, surplus: 6200000 }, { year: 2023, surplus: 7600000 }], additionalInformation: 'Clean audit.', examinedBy: 'Area Auditor, Lagos Island', approvedBy: 'Director of Cooperatives', signature: 'DoC/2024/0207' } },
]
const sekatIdFor = (regNo) => 'SEKAT-' + String(regNo).replace(/[^A-Za-z0-9]+/g, '-')
function sekatToCoop(r) {
  const id = sekatIdFor(r.regNo); const now = new Date().toISOString()
  const a = r.audit
  return {
    trackingId: id, source: 'SEKAT', regNo: r.regNo, name: r.name, areaOffice: r.areaOffice, sector: r.sector,
    custodian: r.custodian, trustees: r.trustees || [], members: r.members || 0, contributions: r.contributions || 0,
    bank: r.bank || null, bylaws: r.bylaws || 'On file at SEKAT', status: r.status || 'Approved', cap15: r.cap15 || 'Compliant',
    returns: a ? { income: a.income, expenses: a.expenses, surplus: (a.income || 0) - (a.expenses || 0), balanceSheet: a.balanceSheet, disposalOfSurplus: a.disposalOfSurplus, trialBalance: a.trialBalance, personalLedgerBalances: a.personalLedgerBalances, comparativeAnalysis: a.comparativeAnalysis || [], notes: a.additionalInformation || '', filedBy: 'SEKAT', filedAt: now, examinedBy: a.examinedBy, approvedBy: a.approvedBy, signature: a.signature } : null,
    createdBy: 'sekat@system', createdAt: r.createdAt || now, updatedAt: now, syncedAt: now,
  }
}
async function getIntegration(name) { return (await kvGet('integration:' + (name || 'sekat'))) || { lastSync: null, count: 0 } }
async function fetchLiveRecords(endpoint) {
  try { const r = await fetch(endpoint); if (!r.ok) return null; const d = await r.json(); return (d && Array.isArray(d.data) && d.data.length) ? d.data : null } catch (e) { return null }
}
async function syncFromSekat(ctx, silent) {
  const live = await fetchLiveRecords('/api/sekat-sync')
  if (!live && !DEMO_DATA) return 0 // live database: never ingest the sample feed
  const feed = live || SEKAT_FEED
  let n = 0
  for (const r of feed) {
    const rec = sekatToCoop(r); await kvSet('coop:' + rec.trackingId, rec)
    if (!silent) await addAudit({ trackingId: rec.trackingId, action: 'Synced from SEKAT', by: ctx.name || 'SEKAT gateway', role: 'officer', note: 'One-way ingest' })
    n++
  }
  await kvSet('integration:sekat', { lastSync: new Date().toISOString(), count: n, source: live ? 'SEKAT live API' : 'SEKAT sample feed', live: Boolean(live) })
  return n
}

/* ------------------------------ icons --------------------------------- */
function RoleIcon({ name }) {
  const p = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.6, strokeLinecap: 'round', strokeLinejoin: 'round' }
  const paths = {
    society: <path {...p} d="M4 20h16M6 20V9l6-4 6 4v11M10 20v-5h4v5" />,
    member: <><circle {...p} cx="12" cy="8" r="3.2" /><path {...p} d="M5 20c0-3.5 3-6 7-6s7 2.5 7 6" /></>,
    officer: <><path {...p} d="M12 3l7 3v5c0 4.5-3 8-7 10-4-2-7-5.5-7-10V6z" /><path {...p} d="M9 12l2 2 4-4" /></>,
    auditor: <><rect {...p} x="5" y="3" width="10" height="14" rx="1.5" /><path {...p} d="M8 7h4M8 10h4" /><circle {...p} cx="16" cy="16" r="3" /><path {...p} d="M18.4 18.4L21 21" /></>,
    partner: <path {...p} d="M3 9l9-5 9 5M5 9v8m14-8v8M9 9v8m6-8v8M3 20h18" />,
    boi: <><path {...p} d="M3 20h18M5 20v-9l5 3v-3l5 3v-3l4 2.5V20" /><path {...p} d="M8 8V4h3v2" /></>,
    vault: <><rect {...p} x="4" y="6" width="16" height="12" rx="2" /><circle {...p} cx="12" cy="12" r="3" /><path {...p} d="M12 9v-.5M12 15v.5M9 12h-.5M15 12h.5" /></>,
    accelerator: <><path {...p} d="M12 3c3 2 4.5 5 4.5 8.5L12 15l-4.5-3.5C7.5 8 9 5 12 3z" /><path {...p} d="M7.5 13l-2 4 3.2-1M16.5 13l2 4-3.2-1M12 9h.01" /></>,
    leadership: <path {...p} d="M4 20V4M4 20h16M8 20v-6m4 6V9m4 11v-8" />,
  }
  return <svg viewBox="0 0 24 24" width="26" height="26" aria-hidden="true">{paths[name] || paths.member}</svg>
}
function Avatar({ name, photo, size = 44 }) {
  if (photo) return <img className="avatar avatar-img" src={photo} alt="" style={{ width: size, height: size }} />
  return <span className="avatar" style={{ width: size, height: size, fontSize: size * 0.36 }}>{initials(name)}</span>
}
const StatusChip = ({ status, kind }) => <span className={cx('chip', (kind === 'cap15' ? CAP15_CLASS : kind === 'loan' ? LOAN_STATUS_CLASS : kind === 'ticket' ? TICKET_STATUS_CLASS : STATUS_CLASS)[status] || 'st-review')}>{status}</span>
const SourceBadge = ({ source }) => source ? <span className={cx('src-badge', source === 'SEKAT' ? 'src-sekat' : 'src-mccti')}>{source}</span> : null

/* --------------------------- live register ---------------------------- */
function LiveRegister({ areaId }) {
  const reduced = usePrefersReducedMotion()
  const label = (AREA_LENS.find((a) => a.id === areaId)?.label || '').toLowerCase().split('-')[0]
  const pool = areaId === 'state' ? REGISTER : REGISTER.filter((r) => r.office.toLowerCase().includes(label))
  const rows = pool.length ? pool : REGISTER
  const [start, setStart] = useState(0)
  useEffect(() => { if (reduced) return; const t = setInterval(() => setStart((s) => (s + 1) % rows.length), 3200); return () => clearInterval(t) }, [rows.length, reduced])
  const visible = Array.from({ length: Math.min(4, rows.length) }, (_, i) => rows[(start + i) % rows.length])
  return (
    <aside className="register" aria-label="Live cooperative register (illustrative)">
      <div className="register-frame">
        <div className="register-head"><img className="reg-seal" src="/lagos-seal.png" alt="" aria-hidden="true" /><div><p className="reg-title">Cooperative Register</p><p className="reg-sub">Directorate of Cooperative Services</p></div><span className="reg-live">Live</span></div>
        <div className="register-rows">
          {visible.map((r, i) => (
            <div className={cx('reg-row', i === 0 && 'is-new')} key={r.id + i}>
              <div className="reg-row-main"><span className="reg-name">{r.name}</span><span className="reg-office">{r.office} area office</span></div>
              <div className="reg-row-meta"><span className="reg-id">{r.id}</span><span className={'reg-status s-' + r.status.split(' ')[0].toLowerCase()}>{r.status}</span></div>
            </div>
          ))}
        </div>
        <div className="register-foot"><span>Instructions rotate as societies register</span><span className="reg-stamp">Teaser view</span></div>
      </div>
    </aside>
  )
}

/* ----------------------------- landing -------------------------------- */
/* ---------------------- interactive building blocks ------------------- */
function useInView(threshold = 0.15) {
  const ref = useRef(null), [inView, setInView] = useState(false)
  useEffect(() => {
    const el = ref.current; if (!el) return
    const ob = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setInView(true); ob.disconnect() } }, { threshold })
    ob.observe(el); return () => ob.disconnect()
  }, [threshold])
  return [ref, inView]
}
function Reveal({ children, className = '', delay = 0, tag: Tag = 'div' }) {
  const [ref, inView] = useInView()
  return <Tag ref={ref} className={cx('reveal', inView && 'in', className)} style={delay ? { transitionDelay: delay + 'ms' } : undefined}>{children}</Tag>
}
function CountUp({ end, suffix = '', dur = 1500 }) {
  const [ref, inView] = useInView(0.4), [val, setVal] = useState(0)
  useEffect(() => {
    if (!inView) return; let raf; const t0 = performance.now()
    const tick = (t) => { const p = Math.min(1, (t - t0) / dur); const e = 1 - Math.pow(1 - p, 3); setVal(Math.round(end * e)); if (p < 1) raf = requestAnimationFrame(tick) }
    raf = requestAnimationFrame(tick); return () => cancelAnimationFrame(raf)
  }, [inView, end, dur])
  return <span ref={ref}>{val.toLocaleString('en-NG')}{suffix}</span>
}
function Accordion({ items }) {
  const [open, setOpen] = useState(0)
  return (
    <div className="acc">{items.map((it, i) => (
      <div className={cx('acc-item', open === i && 'open')} key={i}>
        <button className="acc-head" onClick={() => setOpen(open === i ? -1 : i)} aria-expanded={open === i}><span>{it.q}</span><span className="acc-ic" aria-hidden="true" /></button>
        <div className="acc-panel"><div className="acc-inner">{it.a}</div></div>
      </div>))}</div>
  )
}
const LEADERS_PRINCIPAL = [
  { img: '/leader-gov.jpg', initials: 'BS', name: 'Mr Babajide Sanwo-Olu', role: 'Executive Governor', body: 'Governor of Lagos State, championing the cooperative economy and the \u20A610 billion LASMECO financing initiative for MSME growth and inclusion.' },
  { img: '/leader-deputy.jpg', initials: 'OH', name: 'Dr Obafemi Hamzat', role: 'Deputy Governor', body: 'Deputy Governor of Lagos State, supporting the administration\u2019s economic empowerment and grassroots development agenda.' },
]
const LEADERS_MINISTRY = [
  { img: '/leader-hc.jpg', initials: 'FA', name: 'Mrs Folashade Ambrose-Medebem', role: 'Honourable Commissioner', body: 'Leads the Ministry of Commerce, Cooperatives, Trade and Investment, driving cooperative development, MSME growth and investment across Lagos State.' },
  { img: '/leader-ps.jpg', initials: 'BO', name: 'Mr Babatunde Onigbanjo', role: 'Permanent Secretary', body: 'Oversees the administration of the Ministry and the delivery of its cooperative, trade and investment mandate across the area offices.' },
  { img: '/leader-dir.jpg', initials: 'AA', name: 'Dr Adeyinka Adeyemi', role: 'Director of Cooperatives', body: 'Heads the Directorate of Cooperative Services, responsible for the registration, supervision and audit of cooperative societies State-wide.' },
]
const ABOUT_ITEMS = [
  { q: 'The Ministry (MCCTI)', a: 'The Ministry of Commerce, Cooperatives, Trade and Investment formulates policy that stimulates business growth, cooperative development and investment in Lagos State. Through its Directorate of Cooperative Services it registers, supervises and audits cooperative societies across the State’s area offices.' },
  { q: 'LASMECO', a: 'The Lagos State Access to Finance for SMEs through Cooperatives programme provides single-digit (9%) loans of up to ₦10 million to cooperative-based MSMEs, without conventional collateral, delivered with the Bank of Industry and Sterling Bank through a layered guarantee structure and sector Accelerators.' },
  { q: 'SEKAT registry', a: 'SEKAT is the source of the legacy cooperative registry and audit records. In CoopEco, data flows one way from SEKAT into the platform, giving a single consolidated registry that officers and leadership can see.' },
  { q: 'QooP analytics', a: 'QooP is the source of member and MSME analytics. Its KYC and enterprise data flows one way into CoopEco to power member profiles and explainable, advisory credit scoring for LASMECO.' },
  { q: 'The platform (CoopEco)', a: 'MCCTI CoopEco unifies the registry, member analytics, LASMECO financing, wallets and governance intelligence into a single Ministry-owned platform, with role-aware workspaces and live oversight for leadership.' },
]
function LeaderPhoto({ l }) {
  const [err, setErr] = useState(false)
  return (l.img && !err)
    ? <img src={l.img} alt={l.name} loading="lazy" onError={() => setErr(true)} />
    : <span className="leader-mono">{l.initials}</span>
}
function LeaderCard({ l, i }) {
  return (
    <Reveal className="leader-card" delay={i * 80} tag="article">
      <div className="leader-photo"><LeaderPhoto l={l} /><span className="leader-ring" aria-hidden="true" /></div>
      <div className="leader-body"><span className="leader-role">{l.role}</span><h3>{l.name}</h3><p>{l.body}</p></div>
    </Reveal>
  )
}
const PRICING = [
  { name: 'Cooperative registration', price: '\u20A650,000', unit: 'one-time', who: 'Cooperative societies', body: 'Join the platform and receive a tracking ID and a digital registry record.' },
  { name: 'Annual returns filing', price: '\u20A615,000', unit: 'per year', who: 'Cooperative societies', body: 'File statutory annual financial returns for CAP15 supervision.' },
  { name: 'CAP15 regulatory processing', price: '2.5%', unit: 'of surplus', who: 'Cooperative societies', body: 'Regulatory processing tied to declared operating surplus.' },
  { name: 'LASMECO disbursement portal', price: '2.5%', unit: 'of disbursed funds', who: 'Financing pool', body: 'Portal and processing fee on loans disbursed through the platform.' },
  { name: 'Directory & verification search', price: '\u20A62,000', unit: 'per lookup', who: 'Businesses & partners', body: 'Verify a cooperative\u2019s status and standing on demand.' },
  { name: 'Digital wallet & payments', price: '1%', unit: 'per transaction', who: 'Members & societies', body: 'Wallet funding, savings and esusu movements via connected payment rails.' },
  { name: 'Analytics & data subscriptions', price: 'Custom', unit: 'per agency', who: 'Agencies & partners', body: 'Aggregated, consented analytics on the cooperative economy.' },
  { name: 'Accelerator & partner onboarding', price: 'Programme fee', unit: 'success-based', who: 'Accelerators & partners', body: 'Onboarding and success-based fees for programme partners.' },
]
const LANGS = [['en', 'English'], ['yo', 'Yor\u00f9b\u00e1'], ['ig', 'Igbo'], ['ha', 'Hausa'], ['pcm', 'Naij\u00e1']]
const I18N = {
  'nav.home': { en: 'Home', yo: 'Il\u00e9', ig: '\u1ee4l\u1ecd', ha: 'Gida', pcm: 'Home' },
  'nav.modules': { en: 'Modules' },
  'nav.pricing': { en: 'Pricing', yo: 'Iye ow\u00f3', ig: '\u1ecc\u1e45\u1ee5 ah\u1ecba', ha: 'Fara\u0161i', pcm: 'Price' },
  'nav.leadership': { en: 'Leadership', yo: 'A\u1e63\u00e1\u00e1j\u00fa', ig: 'Nd\u00fa', ha: 'Shugabanci', pcm: 'Leadership' },
  'nav.about': { en: 'About', yo: 'N\u00edpa wa', ig: 'Banyere any\u1ecb', ha: 'Game da mu', pcm: 'About us' },
  'nav.platform': { en: 'Platform' },
  'nav.verify': { en: 'Verify a co-op', yo: '\u1e62\u00e0y\u1eb9\u0300w\u00f2 \u1eb9gb\u1eb9\u0301', ig: 'Nyochaa \u00f2t\u00f9', ha: 'Tabbatar da \u0199ungiya', pcm: 'Check co-op' },
  'cta.enter': { en: 'Enter platform', yo: 'W\u1ecd in\u00fa', ig: 'Banye', ha: 'Shiga', pcm: 'Enter' },
  'hero.h1': { en: 'One State. One cooperative economy. One system.', yo: '\u00ccp\u00ednl\u1eb9\u0300 kan. \u1eccr\u1ecd\u0300-aj\u00e9 \u00e0j\u1ecd kan. \u00c8t\u00f2 kan.', ig: 'Otu Steeti. Otu ak\u1ee5\u0300 na \u1ee5ba \u00f2t\u00f9. Otu usoro.', ha: 'Jiha \u0257aya. Tattalin arziki \u0257aya. Tsari \u0257aya.', pcm: 'One State. One cooperative economy. One system.' },
  'hero.cta': { en: 'Which best describes you?', yo: '\u00c8wo l\u00f3 b\u00e1 \u1ecd mu?', ig: 'Kedu nke kacha k\u1ecdwaa g\u1ecb?', ha: 'Wanne ya fi bayyana ka?', pcm: 'Which one be you?' },
  'hero.ghost': { en: 'See the modules', yo: 'Wo \u00e0w\u1ecdn m\u00f3d\u00f9', ig: 'Lee modul', ha: 'Duba kayan aiki', pcm: 'See di modules' },
}
function t(key, lang) { const e = I18N[key]; if (!e) return key; return e[lang] || e.en || key }
function Landing({ area, setArea, onEnter, lang = 'en', tab = 'home', onTab }) {
  const current = AREA_LENS.find((a) => a.id === area) || AREA_LENS[0]
  useEffect(() => { if (typeof window !== 'undefined') window.scrollTo({ top: 0 }) }, [tab])
  return (
    <main id="top" className={cx(tab !== 'home' && 'landing-sub')}>
      {tab === 'home' && (<>
        <section className="hero">
          <img className="hero-watermark" src="/seal-watermark.png" alt="" aria-hidden="true" />
          <div className="hero-copy">
            <p className="eyebrow"><span className="eb-dot" />Lagos State &middot; A core economic governance reform</p>
            <h1>{lang === 'en' ? <>One State.<br />One cooperative economy.<br /><span className="underline">One system.</span></> : t('hero.h1', lang)}</h1>
            <p className="lead">13,000 registered cooperatives and 150,000+ members sit across two separate systems and a credit programme that cannot see them. MCCTI CoopEco consolidates the registry, member analytics, LASMECO financing, wallets and governance intelligence into a single, Ministry-owned platform.</p>
            <div className="hero-cta"><button className="btn btn-gold" onClick={onEnter}>{t('hero.cta', lang)}</button><button className="btn btn-ghost" onClick={() => onTab && onTab('modules')}>{t('hero.ghost', lang)}</button></div>
            {lang !== 'en' && <p className="lang-note">Translations are provisional and pending review by the Ministry’s language team. Detailed content remains in English for now.</p>}
            <p className="hero-foot">Ministry-owned &middot; SPV-operated &middot; built for the cooperative economy</p>
          </div>
          <LiveRegister areaId={area} />
        </section>
        <section className="band" aria-label="Headline figures">
          {[[13000, '', 'Registered cooperatives'], [150000, '+', 'MSME members'], [97, '%', 'MSMEs currently informal'], [21, '', 'Cooperative area offices']].map(([n, suf, l]) => (<div className="band-item" key={l}><span className="band-fig"><CountUp end={n} suffix={suf} /></span><span className="band-lab">{l}</span></div>))}
        </section>
        <section className="lens" id="lens">
          <div className="section-head"><p className="eyebrow">Area office lens</p><h2>See the cooperative economy, office by office</h2><p className="section-sub">Switch between a State-wide view and any of the 21 cooperative area offices. The underserved Ikorodu, Epe, Badagry and Ibeju-Lekki corridors are where formalisation has furthest to travel.</p></div>
          <div className="lens-tabs" role="tablist" aria-label="Area office">{AREA_LENS.map((a) => (<button key={a.id} role="tab" aria-selected={area === a.id} className={cx('lens-tab', area === a.id && 'is-on', a.corridor && 'is-corridor')} onClick={() => setArea(a.id)}>{a.label}</button>))}</div>
          <div className="lens-readout">
            <div className="lens-tag">{current.corridor && <span className="corridor-flag">Priority corridor</span>}<span className="lens-tag-text">{current.label} &middot; {current.tag}</span></div>
            <div className="lens-figs"><div><span className="lf-fig">{current.coops}</span><span className="lf-lab">Cooperatives</span></div><div><span className="lf-fig">{current.members}</span><span className="lf-lab">Members</span></div><div><span className="lf-fig">{current.active}</span><span className="lf-lab">Digitally active</span></div></div>
          </div>
        </section>
        <section className="explore">
          <div className="section-head"><p className="eyebrow">Explore</p><h2>Take a closer look</h2></div>
          <div className="explore-grid">{[['modules', 'Modules', 'The six modules the cooperative economy runs on'], ['platform', 'Platform', 'How the platform changes the arithmetic'], ['leadership', 'Leadership', 'The stewards behind MCCTI CoopEco'], ['about', 'About', 'The institutions and programmes behind it']].map(([id, title, desc]) => (<button className="explore-card" key={id} onClick={() => onTab && onTab(id)}><span className="explore-title">{title}</span><span className="explore-desc">{desc}</span><span className="explore-arrow" aria-hidden="true">&rarr;</span></button>))}</div>
        </section>
        <section className="quote"><img className="quote-seal" src="/lagos-seal.png" alt="" aria-hidden="true" /><blockquote><p>&ldquo;This engagement marks a fundamental reset of the cooperative digitalisation agenda in Lagos State: one registry, one member record, one governance framework, owned by the Ministry.&rdquo;</p><cite>Directorate of Cooperative Services, MCCTI</cite></blockquote></section>
      </>)}
      {tab === 'modules' && (<section className="modules page" id="modules">
        <div className="section-head"><p className="eyebrow">Six modules, one platform</p><h2>Everything the cooperative economy runs on</h2></div>
        <div className="mod-grid">{MODULES.map((m) => (<article className="mod-card" key={m.n}><div className="mod-top"><span className="mod-n">{m.n}</span><span className="mod-lens">{m.lens}</span></div><h3>{m.title}</h3><p>{m.body}</p>{m.ai && <span className="mod-ai">Summarised by MCCTI CoopEco</span>}</article>))}</div>
        <div className="section-head" style={{ marginTop: '48px' }}><p className="eyebrow">Role-aware from the first screen</p><h2>Built for everyone who touches a cooperative</h2></div>
        <div className="persona-grid">{PERSONAS.map(([tt, d]) => (<div className="persona" key={tt}><span className="persona-t">{tt}</span><span className="persona-d">{d}</span></div>))}</div>
      </section>)}
      {tab === 'platform' && (<section className="arc page" id="arc">
        <div className="section-head"><p className="eyebrow">From fragmentation to one system</p><h2>How the platform changes the arithmetic</h2></div>
        <div className="arc-steps">
          <div className="arc-step"><span className="arc-n">01</span><h4>The problem: fragmentation</h4><p>The registry, the analytics layer and LASMECO operate in isolation. Data is duplicated, revenue is uncollected, fraud goes undetected, and Government cannot see its own economy.</p></div>
          <div className="arc-arrow" aria-hidden="true">&rarr;</div>
          <div className="arc-step"><span className="arc-n">02</span><h4>The solution: one unified platform</h4><p>Registry, KYC, analytics, wallets, disbursement and dashboards in a single Ministry-owned system. KYC at onboarding, timestamped trails, escrow flows, finance as the reward for compliance.</p></div>
          <div className="arc-arrow" aria-hidden="true">&rarr;</div>
          <div className="arc-step"><span className="arc-n">03</span><h4>The return: oversight and inclusion</h4><p>One register, one member record and one governance framework, at zero capital cost to the State, with full ownership retained by the Ministry. Cooperatives gain visibility, members gain access to finance, and Government gains a live view of the cooperative economy.</p></div>
        </div>
      </section>)}
      {tab === 'leadership' && (<section className="leaders page" id="leadership">
        <div className="section-head"><p className="eyebrow"><span className="eb-dot" />Leadership</p><h2>Stewards of the cooperative economy</h2><p className="section-sub">The State and Ministry leadership provide the policy direction, oversight and governance behind MCCTI CoopEco.</p></div>
        <p className="leader-group-lab">Executive leadership</p>
        <div className="leader-grid two">{LEADERS_PRINCIPAL.map((l, i) => <LeaderCard l={l} i={i} key={l.name} />)}</div>
        <p className="leader-group-lab">Ministry leadership</p>
        <div className="leader-grid">{LEADERS_MINISTRY.map((l, i) => <LeaderCard l={l} i={i} key={l.name} />)}</div>
      </section>)}
      {tab === 'about' && (<section className="about page" id="about">
        <div className="section-head"><p className="eyebrow"><span className="eb-dot" />About</p><h2>What sits behind the platform</h2><p className="section-sub">The institutions and programmes that MCCTI CoopEco brings together.</p></div>
        <Accordion items={ABOUT_ITEMS} />
      </section>)}
    </main>
  )
}

/* ---------------------------- role + auth ----------------------------- */
function RolePage({ onPick, onBack }) {
  return (
    <main className="flow"><div className="flow-inner">
      <button className="flow-back" onClick={onBack}>&larr; Back</button>
      <p className="eyebrow"><span className="eb-dot" />Enter the platform</p>
      <h1 className="flow-title">Which best describes you?</h1>
      <p className="flow-sub">Choose your role. The platform tailors every screen, and your pricing, to how you use it.</p>
      <div className="role-page-grid">{ROLES.map((r) => (<button className="role-page-card" key={r.id} onClick={() => onPick(r.id)}><span className="role-ico"><RoleIcon name={r.icon} /></span><span className="role-title">{r.title}</span><span className="role-desc">{r.desc}</span><span className="role-go">Continue &rarr;</span></button>))}</div>
    </div></main>
  )
}
function AuthPage({ role, onDone, onBack, onPrivacy }) {
  const [mode, setMode] = useState('create'), [email, setEmail] = useState(''), [password, setPassword] = useState(''), [name, setName] = useState('')
  const [busy, setBusy] = useState(false), [err, setErr] = useState(''), [pending, setPending] = useState(false), [agree, setAgree] = useState(false)
  const submit = async () => {
    setErr(''); 
    if (mode === 'create' && !agree) { setErr('Please consent to the processing of your data to continue.'); return }
    setBusy(true)
    try { if (!email || !password) throw new Error('Enter your email and a password.'); const res = mode === 'create' ? await signUp(email, password, role, name) : await signIn(email, password, role); if (res.pending) { setPending(true); setBusy(false); return } onDone(res) }
    catch (e) { setErr(e.message || 'Something went wrong.') } setBusy(false)
  }
  if (pending) return (<main className="flow"><div className="flow-inner narrow"><p className="eyebrow"><span className="eb-dot" />Confirm your email</p><h1 className="flow-title">Almost there</h1><p className="flow-sub">We have sent a confirmation link to {email}. Open it to activate your account, then sign in.</p><button className="btn btn-gold" onClick={() => { setPending(false); setMode('signin') }}>Back to sign in</button></div></main>)
  return (
    <main className="flow"><div className="flow-inner narrow">
      <button className="flow-back" onClick={onBack}>&larr; Change role</button>
      <p className="eyebrow"><span className="eb-dot" />{roleTitle(role)}</p>
      <h1 className="flow-title">{mode === 'create' ? 'Create your account' : 'Sign in'}</h1>
      <p className="flow-sub">{mode === 'create' ? 'Your role is saved to your account and shapes your dashboard.' : 'Welcome back to MCCTI CoopEco.'}</p>
      {!hasSupabase && <div className="demo-chip">Demo mode &middot; accounts are stored in this browser. Add Supabase keys to go live.</div>}
      <div className="auth-form">
        {mode === 'create' && <label className="field"><span>Full name</span><input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Adaeze Okonkwo" /></label>}
        <label className="field"><span>Email</span><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" /></label>
        <label className="field"><span>Password</span><input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 6 characters" onKeyDown={(e) => e.key === 'Enter' && submit()} /></label>
        {err && <p className="auth-err">{err}</p>}
        {mode === 'signin' && <button type="button" className="auth-forgot" onClick={async () => {
          if (!email) { setErr('Enter your email above, then tap reset.'); return }
          if (!hasSupabase) { toast('Password reset works once the platform is connected to Supabase. In demo mode, accounts live only in this browser.'); return }
          setBusy(true)
          try { const { error } = await supa.auth.resetPasswordForEmail(email, { redirectTo: (typeof window !== 'undefined' ? window.location.origin : undefined) }); if (error) throw new Error(error.message); toast('If that email has an account, a reset link is on its way.') } catch (e) { setErr(e.message || 'Could not send the reset email.') }
          setBusy(false)
        }}>Forgot password?</button>}
        {mode === 'create' && <label className="consent-check"><input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} /><span>I consent to the processing of my data for cooperative administration, as described in the <button type="button" className="link-inline" onClick={onPrivacy}>Privacy notice</button>.</span></label>}
        <button className="btn btn-gold auth-submit" onClick={submit} disabled={busy}>{busy ? 'Please wait…' : (mode === 'create' ? 'Create account' : 'Sign in')}</button>
        <p className="auth-toggle">{mode === 'create' ? 'Already have an account?' : 'New to the platform?'}{' '}<button onClick={() => { setErr(''); setMode(mode === 'create' ? 'signin' : 'create') }}>{mode === 'create' ? 'Sign in' : 'Create one'}</button></p>
      </div>
    </div></main>
  )
}

/* --------------------------- Stage 3: forms --------------------------- */
function RegistrationForm({ ctx, onDone, onCancel }) {
  const [f, setF] = useState({ name: '', areaOffice: AREA_OFFICES[1], sector: SECTORS[0], custodian: '', trustees: '', bylaws: '', members: '', contributions: '' })
  const [busy, setBusy] = useState(false), [err, setErr] = useState(''), [done, setDone] = useState(null)
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value })
  const submit = async () => {
    setErr('')
    if (!f.name.trim() || !f.custodian.trim()) { setErr('Society name and custodian are required.'); return }
    setBusy(true)
    try {
      const rec = await createCoop({ name: f.name.trim(), areaOffice: f.areaOffice, sector: f.sector, custodian: f.custodian.trim(), trustees: f.trustees.split(',').map((s) => s.trim()).filter(Boolean), bylaws: f.bylaws.trim(), members: Number(f.members) || 0, contributions: Number(f.contributions) || 0 }, ctx)
      setDone(rec)
    } catch (e) { setErr(e.message || 'Could not file the registration.') } setBusy(false)
  }
  if (done) return (
    <div className="panel success-panel">
      <span className="success-mark">&#9670;</span>
      <h3>Registration filed</h3>
      <p>{done.name} has been submitted for review at the {done.areaOffice} area office.</p>
      <div className="tracking"><span>Tracking ID</span><strong>{done.trackingId}</strong></div>
      <p className="panel-note">A cooperative officer will examine and approve the registration. Every step is recorded on the audit trail.</p>
      <button className="btn btn-gold" onClick={() => onDone(done)}>Go to my cooperative</button>
    </div>
  )
  return (
    <div className="panel">
      <div className="panel-head"><h3>Register a cooperative society</h3><button className="link-back" onClick={onCancel}>Cancel</button></div>
      <div className="form-grid">
        <label className="field span2"><span>Society name</span><input value={f.name} onChange={set('name')} placeholder="e.g. Ikeja Traders Multipurpose Coop" /></label>
        <label className="field"><span>Area office</span><select value={f.areaOffice} onChange={set('areaOffice')}>{AREA_OFFICES.map((a) => <option key={a}>{a}</option>)}</select></label>
        <label className="field"><span>Cooperative sector</span><select value={f.sector} onChange={set('sector')}>{SECTORS.map((s) => <option key={s}>{s}</option>)}</select></label>
        <label className="field"><span>Custodian / secretary</span><input value={f.custodian} onChange={set('custodian')} placeholder="Full name" /></label>
        <label className="field"><span>Trustees (comma separated)</span><input value={f.trustees} onChange={set('trustees')} placeholder="Name one, Name two" /></label>
        <label className="field"><span>Registered members</span><input type="number" value={f.members} onChange={set('members')} placeholder="0" /></label>
        <label className="field"><span>Total contributions (₦)</span><input type="number" value={f.contributions} onChange={set('contributions')} placeholder="0" /></label>
        <label className="field span2"><span>By-laws summary</span><textarea value={f.bylaws} onChange={set('bylaws')} placeholder="Objectives, governance structure, meeting cycle, admission and exit rules." rows={4} /></label>
      </div>
      {err && <p className="auth-err">{err}</p>}
      <div className="panel-actions"><button className="btn btn-gold" onClick={submit} disabled={busy}>{busy ? 'Filing…' : 'File registration'}</button></div>
      <p className="panel-note">Compliance: registration is filed under the Lagos CAP15 Cooperative Law. Approval requires officer sign-off. This is not legal advice.</p>
    </div>
  )
}
function ReturnsForm({ coop, ctx, onDone, onCancel }) {
  const [f, setF] = useState({ income: '', expenses: '', balanceSheet: '', disposalOfSurplus: '', notes: '' })
  const [busy, setBusy] = useState(false), [err, setErr] = useState('')
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value })
  const surplus = (Number(f.income) || 0) - (Number(f.expenses) || 0)
  const submit = async () => {
    setErr(''); setBusy(true)
    try { await fileReturns(coop.trackingId, { income: Number(f.income) || 0, expenses: Number(f.expenses) || 0, surplus, balanceSheet: Number(f.balanceSheet) || 0, disposalOfSurplus: Number(f.disposalOfSurplus) || 0, notes: f.notes.trim() }, ctx); onDone() }
    catch (e) { setErr(e.message || 'Could not file returns.') } setBusy(false)
  }
  return (
    <div className="panel">
      <div className="panel-head"><h3>File annual returns</h3><button className="link-back" onClick={onCancel}>Cancel</button></div>
      <p className="panel-sub">{coop.name} &middot; {coop.trackingId}</p>
      <div className="form-grid">
        <label className="field"><span>Total income (₦)</span><input type="number" value={f.income} onChange={set('income')} placeholder="0" /></label>
        <label className="field"><span>Total expenses (₦)</span><input type="number" value={f.expenses} onChange={set('expenses')} placeholder="0" /></label>
        <label className="field"><span>Balance sheet total (₦)</span><input type="number" value={f.balanceSheet} onChange={set('balanceSheet')} placeholder="0" /></label>
        <label className="field"><span>Disposal of surplus (₦)</span><input type="number" value={f.disposalOfSurplus} onChange={set('disposalOfSurplus')} placeholder="0" /></label>
        <div className="field span2 computed"><span>Surplus / (deficit), computed</span><strong className={surplus < 0 ? 'neg' : ''}>{fmtNaira(surplus)}</strong></div>
        <label className="field span2"><span>Additional information</span><textarea value={f.notes} onChange={set('notes')} rows={3} placeholder="Trial balance notes, disclosures, any qualifications." /></label>
      </div>
      {err && <p className="auth-err">{err}</p>}
      <div className="panel-actions"><button className="btn btn-gold" onClick={submit} disabled={busy}>{busy ? 'Filing…' : 'Submit returns for audit'}</button></div>
      <p className="panel-note">Annual returns filing fee: {fmtNaira(COOP_FEES.annualReturns)} per year. CAP15 regulatory processing at 2.5% of surplus applies. This is not legal advice.</p>
    </div>
  )
}

/* --------------------------- Stage 3: detail -------------------------- */
function AuditTrail({ trackingId, refreshKey }) {
  const [items, setItems] = useState(null)
  useEffect(() => { let live = true; listAudit(trackingId).then((r) => live && setItems(r)); return () => { live = false } }, [trackingId, refreshKey])
  if (!items) return <p className="muted-line">Loading trail…</p>
  if (!items.length) return <p className="muted-line">No entries yet.</p>
  return (
    <ul className="timeline">
      {items.map((a, i) => (
        <li key={i} className="tl-item"><span className="tl-dot" /><div className="tl-body"><div className="tl-top"><span className="tl-action">{a.action}</span><span className="tl-time">{fmtDate(a.at)}</span></div><span className="tl-by">{a.by} &middot; {roleTitle(a.role)}</span>{a.note && <span className="tl-note">&ldquo;{a.note}&rdquo;</span>}</div></li>
      ))}
    </ul>
  )
}
function CoopLasmecoApproval({ coop, ctx, onChanged }) {
  const [docs, setDocs] = useState([]), [loans, setLoans] = useState([]), [busy, setBusy] = useState(false), [ov, setOv] = useState({ amount: '', reason: '' }), [showOv, setShowOv] = useState(false)
  const reload = useCallback(() => { listDocs('coopaudit:' + coop.trackingId).then(setDocs); listLoans().then(setLoans) }, [coop.trackingId])
  useEffect(() => { reload() }, [reload])
  const ro = isReviewer(ctx)
  const canDecide = !ro && ctx.role === 'leadership'
  const audit = docs.find((d) => d.category === COOP_AUDIT_DOC)
  const audited = coopAuditApproved(coop, docs)
  const aged = coopCanIssueGuarantee(coop)
  const room = coopGuaranteeRoom(coop, loans)
  const approveAudit = async () => { setBusy(true); await setDocVerified('coopaudit:' + coop.trackingId, audit.id, true, ctx); setBusy(false); reload(); toast('Audit approved. This cooperative\u2019s members can now apply (once other checks pass).', 'success') }
  const confirmAge = async () => { setBusy(true); const next = await updateCoop(coop.trackingId, { established12: true, establishedConfirmed: true, establishedDate: coop.establishedDate || new Date(Date.now() - 400 * 864e5).toISOString() }, ctx, 'Established 1+ year confirmed by MCCTI'); setBusy(false); onChanged && onChanged(next); toast('Confirmed. Cooperative may issue 25% guarantees.') }
  const applyOverride = async () => {
    const n = Number(ov.amount)
    if (!n || !ov.reason.trim()) { toast('Enter an override amount and a reason.', 'error'); return }
    setBusy(true); const next = await updateCoop(coop.trackingId, { guaranteeOverride: n }, ctx, 'Guarantee ceiling override: ' + fmtNaira(n) + ' \u2014 ' + ov.reason.trim()); setBusy(false); setShowOv(false); setOv({ amount: '', reason: '' }); onChanged && onChanged(next); toast('Override applied and logged.')
  }
  return (
    <div className="returns-box"><h4>LASMECO lending readiness (MCCTI)</h4>
      <div className="kyc-check">
        <div className={cx('kyc-item', coop.status === 'Approved' && 'ok')}><span className="kyc-mark">{coop.status === 'Approved' ? '\u2713' : '\u25cb'}</span><span className="kyc-label">Cooperative admitted / approved</span></div>
        <div className={cx('kyc-item', audited && 'ok')}><span className="kyc-mark">{audited ? '\u2713' : '\u25cb'}</span><span className="kyc-label">Independent audit {audit ? (audited ? 'approved' : 'uploaded \u2014 awaiting your approval') : 'not uploaded'}</span></div>
        <div className={cx('kyc-item', aged && 'ok')}><span className="kyc-mark">{aged ? '\u2713' : '\u25cb'}</span><span className="kyc-label">In existence 1+ year {coop.establishedClaim && !coop.establishedConfirmed ? '\u2014 claimed, awaiting your confirmation' : ''}</span></div>
      </div>
      {canDecide && <div className="panel-actions">
        {audit && !audited && <button className="btn btn-gold btn-sm" disabled={busy} onClick={approveAudit}>Approve audit</button>}
        {!aged && <button className="btn btn-outline btn-sm" disabled={busy} onClick={confirmAge}>Confirm 1+ year in existence</button>}
      </div>}
      <div className="statgrid" style={{ marginTop: '12px' }}>
        <div className="stat"><span className="stat-fig">{fmtNaira(room.pool)}</span><span className="stat-lab">Contributions pool</span></div>
        <div className="stat"><span className="stat-fig">{fmtNaira(room.used)}</span><span className="stat-lab">Guarantees committed</span></div>
        <div className="stat"><span className="stat-fig" style={{ color: 'var(--green)' }}>{fmtNaira(room.available)}</span><span className="stat-lab">Available{room.override ? ' (incl. override ' + fmtNaira(room.override) + ')' : ''}</span></div>
      </div>
      {canDecide && <div className="panel-actions"><button className="link-inline" onClick={() => setShowOv(!showOv)}>{showOv ? 'Cancel override' : 'Override guarantee ceiling'}</button></div>}
      {canDecide && showOv && <div className="returns-box"><p className="chart-note">Use sparingly. An override raises this cooperative’s guarantee ceiling and is logged on the audit trail.</p><div className="form-grid"><label className="field"><span>Additional ceiling (₦)</span><input type="number" value={ov.amount} onChange={(e) => setOv({ ...ov, amount: e.target.value })} /></label><label className="field"><span>Reason</span><input value={ov.reason} onChange={(e) => setOv({ ...ov, reason: e.target.value })} placeholder="Basis for the exception" /></label></div><div className="panel-actions"><button className="btn btn-gold btn-sm" disabled={busy} onClick={applyOverride}>Apply override</button></div></div>}
      <div className="trail-box" style={{ marginTop: '12px' }}><h5 style={{ margin: '0 0 8px', fontSize: '13px' }}>Independent audit document</h5>{ro && !DEMO_DATA ? <p className="panel-note">Hidden in review access (NDPR).</p> : <DocumentsPanel coopId={'coopaudit:' + coop.trackingId} ctx={ctx} canVerify={canDecide} canUpload={false} categories={[COOP_AUDIT_DOC]} onChange={reload} />}</div>
    </div>
  )
}
function CoopDetail({ coop, ctx, onClose, onChanged }) {
  const [note, setNote] = useState(''), [busy, setBusy] = useState(false), [c, setC] = useState(coop), [rk, setRk] = useState(0)
  const canExamine = ctx.role === 'officer' || ctx.role === 'leadership'
  const canDecide = ctx.role === 'leadership'
  const canAudit = ctx.role === 'auditor' || ctx.role === 'officer'
  const act = async (patch, action, needNote) => {
    if (needNote && !note.trim()) { toast('Add a note explaining the decision.'); return }
    setBusy(true); const next = await updateCoop(c.trackingId, patch, ctx, action, note.trim()); setC(next); setNote(''); setRk((k) => k + 1); setBusy(false); onChanged && onChanged()
  }
  const examineReturns = async () => { setBusy(true); const next = await updateCoop(c.trackingId, { cap15: 'Compliant' }, ctx, 'Returns examined and signed off', note.trim()); setC(next); setNote(''); setRk((k) => k + 1); setBusy(false); onChanged && onChanged() }
  return (
    <div className="detail">
      <div className="detail-head">
        <div><h3>{c.name}</h3><p className="detail-sub">{c.trackingId}{c.regNo ? ' · Reg. ' + c.regNo : ''} &middot; {c.areaOffice} area office &middot; {c.sector}</p></div>
        <button className="link-back" onClick={onClose}>&larr; Back to list</button>
      </div>
      <div className="detail-chips"><StatusChip status={c.status} /><StatusChip status={c.cap15} kind="cap15" /><SourceBadge source={c.source} /></div>
      <div className="detail-grid">
        <div className="field-ro"><span>Custodian</span><strong>{c.custodian || '—'}</strong></div>
        <div className="field-ro"><span>Trustees</span><strong>{(c.trustees || []).join(', ') || '—'}</strong></div>
        <div className="field-ro"><span>Members</span><strong>{Number(c.members || 0).toLocaleString('en-NG')}</strong></div>
        <div className="field-ro"><span>Contributions</span><strong>{fmtNaira(c.contributions)}</strong></div>
        {c.bank && <div className="field-ro span2"><span>Bank information</span><strong>{c.bank.name}{c.bank.accountName ? ' · ' + c.bank.accountName : ''}{c.bank.accountNumber ? ' · ' + c.bank.accountNumber : ''}</strong></div>}
        <div className="field-ro span2"><span>By-laws</span><strong className="normal">{c.bylaws || 'Not supplied'}</strong></div>
      </div>

      {c.returns && (
        <div className="returns-box">
          <h4>Annual returns</h4>
          <div className="returns-grid">
            <div><span>Income</span><strong>{fmtNaira(c.returns.income)}</strong></div>
            <div><span>Expenses</span><strong>{fmtNaira(c.returns.expenses)}</strong></div>
            <div><span>Surplus</span><strong className={c.returns.surplus < 0 ? 'neg' : ''}>{fmtNaira(c.returns.surplus)}</strong></div>
            <div><span>Balance sheet</span><strong>{fmtNaira(c.returns.balanceSheet)}</strong></div>
            <div><span>Disposal of surplus</span><strong>{fmtNaira(c.returns.disposalOfSurplus)}</strong></div>
            {c.returns.trialBalance != null && <div><span>Trial balance</span><strong>{fmtNaira(c.returns.trialBalance)}</strong></div>}
            {c.returns.personalLedgerBalances != null && <div><span>Personal ledger balances</span><strong>{fmtNaira(c.returns.personalLedgerBalances)}</strong></div>}
          </div>
          {c.returns.comparativeAnalysis?.length ? (<div className="comp-analysis"><span className="ca-lab">Comparative analysis of operating surplus</span><div className="ca-rows">{c.returns.comparativeAnalysis.map((r) => (<span key={r.year} className="ca-row">{r.year}: <strong>{fmtNaira(r.surplus)}</strong></span>))}</div></div>) : null}
          {c.returns.notes && <p className="returns-notes">{c.returns.notes}</p>}
          <p className="muted-line">Filed by {c.returns.filedBy} on {fmtDate(c.returns.filedAt)}</p>
          {(c.returns.examinedBy || c.returns.approvedBy) && <p className="muted-line">Examined by {c.returns.examinedBy || '—'} &middot; Approved by {c.returns.approvedBy || '—'}{c.returns.signature ? ' · Signature ' + c.returns.signature : ''}</p>}
        </div>
      )}

      {c.source === 'SEKAT' && <div className="ro-note">This society is mirrored from SEKAT (read-only). Registration and audit changes are made in SEKAT and flow into MCCTI on the next sync. Data moves one way, SEKAT into MCCTI.</div>}

      {c.source !== 'SEKAT' && (canExamine || canDecide || canAudit) && c.status !== 'Approved' && (
        <div className="action-box">
          <label className="field"><span>Decision note (required to approve, reject or sign off)</span><textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} placeholder="Findings from the document review, conditions, or the reason for the decision." /></label>
          <div className="action-row">
            {canExamine && c.status === 'Filed' && <button className="btn btn-gold btn-sm" disabled={busy} onClick={() => act({ status: 'Under review' }, 'Begin examination')}>Begin examination</button>}
            {canDecide && (c.status === 'Filed' || c.status === 'Under review') && <button className="btn btn-gold btn-sm" disabled={busy} onClick={() => act({ status: 'Approved' }, 'Application approved by leadership', true)}>Approve &amp; sign off</button>}
            {canDecide && (c.status === 'Filed' || c.status === 'Under review' || c.status === 'Returned') && <button className="btn btn-outline btn-sm" disabled={busy} onClick={() => act({ status: 'Returned' }, 'Application rejected / returned by leadership', true)}>Reject / return</button>}
            {canAudit && c.returns && c.cap15 === 'Under audit' && <button className="btn btn-outline btn-sm" disabled={busy} onClick={examineReturns}>Examine returns &amp; sign off</button>}
          </div>
          {canExamine && !canDecide && <p className="panel-note">You can examine and record findings. Final approval or rejection of the application is made by MCCTI leadership after reviewing all documents.</p>}
        </div>
      )}

      <CoopTierPanel coop={c} ctx={ctx} onChanged={onChanged} />
      {(ctx.role === 'leadership' || ctx.role === 'officer' || isReviewer(ctx)) && <CoopLasmecoApproval coop={c} ctx={ctx} onChanged={(next) => { if (next) setC(next); setRk((k) => k + 1); onChanged && onChanged() }} />}
      {(ctx.role === 'leadership' || isReviewer(ctx)) && <div className="returns-box"><h4>Member guarantee requests</h4><CoopGuaranteeApprovals coop={c} ctx={ctx} /></div>}
      <div className="trail-box"><h4>Documents</h4>{isReviewer(ctx) && !DEMO_DATA ? <p className="panel-note">Documents are hidden in review access because this database holds real data (NDPR).</p> : <DocumentsPanel coopId={c.trackingId} ctx={ctx} canVerify={canExamine} canUpload={canExamine} />}</div>
      <div className="trail-box"><h4>Audit trail</h4><AuditTrail trackingId={c.trackingId} refreshKey={rk} /></div>
    </div>
  )
}

/* ------------------------ Stage 3: workspaces ------------------------- */
function StatCards({ coops }) {
  const total = coops.length
  const by = (s) => coops.filter((c) => c.status === s).length
  const cards = [['Total societies', total], ['Awaiting review', by('Filed')], ['Under review', by('Under review')], ['Approved', by('Approved')]]
  return <div className="statgrid">{cards.map(([l, v]) => (<div className="stat" key={l}><span className="stat-fig">{v}</span><span className="stat-lab">{l}</span></div>))}</div>
}
function useRegistry() {
  const [coops, setCoops] = useState(null)
  const reload = useCallback(() => listCoops().then(setCoops), [])
  useEffect(() => { reload() }, [reload])
  return [coops, reload]
}
function CoopTable({ coops, onOpen }) {
  const [q, setQ] = useState(''), [st, setSt] = useState('All'), [sel, setSel] = useState(() => new Set())
  if (!coops.length) return <p className="muted-line">No societies to show.</p>
  const statuses = ['All', ...Array.from(new Set(coops.map((c) => c.status).filter(Boolean)))]
  const filtered = coops.filter((c) => (st === 'All' || c.status === st) && (!q || [c.name, c.trackingId, c.areaOffice, c.sector].join(' ').toLowerCase().includes(q.toLowerCase())))
  const toggle = (id) => { const n = new Set(sel); n.has(id) ? n.delete(id) : n.add(id); setSel(n) }
  const allOn = filtered.length > 0 && filtered.every((c) => sel.has(c.trackingId))
  const toggleAll = () => { const n = new Set(sel); if (allOn) filtered.forEach((c) => n.delete(c.trackingId)); else filtered.forEach((c) => n.add(c.trackingId)); setSel(n) }
  const chosen = filtered.filter((c) => sel.has(c.trackingId))
  const exportCsv = () => downloadCSV('cooperatives.csv', chosen.map((c) => ({ society: c.name, trackingId: c.trackingId, areaOffice: c.areaOffice, sector: c.sector, status: c.status, cap15: c.cap15, members: c.members || 0, contributions: c.contributions || 0 })))
  return (
    <div>
      <div className="table-filter">
        <input className="table-search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search society, ID, area office or sector…" aria-label="Search cooperatives" />
        <select value={st} onChange={(e) => setSt(e.target.value)} aria-label="Filter by status">{statuses.map((s) => <option key={s}>{s}</option>)}</select>
        <span className="table-count">{filtered.length} of {coops.length}</span>
      </div>
      {sel.size > 0 && <div className="bulk-bar"><span>{sel.size} selected</span><button className="btn btn-outline btn-sm" onClick={exportCsv}>Export CSV</button><button className="link-inline" onClick={() => setSel(new Set())}>Clear</button></div>}
      {filtered.length ? <div className="rtable-wrap"><table className="rtable">
        <thead><tr><th className="th-check"><input type="checkbox" checked={allOn} onChange={toggleAll} aria-label="Select all" /></th><th>Society</th><th>Tracking ID</th><th>Area office</th><th>Sector</th><th>Status</th><th>CAP15</th><th></th></tr></thead>
        <tbody>{filtered.map((c) => (<tr key={c.trackingId} className={cx(sel.has(c.trackingId) && 'row-sel')}><td className="th-check"><input type="checkbox" checked={sel.has(c.trackingId)} onChange={() => toggle(c.trackingId)} aria-label={'Select ' + c.name} /></td><td className="td-name">{c.name}<SourceBadge source={c.source} /></td><td className="mono">{c.trackingId}</td><td>{c.areaOffice}</td><td>{c.sector}</td><td><StatusChip status={c.status} /></td><td><StatusChip status={c.cap15} kind="cap15" /></td><td><button className="btn-open" onClick={() => onOpen(c)}>Open</button></td></tr>))}</tbody>
      </table></div> : <p className="muted-line">No societies match your search.</p>}
    </div>
  )
}
function SekatPanel({ ctx, onSynced }) {
  const [info, setInfo] = useState(null), [busy, setBusy] = useState(false)
  const load = () => getIntegration('sekat').then(setInfo)
  useEffect(() => { load() }, [])
  const run = async () => { setBusy(true); await syncFromSekat(ctx, false); await load(); setBusy(false); onSynced && onSynced() }
  return (
    <div className="sekat">
      <div className="sekat-flow">
        <div className="node src">SEKAT<span>Registry &amp; audit source</span></div>
        <div className="flow-arrow">&rarr;<span>one-way</span></div>
        <div className="node dst">MCCTI CoopEco<span>Unified registry</span></div>
      </div>
      <div className="sekat-status">
        <div className="status-row"><span>Connection</span><span className={cx('pill', info?.live ? 'ok' : 'muted')}>{info?.live ? 'Live API' : 'Sample feed' + (hasSupabase ? '' : ' (demo)')}</span></div>
        <div className="status-row"><span>Last sync</span><span className="mono">{info?.lastSync ? fmtDate(info.lastSync) : 'Never'}</span></div>
        <div className="status-row"><span>Societies ingested</span><span className="mono">{info?.count ?? 0}</span></div>
      </div>
      <button className="btn btn-gold btn-sm" onClick={run} disabled={busy}>{busy ? 'Syncing…' : 'Run SEKAT sync'}</button>
      <p className="panel-note">Data flows one way, from SEKAT into MCCTI. Synced societies are read-only here. When SEKAT_API_URL and SEKAT_API_KEY are set, the platform pulls the live SEKAT registry automatically; until then it ingests a representative sample that mirrors the SEKAT dataset (registration, custodian, trustees, bank and full audit inputs with examination, approval and signature). Compliance: data flow, retention and NDPR handling to be governed by the SEKAT integration agreement. This is not legal advice.</p>
    </div>
  )
}
function OfficerWorkspace({ ctx, section }) {
  const [coops, reload] = useRegistry()
  const [sel, setSel] = useState(null), [loanSel, setLoanSel] = useState(null)
  const [loans, reloadLoans] = useLoans()
  if (!coops) return <p className="muted-line">Loading registry…</p>
  if (sel) return <CoopDetail coop={sel} ctx={ctx} onClose={() => { setSel(null); reload() }} onChanged={reload} />
  if (loanSel) return <LoanDetail loan={loanSel} ctx={ctx} onClose={() => { setLoanSel(null); reloadLoans() }} onChanged={reloadLoans} />
  const queue = coops.filter((c) => ['Filed', 'Under review', 'Returned'].includes(c.status))
  const byOffice = AREA_OFFICES.map((o) => [o, coops.filter((c) => c.areaOffice === o).length]).filter(([, n]) => n)
  const lasmecoQueue = (loans || []).filter((l) => l.status === 'Shortlisted')
  return (
    <div className="ws">
      {section === 'overview' && <OfficerOverview coops={coops} />}
      {section === 'queue' && <CoopTable coops={queue} onOpen={setSel} />}
      {section === 'all' && <CoopTable coops={coops} onOpen={setSel} />}
      {section === 'members' && <MembersAnalytics />}
      {section === 'lasmeco' && (!loans ? <p className="muted-line">Loading…</p> : <><p className="muted-line">Applications awaiting cooperative validation and 25% guarantee. Open one to validate.</p><LoanTable loans={lasmecoQueue.length ? lasmecoQueue : loans} onOpen={setLoanSel} /></>)}
      {section === 'offices' && <div className="rtable-wrap"><table className="rtable"><thead><tr><th>Area office</th><th>Societies</th></tr></thead><tbody>{byOffice.map(([o, n]) => (<tr key={o}><td>{o}</td><td className="mono">{n}</td></tr>))}</tbody></table></div>}
      {section === 'audit' && <OfficerAuditLog />}
      {section === 'reports' && <ReportsPanel role="officer" />}
      {section === 'risk' && <RiskPanel />}
      {section === 'integrations' && <IntegrationsPanel ctx={ctx} onSynced={reload} />}
    </div>
  )
}
function OfficerAuditLog() {
  const [items, setItems] = useState(null)
  useEffect(() => { listAudit().then((r) => setItems(r.slice(0, 40))) }, [])
  if (!items) return <p className="muted-line">Loading…</p>
  if (!items.length) return <p className="muted-line">No activity yet.</p>
  return <div className="rtable-wrap"><table className="rtable"><thead><tr><th>When</th><th>Action</th><th>By</th><th>Society</th></tr></thead><tbody>{items.map((a, i) => (<tr key={i}><td className="mono">{fmtDate(a.at)}</td><td>{a.action}</td><td>{a.by}</td><td className="mono">{a.trackingId}</td></tr>))}</tbody></table></div>
}
function AuditorWorkspace({ ctx, section }) {
  const [coops, reload] = useRegistry()
  const [sel, setSel] = useState(null)
  if (!coops) return <p className="muted-line">Loading returns…</p>
  if (sel) return <CoopDetail coop={sel} ctx={ctx} onClose={() => { setSel(null); reload() }} onChanged={reload} />
  const withReturns = coops.filter((c) => c.returns)
  return (
    <div className="ws">
      {section === 'overview' && <AuditorOverview coops={coops} />}
      {section === 'returns' && (withReturns.length ? <CoopTable coops={withReturns} onOpen={setSel} /> : <p className="muted-line">No returns have been filed yet.</p>)}
      {section === 'all' && <CoopTable coops={coops} onOpen={setSel} />}
    </div>
  )
}
/* ---------------------------- charts + analytics ---------------------- */
const CHART_C = { green: '#3E9E6B', gold: '#C6A15B', teal: '#4FA3A0', slate: '#7C858C', amber: '#D0975A', plum: '#9A7AA0', red: '#C0533A' }
function Donut({ data, size = 150, thickness = 20, centerTop, centerBottom }) {
  const total = data.reduce((a, d) => a + d.value, 0) || 1
  const r = (size - thickness) / 2, circ = 2 * Math.PI * r
  let off = 0
  return (
    <div className="donut-wrap">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="donut">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--line-soft)" strokeWidth={thickness} />
        <g transform={`rotate(-90 ${size / 2} ${size / 2})`}>
          {data.map((d, i) => { const dash = (d.value / total) * circ; const el = <circle key={i} cx={size / 2} cy={size / 2} r={r} fill="none" stroke={d.color} strokeWidth={thickness} strokeDasharray={`${dash} ${circ - dash}`} strokeDashoffset={-off} strokeLinecap="butt" />; off += dash; return el })}
        </g>
        <text x="50%" y="46%" textAnchor="middle" className="donut-c1">{centerTop}</text>
        <text x="50%" y="63%" textAnchor="middle" className="donut-c2">{centerBottom}</text>
      </svg>
      <div className="legend">{data.map((d, i) => (<div key={i} className="lg"><span className="lg-dot" style={{ background: d.color }} />{d.label}<b>{d.value}</b></div>))}</div>
    </div>
  )
}
function Bars({ data, unit }) {
  const max = Math.max(1, ...data.map((d) => d.value))
  if (!data.length) return <p className="muted-line">No data yet.</p>
  return <div className="bars">{data.map((d, i) => (<div key={i} className="bar-row"><span className="bar-lab" title={d.label}>{d.label}</span><span className="bar-track"><span className="bar-fill" style={{ width: Math.max(2, d.value / max * 100) + '%', background: d.color || 'var(--gold)' }} /></span><span className="bar-val">{unit === 'naira' ? fmtNaira(d.value) : d.value}</span></div>))}</div>
}
function MiniArea({ points, color = CHART_C.green }) {
  const w = 300, h = 80, max = Math.max(1, ...points), n = points.length
  if (!n) return null
  const step = n > 1 ? w / (n - 1) : w
  const xy = points.map((v, i) => [i * step, h - (v / max) * (h - 12) - 6])
  const line = 'M' + xy.map((p) => p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join(' L ')
  const area = line + ` L ${w} ${h} L 0 ${h} Z`
  return <svg viewBox={`0 0 ${w} ${h}`} className="miniarea" preserveAspectRatio="none"><path d={area} fill={color} opacity=".14" /><path d={line} fill="none" stroke={color} strokeWidth="2.5" vectorEffect="non-scaling-stroke" /></svg>
}
function OfficerOverview({ coops }) {
  const status = [['Approved', CHART_C.green], ['Under review', CHART_C.gold], ['Filed', CHART_C.slate], ['Returned', CHART_C.red]].map(([s, c]) => ({ label: s, value: coops.filter((x) => x.status === s).length, color: c })).filter((d) => d.value)
  const cap = [['Compliant', CHART_C.green], ['Under audit', CHART_C.slate], ['Returns due', CHART_C.gold]].map(([s, c]) => ({ label: s, value: coops.filter((x) => x.cap15 === s).length, color: c })).filter((d) => d.value)
  const offices = AREA_OFFICES.map((o) => ({ label: o, value: coops.filter((c) => c.areaOffice === o).length, color: CHART_C.green })).filter((d) => d.value).sort((a, b) => b.value - a.value).slice(0, 6)
  return (<div className="analytics"><StatCards coops={coops} /><div className="chart-grid">
    <section className="chart-card"><h4>Registration status</h4><Donut data={status} centerTop={String(coops.length)} centerBottom="societies" /></section>
    <section className="chart-card"><h4>CAP15 compliance</h4><Donut data={cap} centerTop={String(coops.filter((c) => c.cap15 === 'Compliant').length)} centerBottom="compliant" /></section>
    <section className="chart-card"><h4>Registry source</h4><Donut data={[{ label: 'SEKAT', value: coops.filter((c) => c.source === 'SEKAT').length, color: CHART_C.teal }, { label: 'MCCTI', value: coops.filter((c) => c.source !== 'SEKAT').length, color: CHART_C.gold }].filter((d) => d.value)} centerTop={String(coops.length)} centerBottom="total" /></section>
    <section className="chart-card wide"><h4>Societies by area office</h4><Bars data={offices} /></section>
  </div></div>)
}
function AuditorOverview({ coops }) {
  const cap = [['Compliant', CHART_C.green], ['Under audit', CHART_C.gold], ['Returns due', CHART_C.slate]].map(([s, c]) => ({ label: s, value: coops.filter((x) => x.cap15 === s).length, color: c })).filter((d) => d.value)
  const withReturns = coops.filter((c) => c.returns).length
  return (<div className="analytics">
    <div className="statgrid"><div className="stat"><span className="stat-fig">{withReturns}</span><span className="stat-lab">Returns filed</span></div><div className="stat"><span className="stat-fig">{coops.filter((c) => c.cap15 === 'Under audit').length}</span><span className="stat-lab">Awaiting examination</span></div><div className="stat"><span className="stat-fig">{coops.filter((c) => c.cap15 === 'Compliant').length}</span><span className="stat-lab">Signed off</span></div><div className="stat"><span className="stat-fig">{coops.length}</span><span className="stat-lab">Societies</span></div></div>
    <div className="chart-grid"><section className="chart-card"><h4>CAP15 compliance</h4><Donut data={cap} centerTop={String(coops.filter((c) => c.cap15 === 'Compliant').length)} centerBottom="compliant" /></section></div>
  </div>)
}
function LoanStageOverview({ loans, cards }) {
  const stages = ['Applied', 'In training', 'Shortlisted', 'Coop validated', 'Bank assessment', 'BOI approved', 'Disbursed'].map((s) => ({ label: s, value: loans.filter((l) => l.status === s).length, color: CHART_C.gold }))
  const sectors = Array.from(new Set(loans.map((l) => l.sector))).map((s) => ({ label: s, value: loans.filter((l) => l.sector === s).length, color: CHART_C.teal }))
  const sched = loans.filter((l) => (l.schedule || []).length)
  const outstanding = sched.reduce((a, l) => a + loanRepayState(l).outstanding, 0)
  const arrears = sched.reduce((a, l) => a + loanRepayState(l).arrears, 0)
  const repaid = sched.reduce((a, l) => a + loanRepayState(l).paid, 0)
  return (<div className="analytics">
    <div className="statgrid">{cards(loans).map(([lab, val]) => (<div className="stat" key={lab}><span className="stat-fig">{val}</span><span className="stat-lab">{lab}</span></div>))}</div>
    {sched.length ? <div className="statgrid"><div className="stat"><span className="stat-fig">{fmtNaira(outstanding)}</span><span className="stat-lab">Portfolio outstanding</span></div><div className="stat"><span className="stat-fig">{fmtNaira(repaid)}</span><span className="stat-lab">Repaid to date</span></div><div className="stat"><span className="stat-fig" style={arrears ? { color: 'var(--err)' } : undefined}>{fmtNaira(arrears)}</span><span className="stat-lab">In arrears</span></div><div className="stat"><span className="stat-fig">{sched.length}</span><span className="stat-lab">On repayment</span></div></div> : null}
    <div className="chart-grid"><section className="chart-card wide"><h4>Pipeline by stage</h4><Bars data={stages} /></section><section className="chart-card"><h4>By sector</h4><Bars data={sectors} /></section></div>
  </div>)
}
function SocietyOverview({ mine }) {
  const [loans, setLoans] = useState([]), [members, setMembers] = useState([]), [series, setSeries] = useState(null)
  useEffect(() => { listLoans().then((ls) => setLoans(ls.filter((l) => l.coop === mine.name))); listMembers().then((ms) => setMembers(ms.filter((m) => m.coop === mine.name))) }, [mine.name])
  useEffect(() => { (async () => { await recordCoopSnapshot(mine); setSeries(await coopContributionSeries(mine.trackingId, 6)) })() }, [mine.trackingId])
  const r = mine.returns
  const active = loans.filter((l) => !['Declined', 'Completed', 'Default'].includes(l.status)).length
  const nl = coopNominationLimit(mine, active)
  const liab = coopGuaranteeLiability(mine.name, loans)
  const adm = coopAdmission(mine)
  const finance = r ? [{ label: 'Income', value: r.income || 0, color: CHART_C.green }, { label: 'Expenses', value: r.expenses || 0, color: CHART_C.gold }, { label: 'Surplus', value: Math.max(0, r.surplus || 0), color: CHART_C.teal }] : []
  const statusColors = { Repaying: CHART_C.green, Disbursed: CHART_C.teal, Completed: CHART_C.slate, Default: CHART_C.red, 'Bank assessment': CHART_C.gold, 'Coop validated': CHART_C.amber, 'BOI approved': CHART_C.plum, Applied: CHART_C.gold, 'In training': CHART_C.gold, Shortlisted: CHART_C.teal }
  const loanStatus = Object.entries(loans.reduce((a, l) => { a[l.status] = (a[l.status] || 0) + 1; return a }, {})).map(([k, v]) => ({ label: k, value: v, color: statusColors[k] || CHART_C.slate }))
  const capUse = [{ label: 'Used', value: nl.used, color: CHART_C.green }, { label: 'Remaining', value: nl.remaining, color: CHART_C.slate }]
  const base = mine.contributions || 0
  const hasReal = series && series.length >= 2
  const trend = hasReal ? series.map((s) => s.contributions) : [0.68, 0.76, 0.83, 0.89, 0.95, 1].map((x) => Math.round(base * x))
  const genders = members.reduce((a, m) => { const g = (m.gender || 'Unstated'); a[g] = (a[g] || 0) + 1; return a }, {})
  const genderData = [['Female', CHART_C.plum], ['Male', CHART_C.teal], ['Unstated', CHART_C.slate]].map(([g, c]) => ({ label: g, value: genders[g] || 0, color: c })).filter((d) => d.value)
  return (<div className="analytics">
    <div className="coop-hero">
      <svg viewBox="0 0 120 80" className="coop-hero-art" aria-hidden="true">
        <rect x="0" y="0" width="120" height="80" rx="10" fill="var(--green-panel)" />
        {[16, 40, 64, 88].map((x, i) => <rect key={i} x={x} y={54 - (i % 2) * 8} width="16" height={26 + (i % 2) * 8} rx="3" fill={i % 2 ? CHART_C.teal : CHART_C.green} opacity=".85" />)}
        <path d="M8 60 Q40 40 72 50 T112 34" fill="none" stroke={CHART_C.gold} strokeWidth="2.5" />
        {[[8, 60], [40, 45], [72, 50], [112, 34]].map(([cx, cy], i) => <circle key={i} cx={cx} cy={cy} r="3" fill={CHART_C.gold} />)}
      </svg>
      <div className="coop-hero-text"><h3>{mine.name}</h3><p>{mine.areaOffice} area office &middot; {mine.sector} &middot; {adm.admitted ? 'Admitted to LASMECO' : 'Admission pending'}</p></div>
    </div>
    <div className="kpi-row">
      <div className="kpi"><span className="kpi-fig">{Number(mine.members || 0).toLocaleString('en-NG')}</span><span className="kpi-lab">Members</span></div>
      <div className="kpi"><span className="kpi-fig">{fmtNaira(mine.contributions)}</span><span className="kpi-lab">Contributions</span></div>
      <div className="kpi"><span className="kpi-fig">{nl.tier}</span><span className="kpi-lab">LASMECO tier</span></div>
      <div className="kpi"><span className="kpi-fig">{nl.remaining}</span><span className="kpi-lab">Nominations left</span></div>
    </div>
    <div className="chart-grid">
      <section className="chart-card"><h4>Nomination capacity</h4><Donut data={capUse} centerTop={String(nl.limit)} centerBottom="limit" /></section>
      <section className="chart-card"><h4>Loan portfolio</h4>{loanStatus.length ? <Donut data={loanStatus} centerTop={String(loans.length)} centerBottom={loans.length === 1 ? 'loan' : 'loans'} /> : <p className="muted-line">No member loans yet.</p>}</section>
      <section className="chart-card wide"><h4>Contributions trend</h4><MiniArea points={trend} /><p className="chart-note">{hasReal ? 'Recorded monthly, ' + monthLabel(series[0].month) + ' \u2013 ' + monthLabel(series[series.length - 1].month) + ' (current ' + fmtNaira(base) + ').' : 'Illustrative until monthly figures accumulate; current ' + fmtNaira(base) + ' on record.'}</p></section>
      {genderData.length ? <section className="chart-card"><h4>Membership mix</h4><Donut data={genderData} centerTop={String(members.length)} centerBottom="profiled" /></section> : null}
      <section className="chart-card"><h4>Guarantee exposure</h4><Bars data={[{ label: 'Contingent (25%)', value: liab.contingent, color: CHART_C.gold }, { label: 'Crystallised', value: liab.crystallised, color: CHART_C.red }]} unit="naira" /></section>
      {finance.length ? <section className="chart-card wide"><h4>Latest annual returns</h4><Bars data={finance} unit="naira" /></section> : <section className="chart-card wide"><h4>Annual returns</h4><p className="muted-line">File your annual returns to see income, expenses and surplus here.</p></section>}
    </div>
  </div>)
}
function MemberOverview({ mine, loans }) {
  const s = scoreMember(mine)
  return (<div className="analytics">
    <div className="kpi-row">
      <div className="kpi"><span className="kpi-fig">{s.score}</span><span className="kpi-lab">Credit score</span></div>
      <div className="kpi"><span className="kpi-fig">{s.band}</span><span className="kpi-lab">Risk band</span></div>
      <div className="kpi"><span className="kpi-fig">{fmtNaira(s.threshold)}</span><span className="kpi-lab">LASMECO indication</span></div>
      <div className="kpi"><span className="kpi-fig">{loans.length}</span><span className="kpi-lab">Applications</span></div>
    </div>
    <div className="chart-grid"><section className="chart-card wide"><h4>Credit score</h4><CreditScoreCard m={mine} /></section></div>
  </div>)
}
function AnalyticsDashboard() {
  const [coops, setCoops] = useState(null), [members, setMembers] = useState([]), [loans, setLoans] = useState([]), [wallets, setWallets] = useState([]), [tickets, setTickets] = useState([])
  useEffect(() => { listCoops().then(setCoops); listMembers().then(setMembers); listLoans().then(setLoans); kvList('wallet:').then(setWallets); listTickets().then(setTickets) }, [])
  if (!coops) return <p className="muted-line">Loading analytics…</p>
  const scored = members.map((m) => scoreMember(m))
  const disbursed = loans.filter((l) => ['Disbursed', 'Repaying', 'Completed'].includes(l.status))
  const disbursedValue = disbursed.reduce((a, l) => a + (l.amountApproved || 0), 0)
  const funding = wallets.reduce((a, w) => a + (w.txns || []).filter((t) => t.type === 'topup').reduce((s, t) => s + (t.amount || 0), 0), 0)
  const regFees = coops.filter((c) => c.feeStatus === 'Paid').length * COOP_FEES.registration
  const returnsFees = coops.filter((c) => c.returns).length * COOP_FEES.annualReturns
  const portalFees = Math.round(disbursedValue * 0.025)
  const accrued = regFees + returnsFees + portalFees + Math.round(funding * 0.01)
  const avgScore = scored.length ? Math.round(scored.reduce((a, s) => a + s.score, 0) / scored.length) : 0
  const openTickets = tickets.filter((t) => t.status !== 'Resolved').length
  const withSched = loans.filter((l) => (l.schedule || []).length)
  const portfolioOutstanding = withSched.reduce((a, l) => a + loanRepayState(l).outstanding, 0)
  const portfolioArrears = withSched.reduce((a, l) => a + loanRepayState(l).arrears, 0)

  const statusData = [['Approved', CHART_C.green], ['Under review', CHART_C.gold], ['Filed', CHART_C.slate], ['Returned', CHART_C.red]].map(([s, c]) => ({ label: s, value: coops.filter((x) => x.status === s).length, color: c })).filter((d) => d.value)
  const cap15 = [['Compliant', CHART_C.green], ['Under audit', CHART_C.slate], ['Returns due', CHART_C.gold]].map(([s, c]) => ({ label: s, value: coops.filter((x) => x.cap15 === s).length, color: c })).filter((d) => d.value)
  const sourceData = [{ label: 'SEKAT', value: coops.filter((c) => c.source === 'SEKAT').length, color: CHART_C.teal }, { label: 'MCCTI', value: coops.filter((c) => c.source !== 'SEKAT').length, color: CHART_C.gold }].filter((d) => d.value)
  const offices = AREA_OFFICES.map((o) => ({ label: o, value: coops.filter((c) => c.areaOffice === o).length, color: CHART_C.green })).filter((d) => d.value).sort((a, b) => b.value - a.value).slice(0, 6)
  const bands = [['Prime', CHART_C.green], ['Strong', '#5FB07E'], ['Fair', CHART_C.gold], ['Building', CHART_C.amber], ['Thin file', CHART_C.slate]].map(([b, c]) => ({ label: b, value: scored.filter((s) => s.band === b).length, color: c })).filter((d) => d.value)
  const kyc = [['Verified', CHART_C.green], ['Partial', CHART_C.gold], ['Unverified', CHART_C.slate]].map(([s, c]) => ({ label: s, value: members.filter((m) => (m.kyc?.status || 'Unverified') === s).length, color: c })).filter((d) => d.value)
  const pipeline = ['Applied', 'In training', 'Shortlisted', 'Coop validated', 'Bank assessment', 'BOI approved', 'Disbursed'].map((s) => ({ label: s, value: loans.filter((l) => l.status === s).length, color: CHART_C.gold }))
  const sectors = Array.from(new Set(loans.map((l) => l.sector))).map((s) => ({ label: s, value: loans.filter((l) => l.sector === s).length, color: CHART_C.teal }))
  const split = SPV_SPLIT.map(([n, p], i) => ({ label: n, value: Math.round(accrued * p / 100), color: [CHART_C.green, CHART_C.gold, CHART_C.teal, CHART_C.plum, CHART_C.amber][i] }))
  const ticketData = [['Open', CHART_C.gold], ['In progress', CHART_C.slate], ['Escalated', CHART_C.red], ['Resolved', CHART_C.green]].map(([s, c]) => ({ label: s, value: tickets.filter((t) => t.status === s).length, color: c })).filter((d) => d.value)

  const now = new Date(), months = []
  for (let i = 5; i >= 0; i--) { const d = new Date(now.getFullYear(), now.getMonth() - i, 1); months.push({ key: d.getFullYear() + '-' + d.getMonth(), label: d.toLocaleString('en-GB', { month: 'short' }) }) }
  const regTrend = months.map((m) => coops.filter((c) => { const d = new Date(c.createdAt); return d.getFullYear() + '-' + d.getMonth() === m.key }).length)
  const trendTotal = regTrend.reduce((a, b) => a + b, 0)

  return (
    <div className="analytics">
      <div className="kpi-row">
        <div className="kpi"><span className="kpi-fig">{coops.length}</span><span className="kpi-lab">Cooperative societies</span></div>
        <div className="kpi"><span className="kpi-fig">{members.length}</span><span className="kpi-lab">Members profiled</span></div>
        <div className="kpi"><span className="kpi-fig">{fmtNaira(disbursedValue)}</span><span className="kpi-lab">LASMECO disbursed</span></div>
        <div className="kpi"><span className="kpi-fig">{fmtNaira(accrued)}</span><span className="kpi-lab">Escrow accrued</span></div>
        <div className="kpi"><span className="kpi-fig">{fmtNaira(funding)}</span><span className="kpi-lab">Payments processed</span></div>
        <div className="kpi"><span className="kpi-fig">{fmtNaira(portfolioOutstanding)}</span><span className="kpi-lab">Loan portfolio outstanding</span></div>
        <div className="kpi"><span className="kpi-fig" style={portfolioArrears ? { color: 'var(--err)' } : undefined}>{fmtNaira(portfolioArrears)}</span><span className="kpi-lab">In arrears</span></div>
        <div className="kpi"><span className="kpi-fig">{openTickets}</span><span className="kpi-lab">Open support tickets</span></div>
      </div>
      <div className="chart-grid">
        <section className="chart-card"><h4>Registration status</h4><Donut data={statusData} centerTop={String(coops.length)} centerBottom="societies" /></section>
        <section className="chart-card"><h4>CAP15 compliance</h4><Donut data={cap15} centerTop={String(coops.filter((c) => c.cap15 === 'Compliant').length)} centerBottom="compliant" /></section>
        <section className="chart-card"><h4>Registry source</h4><Donut data={sourceData} centerTop={String(coops.length)} centerBottom="total" /></section>
        <section className="chart-card"><h4>Societies by area office</h4><Bars data={offices} /></section>
        <section className="chart-card"><h4>Member credit bands</h4><Bars data={bands} /></section>
        <section className="chart-card"><h4>KYC status &middot; avg score {avgScore}</h4><Donut data={kyc} centerTop={String(avgScore)} centerBottom="avg score" /></section>
        <section className="chart-card wide"><h4>LASMECO pipeline</h4><Bars data={pipeline} /></section>
        <section className="chart-card"><h4>Applications by sector</h4><Bars data={sectors} /></section>
        <section className="chart-card"><h4>Escrow distribution ({fmtNaira(accrued)})</h4><Bars data={split} unit="naira" /></section>
        <section className="chart-card"><h4>Support tickets</h4>{ticketData.length ? <Donut data={ticketData} centerTop={String(tickets.length)} centerBottom="tickets" /> : <p className="muted-line">No tickets yet.</p>}</section>
        <section className="chart-card wide"><h4>Registrations, last 6 months ({trendTotal})</h4><MiniArea points={regTrend} /><div className="trend-x">{months.map((m) => <span key={m.key}>{m.label}</span>)}</div></section>
      </div>
      <p className="dash-foot">Live analytics across the cooperative economy. Figures update as societies register, members are profiled, and LASMECO loans move through the pipeline.</p>
    </div>
  )
}
function ViewAsBar({ onViewAs }) {
  const [coops, setCoops] = useState([]), [members, setMembers] = useState([])
  useEffect(() => { listCoops().then(setCoops); listMembers().then(setMembers) }, [])
  const titles = { officer: 'Cooperative Officer', auditor: 'Auditor', accelerator: 'Accelerator Programme', sterling: 'Sterling Bank', boi: 'Bank of Industry', assetmatrix: 'Asset Matrix MFB' }
  const pick = (e) => {
    const v = e.target.value; e.target.value = ''
    if (!v) return
    const [kind, id] = v.split('::')
    if (kind === 'role') onViewAs({ role: id, name: titles[id], office: 'Workspace preview', title: titles[id] })
    else if (kind === 'coop') { const c = coops.find((x) => x.trackingId === id); if (c) onViewAs({ role: 'society', name: c.name, email: c.createdBy, focusId: c.trackingId, office: c.areaOffice + ' area office', title: 'Cooperative Society' }) }
    else if (kind === 'member') { const m = members.find((x) => x.memberId === id); if (m) onViewAs({ role: 'member', name: m.name, focusId: m.memberId, office: m.coop, title: 'Member' }) }
  }
  return (
    <div className="switcher">
      <span className="switcher-lab">Open a workspace as</span>
      <select className="switcher-sel" onChange={pick} defaultValue="">
        <option value="" disabled>Select a role, society or member…</option>
        <optgroup label="Roles">{Object.entries(titles).map(([id, l]) => <option key={id} value={'role::' + id}>{l}</option>)}</optgroup>
        <optgroup label="Cooperative societies">{coops.map((c) => <option key={c.trackingId} value={'coop::' + c.trackingId}>{c.name}</option>)}</optgroup>
        <optgroup label="Members">{members.map((m) => <option key={m.memberId} value={'member::' + m.memberId}>{m.name}</option>)}</optgroup>
      </select>
    </div>
  )
}
function PortfolioTrend() {
  const [series, setSeries] = useState(null)
  useEffect(() => { portfolioContributionSeries(6).then(setSeries) }, [])
  if (!series || series.length < 2) return null
  const latest = series[series.length - 1].contributions
  return (
    <div className="chart-card wide" style={{ marginBottom: '18px' }}>
      <h4>Cooperative contributions across the registry</h4>
      <MiniArea points={series.map((s) => s.contributions)} />
      <p className="chart-note">Total member contributions, {monthLabel(series[0].month)}{' \u2013 '}{monthLabel(series[series.length - 1].month)}. Current registry total {fmtNaira(latest)}.</p>
    </div>
  )
}
function ActionQueue() {
  const [q, setQ] = useState(null)
  useEffect(() => { (async () => {
    try {
      const [loans, coops, accels] = await Promise.all([listLoans(), listCoops(), listAccelerators()])
      const npl = nplMetrics(loans)
      setQ({
        apps: loans.filter((l) => ['Applied', 'In training', 'Shortlisted', 'Coop validated', 'Bank assessment', 'BOI approved'].includes(l.status)).length,
        coopsPending: coops.filter((c) => !coopAdmission(c).admitted).length,
        accelsPending: accels.filter((a) => (a.status || 'Pending') !== 'Appointed').length,
        npl: npl.nplLoans.length,
      })
    } catch (e) { setQ({}) }
  })() }, [])
  if (!q) return null
  const items = [[q.apps, 'applications in progress'], [q.coopsPending, 'cooperatives awaiting admission'], [q.accelsPending, 'accelerators awaiting appointment'], [q.npl, 'loans non-performing']].filter(([n]) => n > 0)
  if (!items.length) return null
  return (
    <div className="action-queue">
      <h4>Needs your attention</h4>
      <div className="aq-row">{items.map(([n, label], i) => (<div className="aq-item" key={i}><span className="aq-n">{n}</span><span className="aq-lab">{label}</span></div>))}</div>
    </div>
  )
}
const OPP_TYPES = ['Request for quote', 'Offtake offer', 'Bulk purchase pool']
async function listOpps(chainId) { return (await kvList('opp:' + chainId + ':')).filter(Boolean).sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1)) }
async function saveOpp(rec, ctx) {
  const id = rec.oppId || 'OP-' + Math.random().toString(36).slice(2, 7).toUpperCase()
  const next = { ...rec, oppId: id, updatedAt: new Date().toISOString(), createdAt: rec.createdAt || new Date().toISOString() }
  await kvSet('opp:' + rec.chainId + ':' + id, next)
  return next
}
async function listOppReplies(chainId, oppId) { return (await kvList('oppr:' + chainId + ':' + oppId + ':')).filter(Boolean) }
async function saveOppReply(chainId, oppId, rec) {
  const id = 'R-' + Math.random().toString(36).slice(2, 7).toUpperCase()
  await kvSet('oppr:' + chainId + ':' + oppId + ':' + id, { ...rec, id, chainId, oppId, at: new Date().toISOString() })
}
function OpportunityBoard({ chain, ctx }) {
  const [opps, setOpps] = useState(null), [posting, setPosting] = useState(false), [busy, setBusy] = useState(false)
  const [f, setF] = useState({ type: OPP_TYPES[0], title: '', detail: '', quantity: '', unit: '', priceNaira: '', deadline: '' })
  const [open, setOpen] = useState(null), [replies, setReplies] = useState([]), [reply, setReply] = useState({ note: '', priceNaira: '' })
  const ro = isReviewer(ctx)
  const canPost = !ro && ['society', 'member', 'accelerator', 'leadership', 'officer'].indexOf(ctx.role) > -1
  const reload = useCallback(() => listOpps(chain.chainId).then(setOpps), [chain.chainId])
  useEffect(() => { reload() }, [reload])
  useEffect(() => { if (open) listOppReplies(chain.chainId, open.oppId).then(setReplies); else setReplies([]) }, [open, chain.chainId])
  const post = async () => {
    if (!f.title.trim()) { toast('Give the opportunity a title.', 'error'); return }
    setBusy(true)
    await saveOpp({ ...f, chainId: chain.chainId, status: 'Open', postedBy: ctx.email, postedByName: ctx.name, postedByRole: ctx.role }, ctx)
    setBusy(false); setPosting(false); setF({ type: OPP_TYPES[0], title: '', detail: '', quantity: '', unit: '', priceNaira: '', deadline: '' }); reload()
    toast('Posted to the chain.', 'success')
  }
  const sendReply = async () => {
    if (!reply.note.trim()) { toast('Add a note to your response.', 'error'); return }
    setBusy(true)
    await saveOppReply(chain.chainId, open.oppId, { by: ctx.email, byName: ctx.name, note: reply.note.trim(), priceNaira: Number(reply.priceNaira) || 0 })
    try { await notify({ to: open.postedBy, title: 'Response to your ' + open.type.toLowerCase(), body: ctx.name + ' responded to "' + open.title + '" in ' + chain.name + '.', event: 'chain' }) } catch (e) { /* best-effort */ }
    setBusy(false); setReply({ note: '', priceNaira: '' }); listOppReplies(chain.chainId, open.oppId).then(setReplies)
    toast('Response sent.', 'success')
  }
  const close = async (o) => { await saveOpp({ ...o, status: 'Closed' }, ctx); reload(); setOpen(null); toast('Opportunity closed.') }
  if (!opps) return <p className="muted-line">Loading opportunities…</p>
  if (open) {
    const mine = open.postedBy === ctx.email
    return (
      <div className="returns-box"><button className="back-link" onClick={() => setOpen(null)}>&larr; Back to opportunities</button>
        <h4>{open.title}</h4>
        <p className="muted-line">{open.type} · posted by {open.postedByName} · {fmtDate(open.createdAt)} · {open.status}</p>
        {open.detail && <p className="opp-detail">{open.detail}</p>}
        <div className="opp-meta">{open.quantity && <span>Quantity: <strong>{open.quantity} {open.unit}</strong></span>}{open.priceNaira && <span>Indicative: <strong>{fmtNaira(Number(open.priceNaira))}</strong></span>}{open.deadline && <span>Closes: <strong>{fmtDate(open.deadline)}</strong></span>}</div>
        <h4 style={{ marginTop: '18px' }}>Responses ({replies.length})</h4>
        {replies.length ? replies.map((r) => (<div className="opp-reply" key={r.id}><div><strong>{r.byName}</strong><span>{fmtDate(r.at)}{r.priceNaira ? ' · ' + fmtNaira(r.priceNaira) : ''}</span></div><p>{r.note}</p></div>)) : <p className="muted-line sm">No responses yet.</p>}
        {!ro && open.status === 'Open' && !mine && <div className="returns-box" style={{ marginTop: '14px' }}><h4>Respond</h4><div className="form-grid"><label className="field span2"><span>Your response</span><textarea rows={2} value={reply.note} onChange={(e) => setReply({ ...reply, note: e.target.value })} placeholder="What you can supply, or what you need" /></label><label className="field"><span>Your price (₦, optional)</span><input type="number" value={reply.priceNaira} onChange={(e) => setReply({ ...reply, priceNaira: e.target.value })} /></label></div><div className="panel-actions"><button className="btn btn-gold btn-sm" disabled={busy} onClick={sendReply}>Send response</button></div></div>}
        {!ro && mine && open.status === 'Open' && <div className="panel-actions"><button className="btn btn-outline btn-sm" onClick={() => close(open)}>Close this opportunity</button></div>}
      </div>
    )
  }
  return (
    <div className="returns-box"><h4>Opportunities in this chain</h4>
      <p className="muted-line">Post what you need or what you can supply. Everyone in the chain can see and respond, so cooperatives can buy inputs together, find offtakers and trade across stages.</p>
      {canPost && !posting && <div className="panel-actions"><button className="btn btn-gold btn-sm" onClick={() => setPosting(true)}>Post an opportunity</button></div>}
      {posting && <div className="returns-box"><div className="form-grid">
        <label className="field"><span>Type</span><select value={f.type} onChange={(e) => setF({ ...f, type: e.target.value })}>{OPP_TYPES.map((t) => <option key={t}>{t}</option>)}</select></label>
        <label className="field"><span>Title</span><input value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} placeholder="e.g. 200 bags of layer feed needed" /></label>
        <label className="field span2"><span>Detail</span><textarea rows={2} value={f.detail} onChange={(e) => setF({ ...f, detail: e.target.value })} placeholder="Specification, quality, delivery location" /></label>
        <label className="field"><span>Quantity</span><input value={f.quantity} onChange={(e) => setF({ ...f, quantity: e.target.value })} placeholder="200" /></label>
        <label className="field"><span>Unit</span><input value={f.unit} onChange={(e) => setF({ ...f, unit: e.target.value })} placeholder="bags" /></label>
        <label className="field"><span>Indicative value (₦)</span><input type="number" value={f.priceNaira} onChange={(e) => setF({ ...f, priceNaira: e.target.value })} /></label>
        <label className="field"><span>Closes on</span><input type="date" value={f.deadline} onChange={(e) => setF({ ...f, deadline: e.target.value })} /></label>
      </div><div className="panel-actions"><button className="btn btn-gold btn-sm" disabled={busy} onClick={post}>Post</button><button className="btn btn-ghost btn-sm" onClick={() => setPosting(false)}>Cancel</button></div></div>}
      {opps.length ? <div className="opp-list">{opps.map((o) => (
        <button className="opp-row" key={o.oppId} onClick={() => setOpen(o)}>
          <span className={cx('opp-tag', o.type === 'Offtake offer' && 'offtake', o.type === 'Bulk purchase pool' && 'pool')}>{o.type}</span>
          <div className="opp-body"><strong>{o.title}</strong><span>{o.postedByName} · {fmtDate(o.createdAt)}{o.quantity ? ' · ' + o.quantity + ' ' + o.unit : ''}{o.priceNaira ? ' · ' + fmtNaira(Number(o.priceNaira)) : ''}</span></div>
          <StatusChip status={o.status} />
        </button>))}</div> : <div className="empty"><span className="empty-mark">&#9670;</span><h3>No opportunities yet</h3><p>{canPost ? 'Post the first one to get the chain trading.' : 'Nothing posted in this chain yet.'}</p></div>}
    </div>
  )
}
function ChainDetail({ chain, ctx, coops, members, loans, onClose, onChanged }) {
  const [c, setC] = useState(chain), [busy, setBusy] = useState(false), [addId, setAddId] = useState('')
  const ro = isReviewer(ctx)
  const canManage = !ro && (ctx.role === 'leadership' || ctx.role === 'officer')
  const m = chainMetrics(c, coops, members, loans)
  const inChain = m.coops.map((x) => x.trackingId)
  const candidates = coops.filter((x) => inChain.indexOf(x.trackingId) === -1)
  const save = async (patch, action) => { setBusy(true); const next = await saveChain({ ...c, ...patch }, ctx, action); setC(next); setBusy(false); onChanged && onChanged() }
  const removeCoop = (id) => save({ removed: [...(c.removed || []), id], added: (c.added || []).filter((x) => x !== id) }, 'Cooperative removed from chain')
  const addCoop = () => { if (!addId) return; save({ added: [...(c.added || []), addId], removed: (c.removed || []).filter((x) => x !== addId) }, 'Cooperative added to chain'); setAddId('') }
  const byStage = {}; (c.stages || []).forEach((s) => { byStage[s] = [] })
  m.coops.forEach((x) => { const s = (c.stageMap && c.stageMap[x.trackingId]) || inferChainStage(x, c); (byStage[s] = byStage[s] || []).push(x) })
  return (
    <div className="detail">
      <button className="back-link" onClick={onClose}>&larr; Back to value chains</button>
      <div className="detail-head"><div><h2>{c.name}</h2><p className="detail-sub">{c.sector} value chain · {c.chainId} · {m.coops.length} cooperative{m.coops.length === 1 ? '' : 's'} · {m.members.length} member{m.members.length === 1 ? '' : 's'}</p></div><StatusChip status={c.status} /></div>
      <div className="statgrid">
        <div className="stat"><span className="stat-fig">{m.jobs.toLocaleString('en-NG')}</span><span className="stat-lab">Jobs supported</span></div>
        <div className="stat"><span className="stat-fig">{fmtNaira(m.turnover)}</span><span className="stat-lab">Combined annual turnover</span></div>
        <div className="stat"><span className="stat-fig" style={m.npl.nplRatio >= 0.05 ? { color: 'var(--err)' } : undefined}>{(m.npl.nplRatio * 100).toFixed(1)}%</span><span className="stat-lab">NPL across chain</span></div>
        <div className="stat"><span className="stat-fig">{fmtNaira(m.nav)}</span><span className="stat-lab">Combined NAV (indicative)</span></div>
      </div>
      <div className="chain-stages">{(c.stages || []).map((s) => (
        <section className="chain-stage" key={s}>
          <h4>{s}<span className="chain-count">{(byStage[s] || []).length}</span></h4>
          {(byStage[s] || []).length ? (byStage[s] || []).map((x) => { const src = chainCoopSource(c, x, loans, members); return (<div className="chain-node" key={x.trackingId}><div><strong>{x.name}</strong><span>{x.areaOffice} · {Number(x.members || 0).toLocaleString('en-NG')} members</span><span className={cx('node-src', src.indexOf('Via') === 0 && 'accel')}>{src}</span></div>{canManage && <div className="node-acts"><select value={(c.stageMap && c.stageMap[x.trackingId]) || s} onChange={(e) => save({ stageMap: { ...(c.stageMap || {}), [x.trackingId]: e.target.value } }, 'Stage updated')} aria-label={'Stage for ' + x.name}>{(c.stages || []).map((st) => <option key={st}>{st}</option>)}</select><button className="link-inline danger" disabled={busy} onClick={() => removeCoop(x.trackingId)}>Remove</button></div>}</div>) }) : <p className="muted-line sm">No cooperative at this stage yet.</p>}
          {(c.firms || []).filter((fm) => fm.stage === s).map((fm, i) => (<div className="chain-node firm" key={i}><div><strong>{fm.name}</strong><span>{fm.role || 'Partner firm'} · not a cooperative</span></div></div>))}
        </section>))}
      </div>
      {c.anchor ? <p className="panel-note">Anchor / offtaker: <strong>{c.anchor}</strong>. Coordinated by {c.coordinator || 'the sector accelerator'}.</p> : <p className="panel-note">No anchor buyer recorded yet. Coordinated by {c.coordinator || 'the sector accelerator'}.</p>}
      <OpportunityBoard chain={c} ctx={ctx} />
      {canManage && <div className="returns-box"><h4>Manage chain</h4>
        <div className="wallet-actions"><select value={addId} onChange={(e) => setAddId(e.target.value)}><option value="">Add a cooperative…</option>{candidates.map((x) => <option key={x.trackingId} value={x.trackingId}>{x.name} ({x.sector})</option>)}</select><button className="btn btn-outline btn-sm" disabled={busy || !addId} onClick={addCoop}>Add</button></div>
        <div className="form-grid" style={{ marginTop: '12px' }}>
          <label className="field"><span>Anchor / offtaker</span><input value={c.anchor || ''} onChange={(e) => setC({ ...c, anchor: e.target.value })} onBlur={() => save({ anchor: c.anchor }, 'Anchor updated')} placeholder="e.g. Lekki Foods Ltd" /></label>
          <label className="field"><span>Coordinator</span><input value={c.coordinator || ''} onChange={(e) => setC({ ...c, coordinator: e.target.value })} onBlur={() => save({ coordinator: c.coordinator }, 'Coordinator updated')} placeholder="Accelerator name" /></label>
        </div>
        <div className="panel-actions">
          {c.status !== 'Active' && <button className="btn btn-gold btn-sm" disabled={busy} onClick={() => save({ status: 'Active' }, 'Value chain approved')}>Approve chain</button>}
          {c.status === 'Active' && <button className="btn btn-outline btn-sm" disabled={busy} onClick={() => save({ status: 'Suspended' }, 'Value chain suspended')}>Suspend</button>}
        </div>
        <p className="panel-note">Cooperatives are assigned automatically from their sector ({c.sector}). Additions and removals here override that. Registration fee {fmtNaira(CHAIN_FEES.registration)}, annual {fmtNaira(CHAIN_FEES.annual)} — confirm both with MCCTI before go-live.</p>
      </div>}
      <AuditTrail trackingId={c.chainId} />
    </div>
  )
}
function ChainsPanel({ ctx }) {
  const [chains, setChains] = useState(null), [coops, setCoops] = useState([]), [members, setMembers] = useState([]), [loans, setLoans] = useState([])
  const [sel, setSel] = useState(null), [creating, setCreating] = useState(false), [f, setF] = useState({ name: '', sector: LASMECO_SECTORS[0] }), [busy, setBusy] = useState(false)
  const [accelSectors, setAccelSectors] = useState([])
  const reload = useCallback(async () => {
    const [a, b, c, d] = await Promise.all([listChains(), listCoops(), listMembers(), listLoans()])
    setChains(a); setCoops(b); setMembers(c); setLoans(d)
    if (['leadership', 'officer', 'accelerator'].indexOf(ctx.role) > -1) { try { await refreshChainStats(a, b, c, d) } catch (e) { /* not fatal */ } }
  }, [ctx.role])
  useEffect(() => { reload() }, [reload])
  useEffect(() => { if (ctx.role === 'accelerator') { kvGet('accelerator:' + ctx.email).then((a) => setAccelSectors((a && a.sectors) || [])).catch(() => { }) } }, [ctx.role, ctx.email])
  const ro = isReviewer(ctx)
  const canCreate = !ro && (ctx.role === 'leadership' || ctx.role === 'accelerator')
  if (!chains) return <p className="muted-line">Loading value chains…</p>
  let mine = chains
  if (ctx.role === 'accelerator') mine = chains.filter((c) => accelSectors.indexOf(c.sector) > -1 || c.createdBy === ctx.email)
  else if (ctx.coopName) mine = chains.filter((c) => chainCoops(c, coops, loans, members).some((x) => x.name === ctx.coopName))
  if (sel) { const fresh = chains.find((c) => c.chainId === sel.chainId) || sel; return <ChainDetail chain={fresh} ctx={ctx} coops={coops} members={members} loans={loans} onClose={() => { setSel(null); reload() }} onChanged={reload} /> }
  const create = async () => {
    if (!f.name.trim()) { toast('Give the value chain a name.', 'error'); return }
    setBusy(true)
    const proposing = ctx.role === 'accelerator'
    await saveChain({ name: f.name.trim(), sector: f.sector, stages: CHAIN_STAGE_TEMPLATES[f.sector] || [], status: proposing ? 'Proposed' : 'Active', coordinator: proposing ? ctx.name : '', added: [], removed: [], firms: [], stageMap: {} }, ctx, proposing ? 'Value chain proposed' : 'Value chain created')
    setBusy(false); setCreating(false); setF({ name: '', sector: LASMECO_SECTORS[0] }); reload()
    toast(proposing ? 'Proposed to MCCTI for approval.' : 'Value chain created.', 'success')
  }
  return (
    <div className="ws">
      <p className="muted-line">Value Chain Cooperatives bundle primary cooperatives, their members and partner firms into one coordinated unit, stage by stage. Cooperatives join automatically based on their sector.</p>
      {canCreate && !creating && <div className="panel-actions"><button className="btn btn-gold btn-sm" onClick={() => setCreating(true)}>{ctx.role === 'accelerator' ? 'Propose a value chain' : 'Create a value chain'}</button></div>}
      {creating && <div className="returns-box"><h4>{ctx.role === 'accelerator' ? 'Propose a value chain' : 'New value chain'}</h4>
        <div className="form-grid">
          <label className="field"><span>Name</span><input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} placeholder="e.g. Lagos Poultry Value Chain" /></label>
          <label className="field"><span>Sector</span><select value={f.sector} onChange={(e) => setF({ ...f, sector: e.target.value })}>{LASMECO_SECTORS.map((s) => <option key={s}>{s}</option>)}</select></label>
        </div>
        <p className="panel-note">Stages start from the {f.sector} template: {(CHAIN_STAGE_TEMPLATES[f.sector] || []).join(' → ')}. All {f.sector}-sector cooperatives join automatically.</p>
        <div className="panel-actions"><button className="btn btn-gold btn-sm" disabled={busy} onClick={create}>{ctx.role === 'accelerator' ? 'Propose' : 'Create'}</button><button className="btn btn-ghost btn-sm" onClick={() => setCreating(false)}>Cancel</button></div>
      </div>}
      {mine.length ? <div className="chain-grid">{mine.map((c) => { const m = chainMetrics(c, coops, members, loans); return (
        <button className="chain-card" key={c.chainId} onClick={() => setSel(c)}>
          <div className="chain-card-top"><h4>{c.name}</h4><StatusChip status={c.status} /></div>
          <p className="chain-card-sec">{c.sector}</p>
          <div className="chain-card-figs"><span><strong>{m.coops.length}</strong> coops</span><span><strong>{m.members.length}</strong> members</span><span><strong>{m.jobs.toLocaleString('en-NG')}</strong> jobs</span></div>
          <p className="chain-card-turn">{fmtNaira(m.turnover)} combined turnover</p>
        </button>) })}</div> : (<>
          <div className="empty"><span className="empty-mark">&#9670;</span><h3>No value chains yet</h3><p>{ctx.coopName ? 'Your cooperative has not been mapped to a value chain yet. It joins automatically once it registers in a chain sector, or applies for LASMECO through an accelerator.' : (canCreate ? 'Chains are normally created automatically, one per LASMECO sector.' : 'MCCTI has not set up any value chains yet.')}</p></div>
          {hasSupabase && !ctx.coopName && <div className="kyc-status pending" style={{ marginTop: '4px' }}>Chains should appear here automatically. If this list stays empty, the database is likely refusing to save them: open Supabase → SQL Editor and re-run <strong>supabase_setup.sql</strong> (it adds permission for the chain:, opp: and snap: keys), then reload.{kvBlocked() ? ' Last error: ' + kvBlocked().message : ''}</div>}
        </>)}
    </div>
  )
}
function LeadershipOverview({ ctx, section, onViewAs }) {
  const [coops, reload] = useRegistry()
  const [sel, setSel] = useState(null)
  if (!coops) return <p className="muted-line">Loading overview…</p>
  if (sel) return <CoopDetail coop={sel} ctx={ctx} onClose={() => { setSel(null); reload() }} onChanged={reload} />
  const pending = coops.filter((c) => c.source !== 'SEKAT' && ['Filed', 'Under review', 'Returned'].includes(c.status))
  const banner = isReviewer(ctx) ? <div className="review-banner"><strong>Review access &middot; read-only</strong><span>{DEMO_DATA ? 'This is sample data, not the live registry \u2014 explore freely, including documents. You can view and export everything, but cannot change records. ' : "You can view the full Leadership workspace and export data, but cannot change records or open members' KYC documents. "}Access expires in {reviewDaysLeft()} day{reviewDaysLeft() === 1 ? '' : 's'} ({new Date(REVIEW_ACCESS_UNTIL).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}).</span></div> : null
  return (
    <div className="ws">
      {banner}
      {section === 'overview' && <ActionQueue />}
      {section === 'overview' && <PortfolioTrend />}
      {section === 'overview' && <AnalyticsDashboard />}
      {section === 'applications' && (<><p className="muted-line">Review each application's documents, then approve or reject. Use search to find any society, including approved ones, to manage guarantee requests and lending readiness. Societies mirrored from SEKAT are managed in SEKAT.</p><CoopTable coops={coops} onOpen={setSel} /></>)}
      {section === 'members' && <MembersAnalytics />}
      {section === 'lasmeco' && <LasmecoOverview ctx={ctx} />}
      {section === 'reports' && <ReportsPanel role="leadership" />}
      {section === 'risk' && <RiskPanel />}
      {section === 'sla' && <GovernanceSLA />}
      {section === 'monitoring' && <PortfolioMonitoring />}
      {section === 'accelerators' && <AcceleratorAppointments ctx={ctx} />}
      {section === 'chains' && <ChainsPanel ctx={ctx} />}
      {section === 'revenue' && <RevenuePanel ctx={ctx} />}
      {section === 'retention' && <RetentionPanel />}
      {section === 'viewas' && <ViewAsSwitcher onViewAs={onViewAs} />}
      {section === 'integrations' && <IntegrationsPanel ctx={ctx} onSynced={reload} />}
    </div>
  )
}
function SocietyWorkspace({ ctx, section }) {
  const [coops, reload] = useRegistry()
  const [mode, setMode] = useState('view') // view | register | returns
  if (!coops) return <p className="muted-line">Loading…</p>
  const mine = ctx.focusId ? coops.find((c) => c.trackingId === ctx.focusId) : coops.find((c) => c.createdBy === ctx.email)
  if (mode === 'register') return <RegistrationForm ctx={ctx} onCancel={() => setMode('view')} onDone={() => { setMode('view'); reload() }} />
  if (mode === 'returns' && mine) return <ReturnsForm coop={mine} ctx={ctx} onCancel={() => setMode('view')} onDone={() => { setMode('view'); reload() }} />
  if (!mine) return (
    <div className="empty">
      <span className="empty-mark">&#9670;</span>
      <h3>Register your cooperative society</h3>
      <p>File your society once. You receive a tracking ID, MCCTI leadership reviews and approves it, and every step is recorded on the audit trail.</p>
      <button className="btn btn-gold" onClick={() => setMode('register')}>Register a society</button>
    </div>
  )
  return (
    <div className="ws">
      {section === 'overview' && <SocietyOverview mine={mine} />}
      {section === 'cooperative' && (<>
        {mine.source !== 'SEKAT' && mine.feeStatus !== 'Paid' && (
          <div className="fee-banner"><span>Registration fee <strong>{fmtNaira(mine.registrationFee || COOP_FEES.registration)}</strong> to join the platform is outstanding.</span><button className="btn btn-gold btn-sm" onClick={async () => { const r = await collectPayment({ email: ctx.email, amountNaira: mine.registrationFee || COOP_FEES.registration, purpose: 'Cooperative registration fee', metadata: { coopId: mine.trackingId } }); if (r.ok) { await payCoopFee(mine.trackingId, ctx); reload() } else if (!r.cancelled) { toast('Payment could not be completed. Please try again.') } }}>{PAYSTACK_PUBLIC ? 'Pay registration fee' : 'Pay now (demo)'}</button></div>
        )}
        <div className="society-card">
          <div className="society-top"><div><h3>{mine.name}</h3><p className="detail-sub">{mine.trackingId} &middot; {mine.areaOffice} area office &middot; {mine.sector}</p></div><div className="detail-chips"><StatusChip status={mine.status} /><StatusChip status={mine.cap15} kind="cap15" /></div></div>
          <div className="society-figs"><div><span className="lf-lab">Members</span><span className="society-fig">{Number(mine.members || 0).toLocaleString('en-NG')}</span></div><div><span className="lf-lab">Contributions</span><span className="society-fig">{fmtNaira(mine.contributions)}</span></div><div><span className="lf-lab">Custodian</span><span className="society-fig sm">{mine.custodian || '\u2014'}</span></div></div>
          <div className="society-actions">
            {mine.source === 'SEKAT' ? <span className="returned-flag" style={{ color: '#2E5C88' }}>Mirrored from SEKAT (read-only). Returns are filed in SEKAT.</span> : <button className="btn btn-gold btn-sm" onClick={() => setMode('returns')}>{mine.returns ? 'Re-file annual returns' : 'File annual returns'}</button>}
            {mine.status === 'Returned' && <span className="returned-flag">Returned for correction. Review the trail and re-file.</span>}
          </div>
        </div>
        <div className="returns-box"><h4>Documents</h4><DocumentsPanel coopId={mine.trackingId} ctx={ctx} canVerify={false} canUpload={mine.source !== 'SEKAT'} /></div>
        <div className="trail-box"><h4>Audit trail</h4><AuditTrail trackingId={mine.trackingId} refreshKey={coops.length} /></div>
      </>)}
      {section === 'lending' && <CoopLendingReadiness coop={mine} ctx={ctx} onChanged={reload} />}
      {section === 'guarantees' && <CoopGuaranteeApprovals coop={mine} ctx={ctx} />}
      {section === 'chains' && <ChainsPanel ctx={{ ...ctx, coopName: mine.name }} />}
      {section === 'savings' && (mine.source !== 'SEKAT' ? <div className="returns-box"><h4>Savings &amp; esusu</h4><CoopEsusu coop={mine} ctx={ctx} /></div> : <p className="muted-line">Savings are managed in SEKAT for mirrored societies.</p>)}
    </div>
  )
}
function CapabilityPreview({ role }) {
  const caps = ROLE_CAPS[role] || ROLE_CAPS.member
  return (
    <div className="ws"><section className="dash-card dash-caps"><h3>Your workspace</h3><p className="dash-card-sub">Tailored to your role. These open as the modules go live from the next stage.</p><ul className="caps">{caps.map((c) => (<li key={c}><span className="cap-tick">&#9670;</span>{c}<span className="cap-soon">Soon</span></li>))}</ul></section></div>
  )
}

/* =============================== STAGE 4 ===============================
   Member & MSME Analytics (QooP layer). QooP is treated exactly like SEKAT:
   a one-way source (QooP -> MCCTI). Members and their MSME profiles flow in,
   are mirrored read-only with a QOOP badge, and an explainable credit score is
   computed. Plus GDPR controls (consent, access, portability, erasure) and a
   leadership "view as" switcher across all users.
   ====================================================================== */

const GENDERS = ['Female', 'Male', 'Prefer not to say']
/* --------------- QooP -> MCCTI integration (one-way analytics) ------------
   QooP (qoop.ng) is a smart cooperative platform: members save and invest, use
   the QooP Wallet (a BNPL / credit wallet), buy on credit via QooP Mall, borrow
   without collateral, pay utilities and transfer funds. QooP therefore holds rich
   financial-behaviour data. It flows one way into MCCTI to power member analytics
   and explainable credit scoring. The sample feed stands in for the live QooP API
   until QOOP_API_URL and QOOP_API_KEY are configured. */
const QOOP_FEED = [
  { ref: 'QP-10231', name: 'Adaeze Okonkwo', coop: 'Ikeja Grand Traders Cooperative', sector: 'Trade', phone: '0803xxxx210', gender: 'Female', kyc: { bvnVerified: true, ninVerified: true }, msme: { monthlyTurnover: 620000, employees: 4, cashFlow: 240000, customerBase: 180, yearsInOperation: 6 }, qoop: { walletActive: true, savingsBalance: 480000, bnplLimit: 300000, creditPurchases: 14, creditOutstanding: 45000, loansTaken: 3, onTimeRepaymentRate: 96, utilityPaymentsMonthly: 8, monthsActive: 34 } },
  { ref: 'QP-10232', name: 'Emeka Balogun', coop: 'Idumota Textile Merchants Coop', sector: 'Trade', phone: '0806xxxx554', gender: 'Male', kyc: { bvnVerified: true, ninVerified: true }, msme: { monthlyTurnover: 1450000, employees: 9, cashFlow: 520000, customerBase: 420, yearsInOperation: 11 }, qoop: { walletActive: true, savingsBalance: 1200000, bnplLimit: 500000, creditPurchases: 40, creditOutstanding: 120000, loansTaken: 5, onTimeRepaymentRate: 99, utilityPaymentsMonthly: 12, monthsActive: 48 } },
  { ref: 'QP-10233', name: 'Ngozi Underwood', coop: 'Surulere United Artisans Coop', sector: 'Artisan', phone: '0705xxxx018', gender: 'Female', kyc: { bvnVerified: true, ninVerified: false }, msme: { monthlyTurnover: 210000, employees: 2, cashFlow: 60000, customerBase: 55, yearsInOperation: 3 }, qoop: { walletActive: true, savingsBalance: 90000, bnplLimit: 80000, creditPurchases: 6, creditOutstanding: 15000, loansTaken: 1, onTimeRepaymentRate: 88, utilityPaymentsMonthly: 4, monthsActive: 18 } },
  { ref: 'QP-10234', name: 'Tunde Salami', coop: 'Ibeju-Lekki Farmers Multipurpose Coop', sector: 'Agriculture', phone: '0813xxxx777', gender: 'Male', kyc: { bvnVerified: false, ninVerified: false }, msme: { monthlyTurnover: 95000, employees: 1, cashFlow: 20000, customerBase: 30, yearsInOperation: 2 }, qoop: { walletActive: false, savingsBalance: 20000, bnplLimit: 0, creditPurchases: 1, creditOutstanding: 0, loansTaken: 0, onTimeRepaymentRate: 0, utilityPaymentsMonthly: 1, monthsActive: 6 } },
  { ref: 'QP-10235', name: 'Blessing Achebe', coop: 'Ikeja Grand Traders Cooperative', sector: 'Trade', phone: '0809xxxx341', gender: 'Female', kyc: { bvnVerified: true, ninVerified: true }, msme: { monthlyTurnover: 880000, employees: 6, cashFlow: 330000, customerBase: 260, yearsInOperation: 8 }, qoop: { walletActive: true, savingsBalance: 620000, bnplLimit: 400000, creditPurchases: 22, creditOutstanding: 60000, loansTaken: 4, onTimeRepaymentRate: 94, utilityPaymentsMonthly: 10, monthsActive: 30 } },
]
const qoopIdFor = (ref) => 'QOOP-' + String(ref).replace(/[^A-Za-z0-9]+/g, '-')
function qoopToMember(r) {
  const now = new Date().toISOString()
  return { memberId: qoopIdFor(r.ref), source: 'QOOP', ref: r.ref, name: r.name, coop: r.coop, sector: r.sector, phone: r.phone, gender: r.gender, kyc: { ...r.kyc, status: (r.kyc.bvnVerified && r.kyc.ninVerified) ? 'Verified' : (r.kyc.bvnVerified || r.kyc.ninVerified) ? 'Partial' : 'Unverified' }, msme: r.msme, qoop: r.qoop || null, createdBy: 'qoop@system', createdAt: now, syncedAt: now }
}
async function listMembers() { return (await kvList('member:')).sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1)) }
async function getMember(id) { return await kvGet('member:' + id) }
async function createMember(rec, ctx) {
  const memberId = 'M-' + String(Math.floor(Math.random() * 1000000)).padStart(6, '0'); const now = new Date().toISOString()
  const bvnVerified = rec.bvnVerified != null ? Boolean(rec.bvnVerified) : Boolean(rec.bvn && rec.bvn.length >= 10)
  const ninVerified = rec.ninVerified != null ? Boolean(rec.ninVerified) : Boolean(rec.nin && rec.nin.length >= 10)
  const record = { memberId, source: 'MCCTI', name: rec.name, coop: rec.coop, sector: rec.sector, phone: rec.phone, gender: rec.gender, dob: rec.dob || '', address: rec.address || '', memberSince: rec.memberSince || '', businessStart: rec.businessStart || '', memberSinceConfirmed: false, kyc: { bvn: rec.bvn ? 'on file' : '', nin: rec.nin ? 'on file' : '', bvnVerified, ninVerified, status: (bvnVerified && ninVerified) ? 'Verified' : (bvnVerified || ninVerified) ? 'Partial' : 'Unverified' }, msme: { monthlyTurnover: Number(rec.monthlyTurnover) || 0, employees: Number(rec.employees) || 0, cashFlow: Number(rec.cashFlow) || 0, customerBase: Number(rec.customerBase) || 0, yearsInOperation: Number(rec.yearsInOperation) || 0, businessStart: rec.businessStart || '' }, businessMonths: rec.businessStart ? monthsBetween(rec.businessStart, Date.now()) : 0, coopMonths: rec.memberSince ? monthsBetween(rec.memberSince, Date.now()) : 0, createdBy: ctx.email, createdAt: now }
  await kvSet('member:' + memberId, record, ctx.uid)
  await notify({ to: ctx.email, title: 'Welcome to MCCTI CoopEco', body: 'Your member profile is set up. You can now apply for LASMECO finance.', event: 'member', phone: rec.phone })
  return record
}
async function syncFromQoop(ctx, silent) {
  const live = await fetchLiveRecords('/api/qoop-sync')
  if (!live && !DEMO_DATA) return 0 // live database: never ingest the sample feed
  const feed = live || QOOP_FEED
  let n = 0
  for (const r of feed) { const rec = qoopToMember(r); await kvSet('member:' + rec.memberId, rec); n++ }
  await kvSet('integration:qoop', { lastSync: new Date().toISOString(), count: n, source: live ? 'QooP live API' : 'QooP sample feed', live: Boolean(live) })
  return n
}

/* explainable, human-reviewable credit score (advisory; not a solely automated
   decision - a cooperative officer approves before it affects LASMECO) */
const BAND_CLASS = { Prime: 'st-approved', Strong: 'st-approved', Fair: 'st-review', Building: 'st-review', 'Thin file': 'st-filed' }
function scoreMember(m) {
  const t = Number(m?.msme?.monthlyTurnover) || 0, emp = Number(m?.msme?.employees) || 0, yrs = Number(m?.msme?.yearsInOperation) || 0, cf = Number(m?.msme?.cashFlow) || 0
  const kyc = (m?.kyc?.bvnVerified ? 1 : 0) + (m?.kyc?.ninVerified ? 1 : 0)
  const q = m?.qoop || null
  const repayRate = q ? Number(q.onTimeRepaymentRate) || 0 : 0, qSav = q ? Number(q.savingsBalance) || 0 : 0
  const cT = Math.min(180, (t / 500000) * 180), cC = Math.min(70, (cf / 300000) * 70), cY = Math.min(70, yrs * 14), cE = Math.min(50, emp * 8), cK = kyc * 50
  const cR = q ? Math.min(60, repayRate / 100 * 60) : 0, cS = q ? Math.min(40, qSav / 500000 * 40) : 0
  let s = Math.max(300, Math.min(850, Math.round(300 + cT + cC + cY + cE + cK + cR + cS)))
  const band = s >= 740 ? 'Prime' : s >= 670 ? 'Strong' : s >= 580 ? 'Fair' : s >= 500 ? 'Building' : 'Thin file'
  const threshold = band === 'Prime' ? 10000000 : band === 'Strong' ? 6000000 : band === 'Fair' ? 3000000 : band === 'Building' ? 1000000 : 300000
  const factors = [
    { label: 'Monthly turnover', display: fmtNaira(t), pct: Math.round(cT / 180 * 100) },
    { label: 'Cash flow buffer', display: fmtNaira(cf), pct: Math.round(cC / 70 * 100) },
    { label: 'Years in operation', display: yrs + ' yr' + (yrs === 1 ? '' : 's'), pct: Math.round(cY / 70 * 100) },
    { label: 'Employees', display: String(emp), pct: Math.round(cE / 50 * 100) },
    { label: 'KYC verified', display: kyc + '/2', pct: Math.round(cK / 100 * 100) },
  ]
  if (q) {
    factors.push({ label: 'QooP repayment history', display: repayRate + '% on time', pct: Math.round(cR / 60 * 100) })
    factors.push({ label: 'QooP savings', display: fmtNaira(qSav), pct: Math.round(cS / 40 * 100) })
  }
  return { score: s, band, threshold, factors }
}

/* -------------------------------- GDPR -------------------------------- */
function downloadJson(filename, obj) { const blob = new Blob([JSON.stringify(obj, null, 2)], { type: 'application/json' }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = filename; a.click(); URL.revokeObjectURL(url) }
/* ---- Reporting & exports ------------------------------------------------- */
function toCSV(rows) {
  if (!rows || !rows.length) return ''
  const headers = Object.keys(rows[0])
  const esc = (v) => { const s = v == null ? '' : String(v); return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s }
  return [headers.join(','), ...rows.map((r) => headers.map((h) => esc(r[h])).join(','))].join('\n')
}
function downloadCSV(filename, rows) {
  if (!rows.length) { toast('Nothing to export yet.'); return }
  const blob = new Blob([toCSV(rows)], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = filename; a.click(); URL.revokeObjectURL(url)
}
async function reportCoops() { return (await listCoops()).map((x) => ({ trackingId: x.trackingId, name: x.name, source: x.source, areaOffice: x.areaOffice, sector: x.sector, status: x.status, cap15: x.cap15, members: x.members || 0, contributions: x.contributions || 0, feeStatus: x.feeStatus || '', registered: x.createdAt ? fmtDate(x.createdAt) : '' })) }
async function reportMembers() { return (await listMembers()).map((x) => { const s = scoreMember(x); return { memberId: x.memberId, name: x.name, source: x.source, coop: x.coop, sector: x.sector, kyc: (x.kyc && x.kyc.status) || '', score: s.score, band: s.band, monthlyTurnover: (x.msme && x.msme.monthlyTurnover) || 0, qoopRepaymentPct: x.qoop ? x.qoop.onTimeRepaymentRate : '', qoopSavings: x.qoop ? x.qoop.savingsBalance : '' } }) }
async function reportLoans() { return (await listLoans()).map((x) => { const rp = (x.schedule || []).length ? loanRepayState(x) : null; return { loanId: x.loanId, member: x.memberName, coop: x.coop, sector: x.sector, status: x.status, requested: x.amountRequested || 0, approved: x.amountApproved || 0, tenorMonths: x.tenorMonths || '', outstanding: rp ? rp.outstanding : '', arrears: rp ? rp.arrears : '' } }) }
async function escrowFigures() {
  const coops = await listCoops(), loans = await listLoans(), wallets = await kvList('wallet:')
  const regFees = coops.filter((c) => c.feeStatus === 'Paid').length * COOP_FEES.registration
  const returnsFees = coops.filter((c) => c.returns).length * COOP_FEES.annualReturns
  const disbursedValue = loans.filter((l) => ['Disbursed', 'Repaying', 'Completed'].includes(l.status)).reduce((a, l) => a + (l.amountApproved || 0), 0)
  const portalFees = Math.round(disbursedValue * 0.025)
  const funding = wallets.reduce((a, w) => a + (w.txns || []).filter((t) => t.type === 'topup').reduce((s, t) => s + (t.amount || 0), 0), 0)
  const walletFees = Math.round(funding * 0.01)
  const boiMgmtFeeAnnual = Math.round(disbursedValue * 0.025)
  const boiMgmtFeeQuarter = Math.round(boiMgmtFeeAnnual / 4)
  const accrued = regFees + returnsFees + portalFees + walletFees
  const sched = loans.filter((l) => (l.schedule || []).length)
  const outstanding = sched.reduce((a, l) => a + loanRepayState(l).outstanding, 0)
  const arrears = sched.reduce((a, l) => a + loanRepayState(l).arrears, 0)
  return { coops, loans, regFees, returnsFees, disbursedValue, portalFees, funding, walletFees, boiMgmtFeeAnnual, boiMgmtFeeQuarter, accrued, outstanding, arrears }
}
async function reportEscrow() {
  const f = await escrowFigures()
  const lines = [['Registration fees', f.regFees], ['Annual returns fees', f.returnsFees], ['Disbursement portal (2.5%)', f.portalFees], ['Wallet fees (1%)', f.walletFees], ['Total accrued', f.accrued]]
  const split = SPV_SPLIT.map(([n, p]) => [n + ' (' + p + '%)', Math.round(f.accrued * p / 100)])
  return [...lines, ...split].map(([item, amount]) => ({ item, amount }))
}
async function generateBoardPack() {
  const f = await escrowFigures()
  const members = await listMembers(), tickets = await listTickets()
  const coops = f.coops, loans = f.loans
  const by = (arr, k, v) => arr.filter((x) => x[k] === v).length
  const money = (n) => '\u20A6' + Number(n || 0).toLocaleString('en-NG')
  const origin = window.location.origin
  const statusRows = ['Approved', 'Under review', 'Filed', 'Returned'].map((s) => `<tr><td>${s}</td><td style="text-align:right">${by(coops, 'status', s)}</td></tr>`).join('')
  const pipeRows = ['Applied', 'In training', 'Shortlisted', 'Coop validated', 'Bank assessment', 'BOI approved', 'Disbursed', 'Repaying', 'Completed'].map((s) => `<tr><td>${s}</td><td style="text-align:right">${by(loans, 'status', s)}</td></tr>`).join('')
  const escrowRows = [['Registration fees', f.regFees], ['Annual returns fees', f.returnsFees], ['Disbursement portal (2.5%)', f.portalFees], ['Wallet fees (1%)', f.walletFees]].map(([k, v]) => `<tr><td>${k}</td><td style="text-align:right">${money(v)}</td></tr>`).join('')
  const splitRows = SPV_SPLIT.map(([n, p]) => `<tr><td>${n} (${p}%)</td><td style="text-align:right">${money(Math.round(f.accrued * p / 100))}</td></tr>`).join('')
  const kpi = (label, val) => `<div style="border:1px solid #dfe6e1;border-radius:8px;padding:12px 14px"><div style="font-size:20px;font-weight:700;color:#17241c">${val}</div><div style="font-size:10px;letter-spacing:.06em;text-transform:uppercase;color:#6b7671;margin-top:3px">${label}</div></div>`
  const html = `<!doctype html><html><head><meta charset="utf-8"><title>MCCTI CoopEco Board Pack</title>
  <style>@page{margin:18mm}body{font-family:Georgia,'Times New Roman',serif;color:#17241c;margin:0;padding:0}
  .wrap{max-width:800px;margin:0 auto}h1{font-size:22px;margin:6px 0}h2{font-size:14px;text-transform:uppercase;letter-spacing:.06em;color:#1C8A4F;border-bottom:2px solid #1C8A4F;padding-bottom:4px;margin-top:26px}
  .head{display:flex;align-items:center;gap:14px;border-bottom:1px solid #dfe6e1;padding-bottom:14px}
  .head img{width:52px;height:52px}.sub{color:#6b7671;font-size:12px}
  table{width:100%;border-collapse:collapse;font-family:Arial,sans-serif;font-size:12px;margin-top:8px}
  td,th{border-bottom:1px solid #eef2ef;padding:7px 8px;text-align:left}
  .kpis{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-top:12px;font-family:Arial,sans-serif}
  .foot{margin-top:30px;color:#6b7671;font-size:10px;font-family:Arial,sans-serif}</style></head>
  <body><div class="wrap">
  <div class="head"><img src="${origin}/lagos-seal.png" alt=""><div><h1>MCCTI CoopEco — Board Pack</h1><div class="sub">Ministry of Commerce, Cooperatives, Trade &amp; Investment, Lagos State &middot; ${fmtDate(new Date().toISOString())}</div></div></div>
  <h2>Executive summary</h2>
  <div class="kpis">${kpi('Cooperative societies', coops.length)}${kpi('Members profiled', members.length)}${kpi('LASMECO disbursed', money(f.disbursedValue))}${kpi('Portfolio outstanding', money(f.outstanding))}${kpi('In arrears', money(f.arrears))}${kpi('Escrow accrued', money(f.accrued))}${kpi('Payments processed', money(f.funding))}${kpi('Open tickets', tickets.filter((t) => t.status !== 'Resolved').length)}${kpi('Approved societies', by(coops, 'status', 'Approved'))}</div>
  <h2>Registration status</h2><table><tr><th>Status</th><th style="text-align:right">Societies</th></tr>${statusRows}</table>
  <h2>LASMECO pipeline</h2><table><tr><th>Stage</th><th style="text-align:right">Loans</th></tr>${pipeRows}</table>
  <h2>Escrow &amp; revenue</h2><table><tr><th>Source</th><th style="text-align:right">Amount</th></tr>${escrowRows}<tr><td><strong>Total accrued</strong></td><td style="text-align:right"><strong>${money(f.accrued)}</strong></td></tr></table>
  <h2>SPV distribution</h2><table><tr><th>Party</th><th style="text-align:right">Amount</th></tr>${splitRows}</table>
  <div class="foot">Generated by MCCTI CoopEco. Figures are drawn from live platform data at the time of generation. For internal Ministry use.</div>
  </div></body></html>`
  const w = window.open('', '_blank')
  if (!w) { toast('Please allow pop-ups to generate the board pack.'); return }
  w.document.write(html); w.document.close(); w.focus(); setTimeout(() => { try { w.print() } catch (e) {} }, 500)
}
function ReportsPanel({ role }) {
  const isLeader = role === 'leadership'
  const [busy, setBusy] = useState('')
  const run = (key, fn) => async () => { setBusy(key); try { await fn() } finally { setBusy('') } }
  const stamp = new Date().toISOString().slice(0, 10)
  return (
    <div className="ws">
      <div className="reports-grid">
        <div className="report-card"><h4>Cooperative registry</h4><p>All societies with status, CAP15, members, contributions and fee status.</p><button className="btn btn-outline btn-sm" disabled={busy === 'coops'} onClick={run('coops', async () => downloadCSV('coop-registry-' + stamp + '.csv', await reportCoops()))}>Download CSV</button></div>
        <div className="report-card"><h4>Members &amp; analytics</h4><p>Profiled members with KYC status, credit score, band and QooP signals.</p><button className="btn btn-outline btn-sm" disabled={busy === 'members'} onClick={run('members', async () => downloadCSV('members-' + stamp + '.csv', await reportMembers()))}>Download CSV</button></div>
        {isLeader && <div className="report-card"><h4>LASMECO portfolio</h4><p>All loans with status, approved amount, outstanding balance and arrears.</p><button className="btn btn-outline btn-sm" disabled={busy === 'loans'} onClick={run('loans', async () => downloadCSV('lasmeco-portfolio-' + stamp + '.csv', await reportLoans()))}>Download CSV</button></div>}
        {isLeader && <div className="report-card"><h4>Escrow &amp; distribution</h4><p>Revenue accrued by stream and the SPV sharing-formula distribution.</p><button className="btn btn-outline btn-sm" disabled={busy === 'escrow'} onClick={run('escrow', async () => downloadCSV('escrow-' + stamp + '.csv', await reportEscrow()))}>Download CSV</button></div>}
      </div>
      {isLeader && <div className="report-boardpack"><div><h4>Board pack (PDF)</h4><p className="muted-line">A printable executive summary: KPIs, registration status, LASMECO pipeline and escrow, drawn from live data. Opens a print view — choose “Save as PDF”.</p></div><button className="btn btn-gold btn-sm" disabled={busy === 'pack'} onClick={run('pack', generateBoardPack)}>Generate board pack</button></div>}
      <p className="panel-note">CSV files open in Excel or Google Sheets. Exports reflect live platform data at the moment of download.</p>
    </div>
  )
}
function maskPhone(p) { const s = String(p || ''); return s.length > 5 ? s.slice(0, 4) + '\u2026' + s.slice(-3) : s }
function computeRiskFlags(members, loans) {
  const flags = []
  const byPhone = {}
  members.forEach((m) => { const p = (m.phone || '').replace(/\s/g, ''); if (p) (byPhone[p] = byPhone[p] || []).push(m) })
  Object.entries(byPhone).forEach(([p, ms]) => { if (ms.length > 1) flags.push({ severity: 'high', type: 'Duplicate phone', title: ms.length + ' members share phone ' + maskPhone(p), detail: ms.map((m) => m.name).join(', ') }) })
  const byName = {}
  members.forEach((m) => { const n = (m.name || '').trim().toLowerCase(); if (n) (byName[n] = byName[n] || []).push(m) })
  Object.values(byName).forEach((ms) => { const coops = Array.from(new Set(ms.map((m) => m.coop))); if (ms.length > 1 && coops.length > 1) flags.push({ severity: 'medium', type: 'Name across cooperatives', title: ms[0].name + ' appears in ' + coops.length + ' cooperatives', detail: coops.join(', ') }) })
  const byMember = {}
  loans.forEach((l) => { const k = l.memberId || l.memberName; if (k) (byMember[k] = byMember[k] || []).push(l) })
  Object.values(byMember).forEach((ls) => { const active = ls.filter((l) => !['Declined', 'Completed', 'Default'].includes(l.status)); if (active.length > 1) flags.push({ severity: 'medium', type: 'Multiple applications', title: ls[0].memberName + ' has ' + active.length + ' active LASMECO applications', detail: active.map((l) => l.loanId + ' (' + l.status + ')').join(', ') }) })
  loans.forEach((l) => { if ((l.schedule || []).length) { const rp = loanRepayState(l); if (l.status === 'Default') flags.push({ severity: 'high', type: 'Default', title: l.memberName + ' \u2014 loan ' + l.loanId + ' in default', detail: 'Outstanding ' + fmtNaira(rp.outstanding) }); else if (rp.arrears > 0) flags.push({ severity: 'medium', type: 'Arrears', title: l.memberName + ' \u2014 ' + l.loanId + ' in arrears', detail: fmtNaira(rp.arrears) + ' overdue' }) } })
  loans.forEach((l) => { const m = members.find((x) => x.memberId === l.memberId || x.name === l.memberName); const turnover = m && m.msme ? m.msme.monthlyTurnover : 0; const req = l.amountRequested || 0; if (turnover > 0 && req > turnover * 18 && ['Applied', 'In training', 'Shortlisted'].includes(l.status)) flags.push({ severity: 'low', type: 'Exposure', title: l.memberName + ' requests ' + fmtNaira(req), detail: 'About ' + Math.round(req / turnover) + '\u00d7 monthly turnover (' + fmtNaira(turnover) + ')' }) })
  const order = { high: 0, medium: 1, low: 2 }
  return flags.sort((a, b) => order[a.severity] - order[b.severity])
}
function RiskPanel() {
  const [data, setData] = useState(null)
  useEffect(() => { Promise.all([listMembers(), listLoans()]).then(([m, l]) => setData(computeRiskFlags(m, l))) }, [])
  if (!data) return <p className="muted-line">Assessing risk…</p>
  const bySev = (s) => data.filter((f) => f.severity === s).length
  return (
    <div className="ws">
      <div className="statgrid">
        <div className="stat"><span className="stat-fig">{data.length}</span><span className="stat-lab">Total flags</span></div>
        <div className="stat"><span className="stat-fig" style={bySev('high') ? { color: 'var(--err)' } : undefined}>{bySev('high')}</span><span className="stat-lab">High</span></div>
        <div className="stat"><span className="stat-fig">{bySev('medium')}</span><span className="stat-lab">Medium</span></div>
        <div className="stat"><span className="stat-fig">{bySev('low')}</span><span className="stat-lab">Low</span></div>
      </div>
      {data.length ? <div className="risk-list">{data.map((f, i) => (<div className="risk-item" key={i}><span className={cx('chip', f.severity === 'high' ? 'st-returned' : f.severity === 'medium' ? 'st-review' : 'st-filed')}>{f.severity}</span><div className="risk-body"><strong>{f.title}</strong><p>{f.type} &middot; {f.detail}</p></div></div>))}</div> : <div className="empty"><span className="empty-mark">&#9670;</span><h3>No risk flags</h3><p>No duplicate identifiers, arrears or anomalies detected in the current data.</p></div>}
      <p className="panel-note">Heuristic monitoring on duplicate phones, repeated names, multiple applications, arrears and exposure. Production-grade duplicate BVN/NIN detection should run server-side through the KYC provider (numbers are not stored in the browser). Flags are advisory and warrant human review — not an accusation.</p>
    </div>
  )
}
const SLA_TARGETS = { approval: 14, grievance: 3, lasmeco: 30 }
function daysBetween(a, b) { const d = (new Date(b).getTime() - new Date(a).getTime()) / 86400000; return isFinite(d) ? d : 0 }
function slaMetrics(coops, tickets, loans) {
  const nowISO = new Date().toISOString()
  const avg = (arr) => arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0
  const pct = (n, d) => d ? Math.round(n / d * 100) : 100
  const decided = coops.filter((c) => ['Approved', 'Returned'].includes(c.status) && c.source !== 'SEKAT')
  const appDays = decided.map((c) => daysBetween(c.createdAt, c.updatedAt)).filter((d) => d >= 0)
  const pending = coops.filter((c) => ['Filed', 'Under review'].includes(c.status) && c.source !== 'SEKAT')
  const pendingBreach = pending.filter((c) => daysBetween(c.createdAt, nowISO) > SLA_TARGETS.approval)
  const resolved = tickets.filter((t) => t.status === 'Resolved')
  const resDays = resolved.map((t) => daysBetween(t.createdAt, t.updatedAt)).filter((d) => d >= 0)
  const openT = tickets.filter((t) => t.status !== 'Resolved')
  const openBreach = openT.filter((t) => daysBetween(t.createdAt, nowISO) > SLA_TARGETS.grievance)
  const disbursed = loans.filter((l) => ['Disbursed', 'Repaying', 'Completed'].includes(l.status))
  const disbDays = disbursed.map((l) => daysBetween(l.createdAt, l.disbursedAt || l.updatedAt)).filter((d) => d >= 0)
  const inPipe = loans.filter((l) => !['Disbursed', 'Repaying', 'Completed', 'Declined', 'Default'].includes(l.status))
  const pipeBreach = inPipe.filter((l) => daysBetween(l.createdAt, nowISO) > SLA_TARGETS.lasmeco)
  const breaching = [
    ...pendingBreach.map((c) => ({ kind: 'Approval', label: c.name + ' (' + c.trackingId + ')', age: Math.round(daysBetween(c.createdAt, nowISO)), target: SLA_TARGETS.approval })),
    ...openBreach.map((t) => ({ kind: 'Grievance', label: t.subject + ' (' + t.ticketId + ')', age: Math.round(daysBetween(t.createdAt, nowISO)), target: SLA_TARGETS.grievance })),
    ...pipeBreach.map((l) => ({ kind: 'LASMECO', label: l.memberName + ' (' + l.loanId + ', ' + l.status + ')', age: Math.round(daysBetween(l.createdAt, nowISO)), target: SLA_TARGETS.lasmeco })),
  ].sort((a, b) => (b.age - b.target) - (a.age - a.target))
  return {
    approval: { avg: avg(appDays), within: pct(appDays.filter((d) => d <= SLA_TARGETS.approval).length, appDays.length), decided: decided.length, pending: pending.length, breach: pendingBreach.length },
    grievance: { avg: avg(resDays), within: pct(resDays.filter((d) => d <= SLA_TARGETS.grievance).length, resDays.length), resolved: resolved.length, open: openT.length, breach: openBreach.length },
    lasmeco: { avg: avg(disbDays), within: pct(disbDays.filter((d) => d <= SLA_TARGETS.lasmeco).length, disbDays.length), disbursed: disbursed.length, inPipe: inPipe.length, breach: pipeBreach.length },
    breaching,
  }
}
function SLABlock({ title, target, unit, m }) {
  return (
    <section className="dash-card"><h3>{title}</h3>
      <div className="sla-figs">
        <div><span className="sla-fig">{m.avg ? m.avg.toFixed(1) : '\u2014'}</span><span className="sla-lab">Avg {unit}</span></div>
        <div><span className="sla-fig" style={m.within < 80 ? { color: 'var(--gold-soft)' } : undefined}>{m.within}%</span><span className="sla-lab">Within {target}{unit === 'days' ? 'd' : ''}</span></div>
        <div><span className="sla-fig" style={m.breach ? { color: 'var(--err)' } : undefined}>{m.breach}</span><span className="sla-lab">Breaching</span></div>
      </div>
    </section>
  )
}
function GovernanceSLA() {
  const [d, setD] = useState(null)
  useEffect(() => { Promise.all([listCoops(), listTickets(), listLoans()]).then(([c, t, l]) => setD(slaMetrics(c, t, l))) }, [])
  if (!d) return <p className="muted-line">Computing service levels…</p>
  return (
    <div className="ws">
      <div className="dash-grid">
        <SLABlock title="Cooperative approvals" target={SLA_TARGETS.approval} unit="days" m={d.approval} />
        <SLABlock title="Grievance resolution" target={SLA_TARGETS.grievance} unit="days" m={d.grievance} />
        <SLABlock title="LASMECO to disbursement" target={SLA_TARGETS.lasmeco} unit="days" m={d.lasmeco} />
      </div>
      <h3 className="ws-h" style={{ marginTop: '24px' }}>Breaching service levels now</h3>
      {d.breaching.length ? <div className="risk-list">{d.breaching.map((x, i) => (<div className="risk-item" key={i}><span className="chip st-returned">{x.age}d</span><div className="risk-body"><strong>{x.label}</strong><p>{x.kind} &middot; target {x.target} days &middot; {x.age - x.target} days over</p></div></div>))}</div> : <div className="empty"><span className="empty-mark">&#9670;</span><h3>All within service levels</h3><p>No approvals, grievances or LASMECO cases are past target.</p></div>}
      <p className="panel-note">Targets: approvals {SLA_TARGETS.approval} days, grievances {SLA_TARGETS.grievance} days, LASMECO {SLA_TARGETS.lasmeco} days. Measured from first record to decision or resolution. Adjust targets in SLA_TARGETS.</p>
    </div>
  )
}
async function exportMyData(ctx) {
  const coops = (await listCoops()).filter((c) => c.createdBy === ctx.email)
  const members = (await listMembers()).filter((m) => m.createdBy === ctx.email)
  const activity = (await listAudit()).filter((a) => a.by === ctx.name)
  return { exportedAt: new Date().toISOString(), controller: 'Ministry of Commerce, Cooperatives, Trade & Investment, Lagos State', account: { email: ctx.email, name: ctx.name, role: ctx.role }, cooperatives: coops, members, activity }
}
async function deleteMyData(ctx) {
  const members = (await listMembers()).filter((m) => m.createdBy === ctx.email)
  for (const m of members) await kvDelete('member:' + m.memberId)
  if (supa) { await kvDelete('profile:' + ctx.uid) } else { const users = LS.get('coopeco.users', {}); delete users[ctx.email]; LS.set('coopeco.users', users) }
}
const consentGiven = () => LS.get('coopeco.consent', false)
const setConsent = () => LS.set('coopeco.consent', true)

/* ---------------------------- GDPR components -------------------------- */
function ConsentBanner({ onOpenPrivacy }) {
  const [show, setShow] = useState(!consentGiven())
  if (!show) return null
  return (
    <div className="consent" role="dialog" aria-label="Data protection">
      <p>We process personal data to administer cooperatives and, where you ask for finance, to assess eligibility. We keep it to what is needed and you can access or erase your data at any time.</p>
      <div className="consent-actions">
        <button className="link-inline" onClick={onOpenPrivacy}>Privacy notice</button>
        <button className="btn btn-gold btn-sm" onClick={() => { setConsent(); setShow(false) }}>Accept</button>
      </div>
    </div>
  )
}
function LoanCalculator() {
  const [amt, setAmt] = useState('1000000'), [type, setType] = useState(LOAN_TYPES[0])
  const v = loanVariant(type)
  const a = Number(amt) || 0, t = v.tenor
  const sched = a > 0 ? buildSchedule(a, t, 9, new Date().toISOString(), v.moratorium) : []
  const firstPrincipalRow = sched.find((r) => !r.moratorium)
  const monthly = firstPrincipalRow ? firstPrincipalRow.amount : 0
  const morPay = sched.length ? sched[0].amount : 0
  const total = sched.reduce((s, r) => s + r.amount, 0)
  const b = loanBreakdown(a)
  return (
    <div className="returns-box"><h4>LASMECO repayment calculator</h4>
      <div className="calc-row"><label className="field"><span>Amount (₦)</span><input type="number" value={amt} onChange={(e) => setAmt(e.target.value)} /></label><label className="field"><span>Product</span><select value={type} onChange={(e) => setType(e.target.value)}>{LOAN_TYPES.map((x) => <option key={x}>{x}</option>)}</select></label></div>
      <div className="statgrid"><div className="stat"><span className="stat-fig">{fmtNaira(morPay)}</span><span className="stat-lab">Moratorium months ({v.moratorium}) — interest only</span></div><div className="stat"><span className="stat-fig">{fmtNaira(monthly)}</span><span className="stat-lab">Then monthly (principal + interest)</span></div><div className="stat"><span className="stat-fig">{fmtNaira(total)}</span><span className="stat-lab">Total repayable over {t} months</span></div><div className="stat"><span className="stat-fig">{fmtNaira(b.netToBorrower)}</span><span className="stat-lab">Net to you after fees</span></div></div>
      <p className="panel-note">Indicative only, at 9% reducing balance with a {v.moratorium}-month principal moratorium (interest-only), then equal principal over the remaining term. One-off fees: ₦200,000 Accelerator and 1% BOI appraisal. Not a loan offer.</p>
    </div>
  )
}
function verifyStanding(s) { return s === 'Approved' ? 'Registered \u2014 approved' : ['Filed', 'Under review'].includes(s) ? 'Registration under review' : s === 'Returned' ? 'Returned for correction' : (s || '\u2014') }
/* Public directory. Reads ONLY chain: records, which hold no personal or financial detail.
   Aggregate counts are denormalised onto the chain by refreshChainStats() when staff view
   the chains, so the public page never touches the cooperative or member tables. */
async function refreshChainStats(chains, coops, members, loans) {
  for (const c of chains) {
    const m = chainMetrics(c, coops, members, loans)
    const next = { coops: m.coops.length, members: m.members.length, jobs: m.jobs, turnover: m.turnover }
    const prev = c.publicStats || {}
    if (prev.coops !== next.coops || prev.members !== next.members || prev.jobs !== next.jobs || prev.turnover !== next.turnover) {
      try { await kvSet('chain:' + c.chainId, { ...c, publicStats: next }) } catch (e) { /* not fatal */ }
    }
  }
}
function PublicChains() {
  const [chains, setChains] = useState(null)
  useEffect(() => { listChains().then((cs) => setChains(cs.filter((c) => c.status === 'Active'))).catch(() => setChains([])) }, [])
  if (!chains || !chains.length) return null
  return (
    <section className="pub-chains">
      <h2 className="pub-chains-h">Value chain cooperatives</h2>
      <p className="pub-chains-sub">Registered cooperatives are organised into value chains so members can trade, buy inputs together and supply anchor buyers. If you are a buyer, supplier or investor looking to work with a chain, contact the Ministry.</p>
      <div className="chain-grid">{chains.map((c) => (
        <div className="chain-card static" key={c.chainId}>
          <div className="chain-card-top"><h4>{c.name}</h4></div>
          <p className="chain-card-sec">{c.sector}</p>
          <p className="pub-stages">{(c.stages || []).join(' → ')}</p>
          {c.publicStats && c.publicStats.coops ? <div className="chain-card-figs"><span><strong>{c.publicStats.coops}</strong> cooperatives</span><span><strong>{Number(c.publicStats.members || 0).toLocaleString('en-NG')}</strong> members</span><span><strong>{Number(c.publicStats.jobs || 0).toLocaleString('en-NG')}</strong> jobs</span></div> : <p className="muted-line sm">Open to cooperatives in this sector.</p>}
          {c.anchor ? <p className="chain-card-turn">Anchor buyer: {c.anchor}</p> : null}
        </div>))}</div>
      <p className="panel-note">Chain listings show scale only. Member names, cooperative finances and contact details are not published.</p>
    </section>
  )
}
function PublicVerify({ onBack }) {
  const [q, setQ] = useState(''), [results, setResults] = useState(null), [busy, setBusy] = useState(false)
  const search = async () => {
    const term = q.trim(); if (!term) return
    setBusy(true)
    const all = await listCoops()
    const t = term.toLowerCase()
    const found = all.filter((c) => (c.trackingId && c.trackingId.toLowerCase() === t) || (c.regNo && c.regNo.toLowerCase() === t) || (c.name && c.name.toLowerCase().includes(t)))
    setResults(found); setBusy(false)
  }
  return (
    <main className="verify-page"><div className="verify-inner">
      <p className="eyebrow"><span className="eb-dot" />Public register</p>
      <h1 className="verify-h">Verify a cooperative society</h1>
      <p className="verify-sub">Check whether a cooperative is registered with the Lagos State Ministry of Commerce, Cooperatives, Trade &amp; Investment. Search by registration or tracking number, or by name.</p>
      <div className="verify-search"><input value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && search()} placeholder="e.g. LAG-CS-24-000123 or society name" /><button className="btn btn-gold" onClick={search} disabled={busy}>{busy ? 'Searching\u2026' : 'Verify'}</button></div>
      {results && (results.length ? (
        <div className="verify-results">{results.slice(0, 8).map((c) => (
          <div className="verify-card" key={c.trackingId}>
            <div className="verify-card-top"><div><h3>{c.name}</h3><p className="detail-sub">{c.trackingId}{c.regNo ? ' \u00b7 ' + c.regNo : ''} · {c.areaOffice} area office · {c.sector}</p></div><StatusChip status={c.status} /></div>
            <div className="verify-facts"><div><span>Standing</span><strong>{verifyStanding(c.status)}</strong></div><div><span>CAP15 compliance</span><strong>{c.cap15 || '\u2014'}</strong></div><div><span>Register source</span><strong>{c.source === 'SEKAT' ? 'SEKAT legacy register' : 'MCCTI register'}</strong></div></div>
          </div>))}</div>
      ) : <div className="verify-empty">No cooperative found for “{q}”. Check the number or name, or contact the Ministry to confirm.</div>)}
      <p className="panel-note">This public check shows registration standing only. It does not disclose members, bank or financial details. It is not a substitute for official written confirmation from the Ministry.</p>
      <PublicChains />
      <button className="link-back" onClick={onBack}>&larr; Back to home</button>
    </div></main>
  )
}
function PrivacyNotice({ onBack }) {
  const rows = [
    ['Who we are', 'The Ministry of Commerce, Cooperatives, Trade and Investment, Lagos State Government, is the data controller. SEKAT and QooP act as processors under agreement.'],
    ['What we collect', 'Account details, cooperative registration and governance records, and, for members, KYC identifiers and MSME profile data (turnover, employees, cash flow, sector) used for credit assessment.'],
    ['Why, and our lawful basis', 'Public task (cooperative regulation under the Lagos CAP15 Cooperative Law) and your consent for credit assessment. We use only what is needed for each purpose.'],
    ['Automated decisions', 'Credit scoring is explainable and advisory only. A cooperative officer reviews before any decision that affects access to LASMECO finance. You may request that review.'],
    ['Your rights', 'Access, rectification, erasure, portability, restriction and objection. Use Download my data and Delete my data in your dashboard, or contact the Ministry.'],
    ['Sharing and transfers', 'Data flows one way from SEKAT and QooP into MCCTI. It is not sold. Any transfer is governed by the relevant data-sharing agreement and NDPR.'],
    ['Retention', 'Institutional cooperative records are retained under the Ministry’s public task. Personal member data is kept only as long as needed and then erased.'],
  ]
  return (
    <main className="flow"><div className="flow-inner">
      <button className="flow-back" onClick={onBack}>&larr; Back</button>
      <p className="eyebrow"><span className="eb-dot" />Data protection</p>
      <h1 className="flow-title">Privacy notice</h1>
      <p className="flow-sub">How MCCTI CoopEco handles personal data, aligned with the NDPR and GDPR principles. This is a plain-language summary, not legal advice.</p>
      <div className="privacy">{rows.map(([h, b]) => (<div className="privacy-row" key={h}><h4>{h}</h4><p>{b}</p></div>))}</div>
    </div></main>
  )
}
function DataControls({ ctx, onDeleted }) {
  const [busy, setBusy] = useState(false), [confirm, setConfirm] = useState(false)
  const doExport = async () => { const data = await exportMyData(ctx); downloadJson('my-coopeco-data.json', data) }
  const doDelete = async () => { setBusy(true); await deleteMyData(ctx); setBusy(false); onDeleted() }
  return (
    <section className="dash-card data-controls">
      <h3>Privacy &amp; your data</h3>
      <p className="dash-card-sub">You can take a copy of your data or erase your personal data at any time (GDPR access, portability and erasure).</p>
      <div className="dc-actions">
        <button className="btn btn-outline btn-sm" onClick={doExport}>Download my data</button>
        {!confirm ? <button className="btn btn-outline btn-sm" onClick={() => setConfirm(true)}>Delete my data</button> : (
          <span className="dc-confirm">Erase personal data and account?<button className="btn btn-outline btn-sm" onClick={doDelete} disabled={busy}>{busy ? 'Erasing…' : 'Confirm'}</button><button className="link-inline" onClick={() => setConfirm(false)}>Cancel</button></span>
        )}
      </div>
      <p className="panel-note">Institutional cooperative records are retained under the Ministry’s public task. Personal member data is erased. This is not legal advice.</p>
    </section>
  )
}

/* ---------------------------- QooP + members -------------------------- */
function QoopPanel({ ctx, onSynced }) {
  const [info, setInfo] = useState(null), [busy, setBusy] = useState(false)
  const load = () => getIntegration('qoop').then(setInfo)
  useEffect(() => { load() }, [])
  const run = async () => { setBusy(true); await syncFromQoop(ctx, false); await load(); setBusy(false); onSynced && onSynced() }
  return (
    <div className="sekat">
      <div className="sekat-flow"><div className="node src qoop">QooP<span>Member &amp; MSME analytics source</span></div><div className="flow-arrow">&rarr;<span>one-way</span></div><div className="node dst">MCCTI CoopEco<span>Unified analytics</span></div></div>
      <div className="sekat-status"><div className="status-row"><span>Connection</span><span className={cx('pill', info?.live ? 'ok' : 'muted')}>{info?.live ? 'Live API' : 'Sample feed' + (hasSupabase ? '' : ' (demo)')}</span></div><div className="status-row"><span>Last sync</span><span className="mono">{info?.lastSync ? fmtDate(info.lastSync) : 'Never'}</span></div><div className="status-row"><span>Members ingested</span><span className="mono">{info?.count ?? 0}</span></div></div>
      <button className="btn btn-gold btn-sm" onClick={run} disabled={busy}>{busy ? 'Syncing…' : 'Run QooP sync'}</button>
      <p className="panel-note">Data flows one way, from QooP into MCCTI. Synced members are read-only here. When QOOP_API_URL and QOOP_API_KEY are set, the platform pulls live QooP analytics automatically; until then it ingests a representative sample mirroring the QooP dataset: KYC, turnover and cash flow, plus QooP-held financial behaviour — wallet and BNPL usage, savings, credit purchases, borrowing and on-time repayment history. Compliance: KYC and NDPR/GDPR handling governed by the QooP data-sharing agreement. This is not legal advice.</p>
    </div>
  )
}
function parseCSV(text) {
  const rows = []; let row = [], field = '', inQ = false
  for (let i = 0; i < text.length; i++) {
    const c = text[i]
    if (inQ) { if (c === '"') { if (text[i + 1] === '"') { field += '"'; i++ } else inQ = false } else field += c }
    else if (c === '"') inQ = true
    else if (c === ',') { row.push(field); field = '' }
    else if (c === '\n' || c === '\r') { if (c === '\r' && text[i + 1] === '\n') i++; row.push(field); field = ''; if (row.some((x) => x !== '')) rows.push(row); row = [] }
    else field += c
  }
  if (field !== '' || row.length) { row.push(field); if (row.some((x) => x !== '')) rows.push(row) }
  return rows
}
function csvToObjects(text) { const rows = parseCSV(text); if (rows.length < 2) return []; const headers = rows[0].map((h) => h.trim()); return rows.slice(1).map((r) => { const o = {}; headers.forEach((h, i) => { o[h] = (r[i] || '').trim() }); return o }) }
async function bulkImportCoops(objs, ctx) {
  let n = 0
  for (const o of objs) {
    if (!o.name) continue
    const id = genTrackingId(), now = new Date().toISOString()
    await kvSet('coop:' + id, { trackingId: id, source: 'Bulk import', regNo: o.regNo || null, name: o.name, areaOffice: AREA_OFFICES.includes(o.areaOffice) ? o.areaOffice : AREA_OFFICES[1], sector: o.sector || 'Trade', custodian: o.custodian || '', members: Number(o.members) || 0, contributions: Number(o.contributions) || 0, status: o.status || 'Filed', cap15: 'Under audit', returns: null, feeStatus: '', createdBy: ctx.email, createdAt: now, updatedAt: now })
    await addAudit({ trackingId: id, action: 'Imported via bulk upload', by: ctx.name, role: ctx.role, note: '' })
    n++
  }
  return n
}
async function bulkImportMembers(objs, ctx) {
  let n = 0
  for (const o of objs) {
    if (!o.name) continue
    const id = 'M-' + String(Math.floor(Math.random() * 1000000)).padStart(6, '0'), now = new Date().toISOString()
    await kvSet('member:' + id, { memberId: id, source: 'Bulk import', name: o.name, coop: o.coop || '', sector: o.sector || 'Trade', phone: o.phone || '', gender: o.gender || '', kyc: { bvnVerified: false, ninVerified: false, status: 'Unverified' }, msme: { monthlyTurnover: Number(o.monthlyTurnover) || 0, employees: Number(o.employees) || 0, cashFlow: Number(o.cashFlow) || 0, customerBase: Number(o.customerBase) || 0, yearsInOperation: Number(o.yearsInOperation) || 0 }, createdBy: ctx.email, createdAt: now })
    n++
  }
  return n
}
function BulkImport({ ctx, onDone }) {
  const [type, setType] = useState('coops'), [text, setText] = useState(''), [objs, setObjs] = useState(null), [busy, setBusy] = useState(false), [done, setDone] = useState(null)
  const templates = { coops: 'name,areaOffice,sector,custodian,members,contributions\nIkeja Traders Coop,Ikeja,Trade,F. Ade,120,4500000', members: 'name,coop,sector,phone,monthlyTurnover,employees,cashFlow,customerBase,yearsInOperation\nJane Doe,Ikeja Traders Coop,Trade,08030000000,350000,3,120000,80,4' }
  const onFile = (e) => { const f = e.target.files[0]; if (!f) return; const r = new FileReader(); r.onload = () => setText(String(r.result)); r.readAsText(f) }
  const valid = objs ? objs.filter((o) => o.name) : []
  const doImport = async () => { if (!valid.length) return; setBusy(true); const n = type === 'coops' ? await bulkImportCoops(valid, ctx) : await bulkImportMembers(valid, ctx); setDone(n); setObjs(null); setText(''); setBusy(false); onDone && onDone() }
  return (
    <div className="sekat">
      <div className="bulk-type"><button className={cx('seg', type === 'coops' && 'on')} onClick={() => { setType('coops'); setObjs(null); setDone(null) }}>Cooperatives</button><button className={cx('seg', type === 'members' && 'on')} onClick={() => { setType('members'); setObjs(null); setDone(null) }}>Members</button></div>
      <div className="bulk-actions"><input type="file" accept=".csv" onChange={onFile} /><button className="link-inline" onClick={() => { setText(templates[type]); setDone(null) }}>Load template</button></div>
      <textarea className="bulk-text" rows={6} value={text} onChange={(e) => setText(e.target.value)} placeholder={'Paste CSV with headers: ' + templates[type].split('\n')[0]} />
      <div className="panel-actions"><button className="btn btn-outline btn-sm" onClick={() => { setObjs(csvToObjects(text)); setDone(null) }} disabled={!text.trim()}>Preview</button>{valid.length ? <button className="btn btn-gold btn-sm" onClick={doImport} disabled={busy}>{busy ? 'Importing\u2026' : 'Import ' + valid.length + ' ' + type}</button> : null}</div>
      {objs ? <p className="muted-line">{valid.length} valid row{valid.length === 1 ? '' : 's'}{objs.length - valid.length ? ', ' + (objs.length - valid.length) + ' skipped (missing name)' : ''}.</p> : null}
      {valid.length ? <div className="rtable-wrap"><table className="rtable"><thead><tr>{Object.keys(valid[0]).slice(0, 6).map((h) => <th key={h}>{h}</th>)}</tr></thead><tbody>{valid.slice(0, 5).map((o, i) => <tr key={i}>{Object.keys(valid[0]).slice(0, 6).map((h) => <td key={h}>{o[h]}</td>)}</tr>)}</tbody></table></div> : null}
      {done != null ? <p className="panel-note" style={{ color: 'var(--green)' }}>Imported {done} record{done === 1 ? '' : 's'}. They now appear in the registry{type === 'members' ? ' and member analytics' : ''}.</p> : null}
      <p className="panel-note">Bulk import creates new records tagged “Bulk import”. Imported members are Unverified until KYC is run; imported cooperatives pass through the normal approval flow. De-duplicate and check the Risk &amp; fraud view before large batches.</p>
    </div>
  )
}
const SEED_MARKERS = ['integration:seed-v12', 'integration:accel-v8', 'integration:loandocs-v4', 'integration:snapshots-v1']
/* Wipes the seed markers and re-runs seeding, so corrected sample data lands on a database
   that was seeded by an older build. Only offered while DEMO_DATA is on. */
async function rebuildDemoData() {
  for (const k of SEED_MARKERS) { try { await kvDelete(k) } catch (e) { /* continue */ } }
  return ensureSeedData()
}
async function removeDemoData() {
  try { await clearPriorSeed() } catch (e) { /* best-effort */ }
  for (const k of SEED_MARKERS) { try { await kvDelete(k) } catch (e) { /* continue */ } }
}
function DemoDataPanel({ ctx }) {
  const [busy, setBusy] = useState(false), [dbSeed, setDbSeed] = useState('checking…')
  const CURRENT_SEED = (SEED_MARKERS.find((m) => m.indexOf('seed-v') > -1) || 'integration:seed-v12').replace('integration:', '')
  useEffect(() => { (async () => { const marks = []; for (let v = 20; v >= 1; v--) { if (await kvGet('integration:seed-v' + v)) { marks.push('seed-v' + v) } } setDbSeed(marks[0] || 'none') })() }, [])
  if (isReviewer(ctx)) return null
  const stale = dbSeed !== 'none' && dbSeed !== CURRENT_SEED && dbSeed !== 'checking…'
  const rebuild = async () => {
    if (!(await confirmDialog('Rebuild the sample data? Existing demo records are replaced with a fresh, corrected set. Records created by real users are not touched.', { confirmLabel: 'Rebuild' }))) return
    setBusy(true)
    try { await rebuildDemoData(); toast('Sample data rebuilt. Reloading…', 'success'); setTimeout(() => window.location.reload(), 900) } catch (e) { toast('Rebuild failed: ' + (e.message || 'unknown error'), 'error'); setBusy(false) }
  }
  const remove = async () => {
    if (!(await confirmDialog('Delete every sample record from this database? Cooperatives, members and loans created by real users are kept. This cannot be undone.', { danger: true, confirmLabel: 'Delete sample data' }))) return
    setBusy(true)
    try { await removeDemoData(); toast('Sample data removed. Reloading…', 'success'); setTimeout(() => window.location.reload(), 900) } catch (e) { toast('Removal failed: ' + (e.message || 'unknown error'), 'error'); setBusy(false) }
  }
  return (
    <div><h3 className="ws-h">Sample data</h3>
      <div className="returns-box">
        <div className={cx('kyc-status', DEMO_DATA ? 'pending' : 'ok')}>Sample data is {DEMO_DATA ? 'ON' : 'OFF'} · {hasSupabase ? 'connected to your database' : 'demo mode, no database connected'}{hasSupabase ? (DEMO_DATA ? ' · VITE_DEMO_DATA=true' : ' · VITE_DEMO_DATA is not set') : ''} · sample set: {dbSeed}</div>
        {stale && DEMO_DATA ? <div className="kyc-status pending" style={{ marginTop: '8px' }}>Your saved sample data ({dbSeed}) is older than this build ({CURRENT_SEED}). Click <strong>Rebuild sample data</strong> below to refresh it — that is what brings the newest demo records (e.g. accelerator ratings and earnings) to life.</div> : null}
        {stale && !DEMO_DATA ? <div className="kyc-status pending" style={{ marginTop: '8px' }}>Your saved sample data ({dbSeed}) is older than this build ({CURRENT_SEED}), but sample data is OFF so it will not refresh. Set VITE_DEMO_DATA=true in Vercel and redeploy, then use Rebuild sample data.</div> : null}
        {DEMO_DATA ? (<>
          <p className="muted-line">Demo records are seeded once and then left alone. If this database was seeded by an older build, some sample records may be incomplete — for example members with no LASMECO sector, which leaves the Health, Tourism and Digital Economy value chains empty. Rebuilding replaces the demo set with a corrected one.</p>
          <div className="panel-actions"><button className="btn btn-outline btn-sm" disabled={busy} onClick={rebuild}>{busy ? 'Working…' : 'Rebuild sample data'}</button></div>
        </>) : (<>
          <p className="muted-line">The platform will not create any demo records. Note that demo records already saved in this database are <strong>not</strong> removed by switching sample data off — they stay until deleted.</p>
          <p className="muted-line">To refresh or correct the sample set (for example to populate the Health value chain), add <strong>VITE_DEMO_DATA</strong> = <strong>true</strong> in Vercel → Settings → Environment Variables, redeploy, then return here and use “Rebuild sample data”.</p>
          <div className="panel-actions"><button className="btn btn-outline btn-sm" disabled={busy} onClick={remove}>{busy ? 'Working…' : 'Remove sample data from this database'}</button></div>
        </>)}
        <p className="panel-note">Neither action touches cooperatives, members or loans created by real users on the platform.</p>
      </div>
    </div>
  )
}
function IntegrationsPanel({ ctx, onSynced }) {
  return (<div className="ws"><p className="muted-line">SEKAT and QooP sync automatically each time the platform loads (one-way, read-only). You can also trigger a manual re-sync below.</p><div><h3 className="ws-h">SEKAT integration &middot; registry</h3><SekatPanel ctx={ctx} onSynced={onSynced} /></div><div><h3 className="ws-h">QooP integration &middot; member analytics</h3><QoopPanel ctx={ctx} onSynced={onSynced} /></div><div><h3 className="ws-h">Bulk import &middot; migrate from CSV</h3><BulkImport ctx={ctx} onDone={onSynced} /></div><DemoDataPanel ctx={ctx} /></div>)
}
function CreditScoreCard({ m }) {
  const r = scoreMember(m)
  return (
    <div className="score-card">
      <div className="score-head">
        <div className="score-num"><span className="score-val">{r.score}</span><span className="score-scale">/ 850</span></div>
        <div className="score-meta"><StatusChip status={r.band} /><span className="score-cap">LASMECO indication up to <strong>{fmtNaira(r.threshold)}</strong></span></div>
      </div>
      <div className="score-factors">{r.factors.map((f) => (<div className="sf" key={f.label}><div className="sf-top"><span>{f.label}</span><span className="sf-val">{f.display}</span></div><div className="sf-bar"><span style={{ width: Math.max(4, f.pct) + '%' }} /></div></div>))}</div>
      {m.qoop && (
        <div className="qoop-profile"><span className="qoop-profile-lab">QooP financial profile</span><div className="qoop-grid">
          <div><span>Savings</span><strong>{fmtNaira(m.qoop.savingsBalance)}</strong></div>
          <div><span>Wallet / BNPL limit</span><strong>{m.qoop.walletActive ? fmtNaira(m.qoop.bnplLimit) : 'Inactive'}</strong></div>
          <div><span>Credit purchases</span><strong>{m.qoop.creditPurchases}</strong></div>
          <div><span>Outstanding credit</span><strong>{fmtNaira(m.qoop.creditOutstanding)}</strong></div>
          <div><span>Loans taken</span><strong>{m.qoop.loansTaken}</strong></div>
          <div><span>On-time repayment</span><strong>{m.qoop.onTimeRepaymentRate}%</strong></div>
        </div></div>
      )}
      <p className="panel-note">Explainable and advisory. A cooperative officer reviews before this affects LASMECO eligibility (no solely automated decision). Summarised by MCCTI CoopEco.</p>
    </div>
  )
}
function MemberDetail({ m, onClose }) {
  return (
    <div className="detail">
      <div className="detail-head"><div><h3>{m.name}</h3><p className="detail-sub">{m.coop} &middot; {m.sector}{m.ref ? ' · ' + m.ref : ''}</p></div><button className="link-back" onClick={onClose}>&larr; Back to list</button></div>
      <div className="detail-chips"><StatusChip status={m.kyc?.status || 'Unverified'} kind="cap15" /><SourceBadge source={m.source} /></div>
      {m.source === 'QOOP' && <div className="ro-note" style={{ marginTop: '16px' }}>Mirrored from QooP (read-only). KYC and MSME data are maintained in QooP and flow into MCCTI one way.</div>}
      <div className="detail-grid" style={{ marginTop: '20px' }}>
        <div className="field-ro"><span>Phone</span><strong>{m.phone || '—'}</strong></div>
        <div className="field-ro"><span>Gender</span><strong>{m.gender || '—'}</strong></div>
        <div className="field-ro"><span>Employees</span><strong>{m.msme?.employees ?? 0}</strong></div>
        <div className="field-ro"><span>Years in operation</span><strong>{m.msme?.yearsInOperation ?? 0}</strong></div>
        <div className="field-ro"><span>Monthly turnover</span><strong>{fmtNaira(m.msme?.monthlyTurnover)}</strong></div>
        <div className="field-ro"><span>Cash flow</span><strong>{fmtNaira(m.msme?.cashFlow)}</strong></div>
        <div className="field-ro"><span>Customer base</span><strong>{m.msme?.customerBase ?? 0}</strong></div>
        <div className="field-ro"><span>KYC</span><strong>{m.kyc?.status || 'Unverified'}</strong></div>
      </div>
      <div className="returns-box" style={{ marginTop: '22px' }}><h4>Credit score</h4><CreditScoreCard m={m} /></div>
    </div>
  )
}
async function verifyKyc(type, value) {
  if (!value) return { verified: false }
  try { const r = await fetch('/api/kyc-verify', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ type, value }) }); return await r.json() } catch (e) { return { verified: /^\d{10,11}$/.test(String(value)), demo: true } }
}
function MemberOnboardingForm({ ctx, coops, onDone, onCancel }) {
  const coopNames = Array.from(new Set(coops.map((c) => c.name)))
  const [f, setF] = useState({ name: ctx.name || '', coop: coopNames[0] || '', sector: SECTORS[0], phone: '', gender: GENDERS[0], dob: '', address: '', memberSince: '', businessStart: '', bvn: '', nin: '', monthlyTurnover: '', employees: '', cashFlow: '', customerBase: '', yearsInOperation: '', consent: false })
  const [busy, setBusy] = useState(false), [err, setErr] = useState(''), [done, setDone] = useState(null)
  const set = (k) => (e) => setF({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value })
  const submit = async () => {
    setErr('')
    if (!f.name.trim()) { setErr('Your name is required.'); return }
    if (!f.consent) { setErr('Please consent to processing for credit assessment to continue.'); return }
    setBusy(true)
    try {
      let bvnVerified, ninVerified
      if (f.bvn) { const v = await verifyKyc('bvn', f.bvn); bvnVerified = v.verified }
      if (f.nin) { const v = await verifyKyc('nin', f.nin); ninVerified = v.verified }
      const rec = await createMember({ ...f, bvnVerified, ninVerified }, ctx); setDone(rec)
    } catch (e) { setErr(e.message || 'Could not save your profile.') } setBusy(false)
  }
  if (done) return (<div className="panel"><div className="panel-head"><h3>Profile complete</h3><button className="link-back" onClick={() => onDone(done)}>Done</button></div><p className="panel-sub">{done.name} &middot; {done.coop}</p><CreditScoreCard m={done} /></div>)
  return (
    <div className="panel">
      <div className="panel-head"><h3>Member onboarding &amp; MSME profile</h3><button className="link-back" onClick={onCancel}>Cancel</button></div>
      <div className="form-grid">
        <label className="field span2"><span>Full name</span><input value={f.name} onChange={set('name')} placeholder="Your name" /></label>
        <label className="field"><span>Cooperative</span><select value={f.coop} onChange={set('coop')}>{coopNames.length ? coopNames.map((n) => <option key={n}>{n}</option>) : <option>Not yet a member</option>}</select></label>
        <label className="field"><span>Enterprise sector</span><select value={f.sector} onChange={set('sector')}>{SECTORS.map((s) => <option key={s}>{s}</option>)}</select></label>
        <label className="field"><span>Phone</span><input value={f.phone} onChange={set('phone')} placeholder="0803..." /></label>
        <label className="field"><span>Gender</span><select value={f.gender} onChange={set('gender')}>{GENDERS.map((g) => <option key={g}>{g}</option>)}</select></label>
        <label className="field"><span>Date of birth</span><input type="date" value={f.dob} onChange={set('dob')} /></label>
        <label className="field span2"><span>Residential address</span><input value={f.address} onChange={set('address')} placeholder="House, street, area, LGA" /></label>
        <label className="field"><span>Member of cooperative since</span><input type="date" value={f.memberSince} onChange={set('memberSince')} /></label>
        <label className="field"><span>Business started (date)</span><input type="date" value={f.businessStart} onChange={set('businessStart')} /></label>
        <label className="field"><span>BVN (KYC)</span><input value={f.bvn} onChange={set('bvn')} placeholder="11 digits" /></label>
        <label className="field"><span>NIN (KYC)</span><input value={f.nin} onChange={set('nin')} placeholder="11 digits" /></label>
        <label className="field"><span>Monthly turnover (₦)</span><input type="number" value={f.monthlyTurnover} onChange={set('monthlyTurnover')} placeholder="0" /></label>
        <label className="field"><span>Employees</span><input type="number" value={f.employees} onChange={set('employees')} placeholder="0" /></label>
        <label className="field"><span>Monthly cash flow (₦)</span><input type="number" value={f.cashFlow} onChange={set('cashFlow')} placeholder="0" /></label>
        <label className="field"><span>Customer base</span><input type="number" value={f.customerBase} onChange={set('customerBase')} placeholder="0" /></label>
        <label className="field"><span>Years in operation</span><input type="number" value={f.yearsInOperation} onChange={set('yearsInOperation')} placeholder="0" /></label>
      </div>
      <label className="consent-check"><input type="checkbox" checked={f.consent} onChange={set('consent')} /><span>I consent to the processing of my KYC and MSME data for cooperative administration and credit assessment. I understand a score is advisory and reviewed by an officer.</span></label>
      {err && <p className="auth-err">{err}</p>}
      <div className="panel-actions"><button className="btn btn-gold" onClick={submit} disabled={busy}>{busy ? 'Saving…' : 'Save profile & get score'}</button></div>
      <p className="panel-note">KYC verification will run through a provider such as Smile ID or Dojah. This is not legal advice.</p>
    </div>
  )
}
function CoopLendingReadiness({ coop, ctx, onChanged }) {
  const [docs, setDocs] = useState([]), [loans, setLoans] = useState([]), [busy, setBusy] = useState(false)
  const reloadDocs = useCallback(() => { listDocs('coopaudit:' + coop.trackingId).then(setDocs); listLoans().then(setLoans) }, [coop.trackingId])
  useEffect(() => { reloadDocs() }, [reloadDocs])
  const audited = coopAuditApproved(coop, docs)
  const admitted = coopAdmission(coop).admitted
  const aged = coopCanIssueGuarantee(coop)
  const room = coopGuaranteeRoom(coop, loans)
  const ro = isReviewer(ctx)
  const setEstablished = async () => {
    const yes = await confirmDialog('Confirm this cooperative has been in existence for at least 1 year? MCCTI will verify this before it takes effect.', { confirmLabel: 'Confirm' })
    if (!yes) return
    setBusy(true); await updateCoop(coop.trackingId, { established12: true, establishedClaim: true }, ctx, 'Established-1yr claimed'); setBusy(false); onChanged && onChanged(); toast('Recorded. Awaiting MCCTI confirmation.')
  }
  return (
    <div className="ws">
      <p className="muted-line">Before your members can apply for LASMECO finance, your cooperative must be admitted by MCCTI, have an MCCTI-approved independent audit on file, and have existed for at least one year to issue the 25% guarantee.</p>
      <div className="returns-box"><h4>Lending readiness</h4>
        <div className="kyc-check">
          <div className={cx('kyc-item', admitted && 'ok')}><span className="kyc-mark">{admitted ? '\u2713' : '\u25cb'}</span><span className="kyc-label">Admitted to the LASMECO scheme by MCCTI</span></div>
          <div className={cx('kyc-item', audited && 'ok')}><span className="kyc-mark">{audited ? '\u2713' : '\u25cb'}</span><span className="kyc-label">Independent audit approved by MCCTI{docs.some((d) => d.category === COOP_AUDIT_DOC && !d.verified) ? ' \u2014 uploaded, awaiting MCCTI approval' : ''}</span></div>
          <div className={cx('kyc-item', aged && 'ok')}><span className="kyc-mark">{aged ? '\u2713' : '\u25cb'}</span><span className="kyc-label">In existence for at least 1 year</span></div>
        </div>
        <div className={cx('kyc-status', (admitted && audited && aged) ? 'ok' : 'pending')}>{(admitted && audited && aged) ? 'Ready \u2014 your members can apply for LASMECO finance.' : 'Not yet ready \u2014 complete the items above.'}</div>
      </div>
      <div className="returns-box"><h4>Guarantee capacity</h4>
        <div className="statgrid">
          <div className="stat"><span className="stat-fig">{fmtNaira(room.pool)}</span><span className="stat-lab">Members’ contributions (pool)</span></div>
          <div className="stat"><span className="stat-fig">{fmtNaira(room.used)}</span><span className="stat-lab">Guarantees committed</span></div>
          <div className="stat"><span className="stat-fig" style={{ color: 'var(--green)' }}>{fmtNaira(room.available)}</span><span className="stat-lab">Available to guarantee</span></div>
        </div>
        <p className="panel-note">Your cooperative can guarantee 25% of members\u2019 loans up to the size of its contributions. For example, a {fmtNaira(1000000)} pool can back four {fmtNaira(1000000)} facilities (each needs a {fmtNaira(250000)} guarantee). Completed loans free up capacity.</p>
      </div>
      {!aged && !ro && <div className="returns-box"><h4>Confirm year of establishment</h4><p className="muted-line">If your cooperative has existed for at least a year, record it here. MCCTI confirms before it takes effect.</p><div className="panel-actions"><button className="btn btn-outline btn-sm" disabled={busy} onClick={setEstablished}>Confirm 1+ year in existence</button></div></div>}
      <div className="returns-box"><h4>Independent audit</h4>
        <p className="muted-line">Upload your latest independent audit (annual). MCCTI reviews and approves it; approval unlocks LASMECO applications for your members.</p>
        <DocumentsPanel coopId={'coopaudit:' + coop.trackingId} ctx={ctx} canVerify={false} canUpload={!ro && coop.source !== 'SEKAT'} categories={[COOP_AUDIT_DOC]} onChange={reloadDocs} />
      </div>
    </div>
  )
}
function GuaranteeAssessment({ gr, coop, loans, onUse }) {
  const [member, setMember] = useState(null), [result, setResult] = useState(null), [busy, setBusy] = useState(false)
  useEffect(() => { listMembers().then((ms) => setMember(ms.find((m) => m.memberId === gr.memberId) || null)) }, [gr.memberId])
  const assess = async () => {
    if (!member) { toast('Member record not found.', 'error'); return }
    setBusy(true); setResult(null)
    const f = guaranteeAssessmentFacts(member, coop, loans)
    const prompt = 'You are advising the leadership of a Nigerian cooperative society deciding whether to grant a 25% loan guarantee to one of its members under the Lagos State LASMECO scheme. Give a brief, balanced assessment (about 90-130 words) of whether this member appears to merit the guarantee, then a final line "Suggestion: <lean approve / lean decline / borderline>". Be fair and factual; the human makes the final decision. Consider: time in the cooperative (rule: 6+ months), time in business (rule: 12+ months), contributions to the cooperative, business turnover and scale, and whether the cooperative has capacity. Facts (Naira amounts in NGN):\n' + JSON.stringify(f, null, 2) + '\nRequested facility: ' + gr.amount + ' (25% guarantee = ' + gr.guarantee + '). Do not invent facts beyond those given. If contributions data is zero or missing, note that it should be confirmed manually.'
    try { const text = await callClaude(prompt, 600); setResult(text || 'No assessment returned.') }
    catch (e) { setResult(null); toast('Could not generate the assessment. You can still approve manually.', 'error') }
    finally { setBusy(false) }
  }
  return (
    <div className="ai-assess">
      <div className="ai-assess-head"><span className="ai-tag">AI assessment</span><button className="btn btn-outline btn-sm" disabled={busy} onClick={assess}>{busy ? 'Assessing…' : result ? 'Re-assess' : 'Assess this member'}</button></div>
      {result ? <div className="ai-assess-body"><p>{result}</p><div className="panel-actions"><button className="link-inline" onClick={() => onUse(result.replace(/\nSuggestion:.*/i, '').trim())}>Use as basis of approval</button></div><p className="ai-note">Advisory only. The decision and its recorded justification remain yours.</p></div> : <p className="ai-note">Generates a balanced view from the member’s tenure, contributions and business, to support your decision. It does not approve anything.</p>}
    </div>
  )
}
function CoopGuaranteeApprovals({ coop, ctx }) {
  const [reqs, setReqs] = useState(null), [loans, setLoans] = useState([]), [busy, setBusy] = useState(''), [evidence, setEvidence] = useState({})
  const reload = useCallback(() => { listGuaranteeRequests(coop.name).then(setReqs); listLoans().then(setLoans) }, [coop.name])
  useEffect(() => { reload() }, [reload])
  const ro = isReviewer(ctx)
  const canApprove = !ro && (ctx.role === 'society' || ctx.role === 'leadership')
  if (!reqs) return <p className="muted-line">Loading guarantee requests…</p>
  const decide = (gr, ok) => async () => {
    if (ok) {
      const chk = canCoopGuarantee(coop, gr.amount, loans)
      if (!chk.fits) { toast('Approving this would exceed your guarantee ceiling (' + fmtNaira(chk.available) + ' available). It cannot be approved until capacity frees up.', 'error'); return }
      if (!(evidence[gr.grId] || '').trim()) { toast('Add the basis for approval (e.g. member contributions, standing) before approving.', 'error'); return }
    }
    setBusy(gr.grId)
    await saveGuaranteeRequest({ ...gr, status: ok ? 'Approved' : 'Declined', approvedAt: ok ? new Date().toISOString() : undefined, approvedByName: ctx.name, evidence: ok ? evidence[gr.grId] : gr.evidence }, ctx, ok ? 'Guarantee approved' : 'Guarantee declined')
    try { await notify({ to: gr.requestedBy, title: ok ? 'Guarantee approved' : 'Guarantee request declined', body: ok ? 'Your cooperative approved a 25% guarantee of ' + fmtNaira(gr.guarantee) + '. Download your guarantee letter and upload it with your LASMECO documents.' : 'Your guarantee request was not approved at this time. Please discuss with your cooperative leadership.', event: 'guarantee', link: { section: 'finance', label: 'Go to LASMECO finance' } }) } catch (e) { /* best-effort */ }
    setBusy(''); reload()
    toast(ok ? 'Approved. A guarantee letter is now available to the member.' : 'Request declined.', ok ? 'success' : 'info')
  }
  const pending = reqs.filter((g) => g.status === 'Pending')
  const decided = reqs.filter((g) => g.status !== 'Pending')
  const room = coopGuaranteeRoom(coop, loans)
  return (
    <div className="ws">
      <p className="muted-line">Members request a 25% guarantee before they can apply for LASMECO finance. Approvals here generate the guarantee letter the member uploads with their application. You have {fmtNaira(room.available)} of guarantee capacity available.</p>
      <div className="returns-box"><h4>Awaiting approval ({pending.length})</h4>
        {pending.length ? pending.map((gr) => { const chk = canCoopGuarantee(coop, gr.amount, loans); return (
          <div className="gr-item" key={gr.grId}>
            <div className="gr-head"><strong>{gr.memberName}</strong><span>{fmtNaira(gr.amount)} facility · 25% guarantee {fmtNaira(gr.guarantee)}</span></div>
            {!chk.fits && <div className="kyc-status pending">This exceeds available capacity ({fmtNaira(chk.available)}). Cannot approve until capacity frees up.</div>}
            {canApprove && chk.fits && <><GuaranteeAssessment gr={gr} coop={coop} loans={loans} onUse={(text) => setEvidence({ ...evidence, [gr.grId]: ((evidence[gr.grId] || '') + (evidence[gr.grId] ? ' ' : '') + text).trim() })} /><label className="field"><span>Basis of approval (evidence)</span><textarea rows={2} value={evidence[gr.grId] || ''} onChange={(e) => setEvidence({ ...evidence, [gr.grId]: e.target.value })} placeholder="e.g. Member contributions of N320,000 over 18 months; consistent savings; good standing." /></label>
            <div className="panel-actions"><button className="btn btn-gold btn-sm" disabled={busy === gr.grId} onClick={decide(gr, true)}>Approve &amp; generate letter</button><button className="btn btn-ghost btn-sm" disabled={busy === gr.grId} onClick={decide(gr, false)}>Decline</button></div></>}
          </div>) }) : <p className="muted-line">No requests awaiting approval.</p>}
      </div>
      {decided.length ? <div className="returns-box"><h4>Decided</h4>{decided.map((gr) => (
        <div className="gr-item" key={gr.grId}><div className="gr-head"><strong>{gr.memberName}</strong><span className={cx('chip', gr.status === 'Approved' ? 'st-approved' : 'st-review')}>{gr.status}</span></div><span className="gr-sub">{fmtNaira(gr.amount)} · guarantee {fmtNaira(gr.guarantee)}{gr.evidence ? ' · ' + gr.evidence : ''}</span>{gr.status === 'Approved' && <div className="panel-actions"><button className="link-inline" onClick={() => downloadGuaranteeLetter(gr, coop)}>Download letter</button></div>}</div>))}</div> : null}
    </div>
  )
}
function MemberGuaranteeStatus({ member, coop, loans, ctx }) {
  const [reqs, setReqs] = useState(null), [amt, setAmt] = useState(''), [busy, setBusy] = useState(false)
  const reload = useCallback(() => listGuaranteeRequests(member.coop).then((all) => setReqs(all.filter((g) => g.memberId === member.memberId))), [member.coop, member.memberId])
  useEffect(() => { reload() }, [reload])
  const request = async () => {
    const n = Number(amt)
    if (!n || n <= 0) { toast('Enter the amount you want to apply for.', 'error'); return }
    if (n > LOAN_MAX) { toast('The maximum LASMECO facility is ' + fmtNaira(LOAN_MAX) + '.', 'error'); return }
    const chk = canCoopGuarantee(coop, n, loans)
    if (!chk.fits) {
      toast('The cooperative you belong to cannot grant you a 25% guarantee at this point due to reaching a maximum ceiling. Discuss with Leadership or try again later.', 'error')
      return
    }
    setBusy(true)
    await saveGuaranteeRequest({ memberId: member.memberId, memberName: member.name, coop: member.coop, amount: n, guarantee: chk.need, status: 'Pending', requestedBy: ctx.email }, ctx, 'Guarantee requested')
    try { await notify({ to: 'society@' + (coop.trackingId || 'coop'), title: 'Guarantee request', body: member.name + ' has requested a 25% guarantee for ' + fmtNaira(n) + '.', event: 'guarantee', link: { section: 'guarantees', label: 'Review guarantee requests' } }) } catch (e) { /* best-effort */ }
    setBusy(false); setAmt(''); reload()
    toast('Guarantee request sent to your cooperative leadership for approval.', 'success')
  }
  if (!reqs) return null
  const approved = reqs.find((g) => g.status === 'Approved')
  const pending = reqs.find((g) => g.status === 'Pending')
  const room = coopGuaranteeRoom(coop, loans)
  return (
    <div className="guarantee-status">
      <div className="gs-line"><span>Cooperative guarantee capacity</span><strong>{fmtNaira(room.available)} available</strong></div>
      {(member.savingsTotal || member.monthlyContribution) ? <p className="chart-note">Your contributions: {fmtNaira(member.savingsTotal || 0)} total{member.monthlyContribution ? ' (' + fmtNaira(member.monthlyContribution) + '/month' : ''}{member.contributionConsistency ? ', ' + member.contributionConsistency + '% consistency)' : (member.monthlyContribution ? ')' : '')}. In your cooperative {memberCoopMonths(member)} months; in business {memberBusinessMonths(member)} months.</p> : null}
      <p className="chart-note">Your cooperative can guarantee 25% of members\u2019 loans up to its contributions of {fmtNaira(room.pool)}. {fmtNaira(room.used)} is already committed.</p>
      {approved ? (
        <div className="gs-approved"><span className="req-tag ok">Guarantee approved</span><p>Your 25% guarantee of {fmtNaira(approved.guarantee)} for a {fmtNaira(approved.amount)} facility has been approved by your cooperative. Download the letter and upload it with your LASMECO documents.</p><button className="btn btn-outline btn-sm" onClick={() => downloadGuaranteeLetter(approved, coop)}>Download guarantee letter</button></div>
      ) : pending ? (
        <div className="gs-pending"><span className="req-tag">Awaiting approval</span><p>Your guarantee request for {fmtNaira(pending.amount)} is with your cooperative leadership. You can apply once it is approved and you have the letter.</p></div>
      ) : (
        <div className="gs-request"><h5>Request your 25% cooperative guarantee</h5><p className="chart-note">Enter the facility amount you intend to apply for. Your cooperative guarantees 25% of it.</p>
          <div className="wallet-actions"><input type="number" value={amt} onChange={(e) => setAmt(e.target.value)} placeholder={'Amount up to ' + LOAN_MAX} /><button className="btn btn-gold btn-sm" disabled={busy} onClick={request}>Request guarantee</button></div>
        </div>
      )}
    </div>
  )
}
function MemberWorkspace({ ctx, section }) {
  const [members, setMembers] = useState(null), [coops, setCoops] = useState([]), [loans, setLoans] = useState([]), [auditDocs, setAuditDocs] = useState({})
  const [mode, setMode] = useState('view'), [sel, setSel] = useState(null)
  const reload = useCallback(() => { listMembers().then(setMembers); listCoops().then(setCoops); listLoans().then(setLoans) }, [])
  useEffect(() => { reload() }, [reload])
  useEffect(() => { (async () => { const me = members && (ctx.focusId ? members.find((m) => m.memberId === ctx.focusId) : members.find((m) => m.createdBy === ctx.email)); if (!me) return; const c = coops.find((x) => x.name === me.coop); if (c) { try { const ds = await listDocs('coopaudit:' + c.trackingId); setAuditDocs((a) => ({ ...a, [c.trackingId]: ds })) } catch (e) { /* ignore */ } } })() }, [members, coops, ctx.focusId, ctx.email])
  if (!members) return <p className="muted-line">Loading…</p>
  const mine = ctx.focusId ? members.find((m) => m.memberId === ctx.focusId) : members.find((m) => m.createdBy === ctx.email)
  const myLoans = mine ? loans.filter((l) => l.memberId === mine.memberId || (l.memberName === mine.name)) : []
  if (mode === 'onboard') return <MemberOnboardingForm ctx={ctx} coops={coops} onCancel={() => setMode('view')} onDone={() => { setMode('view'); reload() }} />
  if (mode === 'apply' && mine) return <LoanApplyForm ctx={ctx} member={mine} onCancel={() => setMode('view')} onDone={() => { setMode('view'); reload() }} />
  if (sel) return <LoanDetail loan={sel} ctx={ctx} onClose={() => { setSel(null); reload() }} onChanged={reload} />
  if (!mine) return (
    <div className="empty"><span className="empty-mark">&#9670;</span><h3>Complete your member profile</h3><p>Onboard once with your KYC and MSME details. You get an explainable credit score and a route to LASMECO finance. Your data is processed with your consent and you can erase it anytime.</p><button className="btn btn-gold" onClick={() => setMode('onboard')}>Start onboarding</button></div>
  )
  return (
    <div className="ws">
      {section === 'overview' && <MemberOverview mine={mine} loans={myLoans} />}
      {section === 'wallet' && <div className="returns-box"><h4>Wallet &amp; savings</h4><MemberWallet member={mine} /></div>}
      {section === 'chains' && <ChainsPanel ctx={{ ...ctx, coopName: mine.coop }} />}
      {section === 'finance' && (() => {
        const myCoop = coops.find((c) => c.name === mine.coop)
        const tenure = memberTenureEligible(mine)
        const ready = coopLendingReady(myCoop, myCoop && auditDocs[myCoop.trackingId])
        const applyGate = () => {
          if (!tenure.eligible) { toast('You are not yet eligible to access LASMECO Financing. You need to be ' + tenure.reasons.join(', and ') + '.', 'error'); return }
          if (!ready.ready) { toast('Your cooperative must first ' + ready.reasons.join(', ') + ' before its members can apply.', 'error'); return }
          setMode('apply')
        }
        return (<>
        <div className="society-card">
          <div className="society-top"><div><h3>{mine.name}</h3><p className="detail-sub">{mine.coop} &middot; {mine.sector}{mine.ref ? ' \u00b7 ' + mine.ref : ''}</p></div><div className="detail-chips"><StatusChip status={mine.kyc?.status || 'Unverified'} kind="cap15" /><SourceBadge source={mine.source} /></div></div>
          <div className="society-actions"><button className={cx('btn', 'btn-sm', (tenure.eligible && ready.ready) ? 'btn-gold' : 'btn-disabled')} disabled={!tenure.eligible || !ready.ready} onClick={applyGate}>Apply for LASMECO finance</button></div>
          {!tenure.eligible && <p className="gate-note">You are not yet eligible. You need to be {tenure.reasons.join(', and ')}.</p>}
          {tenure.eligible && !ready.ready && <p className="gate-note">Your cooperative must first {ready.reasons.join(', ')} before you can apply.</p>}
          {tenure.eligible && ready.ready && <MemberGuaranteeStatus member={mine} coop={myCoop} loans={loans} ctx={ctx} />}
        </div>
        <div className="returns-box"><h4>Your credit score</h4><CreditScoreCard m={mine} /></div>
        <LoanCalculator />
        <div className="trail-box"><h4>Your LASMECO applications</h4>{myLoans.length ? <LoanTable loans={myLoans} onOpen={setSel} /> : <p className="muted-line">No applications yet. Apply above; there are no upfront fees.</p>}</div>
      </>) })()}
    </div>
  )
}
function MembersAnalytics() {
  const [members, setMembers] = useState(null), [sel, setSel] = useState(null)
  useEffect(() => { listMembers().then(setMembers) }, [])
  if (!members) return <p className="muted-line">Loading members…</p>
  if (sel) return <MemberDetail m={sel} onClose={() => setSel(null)} />
  if (!members.length) return <p className="muted-line">No members yet. Run a QooP sync from Integrations.</p>
  const scored = members.map((m) => ({ m, s: scoreMember(m) }))
  const verified = members.filter((m) => m.kyc?.status === 'Verified').length
  const avg = Math.round(scored.reduce((a, x) => a + x.s.score, 0) / scored.length)
  const eligible = scored.filter((x) => x.s.band === 'Prime' || x.s.band === 'Strong').length
  const bands = ['Prime', 'Strong', 'Fair', 'Building', 'Thin file'].map((b) => [b, scored.filter((x) => x.s.band === b).length]).filter(([, n]) => n)
  return (
    <div className="ws">
      <div className="statgrid"><div className="stat"><span className="stat-fig">{members.length}</span><span className="stat-lab">Members</span></div><div className="stat"><span className="stat-fig">{verified}</span><span className="stat-lab">KYC verified</span></div><div className="stat"><span className="stat-fig">{avg}</span><span className="stat-lab">Average score</span></div><div className="stat"><span className="stat-fig">{eligible}</span><span className="stat-lab">LASMECO-ready</span></div></div>
      <div className="band-dist">{bands.map(([b, n]) => (<div className="bd" key={b}><StatusChip status={b} /><span className="bd-n">{n}</span></div>))}</div>
      <div className="rtable-wrap"><table className="rtable"><thead><tr><th>Member</th><th>Cooperative</th><th>Sector</th><th>KYC</th><th>Score</th><th>Band</th><th></th></tr></thead>
        <tbody>{scored.map(({ m, s }) => (<tr key={m.memberId}><td className="td-name">{m.name}<SourceBadge source={m.source} /></td><td>{m.coop}</td><td>{m.sector}</td><td>{m.kyc?.status || 'Unverified'}</td><td className="mono">{s.score}</td><td><StatusChip status={s.band} /></td><td><button className="btn-open" onClick={() => setSel(m)}>Open</button></td></tr>))}</tbody>
      </table></div>
    </div>
  )
}
function ViewAsSwitcher({ onViewAs }) {
  const [coops, setCoops] = useState([]), [members, setMembers] = useState([]), [q, setQ] = useState('')
  useEffect(() => { listCoops().then(setCoops); listMembers().then(setMembers) }, [])
  const ql = q.trim().toLowerCase()
  const fc = coops.filter((c) => !ql || c.name.toLowerCase().includes(ql))
  const fm = members.filter((m) => !ql || m.name.toLowerCase().includes(ql))
  return (
    <div className="viewas">
      <input className="viewas-search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search societies and members…" />
      <div className="viewas-cols">
        <div><h4 className="ws-h">Cooperative societies</h4><div className="viewas-list">{fc.slice(0, 12).map((c) => (<button key={c.trackingId} className="viewas-item" onClick={() => onViewAs({ role: 'society', name: c.name, email: c.createdBy, focusId: c.trackingId, office: c.areaOffice + ' area office', title: 'Cooperative Society' })}><span>{c.name}<SourceBadge source={c.source} /></span><span className="va-go">View as &rarr;</span></button>))}</div></div>
        <div><h4 className="ws-h">Members</h4><div className="viewas-list">{fm.slice(0, 12).map((m) => (<button key={m.memberId} className="viewas-item" onClick={() => onViewAs({ role: 'member', name: m.name, email: m.createdBy, focusId: m.memberId, office: m.coop, title: 'Cooperative Member' })}><span>{m.name}<SourceBadge source={m.source} /></span><span className="va-go">View as &rarr;</span></button>))}</div></div>
      </div>
    </div>
  )
}


/* =============================== STAGE 5 ===============================
   LASMECO Financing. The application-to-disbursement pipeline across the
   Accelerator, the Directorate (officer), the bank/BOI (financial partner) and
   leadership, with the guarantee stack, the success-based fees, and human
   approval at final approval and disbursement. Plus cooperative join fees.
   ====================================================================== */

const COOP_FEES = { registration: 50000, annualReturns: 15000 } // NGN, from the platform revenue model
const LOAN_TYPES = ['Working Capital (24 months, 3-month moratorium)', 'Asset Finance / Term Loan (36 months, 6-month moratorium)']
const LOAN_VARIANTS = {
  'Working Capital (24 months, 3-month moratorium)': { tenor: 24, moratorium: 3, capHigh: 0.30, capLow: 0.15, label: 'Working Capital' },
  'Asset Finance / Term Loan (36 months, 6-month moratorium)': { tenor: 36, moratorium: 6, capHigh: 0.50, capLow: 0.25, label: 'Asset Finance' },
}
function loanVariant(type) { return LOAN_VARIANTS[type] || LOAN_VARIANTS[LOAN_TYPES[0]] }
// RAC facility limit: % of average monthly credit turnover over 12 months (full cap if >=70% consistency in 8/12 months, else reduced cap). We annualise the average monthly turnover figure on file. NOTE: confirm monthly-vs-annualised basis with Sterling.
function facilityLimit(member, type, consistent) {
  const v = loanVariant(type)
  const monthly = (member && member.msme && member.msme.monthlyTurnover) || 0
  const cap = consistent === false ? v.capLow : v.capHigh
  return Math.min(10000000, Math.round(monthly * 12 * cap))
}
const AP_STATUSES = ['Applied', 'In training', 'Shortlisted']
const PARTNER_STATUSES = ['Coop validated', 'Bank assessment', 'BOI approved']
const LOAN_MAX = 10000000
function loanBreakdown(amount) {
  const a = Number(amount) || 0
  return { amount: a, collateral: Math.round(a * 0.10), coopGuarantee: Math.round(a * 0.25), sterlingGuarantee: Math.round(a * 0.50), lien: Math.round(a * 0.15), apFee: 200000, boiFee: Math.round(a * 0.01), netToBorrower: Math.max(0, a - 200000 - Math.round(a * 0.01)), rate: 9 }
}
function buildSchedule(principal, tenor, annualRatePct, startISO, moratorium) {
  const P = Number(principal) || 0, n = Math.max(1, Number(tenor) || 12), r = (Number(annualRatePct) || 9) / 100 / 12
  const mor = Math.min(n - 1, Math.max(0, Number(moratorium) || 0))
  const payMonths = Math.max(1, n - mor)
  const pay = r > 0 ? P * r / (1 - Math.pow(1 + r, -payMonths)) : P / payMonths
  const start = new Date(startISO || Date.now()), rows = []
  let bal = P
  for (let i = 1; i <= n; i++) {
    const interest = r > 0 ? bal * r : 0
    let principalPart = (i <= mor) ? 0 : (i === n ? bal : pay - interest)
    bal = Math.max(0, bal - principalPart)
    const due = new Date(start); due.setMonth(due.getMonth() + i)
    rows.push({ n: i, dueDate: due.toISOString(), amount: Math.round(principalPart + interest), interest: Math.round(interest), principal: Math.round(principalPart), balance: Math.round(bal), moratorium: i <= mor })
  }
  return rows
}
function loanRepayState(l) {
  const schedule = l.schedule || []
  const totalDue = schedule.reduce((a, s) => a + s.amount, 0)
  const paid = (l.repayments || []).reduce((a, p) => a + (Number(p.amount) || 0), 0)
  const outstanding = Math.max(0, totalDue - paid)
  const now = Date.now()
  const dueToDate = schedule.filter((s) => new Date(s.dueDate).getTime() <= now).reduce((a, s) => a + s.amount, 0)
  const arrears = Math.max(0, Math.min(outstanding, dueToDate - paid))
  let cum = 0, nextDue = null
  for (const s of schedule) { cum += s.amount; if (cum > paid) { nextDue = s; break } }
  const instStatus = (s) => { let c = 0; for (const x of schedule) { c += x.amount; if (x.n === s.n) break } return c <= paid ? 'Paid' : (new Date(s.dueDate).getTime() < now ? 'Overdue' : 'Due') }
  return { schedule, totalDue, paid, outstanding, arrears, nextDue, instStatus, tenor: schedule.length }
}
function recoveryPlan(outstanding, b) {
  let rem = Number(outstanding) || 0
  const collateral = Math.min(rem, b.collateral); rem -= collateral
  const coop = Math.min(rem, b.coopGuarantee); rem -= coop
  const sterling = Math.min(rem, b.sterlingGuarantee); rem -= sterling
  return { collateral, coop, sterling, shortfall: Math.max(0, rem) }
}
/* ---- RAC governance: tiers, NPL, security, BOI fee ----------------------- */
const COOP_TIERS = { A: { cap: 20, label: 'Tier A \u2013 Strong Liquidity Partner' }, B: { cap: 10, label: 'Tier B \u2013 Stable but Capped' }, C: { cap: 5, label: 'Tier C \u2013 Low Liquidity / At-Risk' } }
const NAV_REF_LOAN = 5000000
function coopNominationLimit(coop, activeCount) {
  const tier = (coop && coop.tier) || 'C'
  const cap = (COOP_TIERS[tier] || COOP_TIERS.C).cap
  let limit = cap
  if (coop && coop.nav) limit = Math.min(cap, Math.floor(Number(coop.nav) / (0.25 * NAV_REF_LOAN)))
  return { tier, cap, limit: Math.max(0, limit), used: activeCount || 0, remaining: Math.max(0, limit - (activeCount || 0)) }
}
const NPL_ARREARS_MONTHS = 3
function nplMetrics(loans) {
  const sched = loans.filter((l) => (l.schedule || []).length && ['Disbursed', 'Repaying', 'Completed', 'Default'].includes(l.status))
  const disbursed = sched.reduce((a, l) => a + (l.amountApproved || 0), 0)
  let nplValue = 0, crystallised = 0
  const nplLoans = []
  for (const l of sched) {
    const rp = loanRepayState(l)
    const overdue = (l.schedule || []).filter((s) => rp.instStatus(s) === 'Overdue').length
    if (l.status === 'Default' || overdue >= NPL_ARREARS_MONTHS) { nplValue += rp.outstanding; nplLoans.push({ loan: l, outstanding: rp.outstanding, overdue }) }
    if (l.status === 'Default' && l.recovery) crystallised += (l.recovery.sterling || 0) + (l.recovery.shortfall || 0)
  }
  const guaranteed = Math.round(disbursed * 0.5)
  const nplRatio = disbursed ? nplValue / disbursed : 0
  const lossNorm = guaranteed ? crystallised / guaranteed : 0
  const status = nplRatio >= 0.10 ? 'Suspended' : nplRatio >= 0.05 ? 'Review' : 'Healthy'
  return { disbursed, nplValue, nplRatio, guaranteed, crystallised, lossNorm, status, nplLoans }
}
const SECURITY_ITEMS = [
  ['sterlingGuarantee', '50% Sterling Bank guarantee (letter of guarantee)'],
  ['coopGuarantee', '25% cooperative guarantee (letter of guarantee)'],
  ['cashDeposit', '10% cash security deposit lodged (refundable on liquidation)'],
  ['lien', '15% lien on borrower present/future assets'],
  ['insurance', 'Asset + credit-life insurance (BOI as first-loss payee)'],
  ['gsi', 'GSI mandate on BVN-linked accounts'],
  ['personalGuarantee', 'Irrevocable personal guarantee of the Chief Promoter'],
]
function securityState(loan) {
  const s = loan.security || {}
  const done = SECURITY_ITEMS.filter(([k]) => s[k]).length
  return { done, total: SECURITY_ITEMS.length, complete: done === SECURITY_ITEMS.length, map: s }
}
const GLOBAL_GUARANTEE_LIMIT = 5000000000
const SINGLE_OBLIGOR_GUARANTEE = 5000000
const ACCEL_DOC_REQUIREMENTS = ['CAC registration & organisational profile', 'Valid regulatory operating permits', 'Audited financial statements (last 3 years)', 'CVs of key team members', 'Cover letter (preferred sectors & capacity)', 'Past interventions & methodology', 'Supporting bank statements']
function coopAdmission(coop) {
  const items = [
    { label: 'Recognised & approved by MCCTI', ok: coop.status === 'Approved' },
    { label: 'In existence 12+ months', ok: (coop.members || 0) > 0 || coop.established12 === true },
    { label: 'Clean credit history', ok: coop.creditClean !== false },
    { label: 'Designated focal person', ok: !!coop.custodian },
    { label: 'Governance structure & tier classified', ok: !!coop.tier },
    { label: 'NAV valuation (ICAN/FRCN)', ok: !!coop.nav },
  ]
  return { items, outstanding: items.filter((i) => !i.ok), admitted: items.every((i) => i.ok) }
}
function coopGuaranteeLiability(coopName, loans) {
  let crystallised = 0, contingent = 0
  for (const l of loans) {
    if (l.coop !== coopName || !(l.schedule || []).length) continue
    const g = loanBreakdown(l.amountApproved || l.amountRequested).coopGuarantee
    if (l.status === 'Default') crystallised += (l.recovery ? l.recovery.coop : g)
    else if (['Disbursed', 'Repaying'].includes(l.status)) contingent += g
  }
  return { crystallised, contingent }
}
/* Guarantee ceiling: a cooperative can only guarantee 25% of members' loans up to the size
   of its own contributions pool. "Committed" = approved-and-onwards guarantees still live
   (approved, bank assessment, BOI approved, disbursed, repaying). Completed/Declined/Default
   release their hold. e.g. contributions of N1,000,000 can back 4 loans of N1,000,000
   (each needs a N250,000 = 25% guarantee). */
const GUARANTEE_COMMITTED_STATES = ['Coop approved', 'Bank assessment', 'BOI approved', 'Disbursed', 'Repaying']
function coopGuaranteePool(coop) { return coop ? (coop.contributions || 0) : 0 }
function coopGuaranteeCommitted(coopName, loans) {
  return (loans || []).filter((l) => l.coop === coopName && GUARANTEE_COMMITTED_STATES.indexOf(l.status) > -1)
    .reduce((a, l) => a + loanBreakdown(l.amountApproved || l.amountRequested || 0).coopGuarantee, 0)
}
function coopGuaranteeRoom(coop, loans) {
  const pool = coopGuaranteePool(coop)
  const used = coopGuaranteeCommitted(coop && coop.name, loans)
  const override = (coop && coop.guaranteeOverride) || 0
  return { pool, used, available: Math.max(0, pool + override - used), override }
}
function canCoopGuarantee(coop, amount, loans) {
  const need = loanBreakdown(amount).coopGuarantee
  const room = coopGuaranteeRoom(coop, loans)
  return { need, ...room, fits: need <= room.available }
}
// Cooperative may issue guarantees only if it has existed 12+ months (MCCTI-confirmed).
function coopAgeMonths(coop) {
  if (!coop) return 0
  if (coop.establishedConfirmed && coop.establishedDate) return monthsBetween(coop.establishedDate, Date.now())
  return coop.established12 === true ? 12 : 0
}
function coopCanIssueGuarantee(coop) { return coopAgeMonths(coop) >= 12 }
// Member eligibility: 12+ months in business AND 6+ months in the cooperative.
function monthsBetween(from, to) { if (!from) return 0; const a = new Date(from), b = new Date(to); return Math.max(0, (b.getFullYear() - a.getFullYear()) * 12 + (b.getMonth() - a.getMonth())) }
function memberBusinessMonths(m) { return (m && m.msme && m.msme.yearsInOperation ? Math.round(m.msme.yearsInOperation * 12) : (m && m.businessMonths) || 0) }
function memberCoopMonths(m) { return (m && m.memberSinceConfirmed && m.memberSince) ? monthsBetween(m.memberSince, Date.now()) : ((m && m.coopMonths) || 0) }
function memberTenureEligible(m) {
  const biz = memberBusinessMonths(m), coop = memberCoopMonths(m)
  const reasons = []
  if (biz < 12) reasons.push('in business for at least 1 year (currently ' + (biz ? biz + ' month' + (biz === 1 ? '' : 's') : 'under 1 year') + ')')
  if (coop < 6) reasons.push('a cooperative member for at least 6 months (currently ' + (coop ? coop + ' month' + (coop === 1 ? '' : 's') : 'under 6 months') + ')')
  return { eligible: biz >= 12 && coop >= 6, biz, coop, reasons }
}
// Cooperative must be MCCTI-approved AND have an MCCTI-approved independent audit on file.
const COOP_AUDIT_DOC = 'Independent audit (MCCTI-approved)'
function coopAuditApproved(coop, auditDocs) { return (auditDocs || []).some((d) => d.category === COOP_AUDIT_DOC && d.verified) }
function coopLendingReady(coop, auditDocs) {
  const admitted = coopAdmission(coop).admitted
  const audited = coopAuditApproved(coop, auditDocs)
  const aged = coopCanIssueGuarantee(coop)
  const reasons = []
  if (!admitted) reasons.push('be admitted to the LASMECO scheme by MCCTI')
  if (!audited) reasons.push('have an independent audit approved by MCCTI')
  if (!aged) reasons.push('have existed for at least 1 year to issue a 25% guarantee')
  return { ready: admitted && audited && aged, admitted, audited, aged, reasons }
}
// Guarantee request workflow: member -> cooperative leadership approval -> letter.
async function callClaude(prompt, maxTokens) {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: 'claude-sonnet-4-6', max_tokens: maxTokens || 1000, messages: [{ role: 'user', content: prompt }] }),
  })
  const data = await res.json()
  return (data.content || []).filter((b) => b.type === 'text').map((b) => b.text).join('\n').trim()
}
// Facts assembled for an AI guarantee assessment (all from the member's real record).
function guaranteeAssessmentFacts(member, coop, loans) {
  const coopMonths = memberCoopMonths(member), bizMonths = memberBusinessMonths(member)
  const room = coopGuaranteeRoom(coop, loans)
  const memberContrib = (member && member.savingsTotal) || (member && member.contributions) || 0
  return {
    name: member.name,
    coop: member.coop,
    monthsInCoop: coopMonths, meets6mo: coopMonths >= 6,
    monthsInBusiness: bizMonths, meets1yr: bizMonths >= 12,
    totalContributionsNGN: memberContrib,
    monthlyContributionNGN: (member && member.monthlyContribution) || 0,
    monthsContributed: (member && member.contributionMonthsPaid) || 0,
    contributionConsistencyPct: (member && member.contributionConsistency) || 0,
    coopPool: room.pool, coopAvailable: room.available,
    monthlyTurnover: (member.msme && member.msme.monthlyTurnover) || 0,
    employees: (member.msme && member.msme.employees) || 0,
    yearsInOperation: (member.msme && member.msme.yearsInOperation) || 0,
  }
}
async function listGuaranteeRequests(coopName) { return (await kvList('guarantee:')).filter((g) => !coopName || g.coop === coopName).sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1)) }
async function getGuaranteeRequest(id) { return kvGet('guarantee:' + id) }
async function saveGuaranteeRequest(rec, ctx, action) {
  const id = rec.grId || 'GR-' + Math.random().toString(36).slice(2, 7).toUpperCase()
  const next = { ...rec, grId: id, updatedAt: new Date().toISOString(), createdAt: rec.createdAt || new Date().toISOString() }
  await kvSet('guarantee:' + id, next)
  if (action && ctx) { try { await addAudit({ trackingId: id, action, by: ctx.name, role: ctx.role, note: rec.memberName || '' }) } catch (e) { /* best-effort */ } }
  return next
}
async function generateLetterBody(gr, coop) {
  const facts = { member: gr.memberName, cooperative: gr.coop, facility: gr.amount, guarantee: gr.guarantee, basis: gr.evidence || '', coopContributions: (coop && coop.contributions) || 0, ref: gr.grId }
  const prompt = 'Write the body of a formal Letter of Cooperative Guarantee, in British English, from a Nigerian cooperative society to Sterling Bank and the Bank of Industry (via the appointed sector accelerator), for the Lagos State LASMECO financing scheme. It should: confirm the named person is a member in good standing; state that the cooperative unconditionally guarantees twenty-five per cent (25%) of the requested facility; reference the cooperative\u2019s members\u2019 contributions as backing; and be professional and concise (3 short paragraphs, no more than about 150 words). Do NOT include the letterhead, date, addresses, salutation or signature block \u2014 only the body paragraphs. Facts: ' + JSON.stringify(facts) + '. Amounts are in Nigerian Naira; format them like \u20A6' + gr.amount.toLocaleString('en-NG') + '.'
  try { const t = await callClaude(prompt, 500); return t || null } catch (e) { return null }
}
function letterFallbackBody(gr, coop) {
  return 'We confirm that ' + gr.memberName + ' is a registered member of ' + gr.coop + ' in good standing.\n\nIn support of their application under the LASMECO scheme, this cooperative unconditionally guarantees twenty-five per cent (25%) of the requested facility of \u20A6' + gr.amount.toLocaleString('en-NG') + ', being \u20A6' + gr.guarantee.toLocaleString('en-NG') + '. This guarantee is backed by our members\u2019 contributions of \u20A6' + (((coop && coop.contributions) || 0)).toLocaleString('en-NG') + '.\n\nWe accordingly recommend the applicant for the facility and undertake our obligations as a guarantor under the scheme.'
}
async function downloadGuaranteeLetter(gr, coop) {
  toast('Preparing the guarantee letter…')
  const body = (await generateLetterBody(gr, coop)) || letterFallbackBody(gr, coop)
  const d = new Date(gr.approvedAt || Date.now()).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
  const esc = (t) => String(t || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  const paras = body.split(/\n\n+/).map((p) => '<p>' + esc(p).replace(/\n/g, '<br>') + '</p>').join('')
  const html = '<!doctype html><html><head><meta charset="utf-8"><title>Guarantee Letter ' + esc(gr.grId) + '</title><style>@page{size:A4;margin:22mm}body{font-family:Georgia,"Times New Roman",serif;color:#1a1a1a;line-height:1.6;font-size:12.5pt}.lh{border-bottom:3px double #1C8A4F;padding-bottom:12px;margin-bottom:6px}.lh .nm{font-size:19pt;font-weight:bold;color:#12673a;letter-spacing:.3px}.lh .meta{font-size:9.5pt;color:#555;margin-top:3px}.ref{display:flex;justify-content:space-between;font-size:10pt;color:#333;margin:18px 0 10px}.to{margin:6px 0 2px}.re{font-weight:bold;margin:14px 0}.sig{margin-top:40px}.sig .line{width:230px;border-top:1px solid #333;padding-top:5px;font-size:10.5pt}.foot{margin-top:28px;border-top:1px solid #ddd;padding-top:8px;font-size:8.5pt;color:#888;text-align:center}@media print{.noprint{display:none}}</style></head><body>' +
    '<div class="lh"><div class="nm">' + esc(coop.name) + '</div><div class="meta">' + [coop.areaOffice ? 'Area Office: ' + esc(coop.areaOffice) : '', coop.regNo ? 'Reg. No: ' + esc(coop.regNo) : (coop.trackingId ? 'Ref: ' + esc(coop.trackingId) : ''), 'A registered cooperative society under the Lagos State MCCTI'].filter(Boolean).join(' &nbsp;&bull;&nbsp; ') + '</div></div>' +
    '<div class="ref"><span>Ref: ' + esc(gr.grId) + '</span><span>' + d + '</span></div>' +
    '<div class="to">The Credit Manager,<br>Sterling Bank Plc / Bank of Industry<br><em>Through: The Appointed Sector Accelerator, LASMECO</em></div>' +
    '<p class="re">RE: LETTER OF COOPERATIVE GUARANTEE &mdash; ' + esc(gr.memberName) + '</p>' +
    paras +
    '<div class="sig"><div class="line">Authorised Signatory<br>For: ' + esc(coop.name) + '<br><span style="font-size:9pt;color:#666">' + esc(gr.approvedByName || 'Cooperative Leadership') + '</span></div></div>' +
    '<div class="foot">Generated via MCCTI CoopEco on ' + d + ' &bull; Ref ' + esc(gr.grId) + ' &bull; This letter is issued under the Lagos State LASMECO scheme.</div>' +
    '<div class="noprint" style="text-align:center;margin-top:22px"><button onclick="window.print()" style="padding:10px 22px;font-size:13px;background:#1C8A4F;color:#fff;border:none;border-radius:6px;cursor:pointer">Save as PDF / Print</button></div>' +
    '<script>setTimeout(function(){window.print()},400)</script></body></html>'
  const w = window.open('', '_blank')
  if (!w) { toast('Allow pop-ups to download the letter, then try again.', 'error'); return }
  w.document.write(html); w.document.close()
}
function globalGuaranteeUsed(loans) { return loans.filter((l) => ['Disbursed', 'Repaying'].includes(l.status)).reduce((a, l) => a + loanBreakdown(l.amountApproved || 0).sterlingGuarantee, 0) }
function monthKey(d) { const x = new Date(d); return x.getFullYear() + '-' + String(x.getMonth() + 1).padStart(2, '0') }
function monthLabel(mk) { const [y, m] = String(mk).split('-'); return ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][Number(m) - 1] + " '" + String(y).slice(2) }
async function recordCoopSnapshot(coop) {
  if (!coop || !coop.trackingId) return
  const mk = monthKey(Date.now())
  try { await kvSet('snap:' + coop.trackingId + ':' + mk, { coopId: coop.trackingId, month: mk, contributions: coop.contributions || 0, members: coop.members || 0, at: new Date().toISOString() }) } catch (e) { /* best-effort */ }
}
async function coopContributionSeries(trackingId, months = 6) {
  const rows = await kvList('snap:' + trackingId + ':')
  return rows.filter((r) => r && r.month).sort((a, b) => (a.month < b.month ? -1 : 1)).slice(-months)
}
async function portfolioContributionSeries(months = 6) {
  const rows = await kvList('snap:')
  const byMonth = {}
  for (const r of rows) { if (!r || !r.month) continue; byMonth[r.month] = (byMonth[r.month] || 0) + (r.contributions || 0) }
  return Object.keys(byMonth).sort().slice(-months).map((m) => ({ month: m, contributions: byMonth[m] }))
}
// Demo-only anchor firms, attached when sample data is enabled.
const CHAIN_DEMO_ANCHORS = { 'Agriculture': 'Lekki Foods Processing Ltd', 'Manufacturing': 'Idumota Textile Merchants', 'Circular Economy': 'Greencycle Nigeria', 'Digital Economy': 'Yaba Tech Hub' }
/* Value chains are structural, not sample data: the app provisions one per RAC sector and
   keeps them provisioned. Runs on every load and is idempotent, so a chain reappears if a
   sector is ever added. MCCTI can still create extra chains and accelerators can propose. */
async function ensureValueChains() {
  let made = 0
  try {
    const existing = await listChains()
    const have = existing.map((c) => c.sector)
    const accels = await listAccelerators()
    for (const sector of LASMECO_SECTORS) {
      if (have.indexOf(sector) > -1) continue
      const accel = accels.find((a) => (a.sectors || []).indexOf(sector) > -1 && (a.status || 'Pending') === 'Appointed')
      const id = 'VC-' + sector.replace(/[^A-Za-z]/g, '').slice(0, 3).toUpperCase() + '-' + Math.floor(100 + Math.random() * 900)
      const anchor = DEMO_DATA ? (CHAIN_DEMO_ANCHORS[sector] || '') : ''
      const stages = CHAIN_STAGE_TEMPLATES[sector] || []
      await kvSet('chain:' + id, { chainId: id, name: 'Lagos ' + sector + ' Value Chain', sector, stages, status: 'Active', auto: true, coordinator: accel ? accel.name : '', anchor, added: [], removed: [], stageMap: {}, firms: anchor ? [{ name: anchor, role: 'Anchor / offtaker', stage: stages[3] || stages[0] || '' }] : [], createdBy: 'system', createdAt: new Date().toISOString() })
      made++
    }
  } catch (e) { /* best-effort */ }
  return made > 0
}
async function ensureCoopSnapshots() {
  if (await kvGet('integration:snapshots-v1')) return false
  try {
    const coops = await listCoops()
    const factors = [0.68, 0.76, 0.83, 0.89, 0.95, 1], now = new Date()
    for (const c of coops) {
      const cur = c.contributions || 0
      for (let i = 0; i < 6; i++) { const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1); const mk = monthKey(d); await kvSet('snap:' + c.trackingId + ':' + mk, { coopId: c.trackingId, month: mk, contributions: Math.round(cur * factors[i]), members: c.members || 0, at: d.toISOString() }) }
    }
  } catch (e) { /* best-effort */ }
  await kvSet('integration:snapshots-v1', { done: true, at: new Date().toISOString() })
  return true
}
async function ensureMonthlySnapshots() {
  const mk = monthKey(Date.now()), marker = 'snapsweep:' + mk
  if (await kvGet(marker)) return
  try {
    const coops = await listCoops()
    for (const c of coops) await recordCoopSnapshot(c)
    await kvSet(marker, { month: mk, done: true, at: new Date().toISOString(), count: coops.length })
  } catch (e) { /* best-effort */ }
}
async function recordRepayment(l, amount, ctx, method) {
  const amt = Number(amount) || 0; if (amt <= 0) return l
  const repayments = [...(l.repayments || []), { at: new Date().toISOString(), amount: amt, by: ctx.name, method: method || 'manual' }]
  const st = loanRepayState({ ...l, repayments })
  const status = st.outstanding <= 0 ? 'Completed' : 'Repaying'
  return updateLoan(l.loanId, { repayments, status }, ctx, 'Repayment recorded ' + fmtNaira(amt) + ' (' + (method || 'manual') + ')', '')
}
function genLoanId() { const yy = String(new Date().getFullYear()).slice(2); return 'LN-' + yy + '-' + String(Math.floor(Math.random() * 1000000)).padStart(6, '0') }
async function listLoans() { return (await kvList('loan:')).sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1)) }
async function createLoan(rec, ctx) {
  const loanId = genLoanId(); const now = new Date().toISOString()
  const record = { loanId, status: 'Applied', apName: '', amountRecommended: null, amountApproved: null, createdBy: ctx.email, createdAt: now, updatedAt: now, ...rec }
  await kvSet('loan:' + loanId, record, ctx.uid)
  await addAudit({ trackingId: loanId, action: 'Application submitted', by: ctx.name, role: ctx.role, note: rec.purpose || '' })
  await notify({ to: ctx.email, title: 'LASMECO application received', body: 'Application ' + loanId + ' submitted to ' + (rec.apName || 'an Accelerator') + '.', event: 'loan', phone: rec.memberPhone })
  await notify({ to: rec.apEmail || 'role:accelerator', title: 'New LASMECO application', body: rec.memberName + ' \u2014 ' + rec.sector, event: 'loan' })
  return record
}
async function updateLoan(id, patch, ctx, action, note) {
  const cur = await kvGet('loan:' + id); if (!cur) return null
  const next = { ...cur, ...patch, updatedAt: new Date().toISOString() }
  await kvSet('loan:' + id, next, cur.user_id)
  if (action) await addAudit({ trackingId: id, action, by: ctx.name, role: ctx.role, note: note || '' })
  if (patch.status && cur.createdBy && !cur.createdBy.includes('@system')) {
    await notify({ to: cur.createdBy, title: 'LASMECO application update', body: 'Application ' + id + ' is now: ' + patch.status, event: 'loan', phone: cur.memberPhone })
  }
  return next
}
async function payCoopFee(coopId, ctx) { return updateCoop(coopId, { feeStatus: 'Paid' }, ctx, 'Registration fee paid', fmtNaira(COOP_FEES.registration)) }
async function clearPriorSeed() {
  const del = async (prefix, keyOf, pred) => { const rows = await kvList(prefix); for (const r of rows) { try { if (pred(r)) await kvDelete(keyOf(r)) } catch (e) { /* skip */ } } }
  const seedLoanIds = new Set()
  await del('coop:', (c) => 'coop:' + c.trackingId, (c) => c.createdBy === 'seed@mccti.lg.gov.ng')
  await del('member:', (m) => 'member:' + m.memberId, (m) => (m.createdBy || '').indexOf('demo.') === 0)
  await del('loan:', (l) => 'loan:' + l.loanId, (l) => { const s = (l.createdBy || '').endsWith('@coopeco.ng'); if (s) seedLoanIds.add(l.loanId); return s })
  await del('ticket:', (t) => 'ticket:' + t.ticketId, (t) => (t.ticketId || '').indexOf('TK-25-9') === 0)
  await del('notif:', (n) => 'notif:' + n.id, (n) => n.event === 'seed')
  await del('doc:', (d) => 'doc:' + d.coopId + ':' + d.id, (d) => seedLoanIds.has(d.coopId) || String(d.id).indexOf('LD') === 0 || String(d.id).indexOf('Dseed') === 0)
  await del('wallet:', (w) => 'wallet:' + w.id, (w) => /^M:M-100\d/.test(w.id || '') || !!w.esusu)
  await del('snap:', (s) => 'snap:' + s.coopId + ':' + s.month, (s) => !!s.coopId)
  await del('chain:', (x) => 'chain:' + x.chainId, (x) => x.createdBy === 'seed@mccti.lg.gov.ng' || x.createdBy === 'system')
  await del('snapsweep:', (s) => 'snapsweep:' + s.month, (s) => !!s.month)
  await kvDelete('integration:loandocs-v1'); await kvDelete('integration:loandocs-v4'); await kvDelete('integration:snapshots-v1')
}
async function seedDemoData() {
  if (await kvGet('integration:seed-v12')) return false
  await kvSet('integration:seed-v12', { claimed: true, at: new Date().toISOString() }) // claim first: prevents repeat clear/reseed storms if a later step fails
  try { await clearPriorSeed() } catch (e) { /* best-effort cleanup */ }
  const now = Date.now(), day = 86400000
  const isoAgo = (ms) => new Date(now - ms).toISOString()
  const monthsAgoISO = (k) => { const d = new Date(now); d.setMonth(d.getMonth() - k); return d.toISOString() }
  // 1) MCCTI cooperatives (varied status / office / compliance)
  const extraCoops = [
    { name: 'Oshodi Market Women Coop', areaOffice: 'Oshodi', sector: 'Trade', custodian: 'R. Alaba', members: 240, contributions: 7200000, status: 'Approved', cap15: 'Compliant', feeStatus: 'Paid', tier: 'A', nav: 90000000, established12: true, establishedConfirmed: true, establishedDate: isoAgo(1500 * day) },
    { name: 'Agege Transport Union Coop', areaOffice: 'Agege', sector: 'Transport', custodian: 'S. Okoro', members: 160, contributions: 5400000, status: 'Under review', cap15: 'Under audit', feeStatus: 'Paid', tier: 'B', nav: 30000000 },
    { name: 'Alimosho Tailors Multipurpose', areaOffice: 'Alimosho', sector: 'Artisan', custodian: 'B. Yusuf', members: 95, contributions: 2100000, status: 'Returned', cap15: 'Returns due', tier: 'C', nav: 8000000 },
    { name: 'Kosofe Poultry Farmers Coop', areaOffice: 'Kosofe', sector: 'Agriculture', custodian: 'N. Eze', members: 130, contributions: 3900000, status: 'Approved', cap15: 'Compliant', feeStatus: 'Paid', tier: 'C', nav: 6000000, established12: true, establishedConfirmed: true, establishedDate: isoAgo(700 * day), creditClean: true },
    { name: 'Ikeja Hospital Staff Multipurpose Coop', areaOffice: 'Ikeja', sector: 'Services', custodian: 'Dr A. Balogun', members: 175, contributions: 6300000, status: 'Approved', cap15: 'Compliant', feeStatus: 'Paid', tier: 'B', nav: 42000000, established12: true, establishedConfirmed: true, establishedDate: isoAgo(1100 * day) },
    { name: 'Eti-Osa Fashion Enterprise Coop', areaOffice: 'Eti-Osa', sector: 'Services', custodian: 'T. Coker', members: 210, contributions: 8800000, status: 'Approved', cap15: 'Compliant', feeStatus: 'Paid', tier: 'A', nav: 120000000, established12: true, establishedConfirmed: true, establishedDate: isoAgo(2000 * day) },
  ]
  const coopMap = {}
  const allCoopSeeds = [...SEED_COOPS, ...extraCoops]
  for (let i = 0; i < allCoopSeeds.length; i++) {
    const s = allCoopSeeds[i], id = genTrackingId(), created = isoAgo((allCoopSeeds.length - i) * day)
    await kvSet('coop:' + id, { trackingId: id, source: 'MCCTI', regNo: null, returns: null, feeStatus: s.feeStatus || '', createdBy: 'seed@mccti.lg.gov.ng', createdAt: created, updatedAt: created, ...s })
    coopMap[s.name] = id
    await addAudit({ trackingId: id, action: 'Registration filed', by: s.custodian, role: 'society', note: '', at: created })
    if (s.status !== 'Filed') await addAudit({ trackingId: id, action: 'Begin examination', by: 'Area Registrar', role: 'officer', note: '', at: isoAgo((allCoopSeeds.length - i) * day - 3600000) })
    if (s.status === 'Approved') await addAudit({ trackingId: id, action: 'Approved and signed off', by: 'Honourable Commissioner', role: 'leadership', note: 'Compliant with CAP15', at: isoAgo((allCoopSeeds.length - i) * day - 7200000) })
  }
  // 2) Members (varied sectors / KYC / bands)
  const memberSeeds = [
    { name: 'Folake Adisa', coop: 'Oshodi Market Women Coop', sector: 'Trade', lasmecoSector: 'Service Delivery', accel: 'Service Delivery Accelerator', phone: '08031000001', gender: 'Female', bvn: 1, nin: 1, msme: { monthlyTurnover: 520000, employees: 4, cashFlow: 200000, customerBase: 160, yearsInOperation: 6 } },
    { name: 'Chidi Okafor', coop: 'Oshodi Market Women Coop', sector: 'Trade', lasmecoSector: 'Service Delivery', accel: 'Service Delivery Accelerator', phone: '08031000002', gender: 'Male', bvn: 1, nin: 1, msme: { monthlyTurnover: 780000, employees: 6, cashFlow: 300000, customerBase: 220, yearsInOperation: 8 } },
    { name: 'Aisha Bello', coop: 'Agege Transport Union Coop', sector: 'Transport', lasmecoSector: 'Service Delivery', accel: 'Service Delivery Accelerator', phone: '08031000003', gender: 'Female', bvn: 1, nin: 0, msme: { monthlyTurnover: 260000, employees: 2, cashFlow: 80000, customerBase: 70, yearsInOperation: 3 } },
    { name: 'Segun Ade', coop: 'Eti-Osa Fashion Enterprise Coop', sector: 'Services', lasmecoSector: 'Tourism', accel: 'Tourism Accelerator', phone: '08031000004', gender: 'Male', bvn: 1, nin: 1, msme: { monthlyTurnover: 1350000, employees: 9, cashFlow: 500000, customerBase: 380, yearsInOperation: 10 } },
    { name: 'Grace Umeh', coop: 'Kosofe Poultry Farmers Coop', sector: 'Agriculture', lasmecoSector: 'Agriculture', accel: 'Agriculture Accelerator', phone: '08031000005', gender: 'Female', bvn: 0, nin: 0, msme: { monthlyTurnover: 110000, employees: 1, cashFlow: 30000, customerBase: 40, yearsInOperation: 2 } },
    { name: 'Ngozi Balogun', coop: 'Ikeja Hospital Staff Multipurpose Coop', sector: 'Services', lasmecoSector: 'Health', accel: 'Health Accelerator', phone: '08031000007', gender: 'Female', bvn: 1, nin: 1, msme: { monthlyTurnover: 1900000, employees: 12, cashFlow: 700000, customerBase: 540, yearsInOperation: 9 } },
    { name: 'Ibrahim Sule', coop: 'Alimosho Tailors Multipurpose', sector: 'Artisan', lasmecoSector: 'Manufacturing', accel: 'Manufacturing Accelerator', phone: '08031000006', gender: 'Male', bvn: 1, nin: 1, msme: { monthlyTurnover: 430000, employees: 3, cashFlow: 150000, customerBase: 120, yearsInOperation: 5 } },
  ]
  const memberMap = {}
  for (let i = 0; i < memberSeeds.length; i++) {
    const s = memberSeeds[i], id = 'M-' + String(100001 + i), email = 'demo.' + s.name.toLowerCase().replace(/[^a-z]+/g, '.') + '@coopeco.ng'
    const status = s.bvn && s.nin ? 'Verified' : (s.bvn || s.nin) ? 'Partial' : 'Unverified'
    const coopM = { 'Grace Umeh': 10, 'Folake Adisa': 30, 'Chidi Okafor': 40, 'Aisha Bello': 4, 'Segun Ade': 60, 'Ngozi Balogun': 26, 'Ibrahim Sule': 18 }[s.name] || 12
    const bizM = Math.round((s.msme.yearsInOperation || 1) * 12)
    // Contribution history: a monthly amount over the member's tenure, with a consistency profile.
    const contribProfile = { 'Grace Umeh': { monthly: 25000, missed: 0 }, 'Folake Adisa': { monthly: 40000, missed: 1 }, 'Chidi Okafor': { monthly: 60000, missed: 0 }, 'Aisha Bello': { monthly: 15000, missed: 2 }, 'Segun Ade': { monthly: 55000, missed: 0 }, 'Ngozi Balogun': { monthly: 80000, missed: 1 }, 'Ibrahim Sule': { monthly: 30000, missed: 3 } }[s.name] || { monthly: 20000, missed: 1 }
    const paidMonths = Math.max(0, coopM - contribProfile.missed)
    const savingsTotal = paidMonths * contribProfile.monthly
    const consistency = coopM > 0 ? Math.round((paidMonths / coopM) * 100) : 0
    await kvSet('member:' + id, { memberId: id, source: 'MCCTI', name: s.name, coop: s.coop, sector: s.sector, lasmecoSector: s.lasmecoSector, accel: s.accel, phone: s.phone, gender: s.gender, memberSince: isoAgo(coopM * 30 * day), businessStart: isoAgo(bizM * 30 * day), memberSinceConfirmed: coopM >= 6, coopMonths: coopM, businessMonths: bizM, savingsTotal, monthlyContribution: contribProfile.monthly, contributionMonthsPaid: paidMonths, contributionConsistency: consistency, kyc: { bvn: s.bvn ? 'on file' : '', nin: s.nin ? 'on file' : '', bvnVerified: !!s.bvn, ninVerified: !!s.nin, status }, msme: s.msme, createdBy: email, createdAt: isoAgo((10 - i) * day) })
    memberMap[s.name] = { memberId: id, email, phone: s.phone, coop: s.coop, sector: s.sector, lasmecoSector: s.lasmecoSector, accel: s.accel }
  }
  // 3) Loans across every pipeline stage (with schedules, repayments, arrears, default)
  const mkSchedLoan = (m, amount, tenor, disbMonths, paidCount, status, extra) => {
    const disbAt = monthsAgoISO(disbMonths), mv = loanVariant((extra && extra.type) || LOAN_TYPES[0]), schedule = buildSchedule(amount, tenor, 9, disbAt, mv.moratorium)
    const repayments = []
    for (let k = 0; k < paidCount && k < schedule.length; k++) repayments.push({ at: monthsAgoISO(Math.max(0, disbMonths - k - 1)), amount: schedule[k].amount, by: m.name, method: 'manual' })
    return { memberId: m.memberId, memberName: m.name, memberPhone: m.phone, createdBy: m.email, coop: m.coop, sector: m.lasmecoSector, amountRequested: amount, amountRecommended: amount, amountApproved: amount, type: LOAN_TYPES[0], purpose: 'Business expansion', status, apName: m.accel, tenorMonths: tenor, disbursedAt: disbAt, schedule, repayments, createdAt: monthsAgoISO(disbMonths + 1), updatedAt: new Date().toISOString(), ...(extra || {}) }
  }
  const M = memberMap
  const loanRecs = []
  loanRecs.push({ memberId: M['Grace Umeh'].memberId, memberName: 'Grace Umeh', memberPhone: M['Grace Umeh'].phone, createdBy: M['Grace Umeh'].email, coop: M['Grace Umeh'].coop, sector: M['Grace Umeh'].lasmecoSector, amountRequested: 900000, type: LOAN_TYPES[0], purpose: 'Feed and stock', status: 'Applied', apName: M['Grace Umeh'].accel, createdAt: isoAgo(2 * day), updatedAt: isoAgo(2 * day) })
  loanRecs.push({ memberId: M['Aisha Bello'].memberId, memberName: 'Aisha Bello', memberPhone: M['Aisha Bello'].phone, createdBy: M['Aisha Bello'].email, coop: M['Aisha Bello'].coop, sector: M['Aisha Bello'].lasmecoSector, amountRequested: 1500000, type: LOAN_TYPES[0], purpose: 'Vehicle maintenance', status: 'In training', apName: M['Aisha Bello'].accel, createdAt: isoAgo(6 * day), updatedAt: isoAgo(3 * day) })
  loanRecs.push({ memberId: M['Ibrahim Sule'].memberId, memberName: 'Ibrahim Sule', memberPhone: M['Ibrahim Sule'].phone, createdBy: M['Ibrahim Sule'].email, coop: M['Ibrahim Sule'].coop, sector: M['Ibrahim Sule'].lasmecoSector, amountRequested: 2200000, amountRecommended: 2000000, type: LOAN_TYPES[0], purpose: 'Industrial machines', status: 'Shortlisted', apName: M['Ibrahim Sule'].accel, createdAt: isoAgo(9 * day), updatedAt: isoAgo(4 * day) })
  loanRecs.push({ memberId: M['Folake Adisa'].memberId, memberName: 'Folake Adisa', memberPhone: M['Folake Adisa'].phone, createdBy: M['Folake Adisa'].email, coop: M['Folake Adisa'].coop, sector: M['Folake Adisa'].lasmecoSector, amountRequested: 4000000, amountRecommended: 4000000, type: LOAN_TYPES[0], purpose: 'Bulk inventory', status: 'Coop validated', apName: M['Folake Adisa'].accel, createdAt: isoAgo(12 * day), updatedAt: isoAgo(5 * day) })
  loanRecs.push({ memberId: M['Chidi Okafor'].memberId, memberName: 'Chidi Okafor', memberPhone: M['Chidi Okafor'].phone, createdBy: M['Chidi Okafor'].email, coop: M['Chidi Okafor'].coop, sector: M['Chidi Okafor'].lasmecoSector, amountRequested: 5000000, amountRecommended: 5000000, type: LOAN_TYPES[0], purpose: 'Cold room', status: 'Bank assessment', apName: M['Chidi Okafor'].accel, createdAt: isoAgo(14 * day), updatedAt: isoAgo(6 * day) })
  loanRecs.push({ memberId: M['Segun Ade'].memberId, memberName: 'Segun Ade', memberPhone: M['Segun Ade'].phone, createdBy: M['Segun Ade'].email, coop: M['Segun Ade'].coop, sector: M['Segun Ade'].lasmecoSector, amountRequested: 6000000, amountRecommended: 6000000, amountApproved: 6000000, type: LOAN_TYPES[0], purpose: 'Studio expansion', status: 'BOI approved', apName: M['Segun Ade'].accel, createdAt: isoAgo(16 * day), updatedAt: isoAgo(7 * day) })
  loanRecs.push(mkSchedLoan(M['Folake Adisa'], 3000000, 24, 5, 0, 'Disbursed', { purpose: 'Inventory (working capital)', type: LOAN_TYPES[0] }))     // WC, early arrears
  loanRecs.push(mkSchedLoan(M['Chidi Okafor'], 4500000, 36, 10, 10, 'Repaying', { purpose: 'Distribution van (asset finance)', type: LOAN_TYPES[1] })) // Asset, current
  loanRecs.push(mkSchedLoan(M['Folake Adisa'], 2000000, 24, 6, 6, 'Repaying', { purpose: 'Inventory restock', type: LOAN_TYPES[0] }))                 // performing
  loanRecs.push(mkSchedLoan(M['Segun Ade'], 5000000, 36, 9, 9, 'Repaying', { purpose: 'Studio fit-out', type: LOAN_TYPES[1] }))                        // performing
  loanRecs.push(mkSchedLoan(M['Chidi Okafor'], 3200000, 36, 7, 7, 'Repaying', { purpose: 'Cold storage', type: LOAN_TYPES[1] }))                       // performing
  loanRecs.push(mkSchedLoan(M['Segun Ade'], 2400000, 24, 26, 24, 'Completed', { purpose: 'Studio equipment', type: LOAN_TYPES[0] }))                  // fully repaid
  // Agriculture accelerator portfolio (so accel.agric@coopeco.ng has a rating + earnings to view)
  loanRecs.push(mkSchedLoan(M['Grace Umeh'], 2500000, 24, 8, 8, 'Repaying', { purpose: 'Feed and layer stock', type: LOAN_TYPES[0] }))                 // performing
  loanRecs.push(mkSchedLoan(M['Grace Umeh'], 4200000, 36, 12, 12, 'Repaying', { purpose: 'Cold chain for eggs (asset finance)', type: LOAN_TYPES[1] })) // performing
  loanRecs.push(mkSchedLoan(M['Grace Umeh'], 1800000, 24, 26, 24, 'Completed', { purpose: 'Poultry expansion', type: LOAN_TYPES[0] }))                 // fully repaid
  const defLoan = mkSchedLoan(M['Ibrahim Sule'], 3600000, 36, 14, 1, 'Default', { purpose: 'Workshop machinery', type: LOAN_TYPES[1] })
  defLoan.recovery = recoveryPlan(loanRepayState(defLoan).outstanding, loanBreakdown(3600000))
  loanRecs.push(defLoan)
  loanRecs.push({ memberId: M['Grace Umeh'].memberId, memberName: 'Grace Umeh', memberPhone: M['Grace Umeh'].phone, createdBy: M['Grace Umeh'].email, coop: M['Grace Umeh'].coop, sector: M['Grace Umeh'].lasmecoSector, amountRequested: 8000000, type: LOAN_TYPES[0], purpose: 'Over-exposure request', status: 'Declined', apName: M['Grace Umeh'].accel, createdAt: isoAgo(20 * day), updatedAt: isoAgo(15 * day) })
  const apEmailFor = (name) => (ACCEL_SEEDS.find((a) => a.name === name) || {}).email || ''
  for (const r of loanRecs) { const id = genLoanId(); await kvSet('loan:' + id, { loanId: id, amountApproved: null, amountRecommended: null, ...r, apEmail: r.apName ? apEmailFor(r.apName) : '', loanId: id }); await addAudit({ trackingId: id, action: 'Application submitted', by: r.memberName, role: 'member', note: r.purpose || '', at: r.createdAt }) }
  // Accelerators are seeded/refreshed separately by ensureAccelerators() so name changes propagate without re-seeding everything.
  // 4) Wallets + esusu rotation
  await kvSet('wallet:' + mWallet(M['Folake Adisa'].memberId), { id: mWallet(M['Folake Adisa'].memberId), balance: 45000, txns: [{ tid: 'Ts1', type: 'topup', amount: 60000, note: 'Card top-up', by: 'Folake Adisa', at: isoAgo(8 * day) }, { tid: 'Ts2', type: 'debit', amount: 15000, note: 'Saved to cooperative', by: 'Folake Adisa', at: isoAgo(6 * day) }] })
  await kvSet('wallet:' + mWallet(M['Chidi Okafor'].memberId), { id: mWallet(M['Chidi Okafor'].memberId), balance: 30000, txns: [{ tid: 'Ts3', type: 'topup', amount: 50000, note: 'Card top-up', by: 'Chidi Okafor', at: isoAgo(7 * day) }, { tid: 'Ts4', type: 'debit', amount: 20000, note: 'Saved to cooperative', by: 'Chidi Okafor', at: isoAgo(5 * day) }] })
  const poolCoop = coopMap['Oshodi Market Women Coop']
  const order = [M['Folake Adisa'], M['Chidi Okafor']].map((m) => ({ memberId: m.memberId, name: m.name }))
  await kvSet('wallet:' + cWallet(poolCoop), { id: cWallet(poolCoop), balance: 35000, txns: [{ tid: 'Tp1', type: 'contribution-in', amount: 15000, note: 'Save from Folake Adisa', by: 'Folake Adisa', at: isoAgo(6 * day) }, { tid: 'Tp2', type: 'contribution-in', amount: 20000, note: 'Save from Chidi Okafor', by: 'Chidi Okafor', at: isoAgo(5 * day) }], esusu: { order, startAt: monthsAgoISO(1), freq: 'monthly', paid: [] } })
  // 5) Support tickets (varied status/category)
  const tk = (n, status, cat, subject, raiser, raiserName, ageDays, resolvedDays) => { const created = isoAgo(ageDays * day); const updated = resolvedDays != null ? isoAgo(resolvedDays * day) : created; return { ticketId: 'TK-25-' + String(90000 + n), status, category: cat, subject, raisedBy: raiser, raisedByName: raiserName, role: 'member', thread: [{ by: raiserName, role: 'member', text: subject, at: created }, ...(resolvedDays != null ? [{ by: 'Support desk', role: 'officer', text: 'Resolved and closed.', at: updated }] : [])], createdAt: created, updatedAt: updated } }
  const tickets = [
    tk(1, 'Open', 'Wallet / payments', 'Top-up not reflecting', M['Aisha Bello'].email, 'Aisha Bello', 5, null),
    tk(2, 'In progress', 'LASMECO / finance', 'Loan status stuck at assessment', M['Chidi Okafor'].email, 'Chidi Okafor', 4, null),
    tk(3, 'Resolved', 'Registration', 'How to file annual returns', M['Folake Adisa'].email, 'Folake Adisa', 9, 8),
    tk(4, 'Escalated', 'Data / privacy', 'Request to correct my BVN', M['Segun Ade'].email, 'Segun Ade', 6, null),
    tk(5, 'Resolved', 'Annual returns', 'Certificate download failed', M['Ibrahim Sule'].email, 'Ibrahim Sule', 12, 10),
  ]
  for (const t of tickets) await kvSet('ticket:' + t.ticketId, t)
  // 6) Notifications (in-app queues for staff + members)
  const nt = (to, title, body, ageDays) => ({ id: genNotifId(), to, title, body, event: 'seed', at: isoAgo(ageDays * day), read: false })
  const notifs = [
    nt('role:officer', 'New support ticket', 'Top-up not reflecting \u2014 Wallet / payments', 5),
    nt('role:leadership', 'New support ticket', 'Request to correct my BVN \u2014 Data / privacy', 6),
    nt('role:accelerator', 'New LASMECO application', 'Grace Umeh \u2014 Agriculture', 2),
    nt('role:leadership', 'New cooperative application', 'Kosofe Poultry Farmers Coop', 3),
    nt(M['Folake Adisa'].email, 'Welcome to MCCTI CoopEco', 'Your member profile is set up.', 10),
    nt(M['Chidi Okafor'].email, 'LASMECO application update', 'Your application is now: Repaying', 4),
  ]
  for (const n of notifs) await kvSet('notif:' + n.id, n)
  // 7) Documents (metadata) for an approved cooperative
  const docCoop = coopMap['Eti-Osa Fashion Enterprise Coop']
  await kvSet('doc:' + docCoop + ':Dseed1', { id: 'Dseed1', coopId: docCoop, name: 'by-laws.pdf', category: 'By-laws', size: 284000, type: 'application/pdf', url: '', path: '', storage: 'demo', uploadedBy: 'T. Coker', uploadedAt: isoAgo(9 * day), verified: true, verifiedBy: 'Area Registrar' })
  await kvSet('doc:' + docCoop + ':Dseed2', { id: 'Dseed2', coopId: docCoop, name: 'registration-certificate.pdf', category: 'Registration certificate', size: 156000, type: 'application/pdf', url: '', path: '', storage: 'demo', uploadedBy: 'T. Coker', uploadedAt: isoAgo(9 * day), verified: false })
  await kvSet('integration:seed-v12', { done: true, at: new Date().toISOString() })
  return true
}
const ACCEL_SEEDS = [
  { email: 'accel.agric@coopeco.ng', name: 'Agriculture Accelerator', sectors: ['Agriculture'] },
  { email: 'accel.mfg@coopeco.ng', name: 'Manufacturing Accelerator', sectors: ['Manufacturing'] },
  { email: 'accel.health@coopeco.ng', name: 'Health Accelerator', sectors: ['Health'] },
  { email: 'accel.tourism@coopeco.ng', name: 'Tourism Accelerator', sectors: ['Tourism'] },
  { email: 'accel.services@coopeco.ng', name: 'Service Delivery Accelerator', sectors: ['Service Delivery'] },
  { email: 'accel.circular@coopeco.ng', name: 'Circular Economy Accelerator', sectors: ['Circular Economy'] },
  { email: 'accel.digital@coopeco.ng', name: 'Digital Economy Accelerator', sectors: ['Digital Economy'] },
]
async function listAccelerators() { return (await kvList('accelerator:')).sort((a, b) => (a.name > b.name ? 1 : -1)) }
/* Accelerator rating = share of the MSMEs it sponsored that were approved for a loan.
   "Approved" = reached bank assessment or beyond (Bank assessment, BOI approved, Disbursed,
   Repaying, Completed, Default). "Decided" excludes applications still early in the pipeline
   (Applied, In training, Shortlisted, Coop validated), which have no outcome yet. */
const ACCEL_APPROVED_STATES = ['Bank assessment', 'BOI approved', 'Disbursed', 'Repaying', 'Completed', 'Default']
const ACCEL_PENDING_STATES = ['Applied', 'In training', 'Shortlisted', 'Coop validated']
function accelLoans(accel, loans) {
  const names = accel.sectors || []
  return (loans || []).filter((l) => (accel.email && l.apEmail === accel.email) || (accel.name && l.apName === accel.name) || (names.indexOf(l.sector) > -1))
}
const ACCEL_EARNED_STATES = ['Disbursed', 'Repaying', 'Completed', 'Default'] // fee is earned once the loan is disbursed
function accelEarnings(accel, loans) {
  const earned = accelLoans(accel, loans).filter((l) => ACCEL_EARNED_STATES.indexOf(l.status) > -1)
  const perLoan = earned.map((l) => ({ loanId: l.loanId, member: l.memberName, coop: l.coop, sector: l.sector, status: l.status, amount: l.amountApproved || l.amountRequested || 0, fee: (loanBreakdown(l.amountApproved || l.amountRequested || 0).apFee) || 0, at: l.disbursedAt || l.updatedAt }))
  const gross = perLoan.reduce((a, x) => a + x.fee, 0)
  return { count: earned.length, gross, perLoan }
}
async function accelWallet(email) {
  const w = await kvGet('accelwallet:' + email)
  return w || { id: email, withdrawn: 0, account: null, txns: [] }
}
async function saveAccelWallet(email, w) { await kvSet('accelwallet:' + email, { ...w, id: email }) }
async function accelDrawdown(email, amount, account, gross) {
  const w = await accelWallet(email)
  const available = gross - (w.withdrawn || 0)
  if (amount <= 0 || amount > available) throw new Error('Amount exceeds available earnings')
  const txn = { tid: 'AW' + Math.random().toString(36).slice(2, 7).toUpperCase(), type: 'drawdown', amount, account, at: new Date().toISOString() }
  await saveAccelWallet(email, { ...w, withdrawn: (w.withdrawn || 0) + amount, account, txns: [txn, ...(w.txns || [])] })
  return txn
}
function accelRating(accel, loans) {
  const ls = accelLoans(accel, loans)
  const decided = ls.filter((l) => ACCEL_APPROVED_STATES.indexOf(l.status) > -1 || l.status === 'Declined')
  const approved = ls.filter((l) => ACCEL_APPROVED_STATES.indexOf(l.status) > -1)
  const pending = ls.filter((l) => ACCEL_PENDING_STATES.indexOf(l.status) > -1)
  const rate = decided.length ? approved.length / decided.length : null // null = no decided outcomes yet
  const stars = rate == null ? 0 : Math.max(1, Math.round(rate * 5))
  const grade = rate == null ? 'Unrated' : rate >= 0.8 ? 'Excellent' : rate >= 0.6 ? 'Strong' : rate >= 0.4 ? 'Fair' : 'Developing'
  return { sponsored: ls.length, decided: decided.length, approved: approved.length, pending: pending.length, rate, pct: rate == null ? null : Math.round(rate * 100), stars, grade }
}
async function getAccelerator(email) { return kvGet('accelerator:' + email) }
async function saveAccelerator(rec) { const prior = await kvGet('accelerator:' + rec.email); const status = rec.status || (prior && prior.status) || 'Pending'; await kvSet('accelerator:' + rec.email, { ...rec, status, updatedAt: new Date().toISOString() }, rec.uid || null); return rec }
async function acceleratorsForSector(sector) { return (await listAccelerators()).filter((a) => (a.sectors || []).includes(sector) && (a.status || 'Pending') === 'Appointed') }
async function ensureAccelerators() {
  if (await kvGet('integration:accel-v8')) return false
  const prior = await kvList('accelerator:')
  for (const a of prior) { if (a && a.email && a.email.startsWith('accel.') && a.email.endsWith('@coopeco.ng')) await kvDelete('accelerator:' + a.email) }
  for (const a of ACCEL_SEEDS) await kvSet('accelerator:' + a.email, { ...a, status: 'Appointed', createdAt: new Date().toISOString() })
  await kvSet('integration:accel-v8', { done: true, at: new Date().toISOString() })
  return true
}
async function ensureLoanDocsSeed() {
  if (await kvGet('integration:loandocs-v4')) return false
  try {
    const loans = await listLoans()
    const targets = loans.filter((l) => ['Coop validated', 'Bank assessment', 'BOI approved', 'Disbursed', 'Repaying'].includes(l.status)).slice(0, 4)
    for (const l of targets) {
      const cats = ['Valid ID (NIN slip / passport)', 'BVN confirmation', '12-month bank statements (all accounts)', 'Credit bureau report (business & promoter)', CREDIT_CLEARANCE_DOC]
      for (let i = 0; i < cats.length; i++) {
        const id = 'LD' + String(l.loanId).replace(/[^0-9]/g, '') + i
        await kvSet('doc:' + l.loanId + ':' + id, { id, coopId: l.loanId, name: cats[i].toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') + '.pdf', category: cats[i], size: 180000 + i * 24000, type: 'application/pdf', url: '', path: '', storage: 'demo', uploadedBy: l.memberName, uploadedByRole: 'member', uploadedAt: new Date().toISOString(), verified: (l.status !== 'Coop validated') && i < 3 })
      }
    }
  } catch (e) { /* best-effort */ }
  // Seed approved independent audits so several cooperatives can guarantee their members.
  try {
    const coops = await listCoops()
    const auditReady = ['Kosofe Poultry Farmers Coop', 'Oshodi Market Women Coop', 'Ikeja Hospital Staff Multipurpose Coop', 'Eti-Osa Fashion Enterprise Coop']
    for (const name of auditReady) {
      const c = coops.find((x) => x.name === name)
      if (!c) continue
      const key = 'coopaudit:' + c.trackingId
      await kvSet('doc:' + key + ':CA1', { id: 'CA1', coopId: key, name: 'independent-audit-2025.pdf', category: COOP_AUDIT_DOC, size: 320000, type: 'application/pdf', url: '', path: '', storage: 'demo', uploadedBy: c.custodian || 'Cooperative Secretary', uploadedByRole: 'society', uploadedAt: new Date().toISOString(), verified: true, verifiedBy: 'MCCTI Leadership' })
    }
  } catch (e) { /* best-effort */ }
  await kvSet('integration:loandocs-v4', { done: true, at: new Date().toISOString() })
  return true
}
let _seedInFlight = null
async function ensureSeedData() {
  if (_seedInFlight) return _seedInFlight
  _seedInFlight = (async () => {
    let changed = false
    // Registry sync: on live, only ingest when a real API returns data (never the sample feed).
    try {
      const last = await kvGet('integration:sekat')
      const stale = !last || !last.lastSync || (Date.now() - new Date(last.lastSync).getTime()) > 86400000
      if (stale) {
        const a = await syncFromSekat({ name: 'SEKAT gateway', role: 'officer', email: 'sekat@system' }, true)
        const b = await syncFromQoop({ name: 'QooP gateway', role: 'officer', email: 'qoop@system' }, true)
        if (a || b) changed = true
      }
    } catch (e) { /* not configured */ }
    try { if (await ensureValueChains()) changed = true } catch (e) { /* value chains are structural: provision in live too */ }
    if (!DEMO_DATA) return changed // live database: never seed fictional records
    try { if (await seedDemoData()) changed = true } catch (e) { /* best-effort, once */ }
    try { if (await ensureAccelerators()) changed = true } catch (e) { /* keep accelerator directory current */ }
    try { if (await ensureLoanDocsSeed()) changed = true } catch (e) { /* seed loan documents once */ }
    try { if (await ensureCoopSnapshots()) changed = true } catch (e) { /* seed contribution history once */ }
    try { await ensureMonthlySnapshots() } catch (e) { /* record all cooperatives once per month */ }
    return changed
  })()
  try { return await _seedInFlight } finally { _seedInFlight = null }
}
async function seedDemoLoans() {
  if (supa) return
  if ((await kvList('loan:')).length) return
  const base = Date.now() - 5 * 86400000
  const seeds = [
    { memberName: 'Tunde Salami', coop: 'Ibeju-Lekki Farmers Multipurpose Coop', sector: 'Agriculture', amountRequested: 2000000, type: LOAN_TYPES[0], purpose: 'Irrigation equipment', status: 'Applied', apName: '' },
    { memberName: 'Adaeze Okonkwo', coop: 'Ikeja Grand Traders Cooperative', sector: 'Trade', amountRequested: 6000000, amountRecommended: 5000000, type: LOAN_TYPES[0], purpose: 'Expand retail stock', status: 'Shortlisted', apName: 'Trade & Commerce Accelerator' },
    { memberName: 'Emeka Balogun', coop: 'Idumota Textile Merchants Coop', sector: 'Trade', amountRequested: 10000000, amountRecommended: 10000000, type: LOAN_TYPES[0], purpose: 'New machinery', status: 'Coop validated', apName: 'Manufacturing Accelerator' },
    { memberName: 'Blessing Achebe', coop: 'Ikeja Grand Traders Cooperative', sector: 'Trade', amountRequested: 3000000, amountRecommended: 3000000, amountApproved: 3000000, type: LOAN_TYPES[1], purpose: 'Inventory finance', status: 'Disbursed', apName: 'Trade & Commerce Accelerator' },
  ]
  for (let i = 0; i < seeds.length; i++) {
    const id = genLoanId(); const created = new Date(base + i * 86400000).toISOString()
    await kvSet('loan:' + id, { loanId: id, amountApproved: null, amountRecommended: null, ...seeds[i], createdBy: 'qoop@system', createdAt: created, updatedAt: created })
    await addAudit({ trackingId: id, action: 'Application submitted', by: seeds[i].memberName, role: 'member', note: seeds[i].purpose, at: created })
  }
}

function LoanTable({ loans, onOpen, ctx }) {
  const [q, setQ] = useState(''), [st, setSt] = useState('All'), [sel, setSel] = useState(() => new Set()), [busy, setBusy] = useState(false)
  if (!loans.length) return <p className="muted-line">No applications to show.</p>
  const statuses = ['All', ...Array.from(new Set(loans.map((l) => l.status)))]
  const filtered = loans.filter((l) => (st === 'All' || l.status === st) && (!q || [l.memberName, l.loanId, l.coop, l.sector].join(' ').toLowerCase().includes(q.toLowerCase())))
  const toggle = (id) => { const n = new Set(sel); n.has(id) ? n.delete(id) : n.add(id); setSel(n) }
  const allOn = filtered.length > 0 && filtered.every((l) => sel.has(l.loanId))
  const toggleAll = () => { const n = new Set(sel); if (allOn) filtered.forEach((l) => n.delete(l.loanId)); else filtered.forEach((l) => n.add(l.loanId)); setSel(n) }
  const chosen = filtered.filter((l) => sel.has(l.loanId))
  const exportCsv = () => downloadCSV('lasmeco-loans.csv', chosen.map((l) => ({ applicant: l.memberName, loanId: l.loanId, cooperative: l.coop, sector: l.sector, amount: l.amountApproved || l.amountRecommended || l.amountRequested, status: l.status })))
  const notifyChosen = async () => { setBusy(true); for (const l of chosen) { try { await notify({ to: l.createdBy, title: 'Update on your LASMECO application', body: 'There is an update on your application ' + l.loanId + '. Please open the platform to review.', event: 'loan', phone: l.memberPhone }) } catch (e) { /* continue */ } } setBusy(false); toast('Notified ' + chosen.length + ' member' + (chosen.length === 1 ? '' : 's') + '.', 'success'); setSel(new Set()) }
  return (
    <div>
      <div className="table-filter">
        <input className="table-search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search applicant, ID, cooperative or sector…" aria-label="Search applications" />
        <select value={st} onChange={(e) => setSt(e.target.value)} aria-label="Filter by status">{statuses.map((s) => <option key={s}>{s}</option>)}</select>
        <span className="table-count">{filtered.length} of {loans.length}</span>
      </div>
      {sel.size > 0 && <div className="bulk-bar"><span>{sel.size} selected</span><button className="btn btn-outline btn-sm" onClick={exportCsv}>Export CSV</button>{!isReviewer(ctx) && <button className="btn btn-outline btn-sm" disabled={busy} onClick={notifyChosen}>Notify members</button>}<button className="link-inline" onClick={() => setSel(new Set())}>Clear</button></div>}
      {filtered.length ? <div className="rtable-wrap"><table className="rtable">
        <thead><tr><th className="th-check"><input type="checkbox" checked={allOn} onChange={toggleAll} aria-label="Select all" /></th><th>Applicant</th><th>Loan ID</th><th>Cooperative</th><th>Sector</th><th>Requested</th><th>Status</th><th></th></tr></thead>
        <tbody>{filtered.map((l) => (<tr key={l.loanId} className={cx(sel.has(l.loanId) && 'row-sel')}><td className="th-check"><input type="checkbox" checked={sel.has(l.loanId)} onChange={() => toggle(l.loanId)} aria-label={'Select ' + l.memberName} /></td><td className="td-name">{l.memberName}</td><td className="mono">{l.loanId}</td><td>{l.coop}</td><td>{l.sector}</td><td className="mono">{fmtNaira(l.amountApproved || l.amountRecommended || l.amountRequested)}</td><td><StatusChip status={l.status} kind="loan" /></td><td><button className="btn-open" onClick={() => onOpen(l)}>Open</button></td></tr>))}</tbody>
      </table></div> : <p className="muted-line">No applications match your search.</p>}
    </div>
  )
}
function LoanApplyForm({ ctx, member, onDone, onCancel }) {
  const [f, setF] = useState({ amountRequested: '', type: LOAN_TYPES[0], purpose: '', sector: LASMECO_SECTORS[0] })
  const [accels, setAccels] = useState([]), [apEmail, setApEmail] = useState('')
  const [busy, setBusy] = useState(false), [err, setErr] = useState('')
  const [coopAdm, setCoopAdm] = useState(null)
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value })
  useEffect(() => { acceleratorsForSector(f.sector).then((list) => { setAccels(list); setApEmail(list[0] ? list[0].email : '') }) }, [f.sector])
  useEffect(() => { listCoops().then((cs) => { const mc = cs.find((c) => c.name === member.coop); setCoopAdm(mc ? coopAdmission(mc) : { admitted: false, outstanding: [{ label: 'Cooperative not found on the registry' }] }) }) }, [member.coop])
  const submit = async () => {
    setErr('')
    const amt = Number(f.amountRequested) || 0
    if (amt <= 0) { setErr('Enter the amount you need.'); return }
    if (amt > 10000000) { setErr('The LASMECO cap is ₦10,000,000.'); return }
    if (!f.purpose.trim()) { setErr('Describe what the loan is for.'); return }
    if (accels.length && !apEmail) { setErr('Select an accelerator to prepare your application.'); return }
    if (coopAdm && !coopAdm.admitted) { setErr('Your cooperative is not yet admitted to the LASMECO scheme, so it cannot nominate members yet. Ask your cooperative to complete admission with MCCTI.'); return }
    setBusy(true)
    const ap = accels.find((a) => a.email === apEmail)
    try { await createLoan({ memberId: member.memberId, memberName: member.name, memberPhone: member.phone, coop: member.coop, sector: f.sector, amountRequested: amt, type: f.type, purpose: f.purpose.trim(), apName: ap ? ap.name : '', apEmail: ap ? ap.email : '' }, ctx); onDone() }
    catch (e) { setErr(e.message || 'Could not submit the application.') } setBusy(false)
  }
  return (
    <div className="panel">
      <div className="panel-head"><h3>Apply for LASMECO finance</h3><button className="link-back" onClick={onCancel}>Cancel</button></div>
      <p className="panel-sub">{member.name} &middot; {member.coop}</p>
      <div className="form-grid">
        <label className="field"><span>LASMECO priority sector</span><select value={f.sector} onChange={set('sector')}>{LASMECO_SECTORS.map((s) => <option key={s}>{s}</option>)}</select></label>
        <label className="field"><span>Accelerator</span><select value={apEmail} onChange={(e) => setApEmail(e.target.value)} disabled={!accels.length}>{accels.length ? accels.map((a) => <option key={a.email} value={a.email}>{a.name}</option>) : <option value="">No accelerator for this sector yet</option>}</select></label>
        <label className="field"><span>Amount needed (₦, up to 10,000,000)</span><input type="number" value={f.amountRequested} onChange={set('amountRequested')} placeholder="0" /></label>
        <label className="field"><span>Loan type</span><select value={f.type} onChange={set('type')}>{LOAN_TYPES.map((t) => <option key={t}>{t}</option>)}</select></label>
        <label className="field span2"><span>Purpose</span><textarea value={f.purpose} onChange={set('purpose')} rows={3} placeholder="What the finance is for and the growth it will drive." /></label>
      </div>
      {member.msme && member.msme.monthlyTurnover ? <p className="panel-note">Indicative facility limit for your turnover ({fmtNaira(member.msme.monthlyTurnover)}/month): about {fmtNaira(facilityLimit(member, f.type, true))} ({loanVariant(f.type).label}). If 12-month turnover consistency is below the RAC threshold this reduces to {fmtNaira(facilityLimit(member, f.type, false))}. Final limit is set by Sterling Bank on assessment.</p> : null}
      {coopAdm && !coopAdm.admitted ? <p className="auth-err">Your cooperative is not yet admitted to LASMECO ({coopAdm.outstanding.length} requirement(s) outstanding). It must be admitted by MCCTI before members can be nominated.</p> : null}
      {!accels.length && <p className="panel-note">No accelerator is registered for this sector yet. You can still submit and MCCTI will assign one, or choose another sector.</p>}
      {err && <p className="auth-err">{err}</p>}
      <div className="panel-actions"><button className="btn btn-gold" onClick={submit} disabled={busy}>{busy ? 'Submitting…' : 'Submit to Accelerator'}</button></div>
      <p className="panel-note">No upfront fees. Your chosen Accelerator prepares you to bankable standard and recommends an amount. 9% fixed, up to 36 months, 6-month moratorium. A ₦200,000 Accelerator fee and 1% BOI appraisal fee are deducted only on disbursement. This is not legal advice.</p>
    </div>
  )
}
const LASMECO_DOC_REQUIREMENTS = ['Valid ID (NIN slip / passport)', 'BVN confirmation', '12-month bank statements (all accounts)', 'Credit bureau report (business & promoter)', 'Credit clearance letter (no outstanding loans)', 'Cooperative letter of guarantee (25%)', 'Cooperative letter of introduction', 'CAC / business registration certificate', 'Operating licences / permits', 'Cash-flow analysis with assumptions', "Promoter's statement of net worth", 'Asset register & vendor invoices (asset finance)', 'Insurance (asset + credit-life)', 'Passport photograph']
const CREDIT_CLEARANCE_DOC = 'Credit clearance letter (no outstanding loans)'
const GUARANTEE_LETTER_DOC = 'Cooperative letter of guarantee (25%)'
function lasmecoChecklist(loan, member, docs) {
  const has = (c) => docs.find((x) => x.category === c)
  const items = []
  items.push({ label: 'BVN verified', ok: !!(member && member.kyc && member.kyc.bvnVerified) })
  items.push({ label: 'NIN verified', ok: !!(member && member.kyc && member.kyc.ninVerified) })
  items.push({ label: 'Recommended by an accelerator', ok: !!loan.apName })
  items.push({ label: 'Affiliated to a cooperative society', ok: !!(member && member.coop) })
  items.push({ label: 'Operating 12+ months (not a startup)', ok: !!(member && member.msme && (member.msme.yearsInOperation || 0) >= 1) })
  const score = member ? scoreMember(member).score : 0
  items.push({ label: 'Acceptable credit profile \u2014 score at least 500 (currently ' + score + ')', ok: score >= 500 })
  // Mandatory credit-clearance letter from a credit bureau, uploaded by the member.
  const cc = has(CREDIT_CLEARANCE_DOC)
  items.push({ label: CREDIT_CLEARANCE_DOC, ok: !!cc && !!cc.verified, verified: cc ? cc.verified : false, doc: true, mandatory: true })
  // Mandatory cooperative letter of guarantee (25%), generated on cooperative approval.
  const gl = has(GUARANTEE_LETTER_DOC)
  items.push({ label: GUARANTEE_LETTER_DOC, ok: !!gl && !!gl.verified, verified: gl ? gl.verified : false, doc: true, mandatory: true })
  const keyDocs = ['12-month bank statements (all accounts)', 'Credit bureau report (business & promoter)', 'Cooperative letter of introduction', 'Cash-flow analysis with assumptions', 'CAC / business registration certificate']
  keyDocs.forEach((c) => { const d = has(c); items.push({ label: c, ok: !!d, verified: d ? d.verified : false, doc: true }) })
  const outstanding = items.filter((i) => !i.ok)
  const unverifiedDocs = items.filter((i) => i.doc && i.ok && !i.verified)
  return { items, outstanding, unverifiedDocs, qualifies: outstanding.length === 0 }
}
function LoanKycPanel({ loan, ctx }) {
  const [member, setMember] = useState(undefined), [docs, setDocs] = useState([]), [busy, setBusy] = useState(false)
  const role = ctx.role
  const isBorrower = role === 'member' && (loan.createdBy === ctx.email || loan.memberId === ctx.focusId)
  const canVerify = role === 'sterling'
  const reloadDocs = useCallback(() => listDocs(loan.loanId).then(setDocs), [loan.loanId])
  useEffect(() => { (async () => { const ms = await listMembers(); setMember(ms.find((m) => m.memberId === loan.memberId) || null) })() }, [loan.memberId])
  useEffect(() => { reloadDocs() }, [reloadDocs])
  const chk = lasmecoChecklist(loan, member, docs)
  const requestFeedback = async () => {
    setBusy(true)
    const missing = chk.outstanding.map((i) => '\u2022 ' + i.label).join('\n')
    await notify({ to: loan.createdBy, title: 'Action needed on your LASMECO application', body: 'To continue, please submit or update:\n' + (missing || 'Documents pending verification'), event: 'loan', phone: loan.memberPhone })
    setBusy(false); toast('The member has been notified (in-app' + (loan.memberPhone ? ' and SMS' : '') + ') of the outstanding items.')
  }
  if (member === undefined) return <div className="returns-box"><h4>Application documents &amp; KYC</h4><p className="muted-line">Loading…</p></div>
  return (
    <div className="returns-box"><h4>Application documents &amp; KYC</h4>
      <p className="muted-line">{isBorrower ? 'Submit the documents below so your Accelerator and Sterling Bank can verify your KYC and process your application. You will be notified if anything is outstanding.' : 'Documents submitted by the applicant. Sterling Bank verifies each item for KYC; BOI sees the verified set.'}</p>
      <div className="kyc-check">{chk.items.map((it, i) => (<div className={cx('kyc-item', it.ok && 'ok')} key={i}><span className="kyc-mark">{it.ok ? '\u2713' : '\u25cb'}</span><span className="kyc-label">{it.label}{it.mandatory ? ' (mandatory)' : ''}{it.doc && it.ok ? (it.verified ? ' \u2014 verified' : ' \u2014 submitted, awaiting verification') : ''}</span></div>))}</div>
      <div className={cx('kyc-status', chk.qualifies ? 'ok' : 'pending')}>{chk.qualifies ? 'All requirements met \u2014 ready to proceed to assessment.' : chk.outstanding.length + ' item(s) outstanding' + (chk.unverifiedDocs.length ? ', ' + chk.unverifiedDocs.length + ' awaiting Sterling verification' : '') + '.'}</div>
      {isBorrower ? <div className="doc-guide"><h5>Documents to upload</h5><ul>{LASMECO_DOC_REQUIREMENTS.map((c) => { const has = docs.find((d) => d.category === c); return <li key={c} className={cx(has && 'done')}><span aria-hidden="true">{has ? '\u2713' : '\u2022'}</span> {c}{c === CREDIT_CLEARANCE_DOC ? ' (mandatory — from a credit bureau, confirming no outstanding or pending loans)' : ''}{c.indexOf('asset finance') > -1 ? ' (only if applying for Asset Finance)' : ''}</li> })}</ul><p className="chart-note">Pick the matching type from the dropdown below, choose your file, and it uploads straight to your Accelerator and Sterling Bank for review.</p></div> : null}
      {isReviewer(ctx) && !DEMO_DATA ? <p className="panel-note">Applicant documents are hidden in review access because this database holds real member data (NDPR). The qualification checklist above shows the review outcome without exposing the underlying KYC files.</p> : <DocumentsPanel coopId={loan.loanId} ctx={ctx} canVerify={canVerify} canUpload={isBorrower} categories={LASMECO_DOC_REQUIREMENTS} onChange={reloadDocs} />}
      {!isBorrower && (role === 'accelerator' || role === 'sterling') && (chk.outstanding.length > 0) && <div className="panel-actions"><button className="btn btn-outline btn-sm" disabled={busy} onClick={requestFeedback}>Notify member of outstanding items</button></div>}
    </div>
  )
}
function RevenuePanel({ ctx }) {
  const [fig, setFig] = useState(null), [amounts, setAmounts] = useState({}), [busy, setBusy] = useState('')
  useEffect(() => { escrowFigures().then(setFig) }, [])
  const fixed = { 'Cooperative registration': COOP_FEES.registration, 'Annual returns filing': COOP_FEES.annualReturns, 'Directory & verification search': 2000 }
  const pay = (name) => async () => {
    const amt = Number(amounts[name] != null ? amounts[name] : (fixed[name] || 0)) || 0
    if (amt <= 0) { toast('Enter an amount to collect for this stream.'); return }
    setBusy(name)
    const r = await collectPayment({ email: ctx.email, amountNaira: amt, purpose: name, metadata: { stream: name } })
    setBusy('')
    if (r.ok) toast('Payment ' + (r.ref && String(r.ref).startsWith('DEMO') ? '(demo) ' : '') + 'received for ' + name + '.')
    else if (!r.cancelled) toast('Payment could not be completed.')
  }
  if (!fig) return <p className="muted-line">Loading revenue…</p>
  const accrued = { 'Cooperative registration': fig.regFees, 'Annual returns filing': fig.returnsFees, 'LASMECO disbursement portal': fig.portalFees, 'Digital wallet & payments': fig.walletFees }
  return (
    <div className="ws">
      <div className="statgrid"><div className="stat"><span className="stat-fig">{fmtNaira(fig.accrued)}</span><span className="stat-lab">Total accrued to escrow</span></div><div className="stat"><span className="stat-fig">{fmtNaira(fig.portalFees)}</span><span className="stat-lab">Disbursement portal (2.5%)</span></div><div className="stat"><span className="stat-fig">{fmtNaira(fig.boiMgmtFeeQuarter)}</span><span className="stat-lab">BOI mgmt fee / quarter (2.5% p.a.)</span></div><div className="stat"><span className="stat-fig">{fmtNaira(fig.walletFees)}</span><span className="stat-lab">Wallet fees (1%)</span></div></div>
      <div className="revenue-grid">{PRICING.map((pr) => (
        <div className="revenue-card" key={pr.name}>
          <div className="revenue-top"><h4>{pr.name}</h4><span className="revenue-price">{pr.price}<em> {pr.unit}</em></span></div>
          <p className="revenue-who">{pr.who}</p>
          <p className="revenue-body">{pr.body}</p>
          {accrued[pr.name] != null && <p className="revenue-accrued">Accrued to date: {fmtNaira(accrued[pr.name])}</p>}
          {!isReviewer(ctx) && <div className="revenue-pay"><input type="number" value={amounts[pr.name] != null ? amounts[pr.name] : (fixed[pr.name] || '')} onChange={(e) => setAmounts({ ...amounts, [pr.name]: e.target.value })} placeholder="Amount (₦)" /><button className="btn btn-gold btn-sm" disabled={busy === pr.name} onClick={pay(pr.name)}>{busy === pr.name ? 'Opening\u2026' : (PAYSTACK_PUBLIC ? 'Send pay link' : 'Collect (demo)')}</button></div>}
        </div>))}</div>
      <p className="panel-note">Each stream can raise a payment on request through a secure Paystack checkout (test/demo until live keys are set). Percentage and custom streams also accrue automatically from platform activity; the amount field lets you raise a one-off charge or reconciliation for any stream.</p>
    </div>
  )
}
function PortfolioMonitoring() {
  const [m, setM] = useState(null), [gg, setGg] = useState(0)
  useEffect(() => { listLoans().then((l) => { setM(nplMetrics(l)); setGg(globalGuaranteeUsed(l)) }) }, [])
  if (!m) return <p className="muted-line">Computing portfolio…</p>
  const pct = (x) => (x * 100).toFixed(1) + '%'
  const ggPct = gg / GLOBAL_GUARANTEE_LIMIT
  return (
    <div className="ws">
      <div className={cx('kyc-status', m.status === 'Healthy' ? 'ok' : 'pending')} style={m.status === 'Suspended' ? { background: '#f7e4de', color: 'var(--err)', borderColor: 'var(--err)' } : undefined}>Portfolio status: {m.status}. {m.status === 'Suspended' ? 'NPL \u2265 10% \u2014 new disbursements should be suspended until recovery.' : m.status === 'Review' ? 'NPL \u2265 5% \u2014 Fund review and recovery drive triggered.' : 'NPL within tolerance.'}</div>
      <div className="statgrid">
        <div className="stat"><span className="stat-fig">{fmtNaira(m.disbursed)}</span><span className="stat-lab">Disbursed (guaranteed {fmtNaira(m.guaranteed)})</span></div>
        <div className="stat"><span className="stat-fig" style={m.nplRatio >= 0.05 ? { color: 'var(--err)' } : undefined}>{pct(m.nplRatio)}</span><span className="stat-lab">NPL ratio ({fmtNaira(m.nplValue)})</span></div>
        <div className="stat"><span className="stat-fig" style={m.lossNorm >= 0.01 ? { color: 'var(--err)' } : undefined}>{pct(m.lossNorm)}</span><span className="stat-lab">Loss norm (RAC cap 1%)</span></div>
        <div className="stat"><span className="stat-fig" style={ggPct >= 1 ? { color: 'var(--err)' } : undefined}>{pct(ggPct)}</span><span className="stat-lab">Global guarantee used ({fmtNaira(gg)} of ₦5bn)</span></div>
      </div>
      {m.nplLoans.length ? <div className="risk-list">{m.nplLoans.map((x, i) => (<div className="risk-item" key={i}><span className={cx('chip', x.loan.status === 'Default' ? 'st-returned' : 'st-review')}>{x.loan.status === 'Default' ? 'Default' : x.overdue + ' overdue'}</span><div className="risk-body"><strong>{x.loan.memberName} — {x.loan.loanId}</strong><p>{x.loan.sector} &middot; outstanding {fmtNaira(x.outstanding)}</p></div></div>))}</div> : <div className="empty"><span className="empty-mark">&#9670;</span><h3>No non-performing loans</h3><p>All disbursed loans are performing.</p></div>}
      <p className="panel-note">NPL = loans in default or 3+ installments overdue, over total disbursed. Loss norm = crystallised guarantee losses over guaranteed exposure (RAC cap 1%). Global guarantee cap ₦5bn; single-obligor guarantee cap ₦5m (50% of the ₦10m loan ceiling). Thresholds: NPL review 5%, suspend 10%.</p>
    </div>
  )
}
function SecurityChecklist({ loan, ctx, onChanged }) {
  const [l, setL] = useState(loan), [busy, setBusy] = useState(false)
  const canEdit = ctx.role === 'sterling'
  const b = loanBreakdown(l.amountApproved || l.amountRecommended || l.amountRequested)
  const s = securityState(l)
  const amt = { cashDeposit: b.collateral, lien: b.lien, sterlingGuarantee: b.sterlingGuarantee, coopGuarantee: b.coopGuarantee }
  const toggle = async (k) => { if (!canEdit) return; setBusy(true); const security = { ...(l.security || {}), [k]: !(l.security && l.security[k]) }; const next = await updateLoan(l.loanId, { security }, ctx, 'Security ' + (security[k] ? 'confirmed' : 'cleared') + ': ' + k, ''); setL(next); setBusy(false); onChanged && onChanged() }
  return (
    <div className="returns-box"><h4>Security &amp; guarantee checklist ({s.done}/{s.total})</h4>
      <div className="kyc-check">{SECURITY_ITEMS.map(([k, label]) => { const on = !!(l.security && l.security[k]); return (<button type="button" className={cx('kyc-item', 'sec-item', on && 'ok', canEdit && 'clickable')} key={k} disabled={!canEdit || busy} onClick={() => toggle(k)}><span className="kyc-mark">{on ? '\u2713' : '\u25cb'}</span><span className="kyc-label">{label}{amt[k] ? ' \u2014 ' + fmtNaira(amt[k]) : ''}</span></button>) })}</div>
      <div className={cx('kyc-status', s.complete ? 'ok' : 'pending')}>{s.complete ? 'All security perfected \u2014 cleared for guarantee issuance.' : (s.total - s.done) + ' security item(s) outstanding before disbursement.'}</div>
      <p className="panel-note">{canEdit ? 'Confirm each item as it is perfected during assessment.' : 'Sterling Bank completes this during assessment; BOI and leadership see the confirmed status.'}</p>
    </div>
  )
}
function CoopTierPanel({ coop, ctx, onChanged }) {
  const [c, setC] = useState(coop), [nav, setNav] = useState(String(coop.nav || '')), [busy, setBusy] = useState(false), [loans, setLoans] = useState([])
  const canEdit = ['officer', 'leadership'].includes(ctx.role)
  useEffect(() => { listLoans().then(setLoans) }, [])
  const active = loans.filter((l) => l.coop === c.name && !['Declined', 'Completed', 'Default'].includes(l.status)).length
  const nl = coopNominationLimit(c, active)
  const adm = coopAdmission(c)
  const liab = coopGuaranteeLiability(c.name, loans)
  const setTier = async (t) => { setBusy(true); const next = await updateCoop(c.trackingId, { tier: t }, ctx, 'Tier classification set to ' + t, ''); setC(next); setBusy(false); onChanged && onChanged() }
  const saveNav = async () => { setBusy(true); const next = await updateCoop(c.trackingId, { nav: Number(nav) || 0 }, ctx, 'Net asset value updated', fmtNaira(Number(nav) || 0)); setC(next); setBusy(false); onChanged && onChanged() }
  return (
    <div className="trail-box"><h4>Scheme admission, tiering &amp; guarantee</h4>
      <div className={cx('kyc-status', adm.admitted ? 'ok' : 'pending')}>{adm.admitted ? 'Admitted to the LASMECO scheme \u2014 may nominate members.' : adm.outstanding.length + ' admission requirement(s) outstanding \u2014 cannot nominate yet.'}</div>
      <div className="kyc-check">{adm.items.map((it, i) => (<div className={cx('kyc-item', it.ok && 'ok')} key={i}><span className="kyc-mark">{it.ok ? '\u2713' : '\u25cb'}</span><span className="kyc-label">{it.label}</span></div>))}</div>
      <div className="statgrid"><div className="stat"><span className="stat-fig">{nl.tier}</span><span className="stat-lab">Tier</span></div><div className="stat"><span className="stat-fig">{nl.limit}</span><span className="stat-lab">Nomination limit</span></div><div className="stat"><span className="stat-fig">{nl.used}</span><span className="stat-lab">Active nominations</span></div><div className="stat"><span className="stat-fig" style={nl.remaining === 0 ? { color: 'var(--err)' } : undefined}>{nl.remaining}</span><span className="stat-lab">Remaining</span></div></div>
      <div className="statgrid"><div className="stat"><span className="stat-fig">{fmtNaira(liab.contingent)}</span><span className="stat-lab">Contingent guarantee (25%)</span></div><div className="stat"><span className="stat-fig" style={liab.crystallised ? { color: 'var(--err)' } : undefined}>{fmtNaira(liab.crystallised)}</span><span className="stat-lab">Crystallised on default</span></div></div>
      {canEdit ? <div className="wallet-actions" style={{ marginTop: '12px' }}><select value={c.tier || 'C'} onChange={(e) => setTier(e.target.value)} disabled={busy}>{Object.keys(COOP_TIERS).map((t) => <option key={t} value={t}>{COOP_TIERS[t].label}</option>)}</select><input type="number" value={nav} onChange={(e) => setNav(e.target.value)} placeholder="Net asset value (₦)" /><button className="btn btn-outline btn-sm" disabled={busy} onClick={saveNav}>Save NAV</button></div> : null}
      <p className="panel-note">MCCTI classifies the tier and records NAV. Tier caps: A {COOP_TIERS.A.cap}, B {COOP_TIERS.B.cap}, C {COOP_TIERS.C.cap} borrowers; actual limit = min(tier cap, NAV ÷ (25% × ₦{NAV_REF_LOAN / 1e6}m reference loan)). On default the cooperative's 25% guarantee crystallises into a cash liability.</p>
    </div>
  )
}
function AcceleratorAppointments({ ctx }) {
  const [list, setList] = useState(null), [busy, setBusy] = useState(''), [docs, setDocs] = useState({}), [loans, setLoans] = useState([])
  const reload = useCallback(async () => { const l = await listAccelerators(); setList(l); setLoans(await listLoans()); const d = {}; for (const a of l) { try { d[a.email] = (await listDocs('accel:' + a.email)).length } catch (e) { d[a.email] = 0 } } setDocs(d) }, [])
  useEffect(() => { reload() }, [reload])
  const setStatus = (a, status) => async () => { setBusy(a.email); await saveAccelerator({ ...a, status }); setBusy(''); reload() }
  if (!list) return <p className="muted-line">Loading accelerators…</p>
  return (
    <div className="ws">
      <p className="muted-line">The Ministry (MCCTI) formally appoints accelerators before they operate, following the Consortium call. Appointed accelerators can be routed applications by members in their sectors.</p>
      {list.length ? <div className="risk-list">{list.map((a) => { const appointed = a.status === 'Appointed'; const r = accelRating(a, loans); return (<div className="risk-item" key={a.email}><span className={cx('chip', appointed ? 'st-approved' : 'st-review')}>{a.status || 'Pending'}</span><div className="risk-body"><strong>{a.name}</strong><p>{(a.sectors || []).join(', ') || 'No sectors set'} &middot; {a.email} &middot; {docs[a.email] || 0} document(s) submitted</p><div className="accel-rating"><Stars n={r.stars} /><span className="accel-grade">{r.pct == null ? 'Unrated' : r.pct + '% approved'}</span><span className="accel-sub">{r.approved}/{r.decided} decided · {r.sponsored} sponsored{r.pending ? ' · ' + r.pending + ' in pipeline' : ''}</span></div></div>{!isReviewer(ctx) && <div className="doc-actions">{!appointed ? <button className="link-inline" disabled={busy === a.email} onClick={setStatus(a, 'Appointed')}>Appoint</button> : <button className="link-inline danger" disabled={busy === a.email} onClick={setStatus(a, 'Suspended')}>Suspend</button>}</div>}</div>) })}</div> : <p className="muted-line">No accelerators have registered yet.</p>}
      <p className="panel-note">Rating = share of sponsored MSMEs approved for a loan (reached bank assessment or beyond), out of those with a decided outcome. Applications still in training or coop validation are shown as “in pipeline” and do not yet count. RAC vetting before appointment: CAC registration, valid permits, 3+ years in enterprise development, sector track record, audited financials, and CVs of key staff.</p>
    </div>
  )
}
function Stars({ n }) { return (<span className="stars" aria-label={n + ' of 5'}>{[1, 2, 3, 4, 5].map((i) => <span key={i} className={cx('star', i <= n && 'on')}>{i <= n ? '\u2605' : '\u2606'}</span>)}</span>) }
function LoanDetail({ loan, ctx, onClose, onChanged }) {
  const [l, setL] = useState(loan), [note, setNote] = useState(''), [amt, setAmt] = useState(''), [busy, setBusy] = useState(false), [rk, setRk] = useState(0), [tenorInput, setTenorInput] = useState('12'), [repay, setRepay] = useState('')
  const [disb, setDisb] = useState({ sterlingAccount: '', supplier: '', supplierAccount: '' })
  const role = ctx.role
  const b = loanBreakdown(l.amountApproved || l.amountRecommended || l.amountRequested)
  const rp = ['Disbursed', 'Repaying', 'Completed', 'Default'].includes(l.status) && (l.schedule || []).length ? loanRepayState(l) : null
  const isBorrower = role === 'member' && (l.createdBy === ctx.email || l.memberId === ctx.focusId)
  const canRecover = role === 'sterling' || role === 'leadership'
  const act = async (patch, action, needNote) => {
    if (needNote && !note.trim()) { toast('Add a note for the record.'); return }
    setBusy(true); const next = await updateLoan(l.loanId, patch, ctx, action, note.trim()); setL(next); setNote(''); setRk((k) => k + 1); setBusy(false); onChanged && onChanged()
  }
  const recommend = async () => { const a = Number(amt) || 0; if (a <= 0 || a > 10000000) { toast('Enter a recommended amount up to ₦10,000,000.'); return } await act({ status: 'Shortlisted', amountRecommended: a }, 'Shortlisted; amount recommended', false) }
  const boiApprove = async () => { const a = Number(amt) || l.amountRecommended || 0; if (a <= 0) { toast('Enter the approved amount.'); return } await act({ status: 'BOI approved', amountApproved: a }, 'Final approval and funding (BOI)', true) }
  const doRepay = async (method) => {
    const a = Number(repay) || 0; if (a <= 0) { toast('Enter a repayment amount.'); return }
    setBusy(true)
    if (method === 'card') { const r = await collectPayment({ email: ctx.email, amountNaira: a, purpose: 'LASMECO repayment ' + l.loanId, metadata: { loanId: l.loanId } }); if (!r.ok) { setBusy(false); if (!r.cancelled) toast('Payment could not be completed.'); return } }
    const next = await recordRepayment(l, a, ctx, method === 'card' ? 'card' : 'manual'); setL(next); setRepay(''); setRk((k) => k + 1); setBusy(false); onChanged && onChanged()
  }
  const doRecover = async () => {
    const plan = recoveryPlan(rp.outstanding, b)
    setBusy(true); const next = await updateLoan(l.loanId, { status: 'Default', recovery: plan }, ctx, 'Default recorded; recovery: collateral ' + fmtNaira(plan.collateral) + ', cooperative ' + fmtNaira(plan.coop) + ', Sterling ' + fmtNaira(plan.sterling) + (plan.shortfall ? ', shortfall ' + fmtNaira(plan.shortfall) : ''), '')
    setL(next); setRk((k) => k + 1); setBusy(false); onChanged && onChanged()
  }
  const canAP = role === 'accelerator', canOff = role === 'officer' || role === 'leadership', canSterling = role === 'sterling', canBOI = role === 'boi'
  const canDecline = (canAP && ['Applied', 'In training'].includes(l.status)) || (canOff && l.status === 'Shortlisted') || (canSterling && ['Coop validated', 'BOI approved'].includes(l.status)) || (canBOI && l.status === 'Bank assessment')
  return (
    <div className="detail">
      <div className="detail-head"><div><h3>{l.memberName}</h3><p className="detail-sub">{l.loanId} &middot; {l.coop} &middot; {l.sector} &middot; {l.type}</p></div><button className="link-back" onClick={onClose}>&larr; Back to list</button></div>
      <div className="detail-chips"><StatusChip status={l.status} kind="loan" />{l.apName && <span className="src-badge src-mccti">{l.apName}</span>}</div>
      <div className="detail-grid" style={{ marginTop: '20px' }}>
        <div className="field-ro"><span>Requested</span><strong>{fmtNaira(l.amountRequested)}</strong></div>
        <div className="field-ro"><span>Recommended</span><strong>{l.amountRecommended ? fmtNaira(l.amountRecommended) : '—'}</strong></div>
        <div className="field-ro"><span>Approved</span><strong>{l.amountApproved ? fmtNaira(l.amountApproved) : '—'}</strong></div>
        <div className="field-ro span2"><span>Purpose</span><strong className="normal">{l.purpose}</strong></div>
      </div>

      <LoanKycPanel loan={l} ctx={ctx} />
      {['Coop validated', 'Bank assessment', 'BOI approved', 'Disbursed', 'Repaying', 'Completed', 'Default'].includes(l.status) && (ctx.role === 'sterling' || ctx.role === 'boi' || ctx.role === 'leadership' || ctx.role === 'officer') ? <SecurityChecklist loan={l} ctx={ctx} onChanged={onChanged} /> : null}

      {['Bank assessment', 'BOI approved', 'Disbursed', 'Repaying', 'Completed'].includes(l.status) && (
        <div className="returns-box"><h4>Guarantee stack &amp; disbursement</h4>
          <div className="returns-grid">
            <div><span>Loan amount</span><strong>{fmtNaira(b.amount)}</strong></div>
            <div><span>Borrower collateral (10%)</span><strong>{fmtNaira(b.collateral)}</strong></div>
            <div><span>Cooperative guarantee (25%)</span><strong>{fmtNaira(b.coopGuarantee)}</strong></div>
            <div><span>Sterling guarantee (50%)</span><strong>{fmtNaira(b.sterlingGuarantee)}</strong></div>
            <div><span>Accelerator fee</span><strong>{fmtNaira(b.apFee)}</strong></div>
            <div><span>BOI appraisal (1%)</span><strong>{fmtNaira(b.boiFee)}</strong></div>
            <div><span>Net to borrower</span><strong>{fmtNaira(b.netToBorrower)}</strong></div>
            <div><span>Interest</span><strong>9% fixed</strong></div>
          </div>
          {['Disbursed', 'Repaying', 'Completed'].includes(l.status) && <p className="muted-line">Interest 9% = 5% base + 2% Sterling guarantee + 1% Accelerator + 0.5% cooperative + 0.5% monitoring. Repayment over the tenor after the moratorium, by direct debit.</p>}
        </div>
      )}

      {rp && (
        <div className="returns-box"><h4>Repayment schedule{l.tenorMonths ? ' \u00b7 ' + l.tenorMonths + ' months at 9%' : ''}</h4>
          <div className="statgrid">
            <div className="stat"><span className="stat-fig">{fmtNaira(rp.outstanding)}</span><span className="stat-lab">Outstanding</span></div>
            <div className="stat"><span className="stat-fig">{fmtNaira(rp.paid)}</span><span className="stat-lab">Repaid</span></div>
            <div className="stat"><span className="stat-fig">{rp.nextDue ? fmtNaira(rp.nextDue.amount) : '\u2014'}</span><span className="stat-lab">{rp.nextDue ? 'Next due ' + fmtDate(rp.nextDue.dueDate) : 'Fully repaid'}</span></div>
            <div className="stat"><span className="stat-fig" style={rp.arrears ? { color: 'var(--err)' } : undefined}>{fmtNaira(rp.arrears)}</span><span className="stat-lab">In arrears</span></div>
          </div>
          <div className="rtable-wrap"><table className="rtable"><thead><tr><th>#</th><th>Due date</th><th>Amount</th><th>Principal</th><th>Interest</th><th>Status</th></tr></thead>
            <tbody>{rp.schedule.map((s) => { const st = rp.instStatus(s); return (<tr key={s.n}><td className="mono">{s.n}</td><td>{fmtDate(s.dueDate)}</td><td className="mono">{fmtNaira(s.amount)}</td><td className="mono">{fmtNaira(s.principal)}</td><td className="mono">{fmtNaira(s.interest)}</td><td><span className={cx('chip', st === 'Paid' ? 'st-approved' : st === 'Overdue' ? 'st-returned' : 'st-review')}>{st}</span></td></tr>) })}</tbody>
          </table></div>
          {rp.outstanding > 0 && (isBorrower || role === 'sterling' || canOff) && (
            <div className="wallet-actions" style={{ marginTop: '14px' }}>
              <input type="number" value={repay} onChange={(e) => setRepay(e.target.value)} placeholder={'Amount (₦)' + (rp.nextDue ? ', next ' + fmtNaira(rp.nextDue.amount) : '')} />
              {isBorrower && <button className="btn btn-gold btn-sm" disabled={busy} onClick={() => doRepay('card')}>{PAYSTACK_PUBLIC ? 'Pay installment' : 'Pay installment (demo)'}</button>}
              {(role === 'sterling' || canOff) && <button className="btn btn-outline btn-sm" disabled={busy} onClick={() => doRepay('manual')}>Record repayment</button>}
            </div>
          )}
          {rp.arrears > 0 && canRecover && l.status !== 'Default' && (
            <div className="fee-banner" style={{ marginTop: '14px' }}><span>In arrears {fmtNaira(rp.arrears)}. Recovery waterfall: collateral {fmtNaira(recoveryPlan(rp.outstanding, b).collateral)} &rarr; cooperative {fmtNaira(recoveryPlan(rp.outstanding, b).coop)} &rarr; Sterling {fmtNaira(recoveryPlan(rp.outstanding, b).sterling)}.</span><button className="btn btn-outline btn-sm" disabled={busy} onClick={doRecover}>Record default &amp; recovery</button></div>
          )}
          {l.status === 'Default' && l.recovery && (<p className="muted-line">Default recorded. Recovery applied: collateral {fmtNaira(l.recovery.collateral)}, cooperative {fmtNaira(l.recovery.coop)}, Sterling {fmtNaira(l.recovery.sterling)}{l.recovery.shortfall ? ', shortfall ' + fmtNaira(l.recovery.shortfall) : ''}.</p>)}
        </div>
      )}

      <div className="action-box">
        <label className="field"><span>Note (recorded on the audit trail)</span><textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} placeholder="Decision, conditions or findings." /></label>
        {(canAP && l.status === 'In training') || (canBOI && l.status === 'Bank assessment') ? <label className="field"><span>Amount (₦)</span><input type="number" value={amt} onChange={(e) => setAmt(e.target.value)} placeholder={String(l.amountRecommended || l.amountRequested || '')} /></label> : null}
        {canSterling && l.status === 'BOI approved' ? <p className="panel-note">Product: {loanVariant(l.type).label} — {loanVariant(l.type).tenor}-month tenor with a {loanVariant(l.type).moratorium}-month principal moratorium (fixed by the RAC). The schedule is generated automatically on disbursement.</p> : null}
        {canSterling && l.status === 'BOI approved' ? <div className="form-grid"><label className="field"><span>Beneficiary Sterling account no.</span><input value={disb.sterlingAccount} onChange={(e) => setDisb({ ...disb, sterlingAccount: e.target.value })} placeholder="10-digit NUBAN" /></label>{loanVariant(l.type).label === 'Asset Finance' ? <><label className="field"><span>Supplier / vendor</span><input value={disb.supplier} onChange={(e) => setDisb({ ...disb, supplier: e.target.value })} placeholder="Equipment supplier" /></label><label className="field"><span>Supplier account no.</span><input value={disb.supplierAccount} onChange={(e) => setDisb({ ...disb, supplierAccount: e.target.value })} placeholder="Supplier NUBAN" /></label></> : null}</div> : null}
        <div className="action-row">
          {canAP && l.status === 'Applied' && <button className="btn btn-gold btn-sm" disabled={busy} onClick={() => act({ status: 'In training', apName: ctx.name }, 'Enrolled in capacity building')}>Begin capacity building</button>}
          {canAP && l.status === 'In training' && <button className="btn btn-gold btn-sm" disabled={busy} onClick={recommend}>Shortlist &amp; recommend amount</button>}
          {canOff && l.status === 'Shortlisted' && <button className="btn btn-gold btn-sm" disabled={busy} onClick={() => act({ status: 'Coop validated' }, 'Cooperative validated; 25% guarantee issued', true)}>Validate cooperative &amp; guarantee</button>}
          {canSterling && l.status === 'Coop validated' && <button className="btn btn-gold btn-sm" disabled={busy} onClick={() => act({ status: 'Bank assessment' }, 'KYC and assessment complete; 50% Sterling guarantee applied', true)}>Assess &amp; apply 50% guarantee</button>}
          {canBOI && l.status === 'Bank assessment' && <button className="btn btn-gold btn-sm" disabled={busy} onClick={boiApprove}>Grant final approval &amp; fund</button>}
          {canSterling && l.status === 'BOI approved' && <button className="btn btn-gold btn-sm" disabled={busy} onClick={async () => { if (!disb.sterlingAccount.trim()) { toast('Enter the beneficiary Sterling account for disbursement.', 'error'); return } if (!securityState(l).complete) { if (!(await confirmDialog('Not all security items are perfected. Disburse anyway?', { danger: true, confirmLabel: 'Disburse' }))) return } const v = loanVariant(l.type); const t = v.tenor; const sched = buildSchedule(l.amountApproved || b.amount, t, 9, new Date().toISOString(), v.moratorium); act({ status: 'Disbursed', tenorMonths: t, moratoriumMonths: v.moratorium, disbursedAt: new Date().toISOString(), schedule: sched, disbursement: { ...disb } }, 'Funds disbursed to ' + (disb.supplier ? 'supplier ' + disb.supplier : 'beneficiary account ' + disb.sterlingAccount) + '; ' + t + '-month schedule (' + v.moratorium + '-month moratorium)', true) }}>Disburse to beneficiary</button>}
          {canDecline && <button className="btn btn-outline btn-sm" disabled={busy} onClick={() => act({ status: 'Declined' }, 'Application declined', true)}>Decline</button>}
        </div>
      </div>

      <div className="trail-box"><h4>Loan trail</h4><AuditTrail trackingId={l.loanId} refreshKey={rk} /></div>
    </div>
  )
}
function useLoans() { const [loans, setLoans] = useState(null); const reload = useCallback(() => listLoans().then(setLoans), []); useEffect(() => { reload() }, [reload]); return [loans, reload] }
function AccelDashboard({ accel, loans }) {
  const mine = accelLoans(accel, loans)
  const r = accelRating(accel, loans)
  const e = accelEarnings(accel, loans)
  const statusColors = { Repaying: CHART_C.green, Disbursed: CHART_C.teal, Completed: CHART_C.slate, Default: CHART_C.red, 'Bank assessment': CHART_C.gold, 'Coop validated': CHART_C.amber, 'BOI approved': CHART_C.plum, Applied: CHART_C.gold, 'In training': CHART_C.gold, Shortlisted: CHART_C.teal, Declined: CHART_C.red }
  const stageOrder = ['Applied', 'In training', 'Shortlisted', 'Coop validated', 'Bank assessment', 'BOI approved', 'Disbursed', 'Repaying', 'Completed']
  const pipeline = stageOrder.map((s) => ({ label: s, value: mine.filter((l) => l.status === s).length, color: statusColors[s] || CHART_C.gold })).filter((d) => d.value)
  const sectors = Array.from(new Set(mine.map((l) => l.sector))).map((s, i) => ({ label: s || 'Unspecified', value: mine.filter((l) => l.sector === s).length, color: [CHART_C.green, CHART_C.teal, CHART_C.gold, CHART_C.plum, CHART_C.amber][i % 5] })).filter((d) => d.value)
  const outcome = [{ label: 'Approved', value: r.approved, color: CHART_C.green }, { label: 'Declined', value: r.decided - r.approved, color: CHART_C.red }, { label: 'In pipeline', value: r.pending, color: CHART_C.gold }].filter((d) => d.value)
  // Monthly disbursement value over the last 6 months, from disbursed loans
  const months = []; const now = new Date()
  for (let i = 5; i >= 0; i--) { const d = new Date(now.getFullYear(), now.getMonth() - i, 1); months.push({ key: d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0'), label: d.toLocaleString('en-NG', { month: 'short' }) }) }
  const disb = mine.filter((l) => ACCEL_EARNED_STATES.indexOf(l.status) > -1)
  const monthVals = months.map((m) => disb.filter((l) => (l.disbursedAt || '').slice(0, 7) === m.key).reduce((a, l) => a + (l.amountApproved || l.amountRequested || 0), 0))
  const disbursedValue = disb.reduce((a, l) => a + (l.amountApproved || l.amountRequested || 0), 0)
  const kpis = [
    ['Sponsored MSMEs', String(mine.length)],
    ['Disbursed value', fmtNaira(disbursedValue)],
    ['Earned to date', fmtNaira(e.gross)],
    ['Approval rate', r.pct == null ? '\u2014' : r.pct + '%'],
  ]
  return (
    <div className="ws">
      <div className="kpi-row">{kpis.map(([l, v]) => (<div className="kpi" key={l}><span className="kpi-fig">{v}</span><span className="kpi-lab">{l}</span></div>))}</div>
      <div className="chart-grid">
        <section className="chart-card"><h4>Application pipeline</h4>{pipeline.length ? <Bars data={pipeline} /> : <p className="muted-line">No applications yet.</p>}</section>
        <section className="chart-card"><h4>Approval outcomes</h4>{outcome.length ? <Donut data={outcome} centerTop={r.pct == null ? '\u2014' : r.pct + '%'} centerBottom="approved" /> : <p className="muted-line">No decided outcomes yet.</p>}</section>
        <section className="chart-card"><h4>By sector</h4>{sectors.length ? <Donut data={sectors} centerTop={String(mine.length)} centerBottom="loans" /> : <p className="muted-line">No loans yet.</p>}</section>
      </div>
      <section className="chart-card"><h4>Disbursement value — last 6 months</h4>{disbursedValue > 0 ? (<><MiniArea points={monthVals} color={CHART_C.green} /><div className="spark-axis">{months.map((m) => <span key={m.key}>{m.label}</span>)}</div></>) : <p className="muted-line">No disbursements in the last six months.</p>}</section>
    </div>
  )
}
function AccelEarnings({ accel, loans }) {
  const [wallet, setWallet] = useState(null), [busy, setBusy] = useState(false)
  const [amt, setAmt] = useState(''), [acct, setAcct] = useState({ bank: '', number: '', name: '' }), [open, setOpen] = useState(false)
  const e = accelEarnings(accel, loans)
  const reload = useCallback(() => accelWallet(accel.email).then(setWallet), [accel.email])
  useEffect(() => { reload() }, [reload])
  if (!wallet) return <p className="muted-line">Loading earnings…</p>
  const withdrawn = wallet.withdrawn || 0
  const available = Math.max(0, e.gross - withdrawn)
  const last = wallet.account
  const submit = async () => {
    const n = Number(amt)
    if (!n || n <= 0) { toast('Enter an amount to transfer.', 'error'); return }
    if (n > available) { toast('That is more than your available earnings.', 'error'); return }
    if (!acct.bank || !acct.number || !acct.name) { toast('Enter the destination bank, account number and name.', 'error'); return }
    setBusy(true)
    try { await accelDrawdown(accel.email, n, acct, e.gross); toast('Transfer of ' + fmtNaira(n) + ' initiated to ' + acct.bank + ' ' + acct.number + '.', 'success'); setAmt(''); setOpen(false); reload() }
    catch (err) { toast(err.message || 'Transfer failed.', 'error') } finally { setBusy(false) }
  }
  return (
    <div className="returns-box"><h4>Earnings from disbursed loans</h4>
      <p className="muted-line">You earn a facilitation fee of {fmtNaira(loanBreakdown(1000000).apFee)} for each MSME you sponsored that reaches disbursement. Earnings become available to draw down once the loan is disbursed.</p>
      <div className="statgrid">
        <div className="stat"><span className="stat-fig">{fmtNaira(e.gross)}</span><span className="stat-lab">Total earned</span></div>
        <div className="stat"><span className="stat-fig">{fmtNaira(withdrawn)}</span><span className="stat-lab">Transferred out</span></div>
        <div className="stat"><span className="stat-fig" style={{ color: 'var(--green)' }}>{fmtNaira(available)}</span><span className="stat-lab">Available to draw down</span></div>
        <div className="stat"><span className="stat-fig">{e.count}</span><span className="stat-lab">Disbursed loans</span></div>
      </div>
      <div className="panel-actions"><button className="btn btn-gold btn-sm" disabled={available <= 0} onClick={() => setOpen(!open)}>{available <= 0 ? 'No earnings available yet' : 'Draw down / transfer to account'}</button></div>
      {open && <div className="returns-box" style={{ marginTop: '12px' }}>
        <h5>Transfer to a bank account</h5>
        {last && <p className="chart-note">Last used: {last.bank} &middot; {last.number} &middot; {last.name}. <button className="link-inline" onClick={() => setAcct(last)}>Use again</button></p>}
        <div className="form-grid">
          <label className="field"><span>Amount (₦)</span><input type="number" value={amt} onChange={(e2) => setAmt(e2.target.value)} placeholder={String(available)} /></label>
          <label className="field"><span>Bank</span><input value={acct.bank} onChange={(e2) => setAcct({ ...acct, bank: e2.target.value })} placeholder="e.g. Sterling Bank" /></label>
          <label className="field"><span>Account number</span><input value={acct.number} onChange={(e2) => setAcct({ ...acct, number: e2.target.value })} placeholder="10-digit NUBAN" /></label>
          <label className="field"><span>Account name</span><input value={acct.name} onChange={(e2) => setAcct({ ...acct, name: e2.target.value })} placeholder="Registered account name" /></label>
        </div>
        <div className="panel-actions"><button className="btn btn-gold btn-sm" disabled={busy} onClick={submit}>{busy ? 'Processing…' : 'Transfer ' + (Number(amt) ? fmtNaira(Number(amt)) : '')}</button><button className="btn btn-ghost btn-sm" onClick={() => setOpen(false)}>Cancel</button></div>
        <p className="panel-note">Transfers are recorded here and reduce your available balance. In live operation this routes to the programme’s settlement account for payout.</p>
      </div>}
      {e.perLoan.length ? <div className="doc-guide" style={{ marginTop: '14px' }}><h5>Fee-earning loans</h5><ul>{e.perLoan.map((x) => (<li key={x.loanId} className="done"><span aria-hidden="true">✓</span> {x.member} &middot; {x.coop} &middot; {fmtNaira(x.amount)} ({x.status}) &mdash; fee {fmtNaira(x.fee)}</li>))}</ul></div> : null}
      {wallet.txns && wallet.txns.length ? <div className="doc-guide" style={{ marginTop: '10px' }}><h5>Transfer history</h5><ul>{wallet.txns.map((t) => (<li key={t.tid}><span aria-hidden="true">→</span> {fmtNaira(t.amount)} to {t.account ? t.account.bank + ' ' + t.account.number : 'account'} &middot; {fmtDate(t.at)}</li>))}</ul></div> : null}
    </div>
  )
}
function AcceleratorWorkspace({ ctx, section }) {
  const [loans, reload] = useLoans(); const [sel, setSel] = useState(null)
  const [accel, setAccel] = useState(undefined), [pick, setPick] = useState([]), [busy, setBusy] = useState(false)
  const loadAccel = useCallback(() => getAccelerator(ctx.email).then((a) => { setAccel(a); if (a) setPick(a.sectors || []) }), [ctx.email])
  useEffect(() => { loadAccel() }, [loadAccel])
  if (!loans || accel === undefined) return <p className="muted-line">Loading pipeline…</p>
  if (!accel) {
    const toggle = (s) => setPick(pick.includes(s) ? pick.filter((x) => x !== s) : [...pick, s])
    const save = async () => { if (!pick.length) { toast('Select at least one sector you support.'); return } setBusy(true); await saveAccelerator({ email: ctx.email, name: ctx.name, sectors: pick, uid: ctx.uid }); await loadAccel(); setBusy(false) }
    return (
      <div className="panel">
        <div className="panel-head"><h3>Set up your Accelerator profile</h3></div>
        <p className="panel-sub">Choose the LASMECO priority sectors you support. Members applying for finance in these sectors can route their applications directly to you.</p>
        <div className="sector-pick">{LASMECO_SECTORS.map((s) => (<button key={s} className={cx('sector-chip', pick.includes(s) && 'on')} onClick={() => toggle(s)}>{s}</button>))}</div>
        <div className="panel-actions"><button className="btn btn-gold" onClick={save} disabled={busy}>{busy ? 'Saving\u2026' : 'Save profile'}</button></div>
        <p className="panel-note">You can change your sectors at any time from the Overview.</p>
      </div>
    )
  }
  if (sel) return <LoanDetail loan={sel} ctx={ctx} onClose={() => { setSel(null); reload() }} onChanged={reload} />
  const mine = (l) => (l.apEmail === ctx.email) || ((accel.sectors || []).includes(l.sector))
  const myLoans = loans.filter(mine)
  const queue = myLoans.filter((l) => AP_STATUSES.includes(l.status))
  const by = (s) => myLoans.filter((l) => l.status === s).length
  const cards = () => [['New applications', by('Applied')], ['In training', by('In training')], ['Shortlisted', by('Shortlisted')], ['My pipeline', myLoans.length]]
  return (
    <div className="ws">
      {section === 'overview' && (<>
        <div className="accel-sectors"><span>Serving: {(accel.sectors || []).join(', ') || 'no sectors set'} &middot; {accel.status || 'Pending'}</span><button className="link-inline" onClick={() => setAccel(null)}>Edit sectors</button></div>
        {(accel.status || 'Pending') !== 'Appointed' ? <div className="returns-box"><h4>Appointment documents</h4><div className={cx('kyc-status', 'pending')}>Pending MCCTI appointment. Submit the documents below; members can be routed to you once MCCTI appoints you.</div><DocumentsPanel coopId={'accel:' + ctx.email} ctx={ctx} canVerify={false} canUpload={true} categories={ACCEL_DOC_REQUIREMENTS} /></div> : <div className="returns-box"><h4>Appointment</h4><div className={cx('kyc-status', 'ok')}>Appointed by MCCTI — you can receive applications in your sectors.</div></div>}
        <AccelDashboard accel={accel} loans={loans} />
        {(() => { const r = accelRating(accel, loans); return (<div className="returns-box"><h4>Your approval rating</h4><div className="accel-rating"><Stars n={r.stars} /><span className="accel-grade">{r.pct == null ? 'Unrated yet' : r.pct + '% approved'}</span><span className="accel-sub">{r.approved}/{r.decided} decided · {r.sponsored} sponsored{r.pending ? ' · ' + r.pending + ' in pipeline' : ''}</span></div><p className="panel-note">Share of the MSMEs you sponsored that were approved for a loan (reached bank assessment or beyond), out of those with a decided outcome. Applications still in training or coop validation are not counted yet.</p></div>) })()}
        <AccelEarnings accel={accel} loans={loans} />
      </>)}
      {section === 'earnings' && <AccelEarnings accel={accel} loans={loans} />}
      {section === 'queue' && (<><p className="muted-line">Applications awaiting your action — new, in training and shortlisted.</p><LoanTable loans={queue} onOpen={setSel} /></>)}
      {section === 'all' && (<><p className="muted-line">Every application in your sectors, at all stages (including validated, funded, disbursed, repaying and closed).</p><LoanTable loans={myLoans} onOpen={setSel} /></>)}
      {section === 'chains' && <ChainsPanel ctx={ctx} />}
    </div>
  )
}
function LoanRoleWorkspace({ ctx, section, statuses, cards }) {
  const [loans, reload] = useLoans(); const [sel, setSel] = useState(null)
  if (!loans) return <p className="muted-line">Loading loans…</p>
  if (sel) return <LoanDetail loan={sel} ctx={ctx} onClose={() => { setSel(null); reload() }} onChanged={reload} />
  const queue = loans.filter((l) => statuses.includes(l.status))
  return (
    <div className="ws">
      {section === 'overview' && <LoanStageOverview loans={loans} cards={cards} />}
      {section === 'queue' && <LoanTable loans={queue} onOpen={setSel} />}
      {section === 'all' && <LoanTable loans={loans} onOpen={setSel} />}
      {section === 'monitoring' && <PortfolioMonitoring />}
      {section === 'accelerators' && <AcceleratorAppointments ctx={ctx} />}
    </div>
  )
}
function SterlingWorkspace({ ctx, section }) {
  const cards = (loans) => { const d = loans.filter((l) => ['Disbursed', 'Repaying', 'Completed'].includes(l.status)); return [['Awaiting assessment', loans.filter((l) => l.status === 'Coop validated').length], ['To disburse', loans.filter((l) => l.status === 'BOI approved').length], ['Disbursed', d.length], ['Disbursed value', fmtNaira(d.reduce((a, l) => a + (l.amountApproved || 0), 0))]] }
  return <LoanRoleWorkspace ctx={ctx} section={section} statuses={['Coop validated', 'BOI approved', 'Disbursed']} cards={cards} />
}
function BoiWorkspace({ ctx, section }) {
  const cards = (loans) => [['Awaiting approval', loans.filter((l) => l.status === 'Bank assessment').length], ['Approved', loans.filter((l) => l.status === 'BOI approved').length], ['Disbursed', loans.filter((l) => ['Disbursed', 'Repaying', 'Completed'].includes(l.status)).length], ['Applications', loans.length]]
  return <LoanRoleWorkspace ctx={ctx} section={section} statuses={['Bank assessment', 'BOI approved']} cards={cards} />
}
const SPV_SPLIT = [['Lagos State (MCCTI)', 50], ['Asset Matrix MFB', 15], ['Imade / Catridge', 15], ['QooP', 10], ['SEKAT', 10]]
function AssetMatrixWorkspace({ ctx, section }) {
  const [coops, setCoops] = useState(null), [loans, setLoans] = useState([]), [wallets, setWallets] = useState([]), [last, setLast] = useState(null), [busy, setBusy] = useState(false)
  const reload = useCallback(() => { listCoops().then(setCoops); listLoans().then(setLoans); kvList('wallet:').then(setWallets); kvGet('escrow:last').then(setLast) }, [])
  useEffect(() => { reload() }, [reload])
  if (!coops) return <p className="muted-line">Loading escrow…</p>
  const regFees = coops.filter((c) => c.feeStatus === 'Paid').length * COOP_FEES.registration
  const returnsFees = coops.filter((c) => c.returns).length * COOP_FEES.annualReturns
  const disbursedValue = loans.filter((l) => ['Disbursed', 'Repaying', 'Completed'].includes(l.status)).reduce((a, l) => a + (l.amountApproved || 0), 0)
  const portalFees = Math.round(disbursedValue * 0.025)
  const sumTxn = (type) => wallets.reduce((a, w) => a + (w.txns || []).filter((t) => t.type === type).reduce((s, t) => s + (t.amount || 0), 0), 0)
  const funding = sumTxn('topup'), payouts = sumTxn('payout')
  const walletFees = Math.round(funding * 0.01)
  const accrued = regFees + returnsFees + portalFees + walletFees
  const revenueDonut = [{ label: 'Registration & returns', value: regFees + returnsFees, color: CHART_C.gold }, { label: 'Disbursement portal', value: portalFees, color: CHART_C.green }, { label: 'Wallet fees', value: walletFees, color: CHART_C.teal }].filter((d) => d.value)
  const distribute = async () => { setBusy(true); const rec = { amount: accrued, at: new Date().toISOString(), by: ctx.name, split: SPV_SPLIT.map(([n, p]) => [n, Math.round(accrued * p / 100)]) }; await kvSet('escrow:last', rec); await addAudit({ trackingId: 'ESCROW', action: 'Revenue distributed on 50/15/15/10/10', by: ctx.name, role: 'assetmatrix', note: fmtNaira(accrued) }); setLast(rec); setBusy(false) }
  return (
    <div className="ws">
      {section === 'overview' && (<>
        <div className="statgrid">
          <div className="stat"><span className="stat-fig">{fmtNaira(accrued)}</span><span className="stat-lab">Escrow accrued</span></div>
          <div className="stat"><span className="stat-fig">{fmtNaira(regFees + returnsFees)}</span><span className="stat-lab">Registration &amp; returns</span></div>
          <div className="stat"><span className="stat-fig">{fmtNaira(portalFees)}</span><span className="stat-lab">Disbursement portal (2.5%)</span></div>
          <div className="stat"><span className="stat-fig">{fmtNaira(walletFees)}</span><span className="stat-lab">Wallet fees (1%)</span></div>
        </div>
        <div className="chart-grid">
          <section className="chart-card"><h4>Revenue by stream</h4>{revenueDonut.length ? <Donut data={revenueDonut} centerTop={fmtNaira(accrued)} centerBottom="accrued" /> : <p className="muted-line">No revenue accrued yet.</p>}</section>
          <section className="chart-card wide"><h4>Payments throughput</h4><div className="status-row"><span>Wallet funding processed</span><span className="mono">{fmtNaira(funding)}</span></div><div className="status-row"><span>Esusu payouts</span><span className="mono">{fmtNaira(payouts)}</span></div><div className="status-row"><span>LASMECO disbursed</span><span className="mono">{fmtNaira(disbursedValue)}</span></div><div className="status-row"><span>Active wallets</span><span className="mono">{wallets.length}</span></div></section>
        </div>
      </>)}
      {section === 'distribution' && (
        <div className="dash-grid">
          <section className="dash-card"><h3>Sharing formula distribution</h3>{SPV_SPLIT.map(([n, p]) => (<div className="status-row" key={n}><span>{n} ({p}%)</span><span className="mono">{fmtNaira(Math.round(accrued * p / 100))}</span></div>))}<div className="panel-actions"><button className="btn btn-gold btn-sm" onClick={distribute} disabled={busy}>{busy ? 'Recording\u2026' : 'Record distribution'}</button></div></section>
          <section className="dash-card"><h3>Last distribution</h3>{last ? (<><p className="dash-card-sub">{fmtNaira(last.amount)} on {fmtDate(last.at)} by {last.by}</p>{(last.split || []).map(([n, v]) => (<div className="status-row" key={n}><span>{n}</span><span className="mono">{fmtNaira(v)}</span></div>))}</>) : <p className="muted-line">No distribution recorded yet.</p>}</section>
        </div>
      )}
      <p className="dash-foot">Asset Matrix MFB holds the platform revenue escrow, distributed on the 50/15/15/10/10 formula. Live bank settlement connects through Paystack or Flutterwave. Not financial advice.</p>
    </div>
  )
}
function LasmecoOverview({ ctx }) {
  const [loans, reload] = useLoans(); const [sel, setSel] = useState(null)
  if (!loans) return <p className="muted-line">Loading LASMECO…</p>
  if (sel) return <LoanDetail loan={sel} ctx={ctx} onClose={() => { setSel(null); reload() }} onChanged={reload} />
  const disbursed = loans.filter((l) => ['Disbursed', 'Repaying', 'Completed'].includes(l.status))
  const disbursedValue = disbursed.reduce((a, l) => a + (l.amountApproved || 0), 0)
  const bySector = Array.from(new Set(loans.map((l) => l.sector))).map((s) => [s, loans.filter((l) => l.sector === s).length])
  return (
    <div className="ws">
      <div className="statgrid"><div className="stat"><span className="stat-fig">{loans.length}</span><span className="stat-lab">Applications</span></div><div className="stat"><span className="stat-fig">{disbursed.length}</span><span className="stat-lab">Disbursed</span></div><div className="stat"><span className="stat-fig">{fmtNaira(disbursedValue)}</span><span className="stat-lab">Disbursed value</span></div><div className="stat"><span className="stat-fig">{loans.filter((l) => !['Disbursed', 'Repaying', 'Completed', 'Declined'].includes(l.status)).length}</span><span className="stat-lab">In pipeline</span></div></div>
      <div className="band-dist">{bySector.map(([s, n]) => (<div className="bd" key={s}><span className="src-badge src-mccti">{s}</span><span className="bd-n">{n}</span></div>))}</div>
      <LoanTable loans={loans} onOpen={setSel} ctx={ctx} />
    </div>
  )
}


/* =============================== STAGE 6 ===============================
   Digital Wallet & Payments. Member wallets, cooperative savings pools and a
   rotating esusu / ajo, with transactions. Payments run through a stub that
   uses Paystack or Flutterwave when their keys are configured.
   ====================================================================== */
/* ---- Paystack collections (test mode until keys are set) -----------------
   Inbound payments (fees, wallet funding) run through Paystack when
   VITE_PAYSTACK_PUBLIC_KEY is set and are verified server-side via
   /api/paystack/verify (PAYSTACK_SECRET_KEY). With no key the app falls back to
   a demo success so every flow keeps working. Disbursements use bank rails, not
   card checkout. */
const PAYSTACK_PUBLIC = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_PAYSTACK_PUBLIC_KEY) || ''
let _psLoad
function loadPaystack() {
  if (typeof window !== 'undefined' && window.PaystackPop) return Promise.resolve()
  if (_psLoad) return _psLoad
  _psLoad = new Promise((res, rej) => { const s = document.createElement('script'); s.src = 'https://js.paystack.co/v1/inline.js'; s.onload = res; s.onerror = rej; document.body.appendChild(s) })
  return _psLoad
}
async function verifyPaystack(reference) {
  if (!reference || String(reference).startsWith('DEMO-')) return { status: 'success', demo: true }
  try { const r = await fetch('/api/paystack/verify?reference=' + encodeURIComponent(reference)); return await r.json() } catch (e) { return { status: 'unknown' } }
}
async function collectPayment({ email, amountNaira, purpose, metadata }) {
  const amt = Number(amountNaira) || 0
  if (!PAYSTACK_PUBLIC) return { ok: true, demo: true, reference: 'DEMO-' + Date.now() }
  try { await loadPaystack() } catch (e) { return { ok: false, error: 'Could not load Paystack' } }
  const res = await new Promise((resolve) => {
    try {
      const handler = window.PaystackPop.setup({
        key: PAYSTACK_PUBLIC, email: email || 'member@coopeco.ng', amount: Math.round(amt * 100), currency: 'NGN',
        ref: 'CE-' + Date.now() + '-' + Math.floor(Math.random() * 100000), metadata: Object.assign({ purpose }, metadata || {}),
        callback: (resp) => resolve({ ok: true, reference: resp.reference }), onClose: () => resolve({ ok: false, cancelled: true }),
      })
      handler.openIframe()
    } catch (e) { resolve({ ok: false, error: 'Paystack init failed' }) }
  })
  if (!res.ok) return res
  const v = await verifyPaystack(res.reference)
  return { ok: v.status === 'success' || v.demo || v.status === 'demo', reference: res.reference, status: v.status, demo: res.demo || v.demo }
}
/* ---- Notifications (in-app + SMS/WhatsApp) -------------------------------
   Every notification is stored in-app so recipients always see it. When a phone
   number and a provider (Termii or Twilio) are configured, it is also sent by
   SMS or WhatsApp via /api/notify. Recipients are an email or a role (role:officer,
   role:leadership) so staff share a queue. */
function genNotifId() { return 'N' + Date.now() + Math.floor(Math.random() * 10000) }
async function listNotifs(ctx) { const all = await kvList('notif:'); return all.filter((n) => n.to === ctx.email || n.to === 'role:' + ctx.role).sort((a, b) => (a.at < b.at ? 1 : -1)) }
async function notify({ to, title, body, event, phone, channel, link }) {
  if (!to) return
  const id = genNotifId()
  await kvSet('notif:' + id, { id, to, title, body: body || '', event: event || '', link: link || null, at: new Date().toISOString(), read: false })
  if (phone) { try { await fetch('/api/notify', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ to: phone, channel: channel || 'sms', message: title + (body ? ': ' + body : '') }) }) } catch (e) { /* in-app only */ } }
}
async function markNotifRead(id) { const n = await kvGet('notif:' + id); if (n && !n.read) await kvSet('notif:' + id, { ...n, read: true }) }
async function markAllNotifsRead(ctx) { const list = await listNotifs(ctx); for (const n of list) if (!n.read) await kvSet('notif:' + n.id, { ...n, read: true }) }
function NotificationCenter({ ctx, onChange, onNavigate }) {
  const [items, setItems] = useState(null), [open, setOpen] = useState(null)
  const reload = useCallback(() => listNotifs(ctx).then((l) => { setItems(l); onChange && onChange() }), [ctx.email, ctx.role])
  useEffect(() => { reload() }, [reload])
  if (!items) return <p className="muted-line">Loading notifications…</p>
  const unread = items.filter((n) => !n.read).length
  const openNotif = async (n) => { await markNotifRead(n.id); setOpen(n); reload() }
  const goTo = (n) => { if (n.link && n.link.section && onNavigate) onNavigate(n.link.section); else if (onNavigate) onNavigate('overview') }
  if (open) {
    return (
      <div className="ws">
        <button className="back-link" onClick={() => setOpen(null)}>&larr; Back to notifications</button>
        <div className="returns-box"><h4>{open.title}</h4>
          <p className="notif-at">{fmtDate(open.at)}</p>
          {open.body ? <p className="notif-msg">{open.body}</p> : null}
          {open.link && open.link.section ? <div className="panel-actions"><button className="btn btn-gold btn-sm" onClick={() => goTo(open)}>{open.link.label || 'Go to this'}</button></div> : <p className="chart-note">No further action is needed here.</p>}
        </div>
      </div>
    )
  }
  return (
    <div className="ws">
      <div className="support-cta"><span>{unread ? unread + ' unread notification' + (unread === 1 ? '' : 's') : 'You\u2019re all caught up.'}</span>{unread ? <button className="btn btn-outline btn-sm" onClick={async () => { await markAllNotifsRead(ctx); reload() }}>Mark all read</button> : null}</div>
      {items.length ? <div className="notif-list">{items.map((n) => (<div className={cx('notif', !n.read && 'unread')} key={n.id} onClick={() => openNotif(n)}><span className="notif-dot" aria-hidden="true" /><div className="notif-body"><strong>{n.title}</strong>{n.body ? <p>{n.body}</p> : null}<span className="notif-at">{fmtDate(n.at)}{n.link && n.link.section ? ' \u00b7 tap to open' : ''}</span></div></div>))}</div> : <p className="muted-line">No notifications yet.</p>}
    </div>
  )
}
/* ---- Document uploads (Supabase Storage, demo fallback) ------------------ */
const DOC_CATEGORIES = ['By-laws', 'Registration certificate', 'Trustee ID', 'Financial statement', 'Meeting minutes', 'Other']
function fileToDataURL(file) { return new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(String(r.result)); r.onerror = rej; r.readAsDataURL(file) }) }
function genDocId() { return 'D' + Date.now() + Math.floor(Math.random() * 10000) }
async function listDocs(coopId) { const all = await kvList('doc:'); return all.filter((d) => d.coopId === coopId).sort((a, b) => (a.uploadedAt < b.uploadedAt ? 1 : -1)) }
async function uploadDocument(file, coopId, category, ctx) {
  if (!file) return { ok: false, error: 'No file selected.' }
  if (file.size > 5 * 1024 * 1024) return { ok: false, error: 'File exceeds 5MB. Please compress and retry.' }
  const id = genDocId(), safe = file.name.replace(/[^A-Za-z0-9._-]+/g, '_'), path = coopId + '/' + id + '-' + safe
  let url = '', storage = 'demo'
  if (supa) {
    try {
      const up = await supa.storage.from('coop-docs').upload(path, file, { upsert: true, contentType: file.type })
      if (up.error) return { ok: false, error: up.error.message || 'Upload failed. Is the coop-docs bucket created?' }
      storage = 'supabase' // private bucket: no public URL stored; access via short-lived signed URLs on view
    } catch (e) { return { ok: false, error: 'Storage upload failed.' } }
  } else if (file.size <= 1024 * 1024) { url = await fileToDataURL(file) }
  const rec = { id, coopId, name: file.name, category, size: file.size, type: file.type, url, path, storage, uploadedBy: ctx.name, uploadedAt: new Date().toISOString(), verified: false }
  await kvSet('doc:' + coopId + ':' + id, rec)
  return { ok: true, rec }
}
async function openDocument(d) {
  let url = ''
  if (d.storage === 'supabase' && d.path && supa) {
    try { const s = await supa.storage.from('coop-docs').createSignedUrl(d.path, 300); url = (s && s.data && s.data.signedUrl) || '' } catch (e) { /* fall through */ }
    if (!url) { toast('Could not open the document. You may not have access, or it has been removed.', 'error'); return false }
  } else if (d.url) { url = d.url }
  else if (d.storage === 'demo') { url = demoDocPreview(d) } // sample records have no file; show a representative preview
  else { toast('This document is stored securely; open it from a device with access to the storage bucket.'); return false }
  showPreview(d, url); return true
}
// Build a readable placeholder page for sample documents so approvers can still "view" before approving.
function demoDocPreview(d) {
  const esc = (t) => String(t || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  const html = '<!doctype html><html><head><meta charset="utf-8"><style>body{font-family:Georgia,serif;margin:0;background:#f3f5f2;color:#1f2a24}.pg{max-width:640px;margin:28px auto;background:#fff;border:1px solid #dfe5df;border-radius:8px;padding:40px 44px;box-shadow:0 8px 30px rgba(0,0,0,.06)}h1{font-size:19px;color:#1C8A4F;margin:0 0 4px}.sub{color:#5b665e;font-size:12px;margin:0 0 22px;border-bottom:1px solid #eceeec;padding-bottom:14px}.row{display:flex;justify-content:space-between;font-size:13px;padding:7px 0;border-bottom:1px dashed #eee}.row span:first-child{color:#5b665e}.note{margin-top:22px;font-size:12px;color:#8a948c;font-style:italic}.stamp{margin-top:26px;display:inline-block;border:2px solid #1C8A4F;color:#1C8A4F;border-radius:6px;padding:6px 12px;font-size:11px;letter-spacing:.08em;text-transform:uppercase}</style></head><body><div class="pg"><h1>' + esc(d.category) + '</h1><p class="sub">' + esc(d.name) + '</p><div class="row"><span>Uploaded by</span><strong>' + esc(d.uploadedBy || 'Applicant') + '</strong></div><div class="row"><span>File</span><strong>' + esc(d.name) + '</strong></div><div class="row"><span>Type</span><strong>' + esc(d.type || 'application/pdf') + '</strong></div><div class="row"><span>Status</span><strong>' + (d.verified ? 'Verified' : 'Awaiting verification') + '</strong></div><p class="note">This is a sample document generated for demonstration. In live use, the applicant\u2019s actual uploaded file appears here for the approver to review before approving.</p>' + (d.verified ? '<span class="stamp">Verified</span>' : '') + '</div></body></html>'
  return 'data:text/html;charset=utf-8,' + encodeURIComponent(html)
}
async function setDocVerified(coopId, id, verified, ctx) { const d = await kvGet('doc:' + coopId + ':' + id); if (d) await kvSet('doc:' + coopId + ':' + id, { ...d, verified, verifiedBy: ctx.name, verifiedAt: new Date().toISOString() }) }
async function deleteDocument(coopId, id) { const d = await kvGet('doc:' + coopId + ':' + id); if (d && supa && d.path) { try { await supa.storage.from('coop-docs').remove([d.path]) } catch (e) { /* ignore */ } } await kvDelete('doc:' + coopId + ':' + id) }
function fmtFileSize(b) { return b > 1048576 ? (b / 1048576).toFixed(1) + ' MB' : Math.max(1, Math.round(b / 1024)) + ' KB' }
const KYC_RETENTION_MONTHS = 60
async function expiredDocuments() {
  const docs = await kvList('doc:'), loans = await listLoans()
  const byId = {}; loans.forEach((l) => { byId[l.loanId] = l })
  const cutoff = new Date(); cutoff.setMonth(cutoff.getMonth() - KYC_RETENTION_MONTHS)
  return docs.filter((d) => {
    const loan = byId[d.coopId]
    if (!loan) return false // non-loan (cooperative governance) documents are retained
    if (!['Completed', 'Declined', 'Default'].includes(loan.status)) return false // keep while application is live
    const closed = new Date(loan.updatedAt || d.uploadedAt)
    return closed < cutoff
  })
}
async function purgeExpiredDocuments() {
  const exp = await expiredDocuments()
  for (const d of exp) { try { await deleteDocument(d.coopId, d.id) } catch (e) { /* continue */ } }
  return exp.length
}
function RetentionPanel() {
  const [exp, setExp] = useState(null), [busy, setBusy] = useState(false), [done, setDone] = useState(null)
  const reload = useCallback(() => expiredDocuments().then(setExp), [])
  useEffect(() => { reload() }, [reload])
  const purge = async () => {
    if (!exp || !exp.length) return
    if (!(await confirmDialog('Permanently delete ' + exp.length + ' expired KYC document(s)? This cannot be undone.', { danger: true, confirmLabel: 'Delete' }))) return
    setBusy(true); const n = await purgeExpiredDocuments(); setDone(n); setBusy(false); reload()
  }
  return (
    <div className="ws">
      <div className="returns-box"><h4>KYC document retention</h4>
        <p className="muted-line">Loan/KYC documents are retained for {Math.round(KYC_RETENTION_MONTHS / 12)} years ({KYC_RETENTION_MONTHS} months) after an application closes (completed, declined or defaulted), then deleted — aligned with financial-institution KYC record-keeping. Cooperative governance documents (by-laws, certificates) are retained on the registry. Adjust the period in KYC_RETENTION_MONTHS after confirming the schedule with your data-protection officer (NDPR).</p>
        <div className="statgrid"><div className="stat"><span className="stat-fig">{exp ? exp.length : '\u2026'}</span><span className="stat-lab">Documents past retention</span></div><div className="stat"><span className="stat-fig">{KYC_RETENTION_MONTHS} mo</span><span className="stat-lab">Retention after closure</span></div></div>
        {exp && exp.length ? <div className="docs-list" style={{ marginTop: '12px' }}>{exp.slice(0, 8).map((d) => (<div className="doc-row" key={d.id}><div className="doc-meta"><strong>{d.name}</strong><span>{d.category} &middot; loan {d.coopId} &middot; uploaded {fmtDate(d.uploadedAt)}</span></div></div>))}</div> : <p className="muted-line" style={{ marginTop: '10px' }}>Nothing is past retention right now.</p>}
        <div className="panel-actions"><button className="btn btn-outline btn-sm" disabled={busy || !exp || !exp.length} onClick={purge}>{busy ? 'Purging\u2026' : 'Purge expired documents'}</button></div>
        {done != null && <p className="panel-note" style={{ color: 'var(--green)' }}>Purged {done} document{done === 1 ? '' : 's'}.</p>}
        <p className="panel-note">For unattended enforcement, schedule the purge server-side (Supabase pg_cron / an Edge Function) on the same rule. See the deploy guide for the SQL.</p>
      </div>
    </div>
  )
}
function DocumentsPanel({ coopId, ctx, canVerify, canUpload = true, categories, onChange }) {
  const cats = categories || DOC_CATEGORIES
  const [docs, setDocs] = useState(null), [cat, setCat] = useState(cats[0]), [busy, setBusy] = useState(false), [err, setErr] = useState('')
  const fileRef = useRef(null)
  const reload = useCallback(() => listDocs(coopId).then((d) => { setDocs(d); onChange && onChange() }), [coopId, onChange])
  useEffect(() => { reload() }, [reload])
  const onUpload = async (e) => { const f = e.target.files[0]; if (!f) return; setErr(''); setBusy(true); const r = await uploadDocument(f, coopId, cat, ctx); setBusy(false); if (fileRef.current) fileRef.current.value = ''; if (!r.ok) setErr(r.error || 'Upload failed.'); else reload() }
  if (!docs) return <p className="muted-line">Loading documents…</p>
  return (
    <div className="docs">
      {canUpload && <div className="docs-upload"><select value={cat} onChange={(e) => setCat(e.target.value)}>{cats.map((c) => <option key={c}>{c}</option>)}</select><input ref={fileRef} type="file" accept=".pdf,.png,.jpg,.jpeg,.webp,.doc,.docx" onChange={onUpload} disabled={busy} /></div>}
      {busy && <p className="muted-line">Uploading…</p>}
      {err && <p className="auth-err">{err}</p>}
      {docs.length ? <div className="docs-list">{docs.map((d) => (<div className="doc-row" key={d.id}><div className="doc-meta"><strong>{d.name}</strong><span>{d.category} &middot; {fmtFileSize(d.size)} &middot; {d.uploadedBy} {d.verified ? <span className="chip st-approved">Verified</span> : null}</span></div><div className="doc-actions"><button className="link-inline" onClick={() => openDocument(d)}>View</button>{canVerify && !d.verified ? <button className="link-inline" onClick={async () => { await setDocVerified(coopId, d.id, true, ctx); reload() }}>Verify</button> : null}{(canUpload || canVerify) ? <button className="link-inline danger" onClick={async () => { await deleteDocument(coopId, d.id); reload() }}>Remove</button> : null}</div></div>))}</div> : <p className="muted-line">No documents uploaded yet.</p>}
      {!hasSupabase ? <p className="panel-note">Demo mode: small files preview in-browser only. Connect Supabase Storage (run supabase_setup.sql to create the private “coop-docs” bucket) to store documents securely; they are then served only via short-lived signed links to signed-in staff.</p> : <p className="panel-note">Documents are stored in a private bucket and opened via short-lived signed links. Only signed-in platform users can view them.</p>}
    </div>
  )
}
async function getWallet(id) { return (await kvGet('wallet:' + id)) || { id, balance: 0, txns: [] } }
async function walletTxn(id, type, amount, note, by) {
  const w = await getWallet(id); const amt = Number(amount) || 0
  const credit = ['credit', 'payout', 'topup', 'contribution-in'].includes(type)
  const bal = Math.max(0, (w.balance || 0) + (credit ? amt : -amt))
  const txn = { tid: 'T' + Date.now() + Math.floor(Math.random() * 1000), type, amount: amt, note: note || '', by: by || '', at: new Date().toISOString() }
  const next = { id, balance: bal, txns: [txn, ...(w.txns || [])].slice(0, 60), esusu: w.esusu }
  await kvSet('wallet:' + id, next); return next
}
async function walletTransfer(from, to, amount, note, by) { await walletTxn(from, 'debit', amount, note, by); return walletTxn(to, 'credit', amount, note, by) }
const mWallet = (memberId) => 'M:' + memberId
const cWallet = (coopId) => 'C:' + coopId

function TxnList({ txns }) {
  if (!txns?.length) return <p className="muted-line">No transactions yet.</p>
  const label = { topup: 'Added funds', credit: 'Received', debit: 'Sent', payout: 'Esusu payout', 'contribution-in': 'Contribution', 'fee': 'Fee paid' }
  return (
    <div className="txns">{txns.map((t) => (
      <div className="txn" key={t.tid}>
        <span className={cx('txn-dir', ['topup', 'credit', 'payout', 'contribution-in'].includes(t.type) ? 'in' : 'out')}>{['topup', 'credit', 'payout', 'contribution-in'].includes(t.type) ? '+' : '\u2212'}{fmtNaira(t.amount)}</span>
        <span className="txn-mid"><strong>{label[t.type] || t.type}</strong>{t.note ? ' \u00b7 ' + t.note : ''}</span>
        <span className="txn-at">{fmtDate(t.at)}</span>
      </div>))}</div>
  )
}
function MemberWallet({ member }) {
  const [w, setW] = useState(null), [amt, setAmt] = useState(''), [busy, setBusy] = useState(false), [coops, setCoops] = useState([])
  const id = mWallet(member.memberId)
  const reload = useCallback(() => { getWallet(id).then(setW); listCoops().then(setCoops) }, [id])
  useEffect(() => { reload() }, [reload])
  if (!w) return <p className="muted-line">Loading wallet…</p>
  const coop = coops.find((c) => c.name === member.coop)
  const topup = async () => { const a = Number(amt) || 0; if (a <= 0) return; setBusy(true); const r = await collectPayment({ email: member.createdBy || 'member@coopeco.ng', amountNaira: a, purpose: 'Wallet funding', metadata: { memberId: member.memberId } }); if (r.ok) { await walletTxn(id, 'topup', a, r.demo ? 'Card top-up (demo)' : 'Card top-up', member.name) } else if (!r.cancelled) { toast('Payment could not be completed. Please try again.') } await reload(); setAmt(''); setBusy(false) }
  const save = async () => { const a = Number(amt) || 0; if (a <= 0) { toast('Enter an amount.'); return } if (a > w.balance) { toast('Insufficient wallet balance. Add funds first.'); return } if (!coop) { toast('Your cooperative is not on the platform yet.'); return } setBusy(true); await walletTransfer(id, cWallet(coop.trackingId), a, 'Savings to ' + coop.name, member.name); await reload(); setAmt(''); setBusy(false) }
  return (
    <div className="wallet">
      <div className="wallet-top"><div><span className="wallet-lab">Wallet balance</span><span className="wallet-bal">{fmtNaira(w.balance)}</span></div><span className="wallet-chip">Digital wallet</span></div>
      <div className="wallet-actions">
        <input type="number" value={amt} onChange={(e) => setAmt(e.target.value)} placeholder="Amount (₦)" />
        <button className="btn btn-gold btn-sm" onClick={topup} disabled={busy}>Add funds</button>
        <button className="btn btn-outline btn-sm" onClick={save} disabled={busy}>Save to cooperative</button>
      </div>
      <p className="panel-note">{PAYSTACK_PUBLIC ? 'Card top-ups are processed securely through Paystack (test mode until live keys are set).' : 'Top-ups and transfers are demo movements until Paystack is connected.'} Savings move into your cooperative’s pool.</p>
      <h4 className="wallet-h">Recent transactions</h4>
      <TxnList txns={w.txns} />
    </div>
  )
}
function CoopEsusu({ coop, ctx }) {
  const [w, setW] = useState(null), [members, setMembers] = useState([]), [busy, setBusy] = useState(false)
  const id = cWallet(coop.trackingId)
  const reload = useCallback(() => { getWallet(id).then(setW); listMembers().then(setMembers) }, [id])
  useEffect(() => { reload() }, [reload])
  if (!w) return <p className="muted-line">Loading savings…</p>
  const roster = members.filter((m) => m.coop === coop.name)
  const canManage = ctx.role === 'society' || ctx.role === 'leadership'
  const es = w.esusu && w.esusu.order ? w.esusu : null
  const startRotation = async () => {
    if (roster.length < 2) { toast('You need at least 2 members to start a rotation.'); return }
    setBusy(true)
    const order = roster.map((m) => ({ memberId: m.memberId, name: m.name }))
    const cur = await getWallet(id); await kvSet('wallet:' + id, { ...cur, esusu: { order, startAt: new Date().toISOString(), freq: 'monthly', paid: [] } })
    await reload(); setBusy(false)
  }
  const schedule = () => { if (!es) return []; const start = new Date(es.startAt); return es.order.map((o, i) => { const due = new Date(start); due.setMonth(due.getMonth() + i); const paid = (es.paid || []).find((p) => p.pos === i); return { pos: i, name: o.name, memberId: o.memberId, dueDate: due.toISOString(), paid: !!paid, paidAmount: paid ? paid.amount : 0 } }) }
  const sched = schedule()
  const nextDue = sched.find((s) => !s.paid && new Date(s.dueDate).getTime() <= Date.now())
  const upcoming = sched.find((s) => !s.paid && new Date(s.dueDate).getTime() > Date.now())
  const processDue = async () => {
    if (!nextDue) return
    if (w.balance <= 0) { toast('The savings pool is empty. Members need to save first.'); return }
    setBusy(true)
    const payout = w.balance
    await walletTxn(id, 'debit', payout, 'Esusu payout to ' + nextDue.name, ctx.name)
    await walletTxn(mWallet(nextDue.memberId), 'payout', payout, 'Esusu payout from ' + coop.name, ctx.name)
    const cur = await getWallet(id); const paid = [...((cur.esusu && cur.esusu.paid) || []), { memberId: nextDue.memberId, pos: nextDue.pos, at: new Date().toISOString(), amount: payout }]
    await kvSet('wallet:' + id, { ...cur, esusu: { ...cur.esusu, paid } })
    const m = roster.find((x) => x.memberId === nextDue.memberId); if (m) await notify({ to: m.createdBy, title: 'Esusu payout received', body: fmtNaira(payout) + ' from ' + coop.name, event: 'esusu', phone: m.phone })
    await reload(); setBusy(false)
  }
  return (
    <div className="wallet">
      <div className="wallet-top"><div><span className="wallet-lab">Cooperative savings pool (esusu / ajo)</span><span className="wallet-bal">{fmtNaira(w.balance)}</span></div><span className="wallet-chip">{roster.length} members</span></div>
      {!es ? (
        <div className="esusu-next"><span>No rotation set up yet. Members save into the pool; a rotation pays the pool to each member in turn, on a monthly schedule.</span>{canManage ? <button className="btn btn-gold btn-sm" onClick={startRotation} disabled={busy}>{busy ? 'Starting\u2026' : 'Start rotation'}</button> : null}</div>
      ) : (<>
        <div className="esusu-next"><span>{nextDue ? 'Due now \u2014 pays to' : upcoming ? 'Next payout goes to' : 'Rotation complete for'}</span><strong>{(nextDue || upcoming || sched[sched.length - 1] || {}).name || '\u2014'}</strong>{canManage && nextDue ? <button className="btn btn-gold btn-sm" onClick={processDue} disabled={busy}>{busy ? 'Paying\u2026' : 'Process due payout'}</button> : null}</div>
        <div className="rtable-wrap"><table className="rtable"><thead><tr><th>#</th><th>Member</th><th>Scheduled</th><th>Status</th></tr></thead>
          <tbody>{sched.map((s) => { const st = s.paid ? 'Paid' : (new Date(s.dueDate).getTime() <= Date.now() ? 'Due' : 'Upcoming'); return (<tr key={s.pos}><td className="mono">{s.pos + 1}</td><td>{s.name}</td><td>{fmtDate(s.dueDate)}</td><td><span className={cx('chip', st === 'Paid' ? 'st-approved' : st === 'Due' ? 'st-review' : 'st-filed')}>{st}{s.paid ? ' \u00b7 ' + fmtNaira(s.paidAmount) : ''}</span></td></tr>) })}</tbody>
        </table></div>
      </>)}
      <p className="panel-note">Rotation is scheduled monthly and pays the pool to each member in turn. In production a scheduled job processes each due payout automatically and notifies the recipient; here the society triggers the due payout. Demo movements until payments are connected.</p>
      <h4 className="wallet-h">Pool activity</h4>
      <TxnList txns={w.txns} />
    </div>
  )
}
/* =============================== STAGE 7 ===============================
   Support & Grievance Redress. A help concierge with an FAQ, an optional AI
   assistant (via the server-side proxy when a key is configured), and a
   ticketing / grievance system: members and partners raise issues, the
   Directorate triages, and leadership is the escalation panel.
   ====================================================================== */
const TICKET_CATS = ['Registration', 'Annual returns', 'LASMECO / finance', 'Wallet / payments', 'Data / privacy', 'Other']
const FAQ = [
  { q: 'How do I register my cooperative?', a: 'Sign in as a Cooperative Society and file your society. You receive a tracking ID; MCCTI leadership reviews the documents and approves or returns the application.' },
  { q: 'What does it cost to join?', a: 'A one-time registration fee of \u20A650,000, plus \u20A615,000 per year for annual returns filing. LASMECO loans carry no upfront fee to the borrower.' },
  { q: 'How do I apply for a LASMECO loan?', a: 'As a member, complete your profile and apply from your dashboard. An Accelerator prepares you, your cooperative is validated, Sterling Bank assesses and guarantees, the Bank of Industry approves and funds, and Sterling disburses.' },
  { q: 'How do the wallet and esusu work?', a: 'Add funds to your wallet and save into your cooperative pool. The society disburses the pool to members in rotation (esusu / ajo).' },
  { q: 'How is my data handled?', a: 'You consent to processing at sign-up, can download your data, and can erase your personal data at any time from your dashboard. See the Privacy notice.' },
]
function genTicketId() { return 'TK-' + String(new Date().getFullYear()).slice(2) + '-' + String(Math.floor(Math.random() * 100000)).padStart(5, '0') }
async function listTickets() { return (await kvList('ticket:')).sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1)) }
async function createTicket(rec, ctx) {
  const id = genTicketId(), now = new Date().toISOString()
  const t = { ticketId: id, status: 'Open', raisedBy: ctx.email, raisedByName: ctx.name, role: ctx.role, thread: [{ by: ctx.name, role: ctx.role, text: rec.message, at: now }], createdAt: now, updatedAt: now, ...rec }
  await kvSet('ticket:' + id, t, ctx.uid)
  await notify({ to: 'role:officer', title: 'New support ticket', body: rec.subject + ' \u2014 ' + (rec.category || ''), event: 'ticket' })
  await notify({ to: 'role:leadership', title: 'New support ticket', body: rec.subject + ' \u2014 ' + (rec.category || ''), event: 'ticket' })
  return t
}
async function updateTicket(id, patch, ctx, reply) {
  const cur = await kvGet('ticket:' + id); if (!cur) return null
  const now = new Date().toISOString()
  const thread = reply ? [...(cur.thread || []), { by: ctx.name, role: ctx.role, text: reply, at: now }] : cur.thread
  const next = { ...cur, ...patch, thread, updatedAt: now }
  await kvSet('ticket:' + id, next, cur.user_id)
  if ((reply || patch.status) && cur.raisedBy && cur.raisedBy !== ctx.email) {
    await notify({ to: cur.raisedBy, title: 'Support ticket update', body: cur.subject + (patch.status ? ' \u2014 ' + patch.status : ' \u2014 new reply'), event: 'ticket' })
  }
  return next
}
function AskConcierge() {
  const [q, setQ] = useState(''), [a, setA] = useState(null), [busy, setBusy] = useState(false)
  const ask = async () => {
    if (!q.trim()) return; setBusy(true); setA(null)
    let ans = ''
    try {
      const r = await fetch('/api/anthropic', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ messages: [{ role: 'user', content: q.trim() }] }) })
      const d = await r.json().catch(() => ({}))
      if (r.ok && d && d.content) ans = Array.isArray(d.content) ? d.content.map((x) => x.text || '').join('') : String(d.content)
    } catch (e) { ans = '' }
    setA(ans || 'The AI concierge activates once the Ministry connects its assistant key. In the meantime, browse the FAQ below or raise a ticket and the Directorate will respond.')
    setBusy(false)
  }
  return (
    <div className="concierge">
      <div className="concierge-row"><input value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && ask()} placeholder="Ask a question, e.g. how do I apply for LASMECO?" /><button className="btn btn-gold btn-sm" onClick={ask} disabled={busy}>{busy ? 'Asking\u2026' : 'Ask'}</button></div>
      {a && <div className="concierge-ans">{a}</div>}
    </div>
  )
}
function RaiseTicketForm({ ctx, coop, onDone, onCancel }) {
  const [f, setF] = useState({ subject: '', category: TICKET_CATS[0], message: '' })
  const [busy, setBusy] = useState(false), [err, setErr] = useState('')
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value })
  const submit = async () => { setErr(''); if (!f.subject.trim() || !f.message.trim()) { setErr('Add a subject and a message.'); return } setBusy(true); await createTicket({ subject: f.subject.trim(), category: f.category, message: f.message.trim(), coop: coop || '' }, ctx); setBusy(false); onDone() }
  return (
    <div className="panel">
      <div className="panel-head"><h3>Raise a support ticket</h3><button className="link-back" onClick={onCancel}>Cancel</button></div>
      <div className="form-grid">
        <label className="field span2"><span>Subject</span><input value={f.subject} onChange={set('subject')} placeholder="Briefly, what is the issue?" /></label>
        <label className="field"><span>Category</span><select value={f.category} onChange={set('category')}>{TICKET_CATS.map((c) => <option key={c}>{c}</option>)}</select></label>
        <label className="field span2"><span>Message</span><textarea value={f.message} onChange={set('message')} rows={4} placeholder="Describe the issue or grievance in detail." /></label>
      </div>
      {err && <p className="auth-err">{err}</p>}
      <div className="panel-actions"><button className="btn btn-gold" onClick={submit} disabled={busy}>{busy ? 'Submitting\u2026' : 'Submit ticket'}</button></div>
      <p className="panel-note">Grievances are tracked and addressed by the Directorate within the programme’s service timelines, and escalated to leadership where unresolved.</p>
    </div>
  )
}
function TicketDetail({ ticket, ctx, onClose, onChanged }) {
  const [t, setT] = useState(ticket), [reply, setReply] = useState(''), [busy, setBusy] = useState(false)
  const staff = ctx.role === 'officer' || ctx.role === 'leadership'
  const act = async (patch, needReply) => {
    if (needReply && !reply.trim()) { toast('Add a message.'); return }
    setBusy(true); const n = await updateTicket(t.ticketId, patch, ctx, reply.trim()); setT(n); setReply(''); setBusy(false); onChanged && onChanged()
  }
  return (
    <div className="detail">
      <div className="detail-head"><div><h3>{t.subject}</h3><p className="detail-sub">{t.ticketId} &middot; {t.category} &middot; raised by {t.raisedByName}{t.coop ? ' \u00b7 ' + t.coop : ''}</p></div><button className="link-back" onClick={onClose}>&larr; Back</button></div>
      <div className="detail-chips"><StatusChip status={t.status} kind="ticket" /></div>
      <div className="thread">{(t.thread || []).map((m, i) => (<div className={cx('msg', (m.role === 'officer' || m.role === 'leadership') && 'staff')} key={i}><div className="msg-head"><strong>{m.by}</strong><span>{roleTitle(m.role)} &middot; {fmtDate(m.at)}</span></div><p>{m.text}</p></div>))}</div>
      {t.status !== 'Resolved' && (
        <div className="action-box">
          <label className="field"><span>Reply</span><textarea value={reply} onChange={(e) => setReply(e.target.value)} rows={3} placeholder="Add a reply or update." /></label>
          <div className="action-row">
            <button className="btn btn-gold btn-sm" disabled={busy} onClick={() => act({ status: staff && t.status === 'Open' ? 'In progress' : t.status }, true)}>Send reply</button>
            {staff && <button className="btn btn-outline btn-sm" disabled={busy} onClick={() => act({ status: 'Resolved' }, false)}>Mark resolved</button>}
            {ctx.role === 'officer' && <button className="btn btn-outline btn-sm" disabled={busy} onClick={() => act({ status: 'Escalated' }, true)}>Escalate to leadership</button>}
          </div>
        </div>
      )}
    </div>
  )
}
function SupportConcierge({ ctx }) {
  const staff = ctx.role === 'officer' || ctx.role === 'leadership'
  const [tickets, setTickets] = useState(null), [mode, setMode] = useState('home'), [sel, setSel] = useState(null)
  const reload = useCallback(() => { listTickets().then(setTickets) }, [])
  useEffect(() => { reload() }, [reload])
  if (!tickets) return <p className="muted-line">Loading support…</p>
  if (sel) return <TicketDetail ticket={sel} ctx={ctx} onClose={() => { setSel(null); reload() }} onChanged={reload} />
  if (mode === 'raise') return <RaiseTicketForm ctx={ctx} onCancel={() => setMode('home')} onDone={() => { setMode('home'); reload() }} />
  const mine = tickets.filter((t) => t.raisedBy === ctx.email)
  const open = tickets.filter((t) => t.status !== 'Resolved')
  const rows = (list) => (
    <div className="rtable-wrap"><table className="rtable"><thead><tr><th>Ticket</th><th>Subject</th><th>Category</th><th>Raised by</th><th>Status</th><th></th></tr></thead>
      <tbody>{list.map((t) => (<tr key={t.ticketId}><td className="mono">{t.ticketId}</td><td className="td-name">{t.subject}</td><td>{t.category}</td><td>{t.raisedByName}</td><td><StatusChip status={t.status} kind="ticket" /></td><td><button className="btn-open" onClick={() => setSel(t)}>Open</button></td></tr>))}</tbody>
    </table></div>
  )
  return (
    <div className="ws">
      <div className="section-head" style={{ maxWidth: 'none', marginBottom: '8px' }}><h2 style={{ fontSize: '24px' }}>{staff ? 'Support &amp; grievance desk' : 'Help &amp; support'}</h2></div>
      <AskConcierge />
      {staff ? (
        <>
          <div className="statgrid"><div className="stat"><span className="stat-fig">{tickets.filter((t) => t.status === 'Open').length}</span><span className="stat-lab">Open</span></div><div className="stat"><span className="stat-fig">{tickets.filter((t) => t.status === 'In progress').length}</span><span className="stat-lab">In progress</span></div><div className="stat"><span className="stat-fig">{tickets.filter((t) => t.status === 'Escalated').length}</span><span className="stat-lab">Escalated</span></div><div className="stat"><span className="stat-fig">{tickets.filter((t) => t.status === 'Resolved').length}</span><span className="stat-lab">Resolved</span></div></div>
          <h4 className="wallet-h">Open tickets</h4>
          {open.length ? rows(open) : <p className="muted-line">No open tickets.</p>}
        </>
      ) : (
        <>
          <div className="support-cta"><span>Can’t find an answer? Raise a ticket and the Directorate will respond.</span><button className="btn btn-gold btn-sm" onClick={() => setMode('raise')}>Raise a ticket</button></div>
          <h4 className="wallet-h">Frequently asked</h4>
          <Accordion items={FAQ} />
          <h4 className="wallet-h">My tickets</h4>
          {mine.length ? rows(mine) : <p className="muted-line">You have no tickets yet.</p>}
        </>
      )}
    </div>
  )
}
const ROLE_NAV = {
  society: [['overview', 'Overview'], ['cooperative', 'My cooperative'], ['lending', 'LASMECO readiness'], ['guarantees', 'Guarantee requests'], ['chains', 'Value chains'], ['savings', 'Savings & esusu']],
  member: [['overview', 'Overview'], ['wallet', 'Wallet & savings'], ['finance', 'LASMECO finance'], ['chains', 'Value chains']],
  officer: [['overview', 'Overview'], ['queue', 'Review queue'], ['all', 'All societies'], ['members', 'Members'], ['lasmeco', 'LASMECO'], ['offices', 'Area offices'], ['risk', 'Risk & fraud'], ['audit', 'Audit log'], ['reports', 'Reports'], ['integrations', 'Integrations']],
  auditor: [['overview', 'Overview'], ['returns', 'Returns to examine'], ['all', 'All societies']],
  accelerator: [['overview', 'Overview'], ['queue', 'My pipeline'], ['all', 'All loans'], ['earnings', 'Earnings'], ['chains', 'Value chains']],
  sterling: [['overview', 'Overview'], ['queue', 'My queue'], ['all', 'All loans'], ['monitoring', 'Portfolio monitoring']],
  boi: [['overview', 'Overview'], ['queue', 'My queue'], ['all', 'All loans'], ['monitoring', 'Portfolio monitoring']],
  assetmatrix: [['overview', 'Overview'], ['distribution', 'Distribution']],
  reviewer: [['overview', 'Overview'], ['applications', 'Applications'], ['chains', 'Value chains'], ['accelerators', 'Accelerators'], ['members', 'Members'], ['lasmeco', 'LASMECO'], ['monitoring', 'Portfolio monitoring'], ['sla', 'Service levels'], ['risk', 'Risk & fraud'], ['revenue', 'Revenue & billing'], ['reports', 'Reports & exports']],
  leadership: [['overview', 'Overview'], ['applications', 'Applications'], ['chains', 'Value chains'], ['accelerators', 'Accelerators'], ['members', 'Members'], ['lasmeco', 'LASMECO'], ['monitoring', 'Portfolio monitoring'], ['sla', 'Service levels'], ['risk', 'Risk & fraud'], ['revenue', 'Revenue & billing'], ['reports', 'Reports & exports'], ['retention', 'Data retention'], ['integrations', 'Integrations']],
}
const WORKSPACES = { society: SocietyWorkspace, member: MemberWorkspace, officer: OfficerWorkspace, auditor: AuditorWorkspace, sterling: SterlingWorkspace, boi: BoiWorkspace, assetmatrix: AssetMatrixWorkspace, accelerator: AcceleratorWorkspace, leadership: LeadershipOverview, reviewer: LeadershipOverview }
function SideIcon({ name }) {
  const p = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.7, strokeLinecap: 'round', strokeLinejoin: 'round' }
  const paths = {
    workspace: <><rect {...p} x="3" y="3" width="7" height="7" rx="1.5" /><rect {...p} x="14" y="3" width="7" height="7" rx="1.5" /><rect {...p} x="3" y="14" width="7" height="7" rx="1.5" /><rect {...p} x="14" y="14" width="7" height="7" rx="1.5" /></>,
    help: <><circle {...p} cx="12" cy="12" r="9" /><path {...p} d="M9.5 9.2a2.5 2.5 0 1 1 3 2.4c-.8.3-1.5 1-1.5 2M12 17h.01" /></>,
    privacy: <path {...p} d="M12 3l7 3v5c0 4.5-3 7.6-7 9-4-1.4-7-4.5-7-9V6z" />,
    bell: <path {...p} d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 0 1-3.4 0" />,
  }
  return <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">{paths[name]}</svg>
}
function Sidebar({ role, profile, sections, section, setSection, onSignOut, onHome, canPrivacy, unread, impersonating, onExitView }) {
  return (
    <aside className="side">
      <button className="side-brand" onClick={onHome}><span className="brand-mark" aria-hidden="true">&#9670;</span><span className="side-brand-name">MCCTI <em>CoopEco</em></span></button>
      <div className="side-scroll">
        {impersonating && <button className="side-return" onClick={onExitView}>&larr; Return to my workspace</button>}
        <nav className="side-nav" aria-label="Sections">{sections.map(([id, label]) => (<button key={id} className={cx('side-item', section === id && 'on')} onClick={() => setSection(id)}><span className="side-dot" aria-hidden="true" /><span>{label}</span></button>))}</nav>
        <div className="side-sep" />
        <nav className="side-nav" aria-label="Support">
          <button className={cx('side-item', section === 'notifications' && 'on')} onClick={() => setSection('notifications')}><SideIcon name="bell" /><span>Notifications</span>{unread ? <span className="side-badge">{unread}</span> : null}</button>
          <button className={cx('side-item', section === 'help' && 'on')} onClick={() => setSection('help')}><SideIcon name="help" /><span>Help & support</span></button>
          {canPrivacy && <button className={cx('side-item', section === 'privacy' && 'on')} onClick={() => setSection('privacy')}><SideIcon name="privacy" /><span>Privacy & data</span></button>}
        </nav>
      </div>
      <div className="side-foot">
        {DEMO_DATA && <div className="demo-badge" title={hasSupabase ? 'VITE_DEMO_DATA is true' : 'No database connected'}>Demo data</div>}
        <div className="side-user"><Avatar name={profile.name} photo={profile.photo} size={34} /><div className="side-user-text"><span className="side-name">{profile.name}</span><span className="side-role">{roleTitle(role)}</span></div></div>
        <button className="side-signout" onClick={onSignOut}>Sign out</button>
      </div>
    </aside>
  )
}
function Dashboard({ session, onSignOut, onHome }) {
  const p = session.profile
  const [viewAs, setViewAs] = useState(null)
  const eff = viewAs || { role: p.role, name: p.name, email: session.email, office: p.office, title: p.title }
  const ctx = { email: eff.email, uid: session.id, role: eff.role, name: eff.name, focusId: eff.focusId }
  const sections = ROLE_NAV[eff.role] || [['overview', 'Overview']]
  const [section, setSection] = useState(sections[0][0])
  useEffect(() => { setSection((ROLE_NAV[eff.role] || [['overview', 'Overview']])[0][0]) }, [eff.role])
  const canPrivacy = p.role === 'society' || p.role === 'member'
  const Workspace = WORKSPACES[eff.role] || CapabilityPreview
  const [unread, setUnread] = useState(0)
  const refreshUnread = useCallback(() => { listNotifs(ctx).then((l) => setUnread(l.filter((n) => !n.read).length)) }, [ctx.email, ctx.role])
  useEffect(() => { refreshUnread() }, [refreshUnread, section])
  const content = section === 'help'
    ? <SupportConcierge ctx={ctx} />
    : section === 'notifications'
      ? <NotificationCenter ctx={ctx} onChange={refreshUnread} onNavigate={setSection} />
      : (section === 'privacy' && canPrivacy)
        ? <DataControls ctx={ctx} onDeleted={onSignOut} />
        : (eff.role === 'leadership' && !viewAs)
          ? <LeadershipOverview ctx={ctx} section={section} onViewAs={setViewAs} />
          : <Workspace ctx={ctx} section={section} />
  return (
    <div className="shell">
      <Sidebar role={eff.role} profile={p} sections={sections} section={section} setSection={setSection} onSignOut={onSignOut} onHome={onHome} canPrivacy={canPrivacy} unread={unread} impersonating={!!viewAs} onExitView={() => setViewAs(null)} />
      <main className="shell-main"><div className="dash-inner">
        {viewAs && <div className="viewas-banner"><span>Viewing as <strong>{eff.name}</strong> &middot; {roleTitle(eff.role)}</span><button className="link-inline" onClick={() => setViewAs(null)}>Exit view</button></div>}
        <div className="dash-hero">
          <Avatar name={eff.name} photo={p.photo} size={64} />
          <div className="dash-hero-text"><p className="eyebrow"><span className="eb-dot" />{viewAs ? 'Impersonation view' : greeting()}</p><h1 className="dash-name">{eff.name}</h1><p className="dash-meta">{eff.title} &middot; {eff.office}</p></div>
          <span className="dash-rolebadge">{roleTitle(eff.role)}</span>
        </div>
        {content && eff.role === 'leadership' && !viewAs && <ViewAsBar onViewAs={setViewAs} />}
        {content}
      </div></main>
    </div>
  )
}

/* ------------------------------- app ---------------------------------- */
/* ---- Toasts & confirm modals (replace blocking alert/confirm) ------------ */
const _toastBus = { listeners: new Set(), toasts: [] }
let _toastId = 0
function _emitToasts() { _toastBus.listeners.forEach((fn) => fn([..._toastBus.toasts])) }
function dismissToast(id) { _toastBus.toasts = _toastBus.toasts.filter((t) => t.id !== id); _emitToasts() }
function toast(message, kind = 'info') { const id = ++_toastId; _toastBus.toasts = [..._toastBus.toasts, { id, message: String(message), kind }]; _emitToasts(); setTimeout(() => dismissToast(id), kind === 'error' ? 6500 : 4200); return id }
const _confirmBus = { listeners: new Set(), current: null }
function _emitConfirm() { _confirmBus.listeners.forEach((fn) => fn(_confirmBus.current)) }
function confirmDialog(message, opts = {}) { return new Promise((resolve) => { _confirmBus.current = { message: String(message), confirmLabel: opts.confirmLabel || 'Confirm', cancelLabel: opts.cancelLabel || 'Cancel', danger: !!opts.danger, resolve }; _emitConfirm() }) }
function _resolveConfirm(v) { const c = _confirmBus.current; _confirmBus.current = null; _emitConfirm(); if (c) c.resolve(v) }
const _previewBus = { listeners: new Set(), current: null }
function _emitPreview() { _previewBus.listeners.forEach((fn) => fn(_previewBus.current)) }
function showPreview(doc, url) { _previewBus.current = { name: doc.name, type: doc.type, url }; _emitPreview() }
function closePreview() { _previewBus.current = null; _emitPreview() }
function DocumentPreview() {
  const [doc, setDoc] = useState(null)
  useEffect(() => { const l = (d) => setDoc(d ? { ...d } : null); _previewBus.listeners.add(l); return () => _previewBus.listeners.delete(l) }, [])
  useEffect(() => { if (!doc) return; const onKey = (e) => { if (e.key === 'Escape') closePreview() }; window.addEventListener('keydown', onKey); return () => window.removeEventListener('keydown', onKey) }, [doc])
  if (!doc) return null
  const isImg = (doc.type || '').indexOf('image/') === 0 || /\.(png|jpe?g|webp|gif)$/i.test(doc.name || '')
  const isHtml = /^data:text\/html/.test(doc.url || '')
  const isPdf = !isHtml && ((doc.type || '') === 'application/pdf' || /\.pdf$/i.test(doc.name || ''))
  return (
    <div className="modal-overlay" onClick={closePreview}>
      <div className="preview" onClick={(e) => e.stopPropagation()}>
        <div className="preview-bar"><strong>{doc.name}</strong><div className="preview-acts"><a className="link-inline" href={doc.url} target="_blank" rel="noreferrer">Open in new tab</a><button className="preview-x" onClick={closePreview} aria-label="Close preview">&times;</button></div></div>
        <div className="preview-body">{isImg ? <img src={doc.url} alt={doc.name} /> : (isPdf || isHtml) ? <iframe title={doc.name} src={doc.url} /> : <div className="preview-fallback"><p>Preview isn't available for this file type.</p><a className="btn btn-gold btn-sm" href={doc.url} target="_blank" rel="noreferrer" download>Download to view</a></div>}</div>
      </div>
    </div>
  )
}
function ToastHost() {
  const [toasts, setToasts] = useState([])
  const [confirm, setConfirm] = useState(null)
  useEffect(() => {
    const tl = (t) => setToasts(t); _toastBus.listeners.add(tl); setToasts([..._toastBus.toasts])
    const cl = (c) => setConfirm(c ? { ...c } : null); _confirmBus.listeners.add(cl)
    return () => { _toastBus.listeners.delete(tl); _confirmBus.listeners.delete(cl) }
  }, [])
  useEffect(() => {
    if (!confirm) return
    const onKey = (e) => { if (e.key === 'Escape') _resolveConfirm(false); if (e.key === 'Enter') _resolveConfirm(true) }
    window.addEventListener('keydown', onKey); return () => window.removeEventListener('keydown', onKey)
  }, [confirm])
  return (<>
    <div className="toast-host" role="status" aria-live="polite">{toasts.map((t) => (<div key={t.id} className={cx('toast', 'toast-' + t.kind)} onClick={() => dismissToast(t.id)}><span>{t.message}</span><button className="toast-x" aria-label="Dismiss" onClick={(e) => { e.stopPropagation(); dismissToast(t.id) }}>&times;</button></div>))}</div>
    {confirm && <div className="modal-overlay" onClick={() => _resolveConfirm(false)}><div className="modal" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}><p className="modal-msg">{confirm.message}</p><div className="modal-actions"><button className="btn btn-ghost btn-sm" onClick={() => _resolveConfirm(false)}>{confirm.cancelLabel}</button><button className={cx('btn', 'btn-sm', confirm.danger ? 'btn-danger' : 'btn-gold')} onClick={() => _resolveConfirm(true)} autoFocus>{confirm.confirmLabel}</button></div></div></div>}
    <DocumentPreview />
  </>)
}
export default function App() {
  const [area, setArea] = useState('state')
  const [view, setView] = useState('landing')
  const [chosenRole, setChosenRole] = useState(null)
  const [session, setSession] = useState(null)
  const [ready, setReady] = useState(false)
  const [seedTick, setSeedTick] = useState(0)
  const bgSeed = useCallback(() => { ensureSeedData().then((changed) => { if (changed) setSeedTick((t) => t + 1) }).catch(() => { }) }, [])
  const [lang, setLang] = useState(() => LS.get('coopeco.lang', 'en'))
  useEffect(() => { LS.set('coopeco.lang', lang) }, [lang])
  const [landingTab, setLandingTab] = useState('home')
  const goLanding = (tab) => { setView('landing'); setLandingTab(tab); if (typeof window !== 'undefined') window.scrollTo({ top: 0 }) }
  useEffect(() => {
    (async () => {
      const s = await loadSession()
      setSession(s); setReady(true)
      if (!hasSupabase || s) bgSeed()
    })()
  }, [bgSeed])
  const enter = useCallback(() => setView(session ? 'dashboard' : 'role'), [session])
  const pickRole = (id) => { setChosenRole(id); setView('auth') }
  const onAuthed = (res) => { setSession(res); setView('dashboard'); bgSeed() }
  const doSignOut = async () => { await signOutNow(); setSession(null); setView('landing') }
  useEffect(() => {
    if (!session) return
    const p = session.profile || {}
    if (p.role === 'reviewer' && reviewAccessExpired()) { toast('Review access has expired. Contact MCCTI to extend it.', 'error'); doSignOut(); return }
    const SESSION_MS = 30 * 60 * 1000
    let timer, last = 0
    const arm = () => { clearTimeout(timer); timer = setTimeout(() => { toast('Signed out after 30 minutes of inactivity.'); doSignOut() }, SESSION_MS) }
    const reset = () => { const now = Date.now(); if (now - last < 5000) return; last = now; arm() } // throttle: at most once per 5s
    const evts = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart']
    evts.forEach((e) => window.addEventListener(e, reset, { passive: true }))
    arm()
    return () => { clearTimeout(timer); evts.forEach((e) => window.removeEventListener(e, reset)) }
  }, [session])
  const goHome = () => { setView('landing'); setLandingTab('home'); if (typeof window !== 'undefined') window.scrollTo({ top: 0 }) }
  const inApp = view === 'dashboard' && session
  return (
    <div className={cx('page', inApp && 'is-app')}>
      <style>{CSS}</style>
      <div className="letterhead">
        <div className="lh-left"><img className="lh-seal" src="/lagos-seal.png" alt="Lagos State coat of arms" /><div className="lh-text"><span className="lh-gov">Lagos State Government</span><span className="lh-min">Ministry of Commerce, Cooperatives, Trade &amp; Investment</span></div></div>
        <img className="lh-mccti" src="/mccti-logo.png" alt="MCCTI" />
      </div>
      {!inApp && (
        <header className="nav">
          <button className="brand" onClick={goHome}><span className="brand-mark" aria-hidden="true">&#9670;</span><span className="brand-name">MCCTI <em>CoopEco</em></span></button>
          <nav className="nav-links" aria-label="Primary">{view === 'landing' ? (<>{[['home', 'nav.home'], ['modules', 'nav.modules'], ['leadership', 'nav.leadership'], ['about', 'nav.about'], ['platform', 'nav.platform']].map(([id, k]) => <button key={id} className={cx('nav-page', landingTab === id && 'on')} onClick={() => goLanding(id)}>{t(k, lang)}</button>)}</>) : null}<button className="nav-verify" onClick={() => setView('verify')}>{t('nav.verify', lang)}</button><select className="lang-select" value={lang} onChange={(e) => setLang(e.target.value)} aria-label="Language">{LANGS.map(([code, label]) => <option key={code} value={code}>{label}</option>)}</select></nav>
          {ready && session ? (
            <div className="account"><button className="acct-btn" onClick={() => setView('dashboard')}><Avatar name={session.profile.name} photo={session.profile.photo} size={30} /><span className="acct-name">{session.profile.name.split(' ')[0]}</span></button><button className="signout" onClick={doSignOut}>Sign out</button></div>
          ) : (<button className="btn btn-gold nav-cta" onClick={enter}>{t('cta.enter', lang)}</button>)}
        </header>
      )}
      {view === 'landing' && <Landing area={area} setArea={setArea} onEnter={enter} lang={lang} tab={landingTab} onTab={goLanding} />}
      {view === 'role' && <RolePage onPick={pickRole} onBack={goHome} />}
      {view === 'auth' && <AuthPage role={chosenRole} onDone={onAuthed} onBack={() => setView('role')} onPrivacy={() => setView('privacy')} />}
      {view === 'privacy' && <PrivacyNotice onBack={() => setView(session ? 'dashboard' : 'landing')} />}
      {view === 'verify' && <PublicVerify onBack={goHome} />}
      {inApp && <Dashboard key={seedTick} session={session} onSignOut={doSignOut} onHome={goHome} />}
      {!inApp && (
        <footer className="foot">
          <div className="foot-top"><div className="foot-lockup"><img src="/lagos-seal.png" alt="Lagos State" /><img className="foot-mccti" src="/mccti-logo.png" alt="MCCTI" /><div className="foot-lockup-text"><span className="lh-gov">Lagos State Government</span><span className="lh-min">Ministry of Commerce, Cooperatives, Trade &amp; Investment</span></div></div>{!session && <button className="btn btn-gold" onClick={enter}>Enter platform</button>}</div>
          <div className="foot-grid"><p>A Ministry-owned digital platform for the cooperative economy of Lagos State.</p><p className="foot-conf">&copy; Ministry of Commerce, Cooperatives, Trade &amp; Investment, Lagos State Government. <button className="link-inline" onClick={() => setView('verify')}>Verify a cooperative</button> &middot; <button className="link-inline" onClick={() => setView('privacy')}>Privacy notice</button></p></div>
        </footer>
      )}
      <ConsentBanner onOpenPrivacy={() => setView('privacy')} />
      <ToastHost />
    </div>
  )
}

const CSS = `
:root{--ink:#F5F7F3;--ink-2:#FFFFFF;--green:#1C8A4F;--green-panel:#EAF3EC;--line:rgba(20,50,35,.13);--line-soft:rgba(20,50,35,.07);--gold:#8A681E;--gold-soft:#93701F;--cream:#17241C;--cream-ink:#17241C;--sage:#48524B;--sage-dim:#78837C;--err:#C0533A;--serif:'Lora',Georgia,'Times New Roman',serif;--sans:'Inter',system-ui,-apple-system,sans-serif;--mono:'IBM Plex Mono',ui-monospace,monospace}
*{box-sizing:border-box}html{scroll-behavior:smooth}body{margin:0}
.page{background:radial-gradient(1100px 560px at 85% -12%,rgba(28,138,79,.07),transparent 60%),radial-gradient(900px 500px at -5% 15%,rgba(176,132,47,.05),transparent 55%),var(--ink);color:var(--sage);font-family:var(--sans);-webkit-font-smoothing:antialiased;min-height:100vh;overflow-x:hidden;display:flex;flex-direction:column}
.eyebrow{font-family:var(--mono);font-size:11px;letter-spacing:.22em;text-transform:uppercase;color:var(--gold);margin:0 0 16px;display:flex;align-items:center;gap:9px}
.eb-dot{width:6px;height:6px;border-radius:50%;background:var(--green);display:inline-block}
h1,h2,h3,h4{font-family:var(--serif);color:var(--cream);font-weight:500;margin:0}p{margin:0}input,select,textarea{font-family:var(--sans)}
.btn{font-family:var(--sans);font-size:14px;font-weight:600;border:none;cursor:pointer;padding:13px 24px;border-radius:2px;text-decoration:none;display:inline-block;transition:transform .18s ease,background .18s ease,color .18s ease,border-color .18s ease}
.btn-gold{background:var(--green);color:#fff;box-shadow:0 10px 26px -14px rgba(28,138,79,.55)}
.btn-gold:hover{background:var(--gold-soft);transform:translateY(-1px)}.btn-gold:disabled{opacity:.6;cursor:default;transform:none}
.btn-ghost{background:transparent;color:var(--cream);border:1px solid var(--line)}.btn-ghost:hover{border-color:var(--gold);color:var(--gold-soft)}
.btn-outline{background:transparent;color:var(--cream);border:1px solid var(--line);box-shadow:none}.btn-outline:hover{border-color:var(--gold);color:var(--gold-soft)}
.btn-sm{padding:9px 16px;font-size:13px}
.letterhead{display:flex;align-items:center;justify-content:space-between;gap:20px;padding:11px 40px;background:var(--ink-2);color:var(--cream-ink);border-bottom:2px solid var(--green)}
.lh-left{display:flex;align-items:center;gap:14px;min-width:0}.lh-seal{height:40px;width:auto}
.lh-text{display:flex;flex-direction:column;line-height:1.25;min-width:0}
.lh-gov{font-family:var(--serif);font-weight:600;font-size:14px;color:var(--cream-ink)}
.lh-min{font-family:var(--mono);font-size:10.5px;letter-spacing:.03em;color:#4a5a4f;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.lh-mccti{height:38px;width:auto;flex-shrink:0}
.nav{position:sticky;top:0;z-index:40;display:flex;align-items:center;justify-content:space-between;padding:15px 40px;background:rgba(255,255,255,.86);backdrop-filter:blur(12px);border-bottom:1px solid var(--line-soft)}
.brand{display:flex;align-items:center;gap:10px;text-decoration:none;background:none;border:none;cursor:pointer;padding:0}
.brand-mark{color:var(--green);font-size:13px}.brand-name{font-family:var(--serif);color:var(--cream);font-size:19px;letter-spacing:.01em;font-weight:600}.brand-name em{color:var(--gold-soft);font-style:italic;font-weight:500}
.nav-links{display:flex;gap:32px}.nav-links a{color:var(--sage);text-decoration:none;font-size:14px;font-weight:500;position:relative}.nav-links a::after{content:'';position:absolute;left:0;right:0;bottom:-6px;height:2px;background:var(--green);transform:scaleX(0);transform-origin:left;transition:transform .25s ease}.nav-links a:hover{color:var(--cream)}.nav-links a:hover::after{transform:scaleX(1)}
html{scroll-behavior:smooth}section[id]{scroll-margin-top:84px}
.reveal{opacity:0;transform:translateY(20px);transition:opacity .6s cubic-bezier(.2,.7,.2,1),transform .6s cubic-bezier(.2,.7,.2,1)}.reveal.in{opacity:1;transform:none}
@media(prefers-reduced-motion:reduce){.reveal{opacity:1;transform:none;transition:none}html{scroll-behavior:auto}}
/* leadership */
section.leaders{max-width:1200px;margin:0 auto;padding:64px 40px}
section.pricing{max-width:1200px;margin:0 auto;padding:64px 40px}
.price-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:16px;margin-top:36px}
.price-card{background:var(--ink-2);border:1px solid var(--line-soft);border-radius:10px;padding:22px;display:flex;flex-direction:column;gap:8px;transition:transform .25s cubic-bezier(.2,.7,.2,1),box-shadow .25s ease,border-color .25s ease}
.price-card:hover{transform:translateY(-4px);box-shadow:0 20px 40px -28px rgba(20,50,35,.4);border-color:var(--line)}
.price-top{display:flex;align-items:baseline;gap:8px}
.price-amt{font-family:var(--serif);font-size:26px;font-weight:600;color:var(--green)}
.price-unit{font-family:var(--mono);font-size:11px;color:var(--sage-dim)}
.price-card h3{font-size:16px;line-height:1.25;margin-top:4px}
.price-who{font-family:var(--mono);font-size:10px;letter-spacing:.06em;text-transform:uppercase;color:var(--gold)}
.price-card>p:last-child{font-size:13px;line-height:1.55;color:var(--sage)}
.leader-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:24px;margin-top:18px}
.leader-grid.two{grid-template-columns:repeat(2,1fr);max-width:780px;margin-left:auto;margin-right:auto}
.leader-group-lab{font-family:var(--mono);font-size:11px;letter-spacing:.1em;text-transform:uppercase;color:var(--gold);margin-top:34px}
.leader-card{background:var(--ink-2);border:1px solid var(--line-soft);border-radius:12px;overflow:hidden;transition:transform .3s cubic-bezier(.2,.7,.2,1),box-shadow .3s ease,border-color .3s ease}
.leader-card:hover{transform:translateY(-6px);box-shadow:0 26px 50px -30px rgba(20,50,35,.5);border-color:var(--line)}
.leader-photo{position:relative;aspect-ratio:1/1;background:linear-gradient(160deg,var(--green-panel),#dfeee2);overflow:hidden}
.leader-photo img{width:100%;height:100%;object-fit:cover;object-position:center top;transition:transform .5s cubic-bezier(.2,.7,.2,1)}
.leader-card:hover .leader-photo img{transform:scale(1.04)}
.leader-mono{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-family:var(--serif);font-size:64px;font-weight:600;color:var(--green)}
.leader-ring{position:absolute;inset:0;box-shadow:inset 0 -70px 60px -40px rgba(20,50,35,.18);pointer-events:none}
.leader-body{padding:22px 24px 26px}
.leader-role{font-family:var(--mono);font-size:10px;letter-spacing:.1em;text-transform:uppercase;color:var(--green)}
.leader-body h3{font-size:20px;margin:8px 0 10px;line-height:1.2}
.leader-body p{font-size:13.5px;line-height:1.6;color:var(--sage)}
/* about accordion */
section.about{max-width:900px;margin:0 auto;padding:24px 40px 72px}
.acc{margin-top:32px;display:flex;flex-direction:column;gap:12px}
.acc-item{background:var(--ink-2);border:1px solid var(--line-soft);border-radius:10px;overflow:hidden;transition:border-color .2s ease}
.acc-item.open{border-color:var(--green)}
.acc-head{width:100%;display:flex;align-items:center;justify-content:space-between;gap:16px;background:none;border:none;cursor:pointer;padding:20px 24px;font-family:var(--serif);font-size:18px;font-weight:600;color:var(--cream);text-align:left}
.acc-ic{position:relative;width:16px;height:16px;flex-shrink:0}
.acc-ic::before,.acc-ic::after{content:'';position:absolute;background:var(--green);border-radius:2px;transition:transform .3s ease,opacity .3s ease}
.acc-ic::before{top:7px;left:0;width:16px;height:2px}
.acc-ic::after{top:0;left:7px;width:2px;height:16px}
.acc-item.open .acc-ic::after{transform:rotate(90deg);opacity:0}
.acc-panel{display:grid;grid-template-rows:0fr;transition:grid-template-rows .32s cubic-bezier(.2,.7,.2,1)}
.acc-item.open .acc-panel{grid-template-rows:1fr}
.acc-inner{overflow:hidden;color:var(--sage);font-size:14.5px;line-height:1.7;padding:0 24px}
.acc-item.open .acc-inner{padding:0 24px 22px}
/* micro-interactions on existing cards */
.mod-card{transition:background .2s ease,transform .25s cubic-bezier(.2,.7,.2,1),box-shadow .25s ease}
.mod-card:hover{transform:translateY(-4px);box-shadow:0 20px 40px -28px rgba(20,50,35,.4)}
.persona{transition:transform .2s ease,border-color .2s ease}.persona:hover{transform:translateY(-3px)}
.band-fig{transition:color .2s ease}
.hero-watermark{animation:floaty 9s ease-in-out infinite}
@keyframes floaty{0%,100%{transform:translateY(0)}50%{transform:translateY(-14px)}}
@media(prefers-reduced-motion:reduce){.hero-watermark{animation:none}}
.nav-cta{padding:10px 18px}
.account{display:flex;align-items:center;gap:14px}
.acct-btn{display:flex;align-items:center;gap:9px;background:transparent;border:1px solid var(--line-soft);border-radius:40px;padding:5px 14px 5px 5px;cursor:pointer;transition:border-color .16s ease}.acct-btn:hover{border-color:var(--gold)}
.acct-name{color:var(--cream);font-size:14px;font-weight:600}
.signout{background:none;border:none;color:var(--sage-dim);font-family:var(--mono);font-size:11px;letter-spacing:.06em;text-transform:uppercase;cursor:pointer}.signout:hover{color:var(--gold-soft)}
.avatar{display:inline-flex;align-items:center;justify-content:center;border-radius:50%;background:var(--green);color:#fff;font-family:var(--serif);font-weight:600;border:none;flex-shrink:0}.avatar-img{object-fit:cover;padding:0}
.hero{position:relative;max-width:1200px;margin:0 auto;padding:74px 40px 44px;display:grid;grid-template-columns:1.05fr .95fr;gap:56px;align-items:center}
.hero-watermark{position:absolute;right:-70px;top:-20px;width:500px;opacity:.08;pointer-events:none;user-select:none}
.hero-copy{position:relative;z-index:1;animation:rise .7s ease both}
h1{font-size:clamp(38px,5vw,64px);line-height:1.06;letter-spacing:-.01em;margin-bottom:24px}
.underline{position:relative;white-space:nowrap}.underline::after{content:'';position:absolute;left:0;bottom:.02em;height:.08em;width:100%;background:var(--gold);transform:scaleX(0);transform-origin:left;animation:draw 1s .5s ease forwards}
.lead{font-size:17px;line-height:1.68;color:var(--sage);max-width:36em;margin-bottom:30px}
.hero-cta{display:flex;gap:14px;flex-wrap:wrap;margin-bottom:24px}.hero-foot{font-family:var(--mono);font-size:12px;letter-spacing:.06em;color:var(--sage-dim)}
.register{position:relative;z-index:1;animation:rise .7s .1s ease both}
.register-frame{background:linear-gradient(180deg,var(--green-panel),#E6EFE7);border:1px solid var(--gold);border-radius:5px;padding:5px;box-shadow:0 34px 70px -34px rgba(0,0,0,.7)}
.register-frame::after{content:'';position:absolute;inset:9px;border:1px solid var(--line);border-radius:3px;pointer-events:none}
.register-head{display:flex;align-items:center;gap:12px;padding:16px 18px;border-bottom:1px solid var(--line)}.reg-seal{height:34px;width:auto}
.reg-title{font-family:var(--serif);color:var(--cream);font-size:16px;font-weight:600}.reg-sub{font-size:11px;color:var(--sage-dim);margin-top:2px}
.reg-live{margin-left:auto;font-family:var(--mono);font-size:10px;letter-spacing:.14em;text-transform:uppercase;color:var(--gold);border:1px solid var(--line);padding:4px 9px;border-radius:2px}
.reg-live::before{content:'';display:inline-block;width:6px;height:6px;border-radius:50%;background:var(--gold);margin-right:6px;vertical-align:middle;animation:pulse 1.8s ease-in-out infinite}
.register-rows{padding:6px 6px;filter:blur(.4px)}
.reg-row{display:flex;align-items:center;justify-content:space-between;gap:16px;padding:14px 12px;border-bottom:1px solid var(--line-soft)}.reg-row:last-child{border-bottom:none}.reg-row.is-new{animation:fadeIn .6s ease both}
.reg-row-main{display:flex;flex-direction:column;gap:3px;min-width:0}.reg-name{color:var(--cream);font-size:14px;font-weight:500;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:16em}.reg-office{font-size:11px;color:var(--sage-dim)}
.reg-row-meta{display:flex;flex-direction:column;align-items:flex-end;gap:5px;flex-shrink:0}.reg-id{font-family:var(--mono);font-size:11px;color:var(--gold-soft);letter-spacing:.02em}
.reg-status{font-size:10px;padding:3px 8px;border-radius:2px;letter-spacing:.03em;white-space:nowrap}
.s-approved{background:rgba(198,161,91,.16);color:var(--gold-soft)}.s-under{background:rgba(171,193,180,.12);color:var(--sage)}.s-annual{background:rgba(171,193,180,.10);color:var(--sage-dim)}.s-kyc{background:rgba(171,193,180,.10);color:var(--sage-dim)}.s-registration{background:rgba(171,193,180,.12);color:var(--sage)}
.register-foot{display:flex;justify-content:space-between;align-items:center;padding:13px 18px;border-top:1px solid var(--line);font-size:11px;color:var(--sage-dim)}
.reg-stamp{font-family:var(--mono);font-size:10px;letter-spacing:.14em;text-transform:uppercase;color:var(--gold);border:1px dashed var(--line);padding:3px 8px;transform:rotate(-1.5deg)}
.band{max-width:1200px;margin:26px auto 0;padding:28px 40px;display:flex;flex-wrap:wrap;gap:16px 40px;justify-content:space-between;border-top:1px solid var(--line-soft);border-bottom:1px solid var(--line-soft)}
.band-item{display:flex;flex-direction:column;gap:6px}.band-fig{font-family:var(--serif);color:var(--cream);font-size:26px;font-weight:600}.band-arrow{color:var(--gold)}.band-lab{font-family:var(--mono);font-size:11px;letter-spacing:.08em;color:var(--sage-dim);text-transform:uppercase}
section.lens,section.modules,section.arc,section.personas,section.quote{max-width:1200px;margin:0 auto;padding:88px 40px}
.section-head{max-width:44em;margin-bottom:46px}.section-head h2{font-size:clamp(26px,3.4vw,40px);line-height:1.14;letter-spacing:-.01em;margin-top:4px}.section-sub{margin-top:16px;font-size:16px;line-height:1.62;color:var(--sage)}
.lens-tabs{display:flex;flex-wrap:wrap;gap:10px;margin-bottom:28px}
.lens-tab{font-family:var(--sans);font-size:13px;font-weight:600;color:var(--sage);background:transparent;border:1px solid var(--line-soft);border-radius:2px;padding:10px 16px;cursor:pointer;transition:all .16s ease}.lens-tab:hover{border-color:var(--gold);color:var(--gold-soft)}.lens-tab.is-on{background:var(--gold);color:#20180A;border-color:var(--gold)}.lens-tab.is-corridor:not(.is-on){border-style:dashed}
.lens-readout{display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:24px;padding:32px 36px;background:linear-gradient(180deg,var(--green-panel),#E6EFE7);border:1px solid var(--line);border-radius:5px}
.lens-tag{display:flex;align-items:center;gap:12px;flex-wrap:wrap}.corridor-flag{font-family:var(--mono);font-size:10px;letter-spacing:.12em;text-transform:uppercase;color:var(--gold);border:1px solid var(--line);padding:4px 9px;border-radius:2px}
.lens-tag-text{font-family:var(--serif);color:var(--cream);font-size:20px;font-weight:600}
.lens-figs{display:flex;gap:44px}.lens-figs>div{display:flex;flex-direction:column;gap:4px}.lf-fig{font-family:var(--serif);color:var(--cream);font-size:28px;font-weight:600}.lf-lab{font-family:var(--mono);font-size:11px;letter-spacing:.07em;color:var(--sage-dim);text-transform:uppercase}
.mod-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:1px;background:var(--line-soft);border:1px solid var(--line-soft);border-radius:5px;overflow:hidden}
.mod-card{background:var(--ink-2);padding:36px 30px 30px;display:flex;flex-direction:column;gap:12px;transition:background .2s ease,transform .2s ease}.mod-card:hover{background:#E6EFE7;transform:translateY(-2px)}
.mod-top{display:flex;align-items:center;justify-content:space-between}.mod-n{font-family:var(--mono);font-size:12px;color:var(--gold);letter-spacing:.1em}.mod-lens{font-family:var(--mono);font-size:10px;letter-spacing:.1em;text-transform:uppercase;color:var(--sage-dim)}
.mod-card h3{font-size:20px;line-height:1.22}.mod-card p{font-size:14px;line-height:1.62;color:var(--sage)}
.mod-ai{margin-top:auto;font-family:var(--mono);font-size:10px;letter-spacing:.08em;text-transform:uppercase;color:var(--gold-soft);border-top:1px solid var(--line);padding-top:12px}
.arc-steps{display:grid;grid-template-columns:1fr auto 1fr auto 1fr;align-items:stretch;gap:18px}
.arc-step{background:var(--ink-2);border:1px solid var(--line-soft);border-radius:5px;padding:32px 28px;display:flex;flex-direction:column;gap:12px}.arc-step:nth-child(5){border-color:var(--line)}
.arc-n{font-family:var(--mono);font-size:13px;color:var(--gold);letter-spacing:.1em}.arc-step h4{font-size:19px;line-height:1.2}.arc-step p{font-size:14px;line-height:1.6;color:var(--sage)}.arc-arrow{display:flex;align-items:center;color:var(--gold);font-size:22px}
.persona-grid{display:grid;grid-template-columns:repeat(5,1fr);gap:1px;background:var(--line-soft);border:1px solid var(--line-soft);border-radius:5px;overflow:hidden}
.persona{background:var(--ink-2);padding:28px 22px;display:flex;flex-direction:column;gap:10px;min-height:132px}.persona-t{font-family:var(--serif);color:var(--cream);font-size:16px;font-weight:600}.persona-d{font-size:13px;line-height:1.5;color:var(--sage-dim)}
.quote{text-align:center;position:relative}.quote-seal{width:70px;height:auto;margin:0 auto 26px;opacity:.9}
.quote blockquote{margin:0;max-width:40em;margin-inline:auto}.quote p{font-family:var(--serif);color:var(--cream);font-size:clamp(22px,2.8vw,32px);line-height:1.42;font-weight:400;font-style:italic}.quote cite{display:block;margin-top:24px;font-family:var(--mono);font-size:12px;letter-spacing:.1em;text-transform:uppercase;color:var(--gold);font-style:normal}
.flow{flex:1;display:flex;align-items:flex-start;justify-content:center;padding:64px 40px 90px}
.flow-inner{width:100%;max-width:960px;animation:rise .5s ease both}.flow-inner.narrow{max-width:440px}
.flow-back{background:none;border:none;color:var(--sage-dim);font-family:var(--mono);font-size:12px;letter-spacing:.06em;cursor:pointer;margin-bottom:26px;padding:0}.flow-back:hover{color:var(--gold-soft)}
.flow-title{font-size:clamp(30px,4vw,46px);line-height:1.08;margin-bottom:14px}.flow-sub{font-size:16px;line-height:1.6;color:var(--sage);max-width:34em;margin-bottom:36px}
.role-page-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:14px}
.role-page-card{text-align:left;background:var(--ink-2);border:1px solid var(--line-soft);border-radius:6px;padding:26px 24px;cursor:pointer;display:flex;flex-direction:column;gap:10px;transition:all .18s ease}.role-page-card:hover{border-color:var(--gold);transform:translateY(-3px);background:#E6EFE7}
.role-ico{color:var(--gold);display:inline-flex;width:46px;height:46px;align-items:center;justify-content:center;border:1px solid var(--line);border-radius:8px;margin-bottom:6px}
.role-title{font-family:var(--serif);color:var(--cream);font-size:18px;font-weight:600}.role-desc{font-size:13px;line-height:1.5;color:var(--sage-dim)}.role-go{font-family:var(--mono);font-size:11px;letter-spacing:.06em;color:var(--gold);margin-top:6px}
.demo-chip{font-family:var(--mono);font-size:11px;letter-spacing:.03em;color:var(--gold-soft);background:rgba(198,161,91,.08);border:1px solid var(--line);border-radius:3px;padding:10px 14px;margin-bottom:22px;line-height:1.5}
.auth-form{display:flex;flex-direction:column;gap:16px}
.field{display:flex;flex-direction:column;gap:7px}.field span{font-family:var(--mono);font-size:11px;letter-spacing:.08em;text-transform:uppercase;color:var(--sage-dim)}
.field input,.field select,.field textarea{background:var(--ink-2);border:1px solid var(--line-soft);border-radius:3px;padding:13px 14px;color:var(--cream);font-size:15px;transition:border-color .16s ease;width:100%}
.field input:focus,.field select:focus,.field textarea:focus{outline:none;border-color:var(--gold)}
.field input::placeholder,.field textarea::placeholder{color:var(--sage-dim)}
.field select{appearance:none;cursor:pointer}
.auth-err{color:var(--err);font-size:13px;line-height:1.5}
.auth-submit{margin-top:4px;width:100%}.auth-toggle{font-size:13px;color:var(--sage-dim);text-align:center}
.auth-forgot{background:none;border:none;color:var(--gold-soft);font-size:12.5px;text-align:right;cursor:pointer;padding:0;margin-top:-4px;align-self:flex-end}
.auth-forgot:hover{text-decoration:underline}
.bulk-bar{display:flex;align-items:center;gap:12px;flex-wrap:wrap;background:var(--green-panel);border:1px solid var(--green);border-radius:8px;padding:9px 14px;margin-bottom:12px}
.bulk-bar span{font-size:13px;font-weight:600;color:var(--green)}
.th-check{width:34px;text-align:center}
.th-check input{cursor:pointer}
.rtable tr.row-sel{background:rgba(28,138,79,.06)}
.auth-toggle button{background:none;border:none;color:var(--gold-soft);cursor:pointer;font-size:13px;font-weight:600;padding:0}.auth-toggle button:hover{text-decoration:underline}
.dash{flex:1;padding:52px 40px 90px}.dash-inner{max-width:1080px;margin:0 auto;animation:rise .5s ease both}
.shell{flex:1;display:flex;width:100%;align-items:stretch}
.side{width:250px;flex-shrink:0;background:var(--ink-2);border-right:1px solid var(--line-soft);padding:22px 14px;display:flex;flex-direction:column;gap:16px;position:sticky;top:0;height:100vh;overflow:hidden}
.side-scroll{flex:1;min-height:0;overflow-y:auto;display:flex;flex-direction:column;gap:16px}
.side-brand{display:flex;align-items:center;gap:10px;background:none;border:none;cursor:pointer;padding:6px 8px}
.side-brand-name{font-family:var(--serif);color:var(--cream);font-size:18px;font-weight:600}.side-brand-name em{color:var(--gold-soft);font-style:italic;font-weight:500}
.side-nav{display:flex;flex-direction:column;gap:4px}
.side-item{display:flex;align-items:center;gap:12px;padding:11px 12px;border-radius:8px;border:none;background:none;cursor:pointer;color:var(--sage);font-family:var(--sans);font-size:14px;font-weight:600;text-align:left;transition:background .18s ease,color .18s ease}
.side-item:hover{background:rgba(20,50,35,.05);color:var(--cream)}
.side-item.on{background:rgba(28,138,79,.1);color:var(--green)}
.side-item svg{flex-shrink:0}
.side-dot{width:6px;height:6px;border-radius:50%;background:currentColor;opacity:.45;flex-shrink:0;margin:0 6px}
.side-item.on .side-dot{opacity:1}
.side-sep{height:1px;background:var(--line-soft);margin:4px 6px}
.side-badge{margin-left:auto;min-width:20px;height:20px;padding:0 6px;border-radius:10px;background:var(--green);color:#fff;font-family:var(--mono);font-size:11px;font-weight:600;display:inline-flex;align-items:center;justify-content:center}
.notif-list{display:flex;flex-direction:column;margin-top:16px}
.notif{display:flex;gap:12px;align-items:flex-start;padding:14px 4px;border-bottom:1px solid var(--line-soft);cursor:pointer;transition:background .15s ease}
.notif:hover{background:rgba(20,50,35,.03)}
.notif-dot{width:8px;height:8px;border-radius:50%;background:var(--line);flex-shrink:0;margin-top:6px}
.notif.unread .notif-dot{background:var(--green)}
.notif-body{display:flex;flex-direction:column;gap:2px}
.notif-body strong{font-size:14px;color:var(--cream);font-weight:600}
.notif.unread .notif-body strong{color:var(--cream)}
.notif-body p{font-size:13px;color:var(--sage);line-height:1.5}
.notif-at{font-family:var(--mono);font-size:11px;color:var(--sage-dim);margin-top:2px}
.reports-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:16px}
.report-card{background:var(--ink-2);border:1px solid var(--line-soft);border-radius:10px;padding:20px;display:flex;flex-direction:column;gap:8px}
.report-card h4{font-size:15px}
.report-card p{font-size:13px;color:var(--sage);line-height:1.5;flex:1}
.report-card button{align-self:flex-start;margin-top:4px}
.report-boardpack{display:flex;align-items:center;justify-content:space-between;gap:20px;flex-wrap:wrap;background:var(--green-panel);border:1px solid var(--line);border-radius:10px;padding:18px 20px;margin-top:16px}
.report-boardpack h4{font-size:15px;margin-bottom:4px}
@media(max-width:700px){.reports-grid{grid-template-columns:1fr}}
.nav-verify{background:none;border:1px solid var(--line);border-radius:6px;padding:7px 14px;color:var(--sage);font-family:var(--sans);font-size:13px;font-weight:600;cursor:pointer;transition:border-color .18s ease,color .18s ease}
.nav-verify:hover{border-color:var(--green);color:var(--green)}
.lang-select{border:1px solid var(--line);border-radius:6px;padding:7px 10px;background:var(--ink-2);color:var(--sage);font-family:var(--sans);font-size:13px;font-weight:600;cursor:pointer}
.lang-select:focus{outline:none;border-color:var(--green)}
.nav-page{background:none;border:none;padding:6px 2px;font-family:var(--sans);font-size:14px;font-weight:500;color:var(--sage);cursor:pointer;border-bottom:2px solid transparent;transition:color .18s ease,border-color .18s ease}
.nav-page:hover{color:var(--green)}
.nav-page.on{color:var(--green);border-bottom-color:var(--green)}
.landing-sub{min-height:70vh}
.landing-sub .page{padding-top:56px;padding-bottom:72px;animation:rise .5s ease both}
@media(max-width:860px){.landing-sub .page{padding-top:32px}}
.explore{padding:64px 40px}
.explore-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:16px}
.explore-card{position:relative;text-align:left;background:var(--ink-2);border:1px solid var(--line-soft);border-radius:12px;padding:22px 22px 44px;cursor:pointer;transition:border-color .18s ease,transform .18s ease,box-shadow .18s ease;display:flex;flex-direction:column;gap:7px}
.explore-card:hover{border-color:var(--green);transform:translateY(-2px);box-shadow:0 10px 26px rgba(20,50,32,.08)}
.explore-title{font-family:var(--serif);font-size:18px;color:var(--cream)}
.explore-desc{font-size:13px;color:var(--sage);line-height:1.5}
.explore-arrow{position:absolute;left:22px;bottom:18px;color:var(--green);font-size:18px;transition:transform .18s ease}
.explore-card:hover .explore-arrow{transform:translateX(4px)}
@media(max-width:680px){.explore{padding:48px 18px}}
.lang-note{font-size:12px;color:var(--gold-soft);margin-top:14px;max-width:520px;font-style:italic}
.verify-page{flex:1;padding:60px 40px 100px;animation:rise .5s ease both}
.verify-inner{max-width:760px;margin:0 auto}
.verify-h{font-family:var(--serif);font-size:36px;color:var(--cream);margin:10px 0 12px}
.verify-sub{color:var(--sage);font-size:16px;line-height:1.6;max-width:620px}
.verify-search{display:flex;gap:10px;margin:26px 0;flex-wrap:wrap}
.verify-search input{flex:1;min-width:240px;padding:14px 16px;border:1px solid var(--line);border-radius:8px;background:var(--ink-2);color:var(--cream);font-size:15px}
.verify-search input:focus{outline:none;border-color:var(--green)}
.verify-results{display:flex;flex-direction:column;gap:14px;margin-top:8px}
.verify-card{background:var(--ink-2);border:1px solid var(--line-soft);border-radius:12px;padding:22px}
.verify-card-top{display:flex;justify-content:space-between;align-items:flex-start;gap:16px;margin-bottom:16px}
.verify-card-top h3{font-family:var(--serif);font-size:19px;color:var(--cream)}
.verify-facts{display:grid;grid-template-columns:repeat(3,1fr);gap:14px;border-top:1px solid var(--line-soft);padding-top:16px}
.verify-facts>div{display:flex;flex-direction:column;gap:3px}
.verify-facts span{font-size:11px;color:var(--sage-dim);text-transform:uppercase;letter-spacing:.05em}
.verify-facts strong{font-size:14px;color:var(--cream)}
.verify-empty{background:var(--ink-2);border:1px dashed var(--line);border-radius:12px;padding:26px;color:var(--sage);text-align:center}
.verify-page .link-back{display:inline-block;margin:24px 0 8px}
.calc-row{display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:14px}
.risk-list{display:flex;flex-direction:column;gap:10px;margin-top:16px}
.risk-item{display:flex;gap:12px;align-items:flex-start;background:var(--ink-2);border:1px solid var(--line-soft);border-radius:10px;padding:14px 16px}
.risk-item .chip{flex-shrink:0;text-transform:capitalize}
.risk-body strong{font-size:14px;color:var(--cream)}
.risk-body p{font-size:12.5px;color:var(--sage);margin-top:2px;line-height:1.5}
.sla-figs{display:flex;gap:24px;margin-top:6px}
.sla-figs>div{display:flex;flex-direction:column;gap:3px}
.sla-fig{font-family:var(--serif);font-size:26px;color:var(--cream);font-weight:600}
.sla-lab{font-family:var(--mono);font-size:10px;letter-spacing:.05em;text-transform:uppercase;color:var(--sage-dim)}
.side-return{margin:0 12px 10px;padding:9px 12px;background:var(--green-panel);border:1px solid var(--green);border-radius:8px;color:var(--green);font-family:var(--sans);font-size:13px;font-weight:600;cursor:pointer;text-align:left;transition:background .18s ease}
.side-return:hover{background:#e0eee4}
.rtable th{white-space:nowrap}
.kyc-check{display:flex;flex-direction:column;gap:7px;margin:14px 0}
.kyc-item{display:flex;align-items:flex-start;gap:9px;font-size:13.5px;color:var(--sage)}
.kyc-item.ok{color:var(--cream)}
.kyc-mark{flex-shrink:0;width:18px;height:18px;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;font-size:11px;background:var(--line-soft);color:var(--sage-dim)}
.kyc-item.ok .kyc-mark{background:var(--green);color:#fff}
.kyc-status{margin:10px 0 4px;padding:10px 14px;border-radius:8px;font-size:13px;font-weight:600}
.kyc-status.ok{background:var(--green-panel);color:var(--green);border:1px solid var(--green)}
.kyc-status.pending{background:#fbf3e6;color:var(--gold-soft);border:1px solid var(--gold-soft)}
.revenue-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:16px;margin-top:16px}
.revenue-card{background:var(--ink-2);border:1px solid var(--line-soft);border-radius:12px;padding:20px;display:flex;flex-direction:column;gap:6px}
.revenue-top{display:flex;justify-content:space-between;align-items:baseline;gap:10px}
.revenue-top h4{font-size:15px}
.revenue-price{font-family:var(--mono);font-size:13px;color:var(--green);white-space:nowrap}
.revenue-price em{color:var(--sage-dim);font-style:normal;font-size:11px}
.revenue-who{font-size:12px;color:var(--sage-dim);text-transform:uppercase;letter-spacing:.04em}
.revenue-body{font-size:13px;color:var(--sage);line-height:1.5;flex:1}
.revenue-accrued{font-size:12.5px;color:var(--cream);font-weight:600}
.sec-item{background:none;border:none;text-align:left;width:100%;padding:0;font:inherit;color:inherit;cursor:default}
.sec-item.clickable{cursor:pointer}
.sec-item.clickable:hover .kyc-mark{border:1px solid var(--green)}
.coop-hero{display:flex;align-items:center;gap:18px;background:var(--ink-2);border:1px solid var(--line-soft);border-radius:14px;padding:16px 20px;margin-bottom:18px}
.coop-hero-art{width:120px;height:80px;flex-shrink:0;border-radius:10px}
.coop-hero-text h3{font-size:18px;margin:0 0 4px}
.coop-hero-text p{font-size:13px;color:var(--sage);margin:0}
.chart-note{font-size:11.5px;color:var(--sage-dim);margin:8px 0 0;font-style:italic}
.doc-guide{background:var(--green-panel);border:1px solid var(--line-soft);border-radius:10px;padding:14px 16px;margin:14px 0}
.doc-guide h5{font-size:13px;margin:0 0 8px;color:var(--cream)}
.doc-guide ul{list-style:none;margin:0;padding:0;display:grid;grid-template-columns:1fr 1fr;gap:4px 16px}
.doc-guide li{font-size:12.5px;color:var(--sage);display:flex;gap:7px;align-items:baseline}
.doc-guide li.done{color:var(--green)}
.doc-guide li span{flex-shrink:0;font-weight:700}
.table-filter{display:flex;gap:10px;align-items:center;margin:0 0 14px;flex-wrap:wrap}
.table-search{flex:1;min-width:200px;padding:9px 13px;border:1px solid var(--line);border-radius:8px;background:var(--ink-2);color:var(--cream);font-size:13.5px}
.table-search:focus{outline:none;border-color:var(--green)}
.table-filter select{padding:9px 13px;border:1px solid var(--line);border-radius:8px;background:var(--ink-2);color:var(--cream);font-size:13.5px}
.table-count{font-family:var(--mono);font-size:11px;color:var(--sage-dim);white-space:nowrap}
.action-queue{background:var(--green-panel);border:1px solid var(--green);border-radius:12px;padding:16px 20px;margin-bottom:18px}
.action-queue h4{font-size:13px;margin:0 0 12px;color:var(--green);text-transform:uppercase;letter-spacing:.05em;font-family:var(--mono)}
.aq-row{display:flex;flex-wrap:wrap;gap:22px}
.aq-item{display:flex;align-items:baseline;gap:8px;min-width:0}
.aq-n{font-family:var(--serif);font-size:26px;font-weight:600;color:var(--cream);line-height:1}
.aq-lab{font-size:13px;color:var(--sage)}
.review-banner{display:flex;flex-direction:column;gap:4px;background:#fbf3e6;border:1px solid var(--gold-soft);border-left:4px solid var(--gold-soft);border-radius:10px;padding:13px 16px;margin-bottom:16px}
.review-banner strong{font-size:12px;font-family:var(--mono);letter-spacing:.06em;text-transform:uppercase;color:var(--gold-soft)}
.review-banner span{font-size:13px;color:var(--sage);line-height:1.5}
.demo-badge{align-self:flex-start;background:#fbf3e6;border:1px solid var(--gold-soft);color:var(--gold-soft);font-family:var(--mono);font-size:9.5px;letter-spacing:.08em;text-transform:uppercase;padding:3px 8px;border-radius:5px}
.chain-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(270px,1fr));gap:16px;margin-top:16px}
.chain-card{text-align:left;background:var(--ink-2);border:1px solid var(--line-soft);border-radius:12px;padding:18px;cursor:pointer;display:flex;flex-direction:column;gap:6px;transition:border-color .18s ease,transform .18s ease;font:inherit}
.chain-card:hover{border-color:var(--green);transform:translateY(-2px)}
.chain-card-top{display:flex;justify-content:space-between;align-items:flex-start;gap:10px}
.chain-card-top h4{font-size:15px;margin:0}
.chain-card-sec{font-family:var(--mono);font-size:10px;letter-spacing:.06em;text-transform:uppercase;color:var(--sage-dim);margin:0}
.chain-card-figs{display:flex;gap:14px;flex-wrap:wrap;margin-top:6px}
.chain-card-figs span{font-size:12.5px;color:var(--sage)}
.chain-card-figs strong{color:var(--cream);font-family:var(--serif);font-size:15px}
.chain-card-turn{font-size:12.5px;color:var(--green);font-weight:600;margin:4px 0 0;white-space:nowrap}
.chain-stages{display:grid;grid-template-columns:repeat(auto-fit,minmax(230px,1fr));gap:14px;margin:18px 0}
.chain-stage{background:var(--ink-2);border:1px solid var(--line-soft);border-radius:10px;padding:14px}
.chain-stage h4{font-size:12px;font-family:var(--mono);letter-spacing:.05em;text-transform:uppercase;color:var(--sage-dim);margin:0 0 10px;display:flex;justify-content:space-between;align-items:center;gap:8px}
.chain-count{background:var(--green-panel);color:var(--green);border-radius:10px;padding:1px 7px;font-size:11px}
.chain-node{display:flex;justify-content:space-between;align-items:flex-start;gap:8px;padding:8px 0;border-top:1px solid var(--line-soft)}
.chain-node:first-of-type{border-top:none}
.chain-node strong{display:block;font-size:13px;color:var(--cream)}
.chain-node span{font-size:11.5px;color:var(--sage-dim)}
.chain-node.firm strong{color:var(--gold-soft)}
.btn-disabled{background:var(--line);color:var(--sage-dim);cursor:not-allowed;border:1px solid var(--line)}
.gate-note{font-size:12.5px;color:var(--err);margin:8px 0 0;line-height:1.5}
.guarantee-status{margin-top:14px;border-top:1px solid var(--line-soft);padding-top:14px}
.gs-line{display:flex;justify-content:space-between;align-items:baseline;gap:12px}
.gs-line strong{color:var(--green);font-family:var(--serif);font-size:16px;white-space:nowrap}
.gs-request h5,.gs-approved p,.gs-pending p{margin:8px 0}
.gs-approved{background:var(--green-panel);border-radius:8px;padding:12px 14px;margin-top:10px}
.gs-pending{background:#fbf3e6;border-radius:8px;padding:12px 14px;margin-top:10px}
.gs-approved p,.gs-pending p{font-size:13px;color:var(--ink);line-height:1.5}
.req-tag.ok{background:var(--green)}
.gr-item{border-top:1px solid var(--line-soft);padding:12px 0}
.gr-item:first-of-type{border-top:none}
.gr-head{display:flex;justify-content:space-between;align-items:baseline;gap:10px}
.gr-head strong{font-size:14px;color:var(--cream)}
.gr-head span{font-size:12.5px;color:var(--sage-dim)}
.gr-sub{display:block;font-size:12px;color:var(--sage-dim);margin-top:4px}
.ai-assess{border:1px solid var(--line-soft);background:var(--ink-2);border-radius:9px;padding:12px;margin:10px 0}
.ai-assess-head{display:flex;justify-content:space-between;align-items:center;gap:10px}
.ai-tag{font-family:var(--mono);font-size:9.5px;letter-spacing:.07em;text-transform:uppercase;color:var(--plum,#7a5b8a);background:#f0eaf4;border-radius:5px;padding:3px 8px}
.ai-assess-body p{font-size:13px;color:var(--ink);line-height:1.6;margin:10px 0 4px;white-space:pre-wrap}
.ai-note{font-size:11px;color:var(--sage-dim);font-style:italic;margin:6px 0 0}
.spark-axis{display:flex;justify-content:space-between;margin-top:4px}
.spark-axis span{font-size:10.5px;color:var(--sage-dim);font-family:var(--mono)}
.accel-rating{display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin-top:6px}
.stars{letter-spacing:1px}
.star{color:var(--line);font-size:14px}
.star.on{color:var(--gold-soft)}
.accel-grade{font-size:12.5px;font-weight:600;color:var(--cream)}
.accel-sub{font-size:11.5px;color:var(--sage-dim)}
.clearance-box{border:1px solid var(--line);border-radius:10px;padding:14px 16px;margin:14px 0}
.clearance-box.req{border-color:var(--err);background:rgba(192,83,58,.05)}
.clearance-box.wait{border-color:var(--gold-soft);background:#fbf3e6}
.clearance-box.ok{border-color:var(--green);background:var(--green-panel)}
.clearance-box h5{font-size:13px;margin:0 0 6px;display:flex;align-items:center;gap:8px}
.clearance-box p{font-size:13px;color:var(--sage);line-height:1.5;margin:0 0 10px}
.req-tag{font-family:var(--mono);font-size:9px;letter-spacing:.06em;text-transform:uppercase;background:var(--err);color:#fff;border-radius:4px;padding:2px 7px}
.chain-card.static{cursor:default}
.chain-card.static:hover{border-color:var(--line-soft);transform:none}
.pub-chains{margin:44px 0 10px;text-align:left}
.pub-chains-h{font-family:var(--serif);font-size:24px;color:var(--cream);margin:0 0 8px}
.pub-chains-sub{font-size:14px;color:var(--sage);line-height:1.6;margin:0 0 6px;max-width:70ch}
.pub-stages{font-size:11.5px;color:var(--sage-dim);line-height:1.5;margin:4px 0}
.node-src{display:inline-block;margin-top:3px;font-family:var(--mono);font-size:9px;letter-spacing:.05em;text-transform:uppercase;color:var(--sage-dim);background:var(--line-soft);border-radius:4px;padding:2px 6px}
.node-src.accel{background:var(--green-panel);color:var(--green)}
.node-acts{display:flex;flex-direction:column;align-items:flex-end;gap:5px;flex-shrink:0}
.node-acts select{font-size:11px;padding:3px 6px;border:1px solid var(--line);border-radius:5px;background:var(--ink);color:var(--cream);max-width:130px}
.opp-list{display:flex;flex-direction:column;gap:8px;margin-top:14px}
.opp-row{display:flex;align-items:center;gap:12px;background:var(--ink-2);border:1px solid var(--line-soft);border-radius:9px;padding:12px 14px;cursor:pointer;text-align:left;font:inherit;transition:border-color .18s ease}
.opp-row:hover{border-color:var(--green)}
.opp-tag{flex-shrink:0;font-family:var(--mono);font-size:9.5px;letter-spacing:.05em;text-transform:uppercase;background:var(--green-panel);color:var(--green);border-radius:5px;padding:3px 7px}
.opp-tag.offtake{background:#fbf3e6;color:var(--gold-soft)}
.opp-tag.pool{background:#e8f0f4;color:var(--teal-ink,#3d7a78)}
.opp-body{flex:1;min-width:0}
.opp-body strong{display:block;font-size:13.5px;color:var(--cream);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.opp-body span{font-size:11.5px;color:var(--sage-dim)}
.opp-detail{font-size:13.5px;color:var(--sage);line-height:1.55;margin:8px 0}
.opp-meta{display:flex;gap:18px;flex-wrap:wrap;margin:10px 0}
.opp-meta span{font-size:12.5px;color:var(--sage-dim)}
.opp-meta strong{color:var(--cream)}
.opp-reply{border-top:1px solid var(--line-soft);padding:10px 0}
.opp-reply div{display:flex;justify-content:space-between;gap:10px;align-items:baseline}
.opp-reply strong{font-size:13px;color:var(--cream)}
.opp-reply span{font-size:11.5px;color:var(--sage-dim)}
.opp-reply p{font-size:13px;color:var(--sage);margin:4px 0 0;line-height:1.5}
.toast-host{position:fixed;right:20px;bottom:20px;z-index:60;display:flex;flex-direction:column;gap:10px;max-width:min(380px,calc(100vw - 40px))}
.toast{display:flex;align-items:flex-start;gap:10px;background:var(--ink-2);border:1px solid var(--line);border-left:4px solid var(--green);border-radius:10px;padding:13px 14px;box-shadow:0 8px 24px rgba(20,40,30,.16);cursor:pointer;animation:toastin .22s ease}
.toast span{flex:1;font-size:13.5px;color:var(--cream);line-height:1.45}
.toast-error{border-left-color:var(--err)}
.toast-success{border-left-color:var(--green)}
.toast-x{background:none;border:none;color:var(--sage-dim);font-size:18px;line-height:1;cursor:pointer;padding:0 2px}
.toast-x:hover{color:var(--cream)}
@keyframes toastin{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}
.modal-overlay{position:fixed;inset:0;z-index:70;background:rgba(20,35,28,.5);display:flex;align-items:center;justify-content:center;padding:20px;animation:toastin .18s ease}
.modal{background:var(--ink-2);border:1px solid var(--line);border-radius:14px;padding:24px;max-width:420px;width:100%;box-shadow:0 20px 60px rgba(20,40,30,.28)}
.modal-msg{font-size:14.5px;color:var(--cream);line-height:1.5;margin:0 0 20px}
.modal-actions{display:flex;justify-content:flex-end;gap:10px}
.btn-danger{background:var(--err);color:#fff;border:1px solid var(--err)}.btn-danger:hover{filter:brightness(1.05)}
.preview{background:var(--ink-2);border:1px solid var(--line);border-radius:14px;width:min(900px,96vw);height:min(86vh,900px);display:flex;flex-direction:column;overflow:hidden;box-shadow:0 20px 60px rgba(20,40,30,.3)}
.preview-bar{display:flex;align-items:center;justify-content:space-between;gap:14px;padding:12px 16px;border-bottom:1px solid var(--line-soft)}
.preview-bar strong{font-size:14px;color:var(--cream);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.preview-acts{display:flex;align-items:center;gap:14px;flex-shrink:0}
.preview-x{background:none;border:none;color:var(--sage);font-size:22px;line-height:1;cursor:pointer}
.preview-x:hover{color:var(--cream)}
.preview-body{flex:1;min-height:0;background:var(--ink);display:flex;align-items:center;justify-content:center}
.preview-body iframe{width:100%;height:100%;border:none;background:#fff}
.preview-body img{max-width:100%;max-height:100%;object-fit:contain}
.preview-fallback{text-align:center;padding:30px;display:flex;flex-direction:column;gap:14px;align-items:center}
.preview-fallback p{color:var(--sage);font-size:14px}
a:focus-visible,button:focus-visible,input:focus-visible,select:focus-visible,textarea:focus-visible,[tabindex]:focus-visible{outline:2px solid var(--green);outline-offset:2px;border-radius:4px}
@media(max-width:640px){.doc-guide ul{grid-template-columns:1fr}}
@media(max-width:560px){.coop-hero{flex-direction:column;text-align:center}}
.revenue-pay{display:flex;gap:8px;margin-top:6px}
.revenue-pay input{flex:1;min-width:0;padding:9px 12px;border:1px solid var(--line);border-radius:8px;background:var(--ink);color:var(--cream);font-size:13px}
.revenue-pay input:focus{outline:none;border-color:var(--green)}
.bulk-type{display:inline-flex;border:1px solid var(--line);border-radius:8px;overflow:hidden;margin-bottom:12px}
.bulk-type .seg{background:none;border:none;padding:8px 16px;font-family:var(--sans);font-size:13px;font-weight:600;color:var(--sage);cursor:pointer}
.bulk-type .seg.on{background:var(--green);color:#fff}
.bulk-actions{display:flex;align-items:center;gap:14px;margin-bottom:10px;flex-wrap:wrap}
.bulk-text{width:100%;padding:12px 14px;border:1px solid var(--line);border-radius:8px;background:var(--ink-2);color:var(--cream);font-family:var(--mono);font-size:12.5px;line-height:1.5;resize:vertical}
.bulk-text:focus{outline:none;border-color:var(--green)}
.docs-upload{display:flex;gap:10px;align-items:center;flex-wrap:wrap;margin-bottom:12px}
.docs-upload select{padding:9px 12px;border:1px solid var(--line);border-radius:8px;background:var(--ink-2);color:var(--cream);font-size:13px}
.docs-list{display:flex;flex-direction:column;gap:8px}
.doc-row{display:flex;justify-content:space-between;align-items:center;gap:14px;padding:11px 14px;background:var(--ink-2);border:1px solid var(--line-soft);border-radius:8px}
.doc-meta{display:flex;flex-direction:column;gap:2px;min-width:0}
.doc-meta strong{font-size:13.5px;color:var(--cream);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.doc-meta span{font-size:11.5px;color:var(--sage-dim);display:flex;align-items:center;gap:6px}
.doc-actions{display:flex;align-items:center;gap:12px;flex-shrink:0}
.link-inline.danger{color:var(--err)}
.muted-line.sm{font-size:11px}
.sector-pick{display:flex;flex-wrap:wrap;gap:10px;margin:16px 0}
.sector-chip{background:var(--ink-2);border:1px solid var(--line);border-radius:20px;padding:9px 16px;font-size:13px;font-weight:600;color:var(--sage);cursor:pointer;transition:all .15s ease}
.sector-chip:hover{border-color:var(--green)}
.sector-chip.on{background:var(--green);color:#fff;border-color:var(--green)}
.accel-sectors{display:flex;justify-content:space-between;align-items:center;gap:14px;flex-wrap:wrap;background:var(--green-panel);border:1px solid var(--line);border-radius:10px;padding:12px 16px;margin-bottom:18px;font-size:13.5px;color:var(--cream-ink)}
@media(max-width:640px){.verify-facts{grid-template-columns:1fr}.verify-h{font-size:28px}.verify-page{padding:40px 18px 70px}}
.side-foot{flex-shrink:0;display:flex;flex-direction:column;gap:12px;border-top:1px solid var(--line-soft);padding-top:16px;margin-top:4px}
.side-user{display:flex;align-items:center;gap:10px;min-width:0}
.side-user-text{display:flex;flex-direction:column;min-width:0}
.side-name{font-size:13.5px;font-weight:600;color:var(--cream);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.side-role{font-family:var(--mono);font-size:10px;letter-spacing:.05em;text-transform:uppercase;color:var(--sage-dim)}
.side-signout{background:none;border:1px solid var(--line);border-radius:6px;padding:9px 12px;color:var(--sage);font-family:var(--mono);font-size:11px;letter-spacing:.06em;text-transform:uppercase;cursor:pointer;transition:border-color .18s ease,color .18s ease}
.side-signout:hover{border-color:var(--err);color:var(--err)}
.shell-main{flex:1;min-width:0;padding:44px 40px 80px}
.shell-main .dash-inner{margin:0;max-width:1560px}
@media(max-width:860px){.shell{flex-direction:column}.side{width:100%;height:auto;position:sticky;top:0;z-index:30;flex-direction:row;align-items:center;gap:8px;padding:10px 14px;border-right:none;border-bottom:1px solid var(--line-soft);overflow:visible}.side-brand{display:none}.side-scroll{flex-direction:row;flex:1;min-width:0;overflow-x:auto;overflow-y:visible;gap:6px;align-items:center}.side-nav{flex-direction:row;flex:0 0 auto;gap:4px}.side-sep{display:none}.side-item{white-space:nowrap;padding:9px 12px}.side-foot{flex-direction:row;border-top:none;padding-top:0;margin-top:0;gap:8px;flex-shrink:0}.side-user{display:none}.shell-main{padding:26px 18px 70px}}
.dash-hero{display:flex;align-items:center;gap:20px;padding-bottom:30px;margin-bottom:30px;border-bottom:1px solid var(--line-soft)}
.dash-hero-text{flex:1;min-width:0}.dash-hero-text .eyebrow{margin-bottom:8px}.dash-name{font-size:clamp(26px,3.4vw,38px);line-height:1.1}.dash-meta{font-size:14px;color:var(--sage-dim);margin-top:6px}
.dash-rolebadge{font-family:var(--mono);font-size:11px;letter-spacing:.08em;text-transform:uppercase;color:var(--gold);border:1px solid var(--gold);border-radius:3px;padding:8px 14px;white-space:nowrap}
.dash-grid{display:grid;grid-template-columns:1.6fr 1fr;gap:20px;align-items:start}
.dash-card{background:var(--ink-2);border:1px solid var(--line-soft);border-radius:6px;padding:28px}.dash-card h3{font-size:18px;margin-bottom:6px}.dash-card-sub{font-size:13px;color:var(--sage-dim);line-height:1.55;margin-bottom:20px}
.caps{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:2px}.caps li{display:flex;align-items:center;gap:12px;padding:14px 0;border-bottom:1px solid var(--line-soft);color:var(--cream);font-size:15px}.caps li:last-child{border-bottom:none}.cap-tick{color:var(--gold);font-size:11px}.cap-soon{margin-left:auto;font-family:var(--mono);font-size:10px;letter-spacing:.08em;text-transform:uppercase;color:var(--sage-dim);border:1px solid var(--line-soft);padding:3px 8px;border-radius:2px}
.status-row{display:flex;align-items:center;justify-content:space-between;padding:11px 0;border-bottom:1px solid var(--line-soft);font-size:14px;color:var(--sage)}.status-row:last-child{border-bottom:none}
.pill{font-family:var(--mono);font-size:10px;letter-spacing:.06em;text-transform:uppercase;padding:4px 9px;border-radius:2px}.pill.ok{background:rgba(28,138,79,.14);color:var(--green)}.pill.muted{background:rgba(72,82,75,.10);color:var(--sage-dim)}
.dash-foot{margin-top:26px;font-size:13px;color:var(--sage-dim);line-height:1.6}
/* Stage 3 */
.ws{display:flex;flex-direction:column;gap:24px}.ws-h{font-size:18px}
.ws > .muted-line,.ws > .panel-note,.returns-box > .muted-line,.returns-box > .panel-note,.trail-box > .panel-note{max-width:95ch}
.muted-line{color:var(--sage-dim);font-size:14px;padding:8px 0}
.statgrid{display:grid;grid-template-columns:repeat(4,1fr);gap:14px}
.stat{background:var(--ink-2);border:1px solid var(--line-soft);border-radius:6px;padding:20px 18px;display:flex;flex-direction:column;gap:8px;min-width:0}
.stat-fig{font-family:var(--serif);color:var(--cream);font-size:clamp(17px,1.75vw,26px);font-weight:600;line-height:1.1;white-space:nowrap}.stat-lab{font-family:var(--mono);font-size:10px;letter-spacing:.08em;text-transform:uppercase;color:var(--sage-dim)}
.tabs{display:flex;gap:8px;flex-wrap:wrap;border-bottom:1px solid var(--line-soft);padding-bottom:0}
.tab{background:none;border:none;border-bottom:2px solid transparent;color:var(--sage);font-family:var(--sans);font-size:14px;font-weight:600;padding:10px 4px;margin-right:14px;cursor:pointer}
.tab:hover{color:var(--gold-soft)}.tab.on{color:var(--cream);border-bottom-color:var(--green)}
.rtable-wrap{overflow-x:auto;border:1px solid var(--line-soft);border-radius:6px}
.rtable{width:100%;border-collapse:collapse;min-width:640px}
.rtable th{text-align:left;font-family:var(--mono);font-size:10px;letter-spacing:.08em;text-transform:uppercase;color:var(--sage-dim);padding:14px 16px;border-bottom:1px solid var(--line-soft);font-weight:500;background:rgba(0,0,0,.14)}
.rtable td{padding:15px 16px;border-bottom:1px solid var(--line-soft);font-size:14px;color:var(--sage);vertical-align:middle}
.rtable tr:last-child td{border-bottom:none}.rtable tr:hover td{background:rgba(198,161,91,.04)}
.td-name{color:var(--cream);font-weight:500;max-width:22em}.mono{font-family:var(--mono);font-size:12px;color:var(--gold-soft)}
.btn-open{background:transparent;border:1px solid var(--line);color:var(--gold-soft);font-family:var(--mono);font-size:11px;letter-spacing:.06em;text-transform:uppercase;padding:6px 12px;border-radius:2px;cursor:pointer}.btn-open:hover{border-color:var(--gold);background:rgba(198,161,91,.08)}
.chip{font-family:var(--mono);font-size:10px;letter-spacing:.05em;padding:4px 9px;border-radius:2px;white-space:nowrap;display:inline-block}
.st-filed{background:rgba(72,82,75,.10);color:var(--sage)}.st-review{background:rgba(176,132,47,.14);color:var(--gold)}.st-approved{background:rgba(28,138,79,.14);color:var(--green)}.st-returned{background:rgba(192,83,58,.14);color:var(--err)}
.panel,.detail,.empty,.society-card,.action-box,.returns-box,.trail-box{background:var(--ink-2);border:1px solid var(--line-soft);border-radius:8px}
.panel{padding:30px;max-width:760px}
.panel-head{display:flex;align-items:center;justify-content:space-between;margin-bottom:20px}.panel-head h3{font-size:20px}
.panel-sub{color:var(--sage-dim);font-size:13px;margin:-10px 0 18px}
.link-back{background:none;border:none;color:var(--sage-dim);font-family:var(--mono);font-size:12px;letter-spacing:.05em;cursor:pointer}.link-back:hover{color:var(--gold-soft)}
.form-grid{display:grid;grid-template-columns:1fr 1fr;gap:16px}.form-grid .span2{grid-column:1 / -1}
.field textarea{resize:vertical;line-height:1.5}
.computed{background:rgba(198,161,91,.06);border:1px dashed var(--line);border-radius:4px;padding:12px 14px}.computed strong{font-family:var(--serif);color:var(--cream);font-size:20px}.computed strong.neg,.neg{color:var(--err)}
.panel-actions{margin-top:22px}.panel-note{margin-top:16px;font-size:12px;color:var(--sage-dim);line-height:1.55}
.success-panel{text-align:center;max-width:520px;margin:0 auto;padding:40px}
.success-mark{color:var(--gold);font-size:22px;display:block;margin-bottom:14px}
.success-panel h3{font-size:24px;margin-bottom:10px}.success-panel p{font-size:15px;color:var(--sage);line-height:1.6}
.tracking{display:flex;flex-direction:column;gap:6px;align-items:center;margin:22px 0;padding:18px;border:1px solid var(--line);border-radius:6px;background:rgba(198,161,91,.06)}
.tracking span{font-family:var(--mono);font-size:10px;letter-spacing:.1em;text-transform:uppercase;color:var(--sage-dim)}.tracking strong{font-family:var(--mono);font-size:20px;color:var(--gold-soft);letter-spacing:.04em}
.empty{text-align:center;padding:56px 40px;max-width:560px;margin:0 auto}.empty-mark{color:var(--gold);font-size:24px;display:block;margin-bottom:16px}.empty h3{font-size:24px;margin-bottom:12px}.empty p{font-size:15px;color:var(--sage);line-height:1.65;margin-bottom:26px;max-width:40em;margin-inline:auto}
.detail{padding:30px}
.detail-head{display:flex;align-items:flex-start;justify-content:space-between;gap:16px;margin-bottom:16px}.detail-head h3{font-size:22px}.detail-sub{font-family:var(--mono);font-size:12px;color:var(--sage-dim);margin-top:6px}
.detail-chips{display:flex;gap:8px;flex-wrap:wrap}
.detail-grid{display:grid;grid-template-columns:1fr 1fr;gap:18px;margin:24px 0;padding:22px 0;border-top:1px solid var(--line-soft);border-bottom:1px solid var(--line-soft)}
.field-ro{display:flex;flex-direction:column;gap:5px}.field-ro.span2{grid-column:1 / -1}.field-ro span{font-family:var(--mono);font-size:10px;letter-spacing:.08em;text-transform:uppercase;color:var(--sage-dim)}.field-ro strong{color:var(--cream);font-size:15px;font-weight:500}.field-ro strong.normal{font-weight:400;line-height:1.55;color:var(--sage)}
.returns-box{padding:24px;margin-bottom:22px}.returns-box h4{font-size:16px;margin-bottom:16px}
.returns-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(120px,1fr));gap:16px}
.returns-grid>div{display:flex;flex-direction:column;gap:4px}.returns-grid span{font-family:var(--mono);font-size:10px;letter-spacing:.06em;text-transform:uppercase;color:var(--sage-dim)}.returns-grid strong{color:var(--cream);font-size:16px;font-family:var(--serif)}
.returns-notes{margin-top:16px;font-size:13px;color:var(--sage);line-height:1.55}
.action-box{padding:24px;margin-bottom:22px}
.action-row{display:flex;gap:12px;flex-wrap:wrap;margin-top:14px}
.trail-box{padding:24px}.trail-box h4{font-size:16px;margin-bottom:18px}
.timeline{list-style:none;margin:0;padding:0;display:flex;flex-direction:column}
.tl-item{position:relative;padding:0 0 22px 26px;border-left:1px solid var(--line-soft)}
.tl-item:last-child{border-left-color:transparent;padding-bottom:0}
.tl-dot{position:absolute;left:-5px;top:3px;width:9px;height:9px;border-radius:50%;background:var(--gold)}
.tl-body{display:flex;flex-direction:column;gap:3px}
.tl-top{display:flex;justify-content:space-between;gap:12px;flex-wrap:wrap}.tl-action{color:var(--cream);font-size:14px;font-weight:600}.tl-time{font-family:var(--mono);font-size:11px;color:var(--sage-dim)}
.tl-by{font-size:12px;color:var(--sage-dim)}.tl-note{font-size:13px;color:var(--sage);font-style:italic;margin-top:2px}
.society-card{padding:28px}
.society-top{display:flex;justify-content:space-between;gap:16px;flex-wrap:wrap;align-items:flex-start;margin-bottom:22px}.society-top h3{font-size:22px}
.society-figs{display:flex;gap:40px;flex-wrap:wrap;padding:20px 0;border-top:1px solid var(--line-soft);border-bottom:1px solid var(--line-soft);margin-bottom:20px}
.society-figs>div{display:flex;flex-direction:column;gap:6px}.society-fig{font-family:var(--serif);color:var(--cream);font-size:24px;font-weight:600}.society-fig.sm{font-size:16px}
.society-actions{display:flex;align-items:center;gap:16px;flex-wrap:wrap}
.returned-flag{color:var(--err);font-size:13px}
.fee-banner{display:flex;align-items:center;justify-content:space-between;gap:16px;flex-wrap:wrap;background:rgba(198,161,91,.08);border:1px solid var(--line);border-radius:6px;padding:14px 18px;font-size:14px;color:var(--sage)}
.fee-banner strong{color:var(--cream)}
.qoop-profile{margin-top:16px;border-top:1px solid var(--line-soft);padding-top:14px}
.qoop-profile-lab{font-family:var(--mono);font-size:10px;letter-spacing:.08em;text-transform:uppercase;color:var(--green)}
.qoop-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:12px 16px;margin-top:12px}
.qoop-grid>div{display:flex;flex-direction:column;gap:2px}
.qoop-grid span{font-size:11px;color:var(--sage-dim)}
.qoop-grid strong{font-family:var(--mono);font-size:13px;color:var(--cream)}
.wallet{display:flex;flex-direction:column;gap:16px}
.wallet-top{display:flex;align-items:flex-start;justify-content:space-between;gap:16px}
.wallet-lab{display:block;font-family:var(--mono);font-size:10px;letter-spacing:.08em;text-transform:uppercase;color:var(--sage-dim)}
.wallet-bal{display:block;font-family:var(--serif);font-size:34px;font-weight:600;color:var(--cream);margin-top:4px}
.wallet-chip{font-family:var(--mono);font-size:10px;letter-spacing:.06em;text-transform:uppercase;color:var(--green);background:rgba(28,138,79,.12);padding:4px 8px;border-radius:2px;white-space:nowrap;height:fit-content}
.wallet-actions{display:flex;gap:10px;flex-wrap:wrap;align-items:center}
.wallet-actions input{background:var(--ink);border:1px solid var(--line);border-radius:5px;padding:10px 12px;color:var(--cream);font-size:14px;max-width:170px}
.wallet-actions input:focus{outline:none;border-color:var(--green)}
.wallet-h{font-size:13px;margin-top:2px}
.txns{display:flex;flex-direction:column}
.txn{display:grid;grid-template-columns:120px 1fr auto;gap:12px;align-items:center;padding:10px 0;border-bottom:1px solid var(--line-soft);font-size:13px}
.txn:last-child{border-bottom:none}
.txn-dir{font-family:var(--mono);font-weight:600}.txn-dir.in{color:var(--green)}.txn-dir.out{color:var(--err)}
.txn-mid{color:var(--sage)}.txn-mid strong{color:var(--cream);font-weight:600}
.txn-at{font-family:var(--mono);font-size:11px;color:var(--sage-dim);white-space:nowrap}
.esusu-next{display:flex;align-items:center;gap:14px;flex-wrap:wrap;background:var(--ink);border:1px solid var(--line-soft);border-radius:8px;padding:14px 16px}
.esusu-next>span{font-size:13px;color:var(--sage-dim)}.esusu-next strong{color:var(--cream);font-family:var(--serif);font-size:16px;margin-right:auto}
.dash-hero-right{display:flex;align-items:center;gap:14px;margin-left:auto}
.help-btn{background:var(--ink-2);border:1px solid var(--line);border-radius:6px;padding:9px 15px;font-family:var(--sans);font-size:13px;font-weight:600;color:var(--green);cursor:pointer;transition:border-color .2s ease,background .2s ease}
.help-btn:hover,.help-btn.on{border-color:var(--green);background:rgba(28,138,79,.06)}
.concierge{background:var(--ink-2);border:1px solid var(--line-soft);border-radius:10px;padding:20px}
.concierge-row{display:flex;gap:10px;flex-wrap:wrap}
.concierge-row input{flex:1;min-width:240px;background:var(--ink);border:1px solid var(--line);border-radius:6px;padding:12px 14px;color:var(--cream);font-size:14px}
.concierge-row input:focus{outline:none;border-color:var(--green)}
.concierge-ans{margin-top:14px;padding:14px 16px;background:rgba(28,138,79,.06);border:1px solid var(--line-soft);border-radius:8px;font-size:14px;line-height:1.6;color:var(--sage)}
.support-cta{display:flex;align-items:center;justify-content:space-between;gap:16px;flex-wrap:wrap;background:var(--ink-2);border:1px solid var(--line-soft);border-radius:8px;padding:16px 18px;font-size:14px;color:var(--sage)}
.thread{display:flex;flex-direction:column;gap:12px;margin:20px 0}
.msg{background:var(--ink-2);border:1px solid var(--line-soft);border-radius:10px;padding:14px 16px;max-width:80%}
.msg.staff{align-self:flex-end;background:rgba(28,138,79,.06);border-color:rgba(28,138,79,.2)}
.msg-head{display:flex;align-items:baseline;gap:10px;margin-bottom:6px}.msg-head strong{font-size:13.5px;color:var(--cream)}.msg-head span{font-family:var(--mono);font-size:10px;color:var(--sage-dim)}
.msg p{font-size:14px;line-height:1.6;color:var(--sage)}
.src-badge{font-family:var(--mono);font-size:9px;letter-spacing:.08em;padding:2px 6px;border-radius:2px;margin-left:8px;vertical-align:middle;text-transform:uppercase}
.src-sekat{background:rgba(90,140,200,.16);color:#2E5C88}.src-mccti{background:rgba(198,161,91,.14);color:var(--gold-soft)}
.ro-note{background:rgba(90,140,200,.08);border:1px solid rgba(90,140,200,.28);color:#2E5C88;border-radius:6px;padding:16px 18px;font-size:13px;line-height:1.55;margin-bottom:22px}
.sekat{background:var(--ink-2);border:1px solid var(--line-soft);border-radius:8px;padding:28px;display:flex;flex-direction:column;gap:20px;max-width:660px}
.sekat-flow{display:flex;align-items:center;gap:16px;flex-wrap:wrap}
.node{flex:1;min-width:150px;background:var(--ink);border:1px solid var(--line-soft);border-radius:6px;padding:18px;display:flex;flex-direction:column;gap:6px;font-family:var(--serif);font-weight:600;font-size:16px;color:var(--cream)}
.node span{font-family:var(--sans);font-weight:400;font-size:12px;color:var(--sage-dim)}
.node.src{border-color:rgba(90,140,200,.4)}.node.dst{border-color:var(--line)}
.flow-arrow{display:flex;flex-direction:column;align-items:center;color:var(--gold);font-size:22px}.flow-arrow span{font-family:var(--mono);font-size:9px;letter-spacing:.1em;text-transform:uppercase;color:var(--sage-dim)}
.sekat-status{border-top:1px solid var(--line-soft);border-bottom:1px solid var(--line-soft);padding:6px 0}
.comp-analysis{margin-top:16px;display:flex;flex-direction:column;gap:8px}.ca-lab{font-family:var(--mono);font-size:10px;letter-spacing:.06em;text-transform:uppercase;color:var(--sage-dim)}
.ca-rows{display:flex;gap:18px;flex-wrap:wrap}.ca-row{font-size:13px;color:var(--sage)}.ca-row strong{color:var(--cream);font-family:var(--serif)}
.foot{border-top:1px solid var(--line-soft);background:var(--ink-2)}
.foot-top{max-width:1200px;margin:0 auto;padding:34px 40px;display:flex;align-items:center;justify-content:space-between;gap:24px;border-bottom:1px solid var(--line-soft);flex-wrap:wrap}
.foot-lockup{display:flex;align-items:center;gap:14px}.foot-lockup img{height:44px;width:auto}.foot-mccti{height:40px !important}
.foot-lockup-text{display:flex;flex-direction:column;line-height:1.3}.foot-lockup-text .lh-gov{color:var(--cream)}.foot-lockup-text .lh-min{color:var(--sage-dim)}
.foot-grid{max-width:1200px;margin:0 auto;padding:28px 40px 46px;display:grid;grid-template-columns:1.4fr 1fr;gap:30px}.foot-grid p{font-size:13px;line-height:1.6;color:var(--sage-dim)}.foot-conf{font-family:var(--mono);font-size:11px;letter-spacing:.04em}
.link-inline{background:none;border:none;color:var(--gold-soft);cursor:pointer;font-size:inherit;font-family:inherit;padding:0;text-decoration:underline}
.link-inline:hover{color:var(--gold)}
.node.qoop.src{border-color:rgba(230,120,60,.45)}
.consent-check{display:flex;gap:10px;align-items:flex-start;font-size:12.5px;color:var(--sage);line-height:1.5;margin-top:4px}
.consent-check input{margin-top:2px;accent-color:var(--gold);width:16px;height:16px;flex-shrink:0}
.consent{position:fixed;left:0;right:0;bottom:0;z-index:50;background:var(--ink-2);border-top:1px solid var(--line);display:flex;align-items:center;justify-content:space-between;gap:20px;padding:16px 40px;flex-wrap:wrap}
.consent p{font-size:13px;color:var(--sage);line-height:1.5;max-width:64em}
.consent-actions{display:flex;align-items:center;gap:16px}
.privacy{display:flex;flex-direction:column;gap:20px;max-width:44em}
.privacy-row{border-left:2px solid var(--line);padding-left:18px}
.privacy-row h4{font-size:16px;margin-bottom:6px}.privacy-row p{font-size:14px;line-height:1.6;color:var(--sage)}
.data-controls .dc-actions{display:flex;gap:12px;flex-wrap:wrap;align-items:center;margin-bottom:14px}
.dc-confirm{display:flex;align-items:center;gap:12px;font-size:13px;color:var(--err);flex-wrap:wrap}
.viewas-banner{display:flex;align-items:center;justify-content:space-between;gap:16px;background:rgba(90,140,200,.1);border:1px solid rgba(90,140,200,.3);color:#2E5C88;border-radius:6px;padding:12px 18px;margin-bottom:22px;font-size:14px}
.score-card{display:flex;flex-direction:column;gap:20px}
.score-head{display:flex;align-items:center;justify-content:space-between;gap:20px;flex-wrap:wrap}
.score-num{display:flex;align-items:baseline;gap:8px}
.score-val{font-family:var(--serif);color:var(--cream);font-size:56px;font-weight:600;line-height:1}
.score-scale{font-family:var(--mono);font-size:13px;color:var(--sage-dim)}
.score-meta{display:flex;flex-direction:column;gap:8px;align-items:flex-end}
.score-cap{font-size:13px;color:var(--sage)}.score-cap strong{color:var(--cream)}
.score-factors{display:flex;flex-direction:column;gap:12px}
.sf{display:flex;flex-direction:column;gap:6px}
.sf-top{display:flex;justify-content:space-between;font-size:13px;color:var(--sage)}.sf-val{color:var(--cream);font-family:var(--mono);font-size:12px}
.sf-bar{height:6px;background:var(--line-soft);border-radius:3px;overflow:hidden}.sf-bar span{display:block;height:100%;background:var(--gold);border-radius:3px}
.band-dist{display:flex;gap:12px;flex-wrap:wrap}
.bd{display:flex;align-items:center;gap:8px;background:var(--ink-2);border:1px solid var(--line-soft);border-radius:6px;padding:12px 16px}.bd-n{font-family:var(--serif);color:var(--cream);font-size:18px;font-weight:600}
.viewas{display:flex;flex-direction:column;gap:20px}
.viewas-search{background:var(--ink-2);border:1px solid var(--line-soft);border-radius:4px;padding:12px 14px;color:var(--cream);font-size:14px;max-width:420px}
.viewas-search:focus{outline:none;border-color:var(--gold)}
.viewas-cols{display:grid;grid-template-columns:1fr 1fr;gap:24px}
.viewas-list{display:flex;flex-direction:column;gap:8px}
.viewas-item{display:flex;align-items:center;justify-content:space-between;gap:12px;background:var(--ink-2);border:1px solid var(--line-soft);border-radius:5px;padding:14px 16px;cursor:pointer;color:var(--cream);font-size:14px;text-align:left;transition:border-color .15s ease}
.viewas-item:hover{border-color:var(--gold)}.va-go{font-family:var(--mono);font-size:11px;color:var(--gold);letter-spacing:.04em;white-space:nowrap}
@keyframes rise{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:none}}
.analytics{display:flex;flex-direction:column;gap:22px}
.switcher{display:flex;align-items:center;gap:14px;flex-wrap:wrap;background:var(--ink-2);border:1px solid var(--line);border-radius:8px;padding:14px 18px}
.switcher-lab{font-family:var(--mono);font-size:11px;letter-spacing:.06em;text-transform:uppercase;color:var(--sage-dim)}
.switcher-sel{flex:1;min-width:240px;background:var(--ink);border:1px solid var(--line);border-radius:5px;padding:11px 12px;color:var(--cream);font-size:14px;font-family:var(--sans);cursor:pointer}
.switcher-sel:focus{outline:none;border-color:var(--green)}
.kpi-row{display:grid;grid-template-columns:repeat(auto-fit,minmax(185px,1fr));gap:14px}
.kpi{background:var(--ink-2);border:1px solid var(--line-soft);border-radius:8px;padding:20px;min-width:0}
.kpi-fig{display:block;font-family:var(--serif);color:var(--cream);font-size:clamp(15px,1.4vw,20px);font-weight:600;line-height:1.15;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.kpi-lab{display:block;margin-top:6px;font-family:var(--mono);font-size:10px;letter-spacing:.08em;text-transform:uppercase;color:var(--sage-dim)}
.chart-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:14px}
.chart-card{background:var(--ink-2);border:1px solid var(--line-soft);border-radius:8px;padding:20px 22px;display:flex;flex-direction:column;gap:16px;min-width:0}
.chart-card.wide{grid-column:span 2}
.chart-card h4{font-size:14px;color:var(--cream)}
.donut-wrap{display:flex;align-items:center;gap:20px;flex-wrap:wrap}
.donut{flex-shrink:0}
.donut-c1{fill:var(--cream);font-family:var(--serif);font-size:26px;font-weight:600}
.donut-c2{fill:var(--sage-dim);font-family:var(--mono);font-size:9px;letter-spacing:.08em;text-transform:uppercase}
.legend{display:flex;flex-direction:column;gap:7px;min-width:0}
.lg{display:flex;align-items:center;gap:8px;font-size:12.5px;color:var(--sage)}
.lg-dot{width:9px;height:9px;border-radius:2px;flex-shrink:0}
.lg b{margin-left:auto;color:var(--cream);font-family:var(--mono);font-size:12px;padding-left:14px}
.bars{display:flex;flex-direction:column;gap:11px}
.bar-row{display:grid;grid-template-columns:130px 1fr auto;align-items:center;gap:12px}
.bar-lab{font-size:12.5px;color:var(--sage);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.bar-track{height:9px;background:var(--line-soft);border-radius:5px;overflow:hidden}
.bar-fill{display:block;height:100%;border-radius:5px}
.bar-val{font-family:var(--mono);font-size:12px;color:var(--cream);white-space:nowrap}
.miniarea{width:100%;height:90px;display:block}
.trend-x{display:flex;justify-content:space-between;font-family:var(--mono);font-size:10px;color:var(--sage-dim);margin-top:2px}@keyframes draw{to{transform:scaleX(1)}}@keyframes fadeIn{from{opacity:0}to{opacity:1}}@keyframes pulse{0%,100%{opacity:1}50%{opacity:.3}}
@media(max-width:960px){.hero{grid-template-columns:1fr;padding-top:52px}.hero-watermark{display:none}.mod-grid{grid-template-columns:1fr 1fr}.persona-grid{grid-template-columns:1fr 1fr}.arc-steps{grid-template-columns:1fr}.arc-arrow{transform:rotate(90deg);justify-content:center;padding:2px 0}.foot-grid{grid-template-columns:1fr}.role-page-grid{grid-template-columns:1fr 1fr}.dash-grid{grid-template-columns:1fr}.statgrid{grid-template-columns:1fr 1fr}.viewas-cols{grid-template-columns:1fr}.kpi-row{grid-template-columns:1fr 1fr}.chart-grid{grid-template-columns:1fr}.chart-card.wide{grid-column:span 1}.bar-row{grid-template-columns:96px 1fr auto}}
@media(max-width:680px){.letterhead{padding:9px 18px;gap:12px}.lh-min{display:none}.lh-seal{height:34px}.lh-mccti{height:32px}.nav{padding:11px 18px;flex-wrap:wrap}.nav-links{display:flex;order:3;width:100%;overflow-x:auto;white-space:nowrap;gap:20px;padding:8px 0 2px;margin-top:6px;border-top:1px solid var(--line-soft);-webkit-overflow-scrolling:touch}.nav-page,.nav-verify,.lang-select{flex:0 0 auto}.hero{padding:40px 18px 30px}section.lens,section.modules,section.arc,section.personas,section.quote,section.leaders,section.about,section.pricing{padding:56px 18px}.band{padding:22px 18px;gap:18px 26px}.mod-grid,.persona-grid,.leader-grid,.price-grid{grid-template-columns:1fr}.lens-figs{gap:26px}.flow{padding:40px 18px 70px}.role-page-grid{grid-template-columns:1fr}.dash{padding:36px 18px 70px}.dash-hero{flex-wrap:wrap}.foot-top,.foot-grid{padding-left:18px;padding-right:18px}.acct-name{display:none}.form-grid{grid-template-columns:1fr}.detail-grid{grid-template-columns:1fr}.consent{padding:14px 18px}}
@media(prefers-reduced-motion:reduce){*{animation:none !important;transition:none !important}.underline::after{transform:scaleX(1)}}
`

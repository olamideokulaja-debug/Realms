import React, { useEffect, useRef, useState } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { supabase, MODE } from './supabaseClient.js'
import { facilities as FAC, assignments as ASG, visits as VIS, notifications as NOTIF, calls as CALLS, access as ACC, facilitiesFromCSV, orderRoute, googleMapsDirUrl, geocode, uploadEvidence, sendNotify, askAI, seedSampleData, clearAllData } from './data.js'

const BUILD = 'field-2026-07-14x'

/*
  REALMS FIELD — Stages 1 to 3 (single-file App.jsx + supabaseClient.js + data.js)
  Stage 1: tabbed public site. Stage 2: auth, role picker, dashboard.
  Stage 3 (Map): facilities with area clustering, CSV import, Leaflet map,
  nearest-neighbour route ordering, hand-off to Google Maps, Team Leader assignment.
  Runs in demo mode (browser storage) until Supabase keys are set.
*/

const SITE_TABS = [
  { id: 'home', label: 'Home' }, { id: 'services', label: 'Services' },
  { id: 'monitoring', label: 'Facility Monitoring & Accreditation' }, { id: 'about', label: 'About' },
  { id: 'leadership', label: 'Leadership & Staff' }, { id: 'contact', label: 'Contact' }
]

const STAGES = [
  { n: '01', t: 'Map', d: 'We obtain the assigned facility list, cluster locations by area and plan the most efficient route, cutting travel time and cost while covering more ground each day.' },
  { n: '02', t: 'Engage', d: 'On arrival our team leader introduces the monitoring team, presents official identification and the monitoring letter, and establishes a cordial, respectful atmosphere.' },
  { n: '03', t: 'Monitor', d: 'We assess each facility against the approved HEFAMAA checklist, verifying conditions on the ground and documenting findings with evidence, immediately.' },
  { n: '04', t: 'Debrief', d: 'We give the proprietor a balanced summary: strengths acknowledged, gaps explained, corrective actions set with a clear timeline, and next steps confirmed.' }
]

const PILLARS = [
  { t: 'Facility monitoring', d: 'Routine, structured field monitoring of public and private health facilities against HEFAMAA standards, covering infrastructure, staffing, equipment, records, licensing and service alignment, with evidence captured and every finding graded.' },
  { t: 'Accreditation support', d: 'Practical guidance that helps facilities meet and maintain the standards required for HEFAMAA licensing, translating regulatory requirements into a clear path to compliance.' },
  { t: 'Quality assurance', d: 'Ongoing assessment that keeps standards high after the first visit, tracking corrective actions, scheduling re-inspections and measuring improvement over time.' },
  { t: 'Training & consulting', d: 'Educational engagement for facility teams and advisory support for regulators and operators, building the knowledge that prevents non-compliance before it happens.' }
]

const COVERAGE = [ { label: 'Facilities monitored' }, { label: 'Areas & LGAs covered' }, { label: 'Monitoring visits completed' }, { label: 'Corrective actions to closure' } ]

const PRINCIPLES = [
  { t: 'Professional in approach', d: 'Structured planning, official identification and a courteous, consistent process on every engagement.' },
  { t: 'Educational in engagement', d: 'We explain findings, their implications and the route to compliance, so partners and facilities improve.' },
  { t: 'Firm in enforcement', d: 'Evidence-based assessment and clear corrective guidance that protect the people these facilities serve.' }
]

// Genesys = GeneSys Health Information Systems Limited (RHSC's EMR platform)
const GENESYS_URL = 'https://www.genesys-health.com/'

const SERVICES = [
  { t: 'Strategy & advisory', d: 'Growth, market-entry and operational strategy for health providers, investors and government, grounded in evidence and delivered to implementation.', img: '/photos/g-boardroom.jpg' },
  { t: 'Quality & accreditation', d: 'Readiness assessments and hands-on support that help facilities meet and hold the standards required for licensing and accreditation.', img: '/photos/g-corridor.jpg?v=4' },
  { t: 'Facility Monitoring & Accreditation', d: 'As a licensed HEFAMAA monitoring operator, we carry out routine, evidence-based monitoring of health facilities across Lagos State.', img: '/photos/team.jpg', to: 'monitoring' },
  { t: 'Training & capacity building', d: 'Practical training and mentoring for facility teams, regulators and operators, building the knowledge that prevents non-compliance.', img: '/photos/meeting.jpg' },
  { t: 'Health financing', d: 'Advisory on health financing, insurance design and sustainable funding models for providers, programmes and the public sector.', img: '/photos/g-handshake.jpg?v=4' },
  { t: 'Digital health & technology', d: 'Digital transformation for healthcare, powered by Genesys, our own Electronic Medical Records (EMR) platform, from patient records to real-time monitoring.', img: '/photos/g-health.jpg', href: GENESYS_URL }
]

const IMPACT_STATS = [ { v: '25+', l: 'Years of experience' }, { v: '1000+', l: 'Facilities monitored' }, { v: '20+', l: 'Projects delivered' } ]
const PARTNERS = ['Vatebra Limited', 'Lagos State Ministry of Health', 'HEFAMAA']
const CONTACT = {
  email: 'info@realmsconsulting.com', phone: '[Imade Forte phone]', whatsapp: '',
  address: '21 Fatai Arobieke Street, off Admiralty Way, Lekki Phase 1, Lagos',
  hours: 'Monday to Friday, 9am to 5pm'
}
function isPlaceholder(v) { return !v || /^\[/.test(v) }
function getSettings() { try { const s = JSON.parse(localStorage.getItem('realms_settings') || '{}'); if (!s.cs_email) s.cs_email = CONTACT.email; return s } catch (e) { return { cs_email: CONTACT.email } } }
function saveSettings(s) { try { localStorage.setItem('realms_settings', JSON.stringify(s)) } catch (e) {} }
const ICONS = {
  mail: 'M3 5h18v14H3zM3 6l9 7 9-7',
  phone: 'M4 4h5l2 5-3 2a12 12 0 006 6l2-3 5 2v5a2 2 0 01-2 2A16 16 0 014 6a2 2 0 012-2',
  chat: 'M4 4h16v11H8l-4 4z',
  pin: 'M12 22s7-6.2 7-12a7 7 0 10-14 0c0 5.8 7 12 7 12zM12 10a2.5 2.5 0 100-5 2.5 2.5 0 000 5z',
  clock: 'M12 22a10 10 0 100-20 10 10 0 000 20zM12 7v5l3 2',
  lock: 'M6 11h12v10H6zM9 11V7a3 3 0 016 0v4'
}
function Ico({ name, size = 18 }) { return (<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={ICONS[name]} /></svg>) }

/* ---------- reusable AI action button ---------- */
function AIButton({ label, busyLabel, build, onText, className }) {
  const [busy, setBusy] = useState(false)
  async function go() {
    setBusy(true)
    try {
      const b = await build()
      const r = await askAI(b)
      if (!r.ok) { toast(r.reason === 'ai_not_configured' ? 'AI is not set up yet. Add ANTHROPIC_API_KEY in Vercel to enable it.' : 'The assistant could not respond. Please try again.', 'warn'); return }
      onText(r.text || '')
    } catch (e) { toast('The assistant could not respond.', 'warn') } finally { setBusy(false) }
  }
  return <button type="button" className={(className || 'btn ghost') + ' ai-btn'} onClick={go} disabled={busy}><span className="ai-spark" aria-hidden="true">✦</span>{busy ? (busyLabel || 'Thinking\u2026') : label}</button>
}

/* ---------- global toasts + confirm ---------- */
const uiListeners = new Set()
function toast(message, kind = 'ok') { uiListeners.forEach(l => l({ t: 'toast', message, kind })) }
function confirmAction(message, opts = {}) {
  if (!uiListeners.size) { try { return Promise.resolve(window.confirm(((opts.title ? opts.title + '\n\n' : '') + message))) } catch (e) { return Promise.resolve(false) } }
  return new Promise(res => { let done = false; const resolve = v => { if (!done) { done = true; res(v) } }; uiListeners.forEach(l => l({ t: 'confirm', message, opts, resolve })) })
}
function Overlays() {
  const [toasts, setToasts] = useState([])
  const [confirm, setConfirm] = useState(null)
  useEffect(() => {
    const l = (e) => {
      if (e.t === 'toast') { const id = Math.random().toString(36).slice(2); setToasts(ts => ts.concat([{ id, message: e.message, kind: e.kind }])); setTimeout(() => setToasts(ts => ts.filter(x => x.id !== id)), 3400) }
      else if (e.t === 'confirm') setConfirm(e)
    }
    uiListeners.add(l); return () => { uiListeners.delete(l) }
  }, [])
  return (<>
    <div className="toaster" aria-live="polite">{toasts.map(t => (<div key={t.id} className={'toast ' + t.kind}>{t.message}</div>))}</div>
    {confirm && (<div className="modal-scrim" onClick={() => { confirm.resolve(false); setConfirm(null) }}>
      <div className="modal anim" onClick={e => e.stopPropagation()} role="dialog" aria-modal="true">
        <h3>{confirm.opts.title || 'Please confirm'}</h3>
        <p>{confirm.message}</p>
        <div className="modal-actions">
          <button className="btn ghost" onClick={() => { confirm.resolve(false); setConfirm(null) }}>{confirm.opts.cancel || 'Cancel'}</button>
          <button className={'btn ' + (confirm.opts.danger ? 'danger' : 'primary')} onClick={() => { confirm.resolve(true); setConfirm(null) }}>{confirm.opts.ok || 'Confirm'}</button>
        </div>
      </div>
    </div>)}
  </>)
}
const LEADERS = [
  { name: 'Dr. Olamide Okulaja', role: 'Founder & Executive Chairman', photo: '/photos/olamide.jpg', bio: 'A healthcare systems leader whose expertise in systems reform, policy and strategic leadership guides RHSC. His career spans healthcare financing, policy and advocacy, with senior roles at PharmAccess Foundation, the International Finance Corporation (World Bank Group) and the Lagos State Ministry of Health, where he led major universal health coverage and diagnostics initiatives.' },
  { name: 'Ms. Jennifer Kaja', role: 'Managing Director', photo: '/photos/jennifer.jpg', bio: 'A distinguished Nigerian lawyer with first-class honours from the University of Wales and a decade of practice across corporate, commercial and real estate law. As Chief Legal Officer of Periwinkle Empire she oversaw landmark transactions, governance and compliance.' }
]
const STAFF = [
  {
    name: 'Rev. Dr Solomon Chidiebere Nweke', role: 'Team Lead', unit: 'Field Monitoring Team',
    purpose: 'Plans, coordinates, supervises and leads daily monitoring across assigned Lagos State health facilities, ensuring field operations meet HEFAMAA standards and advance quality, patient safety and regulatory compliance.',
    duties: ['Pre-field planning, route planning and team briefing', 'Leadership, supervision and team safety in the field', 'Official representation and stakeholder engagement with HEFAMAA', 'Supervises checklist-based inspections and photographic evidence', 'Documentation, quality assurance and confidentiality', 'Exit debriefs, corrective actions and next regulatory steps', 'Reporting, escalation of critical findings and record-keeping', 'Professional ethics, integrity and accountability']
  },
  {
    name: 'Ojuma Joy', role: 'Registered Nurse, Monitoring Officer', unit: 'Field Monitoring Team',
    purpose: 'Supports routine facility assessment across allocated local government areas, combining accurate field documentation with professional nursing oversight and regulatory guidance.',
    duties: ['Facility mapping and route planning with Google Maps', 'Documents staffing, duty rosters, equipment, wards, beds and services', 'Facility debriefing and practical corrective guidance', 'Assesses nursing quality, uniforms, practising licences and staffing', 'Daily reporting and data entry into approved templates', 'Geographic data management for coverage planning']
  },
  {
    name: 'Anele Goodnews', role: 'Medical Laboratory Scientist, Monitoring Agent', unit: 'Field Monitoring Team',
    purpose: 'Evaluates laboratory services, personnel, infrastructure, documentation and biosafety practices during routine monitoring, ensuring findings are objective and aligned with HEFAMAA requirements.',
    duties: ['Assesses medical laboratory services against licensed scope', 'Verifies laboratory personnel qualifications and licences', 'Inspects equipment, infrastructure and infection control', 'Reviews test registers, QC records and reagent inventories', 'Evaluates biosafety, PPE and specimen handling', 'Documents findings on the HEFAMAA checklist', 'Debriefs facilities and compiles reports in Word and Excel']
  },
  {
    name: 'Registered Nurse, Monitoring Officer', role: 'Role profile', unit: 'Iyana-Ipaja & Ifako-Ijaiye Monitoring Areas', roleOnly: true,
    purpose: 'Supports HEFAMAA-aligned facility monitoring across Iyana-Ipaja and Ifako-Ijaiye, promoting safe, compliant and high-quality healthcare delivery.',
    duties: ['Monitoring planning, scheduling and efficient daily routes', 'Facility mapping and routine inspections to HEFAMAA requirements', 'Daily monitoring reports and team updates', 'Compliance assessment: closure notices and reports of findings', 'Stakeholder engagement, commendation and corrective recommendations', 'Clinical quality, infection prevention, medication safety and records', 'Promotes the Genesys Electronic Medical Records system', 'Monthly OKRs and performance management']
  }
]
const INSIGHTS = [
  { tag: 'Article', title: '[Thought-leadership article title]', blurb: '[One-line summary of the piece.]', date: '2026' },
  { tag: 'News', title: '[Company update or milestone]', blurb: '[One-line summary.]', date: '2026' },
  { tag: 'Report', title: '[Whitepaper or report title]', blurb: '[One-line summary.]', date: '2026' }
]
const TESTIMONIALS = [
  { quote: '[Add a short client testimonial here.]', who: '[Client name, organisation]' },
  { quote: '[Add a second client testimonial here.]', who: '[Client name, organisation]' }
]
const CASE_STUDIES = [
  { title: '[Case study title]', d: '[What we did and the measurable outcome, in two lines.]' },
  { title: '[Case study title]', d: '[What we did and the outcome.]' }
]
const CERTS = ['[Certification]', '[Partner]', '[Membership]', '[Award]']

// Multi-language for the public site. Yoruba, Hausa and Igbo are first-draft
// and should be reviewed by native speakers before the final launch.
const LANGS = [{ code: 'en', label: 'English' }, { code: 'yo', label: 'Yorùbá' }, { code: 'pcm', label: 'Pidgin' }, { code: 'ha', label: 'Hausa' }, { code: 'ig', label: 'Igbo' }]
const TR = {
  nav_home: { en: 'Home', yo: 'Ilé', pcm: 'Home', ha: 'Gida', ig: 'Ụlọ' },
  nav_services: { en: 'Services', yo: 'Iṣẹ́', pcm: 'Services', ha: 'Ayyuka', ig: 'Ọrụ' },
  nav_monitoring: { en: 'Facility Monitoring & Accreditation', yo: 'Ìbójútó Ilé-ìwòsàn', pcm: 'Facility Monitoring', ha: 'Sa Ido da Amincewa', ig: 'Nlekọta Ụlọ Ọgwụ' },
  nav_about: { en: 'About', yo: 'Nípa Wa', pcm: 'About', ha: 'Game da Mu', ig: 'Banyere Anyị' },
  nav_leadership: { en: 'Leadership & Staff', yo: 'Àwọn Aṣáájú', pcm: 'Our Team', ha: 'Shugabanni', ig: 'Ndị Isi' },
  nav_insights: { en: 'Insights', yo: 'Ìjìnlẹ̀', pcm: 'Insights', ha: 'Bayanai', ig: 'Nghọta' },
  nav_contact: { en: 'Contact', yo: 'Kàn Sí Wa', pcm: 'Contact', ha: 'Tuntuɓe Mu', ig: 'Kpọtụrụ Anyị' },
  hero_title: { en: 'Raising the standard of healthcare', yo: 'Gbígbé ìlera ga sí ìpele tí ó yẹ', pcm: 'We dey raise di standard of healthcare', ha: 'Ɗaga matsayin kiwon lafiya', ig: 'Ibulite ọkọlọtọ nlekọta ahụike' },
  hero_lede: { en: 'A full-service healthcare consulting firm, from strategy, quality and financing to training, digital health and regulatory monitoring.', yo: 'Ilé-iṣẹ́ ìmọ̀ràn ìlera pípé, láti ìlànà, ìdánilójú àti ìnáwó, dé ìdánilẹ́kọ̀ọ́, ìlera oní-nọ́mbà àti ìbójútó.', pcm: 'Na full healthcare consulting company, from strategy, quality and money matter, to training, digital health and monitoring.', ha: 'Cikakken kamfanin ba da shawara kan kiwon lafiya, daga dabaru, inganci da kuɗaɗe, zuwa horo, lafiyar dijital da sa ido.', ig: 'Ụlọ ọrụ ndụmọdụ ahụike zuru ezu, site na atụmatụ, ịdị mma na ego, ruo ọzụzụ, ahụike dijitalụ na nlekọta.' },
  cta_consult: { en: 'Book a consultation', yo: 'Ṣe ìpàdé ìmọ̀ràn', pcm: 'Book consultation', ha: 'Yi rijistar shawara', ig: 'Debe oge ndụmọdụ' },
  cta_services: { en: 'Explore our services', yo: 'Wo àwọn iṣẹ́ wa', pcm: 'See our services', ha: 'Duba ayyukanmu', ig: 'Chọpụta ọrụ anyị' },
  cta_proposal: { en: 'Request a proposal', yo: 'Béèrè fún àbá', pcm: 'Request proposal', ha: 'Nemi shawara', ig: 'Rịọ atụmatụ' },
  cta_signin: { en: 'Staff sign-in', yo: 'Wọlé oṣiṣẹ́', pcm: 'Staff sign-in', ha: 'Shiga ma’aikata', ig: 'Ọrụ banye' },
  tagline: { en: 'Professional. Educational. Enforcement-driven.', yo: 'Ọjọ̀gbọ́n. Ẹ̀kọ́. Ìmúṣẹ.', pcm: 'Professional. Educational. Enforcement.', ha: 'Ƙwararru. Ilimi. Aiwatarwa.', ig: 'Ọkachamara. Mmụta. Mmezu.' }
}
function makeT(lang) { return (key) => (TR[key] && (TR[key][lang] || TR[key].en)) || key }

const ROLES = [
  { id: 'team_leader', label: 'Team Leader', blurb: 'Assign facilities, plan routes and review your team\u2019s visits.', icon: IconLeader,
    tools: [ ['Assign & route facilities', 'Stage 3', 'assign'], ['Review team visits', 'Stage 6', 'reports'] ] },
  { id: 'field_monitor', label: 'Field Monitor', blurb: 'Run visits end to end: map, engage, monitor and debrief.', icon: IconMonitor,
    tools: [ ['Map & route', 'Stage 3', 'map'], ['Engage check-in', 'Stage 4', 'engage'], ['Monitor checklist', 'Stage 5', 'monitor'], ['Debrief & sign-off', 'Stage 6', 'debrief'] ] },
  { id: 'rhsc_hq', label: 'RHSC HQ', blurb: 'Oversight, facility data, exports and analytics.', icon: IconHQ,
    tools: [ ['Facility list ingestion', 'Stage 3', 'facilities'], ['Reports & exports', 'Stage 7', 'reports'] ] },
  { id: 'hefamaa_reviewer', label: 'HEFAMAA Reviewer', blurb: 'Read and validate monitoring outcomes across the State.', icon: IconShield,
    tools: [ ['Review facilities', 'Stage 3', 'facilities'], ['Review reports', 'Stage 6', 'reports'] ] },
  { id: 'facility_proprietor', label: 'Facility Proprietor', blurb: 'View your facility\u2019s outcomes and required actions.', icon: IconStore,
    tools: [ ['My facility outcomes', 'Live', 'myfacility'], ['My corrective actions', 'Live', 'myfacility'], ['Re-inspection status', 'Live', 'myfacility'] ] }
]

const ROLE_TABS = {
  team_leader: ['dashboard', 'facilities', 'map', 'engage', 'monitor', 'debrief', 'assign', 'approvals', 'reports'],
  field_monitor: ['dashboard', 'facilities', 'map', 'engage', 'monitor', 'debrief'],
  rhsc_hq: ['dashboard', 'facilities', 'map', 'reports', 'approvals', 'followups', 'assistant', 'settings'],
  hefamaa_reviewer: ['dashboard', 'facilities', 'reports'],
  facility_proprietor: ['dashboard', 'myfacility']
}
const TAB_LABEL = { dashboard: 'Dashboard', facilities: 'Facilities', map: 'Map & Route', engage: 'Engage', monitor: 'Monitor', debrief: 'Debrief', assign: 'Assign', reports: 'Reports', analytics: 'Analytics', myfacility: 'My Facility', followups: 'Follow-ups', settings: 'Settings', assistant: 'AI Assistant', approvals: 'Approvals' }
const CAN_EDIT = ['team_leader', 'field_monitor', 'rhsc_hq']
const AREA_COLORS = ['#6D4B8E', '#3E86C9', '#C7549C', '#5FA35A', '#D08A2E', '#7E63A0', '#4AA3A3', '#B0562E', '#6C6FD0', '#C0603C']

const IDENTITY = {
  // 'solomon@realms.ng': { name: 'Dr Solomon', title: 'Team Leader', photo: '' },
}
function identityFor(email, name) {
  const found = IDENTITY[(email || '').toLowerCase()]
  const chosen = name || (found && found.name)
  if (chosen) return { photo: '', title: '', ...(found || {}), name: chosen, first: chosen.split(' ')[0] }
  const base = (email || 'staff').split('@')[0].replace(/[._-]+/g, ' ')
  const n = base.split(' ').map(w => w ? w[0].toUpperCase() + w.slice(1) : w).join(' ') || 'Staff'
  return { name: n, first: n.split(' ')[0], title: '', photo: '' }
}
const OWNER_EMAIL = 'exco@realmsconsulting.com'
function isOwner(u) { return !!u && String(u.email || '').trim().toLowerCase() === OWNER_EMAIL }
const MONITORS = ['Rev. Dr Solomon Nweke', 'Ojuma Joy', 'Anele Goodnews']
const VIEW_USERS = [
  { name: 'Rev. Dr Solomon Nweke', role: 'team_leader' },
  { name: 'Ojuma Joy', role: 'field_monitor' },
  { name: 'Anele Goodnews', role: 'field_monitor' },
  { name: 'HEFAMAA Reviewer', role: 'hefamaa_reviewer' },
  { name: 'Facility Proprietor', role: 'facility_proprietor' }
]
function roleById(id) { return ROLES.find(r => r.id === id) || null }
function hasCoords(f) { return typeof f.lat === 'number' && typeof f.lng === 'number' && !isNaN(f.lat) && !isNaN(f.lng) }

/* ---------- icons ---------- */
function IconLeader() { return (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><circle cx="12" cy="8" r="3.4"/><path d="M5 20c0-3.6 3.1-6 7-6s7 2.4 7 6"/><path d="M12 1.6l1 2 2.2.2-1.7 1.5.5 2.1L12 6.4 9.9 7.5l.5-2.1L8.8 3.8 11 3.6z"/></svg>) }
function IconMonitor() { return (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><rect x="5" y="3.5" width="14" height="17" rx="2"/><path d="M9 3.5V6h6V3.5"/><path d="M8.5 11l2 2 4-4.5"/><path d="M8.5 16h7"/></svg>) }
function IconHQ() { return (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M3 21h18"/><path d="M5 21V7l7-4 7 4v14"/><path d="M9.5 21v-4h5v4"/><path d="M9 11h1.5M13.5 11H15M9 14h1.5M13.5 14H15"/></svg>) }
function IconShield() { return (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M12 2.5l7 2.6v5.4c0 4.7-3 8.2-7 9.5-4-1.3-7-4.8-7-9.5V5.1z"/><path d="M8.8 12l2.1 2.1 4.3-4.6"/></svg>) }
function IconStore() { return (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M4 9.5V20h16V9.5"/><path d="M3 4.5h18l1 5H2z"/><path d="M9.5 20v-5h5v5"/></svg>) }

/* ---------- shared ---------- */
function SectionHead({ eyebrow, title }) { return (<div className="section-head anim"><p className="eyebrow">{eyebrow}</p><h2>{title}</h2></div>) }
function SearchBox({ value, onChange, placeholder }) { return <input className="searchbox" value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder || 'Search\u2026'} aria-label="Search" /> }
function matchQ(v, q) { if (!q) return true; const s = q.toLowerCase(); return ((v.facility_name || v.name || '') + ' ' + (v.area || '') + ' ' + (v.category || '') + ' ' + (v.address || '')).toLowerCase().includes(s) }

/* ---------- public pages ---------- */
function HomePage({ onSignIn, go, t }) {
  return (
    <div className="page">
      <section className="hero">
        <div className="hero-copy anim">
          <p className="eyebrow">REALMS Healthcare Services Consulting Limited</p>
          <h1>{t('hero_title')}</h1>
          <p className="lede">{t('hero_lede')}</p>
          <div className="cta-row">
            <button className="btn primary" onClick={() => go('contact')}>{t('cta_consult')}</button>
            <button className="btn ghost" onClick={() => go('services')}>{t('cta_services')}</button>
          </div>
          <p className="tagline">{t('tagline')}</p>
        </div>
        <div className="hero-art anim" style={{ animationDelay: '120ms' }}>
          <div className="art-panel"><img src="/rhsc-logo.png" alt="REALMS Healthcare Services Consulting Limited" /></div>
        </div>
      </section>

      <section className="home-strip anim">
        {IMPACT_STATS.map(c => (<div className="mini-stat" key={c.l}><span className="mini-value">{c.v}</span><span className="mini-label">{c.l}</span></div>))}
      </section>

      <section className="clients-band anim">
        <p className="eyebrow center">Trusted by</p>
        <div className="clients-row">{PARTNERS.map(c => <span className="client-chip" key={c}>{c}</span>)}</div>
        <p className="band-note">RHSC is a licensed HEFAMAA monitoring operator, appointed to carry out routine health facility monitoring and accreditation support across Lagos State.</p>
      </section>

      <section className="impact anim">
        <div className="impact-copy">
          <p className="eyebrow light">Why RHSC</p>
          <h2>A partner from strategy to the ground</h2>
          <p>Few firms combine boardroom advisory with field delivery. RHSC does both, advising on strategy, quality and financing, and operating regulatory monitoring at scale as a licensed HEFAMAA operator.</p>
          <div className="cta-row"><button className="btn light" onClick={() => go('contact')}>{t('cta_proposal')}</button><button className="btn ghost onlight" onClick={() => go('monitoring')}>Our HEFAMAA work</button></div>
        </div>
        <div className="impact-art"><img src="/photos/g-network.jpg" alt="Connected healthcare across the State" /></div>
      </section>
    </div>
  )
}

function ServicesPage({ go }) {
  return (<div className="page"><SectionHead eyebrow="What we do" title="Our services" />
    <p className="page-lede anim">End-to-end healthcare consulting: we advise, build and operate across the health system.</p>
    <div className="pillars">{SERVICES.map((p, i) => {
      const clickable = p.to || p.href
      return (<article className={'pillar photo anim' + (clickable ? ' clickable' : '')} key={p.t} style={{ animationDelay: (i * 60) + 'ms' }}
        onClick={() => p.to ? go(p.to) : p.href ? window.open(p.href, '_blank') : null}>
        <div className="pillar-img"><img src={p.img} alt="" /></div>
        <span className="pillar-rule" aria-hidden="true" /><h3>{p.t}</h3><p>{p.d}</p>
        {p.to && <span className="svc-more">See the programme &rarr;</span>}
        {p.href && <span className="svc-more">Visit Genesys &#8599;</span>}
      </article>)
    })}</div>
    <div className="cta-band anim"><h2>Have a brief in mind?</h2><button className="btn primary" onClick={() => go('contact')}>Book a consultation</button></div>
  </div>)
}

function MonitoringPage({ onSignIn, go }) {
  return (<div className="page"><SectionHead eyebrow="Licensed HEFAMAA monitoring operator" title="Facility Monitoring & Accreditation" />
    <div className="mon-lead anim">
      <div className="mon-lead-copy">
        <p>As a licensed operator for the Health Facility Monitoring and Accreditation Agency (HEFAMAA), RHSC carries out routine, evidence-based monitoring of public and private health facilities across Lagos State, holding every provider to the standards that protect the people they serve.</p>
        <p>Our field teams plan efficient routes, engage facilities with courtesy and official identification, assess against the approved HEFAMAA checklist, and debrief proprietors with clear corrective actions and timelines. Findings flow to a live oversight dashboard for the Agency and RHSC leadership.</p>
        <div className="cta-row"><button className="btn primary" onClick={onSignIn}>Staff sign-in</button><button className="btn ghost" onClick={() => go('contact')}>Partner with us</button></div>
      </div>
      <div className="mon-lead-art"><img src="/photos/team.jpg" alt="RHSC monitoring team" /></div>
    </div>
    <div className="wave-wrap"><svg className="wave" viewBox="0 0 1000 90" preserveAspectRatio="none" aria-hidden="true"><path d="M0 55 C110 22, 200 78, 320 52 S540 20, 660 52 S870 82, 1000 46" fill="none" stroke="#A98FC4" strokeWidth="2.5" /></svg>
      <ol className="stages">{STAGES.map((s, i) => (<li className="stage anim" key={s.n} style={{ animationDelay: (i * 80) + 'ms' }}><span className="stage-n">{s.n}</span><span className="dot" aria-hidden="true" /><h3>{s.t}</h3><p>{s.d}</p></li>))}</ol>
    </div>
    <div className="pillars">{PILLARS.map((p, i) => (<article className="pillar anim" key={p.t} style={{ animationDelay: (i * 70) + 'ms' }}><span className="pillar-rule" aria-hidden="true" /><h3>{p.t}</h3><p>{p.d}</p></article>))}</div>
  </div>)
}

function AboutPage() {
  return (<div className="page"><SectionHead eyebrow="Who we are" title="A full-service healthcare consulting firm" />
    <div className="about-lead anim"><img src="/photos/g-building.jpg" alt="Healthcare" /></div>
    <div className="mandate-grid">
      <p className="anim">REALMS Healthcare Services Consulting Limited (RHSC) is a healthcare consulting firm working across strategy, quality and accreditation, training, health financing, digital health and regulatory monitoring. We serve government and regulators, private providers, investors and development partners.</p>
      <p className="anim" style={{ animationDelay: '90ms' }}>We combine boardroom advisory with on-the-ground delivery. That range, from shaping strategy to operating monitoring at scale as a licensed HEFAMAA operator, lets us turn recommendations into measurable results and raise the standard of care.</p>
    </div>
    <div className="principles">{PRINCIPLES.map((p, i) => (<div className="principle anim" key={p.t} style={{ animationDelay: (i * 70) + 'ms' }}><h3>{p.t}</h3><p>{p.d}</p></div>))}</div>
  </div>)
}

function LeaderCard({ l }) {
  const [imgOk, setImgOk] = useState(true)
  const initials = (l.name.replace(/[^A-Za-z ]/g, '').split(' ').filter(Boolean).map(w => w[0]).slice(0, 2).join('') || 'R').toUpperCase()
  return (<article className="staff lead">
    <div className="staff-top">
      <div className="staff-photo">{imgOk ? <img src={l.photo} alt={l.name} onError={() => setImgOk(false)} /> : <span>{initials}</span>}</div>
      <div className="staff-id"><h3>{l.name}</h3><p className="staff-role">{l.role}</p></div>
    </div>
    <p className="staff-purpose">{l.bio}</p>
  </article>)
}
function StaffCard({ s }) {
  const [open, setOpen] = useState(false)
  const initials = (s.name.replace(/[^A-Za-z ]/g, '').split(' ').filter(Boolean).map(w => w[0]).slice(0, 2).join('') || 'R').toUpperCase()
  return (<article className="staff">
    <div className="staff-top">
      <div className="staff-photo" aria-hidden="true"><span>{initials}</span></div>
      <div className="staff-id"><h3>{s.name}</h3><p className="staff-role">{s.role}</p><p className="staff-unit">{s.unit}</p></div>
    </div>
    <p className="staff-purpose">{s.purpose}</p>
    <button className="linkbtn" onClick={() => setOpen(o => !o)}>{open ? 'Hide role profile' : 'View role profile'}</button>
    {open && <ul className="staff-duties">{s.duties.map((d, i) => <li key={i}>{d}</li>)}</ul>}
  </article>)
}
function LeadershipPage({ go }) {
  return (<div className="page"><SectionHead eyebrow="Our people" title="Leadership & staff" />
    <p className="page-lede">The leadership and field team behind RHSC, a licensed HEFAMAA monitoring operator across Lagos State.</p>
    <div className="staff-grid lead-grid anim">{LEADERS.map((l, i) => <LeaderCard key={i} l={l} />)}</div>
    <SectionHead eyebrow="Our team" title="Monitoring officers & specialists" />
    <div className="staff-grid anim">{STAFF.map((s, i) => <StaffCard key={i} s={s} />)}</div>
    <div className="cta-band anim"><h2>Join our team</h2><p>We are always interested in talented people who care about better healthcare.</p><button className="btn primary" onClick={() => go('contact')}>See careers</button></div>
  </div>)
}

function InsightsPage() {
  return (<div className="page"><SectionHead eyebrow="Insights" title="Thinking, news & reports" />
    <p className="page-lede anim">Perspectives from our team, company updates, and research on healthcare in Nigeria and beyond.</p>
    <div className="insights">{INSIGHTS.map((p, i) => (
      <article className="insight anim" key={i} style={{ animationDelay: (i * 70) + 'ms' }}>
        <span className="insight-tag">{p.tag}</span><span className="insight-date">{p.date}</span>
        <h3>{p.title}</h3><p>{p.blurb}</p><span className="svc-more">Read &rarr;</span>
      </article>
    ))}</div>
    <p className="hintline center">More insights coming soon.</p>
  </div>)
}

function ContactPage() {
  const [f, setF] = useState({ name: '', org: '', email: '', phone: '', interest: 'Book a consultation', message: '' })
  const [sent, setSent] = useState(false)
  const set = (k, v) => setF(s => ({ ...s, [k]: v }))
  const valid = f.name.trim() && f.email.trim() && f.message.trim()
  const to = isPlaceholder(CONTACT.email) ? '' : CONTACT.email
  function submit() {
    if (!valid) { toast('Add your name, email and a short message.', 'warn'); return }
    const subject = 'RHSC enquiry: ' + f.interest
    const body = ['Name: ' + f.name, f.org ? 'Organisation: ' + f.org : '', 'Email: ' + f.email, f.phone ? 'Phone: ' + f.phone : '', 'Interest: ' + f.interest, '', f.message].filter(Boolean).join('\n')
    window.location.href = mailtoLink(subject, body, to)
    setSent(true)
  }
  const waHref = CONTACT.whatsapp ? waLink(CONTACT.whatsapp, 'Hello RHSC, I would like to enquire about your services.') : ''
  return (<div className="page contact-page">
    <div className="contact-hero anim">
      <p className="eyebrow">Get in touch</p>
      <h1>Let&rsquo;s raise the standard, together.</h1>
      <p className="contact-lede">Tell us what you are working on. Whether it is strategy, quality, monitoring or digital health, we will point you to the right team.</p>
    </div>
    <div className="contact-split">
      <aside className="contact-panel anim">
        <div className="panel-glow" aria-hidden="true" />
        <h2>Reach RHSC</h2>
        <ul className="reach">
          <li><span className="reach-ic"><Ico name="mail" /></span><div><span className="reach-k">Email</span><em>{CONTACT.email}</em></div></li>
          <li><span className="reach-ic"><Ico name="phone" /></span><div><span className="reach-k">Phone</span><em>{CONTACT.phone}</em></div></li>
          <li><span className="reach-ic"><Ico name="chat" /></span><div><span className="reach-k">WhatsApp</span><em>{CONTACT.whatsapp || '[Imade Forte WhatsApp]'}</em></div></li>
          <li><span className="reach-ic"><Ico name="pin" /></span><div><span className="reach-k">Office</span><em>{CONTACT.address}</em></div></li>
          <li><span className="reach-ic"><Ico name="clock" /></span><div><span className="reach-k">Hours</span><em>{CONTACT.hours}</em></div></li>
        </ul>
        <div className="panel-cta">
          {waHref ? <a className="btn light" href={waHref} target="_blank" rel="noreferrer">Message on WhatsApp</a> : <button className="btn light" onClick={() => toast('Add your WhatsApp number in the contact settings.', 'warn')}>Message on WhatsApp</button>}
          {!isPlaceholder(CONTACT.phone) && <a className="btn ghost onlight" href={'tel:' + CONTACT.phone.replace(/[^0-9+]/g, '')}>Call us</a>}
        </div>
      </aside>

      {sent ? (
        <div className="enquiry sent anim">
          <div className="sent-badge" aria-hidden="true"><svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5" /></svg></div>
          <h2>Your enquiry is ready to send</h2>
          <p>We have opened your email app with the details filled in. Send it and our team will respond, usually within a working day.</p>
          <button className="btn primary" onClick={() => { setSent(false); setF({ name: '', org: '', email: '', phone: '', interest: 'Book a consultation', message: '' }) }}>Start a new enquiry</button>
        </div>
      ) : (
        <div className="enquiry anim">
          <h2>Send an enquiry</h2>
          <div className="fgrid two">
            <label className="field sm"><span>Name</span><input value={f.name} onChange={e => set('name', e.target.value)} placeholder="Your name" /></label>
            <label className="field sm"><span>Organisation</span><input value={f.org} onChange={e => set('org', e.target.value)} placeholder="Optional" /></label>
            <label className="field sm"><span>Email</span><input type="email" value={f.email} onChange={e => set('email', e.target.value)} placeholder="you@example.com" /></label>
            <label className="field sm"><span>Phone</span><input value={f.phone} onChange={e => set('phone', e.target.value)} placeholder="Optional" /></label>
          </div>
          <label className="field sm"><span>How can we help?</span>
            <select value={f.interest} onChange={e => set('interest', e.target.value)}>{['Book a consultation', 'Request a proposal', 'Facility monitoring & accreditation', 'Quality & accreditation', 'Training', 'Health financing', 'Digital health (Genesys)', 'Other'].map(o => <option key={o}>{o}</option>)}</select>
          </label>
          <label className="field sm"><span>Message</span><textarea rows="4" value={f.message} onChange={e => set('message', e.target.value)} placeholder="A sentence or two about what you need." /></label>
          <div className="cta-row">
            <button className="btn primary" onClick={submit}>Send enquiry</button>
            <AIButton className="btn ghost" label="Help me write this" build={() => ({ system: 'You help a website visitor draft a short, polite enquiry to RHSC, a Lagos healthcare consulting and HEFAMAA facility-monitoring firm. Write 2 to 4 sentences in the first person, ready to send. Output only the message.', prompt: 'Name: ' + (f.name || '(unspecified)') + '. Organisation: ' + (f.org || 'n/a') + '. Interest: ' + f.interest + '. Rough note: ' + (f.message || '(none)') + '.', max_tokens: 260 })} onText={txt => set('message', txt)} />
          </div>
          <p className="hintline">Prefer to write directly? Use the details on the left.</p>
        </div>
      )}
    </div>
  </div>)
}

/* ---------- auth ---------- */
function AuthPanel({ onDone, onCancel }) {
  const [mode, setMode] = useState('signin'); const [email, setEmail] = useState(''); const [password, setPassword] = useState(''); const [name, setName] = useState('')
  const [busy, setBusy] = useState(false); const [msg, setMsg] = useState('')
  async function submit() {
    setMsg(''); setBusy(true)
    try {
      if (MODE === 'supabase') {
        if (mode === 'signup') { const { error } = await supabase.auth.signUp({ email, password, options: { data: { full_name: name.trim() } } }); if (error) throw error; setMsg('Account created. If confirmation is required, check your email, then sign in.'); setMode('signin') }
        else { const { error } = await supabase.auth.signInWithPassword({ email, password }); if (error) throw error; if (name.trim()) { try { await supabase.auth.updateUser({ data: { full_name: name.trim() } }) } catch (e) {} } }
      } else { if (!email) throw new Error('Enter an email to continue.'); const u = { email, name: name.trim() }; localStorage.setItem('realms_demo_user', JSON.stringify(u)); onDone(u) }
    } catch (e) { setMsg(e.message || 'Something went wrong. Please try again.') } finally { setBusy(false) }
  }
  const showName = mode === 'signup' || MODE === 'demo'
  return (<div className="auth-shell"><div className="auth-card anim">
    <img className="auth-mark" src="/rhsc-mark.png" alt="RHSC" />
    <h2>{mode === 'signup' ? 'Create your Realms Field account' : 'Sign in to Realms Field'}</h2>
    <p className="auth-sub">For RHSC staff and authorised HEFAMAA reviewers.</p>
    {showName && <label className="field"><span>Your name</span><input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Olamide Okulaja" /></label>}
    <label className="field"><span>Email</span><input type="email" value={email} autoComplete="email" onChange={e => setEmail(e.target.value)} placeholder="you@realms.ng" /></label>
    <label className="field"><span>Password</span><input type="password" value={password} autoComplete="current-password" onChange={e => setPassword(e.target.value)} placeholder={MODE === 'demo' ? 'Not required in demo' : 'Your password'} /></label>
    {msg && <p className="auth-msg">{msg}</p>}
    <button className="btn primary wide" onClick={submit} disabled={busy}>{busy ? 'Please wait\u2026' : (mode === 'signup' ? 'Create account' : 'Sign in')}</button>
    <button className="linkbtn" onClick={() => setMode(mode === 'signup' ? 'signin' : 'signup')}>{mode === 'signup' ? 'Already have an account? Sign in' : 'Need an account? Create one'}</button>
    <button className="linkbtn subtle" onClick={onCancel}>Back to site</button>
    {MODE === 'demo' && <p className="demo-note">Running in DEMO mode. Supabase keys were NOT detected when this version was built. Real accounts and your live data need the two keys present at build time, then a fresh deploy.</p>}
    <p className="hintline" style={{ marginTop: 10, fontSize: 11, opacity: 0.65 }}>build {BUILD} &middot; {MODE === 'supabase' ? 'connected to database' : 'demo mode (not connected)'}</p>
  </div></div>)
}

/* ---------- role picker ---------- */
function RolePicker({ identity, onPick, onSignOut }) {
  return (<div className="page role-page">
    <div className="section-head anim"><p className="eyebrow">Welcome, {identity.first}</p><h2>Which best describes you?</h2></div>
    <div className="role-grid">{ROLES.map((r, i) => { const Icon = r.icon; return (
      <button className="role-card anim" key={r.id} style={{ animationDelay: (i * 60) + 'ms' }} onClick={() => onPick(r.id)}>
        <span className="role-icon"><Icon /></span><span className="role-label">{r.label}</span><span className="role-blurb">{r.blurb}</span>
      </button>) })}</div>
    <button className="linkbtn subtle center" onClick={onSignOut}>Sign out</button>
  </div>)
}

/* ---------- dashboard ---------- */
function Dashboard({ identity, role, onOpen, facilities, onSeed, onClear, dbError }) {
  const r = roleById(role); const Icon = r ? r.icon : IconMonitor
  const areas = Array.from(new Set((facilities || []).map(f => f.area || 'Unassigned')))
  const quick = [{ v: (facilities || []).length, l: 'Facilities' }, { v: areas.length, l: 'Areas' }, { v: (r ? r.tools.filter(t => t[2]).length : 0), l: 'Live tools' }]
  const hasData = (facilities || []).length > 0
  const showAnalytics = ['rhsc_hq', 'team_leader', 'hefamaa_reviewer'].includes(role)
  return (<div className="page dash">
    <div className="dash-banner anim">
      <img src="/photos/team.jpg" alt="RHSC field team" />
      <div className="dash-banner-in">
        <span className="dash-icon"><Icon /></span>
        <div><p className="eyebrow light">{r ? r.label : 'Realms Field'}</p><h2>Welcome, {identity.first}</h2><p className="dash-sub">Professional. Educational. Enforcement-driven.</p></div>
      </div>
    </div>
    {dbError ? (<div className="db-error anim">
      <strong>The facilities could not load.</strong>
      <span className="db-msg">{dbError}</span>
      <span>If you just updated the app, make sure the new version finished deploying, then tap Try again. Running build: {BUILD}.</span>
      <button className="btn small primary" onClick={onSeed}>Try again</button>
    </div>) : (!hasData && onSeed && (<div className="seed-card anim"><div><strong>No facilities yet.</strong><span>Load the live facility register (Alimosho &amp; Ifako-Ijaiye) to begin.</span></div><button className="btn small primary" onClick={onSeed}>Load live facilities</button></div>))}

    {showAnalytics
      ? (<div className="dash-analytics anim"><AnalyticsBody facilities={facilities} /></div>)
      : (<div className="dash-quick anim">{quick.map(q => (<div className="dq" key={q.l}><span className="dq-v">{q.v}</span><span className="dq-l">{q.l}</span></div>))}</div>)}
    <p className="dash-intro anim">Your tools are on the left. The ones marked ready are live now; the rest unlock as the build grows.</p>
    <div className="tool-grid">{(r ? r.tools : []).map(([name, stage, tab], i) => {
      const live = !!tab
      return (<button className={'tool-card' + (live ? ' live' : '')} key={name} style={{ animationDelay: (i * 60) + 'ms' }} disabled={!live} onClick={() => live && onOpen(tab)}>
        <span className="tool-name">{name}</span><span className={'tool-stage' + (live ? ' ready' : '')}>{live ? 'Open' : stage}</span>
      </button>)
    })}</div>
  </div>)
}

/* ---------- facilities ---------- */
function FacilitiesPage({ list, canEdit, userId, reload }) {
  const [adding, setAdding] = useState(false); const [busy, setBusy] = useState(false); const [msg, setMsg] = useState('')
  const [form, setForm] = useState({ name: '', category: '', area: '', address: '', lat: '', lng: '' })
  const [q, setQ] = useState('')
  const [visits, setVisits] = useState([])
  const [drawer, setDrawer] = useState(null)
  const [aiClean, setAiClean] = useState(false)
  const [geoRun, setGeoRun] = useState(null)
  useEffect(() => { VIS.list().then(setVisits).catch(() => {}) }, [])
  const origin = (typeof window !== 'undefined' && window.location) ? window.location.origin : ''
  function facVisits(f) { return visits.filter(v => (v.facility_id && v.facility_id === f.id) || v.facility_name === f.name) }
  const fileRef = useRef(null)

  const groups = {}
  const flist = list.filter(f => matchQ(f, q))
  flist.forEach(f => { const a = f.area || 'Unassigned'; (groups[a] = groups[a] || []).push(f) })
  const areas = Object.keys(groups).sort()
  const missing = list.filter(f => !hasCoords(f)).length

  async function saveForm() {
    if (!form.name.trim()) { setMsg('A facility name is required.'); return }
    setBusy(true); setMsg('')
    try {
      const lat = parseFloat(form.lat), lng = parseFloat(form.lng)
      await FAC.addMany([{ name: form.name.trim(), category: form.category.trim(), area: form.area.trim() || 'Unassigned', address: form.address.trim(), last_visit: '', lat: isNaN(lat) ? null : lat, lng: isNaN(lng) ? null : lng }], userId)
      setForm({ name: '', category: '', area: '', address: '', lat: '', lng: '' }); setAdding(false); await reload()
    } catch (e) { setMsg(e.message || 'Could not save the facility.') } finally { setBusy(false) }
  }
  async function importRows(text, sourceLabel) {
    let csv = text
    if (aiClean) {
      const r = await askAI({ system: 'You clean a facilities CSV for a Lagos health-facility monitoring app. Return ONLY CSV with this header row: name,category,area,address,lat,lng,last_visit. Standardise area/LGA names, fix casing, remove empty or duplicate rows, keep lat/lng if present. No commentary, no code fences.', prompt: text.slice(0, 6000), max_tokens: 2000 })
      if (r.ok && r.text && /name/i.test(r.text)) csv = r.text.replace(/```[a-z]*/gi, '').replace(/```/g, '').trim()
      else if (!r.ok && r.reason === 'ai_not_configured') toast('AI clean is not set up; imported as-is.', 'warn')
    }
    const items = facilitiesFromCSV(csv)
    if (!items.length) { setMsg('No rows found. Include a header row with a name column.'); return }
    await FAC.addMany(items, userId); await reload(); setMsg(items.length + ' facilities imported' + (sourceLabel ? ' from ' + sourceLabel : '') + (aiClean ? ', cleaned with AI' : '') + '.')
  }
  async function onFile(e) {
    const file = e.target.files && e.target.files[0]; if (!file) return
    setBusy(true); setMsg('')
    try {
      const name = (file.name || '').toLowerCase()
      if (name.endsWith('.xlsx') || name.endsWith('.xls')) {
        const XLSX = await import('xlsx')
        const buf = await file.arrayBuffer()
        const wb = XLSX.read(buf, { type: 'array' })
        const sheet = wb.Sheets[wb.SheetNames[0]]
        const csv = XLSX.utils.sheet_to_csv(sheet)
        await importRows(csv, 'Excel')
      } else {
        const text = await file.text(); await importRows(text, '')
      }
    } catch (e) { setMsg(e.message || 'Could not import the file.') } finally { setBusy(false); if (fileRef.current) fileRef.current.value = '' }
  }
  function downloadTemplate() {
    const header = 'name,category,area,address,lat,lng,last_visit'
    const example = 'Example Health Centre,Primary health centre,Ikeja,12 Example Road,,,'
    download('realms-facilities-template.csv', header + '\n' + example + '\n', 'text/csv')
  }
  async function importSheet() {
    const url = window.prompt('Paste your Google Sheet link (the sheet must be shared as "Anyone with the link can view").')
    if (!url) return
    setBusy(true); setMsg('')
    try {
      const m = url.match(/\/d\/([a-zA-Z0-9-_]+)/); if (!m) throw new Error('That does not look like a Google Sheet link.')
      const gid = (url.match(/[#&?]gid=(\d+)/) || [])[1] || '0'
      const csvUrl = 'https://docs.google.com/spreadsheets/d/' + m[1] + '/export?format=csv&gid=' + gid
      const res = await fetch(csvUrl); if (!res.ok) throw new Error('Could not read the sheet. Make sure link-sharing is on for anyone with the link.')
      const text = await res.text(); const items = facilitiesFromCSV(text)
      if (!items.length) throw new Error('No rows found. Include a header row with a name column.')
      await FAC.addMany(items, userId); await reload(); setMsg(items.length + ' facilities imported from Google Sheet.')
    } catch (e) { setMsg(e.message || 'Google Sheet import failed.') } finally { setBusy(false) }
  }
  async function locate(f) {
    setBusy(true); setMsg('')
    try { const g = await geocode(f.address || f.name + ' ' + (f.area || '')); if (g) { await FAC.update(f.id, { ...g, geo_confirmed: true }); await reload() } else setMsg('No match found. Add coordinates manually.') }
    catch (e) { setMsg('Location lookup failed. Add coordinates manually.') } finally { setBusy(false) }
  }
  async function mapAll() {
    const todo = list.filter(f => !hasCoords(f))
    if (!todo.length) { toast('Every facility already has a pin.'); return }
    if (!(await confirmAction('This looks up a map pin for ' + todo.length + ' facilities from their addresses. It takes roughly ' + Math.ceil(todo.length * 1.2 / 60) + ' minutes. Pins are marked "check" until your team confirms them.', { title: 'Map the facilities', ok: 'Start' }))) return
    setGeoRun({ done: 0, total: todo.length, found: 0 })
    let found = 0
    for (let i = 0; i < todo.length; i++) {
      const f = todo[i]
      try {
        const g = await geocode(f.address || (f.name + ' ' + (f.area || '')))
        if (g) { await FAC.update(f.id, { ...g, geo_confirmed: false }); found++ }
      } catch (e) {}
      setGeoRun({ done: i + 1, total: todo.length, found })
      await new Promise(r => setTimeout(r, 1150))
    }
    await reload(); setGeoRun(null)
    toast(found + ' of ' + todo.length + ' facilities mapped. Ask the team to confirm the pins.')
  }
  async function confirmPin(f) { try { await FAC.update(f.id, { geo_confirmed: true }); await reload() } catch (e) { toast('Could not save.', 'err') } }
  async function del(f) { if (!(await confirmAction('Remove ' + f.name + ' from the facility list?', { title: 'Remove facility', ok: 'Remove', danger: true }))) return; await FAC.remove(f.id); await reload(); toast('Facility removed.') }

  return (<div className="page">
    <div className="ptitle"><div><p className="eyebrow">Facilities</p><h2>{list.length} in {areas.length} area{areas.length === 1 ? '' : 's'}</h2></div>
      {canEdit && <div className="ptools">
        <button className="btn small ghost" onClick={() => fileRef.current && fileRef.current.click()}>Bulk upload</button>
        <button className="btn small ghost" onClick={importSheet}>Google Sheet</button>
        <button className="btn small ghost" onClick={downloadTemplate}>Template</button>
        <button className="btn small ghost" onClick={() => window.alert('HEFAMAA sync connects to the Agency\u2019s data feed. Share the API endpoint and we will enable it.')}>HEFAMAA sync</button>
        <button className="btn small primary" onClick={() => setAdding(a => !a)}>{adding ? 'Close' : 'Add facility'}</button>
        <button className="btn small ghost" onClick={mapAll} disabled={!!geoRun}>{geoRun ? ('Mapping ' + geoRun.done + '/' + geoRun.total) : 'Map the facilities'}</button>
        <label className="ai-check"><input type="checkbox" checked={aiClean} onChange={e => setAiClean(e.target.checked)} /> <span className="ai-spark">✦</span> Clean with AI</label>
        <input ref={fileRef} type="file" accept=".csv,text/csv,.xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel" onChange={onFile} style={{ display: 'none' }} />
      </div>}
    </div>
    {canEdit && <p className="hintline">Bulk upload a CSV or Excel file. Columns: name, category, area (or lga), address, lat, lng, last_visit. Only name is required. Use Template for the exact format.</p>}
    {msg && <p className="auth-msg block">{msg}</p>}
    {missing > 0 && <p className="warnline">{missing} facilit{missing === 1 ? 'y is' : 'ies are'} missing coordinates and will not appear on the map. Add lat/lng or use Locate.</p>}

    {adding && canEdit && (<div className="addform">
      <div className="fgrid">
        <label className="field sm"><span>Name</span><input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></label>
        <label className="field sm"><span>Category</span><input value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} placeholder="e.g. Primary clinic" /></label>
        <label className="field sm"><span>Area / LGA</span><input value={form.area} onChange={e => setForm({ ...form, area: e.target.value })} placeholder="e.g. Ikeja" /></label>
        <label className="field sm"><span>Address</span><input value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} /></label>
        <label className="field sm"><span>Latitude</span><input value={form.lat} onChange={e => setForm({ ...form, lat: e.target.value })} placeholder="optional" /></label>
        <label className="field sm"><span>Longitude</span><input value={form.lng} onChange={e => setForm({ ...form, lng: e.target.value })} placeholder="optional" /></label>
      </div>
      <button className="btn small primary" onClick={saveForm} disabled={busy}>{busy ? 'Saving\u2026' : 'Save facility'}</button>
    </div>)}

    {geoRun && <div className="mon-meter"><div className="meter-row"><span className="meter-lab">Mapping</span><div className="meter-track"><div className="meter-fill" style={{ width: Math.round(geoRun.done / geoRun.total * 100) + '%' }} /></div><span className="meter-val">{geoRun.done}/{geoRun.total}</span></div></div>}
    {list.length > 0 && <div className="list-tools"><SearchBox value={q} onChange={setQ} placeholder="Search facilities, area, category…" /></div>}
    {list.length === 0 ? <p className="empty">No facilities yet. {canEdit ? 'Add one or import a CSV to begin.' : 'Nothing to show.'}</p> :
      areas.length === 0 ? <p className="empty">No facilities match your search.</p> :
      areas.map((a, ai) => (<div className="cluster" key={a}>
        <div className="cluster-head"><span className="area-dot" style={{ background: AREA_COLORS[ai % AREA_COLORS.length] }} /><h3>{a}</h3><span className="cluster-count">{groups[a].length}</span></div>
        <div className="frows">{groups[a].map(f => (<div className="frow" key={f.id}>
          <div className="fmain"><span className="fname">{f.name}</span><span className="fmeta">{[f.category, f.address, f.phone].filter(Boolean).join(' \u00b7 ') || 'No details'}</span></div>
          <div className="factions">
            <button className="mini" onClick={() => setDrawer(f)}>History</button>
            {f.phone && <a className="mini" href={'tel:' + String(f.phone).replace(/[^0-9+]/g, '')}>Call</a>}
            {hasCoords(f) ? (f.geo_confirmed === false ? (canEdit ? <button className="mini warn" onClick={() => confirmPin(f)}>Confirm pin</button> : <span className="pin no">pin unchecked</span>) : <span className="pin ok" title="Mapped">&#9679;</span>) : (canEdit ? <button className="mini" onClick={() => locate(f)} disabled={busy}>Locate</button> : <span className="pin no">no coords</span>)}
            {canEdit && <button className="mini danger" onClick={() => del(f)}>Remove</button>}
          </div>
        </div>))}</div>
      </div>))}
    {drawer && (<div className="drawer-scrim" onClick={() => setDrawer(null)}>
      <div className="drawer anim-right" onClick={e => e.stopPropagation()}>
        <div className="drawer-head"><div><h3>{drawer.name}</h3><p className="fmeta">{[drawer.category, drawer.area, drawer.address].filter(Boolean).join(' \u00b7 ') || 'No details'}</p></div><button className="mini" onClick={() => setDrawer(null)}>Close</button></div>
        <h4 className="drawer-sub">Visit history</h4>
        {facVisits(drawer).length === 0 ? <p className="empty sm">No visits recorded for this facility yet.</p> :
          <ul className="drawer-visits">{facVisits(drawer).map(v => (
            <li key={v.id}>
              <div className="dv-main"><span className="fname">{(v.arrival_time || v.created_at || '').slice(0, 10)}</span><span className="fmeta">{ragText(v.overall_rating)}{v.score != null ? ' \u00b7 ' + v.score + '%' : ''} \u00b7 {v.status}</span></div>
              {(v.status === 'monitored' || v.status === 'debriefed') && <button className="mini" onClick={() => printDoc('Monitoring Report', buildReport(v, v.debrief || deriveDebrief(v), origin))}>Report</button>}
            </li>
          ))}</ul>}
      </div>
    </div>)}
  </div>)
}
function pinIcon(color, num) {
  const label = num ? '<span style="position:absolute;inset:0;display:grid;place-items:center;transform:rotate(45deg);color:#fff;font:700 11px Lora,serif">' + num + '</span>' : ''
  return L.divIcon({ className: 'rf-pin', html: '<div style="position:relative;width:24px;height:24px"><div style="width:24px;height:24px;background:' + color + ';border:2px solid #fff;border-radius:50% 50% 50% 0;transform:rotate(-45deg);box-shadow:0 2px 5px rgba(0,0,0,.35)"></div>' + label + '</div>', iconSize: [24, 24], iconAnchor: [12, 22], popupAnchor: [0, -20] })
}
function MapRoutePage({ list, role, userId }) {
  const mapRef = useRef(null); const mapObj = useRef(null); const layerRef = useRef(null)
  const areas = Array.from(new Set(list.map(f => f.area || 'Unassigned'))).sort()
  const colorMap = {}; areas.forEach((a, i) => { colorMap[a] = AREA_COLORS[i % AREA_COLORS.length] })
  const [area, setArea] = useState('all')
  const [routed, setRouted] = useState(false)
  const [visits, setVisits] = useState([])
  const [q, setQ] = useState('')
  const [perDay, setPerDay] = useState(14)
  const [plan, setPlan] = useState(null)
  const [planBusy, setPlanBusy] = useState(false)
  const [assignForm, setAssignForm] = useState({})
  const [assignBusy, setAssignBusy] = useState('')
  const canAssign = role === 'team_leader' || role === 'rhsc_hq'
  const isHQ = role === 'rhsc_hq'
  useEffect(() => { if (isHQ) VIS.list().then(setVisits).catch(() => {}) }, [isHQ])

  const filtered = (area === 'all' ? list : list.filter(f => (f.area || 'Unassigned') === area))
  const plotted = filtered.filter(hasCoords)
  const ordered = routed ? orderRoute(plotted) : plotted
  const gmaps = googleMapsDirUrl(ordered)

  const visByFac = {}
  visits.forEach(v => { const key = v.facility_id || v.facility_name; if (!key) return; const prev = visByFac[key]; if (!prev || (v.arrival_time || v.created_at || '') > (prev.arrival_time || prev.created_at || '')) visByFac[key] = v })
  function facVisit(f) { return visByFac[f.id] || visByFac[f.name] }
  function facStatus(f) { const v = facVisit(f); return v ? (v.status === 'debriefed' ? 'Debriefed' : v.status === 'monitored' ? 'Assessed' : 'Engaged') : 'Not visited' }
  const visitedCount = list.filter(facVisit).length
  const assessedCount = list.filter(f => { const v = facVisit(f); return v && (v.status === 'monitored' || v.status === 'debriefed') }).length
  const dueCount = visits.filter(v => v.debrief && v.debrief.remediation_deadline && daysUntil(v.debrief.remediation_deadline) != null && daysUntil(v.debrief.remediation_deadline) < 7).length
  const tableRows = list.filter(f => matchQ(f, q))

  function facByName(n) { return list.find(f => f.name === n) || list.find(f => (f.name || '').toLowerCase() === (n || '').toLowerCase()) }
  function dayMapsUrl(names) {
    const stops = (names || []).map(n => { const f = facByName(n); if (f && hasCoords(f)) return f.lat + ',' + f.lng; return encodeURIComponent((n || '') + ((f && f.address) ? ', ' + f.address : '') + ', Lagos') }).filter(Boolean)
    return stops.length ? 'https://www.google.com/maps/dir/' + stops.join('/') : ''
  }
  async function planRoutes() {
    const pool = filtered
    if (!pool.length) { toast('No facilities in this view to plan.', 'warn'); return }
    setPlanBusy(true); setPlan(null)
    const facs = pool.map(f => ({ name: f.name, address: f.address || '', area: f.area || '', lat: hasCoords(f) ? f.lat : null, lng: hasCoords(f) ? f.lng : null }))
    const sys = 'You are a routing planner for a Lagos health-facility monitoring team. Group the facilities into daily batches of about ' + perDay + ' that are close to each other (same neighbourhoods, streets or localities), so each day is quick to cover and, across all the days, every facility is visited with the least travel. Order each day from a sensible start to finish. Judge proximity from the address localities, and from coordinates when present. Return ONLY JSON, no prose: {"days":[{"day":1,"area":"locality label","facilities":["exact facility name","..."]}]}. Use the exact facility names provided and include every facility exactly once.'
    const r = await askAI({ system: sys, prompt: JSON.stringify(facs), max_tokens: 4000 })
    setPlanBusy(false)
    if (!r.ok) { toast(r.reason === 'ai_not_configured' ? 'AI is not set up yet. Add ANTHROPIC_API_KEY in Vercel to enable it.' : 'The planner could not respond. Please try again.', 'warn'); return }
    try {
      const txt = (r.text || '').replace(/```json/gi, '').replace(/```/g, '').trim()
      const obj = JSON.parse(txt)
      const days = Array.isArray(obj) ? obj : (obj.days || [])
      if (!days.length) { toast('The planner returned nothing usable. Try again.', 'warn'); return }
      setPlan(days)
    } catch (e) { toast('Could not read the plan. Please try again.', 'warn') }
  }
  async function assignDay(key, d) {
    const f = assignForm[key] || {}
    if (!f.monitor) { toast('Choose who this day is for.', 'warn'); return }
    if (!f.date) { toast('Choose the visit date.', 'warn'); return }
    const ids = (d.facilities || []).map(n => { const fx = facByName(n); return fx ? fx.id : null }).filter(Boolean)
    if (!ids.length) { toast('No matching facilities to assign.', 'warn'); return }
    setAssignBusy(key)
    try {
      await ASG.add({ visit_date: f.date, area: d.area || (area === 'all' ? 'Mixed' : area), facility_ids: ids, monitor: f.monitor, note: 'AI route plan, ' + ids.length + ' stops' }, userId)
      toast(ids.length + ' facilities assigned to ' + f.monitor + ' for ' + f.date + '.')
    } catch (e) { toast('Could not save the assignment.', 'err') } finally { setAssignBusy('') }
  }

  useEffect(() => {
    if (!mapRef.current || mapObj.current) return
    const m = L.map(mapRef.current, { scrollWheelZoom: true }).setView([6.5244, 3.3792], 10)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '\u00a9 OpenStreetMap contributors' }).addTo(m)
    layerRef.current = L.layerGroup().addTo(m); mapObj.current = m
    setTimeout(() => m.invalidateSize(), 200)
    return () => { m.remove(); mapObj.current = null }
  }, [])

  useEffect(() => {
    const m = mapObj.current, lg = layerRef.current; if (!m || !lg) return
    lg.clearLayers()
    ordered.forEach((f, i) => {
      const mk = L.marker([f.lat, f.lng], { icon: pinIcon(colorMap[f.area || 'Unassigned'] || '#6D4B8E', routed ? i + 1 : null) })
      mk.bindPopup('<strong>' + (f.name || '') + '</strong><br>' + [f.category, f.area].filter(Boolean).join(' \u00b7 '))
      mk.addTo(lg)
    })
    if (routed && ordered.length > 1) L.polyline(ordered.map(f => [f.lat, f.lng]), { color: '#6D4B8E', weight: 3, opacity: .8, dashArray: '6 6' }).addTo(lg)
    if (ordered.length) { try { m.fitBounds(ordered.map(f => [f.lat, f.lng]), { padding: [40, 40], maxZoom: 14 }) } catch (e) {} }
  }, [area, routed, list.length])

  return (<div className="page map-page">
    <div className="ptitle"><div><p className="eyebrow">Map & route</p><h2>{plotted.length} mapped in {area === 'all' ? 'all areas' : area}</h2></div>
      <div className="ptools">
        <select className="sel" value={area} onChange={e => { setArea(e.target.value); setRouted(false) }}>
          <option value="all">All areas</option>{areas.map(a => <option key={a} value={a}>{a}</option>)}
        </select>
        <button className="btn small primary" onClick={() => setRouted(r => !r)} disabled={plotted.length < 2}>{routed ? 'Clear route' : 'Build route'}</button>
        {routed && gmaps && <a className="btn small ghost" href={gmaps} target="_blank" rel="noreferrer">Open in Google Maps</a>}
      </div>
    </div>
    {plotted.length === 0 && <p className="warnline">No mapped facilities in this view. Add coordinates on the Facilities tab.</p>}
    <div className="map-frame"><div ref={mapRef} className="leaflet-holder" /></div>
    {routed && ordered.length > 0 && (<ol className="route-list">{ordered.map((f, i) => (<li key={f.id || i}><span className="rn">{i + 1}</span><span>{f.name}</span><em>{f.area}</em></li>))}</ol>)}

    <div className="planner">
      <SectionHead eyebrow="AI" title="Daily route planner" />
      <p className="hintline">Groups the facilities in this view into day-by-day routes by proximity, so the team finishes faster each day and covers everywhere with less travel.</p>
      <div className="planner-controls">
        <label className="field sm inline"><span>Facilities per day</span><input type="number" min="4" max="30" value={perDay} onChange={e => setPerDay(Math.max(4, Math.min(30, parseInt(e.target.value, 10) || 12)))} /></label>
        <button className="btn small primary" onClick={planRoutes} disabled={planBusy}><span className="ai-spark" aria-hidden="true">✦</span>{planBusy ? 'Planning\u2026' : 'Plan daily routes'}</button>
        <span className="hintline">{filtered.length} facilities in {area === 'all' ? 'all areas' : area}</span>
      </div>
      {plan && plan.length > 0 && <div className="plan-days">{plan.map((d, i) => {
        const url = dayMapsUrl(d.facilities || [])
        const dayKey = 'd' + i
        return (<div className="plan-day" key={i}>
          <div className="plan-day-head"><h4>Day {d.day || i + 1}{d.area ? ' \u00b7 ' + d.area : ''}</h4><span className="plan-count">{(d.facilities || []).length} stops</span>{url && <a className="mini" href={url} target="_blank" rel="noreferrer">Open in Google Maps</a>}</div>
          <ol className="plan-list">{(d.facilities || []).map((n, j) => { const f = facByName(n); return <li key={j}><span className="pf-name">{n}</span>{f && f.address && <em>{f.address}</em>}</li> })}</ol>
          {canAssign && <div className="plan-assign">
            <select className="sel" value={(assignForm[dayKey] || {}).monitor || ''} onChange={e => setAssignForm(s => ({ ...s, [dayKey]: { ...(s[dayKey] || {}), monitor: e.target.value } }))}>
              <option value="">Assign to\u2026</option>{MONITORS.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
            <input type="date" className="sel" value={(assignForm[dayKey] || {}).date || ''} onChange={e => setAssignForm(s => ({ ...s, [dayKey]: { ...(s[dayKey] || {}), date: e.target.value } }))} />
            <button className="btn small primary" onClick={() => assignDay(dayKey, d)} disabled={assignBusy === dayKey}>{assignBusy === dayKey ? 'Saving\u2026' : 'Assign day'}</button>
          </div>}
        </div>)
      })}</div>}
    </div>

    {isHQ && (<div className="hq-oversight">
      <SectionHead eyebrow="Oversight" title="Coverage & status" />
      <div className="hq-stats">
        <div className="hq-stat"><span className="v">{list.length}</span><span className="l">Facilities</span></div>
        <div className="hq-stat"><span className="v">{list.filter(hasCoords).length}</span><span className="l">Mapped</span></div>
        <div className="hq-stat"><span className="v">{areas.length}</span><span className="l">Areas</span></div>
        <div className="hq-stat"><span className="v">{visitedCount}</span><span className="l">Visited</span></div>
        <div className="hq-stat"><span className="v">{assessedCount}</span><span className="l">Assessed</span></div>
        <div className="hq-stat"><span className="v">{dueCount}</span><span className="l">Re-inspections due</span></div>
      </div>
      <div className="list-tools"><SearchBox value={q} onChange={setQ} placeholder="Search facilities…" /></div>
      <div className="hq-table">
        <div className="hq-tr hq-th"><span>Facility</span><span>Area</span><span>Mapped</span><span>Last visit</span><span>Status</span></div>
        {tableRows.length === 0 ? <div className="hq-tr"><span className="hq-name">No facilities match your search.</span></div> :
          tableRows.map(f => { const v = facVisit(f); return (
            <div className="hq-tr" key={f.id}><span className="hq-name">{f.name}</span><span>{f.area || '\u2014'}</span><span>{hasCoords(f) ? 'Yes' : 'No'}</span><span>{v ? (v.arrival_time || v.created_at || '').slice(0, 10) : '\u2014'}</span><span className={'hq-status s-' + facStatus(f).toLowerCase().replace(/[^a-z]/g, '')}>{facStatus(f)}</span></div>
          ) })}
      </div>
    </div>)}
  </div>)
}

/* ---------- assign (team leader) ---------- */
function AssignPage({ list, userId }) {
  const areas = Array.from(new Set(list.map(f => f.area || 'Unassigned'))).sort()
  const [date, setDate] = useState(''); const [area, setArea] = useState(areas[0] || '')
  const [picked, setPicked] = useState({}); const [note, setNote] = useState('')
  const [busy, setBusy] = useState(false); const [msg, setMsg] = useState(''); const [saved, setSaved] = useState([])

  useEffect(() => { ASG.list().then(setSaved).catch(() => {}) }, [])
  const inArea = list.filter(f => (f.area || 'Unassigned') === area)
  function toggle(id) { setPicked(p => ({ ...p, [id]: !p[id] })) }

  async function save() {
    const ids = Object.keys(picked).filter(k => picked[k])
    if (!date) { setMsg('Choose a visit date.'); return }
    if (!ids.length) { setMsg('Select at least one facility.'); return }
    setBusy(true); setMsg('')
    try {
      const rec = await ASG.add({ visit_date: date, area, facility_ids: ids, note: note.trim() }, userId)
      setSaved(s => [rec].concat(s)); setPicked({}); setNote(''); setMsg('Assignment saved.'); toast('Assignment saved.')
    } catch (e) { setMsg(e.message || 'Could not save the assignment.') } finally { setBusy(false) }
  }

  return (<div className="page">
    <div className="ptitle"><div><p className="eyebrow">Assign</p><h2>Plan a day of visits</h2></div></div>
    {msg && <p className="auth-msg block">{msg}</p>}
    <div className="assign-grid">
      <div className="assign-form">
        <div className="fgrid two">
          <label className="field sm"><span>Visit date</span><input type="date" value={date} onChange={e => setDate(e.target.value)} /></label>
          <label className="field sm"><span>Area</span><select value={area} onChange={e => { setArea(e.target.value); setPicked({}) }}>{areas.map(a => <option key={a} value={a}>{a}</option>)}</select></label>
        </div>
        <p className="pick-label">Facilities in {area || 'this area'}</p>
        <div className="pick-list">
          {inArea.length === 0 ? <p className="empty sm">No facilities here yet.</p> : inArea.map(f => (
            <label className="pick-row" key={f.id}><input type="checkbox" checked={!!picked[f.id]} onChange={() => toggle(f.id)} /><span>{f.name}</span>{!hasCoords(f) && <em className="nocoord">no coords</em>}</label>
          ))}
        </div>
        <label className="field sm"><span>Team note</span><input value={note} onChange={e => setNote(e.target.value)} placeholder="e.g. Team A, start 9am" /></label>
        <button className="btn small primary" onClick={save} disabled={busy}>{busy ? 'Saving\u2026' : 'Save assignment'}</button>
      </div>
      <div className="assign-saved">
        <p className="pick-label">Planned</p>
        {saved.length === 0 ? <p className="empty sm">No assignments yet.</p> : saved.map((a, i) => (
          <div className="saved-card" key={a.id || i}><strong>{a.visit_date}</strong><span>{a.area}</span><em>{(a.facility_ids || []).length} facilities</em>{a.note ? <p>{a.note}</p> : null}</div>
        ))}
      </div>
    </div>
  </div>)
}

/* ---------- engage (Stage 4) ---------- */
function IdCard({ name, role }) {
  return (<div className="idcard">
    <img className="idmark" src="/rhsc-mark.png" alt="RHSC" />
    <div className="idbody">
      <span className="idname">{name || 'Team member'}</span>
      <span className="idrole">{role || 'Field Monitor'}</span>
      <span className="idorg">RHSC &middot; HEFAMAA &middot; Lagos State</span>
    </div>
  </div>)
}

function EngagePage({ list, identity, role, userId }) {
  const roleLabel = (roleById(role) || {}).label || 'Field Monitor'
  const [step, setStep] = useState(0)
  const [facility, setFacility] = useState(null)
  const [arrival, setArrival] = useState(null)
  const [coords, setCoords] = useState(null)
  const [geoMsg, setGeoMsg] = useState('')
  const [team, setTeam] = useState([{ name: identity.name, role: roleLabel }])
  const [nm, setNm] = useState(''); const [nr, setNr] = useState('')
  const [pic, setPic] = useState({ name: '', role: '', phone: '' })
  const [greeted, setGreeted] = useState(false)
  const [busy, setBusy] = useState(false); const [msg, setMsg] = useState(''); const [done, setDone] = useState(false)
  const [ref] = useState(() => 'RF-' + new Date().toISOString().slice(0, 10).replace(/-/g, '') + '-' + String(Math.floor(Math.random() * 9000) + 1000))

  const [asgs, setAsgs] = useState([]); const [todayVisits, setTodayVisits] = useState([])
  const todayISO = new Date().toISOString().slice(0, 10)
  const todayStr = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long' })
  useEffect(() => { ASG.list().then(setAsgs).catch(() => {}); VIS.list().then(setTodayVisits).catch(() => {}) }, [])
  const myIds = {}
  asgs.filter(a => a.visit_date === todayISO && (!a.monitor || a.monitor === identity.name)).forEach(a => { (a.facility_ids || []).forEach(id => { myIds[id] = true }) })
  const myDay = list.filter(f => myIds[f.id])
  const visitedToday = {}
  todayVisits.forEach(v => { if ((v.arrival_time || '').slice(0, 10) === todayISO && v.facility_id) visitedToday[v.facility_id] = true })

  const groups = {}; list.forEach(f => { const a = f.area || 'Unassigned'; (groups[a] = groups[a] || []).push(f) })
  const areaKeys = Object.keys(groups).sort()
  const dateStr = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
  const lead = team[0]; const others = team.slice(1)
  const introMembers = others.length ? others.map(m => m.name).join(', ') : ''
  const intro = 'Good morning, sir/ma. We are from REALMS Healthcare Services Consulting Limited, working with HEFAMAA, Lagos State. I am ' + (lead ? lead.name : 'the team lead') + (others.length ? (', and these are ' + introMembers) : '') + '. We are here to conduct routine monitoring of this health facility as mandated by law.'

  function chooseFacility(f) { setFacility(f); setStep(1) }
  function checkIn() {
    if (!coords) { setGeoMsg('GPS location is required at check-in. Tap Capture location and allow access.'); return }
    setArrival(new Date()); setStep(2)
  }
  function capture() {
    if (!navigator.geolocation) { setGeoMsg('Location is not available on this device. GPS is required to check in.'); return }
    setGeoMsg('Locating\u2026')
    navigator.geolocation.getCurrentPosition(
      p => { setCoords({ lat: +p.coords.latitude.toFixed(6), lng: +p.coords.longitude.toFixed(6) }); setGeoMsg('') },
      () => setGeoMsg('Location permission denied. GPS is required at check-in, please enable location and try again.'),
      { enableHighAccuracy: true, timeout: 10000 }
    )
  }
  useEffect(() => { if (step === 1 && !coords) capture() }, [step])
  function addMember() { if (!nm.trim()) return; setTeam(t => t.concat([{ name: nm.trim(), role: nr.trim() || 'Field Monitor' }])); setNm(''); setNr('') }
  function removeMember(i) { setTeam(t => t.filter((_, x) => x !== i)) }

  async function save() {
    if (!greeted) { setMsg('Confirm the greeting to continue.'); return }
    setBusy(true); setMsg('')
    try {
      await VIS.add({
        facility_id: facility.id, facility_name: facility.name, area: facility.area || 'Unassigned',
        address: facility.address || '', category: facility.category || '',
        status: 'engaged', arrival_time: (arrival || new Date()).toISOString(),
        lat: coords ? coords.lat : null, lng: coords ? coords.lng : null,
        team, person_in_charge: pic, greeting_confirmed: true
      }, userId)
      setDone(true); toast('Check-in saved.')
    } catch (e) { setMsg(e.message || 'Could not save the check-in.') } finally { setBusy(false) }
  }
  function reset() { setStep(0); setFacility(null); setArrival(null); setCoords(null); setGeoMsg(''); setTeam([{ name: identity.name, role: roleLabel }]); setPic({ name: '', role: '', phone: '' }); setGreeted(false); setDone(false); setMsg('') }

  if (done) {
    return (<div className="page"><div className="engage-done anim">
      <span className="done-badge">Engaged</span>
      <h2>Check-in complete</h2>
      <p>{facility.name} &middot; {dateStr}</p>
      <p className="muted">The assessment checklist unlocks in Stage 5. This visit is saved and ready.</p>
      <button className="btn primary" onClick={reset}>New check-in</button>
    </div></div>)
  }

  const steps = ['Facility', 'Check-in', 'Present', 'Greeting']
  return (<div className="page engage">
    <div className="ptitle"><div><p className="eyebrow">Engage</p><h2>Arrival check-in</h2></div></div>
    <ol className="stepper">{steps.map((s, i) => (<li key={s} className={'stp' + (i === step ? ' on' : '') + (i < step ? ' done' : '')}><span>{i + 1}</span>{s}</li>))}</ol>
    {msg && <p className="auth-msg block">{msg}</p>}

    {step === 0 && (<div className="engage-pick">
      {myDay.length > 0 && (<div className="myday">
        <div className="myday-head"><h3>Your day, {todayStr}</h3><span className="plan-count">{myDay.length} assigned</span></div>
        <div className="frows">{myDay.map(f => (<button className="frow pickable" key={'my' + f.id} onClick={() => chooseFacility(f)}>
          <div className="fmain"><span className="fname">{f.name}</span><span className="fmeta">{[f.category, f.address].filter(Boolean).join(' \u00b7 ') || 'No details'}{visitedToday[f.id] ? ' \u00b7 checked in' : ''}</span></div>
          <span className={'mini' + (visitedToday[f.id] ? ' ok' : '')}>{visitedToday[f.id] ? 'Done' : 'Start'}</span>
        </button>))}</div>
      </div>)}
      {list.length === 0 ? <p className="empty">No facilities yet. Add them on the Facilities tab first.</p> :
        areaKeys.map(a => (<div className="cluster" key={a}>
          <div className="cluster-head"><h3>{a}</h3><span className="cluster-count">{groups[a].length}</span></div>
          <div className="frows">{groups[a].map(f => (<button className="frow pickable" key={f.id} onClick={() => chooseFacility(f)}>
            <div className="fmain"><span className="fname">{f.name}</span><span className="fmeta">{[f.category, f.address].filter(Boolean).join(' \u00b7 ') || 'No details'}</span></div>
            <span className="mini">Select</span>
          </button>))}</div>
        </div>))}
    </div>)}

    {step === 1 && facility && (<div className="engage-card">
      <p className="eyebrow">Confirm arrival</p>
      <h3 className="fbig">{facility.name}</h3>
      <p className="fsub">{[facility.category, facility.area, facility.address].filter(Boolean).join(' \u00b7 ')}</p>
      <div className="ci-row"><span>Arrival time</span><em>{new Date().toLocaleTimeString('en-GB')}</em></div>
      <div className="ci-row"><span>Location</span><em>{coords ? (coords.lat + ', ' + coords.lng) : 'Required \u2014 not captured'}</em></div>
      {geoMsg && <p className="hintline">{geoMsg}</p>}
      {!coords && <p className="hintline req">GPS is mandatory at check-in.</p>}
      <div className="btnrow"><button className="btn small ghost" onClick={capture}>{coords ? 'Re-capture location' : 'Capture location'}</button>
        <button className="btn small ghost" onClick={() => setStep(0)}>Back</button>
        <button className="btn small primary" onClick={checkIn} disabled={!coords}>Confirm and continue</button></div>
    </div>)}

    {step === 2 && facility && (<div className="engage-present">
      <div className="letter">
        <div className="letter-head"><img src="/rhsc-mark.png" alt="RHSC" /><div><strong>REALMS HEALTHCARE SERVICES CONSULTING LIMITED</strong><span>In collaboration with HEFAMAA, Lagos State</span></div></div>
        <div className="letter-meta"><span>Ref: {ref}</span><span>{dateStr}</span></div>
        <p className="letter-to">The Proprietor / Person in Charge<br />{facility.name}<br />{[facility.area, 'Lagos State'].filter(Boolean).join(', ')}</p>
        <p className="letter-sub"><strong>RE: ROUTINE HEALTH FACILITY MONITORING</strong></p>
        <p>This is to introduce the REALMS Healthcare Services Consulting Limited monitoring team, authorised to conduct routine monitoring of this facility in collaboration with the Health Facility Monitoring and Accreditation Agency (HEFAMAA), Lagos State, as mandated by law.</p>
        <p>Your cooperation in supporting a safe, standard and quality assessment is appreciated.</p>
        <p className="letter-sign">{lead ? lead.name : ''}<br /><span>{lead ? lead.role : ''}, for RHSC</span></p>
      </div>
      <div className="present-side">
        <p className="pick-label">Team identification</p>
        <div className="idcards">{team.map((m, i) => (<div key={i} className="idwrap"><IdCard name={m.name} role={i === 0 ? (m.role + ' (Lead)') : m.role} />{i > 0 && <button className="mini danger" onClick={() => removeMember(i)}>Remove</button>}</div>))}</div>
        <div className="addmember"><input placeholder="Name" value={nm} onChange={e => setNm(e.target.value)} /><input placeholder="Role" value={nr} onChange={e => setNr(e.target.value)} /><button className="mini" onClick={addMember}>Add</button></div>
        <p className="pick-label">Introduction script</p>
        <blockquote className="script">{intro}</blockquote>
        <div className="btnrow"><button className="btn small ghost" onClick={() => setStep(1)}>Back</button><button className="btn small primary" onClick={() => setStep(3)}>Continue</button></div>
      </div>
    </div>)}

    {step === 3 && facility && (<div className="engage-card">
      <p className="eyebrow">Person in charge</p>
      <div className="fgrid">
        <label className="field sm"><span>Name</span><input value={pic.name} onChange={e => setPic({ ...pic, name: e.target.value })} /></label>
        <label className="field sm"><span>Role / title</span><input value={pic.role} onChange={e => setPic({ ...pic, role: e.target.value })} placeholder="e.g. Matron" /></label>
        <label className="field sm"><span>Phone</span><input value={pic.phone} onChange={e => setPic({ ...pic, phone: e.target.value })} /></label>
      </div>
      <label className="greet"><input type="checkbox" checked={greeted} onChange={e => setGreeted(e.target.checked)} /><span>I have introduced the team and completed a cordial greeting with the person in charge.</span></label>
      <div className="btnrow"><button className="btn small ghost" onClick={() => setStep(2)}>Back</button><button className="btn small primary" onClick={save} disabled={busy || !greeted}>{busy ? 'Saving\u2026' : 'Complete check-in'}</button></div>
    </div>)}
  </div>)
}

/* ---------- monitor (Stage 5) ---------- */
const CHECKLIST = [
  { id: 'infrastructure', label: 'Infrastructure & environment', items: ['Cleanliness and hygiene', 'Ventilation and lighting', 'Water supply', 'Power supply', 'Waste disposal and sanitation', 'Toilets and patient facilities'] },
  { id: 'infection', label: 'Infection prevention', items: ['Hand hygiene stations', 'Sterilisation and disinfection', 'PPE availability and use', 'Waste segregation'] },
  { id: 'personnel', label: 'Personnel', items: ['Qualified staff on duty', 'Valid professional / practising licences', 'Staff in appropriate uniform', 'Duty rosters displayed', 'Staffing adequate for patient load'] },
  { id: 'equipment', label: 'Equipment', items: ['Essential equipment available', 'Equipment functional and maintained', 'Emergency and basic life-support equipment', 'Medication storage and cold chain'] },
  { id: 'records', label: 'Records', items: ['Patient registers', 'Admission and discharge books', 'Laboratory registers', 'Quality-control and equipment logs', 'Reagent inventory (laboratory)'] },
  { id: 'compliance', label: 'Compliance', items: ['Valid HEFAMAA registration', 'Valid HEFAMAA licence', 'HEFAMAA logo and signage displayed', 'Required permits displayed', 'Qualified personnel on duty', 'Price list displayed'] },
  { id: 'laboratory', label: 'Laboratory & biosafety', items: ['Laboratory services within licensed scope', 'Specimen handling and biosafety', 'Reagent and cold-chain controls'] },
  { id: 'services', label: 'Services', items: ['Services match the licensed category', 'Service scope matches capacity', 'Emergency readiness and referral'] }
]

// Full HEFAMAA Facility Inspection Tool (Primary Health Care) digitised.
// Field: [id, label, type, options?]. Types: yn, ai (adequate), fn (functional),
// av (available), num, txt, ta (notes), sel, chk (multi).
const HEFAMAA_FORM = [
  { id: 'ident', title: 'Facility identification', fields: [
    ['ward', 'Ward', 'txt'], ['lga', 'Local Government Area', 'txt'], ['status', 'Status of establishment', 'sel', ['New', 'Existing']],
    ['reg_no', 'HEFAMAA Reg. Number', 'txt'], ['contact', 'Contact (name, email, phone)', 'txt'], ['hours', 'Days & hours of operation', 'txt'],
    ['interviewed', 'Person(s) interviewed (name, designation)', 'txt'], ['officers', 'HEFAMAA officer(s) & designation', 'txt'], ['departure', 'Departure time (HH:MM)', 'txt'],
    ['estab_type', 'Type of establishment', 'chk', ['Public Comprehensive HC', 'Public PHC', 'Private Clinic/HC', 'Convalescent/Nursing Home', 'Maternity Home', 'Private Hospital', 'Other']],
    ['estab_type_other', 'Other type (specify)', 'txt'], ['branches', 'Any branches?', 'yn'], ['branches_detail', 'Branches: number & locations', 'ta'] ] },
  { id: 'services', title: 'A. Services provided', fields: [
    ['svc_primary', 'Primary healthcare services', 'chk', ['Child Welfare & Immunization', 'Skilled birth delivery', 'General Medical Practice', 'Family Planning', 'HIV Prevention (HCT & PMTCT)', 'TB/DOTS']],
    ['svc_primary_other', 'Other services (specify)', 'txt'], ['svc_support', 'Clinical support services', 'chk', ['Laboratory', 'Ultrasound', 'Pharmaceutical', 'Other']] ] },
  { id: 'gov', title: 'B. Ownership, governance & registration', fields: [
    ['own_type', 'Type of ownership', 'sel', ['Public', 'Private', 'Public Private Partnership', 'Other']], ['own_arrangement', 'If private, ownership arrangement', 'sel', ['Sole proprietorship', 'Group practice', 'Limited Liability Company']],
    ['organogram', 'Organogram present?', 'yn'], ['cac', 'CAC registration status', 'sel', ['Registered', 'Registration in progress', 'Not registered']],
    ['hefamaa_reg', 'HEFAMAA registration status', 'sel', ['Ever Registered', 'Registration in progress', 'Not registered']], ['hefamaa_renewal', 'HEFAMAA renewal status', 'sel', ['Up to date', 'Not up to date']],
    ['hefamaa_last_renewal', 'Last year of renewal', 'txt'], ['gov_comment', 'Comment', 'ta'] ] },
  { id: 'building', title: 'C. Building & designated areas', fields: [
    ['build_type', 'Type of building', 'sel', ['Purpose built', 'Stand alone', 'Shared accommodation', 'Other']],
    ['waiting_size', 'Waiting/Reception adequate in size', 'yn'], ['waiting_equip', 'Waiting/Reception well-equipped', 'yn'],
    ['consult_rooms', 'Number of consulting rooms', 'num'], ['consult_size', 'Consulting room adequate in size', 'yn'], ['consult_equip', 'Consulting room well-equipped', 'yn'],
    ['treat_size', 'Treatment room adequate in size', 'yn'], ['treat_equip', 'Treatment room well-equipped', 'yn'],
    ['wards_size', 'Wards adequate in size', 'yn'], ['wards_equip', 'Wards well-equipped', 'yn'],
    ['labour_size', 'Labour room adequate in size', 'yn'], ['labour_equip', 'Labour room well-equipped', 'yn'],
    ['ventilation', 'Ventilation', 'ai'], ['lighting', 'Lighting', 'ai'], ['painting', 'Painting', 'ai'], ['build_comment', 'Comment', 'ta'] ] },
  { id: 'inpatient', title: 'D. Observation / inpatient care', fields: [
    ['inpatient', 'Provides inpatient care', 'yn'], ['beds_no', 'Number of beds (if inpatient)', 'num'], ['obs_beds', 'Number of observation beds (if no)', 'num'],
    ['beds_functional', 'Beds functional', 'num'], ['beds_nonfunctional', 'Beds non-functional', 'num'], ['bed_space', 'One-metre space between beds', 'yn'],
    ['mattresses', 'Mattresses & pillows', 'fn'], ['mackintosh', 'Covered with mackintosh', 'yn'], ['inpatient_comment', 'Comment', 'ta'] ] },
  { id: 'maternity', title: 'E. Maternity', fields: [
    ['delivery_bed', 'Delivery bed with stirrups', 'fn'], ['delivery_bed_no', 'Delivery beds (number)', 'num'], ['angle_lamp', 'Angle poise lamp', 'fn'],
    ['resuscitaire', 'Resuscitaire (mucus extractor, ambu bag, table, lamp)', 'fn'], ['suction_manual', 'Suction machine — manual', 'fn'], ['suction_auto', 'Suction machine — automatic', 'fn'],
    ['suturing', 'Suturing materials', 'av'], ['oxygen_cylinder', 'Oxygen cylinder with accessories', 'av'], ['oxygen_concentrator', 'Oxygen concentrator', 'av'],
    ['pinard', 'Pinard fetoscope', 'yn'], ['sonicaid', 'Sonicaid', 'yn'], ['mag_sulphate', 'Magnesium sulphate', 'yn'], ['misoprostol', 'Misoprostol', 'yn'], ['antishock', 'Anti-shock garment', 'yn'],
    ['delivery_packs', 'Delivery packs (min 3)', 'yn'], ['baby_cots', 'Baby cots', 'fn'], ['baby_cots_no', 'Baby cots (number functional)', 'num'], ['infant_id', 'Infant ID bracelets', 'yn'], ['maternity_comment', 'Comment', 'ta'] ] },
  { id: 'emergency', title: 'F. Emergency & referral', fields: [
    ['bls_trained', 'Personnel trained on BLS', 'yn'], ['mnch_trained', 'Personnel trained on MNCH emergencies', 'yn'], ['emerg_equip', 'Emergency equipment available & functional', 'yn'],
    ['emerg_tray', 'Emergency tray contents', 'ai'], ['referral_system', 'Referral system in place', 'yn'], ['ambulance', 'Ambulance services accessible', 'yn'], ['emergency_comment', 'Comment', 'ta'] ] },
  { id: 'sterilization', title: 'G. Sterilization / infection control', fields: [
    ['steril_area', 'Designated sterilization area', 'av'], ['autoclave', 'Functional autoclave', 'yn'], ['steril_drum', 'Sterilization drum', 'yn'], ['indicator_tape', 'Use of indicator tape', 'yn'],
    ['steril_other', 'Other methods (specify)', 'txt'], ['ppe', 'Personal protective equipment', 'ai'], ['steril_comment', 'Comment', 'ta'] ] },
  { id: 'handwash', title: 'H. Hand washing facilities', fields: [
    ['hw_treatment', 'Treatment room', 'ai'], ['hw_consulting', 'Consulting room', 'ai'], ['hw_wards', 'Wards', 'ai'], ['hw_records', 'Health records', 'ai'], ['hw_labour', 'Labour room', 'ai'], ['hw_lab', 'Laboratory', 'ai'], ['hw_comment', 'Comment', 'ta'] ] },
  { id: 'records', title: 'I. Health records', fields: [
    ['rec_type', 'Records type', 'sel', ['Paper-based', 'Digital', 'Both']], ['rec_secured', 'Secured location', 'yn'], ['rec_shelving', 'Shelving', 'yn'], ['rec_filing', 'Filing', 'yn'],
    ['nhmis', 'NHMIS registers available', 'yn'], ['hmis_monthly', 'HMIS data submitted monthly', 'yn'], ['records_comment', 'Comment', 'ta'] ] },
  { id: 'lab', title: 'J. Diagnostic services — laboratory', fields: [
    ['lab_type', 'Type of laboratory', 'sel', ['Commercial (standalone)', 'Hospital Lab', 'Side Lab', 'None']], ['lab_tests', 'Laboratory investigations (list)', 'ta'],
    ['lab_personnel', 'Personnel in charge', 'chk', ['Pathologist', 'Med. Lab. Scientist', 'Med. Lab. Tech.', 'Other']], ['lab_equip', 'Lab equipment adequacy', 'ai'], ['lab_equip_list', 'Lab equipment sighted & functionality', 'ta'],
    ['lab_power', 'Power supply', 'ai'], ['lab_waste', 'Waste management', 'ai'], ['lab_illum', 'Illumination', 'ai'], ['lab_water', 'Water supply', 'ai'], ['lab_ppe', 'PPE', 'ai'], ['lab_comment', 'Comment', 'ta'],
    ['ultrasound', 'Provides ultrasound services', 'yn'], ['ultrasound_by', 'Ultrasound provided by', 'chk', ['Radiologist', 'Sonographer', 'Sonologist', 'Other']] ] },
  { id: 'medication', title: 'K. Medication management', fields: [
    ['pharmacy', 'Functional pharmacy or dispensary', 'yn'], ['pharmacy_type', 'Pharmacy or dispensary (specify)', 'txt'], ['pharm_personnel', 'Personnel in charge', 'chk', ['Pharmacist', 'Pharm. Technician']],
    ['counselling_area', 'Counselling area', 'yn'], ['compounding_area', 'Compounding area', 'yn'], ['dispensing_size', 'Dispensing room adequate (min 30 sq m)', 'yn'], ['pharm_arranged', 'Well arranged, adequate ventilation', 'yn'],
    ['pharm_illum', 'Illumination', 'ai'], ['formulary', 'Drug formulary (EMDEX, BNF)', 'yn'], ['room_temp_charts', 'Room temperature charts', 'yn'], ['fridge', 'Functional fridge', 'yn'], ['fridge_charts', 'Fridge temperature charts (incl vaccines)', 'yn'],
    ['dda', 'Lockable DDA cupboard & register', 'yn'], ['expired_disposal', 'Disposal of expired drugs', 'ai'], ['pharm_ppe', 'Appropriate use of PPE', 'yn'], ['pharm_fire', 'Fire-fighting equipment', 'yn'], ['medication_comment', 'Comment', 'ta'] ] },
  { id: 'catering', title: 'L. Catering services', fields: [
    ['catering', 'Catering services provided', 'yn'], ['catering_type', 'Catering type', 'sel', ['In-house', 'Outsourced', 'N/A']], ['kitchen_clean', 'Kitchen clean', 'yn'], ['kitchen_vent', 'Kitchen well-ventilated', 'yn'],
    ['kitchen_equip', 'Kitchen well-equipped', 'yn'], ['kitchen_fire', 'Fire blanket & extinguisher', 'yn'], ['kitchen_alarm', 'Fire alarm functional', 'yn'], ['food_handlers', 'Food handlers test evidence', 'yn'], ['catering_comment', 'Comment', 'ta'] ] },
  { id: 'environment', title: 'M. Environment & amenities', fields: [
    ['gen_ventilation', 'General ventilation', 'ai'], ['gen_illum', 'Illumination', 'ai'], ['electricity', 'Main source of electricity', 'sel', ['PHCN', 'Other']], ['alt_power', 'Alternate power supply', 'yn'],
    ['alt_power_type', 'Alternate power type', 'chk', ['Generator', 'Inverter', 'Solar', 'Other']], ['water_supply', 'Portable water supply', 'yn'], ['water_source', 'Source(s) of water', 'chk', ['Pipe borne', 'Borehole', 'Well', 'Vendor', 'Other']],
    ['toilets_available', 'Toilets available (cistern)', 'num'], ['toilets_functional', 'Toilets functional', 'num'], ['toilets_staff', 'Toilets for staff', 'ai'], ['toilets_opd', 'Toilets for OPD', 'ai'], ['toilets_inpatient', 'Toilets for inpatients', 'ai'],
    ['wash_basin', 'Wash hand basin with running water', 'yn'], ['cleaning_agents', 'Cleaning agents & disinfectant', 'yn'], ['antibac_wash', 'Anti-bacterial hand wash', 'yn'], ['toilet_roll', 'Toilet roll', 'yn'], ['pedal_bin', 'Pedal bin lined with nylon', 'yn'],
    ['serviette', 'Serviette / single-use hand towel', 'yn'], ['shower', 'Shower with running water', 'yn'], ['drainage', 'External drainage (gutter)', 'yn'], ['drainage_covered', 'Drainage covered', 'yn'], ['env_comment', 'Comment', 'ta'] ] },
  { id: 'waste', title: 'Waste management', fields: [
    ['lawma_psp', 'Registered with LAWMA PSP', 'yn'], ['lawma_medical', 'Registered with LAWMA Medical', 'yn'], ['sharps_container', 'Correct bin & sharps container', 'yn'], ['waste_segregation', 'Proper waste segregation', 'yn'],
    ['coloured_bags', 'Coloured bags available', 'chk', ['Black', 'Yellow', 'Red', 'Brown', 'Safety sharp box']], ['collection_point', 'Final collection point', 'ai'], ['domestic_waste', 'Domestic waste management', 'ai'], ['medical_waste', 'Medical waste management', 'ai'], ['waste_comment', 'Comment', 'ta'] ] },
  { id: 'fire', title: 'N. Fire safety', fields: [
    ['fire_cert', 'Fire service certification', 'av'], ['fire_equip', 'Fire-fighting equipment', 'yn'], ['fire_service_history', 'Service history', 'yn'], ['fire_exits', 'Two labelled exits', 'yn'], ['muster_point', 'Muster / assembly point', 'av'], ['fire_comment', 'Comment', 'ta'] ] },
  { id: 'staffing', title: 'O. Staffing', fields: [
    ['qip', 'Quality improvement programme', 'yn'], ['update_training', 'Regular update training', 'yn'], ['duty_roster', 'Duty roster available', 'yn'], ['adequate_staff', 'Adequate number of qualified personnel', 'yn'], ['staff_shortfall', 'If no, personnel type lacking', 'txt'],
    ['doctors_ft', 'Doctors (full time)', 'num'], ['doctors_pt', 'Doctors (part time)', 'num'], ['nurses_ft', 'Nurses (full time)', 'num'], ['nurses_pt', 'Nurses (part time)', 'num'], ['others_ft', 'Other staff (full time)', 'num'], ['others_pt', 'Other staff (part time)', 'num'],
    ['staff_complement', 'Staff complement (name, reg no, designation, specialty)', 'ta'], ['staffing_comment', 'Comment', 'ta'] ] },
  { id: 'submission', title: 'Inspection report (for HEFAMAA submission)', fields: [
    ['address', 'Facility address', 'txt'], ['schedule', 'Facility schedule (category)', 'txt'], ['opening', 'Opening schedule', 'txt'],
    ['services_rendered', 'Services rendered', 'ta'], ['total_staff', 'Total staff strength & breakdown', 'ta'], ['staff_on_duty', 'Staff met on duty', 'ta'], ['basic_equipment', 'Basic equipment available', 'ta'],
    ['wards_no', '# of Wards', 'txt'], ['treatment_room', 'Treatment room', 'txt'], ['environment', 'Environment', 'txt'], ['waste_mgmt', 'Waste management', 'txt'], ['observation', 'Observation (gaps)', 'ta'], ['other_notes', 'Others', 'ta'] ] }
]
const HEF_TYPES = { yn: ['Yes', 'No'], ai: ['Adequate', 'Inadequate'], fn: ['Functional', 'Non-functional'], av: ['Available', 'Not available'] }
function ragWeight(r) { return r === 'green' ? 2 : r === 'amber' ? 1 : 0 }
function ragFromPct(pct) { return pct == null ? null : pct >= 80 ? 'green' : pct >= 50 ? 'amber' : 'red' }
function computeScore(data) {
  let sum = 0, max = 0, rated = 0
  CHECKLIST.forEach(cat => cat.items.forEach((_, i) => { const it = data[cat.id + '_' + i]; if (it && it.rating) { rated++; max += 2; sum += ragWeight(it.rating) } }))
  const pct = max ? Math.round(sum / max * 100) : null
  return { pct, rag: ragFromPct(pct), rated }
}
function categoryScore(data, cat) {
  let sum = 0, max = 0, rated = 0
  cat.items.forEach((_, i) => { const it = data[cat.id + '_' + i]; if (it && it.rating) { rated++; max += 2; sum += ragWeight(it.rating) } })
  const pct = max ? Math.round(sum / max * 100) : null
  return { pct, rag: ragFromPct(pct), rated, total: cat.items.length }
}
function downscaleImage(file, maxW = 1100, quality = 0.6) {
  return new Promise((res, rej) => {
    const img = new Image(); const url = URL.createObjectURL(file)
    img.onload = () => {
      const scale = Math.min(1, maxW / img.width); const w = Math.round(img.width * scale), h = Math.round(img.height * scale)
      const c = document.createElement('canvas'); c.width = w; c.height = h; c.getContext('2d').drawImage(img, 0, 0, w, h)
      URL.revokeObjectURL(url); res(c.toDataURL('image/jpeg', quality))
    }
    img.onerror = () => { URL.revokeObjectURL(url); rej(new Error('image error')) }
    img.src = url
  })
}

function Rag({ value, onChange }) {
  return (<div className="rag">{[['green', 'G'], ['amber', 'A'], ['red', 'R']].map(([v, l]) => (
    <button key={v} type="button" aria-label={v} title={v[0].toUpperCase() + v.slice(1)} aria-pressed={value === v} className={'ragb ' + v + (value === v ? ' on' : '')} onClick={() => onChange(value === v ? null : v)}>{l}</button>
  ))}</div>)
}
function Chip({ rag, pct }) {
  const label = rag ? (rag === 'green' ? 'Green' : rag === 'amber' ? 'Amber' : 'Red') : 'Not rated'
  return (<span className={'chip ' + (rag || 'none')}>{label}{pct != null ? ' \u00b7 ' + pct + '%' : ''}</span>)
}
function VoiceButton({ onClip }) {
  const [rec, setRec] = useState(false); const mrRef = useRef(null); const chunks = useRef([])
  async function toggle() {
    if (rec) { if (mrRef.current) mrRef.current.stop(); return }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mr = new MediaRecorder(stream); mrRef.current = mr; chunks.current = []
      mr.ondataavailable = e => { if (e.data && e.data.size) chunks.current.push(e.data) }
      mr.onstop = () => { const blob = new Blob(chunks.current, { type: 'audio/webm' }); const fr = new FileReader(); fr.onload = () => onClip(fr.result); fr.readAsDataURL(blob); stream.getTracks().forEach(t => t.stop()); setRec(false) }
      mr.start(); setRec(true)
    } catch (e) { window.alert('Microphone not available on this device.') }
  }
  return <button type="button" className={'ev-btn' + (rec ? ' recording' : '')} onClick={toggle}>{rec ? 'Stop' : 'Voice'}</button>
}

function Seg({ options, value, onChange }) {
  return (<div className="seg">{options.map(o => (<button type="button" key={o} className={'segb' + (value === o ? ' on' : '')} onClick={() => onChange(value === o ? '' : o)}>{o}</button>))}</div>)
}
function HefField({ f, value, onChange }) {
  const id = f[0], label = f[1], type = f[2], opts = f[3]
  let control
  if (HEF_TYPES[type]) control = <Seg options={HEF_TYPES[type]} value={value || ''} onChange={onChange} />
  else if (type === 'num') control = <input type="number" className="hef-input" value={value || ''} onChange={e => onChange(e.target.value)} />
  else if (type === 'txt') control = <input className="hef-input" value={value || ''} onChange={e => onChange(e.target.value)} />
  else if (type === 'ta') control = <textarea className="hef-input" rows="2" value={value || ''} onChange={e => onChange(e.target.value)} />
  else if (type === 'sel') control = <select className="hef-input" value={value || ''} onChange={e => onChange(e.target.value)}><option value="">—</option>{opts.map(o => <option key={o} value={o}>{o}</option>)}</select>
  else if (type === 'chk') { const arr = Array.isArray(value) ? value : []; control = <div className="chks">{opts.map(o => { const on = arr.includes(o); return <label key={o} className={'chkpill' + (on ? ' on' : '')}><input type="checkbox" checked={on} onChange={() => onChange(on ? arr.filter(x => x !== o) : arr.concat([o]))} />{o}</label> })}</div> }
  return (<div className="hef-field"><span className="hef-label">{label}</span>{control}</div>)
}
function hefAnswered(sec, hef) { return sec.fields.filter(f => { const v = hef[f[0]]; return Array.isArray(v) ? v.length : (v != null && v !== '') }).length }
function HefammaForm({ value, onChange }) {
  const hef = value || {}
  const set = (id, val) => onChange({ ...hef, [id]: val })
  return (<div className="hef-form">{HEFAMAA_FORM.map(sec => (
    <details className="hef-sec" key={sec.id}>
      <summary><span>{sec.title}</span><span className="hef-count">{hefAnswered(sec, hef)}/{sec.fields.length}</span></summary>
      <div className="hef-fields">{sec.fields.map(f => <HefField key={f[0]} f={f} value={hef[f[0]]} onChange={val => set(f[0], val)} />)}</div>
    </details>
  ))}</div>)
}

function DictateButton({ onText }) {
  const [rec, setRec] = useState(false); const ref = useRef(null)
  function toggle() {
    const SR = (typeof window !== 'undefined') && (window.SpeechRecognition || window.webkitSpeechRecognition)
    if (!SR) { toast('Voice typing is not supported on this browser. Try Chrome.', 'warn'); return }
    if (rec && ref.current) { ref.current.stop(); return }
    const r = new SR(); r.lang = 'en-NG'; r.interimResults = false; r.continuous = false
    r.onresult = e => { const txt = Array.from(e.results).map(x => x[0].transcript).join(' '); onText(txt) }
    r.onend = () => setRec(false); r.onerror = () => setRec(false)
    ref.current = r; setRec(true); r.start()
  }
  return <button type="button" className={'mini dictate' + (rec ? ' rec' : '')} onClick={toggle} title="Dictate a note">{rec ? '\u25cf Listening' : '\u25cf Dictate'}</button>
}
function MonitorPage({ userId }) {
  const [visits, setVisits] = useState([])
  const [active, setActive] = useState(null)
  const [data, setData] = useState({})
  const [online, setOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true)
  const [saveState, setSaveState] = useState('')
  const [busy, setBusy] = useState(false); const [msg, setMsg] = useState('')
  const [geo, setGeo] = useState(null)
  const [profile, setProfile] = useState({})
  const [hef, setHef] = useState({})
  const [q, setQ] = useState('')
  const [lightbox, setLightbox] = useState(null)
  const [hefCheck, setHefCheck] = useState('')

  useEffect(() => { VIS.list().then(setVisits).catch(() => {}) }, [])
  useEffect(() => { const on = () => setOnline(true), off = () => setOnline(false); window.addEventListener('online', on); window.addEventListener('offline', off); return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off) } }, [])
  useEffect(() => { if (navigator.geolocation) navigator.geolocation.getCurrentPosition(p => setGeo({ lat: +p.coords.latitude.toFixed(6), lng: +p.coords.longitude.toFixed(6) }), () => {}) }, [])

  const draftKey = active ? 'realms_monitor_' + active.id : ''
  useEffect(() => { if (!active) return; try { localStorage.setItem(draftKey, JSON.stringify({ items: data })) } catch (e) {} }, [data, active])

  function open(v) {
    setMsg(''); let d = (v.monitoring && v.monitoring.items) || {}
    try { const raw = localStorage.getItem('realms_monitor_' + v.id); if (raw) { const p = JSON.parse(raw); if (p && p.items) d = p.items } } catch (e) {}
    setActive(v); setData(d); setProfile((v.monitoring && v.monitoring.profile) || {}); setHef((v.monitoring && v.monitoring.hefamaa) || {}); setSaveState('')
  }
  function setProfileField(k, val) { setProfile(p => ({ ...p, [k]: val })); setSaveState('draft') }
  function setItem(key, patch) { setData(d => ({ ...d, [key]: { ...(d[key] || { rating: null, note: '', evidence: [] }), ...patch } })); setSaveState('draft') }
  function addEvidence(key, type, url) { setData(d => { const it = d[key] || { rating: null, note: '', evidence: [] }; const ev = (it.evidence || []).concat([{ type, data: url, at: new Date().toISOString(), lat: geo ? geo.lat : null, lng: geo ? geo.lng : null }]); return { ...d, [key]: { ...it, evidence: ev } } }); setSaveState('draft') }
  function removeEvidence(key, idx) { setData(d => { const it = d[key]; if (!it) return d; return { ...d, [key]: { ...it, evidence: it.evidence.filter((_, i) => i !== idx) } } }); setSaveState('draft') }
  async function onPickImage(key, type, file) { if (!file) return; try { const dataUrl = await downscaleImage(file); const stored = await uploadEvidence(active.id, type, dataUrl); addEvidence(key, type, stored) } catch (e) { setMsg('Could not process the image.') } }

  const score = computeScore(data)
  const totalItems = CHECKLIST.reduce((n, c) => n + c.items.length, 0)

  function requirements() {
    const noPhoto = [], noVoice = []
    CHECKLIST.forEach(cat => {
      let hasVoice = false, hasRating = false
      cat.items.forEach((label, i) => {
        const it = data[cat.id + '_' + i]; if (!it) return
        if (it.rating) hasRating = true
        if ((it.evidence || []).some(e => e.type === 'voice')) hasVoice = true
        if (it.rating === 'red' && !(it.evidence || []).some(e => e.type === 'photo')) noPhoto.push(cat.label + ': ' + label)
      })
      if (hasRating && !hasVoice) noVoice.push(cat.label)
    })
    return { noPhoto, noVoice }
  }

  async function save() {
    if (!active) return
    const req = requirements()
    if (req.noPhoto.length || req.noVoice.length) {
      const parts = []
      if (req.noPhoto.length) parts.push('add a photo on red items (' + req.noPhoto.join('; ') + ')')
      if (req.noVoice.length) parts.push('add a voice note for ' + req.noVoice.join(', '))
      setMsg('Before saving, please ' + parts.join(', and ') + '.')
      return
    }
    setBusy(true); setMsg('')
    const payload = { items: data, profile, hefamaa: hef, score: score.pct, overallRating: score.rag, updatedAt: new Date().toISOString() }
    try {
      await VIS.update(active.id, { monitoring: payload, score: score.pct, overall_rating: score.rag, status: 'monitored' })
      try { localStorage.removeItem(draftKey) } catch (e) {}
      setSaveState('saved'); setMsg('Assessment saved.'); toast('Assessment saved.')
      setVisits(vs => vs.map(v => v.id === active.id ? { ...v, monitoring: payload, score: score.pct, overall_rating: score.rag, status: 'monitored' } : v))
    } catch (e) { setSaveState('pending'); setMsg('Saved locally. It will sync when you are back online; use Sync now to retry.') }
    finally { setBusy(false) }
  }

  if (!active) {
    const monVisits = visits.filter(v => matchQ(v, q))
    return (<div className="page">
      <div className="ptitle"><div><p className="eyebrow">Monitor</p><h2>Assessments</h2></div>
        <span className={'net ' + (online ? 'on' : 'off')}>{online ? 'Online' : 'Offline'}</span></div>
      {visits.length > 0 && <div className="list-tools"><SearchBox value={q} onChange={setQ} placeholder="Search facilities…" /></div>}
      {monVisits.length === 0 ? <p className="empty">{visits.length === 0 ? 'No visits yet. Complete an Engage check-in first.' : 'No visits match your search.'}</p> :
        <div className="mon-list">{monVisits.map(v => (
          <button className="mon-row" key={v.id} onClick={() => open(v)}>
            <div><span className="fname">{v.facility_name}</span><span className="fmeta">{v.area} &middot; {(v.arrival_time || v.created_at || '').slice(0, 10)}</span></div>
            <div className="mon-right">{v.score != null ? <Chip rag={v.overall_rating} pct={v.score} /> : <span className={'chip ' + (v.status || 'engaged')}>{v.status === 'monitored' ? 'Assessed' : 'Ready'}</span>}<span className="mini">{v.status === 'monitored' ? 'Review' : 'Assess'}</span></div>
          </button>
        ))}</div>}
    </div>)
  }

  return (<div className="page monitor">
    <div className="mon-head">
      <div className="mon-head-l">
        <button className="linkbtn subtle" onClick={() => setActive(null)}>&larr; All assessments</button>
        <h2>{active.facility_name}</h2>
        <p className="fsub">{active.area} &middot; arrival {(active.arrival_time || '').slice(11, 16) || 'logged'}</p>
      </div>
      <div className="mon-head-r">
        <span className={'net ' + (online ? 'on' : 'off')}>{online ? 'Online' : 'Offline'}</span>
        <Chip rag={score.rag} pct={score.pct} />
        <span className="rated">{score.rated}/{totalItems} rated</span>
      </div>
    </div>
    {(() => { const hefTotal = HEFAMAA_FORM.reduce((n, s) => n + s.fields.length, 0); const hefDone = HEFAMAA_FORM.reduce((n, s) => n + hefAnswered(s, hef), 0); const ragPct = Math.round((score.rated / totalItems) * 100); const hefPct = Math.round((hefDone / hefTotal) * 100); return (
      <div className="mon-meter">
        <div className="meter-row"><span className="meter-lab">Ratings</span><div className="meter-track"><div className="meter-fill" style={{ width: ragPct + '%' }} /></div><span className="meter-val">{score.rated}/{totalItems}</span></div>
        <div className="meter-row"><span className="meter-lab">HEFAMAA form</span><div className="meter-track"><div className="meter-fill alt" style={{ width: hefPct + '%' }} /></div><span className="meter-val">{hefDone}/{hefTotal}</span></div>
      </div>) })()}
    {msg && <p className="auth-msg block">{msg}</p>}
    <p className="mon-rules">Evidence rules: a photo on every red item, a voice note per category, and GPS captured at check-in.</p>

    <details className="hef-wrap" open>
      <summary className="hef-title"><span>HEFAMAA facility inspection form</span><span className="hef-total">{HEFAMAA_FORM.reduce((n, s) => n + hefAnswered(s, hef), 0)}/{HEFAMAA_FORM.reduce((n, s) => n + s.fields.length, 0)}</span></summary>
      <p className="hintline">The full Lagos HEFAMAA inspection tool. Complete each section as you would on the paper form; every section is saved with the visit.</p>
      <div className="ai-row"><AIButton label="AI consistency check" build={() => ({ system: 'You review a HEFAMAA facility inspection form for internal contradictions, missing critical items, and implausible entries. List up to 6 short, specific issues as bullets. If none, say the form looks consistent. Use only the data.', prompt: JSON.stringify(hef), max_tokens: 500 })} onText={txt => setHefCheck(txt)} /></div>
      {hefCheck && <div className="ai-panel"><h4><span className="ai-spark">✦</span> Consistency check</h4><p className="ai-text">{hefCheck}</p><button className="linkbtn subtle" onClick={() => setHefCheck('')}>Dismiss</button></div>}
      <HefammaForm value={hef} onChange={setHef} />
    </details>

    <div className="rag-summary-head"><h3>Compliance rating summary</h3><p className="hintline">A quick RAG rating that drives the score, debrief and reports.</p></div>

    {CHECKLIST.map(cat => {
      const cs = categoryScore(data, cat)
      const catRated = cat.items.some((_, i) => { const it = data[cat.id + '_' + i]; return it && it.rating })
      const catVoice = cat.items.some((_, i) => { const it = data[cat.id + '_' + i]; return it && (it.evidence || []).some(e => e.type === 'voice') })
      return (<div className="mcat" key={cat.id}>
        <div className="mcat-head"><h3>{cat.label}</h3><div className="mcat-r">{catRated && !catVoice && <span className="need">Voice note needed</span>}{catVoice && <span className="ok">Voice &#10003;</span>}<Chip rag={cs.rag} pct={cs.pct} /></div></div>
        <div className="mitems">{cat.items.map((label, i) => {
          const key = cat.id + '_' + i; const it = data[key] || { rating: null, note: '', evidence: [] }
          const needPhoto = it.rating === 'red' && !(it.evidence || []).some(e => e.type === 'photo')
          return (<div className={'mitem' + (needPhoto ? ' flag' : '')} key={key}>
            <div className="mitem-top"><span className="mlabel">{label}</span><Rag value={it.rating} onChange={r => setItem(key, { rating: r })} /></div>
            <div className="mnote-row"><textarea className="mnote" rows="1" placeholder="Note (optional)" value={it.note || ''} onChange={e => setItem(key, { note: e.target.value })} /><DictateButton onText={txt => setItem(key, { note: ((it.note || '') + (it.note ? ' ' : '') + txt) })} /></div>
            <div className="evrow">
              <label className={'ev-btn' + (needPhoto ? ' urgent' : '')}>Photo<input type="file" accept="image/*" capture="environment" onChange={e => { onPickImage(key, 'photo', e.target.files[0]); e.target.value = '' }} /></label>
              <label className="ev-btn">Scan<input type="file" accept="image/*" onChange={e => { onPickImage(key, 'scan', e.target.files[0]); e.target.value = '' }} /></label>
              <VoiceButton onClip={async url => { const stored = await uploadEvidence(active.id, 'voice', url); addEvidence(key, 'voice', stored) }} />
              {geo && <span className="geotag">geotag on</span>}
              {needPhoto && <span className="need">Photo required</span>}
            </div>
            {it.evidence && it.evidence.length > 0 && (<div className="evstrip">{it.evidence.map((ev, ei) => (
              <div className="evthumb" key={ei}>
                {ev.type === 'voice' ? <audio controls src={ev.data} /> : <img src={ev.data} alt={ev.type} onClick={() => setLightbox(ev.data)} style={{ cursor: 'zoom-in' }} />}
                {ev.type !== 'voice' && <AIButton className="mini ev-ai" label="AI check" busyLabel="Checking" build={() => ({ system: 'You are a HEFAMAA monitoring officer reviewing an evidence photo from a health facility. In 1 to 2 sentences note visible compliance issues (hygiene, PPE, waste, equipment, signage, cold chain) or say it looks acceptable. Be specific and cautious; do not overstate.', prompt: 'Category: ' + cat.label + '; item: ' + label + '. Note compliance-relevant observations.', image: ev.data, max_tokens: 200 })} onText={txt => setItem(key, { note: ((it.note || '') + (it.note ? '\n' : '') + 'AI: ' + txt) })} />}
                <button className="evx" onClick={() => removeEvidence(key, ei)}>&times;</button>
              </div>
            ))}</div>)}
          </div>)
        })}</div>
      </div>)
    })}

    <div className="mon-actions">
      <button className="btn primary" onClick={save} disabled={busy}>{busy ? 'Saving\u2026' : 'Save assessment'}</button>
      {saveState === 'pending' && <button className="btn ghost" onClick={save}>Sync now</button>}
      <span className="save-note">{saveState === 'saved' ? 'Saved' : saveState === 'pending' ? 'Pending sync' : 'Draft saved on this device'}</span>
    </div>
    <p className="hintline">The debrief, e-signature and report generation follow in Stage 6.</p>
    {lightbox && <div className="lightbox" onClick={() => setLightbox(null)}><img src={lightbox} alt="Evidence" /><button className="lightbox-x" onClick={() => setLightbox(null)} aria-label="Close">&times;</button></div>}
  </div>)
}

/* ---------- debrief (Stage 6) ---------- */
const REINSPECT = ['1 week', '2 weeks', '1 month', '3 months']
function itemMeta(key) { const idx = key.lastIndexOf('_'); const catId = key.slice(0, idx); const i = +key.slice(idx + 1); const cat = CHECKLIST.find(c => c.id === catId); return { category: cat ? cat.label : catId, label: cat ? cat.items[i] : key } }
function ragText(r) { return r === 'green' ? 'Green' : r === 'amber' ? 'Amber' : r === 'red' ? 'Red' : 'Not rated' }

function deriveDebrief(v) {
  const data = (v.monitoring && v.monitoring.items) || {}
  const strengths = [], gaps = []
  Object.keys(data).forEach(k => { const it = data[k]; if (!it || !it.rating) return; const m = itemMeta(k)
    if (it.rating === 'green') strengths.push(m.category + ': ' + m.label)
    else gaps.push({ key: k, category: m.category, label: m.label, rating: it.rating, action: it.note || '', timeline: '2 weeks' })
  })
  return { strengths, gaps }
}

const DOC_CSS = "@import url('https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,400;0,600;1,400&display=swap');*{font-family:'Lora',Georgia,serif;color:#241536;box-sizing:border-box}body{max-width:760px;margin:36px auto;padding:0 24px;line-height:1.6}h1{color:#574277;font-size:23px;margin:14px 0 6px}h2{color:#574277;font-size:15px;margin:22px 0 8px}p{margin:0 0 10px}table{width:100%;border-collapse:collapse;margin:8px 0 14px}th,td{border:1px solid #E4DCEE;padding:8px 10px;text-align:left;font-size:12.5px;vertical-align:top}th{background:#F6F3FA;color:#574277}ul,ol{margin:6px 0 14px;padding-left:20px}li{font-size:13px;margin-bottom:4px}.head{display:flex;align-items:center;gap:12px;border-bottom:2px solid #EDE7F4;padding-bottom:12px;margin-bottom:8px}.chip{display:inline-block;padding:2px 10px;border-radius:12px;font-size:12px;border:1px solid #ccc}.g{background:#E6F4EA;color:#2E7D46;border-color:#BFE3CB}.a{background:#FBF3E6;color:#9A5B12;border-color:#F0D9B5}.r{background:#FBE9E6;color:#B4442E;border-color:#F0C9BF}.muted{color:#7A6A93;font-size:12px}.sig{height:80px;margin:6px 0}.right{text-align:right}@media print{body{margin:0}}"
function chipCls(r) { return r === 'green' ? 'g' : r === 'amber' ? 'a' : r === 'red' ? 'r' : '' }
function printDoc(title, inner) {
  const w = window.open('', '_blank'); if (!w) { window.alert('Please allow pop-ups to open the document, then try again.'); return }
  w.document.write('<html><head><title>' + title + '</title><meta charset="utf-8"><style>' + DOC_CSS + '</style></head><body>' + inner + '</body></html>')
  w.document.close(); w.focus(); setTimeout(() => { try { w.print() } catch (e) {} }, 400)
}
function docHead(origin) {
  return '<div class="head"><img src="' + origin + '/rhsc-mark.png" style="height:44px"><div><strong>REALMS HEALTHCARE SERVICES CONSULTING LIMITED</strong><br><span class="muted">Licensed HEFAMAA monitoring operator, Lagos State</span></div></div>'
}
function inspHead(origin) {
  return '<div class="head" style="justify-content:space-between"><div style="display:flex;align-items:center;gap:12px"><img src="' + origin + '/rhsc-mark.png" style="height:54px"><div><strong style="font-size:14px">HEALTH FACILITY MONITORING AND ACCREDITATION AGENCY (HEFAMAA)</strong><br><span style="color:#574277">Inspection Report (Realms Consulting)</span></div></div><img src="' + origin + '/hefamaa-logo.png" style="height:54px" onerror="this.style.display=\'none\'"></div>'
}
function firstVal() { for (let i = 0; i < arguments.length; i++) { const v = arguments[i]; if (v != null && String(v).trim() !== '') return String(v) } return '' }
function buildInspectionReport(v, d, origin) {
  const hef = (v.monitoring && v.monitoring.hefamaa) || {}
  const date = firstVal(hef.assess_date, (v.arrival_time || v.created_at || '').slice(0, 10))
  const svcList = [].concat(Array.isArray(hef.svc_primary) ? hef.svc_primary : [], Array.isArray(hef.svc_support) ? hef.svc_support : []).join(', ')
  const staffAuto = [hef.doctors_ft && (hef.doctors_ft + ' doctor(s)'), hef.nurses_ft && (hef.nurses_ft + ' nurse(s)'), hef.others_ft && (hef.others_ft + ' other staff')].filter(Boolean).join(', ')
  const renewal = firstVal(hef.hefamaa_renewal ? (hef.hefamaa_renewal + (hef.hefamaa_last_renewal ? ' (' + hef.hefamaa_last_renewal + ')' : '')) : '')
  const gapsText = (d && d.gaps && d.gaps.length) ? d.gaps.map(g => (g.category ? g.category + ': ' : '') + g.label).join('; ') : ''
  const observation = firstVal(hef.observation, d && d.narrative, gapsText)
  const rows = [
    ['General', ''],
    ['Date', date], ['Facility Name', v.facility_name || ''], ['Facility Address', firstVal(hef.address, v.address)],
    ['LGA', v.area || ''], ['Facility Schedule', firstVal(hef.schedule, v.category)], ['Opening Schedule', firstVal(hef.opening, hef.hours)], ['Registration Status', firstVal(hef.registration, hef.hefamaa_reg)],
    ['Findings', ''],
    ['Renewal Status', renewal], ['Services Rendered', firstVal(hef.services_rendered, svcList)], ['Total Staff Strength and Breakdown', firstVal(hef.total_staff, staffAuto)], ['Staff met on duty', firstVal(hef.staff_on_duty)],
    ['Basic Equipment Available', firstVal(hef.basic_equipment)], ['# of Wards', firstVal(hef.wards_no)], ['# of Beds', firstVal(hef.beds_no)], ['# of Toilets', firstVal(hef.toilets_available)],
    ['Observation (Gaps)', observation], ['Environment', firstVal(hef.environment, hef.gen_ventilation)], ['Waste Management', firstVal(hef.waste_mgmt, hef.medical_waste)], ['Treatment Room', firstVal(hef.treatment_room)], ['Others', firstVal(hef.other_notes)]
  ]
  const esc = s => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/\n/g, '<br>')
  const body = rows.map(r => r[1] === '' && (r[0] === 'General' || r[0] === 'Findings') ? '<tr><th colspan="2" style="font-size:13px">' + r[0] + '</th></tr>' : '<tr><td style="width:34%;font-weight:600;color:#574277">' + r[0] + '</td><td>' + esc(r[1]) + '</td></tr>').join('')
  const stamp = (v.approval && v.approval.status === 'approved') ? '<p class="muted" style="border:1px solid #BFE3CB;background:#E6F4EA;color:#2E7D46;border-radius:6px;padding:6px 10px;display:inline-block">Approved for submission by ' + esc(v.approval.by || 'Team Lead') + ' on ' + String(v.approval.at || '').slice(0, 10) + '</p>' : ''
  return inspHead(origin) + '<table style="margin-top:10px">' + body + '</table>' + stamp + (d && d.signature ? '<p class="muted">Proprietor sign-off:</p><img class="sig" src="' + d.signature + '">' : '') + '<p class="muted">Prepared by REALMS Healthcare Services Consulting Limited for HEFAMAA, Lagos State.</p>'
}
function buildWeeklyBatch(visits, origin, from, to) {
  const parts = visits.map((v, i) => '<div style="' + (i ? 'page-break-before:always;' : '') + '">' + buildInspectionReport(v, v.debrief || deriveDebrief(v), origin) + '</div>')
  const idx = '<h1>HEFAMAA submission: ' + from + ' to ' + to + '</h1><p>REALMS Healthcare Services Consulting Limited. ' + visits.length + ' approved inspection report' + (visits.length === 1 ? '' : 's') + '.</p><table><tr><th>#</th><th>Facility</th><th>LGA</th><th>Date</th></tr>' + visits.map((v, i) => '<tr><td>' + (i + 1) + '</td><td>' + v.facility_name + '</td><td>' + (v.area || '') + '</td><td>' + (v.arrival_time || '').slice(0, 10) + '</td></tr>').join('') + '</table>'
  return docHead(origin) + idx + '<div style="page-break-before:always">' + parts.join('') + '</div>'
}
function buildReport(v, d, origin) {
  const data = (v.monitoring && v.monitoring.items) || {}
  const date = (v.arrival_time || v.created_at || '').slice(0, 10)
  const cats = CHECKLIST.map(c => { const cs = categoryScore(data, c); return '<tr><td>' + c.label + '</td><td><span class="chip ' + chipCls(cs.rag) + '">' + ragText(cs.rag) + (cs.pct != null ? ' ' + cs.pct + '%' : '') + '</span></td></tr>' }).join('')
  const strengths = d.strengths.length ? '<ul>' + d.strengths.map(s => '<li>' + s + '</li>').join('') + '</ul>' : '<p class="muted">None recorded.</p>'
  const gaps = d.gaps.length ? '<table><tr><th>Finding</th><th>Rating</th><th>Required action</th><th>Timeline</th></tr>' + d.gaps.map(g => '<tr><td>' + g.category + ': ' + g.label + '</td><td>' + ragText(g.rating) + '</td><td>' + (g.action || '\u2014') + '</td><td>' + (g.timeline || '\u2014') + '</td></tr>').join('') + '</table>' : '<p class="muted">No gaps recorded.</p>'
  const sig = d.signature ? '<img class="sig" src="' + d.signature + '">' : '<p class="muted">Not signed.</p>'
  const pr = (v.monitoring && v.monitoring.profile) || {}
  const profileBits = [pr.wards && (pr.wards + ' wards'), pr.beds && (pr.beds + ' beds'), pr.toilets && (pr.toilets + ' toilets'), pr.staff && (pr.staff + ' staff on duty'), pr.scope].filter(Boolean).join(' &middot; ')
  const profileHtml = profileBits ? '<h2>Facility profile</h2><p>' + profileBits + '</p>' : ''
  const digital = d.genesys_interest ? '<h2>Digital health</h2><p>Facility expressed interest in the Genesys EMR.' + (d.genesys_note ? ' ' + d.genesys_note : '') + '</p>' : ''
  const esc = d.escalated ? '<p class="muted"><strong>Note:</strong> critical finding escalated to HEFAMAA / RHSC HQ.</p>' : ''
  const hef = (v.monitoring && v.monitoring.hefamaa) || {}
  const hefHtml = HEFAMAA_FORM.map(sec => {
    const rows = sec.fields.filter(f => { const val = hef[f[0]]; return Array.isArray(val) ? val.length : (val != null && val !== '') })
      .map(f => '<tr><td>' + f[1] + '</td><td>' + (Array.isArray(hef[f[0]]) ? hef[f[0]].join(', ') : String(hef[f[0]])) + '</td></tr>').join('')
    return rows ? '<h3>' + sec.title + '</h3><table>' + rows + '</table>' : ''
  }).join('')
  const hefSection = hefHtml ? '<h2>HEFAMAA inspection form</h2>' + hefHtml : ''
  const narr = d.narrative ? '<h2>Summary &amp; recommendations</h2><p>' + String(d.narrative).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/\n/g, '<br>') + '</p>' : ''
  return docHead(origin) + '<h1>Health Facility Monitoring Report</h1>' +
    '<p><strong>Facility:</strong> ' + v.facility_name + ' &middot; <strong>Area:</strong> ' + (v.area || '') + '<br><strong>Visit date:</strong> ' + date + ' &middot; <strong>Overall:</strong> <span class="chip ' + chipCls(v.overall_rating) + '">' + ragText(v.overall_rating) + (v.score != null ? ' ' + v.score + '%' : '') + '</span></p>' +
    profileHtml +
    narr +
    '<h2>Assessment by category</h2><table><tr><th>Category</th><th>Rating</th></tr>' + cats + '</table>' +
    '<h2>Strengths</h2>' + strengths +
    '<h2>Gaps and required corrective actions</h2>' + gaps +
    '<h2>Next steps</h2><p>Remediation deadline: ' + (d.remediation_deadline || 'to be set') + '. Re-inspection: ' + (d.reinspection || 'to be scheduled') + '. Compliance letter issued: ' + (d.letter_issued ? 'Yes' : 'No') + '.' + (d.closure_recommended ? ' Closure recommended.' : '') + '</p>' + esc +
    digital +
    '<h2>Debrief and sign-off</h2><p>Person in charge: ' + (d.proprietor_name || '\u2014') + '. Acknowledged: ' + (d.proprietor_ack ? 'Yes' : 'No') + '.</p>' + sig + (d.signed_at ? '<p class="muted">Signed ' + d.signed_at.slice(0, 16).replace('T', ' ') + '</p>' : '') +
    hefSection +
    '<p class="muted">Prepared by REALMS Healthcare Services Consulting Limited in support of the HEFAMAA regulatory mandate. This report is not legal advice.</p>'
}
function buildClosure(v, d, origin) {
  const date = (v.arrival_time || v.created_at || '').slice(0, 10)
  const ref = 'RHSC/CN/' + (v.area || 'LAG').slice(0, 3).toUpperCase() + '/' + date.replace(/-/g, '')
  const grounds = d.gaps && d.gaps.length ? '<ol>' + d.gaps.filter(g => g.rating === 'red').slice(0, 8).map(g => '<li>' + g.category + ' &mdash; ' + g.label + '.</li>').join('') + '</ol>' : '<p>Grounds as recorded during the monitoring visit.</p>'
  return docHead(origin) + '<p class="right">Ref: ' + ref + '<br>' + date + '</p>' +
    '<p>The Proprietor / Person in Charge<br>' + v.facility_name + '<br>' + (v.area || '') + ', Lagos State</p>' +
    '<p><strong>Dear Sir/Ma,</strong></p>' +
    '<p><strong>RE: NOTICE OF CLOSURE &mdash; ' + (v.facility_name || '').toUpperCase() + '</strong></p>' +
    '<p>Following a routine monitoring visit conducted at your facility on ' + date + ' by REALMS Healthcare Services Consulting Limited, as a licensed monitoring operator for the Health Facility Monitoring and Accreditation Agency (HEFAMAA), Lagos State, your facility has been found to be in serious breach of the standards required to operate.</p>' +
    '<p><strong>Grounds for this notice.</strong></p>' + grounds +
    '<p>You are hereby directed to cease operations pending regulatory review and the correction of the above. This matter has been referred to HEFAMAA for enforcement. You may make representations to the Agency.</p>' +
    '<p>Yours Sincerely,<br>For: REALMS Healthcare Services Consulting Limited</p>' +
    '<p class="muted">Issued in support of the HEFAMAA regulatory mandate. Final enforcement decisions rest with HEFAMAA.</p>'
}
function buildLetter(v, d, origin) {
  const date = (v.arrival_time || v.created_at || '').slice(0, 10)
  const ref = 'RHSC/' + (v.area || 'LAG').slice(0, 3).toUpperCase() + '/' + date.replace(/-/g, '')
  const strengthsP = d.strengths.length ? 'Your facility demonstrated good practice in areas including ' + d.strengths.slice(0, 4).map(s => s.split(': ').pop().toLowerCase()).join(', ') + '.' : 'Areas of strength were noted during the visit.'
  const gapsL = d.gaps.length ? '<ol>' + d.gaps.map(g => '<li>' + g.category + ' &mdash; ' + g.label + '. Required action: ' + (g.action || 'address the non-compliance') + '. Timeline: ' + (g.timeline || 'as advised') + '.</li>').join('') + '</ol>' : '<p>No significant non-compliance was recorded.</p>'
  return docHead(origin) + '<p class="right">Ref: ' + ref + '<br>' + date + '</p>' +
    '<p>The Proprietor / Person in Charge<br>' + v.facility_name + '<br>' + (v.area || '') + ', Lagos State</p>' +
    '<p><strong>Dear Sir/Ma,</strong></p>' +
    '<p><strong>RE: OUTCOME OF ROUTINE HEALTH FACILITY MONITORING AT ' + (v.facility_name || '').toUpperCase() + '</strong></p>' +
    '<p>Following the routine monitoring visit conducted at your facility on ' + date + ' by REALMS Healthcare Services Consulting Limited, in collaboration with the Health Facility Monitoring and Accreditation Agency (HEFAMAA), Lagos State, please find below a summary of our assessment and the actions required.</p>' +
    '<p>The overall outcome of the visit is <strong>' + ragText(v.overall_rating) + '</strong>, with a compliance score of <strong>' + (v.score != null ? v.score + '%' : 'not scored') + '</strong>.</p>' +
    '<p><strong>Areas of strength.</strong> ' + strengthsP + '</p>' +
    '<p><strong>Areas requiring correction.</strong></p>' + gapsL +
    '<p>You are required to complete the corrective actions above by <strong>' + (d.remediation_deadline || 'the date advised') + '</strong>. A re-inspection is scheduled within ' + (d.reinspection || 'the coming weeks') + ' to confirm the required corrections. Continued non-compliance may result in escalation to HEFAMAA for regulatory action.</p>' +
    '<p>Yours Sincerely,<br>For: REALMS Healthcare Services Consulting Limited</p>' +
    '<p class="muted">Issued in support of the HEFAMAA regulatory mandate. This letter is not legal advice.</p>'
}

function buildHefamaaDoc(v, origin) {
  const date = (v.arrival_time || v.created_at || '').slice(0, 10)
  const hef = (v.monitoring && v.monitoring.hefamaa) || {}
  const body = HEFAMAA_FORM.map(sec => {
    const rows = sec.fields.filter(f => { const val = hef[f[0]]; return Array.isArray(val) ? val.length : (val != null && val !== '') }).map(f => '<tr><td>' + f[1] + '</td><td>' + (Array.isArray(hef[f[0]]) ? hef[f[0]].join(', ') : String(hef[f[0]])) + '</td></tr>').join('')
    return '<h3>' + sec.title + '</h3>' + (rows ? '<table>' + rows + '</table>' : '<p class="muted">Not completed.</p>')
  }).join('')
  return docHead(origin) + '<h1>HEFAMAA Facility Inspection Form</h1><p><strong>Facility:</strong> ' + v.facility_name + ' &middot; <strong>Area:</strong> ' + (v.area || '') + ' &middot; <strong>Date:</strong> ' + date + '</p>' + body + '<p class="muted">Digitised Lagos HEFAMAA Facility Inspection Tool (Primary Health Care). Prepared by REALMS Healthcare Services Consulting Limited.</p>'
}
function SignaturePad({ value, onChange }) {
  const ref = useRef(null); const drawing = useRef(false); const last = useRef(null)
  useEffect(() => { const c = ref.current; if (!c) return; const ctx = c.getContext('2d'); ctx.lineWidth = 2.2; ctx.lineCap = 'round'; ctx.strokeStyle = '#241536' }, [])
  function pos(e) { const c = ref.current; const r = c.getBoundingClientRect(); const t = e.touches ? e.touches[0] : e; return { x: (t.clientX - r.left) * (c.width / r.width), y: (t.clientY - r.top) * (c.height / r.height) } }
  function start(e) { e.preventDefault(); drawing.current = true; last.current = pos(e) }
  function move(e) { if (!drawing.current) return; e.preventDefault(); const p = pos(e); const ctx = ref.current.getContext('2d'); ctx.beginPath(); ctx.moveTo(last.current.x, last.current.y); ctx.lineTo(p.x, p.y); ctx.stroke(); last.current = p }
  function end() { if (!drawing.current) return; drawing.current = false; onChange(ref.current.toDataURL('image/png')) }
  function clear() { const c = ref.current; c.getContext('2d').clearRect(0, 0, c.width, c.height); onChange('') }
  return (<div className="sigwrap"><canvas ref={ref} width="600" height="170" className="sigpad" onMouseDown={start} onMouseMove={move} onMouseUp={end} onMouseLeave={end} onTouchStart={start} onTouchMove={move} onTouchEnd={end} /><button type="button" className="mini" onClick={clear}>Clear signature</button></div>)
}

function DebriefPage({ userId }) {
  const [visits, setVisits] = useState([])
  const [active, setActive] = useState(null)
  const [strengths, setStrengths] = useState([])
  const [gaps, setGaps] = useState([])
  const [deadline, setDeadline] = useState('')
  const [reinspection, setReinspection] = useState('2 weeks')
  const [letterIssued, setLetterIssued] = useState(true)
  const [propName, setPropName] = useState('')
  const [ack, setAck] = useState(false)
  const [signature, setSignature] = useState('')
  const [genesys, setGenesys] = useState(false)
  const [genesysNote, setGenesysNote] = useState('')
  const [closure, setClosure] = useState(false)
  const [escalate, setEscalate] = useState(false)
  const [narrative, setNarrative] = useState('')
  const [online, setOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true)
  const [busy, setBusy] = useState(false); const [msg, setMsg] = useState(''); const [saveState, setSaveState] = useState('')
  const [q, setQ] = useState('')

  useEffect(() => { VIS.list().then(setVisits).catch(() => {}) }, [])
  useEffect(() => { const on = () => setOnline(true), off = () => setOnline(false); window.addEventListener('online', on); window.addEventListener('offline', off); return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off) } }, [])

  function open(v) {
    setActive(v); setMsg(''); setSaveState('')
    const existing = v.debrief
    if (existing) {
      setStrengths(existing.strengths || []); setGaps(existing.gaps || []); setDeadline(existing.remediation_deadline || '')
      setReinspection(existing.reinspection || '2 weeks'); setLetterIssued(existing.letter_issued !== false)
      setPropName(existing.proprietor_name || (v.person_in_charge && v.person_in_charge.name) || ''); setAck(!!existing.proprietor_ack); setSignature(existing.signature || '')
      setGenesys(!!existing.genesys_interest); setGenesysNote(existing.genesys_note || ''); setClosure(!!existing.closure_recommended); setEscalate(!!existing.escalated); setNarrative(existing.narrative || '')
    } else {
      const d = deriveDebrief(v); setStrengths(d.strengths); setGaps(d.gaps); setDeadline(''); setReinspection(getSettings().default_reinspection || '2 weeks'); setLetterIssued(true)
      setPropName((v.person_in_charge && v.person_in_charge.name) || ''); setAck(false); setSignature('')
      setGenesys(false); setGenesysNote(''); setClosure(false); setEscalate(false); setNarrative('')
    }
  }
  function setGap(i, patch) { setGaps(gs => gs.map((g, x) => x === i ? { ...g, ...patch } : g)); setSaveState('draft') }

  function payload() { return { strengths, gaps, remediation_deadline: deadline, reinspection, letter_issued: letterIssued, proprietor_name: propName.trim(), proprietor_ack: ack, signature, signed_at: signature ? new Date().toISOString() : '', genesys_interest: genesys, genesys_note: genesysNote.trim(), closure_recommended: closure, escalated: escalate, narrative: narrative.trim(), updatedAt: new Date().toISOString() } }
  function findingsText() {
    const g = gaps.map(x => '- ' + (x.category ? x.category + ': ' : '') + (x.label || '')).join('\n')
    const s = strengths.map(x => '- ' + (x.label || x)).join('\n')
    return 'Facility: ' + (active ? active.facility_name : '') + ' (' + (active ? active.area : '') + '). Overall: ' + ragText(active && active.overall_rating) + (active && active.score != null ? ' ' + active.score + '%' : '') + '.\nStrengths:\n' + (s || '- none noted') + '\nGaps:\n' + (g || '- none noted')
  }

  async function save() {
    if (!active) return
    if (!ack) { setMsg('Confirm the proprietor acknowledgement to complete the debrief.'); return }
    setBusy(true); setMsg('')
    const d = payload(); const firstClose = active.status !== 'debriefed'
    try {
      await VIS.update(active.id, { debrief: d, status: 'debriefed' })
      setSaveState('saved'); setMsg('Debrief saved.'); toast('Debrief saved.')
      setVisits(vs => vs.map(v => v.id === active.id ? { ...v, debrief: d, status: 'debriefed' } : v))
      if (firstClose) {
        try {
          await NOTIF.add({ type: 'visit_completed', visit_id: active.id, facility_name: active.facility_name, area: active.area, channel: 'customer_service', status: 'pending', message: 'Visit completed at ' + active.facility_name + ' (' + (active.area || '') + '). Customer service to call the facility to hear how the visit went.' }, userId)
        } catch (e) {}
        const cs = getSettings(); const csMsg = 'RHSC: monitoring completed at ' + active.facility_name + '. Please call the facility to follow up.'
        if (cs.cs_email) { try { sendNotify({ channel: 'email', to: cs.cs_email, subject: 'Visit completed: ' + active.facility_name, message: csMsg }) } catch (e) {} }
        if (cs.cs_phone) { try { sendNotify({ channel: 'sms', to: cs.cs_phone, message: csMsg }) } catch (e) {} }
        if (cs.cs_whatsapp) { try { sendNotify({ channel: 'whatsapp', to: cs.cs_whatsapp, message: csMsg }) } catch (e) {} }
      }
    } catch (e) { setSaveState('pending'); setMsg('Saved locally. It will sync when you are back online; use Sync now to retry.') }
    finally { setBusy(false) }
  }
  const origin = (typeof window !== 'undefined' && window.location) ? window.location.origin : ''

  if (!active) {
    const ready = visits.filter(v => (v.status === 'monitored' || (v.status === 'debriefed' && !(v.debrief && v.debrief.first_visit))) && matchQ(v, q))
    const anyReady = visits.some(v => v.status === 'monitored' || (v.status === 'debriefed' && !(v.debrief && v.debrief.first_visit)))
    return (<div className="page">
      <div className="ptitle"><div><p className="eyebrow">Debrief</p><h2>Close out visits</h2></div><span className={'net ' + (online ? 'on' : 'off')}>{online ? 'Online' : 'Offline'}</span></div>
      {anyReady && <div className="list-tools"><SearchBox value={q} onChange={setQ} placeholder="Search facilities…" /></div>}
      {ready.length === 0 ? <p className="empty">{anyReady ? 'No visits match your search.' : 'No assessed visits yet. Complete a Monitor assessment first.'}</p> :
        <div className="mon-list">{ready.map(v => (
          <button className="mon-row" key={v.id} onClick={() => open(v)}>
            <div><span className="fname">{v.facility_name}</span><span className="fmeta">{v.area} &middot; {(v.arrival_time || v.created_at || '').slice(0, 10)}</span></div>
            <div className="mon-right"><Chip rag={v.overall_rating} pct={v.score} /><span className={'chip ' + (v.status === 'debriefed' ? 'green' : 'monitored')}>{v.status === 'debriefed' ? 'Debriefed' : 'To debrief'}</span></div>
          </button>
        ))}</div>}
    </div>)
  }

  return (<div className="page debrief">
    <div className="mon-head">
      <div className="mon-head-l"><button className="linkbtn subtle" onClick={() => setActive(null)}>&larr; All visits</button><h2>{active.facility_name}</h2><p className="fsub">{active.area} &middot; {(active.arrival_time || '').slice(0, 10)}</p></div>
      <div className="mon-head-r"><span className={'net ' + (online ? 'on' : 'off')}>{online ? 'Online' : 'Offline'}</span><Chip rag={active.overall_rating} pct={active.score} /></div>
    </div>
    {msg && <p className="auth-msg block">{msg}</p>}

    <div className="dsec"><h3>Strengths</h3>
      {strengths.length ? <ul className="dstr">{strengths.map((s, i) => <li key={i}>{s}</li>)}</ul> : <p className="empty sm">No green-rated items.</p>}
    </div>

    <div className="dsec"><h3>Gaps and corrective actions</h3>
      {gaps.length === 0 ? <p className="empty sm">No amber or red items. Nothing to correct.</p> : gaps.map((g, i) => (
        <div className="gap" key={g.key}>
          <div className="gap-top"><span className="gap-label">{g.category}: {g.label}</span><span className={'chip ' + chipCls(g.rating)}>{ragText(g.rating)}</span></div>
          <div className="fgrid two">
            <label className="field sm"><span>Required action</span><input value={g.action} onChange={e => setGap(i, { action: e.target.value })} /></label>
            <label className="field sm"><span>Timeline</span><input value={g.timeline} onChange={e => setGap(i, { timeline: e.target.value })} placeholder="e.g. 2 weeks" /></label>
          </div>
        </div>
      ))}
    </div>

    <div className="dsec"><h3>Next steps</h3>
      <div className="fgrid">
        <label className="field sm"><span>Remediation deadline</span><input type="date" value={deadline} onChange={e => { setDeadline(e.target.value); setSaveState('draft') }} /></label>
        <label className="field sm"><span>Re-inspection within</span><select value={reinspection} onChange={e => { setReinspection(e.target.value); setSaveState('draft') }}>{REINSPECT.map(r => <option key={r} value={r}>{r}</option>)}</select></label>
        <label className="field sm chkfield"><span>Compliance letter</span><label className="inl"><input type="checkbox" checked={letterIssued} onChange={e => { setLetterIssued(e.target.checked); setSaveState('draft') }} /> Issue letter</label></label>
      </div>
    </div>

    <div className="dsec"><h3>AI recommendations</h3>
      <div className="ai-row">
        <AIButton label="Draft report narrative" build={() => ({ system: 'You are a HEFAMAA facility-monitoring officer at RHSC writing the narrative summary of a monitoring visit. Write 2 short paragraphs in professional British English: what was observed and the required improvements. Factual, non-alarmist, no invented details.', prompt: findingsText(), max_tokens: 500 })} onText={txt => { setNarrative(txt); setSaveState('draft') }} />
        <AIButton label="Suggest corrective actions" build={() => ({ system: 'You are a HEFAMAA monitoring officer. From the gaps, list specific, practical corrective actions with realistic timelines as short bullet points. Only actions grounded in the gaps provided.', prompt: findingsText(), max_tokens: 500 })} onText={txt => { setNarrative(n => (n ? n + '\n\nCorrective actions:\n' : 'Corrective actions:\n') + txt); setSaveState('draft') }} />
      </div>
      <label className="field sm"><span>Narrative &amp; recommendations (editable, included in the report)</span><textarea rows="5" value={narrative} onChange={e => { setNarrative(e.target.value); setSaveState('draft') }} placeholder="Draft with AI, or write your own. Always review before issuing." /></label>
    </div>

    <div className="dsec"><h3>Regulatory action</h3>
      <div className="fgrid">
        <label className="field sm chkfield"><span>Closure notice</span><label className="inl"><input type="checkbox" checked={closure} onChange={e => { setClosure(e.target.checked); setSaveState('draft') }} /> Recommend closure</label></label>
        <label className="field sm chkfield"><span>Escalation</span><label className="inl"><input type="checkbox" checked={escalate} onChange={e => { setEscalate(e.target.checked); setSaveState('draft') }} /> Escalate critical finding</label></label>
      </div>
      <p className="hintline">Closure applies where a facility operates without registration, with an expired licence, without HEFAMAA signage, or without qualified personnel on duty.</p>
    </div>

    <div className="dsec"><h3>Digital health</h3>
      <label className="field sm chkfield"><span>Genesys EMR</span><label className="inl"><input type="checkbox" checked={genesys} onChange={e => { setGenesys(e.target.checked); setSaveState('draft') }} /> Facility interested in the Genesys EMR</label></label>
      {genesys && <label className="field sm"><span>Notes</span><input value={genesysNote} onChange={e => { setGenesysNote(e.target.value); setSaveState('draft') }} placeholder="Contact, timing, systems in use" /></label>}
    </div>

    <div className="dsec"><h3>Proprietor sign-off</h3>
      <div className="fgrid two">
        <label className="field sm"><span>Person in charge</span><input value={propName} onChange={e => { setPropName(e.target.value); setSaveState('draft') }} /></label>
        <label className="field sm chkfield"><span>Acknowledgement</span><label className="inl"><input type="checkbox" checked={ack} onChange={e => setAck(e.target.checked)} /> Findings acknowledged</label></label>
      </div>
      <p className="pick-label">Signature</p>
      <SignaturePad value={signature} onChange={s => { setSignature(s); setSaveState('draft') }} />
    </div>

    <div className="mon-actions">
      <button className="btn primary" onClick={save} disabled={busy}>{busy ? 'Saving\u2026' : 'Save debrief'}</button>
      {saveState === 'pending' && <button className="btn ghost" onClick={save}>Sync now</button>}
      <button className="btn ghost" onClick={() => printDoc('Monitoring Report', buildReport(active, payload(), origin))}>Monitoring report</button>
      <button className="btn primary" onClick={() => printDoc('HEFAMAA Inspection Report', buildInspectionReport(active, payload(), origin))}>Inspection report</button>
      <button className="btn ghost" onClick={() => printDoc('HEFAMAA Form', buildHefamaaDoc(active, origin))}>HEFAMAA form</button>
      {letterIssued && <button className="btn ghost" onClick={() => printDoc('Compliance Letter', buildLetter(active, payload(), origin))}>Corrective letter</button>}
      {closure && <button className="btn ghost" onClick={() => printDoc('Closure Notice', buildClosure(active, payload(), origin))}>Closure notice</button>}
      <span className="save-note">{saveState === 'saved' ? 'Saved' : saveState === 'pending' ? 'Pending sync' : ''}</span>
    </div>
    <p className="hintline">Reports open in a new tab; use your browser's Print or Save as PDF. Human review before issue is expected.</p>
  </div>)
}

/* ---------- proprietor view ---------- */
function ProprietorPage({ facilityId, facilities }) {
  const [visits, setVisits] = useState([])
  const [q, setQ] = useState('')
  useEffect(() => { VIS.list().then(setVisits).catch(() => {}) }, [])
  const origin = (typeof window !== 'undefined' && window.location) ? window.location.origin : ''
  const mineFac = (facilities || []).find(f => f.id === facilityId)
  const all = visits.filter(v => (v.status === 'monitored' || v.status === 'debriefed') && (!facilityId || v.facility_id === facilityId || (mineFac && v.facility_name === mineFac.name)))
  const mine = all.filter(v => matchQ(v, q))
  return (<div className="page">
    <div className="ptitle"><div><p className="eyebrow">My facility</p><h2>{mineFac ? mineFac.name : 'Monitoring outcomes'}</h2></div></div>
    <p className="page-lede">Your latest monitoring outcomes, the corrective actions required, and re-inspection timelines.</p>
    {all.length > 0 && <div className="list-tools"><SearchBox value={q} onChange={setQ} placeholder="Search facilities…" /></div>}
    {mine.length === 0 ? <p className="empty">{all.length === 0 ? 'No monitoring visits recorded yet.' : 'No visits match your search.'}</p> :
      <div className="prop-list">{mine.map(v => {
        const d = v.debrief || deriveDebrief(v); const gaps = d.gaps || []
        return (<div className="prop-card" key={v.id}>
          <div className="prop-head"><div><span className="fname">{v.facility_name}</span><span className="fmeta">{v.area} &middot; {(v.arrival_time || v.created_at || '').slice(0, 10)}</span></div><Chip rag={v.overall_rating} pct={v.score} /></div>
          <div className="prop-sec"><h4>Corrective actions</h4>
            {gaps.length === 0 ? <p className="muted sm">No corrective actions outstanding. Well done.</p> :
              <ul className="corr">{gaps.map((g, i) => (<li key={i}><span className="corr-item">{(g.category ? g.category + ': ' : '') + (typeof g.label === 'string' ? g.label : '')}</span>{g.action ? <em> {g.action}</em> : null}{g.timeline ? <span className="corr-tl">{g.timeline}</span> : null}</li>))}</ul>}
          </div>
          {(d.remediation_deadline || d.reinspection) && <div className="prop-sec"><h4>Re-inspection</h4><p className="muted sm">{d.remediation_deadline ? 'Corrective actions due by ' + d.remediation_deadline + '. ' : ''}{d.reinspection ? 'A re-inspection is scheduled within ' + d.reinspection + '.' : ''}</p></div>}
          <div className="prop-actions"><button className="mini" onClick={() => printDoc('Monitoring Report', buildReport(v, d, origin))}>View full report</button></div>
        </div>)
      })}</div>}
    <p className="hintline">{facilityId ? 'This view is limited to your facility.' : 'No facility is linked to your account yet. Contact RHSC.'}</p>
  </div>)
}

/* ---------- customer service follow-ups ---------- */
function FollowUpsPage({ userId, identity }) {
  const [visits, setVisits] = useState([])
  const [notes, setNotes] = useState([])
  const [callLog, setCallLog] = useState([])
  const [q, setQ] = useState('')
  const [openId, setOpenId] = useState(null)
  const [form, setForm] = useState({ outcome: 'Reached', notes: '', caller: '' })
  const [busy, setBusy] = useState(false)
  const [briefs, setBriefs] = useState({})
  async function refresh() {
    try { setVisits(await VIS.list()) } catch (e) {}
    try { setNotes(await NOTIF.list()) } catch (e) {}
    try { setCallLog(await CALLS.list()) } catch (e) {}
  }
  useEffect(() => { refresh() }, [])
  const anyDone = visits.some(v => v.status === 'debriefed' && !(v.debrief && v.debrief.first_visit))
  const done = visits.filter(v => v.status === 'debriefed' && !(v.debrief && v.debrief.first_visit) && matchQ(v, q))
  function callsFor(id) { return callLog.filter(c => c.visit_id === id) }
  function openForm(v) { setOpenId(v.id); setForm({ outcome: 'Reached', notes: '', caller: (identity && identity.name) || '' }) }
  async function saveCall(v) {
    setBusy(true)
    try {
      await CALLS.add({ visit_id: v.id, facility_name: v.facility_name, area: v.area, outcome: form.outcome, notes: form.notes.trim(), caller: form.caller.trim() }, userId)
      setOpenId(null); await refresh()
    } catch (e) {} finally { setBusy(false) }
  }
  return (<div className="page">
    <div className="ptitle"><div><p className="eyebrow">Customer service</p><h2>Visit follow-ups</h2></div></div>
    <p className="page-lede">When a visit is completed, customer service is notified to call the facility and hear how it went. Log each call here.</p>
    {anyDone && <div className="list-tools"><SearchBox value={q} onChange={setQ} placeholder="Search facilities…" /></div>}
    {done.length === 0 ? <p className="empty">{anyDone ? 'No visits match your search.' : 'No completed visits to follow up yet.'}</p> :
      <div className="mon-list">{done.map(v => {
        const cs = callsFor(v.id); const last = cs[0]
        return (<div className="fu-card" key={v.id}>
          <div className="fu-head">
            <div><span className="fname">{v.facility_name}</span><span className="fmeta">{v.area} &middot; completed {((v.debrief && v.debrief.updatedAt) || v.arrival_time || '').slice(0, 10)}</span></div>
            <div className="fu-right">{last ? <span className="chip green">Called: {last.outcome}</span> : <span className="chip amber">Awaiting call</span>}<AIButton className="mini" label="AI briefing" build={() => { const hist = visits.filter(x => x.facility_name === v.facility_name).map(x => ({ date: (x.arrival_time || x.created_at || '').slice(0, 10), rating: x.overall_rating, score: x.score, status: x.status, gaps: ((x.debrief && x.debrief.gaps) || []).map(g => g.label) })); return { system: 'You brief RHSC customer service before they call a facility about a completed monitoring visit. In 3 to 4 sentences summarise the outcome, the key gaps, and what to ask on the call. Use only the data.', prompt: JSON.stringify({ facility: v.facility_name, area: v.area, history: hist }), max_tokens: 350 } }} onText={txt => setBriefs(b => ({ ...b, [v.id]: txt }))} /><button className="mini" onClick={() => openId === v.id ? setOpenId(null) : openForm(v)}>{openId === v.id ? 'Close' : 'Log call'}</button></div>
          </div>
          {briefs[v.id] && <div className="ai-panel"><h4><span className="ai-spark">✦</span> Call briefing</h4><p className="ai-text">{briefs[v.id]}</p></div>}
          {openId === v.id && <div className="fu-form">
            <div className="fgrid two">
              <label className="field sm"><span>Outcome</span><select value={form.outcome} onChange={e => setForm({ ...form, outcome: e.target.value })}>{['Reached', 'No answer', 'Call back', 'Escalated'].map(o => <option key={o}>{o}</option>)}</select></label>
              <label className="field sm"><span>Caller</span><input value={form.caller} onChange={e => setForm({ ...form, caller: e.target.value })} /></label>
            </div>
            <label className="field sm"><span>Notes</span><textarea rows="2" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="What did the facility say about the visit?" /></label>
            <button className="btn small primary" onClick={() => saveCall(v)} disabled={busy}>{busy ? 'Saving\u2026' : 'Save call'}</button>
          </div>}
          {cs.length > 0 && <ul className="fu-calls">{cs.map((c, i) => (<li key={i}><strong>{c.outcome}</strong> &middot; {(c.created_at || '').slice(0, 16).replace('T', ' ')}{c.caller ? ' \u00b7 ' + c.caller : ''}{c.notes ? ' \u2014 ' + c.notes : ''}</li>))}</ul>}
        </div>)
      })}</div>}

    <SectionHead eyebrow="Logs" title="Notification log" />
    {notes.length === 0 ? <p className="empty sm">No notifications yet.</p> :
      <ul className="log-list">{notes.slice(0, 50).map((n, i) => (<li key={i}><span className="log-when">{(n.created_at || '').slice(0, 16).replace('T', ' ')}</span><span className="log-msg">{n.message || (n.type + ' ' + (n.facility_name || ''))}</span></li>))}</ul>}

    <SectionHead eyebrow="Logs" title="Call log" />
    {callLog.length === 0 ? <p className="empty sm">No calls logged yet.</p> :
      <ul className="log-list">{callLog.slice(0, 50).map((c, i) => (<li key={i}><span className="log-when">{(c.created_at || '').slice(0, 16).replace('T', ' ')}</span><span className="log-msg">{c.facility_name} &middot; {c.outcome}{c.caller ? ' \u00b7 ' + c.caller : ''}{c.notes ? ' \u2014 ' + c.notes : ''}</span></li>))}</ul>}
  </div>)
}

/* ---------- re-inspection reminders ---------- */
function reminderStage(days) { return days == null ? null : days < 0 ? 'overdue' : days === 0 ? 'due' : days <= 7 ? 't7' : null }
async function runReminders(visits, facilities, userId, opts) {
  const st = getSettings()
  const sent = []
  let logged = []
  try { logged = await NOTIF.list() } catch (e) {}
  const already = {}
  logged.forEach(n => { if (n.type === 'reminder' && n.visit_id) already[n.visit_id + ':' + (n.stage || '')] = true })
  for (const v of visits) {
    const d = v.debrief && v.debrief.remediation_deadline
    if (!d) continue
    const stage = reminderStage(daysUntil(d))
    if (!stage) continue
    const key = v.id + ':' + stage
    if (already[key]) continue
    const label = stage === 'overdue' ? 'is OVERDUE' : stage === 'due' ? 'is due today' : 'is due within 7 days'
    const msg = 'RHSC reminder: corrective actions at ' + v.facility_name + ' (' + (v.area || '') + ') ' + label + '. Deadline ' + d + '.'
    try { await NOTIF.add({ type: 'reminder', stage, visit_id: v.id, facility_name: v.facility_name, area: v.area, channel: 'in-app', status: 'sent', message: msg }, userId) } catch (e) { continue }
    if (st.lead_email) { try { sendNotify({ channel: 'email', to: st.lead_email, subject: 'Re-inspection ' + stage, message: msg }) } catch (e) {} }
    if (st.cs_email) { try { sendNotify({ channel: 'email', to: st.cs_email, subject: 'Re-inspection ' + stage, message: msg }) } catch (e) {} }
    if (st.lead_phone) { try { sendNotify({ channel: 'sms', to: st.lead_phone, message: msg }) } catch (e) {} }
    if (st.cs_whatsapp) { try { sendNotify({ channel: 'whatsapp', to: st.cs_whatsapp, message: msg }) } catch (e) {} }
    if (st.notify_facility) {
      const f = (facilities || []).find(x => x.id === v.facility_id || x.name === v.facility_name)
      if (f && f.phone) {
        const fm = 'RHSC/HEFAMAA: the corrective actions agreed at ' + v.facility_name + ' ' + label + ' (deadline ' + d + '). Please contact RHSC on ' + (st.cs_phone || CONTACT.email) + '.'
        try { sendNotify({ channel: 'sms', to: f.phone, message: fm }) } catch (e) {}
        if (st.cs_whatsapp) { try { sendNotify({ channel: 'whatsapp', to: f.phone, message: fm }) } catch (e) {} }
      }
    }
    sent.push({ facility: v.facility_name, stage })
  }
  return sent
}

/* ---------- settings (HQ) ---------- */
function SettingsPage({ user, identity, facilities }) {
  const [s, setS] = useState(getSettings())
  const [remBusy, setRemBusy] = useState(false); const [remMsg, setRemMsg] = useState('')
  const set = (k, v) => setS(p => ({ ...p, [k]: v }))
  function save() { saveSettings(s); toast('Settings saved.') }
  async function sendNow() {
    saveSettings(s); setRemBusy(true); setRemMsg('')
    try {
      const vs = await VIS.list()
      const out = await runReminders(vs, facilities, user && user.id)
      setRemMsg(out.length ? out.length + ' reminder' + (out.length === 1 ? '' : 's') + ' sent and logged.' : 'Nothing due. No reminders needed.')
      toast(out.length ? out.length + ' reminders sent.' : 'Nothing due right now.')
    } catch (e) { setRemMsg('Could not send reminders.') } finally { setRemBusy(false) }
  }
  return (<div className="page">
    <div className="ptitle"><div><p className="eyebrow">Settings</p><h2>Customer service & defaults</h2></div></div>
    <div className="settings-card">
      <h3>Customer service contact</h3>
      <p className="hintline">When a visit is completed, customer service is alerted here so they can call the facility. Automated send uses the connected SMS, WhatsApp or email provider.</p>
      <div className="fgrid two">
        <label className="field sm"><span>Email</span><input value={s.cs_email || ''} onChange={e => set('cs_email', e.target.value)} placeholder="care@example.com" /></label>
        <label className="field sm"><span>Phone (SMS)</span><input value={s.cs_phone || ''} onChange={e => set('cs_phone', e.target.value)} placeholder="0803..." /></label>
        <label className="field sm"><span>WhatsApp</span><input value={s.cs_whatsapp || ''} onChange={e => set('cs_whatsapp', e.target.value)} placeholder="234..." /></label>
        <label className="field sm"><span>Default re-inspection window</span><select value={s.default_reinspection || '2 weeks'} onChange={e => set('default_reinspection', e.target.value)}>{REINSPECT.map(r => <option key={r} value={r}>{r}</option>)}</select></label>
      </div>
      <button className="btn primary" onClick={save}>Save settings</button>
    </div>

    <div className="settings-card" style={{ marginTop: 16 }}>
      <h3>Re-inspection reminders</h3>
      <p className="hintline">Sent 7 days before a deadline, on the day, and once overdue. Each reminder goes out only once and is kept in the notification log.</p>
      <div className="fgrid two">
        <label className="field sm"><span>Team Lead email</span><input value={s.lead_email || ''} onChange={e => set('lead_email', e.target.value)} placeholder="solomon@realmsconsulting.com" /></label>
        <label className="field sm"><span>Team Lead phone (SMS)</span><input value={s.lead_phone || ''} onChange={e => set('lead_phone', e.target.value)} placeholder="0803..." /></label>
      </div>
      <label className="ai-check"><input type="checkbox" checked={!!s.notify_facility} onChange={e => set('notify_facility', e.target.checked)} /> Also remind the facility on its registered number</label>
      <div className="cta-row" style={{ marginTop: 12 }}>
        <button className="btn primary" onClick={save}>Save settings</button>
        <button className="btn ghost" onClick={sendNow} disabled={remBusy}>{remBusy ? 'Sending\u2026' : 'Send due reminders now'}</button>
      </div>
      {remMsg && <p className="hintline">{remMsg}</p>}
    </div>
    <div className="settings-card" style={{ marginTop: 16 }}>
      <h3>AI translations</h3>
      <p className="hintline">Generate first-draft Yorùbá, Hausa and Igbo for the website strings, to give a native speaker to review before use. Downloads a JSON file.</p>
      <AIButton label="Generate translations" build={() => { const en = {}; Object.keys(TR).forEach(k => { en[k] = TR[k].en }); return { system: 'You are a professional Nigerian translator. Translate the given English UI strings into Yoruba (yo), Hausa (ha) and Igbo (ig). Return ONLY JSON of the form {"yo":{key:translation},"ha":{...},"ig":{...}} using the same keys. Natural, concise, suitable for a professional healthcare firm.', prompt: JSON.stringify(en), max_tokens: 2000 } }} onText={txt => { try { download('realms-translations.json', txt.replace(/```json|```/g, '').trim(), 'application/json'); toast('Translations generated and downloaded for review.') } catch (e) { toast('Could not save the file.', 'warn') } }} />
    </div>
    <AccessPanel identity={identity} user={user} />
  </div>)
}

/* ---------- HQ access gate ---------- */
function PendingAccess({ kind, user, facilities, identity, onSignOut, onBack }) {
  const isProp = kind === 'facility_proprietor'
  const [sent, setSent] = useState(false)
  const [fid, setFid] = useState(''); const [q, setQ] = useState(''); const [busy, setBusy] = useState(false)
  const matches = q.trim().length < 2 ? [] : (facilities || []).filter(f => matchQ(f, q)).slice(0, 8)
  useEffect(() => { let live = true; if (!isProp) return; (async () => { try { const r = await ACC.mine(user && user.id, 'facility_proprietor'); if (live && r) setSent(true) } catch (e) {} })(); return () => { live = false } }, [isProp])
  async function requestProp() {
    if (!fid) { toast('Find and choose your facility first.', 'warn'); return }
    setBusy(true)
    try {
      const f = (facilities || []).find(x => x.id === fid)
      await ACC.request({ user_id: user.id, email: user.email, name: user.name || '', role: 'facility_proprietor', facility_id: fid, facility_name: f ? f.name : '' })
      setSent(true)
      try { sendNotify({ channel: 'email', to: getSettings().cs_email || CONTACT.email, subject: 'Facility access request', message: (user.name || user.email) + ' has requested proprietor access to ' + (f ? f.name : 'a facility') + ' on Realms Field.' }) } catch (e) {}
    } catch (e) { toast('Could not send that request.', 'err') } finally { setBusy(false) }
  }
  if (isProp && !sent) {
    return (<div className="page role-page">
      <div className="pending-card anim" style={{ textAlign: 'left' }}>
        <h2 style={{ textAlign: 'center' }}>Which facility is yours?</h2>
        <p style={{ textAlign: 'center' }}>Find your facility and request access. RHSC will confirm you before your reports are shown.</p>
        <SearchBox value={q} onChange={v => { setQ(v); setFid('') }} placeholder="Type your facility name" />
        {matches.length > 0 && <div className="frows" style={{ marginTop: 10 }}>{matches.map(f => (
          <button className={'frow pickable' + (fid === f.id ? ' picked' : '')} key={f.id} onClick={() => setFid(f.id)}>
            <div className="fmain"><span className="fname">{f.name}</span><span className="fmeta">{[f.category, f.area].filter(Boolean).join(' \u00b7 ')}</span></div>
            <span className="mini">{fid === f.id ? 'Chosen' : 'Choose'}</span>
          </button>))}</div>}
        {q.trim().length >= 2 && matches.length === 0 && <p className="empty sm">No match. Check the spelling, or contact RHSC.</p>}
        <div className="cta-row center" style={{ marginTop: 16 }}>
          <button className="btn ghost" onClick={onBack}>Back</button>
          <button className="btn primary" onClick={requestProp} disabled={busy || !fid}>{busy ? 'Sending\u2026' : 'Request access'}</button>
        </div>
      </div>
    </div>)
  }
  return (<div className="page role-page">
    <div className="pending-card anim">
      <span className="pending-ic"><Ico name="lock" size={26} /></span>
      <h2>{isProp ? 'Your facility access is awaiting confirmation' : 'Your HQ access is awaiting approval'}</h2>
      <p>{isProp
        ? 'RHSC will confirm that you represent this facility. Once approved you will see your own monitoring reports and corrective actions.'
        : 'RHSC HQ sees every facility, report and setting, so it is granted by the executive office. Your request has gone to ' + OWNER_EMAIL + '.'}</p>
      <p className="hintline">You will be let straight in once it is approved. Sign in again after you hear back.</p>
      <div className="cta-row center">
        <button className="btn ghost" onClick={onBack}>Choose a different role</button>
        <button className="btn primary" onClick={onSignOut}>Sign out</button>
      </div>
    </div>
  </div>)
}
function AccessPanel({ identity, user }) {
  const [rows, setRows] = useState([]); const [busy, setBusy] = useState('')
  async function refresh() { try { setRows(await ACC.list()) } catch (e) {} }
  useEffect(() => { refresh() }, [])
  async function decide(r, status) {
    setBusy(r.id)
    try { await ACC.decide(r.id, status, (identity && identity.name) || 'Executive office'); await refresh(); toast(status === 'approved' ? 'HQ access granted.' : 'Request declined.') }
    catch (e) { toast('Could not save that decision.', 'err') } finally { setBusy('') }
  }
  const pending = rows.filter(r => r.status === 'pending')
  function canDecide(r) { return r.role === 'rhsc_hq' ? isOwner(user) : true }
  return (<div className="settings-card" style={{ marginTop: 16 }}>
    <h3>Access requests</h3>
    <p className="hintline">Only the executive office can admit an RHSC HQ user. Facility proprietors can be confirmed by HQ.</p>
    {rows.length === 0 ? <p className="empty sm">No requests yet.</p> :
      <div className="frows">{rows.map(r => (
        <div className="frow" key={r.id}>
          <div className="fmain"><span className="fname">{r.name || r.email}</span><span className="fmeta">{r.email} &middot; {r.role === 'rhsc_hq' ? 'RHSC HQ' : 'Proprietor' + (r.facility_name ? ', ' + r.facility_name : '')} &middot; {(r.created_at || '').slice(0, 10)}</span></div>
          <div className="factions">
            <span className={'appr-chip ' + (r.status === 'approved' ? 'approved' : r.status === 'denied' ? 'returned' : 'pending')}>{r.status === 'approved' ? 'Approved' : r.status === 'denied' ? 'Declined' : 'Pending'}</span>
            {canDecide(r) && r.status !== 'approved' && <button className="mini ok" onClick={() => decide(r, 'approved')} disabled={busy === r.id}>Approve</button>}
            {canDecide(r) && r.status !== 'denied' && <button className="mini danger" onClick={() => decide(r, 'denied')} disabled={busy === r.id}>Decline</button>}
            {!canDecide(r) && <span className="hintline">Executive office only</span>}
          </div>
        </div>))}</div>}
    {pending.length > 0 && <p className="hintline">{pending.length} awaiting your decision.</p>}
  </div>)
}

/* ---------- approvals (Team Lead sign-off before HEFAMAA) ---------- */
function needsApproval(v) { return v.status === 'debriefed' && !(v.debrief && v.debrief.first_visit) }
function approvalState(v) { return (v.approval && v.approval.status) || 'pending' }
function ApprovalsPage({ userId, identity, role }) {
  const [visits, setVisits] = useState([])
  const [q, setQ] = useState(''); const [filter, setFilter] = useState('pending')
  const [busy, setBusy] = useState('')
  const [noteFor, setNoteFor] = useState(null); const [note, setNote] = useState('')
  const origin = (typeof window !== 'undefined' && window.location) ? window.location.origin : ''
  const canApprove = role === 'team_leader' || role === 'rhsc_hq'
  async function refresh() { try { setVisits(await VIS.list()) } catch (e) {} }
  useEffect(() => { refresh() }, [])
  const pool = visits.filter(needsApproval)
  const rows = pool.filter(v => (filter === 'all' || approvalState(v) === filter) && matchQ(v, q))
  const counts = { pending: pool.filter(v => approvalState(v) === 'pending').length, approved: pool.filter(v => approvalState(v) === 'approved').length, returned: pool.filter(v => approvalState(v) === 'returned').length }
  async function decide(v, status) {
    setBusy(v.id)
    const approval = { status, by: (identity && identity.name) || 'Team Lead', at: new Date().toISOString(), note: status === 'returned' ? note.trim() : '' }
    try {
      await VIS.update(v.id, { approval })
      setVisits(vs => vs.map(x => x.id === v.id ? { ...x, approval } : x))
      setNoteFor(null); setNote('')
      toast(status === 'approved' ? 'Report approved for submission.' : 'Returned to the monitor.')
    } catch (e) { toast('Could not save that decision.', 'err') } finally { setBusy('') }
  }
  return (<div className="page">
    <div className="ptitle"><div><p className="eyebrow">Approvals</p><h2>{counts.pending} awaiting sign-off</h2></div>
      <div className="ptools">
        <SearchBox value={q} onChange={setQ} placeholder="Search…" />
        <select className="sel" value={filter} onChange={e => setFilter(e.target.value)}>
          <option value="pending">Pending ({counts.pending})</option>
          <option value="approved">Approved ({counts.approved})</option>
          <option value="returned">Returned ({counts.returned})</option>
          <option value="all">All</option>
        </select>
      </div>
    </div>
    <p className="page-lede">Every report is signed off by the Team Lead before it goes to HEFAMAA. Only approved reports appear in the weekly submission.</p>
    {rows.length === 0 ? <p className="empty">Nothing here.</p> :
      <div className="rep-rows">{rows.map(v => { const st = approvalState(v); return (
        <div className="rep-row" key={v.id}>
          <div className="rep-main"><span className="fname">{v.facility_name}</span><span className="fmeta">{v.area} &middot; {(v.arrival_time || v.created_at || '').slice(0, 10)}{v.team && v.team[0] ? ' \u00b7 ' + v.team[0].name : ''}</span></div>
          <div className="rep-mid">
            {v.score != null && <Chip rag={v.overall_rating} pct={v.score} />}
            <span className={'appr-chip ' + st}>{st === 'approved' ? 'Approved' : st === 'returned' ? 'Returned' : 'Pending'}</span>
            {v.approval && v.approval.by && st !== 'pending' && <span className="fmeta">{v.approval.by}, {(v.approval.at || '').slice(0, 10)}</span>}
          </div>
          <div className="rep-actions">
            <button className="mini" onClick={() => printDoc('HEFAMAA Inspection Report', buildInspectionReport(v, v.debrief || deriveDebrief(v), origin))}>Review</button>
            {canApprove && st !== 'approved' && <button className="mini ok" onClick={() => decide(v, 'approved')} disabled={busy === v.id}>Approve</button>}
            {canApprove && st !== 'returned' && <button className="mini danger" onClick={() => { setNoteFor(noteFor === v.id ? null : v.id); setNote('') }}>Return</button>}
          </div>
          {noteFor === v.id && <div className="fu-form">
            <label className="field sm"><span>What needs fixing?</span><input value={note} onChange={e => setNote(e.target.value)} placeholder="e.g. photo missing on waste segregation" /></label>
            <button className="btn small danger" onClick={() => decide(v, 'returned')} disabled={busy === v.id}>Return to monitor</button>
          </div>}
          {st === 'returned' && v.approval && v.approval.note && <p className="hintline">Returned: {v.approval.note}</p>}
        </div>) })}</div>}
  </div>)
}

/* ---------- reports (Stage 7) & analytics (Stage 8) ---------- */
function download(name, content, type) {
  const blob = new Blob([content], { type }); const url = URL.createObjectURL(blob)
  const a = document.createElement('a'); a.href = url; a.download = name; document.body.appendChild(a); a.click(); document.body.removeChild(a)
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
function csvCell(v) { const s = String(v == null ? '' : v); return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s }
function exportVisitsCSV(rows) {
  const header = ['Facility', 'Area', 'Date', 'Status', 'Score', 'Rating', 'Remediation deadline', 'Re-inspection']
  const lines = [header].concat(rows.map(v => [v.facility_name, v.area, (v.arrival_time || v.created_at || '').slice(0, 10), v.status, v.score == null ? '' : v.score, v.overall_rating || '', (v.debrief && v.debrief.remediation_deadline) || '', (v.debrief && v.debrief.reinspection) || '']))
  download('realms-visits.csv', lines.map(l => l.map(csvCell).join(',')).join('\n'), 'text/csv')
}
function xmlCell(v) { return String(v == null ? '' : v).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;') }
function exportVisitsXLS(rows) {
  const head = ['Facility', 'Area', 'Date', 'Status', 'Score', 'Rating', 'Remediation deadline', 'Re-inspection']
  const body = rows.map(v => '<tr>' + [v.facility_name, v.area, (v.arrival_time || v.created_at || '').slice(0, 10), v.status, v.score == null ? '' : v.score, v.overall_rating || '', (v.debrief && v.debrief.remediation_deadline) || '', (v.debrief && v.debrief.reinspection) || ''].map(c => '<td>' + xmlCell(c) + '</td>').join('') + '</tr>').join('')
  const html = '<html><head><meta charset="utf-8"></head><body><table border="1"><tr>' + head.map(h => '<th>' + h + '</th>').join('') + '</tr>' + body + '</table></body></html>'
  download('realms-visits.xls', html, 'application/vnd.ms-excel')
}
function exportVisitsPDF(rows, origin) {
  const body = rows.map(v => '<tr><td>' + xmlCell(v.facility_name) + '</td><td>' + xmlCell(v.area) + '</td><td>' + (v.arrival_time || v.created_at || '').slice(0, 10) + '</td><td>' + ragText(v.overall_rating) + '</td><td>' + (v.score == null ? '' : v.score + '%') + '</td></tr>').join('')
  const inner = docHead(origin) + '<h1>Monitoring summary</h1><p class="muted">' + rows.length + ' visit' + (rows.length === 1 ? '' : 's') + '</p><table><tr><th>Facility</th><th>Area</th><th>Date</th><th>Outcome</th><th>Score</th></tr>' + body + '</table>'
  printDoc('Monitoring Summary', inner)
}
function buildDailyPDF(rows, origin) {
  const today = new Date().toISOString().slice(0, 10)
  const todays = rows.filter(v => (v.arrival_time || v.created_at || '').slice(0, 10) === today)
  const byArea = {}; todays.forEach(v => { const a = v.area || 'Unassigned'; byArea[a] = (byArea[a] || 0) + 1 })
  const areaLine = Object.keys(byArea).map(a => a + ' (' + byArea[a] + ')').join(', ') || 'none'
  const body = todays.map(v => '<tr><td>' + xmlCell(v.facility_name) + '</td><td>' + xmlCell(v.area) + '</td><td>' + ragText(v.overall_rating) + '</td><td>' + (v.score == null ? '' : v.score + '%') + '</td></tr>').join('')
  const inner = docHead(origin) + '<h1>Daily monitoring report</h1><p class="muted">' + today + ' &middot; ' + todays.length + ' facility' + (todays.length === 1 ? '' : 'ies') + ' monitored</p><p><strong>By area:</strong> ' + areaLine + '</p><table><tr><th>Facility</th><th>Area</th><th>Outcome</th><th>Score</th></tr>' + body + '</table>'
  printDoc('Daily Report', inner)
}
function waLink(phone, body) { const p = String(phone || '').replace(/[^0-9]/g, ''); return 'https://wa.me/' + p + '?text=' + encodeURIComponent(body) }
function mailtoLink(subject, body, to) { return 'mailto:' + encodeURIComponent(to || '') + '?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(body) }
function smsLink(phone, body) { return 'sms:' + (phone || '') + '?&body=' + encodeURIComponent(body) }
function daysUntil(d) { if (!d) return null; const ms = new Date(d + 'T00:00:00').getTime() - Date.now(); return Math.ceil(ms / 86400000) }

function NotifyPanel({ v, summary }) {
  const [email, setEmail] = useState('')
  const [st, setSt] = useState({})
  const phone = (v.person_in_charge && v.person_in_charge.phone) || ''
  const smsMsg = 'RHSC: monitoring completed at ' + v.facility_name + '. A summary and any required actions will follow.'
  async function send(channel) {
    setSt(s => ({ ...s, [channel]: 'sending' }))
    const payload = channel === 'sms' ? { channel: 'sms', to: phone, message: smsMsg }
      : channel === 'whatsapp' ? { channel: 'whatsapp', to: phone, message: smsMsg }
        : { channel: 'email', to: email, subject: 'RHSC monitoring outcome: ' + v.facility_name, message: summary(v) }
    const r = await sendNotify(payload)
    setSt(s => ({ ...s, [channel]: r.ok ? 'sent' : (r.reason || 'failed') }))
  }
  function lbl(x) { return x === 'sending' ? 'Sending\u2026' : x === 'sent' ? 'Sent' : x ? ('Not sent: ' + x) : '' }
  return (<div className="notify">
    <div className="notify-row">
      <button className="mini" onClick={() => send('sms')} disabled={!phone}>Send SMS</button>
      <a className="mini ghosted" href={smsLink(phone, smsMsg)}>open SMS app</a>
      <span className="nstat">{lbl(st.sms)}</span>
    </div>
    <div className="notify-row">
      <button className="mini" onClick={() => send('whatsapp')} disabled={!phone}>Send WhatsApp</button>
      <a className="mini ghosted" href={waLink(phone, smsMsg)} target="_blank" rel="noreferrer">open WhatsApp</a>
      <span className="nstat">{lbl(st.whatsapp)}</span>
    </div>
    <div className="notify-row">
      <input className="ninput" type="email" placeholder="email address" value={email} onChange={e => setEmail(e.target.value)} />
      <button className="mini" onClick={() => send('email')} disabled={!email}>Send email</button>
      <a className="mini ghosted" href={mailtoLink('RHSC monitoring outcome: ' + v.facility_name, summary(v), email)}>open mail app</a>
      <span className="nstat">{lbl(st.email)}</span>
    </div>
    <span className="hintline">Automated send uses the connected provider; if none is configured, use the open-app links. See the guide.</span>
  </div>)
}

function ReportsPage({ facilities, userId, scope, role }) {
  const [visits, setVisits] = useState([])
  const [area, setArea] = useState('all'); const [status, setStatus] = useState('all')
  const [notifyId, setNotifyId] = useState(null)
  const [q, setQ] = useState('')
  const [loading, setLoading] = useState(true)
  const [aiSummary, setAiSummary] = useState('')
  const today = new Date(); const weekAgo = new Date(Date.now() - 6 * 86400000)
  const [from, setFrom] = useState(weekAgo.toISOString().slice(0, 10))
  const [to, setTo] = useState(today.toISOString().slice(0, 10))
  useEffect(() => { VIS.list().then(v => { setVisits(v); setLoading(false) }).catch(() => setLoading(false)) }, [])
  const origin = (typeof window !== 'undefined' && window.location) ? window.location.origin : ''
  const readOnly = role === 'rhsc_hq' || role === 'hefamaa_reviewer'
  const scopedVisits = scope && scope !== 'all' ? visits.filter(v => (v.area || 'Unassigned') === scope) : visits
  const areas = Array.from(new Set(scopedVisits.map(v => v.area || 'Unassigned'))).sort()
  const rows = scopedVisits.filter(v => (area === 'all' || (v.area || 'Unassigned') === area) && (status === 'all' || v.status === status) && matchQ(v, q))
  const due = scopedVisits.filter(v => v.debrief && v.debrief.remediation_deadline).map(v => ({ v, date: v.debrief.remediation_deadline, days: daysUntil(v.debrief.remediation_deadline) })).sort((a, b) => (a.date < b.date ? -1 : 1))
  function inRange(v) { const d = (v.arrival_time || v.created_at || '').slice(0, 10); return d && d >= from && d <= to }
  const rangePool = scopedVisits.filter(v => needsApproval(v) && inRange(v))
  const batch = rangePool.filter(v => approvalState(v) === 'approved')
  const pendingCount = rangePool.length - batch.length

  function doc(v, kind) { const d = v.debrief || deriveDebrief(v); if (kind === 'report') printDoc('Monitoring Report', buildReport(v, d, origin)); else printDoc('Compliance Letter', buildLetter(v, d, origin)) }
  function summary(v) { return v.facility_name + ' (' + v.area + '): outcome ' + ragText(v.overall_rating) + (v.score != null ? ' ' + v.score + '%' : '') + ', visit ' + (v.arrival_time || v.created_at || '').slice(0, 10) + '.' }

  return (<div className="page">
    <div className="ptitle"><div><p className="eyebrow">Reports{readOnly ? ' \u00b7 view only' : ''}</p><h2>{rows.length} visit{rows.length === 1 ? '' : 's'}</h2></div>
      <div className="ptools">
        <SearchBox value={q} onChange={setQ} placeholder="Search…" />
        <select className="sel" value={area} onChange={e => setArea(e.target.value)}><option value="all">All areas</option>{areas.map(a => <option key={a} value={a}>{a}</option>)}</select>
        <select className="sel" value={status} onChange={e => setStatus(e.target.value)}><option value="all">All statuses</option><option value="engaged">Engaged</option><option value="monitored">Monitored</option><option value="debriefed">Debriefed</option></select>
        <button className="btn small ghost" onClick={() => exportVisitsCSV(rows)}>CSV</button>
        <button className="btn small ghost" onClick={() => exportVisitsXLS(rows)}>Excel</button>
        <button className="btn small ghost" onClick={() => exportVisitsPDF(rows, origin)}>PDF</button>
        <button className="btn small primary" onClick={() => buildDailyPDF(rows, origin)}>Daily report</button>
        <AIButton className="btn small ghost" label="AI summary" build={() => { const agg = rows.map(v => ({ facility: v.facility_name, area: v.area, rating: v.overall_rating, score: v.score, status: v.status })); return { system: 'You are the RHSC monitoring analyst. Write a brief executive summary (4 to 6 sentences) of these monitoring results for HEFAMAA leadership: coverage, overall compliance picture, notable areas or facilities needing attention. Use only the data given.', prompt: JSON.stringify(agg), max_tokens: 500 } }} onText={txt => setAiSummary(txt)} />
      </div>
    </div>
    {aiSummary && <div className="ai-panel"><h4><span className="ai-spark">✦</span> AI executive summary</h4><p className="ai-text">{aiSummary}</p><button className="linkbtn subtle" onClick={() => setAiSummary('')}>Dismiss</button></div>}

    <div className="submit-panel">
      <div className="submit-head"><h3>Weekly HEFAMAA submission</h3><span className="hintline">Approved inspection reports only, as one PDF to email to the agency.</span></div>
      <div className="submit-row">
        <label className="field sm inline"><span>From</span><input type="date" value={from} onChange={e => setFrom(e.target.value)} /></label>
        <label className="field sm inline"><span>To</span><input type="date" value={to} onChange={e => setTo(e.target.value)} /></label>
        <span className="chip green">{batch.length} approved</span>
        <button className="btn small primary" onClick={() => { if (!batch.length) { toast('No approved reports in that range.', 'warn'); return } printDoc('HEFAMAA submission ' + from + ' to ' + to, buildWeeklyBatch(batch, origin, from, to)) }}>Build submission PDF</button>
        <a className="btn small ghost" href={mailtoLink('HEFAMAA submission: ' + from + ' to ' + to + ' (Realms Consulting)', 'Dear HEFAMAA,\n\nPlease find attached the inspection reports for ' + from + ' to ' + to + ', covering ' + batch.length + ' facilities monitored by REALMS Healthcare Services Consulting Limited.\n\nKind regards,\nREALMS Healthcare Services Consulting Limited', '')}>Email to HEFAMAA</a>
      </div>
      {pendingCount > 0 && <p className="warnline">{pendingCount} report{pendingCount === 1 ? '' : 's'} in this range still await Team Lead approval and are not included.</p>}
    </div>

    {due.length > 0 && (<div className="dsec"><h3>Re-inspections due</h3>
      <div className="frows">{due.map(({ v, date, days }) => (
        <div className="frow" key={v.id}><div className="fmain"><span className="fname">{v.facility_name}</span><span className="fmeta">{v.area} &middot; due {date}</span></div>
          <span className={'chip ' + (days != null && days < 0 ? 'red' : days != null && days <= 7 ? 'amber' : 'none')}>{days == null ? '' : days < 0 ? Math.abs(days) + ' days overdue' : 'in ' + days + ' days'}</span></div>
      ))}</div>
    </div>)}

    {loading ? <div>{[0, 1, 2, 3].map(i => <div key={i} className="skeleton skel-row" />)}</div> :
      rows.length === 0 ? <p className="empty">No visits match these filters.</p> :
      <div className="rep-rows">{rows.map(v => (
        <div className="rep-row" key={v.id}>
          <div className="rep-main"><span className="fname">{v.facility_name}</span><span className="fmeta">{v.area} &middot; {(v.arrival_time || v.created_at || '').slice(0, 10)}</span></div>
          <div className="rep-mid">{v.score != null ? <Chip rag={v.overall_rating} pct={v.score} /> : <span className={'chip ' + (v.status || 'engaged')}>{v.status === 'monitored' ? 'Assessed' : v.status === 'debriefed' ? 'Debriefed' : 'Engaged'}</span>}{v.debrief && v.debrief.closure_recommended && <span className="risk-badge high">Closure</span>}{v.debrief && v.debrief.escalated && <span className="risk-badge high">Escalated</span>}{v.debrief && v.debrief.genesys_interest && <span className="risk-badge low">Genesys</span>}{needsApproval(v) && <span className={'appr-chip ' + approvalState(v)}>{approvalState(v) === 'approved' ? 'Approved' : approvalState(v) === 'returned' ? 'Returned' : 'Pending'}</span>}</div>
          <div className="rep-actions">
            <button className="mini" onClick={() => doc(v, 'report')}>Report</button>
            <button className="mini" onClick={() => doc(v, 'letter')}>Letter</button>
            <button className="mini" onClick={() => printDoc('HEFAMAA Inspection Report', buildInspectionReport(v, v.debrief || deriveDebrief(v), origin))}>Inspection</button>
            <button className="mini" onClick={() => printDoc('HEFAMAA Form', buildHefamaaDoc(v, origin))}>HEFAMAA</button>
            {!readOnly && <button className="mini" onClick={() => setNotifyId(notifyId === v.id ? null : v.id)}>Notify</button>}
          </div>
          {!readOnly && notifyId === v.id && <NotifyPanel v={v} summary={summary} />}
        </div>
      ))}</div>}
  </div>)
}

function HeatMap({ points }) {
  const ref = useRef(null); const obj = useRef(null); const layer = useRef(null)
  useEffect(() => {
    if (!ref.current || obj.current) return
    const m = L.map(ref.current, { scrollWheelZoom: false }).setView([6.5244, 3.3792], 10)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '\u00a9 OpenStreetMap contributors' }).addTo(m)
    layer.current = L.layerGroup().addTo(m); obj.current = m; setTimeout(() => m.invalidateSize(), 200)
    return () => { m.remove(); obj.current = null }
  }, [])
  useEffect(() => {
    const m = obj.current, lg = layer.current; if (!m || !lg) return
    m.invalidateSize(); lg.clearLayers(); const col = { green: '#2E7D46', amber: '#C77D0A', red: '#B4442E', none: '#9C86B8' }
    points.forEach(p => { L.circleMarker([p.lat, p.lng], { radius: 9, color: '#fff', weight: 2, fillColor: col[p.rag || 'none'], fillOpacity: .9 }).bindPopup('<strong>' + p.name + '</strong><br>' + (p.rag ? ragText(p.rag) : 'Not assessed')).addTo(lg) })
    if (points.length) { try { m.fitBounds(points.map(p => [p.lat, p.lng]), { padding: [40, 40], maxZoom: 13 }) } catch (e) {} }
  }, [points])
  return <div className="map-frame"><div ref={ref} className="leaflet-holder" /></div>
}

function StatCard({ value, label }) {
  const isNum = typeof value === 'number'
  const num = isNum ? value : (typeof value === 'string' && /^\d+%?$/.test(value) ? parseInt(value, 10) : null)
  const suffix = typeof value === 'string' && value.endsWith('%') ? '%' : ''
  const n = useCountUp(num == null ? 0 : num)
  return (<div className="an-card"><span className="an-v">{num == null ? value : (n + suffix)}</span><span className="an-l">{label}</span></div>)
}
function Donut({ data }) {
  const total = data.reduce((s, d) => s + d.value, 0) || 1
  const R = 54, C = 2 * Math.PI * R; let off = 0
  return (<div className="donut">
    <svg viewBox="0 0 140 140" className="donut-svg">
      <circle cx="70" cy="70" r={R} fill="none" stroke="#EDE7F4" strokeWidth="18" />
      {data.map((d, i) => { const dash = d.value / total * C; const el = (<circle key={i} cx="70" cy="70" r={R} fill="none" stroke={d.color} strokeWidth="18" strokeDasharray={dash + ' ' + (C - dash)} strokeDashoffset={-off} transform="rotate(-90 70 70)" />); off += dash; return el })}
      <text x="70" y="67" textAnchor="middle" className="donut-num">{total}</text>
      <text x="70" y="85" textAnchor="middle" className="donut-lab">assessed</text>
    </svg>
    <div className="donut-legend">{data.map((d, i) => (<div key={i} className="dl"><span className="dot" style={{ background: d.color }} />{d.label}<em>{d.value}</em></div>))}</div>
  </div>)
}
function Ring({ pct, label }) {
  const R = 48, C = 2 * Math.PI * R; const dash = (pct == null ? 0 : pct) / 100 * C; const disp = pct == null ? '-' : pct + '%'
  return (<div className="ring">
    <svg viewBox="0 0 120 120" className="ring-svg">
      <circle cx="60" cy="60" r={R} fill="none" stroke="#EDE7F4" strokeWidth="12" />
      <circle cx="60" cy="60" r={R} fill="none" stroke="#6D4B8E" strokeWidth="12" strokeLinecap="round" strokeDasharray={dash + ' ' + (C - dash)} transform="rotate(-90 60 60)" />
      <text x="60" y="58" textAnchor="middle" className="ring-num">{disp}</text>
      <text x="60" y="77" textAnchor="middle" className="ring-lab">green</text>
    </svg>
    <span className="ring-cap">{label}</span>
  </div>)
}
function monthLabel(m) { try { return new Date(m + '-01T00:00:00').toLocaleString('en', { month: 'short' }) } catch (e) { return m } }
function riskLevel(s) { return s >= 4 ? 'High' : s >= 2 ? 'Medium' : 'Low' }
function LineChart({ points }) {
  const W = 560, H = 180, pad = 30
  if (!points.length) return <p className="empty sm">Not enough data yet.</p>
  const max = Math.max(100, ...points.map(p => p.value)); const min = 0; const n = points.length
  const x = i => n === 1 ? W / 2 : pad + i * (W - 2 * pad) / (n - 1)
  const y = v => H - pad - (v - min) / (max - min) * (H - 2 * pad)
  const d = points.map((p, i) => (i ? 'L' : 'M') + x(i).toFixed(1) + ' ' + y(p.value).toFixed(1)).join(' ')
  const area = d + ' L' + x(n - 1).toFixed(1) + ' ' + (H - pad) + ' L' + x(0).toFixed(1) + ' ' + (H - pad) + ' Z'
  return (<svg viewBox={'0 0 ' + W + ' ' + H} className="line-chart">
    <line x1={pad} y1={H - pad} x2={W - pad} y2={H - pad} stroke="#EDE7F4" />
    <path d={area} fill="#6D4B8E" opacity="0.08" />
    <path d={d} fill="none" stroke="#6D4B8E" strokeWidth="2.5" strokeLinejoin="round" />
    {points.map((p, i) => (<g key={i}><circle cx={x(i)} cy={y(p.value)} r="4" fill="#6D4B8E" /><text x={x(i)} y={H - pad + 16} textAnchor="middle" className="lc-x">{p.label}</text><text x={x(i)} y={y(p.value) - 10} textAnchor="middle" className="lc-v">{p.value}</text></g>))}
  </svg>)
}
function AnalyticsBody({ facilities }) {
  const [visits, setVisits] = useState([])
  useEffect(() => { VIS.list().then(setVisits).catch(() => {}) }, [])
  const vis = visits
  const areas = Array.from(new Set(facilities.map(f => f.area || 'Unassigned')))
  const assessed = vis.filter(v => v.score != null)
  const avg = assessed.length ? Math.round(assessed.reduce((a, v) => a + v.score, 0) / assessed.length) : null
  const compliant = assessed.filter(v => v.overall_rating === 'green').length
  const complianceRate = assessed.length ? Math.round(compliant / assessed.length * 100) : null
  const rag = { green: 0, amber: 0, red: 0 }; assessed.forEach(v => { if (v.overall_rating && rag[v.overall_rating] != null) rag[v.overall_rating]++ })
  const byArea = {}; vis.forEach(v => { const a = v.area || 'Unassigned'; byArea[a] = (byArea[a] || 0) + 1 })
  const areaRows = Object.keys(byArea).sort().map(a => ({ a, n: byArea[a] })); const maxArea = Math.max(1, ...areaRows.map(r => r.n))
  const latest = {}; vis.forEach(v => { const id = v.facility_id; if (!id) return; if (!latest[id] || (v.created_at || '') > (latest[id].created_at || '')) latest[id] = v })
  const points = facilities.filter(hasCoords).map(f => ({ lat: f.lat, lng: f.lng, name: f.name, rag: latest[f.id] ? latest[f.id].overall_rating : null }))
  const cards = [{ v: facilities.length, l: 'Facilities' }, { v: areas.length, l: 'Areas covered' }, { v: vis.length, l: 'Visits' }, { v: assessed.length, l: 'Assessed' }, { v: avg == null ? '-' : avg + '%', l: 'Average score' }, { v: complianceRate == null ? '-' : complianceRate + '%', l: 'Green rate' }]
  const donutData = [{ label: 'Green', value: rag.green, color: '#2E7D46' }, { label: 'Amber', value: rag.amber, color: '#C77D0A' }, { label: 'Red', value: rag.red, color: '#B4442E' }]

  // compliance trend over time (by month)
  const byMonth = {}; assessed.forEach(v => { const m = (v.arrival_time || v.created_at || '').slice(0, 7); if (!m) return; (byMonth[m] = byMonth[m] || []).push(v.score) })
  const trend = Object.keys(byMonth).sort().map(m => ({ label: monthLabel(m), value: Math.round(byMonth[m].reduce((a, b) => a + b, 0) / byMonth[m].length) }))

  // team / monitor performance
  const perf = {}; vis.forEach(v => { (v.team || []).forEach(t => { const k = t.name; if (!k) return; const m = perf[k] = perf[k] || { name: k, role: t.role, visits: 0, sum: 0, scored: 0 }; m.visits++; if (v.score != null) { m.sum += v.score; m.scored++ } }) })
  const monitors = Object.values(perf).map(m => ({ ...m, avg: m.scored ? Math.round(m.sum / m.scored) : null })).sort((a, b) => b.visits - a.visits).slice(0, 6)

  // facility risk ranking
  const now = Date.now()
  const risk = facilities.map(f => {
    const lv = latest[f.id]; let s = 0
    if (lv) { if (lv.overall_rating === 'red') s += 3; else if (lv.overall_rating === 'amber') s += 2; else if (!lv.overall_rating) s += 1 } else s += 1
    const dl = lv && lv.debrief && lv.debrief.remediation_deadline
    if (dl && new Date(dl + 'T00:00:00').getTime() < now) s += 2
    return { f, s, rag: lv ? lv.overall_rating : null }
  }).sort((a, b) => b.s - a.s)
  const topRisk = risk.filter(r => r.s >= 2).slice(0, 6)

  return (<>
    <div className="an-cards">{cards.map(c => (<StatCard key={c.l} value={c.v} label={c.l} />))}</div>
    <div className="an-two">
      <div className="an-panel"><h3>Compliance outcomes</h3>{assessed.length === 0 ? <p className="empty sm">No assessments yet.</p> : <Donut data={donutData} />}</div>
      <div className="an-panel ring-panel"><h3>Green rate</h3><Ring pct={complianceRate} label="Rated green at the most recent visit" /></div>
    </div>
    <div className="an-panel"><h3>Compliance trend</h3>
      <p className="hintline">Average compliance score by month.</p>
      <LineChart points={trend} />
    </div>
    <div className="an-two">
      <div className="an-panel"><h3>Team performance</h3>
        {monitors.length === 0 ? <p className="empty sm">No visits yet.</p> : <div className="perf">{monitors.map(m => {
          const rg = m.avg == null ? null : m.avg >= 80 ? 'green' : m.avg >= 50 ? 'amber' : 'red'
          return (<div className="perf-row" key={m.name}><span className="perf-name">{m.name}<em>{m.role}</em></span><span className="perf-stat">{m.visits} visit{m.visits === 1 ? '' : 's'}</span><Chip rag={rg} pct={m.avg == null ? null : m.avg} /></div>)
        })}</div>}
      </div>
      <div className="an-panel"><h3>Facilities needing attention</h3>
        {topRisk.length === 0 ? <p className="empty sm">Nothing flagged.</p> : <div className="risk">{topRisk.map(r => (
          <div className="risk-row" key={r.f.id}><span className="risk-name">{r.f.name}<em>{r.f.area || 'Unassigned'}</em></span><span className={'risk-badge ' + riskLevel(r.s).toLowerCase()}>{riskLevel(r.s)} risk</span></div>
        ))}</div>}
      </div>
    </div>
    <div className="an-panel"><h3>Visits by area</h3>
      {areaRows.length === 0 ? <p className="empty sm">No visits yet.</p> : <div className="bars">{areaRows.map(r => (
        <div className="bar-row" key={r.a}><span className="bar-lab">{r.a}</span><div className="bar-track"><div className="bar-fill" style={{ width: (r.n / maxArea * 100) + '%' }} /></div><span className="bar-n">{r.n}</span></div>
      ))}</div>}
    </div>
    <div className="an-panel"><h3>Geographic outcomes</h3>
      <p className="hintline">Each facility is coloured by its most recent visit outcome. Grey means not yet assessed.</p>
      {points.length === 0 ? <p className="empty sm">No mapped facilities yet.</p> : <HeatMap points={points} />}
    </div>
  </>)
}

/* ---------- bars ---------- */
function useCountUp(target, ms = 900) {
  const [n, setN] = useState(0)
  useEffect(() => {
    if (typeof target !== 'number' || isNaN(target)) { setN(target); return }
    let raf, start
    const step = (t) => { if (!start) start = t; const p = Math.min(1, (t - start) / ms); setN(Math.round(target * (1 - Math.pow(1 - p, 3)))); if (p < 1) raf = requestAnimationFrame(step) }
    raf = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf)
  }, [target])
  return n
}
function TabIcon({ id }) {
  const p = {
    dashboard: 'M4 13h6V4H4v9zm0 7h6v-5H4v5zm10 0h6V11h-6v9zm0-16v5h6V4h-6z',
    facilities: 'M5 21h14M7 21V7l5-4 5 4v14M10 21v-4h4v4',
    map: 'M9 4 3 6v15l6-2 6 2 6-2V4l-6 2-6-2zM9 4v15M15 6v15',
    engage: 'M12 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM5 20c0-3.5 3-6 7-6s7 2.5 7 6',
    monitor: 'M5 3h14v14H5zM8 9l2 2 4-5M8 13h6M9 21h6',
    debrief: 'M6 3h12v18l-6-3-6 3zM9 8h6M9 12h4',
    assign: 'M8 6h11M8 12h11M8 18h11M4 6h.01M4 12h.01M4 18h.01',
    reports: 'M7 3h7l5 5v13H7zM14 3v5h5M9 13h6M9 17h6',
    analytics: 'M4 20V11M10 20V4M16 20v-7M22 20H2',
    myfacility: 'M5 21h14M7 21V7l5-4 5 4v14M10 13h4M10 17h4',
    followups: 'M4 4h5l2 5-3 2a12 12 0 006 6l2-3 5 2v5a2 2 0 01-2 2A16 16 0 014 6a2 2 0 012-2',
    settings: 'M12 15a3 3 0 100-6 3 3 0 000 6zM19 12a7 7 0 00-.1-1l2-1.6-2-3.4-2.4 1a7 7 0 00-1.7-1l-.3-2.6H9.5l-.3 2.6a7 7 0 00-1.7 1l-2.4-1-2 3.4L3.1 11a7 7 0 000 2l-2 1.6 2 3.4 2.4-1a7 7 0 001.7 1l.3 2.6h4.9l.3-2.6a7 7 0 001.7-1l2.4 1 2-3.4-2-1.6a7 7 0 00.1-1z',
    assistant: 'M12 3l2 5 5 2-5 2-2 5-2-5-5-2 5-2zM19 15l1 2.5L22 19l-2 1-1 2.5-1-2.5L16 19l2-1z',
    approvals: 'M9 12l2 2 4-4M12 3l7 4v5c0 4.5-3 8.3-7 9-4-.7-7-4.5-7-9V7z'
  }[id] || 'M4 4h16v16H4z'
  return (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d={p} /></svg>)
}
function SiteBar({ tab, setTab, onSignIn, lang, setLang, t }) {
  return (<header className="bar">
    <button className="wordmark" onClick={() => setTab('home')} aria-label="REALMS home"><img className="mark" src="/rhsc-mark.png" alt="RHSC" /><span className="wm-text"><strong>REALMS</strong><em>Healthcare Services Consulting</em></span></button>
    <nav className="tabs" aria-label="Primary">{SITE_TABS.map(tb => (<button key={tb.id} className={'tab' + (tab === tb.id ? ' active' : '')} onClick={() => setTab(tb.id)}>{t('nav_' + tb.id)}</button>))}</nav>
    <div className="bar-right">
      <select className="langsel" value={lang} onChange={e => setLang(e.target.value)} aria-label="Language">{LANGS.map(l => <option key={l.code} value={l.code}>{l.label}</option>)}</select>
      <button className="signin" onClick={onSignIn}>{t('cta_signin')}</button>
    </div>
  </header>)
}
function TopBarApp({ identity, realRole, viewAsName, onViewAs, onEditName, onSignOut, onToggleNav }) {
  const isHQ = realRole === 'rhsc_hq'
  return (<header className="topbar">
    <div className="tb-left">
      <button className="navtoggle" onClick={onToggleNav} aria-label="Menu"><svg viewBox="0 0 24 24" stroke="currentColor" fill="none" strokeWidth="2"><path d="M4 7h16M4 12h16M4 17h16" /></svg></button>
      <img className="mark" src="/rhsc-mark.png" alt="RHSC" />
      <span className="tb-name">REALMS FIELD</span>
      {isHQ && (<div className="ws"><label>View as</label>
        <select value={viewAsName} onChange={e => onViewAs(e.target.value)}>
          <option value="">My view (HQ)</option>
          {VIEW_USERS.map(u => <option key={u.name} value={u.name}>{u.name + ' \u00b7 ' + ((roleById(u.role) || {}).label || '')}</option>)}
        </select>
      </div>)}
    </div>
    <div className="tb-right"><button className="who" onClick={onEditName} title="Edit your name">{identity.first}</button><button className="signin" onClick={onSignOut}>Sign out</button></div>
  </header>)
}
function Sidebar({ role, appTab, setAppTab, collapsed, setCollapsed, open, setOpen }) {
  const r = roleById(role); const tabs = ROLE_TABS[role] || ['dashboard']
  return (<>
    <div className={'scrim' + (open ? ' show' : '')} onClick={() => setOpen(false)} />
    <aside className={'sidebar' + (collapsed ? ' collapsed' : '') + (open ? ' open' : '')}>
      <div className="sb-head"><span className="sb-role">{r ? r.label : 'Workspace'}</span></div>
      <nav className="sb-nav">{tabs.map(t => (
        <button key={t} className={'sb-item' + (appTab === t ? ' active' : '')} onClick={() => { setAppTab(t); setOpen(false) }} title={TAB_LABEL[t]}>
          <span className="sb-ico"><TabIcon id={t} /></span><span className="sb-lab">{TAB_LABEL[t]}</span>
        </button>
      ))}</nav>
      <button className="sb-collapse" onClick={() => setCollapsed(c => !c)} title="Collapse menu">
        <svg viewBox="0 0 24 24" stroke="currentColor" fill="none" strokeWidth="2"><path d={collapsed ? 'M9 6l6 6-6 6' : 'M15 6l-6 6 6 6'} /></svg><span className="sb-lab">Collapse</span>
      </button>
    </aside>
  </>)
}

/* ---------- root ---------- */
export default function App() {
  const [tab, setTab] = useState('home')
  const [view, setView] = useState('site')
  const [user, setUser] = useState(null)
  const [role, setRole] = useState(null)
  const [hqPending, setHqPending] = useState(false)
  const [pendKind, setPendKind] = useState('rhsc_hq')
  const [myFacility, setMyFacility] = useState(null)
  const [appTab, setAppTab] = useState('dashboard')
  const [facs, setFacs] = useState([])
  const [navCollapsed, setNavCollapsed] = useState(false)
  const [navOpen, setNavOpen] = useState(false)
  const [viewAs, setViewAs] = useState(null)
  const [dbError, setDbError] = useState('')
  const [lang, setLang] = useState(() => { try { return localStorage.getItem('realms_lang') || 'en' } catch (e) { return 'en' } })
  function changeLang(l) { setLang(l); try { localStorage.setItem('realms_lang', l) } catch (e) {} }
  const seedTriedRef = useRef(false)

  useEffect(() => {
    let forceOut = false
    try { if (!localStorage.getItem('realms_reauth_v3')) { localStorage.setItem('realms_reauth_v3', '1'); localStorage.removeItem('realms_demo_user'); localStorage.removeItem('realms_demo_role'); forceOut = true } } catch (e) {}
    if (MODE === 'supabase') {
      let subscription
      try {
        if (forceOut) { try { supabase.auth.signOut() } catch (e) {} }
        const res = supabase.auth.onAuthStateChange((_e, s) => {
          if (s && s.user) { setUser({ email: s.user.email, id: s.user.id, name: (s.user.user_metadata && s.user.user_metadata.full_name) || '' }); loadRole(s.user.id, { email: s.user.email }); setView('app') }
          else { setUser(null); setRole(null); setViewAs(null); setView(prev => (prev === 'app' ? 'site' : prev)) }
        })
        subscription = res.data.subscription
      } catch (e) { /* site still renders */ }
      return () => { if (subscription) subscription.unsubscribe() }
    } else {
      if (forceOut) return
      try {
        const raw = localStorage.getItem('realms_demo_user'); const dr = localStorage.getItem('realms_demo_role')
        if (raw) { setUser(JSON.parse(raw)); if (dr) setRole(dr); setView('app') }
      } catch (e) { /* ignore */ }
    }
  }, [])

  // load facilities whenever we enter the app with a role
  useEffect(() => { if (view === 'app' && user && role) reloadFacs() }, [view, role])
  // reminders: run once a day, quietly, when an oversight role opens the app
  useEffect(() => {
    if (!(view === 'app' && user && (role === 'rhsc_hq' || role === 'team_leader'))) return
    const today = new Date().toISOString().slice(0, 10)
    let last = ''
    try { last = localStorage.getItem('realms_reminders_run') || '' } catch (e) {}
    if (last === today) return
    let live = true
    const t = setTimeout(async () => {
      try {
        const vs = await VIS.list()
        const out = await runReminders(vs, facs, user.id)
        if (!live) return
        try { localStorage.setItem('realms_reminders_run', today) } catch (e) {}
        if (out.length) toast(out.length + ' re-inspection reminder' + (out.length === 1 ? '' : 's') + ' sent.')
      } catch (e) {}
    }, 4000)
    return () => { live = false; clearTimeout(t) }
  }, [view, role, facs.length])

  async function reloadFacs() {
    setDbError('')
    let list = []
    try { list = await FAC.list() } catch (e) { setDbError((e && e.message) || 'Could not read the database.'); setFacs([]); return }
    let noSeed = false; try { noSeed = !!localStorage.getItem('realms_no_seed') } catch (e) {}
    if (MODE === 'demo' && list.length === 0 && !seedTriedRef.current && !noSeed) {
      seedTriedRef.current = true
      const res = await seedSampleData(user && user.id)
      try { list = await FAC.list() } catch (e) {}
      if (list.length === 0 && res && res.error) setDbError(res.error)
    }
    setFacs(list)
  }
  async function loadSample() {
    setDbError(''); seedTriedRef.current = true
    const res = await seedSampleData(user && user.id)
    try {
      const list = await FAC.list(); setFacs(list)
      if (list.length === 0 && res && res.error) setDbError(res.error)
      else if (res && res.error) { setDbError('Facilities loaded, but the visit records failed: ' + res.error); toast('Facilities loaded, but visit records failed. See the message on the dashboard.', 'err') }
      else if (list.length) toast(list.length + ' live facilities loaded.')
    }
    catch (e) { setDbError((e && e.message) || 'Could not read the database.') }
  }
  async function clearAll() {
    if (!(await confirmAction('This removes ALL facilities, visits and assignments. It cannot be undone.', { title: 'Clear all data', ok: 'Clear everything', danger: true }))) return
    try { await clearAllData() } catch (e) {}
    try { localStorage.setItem('realms_no_seed', '1') } catch (e) {}
    seedTriedRef.current = true; setFacs([]); setDbError(''); toast('All data cleared.')
  }
  function editName() {
    const n = window.prompt('Your name (only your first name is used to greet you)', (user && user.name) || '')
    if (n == null) return; const nm = n.trim(); if (!nm) return
    setUser(u => ({ ...(u || {}), name: nm }))
    if (MODE === 'supabase') { try { supabase.auth.updateUser({ data: { full_name: nm } }) } catch (e) {} }
    else { try { const raw = JSON.parse(localStorage.getItem('realms_demo_user') || '{}'); localStorage.setItem('realms_demo_user', JSON.stringify({ ...raw, name: nm })) } catch (e) {} }
  }
  function doViewAs(name) {
    if (!name) { setViewAs(null); setAppTab('dashboard'); return }
    const u = VIEW_USERS.find(x => x.name === name); if (u) { setViewAs(u); setAppTab('dashboard') }
  }

  async function loadRole(uid, u) {
    if (MODE !== 'supabase') return
    try {
      const { data } = await supabase.from('kv').select('v').eq('user_id', uid).eq('k', 'role').maybeSingle()
      const r = data && data.v ? (typeof data.v === 'string' ? data.v : data.v.role) : null
      if (!r) return
      if (r === 'rhsc_hq' && !isOwner(u)) {
        let req = null
        try { req = await ACC.mine(uid, 'rhsc_hq') } catch (e) {}
        if (!req) {
          // Role was saved before the gate existed. Raise the request now, so it reaches the executive office.
          try { req = await ACC.request({ user_id: uid, email: (u && u.email) || '', name: (u && u.name) || '', role: 'rhsc_hq' }) } catch (e) {}
          try { sendNotify({ channel: 'email', to: OWNER_EMAIL, subject: 'HQ access request', message: ((u && (u.name || u.email)) || 'A user') + ' has requested RHSC HQ access on Realms Field.' }) } catch (e) {}
        }
        if (!req || req.status !== 'approved') { setPendKind('rhsc_hq'); setHqPending(true); setRole(null); return }
      }
      if (r === 'facility_proprietor') {
        let req = null
        try { req = await ACC.mine(uid, 'facility_proprietor') } catch (e) {}
        if (!req || req.status !== 'approved') { setPendKind('facility_proprietor'); setHqPending(true); setRole(null); return }
        setMyFacility(req.facility_id || null)
      }
      setHqPending(false); setRole(r)
    } catch (e) { /* role picker will show */ }
  }
  async function pickRole(id) {
    if (MODE === 'supabase' && user) { try { await supabase.from('kv').upsert({ user_id: user.id, k: 'role', v: id, updated_at: new Date().toISOString() }) } catch (e) {} }
    else localStorage.setItem('realms_demo_role', id)
    if (id === 'rhsc_hq' && user && !isOwner(user)) {
      try { await ACC.request({ user_id: user.id, email: user.email, name: user.name || '', role: 'rhsc_hq' }) } catch (e) {}
      setPendKind('rhsc_hq'); setHqPending(true); setRole(null)
      try { sendNotify({ channel: 'email', to: OWNER_EMAIL, subject: 'HQ access request', message: (user.name || user.email) + ' has requested RHSC HQ access on Realms Field.' }) } catch (e) {}
      return
    }
    if (id === 'facility_proprietor' && user) { setPendKind('facility_proprietor'); setHqPending(true); setRole(null); return }
    setHqPending(false); setRole(id); setAppTab('dashboard')
  }
  function afterAuth(u) { setUser(u); setView('app') }
  async function signOut() {
    if (MODE === 'supabase') { try { await supabase.auth.signOut() } catch (e) {} }
    else { localStorage.removeItem('realms_demo_user'); localStorage.removeItem('realms_demo_role') }
    setUser(null); setRole(null); setHqPending(false); setViewAs(null); setView('site'); setTab('home'); setAppTab('dashboard')
  }

  const identity = user ? identityFor(user.email, user.name) : { name: 'Staff', first: 'Staff', title: '' }
  const t = makeT(lang)
  const effRole = viewAs ? viewAs.role : role
  const effId = viewAs ? { name: viewAs.name, first: viewAs.name.split(' ')[0], title: '', photo: '' } : identity
  const canEdit = CAN_EDIT.includes(effRole)

  let body
  if (view === 'auth') body = <AuthPanel onDone={afterAuth} onCancel={() => setView('site')} />
  else if (view === 'app' && user) {
    if (hqPending) body = <PendingAccess kind={pendKind} user={user} facilities={facs} identity={identity} onSignOut={signOut} onBack={() => setHqPending(false)} />
    else if (!role) body = <RolePicker identity={identity} onPick={pickRole} onSignOut={signOut} />
    else if (appTab === 'facilities') body = <FacilitiesPage list={facs} canEdit={canEdit} userId={user.id} reload={reloadFacs} />
    else if (appTab === 'map') body = <MapRoutePage list={facs} role={effRole} userId={user.id} />
    else if (appTab === 'engage') body = <EngagePage list={facs} identity={effId} role={effRole} userId={user.id} />
    else if (appTab === 'monitor') body = <MonitorPage userId={user.id} />
    else if (appTab === 'debrief') body = <DebriefPage userId={user.id} />
    else if (appTab === 'reports') body = <ReportsPage facilities={facs} userId={user.id} role={effRole} />
    else if (appTab === 'myfacility') body = <ProprietorPage facilityId={myFacility} facilities={facs} />
    else if (appTab === 'followups') body = <FollowUpsPage userId={user.id} identity={identity} />
    else if (appTab === 'settings') body = <SettingsPage user={user} identity={identity} facilities={facs} />
    else if (appTab === 'assistant') body = <AssistantPage facilities={facs} />
    else if (appTab === 'approvals') body = <ApprovalsPage userId={user.id} identity={effId} role={effRole} />
    else if (appTab === 'assign') body = <AssignPage list={facs} userId={user.id} />
    else body = <Dashboard identity={effId} role={effRole} onOpen={setAppTab} facilities={facs} onSeed={loadSample} onClear={clearAll} dbError={dbError} />
  } else {
    body = tab === 'home' ? <HomePage onSignIn={() => setView('auth')} go={setTab} t={t} />
      : tab === 'services' ? <ServicesPage go={setTab} />
      : tab === 'monitoring' ? <MonitoringPage onSignIn={() => setView('auth')} go={setTab} />
      : tab === 'about' ? <AboutPage />
      : tab === 'leadership' ? <LeadershipPage go={setTab} />
      : <ContactPage />
  }

  const showAppShell = view === 'app' && user && role
  const showAuthBare = view === 'auth'

  if (showAppShell) {
    return (<div className="realms app-mode">
      <style>{css}</style>
      <Overlays />
      <TopBarApp identity={effId} realRole={role} viewAsName={viewAs ? viewAs.name : ''} onViewAs={doViewAs} onEditName={editName} onSignOut={signOut} onToggleNav={() => setNavOpen(o => !o)} />
      {viewAs && (<div className="viewas-bar">Viewing as {viewAs.name} &middot; {(roleById(viewAs.role) || {}).label}<button onClick={() => doViewAs('')}>Return to my view</button></div>)}
      <div className="shell">
        <Sidebar role={effRole} appTab={appTab} setAppTab={setAppTab} collapsed={navCollapsed} setCollapsed={setNavCollapsed} open={navOpen} setOpen={setNavOpen} />
        <main className="app-main">{body}</main>
      </div>
    </div>)
  }

  return (<div className="realms">
    <style>{css}</style>
    <Overlays />
    {!showAuthBare && <SiteBar tab={tab} setTab={(t2) => { setView('site'); setTab(t2) }} onSignIn={() => setView('auth')} lang={lang} setLang={changeLang} t={t} />}
    <main id="top" className={showAuthBare ? 'main-auth' : ''}>{body}</main>
    {!showAuthBare && (<footer className="foot"><div className="foot-inner">
      <div className="foot-brand"><img className="foot-mark" src="/rhsc-mark.png" alt="RHSC" /><span>REALMS Healthcare Services Consulting Limited</span></div>
      <p className="foot-tag">{t('tagline')}</p>
    </div></footer>)}
    {!showAuthBare && <SiteAssistant />}
  </div>)
}

function SiteAssistant() {
  const [open, setOpen] = useState(false)
  const [msgs, setMsgs] = useState([{ role: 'assistant', text: 'Hello! I can help with questions about RHSC — our services, HEFAMAA monitoring, or booking a consultation. How can I help?' }])
  const [input, setInput] = useState(''); const [busy, setBusy] = useState(false)
  const boxRef = useRef(null)
  useEffect(() => { if (boxRef.current) boxRef.current.scrollTop = boxRef.current.scrollHeight }, [msgs, open])
  const SYS = 'You are the website assistant for REALMS Healthcare Services Consulting Limited (RHSC), a Lagos healthcare consulting firm and licensed HEFAMAA facility-monitoring operator. Services: strategy and advisory; quality and accreditation; facility monitoring and accreditation (HEFAMAA); training and capacity building; health financing; and digital health via the Genesys EMR. Office: 21 Fatai Arobieke Street, off Admiralty Way, Lekki Phase 1, Lagos. Answer briefly and warmly, help visitors understand the services and encourage booking a consultation on the Contact page. If asked something outside RHSC, gently redirect. Never invent specific prices, names or regulatory rulings.'
  async function send() {
    const q = input.trim(); if (!q || busy) return
    const next = msgs.concat([{ role: 'user', text: q }]); setMsgs(next); setInput(''); setBusy(true)
    const convo = next.map(m => (m.role === 'user' ? 'Visitor: ' : 'Assistant: ') + m.text).join('\n')
    const r = await askAI({ system: SYS, prompt: convo + '\nAssistant:', max_tokens: 500 })
    setBusy(false)
    setMsgs(m => m.concat([{ role: 'assistant', text: r.ok ? r.text : (r.reason === 'ai_not_configured' ? 'The assistant is not enabled yet. Please use the Contact page and our team will respond.' : 'Sorry, I could not respond just now. Please try the Contact page.') }]))
  }
  return (<>
    <button className="assistant-fab" onClick={() => setOpen(o => !o)} aria-label="Ask RHSC">{open ? '\u00d7' : 'Ask RHSC'}</button>
    {open && (<div className="assistant-panel">
      <div className="assistant-head"><span>Ask RHSC</span><button className="linkbtn subtle" onClick={() => setOpen(false)}>Close</button></div>
      <div className="assistant-msgs" ref={boxRef}>{msgs.map((m, i) => <div key={i} className={'amsg ' + m.role}>{m.text}</div>)}{busy && <div className="amsg assistant typing">&hellip;</div>}</div>
      <div className="assistant-input"><input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') send() }} placeholder="Type your question" /><button className="btn primary" onClick={send} disabled={busy}>Send</button></div>
    </div>)}
  </>)
}
function AssistantPage({ facilities }) {
  const [visits, setVisits] = useState([])
  const [msgs, setMsgs] = useState([{ role: 'assistant', text: 'Ask about your monitoring data: coverage, outcomes, overdue re-inspections, facilities needing attention, trends by area, and more.' }])
  const [input, setInput] = useState(''); const [busy, setBusy] = useState(false)
  const boxRef = useRef(null)
  useEffect(() => { VIS.list().then(setVisits).catch(() => {}) }, [])
  useEffect(() => { if (boxRef.current) boxRef.current.scrollTop = boxRef.current.scrollHeight }, [msgs])
  function dataSummary() {
    const byArea = {}, byStatus = {}, byRag = {}
    visits.forEach(v => { const a = v.area || 'Unassigned'; byArea[a] = (byArea[a] || 0) + 1; byStatus[v.status || 'engaged'] = (byStatus[v.status || 'engaged'] || 0) + 1; if (v.overall_rating) byRag[v.overall_rating] = (byRag[v.overall_rating] || 0) + 1 })
    const due = visits.filter(v => v.debrief && v.debrief.remediation_deadline).map(v => ({ facility: v.facility_name, area: v.area, due: v.debrief.remediation_deadline }))
    const recent = visits.slice(0, 40).map(v => ({ facility: v.facility_name, area: v.area, date: (v.arrival_time || v.created_at || '').slice(0, 10), status: v.status, rating: v.overall_rating, score: v.score }))
    return JSON.stringify({ facilities: facilities.length, areas: Array.from(new Set(facilities.map(f => f.area || 'Unassigned'))), visits: visits.length, byArea, byStatus, byRag, due, recent })
  }
  async function send() {
    const q = input.trim(); if (!q || busy) return
    const next = msgs.concat([{ role: 'user', text: q }]); setMsgs(next); setInput(''); setBusy(true)
    const sys = 'You are the RHSC operations analyst. Answer questions using ONLY the JSON monitoring data provided. Be concise, use concrete numbers, and if the data does not contain the answer say so plainly. RAG ratings: green = compliant, amber = partial, red = serious gaps.'
    const convo = next.map(m => (m.role === 'user' ? 'Q: ' : 'A: ') + m.text).join('\n')
    const r = await askAI({ system: sys, prompt: 'DATA:\n' + dataSummary() + '\n\n' + convo + '\nA:', max_tokens: 700 })
    setBusy(false)
    setMsgs(m => m.concat([{ role: 'assistant', text: r.ok ? r.text : (r.reason === 'ai_not_configured' ? 'AI is not set up yet. Add ANTHROPIC_API_KEY in Vercel to enable it.' : 'Could not respond. Please try again.') }]))
  }
  return (<div className="page">
    <div className="ptitle"><div><p className="eyebrow">AI</p><h2>Data assistant</h2></div></div>
    <div className="chat-wrap">
      <div className="chat-msgs" ref={boxRef}>{msgs.map((m, i) => <div key={i} className={'cmsg ' + m.role}>{m.text}</div>)}{busy && <div className="cmsg assistant">&hellip;</div>}</div>
      <div className="chat-input"><input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') send() }} placeholder="e.g. Which areas have the most red facilities?" /><button className="btn primary" onClick={send} disabled={busy}>Ask</button></div>
    </div>
    <p className="hintline">Answers are generated from your monitoring data. Verify before acting.</p>
  </div>)
}

const css = `
.realms { --ink:#3A2B54; --p:#6D4B8E; --p-deep:#574277; --p-mid:#7E63A0; --v:#A98FC4; --lav1:#F6F3FA; --lav2:#EDE7F4; --line:#E4DCEE; --white:#ffffff; --e1:0 1px 2px rgba(58,21,96,.05); --e2:0 4px 14px rgba(58,21,96,.07); --e3:0 14px 40px rgba(58,21,96,.11); --r-sm:10px; --r-md:14px; --r-lg:18px; --tap:44px; color:var(--ink); min-height:100vh; display:flex; flex-direction:column; }
.realms h1,.realms h2,.realms h3 { font-weight:600; letter-spacing:.01em; margin:0; }
.realms p { margin:0; }
.realms a { color:inherit; text-decoration:none; }
.realms img { display:block; max-width:100%; }
.realms button { font-family:inherit; cursor:pointer; }
.realms .eyebrow { font-size:12px; letter-spacing:.2em; text-transform:uppercase; color:var(--v); font-weight:600; margin:0 0 14px; }
.realms .accent { color:var(--p); }
.realms :focus-visible { outline:2.5px solid var(--p); outline-offset:3px; border-radius:6px; }
@keyframes fadeUp { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:none; } }
.realms .anim { animation: fadeUp .6s ease both; }
@media (prefers-reduced-motion: reduce){ .realms .anim { animation:none; } }

.realms .bar { position:sticky; top:0; z-index:1000; display:grid; grid-template-columns:1fr minmax(0,auto) 1fr; align-items:center; gap:16px; padding:12px clamp(18px,4vw,56px); background:rgba(255,255,255,.94); backdrop-filter:blur(8px); border-bottom:1px solid var(--line); }
.realms .wordmark { display:flex; align-items:center; gap:12px; background:none; border:0; padding:0; justify-self:start; }
.realms .bar-right { justify-self:end; display:flex; align-items:center; gap:10px; }
.realms .bar .mark { height:42px; width:auto; }
.realms .wm-text { display:flex; flex-direction:column; line-height:1.05; text-align:left; }
.realms .wm-text strong { font-size:18px; letter-spacing:.14em; color:var(--p-deep); }
.realms .wm-text em { font-style:normal; font-size:10px; letter-spacing:.12em; text-transform:uppercase; color:#8A7AA6; }
.realms .nav { display:flex; align-items:center; gap:12px; }
.realms .tabs { display:flex; align-items:center; gap:4px; background:var(--lav1); border:1px solid var(--line); border-radius:30px; padding:4px; }
.realms .tab { border:0; background:none; color:#5A4C74; font-size:14.5px; padding:8px 15px; border-radius:22px; transition:.16s; white-space:nowrap; }
.realms .tab:hover { color:var(--p); }
.realms .tab.active { background:#fff; color:var(--p-deep); box-shadow:0 2px 8px rgba(122,52,168,.14); font-weight:600; }
.realms .signin { padding:9px 18px; border:1.5px solid var(--p); background:none; border-radius:24px; color:var(--p); font-weight:500; font-size:14.5px; transition:.16s; }
.realms .signin:hover { background:var(--p); color:#fff; }
.realms .app-bar .who { font-size:14.5px; color:#5A4C74; }

.realms main { flex:1; }
.realms .page { max-width:1800px; margin:0 auto; padding:clamp(28px,4vw,54px) clamp(18px,4vw,56px) clamp(40px,5vw,70px); min-height:56vh; }
.realms .section-head { text-align:center; max-width:720px; margin:0 auto clamp(26px,3.4vw,44px); }
.realms .section-head h2 { font-size:clamp(28px,3.3vw,40px); color:var(--p-deep); }
.realms .btn { display:inline-block; font-size:16px; padding:14px 26px; border-radius:30px; font-weight:500; transition:.16s; border:0; }
.realms .btn.small { font-size:14px; padding:10px 18px; }
.realms .btn.primary { background:var(--p); color:#fff; }
.realms .btn.primary:hover { background:var(--p-deep); }
.realms .btn.primary:disabled { opacity:.55; cursor:default; }
.realms .btn.ghost { border:1.5px solid var(--line); color:var(--p); background:#fff; }
.realms .btn.ghost:hover { border-color:var(--v); background:var(--lav1); }
.realms .btn.wide { width:100%; }

.realms .hero { display:grid; grid-template-columns:1.12fr .88fr; gap:44px; align-items:center; }
.realms .hero h1 { font-size:clamp(36px,5vw,62px); line-height:1.05; color:var(--p-deep); margin-bottom:20px; }
.realms .lede { font-size:clamp(16px,1.4vw,19px); line-height:1.6; color:#54466E; max-width:38ch; }
.realms .cta-row { display:flex; flex-wrap:wrap; gap:14px; margin:28px 0 20px; }
.realms .tagline { font-style:italic; color:#8A7AA6; font-size:15px; }
.realms .hero-art { display:flex; justify-content:center; }
.realms .art-panel { width:min(400px,86vw); border-radius:26px; padding:clamp(24px,3.5vw,42px); background:radial-gradient(circle at 50% 30%, var(--lav1), var(--lav2)); box-shadow:0 26px 64px rgba(122,52,168,.16); border:1px solid #EBDCF8; }
.realms .home-strip { display:flex; justify-content:center; flex-wrap:wrap; gap:clamp(28px,7vw,88px); margin-top:clamp(30px,4vw,52px); text-align:center; }
.realms .mini-stat { text-align:center; padding:20px 12px; background:var(--lav1); border:1px solid var(--line); border-radius:14px; }
.realms .mini-value { display:block; font-size:34px; font-weight:700; color:var(--p); line-height:1; margin-bottom:8px; }
.realms .mini-label { font-size:12.5px; color:#5A4C74; }

.realms .wave-wrap { position:relative; max-width:1100px; margin:0 auto; }
.realms .wave { position:absolute; top:34px; left:0; width:100%; height:90px; pointer-events:none; opacity:.6; }
.realms .stages { list-style:none; margin:0; padding:0; display:grid; grid-template-columns:repeat(4,1fr); gap:26px; }
.realms .stage { text-align:center; padding:0 6px; }
.realms .stage-n { font-size:14px; letter-spacing:.18em; color:var(--v); font-weight:700; }
.realms .stage .dot { display:block; width:15px; height:15px; margin:18px auto 20px; border-radius:50%; background:#fff; border:3px solid var(--p); box-shadow:0 0 0 6px var(--lav1); }
.realms .stage h3 { font-size:21px; color:var(--p-deep); margin-bottom:10px; }
.realms .stage p { font-size:14.5px; line-height:1.58; color:#5A4C74; }

.realms .pillars { display:grid; grid-template-columns:1fr 1fr; gap:22px; }
.realms .pillar { background:#fff; border:1px solid var(--line); border-radius:16px; padding:28px 28px 32px; transition:.2s; }
.realms .pillar:hover { box-shadow:0 18px 44px rgba(122,52,168,.12); border-color:var(--v); transform:translateY(-3px); }
.realms .pillar-rule { display:block; width:44px; height:4px; border-radius:3px; background:linear-gradient(90deg,var(--p),var(--v)); margin-bottom:18px; }
.realms .pillar h3 { font-size:21px; color:var(--p-deep); margin-bottom:11px; }
.realms .pillar p { font-size:15px; line-height:1.6; color:#4A3B66; }

.realms .mandate-grid { display:grid; grid-template-columns:1fr 1fr; gap:32px; font-size:clamp(16px,1.3vw,18px); line-height:1.68; color:#4A3B66; margin-bottom:clamp(30px,4vw,48px); }
.realms .principles { display:grid; grid-template-columns:repeat(3,1fr); gap:26px; }
.realms .principle { border-top:3px solid var(--p); padding-top:18px; }
.realms .principle h3 { font-size:18px; color:var(--p-deep); margin-bottom:9px; }
.realms .principle p { font-size:14.5px; line-height:1.58; color:#4A3B66; }

.realms .enquiry-card { max-width:900px; margin:0 auto; background:linear-gradient(135deg,var(--p),var(--p-mid)); color:#fff; border-radius:22px; padding:clamp(30px,4vw,48px); display:grid; grid-template-columns:1.1fr 1fr; gap:30px; align-items:center; }
.realms .enquiry-card h2 { font-size:clamp(24px,3vw,32px); margin-bottom:10px; }
.realms .enquiry-copy p { color:#F1E5FB; font-size:16px; line-height:1.55; }
.realms .contacts { list-style:none; margin:0; padding:0; display:grid; gap:12px; }
.realms .contacts li { display:flex; flex-direction:column; }
.realms .contacts span { font-size:11px; letter-spacing:.16em; text-transform:uppercase; color:#E1CCF6; }
.realms .contacts em { font-style:normal; font-size:16px; }

.realms .main-auth { display:flex; align-items:center; justify-content:center; padding:clamp(24px,5vw,60px) 18px; }
.realms .auth-shell { width:100%; display:flex; justify-content:center; }
.realms .auth-card { width:min(430px,94vw); background:#fff; border:1px solid var(--line); border-radius:20px; padding:clamp(28px,4vw,40px); box-shadow:0 24px 60px rgba(122,52,168,.14); text-align:center; }
.realms .auth-mark { height:56px; width:auto; margin:0 auto 16px; }
.realms .auth-card h2 { font-size:22px; color:var(--p-deep); margin-bottom:6px; }
.realms .auth-sub { color:#7A6A93; font-size:14.5px; margin-bottom:22px; }
.realms .field { display:block; text-align:left; margin-bottom:14px; }
.realms .field.sm { margin-bottom:0; }
.realms .field span { display:block; font-size:12px; letter-spacing:.08em; text-transform:uppercase; color:#7A6A93; margin-bottom:6px; }
.realms .field input, .realms .field select { width:100%; font-family:inherit; font-size:15px; padding:11px 13px; border:1.5px solid var(--line); border-radius:12px; color:var(--ink); background:#fff; }
.realms .field input:focus, .realms .field select:focus { outline:none; border-color:var(--p); }
.realms .auth-msg { background:var(--lav1); color:var(--p-deep); border:1px solid var(--line); border-radius:10px; padding:10px 12px; font-size:14px; margin-bottom:14px; }
.realms .auth-msg.block { max-width:none; margin:0 0 16px; }
.realms .linkbtn { display:block; width:100%; background:none; border:0; color:var(--p); font-size:14.5px; padding:12px 0 2px; }
.realms .linkbtn:hover { text-decoration:underline; }
.realms .linkbtn.subtle { color:#8A7AA6; font-size:13.5px; }
.realms .linkbtn.center { max-width:200px; margin:20px auto 0; }
.realms .demo-note { margin-top:16px; font-size:12.5px; color:#8A7AA6; font-style:italic; }

.realms .role-page { min-height:64vh; }
.realms .role-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:18px; max-width:900px; margin:0 auto; }
.realms .role-card { text-align:left; background:#fff; border:1.5px solid var(--line); border-radius:18px; padding:24px 22px; display:flex; flex-direction:column; gap:10px; transition:.18s; }
.realms .role-card:hover { border-color:var(--p); box-shadow:0 18px 44px rgba(122,52,168,.14); transform:translateY(-3px); }
.realms .role-icon { width:46px; height:46px; border-radius:12px; background:var(--lav1); color:var(--p); display:grid; place-items:center; }
.realms .role-icon svg { width:26px; height:26px; }
.realms .role-label { font-size:19px; font-weight:600; color:var(--p-deep); }
.realms .role-blurb { font-size:14px; line-height:1.5; color:#5A4C74; }

.realms .dash-head { border-bottom:1px solid var(--line); padding-bottom:22px; margin-bottom:22px; }
.realms .dash-hello { display:flex; align-items:center; gap:18px; }
.realms .dash-icon { width:58px; height:58px; border-radius:14px; background:linear-gradient(135deg,var(--p),var(--p-mid)); color:#fff; display:grid; place-items:center; }
.realms .dash-icon svg { width:30px; height:30px; }
.realms .dash-head h2 { font-size:clamp(24px,3vw,32px); color:var(--p-deep); }
.realms .dash-title { color:#7A6A93; font-size:14.5px; margin-top:2px; }
.realms .dash-intro { color:#5A4C74; font-size:16px; margin-bottom:24px; }
.realms .tool-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:16px; }
.realms .tool-card { text-align:left; display:flex; align-items:center; justify-content:space-between; gap:12px; background:#fff; border:1px solid var(--line); border-radius:14px; padding:20px; transition:.16s; }
.realms .tool-card.live:hover { border-color:var(--p); box-shadow:0 12px 30px rgba(122,52,168,.12); transform:translateY(-2px); }
.realms .tool-card:disabled { opacity:.75; cursor:default; }
.realms .tool-name { font-size:16px; color:var(--p-deep); font-weight:500; }
.realms .tool-stage { font-size:11.5px; letter-spacing:.06em; text-transform:uppercase; color:var(--v); background:var(--lav1); border:1px solid var(--line); border-radius:20px; padding:4px 10px; white-space:nowrap; }
.realms .tool-stage.ready { color:#fff; background:var(--p); border-color:var(--p); }

.realms .ptitle { position:sticky; top:0; z-index:20; display:flex; align-items:flex-end; justify-content:space-between; gap:16px; flex-wrap:wrap; margin:-8px 0 18px; padding:14px 0 12px; background:linear-gradient(180deg,var(--lav1) 70%,rgba(246,243,250,0)); backdrop-filter:blur(6px); }
.realms .ptitle h2 { font-size:26px; letter-spacing:-.015em; }
.realms .ptitle h2 { font-size:clamp(22px,2.6vw,30px); color:var(--p-deep); }
.realms .ptools { display:flex; gap:10px; align-items:center; flex-wrap:wrap; }
.realms .sel { font-family:inherit; font-size:14px; padding:10px 14px; border:1.5px solid var(--line); border-radius:22px; background:#fff; color:var(--ink); }
.realms .hintline { font-size:13px; color:#8A7AA6; margin-bottom:12px; }
.realms .warnline { font-size:13.5px; color:#9A5B12; background:#FBF3E6; border:1px solid #F0D9B5; border-radius:10px; padding:10px 12px; margin-bottom:14px; }
.realms .empty { color:#8A7AA6; font-style:italic; padding:24px 0; text-align:center; }
.realms .empty.sm { padding:12px 0; text-align:left; }

.realms .addform { background:var(--lav1); border:1px solid var(--line); border-radius:16px; padding:20px; margin-bottom:20px; }
.realms .fgrid { display:grid; grid-template-columns:repeat(3,1fr); gap:14px; margin-bottom:16px; }
.realms .fgrid.two { grid-template-columns:1fr 1fr; }

.realms .cluster { margin-bottom:20px; }
.realms .cluster-head { display:flex; align-items:center; gap:10px; margin-bottom:10px; }
.realms .area-dot { width:12px; height:12px; border-radius:50%; }
.realms .cluster-head h3 { font-size:17px; color:var(--p-deep); }
.realms .cluster-count { font-size:12px; color:#8A7AA6; background:var(--lav1); border:1px solid var(--line); border-radius:20px; padding:2px 10px; }
.realms .frows { display:grid; gap:8px; }
.realms .frow { display:flex; align-items:center; justify-content:space-between; gap:12px; background:#fff; border:1px solid var(--line); border-radius:12px; padding:14px 16px; }
.realms .fmain { display:flex; flex-direction:column; }
.realms .fname { font-size:15.5px; color:var(--p-deep); font-weight:500; }
.realms .fmeta { font-size:13px; color:#7A6A93; }
.realms .factions { display:flex; align-items:center; gap:8px; }
.realms .pin.ok { color:#5FA35A; }
.realms .pin.no { font-size:12px; color:#B08; opacity:.6; }
.realms .mini { font-family:inherit; font-size:12.5px; padding:6px 12px; border-radius:18px; border:1px solid var(--line); background:#fff; color:var(--p); }
.realms .mini:hover { border-color:var(--p); }
.realms .mini.danger { color:#B4442E; }

.realms .map-page .map-frame { border:1px solid var(--line); border-radius:16px; overflow:hidden; }
.realms .leaflet-holder { height:min(60vh,540px); width:100%; }
.realms .route-list { list-style:none; margin:18px 0 0; padding:0; display:grid; gap:8px; }
.realms .route-list li { display:flex; align-items:center; gap:12px; background:#fff; border:1px solid var(--line); border-radius:12px; padding:12px 14px; }
.realms .route-list .rn { width:26px; height:26px; border-radius:50%; background:var(--p); color:#fff; display:grid; place-items:center; font-size:13px; font-weight:700; }
.realms .planner { margin-top:26px; }
.realms .planner-controls { display:flex; flex-wrap:wrap; align-items:center; gap:12px; margin-bottom:14px; }
.realms .field.inline { flex-direction:row; align-items:center; gap:8px; }
.realms .field.inline input { width:70px; }
.realms .plan-days { display:grid; grid-template-columns:repeat(auto-fill,minmax(280px,1fr)); gap:14px; }
.realms .plan-day { background:#fff; border:1px solid var(--line); border-left:3px solid var(--p); border-radius:12px; padding:14px 16px; }
.realms .plan-day-head { display:flex; align-items:center; gap:10px; flex-wrap:wrap; margin-bottom:8px; }
.realms .plan-day-head h4 { color:var(--p-deep); font-size:15px; margin:0; flex:1; }
.realms .plan-count { font-size:11.5px; color:#8A7AA6; background:var(--lav2); border-radius:10px; padding:2px 9px; }
.realms .plan-list { margin:0; padding-left:20px; }
.realms .plan-list li { font-size:13px; color:#4A3B66; margin-bottom:5px; }
.realms .plan-list .pf-name { font-weight:500; color:#3A2B54; }
.realms .plan-list em { display:block; font-style:normal; color:#8A7AA6; font-size:12px; }
.realms .appr-chip { font-size:11.5px; border-radius:10px; padding:2px 9px; border:1px solid; }
.realms .appr-chip.pending { background:#FBF3E6; color:#9A5B12; border-color:#F0D9B5; }
.realms .appr-chip.approved { background:#E6F4EA; color:#2E7D46; border-color:#BFE3CB; }
.realms .appr-chip.returned { background:#FBE9E6; color:#B4442E; border-color:#F0C9BF; }
.realms .mini.ok { border-color:#BFE3CB; color:#2E7D46; }
.realms .mini.warn { border-color:#F0D9B5; color:#9A5B12; background:#FBF3E6; }
.realms .mini.ok:hover { background:#E6F4EA; }
.realms .submit-panel { background:#fff; border:1px solid var(--line); border-left:3px solid var(--p); border-radius:12px; padding:16px 18px; margin-bottom:18px; }
.realms .submit-head { margin-bottom:12px; }
.realms .submit-head h3 { color:var(--p-deep); font-size:16px; margin-bottom:2px; }
.realms .submit-row { display:flex; flex-wrap:wrap; align-items:center; gap:10px; }
.realms .plan-assign { display:flex; flex-wrap:wrap; gap:8px; margin-top:10px; padding-top:10px; border-top:1px solid var(--lav2); }
.realms .plan-assign .sel { font-size:13px; padding:6px 10px; }
.realms .myday { background:var(--lav1); border:1px solid var(--line); border-left:3px solid var(--p); border-radius:12px; padding:14px 16px; margin-bottom:20px; }
.realms .myday-head { display:flex; align-items:center; justify-content:space-between; margin-bottom:10px; }
.realms .myday-head h3 { color:var(--p-deep); font-size:16px; margin:0; }
.realms .pending-card { max-width:520px; margin:0 auto; text-align:center; background:#fff; border:1px solid var(--line); border-radius:18px; padding:38px 32px; box-shadow:0 12px 34px rgba(58,21,96,.08); }
.realms .pending-ic { display:grid; place-items:center; width:60px; height:60px; border-radius:50%; background:var(--lav2); color:var(--p-deep); margin:0 auto 16px; }
.realms .pending-card h2 { color:var(--p-deep); font-size:22px; margin-bottom:10px; }
.realms .pending-card p { color:#5A4C74; margin-bottom:8px; }
.realms .cta-row.center { justify-content:center; }
.realms .frow.picked { border-color:var(--p); background:var(--lav2); }
.realms .band-note { text-align:center; max-width:720px; margin:16px auto 0; font-size:14px; color:#5A4C74; }

/* ===== UI upscale: tablet-first field ergonomics + depth ===== */
.realms .frow, .realms .rep-row, .realms .fu-card, .realms .saved-card { border-radius:var(--r-md); box-shadow:var(--e1); transition:box-shadow .18s ease, border-color .18s ease, transform .18s ease; }
.realms .frow:hover, .realms .rep-row:hover, .realms .fu-card:hover { box-shadow:var(--e2); border-color:var(--v); }
.realms .frow.pickable:hover { transform:translateY(-1px); }
.realms .mini { min-height:36px; border-radius:9px; padding:7px 13px; font-weight:500; transition:.15s; }
.realms .btn.small { min-height:40px; border-radius:22px; }
.realms .sel, .realms .searchbox, .realms .field input, .realms .field select, .realms .field textarea, .realms .hef-input { min-height:42px; border-radius:10px; transition:border-color .15s ease, box-shadow .15s ease; }
.realms .sel:focus, .realms .field input:focus, .realms .field select:focus, .realms .field textarea:focus { outline:none; border-color:var(--p); box-shadow:0 0 0 3px var(--lav2); }
.realms .cluster { margin-bottom:26px; }
.realms .cluster-head { position:sticky; top:64px; z-index:5; background:var(--lav1); padding:8px 0; margin-bottom:8px; border-bottom:1px solid var(--lav2); }
.realms .cluster-head h3 { font-size:15px; letter-spacing:-.01em; }
.realms .cluster-count { background:#fff; border:1px solid var(--line); border-radius:11px; padding:2px 9px; font-size:11.5px; color:#8A7AA6; }
.realms .an-card, .realms .settings-card, .realms .submit-panel, .realms .chat-wrap, .realms .plan-day, .realms .hq-table, .realms .enquiry { box-shadow:var(--e1); }
.realms .settings-card, .realms .submit-panel { border-radius:var(--r-lg); }
.realms .seg { border-radius:10px; }
.realms .segb { min-height:var(--tap); padding:9px 18px; font-size:13.5px; }
.realms .chkpill { min-height:40px; }
.realms .rag-btn, .realms .ragb { min-height:var(--tap); }
.realms .side-item, .realms .sidebar a, .realms .sidebar button { min-height:var(--tap); }
.realms .hef-sec > summary { min-height:48px; }
.realms .hef-sec { border-radius:var(--r-sm); }
.realms .hef-wrap, .realms .fu-card { border-radius:var(--r-lg); }

/* tablet: two-up analytics, roomier rows, larger type */
@media (min-width:760px) and (max-width:1180px){
  .realms .an-cards { grid-template-columns:repeat(3,1fr); }
  .realms .frow, .realms .rep-row { padding:16px 18px; }
  .realms .fname { font-size:15.5px; }
  .realms .mini { min-height:40px; padding:9px 15px; font-size:13.5px; }
  .realms .hef-fields { padding:16px; gap:16px; }
  .realms .plan-days { grid-template-columns:1fr 1fr; }
}
@media (hover:none){
  .realms .mini { min-height:var(--tap); }
  .realms .frow:hover, .realms .rep-row:hover { transform:none; }
}

.realms .route-list em { margin-left:auto; font-style:normal; font-size:13px; color:#8A7AA6; }

.realms .assign-grid { display:grid; grid-template-columns:1.3fr 1fr; gap:24px; }
.realms .assign-form, .realms .assign-saved { background:#fff; border:1px solid var(--line); border-radius:16px; padding:20px; }
.realms .pick-label { font-size:12px; letter-spacing:.08em; text-transform:uppercase; color:#7A6A93; margin:14px 0 8px; }
.realms .pick-list { display:grid; gap:6px; max-height:260px; overflow:auto; margin-bottom:8px; }
.realms .pick-row { display:flex; align-items:center; gap:10px; font-size:14.5px; padding:8px 10px; border:1px solid var(--line); border-radius:10px; }
.realms .pick-row .nocoord { margin-left:auto; font-style:normal; font-size:11px; color:#B08; opacity:.7; }
.realms .saved-card { border:1px solid var(--line); border-radius:12px; padding:12px 14px; margin-bottom:10px; }
.realms .saved-card strong { color:var(--p-deep); margin-right:8px; }
.realms .saved-card span { font-size:13px; color:#7A6A93; }
.realms .saved-card em { display:block; font-style:normal; font-size:12.5px; color:#8A7AA6; margin-top:2px; }
.realms .saved-card p { font-size:13px; color:#5A4C74; margin-top:4px; }

.realms .foot { background:#4C3B66; color:#EADAF7; padding:clamp(32px,4vw,52px) clamp(18px,4vw,56px); }
.realms .foot-inner { max-width:1800px; margin:0 auto; text-align:center; display:grid; gap:8px; justify-items:center; }
.realms .foot-brand { display:flex; align-items:center; justify-content:center; gap:12px; font-size:15px; color:#fff; }
.realms .foot-mark { height:32px; width:auto; }
.realms .foot p { font-size:14px; }
.realms .foot-tag { font-style:italic; color:#CDA9EC; margin-top:4px; }

@media (max-width:920px){
  .realms .hero { grid-template-columns:1fr; text-align:center; }
  .realms .lede { max-width:none; margin:0 auto; }
  .realms .cta-row { justify-content:center; }
  .realms .hero-art { order:-1; }
  .realms .home-strip { grid-template-columns:1fr 1fr; }
  .realms .stages { grid-template-columns:1fr 1fr; gap:32px; }
  .realms .wave { display:none; }
  .realms .pillars, .realms .mandate-grid, .realms .principles { grid-template-columns:1fr; }
  .realms .enquiry-card { grid-template-columns:1fr; text-align:center; }
  .realms .contacts { justify-items:center; }
  .realms .role-grid, .realms .tool-grid { grid-template-columns:1fr 1fr; }
  .realms .fgrid { grid-template-columns:1fr 1fr; }
  .realms .assign-grid { grid-template-columns:1fr; }
}
@media (max-width:900px){
  .realms .bar { display:flex; flex-wrap:wrap; justify-content:space-between; }
  .realms .bar .tabs { order:3; width:100%; max-width:100%; justify-self:auto; overflow-x:auto; -webkit-overflow-scrolling:touch; }
  .realms .bar-right { justify-self:auto; }
  .realms .home-strip { grid-template-columns:1fr; }
  .realms .stages, .realms .role-grid, .realms .tool-grid, .realms .fgrid, .realms .fgrid.two { grid-template-columns:1fr; }
}

.realms .stepper { list-style:none; display:flex; gap:8px; padding:0; margin:0 0 22px; flex-wrap:wrap; }
.realms .stepper .stp { display:flex; align-items:center; gap:8px; font-size:13.5px; color:#8A7AA6; background:var(--lav1); border:1px solid var(--line); border-radius:22px; padding:7px 14px; }
.realms .stepper .stp span { width:22px; height:22px; border-radius:50%; background:#fff; border:1px solid var(--line); display:grid; place-items:center; font-size:12px; font-weight:700; color:#8A7AA6; }
.realms .stepper .stp.on { color:var(--p-deep); border-color:var(--p); background:#fff; font-weight:600; }
.realms .stepper .stp.on span { background:var(--p); color:#fff; border-color:var(--p); }
.realms .stepper .stp.done span { background:var(--v); color:#fff; border-color:var(--v); }
.realms .frow.pickable { width:100%; text-align:left; cursor:pointer; }
.realms .frow.pickable:hover { border-color:var(--p); }
.realms .engage-card { background:#fff; border:1px solid var(--line); border-radius:16px; padding:24px; max-width:640px; }
.realms .fbig { font-size:22px; color:var(--p-deep); margin:6px 0 4px; }
.realms .fsub { color:#7A6A93; font-size:14px; margin-bottom:16px; }
.realms .ci-row { display:flex; justify-content:space-between; padding:12px 0; border-top:1px solid var(--line); font-size:15px; }
.realms .ci-row span { color:#7A6A93; }
.realms .ci-row em { font-style:normal; color:var(--p-deep); }
.realms .btnrow { display:flex; gap:10px; flex-wrap:wrap; margin-top:18px; }
.realms .engage-present { display:grid; grid-template-columns:1.1fr .9fr; gap:22px; align-items:start; }
.realms .letter { background:#fff; border:1px solid var(--line); border-radius:16px; padding:26px; box-shadow:0 10px 30px rgba(122,52,168,.08); }
.realms .letter-head { display:flex; align-items:center; gap:12px; border-bottom:2px solid var(--lav2); padding-bottom:14px; margin-bottom:14px; }
.realms .letter-head img { height:44px; }
.realms .letter-head strong { display:block; font-size:12.5px; letter-spacing:.04em; color:var(--p-deep); }
.realms .letter-head span { font-size:11.5px; color:#8A7AA6; }
.realms .letter-meta { display:flex; justify-content:space-between; font-size:12.5px; color:#8A7AA6; margin-bottom:16px; }
.realms .letter-to { font-size:14px; line-height:1.5; margin-bottom:14px; color:#4A3B66; }
.realms .letter-sub { margin-bottom:12px; color:var(--p-deep); }
.realms .letter p { font-size:14px; line-height:1.6; color:#4A3B66; margin-bottom:12px; }
.realms .letter-sign { margin-top:18px; font-size:14px; color:var(--p-deep); }
.realms .letter-sign span { color:#8A7AA6; font-size:13px; }
.realms .idcards { display:grid; gap:10px; margin-bottom:12px; }
.realms .idwrap { display:flex; align-items:center; gap:8px; }
.realms .idcard { flex:1; display:flex; align-items:center; gap:12px; background:linear-gradient(135deg,#fff,var(--lav1)); border:1px solid var(--line); border-left:4px solid var(--p); border-radius:12px; padding:12px 14px; }
.realms .idmark { height:36px; }
.realms .idbody { display:flex; flex-direction:column; }
.realms .idname { font-size:15px; font-weight:600; color:var(--p-deep); }
.realms .idrole { font-size:13px; color:#5A4C74; }
.realms .idorg { font-size:10.5px; letter-spacing:.08em; text-transform:uppercase; color:#9C86B8; margin-top:2px; }
.realms .addmember { display:flex; gap:8px; margin-bottom:16px; }
.realms .addmember input { flex:1; font-family:inherit; font-size:13.5px; padding:9px 11px; border:1.5px solid var(--line); border-radius:10px; min-width:0; }
.realms .script { margin:0 0 4px; background:var(--lav1); border-left:3px solid var(--v); border-radius:0 10px 10px 0; padding:14px 16px; font-style:italic; color:#4A3B66; font-size:14px; line-height:1.6; }
.realms .greet { display:flex; align-items:flex-start; gap:10px; margin:18px 0 4px; font-size:14.5px; color:#4A3B66; }
.realms .greet input { margin-top:3px; }
.realms .engage-done { text-align:center; max-width:520px; margin:6vh auto 0; }
.realms .done-badge { display:inline-block; background:#E6F4EA; color:#2E7D46; border:1px solid #BFE3CB; border-radius:20px; padding:5px 16px; font-size:12.5px; letter-spacing:.08em; text-transform:uppercase; margin-bottom:16px; }
.realms .engage-done h2 { font-size:28px; color:var(--p-deep); margin-bottom:8px; }
.realms .engage-done .muted { color:#8A7AA6; margin:8px 0 20px; }
@media (max-width:920px){ .realms .engage-present { grid-template-columns:1fr; } }

.realms .net { font-size:11.5px; letter-spacing:.06em; text-transform:uppercase; padding:5px 12px; border-radius:20px; border:1px solid var(--line); }
.realms .net.on { color:#2E7D46; background:#E6F4EA; border-color:#BFE3CB; }
.realms .net.off { color:#B4442E; background:#FBE9E6; border-color:#F0C9BF; }
.realms .chip { display:inline-block; font-size:12px; letter-spacing:.04em; padding:4px 12px; border-radius:20px; border:1px solid var(--line); white-space:nowrap; }
.realms .chip.green { color:#2E7D46; background:#E6F4EA; border-color:#BFE3CB; }
.realms .chip.amber { color:#9A5B12; background:#FBF3E6; border-color:#F0D9B5; }
.realms .chip.red { color:#B4442E; background:#FBE9E6; border-color:#F0C9BF; }
.realms .chip.none, .realms .chip.engaged, .realms .chip.monitored { color:#7A6A93; background:var(--lav1); }
.realms .mon-list { display:grid; gap:10px; }
.realms .mon-row { display:flex; align-items:center; justify-content:space-between; gap:12px; background:#fff; border:1px solid var(--line); border-radius:12px; padding:14px 16px; text-align:left; cursor:pointer; }
.realms .mon-row:hover { border-color:var(--p); }
.realms .mon-right { display:flex; align-items:center; gap:12px; }
.realms .mon-head { display:flex; align-items:flex-start; justify-content:space-between; gap:16px; flex-wrap:wrap; border-bottom:1px solid var(--line); padding-bottom:16px; margin-bottom:18px; }
.realms .mon-head h2 { font-size:clamp(22px,2.6vw,28px); color:var(--p-deep); margin-top:6px; }
.realms .mon-head-r { display:flex; align-items:center; gap:10px; flex-wrap:wrap; }
.realms .rated { font-size:12.5px; color:#8A7AA6; }
.realms .mcat { border:1px solid var(--line); border-radius:14px; padding:16px 18px; margin-bottom:14px; background:#fff; }
.realms .mcat-head { display:flex; align-items:center; justify-content:space-between; gap:12px; margin-bottom:12px; }
.realms .mcat-head h3 { font-size:17px; color:var(--p-deep); }
.realms .mitems { display:grid; gap:14px; }
.realms .mitem { border-top:1px solid var(--lav2); padding-top:12px; }
.realms .mitem:first-child { border-top:0; padding-top:0; }
.realms .mitem-top { display:flex; align-items:center; justify-content:space-between; gap:12px; }
.realms .mlabel { font-size:15px; color:#3A2B54; }
.realms .rag { display:flex; gap:6px; }
.realms .ragb { width:34px; height:34px; border-radius:9px; border:1.5px solid var(--line); background:#fff; font-weight:700; font-size:13px; color:#8A7AA6; }
.realms .ragb.green.on { background:#2E7D46; border-color:#2E7D46; color:#fff; }
.realms .ragb.amber.on { background:#C77D0A; border-color:#C77D0A; color:#fff; }
.realms .ragb.red.on { background:#B4442E; border-color:#B4442E; color:#fff; }
.realms .mnote { width:100%; font-family:inherit; font-size:14px; padding:8px 11px; border:1.5px solid var(--line); border-radius:10px; margin-top:10px; resize:vertical; color:var(--ink); }
.realms .mnote:focus { outline:none; border-color:var(--p); }
.realms .evrow { display:flex; align-items:center; gap:8px; margin-top:10px; flex-wrap:wrap; }
.realms .ev-btn { font-size:12.5px; padding:7px 13px; border:1px solid var(--line); border-radius:18px; background:#fff; color:var(--p); cursor:pointer; }
.realms .ev-btn:hover { border-color:var(--p); }
.realms .ev-btn input { display:none; }
.realms .ev-btn.recording { background:#FBE9E6; color:#B4442E; border-color:#F0C9BF; }
.realms .geotag { font-size:11.5px; color:#2E7D46; }
.realms .evstrip { display:flex; gap:10px; flex-wrap:wrap; margin-top:12px; }
.realms .evthumb { position:relative; }
.realms .evthumb img { width:64px; height:64px; object-fit:cover; border-radius:8px; border:1px solid var(--line); }
.realms .evthumb audio { height:34px; }
.realms .evx { position:absolute; top:-8px; right:-8px; width:20px; height:20px; border-radius:50%; border:0; background:#B4442E; color:#fff; font-size:13px; line-height:1; cursor:pointer; }
.realms .mon-actions { display:flex; align-items:center; gap:12px; flex-wrap:wrap; margin-top:20px; }
.realms .save-note { font-size:13px; color:#8A7AA6; font-style:italic; }
@media (max-width:680px){ .realms .mitem-top { flex-direction:column; align-items:flex-start; gap:8px; } }

.realms .dsec { border:1px solid var(--line); border-radius:14px; padding:18px; margin-bottom:14px; background:#fff; }
.realms .dsec h3 { font-size:17px; color:var(--p-deep); margin-bottom:12px; }
.realms .dstr { margin:0; padding-left:20px; }
.realms .dstr li { font-size:14.5px; color:#3A2B54; margin-bottom:5px; }
.realms .gap { border-top:1px solid var(--lav2); padding-top:12px; margin-top:12px; }
.realms .gap:first-child { border-top:0; padding-top:0; margin-top:0; }
.realms .gap-top { display:flex; align-items:center; justify-content:space-between; gap:10px; margin-bottom:10px; }
.realms .gap-label { font-size:15px; color:#3A2B54; }
.realms .chkfield .inl { display:flex; align-items:center; gap:8px; font-size:14.5px; color:#4A3B66; padding:11px 0; }
.realms .sigwrap { display:flex; flex-direction:column; align-items:flex-start; gap:8px; }
.realms .sigpad { width:100%; max-width:600px; height:170px; border:1.5px dashed var(--line); border-radius:12px; background:#fff; touch-action:none; cursor:crosshair; }

.realms .rep-rows { display:grid; gap:10px; }
.realms .rep-row { display:flex; align-items:center; gap:12px; flex-wrap:wrap; background:#fff; border:1px solid var(--line); border-radius:12px; padding:14px 16px; }
.realms .rep-main { display:flex; flex-direction:column; flex:1 1 200px; }
.realms .rep-actions { display:flex; gap:8px; flex-wrap:wrap; }
.realms .notify { flex-basis:100%; display:flex; align-items:center; gap:10px; flex-wrap:wrap; border-top:1px solid var(--lav2); margin-top:6px; padding-top:12px; }
.realms .notify .hintline { margin:0; }
.realms .an-cards { display:grid; grid-template-columns:repeat(6,1fr); gap:12px; margin-bottom:20px; }
.realms .an-card { position:relative; overflow:hidden; background:#fff; border:1px solid var(--line); border-radius:var(--r-md); padding:18px 16px; text-align:left; box-shadow:var(--e1); transition:box-shadow .18s ease, transform .18s ease; }
.realms .an-card:hover { box-shadow:var(--e2); transform:translateY(-2px); }
.realms .an-card::before { content:''; position:absolute; left:0; top:0; bottom:0; width:3px; background:linear-gradient(180deg,var(--p),var(--v)); }
.realms .an-v { display:block; font-family:Lora,serif; font-size:30px; font-weight:700; color:var(--p-deep); line-height:1; margin-bottom:6px; letter-spacing:-.02em; font-variant-numeric:tabular-nums; }
.realms .an-l { font-size:11.5px; color:#8A7AA6; text-transform:uppercase; letter-spacing:.06em; }
.realms .an-two { display:grid; grid-template-columns:1fr 1fr; gap:16px; margin-bottom:16px; }
.realms .an-panel { background:#fff; border:1px solid var(--line); border-radius:14px; padding:18px; margin-bottom:16px; }
.realms .an-panel h3 { font-size:16px; color:var(--p-deep); margin-bottom:14px; }
.realms .bars { display:grid; gap:12px; }
.realms .bar-row { display:flex; align-items:center; gap:12px; }
.realms .bar-lab { width:110px; font-size:13.5px; color:#5A4C74; flex-shrink:0; }
.realms .bar-track { flex:1; height:14px; background:var(--lav1); border-radius:8px; overflow:hidden; }
.realms .bar-fill { height:100%; background:linear-gradient(90deg,var(--p),var(--v)); border-radius:8px; }
.realms .bar-fill.green { background:#2E7D46; } .realms .bar-fill.amber { background:#C77D0A; } .realms .bar-fill.red { background:#B4442E; }
.realms .bar-n { width:34px; text-align:right; font-size:13.5px; color:var(--p-deep); font-weight:600; }
@media (max-width:920px){ .realms .an-cards { grid-template-columns:repeat(3,1fr); } .realms .an-two { grid-template-columns:1fr; } }
@media (max-width:560px){ .realms .an-cards { grid-template-columns:1fr 1fr; } }

.realms .app-bar .tabs { overflow-x:auto; max-width:min(64vw,760px); scrollbar-width:thin; }
.realms .notify { flex-basis:100%; display:flex; flex-direction:column; gap:8px; border-top:1px solid var(--lav2); margin-top:6px; padding-top:12px; }
.realms .notify-row { display:flex; align-items:center; gap:8px; flex-wrap:wrap; }
.realms .ninput { font-family:inherit; font-size:13px; padding:8px 11px; border:1.5px solid var(--line); border-radius:10px; min-width:180px; }
.realms .ninput:focus { outline:none; border-color:var(--p); }
.realms .mini.ghosted { color:#8A7AA6; border-style:dashed; }
.realms .nstat { font-size:12.5px; color:#7A6A93; font-style:italic; }

/* ===== app shell: top bar + left sidebar ===== */
.realms.app-mode { display:flex; flex-direction:column; min-height:100vh; }
.realms .topbar { position:sticky; top:0; z-index:1000; display:flex; align-items:center; justify-content:space-between; gap:16px; padding:10px clamp(14px,3vw,28px); background:linear-gradient(90deg,#4C3B66,#574277); color:#fff; }
.realms .tb-left, .realms .tb-right { display:flex; align-items:center; gap:14px; }
.realms .topbar .mark { height:34px; background:#fff; border-radius:8px; padding:2px; }
.realms .tb-name { font-size:16px; letter-spacing:.14em; font-weight:600; }
.realms .navtoggle { display:none; background:rgba(255,255,255,.15); border:0; color:#fff; width:38px; height:38px; border-radius:10px; align-items:center; justify-content:center; }
.realms .navtoggle svg { width:20px; height:20px; }
.realms .ws { display:flex; align-items:center; gap:8px; margin-left:8px; background:rgba(255,255,255,.14); padding:4px 10px 4px 12px; border-radius:24px; }
.realms .ws label { font-size:11px; letter-spacing:.1em; text-transform:uppercase; color:#E7D8F6; }
.realms .ws select { font-family:inherit; font-size:14px; background:#fff; color:var(--p-deep); border:0; border-radius:16px; padding:6px 10px; }
.realms .topbar .who { font-size:14.5px; color:#F1E5FB; }
.realms .topbar .signin { border:1.5px solid rgba(255,255,255,.5); color:#fff; background:none; }
.realms .topbar .signin:hover { background:#fff; color:var(--p-deep); }
.realms .shell { flex:1; display:flex; align-items:flex-start; }
.realms .sidebar { position:sticky; top:56px; align-self:flex-start; width:214px; flex-shrink:0; height:calc(100vh - 56px); background:#fff; border-right:1px solid var(--line); display:flex; flex-direction:column; padding:14px 12px; transition:width .18s ease; }
.realms .sidebar.collapsed { width:66px; }
.realms .sb-head { padding:6px 10px 12px; }
.realms .sb-role { font-size:11px; letter-spacing:.12em; text-transform:uppercase; color:var(--v); font-weight:600; }
.realms .sidebar.collapsed .sb-head { opacity:0; height:0; padding:0; }
.realms .sb-nav { display:flex; flex-direction:column; gap:4px; flex:1; overflow-y:auto; }
.realms .sb-item { display:flex; align-items:center; gap:12px; padding:10px 12px; border:0; background:none; border-radius:10px; color:#5A4C74; font-size:14.5px; text-align:left; width:100%; transition:.14s; }
.realms .sb-item:hover { background:var(--lav1); color:var(--p); }
.realms .sb-item.active { background:linear-gradient(90deg,var(--p),var(--p-mid)); color:#fff; box-shadow:0 6px 16px rgba(122,52,168,.24); }
.realms .sb-ico { width:22px; height:22px; flex-shrink:0; display:grid; place-items:center; }
.realms .sb-ico svg { width:20px; height:20px; }
.realms .sidebar.collapsed .sb-lab { display:none; }
.realms .sidebar.collapsed .sb-item { justify-content:center; padding:11px; }
.realms .sb-collapse { display:flex; align-items:center; gap:12px; padding:10px 12px; border:0; border-top:1px solid var(--line); background:none; color:#8A7AA6; font-size:13.5px; margin-top:8px; }
.realms .sb-collapse svg { width:18px; height:18px; }
.realms .sidebar.collapsed .sb-collapse { justify-content:center; }
.realms .scrim { display:none; }
.realms .app-main { flex:1; min-width:0; }
.realms .app-main .page { min-height:auto; }
@media (max-width:820px){
  .realms .navtoggle { display:flex; }
  .realms .ws { display:none; }
  .realms .sidebar { position:fixed; top:0; left:0; height:100vh; z-index:1200; transform:translateX(-100%); box-shadow:0 0 40px rgba(0,0,0,.2); width:230px; }
  .realms .sidebar.open { transform:none; }
  .realms .sidebar.collapsed { width:230px; }
  .realms .sidebar.collapsed .sb-lab, .realms .sidebar.collapsed .sb-head { display:block; opacity:1; height:auto; }
  .realms .sb-collapse { display:none; }
  .realms .scrim.show { display:block; position:fixed; inset:0; background:rgba(30,15,49,.4); z-index:1100; }
}

/* dashboard banner + quick stats */
.realms .dash-banner { position:relative; border-radius:18px; overflow:hidden; margin-bottom:16px; min-height:180px; display:flex; align-items:flex-end; }
.realms .dash-banner img { position:absolute; inset:0; width:100%; height:100%; object-fit:cover; }
.realms .dash-banner-in { position:relative; display:flex; align-items:center; gap:18px; padding:22px 24px; width:100%; background:linear-gradient(90deg,rgba(58,21,96,.86),rgba(58,21,96,.25)); color:#fff; }
.realms .dash-banner .dash-icon { background:rgba(255,255,255,.18); color:#fff; }
.realms .dash-banner h2 { color:#fff; font-size:clamp(24px,3vw,32px); }
.realms .dash-banner .eyebrow.light { color:#E7D8F6; }
.realms .dash-sub { color:#EAD9FA; font-style:italic; font-size:14px; margin-top:2px; }
.realms .dash-quick { display:grid; grid-template-columns:repeat(3,1fr); gap:14px; margin-bottom:20px; }
.realms .dq { background:var(--lav1); border:1px solid var(--line); border-radius:14px; padding:16px; text-align:center; }
.realms .dq-v { display:block; font-size:26px; font-weight:700; color:var(--p); }
.realms .dq-l { font-size:12.5px; color:#5A4C74; }

/* gallery */
.realms .gallery { max-width:1800px; margin:0 auto; padding:clamp(30px,4vw,56px) clamp(18px,4vw,56px); }
.realms .gallery-h { text-align:center; font-size:clamp(24px,3vw,34px); color:var(--p-deep); margin-bottom:26px; }
.realms .gal-grid { display:grid; grid-template-columns:repeat(4,1fr); grid-auto-rows:150px; gap:14px; }
.realms .gal { margin:0; position:relative; border-radius:16px; overflow:hidden; box-shadow:0 10px 26px rgba(58,21,96,.12); }
.realms .gal.big { grid-column:span 2; grid-row:span 2; }
.realms .gal img { width:100%; height:100%; object-fit:cover; transition:transform .5s ease; }
.realms .gal:hover img { transform:scale(1.06); }
.realms .gal figcaption { position:absolute; left:0; right:0; bottom:0; padding:22px 14px 10px; font-size:13px; color:#fff; background:linear-gradient(transparent,rgba(30,15,49,.8)); }

/* impact band */
.realms .impact { max-width:1800px; margin:10px auto 0; padding:0 clamp(18px,4vw,56px) clamp(40px,5vw,70px); display:grid; grid-template-columns:1fr 1fr; gap:0; }
.realms .impact-copy { background:linear-gradient(135deg,var(--p-deep),var(--p-mid)); color:#fff; border-radius:20px 0 0 20px; padding:clamp(28px,4vw,48px); }
.realms .impact-copy h2 { font-size:clamp(24px,3vw,32px); margin-bottom:12px; }
.realms .impact-copy p { color:#F1E5FB; line-height:1.6; margin-bottom:20px; }
.realms .impact-art { border-radius:0 20px 20px 0; overflow:hidden; }
.realms .impact-art img { width:100%; height:100%; object-fit:cover; }

/* pillar photos + about lead */
.realms .pillar.photo { padding-top:0; overflow:hidden; }
.realms .pillar-img { margin:-1px -28px 20px; height:300px; overflow:hidden; }
.realms .pillar-img img { width:100%; height:100%; object-fit:cover; object-position:center top; }
.realms .pillar.photo .pillar-rule { margin-left:28px; }
.realms .pillar.photo h3, .realms .pillar.photo p { padding:0 2px; }
.realms .about-lead { border-radius:18px; overflow:hidden; height:clamp(300px,42vw,470px); margin-bottom:24px; }
.realms .about-lead img { width:100%; height:100%; object-fit:cover; object-position:center; }

/* donut + ring */
.realms .donut { display:flex; align-items:center; gap:20px; flex-wrap:wrap; }
.realms .donut-svg { width:150px; height:150px; flex-shrink:0; }
.realms .donut-num { font-size:26px; font-weight:700; fill:var(--p-deep); }
.realms .donut-lab { font-size:10px; letter-spacing:.1em; text-transform:uppercase; fill:#8A7AA6; }
.realms .donut-legend { display:grid; gap:8px; }
.realms .dl { display:flex; align-items:center; gap:8px; font-size:14px; color:#4A3B66; }
.realms .dl .dot { width:12px; height:12px; border-radius:3px; }
.realms .dl em { font-style:normal; color:var(--p-deep); font-weight:600; margin-left:4px; }
.realms .ring-panel { display:flex; flex-direction:column; }
.realms .ring { display:flex; flex-direction:column; align-items:center; gap:8px; }
.realms .ring-svg { width:140px; height:140px; }
.realms .ring-num { font-size:24px; font-weight:700; fill:var(--p-deep); }
.realms .ring-lab { font-size:10px; letter-spacing:.1em; text-transform:uppercase; fill:#8A7AA6; }
.realms .ring-cap { font-size:13px; color:#7A6A93; text-align:center; }

@media (max-width:820px){
  .realms .gal-grid { grid-template-columns:1fr 1fr; grid-auto-rows:130px; }
  .realms .gal.big { grid-column:span 2; grid-row:span 1; }
  .realms .impact { grid-template-columns:1fr; }
  .realms .impact-copy { border-radius:20px 20px 0 0; }
  .realms .impact-art { border-radius:0 0 20px 20px; min-height:200px; }
  .realms .dash-quick { grid-template-columns:1fr 1fr 1fr; }
}

.realms .topbar .who { background:none; border:0; cursor:pointer; }
.realms .topbar .who:hover { text-decoration:underline; }
.realms .viewas-bar { display:flex; align-items:center; justify-content:center; gap:12px; flex-wrap:wrap; background:#FBF3E6; color:#9A5B12; border-bottom:1px solid #F0D9B5; padding:8px 16px; font-size:13.5px; }
.realms .viewas-bar button { background:#9A5B12; color:#fff; border:0; border-radius:16px; padding:5px 12px; font-size:12.5px; cursor:pointer; }
.realms .seed-card { display:flex; align-items:center; justify-content:space-between; gap:16px; flex-wrap:wrap; background:var(--lav1); border:1px solid var(--line); border-radius:14px; padding:16px 18px; margin-bottom:16px; }
.realms .seed-card strong { color:var(--p-deep); display:block; margin-bottom:2px; }
.realms .seed-card span { color:#5A4C74; font-size:13.5px; }
.realms .clear-row { display:flex; align-items:center; justify-content:space-between; gap:12px; flex-wrap:wrap; background:#FBF3E6; border:1px solid #F0D9B5; border-radius:12px; padding:12px 16px; margin:0 0 20px; font-size:13.5px; color:#9A5B12; }
.realms .db-error { display:flex; flex-direction:column; gap:8px; align-items:flex-start; background:#FBE9E6; border:1px solid #F0C9BF; border-radius:14px; padding:16px 18px; margin-bottom:18px; color:#B4442E; }
.realms .db-error strong { font-size:15px; }
.realms .db-error span { font-size:13.5px; color:#8a4433; }
.realms .db-error .db-msg { font-family:monospace; background:#fff; border:1px solid #F0C9BF; border-radius:8px; padding:6px 10px; color:#B4442E; word-break:break-word; max-width:100%; }
.realms .dash-analytics { margin-bottom:6px; }
.realms .line-chart { width:100%; height:auto; }
.realms .lc-x { font-size:11px; fill:#8A7AA6; }
.realms .lc-v { font-size:11px; fill:var(--p-deep); font-weight:600; }
.realms .perf, .realms .risk { display:grid; gap:10px; }
.realms .perf-row, .realms .risk-row { display:flex; align-items:center; justify-content:space-between; gap:10px; border-top:1px solid var(--lav2); padding-top:10px; }
.realms .perf-row:first-child, .realms .risk-row:first-child { border-top:0; padding-top:0; }
.realms .perf-name, .realms .risk-name { display:flex; flex-direction:column; font-size:14.5px; color:#3A2B54; }
.realms .perf-name em, .realms .risk-name em { font-style:normal; font-size:12px; color:#8A7AA6; }
.realms .perf-stat { font-size:13px; color:#5A4C74; margin-left:auto; margin-right:10px; }
.realms .risk-badge { font-size:12px; padding:4px 12px; border-radius:20px; border:1px solid var(--line); white-space:nowrap; }
.realms .risk-badge.high { background:#FBE9E6; color:#B4442E; border-color:#F0C9BF; }
.realms .risk-badge.medium { background:#FBF3E6; color:#9A5B12; border-color:#F0D9B5; }
.realms .risk-badge.low { background:#E6F4EA; color:#2E7D46; border-color:#BFE3CB; }

/* ===== consulting site ===== */
.realms .bar .nav { min-width:0; }
.realms .bar .tabs { overflow-x:auto; max-width:100%; min-width:0; scrollbar-width:none; flex-wrap:nowrap; justify-self:center; }
.realms .bar .tabs::-webkit-scrollbar { display:none; }
.realms .bar .tab { white-space:nowrap; }
.realms .page-lede { font-size:17px; color:#5A4C74; max-width:720px; margin:-8px auto 26px; text-align:center; }
.realms .center { text-align:center; }
.realms .home-services { max-width:1800px; margin:0 auto; padding:clamp(30px,4vw,56px) clamp(18px,4vw,56px); }
.realms .svc-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:16px; margin-top:22px; }
.realms .svc-card { background:#fff; border:1px solid var(--line); border-radius:16px; overflow:hidden; cursor:pointer; transition:.18s; display:flex; flex-direction:column; }
.realms .svc-card:hover { transform:translateY(-4px); box-shadow:0 16px 34px rgba(58,21,96,.14); border-color:var(--v); }
.realms .svc-img { height:300px; overflow:hidden; }
.realms .svc-img img { width:100%; height:100%; object-fit:cover; object-position:center top; }
.realms .svc-card h3 { font-size:17px; color:var(--p-deep); margin:16px 18px 6px; }
.realms .svc-card p { font-size:13.5px; color:#5A4C74; margin:0 18px 12px; line-height:1.55; flex:1; }
.realms .svc-more { font-size:13px; color:var(--p); font-weight:600; margin:0 18px 16px; }
.realms .clients-band { max-width:1500px; margin:0 auto; padding:10px 18px 30px; text-align:center; }
.realms .clients-row { display:flex; flex-wrap:wrap; gap:10px; justify-content:center; margin-top:14px; }
.realms .client-chip { background:var(--lav1); border:1px solid var(--line); color:#4A3B66; border-radius:22px; padding:8px 16px; font-size:14px; }
.realms .testi-band { max-width:1500px; margin:0 auto; padding:10px 18px 40px; }
.realms .testi-grid { display:grid; grid-template-columns:1fr 1fr; gap:16px; }
.realms .testi { margin:0; background:#fff; border:1px solid var(--line); border-left:3px solid var(--p); border-radius:14px; padding:22px 24px; }
.realms .testi p { font-size:16px; color:#3A2B54; font-style:italic; margin-bottom:12px; }
.realms .testi cite { font-style:normal; font-size:13px; color:#8A7AA6; }
.realms .cta-band, .realms .cta-row.onlight { }
.realms .cta-band { max-width:1500px; margin:34px auto 0; background:linear-gradient(135deg,var(--p-deep),var(--p-mid)); border-radius:20px; padding:clamp(28px,4vw,44px); text-align:center; color:#fff; }
.realms .cta-band h2 { color:#fff; font-size:clamp(22px,3vw,30px); margin-bottom:14px; }
.realms .cta-band p { color:#F1E5FB; margin-bottom:18px; }
.realms .btn.ghost.onlight { border-color:rgba(255,255,255,.7); background:rgba(255,255,255,.16); color:#fff; }
.realms .btn.ghost.onlight:hover { background:#fff; color:var(--p-deep); }
.realms .mon-lead { display:grid; grid-template-columns:1.2fr 1fr; gap:24px; align-items:center; margin-bottom:30px; }
.realms .mon-lead-copy p { color:#4A3B66; line-height:1.65; margin-bottom:12px; }
.realms .mon-lead-art { border-radius:18px; overflow:hidden; }
.realms .mon-lead-art img { width:100%; height:100%; object-fit:cover; }
.realms .case-grid { display:grid; grid-template-columns:1fr 1fr; gap:16px; margin-bottom:24px; }
.realms .case { background:#fff; border:1px solid var(--line); border-radius:14px; padding:22px; }
.realms .case h3 { color:var(--p-deep); font-size:17px; margin-bottom:8px; }
.realms .case p { color:#5A4C74; font-size:14px; }
.realms .certs { display:flex; flex-wrap:wrap; align-items:center; gap:10px; }
.realms .certs-lab { font-size:12px; letter-spacing:.1em; text-transform:uppercase; color:var(--v); margin-right:6px; }
.realms .cert-chip { background:var(--lav1); border:1px dashed var(--line); border-radius:10px; padding:8px 14px; font-size:13px; color:#5A4C74; }
.realms .leaders { display:grid; grid-template-columns:repeat(3,1fr); gap:18px; margin-bottom:34px; }
.realms .staff-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:18px; margin-bottom:30px; }
.realms .lead-grid { grid-template-columns:1fr 1fr; max-width:860px; margin:0 auto; }
.realms .staff.lead .staff-photo { width:72px; height:72px; }
.realms .staff-photo img { width:100%; height:100%; object-fit:cover; border-radius:50%; }
.realms .staff { background:#fff; border:1px solid var(--line); border-radius:16px; padding:22px; }
.realms .staff.lead { border-color:var(--v); box-shadow:0 12px 30px rgba(58,21,96,.12); background:linear-gradient(180deg,#fff,var(--lav1)); }
.realms .staff-top { display:flex; align-items:center; gap:14px; margin-bottom:12px; }
.realms .staff-photo { width:60px; height:60px; flex-shrink:0; border-radius:50%; background:linear-gradient(135deg,var(--p),var(--v)); display:grid; place-items:center; }
.realms .staff-photo span { color:#fff; font-size:20px; font-weight:700; letter-spacing:.03em; }
.realms .staff-id h3 { color:var(--p-deep); font-size:17px; line-height:1.2; }
.realms .staff-role { color:var(--p); font-size:13.5px; margin-top:3px; }
.realms .staff-unit { color:#8A7AA6; font-size:12.5px; }
.realms .staff-purpose { color:#5A4C74; font-size:14px; line-height:1.55; margin-bottom:8px; }
.realms .staff-duties { margin:10px 0 0; padding-left:18px; display:grid; gap:5px; }
.realms .staff-duties li { font-size:13.5px; color:#3A2B54; }
@media (max-width:900px){ .realms .staff-grid { grid-template-columns:1fr 1fr; } }
@media (max-width:560px){ .realms .staff-grid { grid-template-columns:1fr; } }
.realms .insights { display:grid; grid-template-columns:repeat(3,1fr); gap:16px; margin-bottom:20px; }
.realms .insight { background:#fff; border:1px solid var(--line); border-radius:16px; padding:22px; display:flex; flex-direction:column; gap:6px; }
.realms .insight-tag { display:inline-block; align-self:flex-start; background:var(--lav2); color:var(--p-deep); font-size:11px; letter-spacing:.06em; text-transform:uppercase; padding:3px 10px; border-radius:12px; }
.realms .insight-date { font-size:12px; color:#8A7AA6; }
.realms .insight h3 { color:var(--p-deep); font-size:17px; margin:4px 0; }
.realms .insight p { color:#5A4C74; font-size:14px; flex:1; }
.realms .insight .svc-more { margin:6px 0 0; }
.realms .contact-grid { display:grid; grid-template-columns:1.4fr 1fr; gap:20px; }
.realms .contact-side { background:var(--lav1); border:1px solid var(--line); border-radius:16px; padding:24px; }
.realms .contact-side h3 { color:var(--p-deep); margin-bottom:14px; }
.realms .enquiry-card h2 { color:var(--p-deep); margin-bottom:16px; }
.realms .pillar.clickable { cursor:pointer; }
.realms .pillar.clickable:hover { border-color:var(--v); transform:translateY(-3px); }
@media (max-width:900px){
  .realms .svc-grid, .realms .leaders, .realms .team-dir, .realms .insights { grid-template-columns:1fr 1fr; }
  .realms .testi-grid, .realms .case-grid, .realms .mon-lead, .realms .contact-grid { grid-template-columns:1fr; }
}
@media (max-width:560px){ .realms .svc-grid, .realms .leaders, .realms .team-dir, .realms .insights { grid-template-columns:1fr; } }

.realms .mon-rules { font-size:12.5px; color:#8A5A12; background:#FBF3E6; border:1px solid #F0D9B5; border-radius:10px; padding:8px 12px; margin-bottom:14px; }
.realms .mcat-r { display:flex; align-items:center; gap:8px; }
.realms .need { font-size:11.5px; color:#B4442E; background:#FBE9E6; border:1px solid #F0C9BF; border-radius:12px; padding:3px 9px; white-space:nowrap; }
.realms .ok { font-size:11.5px; color:#2E7D46; background:#E6F4EA; border:1px solid #BFE3CB; border-radius:12px; padding:3px 9px; }
.realms .mitem.flag { border-left:3px solid #B4442E; padding-left:12px; margin-left:-12px; }
.realms .ev-btn.urgent { border-color:#B4442E; color:#B4442E; }
.realms .hintline.req { color:#B4442E; font-weight:600; }
.realms .prop-list { display:grid; gap:14px; }
.realms .prop-card { background:#fff; border:1px solid var(--line); border-radius:16px; padding:20px 22px; }
.realms .prop-head { display:flex; align-items:center; justify-content:space-between; gap:12px; border-bottom:1px solid var(--lav2); padding-bottom:12px; margin-bottom:12px; }
.realms .prop-sec { margin-bottom:12px; }
.realms .prop-sec h4 { font-size:13px; letter-spacing:.04em; text-transform:uppercase; color:var(--v); margin-bottom:8px; }
.realms .corr { margin:0; padding-left:18px; display:grid; gap:6px; }
.realms .corr li { font-size:14px; color:#3A2B54; }
.realms .corr em { color:#5A4C74; font-style:italic; }
.realms .corr-tl { display:inline-block; margin-left:8px; font-size:11.5px; color:#9A5B12; background:#FBF3E6; border:1px solid #F0D9B5; border-radius:10px; padding:2px 8px; }
.realms .prop-actions { margin-top:4px; }
.realms .muted.sm { font-size:13.5px; color:#7A6A93; }
.realms .profile-cat .prof-grid { display:grid; grid-template-columns:repeat(4,1fr); gap:10px; margin-bottom:10px; }
@media (max-width:560px){ .realms .profile-cat .prof-grid { grid-template-columns:1fr 1fr; } }
.realms .langsel { font-family:inherit; font-size:13px; border:1px solid var(--line); border-radius:16px; padding:6px 10px; background:#fff; color:var(--p-deep); margin-right:2px; }
.realms .langsel:focus { outline:none; border-color:var(--p); }
.realms .list-tools { margin-bottom:14px; }
.realms .searchbox { font-family:inherit; font-size:14px; width:100%; max-width:340px; border:1px solid var(--line); border-radius:22px; padding:9px 16px; background:#fff; color:var(--ink); }
.realms .searchbox:focus { outline:none; border-color:var(--p); box-shadow:0 0 0 3px var(--lav2); }
.realms .ptools .searchbox { max-width:200px; }
.realms .fu-card { background:#fff; border:1px solid var(--line); border-radius:14px; padding:16px 18px; margin-bottom:10px; }
.realms .fu-head { display:flex; align-items:center; justify-content:space-between; gap:12px; }
.realms .fu-right { display:flex; align-items:center; gap:10px; }
.realms .fu-form { margin-top:12px; padding-top:12px; border-top:1px solid var(--lav2); }
.realms .fu-calls { margin:10px 0 0; padding-left:18px; }
.realms .fu-calls li { font-size:13px; color:#5A4C74; margin-bottom:4px; }
.realms .log-list { list-style:none; margin:0 0 18px; padding:0; border:1px solid var(--line); border-radius:12px; overflow:hidden; }
.realms .log-list li { display:flex; gap:12px; padding:9px 14px; font-size:13px; border-top:1px solid var(--lav2); }
.realms .log-list li:first-child { border-top:none; }
.realms .log-when { color:#8A7AA6; white-space:nowrap; font-variant-numeric:tabular-nums; }
.realms .log-msg { color:#3A2B54; }
.realms .hef-wrap { border:1px solid var(--line); border-radius:14px; padding:14px 16px; margin-bottom:18px; background:#fff; }
.realms .hef-title { cursor:pointer; display:flex; align-items:center; justify-content:space-between; font-weight:600; color:var(--p-deep); font-size:16px; }
.realms .hef-total { font-size:12px; color:var(--v); background:var(--lav2); border-radius:12px; padding:3px 10px; }
.realms .rag-summary-head { margin:6px 0 10px; }
.realms .rag-summary-head h3 { color:var(--p-deep); font-size:16px; }
.realms .hef-form { display:grid; gap:8px; margin-top:10px; }
.realms .hef-sec { border:1px solid var(--line); border-radius:10px; overflow:hidden; }
.realms .hef-sec > summary { cursor:pointer; list-style:none; display:flex; align-items:center; justify-content:space-between; padding:10px 14px; background:var(--lav1); font-size:14px; color:#3A2B54; font-weight:600; }
.realms .hef-sec > summary::-webkit-details-marker { display:none; }
.realms .hef-count { font-size:11.5px; color:#8A7AA6; background:#fff; border:1px solid var(--line); border-radius:10px; padding:2px 8px; font-weight:500; }
.realms .hef-fields { padding:12px 14px; display:grid; gap:12px; }
.realms .hef-field { display:flex; flex-direction:column; gap:6px; }
.realms .hef-label { font-size:13.5px; color:#4A3B66; }
.realms .hef-input { font-family:inherit; font-size:14px; border:1px solid var(--line); border-radius:8px; padding:8px 10px; background:#fff; color:var(--ink); width:100%; }
.realms .hef-input:focus { outline:none; border-color:var(--p); }
.realms .seg { display:inline-flex; border:1px solid var(--line); border-radius:8px; overflow:hidden; width:max-content; }
.realms .segb { font-family:inherit; font-size:13px; padding:7px 16px; background:#fff; border:none; border-right:1px solid var(--line); color:#5A4C74; cursor:pointer; }
.realms .segb:last-child { border-right:none; }
.realms .segb.on { background:var(--p); color:#fff; }
.realms .chks { display:flex; flex-wrap:wrap; gap:8px; }
.realms .chkpill { display:inline-flex; align-items:center; gap:6px; font-size:13px; border:1px solid var(--line); border-radius:20px; padding:6px 12px; color:#5A4C74; cursor:pointer; background:#fff; }
.realms .chkpill.on { border-color:var(--p); background:var(--lav2); color:var(--p-deep); }
.realms .chkpill input { margin:0; }
.realms .hq-oversight { margin-top:24px; }
.realms .hq-stats { display:grid; grid-template-columns:repeat(6,1fr); gap:10px; margin-bottom:14px; }
.realms .hq-stat { background:#fff; border:1px solid var(--line); border-radius:12px; padding:14px 10px; text-align:center; }
.realms .hq-stat .v { display:block; font-size:22px; font-weight:700; color:var(--p-deep); font-family:Lora,serif; }
.realms .hq-stat .l { display:block; font-size:11.5px; color:#8A7AA6; margin-top:2px; }
.realms .hq-table { border:1px solid var(--line); border-radius:12px; overflow:hidden; }
.realms .hq-tr { display:grid; grid-template-columns:2.2fr 1.2fr 0.8fr 1fr 1fr; gap:8px; padding:10px 14px; font-size:13px; color:#4A3B66; border-top:1px solid var(--lav2); align-items:center; }
.realms .hq-tr:first-child { border-top:none; }
.realms .hq-th { background:var(--lav1); font-weight:600; color:var(--p-deep); font-size:12px; text-transform:uppercase; letter-spacing:.04em; }
.realms .hq-name { color:#3A2B54; font-weight:500; }
.realms .hq-status { font-size:12px; }
.realms .hq-status.s-notvisited { color:#8A7AA6; }
.realms .hq-status.s-engaged { color:#9A5B12; }
.realms .hq-status.s-assessed { color:#2E6B8A; }
.realms .hq-status.s-debriefed { color:#2E7D46; }
@media (max-width:760px){ .realms .hq-stats { grid-template-columns:repeat(3,1fr); } .realms .hq-tr { grid-template-columns:2fr 1fr 1fr; } .realms .hq-tr span:nth-child(3), .realms .hq-tr span:nth-child(4) { display:none; } }

/* ===== contact page ===== */
.realms .contact-page { max-width:1800px; }
.realms .contact-hero { text-align:center; max-width:720px; margin:0 auto clamp(26px,4vw,44px); }
.realms .contact-hero h1 { font-size:clamp(30px,5vw,48px); line-height:1.06; color:var(--p-deep); letter-spacing:-0.01em; }
.realms .contact-lede { font-size:17px; color:#5A4C74; margin-top:14px; }
.realms .contact-split { display:grid; grid-template-columns:0.95fr 1.05fr; gap:20px; align-items:stretch; }
.realms .contact-panel { position:relative; overflow:hidden; border-radius:22px; padding:clamp(26px,3vw,38px); color:#fff; background:linear-gradient(150deg,#4C3B66 0%,#574277 45%,#6D4B8E 100%); box-shadow:0 24px 60px rgba(58,21,96,.28); }
.realms .panel-glow { position:absolute; width:340px; height:340px; right:-120px; top:-120px; background:radial-gradient(circle,rgba(169,143,196,.55),transparent 70%); pointer-events:none; }
.realms .contact-panel h2 { color:#fff; font-size:24px; margin-bottom:20px; position:relative; }
.realms .reach { list-style:none; margin:0 0 24px; padding:0; display:grid; gap:16px; position:relative; }
.realms .reach li { display:flex; gap:14px; align-items:flex-start; }
.realms .reach-ic { flex:0 0 auto; width:40px; height:40px; border-radius:12px; display:grid; place-items:center; background:rgba(255,255,255,.14); color:#fff; }
.realms .reach-k { display:block; font-size:11.5px; letter-spacing:.1em; text-transform:uppercase; color:#D9C9EC; margin-bottom:2px; }
.realms .reach li em { font-style:normal; font-size:15px; color:#fff; line-height:1.4; }
.realms .panel-cta { display:flex; flex-wrap:wrap; gap:10px; position:relative; }
.realms .enquiry { background:#fff; border:1px solid var(--line); border-radius:22px; padding:clamp(24px,3vw,34px); box-shadow:0 12px 34px rgba(58,21,96,.08); }
.realms .enquiry h2 { color:var(--p-deep); font-size:22px; margin-bottom:18px; }
.realms .btn.wide { width:100%; justify-content:center; }
.realms .enquiry.sent { display:flex; flex-direction:column; align-items:center; text-align:center; justify-content:center; gap:6px; }
.realms .sent-badge { width:64px; height:64px; border-radius:50%; display:grid; place-items:center; background:#E6F4EA; color:#2E7D46; margin-bottom:8px; }
.realms .enquiry.sent p { color:#5A4C74; max-width:380px; margin-bottom:12px; }
@media (max-width:820px){ .realms .contact-split { grid-template-columns:1fr; } }

/* ===== toasts + modal ===== */
.realms .toaster { position:fixed; left:50%; bottom:28px; transform:translateX(-50%); z-index:9999; display:flex; flex-direction:column; gap:8px; align-items:center; pointer-events:none; }
.realms .toast { pointer-events:auto; background:#2E2140; color:#fff; font-size:14px; padding:11px 18px; border-radius:12px; box-shadow:0 10px 30px rgba(0,0,0,.28); animation:toastin .28s ease; max-width:90vw; }
.realms .toast.ok { background:#2E7D46; } .realms .toast.warn { background:#9A5B12; } .realms .toast.err { background:#B4442E; }
@keyframes toastin { from { opacity:0; transform:translateY(10px) } to { opacity:1; transform:none } }
.realms .modal-scrim { position:fixed; inset:0; z-index:9998; background:rgba(36,21,54,.5); backdrop-filter:blur(2px); display:grid; place-items:center; padding:20px; }
.realms .modal { background:#fff; border-radius:18px; padding:26px; max-width:400px; width:100%; box-shadow:0 30px 70px rgba(0,0,0,.3); }
.realms .modal h3 { color:var(--p-deep); font-size:19px; margin-bottom:8px; }
.realms .modal p { color:#5A4C74; font-size:14.5px; margin-bottom:20px; }
.realms .modal-actions { display:flex; justify-content:flex-end; gap:10px; }
.realms .btn.danger { background:#B4442E; color:#fff; }
.realms .btn.danger:hover { background:#98351f; }

/* completion meter */
.realms .mon-meter { display:grid; gap:8px; margin:4px 0 14px; }
.realms .meter-row { display:grid; grid-template-columns:88px 1fr auto; gap:10px; align-items:center; }
.realms .meter-lab { font-size:12px; color:#8A7AA6; }
.realms .meter-track { height:8px; border-radius:6px; background:var(--lav2); overflow:hidden; }
.realms .meter-fill { height:100%; background:linear-gradient(90deg,var(--p),var(--v)); border-radius:6px; transition:width .35s ease; }
.realms .meter-fill.alt { background:linear-gradient(90deg,#2E7D46,#7FC29B); }
.realms .meter-val { font-size:12px; color:#5A4C74; font-variant-numeric:tabular-nums; }

/* lightbox */
.realms .lightbox { position:fixed; inset:0; z-index:9998; background:rgba(20,10,32,.9); display:grid; place-items:center; padding:24px; cursor:zoom-out; }
.realms .lightbox img { max-width:92vw; max-height:88vh; border-radius:10px; box-shadow:0 20px 60px rgba(0,0,0,.5); }
.realms .lightbox-x { position:fixed; top:18px; right:22px; background:rgba(255,255,255,.15); color:#fff; border:none; width:40px; height:40px; border-radius:50%; font-size:24px; cursor:pointer; }

/* facility history drawer */
.realms .drawer-scrim { position:fixed; inset:0; z-index:9997; background:rgba(36,21,54,.45); display:flex; justify-content:flex-end; }
.realms .drawer { width:min(420px,92vw); background:#fff; height:100%; overflow-y:auto; padding:24px; box-shadow:-20px 0 50px rgba(0,0,0,.2); }
.realms .anim-right { animation:slidein .26s ease; }
@keyframes slidein { from { transform:translateX(24px); opacity:.4 } to { transform:none; opacity:1 } }
.realms .drawer-head { display:flex; align-items:flex-start; justify-content:space-between; gap:12px; margin-bottom:16px; }
.realms .drawer-head h3 { color:var(--p-deep); font-size:19px; }
.realms .drawer-sub { color:var(--v); font-size:12px; letter-spacing:.06em; text-transform:uppercase; margin-bottom:10px; }
.realms .drawer-visits { list-style:none; margin:0; padding:0; display:grid; gap:8px; }
.realms .drawer-visits li { display:flex; align-items:center; justify-content:space-between; gap:10px; padding:12px 14px; border:1px solid var(--line); border-radius:12px; }
.realms .dv-main { display:flex; flex-direction:column; }

/* settings */
.realms .settings-card { background:#fff; border:1px solid var(--line); border-radius:16px; padding:24px; max-width:680px; }
.realms .settings-card h3 { color:var(--p-deep); font-size:17px; margin-bottom:6px; }

/* ===== polish: focus, motion, hovers, empty, skeleton ===== */
.realms .btn { transition:transform .15s ease, box-shadow .15s ease, background .15s ease, color .15s ease; }
.realms .btn.primary:hover, .realms .btn.light:hover { transform:translateY(-1px); }
.realms a:focus-visible, .realms button:focus-visible, .realms input:focus-visible, .realms select:focus-visible, .realms textarea:focus-visible, .realms summary:focus-visible { outline:2px solid var(--p); outline-offset:2px; border-radius:6px; }
.realms .empty { text-align:center; color:#8A7AA6; padding:34px 20px; border:1px dashed var(--line); border-radius:14px; background:var(--lav1); }
.realms .empty.sm { padding:18px; }
.realms .skeleton { position:relative; overflow:hidden; background:var(--lav2); border-radius:10px; }
.realms .skeleton::after { content:''; position:absolute; inset:0; transform:translateX(-100%); background:linear-gradient(90deg,transparent,rgba(255,255,255,.6),transparent); animation:shimmer 1.3s infinite; }
@keyframes shimmer { 100% { transform:translateX(100%) } }
.realms .skel-row { height:58px; margin-bottom:10px; }
@media (prefers-reduced-motion: reduce) { .realms *, .realms *::after, .realms *::before { animation-duration:.001ms !important; transition-duration:.001ms !important; } .realms .anim { animation:none !important; opacity:1 !important; transform:none !important; } }

/* ===== AI ===== */
.realms .ai-btn { display:inline-flex; align-items:center; gap:6px; }
.realms .ai-spark { color:var(--v); font-size:13px; }
.realms .ai-panel { background:linear-gradient(180deg,var(--lav1),#fff); border:1px solid var(--line); border-left:3px solid var(--p); border-radius:12px; padding:14px 16px; margin-top:10px; }
.realms .ai-panel h4 { color:var(--p-deep); font-size:13px; text-transform:uppercase; letter-spacing:.05em; margin-bottom:6px; display:flex; align-items:center; gap:6px; }
.realms .ai-panel .ai-text { font-size:14px; color:#3A2B54; white-space:pre-wrap; line-height:1.55; }
.realms .chat-wrap { border:1px solid var(--line); border-radius:16px; overflow:hidden; display:flex; flex-direction:column; height:min(62vh,560px); background:#fff; }
.realms .chat-msgs { flex:1; overflow-y:auto; padding:18px; display:flex; flex-direction:column; gap:12px; }
.realms .cmsg { max-width:80%; padding:11px 15px; border-radius:14px; font-size:14.5px; line-height:1.5; white-space:pre-wrap; }
.realms .cmsg.user { align-self:flex-end; background:var(--p); color:#fff; border-bottom-right-radius:4px; }
.realms .cmsg.assistant { align-self:flex-start; background:var(--lav2); color:#3A2B54; border-bottom-left-radius:4px; }
.realms .chat-input { display:flex; gap:8px; padding:12px; border-top:1px solid var(--line); background:var(--lav1); }
.realms .chat-input input { flex:1; font-family:inherit; font-size:14px; border:1px solid var(--line); border-radius:22px; padding:10px 16px; background:#fff; }
.realms .assistant-fab { position:fixed; right:22px; bottom:22px; z-index:900; background:linear-gradient(135deg,var(--p-deep),var(--p-mid)); color:#fff; border:none; border-radius:26px; padding:13px 22px; font-size:15px; font-weight:600; box-shadow:0 12px 30px rgba(58,21,96,.34); }
.realms .assistant-panel { position:fixed; right:22px; bottom:78px; z-index:900; width:min(380px,92vw); height:min(540px,74vh); background:#fff; border:1px solid var(--line); border-radius:18px; box-shadow:0 24px 60px rgba(58,21,96,.28); display:flex; flex-direction:column; overflow:hidden; animation:slideup .24s ease; }
@keyframes slideup { from { opacity:0; transform:translateY(12px) } to { opacity:1; transform:none } }
.realms .assistant-head { display:flex; align-items:center; justify-content:space-between; padding:14px 18px; background:linear-gradient(135deg,var(--p-deep),var(--p-mid)); color:#fff; font-weight:600; }
.realms .assistant-head .linkbtn { color:#EBDDF8; }
.realms .assistant-msgs { flex:1; overflow-y:auto; padding:16px; display:flex; flex-direction:column; gap:10px; background:var(--lav1); }
.realms .amsg { max-width:88%; padding:10px 14px; border-radius:14px; font-size:14px; line-height:1.5; white-space:pre-wrap; }
.realms .amsg.user { align-self:flex-end; background:var(--p); color:#fff; border-bottom-right-radius:4px; }
.realms .amsg.assistant { align-self:flex-start; background:#fff; color:#3A2B54; border:1px solid var(--line); border-bottom-left-radius:4px; }
.realms .assistant-input { display:flex; gap:8px; padding:12px; border-top:1px solid var(--line); }
.realms .assistant-input input { flex:1; font-family:inherit; font-size:14px; border:1px solid var(--line); border-radius:20px; padding:9px 14px; }
.realms .ai-row { display:flex; flex-wrap:wrap; gap:8px; margin-bottom:10px; }
.realms .ai-check { display:inline-flex; align-items:center; gap:6px; font-size:13px; color:#5A4C74; white-space:nowrap; }
.realms .mnote-row { display:flex; gap:8px; align-items:flex-start; }
.realms .mnote-row .mnote { flex:1; }
.realms .dictate.rec { color:#B4442E; border-color:#B4442E; }
.realms .ev-ai { font-size:11px; padding:3px 8px; margin-top:4px; }
`

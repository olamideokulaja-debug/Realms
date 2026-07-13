import React, { useEffect, useState } from 'react'
import { supabase, MODE } from './supabaseClient.js'

/*
  REALMS FIELD — Stages 1 & 2 (single-file App.jsx)
  Stage 1: tabbed public site (Home, Process, Services, About, Contact).
  Stage 2: Supabase auth + role picker + per-user identity + role-aware dashboard.
  Auth runs in demo mode until VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set.
  Fields to complete before publishing are marked EDIT.
*/

const SITE_TABS = [
  { id: 'home', label: 'Home' },
  { id: 'process', label: 'Process' },
  { id: 'services', label: 'Services' },
  { id: 'about', label: 'About' },
  { id: 'contact', label: 'Contact' }
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

const COVERAGE = [
  { label: 'Facilities monitored' },
  { label: 'Areas & LGAs covered' },
  { label: 'Monitoring visits completed' },
  { label: 'Corrective actions to closure' }
]

const PRINCIPLES = [
  { t: 'Professional in approach', d: 'Structured planning, official identification and a courteous, consistent process on every visit.' },
  { t: 'Educational in engagement', d: 'We explain findings, their implications and the route to compliance, so facilities improve.' },
  { t: 'Firm in enforcement', d: 'Evidence-based assessment and clear corrective guidance that protect the residents these facilities serve.' }
]

const ROLES = [
  { id: 'team_leader', label: 'Team Leader', blurb: 'Assign facilities, plan routes and review your team\u2019s visits.', icon: IconLeader,
    tools: [ ['Assign & route facilities', 'Stage 3'], ['Review team visits', 'Stage 6'], ['Team analytics', 'Stage 8'] ] },
  { id: 'field_monitor', label: 'Field Monitor', blurb: 'Run visits end to end: map, engage, monitor and debrief.', icon: IconMonitor,
    tools: [ ['Map & route', 'Stage 3'], ['Engage check-in', 'Stage 4'], ['Monitor checklist', 'Stage 5'], ['Debrief & sign-off', 'Stage 6'] ] },
  { id: 'rhsc_hq', label: 'RHSC HQ', blurb: 'Oversight, facility data, exports and analytics.', icon: IconHQ,
    tools: [ ['Facility list ingestion', 'Stage 3'], ['Reports & exports', 'Stage 7'], ['Oversight dashboard', 'Stage 8'] ] },
  { id: 'hefamaa_reviewer', label: 'HEFAMAA Reviewer', blurb: 'Read and validate monitoring outcomes across the State.', icon: IconShield,
    tools: [ ['Review reports', 'Stage 6'], ['Validate outcomes', 'Stage 6'], ['Compliance overview', 'Stage 8'] ] },
  { id: 'facility_proprietor', label: 'Facility Proprietor', blurb: 'View your facility\u2019s outcomes and required actions.', icon: IconStore,
    tools: [ ['My facility outcomes', 'Stage 6'], ['My corrective actions', 'Stage 6'], ['Re-inspection status', 'Stage 7'] ] }
]

// EDIT: map staff sign-in emails to their identity. Unlisted emails get a name from the address.
const IDENTITY = {
  // 'solomon@realms.ng': { name: 'Dr Solomon', title: 'Team Leader', photo: '' },
}

function identityFor(email) {
  const found = IDENTITY[(email || '').toLowerCase()]
  if (found) return found
  const base = (email || 'staff').split('@')[0].replace(/[._-]+/g, ' ')
  const name = base.split(' ').map(w => w ? w[0].toUpperCase() + w.slice(1) : w).join(' ')
  return { name: name || 'Staff', title: '', photo: '' }
}

function roleById(id) { return ROLES.find(r => r.id === id) || null }

/* ---------- role icons ---------- */
function IconLeader() { return (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><circle cx="12" cy="8" r="3.4"/><path d="M5 20c0-3.6 3.1-6 7-6s7 2.4 7 6"/><path d="M12 1.6l1 2 2.2.2-1.7 1.5.5 2.1L12 6.4 9.9 7.5l.5-2.1L8.8 3.8 11 3.6z"/></svg>) }
function IconMonitor() { return (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><rect x="5" y="3.5" width="14" height="17" rx="2"/><path d="M9 3.5V6h6V3.5"/><path d="M8.5 11l2 2 4-4.5"/><path d="M8.5 16h7"/></svg>) }
function IconHQ() { return (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M3 21h18"/><path d="M5 21V7l7-4 7 4v14"/><path d="M9.5 21v-4h5v4"/><path d="M9 11h1.5M13.5 11H15M9 14h1.5M13.5 14H15"/></svg>) }
function IconShield() { return (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M12 2.5l7 2.6v5.4c0 4.7-3 8.2-7 9.5-4-1.3-7-4.8-7-9.5V5.1z"/><path d="M8.8 12l2.1 2.1 4.3-4.6"/></svg>) }
function IconStore() { return (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M4 9.5V20h16V9.5"/><path d="M3 4.5h18l1 5H2z"/><path d="M9.5 20v-5h5v5"/></svg>) }

/* ---------- shared page pieces ---------- */
function SectionHead({ eyebrow, title }) {
  return (<div className="section-head anim"><p className="eyebrow">{eyebrow}</p><h2>{title}</h2></div>)
}

/* ---------- public site pages ---------- */
function HomePage({ onSignIn, go }) {
  return (
    <div className="page">
      <section className="hero">
        <div className="hero-copy anim">
          <p className="eyebrow">Lagos State &middot; In collaboration with HEFAMAA</p>
          <h1>Safer facilities.<br />Higher standards.<br /><span className="accent">Healthier Lagos.</span></h1>
          <p className="lede">REALMS Healthcare Services Consulting Limited partners with HEFAMAA to monitor health facilities across Lagos State, holding every provider to the standards that protect the people they serve.</p>
          <div className="cta-row">
            <button className="btn primary" onClick={onSignIn}>Staff sign-in</button>
            <button className="btn ghost" onClick={() => go('contact')}>Enquire about our work</button>
          </div>
          <p className="tagline">Professional. Educational. Enforcement-driven.</p>
        </div>
        <div className="hero-art anim" style={{ animationDelay: '120ms' }}>
          <div className="art-panel"><img src="/rhsc-logo.png" alt="REALMS Healthcare Services Consulting Limited" /></div>
        </div>
      </section>
      <section className="home-strip anim">
        {/* EDIT: replace each value with a verified figure before publishing. */}
        {COVERAGE.map(c => (<div className="mini-stat" key={c.label}><span className="mini-value">&mdash;</span><span className="mini-label">{c.label}</span></div>))}
      </section>
    </div>
  )
}

function ProcessPage() {
  return (
    <div className="page">
      <SectionHead eyebrow="How we work" title="A four-stage field process" />
      <div className="wave-wrap">
        <svg className="wave" viewBox="0 0 1000 90" preserveAspectRatio="none" aria-hidden="true"><path d="M0 55 C110 22, 200 78, 320 52 S540 20, 660 52 S870 82, 1000 46" fill="none" stroke="#A66BD4" strokeWidth="2.5"/></svg>
        <ol className="stages">
          {STAGES.map((s, i) => (
            <li className="stage anim" key={s.n} style={{ animationDelay: (i * 80) + 'ms' }}>
              <span className="stage-n">{s.n}</span><span className="dot" aria-hidden="true" /><h3>{s.t}</h3><p>{s.d}</p>
            </li>
          ))}
        </ol>
      </div>
    </div>
  )
}

function ServicesPage() {
  return (
    <div className="page">
      <SectionHead eyebrow="What we do" title="Four service pillars" />
      <div className="pillars">
        {PILLARS.map((p, i) => (
          <article className="pillar anim" key={p.t} style={{ animationDelay: (i * 70) + 'ms' }}>
            <span className="pillar-rule" aria-hidden="true" /><h3>{p.t}</h3><p>{p.d}</p>
          </article>
        ))}
      </div>
    </div>
  )
}

function AboutPage() {
  return (
    <div className="page">
      <SectionHead eyebrow="The mandate" title="Who we are" />
      <div className="mandate-grid">
        <p className="anim">The Health Facility Monitoring and Accreditation Agency (HEFAMAA) is the Lagos State authority responsible for inspecting, monitoring and licensing public and private health facilities, and for promoting consistent quality in service delivery.</p>
        <p className="anim" style={{ animationDelay: '90ms' }}>REALMS Healthcare Services Consulting Limited supports that mandate on the ground. Our field teams carry out routine monitoring across the State, combining efficient planning, professional engagement, evidence-based assessment and clear corrective guidance, raising the standard of care while treating facility owners with courtesy and respect.</p>
      </div>
      <div className="principles">
        {PRINCIPLES.map((p, i) => (<div className="principle anim" key={p.t} style={{ animationDelay: (i * 70) + 'ms' }}><h3>{p.t}</h3><p>{p.d}</p></div>))}
      </div>
    </div>
  )
}

function ContactPage() {
  return (
    <div className="page">
      <SectionHead eyebrow="Get in touch" title="Work with RHSC" />
      <div className="enquiry-card anim">
        <div className="enquiry-copy">
          <h2>Reach our team</h2>
          <p>For regulatory partnerships, facility support or consulting.</p>
        </div>
        {/* EDIT: add real contact details below before publishing. */}
        <ul className="contacts">
          <li><span>Email</span><em>hello@example.com</em></li>
          <li><span>Phone</span><em>Add number</em></li>
          <li><span>Office</span><em>Add Lagos address</em></li>
        </ul>
      </div>
    </div>
  )
}

/* ---------- auth ---------- */
function AuthPanel({ onDone, onCancel }) {
  const [mode, setMode] = useState('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState('')

  async function submit() {
    setMsg(''); setBusy(true)
    try {
      if (MODE === 'supabase') {
        if (mode === 'signup') {
          const { error } = await supabase.auth.signUp({ email, password })
          if (error) throw error
          setMsg('Account created. Check your email if confirmation is required, then sign in.')
          setMode('signin')
        } else {
          const { error } = await supabase.auth.signInWithPassword({ email, password })
          if (error) throw error
        }
      } else {
        // demo mode: accept any email, persist locally
        if (!email) throw new Error('Enter an email to continue.')
        localStorage.setItem('realms_demo_user', JSON.stringify({ email }))
        onDone({ email })
      }
    } catch (e) {
      setMsg(e.message || 'Something went wrong. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="auth-shell">
      <div className="auth-card anim">
        <img className="auth-mark" src="/rhsc-mark.png" alt="RHSC" />
        <h2>{mode === 'signup' ? 'Create your Realms Field account' : 'Sign in to Realms Field'}</h2>
        <p className="auth-sub">For RHSC staff and authorised HEFAMAA reviewers.</p>
        <label className="field"><span>Email</span>
          <input type="email" value={email} autoComplete="email" onChange={e => setEmail(e.target.value)} placeholder="you@realms.ng" />
        </label>
        <label className="field"><span>Password</span>
          <input type="password" value={password} autoComplete="current-password" onChange={e => setPassword(e.target.value)} placeholder={MODE === 'demo' ? 'Not required in demo' : '\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022'} />
        </label>
        {msg && <p className="auth-msg">{msg}</p>}
        <button className="btn primary wide" onClick={submit} disabled={busy}>{busy ? 'Please wait\u2026' : (mode === 'signup' ? 'Create account' : 'Sign in')}</button>
        <button className="linkbtn" onClick={() => setMode(mode === 'signup' ? 'signin' : 'signup')}>
          {mode === 'signup' ? 'Already have an account? Sign in' : 'Need an account? Create one'}
        </button>
        <button className="linkbtn subtle" onClick={onCancel}>Back to site</button>
        {MODE === 'demo' && <p className="demo-note">Demo mode: add Supabase keys to enable real accounts. See the deploy guide.</p>}
      </div>
    </div>
  )
}

/* ---------- role picker ---------- */
function RolePicker({ identity, onPick, onSignOut }) {
  return (
    <div className="page role-page">
      <div className="section-head anim">
        <p className="eyebrow">Welcome, {identity.name}</p>
        <h2>Which best describes you?</h2>
      </div>
      <div className="role-grid">
        {ROLES.map((r, i) => {
          const Icon = r.icon
          return (
            <button className="role-card anim" key={r.id} style={{ animationDelay: (i * 60) + 'ms' }} onClick={() => onPick(r.id)}>
              <span className="role-icon"><Icon /></span>
              <span className="role-label">{r.label}</span>
              <span className="role-blurb">{r.blurb}</span>
            </button>
          )
        })}
      </div>
      <button className="linkbtn subtle center" onClick={onSignOut}>Sign out</button>
    </div>
  )
}

/* ---------- dashboard ---------- */
function Dashboard({ identity, role, onSignOut, onChangeRole }) {
  const r = roleById(role)
  const Icon = r ? r.icon : IconMonitor
  return (
    <div className="page dash">
      <div className="dash-head anim">
        <div className="dash-hello">
          <span className="dash-icon"><Icon /></span>
          <div>
            <p className="eyebrow">{r ? r.label : 'Realms Field'}</p>
            <h2>Welcome, {identity.name}</h2>
            {identity.title ? <p className="dash-title">{identity.title}</p> : null}
          </div>
        </div>
      </div>
      <p className="dash-intro anim">Your workspace is ready. The tools below unlock in the coming build stages.</p>
      <div className="tool-grid">
        {(r ? r.tools : []).map(([name, stage], i) => (
          <div className="tool-card anim" key={name} style={{ animationDelay: (i * 60) + 'ms' }}>
            <span className="tool-name">{name}</span>
            <span className="tool-stage">{stage}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ---------- top bars ---------- */
function SiteBar({ tab, setTab, onSignIn }) {
  return (
    <header className="bar">
      <button className="wordmark" onClick={() => setTab('home')} aria-label="REALMS home">
        <img className="mark" src="/rhsc-mark.png" alt="RHSC" />
        <span className="wm-text"><strong>REALMS</strong><em>Healthcare Services Consulting</em></span>
      </button>
      <nav className="nav">
        <div className="tabs">
          {SITE_TABS.map(t => (
            <button key={t.id} className={'tab' + (tab === t.id ? ' active' : '')} onClick={() => setTab(t.id)}>{t.label}</button>
          ))}
        </div>
        <button className="signin" onClick={onSignIn}>Staff sign-in</button>
      </nav>
    </header>
  )
}

function AppBar({ identity, role, onSignOut, onChangeRole }) {
  const r = roleById(role)
  return (
    <header className="bar app-bar">
      <div className="wordmark">
        <img className="mark" src="/rhsc-mark.png" alt="RHSC" />
        <span className="wm-text"><strong>REALMS FIELD</strong><em>{r ? r.label : 'Staff workspace'}</em></span>
      </div>
      <nav className="nav">
        <span className="who">{identity.name}</span>
        {role && <button className="tab" onClick={onChangeRole}>Change role</button>}
        <button className="signin" onClick={onSignOut}>Sign out</button>
      </nav>
    </header>
  )
}

/* ---------- root ---------- */
export default function App() {
  const [tab, setTab] = useState('home')
  const [view, setView] = useState('site') // 'site' | 'auth' | 'app'
  const [user, setUser] = useState(null)   // { email, id? }
  const [role, setRole] = useState(null)

  // session bootstrap
  useEffect(() => {
    if (MODE === 'supabase') {
      let subscription
      try {
        const res = supabase.auth.onAuthStateChange((_e, s) => {
          if (s && s.user) { setUser({ email: s.user.email, id: s.user.id }); loadRole(s.user.id); setView('app') }
          else { setUser(null); setRole(null); setView(prev => (prev === 'app' ? 'site' : prev)) }
        })
        subscription = res.data.subscription
      } catch (e) { /* site still renders */ }
      return () => { if (subscription) subscription.unsubscribe() }
    } else {
      try {
        const raw = localStorage.getItem('realms_demo_user')
        const dr = localStorage.getItem('realms_demo_role')
        if (raw) { setUser(JSON.parse(raw)); if (dr) setRole(dr); setView('app') }
      } catch (e) { /* ignore */ }
    }
  }, [])

  async function loadRole(uid) {
    if (MODE !== 'supabase') return
    try {
      const { data } = await supabase.from('kv').select('v').eq('user_id', uid).eq('k', 'role').maybeSingle()
      if (data && data.v) setRole(typeof data.v === 'string' ? data.v : data.v.role)
    } catch (e) { /* leave role unset; role picker will show */ }
  }

  async function pickRole(id) {
    setRole(id)
    if (MODE === 'supabase' && user) {
      await supabase.from('kv').upsert({ user_id: user.id, k: 'role', v: id, updated_at: new Date().toISOString() })
    } else {
      localStorage.setItem('realms_demo_role', id)
    }
  }

  function afterAuth(u) { setUser(u); setView('app') }

  async function signOut() {
    if (MODE === 'supabase') { await supabase.auth.signOut() }
    else { localStorage.removeItem('realms_demo_user'); localStorage.removeItem('realms_demo_role') }
    setUser(null); setRole(null); setView('site'); setTab('home')
  }

  const identity = user ? identityFor(user.email) : { name: 'Staff', title: '' }

  let body
  if (view === 'auth') {
    body = <AuthPanel onDone={afterAuth} onCancel={() => setView('site')} />
  } else if (view === 'app' && user) {
    body = !role
      ? <RolePicker identity={identity} onPick={pickRole} onSignOut={signOut} />
      : <Dashboard identity={identity} role={role} onSignOut={signOut} onChangeRole={() => setRole(null)} />
  } else {
    body = (
      tab === 'home' ? <HomePage onSignIn={() => setView('auth')} go={setTab} />
      : tab === 'process' ? <ProcessPage />
      : tab === 'services' ? <ServicesPage />
      : tab === 'about' ? <AboutPage />
      : <ContactPage />
    )
  }

  const showAppBar = view === 'app' && user
  const showAuthBare = view === 'auth'

  return (
    <div className="realms">
      <style>{css}</style>
      {!showAuthBare && (showAppBar
        ? <AppBar identity={identity} role={role} onSignOut={signOut} onChangeRole={() => setRole(null)} />
        : <SiteBar tab={tab} setTab={(t) => { setView('site'); setTab(t) }} onSignIn={() => setView('auth')} />)}

      <main id="top" className={showAuthBare ? 'main-auth' : ''}>
        {body}
      </main>

      {!showAppBar && !showAuthBare && (
        <footer className="foot">
          <div className="foot-inner">
            <div className="foot-brand"><img className="foot-mark" src="/rhsc-mark.png" alt="RHSC" /><span>REALMS Healthcare Services Consulting Limited</span></div>
            <p>In collaboration with HEFAMAA, Lagos State.</p>
            <p className="foot-tag">Professional. Educational. Enforcement-driven.</p>
          </div>
        </footer>
      )}
    </div>
  )
}

const css = `
.realms { --ink:#3A2B54; --p:#7A34A8; --p-deep:#642C90; --p-mid:#8E44C0; --v:#A66BD4; --lav1:#F7F1FD; --lav2:#EEE1F9; --line:#E9DCF6; --wave:#3E86C9; --white:#ffffff; color:var(--ink); min-height:100vh; display:flex; flex-direction:column; }
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

/* top bar + tabs */
.realms .bar { position:sticky; top:0; z-index:20; display:flex; align-items:center; justify-content:space-between; gap:16px; padding:12px clamp(18px,4vw,56px); background:rgba(255,255,255,.92); backdrop-filter:blur(8px); border-bottom:1px solid var(--line); }
.realms .wordmark { display:flex; align-items:center; gap:12px; background:none; border:0; padding:0; }
.realms .bar .mark { height:42px; width:auto; }
.realms .wm-text { display:flex; flex-direction:column; line-height:1.05; text-align:left; }
.realms .wm-text strong { font-size:18px; letter-spacing:.14em; color:var(--p-deep); }
.realms .wm-text em { font-style:normal; font-size:10px; letter-spacing:.12em; text-transform:uppercase; color:#8A7AA6; }
.realms .nav { display:flex; align-items:center; gap:12px; }
.realms .tabs { display:flex; align-items:center; gap:4px; background:var(--lav1); border:1px solid var(--line); border-radius:30px; padding:4px; }
.realms .tab { border:0; background:none; color:#5A4C74; font-size:14.5px; padding:8px 16px; border-radius:22px; transition:.16s; }
.realms .tab:hover { color:var(--p); }
.realms .tab.active { background:#fff; color:var(--p-deep); box-shadow:0 2px 8px rgba(122,52,168,.14); font-weight:600; }
.realms .signin { padding:9px 18px; border:1.5px solid var(--p); background:none; border-radius:24px; color:var(--p); font-weight:500; font-size:14.5px; transition:.16s; }
.realms .signin:hover { background:var(--p); color:#fff; }
.realms .app-bar .who { font-size:14.5px; color:#5A4C74; }
.realms .who + .tab { border:1px solid var(--line); border-radius:22px; }

/* generic page frame — limits scroll, keeps each tab self-contained */
.realms main { flex:1; }
.realms .page { max-width:1160px; margin:0 auto; padding:clamp(30px,4vw,58px) clamp(18px,4vw,56px) clamp(40px,5vw,70px); min-height:56vh; }
.realms .section-head { text-align:center; max-width:720px; margin:0 auto clamp(26px,3.4vw,44px); }
.realms .section-head h2 { font-size:clamp(28px,3.3vw,40px); color:var(--p-deep); }
.realms .btn { display:inline-block; font-size:16px; padding:14px 26px; border-radius:30px; font-weight:500; transition:.16s; border:0; }
.realms .btn.primary { background:var(--p); color:#fff; }
.realms .btn.primary:hover { background:var(--p-deep); transform:translateY(-1px); }
.realms .btn.primary:disabled { opacity:.6; cursor:default; transform:none; }
.realms .btn.ghost { border:1.5px solid var(--line); color:var(--p); background:#fff; }
.realms .btn.ghost:hover { border-color:var(--v); background:var(--lav1); }
.realms .btn.wide { width:100%; }

/* hero (home) */
.realms .hero { display:grid; grid-template-columns:1.12fr .88fr; gap:44px; align-items:center; }
.realms .hero h1 { font-size:clamp(36px,5vw,62px); line-height:1.05; color:var(--p-deep); margin-bottom:20px; }
.realms .lede { font-size:clamp(16px,1.4vw,19px); line-height:1.6; color:#54466E; max-width:38ch; }
.realms .cta-row { display:flex; flex-wrap:wrap; gap:14px; margin:28px 0 20px; }
.realms .tagline { font-style:italic; color:#8A7AA6; font-size:15px; }
.realms .hero-art { display:flex; justify-content:center; }
.realms .art-panel { width:min(400px,86vw); border-radius:26px; padding:clamp(24px,3.5vw,42px); background:radial-gradient(circle at 50% 30%, var(--lav1), var(--lav2)); box-shadow:0 26px 64px rgba(122,52,168,.16); border:1px solid #EBDCF8; }
.realms .home-strip { display:grid; grid-template-columns:repeat(4,1fr); gap:16px; margin-top:clamp(30px,4vw,52px); }
.realms .mini-stat { text-align:center; padding:20px 12px; background:var(--lav1); border:1px solid var(--line); border-radius:14px; }
.realms .mini-value { display:block; font-size:34px; font-weight:700; color:var(--p); line-height:1; margin-bottom:8px; }
.realms .mini-label { font-size:12.5px; color:#5A4C74; }

/* process */
.realms .wave-wrap { position:relative; max-width:1100px; margin:0 auto; }
.realms .wave { position:absolute; top:34px; left:0; width:100%; height:90px; pointer-events:none; opacity:.6; }
.realms .stages { list-style:none; margin:0; padding:0; display:grid; grid-template-columns:repeat(4,1fr); gap:26px; }
.realms .stage { text-align:center; padding:0 6px; }
.realms .stage-n { font-size:14px; letter-spacing:.18em; color:var(--v); font-weight:700; }
.realms .stage .dot { display:block; width:15px; height:15px; margin:18px auto 20px; border-radius:50%; background:#fff; border:3px solid var(--p); box-shadow:0 0 0 6px var(--lav1); }
.realms .stage h3 { font-size:21px; color:var(--p-deep); margin-bottom:10px; }
.realms .stage p { font-size:14.5px; line-height:1.58; color:#5A4C74; }

/* services */
.realms .pillars { display:grid; grid-template-columns:1fr 1fr; gap:22px; }
.realms .pillar { background:#fff; border:1px solid var(--line); border-radius:16px; padding:28px 28px 32px; transition:box-shadow .2s ease, border-color .2s ease, transform .2s ease; }
.realms .pillar:hover { box-shadow:0 18px 44px rgba(122,52,168,.12); border-color:var(--v); transform:translateY(-3px); }
.realms .pillar-rule { display:block; width:44px; height:4px; border-radius:3px; background:linear-gradient(90deg,var(--p),var(--v)); margin-bottom:18px; }
.realms .pillar h3 { font-size:21px; color:var(--p-deep); margin-bottom:11px; }
.realms .pillar p { font-size:15px; line-height:1.6; color:#4A3B66; }

/* about */
.realms .mandate-grid { display:grid; grid-template-columns:1fr 1fr; gap:32px; font-size:clamp(16px,1.3vw,18px); line-height:1.68; color:#4A3B66; margin-bottom:clamp(30px,4vw,48px); }
.realms .principles { display:grid; grid-template-columns:repeat(3,1fr); gap:26px; }
.realms .principle { border-top:3px solid var(--p); padding-top:18px; }
.realms .principle h3 { font-size:18px; color:var(--p-deep); margin-bottom:9px; }
.realms .principle p { font-size:14.5px; line-height:1.58; color:#4A3B66; }

/* contact */
.realms .enquiry-card { max-width:900px; margin:0 auto; background:linear-gradient(135deg,var(--p),var(--p-mid)); color:#fff; border-radius:22px; padding:clamp(30px,4vw,48px); display:grid; grid-template-columns:1.1fr 1fr; gap:30px; align-items:center; }
.realms .enquiry-card h2 { font-size:clamp(24px,3vw,32px); margin-bottom:10px; }
.realms .enquiry-copy p { color:#F1E5FB; font-size:16px; line-height:1.55; }
.realms .contacts { list-style:none; margin:0; padding:0; display:grid; gap:12px; }
.realms .contacts li { display:flex; flex-direction:column; }
.realms .contacts span { font-size:11px; letter-spacing:.16em; text-transform:uppercase; color:#E1CCF6; }
.realms .contacts em { font-style:normal; font-size:16px; }

/* auth */
.realms .main-auth { display:flex; align-items:center; justify-content:center; padding:clamp(24px,5vw,60px) 18px; }
.realms .auth-shell { width:100%; display:flex; justify-content:center; }
.realms .auth-card { width:min(430px,94vw); background:#fff; border:1px solid var(--line); border-radius:20px; padding:clamp(28px,4vw,40px); box-shadow:0 24px 60px rgba(122,52,168,.14); text-align:center; }
.realms .auth-mark { height:56px; width:auto; margin:0 auto 16px; }
.realms .auth-card h2 { font-size:23px; color:var(--p-deep); margin-bottom:6px; }
.realms .auth-sub { color:#7A6A93; font-size:14.5px; margin-bottom:22px; }
.realms .field { display:block; text-align:left; margin-bottom:14px; }
.realms .field span { display:block; font-size:12px; letter-spacing:.08em; text-transform:uppercase; color:#7A6A93; margin-bottom:6px; }
.realms .field input { width:100%; font-family:inherit; font-size:16px; padding:12px 14px; border:1.5px solid var(--line); border-radius:12px; color:var(--ink); background:#fff; }
.realms .field input:focus { outline:none; border-color:var(--p); }
.realms .auth-msg { background:var(--lav1); color:var(--p-deep); border:1px solid var(--line); border-radius:10px; padding:10px 12px; font-size:14px; margin-bottom:14px; }
.realms .linkbtn { display:block; width:100%; background:none; border:0; color:var(--p); font-size:14.5px; padding:12px 0 2px; }
.realms .linkbtn:hover { text-decoration:underline; }
.realms .linkbtn.subtle { color:#8A7AA6; font-size:13.5px; }
.realms .linkbtn.center { max-width:200px; margin:20px auto 0; }
.realms .demo-note { margin-top:16px; font-size:12.5px; color:#8A7AA6; font-style:italic; }

/* role picker */
.realms .role-page { min-height:64vh; }
.realms .role-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:18px; max-width:900px; margin:0 auto; }
.realms .role-card { text-align:left; background:#fff; border:1.5px solid var(--line); border-radius:18px; padding:24px 22px; display:flex; flex-direction:column; gap:10px; transition:.18s; }
.realms .role-card:hover { border-color:var(--p); box-shadow:0 18px 44px rgba(122,52,168,.14); transform:translateY(-3px); }
.realms .role-icon { width:46px; height:46px; border-radius:12px; background:var(--lav1); color:var(--p); display:grid; place-items:center; }
.realms .role-icon svg { width:26px; height:26px; }
.realms .role-label { font-size:19px; font-weight:600; color:var(--p-deep); }
.realms .role-blurb { font-size:14px; line-height:1.5; color:#5A4C74; }

/* dashboard */
.realms .dash-head { border-bottom:1px solid var(--line); padding-bottom:22px; margin-bottom:22px; }
.realms .dash-hello { display:flex; align-items:center; gap:18px; }
.realms .dash-icon { width:58px; height:58px; border-radius:14px; background:linear-gradient(135deg,var(--p),var(--p-mid)); color:#fff; display:grid; place-items:center; }
.realms .dash-icon svg { width:30px; height:30px; }
.realms .dash-head h2 { font-size:clamp(24px,3vw,32px); color:var(--p-deep); }
.realms .dash-title { color:#7A6A93; font-size:14.5px; margin-top:2px; }
.realms .dash-intro { color:#5A4C74; font-size:16px; margin-bottom:24px; }
.realms .tool-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:16px; }
.realms .tool-card { display:flex; align-items:center; justify-content:space-between; gap:12px; background:#fff; border:1px solid var(--line); border-radius:14px; padding:20px; }
.realms .tool-name { font-size:16px; color:var(--p-deep); font-weight:500; }
.realms .tool-stage { font-size:11.5px; letter-spacing:.06em; text-transform:uppercase; color:var(--v); background:var(--lav1); border:1px solid var(--line); border-radius:20px; padding:4px 10px; white-space:nowrap; }
.realms .loading { text-align:center; color:#8A7AA6; padding:60px 0; }

/* footer */
.realms .foot { background:#4A2A73; color:#EADAF7; padding:clamp(32px,4vw,52px) clamp(18px,4vw,56px); }
.realms .foot-inner { max-width:1080px; margin:0 auto; text-align:center; display:grid; gap:8px; justify-items:center; }
.realms .foot-brand { display:flex; align-items:center; justify-content:center; gap:12px; font-size:15px; color:#fff; }
.realms .foot-mark { height:32px; width:auto; }
.realms .foot p { font-size:14px; }
.realms .foot-tag { font-style:italic; color:#CDA9EC; margin-top:4px; }

/* responsive */
@media (max-width:920px){
  .realms .hero { grid-template-columns:1fr; text-align:center; }
  .realms .lede { max-width:none; margin:0 auto; }
  .realms .cta-row { justify-content:center; }
  .realms .hero-art { order:-1; }
  .realms .home-strip { grid-template-columns:1fr 1fr; }
  .realms .stages { grid-template-columns:1fr 1fr; gap:32px; }
  .realms .wave { display:none; }
  .realms .pillars { grid-template-columns:1fr; }
  .realms .mandate-grid { grid-template-columns:1fr; gap:20px; }
  .realms .principles { grid-template-columns:1fr; }
  .realms .enquiry-card { grid-template-columns:1fr; text-align:center; }
  .realms .contacts { justify-items:center; }
  .realms .role-grid { grid-template-columns:1fr 1fr; }
  .realms .tool-grid { grid-template-columns:1fr; }
}
@media (max-width:680px){
  .realms .bar { flex-wrap:wrap; }
  .realms .nav { width:100%; justify-content:space-between; }
  .realms .tabs { overflow-x:auto; -webkit-overflow-scrolling:touch; max-width:100%; }
  .realms .tab { white-space:nowrap; padding:8px 13px; }
  .realms .home-strip { grid-template-columns:1fr; }
  .realms .stages { grid-template-columns:1fr; }
  .realms .role-grid { grid-template-columns:1fr; }
}
`

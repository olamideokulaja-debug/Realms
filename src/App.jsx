import React from 'react'

/*
  REALMS FIELD — Stage 1 landing (single-file App.jsx)
  Brand: Lora throughout; RHSC purple on white; real RHSC logo from /public.
  Content is visible by default; entrance animations only enhance and always end visible.
  Fields to complete before publishing are marked EDIT: coverage figures and enquiry contact details.
*/

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

export default function App() {
  return (
    <div className="realms">
      <style>{css}</style>

      <header className="bar">
        <a className="wordmark" href="#top" aria-label="REALMS home">
          <img className="mark" src="/rhsc-mark.png" alt="RHSC" />
          <span className="wm-text">
            <strong>REALMS</strong>
            <em>Healthcare Services Consulting</em>
          </span>
        </a>
        <nav className="nav">
          <a href="#process">Process</a>
          <a href="#services">Services</a>
          <a href="#about">About</a>
          <a className="signin" href="#signin">Staff sign-in</a>
        </nav>
      </header>

      <main id="top">
        <section className="hero">
          <div className="hero-copy anim">
            <p className="eyebrow">Lagos State · In collaboration with HEFAMAA</p>
            <h1>Safer facilities.<br />Higher standards.<br /><span className="accent">Healthier Lagos.</span></h1>
            <p className="lede">REALMS Healthcare Services Consulting Limited partners with HEFAMAA to monitor health facilities across Lagos State, holding every provider to the standards that protect the people they serve.</p>
            <div className="cta-row">
              <a className="btn primary" href="#signin">Staff sign-in</a>
              <a className="btn ghost" href="#enquiry">Enquire about our work</a>
            </div>
            <p className="tagline">Professional. Educational. Enforcement-driven.</p>
          </div>
          <div className="hero-art anim" style={{ animationDelay: '120ms' }}>
            <div className="art-panel">
              <img src="/rhsc-logo.png" alt="REALMS Healthcare Services Consulting Limited" />
            </div>
          </div>
        </section>

        <section className="mandate" id="about">
          <p className="eyebrow center anim">The mandate</p>
          <div className="mandate-grid">
            <p className="anim">The Health Facility Monitoring and Accreditation Agency (HEFAMAA) is the Lagos State authority responsible for inspecting, monitoring and licensing public and private health facilities, and for promoting consistent quality in service delivery.</p>
            <p className="anim" style={{ animationDelay: '90ms' }}>REALMS Healthcare Services Consulting Limited supports that mandate on the ground. Our field teams carry out routine monitoring across the State, combining efficient planning, professional engagement, evidence-based assessment and clear corrective guidance, raising the standard of care while treating facility owners with courtesy and respect.</p>
          </div>
        </section>

        <section className="process" id="process">
          <div className="section-head anim">
            <p className="eyebrow">How we work</p>
            <h2>A four-stage field process</h2>
          </div>
          <div className="wave-wrap">
            <svg className="wave" viewBox="0 0 1000 90" preserveAspectRatio="none" aria-hidden="true">
              <path d="M0 55 C110 22, 200 78, 320 52 S540 20, 660 52 S870 82, 1000 46" fill="none" stroke="#A66BD4" strokeWidth="2.5" />
            </svg>
            <ol className="stages">
              {STAGES.map((s, i) => (
                <li className="stage anim" key={s.n} style={{ animationDelay: (i * 90) + 'ms' }}>
                  <span className="stage-n">{s.n}</span>
                  <span className="dot" aria-hidden="true" />
                  <h3>{s.t}</h3>
                  <p>{s.d}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="services" id="services">
          <div className="section-head anim">
            <p className="eyebrow">What we do</p>
            <h2>Four service pillars</h2>
          </div>
          <div className="pillars">
            {PILLARS.map((p, i) => (
              <article className="pillar anim" key={p.t} style={{ animationDelay: (i * 70) + 'ms' }}>
                <span className="pillar-rule" aria-hidden="true" />
                <h3>{p.t}</h3>
                <p>{p.d}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="coverage">
          <p className="eyebrow center light anim">Coverage snapshot</p>
          {/* EDIT: replace each value with a verified figure before publishing. */}
          <div className="stats">
            {COVERAGE.map((c, i) => (
              <div className="stat anim" key={c.label} style={{ animationDelay: (i * 70) + 'ms' }}>
                <span className="stat-value">&mdash;</span>
                <span className="stat-label">{c.label}</span>
              </div>
            ))}
          </div>
          <p className="coverage-note">Figures to be confirmed from monitoring records.</p>
        </section>

        <section className="why">
          <div className="section-head anim">
            <p className="eyebrow">Why RHSC</p>
            <h2>Professional, educational, firm</h2>
          </div>
          <div className="principles">
            {PRINCIPLES.map((p, i) => (
              <div className="principle anim" key={p.t} style={{ animationDelay: (i * 70) + 'ms' }}>
                <h3>{p.t}</h3>
                <p>{p.d}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="enquiry" id="enquiry">
          <div className="enquiry-card anim">
            <div className="enquiry-copy">
              <h2>Work with RHSC</h2>
              <p>For regulatory partnerships, facility support or consulting, reach our team.</p>
            </div>
            {/* EDIT: add real contact details below before publishing. */}
            <ul className="contacts">
              <li><span>Email</span><em>hello@example.com</em></li>
              <li><span>Phone</span><em>Add number</em></li>
              <li><span>Office</span><em>Add Lagos address</em></li>
            </ul>
            <a className="btn light" href="#enquiry">Send an enquiry</a>
          </div>
        </section>

        <section className="signin-note" id="signin">
          <p className="anim">Realms Field staff sign-in opens in the next build stage. This is where team leaders, field monitors, RHSC HQ and HEFAMAA reviewers will enter the monitoring tool.</p>
        </section>
      </main>

      <footer className="foot">
        <div className="foot-inner">
          <div className="foot-brand">
            <img className="foot-mark" src="/rhsc-mark.png" alt="RHSC" />
            <span>REALMS Healthcare Services Consulting Limited</span>
          </div>
          <p>In collaboration with HEFAMAA, Lagos State.</p>
          <p className="foot-tag">Professional. Educational. Enforcement-driven.</p>
        </div>
      </footer>
    </div>
  )
}

const css = `
.realms { --ink:#3A2B54; --p:#7A34A8; --p-deep:#642C90; --p-mid:#8E44C0; --v:#A66BD4; --lav1:#F7F1FD; --lav2:#EEE1F9; --line:#E9DCF6; --wave:#3E86C9; --white:#ffffff; color:var(--ink); }
.realms h1,.realms h2,.realms h3 { font-weight:600; letter-spacing:.01em; margin:0; }
.realms p { margin:0; }
.realms a { color:inherit; text-decoration:none; }
.realms img { display:block; max-width:100%; }
.realms .eyebrow { font-size:12px; letter-spacing:.2em; text-transform:uppercase; color:var(--v); font-weight:600; margin:0 0 14px; }
.realms .eyebrow.center { text-align:center; }
.realms .eyebrow.light { color:#EAD9FA; }
.realms .accent { color:var(--p); }
.realms :focus-visible { outline:2.5px solid var(--p); outline-offset:3px; border-radius:4px; }

/* entrance animation (always ends visible) */
@keyframes fadeUp { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:none; } }
.realms .anim { animation: fadeUp .7s ease both; }
@media (prefers-reduced-motion: reduce){ .realms .anim { animation:none; } }

/* top bar */
.realms .bar { position:sticky; top:0; z-index:20; display:flex; align-items:center; justify-content:space-between; padding:12px clamp(20px,5vw,64px); background:rgba(255,255,255,.9); backdrop-filter:blur(8px); border-bottom:1px solid var(--line); }
.realms .wordmark { display:flex; align-items:center; gap:12px; }
.realms .bar .mark { height:42px; width:auto; }
.realms .wm-text { display:flex; flex-direction:column; line-height:1.05; }
.realms .wm-text strong { font-size:19px; letter-spacing:.14em; color:var(--p-deep); }
.realms .wm-text em { font-style:normal; font-size:10.5px; letter-spacing:.12em; text-transform:uppercase; color:#8A7AA6; }
.realms .nav { display:flex; align-items:center; gap:clamp(14px,2.4vw,30px); font-size:15px; }
.realms .nav a { color:var(--ink); }
.realms .nav a:hover { color:var(--p); }
.realms .nav .signin { padding:9px 18px; border:1.5px solid var(--p); border-radius:24px; color:var(--p); font-weight:500; }
.realms .nav .signin:hover { background:var(--p); color:#fff; }

/* hero */
.realms .hero { display:grid; grid-template-columns:1.12fr .88fr; gap:44px; align-items:center; padding:clamp(44px,7vw,96px) clamp(20px,5vw,64px) clamp(40px,6vw,76px); max-width:1240px; margin:0 auto; }
.realms .hero h1 { font-size:clamp(38px,5.4vw,68px); line-height:1.05; color:var(--p-deep); margin-bottom:22px; }
.realms .lede { font-size:clamp(17px,1.5vw,20px); line-height:1.6; color:#54466E; max-width:37ch; }
.realms .cta-row { display:flex; flex-wrap:wrap; gap:14px; margin:30px 0 22px; }
.realms .btn { display:inline-block; font-family:inherit; font-size:16px; padding:14px 26px; border-radius:30px; font-weight:500; transition:.16s; cursor:pointer; }
.realms .btn.primary { background:var(--p); color:#fff; }
.realms .btn.primary:hover { background:var(--p-deep); transform:translateY(-1px); }
.realms .btn.ghost { border:1.5px solid var(--line); color:var(--p); }
.realms .btn.ghost:hover { border-color:var(--v); background:var(--lav1); }
.realms .btn.light { background:#fff; color:var(--p); white-space:nowrap; }
.realms .btn.light:hover { background:var(--lav2); }
.realms .tagline { font-style:italic; color:#8A7AA6; font-size:15px; letter-spacing:.02em; }
.realms .hero-art { display:flex; justify-content:center; }
.realms .art-panel { width:min(420px,86vw); border-radius:26px; padding:clamp(26px,4vw,46px); background:radial-gradient(circle at 50% 30%, var(--lav1), var(--lav2)); box-shadow:0 26px 64px rgba(122,52,168,.16); border:1px solid #EBDCF8; }
.realms .art-panel img { width:100%; height:auto; }

/* mandate */
.realms .mandate { max-width:1080px; margin:0 auto; padding:clamp(40px,6vw,78px) clamp(20px,5vw,64px); border-top:1px solid var(--line); }
.realms .mandate-grid { display:grid; grid-template-columns:1fr 1fr; gap:34px; font-size:clamp(16px,1.35vw,18.5px); line-height:1.68; color:#4A3B66; }

/* process + signature wave */
.realms .process { background:linear-gradient(180deg,var(--lav1),#fff); padding:clamp(48px,7vw,92px) clamp(20px,5vw,64px); }
.realms .section-head { text-align:center; max-width:720px; margin:0 auto clamp(30px,4vw,52px); }
.realms .section-head h2 { font-size:clamp(28px,3.3vw,42px); color:var(--p-deep); }
.realms .wave-wrap { position:relative; max-width:1160px; margin:0 auto; }
.realms .wave { position:absolute; top:34px; left:0; width:100%; height:90px; pointer-events:none; opacity:.65; }
.realms .stages { list-style:none; margin:0; padding:0; display:grid; grid-template-columns:repeat(4,1fr); gap:26px; position:relative; }
.realms .stage { text-align:center; padding:0 6px; }
.realms .stage-n { font-size:14px; letter-spacing:.18em; color:var(--v); font-weight:700; }
.realms .stage .dot { display:block; width:15px; height:15px; margin:18px auto 20px; border-radius:50%; background:#fff; border:3px solid var(--p); box-shadow:0 0 0 6px var(--lav1); }
.realms .stage h3 { font-size:22px; color:var(--p-deep); margin-bottom:10px; }
.realms .stage p { font-size:14.5px; line-height:1.6; color:#5A4C74; }

/* services */
.realms .services { max-width:1160px; margin:0 auto; padding:clamp(48px,7vw,92px) clamp(20px,5vw,64px); }
.realms .pillars { display:grid; grid-template-columns:1fr 1fr; gap:22px; }
.realms .pillar { background:#fff; border:1px solid var(--line); border-radius:16px; padding:30px 30px 34px; transition:box-shadow .2s ease, border-color .2s ease, transform .2s ease; }
.realms .pillar:hover { box-shadow:0 18px 44px rgba(122,52,168,.12); border-color:var(--v); transform:translateY(-3px); }
.realms .pillar-rule { display:block; width:44px; height:4px; border-radius:3px; background:linear-gradient(90deg,var(--p),var(--v)); margin-bottom:20px; }
.realms .pillar h3 { font-size:22px; color:var(--p-deep); margin-bottom:12px; }
.realms .pillar p { font-size:15.5px; line-height:1.62; color:#4A3B66; }

/* coverage */
.realms .coverage { background:linear-gradient(135deg,var(--p-deep),var(--p-mid)); color:#fff; padding:clamp(44px,6vw,78px) clamp(20px,5vw,64px); }
.realms .stats { display:grid; grid-template-columns:repeat(4,1fr); gap:24px; max-width:1000px; margin:8px auto 0; }
.realms .stat { text-align:center; padding:22px 12px; border:1px dashed rgba(255,255,255,.34); border-radius:14px; }
.realms .stat-value { display:block; font-size:44px; font-weight:700; color:#fff; line-height:1; margin-bottom:12px; }
.realms .stat-label { font-size:13.5px; letter-spacing:.04em; color:#EEDFFB; }
.realms .coverage-note { text-align:center; margin-top:22px; font-style:italic; font-size:13.5px; color:#E3CFF7; }

/* why */
.realms .why { max-width:1080px; margin:0 auto; padding:clamp(48px,7vw,92px) clamp(20px,5vw,64px); }
.realms .principles { display:grid; grid-template-columns:repeat(3,1fr); gap:28px; }
.realms .principle { border-top:3px solid var(--p); padding-top:20px; }
.realms .principle h3 { font-size:19px; color:var(--p-deep); margin-bottom:10px; }
.realms .principle p { font-size:15px; line-height:1.6; color:#4A3B66; }

/* enquiry */
.realms .enquiry { padding:0 clamp(20px,5vw,64px) clamp(40px,6vw,72px); }
.realms .enquiry-card { max-width:1080px; margin:0 auto; background:linear-gradient(135deg,var(--p),var(--p-mid)); color:#fff; border-radius:22px; padding:clamp(32px,4vw,52px); display:grid; grid-template-columns:1.1fr 1fr auto; gap:32px; align-items:center; }
.realms .enquiry-card h2 { font-size:clamp(26px,3vw,34px); margin-bottom:10px; }
.realms .enquiry-copy p { color:#F1E5FB; font-size:16px; line-height:1.55; }
.realms .contacts { list-style:none; margin:0; padding:0; display:grid; gap:12px; }
.realms .contacts li { display:flex; flex-direction:column; }
.realms .contacts span { font-size:11px; letter-spacing:.16em; text-transform:uppercase; color:#E1CCF6; }
.realms .contacts em { font-style:normal; font-size:16px; }

/* signin note */
.realms .signin-note { max-width:820px; margin:0 auto; padding:0 clamp(20px,5vw,64px) clamp(48px,7vw,88px); text-align:center; color:#8A7AA6; font-style:italic; font-size:16px; line-height:1.6; }

/* footer */
.realms .foot { background:#4A2A73; color:#EADAF7; padding:clamp(36px,5vw,58px) clamp(20px,5vw,64px); }
.realms .foot-inner { max-width:1080px; margin:0 auto; text-align:center; display:grid; gap:8px; justify-items:center; }
.realms .foot-brand { display:flex; align-items:center; justify-content:center; gap:12px; font-size:15px; letter-spacing:.03em; color:#fff; }
.realms .foot-mark { height:34px; width:auto; }
.realms .foot p { font-size:14px; }
.realms .foot-tag { font-style:italic; color:#CDA9EC; margin-top:4px; }

/* responsive */
@media (max-width:900px){
  .realms .hero { grid-template-columns:1fr; text-align:center; padding-top:52px; }
  .realms .lede { max-width:none; margin:0 auto; }
  .realms .cta-row { justify-content:center; }
  .realms .hero-art { order:-1; }
  .realms .mandate-grid { grid-template-columns:1fr; gap:20px; }
  .realms .stages { grid-template-columns:1fr 1fr; gap:34px; }
  .realms .wave { display:none; }
  .realms .pillars { grid-template-columns:1fr; }
  .realms .stats { grid-template-columns:1fr 1fr; }
  .realms .principles { grid-template-columns:1fr; }
  .realms .enquiry-card { grid-template-columns:1fr; text-align:center; }
  .realms .contacts { justify-items:center; }
}
@media (max-width:560px){
  .realms .nav a:not(.signin){ display:none; }
  .realms .stages { grid-template-columns:1fr; }
  .realms .stats { grid-template-columns:1fr; }
}
`

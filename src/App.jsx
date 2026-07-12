import React, { useEffect, useRef } from 'react'

/*
  REALMS FIELD — Stage 1 landing (single-file App.jsx)
  Brand: Lora throughout; RHSC purple on white; a restrained blue accent from the logo wave.
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

function Emblem({ size = 118 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 118 118" role="img" aria-label="RHSC emblem" className="emblem">
      <defs>
        <linearGradient id="globe" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#7A34A8" />
          <stop offset="1" stopColor="#3A1560" />
        </linearGradient>
      </defs>
      <circle cx="59" cy="59" r="55" fill="url(#globe)" />
      <path d="M14 74 C30 62, 42 86, 59 74 S88 62, 104 74" fill="none" stroke="#ffffff" strokeWidth="6" strokeLinecap="round" opacity="0.95" />
      <path d="M20 88 C34 78, 46 98, 59 88 S86 78, 98 88" fill="none" stroke="#7FB2E6" strokeWidth="5" strokeLinecap="round" opacity="0.9" />
    </svg>
  )
}

export default function App() {
  const revealRef = useRef([])
  const waveRef = useRef(null)

  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const nodes = revealRef.current.filter(Boolean)
    if (reduce || !('IntersectionObserver' in window)) {
      nodes.forEach(n => n.classList.add('in'))
      if (waveRef.current) waveRef.current.classList.add('drawn')
      return
    }
    const io = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.add('in')
          if (e.target === waveRef.current) e.target.classList.add('drawn')
          io.unobserve(e.target)
        }
      })
    }, { threshold: 0.16 })
    nodes.forEach(n => io.observe(n))
    return () => io.disconnect()
  }, [])

  const addReveal = (el) => { if (el && !revealRef.current.includes(el)) revealRef.current.push(el) }

  return (
    <div className="realms">
      <style>{css}</style>

      <header className="bar">
        <a className="wordmark" href="#top" aria-label="REALMS home">
          <span className="mark"><Emblem size={34} /></span>
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
          <div className="hero-copy" ref={addReveal}>
            <p className="eyebrow">Lagos State · In collaboration with HEFAMAA</p>
            <h1>Safer facilities.<br />Higher standards.<br /><span className="accent">Healthier Lagos.</span></h1>
            <p className="lede">REALMS Healthcare Services Consulting Limited partners with HEFAMAA to monitor health facilities across Lagos State, holding every provider to the standards that protect the people they serve.</p>
            <div className="cta-row">
              <a className="btn primary" href="#signin">Staff sign-in</a>
              <a className="btn ghost" href="#enquiry">Enquire about our work</a>
            </div>
            <p className="tagline">Professional. Educational. Enforcement-driven.</p>
          </div>
          <div className="hero-art" aria-hidden="true" ref={addReveal}>
            <div className="art-ring">
              <Emblem size={188} />
            </div>
          </div>
        </section>

        <section className="mandate" id="about" ref={addReveal}>
          <p className="eyebrow center">The mandate</p>
          <div className="mandate-grid">
            <p>The Health Facility Monitoring and Accreditation Agency (HEFAMAA) is the Lagos State authority responsible for inspecting, monitoring and licensing public and private health facilities, and for promoting consistent quality in service delivery.</p>
            <p>REALMS Healthcare Services Consulting Limited supports that mandate on the ground. Our field teams carry out routine monitoring across the State, combining efficient planning, professional engagement, evidence-based assessment and clear corrective guidance, raising the standard of care while treating facility owners with courtesy and respect.</p>
          </div>
        </section>

        <section className="process" id="process">
          <div className="section-head" ref={addReveal}>
            <p className="eyebrow">How we work</p>
            <h2>A four-stage field process</h2>
          </div>
          <div className="wave-wrap" ref={(el) => { addReveal(el); waveRef.current = el }}>
            <svg className="wave" viewBox="0 0 1000 90" preserveAspectRatio="none" aria-hidden="true">
              <path d="M0 55 C110 22, 200 78, 320 52 S540 20, 660 52 S870 82, 1000 46" fill="none" stroke="#8E5BC4" strokeWidth="2.5" className="wave-path" />
            </svg>
            <ol className="stages">
              {STAGES.map((s) => (
                <li className="stage" key={s.n}>
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
          <div className="section-head" ref={addReveal}>
            <p className="eyebrow">What we do</p>
            <h2>Four service pillars</h2>
          </div>
          <div className="pillars">
            {PILLARS.map((p, i) => (
              <article className="pillar" key={p.t} ref={addReveal} style={{ transitionDelay: `${i * 60}ms` }}>
                <span className="pillar-rule" aria-hidden="true" />
                <h3>{p.t}</h3>
                <p>{p.d}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="coverage" ref={addReveal}>
          <p className="eyebrow center light">Coverage snapshot</p>
          {/* EDIT: replace each value with a verified figure before publishing. */}
          <div className="stats">
            {COVERAGE.map((c) => (
              <div className="stat" key={c.label}>
                <span className="stat-value">—</span>
                <span className="stat-label">{c.label}</span>
              </div>
            ))}
          </div>
          <p className="coverage-note">Figures to be confirmed from monitoring records.</p>
        </section>

        <section className="why" ref={addReveal}>
          <div className="section-head">
            <p className="eyebrow">Why RHSC</p>
            <h2>Professional, educational, firm</h2>
          </div>
          <div className="principles">
            {PRINCIPLES.map((p) => (
              <div className="principle" key={p.t}>
                <h3>{p.t}</h3>
                <p>{p.d}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="enquiry" id="enquiry" ref={addReveal}>
          <div className="enquiry-card">
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
            <a className="btn primary" href="#enquiry">Send an enquiry</a>
          </div>
        </section>

        <section className="signin-note" id="signin" ref={addReveal}>
          <p>Realms Field staff sign-in opens in the next build stage. This is where team leaders, field monitors, RHSC HQ and HEFAMAA reviewers will enter the monitoring tool.</p>
        </section>
      </main>

      <footer className="foot">
        <div className="foot-inner">
          <div className="foot-brand">
            <Emblem size={30} />
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
.realms { --ink:#241536; --p900:#3A1560; --p700:#5A2483; --p600:#6A2C91; --v400:#8E5BC4; --lav1:#F6F1FC; --lav2:#EEE3F8; --line:#E7DBF3; --wave:#2E77B5; --muted:#7A6A93; --white:#ffffff; color:var(--ink); }
.realms h1,.realms h2,.realms h3 { font-weight:600; letter-spacing:.01em; margin:0; }
.realms p { margin:0; }
.realms a { color:inherit; text-decoration:none; }
.realms .eyebrow { font-size:12px; letter-spacing:.2em; text-transform:uppercase; color:var(--v400); font-weight:600; margin:0 0 14px; }
.realms .eyebrow.center { text-align:center; }
.realms .eyebrow.light { color:#D9C6F0; }
.realms .accent { color:var(--p600); }
.realms :focus-visible { outline:2.5px solid var(--p600); outline-offset:3px; border-radius:4px; }

/* reveal */
.realms .hero-copy,.realms .hero-art,.realms section,.realms .pillar { opacity:0; transform:translateY(18px); transition:opacity .7s ease, transform .7s ease; }
.realms .in { opacity:1; transform:none; }

/* top bar */
.realms .bar { position:sticky; top:0; z-index:20; display:flex; align-items:center; justify-content:space-between; padding:14px clamp(20px,5vw,64px); background:rgba(255,255,255,.86); backdrop-filter:blur(8px); border-bottom:1px solid var(--line); }
.realms .wordmark { display:flex; align-items:center; gap:12px; }
.realms .wm-text { display:flex; flex-direction:column; line-height:1.05; }
.realms .wm-text strong { font-size:19px; letter-spacing:.14em; color:var(--p900); }
.realms .wm-text em { font-style:normal; font-size:10.5px; letter-spacing:.12em; text-transform:uppercase; color:var(--muted); }
.realms .nav { display:flex; align-items:center; gap:clamp(14px,2.4vw,30px); font-size:15px; }
.realms .nav a { color:var(--ink); }
.realms .nav a:hover { color:var(--p600); }
.realms .nav .signin { padding:9px 18px; border:1.5px solid var(--p600); border-radius:24px; color:var(--p600); font-weight:500; }
.realms .nav .signin:hover { background:var(--p600); color:#fff; }

/* hero */
.realms .hero { display:grid; grid-template-columns:1.15fr .85fr; gap:40px; align-items:center; padding:clamp(48px,8vw,110px) clamp(20px,5vw,64px) clamp(40px,6vw,80px); max-width:1240px; margin:0 auto; }
.realms .hero h1 { font-size:clamp(38px,5.6vw,72px); line-height:1.04; color:var(--p900); margin-bottom:22px; }
.realms .lede { font-size:clamp(17px,1.5vw,20px); line-height:1.6; color:#4A3B60; max-width:36ch; }
.realms .cta-row { display:flex; flex-wrap:wrap; gap:14px; margin:30px 0 22px; }
.realms .btn { display:inline-block; font-family:inherit; font-size:16px; padding:14px 26px; border-radius:30px; font-weight:500; transition:.16s; cursor:pointer; }
.realms .btn.primary { background:var(--p900); color:#fff; }
.realms .btn.primary:hover { background:var(--p700); transform:translateY(-1px); }
.realms .btn.ghost { border:1.5px solid var(--line); color:var(--p900); }
.realms .btn.ghost:hover { border-color:var(--v400); background:var(--lav1); }
.realms .tagline { font-style:italic; color:var(--muted); font-size:15px; letter-spacing:.02em; }
.realms .hero-art { display:flex; justify-content:center; }
.realms .art-ring { width:min(360px,74vw); aspect-ratio:1; border-radius:50%; display:grid; place-items:center; background:radial-gradient(circle at 50% 40%, var(--lav1), var(--lav2)); box-shadow:0 30px 70px rgba(58,21,96,.14); position:relative; }
.realms .art-ring::before { content:""; position:absolute; inset:16px; border-radius:50%; border:1px solid rgba(142,91,196,.35); }

/* mandate */
.realms .mandate { max-width:1080px; margin:0 auto; padding:clamp(40px,6vw,80px) clamp(20px,5vw,64px); border-top:1px solid var(--line); }
.realms .mandate-grid { display:grid; grid-template-columns:1fr 1fr; gap:34px; font-size:clamp(16px,1.35vw,18.5px); line-height:1.68; color:#3D2E56; }

/* process + signature wave */
.realms .process { background:linear-gradient(180deg,var(--lav1),#fff); padding:clamp(48px,7vw,96px) clamp(20px,5vw,64px); }
.realms .section-head { text-align:center; max-width:720px; margin:0 auto clamp(30px,4vw,52px); }
.realms .section-head h2 { font-size:clamp(28px,3.4vw,42px); color:var(--p900); }
.realms .wave-wrap { position:relative; max-width:1160px; margin:0 auto; }
.realms .wave { position:absolute; top:34px; left:0; width:100%; height:90px; pointer-events:none; }
.realms .wave-path { stroke-dasharray:2200; stroke-dashoffset:2200; }
.realms .wave-wrap.drawn .wave-path { transition:stroke-dashoffset 1.8s ease .2s; stroke-dashoffset:0; }
.realms .stages { list-style:none; margin:0; padding:0; display:grid; grid-template-columns:repeat(4,1fr); gap:26px; position:relative; }
.realms .stage { text-align:center; padding:0 6px; }
.realms .stage-n { font-size:14px; letter-spacing:.18em; color:var(--v400); font-weight:700; }
.realms .stage .dot { display:block; width:15px; height:15px; margin:18px auto 20px; border-radius:50%; background:#fff; border:3px solid var(--p600); box-shadow:0 0 0 6px var(--lav1); }
.realms .stage h3 { font-size:22px; color:var(--p900); margin-bottom:10px; }
.realms .stage p { font-size:14.5px; line-height:1.6; color:#54466E; }

/* services */
.realms .services { max-width:1160px; margin:0 auto; padding:clamp(48px,7vw,96px) clamp(20px,5vw,64px); }
.realms .pillars { display:grid; grid-template-columns:1fr 1fr; gap:22px; }
.realms .pillar { background:#fff; border:1px solid var(--line); border-radius:16px; padding:30px 30px 34px; transition:opacity .7s ease, transform .7s ease, box-shadow .2s ease, border-color .2s ease; }
.realms .pillar:hover { box-shadow:0 18px 44px rgba(58,21,96,.1); border-color:var(--v400); transform:translateY(-3px); }
.realms .pillar-rule { display:block; width:44px; height:4px; border-radius:3px; background:linear-gradient(90deg,var(--p700),var(--v400)); margin-bottom:20px; }
.realms .pillar h3 { font-size:22px; color:var(--p900); margin-bottom:12px; }
.realms .pillar p { font-size:15.5px; line-height:1.62; color:#4A3B60; }

/* coverage */
.realms .coverage { background:var(--p900); color:#fff; padding:clamp(44px,6vw,80px) clamp(20px,5vw,64px); }
.realms .stats { display:grid; grid-template-columns:repeat(4,1fr); gap:24px; max-width:1000px; margin:8px auto 0; }
.realms .stat { text-align:center; padding:22px 12px; border:1px dashed rgba(255,255,255,.28); border-radius:14px; }
.realms .stat-value { display:block; font-size:44px; font-weight:700; color:#fff; line-height:1; margin-bottom:12px; }
.realms .stat-label { font-size:13.5px; letter-spacing:.04em; color:#D9C6F0; }
.realms .coverage-note { text-align:center; margin-top:22px; font-style:italic; font-size:13.5px; color:#C4AEE2; }

/* why */
.realms .why { max-width:1080px; margin:0 auto; padding:clamp(48px,7vw,96px) clamp(20px,5vw,64px); }
.realms .principles { display:grid; grid-template-columns:repeat(3,1fr); gap:28px; }
.realms .principle { border-top:3px solid var(--p600); padding-top:20px; }
.realms .principle h3 { font-size:19px; color:var(--p900); margin-bottom:10px; }
.realms .principle p { font-size:15px; line-height:1.6; color:#4A3B60; }

/* enquiry */
.realms .enquiry { padding:0 clamp(20px,5vw,64px) clamp(40px,6vw,72px); }
.realms .enquiry-card { max-width:1080px; margin:0 auto; background:linear-gradient(135deg,var(--p900),var(--p700)); color:#fff; border-radius:22px; padding:clamp(32px,4vw,52px); display:grid; grid-template-columns:1.1fr 1fr auto; gap:32px; align-items:center; }
.realms .enquiry-card h2 { font-size:clamp(26px,3vw,34px); margin-bottom:10px; }
.realms .enquiry-copy p { color:#E7D8F6; font-size:16px; line-height:1.55; }
.realms .contacts { list-style:none; margin:0; padding:0; display:grid; gap:12px; }
.realms .contacts li { display:flex; flex-direction:column; }
.realms .contacts span { font-size:11px; letter-spacing:.16em; text-transform:uppercase; color:#C9B2E8; }
.realms .contacts em { font-style:normal; font-size:16px; }
.realms .enquiry-card .btn.primary { background:#fff; color:var(--p900); white-space:nowrap; }
.realms .enquiry-card .btn.primary:hover { background:var(--lav2); }

/* signin note */
.realms .signin-note { max-width:820px; margin:0 auto; padding:0 clamp(20px,5vw,64px) clamp(48px,7vw,90px); text-align:center; color:var(--muted); font-style:italic; font-size:16px; line-height:1.6; }

/* footer */
.realms .foot { background:#1C0F31; color:#D9C6F0; padding:clamp(36px,5vw,60px) clamp(20px,5vw,64px); }
.realms .foot-inner { max-width:1080px; margin:0 auto; text-align:center; display:grid; gap:8px; }
.realms .foot-brand { display:flex; align-items:center; justify-content:center; gap:12px; font-size:15px; letter-spacing:.04em; color:#fff; }
.realms .foot p { font-size:14px; }
.realms .foot-tag { font-style:italic; color:var(--v400); margin-top:4px; }

/* responsive */
@media (max-width:900px){
  .realms .hero { grid-template-columns:1fr; text-align:center; padding-top:56px; }
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
@media (prefers-reduced-motion: reduce){
  .realms .hero-copy,.realms .hero-art,.realms section,.realms .pillar { opacity:1; transform:none; transition:none; }
  .realms .wave-path { transition:none; stroke-dashoffset:0; }
}
`

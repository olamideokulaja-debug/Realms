// Send an SMS or WhatsApp message. Provider-agnostic: uses Termii (Nigeria-focused,
// SMS + WhatsApp) or Twilio when configured, otherwise returns a demo result so the
// in-app notification still stands on its own. Keys are server-only.
//   Termii:  TERMII_API_KEY, TERMII_SENDER_ID
//   Twilio:  TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_FROM, TWILIO_WHATSAPP_FROM
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
  const { to, channel, message } = req.body || {}
  if (!to || !message) return res.status(400).json({ error: 'to and message are required' })

  const termiiKey = process.env.TERMII_API_KEY
  const twilioSid = process.env.TWILIO_ACCOUNT_SID
  const twilioTok = process.env.TWILIO_AUTH_TOKEN
  const wantWhatsApp = channel === 'whatsapp'

  // Termii first (SMS + WhatsApp)
  if (termiiKey) {
    try {
      const r = await fetch('https://api.ng.termii.com/api/sms/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to,
          from: process.env.TERMII_SENDER_ID || 'CoopEco',
          sms: message,
          type: 'plain',
          channel: wantWhatsApp ? 'whatsapp' : 'generic',
          api_key: termiiKey,
        }),
      })
      const d = await r.json()
      return res.status(200).json({ ok: true, provider: 'termii', result: d })
    } catch (e) {
      return res.status(502).json({ error: 'Termii send failed', detail: String(e && e.message || e) })
    }
  }

  // Twilio (SMS + WhatsApp)
  if (twilioSid && twilioTok) {
    try {
      const from = wantWhatsApp ? (process.env.TWILIO_WHATSAPP_FROM || '') : (process.env.TWILIO_FROM || '')
      const toAddr = wantWhatsApp ? ('whatsapp:' + to) : to
      const body = new URLSearchParams({ To: toAddr, From: from, Body: message })
      const auth = Buffer.from(twilioSid + ':' + twilioTok).toString('base64')
      const r = await fetch('https://api.twilio.com/2010-04-01/Accounts/' + twilioSid + '/Messages.json', {
        method: 'POST',
        headers: { Authorization: 'Basic ' + auth, 'Content-Type': 'application/x-www-form-urlencoded' },
        body: body.toString(),
      })
      const d = await r.json()
      return res.status(200).json({ ok: true, provider: 'twilio', sid: d.sid, status: d.status })
    } catch (e) {
      return res.status(502).json({ error: 'Twilio send failed', detail: String(e && e.message || e) })
    }
  }

  return res.status(200).json({ ok: true, demo: true, message: 'No SMS/WhatsApp provider configured; delivered in-app only.' })
}

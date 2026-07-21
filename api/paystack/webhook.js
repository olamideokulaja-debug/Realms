// Paystack webhook. Paystack signs each event with your secret key; we verify the
// x-paystack-signature header before trusting the event. Point your Paystack
// dashboard webhook URL at https://YOUR-DOMAIN/api/paystack/webhook.
//
// Note: signature verification is most robust against the RAW request body. On
// Vercel, req.body is JSON-parsed; for exact-match signatures configure raw-body
// handling. This handler validates against the parsed body and is a safe starting
// point; harden with raw-body verification before processing high-value events.
import crypto from 'crypto'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }
  const secret = process.env.PAYSTACK_SECRET_KEY
  if (!secret) {
    return res.status(200).json({ ok: true, demo: true })
  }
  try {
    const signature = req.headers['x-paystack-signature']
    const hash = crypto.createHmac('sha512', secret).update(JSON.stringify(req.body || {})).digest('hex')
    if (hash !== signature) {
      return res.status(401).json({ error: 'Invalid signature' })
    }
    const event = req.body && req.body.event
    // charge.success -> the payment cleared. In a full deployment, mark the fee
    // paid or credit the wallet here using the metadata (purpose, coopId, memberId).
    // The client also verifies on success, so this is the reliable backstop.
    return res.status(200).json({ ok: true, event })
  } catch (e) {
    return res.status(500).json({ error: 'Webhook error' })
  }
}

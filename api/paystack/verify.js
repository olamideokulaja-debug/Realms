// Verify a Paystack transaction server-side. The secret key is held only on the
// server via PAYSTACK_SECRET_KEY and never exposed to the browser. Until the key
// is set this returns a demo status so the app keeps working.
export default async function handler(req, res) {
  const secret = process.env.PAYSTACK_SECRET_KEY
  const reference = (req.query && req.query.reference) || (req.body && req.body.reference)
  if (!secret) {
    return res.status(200).json({ status: 'demo', message: 'Paystack not configured. Add PAYSTACK_SECRET_KEY in Vercel to enable live verification.' })
  }
  if (!reference) {
    return res.status(400).json({ error: 'reference is required' })
  }
  try {
    const r = await fetch('https://api.paystack.co/transaction/verify/' + encodeURIComponent(reference), {
      headers: { Authorization: 'Bearer ' + secret },
    })
    const d = await r.json()
    const data = d && d.data
    return res.status(200).json({
      status: (data && data.status) || 'unknown',
      amount: data && data.amount,
      currency: data && data.currency,
      reference,
      paidAt: data && data.paid_at,
      channel: data && data.channel,
    })
  } catch (e) {
    return res.status(500).json({ error: 'Verification failed', detail: String(e && e.message || e) })
  }
}

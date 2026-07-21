// Optional server-side initialize for the redirect flow. Returns an
// authorization_url the browser can redirect to. The inline popup flow in the app
// does not require this, but it is provided for environments that prefer redirect.
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }
  const secret = process.env.PAYSTACK_SECRET_KEY
  if (!secret) {
    return res.status(200).json({ demo: true, message: 'Paystack not configured. Add PAYSTACK_SECRET_KEY in Vercel to enable.' })
  }
  const { email, amount, purpose, metadata, callback_url } = req.body || {}
  if (!email || !amount) {
    return res.status(400).json({ error: 'email and amount (in Naira) are required' })
  }
  try {
    const r = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: { Authorization: 'Bearer ' + secret, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email,
        amount: Math.round(Number(amount) * 100), // Naira -> kobo
        currency: 'NGN',
        metadata: Object.assign({ purpose: purpose || 'CoopEco payment' }, metadata || {}),
        callback_url,
      }),
    })
    const d = await r.json()
    const data = d && d.data
    return res.status(200).json({
      authorization_url: data && data.authorization_url,
      access_code: data && data.access_code,
      reference: data && data.reference,
    })
  } catch (e) {
    return res.status(500).json({ error: 'Initialization failed', detail: String(e && e.message || e) })
  }
}

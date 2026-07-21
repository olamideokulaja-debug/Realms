// Verify a BVN or NIN. Provider-agnostic: uses Dojah when configured, otherwise
// falls back to a format check so onboarding still works. Keys are server-only.
//   Dojah:  DOJAH_APP_ID, DOJAH_API_KEY
// (Youverify / VerifyMe can be added the same way; see the commented block.)
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
  const { type, value } = req.body || {} // type: 'bvn' | 'nin'
  if (!type || !value) return res.status(400).json({ error: 'type and value are required' })

  const dojahApp = process.env.DOJAH_APP_ID
  const dojahKey = process.env.DOJAH_API_KEY

  if (dojahApp && dojahKey) {
    try {
      const path = type === 'nin' ? '/api/v1/kyc/nin?nin=' : '/api/v1/kyc/bvn?bvn='
      const r = await fetch('https://api.dojah.io' + path + encodeURIComponent(value), {
        headers: { AppId: dojahApp, Authorization: dojahKey },
      })
      const d = await r.json()
      const entity = d && d.entity
      return res.status(200).json({
        verified: Boolean(entity),
        provider: 'dojah',
        data: entity ? { firstName: entity.first_name, lastName: entity.last_name, dob: entity.date_of_birth, phone: entity.phone_number1 } : null,
      })
    } catch (e) {
      return res.status(502).json({ error: 'KYC provider error', detail: String(e && e.message || e) })
    }
  }

  // Demo fallback: BVN and NIN are 11-digit numbers. This is a format check only,
  // not identity verification. Configure a provider for real verification.
  const ok = /^\d{10,11}$/.test(String(value))
  return res.status(200).json({ verified: ok, demo: true, message: 'No KYC provider configured; format check only.' })
}

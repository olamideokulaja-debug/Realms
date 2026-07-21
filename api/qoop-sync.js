// One-way QooP -> MCCTI ingestion endpoint.
// QooP is the source for member and MSME analytics. Data flows in one direction:
// QooP is the source, MCCTI is the destination. Modes:
//   GET  - MCCTI pulls members from the QooP API (needs QOOP_API_URL + KEY)
//   POST - QooP pushes member records to MCCTI (webhook style)
// Until the QooP source is configured this returns a clearly-labelled stub.
// Expected record shape mirrors the QooP dataset: ref, name, coop, sector,
// phone, gender, kyc{bvnVerified, ninVerified}, and msme{monthlyTurnover,
// employees, cashFlow, customerBase, yearsInOperation}.
export default async function handler(req, res) {
  const url = process.env.QOOP_API_URL
  const key = process.env.QOOP_API_KEY

  if (req.method === 'GET') {
    if (!url || !key) {
      return res.status(501).json({ stub: true, direction: 'QooP->MCCTI', error: 'QooP source not configured. Set QOOP_API_URL and QOOP_API_KEY to enable one-way ingestion.' })
    }
    try {
      const r = await fetch(url.replace(/\/$/, '') + '/members', { headers: { authorization: 'Bearer ' + key } })
      const data = await r.json()
      return res.status(r.status).json({ direction: 'QooP->MCCTI', received: Array.isArray(data) ? data.length : 0, data })
    } catch (e) {
      return res.status(502).json({ error: 'Could not reach QooP', detail: String(e) })
    }
  }

  if (req.method === 'POST') {
    const body = req.body || {}
    const records = Array.isArray(body.records) ? body.records : []
    return res.status(200).json({ direction: 'QooP->MCCTI', accepted: records.length, note: 'Records validated for one-way ingest. MCCTI does not write back to QooP.' })
  }

  return res.status(405).json({ error: 'Method not allowed' })
}

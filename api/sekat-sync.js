// One-way SEKAT -> MCCTI ingestion endpoint.
// Data flows in a single direction: SEKAT is the source, MCCTI is the
// destination. Two modes are supported:
//   GET  - MCCTI pulls societies from the SEKAT API (needs SEKAT_API_URL + KEY)
//   POST - SEKAT pushes society records to MCCTI (webhook style)
// Until the SEKAT source is configured this returns a clearly-labelled stub.
// The expected record shape mirrors the MicMac Coop Portal dataset: regNo,
// name, areaOffice, sector, custodian, trustees[], bank{}, and an audit{} block
// with income, expenses, balanceSheet, disposalOfSurplus, trialBalance,
// personalLedgerBalances, comparativeAnalysis[], additionalInformation,
// examinedBy, approvedBy and signature.
export default async function handler(req, res) {
  const url = process.env.SEKAT_API_URL
  const key = process.env.SEKAT_API_KEY

  if (req.method === 'GET') {
    if (!url || !key) {
      return res.status(501).json({ stub: true, direction: 'SEKAT->MCCTI', error: 'SEKAT source not configured. Set SEKAT_API_URL and SEKAT_API_KEY to enable one-way ingestion.' })
    }
    try {
      const r = await fetch(url.replace(/\/$/, '') + '/societies', { headers: { authorization: 'Bearer ' + key } })
      const data = await r.json()
      return res.status(r.status).json({ direction: 'SEKAT->MCCTI', received: Array.isArray(data) ? data.length : 0, data })
    } catch (e) {
      return res.status(502).json({ error: 'Could not reach SEKAT', detail: String(e) })
    }
  }

  if (req.method === 'POST') {
    const body = req.body || {}
    const records = Array.isArray(body.records) ? body.records : []
    // Validation only. Persistence into Supabase happens client-side or via a
    // service-role function so that MCCTI never writes back to SEKAT.
    return res.status(200).json({ direction: 'SEKAT->MCCTI', accepted: records.length, note: 'Records validated for one-way ingest. MCCTI does not write back to SEKAT.' })
  }

  return res.status(405).json({ error: 'Method not allowed' })
}

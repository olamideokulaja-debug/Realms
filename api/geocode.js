// RHSC geocoding endpoint.
// Optional: set GOOGLE_MAPS_KEY in Vercel for accurate Nigerian address lookups
// (Geocoding API, roughly USD 5 per 1000 lookups). Without it this falls back to
// OpenStreetMap, which is free but sparse for informal Lagos addresses.
export const maxDuration = 60

const UA = 'RealmsFieldMonitoring/1.0 (info@realmsconsulting.com)'

async function google(q, key) {
  const url = 'https://maps.googleapis.com/maps/api/geocode/json?address=' +
    encodeURIComponent(q) + '&components=country:NG|administrative_area:Lagos&key=' + key
  const r = await fetch(url)
  const d = await r.json().catch(() => ({}))
  if (d.status === 'OK' && d.results && d.results[0]) {
    const g = d.results[0]
    return { lat: g.geometry.location.lat, lng: g.geometry.location.lng, precision: g.geometry.location_type || 'GOOGLE', label: g.formatted_address }
  }
  if (d.status === 'OVER_QUERY_LIMIT' || d.status === 'REQUEST_DENIED') throw new Error(d.status + ': ' + (d.error_message || ''))
  return null
}

async function osm(q) {
  // Bias hard to Lagos State and Nigeria, or the results are useless.
  const url = 'https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=ng' +
    '&viewbox=2.70,6.75,4.35,6.35&bounded=1&q=' + encodeURIComponent(q)
  const r = await fetch(url, { headers: { 'Accept': 'application/json', 'User-Agent': UA } })
  if (!r.ok) return null
  const j = await r.json().catch(() => [])
  if (j && j[0]) return { lat: parseFloat(j[0].lat), lng: parseFloat(j[0].lon), precision: 'OSM', label: j[0].display_name }
  return null
}

export default async function handler(req, res) {
  if (req.method !== 'POST') { res.status(405).json({ ok: false, reason: 'method_not_allowed' }); return }
  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {})
    const list = Array.isArray(body.list) ? body.list.slice(0, 60) : (body.q ? [body.q] : [])
    if (!list.length) { res.status(200).json({ ok: false, reason: 'nothing_to_look_up' }); return }
    const key = process.env.GOOGLE_MAPS_KEY
    const out = []
    for (let i = 0; i < list.length; i++) {
      const q = String(list[i] || '').trim()
      if (!q) { out.push(null); continue }
      let hit = null
      try {
        if (key) hit = await google(q, key)
        else { hit = await osm(q); await new Promise(r => setTimeout(r, 1100)) }
      } catch (e) { res.status(200).json({ ok: false, reason: String(e.message || e), results: out }); return }
      out.push(hit)
    }
    res.status(200).json({ ok: true, source: key ? 'google' : 'osm', results: out })
  } catch (e) {
    res.status(200).json({ ok: false, reason: String((e && e.message) || e) })
  }
}

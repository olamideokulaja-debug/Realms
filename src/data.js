import { supabase, MODE } from './supabaseClient.js'

/* ---------- helpers ---------- */
export function haversine(a, b) {
  if (!a || !b) return Infinity
  const R = 6371, toRad = d => d * Math.PI / 180
  const dLat = toRad(b.lat - a.lat), dLng = toRad(b.lng - a.lng)
  const s = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(s))
}

// Nearest-neighbour ordering of facilities that have coordinates.
export function orderRoute(list) {
  const pts = list.filter(f => typeof f.lat === 'number' && typeof f.lng === 'number')
  if (pts.length <= 2) return pts
  const remaining = pts.slice()
  const route = [remaining.shift()]
  while (remaining.length) {
    const last = route[route.length - 1]
    let bi = 0, bd = Infinity
    remaining.forEach((f, i) => { const d = haversine(last, f); if (d < bd) { bd = d; bi = i } })
    route.push(remaining.splice(bi, 1)[0])
  }
  return route
}

export function googleMapsDirUrl(ordered) {
  const pts = ordered.filter(f => typeof f.lat === 'number' && typeof f.lng === 'number')
  if (!pts.length) return ''
  const path = pts.map(f => f.lat + ',' + f.lng).join('/')
  return 'https://www.google.com/maps/dir/' + path
}

/* ---------- CSV ---------- */
export function parseCSV(text) {
  const rows = []; let field = '', row = [], inQ = false
  for (let i = 0; i < text.length; i++) {
    const c = text[i]
    if (inQ) {
      if (c === '"') { if (text[i + 1] === '"') { field += '"'; i++ } else inQ = false }
      else field += c
    } else {
      if (c === '"') inQ = true
      else if (c === ',') { row.push(field); field = '' }
      else if (c === '\n') { row.push(field); rows.push(row); row = []; field = '' }
      else if (c === '\r') { /* skip */ }
      else field += c
    }
  }
  if (field.length || row.length) { row.push(field); rows.push(row) }
  return rows.filter(r => r.some(x => x && x.trim() !== ''))
}

function pick(obj, keys) { for (const k of keys) { if (obj[k] !== undefined && obj[k] !== '') return obj[k] } return '' }

export function facilitiesFromCSV(text) {
  const rows = parseCSV(text)
  if (rows.length < 2) return []
  const headers = rows[0].map(h => h.trim().toLowerCase())
  return rows.slice(1).map(r => {
    const o = {}; headers.forEach((h, i) => { o[h] = (r[i] || '').trim() })
    const lat = parseFloat(pick(o, ['lat', 'latitude']))
    const lng = parseFloat(pick(o, ['lng', 'lon', 'long', 'longitude']))
    return {
      name: pick(o, ['name', 'facility', 'facility name']) || 'Unnamed facility',
      category: pick(o, ['category', 'licensed category', 'type']),
      area: pick(o, ['area', 'lga', 'location']) || 'Unassigned',
      address: pick(o, ['address']),
      last_visit: pick(o, ['last_visit', 'previous', 'previous monitoring date', 'last visit']),
      lat: isNaN(lat) ? null : lat,
      lng: isNaN(lng) ? null : lng
    }
  })
}

/* ---------- optional geocode (OpenStreetMap Nominatim, best-effort, no key) ---------- */
export async function geocode(address) {
  const q = encodeURIComponent(address + ', Lagos, Nigeria')
  const res = await fetch('https://nominatim.openstreetmap.org/search?format=json&limit=1&q=' + q, { headers: { 'Accept': 'application/json' } })
  const j = await res.json()
  if (j && j[0]) return { lat: parseFloat(j[0].lat), lng: parseFloat(j[0].lon) }
  return null
}

/* ---------- facilities store (Supabase or demo/localStorage) ---------- */
const LS_FAC = 'realms_facilities'
const LS_ASG = 'realms_assignments'
function lsGet(k) { try { return JSON.parse(localStorage.getItem(k) || '[]') } catch (e) { return [] } }
function lsSet(k, v) { try { localStorage.setItem(k, JSON.stringify(v)) } catch (e) { /* ignore */ } }
function uid() { return 'loc_' + Math.random().toString(36).slice(2, 10) }

export const facilities = {
  async list() {
    if (MODE === 'supabase') {
      const { data, error } = await supabase.from('facilities').select('*').order('area', { ascending: true })
      if (error) throw error
      return data || []
    }
    return lsGet(LS_FAC)
  },
  async addMany(items, userId) {
    if (MODE === 'supabase') {
      const rows = items.map(f => ({ ...f, created_by: userId || null }))
      const { data, error } = await supabase.from('facilities').insert(rows).select()
      if (error) throw error
      return data || []
    }
    const cur = lsGet(LS_FAC); const added = items.map(f => ({ ...f, id: uid() }))
    lsSet(LS_FAC, cur.concat(added)); return added
  },
  async remove(id) {
    if (MODE === 'supabase') { const { error } = await supabase.from('facilities').delete().eq('id', id); if (error) throw error; return }
    lsSet(LS_FAC, lsGet(LS_FAC).filter(f => f.id !== id))
  },
  async update(id, patch) {
    if (MODE === 'supabase') { const { error } = await supabase.from('facilities').update(patch).eq('id', id); if (error) throw error; return }
    lsSet(LS_FAC, lsGet(LS_FAC).map(f => f.id === id ? { ...f, ...patch } : f))
  }
}

export const assignments = {
  async list() {
    if (MODE === 'supabase') {
      const { data, error } = await supabase.from('assignments').select('*').order('visit_date', { ascending: true })
      if (error) throw error
      return data || []
    }
    return lsGet(LS_ASG)
  },
  async add(a, userId) {
    if (MODE === 'supabase') {
      const { data, error } = await supabase.from('assignments').insert([{ ...a, created_by: userId || null }]).select()
      if (error) throw error
      return (data && data[0]) || a
    }
    const cur = lsGet(LS_ASG); const rec = { ...a, id: uid(), created_at: new Date().toISOString() }
    lsSet(LS_ASG, cur.concat([rec])); return rec
  }
}

/* ---------- visits (Engage, Stage 4) ---------- */
const LS_VIS = 'realms_visits'
export const visits = {
  async list() {
    if (MODE === 'supabase') {
      const { data, error } = await supabase.from('visits').select('*').order('created_at', { ascending: false })
      if (error) throw error
      return data || []
    }
    return lsGet(LS_VIS)
  },
  async add(v, userId) {
    if (MODE === 'supabase') {
      const { data, error } = await supabase.from('visits').insert([{ ...v, created_by: userId || null }]).select()
      if (error) throw error
      return (data && data[0]) || v
    }
    const cur = lsGet(LS_VIS); const rec = { ...v, id: uid(), created_at: new Date().toISOString() }
    lsSet(LS_VIS, [rec].concat(cur)); return rec
  },
  async update(id, patch) {
    if (MODE === 'supabase') { const { error } = await supabase.from('visits').update(patch).eq('id', id); if (error) throw error; return }
    lsSet(LS_VIS, lsGet(LS_VIS).map(v => v.id === id ? { ...v, ...patch } : v))
  }
}

/* ---------- evidence storage (Supabase Storage; falls back to inline data URL) ---------- */
function dataUrlToBlob(dataUrl) {
  const parts = dataUrl.split(','); const meta = parts[0] || ''; const b64 = parts[1] || ''
  const mime = (meta.match(/:(.*?);/) || [])[1] || 'application/octet-stream'
  const bin = atob(b64); const arr = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i)
  return new Blob([arr], { type: mime })
}
export async function uploadEvidence(visitId, type, dataUrl) {
  if (MODE !== 'supabase' || !supabase) return dataUrl
  try {
    const blob = dataUrlToBlob(dataUrl)
    const ext = type === 'voice' ? 'webm' : 'jpg'
    const path = (visitId || 'v') + '/' + Date.now() + '_' + Math.random().toString(36).slice(2, 8) + '.' + ext
    const { error } = await supabase.storage.from('evidence').upload(path, blob, { contentType: blob.type, upsert: false })
    if (error) throw error
    const { data } = supabase.storage.from('evidence').getPublicUrl(path)
    return (data && data.publicUrl) || dataUrl
  } catch (e) { return dataUrl }
}

/* ---------- notifications (posts to the /api/notify serverless function) ---------- */
export async function sendNotify(payload) {
  try {
    const res = await fetch('/api/notify', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
    const j = await res.json().catch(() => ({ ok: false, reason: 'bad_response' }))
    if (!res.ok) return { ok: false, reason: j.reason || ('http_' + res.status) }
    return j
  } catch (e) { return { ok: false, reason: 'network' } }
}

import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY

// Real Supabase when keys are present; otherwise a clearly-labelled demo mode
// so the site is deployable and previewable before the keys are added.
export const supabase = url && anon ? createClient(url, anon) : null
export const MODE = supabase ? 'supabase' : 'demo'

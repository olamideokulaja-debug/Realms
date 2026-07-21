// Vercel serverless function: platform health and configuration flags.
// Lets the app show which integrations are wired without exposing secrets.
export default function handler(req, res) {
  res.status(200).json({
    ok: true,
    service: 'MCCTI CoopEco',
    ai: Boolean(process.env.ANTHROPIC_API_KEY),
    supabase: Boolean(process.env.VITE_SUPABASE_URL),
    ts: Date.now(),
  })
}

// Server-side AI proxy for MCCTI CoopEco.
// Used from Stage 3 onward for AI rent/valuation-style tasks, credit scoring
// prompts, document generation and dashboard summaries. The Anthropic key is
// held only on the server via the ANTHROPIC_API_KEY environment variable and is
// never exposed to the browser. Until the key is set this returns a clear stub.
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }
  const key = process.env.ANTHROPIC_API_KEY
  if (!key) {
    return res.status(501).json({
      stub: true,
      error: 'AI proxy not configured. Add ANTHROPIC_API_KEY in Vercel to enable.',
    })
  }
  try {
    const { messages, system, max_tokens } = req.body || {}
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': key,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: max_tokens || 1024,
        system: system || 'You are the MCCTI CoopEco assistant. Be concise and use British English.',
        messages: messages || [],
      }),
    })
    const data = await r.json()
    return res.status(r.status).json(data)
  } catch (e) {
    return res.status(500).json({ error: 'AI proxy error', detail: String(e) })
  }
}

export default async function handler(req, res) {
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return res.status(500).json({ error: 'Missing Supabase env vars' });
  }

  try {
    const response = await fetch(`${supabaseUrl}/rest/v1/movies?select=id&limit=1`, {
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
      },
    });

    if (!response.ok) {
      const text = await response.text();
      return res.status(500).json({ error: `Supabase returned ${response.status}`, detail: text });
    }

    const data = await response.json();
    console.log(`[keep-alive] Pinged at ${new Date().toISOString()}`);
    return res.status(200).json({ ok: true, timestamp: new Date().toISOString(), rows: data.length });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

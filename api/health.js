// GET /api/health → comprueba que la web y la base de datos responden.
export default async function handler(req, res) {
  const url = process.env.SUPABASE_URL, key = process.env.SUPABASE_ANON_KEY;
  const out = { ok: true, time: new Date().toISOString(), backend: url ? 'supabase' : 'demo' };
  if (url && key) {
    try {
      const r = await fetch(`${url}/rest/v1/settings?select=key&limit=1`, { headers: { apikey: key, Authorization: `Bearer ${key}` } });
      out.database = r.ok ? 'ok' : `error ${r.status}`;
      if (!r.ok) out.ok = false;
    } catch (e) { out.ok = false; out.database = 'sin conexión'; }
  }
  res.setHeader('Cache-Control', 'no-store');
  res.status(out.ok ? 200 : 503).json(out);
}

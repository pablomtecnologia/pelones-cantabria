// Tarea programada diaria (vercel.json → crons): hace una consulta mínima para
// que el proyecto gratuito de Supabase no se pause por inactividad (7 días).
export default async function handler(req, res) {
  if (process.env.CRON_SECRET && req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ ok: false });
  }
  const url = process.env.SUPABASE_URL, key = process.env.SUPABASE_ANON_KEY;
  if (!url || !key) return res.status(200).json({ ok: true, skipped: 'sin backend' });
  const r = await fetch(`${url}/rest/v1/products?select=id&limit=1`, { headers: { apikey: key, Authorization: `Bearer ${key}` } });
  res.status(r.ok ? 200 : 502).json({ ok: r.ok });
}

// GET /api/config → expone SOLO la configuración pública del cliente.
// La clave anon de Supabase es pública por diseño (la protegen las políticas RLS).
export default function handler(req, res) {
  const supabaseUrl = process.env.SUPABASE_URL || '';
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || '';
  res.setHeader('Cache-Control', 'public, max-age=300, s-maxage=300');
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.status(200).send(JSON.stringify(supabaseUrl && supabaseAnonKey ? { supabaseUrl, supabaseAnonKey } : {}));
}

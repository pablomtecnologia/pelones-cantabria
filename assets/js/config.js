// Configuración pública del backend (Supabase).
// Opción A (recomendada en Vercel): déjalo vacío y define las variables de
//   entorno SUPABASE_URL y SUPABASE_ANON_KEY; /api/config las sirve solo.
// Opción B: pega aquí los valores (la "anon key" es pública por diseño;
//   la seguridad la ponen las políticas RLS de la base de datos).
// Si no hay configuración, la web funciona en MODO DEMO (datos en el navegador).
window.PELONES_CONFIG = {
  supabaseUrl: '',
  supabaseAnonKey: '',
};

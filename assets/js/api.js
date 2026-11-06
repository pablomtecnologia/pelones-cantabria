// =====================================================================
//  Capa de datos de Pelones Cantabria
//  · Modo "supabase": backend real (Auth + Postgres + Realtime + Storage)
//  · Modo "demo": todo en el navegador (localStorage) para previsualizar
//  La interfaz de ambos es idéntica, así que la web no nota la diferencia.
// =====================================================================

import { CATALOG, PARTNERS } from './content.js';

const SUPABASE_CDN = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/dist/umd/supabase.js';

async function loadConfig() {
  const c = (window.PELONES_CONFIG || {});
  if (c.supabaseUrl && c.supabaseAnonKey) return c;
  if (location.protocol.startsWith('http')) {
    try {
      const ctrl = new AbortController();
      const t = setTimeout(() => ctrl.abort(), 2500);
      const r = await fetch('/api/config', { signal: ctrl.signal, cache: 'no-store' });
      clearTimeout(t);
      if (r.ok && (r.headers.get('content-type') || '').includes('json')) {
        const j = await r.json();
        if (j.supabaseUrl && j.supabaseAnonKey) return j;
      }
    } catch { /* sin backend: modo demo */ }
  }
  return null;
}

function loadScript(src) {
  return new Promise((ok, ko) => {
    const s = document.createElement('script');
    s.src = src; s.onload = ok; s.onerror = () => ko(new Error('No se pudo cargar ' + src));
    document.head.appendChild(s);
  });
}

// Reduce las fotos antes de subirlas (ahorra espacio en el plan gratuito)
export async function resizeImage(file, max = 1400, quality = 0.82) {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise((ok, ko) => { const i = new Image(); i.onload = () => ok(i); i.onerror = ko; i.src = url; });
    const scale = Math.min(1, max / Math.max(img.width, img.height));
    const c = document.createElement('canvas');
    c.width = Math.round(img.width * scale); c.height = Math.round(img.height * scale);
    c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
    return await new Promise(ok => c.toBlob(ok, 'image/jpeg', quality));
  } finally { URL.revokeObjectURL(url); }
}

const ES_ERRORS = [
  [/invalid login credentials/i, 'Correo o contraseña incorrectos.'],
  [/email not confirmed/i, 'Todavía no has confirmado tu correo. Revisa tu bandeja de entrada (y el spam).'],
  [/already registered|already exists/i, 'Ya existe una cuenta con ese correo. Prueba a iniciar sesión.'],
  [/password should be at least/i, 'La contraseña debe tener al menos 8 caracteres.'],
  [/rate limit|too many/i, 'Demasiados intentos seguidos. Espera un momento y vuelve a probar.'],
  [/same.*password|different from the old/i, 'La nueva contraseña debe ser distinta de la anterior.'],
  [/jwt|session.*missing|not authenticated/i, 'Tu sesión ha caducado. Vuelve a iniciar sesión.'],
  [/failed to fetch|network/i, 'No hay conexión con el servidor. Comprueba tu internet.'],
];
function esError(e) {
  const m = (e && (e.message || e.error_description || e)) + '';
  for (const [re, txt] of ES_ERRORS) if (re.test(m)) return new Error(txt);
  return new Error(m.replace(/^.*?ERROR:\s*/, ''));
}
const unwrap = ({ data, error }) => { if (error) throw esError(error); return data; };

// =====================================================================
//  ADAPTADOR SUPABASE
// =====================================================================
function supabaseAdapter(sb) {
  const t = (name) => sb.from(name);
  let profileCache = null;

  async function session() {
    const { data } = await sb.auth.getSession();
    const user = data.session?.user;
    if (!user) { profileCache = null; return null; }
    if (!profileCache || profileCache.id !== user.id) {
      const { data: p } = await t('profiles').select('*').eq('id', user.id).maybeSingle();
      profileCache = p || { id: user.id, full_name: user.user_metadata?.full_name || '', role: 'user', email: user.email };
    }
    return { user: { id: user.id, email: user.email }, profile: profileCache };
  }

  const crud = (table, order = ['created_at', { ascending: false }], publicFilter) => ({
    async list(all = false) {
      let q = t(table).select('*').order(...order);
      if (!all && publicFilter) q = publicFilter(q);
      return unwrap(await q);
    },
    async save(obj) {
      const row = { ...obj }; delete row.created_at;
      if (row.id) return unwrap(await t(table).update(row).eq('id', row.id).select().single());
      delete row.id;
      return unwrap(await t(table).insert(row).select().single());
    },
    async remove(id) { unwrap(await t(table).delete().eq('id', id)); },
  });

  return {
    mode: 'supabase',
    auth: {
      session,
      async signIn(email, password) { unwrap(await sb.auth.signInWithPassword({ email, password })); profileCache = null; return session(); },
      async signUp(full_name, email, password) {
        const d = unwrap(await sb.auth.signUp({ email, password, options: { data: { full_name }, emailRedirectTo: location.origin + '/#entrar' } }));
        if (d.user && Array.isArray(d.user.identities) && d.user.identities.length === 0) throw new Error('Ya existe una cuenta con ese correo. Prueba a iniciar sesión.');
        return { needsConfirm: !d.session };
      },
      async signOut() { await sb.auth.signOut(); profileCache = null; },
      async requestReset(email) { unwrap(await sb.auth.resetPasswordForEmail(email, { redirectTo: location.origin + '/?recuperacion=1#nueva-contrasena' })); },
      async updatePassword(password) { unwrap(await sb.auth.updateUser({ password })); },
      async updateProfile(fields) {
        const s = await session(); if (!s) throw new Error('Inicia sesión primero.');
        const p = unwrap(await t('profiles').update({ full_name: fields.full_name, phone: fields.phone }).eq('id', s.user.id).select().single());
        profileCache = p; return p;
      },
      onChange(cb) { sb.auth.onAuthStateChange((ev) => { profileCache = null; cb(ev); }); },
    },
    settings: {
      async get() { const rows = unwrap(await t('settings').select('key,value')); return Object.fromEntries(rows.map(r => [r.key, r.value])); },
      async set(key, value) { unwrap(await t('settings').upsert({ key, value, updated_at: new Date().toISOString() })); },
    },
    products: crud('products', ['sort', { ascending: true }], q => q.eq('active', true)),
    news: crud('news', ['event_date', { ascending: false, nullsFirst: false }], q => q.eq('published', true)),
    gallery: crud('gallery', ['created_at', { ascending: false }], q => q.eq('published', true)),
    partners: crud('partners', ['sort', { ascending: true }], q => q.eq('active', true)),
    orders: {
      async create(o) {
        const rows = unwrap(await sb.rpc('create_order', { p_name: o.name, p_email: o.email, p_phone: o.phone || null, p_delivery: o.delivery, p_address: o.address || null, p_notes: o.notes || null, p_items: o.items.map(i => ({ id: i.id, qty: i.qty })), p_payment: o.payment_method || 'en_mano' }));
        return Array.isArray(rows) ? rows[0] : rows;
      },
      async list() { return unwrap(await t('orders').select('*').order('created_at', { ascending: false })); },
      async mine() { const s = await session(); if (!s) return []; return unwrap(await t('orders').select('*').eq('user_id', s.user.id).order('created_at', { ascending: false })); },
      async setStatus(id, status) { unwrap(await t('orders').update({ status }).eq('id', id)); },
      async setPaid(id, paid) { unwrap(await t('orders').update({ paid }).eq('id', id)); },
      async remove(id) { unwrap(await t('orders').delete().eq('id', id)); },
    },
    messages: {
      async create(m) { unwrap(await t('contact_messages').insert(m)); },
      async list() { return unwrap(await t('contact_messages').select('*').order('created_at', { ascending: false })); },
      async setHandled(id, handled) { unwrap(await t('contact_messages').update({ handled }).eq('id', id)); },
      async remove(id) { unwrap(await t('contact_messages').delete().eq('id', id)); },
    },
    raffles: crud('raffles', ['created_at', { ascending: false }], q => q.eq('published', true)),
    tickets: {
      async list(raffleId) { return unwrap(await t('raffle_tickets').select('number,holder_label,status').eq('raffle_id', raffleId).order('number')); },
      async contacts(raffleId) { return unwrap(await t('raffle_ticket_contacts').select('*').eq('raffle_id', raffleId).order('number')); },
      async sell(raffleId, number, d, overwrite = false) {
        unwrap(await sb.rpc('sell_ticket', { p_raffle: raffleId, p_number: number, p_full_name: d.full_name, p_phone: d.phone || null, p_email: d.email || null, p_paid: !!d.paid, p_status: d.status || 'vendido', p_notes: d.notes || null, p_overwrite: overwrite }));
      },
      async release(raffleId, number) { unwrap(await sb.rpc('release_ticket', { p_raffle: raffleId, p_number: number })); },
    },
    winners: {
      async list(raffleId) { return unwrap(await t('raffle_winners').select('*').eq('raffle_id', raffleId).order('position')); },
      ...(() => { const c = crud('raffle_winners'); return { save: c.save, remove: c.remove }; })(),
    },
    users: {
      async list() { return unwrap(await t('profiles').select('*').order('created_at', { ascending: false })); },
      async setRole(id, role) { unwrap(await t('profiles').update({ role }).eq('id', id)); },
    },
    async upload(file) {
      const blob = await resizeImage(file);
      const path = `${new Date().getFullYear()}/${crypto.randomUUID()}.jpg`;
      unwrap(await sb.storage.from('media').upload(path, blob, { contentType: 'image/jpeg', cacheControl: '31536000' }));
      return sb.storage.from('media').getPublicUrl(path).data.publicUrl;
    },
    subscribe(key, cb) {
      const ch = sb.channel(key + '-' + Math.random().toString(36).slice(2));
      if (key.startsWith('raffle:')) {
        const id = key.slice(7);
        ch.on('postgres_changes', { event: '*', schema: 'public', table: 'raffle_tickets', filter: `raffle_id=eq.${id}` }, p => cb('tickets', p))
          .on('postgres_changes', { event: '*', schema: 'public', table: 'raffle_winners', filter: `raffle_id=eq.${id}` }, p => cb('winners', p))
          .on('postgres_changes', { event: '*', schema: 'public', table: 'raffles', filter: `id=eq.${id}` }, p => cb('raffle', p));
      } else if (key === 'settings') {
        ch.on('postgres_changes', { event: '*', schema: 'public', table: 'settings' }, p => cb('settings', p));
      }
      ch.subscribe();
      return () => sb.removeChannel(ch);
    },
  };
}

// =====================================================================
//  ADAPTADOR DEMO (localStorage) · mismas reglas que la base de datos
// =====================================================================
const DB_KEY = 'pelones_demo_db_v2';
const SES_KEY = 'pelones_demo_session';
const store = {
  get(k) { try { return JSON.parse(localStorage.getItem(k)); } catch { return null; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch { return false; } },
  del(k) { try { localStorage.removeItem(k); } catch { /* */ } },
};
const uid = () => (crypto.randomUUID ? crypto.randomUUID() : 'id' + Date.now() + Math.random().toString(16).slice(2));
const now = () => new Date().toISOString();
async function sha(s) {
  try { const b = await crypto.subtle.digest('SHA-256', new TextEncoder().encode('pelones:' + s)); return [...new Uint8Array(b)].map(x => x.toString(16).padStart(2, '0')).join(''); }
  catch { let h = 0; for (const c of 'pelones:' + s) h = (h * 31 + c.charCodeAt(0)) | 0; return 'h' + h; }
}

export const DEMO_ACCOUNTS = { admin: 'admin@pelones.demo', staff: 'voluntario@pelones.demo', password: 'Pelones2026' };

async function seedDemo() {
  const pw = await sha(DEMO_ACCOUNTS.password);
  const P = (name, description, category, price, theme, featured, sort) => ({ id: uid(), name, description, category, price, image_url: null, colors: { theme }, stock: 'disponible', featured, active: true, sort, created_at: now() });
  const N = (title, excerpt, kind, event_date, location, link) => ({ id: uid(), title, excerpt, body: '', kind, event_date, location, image_url: null, link, published: true, created_at: now() });
  return {
    users: [
      { id: uid(), email: DEMO_ACCOUNTS.admin, full_name: 'Administración Pelones', role: 'admin', pw, phone: '', created_at: now() },
      { id: uid(), email: DEMO_ACCOUNTS.staff, full_name: 'Equipo voluntario', role: 'staff', pw, phone: '', created_at: now() },
    ],
    settings: { raffles_enabled: false, contact_email: '', whatsapp: '', phone: '', address: 'Santander, Cantabria', facebook: 'https://www.facebook.com/pelonescantabria/', instagram: 'https://www.instagram.com/pelonescantabria/', twitter: 'https://twitter.com/pelonescant', migranodearena: 'https://www.migranodearena.org/usuario/pelones-cantabria', pay_bizum: '', pay_iban: '', pay_holder: 'Asociación Pelones Cantabria', pay_card_url: '', pay_cash: true },
    products: CATALOG.map(([n, d, c, price, theme, feat], i) => P(n, d, c, price, theme, feat, i + 1)),
    partners: PARTNERS.map((x, i) => ({ id: uid(), name: x.n, description: x.d, grp: x.g, url: x.url || null, logo_url: null, color: x.c, sort: i + 1, active: true, created_at: now() })),
    news: [
      N('El Racing nos abre las puertas de Nando Yosu', 'Jugadores y leyendas del Real Racing Club se fotografían con nuestros voluntarios y nos dan su respaldo.', 'logro', '2016-05-14', 'Instalaciones Nando Yosu, Santander', 'https://www.realracingclub.es/noticias/el-racing-respalda-a-la-asociacion-pelones-cantabria-en-su-lucha-contra-la-enfermedad-infantil'),
      N('Everesting por Pelones en Estacas de Trueba', 'Adrián y Daniel suben 12 veces el puerto: más de 9.500 metros de desnivel en un día para apoyar la causa.', 'logro', '2017-06-17', 'Estacas de Trueba', 'https://masters.abloque.com/2017/06/17/everesting-challenge-pelones-cantabria/'),
      N('Tarde solidaria en Soto de la Marina', 'Juegos, talleres, mercadillo y sorteo a favor de Pelones con el Ayuntamiento de Santa Cruz de Bezana y Urban Chic Eva Díez.', 'evento', '2023-08-12', 'Plaza Nueva, Soto de la Marina', 'https://eldiariocantabria.publico.es/articulo/arco-de-la-bahia/ayuntamiento-organiza-evento-solidario-favor-asociacion-pelones-cantabria/20230807170309140939.html'),
      N('La Marcha Solidaria de Ramales camina por Pelones', 'El CEO Príncipe de Asturias dedica su semana solidaria a la asociación. Lo recaudado irá a un campamento para niños que han pasado un cáncer.', 'logro', '2026-01-30', 'Ramales de la Victoria', 'https://ramalesblog.wordpress.com/2026/01/30/semana-solidaria-7/'),
      N('Semana Grande: marmita solidaria con Bonitos del Norte', 'La peña Bonitos del Norte cocina por Pelones en la Semana Grande de Santander. Las peñas entregaron 27.627 € a distintas causas sociales.', 'logro', '2026-09-19', 'Santander', 'https://www.ifomo.es/articulo/santander/cantabria-penas-entregan-distintas-causas-sociales-mas-27500-euros-recaudados-semana-grande-santander/20260919184847358928.html'),
    ],
    gallery: [
      { id: uid(), title: '#cadapeloncuenta', category: 'campañas', image_url: 'assets/img/cartel.jpg', published: true, created_at: now() },
      { id: uid(), title: 'Nuestro pelón', category: 'pelones', image_url: 'assets/img/logo.jpg', published: true, created_at: now() },
    ],
    orders: [], messages: [], raffles: [], tickets: [], contacts: [], winners: [],
  };
}

function demoAdapter() {
  let db = null;
  const listeners = new Set();
  let bc = null;
  try { bc = new BroadcastChannel('pelones-demo'); bc.onmessage = (e) => { db = store.get(DB_KEY) || db; emit(e.data, false); }; } catch { /* */ }
  window.addEventListener('storage', (e) => { if (e.key === DB_KEY) { db = store.get(DB_KEY) || db; emit({ table: '*' }, false); } });
  function emit(msg, broadcast = true) { listeners.forEach(l => l(msg)); if (broadcast && bc) try { bc.postMessage(msg); } catch { /* */ } }

  async function load() { if (!db) { db = store.get(DB_KEY) || await seedDemo(); store.set(DB_KEY, db); } return db; }
  function save(table, extra = {}) { if (!store.set(DB_KEY, db)) console.warn('Demo: no se pudo guardar (almacenamiento lleno o bloqueado)'); emit({ table, ...extra }); }
  const delay = (ms = 120) => new Promise(r => setTimeout(r, ms));
  const clone = (x) => JSON.parse(JSON.stringify(x));

  async function me() {
    await load();
    const s = store.get(SES_KEY); if (!s) return null;
    const u = db.users.find(x => x.id === s.id); if (!u) return null;
    return u;
  }
  const role = async () => (await me())?.role || 'anon';
  const isStaff = async () => ['staff', 'admin'].includes(await role());
  const isAdmin = async () => (await role()) === 'admin';
  const need = async (fn, msg = 'No autorizado: necesitas una cuenta con permisos.') => { if (!(await fn())) throw new Error(msg); };
  const authCbs = new Set();

  const crud = (table, sortFn, publicFn) => ({
    async list(all = false) { await load(); await delay(); let rows = clone(db[table]); if (!all || !(await isStaff())) rows = rows.filter(publicFn); return rows.sort(sortFn); },
    async save(obj) {
      await load(); await need(isAdmin, 'Solo la administración puede editar esto.');
      const row = { ...obj };
      if (row.id) { const i = db[table].findIndex(x => x.id === row.id); if (i < 0) throw new Error('No encontrado'); db[table][i] = { ...db[table][i], ...row }; save(table, { id: row.id }); return clone(db[table][i]); }
      row.id = uid(); row.created_at = now(); db[table].push(row); save(table, { id: row.id }); return clone(row);
    },
    async remove(id) { await load(); await need(isAdmin); db[table] = db[table].filter(x => x.id !== id); save(table); },
  });
  const byDate = (k, dir = -1) => (a, b) => ((a[k] || '') < (b[k] || '') ? -dir : (a[k] || '') > (b[k] || '') ? dir : 0);
  const rafflesOn = () => db.settings.raffles_enabled === true;

  const email_ok = (e) => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e || '');
  function throttle(list, email) {
    const hour = Date.now() - 3600e3;
    if (list.filter(x => (x.email || '').toLowerCase() === (email || '').toLowerCase() && Date.parse(x.created_at) > hour).length >= 5)
      throw new Error('Demasiados envíos seguidos. Inténtalo dentro de un rato.');
  }

  return {
    mode: 'demo',
    auth: {
      async session() { const u = await me(); if (!u) return null; const { pw, ...profile } = u; return { user: { id: u.id, email: u.email }, profile }; },
      async signIn(email, password) {
        await load(); await delay(350);
        const u = db.users.find(x => x.email.toLowerCase() === (email || '').trim().toLowerCase());
        if (!u || u.pw !== await sha(password)) throw new Error('Correo o contraseña incorrectos.');
        store.set(SES_KEY, { id: u.id }); authCbs.forEach(cb => cb('SIGNED_IN')); return this.session();
      },
      async signUp(full_name, email, password) {
        await load(); await delay(350);
        email = (email || '').trim().toLowerCase();
        if (!email_ok(email)) throw new Error('Escribe un correo válido.');
        if (db.users.some(x => x.email === email)) throw new Error('Ya existe una cuenta con ese correo. Prueba a iniciar sesión.');
        if ((password || '').length < 8) throw new Error('La contraseña debe tener al menos 8 caracteres.');
        const u = { id: uid(), email, full_name, role: 'user', pw: await sha(password), phone: '', created_at: now() };
        db.users.push(u); save('users'); store.set(SES_KEY, { id: u.id }); authCbs.forEach(cb => cb('SIGNED_IN'));
        return { needsConfirm: false };
      },
      async signOut() { store.del(SES_KEY); authCbs.forEach(cb => cb('SIGNED_OUT')); },
      async requestReset(email) {
        await load(); await delay(400);
        const u = db.users.find(x => x.email === (email || '').trim().toLowerCase());
        if (u) store.set('pelones_demo_reset', { id: u.id, at: Date.now() });
      },
      async updatePassword(password) {
        await load();
        if ((password || '').length < 8) throw new Error('La contraseña debe tener al menos 8 caracteres.');
        let u = await me();
        const r = store.get('pelones_demo_reset');
        if (!u && r && Date.now() - r.at < 3600e3) u = db.users.find(x => x.id === r.id);
        if (!u) throw new Error('El enlace de recuperación ha caducado. Pide uno nuevo.');
        u.pw = await sha(password); store.del('pelones_demo_reset'); store.set(SES_KEY, { id: u.id }); save('users');
      },
      async updateProfile(fields) { const u = await me(); if (!u) throw new Error('Inicia sesión primero.'); u.full_name = fields.full_name; u.phone = fields.phone; save('users'); const { pw, ...p } = u; return p; },
      onChange(cb) { authCbs.add(cb); },
    },
    settings: {
      async get() { await load(); return clone(db.settings); },
      async set(key, value) { await load(); await need(isAdmin); db.settings[key] = value; save('settings'); },
    },
    products: crud('products', (a, b) => a.sort - b.sort, r => r.active),
    news: crud('news', byDate('event_date'), r => r.published),
    gallery: crud('gallery', byDate('created_at'), r => r.published),
    partners: crud('partners', (a, b) => a.sort - b.sort, r => r.active),
    orders: {
      async create(o) {
        await load(); await delay(400);
        if (!o.name || o.name.length < 2) throw new Error('Escribe tu nombre.');
        if (!email_ok(o.email)) throw new Error('Escribe un correo válido.');
        throttle(db.orders, o.email);
        let total = 0; const items = [];
        for (const it of o.items) {
          const p = db.products.find(x => x.id === it.id && x.active); if (!p) throw new Error('Producto no disponible');
          const qty = Math.max(1, Math.min(99, it.qty | 0)); total += (p.price || 0) * qty; items.push({ id: p.id, name: p.name, price: p.price, qty });
        }
        const u = await me();
        const row = { id: uid(), code: Math.random().toString(16).slice(2, 8).toUpperCase(), user_id: u?.id || null, name: o.name, email: o.email, phone: o.phone, delivery: o.delivery, address: o.address, notes: o.notes, items, total, status: 'nuevo', payment_method: o.payment_method || 'en_mano', paid: false, created_at: now() };
        db.orders.unshift(row); save('orders'); return { code: row.code, total };
      },
      async list() { await load(); await need(isStaff); return clone(db.orders); },
      async mine() { const u = await me(); if (!u) return []; return clone(db.orders.filter(o => o.user_id === u.id)); },
      async setStatus(id, status) { await need(isStaff); const o = db.orders.find(x => x.id === id); if (o) { o.status = status; save('orders'); } },
      async setPaid(id, paid) { await need(isStaff); const o = db.orders.find(x => x.id === id); if (o) { o.paid = paid; save('orders'); } },
      async remove(id) { await need(isAdmin); db.orders = db.orders.filter(x => x.id !== id); save('orders'); },
    },
    messages: {
      async create(m) {
        await load(); await delay(400);
        if (!email_ok(m.email)) throw new Error('Escribe un correo válido.');
        if ((m.message || '').length < 5) throw new Error('El mensaje es demasiado corto.');
        throttle(db.messages, m.email);
        db.messages.unshift({ id: uid(), ...m, handled: false, created_at: now() }); save('messages');
      },
      async list() { await load(); await need(isStaff); return clone(db.messages); },
      async setHandled(id, handled) { await need(isStaff); const m = db.messages.find(x => x.id === id); if (m) { m.handled = handled; save('messages'); } },
      async remove(id) { await need(isAdmin); db.messages = db.messages.filter(x => x.id !== id); save('messages'); },
    },
    raffles: {
      async list(all = false) {
        await load(); await delay();
        if (all && await isStaff()) return clone(db.raffles).sort(byDate('created_at'));
        if (!rafflesOn()) return [];
        return clone(db.raffles.filter(r => r.published)).sort(byDate('created_at'));
      },
      async save(obj) {
        await load(); await need(isAdmin, 'Solo la administración puede crear o editar sorteos.');
        if (obj.id) { const r = db.raffles.find(x => x.id === obj.id); Object.assign(r, obj); save('raffles', { raffle: obj.id }); return clone(r); }
        const r = { id: uid(), status: 'preparacion', published: false, results_published: false, number_start: 1, total_numbers: 100, ticket_price: 1, created_at: now(), ...obj };
        db.raffles.push(r); save('raffles', { raffle: r.id }); return clone(r);
      },
      async remove(id) { await need(isAdmin); db.raffles = db.raffles.filter(x => x.id !== id); db.tickets = db.tickets.filter(x => x.raffle_id !== id); db.contacts = db.contacts.filter(x => x.raffle_id !== id); db.winners = db.winners.filter(x => x.raffle_id !== id); save('raffles', { raffle: id }); },
    },
    tickets: {
      async list(raffleId) {
        await load();
        const r = db.raffles.find(x => x.id === raffleId);
        if (!(await isStaff()) && !(r && r.published && rafflesOn())) return [];
        return db.tickets.filter(x => x.raffle_id === raffleId).map(({ number, holder_label, status }) => ({ number, holder_label, status })).sort((a, b) => a.number - b.number);
      },
      async contacts(raffleId) { await load(); await need(isStaff); return clone(db.contacts.filter(x => x.raffle_id === raffleId)); },
      async sell(raffleId, number, d, overwrite = false) {
        await load(); await need(isStaff); await delay(150);
        const r = db.raffles.find(x => x.id === raffleId); if (!r) throw new Error('Sorteo no encontrado');
        if (number < r.number_start || number >= r.number_start + r.total_numbers) throw new Error(`El número ${number} no existe en este sorteo`);
        const name = (d.full_name || '').trim(); if (!name) throw new Error('Falta el nombre del comprador');
        const parts = name.split(/\s+/); const label = parts[0] + (parts[1] ? ' ' + parts[1][0].toUpperCase() + '.' : '');
        const ex = db.tickets.find(x => x.raffle_id === raffleId && x.number === number);
        if (ex && !overwrite) throw new Error(`El número ${number} ya está vendido`);
        const u = await me();
        if (ex) Object.assign(ex, { holder_label: label, status: d.status || 'vendido', sold_by: u.id, sold_at: now() });
        else db.tickets.push({ raffle_id: raffleId, number, holder_label: label, status: d.status || 'vendido', sold_by: u.id, sold_at: now() });
        db.contacts = db.contacts.filter(x => !(x.raffle_id === raffleId && x.number === number));
        db.contacts.push({ raffle_id: raffleId, number, full_name: name, phone: d.phone || '', email: d.email || '', paid: !!d.paid, notes: d.notes || '' });
        save('tickets', { raffle: raffleId, number });
      },
      async release(raffleId, number) {
        await need(isStaff);
        db.tickets = db.tickets.filter(x => !(x.raffle_id === raffleId && x.number === number));
        db.contacts = db.contacts.filter(x => !(x.raffle_id === raffleId && x.number === number));
        save('tickets', { raffle: raffleId, number });
      },
    },
    winners: {
      async list(raffleId) {
        await load();
        const rows = db.winners.filter(x => x.raffle_id === raffleId).sort((a, b) => a.position - b.position);
        if (await isStaff()) return clone(rows);
        const r = db.raffles.find(x => x.id === raffleId);
        if (!(r && r.published && r.results_published && rafflesOn())) return [];
        return clone(rows.filter(w => w.published));
      },
      async save(obj) {
        await need(isAdmin, 'Solo la administración puede editar premiados.');
        if (obj.id) { const w = db.winners.find(x => x.id === obj.id); Object.assign(w, obj); save('winners', { raffle: w.raffle_id }); return clone(w); }
        const w = { id: uid(), published: false, created_at: now(), ...obj }; db.winners.push(w); save('winners', { raffle: w.raffle_id }); return clone(w);
      },
      async remove(id) { await need(isAdmin); const w = db.winners.find(x => x.id === id); db.winners = db.winners.filter(x => x.id !== id); save('winners', { raffle: w?.raffle_id }); },
    },
    users: {
      async list() { await load(); await need(isAdmin); return db.users.map(({ pw, ...u }) => clone(u)); },
      async setRole(id, newRole) { await need(isAdmin); const u = db.users.find(x => x.id === id); if (u) { u.role = newRole; save('users'); } },
    },
    async upload(file) {
      await need(isAdmin);
      const blob = await resizeImage(file, 900, 0.75);
      return await new Promise((ok, ko) => { const fr = new FileReader(); fr.onload = () => ok(fr.result); fr.onerror = ko; fr.readAsDataURL(blob); });
    },
    subscribe(key, cb) {
      const l = (msg) => {
        if (key === 'settings' && (msg.table === 'settings' || msg.table === '*')) cb('settings', msg);
        if (key.startsWith('raffle:')) {
          const id = key.slice(7);
          if (msg.table === '*' || msg.raffle === id || msg.table === 'settings') cb(msg.table === 'winners' ? 'winners' : msg.table === 'tickets' ? 'tickets' : 'raffle', msg);
        }
      };
      listeners.add(l); return () => listeners.delete(l);
    },
    resetDemo() { store.del(DB_KEY); store.del(SES_KEY); db = null; },
  };
}

// =====================================================================
export async function createApi() {
  const cfg = await loadConfig();
  if (cfg) {
    try {
      if (!window.supabase) await loadScript(SUPABASE_CDN);
      const sb = window.supabase.createClient(cfg.supabaseUrl, cfg.supabaseAnonKey, {
        auth: { flowType: 'pkce', persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
      });
      return supabaseAdapter(sb);
    } catch (e) { console.error('Backend no disponible, se usa el modo demo:', e); }
  }
  return demoAdapter();
}

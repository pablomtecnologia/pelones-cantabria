// =====================================================================
//  PELONES CANTABRIA · Aplicación principal (router, vistas públicas)
// =====================================================================
import { createApi, DEMO_ACCOUNTS } from './api.js';
import { icon, pelonSVG, productArt, THEMES, PALETTES, VALUES, WHAT_WE_DO, MONEY_FLOW, DESTINATIONS, TIMELINE, FAQ, HOW_TO_HELP, MAKING, PRESS } from './content.js';
import { S, $, $$, esc, fmtMoney, fmtDate, isStaff, isAdmin, safeUrl, ls, toast, openModal, modalHead, confetti, busy, formData, waLink, wave } from './ui.js';
import { viewAdmin } from './admin.js';

// ---------------------------------------------------------------------
//  Rutas
// ---------------------------------------------------------------------
const ROUTES = {
  inicio:        { title: 'Inicio', nav: true, icon: 'home', render: viewHome },
  conoce:        { title: 'Conoce Pelones', nav: true, icon: 'heart', render: viewAbout },
  tienda:        { title: 'Pedidos', nav: true, icon: 'shop', render: viewShop },
  galeria:       { title: 'Galería', nav: true, icon: 'image', render: viewGallery },
  noticias:      { title: 'Noticias', nav: true, icon: 'news', render: viewNews },
  sorteos:       { title: 'Sorteos', nav: true, icon: 'ticket', render: viewRaffles, when: () => S.settings.raffles_enabled === true || isStaff() },
  colaboradores: { title: 'Colaboradores', nav: true, icon: 'star', render: viewPartners },
  contacto:      { title: 'Contacto', nav: true, icon: 'mail', render: viewContact },
  entrar:        { title: 'Iniciar sesión', render: viewLogin },
  registro:      { title: 'Crear cuenta', render: viewRegister },
  recuperar:     { title: 'Recuperar contraseña', render: viewForgot },
  'nueva-contrasena': { title: 'Nueva contraseña', render: viewNewPassword },
  cuenta:        { title: 'Mi cuenta', render: viewAccount },
  admin:         { title: 'Panel', render: viewAdmin, classicOnly: true },
  cookies:       { title: 'Política de cookies', render: (el) => legalPage(el, 'cookies') },
  privacidad:    { title: 'Política de privacidad', render: (el) => legalPage(el, 'privacidad') },
  'aviso-legal': { title: 'Aviso legal', render: (el) => legalPage(el, 'aviso') },
};
export const go = (r) => { if (location.hash === '#' + r) route(); else location.hash = r; };
let cleanup = null;

// ---------------------------------------------------------------------
//  Arranque
// ---------------------------------------------------------------------
async function boot() {
  S.cart = ls.get('pelones_cart', []);
  renderShell();
  S.api = await createApi();
  [S.session, S.settings] = await Promise.all([S.api.auth.session(), S.api.settings.get().catch(() => ({}))]);
  S.api.auth.onChange(async (ev) => {
    S.session = await S.api.auth.session();
    renderHeader();
    if (ev === 'PASSWORD_RECOVERY') go('nueva-contrasena');
  });
  S.api.subscribe('settings', async () => { S.settings = await S.api.settings.get(); renderHeader(); renderFooter(); S.world?.setZoneVisible?.('sorteos', ROUTES.sorteos.when()); });
  if (new URLSearchParams(location.search).has('recuperacion')) { history.replaceState(null, '', location.pathname + '#nueva-contrasena'); }
  renderHeader(); renderFooter(); updateCartBadge();
  if (S.api.mode === 'demo') $('#demo-banner').hidden = false;
  document.addEventListener('pelones:settings', () => { renderHeader(); renderFooter(); S.world?.setZoneVisible?.('sorteos', ROUTES.sorteos.when()); });
  window.addEventListener('hashchange', route);

  const qMode = new URLSearchParams(location.search).get('modo');
  const saved = ls.get('pelones_mode');
  if (qMode === '3d' || qMode === 'web') setMode(qMode === '3d' ? '3d' : 'classic', false);
  else if (saved) setMode(saved, false);
  else { route(); showIntro(); }
  maybeCookies();
}

function renderShell() {
  document.body.insertAdjacentHTML('afterbegin', `
  <a class="sr-only" href="#app">Saltar al contenido</a>
  <div class="demo-banner" id="demo-banner" hidden>Modo demostración: los datos se guardan solo en este navegador. Prueba el panel con <code>${DEMO_ACCOUNTS.admin}</code> · <code>${DEMO_ACCOUNTS.password}</code></div>
  <header class="site-header" id="site-header"></header>
  <main id="app" tabindex="-1"></main>
  <footer class="site-footer" id="site-footer"></footer>
  <div class="drawer-backdrop" id="cart-bd"></div>
  <aside class="drawer" id="cart" aria-label="Tu pedido" aria-hidden="true"></aside>`);
  $('#cart-bd').onclick = () => toggleCart(false);
}

function navLinks() {
  return Object.entries(ROUTES).filter(([, r]) => r.nav && (!r.when || r.when()))
    .map(([k, r]) => `<a href="#${k}" data-r="${k}" class="${S.route === k ? 'active' : ''}">${r.title}</a>`).join('');
}

function renderHeader() {
  const h = $('#site-header'); if (!h) return;
  const p = S.session?.profile;
  h.innerHTML = `<div class="bandana-strip"></div><div class="wrap header-inner">
    <a class="brand" href="#inicio" aria-label="Pelones Cantabria, inicio"><img src="assets/img/logo.jpg" alt=""><span class="brand-text"><b>pelones</b><i>Cantabria</i></span></a>
    <nav class="main-nav" id="main-nav" aria-label="Principal">${navLinks()}</nav>
    <div class="header-actions">
      <button class="mode-switch" id="to3d" title="Cambiar a la vista 3D">${icon('cube')}<span>Vista 3D</span></button>
      <button class="icon-btn cart-btn" id="cart-open" aria-label="Ver tu pedido">${icon('bag')}<span class="cart-count" id="cart-count" hidden>0</span></button>
      ${p ? `<a class="icon-btn" href="#${isStaff() ? 'admin' : 'cuenta'}" title="${isStaff() ? 'Panel de gestión' : 'Mi cuenta'}" aria-label="${isStaff() ? 'Panel de gestión' : 'Mi cuenta'}">${icon(isStaff() ? 'gear' : 'user')}</a>`
          : `<a class="icon-btn" href="#entrar" aria-label="Iniciar sesión" title="Iniciar sesión">${icon('user')}</a>`}
      <button class="icon-btn menu-toggle" id="menu-toggle" aria-label="Abrir menú" aria-expanded="false">${icon('menu')}</button>
    </div></div>`;
  $('#to3d').onclick = () => setMode('3d');
  $('#cart-open').onclick = () => toggleCart(true);
  const nav = $('#main-nav'), mt = $('#menu-toggle');
  mt.onclick = () => { const o = nav.classList.toggle('open'); mt.setAttribute('aria-expanded', o); mt.innerHTML = icon(o ? 'x' : 'menu'); };
  $$('a', nav).forEach(a => a.addEventListener('click', () => { nav.classList.remove('open'); mt.innerHTML = icon('menu'); }));
  updateCartBadge();
}

function socialLinks(cls = 'socials') {
  const s = S.settings;
  const items = [
    s.facebook && ['facebook', s.facebook, 'Facebook'], s.instagram && ['instagram', s.instagram, 'Instagram'],
    s.twitter && ['xsocial', s.twitter, 'X (Twitter)'], s.whatsapp && ['whatsapp', waLink(s.whatsapp, '¡Hola Pelones!'), 'WhatsApp'],
    s.contact_email && ['mail', 'mailto:' + s.contact_email, 'Correo'],
  ].filter(Boolean);
  return `<div class="${cls}">${items.map(([i, u, t]) => `<a href="${esc(safeUrl(u))}" target="_blank" rel="noopener" aria-label="${t}" title="${t}">${icon(i)}</a>`).join('')}</div>`;
}

function renderFooter() {
  const f = $('#site-footer'); if (!f) return;
  const s = S.settings;
  f.innerHTML = `<div class="bandana-strip"></div><div class="wrap">
    <div class="footer-grid">
      <div><a class="brand" href="#inicio"><img src="assets/img/logo.jpg" alt=""><span class="brand-text"><b>pelones</b><i>Cantabria</i></span></a>
        <p style="margin-top:14px;max-width:34ch">Asociación sin ánimo de lucro de Santander. Hacemos pelones a mano y todo lo recaudado va a proyectos de salud infantil.</p>${socialLinks()}</div>
      <div><h4>La asociación</h4><ul><li><a href="#conoce">Conoce Pelones</a></li><li><a href="#conoce" data-anchor="dinero">A dónde va el dinero</a></li><li><a href="#noticias">Noticias y agenda</a></li><li><a href="#colaboradores">Colaboradores</a></li><li><a href="#galeria">Galería</a></li></ul></div>
      <div><h4>Participa</h4><ul><li><a href="#tienda">Haz un pedido</a></li>${ROUTES.sorteos.when() ? '<li><a href="#sorteos">Sorteos</a></li>' : ''}<li><a href="#contacto">Hazte voluntario</a></li><li><a href="#colaboradores">Hazte patrocinador</a></li><li><a href="${esc(s.migranodearena || '#')}" target="_blank" rel="noopener">Mi Grano de Arena</a></li></ul></div>
      <div><h4>Contacto</h4><ul><li>${icon('pin')} ${esc(s.address || 'Santander, Cantabria')}</li>${s.contact_email ? `<li><a href="mailto:${esc(s.contact_email)}">${esc(s.contact_email)}</a></li>` : ''}${s.phone ? `<li>${esc(s.phone)}</li>` : ''}<li><a href="#contacto">Escríbenos</a></li><li><a href="#entrar">Acceso voluntarios</a></li></ul></div>
    </div>
    <div class="footer-bottom"><span>© ${new Date().getFullYear()} Asociación Pelones Cantabria</span><span><a href="#aviso-legal">Aviso legal</a> · <a href="#privacidad">Privacidad</a> · <a href="#cookies">Cookies</a></span></div>
    <div class="footer-hash" aria-hidden="true">#cadapeloncuenta #cadapeloncuenta</div></div>`;
  $$('[data-anchor]', f).forEach(a => a.addEventListener('click', () => { S.pendingAnchor = a.dataset.anchor; }));
}

// ---------------------------------------------------------------------
//  Router
// ---------------------------------------------------------------------
async function route() {
  let r = (location.hash || '#inicio').slice(1).split(/[?&]/)[0] || 'inicio';
  if (!ROUTES[r]) r = 'inicio';
  S.route = r;
  const def = ROUTES[r];
  document.title = (r === 'inicio' ? 'Pelones Cantabria · #cadapeloncuenta' : `${def.title} · Pelones Cantabria`);
  if (typeof cleanup === 'function') { try { cleanup(); } catch { /* */ } } cleanup = null;

  if (S.mode === '3d') {
    if (def.classicOnly) { setMode('classic'); return; }
    if (r === 'inicio') { S.world?.closePanel(); return; }
    const body = S.world?.openPanel(def.title, r);
    if (body) cleanup = await def.render(body, { inWorld: true });
    return;
  }
  $$('#main-nav a').forEach(a => a.classList.toggle('active', a.dataset.r === r));
  const app = $('#app');
  app.innerHTML = '';
  cleanup = await def.render(app, {});
  if (S.pendingAnchor) { const t = document.getElementById(S.pendingAnchor); S.pendingAnchor = null; if (t) { t.scrollIntoView(); return; } }
  window.scrollTo({ top: 0, behavior: 'instant' in window ? 'instant' : 'auto' });
}
export { route };

// ---------------------------------------------------------------------
//  Modo 3D ↔ clásico
// ---------------------------------------------------------------------
async function setMode(mode, remember = true) {
  if (remember) ls.set('pelones_mode', mode);
  $('.intro')?.remove();
  if (mode === '3d') {
    S.mode = '3d';
    document.body.style.overflow = 'hidden';
    let root = document.getElementById('world');
    if (!root) { root = document.createElement('div'); root.id = 'world'; root.className = 'world'; document.body.appendChild(root); }
    root.innerHTML = `<div class="world-loading"><div>${pelonSVG()}<h3>Preparando la isla pelona…</h3><p class="muted">Cargando el mundo 3D</p></div></div>`;
    try {
      const { startWorld } = await import('./world3d.js');
      if (S.mode !== '3d') { root.remove(); return; }
      S.world = await startWorld({
        onCart: () => toggleCart(true),
        onAccount: () => go(S.session ? (isStaff() ? 'admin' : 'cuenta') : 'entrar'),
        zones: Object.entries(ROUTES).filter(([k, r]) => r.nav && k !== 'inicio').map(([k, r]) => ({ key: k, title: r.title, visible: !r.when || r.when() })),
        onEnter: (k) => go(k),
        onClosePanel: () => { if (location.hash && location.hash !== '#inicio') history.replaceState(null, '', '#inicio'); S.route = 'inicio'; if (typeof cleanup === 'function') cleanup(); cleanup = null; },
        onExit: () => setMode('classic'),
        logo: 'assets/img/logo.jpg',
      });
      route();
    } catch (e) {
      console.error(e);
      document.getElementById('world')?.remove();
      S.mode = 'classic'; document.body.style.overflow = '';
      toast('Tu navegador no puede mostrar la vista 3D. Te enseñamos la web clásica.', 'err');
      ls.set('pelones_mode', 'classic'); route();
    }
  } else {
    S.mode = 'classic';
    S.world?.destroy(); S.world = null;
    document.body.style.overflow = '';
    route();
  }
}
export { setMode };

function showIntro() {
  const d = document.createElement('div'); d.className = 'intro'; d.setAttribute('role', 'dialog'); d.setAttribute('aria-label', 'Elige cómo ver la web');
  d.innerHTML = `<div class="intro-inner">
    <img class="intro-logo" src="assets/img/logo.jpg" alt="Pelones Cantabria">
    <h1>¡Hola! Bienvenido a <span style="color:var(--sky)">pelones</span> <span class="script">Cantabria</span></h1>
    <p>Pequeños gestos que cambian grandes historias. ¿Cómo quieres conocernos?</p>
    <div class="mode-cards">
      <button class="mode-card m3d" data-m="3d"><div class="mc-art">${scene3dArt()}</div><h3>Explora en 3D</h3><p>Lleva a un pelón por nuestra isla y visita cada rincón: la tienda, la galería, los sorteos…</p><span class="go">Entrar al mundo pelón ${icon('arrow')}</span></button>
      <button class="mode-card mweb" data-m="classic"><div class="mc-art">${webArt()}</div><h3>Web clásica</h3><p>Todo a un clic, rápida y cómoda. Ideal para el móvil o si vas con prisa.</p><span class="go">Ver la web ${icon('arrow')}</span></button>
    </div>
    <p class="skip">Puedes cambiar de vista cuando quieras desde el botón <b>Vista 3D</b> / <b>Vista web</b>.</p></div>`;
  document.body.appendChild(d);
  $$('[data-m]', d).forEach(b => b.onclick = () => { d.remove(); setMode(b.dataset.m); });
}
const scene3dArt = () => `<svg viewBox="0 0 300 150" width="100%" height="100%"><ellipse cx="150" cy="128" rx="120" ry="18" fill="#9ed9a9"/><g transform="translate(40 56)"><rect width="46" height="40" rx="6" fill="#ec4f8e"/><path d="M-6 2L23-20 52 2z" fill="#1d6fb8"/></g><g transform="translate(214 60)"><rect width="40" height="36" rx="6" fill="#ffb01f"/><path d="M-5 2L20-16 45 2z" fill="#26a9e0"/></g><g transform="translate(118 46) scale(.32)">${pelonSVG().replace(/<svg[^>]*>|<\/svg>/g, '')}</g><path d="M100 120q50-20 100 0" stroke="#fff" stroke-width="4" stroke-dasharray="8 8" fill="none"/></svg>`;
const webArt = () => `<svg viewBox="0 0 300 150" width="100%" height="100%"><rect x="40" y="18" width="220" height="118" rx="12" fill="#fff"/><rect x="40" y="18" width="220" height="12" rx="6" fill="#1d6fb8"/><rect x="56" y="44" width="90" height="12" rx="6" fill="#ec4f8e"/><rect x="56" y="64" width="70" height="8" rx="4" fill="#f9c6dc"/><rect x="56" y="80" width="80" height="8" rx="4" fill="#f9c6dc"/><rect x="56" y="100" width="54" height="18" rx="9" fill="#ffb01f"/><g transform="translate(168 40) scale(.4)">${pelonSVG({ band: '#ec4f8e', knot: '#1d6fb8' }).replace(/<svg[^>]*>|<\/svg>/g, '')}</g></svg>`;

// ---------------------------------------------------------------------
//  Cookies
// ---------------------------------------------------------------------
function maybeCookies() {
  if (ls.get('pelones_cookies')) return;
  const b = document.createElement('div'); b.className = 'cookie-bar'; b.setAttribute('role', 'dialog'); b.setAttribute('aria-label', 'Aviso de cookies');
  b.innerHTML = `<h4>${icon('cookie')} Solo cookies necesarias</h4><p>Usamos almacenamiento técnico para recordar tu sesión, tu pedido y la vista elegida. No usamos cookies de publicidad ni de seguimiento. <a href="#cookies">Más información</a>.</p><div class="actions"><button class="btn small" data-ok>Entendido</button><a class="btn ghost small" href="#cookies">Ver política</a></div>`;
  document.body.appendChild(b);
  $('[data-ok]', b).onclick = () => { ls.set('pelones_cookies', { necessary: true, at: Date.now() }); b.remove(); };
}

// ---------------------------------------------------------------------
//  Carrito
// ---------------------------------------------------------------------
function saveCart() { ls.set('pelones_cart', S.cart); updateCartBadge(true); renderCart(); }
function updateCartBadge(bump) {
  const c = $('#cart-count'); if (!c) return;
  const n = S.cart.reduce((a, b) => a + b.qty, 0);
  c.hidden = !n; c.textContent = n;
  if (bump) { c.classList.remove('bump'); void c.offsetWidth; c.classList.add('bump'); }
}
function addToCart(p) {
  const ex = S.cart.find(x => x.id === p.id);
  if (ex) ex.qty = Math.min(99, ex.qty + 1); else S.cart.push({ id: p.id, name: p.name, price: p.price, qty: 1, colors: p.colors, image_url: p.image_url });
  saveCart(); toast(`${p.name} añadido a tu pedido`, 'ok');
}
const thumb = (p) => p.image_url ? `<img src="${esc(safeUrl(p.image_url))}" alt="">` : productArt(p);
function cartTotal() { return S.cart.reduce((a, b) => a + (b.price || 0) * b.qty, 0); }
function renderCart() {
  const d = $('#cart'); if (!d) return;
  d.innerHTML = `<div class="drawer-head"><h3>Tu pedido</h3><button class="icon-btn" data-x aria-label="Cerrar">${icon('x')}</button></div>
  <div class="drawer-body">${S.cart.length ? S.cart.map((it, i) => `<div class="cart-line"><div class="thumb">${thumb(it)}</div><div><b>${esc(it.name)}</b><div class="muted" style="font-size:.9rem">${fmtMoney(it.price)}</div></div>
    <div class="qty"><button data-dec="${i}" aria-label="Quitar uno">−</button><b>${it.qty}</b><button data-inc="${i}" aria-label="Añadir uno">+</button></div></div>`).join('')
    : `<div class="empty">${pelonSVG({ mood: 'wow' })}<p><b>Tu pedido está vacío.</b><br>Hay muchos pelones esperando casa.</p><a class="btn small" href="#tienda" data-x>Ver la tienda</a></div>`}</div>
  ${S.cart.length ? `<div class="drawer-foot"><div class="total-row"><span>Total</span><span>${fmtMoney(cartTotal())}</span></div>
    <p class="muted" style="font-size:.85rem;margin:0">No cobramos online. Te escribimos para acordar el pago y la entrega o el envío.</p>
    <button class="btn" data-checkout>${icon('heart')} Enviar pedido</button></div>` : ''}`;
  $$('[data-x]', d).forEach(b => b.onclick = () => toggleCart(false));
  $$('[data-inc]', d).forEach(b => b.onclick = () => { S.cart[b.dataset.inc].qty = Math.min(99, S.cart[b.dataset.inc].qty + 1); saveCart(); });
  $$('[data-dec]', d).forEach(b => b.onclick = () => { const it = S.cart[b.dataset.dec]; it.qty--; if (it.qty <= 0) S.cart.splice(b.dataset.dec, 1); saveCart(); });
  const co = $('[data-checkout]', d); if (co) co.onclick = () => { toggleCart(false); checkout(); };
}
function toggleCart(open) {
  renderCart();
  $('#cart').classList.toggle('open', open); $('#cart-bd').classList.toggle('open', open);
  $('#cart').setAttribute('aria-hidden', !open);
  if (open) setTimeout(() => $('#cart [data-x]')?.focus(), 50);
}
export { toggleCart };

function checkout() {
  const p = S.session?.profile || {};
  const m = openModal(`${modalHead('Datos del pedido')}
  <form class="form" novalidate>
    <div class="row"><div class="field"><label for="o-name">Nombre y apellidos</label><input id="o-name" name="name" required value="${esc(p.full_name || '')}" autocomplete="name"></div>
    <div class="field"><label for="o-phone">Teléfono</label><input id="o-phone" name="phone" type="tel" value="${esc(p.phone || '')}" autocomplete="tel"></div></div>
    <div class="field"><label for="o-email">Correo electrónico</label><input id="o-email" name="email" type="email" required value="${esc(S.session?.user?.email || '')}" autocomplete="email"></div>
    <div class="field"><label for="o-del">Entrega</label><select id="o-del" name="delivery"><option value="recogida">Recogida en mano (Santander y alrededores)</option><option value="envio">Envío a domicilio (toda España)</option></select></div>
    <div class="field" id="o-addr-f" hidden><label for="o-addr">Dirección de envío</label><textarea id="o-addr" name="address" rows="2" style="min-height:70px" autocomplete="street-address"></textarea></div>
    <div class="field"><label for="o-notes">¿Algo más? (colores, personalización, fecha…)</label><textarea id="o-notes" name="notes" rows="3" style="min-height:80px"></textarea></div>
    <fieldset class="pay-methods"><legend>¿Cómo quieres pagar?</legend>${payOptions().map((o, i) => `<label class="pay-opt ${o.on ? '' : 'off'}"><input type="radio" name="payment_method" value="${o.k}" ${o.on ? '' : 'disabled'} ${i === firstPay() ? 'checked' : ''}><span class="pay-ico">${icon(o.i)}</span><span><b>${o.t}</b><small>${o.on ? o.d : 'Próximamente'}</small></span></label>`).join('')}</fieldset>
    <label class="check"><input type="checkbox" name="ok" id="o-ok" required> <span>He leído la <a href="#privacidad" target="_blank">política de privacidad</a> y acepto que usemos mis datos para gestionar el pedido.</span></label>
    <div class="form-msg err" hidden></div>
    <div class="modal-actions"><button type="button" class="btn ghost small" data-close>Volver</button><button class="btn" type="submit">${icon('heart')} Confirmar pedido · ${fmtMoney(cartTotal())}</button></div>
  </form>`);
  const f = $('form', m.el), sel = $('#o-del', f);
  sel.onchange = () => { $('#o-addr-f', f).hidden = sel.value !== 'envio'; };
  f.onsubmit = async (e) => {
    e.preventDefault();
    const d = formData(f), msg = $('.form-msg', f), btn = $('[type=submit]', f);
    msg.hidden = true;
    const err = !d.name || d.name.trim().length < 2 ? 'Escribe tu nombre.' : !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(d.email || '') ? 'Escribe un correo válido para poder contestarte.' : d.delivery === 'envio' && !d.address?.trim() ? 'Falta la dirección de envío.' : !d.ok ? 'Necesitamos que aceptes la política de privacidad.' : '';
    if (err) { msg.textContent = err; msg.hidden = false; return; }
    busy(btn, true, 'Enviando…');
    try {
      const res = await S.api.orders.create({ ...d, items: S.cart });
      const lines = S.cart.map(i => `• ${i.qty} × ${i.name}`).join('\n');
      S.cart = []; saveCart(); m.close(); confetti();
      const wa = S.settings.whatsapp;
      openModal(`${modalHead('¡Pedido recibido!')}<div style="text-align:center"><div style="width:130px;margin:0 auto">${pelonSVG({ wink: true })}</div>
        <p class="lead" style="margin-inline:auto">Gracias, ${esc(d.name.split(' ')[0])}. Tu código de pedido es</p><p class="drum" style="padding:0 0 10px">${esc(res.code)}</p>
        ${payInstructions(d.payment_method, res.code, res.total)}
        <p>Te escribiremos a <b>${esc(d.email)}</b> para confirmar la ${d.delivery === 'envio' ? 'fecha de envío' : 'recogida'}.</p>
        ${wa ? `<a class="btn blue" target="_blank" rel="noopener" href="${waLink(wa, `¡Hola Pelones! Acabo de hacer el pedido ${res.code} en la web:\n${lines}\nNombre: ${d.name}`)}">${icon('whatsapp')} Avisar también por WhatsApp</a>` : ''}
        </div><div class="modal-actions"><button class="btn ghost small" data-close>Cerrar</button></div>`);
    } catch (e2) { msg.textContent = e2.message; msg.hidden = false; }
    finally { busy(btn, false); }
  };
}

// ---------------------------------------------------------------------
//  Métodos de pago (se activan desde Panel → Ajustes → Pagos)
// ---------------------------------------------------------------------
function payOptions() {
  const s = S.settings;
  return [
    { k: 'en_mano', i: 'hands', t: 'En mano', d: 'Pagas al recoger o al recibir el pedido', on: s.pay_cash !== false },
    { k: 'bizum', i: 'phone', t: 'Bizum', d: 'Al número de la asociación', on: !!s.pay_bizum },
    { k: 'transferencia', i: 'euro', t: 'Transferencia', d: 'A la cuenta de la asociación', on: !!s.pay_iban },
    { k: 'tarjeta', i: 'lock', t: 'Tarjeta online', d: 'Pago seguro con tarjeta', on: !!s.pay_card_url },
  ];
}
const firstPay = () => Math.max(0, payOptions().findIndex(o => o.on));
function payInstructions(method, code, total) {
  const s = S.settings, amount = fmtMoney(total);
  const copy = (v) => `<button type="button" class="btn tiny ghost" onclick="navigator.clipboard?.writeText('${esc(v).replace(/'/g, '')}').then(()=>this.textContent='Copiado').catch(()=>{})">Copiar</button>`;
  if (method === 'bizum') return `<div class="pay-box"><b>Paga ${amount} por Bizum</b><p>Envía el Bizum al <b class="mono-t">${esc(s.pay_bizum)}</b> ${copy(s.pay_bizum)}<br>Concepto: <b class="mono-t">Pedido ${esc(code)}</b></p></div>`;
  if (method === 'transferencia') return `<div class="pay-box"><b>Paga ${amount} por transferencia</b><p>IBAN: <b class="mono-t">${esc(s.pay_iban)}</b> ${copy(s.pay_iban)}<br>Titular: ${esc(s.pay_holder || 'Asociación Pelones Cantabria')}<br>Concepto: <b class="mono-t">Pedido ${esc(code)}</b></p></div>`;
  if (method === 'tarjeta') { const u = String(s.pay_card_url); const link = u + (u.includes('?') ? '&' : '?') + 'client_reference_id=' + encodeURIComponent(code); return `<div class="pay-box"><b>Paga ${amount} con tarjeta</b><p>Te llevamos a la pasarela segura. Indica el código <b class="mono-t">${esc(code)}</b> si te lo pide.</p><a class="btn blue" href="${esc(safeUrl(link))}" target="_blank" rel="noopener">${icon('lock')} Pagar ahora</a></div>`; }
  return `<p>Total: <b>${amount}</b>. Lo pagas en mano al recoger o recibir tu pedido.</p>`;
}
function donateBlock() {
  const s = S.settings, any = s.pay_bizum || s.pay_iban || s.pay_card_url;
  return `<div class="card donate" id="donar"><div class="donate-art">${pelonSVG({ ...THEMES.corazones, wink: true })}</div><div style="min-width:0"><span class="eyebrow">Donativos</span><h2>Haz un donativo</h2>
    <p class="muted">Todo lo que donas va a los mismos proyectos que los pelones: investigación, aula hospitalaria, Doctores Sonrisa y campamentos.</p>
    <div class="pay-grid">
      <div class="pay-box ${s.pay_bizum ? '' : 'off'}">${icon('phone')}<b>Bizum</b>${s.pay_bizum ? `<p class="mono-t">${esc(s.pay_bizum)}</p><small>Concepto: Donativo</small>` : '<small>Próximamente</small>'}</div>
      <div class="pay-box ${s.pay_iban ? '' : 'off'}">${icon('euro')}<b>Transferencia</b>${s.pay_iban ? `<p class="mono-t">${esc(s.pay_iban)}</p><small>${esc(s.pay_holder || '')}</small>` : '<small>Próximamente</small>'}</div>
      <div class="pay-box ${s.pay_card_url ? '' : 'off'}">${icon('lock')}<b>Tarjeta</b>${s.pay_card_url ? `<a class="btn small blue" href="${esc(safeUrl(s.pay_card_url))}" target="_blank" rel="noopener">Donar online</a>` : '<small>Próximamente</small>'}</div>
    </div>${any ? '' : '<p class="muted" style="margin:12px 0 0;font-size:.92rem">Mientras activamos los pagos online, puedes colaborar en nuestros puestos o <a href="#contacto">escribirnos</a>.</p>'}</div></div>`;
}

// ---------------------------------------------------------------------
//  Bloques reutilizables
// ---------------------------------------------------------------------
const pageHero = (eyebrow, title, lead, deco = pelonSVG()) => `<section class="page-hero"><div class="wrap"><span class="eyebrow">${eyebrow}</span><h1>${title}</h1>${lead ? `<p class="lead">${lead}</p>` : ''}</div><div class="deco" aria-hidden="true">${deco}</div></section>`;
const productCard = (p) => `<article class="card product">
  <div class="p-media">${p.image_url ? `<img class="photo" src="${esc(safeUrl(p.image_url))}" alt="${esc(p.name)}" loading="lazy">` : productArt(p)}
    <div class="p-badges">${p.featured ? '<span class="tag pink">Favorito</span>' : ''}${p.stock === 'bajo_pedido' ? '<span class="tag sun">Bajo pedido</span>' : ''}${p.stock === 'agotado' ? '<span class="tag bad">Agotado</span>' : ''}</div></div>
  <div class="p-body"><span class="tag">${esc(p.category)}</span><h3>${esc(p.name)}</h3><p>${esc(p.description)}</p>
    <div class="p-foot"><span class="price">${fmtMoney(p.price)}${p.price != null ? ' <small>/ud.</small>' : ''}</span>
    ${p.stock === 'agotado' ? '<button class="btn small ghost" disabled>Agotado</button>' : p.price == null ? `<a class="btn small blue" href="#contacto" data-ask="${esc(p.name)}">Pedir info</a>` : `<button class="btn small" data-add="${esc(p.id)}">${icon('plus')} Añadir</button>`}</div></div></article>`;
function bindProducts(root, list) {
  $$('[data-add]', root).forEach(b => b.onclick = () => { const p = list.find(x => x.id === b.dataset.add); if (p) addToCart(p); });
  $$('[data-ask]', root).forEach(a => a.addEventListener('click', () => { S.prefill = { subject: 'pedido', message: `Hola, me gustaría información sobre "${a.dataset.ask}".` }; }));
}
const newsCard = (n) => `<article class="card news-card">${n.image_url ? `<img src="${esc(safeUrl(n.image_url))}" alt="" loading="lazy">` : ''}
  <div class="n-top"><span class="tag ${n.kind === 'logro' ? 'pink' : n.kind === 'evento' ? 'sun' : ''}">${n.kind === 'logro' ? 'Logro' : n.kind === 'evento' ? 'Evento' : 'Noticia'}</span><span class="n-date">${icon('calendar')} ${fmtDate(n.event_date || n.created_at)}</span></div>
  <div class="n-body"><h3>${esc(n.title)}</h3><p>${esc(n.excerpt)}</p>
  <div class="n-foot"><span class="muted">${n.location ? icon('pin') + ' ' + esc(n.location) : ''}</span>${n.body ? `<button class="btn tiny ghost" data-read="${esc(n.id)}">Leer más</button>` : n.link ? `<a href="${esc(safeUrl(n.link))}" target="_blank" rel="noopener">Ver fuente ${icon('link', 'icon')}</a>` : ''}</div></div></article>`;
function bindNews(root, list) {
  $$('[data-read]', root).forEach(b => b.onclick = () => {
    const n = list.find(x => x.id === b.dataset.read); if (!n) return;
    openModal(`${modalHead(esc(n.title))}${n.image_url ? `<img src="${esc(safeUrl(n.image_url))}" alt="" style="border-radius:18px;margin-bottom:14px">` : ''}<p class="muted">${fmtDate(n.event_date || n.created_at)}${n.location ? ' · ' + esc(n.location) : ''}</p>${esc(n.body).split(/\n{2,}/).map(p => `<p>${p.replace(/\n/g, '<br>')}</p>`).join('')}${n.link ? `<p><a href="${esc(safeUrl(n.link))}" target="_blank" rel="noopener">Más información</a></p>` : ''}`, { wide: true });
  });
}

// ---------------------------------------------------------------------
//  INICIO
// ---------------------------------------------------------------------
async function viewHome(el) {
  el.innerHTML = `
  <section class="hero"><div class="wrap hero-grid">
    <div class="reveal">
      <span class="eyebrow">Asociación sin ánimo de lucro · Santander</span>
      <h1><span class="hash">#cada<b>pelon</b>cuenta</span><span class="script">Pequeños gestos que cambian grandes historias</span></h1>
      <p class="lead">Hacemos a mano muñecos con gorrito, como los que llevan los niños y niñas que pierden el pelo con la quimioterapia. Todo lo que recaudamos va a proyectos de salud infantil en Cantabria.</p>
      <div class="hero-cta"><a class="btn" href="#tienda">${icon('heart')} Adopta un pelón</a><a class="btn ghost" href="#conoce">Conoce la causa ${icon('arrow')}</a></div>
      <ul class="hero-values">${VALUES.map(v => `<li><span>${icon(v.i)}</span>${v.k}</li>`).join('')}</ul>
    </div>
    <div class="hero-stage" aria-hidden="true"><div class="halo"></div><div class="ring"></div>
      <div class="big-pelon">${pelonSVG()}</div>
      <div class="orbit o1">${pelonSVG(THEMES.racing)}</div><div class="orbit o2">${pelonSVG({ ...THEMES.navidad, wink: true })}</div><div class="orbit o3">${pelonSVG(THEMES.espana)}</div>
      <div class="sticker s1">100% a mano<small>uno a uno, con cariño</small></div>
      <div class="sticker s2">Desde Santander<small>con envíos a toda España</small></div>
    </div></div></section>
  <div class="marquee" aria-hidden="true"><div class="marquee-track">${'<span>#cadapeloncuenta</span><span>Solidaridad</span><span>Esperanza</span><span>Apoyo</span><span>Unión</span>'.repeat(4)}</div></div>

  <section class="section"><div class="wrap">
    <div class="section-head"><div><span class="eyebrow">Qué hacemos</span><h2>Un muñeco que se parece a ellos</h2><p class="lead">Cuando un niño pierde el pelo, un juguete con su mismo pañuelo le dice que no es diferente. Y cada pelón que alguien se lleva a casa se convierte en ayuda real.</p></div></div>
    <div class="grid c4">${WHAT_WE_DO.map(f => `<div class="card feature"><div class="f-icon">${icon(f.i)}</div><h3>${f.t}</h3><p>${f.d}</p></div>`).join('')}</div>
  </div></section>

  <section class="section" style="padding-top:0"><div class="wrap">
    <div class="section-head" style="margin-bottom:18px"><div><span class="eyebrow">La familia pelona</span><h2>Hay un pelón para cada persona</h2><p class="lead">Del Racing, de la Selección, navideños, de lunares, superhéroes… Desliza y elige el tuyo.</p></div></div>
    <div class="family-strip">${Object.values(THEMES).map(t => `<a href="#tienda"><div>${pelonSVG(t)}</div>${esc(t.name)}</a>`).join('')}</div>
  </div></section>

  <section class="section tint">${wave('#ffffff')}<div class="wrap">
    <div class="section-head"><div><span class="eyebrow">Tienda solidaria</span><h2>Pelones esperando casa</h2><p class="lead">Elige los tuyos, mándanos el pedido y te escribimos para la entrega.</p></div><a class="btn blue" href="#tienda">Ver todos ${icon('arrow')}</a></div>
    <div class="grid c4" id="home-products"><div class="muted">Cargando pelones…</div></div>
  </div></section>

  <section class="section blue">${wave('#1d6fb8')}<div class="wrap">
    <div class="section-head"><div><span class="eyebrow" style="color:var(--sun)">Transparencia</span><h2>Lo que recaudamos llega a los niños</h2><p class="lead">Nos autofinanciamos y funcionamos con voluntariado. Nadie cobra por hacer pelones.</p></div><a class="btn sun" href="#conoce" data-anchor="dinero">A dónde va el dinero ${icon('arrow')}</a></div>
    <div class="stats"><div class="stat"><b>+20</b><span>voluntarios</span></div><div class="stat"><b>100%</b><span>de lo recaudado a la causa</span></div><div class="stat"><b>2015</b><span>haciendo pelones</span></div><div class="stat"><b>5</b><span>grandes destinos de ayuda</span></div></div>
  </div></section>

  <section class="section"><div class="wrap" id="home-raffle"></div><div class="wrap">
    <div class="section-head"><div><span class="eyebrow">Noticias y logros</span><h2>Lo último de la familia pelona</h2></div><a class="btn ghost" href="#noticias">Ver todo ${icon('arrow')}</a></div>
    <div class="grid c3" id="home-news"><div class="muted">Cargando noticias…</div></div>
  </div></section>

  <section class="section tint">${wave('#ffffff')}<div class="wrap">
    <div class="section-head"><div><span class="eyebrow">Gracias</span><h2>Nos acompañan</h2></div><a class="btn ghost" href="#colaboradores">Todos los colaboradores ${icon('arrow')}</a></div>
    <div class="logo-wall" id="home-partners"></div>
  </div></section>

  <section class="section" style="padding-bottom:0"><div class="wrap">
    <div class="section-head"><div><span class="eyebrow">Súmate</span><h2>Cómo puedes ayudar</h2></div><a class="btn ghost" href="#conoce" data-anchor="donar">Hacer un donativo ${icon('arrow')}</a></div>
    <div class="grid c3">${HOW_TO_HELP.map(h => `<div class="card feature"><div class="f-icon">${icon(h.i)}</div><h3>${h.t}</h3><p>${h.d}</p></div>`).join('')}</div>
  </div></section>

  <section class="section"><div class="wrap"><div class="card" style="display:grid;grid-template-columns:minmax(0,1fr) auto;gap:24px;align-items:center;background:var(--pink);color:#fff;padding:clamp(26px,5vw,48px)">
    <div><h2 style="color:#fff">¿Te unes a la familia pelona?</h2><p style="font-size:1.1rem;margin:0;max-width:56ch">Haz voluntariado, organiza un evento en tu cole, club o empresa, o simplemente compártenos. Cada gesto cuenta.</p></div>
    <div style="display:flex;gap:12px;flex-wrap:wrap"><a class="btn sun" href="#contacto">Quiero ayudar</a><a class="btn ghost" href="#tienda">Hacer un pedido</a></div>
  </div></div></section>`;
  $$('[data-anchor]', el).forEach(a => a.addEventListener('click', () => { S.pendingAnchor = a.dataset.anchor; }));
  const [products, news, raffles] = await Promise.all([S.api.products.list().catch(() => []), S.api.news.list().catch(() => []), ROUTES.sorteos.when() ? S.api.raffles.list().catch(() => []) : []]);
  const hp = $('#home-products', el); if (!hp) return;
  const feat = products.filter(p => p.featured).concat(products.filter(p => !p.featured)).slice(0, 4);
  hp.innerHTML = feat.map(productCard).join('') || '<p class="muted">Pronto subiremos nuestros pelones.</p>'; bindProducts(hp, feat);
  const hn = $('#home-news', el); const latest = news.slice(0, 3); hn.innerHTML = latest.map(newsCard).join('') || '<p class="muted">Pronto contaremos novedades.</p>'; bindNews(hn, latest);
  S.api.partners.list().then(ps => { const hpw = $('#home-partners', el); if (hpw) hpw.innerHTML = ps.slice(0, 10).map(partnerTile).join(''); }).catch(() => {});
  const open = raffles.find(r => r.status === 'venta') || raffles[0];
  if (open && S.settings.raffles_enabled) $('#home-raffle', el).innerHTML = `<div class="card" style="display:flex;flex-wrap:wrap;gap:20px;align-items:center;justify-content:space-between;margin-bottom:60px;border:3px dashed var(--pink)"><div style="min-width:0"><span class="live"><i></i> Sorteo en marcha</span><h3 style="margin-top:10px">${esc(open.title)}</h3><p class="muted" style="margin:0">${open.draw_date ? 'Sorteo el ' + fmtDate(open.draw_date) + '. ' : ''}Mira en directo qué números quedan libres.</p></div><a class="btn" href="#sorteos">${icon('ticket')} Ver números</a></div>`;
}
const initials = (n) => String(n).replace(/^(Ayto\.|Fundación|Peña|Real|Asociación)\s+/i, '').split(/\s+/).slice(0, 2).map(w => w[0]).join('').toUpperCase();
const partnerTile = (p) => `<${p.url ? `a href="${esc(safeUrl(p.url))}" target="_blank" rel="noopener"` : 'div'} class="partner">${p.logo_url ? `<span class="logo"><img src="${esc(safeUrl(p.logo_url))}" alt="Logo de ${esc(p.name)}" loading="lazy"></span>` : `<span class="mono" style="background:${esc(p.color || '#ec4f8e')}">${esc(initials(p.name))}</span>`}<b>${esc(p.name)}</b><small>${esc(p.description)}</small></${p.url ? 'a' : 'div'}>`;

// ---------------------------------------------------------------------
//  CONOCE PELONES
// ---------------------------------------------------------------------
function viewAbout(el) {
  el.innerHTML = `${pageHero('Conoce Pelones', 'Hacemos pelones para que ningún niño se sienta diferente', 'Pelones Cantabria es una asociación sin ánimo de lucro de Santander, presidida por Beatriz Gandarillas, que colabora con proyectos de salud infantil, sobre todo en Cantabria.')}
  <section class="section" style="padding-top:20px"><div class="wrap grid c2" style="align-items:center">
    <div><span class="eyebrow">Nuestra historia</span><h2>¿Qué es un pelón?</h2>
      <p>"Pelones" es el nombre cariñoso que reciben los niños y niñas que, durante la quimioterapia, pierden el pelo y se cubren la cabeza con un gorrito o un pañuelo.</p>
      <p>A principios de 2015, cuatro amigas de Santander empezaron a recortar goma eva en su tiempo libre para hacer imanes y muñequitos con ese mismo gorrito. La idea era sencilla: que esos niños se vieran en un juguete que se parece a ellos y, de paso, reunir ayuda para ellos.</p><p>Los pelones gustaron tanto que en 2016 los broches se agotaban y había lista de espera. Panaderías, peluquerías, colegios, peñas y clubes empezaron a venderlos y a organizar eventos a beneficio de la asociación.</p>
      <p>Hoy somos más de 20 voluntarios, con Beatriz Gandarillas como presidenta. Vendemos pelones, broches, imanes, llaveros, pulseras, lápices y calendarios, y lo recaudado se entrega íntegro a proyectos que mejoran la vida de niños enfermos y de sus familias.</p>
      <div style="display:flex;gap:12px;flex-wrap:wrap;margin-top:18px"><a class="btn" href="#tienda">Ver los pelones</a><a class="btn ghost" href="#contacto">Hazte voluntario</a></div></div>
    <div class="card" style="padding:14px;transform:rotate(1.5deg)"><img src="assets/img/cartel.jpg" alt="Cartel de la campaña #cadapeloncuenta: pequeños gestos que cambian grandes historias. Solidaridad, esperanza, apoyo y unión." style="border-radius:20px;width:100%"></div>
  </div></section>

  <section class="section tint">${wave()}<div class="wrap">
    <div class="section-head"><div><span class="eyebrow">Nuestros valores</span><h2>Lo que nos mueve</h2></div></div>
    <div class="grid c4">${[['heart', 'Solidaridad', 'Hacemos cada pelón pensando en un niño concreto y en su familia.'], ['smile', 'Esperanza', 'Un juguete puede arrancar una sonrisa en el peor día de hospital.'], ['hands', 'Apoyo', 'Acompañamos a las entidades que trabajan cada día junto a los niños.'], ['star', 'Unión', 'Colegios, peñas, clubes y empresas: juntos llegamos más lejos.']].map(([i, t, d]) => `<div class="card feature"><div class="f-icon">${icon(i)}</div><h3>${t}</h3><p>${d}</p></div>`).join('')}</div>
  </div></section>

  <section class="section"><div class="wrap">
    <div class="section-head"><div><span class="eyebrow">Hecho a mano</span><h2>Cómo nace un pelón</h2><p class="lead">Cada pelón pasa por varias manos antes de llegar a la tuya. Por eso no hay dos iguales.</p></div></div>
    <div class="money-flow">${MAKING.map(s2 => `<div class="money-step"><div class="bubble">${icon(s2.i)}</div><h3>${s2.t}</h3><p class="muted">${s2.d}</p></div>`).join('')}</div>
    <h3 style="margin:40px 0 16px">La familia pelona</h3>
    <div class="family-strip">${Object.values(THEMES).map(t => `<a href="#tienda"><div>${pelonSVG(t)}</div>${esc(t.name)}</a>`).join('')}</div>
  </div></section>

  <section class="section tint" id="dinero">${wave()}<div class="wrap">
    <div class="section-head"><div><span class="eyebrow">Transparencia</span><h2>A dónde va el dinero</h2><p class="lead">Pelones se autofinancia y funciona con voluntariado. No tenemos sueldos: lo que se recauda con los pelones y los eventos se entrega a proyectos de salud infantil.</p></div></div>
    <div class="money-flow">${MONEY_FLOW.map(s => `<div class="money-step"><div class="bubble">${icon(s.i)}</div><h3>${s.t}</h3><p class="muted">${s.d}</p></div>`).join('')}</div>
    <h3 style="margin:50px 0 18px">Proyectos y entidades que hemos apoyado</h3>
    <div class="dest-list">${DESTINATIONS.map(d => `<div class="dest"><div class="d-ico">${icon(d.i)}</div><div><h4>${d.t}</h4><p>${d.d}</p></div></div>`).join('')}</div>
    <div class="card flat" style="margin-top:22px"><h3 style="margin-bottom:6px">Nuestro compromiso de transparencia</h3><ul class="muted" style="margin:0;padding-left:20px"><li>No hay sueldos: todo el trabajo es voluntario.</li><li>Los materiales se cubren aparte; lo recaudado se destina a la causa.</li><li>Publicamos cada entrega y cada proyecto en Noticias y en nuestras redes.</li><li>Si quieres saber a qué se ha destinado tu aportación, escríbenos y te lo contamos.</li></ul></div>
    <div style="margin-top:30px">${donateBlock()}</div>
  </div></section>

  <section class="section tint">${wave()}<div class="wrap grid c2" style="gap:50px">
    <div><span class="eyebrow">Nuestro camino</span><h2>Algunos momentos que nos han traído hasta aquí</h2>
      <div class="timeline" style="margin-top:30px">${TIMELINE.map(t => `<div class="tl-item"><div class="year">${t.y}</div><h4>${t.t}</h4><p>${t.d}</p></div>`).join('')}</div></div>
    <div><span class="eyebrow">Preguntas frecuentes</span><h2>Lo que más nos preguntáis</h2>
      <div style="display:grid;gap:12px;margin-top:30px">${FAQ.map(f => `<details class="card flat" style="padding:18px 22px"><summary style="cursor:pointer;font:800 1.1rem/1.3 var(--f-display)">${f.q}</summary><p style="margin:12px 0 0" class="muted">${f.a}</p></details>`).join('')}</div></div>
  </div></section>

  <section class="section"><div class="wrap">
    <div class="section-head"><div><span class="eyebrow">Súmate</span><h2>Cómo puedes ayudar</h2></div></div>
    <div class="grid c3">${HOW_TO_HELP.map(h => `<div class="card feature"><div class="f-icon">${icon(h.i)}</div><h3>${h.t}</h3><p>${h.d}</p></div>`).join('')}</div>
  </div></section>

  <section class="section tint">${wave()}<div class="wrap">
    <div class="section-head"><div><span class="eyebrow">En los medios</span><h2>Han hablado de nosotros</h2></div></div>
    <div class="press">${PRESS.map(n => `<a href="${esc(n.u)}" target="_blank" rel="noopener"><span class="yr">${n.y}</span><span><small>${esc(n.m)}</small>${esc(n.t)}</span>${icon('arrow')}</a>`).join('')}</div>
</div></section>`;
}

// ---------------------------------------------------------------------
//  TIENDA / PEDIDOS
// ---------------------------------------------------------------------
async function viewShop(el) {
  el.innerHTML = `${pageHero('Pedidos', 'Adopta un pelón', 'Todo está hecho a mano por voluntarios. Añade a tu pedido lo que quieras y te escribimos para cerrar pago y entrega. Hacemos envíos a toda España.', pelonSVG(PALETTES[2]))}
  <section class="section" style="padding-top:10px"><div class="wrap">
    <div class="shop-toolbar"><div id="cats" style="display:flex;gap:8px;flex-wrap:wrap"></div><label class="search">${icon('search')}<span class="sr-only">Buscar</span><input id="q" type="search" placeholder="Buscar: llavero, broche, rosa…"></label></div>
    <div class="grid c3" id="plist"><div class="muted">Cargando…</div></div>
  </div></section>
  <section class="section tint">${wave()}<div class="wrap">
    <div class="section-head"><div><span class="eyebrow">Cómo funciona</span><h2>Tu pedido en 4 pasos</h2></div><button class="btn" id="open-cart">${icon('bag')} Ver mi pedido</button></div>
    <div class="money-flow">${[['bag', 'Elige', 'Añade pelones, broches o llaveros a tu pedido.'], ['mail', 'Envía', 'Déjanos tus datos. No pagas nada en la web.'], ['phone', 'Te escribimos', 'Acordamos el pago (Bizum o transferencia) y la entrega.'], ['heart', 'Recíbelo', 'En mano en Santander o por envío a toda España.']].map(([i, t, d]) => `<div class="money-step"><div class="bubble">${icon(i)}</div><h3>${t}</h3><p class="muted">${d}</p></div>`).join('')}</div>
    <div class="card flat" style="margin-top:30px;display:flex;gap:16px;align-items:center;flex-wrap:wrap"><div style="flex:1;min-width:220px"><h3 style="margin:0">¿Bodas, comuniones o empresas?</h3><p class="muted" style="margin:0">Preparamos pelones personalizados como detalle solidario para tu evento.</p></div><a class="btn blue" href="#contacto" id="ask-event">Pide presupuesto</a></div>
  </div></section>`;
  $('#open-cart', el).onclick = () => toggleCart(true);
  $('#ask-event', el).addEventListener('click', () => { S.prefill = { subject: 'pedido', message: 'Hola, me gustaría encargar pelones personalizados para un evento. Fecha aproximada: … Cantidad: …' }; });
  const all = await S.api.products.list().catch(() => []);
  const cats = ['todos', ...new Set(all.map(p => p.category))];
  let cat = 'todos', q = '';
  const draw = () => {
    const list = all.filter(p => (cat === 'todos' || p.category === cat) && (!q || (p.name + ' ' + p.description).toLowerCase().includes(q)));
    const box = $('#plist', el); if (!box) return;
    box.innerHTML = list.map(productCard).join('') || `<div class="empty" style="grid-column:1/-1">${pelonSVG({ mood: 'wow' })}<p>No encontramos nada con "${esc(q)}".</p></div>`;
    bindProducts(box, list);
  };
  $('#cats', el).innerHTML = cats.map(c => `<button class="chip ${c === cat ? 'on' : ''}" data-c="${esc(c)}">${c === 'todos' ? 'Todo' : esc(c[0].toUpperCase() + c.slice(1))}</button>`).join('');
  $$('#cats .chip', el).forEach(b => b.onclick = () => { cat = b.dataset.c; $$('#cats .chip', el).forEach(x => x.classList.toggle('on', x === b)); draw(); });
  $('#q', el).oninput = (e) => { q = e.target.value.trim().toLowerCase(); draw(); };
  draw();
}

// ---------------------------------------------------------------------
//  GALERÍA
// ---------------------------------------------------------------------
async function viewGallery(el) {
  el.innerHTML = `${pageHero('Galería', 'Momentos pelones', 'Mercadillos, talleres, entregas y la gran familia de muñecos que sale cada semana de nuestras manos.', pelonSVG(PALETTES[4]))}
  <section class="section" style="padding-top:10px"><div class="wrap"><div class="shop-toolbar" id="gcats"></div><div class="masonry" id="gal"></div></div></section>`;
  const photos = await S.api.gallery.list().catch(() => []);
  const family = Object.entries(THEMES).map(([k, t]) => ({ id: 'art-' + k, title: t.name, category: 'familia pelona', art: t }));
  const items = [...photos, ...family];
  const cats = ['todo', ...new Set(items.map(i => i.category))];
  let cat = 'todo';
  const draw = () => {
    const list = items.filter(i => cat === 'todo' || i.category === cat);
    $('#gal', el).innerHTML = list.map((it, idx) => `<figure data-i="${idx}" tabindex="0" role="button" aria-label="Ampliar: ${esc(it.title)}">${it.art ? `<div class="art" style="background:${idx % 2 ? 'var(--sky-100)' : 'var(--pink-100)'}">${pelonSVG(it.art)}</div>` : `<img src="${esc(safeUrl(it.image_url))}" alt="${esc(it.title)}" loading="lazy">`}<figcaption><span>${esc(it.title)}</span><span class="tag">${esc(it.category)}</span></figcaption></figure>`).join('');
    $$('#gal figure', el).forEach(f => { const open = () => lightbox(list, +f.dataset.i); f.onclick = open; f.onkeydown = (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); } }; });
  };
  $('#gcats', el).innerHTML = cats.map(c => `<button class="chip ${c === cat ? 'on' : ''}" data-c="${esc(c)}">${esc(c[0].toUpperCase() + c.slice(1))}</button>`).join('');
  $$('#gcats .chip', el).forEach(b => b.onclick = () => { cat = b.dataset.c; $$('#gcats .chip', el).forEach(x => x.classList.toggle('on', x === b)); draw(); });
  draw();
}
function lightbox(list, i) {
  const lb = document.createElement('div'); lb.className = 'lightbox'; lb.setAttribute('role', 'dialog'); lb.setAttribute('aria-modal', 'true');
  const show = () => { const it = list[i]; lb.innerHTML = `<div>${it.art ? `<div class="art">${pelonSVG(it.art)}</div>` : `<img src="${esc(safeUrl(it.image_url))}" alt="${esc(it.title)}">`}<p>${esc(it.title)}</p></div>
    <button class="icon-btn" data-x aria-label="Cerrar">${icon('x')}</button>${list.length > 1 ? `<button class="icon-btn lb-nav prev" data-p aria-label="Anterior">‹</button><button class="icon-btn lb-nav next" data-n aria-label="Siguiente">›</button>` : ''}`;
    $('[data-x]', lb).onclick = close; const p = $('[data-p]', lb), n = $('[data-n]', lb);
    if (p) p.onclick = (e) => { e.stopPropagation(); i = (i - 1 + list.length) % list.length; show(); };
    if (n) n.onclick = (e) => { e.stopPropagation(); i = (i + 1) % list.length; show(); };
    $('[data-x]', lb).focus();
  };
  const key = (e) => { if (e.key === 'Escape') close(); if (e.key === 'ArrowRight') { i = (i + 1) % list.length; show(); } if (e.key === 'ArrowLeft') { i = (i - 1 + list.length) % list.length; show(); } };
  const close = () => { lb.remove(); document.removeEventListener('keydown', key); };
  lb.onclick = (e) => { if (e.target === lb) close(); };
  document.addEventListener('keydown', key); document.body.appendChild(lb); show();
}

// ---------------------------------------------------------------------
//  NOTICIAS Y AGENDA
// ---------------------------------------------------------------------
async function viewNews(el) {
  el.innerHTML = `${pageHero('Noticias y agenda', 'Dónde estaremos y qué hemos conseguido', 'Mercadillos, carreras solidarias, entregas a hospitales… Aquí contamos lo que viene y lo que ya hemos logrado entre todos.', pelonSVG({ ...PALETTES[5], mood: 'wow' }))}
  <section class="section" style="padding-top:10px"><div class="wrap">
    <div class="section-head"><div><span class="eyebrow">Próximas citas</span><h2>Ven a vernos</h2></div></div><div class="agenda" id="agenda"></div>
  </div></section>
  <section class="section tint">${wave()}<div class="wrap">
    <div class="section-head"><div><span class="eyebrow">Logros y noticias</span><h2>Lo que hemos hecho juntos</h2></div><div id="nf" style="display:flex;gap:8px;flex-wrap:wrap"></div></div>
    <div class="grid c3" id="nlist"></div></div></section>`;
  const all = await S.api.news.list().catch(() => []);
  const today = new Date().toISOString().slice(0, 10);
  const upcoming = all.filter(n => n.event_date && n.event_date >= today).sort((a, b) => a.event_date.localeCompare(b.event_date));
  $('#agenda', el).innerHTML = upcoming.length ? upcoming.map(n => { const d = new Date(n.event_date + 'T12:00:00'); return `<div class="agenda-item"><div class="cal"><span>${d.toLocaleDateString('es-ES', { month: 'short' })}</span><b>${d.getDate()}</b></div><div><h3 style="margin:0 0 4px">${esc(n.title)}</h3><p class="muted" style="margin:0">${esc(n.excerpt)}</p>${n.location ? `<p style="margin:6px 0 0;font-weight:700">${icon('pin')} ${esc(n.location)}</p>` : ''}</div></div>`; }).join('')
    : `<div class="empty">${pelonSVG({ wink: true })}<h3>Muy pronto, nuevas fechas</h3><p class="muted" style="max-width:46ch;margin-inline:auto">Estamos preparando los próximos mercadillos y eventos. Síguenos en redes para enterarte la primera.</p>${socialLinks('socials')}</div>`;
  $$('.empty .socials a', el).forEach(a => { a.style.background = 'var(--pink)'; });
  const past = all.filter(n => !upcoming.includes(n));
  let k = 'todo';
  const draw = () => { const list = past.filter(n => k === 'todo' || n.kind === k); $('#nlist', el).innerHTML = list.map(newsCard).join('') || '<p class="muted">Nada por aquí todavía.</p>'; bindNews($('#nlist', el), list); };
  $('#nf', el).innerHTML = [['todo', 'Todo'], ['logro', 'Logros'], ['evento', 'Eventos'], ['noticia', 'Noticias']].map(([v, t]) => `<button class="chip ${v === k ? 'on' : ''}" data-k="${v}">${t}</button>`).join('');
  $$('#nf .chip', el).forEach(b => b.onclick = () => { k = b.dataset.k; $$('#nf .chip', el).forEach(x => x.classList.toggle('on', x === b)); draw(); });
  draw();
}

// ---------------------------------------------------------------------
//  SORTEOS (vista pública en directo)
// ---------------------------------------------------------------------
async function viewRaffles(el) {
  const enabled = S.settings.raffles_enabled === true;
  if (!enabled && !isStaff()) {
    el.innerHTML = `${pageHero('Sorteos', 'Ahora mismo no hay sorteos activos', 'Cuando organicemos uno, aquí podrás ver en directo qué números quedan libres y quién ha ganado.', pelonSVG({ mood: 'wow' }))}<div class="wrap" style="padding-bottom:60px"><a class="btn" href="#noticias">Ver próximas citas</a></div>`;
    return;
  }
  el.innerHTML = `${pageHero('Sorteos', 'Números en directo', 'Compra tu número en nuestros puestos y sigue aquí, en tiempo real, cuáles quedan libres. Tras el sorteo publicamos los premiados.', pelonSVG(PALETTES[1]))}
  <section class="section" style="padding-top:10px"><div class="wrap" id="rbox"><div class="muted">Cargando sorteos…</div></div></section>`;
  const box = $('#rbox', el);
  if (!enabled) box.insertAdjacentHTML('beforebegin', `<div class="wrap" style="margin-bottom:20px"><div class="form-msg err">La app de sorteos está <b>desactivada para el público</b>. Solo tu equipo ve esta página. ${isAdmin() ? 'Actívala en el panel → Sorteos.' : ''}</div></div>`);
  const raffles = await S.api.raffles.list(isStaff()).catch(() => []);
  const visible = isStaff() ? raffles : raffles.filter(r => r.published);
  if (!visible.length) { box.innerHTML = `<div class="empty">${pelonSVG({ wink: true })}<h3>Aún no hay sorteos publicados</h3><p class="muted">Vuelve pronto.</p>${isStaff() ? '<a class="btn" href="#admin">Crear uno en el panel</a>' : ''}</div>`; return; }
  let current = S.raffleId && visible.find(r => r.id === S.raffleId) ? S.raffleId : (visible.find(r => r.status === 'venta') || visible[0]).id;
  let unsub = null, filter = 'todos', hit = null, celebrated = false, prevSold = null;

  async function load() {
    const r = visible.find(x => x.id === current);
    S.raffleId = current;
    const [tickets, winners] = await Promise.all([S.api.tickets.list(current), S.api.winners.list(current)]);
    draw(r, tickets, winners);
  }
  function draw(r, tickets, winners) {
    const sold = new Map(tickets.map(t => [t.number, t]));
    const total = r.total_numbers, nSold = tickets.length, pct = Math.round(nSold / total * 100);
    const changed = prevSold ? [...sold.keys()].filter(n => !prevSold.has(n)) : []; prevSold = sold;
    const pubWinners = winners.filter(w => isStaff() ? (r.results_published && w.published) : true);
    const statusTxt = { preparacion: 'En preparación', venta: 'A la venta', cerrado: 'Venta cerrada', sorteado: 'Sorteado' }[r.status];
    box.innerHTML = `${visible.length > 1 ? `<div class="shop-toolbar">${visible.map(x => `<button class="chip ${x.id === current ? 'on' : ''}" data-r="${x.id}">${esc(x.title)}</button>`).join('')}</div>` : ''}
    <div class="raffle-head">
      <div class="card"><div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center"><span class="live"><i></i> En directo</span><span class="tag ${r.status === 'venta' ? 'ok' : r.status === 'sorteado' ? 'pink' : 'sun'}">${statusTxt}</span>${isStaff() && !r.published ? '<span class="tag bad">No publicado</span>' : ''}</div>
        <h2 style="margin-top:12px">${esc(r.title)}</h2>${r.description ? `<p class="muted">${esc(r.description)}</p>` : ''}
        <div class="raffle-meta"><span>${icon('euro')} ${fmtMoney(r.ticket_price)} el número</span>${r.draw_date ? `<span>${icon('calendar')} ${fmtDate(r.draw_date, { weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}</span>` : ''}${r.location ? `<span>${icon('pin')} ${esc(r.location)}</span>` : ''}</div>
        ${isStaff() ? `<a class="btn small blue" style="margin-top:16px" href="#admin" id="manage">${icon('gear')} Gestionar números</a>` : ''}</div>
      <div class="card"><div class="raffle-stats"><div class="s-sold"><b>${nSold}</b><small>vendidos</small></div><div class="s-free"><b>${total - nSold}</b><small>libres</small></div><div class="s-total"><b>${total}</b><small>en total</small></div></div>
        <div class="progress" role="progressbar" aria-valuenow="${pct}" aria-valuemin="0" aria-valuemax="100" aria-label="Números vendidos"><i style="width:${pct}%"></i></div><p class="muted" style="margin:8px 0 0;font-weight:700">${pct}% vendido</p>
        <form class="search" id="find" style="margin-top:16px">${icon('search')}<input id="findn" type="number" inputmode="numeric" placeholder="¿Está libre mi número?" aria-label="Buscar un número"></form><p id="findr" style="margin:8px 0 0;font-weight:800" aria-live="polite"></p></div>
    </div>
    <div class="num-toolbar"><div style="display:flex;gap:8px;flex-wrap:wrap">${[['todos', 'Todos'], ['libres', 'Libres'], ['vendidos', 'Vendidos']].map(([v, t]) => `<button class="chip ${filter === v ? 'on' : ''}" data-f="${v}">${t}</button>`).join('')}</div>
      <div class="legend" style="margin-left:auto"><span><i></i>Libre</span><span><i class="l-sold"></i>Vendido</span><span><i class="l-res"></i>Reservado</span></div></div>
    <div class="num-grid" id="ngrid">${Array.from({ length: total }, (_, i) => r.number_start + i).filter(n => filter === 'todos' || (filter === 'libres' ? !sold.has(n) : sold.has(n))).map(n => { const t = sold.get(n); return `<div class="num ${t ? (t.status === 'reservado' ? 'reserved' : 'sold') : ''} ${changed.includes(n) ? 'flash' : ''} ${hit === n ? 'hit' : ''}" id="n${n}" title="${t ? 'Nº ' + n + ' · ' + esc(t.holder_label) : 'Nº ' + n + ' libre'}">${n}${t ? `<small>${esc(t.holder_label)}</small>` : ''}</div>`; }).join('')}</div>
    <div style="margin-top:50px"><div class="section-head" style="margin-bottom:18px"><div><span class="eyebrow">Premiados</span><h2>Ganadores del sorteo</h2></div></div>
      ${pubWinners.length && r.results_published ? `<div class="winners-hero"><h3>¡Enhorabuena a los premiados!</h3><p style="margin:0">Gracias a todos los que habéis participado. #cadapeloncuenta</p></div>
        <div class="table-wrap"><table class="tbl"><thead><tr><th>Puesto</th><th>Premio</th><th>Nombre</th><th>Número</th></tr></thead><tbody>${pubWinners.map(w => `<tr><td><span class="medal m${w.position}">${w.position}</span></td><td><b>${esc(w.prize)}</b></td><td>${esc(w.winner_name)}</td><td class="num-cell">${w.number ?? '—'}</td></tr>`).join('')}</tbody></table></div>`
      : `<div class="empty">${pelonSVG(PALETTES[2])}<h3>Los premiados se publicarán aquí</h3><p class="muted">Cuando se celebre el sorteo verás en esta tabla el premio, el nombre y el número ganador.</p></div>`}</div>`;
    $$('[data-r]', box).forEach(b => b.onclick = () => { current = b.dataset.r; prevSold = null; celebrated = false; subscribe(); load(); });
    $$('[data-f]', box).forEach(b => b.onclick = () => { filter = b.dataset.f; draw(r, tickets, winners); });
    $('#find', box).onsubmit = (e) => { e.preventDefault(); const n = +$('#findn', box).value; const out = $('#findr', box);
      if (!n && n !== 0 || n < r.number_start || n >= r.number_start + total) { out.textContent = `Los números van del ${r.number_start} al ${r.number_start + total - 1}.`; out.style.color = 'var(--bad)'; return; }
      hit = n; filter = 'todos'; draw(r, tickets, winners); const o2 = $('#findr', box);
      o2.textContent = sold.has(n) ? `El ${n} ya está vendido.` : `¡El ${n} está libre! Pásate por nuestro puesto para comprarlo.`; o2.style.color = sold.has(n) ? 'var(--pink-deep)' : 'var(--ok)';
      $('#findn', box).value = n; $('#n' + n, box)?.scrollIntoView({ block: 'center', behavior: 'smooth' }); };
    if (pubWinners.length && r.results_published && !celebrated) { celebrated = true; setTimeout(() => confetti(), 300); }
  }
  function subscribe() {
    unsub && unsub();
    unsub = S.api.subscribe('raffle:' + current, async (what) => {
      if (what === 'raffle') { const fresh = await S.api.raffles.list(isStaff()); const f = fresh.find(x => x.id === current); if (f) Object.assign(visible.find(x => x.id === current), f); }
      load();
    });
  }
  subscribe(); await load();
  return () => unsub && unsub();
}

// ---------------------------------------------------------------------
//  COLABORADORES Y PATROCINADORES
// ---------------------------------------------------------------------
async function viewPartners(el) {
  const list = await S.api.partners.list().catch(() => []);
  const groups = [...new Set(list.map(p => p.grp))].sort((a, b) => (a === 'Destino de la ayuda' ? -1 : b === 'Destino de la ayuda' ? 1 : 0));
  el.innerHTML = `${pageHero('Colaboradores', 'Gracias a quienes lo hacen posible', 'Entidades a las que destinamos la ayuda y personas, clubes, colegios y comercios que se vuelcan con Pelones.', pelonSVG(THEMES.estrellas))}
  ${groups.map((g, i) => `<section class="section ${i % 2 ? 'tint' : ''}" style="${i === 0 ? 'padding-top:10px' : ''}">${i % 2 ? wave() : ''}<div class="wrap"><div class="section-head"><div><span class="eyebrow">${g === 'Destino de la ayuda' ? 'Nuestra ayuda llega a' : 'Nos apoyan'}</span><h2>${g === 'Destino de la ayuda' ? 'Entidades que hemos apoyado' : g === 'Nos apoyan' ? 'Amigos y patrocinadores' : esc(g)}</h2></div></div><div class="logo-wall">${list.filter(p => p.grp === g).map(partnerTile).join('')}</div></div></section>`).join('')}
  <section class="section"><div class="wrap"><div class="section-head"><div><span class="eyebrow">Hazte patrocinador</span><h2>Tu empresa también puede sumar</h2><p class="lead">Buscamos empresas y comercios que quieran acompañarnos. Tu logo aparecerá en esta página y en nuestras redes.</p></div></div>
    <div class="grid c3">${[['heart', 'Amigo pelón', 'Comercios y particulares que ponen una hucha, venden pelones en su mostrador o nos ceden un espacio.'], ['star', 'Empresa solidaria', 'Detalles solidarios para clientes y plantilla, donaciones o patrocinio de materiales.'], ['megaphone', 'Evento a beneficio', 'Carreras, partidos, mercadillos o fiestas cuya recaudación va a Pelones. Te ayudamos a organizarlo.']].map(([i, t, d]) => `<div class="card feature"><div class="f-icon">${icon(i)}</div><h3>${t}</h3><p>${d}</p></div>`).join('')}</div>
    <div style="margin-top:26px"><a class="btn" href="#contacto" id="sponsor">${icon('mail')} Quiero colaborar</a></div></div></section>`;
  $('#sponsor', el).addEventListener('click', () => { S.prefill = { subject: 'patrocinio', message: 'Hola, somos … y nos gustaría colaborar con Pelones Cantabria.' }; });
}

// ---------------------------------------------------------------------
//  CONTACTO
// ---------------------------------------------------------------------
function viewContact(el) {
  const s = S.settings, pre = S.prefill || {}; S.prefill = null;
  const ch = [
    s.contact_email && { i: 'mail', c: '#ec4f8e', t: 'Correo', v: s.contact_email, href: 'mailto:' + s.contact_email },
    s.whatsapp && { i: 'whatsapp', c: '#25a35a', t: 'WhatsApp', v: s.whatsapp, href: waLink(s.whatsapp, '¡Hola Pelones! Os escribo desde la web.') },
    s.phone && { i: 'phone', c: '#1d6fb8', t: 'Teléfono', v: s.phone, href: 'tel:' + s.phone.replace(/\s/g, '') },
    s.facebook && { i: 'facebook', c: '#1877f2', t: 'Facebook', v: 'Pelones Cantabria', href: s.facebook },
    s.instagram && { i: 'instagram', c: '#d6249f', t: 'Instagram', v: '@' + (s.instagram.match(/instagram\.com\/([^/?]+)/)?.[1] || 'pelonescantabria'), href: s.instagram },
    s.twitter && { i: 'xsocial', c: '#1d2b53', t: 'X (Twitter)', v: '@' + (s.twitter.match(/(?:twitter|x)\.com\/([^/?]+)/)?.[1] || 'pelonescant'), href: s.twitter },
    s.migranodearena && { i: 'gift', c: '#f7941d', t: 'Mi Grano de Arena', v: 'Retos solidarios para Pelones', href: s.migranodearena },
  ].filter(Boolean);
  el.innerHTML = `${pageHero('Contacto', 'Hablemos', 'Pedidos, voluntariado, eventos solidarios, empresas… Escríbenos por donde te resulte más cómodo y te contestamos lo antes posible.', pelonSVG({ ...PALETTES[0], wink: true }))}
  <section class="section" style="padding-top:10px"><div class="wrap contact-grid">
    <div style="display:grid;gap:14px;min-width:0">
      ${ch.map(c => `<a class="channel" href="${esc(safeUrl(c.href))}" target="_blank" rel="noopener"><span class="c-ico" style="background:${c.c}">${icon(c.i)}</span><span style="min-width:0"><b>${c.t}</b><span>${esc(c.v)}</span></span>${icon('arrow')}</a>`).join('')}
      <div class="card" style="padding:16px"><h3 style="display:flex;gap:8px;align-items:center;margin-bottom:12px">${icon('pin')} Dónde estamos</h3>
        <div class="mini-map">${cantabriaMap()}<div class="pin" style="width:46px">${pelonSVG()}</div></div>
        <p style="margin:12px 0 4px;font-weight:800">${esc(s.address || 'Santander, Cantabria')}</p><p class="muted" style="margin:0 0 10px;font-size:.92rem">Nos movemos por toda Cantabria con mercadillos y eventos: mira la agenda en Noticias.</p>
        <a class="btn small ghost" target="_blank" rel="noopener" href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(s.address || 'Santander, Cantabria')}">${icon('pin')} Abrir en el mapa</a></div>
    </div>
    <div class="card" style="padding:clamp(22px,4vw,36px)"><h2 style="font-size:2rem">Escríbenos</h2>
      <form class="form" id="cform" novalidate>
        <div class="row"><div class="field"><label for="c-name">Nombre</label><input id="c-name" name="name" required autocomplete="name" value="${esc(S.session?.profile?.full_name || '')}"></div>
        <div class="field"><label for="c-phone">Teléfono <span class="muted">(opcional)</span></label><input id="c-phone" name="phone" type="tel" autocomplete="tel"></div></div>
        <div class="field"><label for="c-email">Correo electrónico</label><input id="c-email" name="email" type="email" required autocomplete="email" value="${esc(S.session?.user?.email || '')}"></div>
        <div class="field"><label for="c-subject">¿Sobre qué?</label><select id="c-subject" name="subject">${[['general', 'Información general'], ['pedido', 'Pedido o encargo'], ['voluntariado', 'Quiero ser voluntario'], ['evento', 'Organizar un evento solidario'], ['patrocinio', 'Empresas y patrocinio'], ['otro', 'Otro']].map(([v, t]) => `<option value="${v}" ${pre.subject === v ? 'selected' : ''}>${t}</option>`).join('')}</select></div>
        <div class="field"><label for="c-msg">Mensaje</label><textarea id="c-msg" name="message" required maxlength="3000">${esc(pre.message || '')}</textarea></div>
        <input class="hp" type="text" name="website" tabindex="-1" autocomplete="off" aria-hidden="true">
        <label class="check"><input type="checkbox" name="ok" id="c-ok"> <span>Acepto la <a href="#privacidad">política de privacidad</a>. Solo usaremos tus datos para responderte.</span></label>
        <div class="form-msg" hidden></div>
        <button class="btn" type="submit" style="justify-self:start">${icon('heart')} Enviar mensaje</button>
      </form></div>
  </div></section>`;
  const f = $('#cform', el);
  f.onsubmit = async (e) => {
    e.preventDefault();
    const d = formData(f), msg = $('.form-msg', f), btn = $('[type=submit]', f);
    msg.hidden = true; msg.className = 'form-msg';
    if (d.website) return;
    const err = !d.name || d.name.trim().length < 2 ? 'Escribe tu nombre.' : !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(d.email || '') ? 'Escribe un correo válido para poder contestarte.' : (d.message || '').trim().length < 5 ? 'Cuéntanos un poco más en el mensaje.' : !d.ok ? 'Necesitamos que aceptes la política de privacidad.' : '';
    if (err) { msg.textContent = err; msg.classList.add('err'); msg.hidden = false; return; }
    busy(btn, true, 'Enviando…');
    try {
      await S.api.messages.create({ name: d.name.trim(), email: d.email.trim(), phone: d.phone || null, subject: d.subject, message: d.message.trim() });
      f.reset(); msg.textContent = '¡Mensaje recibido! Te contestaremos lo antes posible.'; msg.classList.add('ok'); msg.hidden = false; confetti(60);
    } catch (e2) { msg.textContent = e2.message; msg.classList.add('err'); msg.hidden = false; }
    finally { busy(btn, false); }
  };
}
const cantabriaMap = () => `<svg viewBox="0 0 400 250" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><path d="M0 120 C40 112 70 126 105 118 S160 98 190 110 S230 132 260 118 S320 96 350 108 S385 122 400 116 V250 H0z" fill="#c9eccf"/><path d="M0 150 C60 140 120 168 200 152 S330 140 400 158 V250 H0z" fill="#b2e0b9"/><path d="M0 200 C80 186 140 214 220 198 S340 190 400 204 V250 H0z" fill="#9dd3a6"/>
<g fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" opacity=".8"><path d="M30 60q10-8 20 0t20 0"/><path d="M250 40q10-8 20 0t20 0"/><path d="M120 80q10-8 20 0t20 0"/></g>
<text x="40" y="44" font-family="Baloo 2, sans-serif" font-weight="800" font-size="16" fill="#1d6fb8" opacity=".7">Mar Cantábrico</text>
<g fill="#1d2b53" font-family="Nunito, sans-serif" font-size="11" font-weight="700" opacity=".6"><circle cx="80" cy="140" r="3"/><text x="62" y="158">Torrelavega</text><circle cx="300" cy="138" r="3"/><text x="280" y="156">Laredo</text><circle cx="150" cy="215" r="3"/><text x="128" y="234">Reinosa</text></g>
<text x="214" y="122" font-family="Baloo 2, sans-serif" font-weight="800" font-size="15" fill="#c7306c">Santander</text></svg>`;

// ---------------------------------------------------------------------
//  AUTENTICACIÓN
// ---------------------------------------------------------------------
const pwField = (id, label, auto = 'current-password', extra = '') => `<div class="field"><label for="${id}">${label}</label><div class="pw-wrap"><input id="${id}" name="${id}" type="password" required autocomplete="${auto}" minlength="8" ${extra}><button type="button" data-eye="${id}" aria-label="Mostrar contraseña">${icon('eye')}</button></div></div>`;
function bindEyes(root) { $$('[data-eye]', root).forEach(b => b.onclick = () => { const i = $('#' + b.dataset.eye, root); const show = i.type === 'password'; i.type = show ? 'text' : 'password'; b.innerHTML = icon(show ? 'eyeoff' : 'eye'); b.setAttribute('aria-label', show ? 'Ocultar contraseña' : 'Mostrar contraseña'); }); }
function pwStrength(v) { let s = 0; if (v.length >= 8) s++; if (v.length >= 12) s++; if (/[A-Z]/.test(v) && /[a-z]/.test(v)) s++; if (/\d/.test(v)) s++; if (/[^A-Za-z0-9]/.test(v)) s++; return s; }
function bindMeter(root, id) { const i = $('#' + id, root), m = $('.pw-meter i', root), h = $('#pw-hint', root); if (!i || !m) return; i.oninput = () => { const s = pwStrength(i.value); m.style.width = (s / 5 * 100) + '%'; m.style.background = s < 2 ? 'var(--bad)' : s < 4 ? 'var(--warn)' : 'var(--ok)'; if (h) h.textContent = ['Muy débil', 'Débil', 'Aceptable', 'Buena', 'Fuerte', 'Muy fuerte'][s]; }; }
const authCard = (title, sub, body, pal = PALETTES[0]) => `<div class="wrap auth-wrap"><div class="auth-card"><div class="auth-pelon">${pelonSVG(pal)}</div><h1>${title}</h1><p class="sub">${sub}</p>${body}</div></div>`;
function formErr(f, text, ok = false) { const m = $('.form-msg', f); m.className = 'form-msg ' + (ok ? 'ok' : 'err'); m.innerHTML = text; m.hidden = false; }

function viewLogin(el) {
  if (S.session) { go(isStaff() ? 'admin' : 'cuenta'); return; }
  el.innerHTML = authCard('¡Hola de nuevo!', 'Entra para seguir tus pedidos o gestionar la asociación.', `
    <form class="form" novalidate><div class="field"><label for="l-email">Correo electrónico</label><input id="l-email" name="email" type="email" required autocomplete="email"></div>
    ${pwField('l-pw', 'Contraseña')}
    <div class="form-msg" hidden></div>
    <button class="btn" type="submit">${icon('lock')} Iniciar sesión</button>
    <div class="auth-links"><a href="#recuperar">¿Has olvidado tu contraseña?</a><a href="#registro">Crear una cuenta</a></div>
    ${S.api.mode === 'demo' ? `<div class="form-msg ok" style="font-weight:600">Demo · Administración: <b>${DEMO_ACCOUNTS.admin}</b><br>Voluntario: <b>${DEMO_ACCOUNTS.staff}</b><br>Contraseña de ambas: <b>${DEMO_ACCOUNTS.password}</b></div>` : ''}</form>`);
  const f = $('form', el); bindEyes(f);
  f.onsubmit = async (e) => {
    e.preventDefault(); const btn = $('[type=submit]', f); const email = $('#l-email', f).value.trim(), pw = $('#l-pw', f).value;
    if (!email || !pw) return formErr(f, 'Escribe tu correo y tu contraseña.');
    busy(btn, true, 'Entrando…');
    try { S.session = await S.api.auth.signIn(email, pw); renderHeader(); renderFooter(); toast(`¡Hola, ${S.session.profile.full_name?.split(' ')[0] || 'pelón'}!`, 'ok'); go(isStaff() ? 'admin' : 'cuenta'); }
    catch (e2) { formErr(f, esc(e2.message)); } finally { busy(btn, false); }
  };
}

function viewRegister(el) {
  if (S.session) { go('cuenta'); return; }
  el.innerHTML = authCard('Únete a la familia', 'Con tu cuenta verás el estado de tus pedidos.', `
    <form class="form" novalidate><div class="field"><label for="r-name">Nombre y apellidos</label><input id="r-name" name="name" required autocomplete="name"></div>
    <div class="field"><label for="r-email">Correo electrónico</label><input id="r-email" type="email" required autocomplete="email"></div>
    ${pwField('r-pw', 'Contraseña', 'new-password')}<div class="pw-meter"><i></i></div><span class="hint field" id="pw-hint" style="font-size:.82rem;color:var(--ink-soft)">Mínimo 8 caracteres</span>
    ${pwField('r-pw2', 'Repite la contraseña', 'new-password')}
    <label class="check"><input type="checkbox" id="r-ok"> <span>Acepto la <a href="#privacidad">política de privacidad</a> y el <a href="#aviso-legal">aviso legal</a>.</span></label>
    <div class="form-msg" hidden></div>
    <button class="btn" type="submit">${icon('heart')} Crear mi cuenta</button>
    <div class="auth-links"><span>¿Ya tienes cuenta? <a href="#entrar">Inicia sesión</a></span></div></form>`, PALETTES[1]);
  const f = $('form', el); bindEyes(f); bindMeter(f, 'r-pw');
  f.onsubmit = async (e) => {
    e.preventDefault(); const btn = $('[type=submit]', f);
    const name = $('#r-name', f).value.trim(), email = $('#r-email', f).value.trim(), pw = $('#r-pw', f).value, pw2 = $('#r-pw2', f).value;
    const err = name.length < 2 ? 'Escribe tu nombre.' : !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email) ? 'Escribe un correo válido.' : pw.length < 8 ? 'La contraseña debe tener al menos 8 caracteres.' : pwStrength(pw) < 2 ? 'Esa contraseña es muy fácil de adivinar. Mezcla letras y números.' : pw !== pw2 ? 'Las contraseñas no coinciden.' : !$('#r-ok', f).checked ? 'Necesitamos que aceptes la política de privacidad.' : '';
    if (err) return formErr(f, err);
    busy(btn, true, 'Creando cuenta…');
    try {
      const r = await S.api.auth.signUp(name, email, pw);
      if (r.needsConfirm) { f.innerHTML = `<div class="form-msg ok">¡Cuenta creada! Te hemos enviado un correo a <b>${esc(email)}</b>. Pulsa el enlace para activarla y después inicia sesión.</div><a class="btn" href="#entrar">Ir a iniciar sesión</a>`; }
      else { S.session = await S.api.auth.session(); renderHeader(); confetti(80); toast('¡Bienvenido a Pelones!', 'ok'); go('cuenta'); }
    } catch (e2) { formErr(f, esc(e2.message)); } finally { busy(btn, false); }
  };
}

function viewForgot(el) {
  el.innerHTML = authCard('¿Contraseña olvidada?', 'Te enviamos un enlace para crear una nueva.', `
    <form class="form" novalidate><div class="field"><label for="f-email">Correo de tu cuenta</label><input id="f-email" type="email" required autocomplete="email"></div>
    <div class="form-msg" hidden></div><button class="btn" type="submit">${icon('mail')} Enviar enlace</button>
    <div class="auth-links"><a href="#entrar">Volver a iniciar sesión</a></div></form>`, PALETTES[2]);
  const f = $('form', el);
  f.onsubmit = async (e) => {
    e.preventDefault(); const btn = $('[type=submit]', f), email = $('#f-email', f).value.trim();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return formErr(f, 'Escribe un correo válido.');
    busy(btn, true, 'Enviando…');
    try {
      await S.api.auth.requestReset(email);
      formErr(f, S.api.mode === 'demo' ? 'En la demo no se envían correos. <a href="#nueva-contrasena">Crea aquí tu nueva contraseña</a>.' : `Si existe una cuenta con <b>${esc(email)}</b>, recibirás un correo con el enlace en unos minutos. Revisa también el spam.`, true);
    } catch (e2) { formErr(f, esc(e2.message)); } finally { busy(btn, false); }
  };
}

function viewNewPassword(el) {
  el.innerHTML = authCard('Nueva contraseña', 'Elige una contraseña que no uses en otras webs.', `
    <form class="form" novalidate>${pwField('n-pw', 'Nueva contraseña', 'new-password')}<div class="pw-meter"><i></i></div><span id="pw-hint" style="font-size:.82rem;color:var(--ink-soft)">Mínimo 8 caracteres</span>
    ${pwField('n-pw2', 'Repítela', 'new-password')}<div class="form-msg" hidden></div><button class="btn" type="submit">${icon('lock')} Guardar contraseña</button></form>`, PALETTES[3]);
  const f = $('form', el); bindEyes(f); bindMeter(f, 'n-pw');
  f.onsubmit = async (e) => {
    e.preventDefault(); const btn = $('[type=submit]', f), pw = $('#n-pw', f).value, pw2 = $('#n-pw2', f).value;
    if (pw.length < 8) return formErr(f, 'La contraseña debe tener al menos 8 caracteres.');
    if (pw !== pw2) return formErr(f, 'Las contraseñas no coinciden.');
    busy(btn, true, 'Guardando…');
    try { await S.api.auth.updatePassword(pw); S.session = await S.api.auth.session(); renderHeader(); toast('Contraseña cambiada', 'ok'); go(S.session ? (isStaff() ? 'admin' : 'cuenta') : 'entrar'); }
    catch (e2) { formErr(f, esc(e2.message) + (/caducado|sesión/i.test(e2.message) ? ' <a href="#recuperar">Pedir otro enlace</a>' : '')); } finally { busy(btn, false); }
  };
}

async function viewAccount(el) {
  if (!S.session) { go('entrar'); return; }
  const p = S.session.profile;
  el.innerHTML = `<div class="wrap" style="padding-block:40px 60px"><span class="eyebrow">Mi cuenta</span><h1>Hola, ${esc(p.full_name?.split(' ')[0] || 'pelón')}</h1>
  <div class="grid c2" style="margin-top:24px;align-items:start">
    <div class="card"><h3>Mis datos</h3><form class="form" id="pf"><div class="field"><label for="a-name">Nombre</label><input id="a-name" value="${esc(p.full_name || '')}" autocomplete="name"></div>
      <div class="field"><label for="a-phone">Teléfono</label><input id="a-phone" type="tel" value="${esc(p.phone || '')}" autocomplete="tel"></div>
      <div class="field"><label>Correo</label><input value="${esc(S.session.user.email)}" disabled></div><div class="form-msg" hidden></div>
      <div style="display:flex;gap:10px;flex-wrap:wrap"><button class="btn small" type="submit">Guardar</button><a class="btn small ghost" href="#nueva-contrasena">Cambiar contraseña</a><button class="btn small ghost" type="button" id="logout">${icon('logout')} Salir</button></div></form>
      ${isStaff() ? `<a class="btn blue" style="margin-top:18px" href="#admin">${icon('gear')} Ir al panel de gestión</a>` : ''}</div>
    <div class="card"><h3>Mis pedidos</h3><div id="myorders" class="muted">Cargando…</div></div></div></div>`;
  $('#logout', el).onclick = async () => { await S.api.auth.signOut(); S.session = null; renderHeader(); renderFooter(); toast('Sesión cerrada'); go('inicio'); };
  $('#pf', el).onsubmit = async (e) => { e.preventDefault(); const f = e.target; try { S.session.profile = await S.api.auth.updateProfile({ full_name: $('#a-name', f).value.trim(), phone: $('#a-phone', f).value.trim() }); formErr(f, 'Datos guardados.', true); } catch (e2) { formErr(f, esc(e2.message)); } };
  const orders = await S.api.orders.mine().catch(() => []);
  const st = { nuevo: ['Recibido', 'sun'], confirmado: ['Confirmado', ''], preparado: ['Preparado', 'pink'], entregado: ['Entregado', 'ok'], cancelado: ['Cancelado', 'bad'] };
  $('#myorders', el).innerHTML = orders.length ? orders.map(o => `<div style="padding:12px 0;border-bottom:1px solid var(--line)"><div style="display:flex;justify-content:space-between;gap:10px;flex-wrap:wrap"><b>Pedido ${esc(o.code)}</b><span class="tag ${st[o.status][1]}">${st[o.status][0]}</span></div><div class="muted" style="font-size:.9rem">${fmtDate(o.created_at)} · ${o.items.map(i => `${i.qty}× ${esc(i.name)}`).join(', ')} · <b>${fmtMoney(o.total)}</b></div></div>`).join('')
    : `<p>Aún no has hecho ningún pedido.</p><a class="btn small" href="#tienda">Ver la tienda</a>`;
}

// ---------------------------------------------------------------------
//  PÁGINAS LEGALES
// ---------------------------------------------------------------------
function legalPage(el, which) {
  const upd = '6 de noviembre de 2026';
  const T = {
    cookies: ['Política de cookies', `<p>Última actualización: ${upd}.</p>
      <h2>¿Qué son las cookies?</h2><p>Son pequeños archivos o registros que una web guarda en tu navegador. También usamos tecnologías parecidas, como el almacenamiento local (localStorage).</p>
      <h2>¿Qué usamos en esta web?</h2><p>Solo elementos <b>técnicos y necesarios</b> para que la web funcione. Están exentos de consentimiento según el artículo 22.2 de la LSSI-CE. No usamos cookies publicitarias, de analítica ni de redes sociales.</p>
      <table><thead><tr><th>Nombre</th><th>Finalidad</th><th>Duración</th></tr></thead><tbody>
      <tr><td>sb-*-auth-token</td><td>Mantener tu sesión iniciada (solo si entras con tu cuenta)</td><td>Hasta cerrar sesión</td></tr>
      <tr><td>pelones_cart</td><td>Recordar los productos de tu pedido</td><td>Hasta vaciarlo</td></tr>
      <tr><td>pelones_mode</td><td>Recordar si prefieres la vista 3D o la clásica</td><td>Persistente</td></tr>
      <tr><td>pelones_cookies</td><td>Recordar que has visto este aviso</td><td>Persistente</td></tr></tbody></table>
      <h2>Servicios de terceros</h2><p>Cargamos tipografías de Google Fonts y librerías desde jsDelivr. Estos servicios pueden recibir tu dirección IP para entregar los archivos, pero no instalan cookies de seguimiento desde esta web. Los enlaces a Facebook, Instagram, X o WhatsApp te llevan a esas plataformas, que tienen sus propias políticas.</p>
      <h2>Cómo borrarlas</h2><p>Puedes borrar estos datos desde la configuración de tu navegador (Privacidad → Borrar datos de sitios). Si lo haces, se cerrará tu sesión y se vaciará tu pedido.</p>`],
    privacidad: ['Política de privacidad', `<p>Última actualización: ${upd}.</p>
      <div class="note">Texto base conforme al RGPD (UE 2016/679) y la LOPDGDD (LO 3/2018). Completa los datos marcados entre corchetes antes de publicar la web.</div>
      <h2>Responsable del tratamiento</h2><p>Asociación Pelones Cantabria · NIF: [NIF de la asociación] · Domicilio: [dirección postal], Santander (Cantabria) · Correo: ${esc(S.settings.contact_email || '[correo de contacto]')}.</p>
      <h2>¿Qué datos tratamos y para qué?</h2><ul>
      <li><b>Formulario de contacto:</b> nombre, correo, teléfono (opcional) y mensaje, para responderte.</li>
      <li><b>Pedidos:</b> nombre, correo, teléfono y dirección de envío, para gestionar y entregar tu pedido.</li>
      <li><b>Cuenta de usuario:</b> nombre, correo y contraseña cifrada, para que puedas consultar tus pedidos.</li>
      <li><b>Sorteos:</b> nombre, teléfono y correo de quien compra un número, para avisar a los premiados. En la web pública solo se muestra el nombre y la inicial del apellido.</li></ul>
      <h2>Base legal</h2><p>Tu consentimiento (contacto y cuenta), la ejecución de la relación que nos pides (pedidos y sorteos) y nuestro interés legítimo en publicar los resultados de los sorteos con transparencia.</p>
      <h2>¿Cuánto tiempo los guardamos?</h2><p>Mensajes: un año. Pedidos: el tiempo necesario para gestionarlos y cumplir obligaciones legales. Sorteos: hasta 6 meses después de entregar los premios. Cuenta: hasta que la borres.</p>
      <h2>¿Con quién los compartimos?</h2><p>Con nadie con fines comerciales. Usamos proveedores técnicos que actúan como encargados del tratamiento: Supabase (base de datos y autenticación, servidores en la UE si así se configura) y Vercel (alojamiento web).</p>
      <h2>Tus derechos</h2><p>Puedes pedir acceso, rectificación, supresión, oposición, limitación y portabilidad escribiendo a ${esc(S.settings.contact_email || '[correo de contacto]')}. Si crees que no hemos atendido bien tu solicitud, puedes reclamar ante la Agencia Española de Protección de Datos (<a href="https://www.aepd.es" target="_blank" rel="noopener">aepd.es</a>).</p>
      <h2>Menores</h2><p>Los menores de 14 años necesitan el consentimiento de sus padres o tutores para facilitarnos sus datos.</p>`],
    aviso: ['Aviso legal', `<p>Última actualización: ${upd}.</p>
      <div class="note">En cumplimiento del artículo 10 de la Ley 34/2002 (LSSI-CE). Completa los datos entre corchetes.</div>
      <h2>Titular</h2><p>Asociación Pelones Cantabria, entidad sin ánimo de lucro. NIF: [NIF]. Inscrita en el Registro de Asociaciones de Cantabria con el número [nº de registro]. Domicilio: [dirección], Santander. Correo: ${esc(S.settings.contact_email || '[correo]')}.</p>
      <h2>Objeto</h2><p>Esta web informa sobre la actividad de la asociación, permite hacer pedidos de productos solidarios, consultar sorteos y contactar con nosotros.</p>
      <h2>Pedidos y precios</h2><p>Los precios son donativos orientativos por cada producto artesanal. La web no cobra: la asociación contacta con cada persona para acordar el pago y la entrega. El importe se destina a los fines de la asociación.</p>
      <h2>Sorteos</h2><p>Los sorteos se rigen por sus propias bases, que se publican junto a cada sorteo y están disponibles en los puntos de venta.</p>
      <h2>Propiedad intelectual</h2><p>El logotipo, el nombre "Pelones Cantabria", los textos y las imágenes son de la asociación o de sus autores. No se pueden usar con fines comerciales sin permiso.</p>
      <h2>Responsabilidad</h2><p>Hacemos lo posible por que la información sea correcta y esté actualizada, pero no respondemos de los contenidos de webs externas enlazadas.</p>
      <h2>Legislación</h2><p>Se aplica la legislación española. Para cualquier conflicto, los juzgados y tribunales de Santander.</p>`],
  }[which];
  el.innerHTML = `${pageHero('Información legal', T[0], '', pelonSVG(PALETTES[0]))}<section class="section" style="padding-top:10px"><div class="wrap legal">${T[1]}</div></section>`;
}

boot().catch(e => { console.error(e); const a = document.getElementById('app'); if (a) a.innerHTML = `<div class="wrap" style="padding:60px 20px"><h2>Algo no ha cargado bien</h2><p>Recarga la página. Si sigue fallando, escríbenos por Facebook.</p></div>`; });

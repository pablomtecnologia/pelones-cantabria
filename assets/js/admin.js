// =====================================================================
//  PANEL DE GESTIÓN · voluntarios (staff) y administración (admin)
// =====================================================================
import { icon, pelonSVG, productArt, THEMES, PALETTES } from './content.js';
import { S, $, $$, esc, fmtMoney, fmtDate, fmtDateTime, isStaff, isAdmin, safeUrl, toast, openModal, modalHead, confirmBox, confetti, parseNumbers, downloadCSV, busy, formData } from './ui.js';
import { go } from './app.js';

let tab = 'resumen';
let unsubs = [];

const TABS = [
  ['resumen', 'Resumen', 'home', 'staff'], ['sorteos', 'Sorteos', 'ticket', 'staff'], ['pedidos', 'Pedidos', 'bag', 'staff'],
  ['mensajes', 'Mensajes', 'mail', 'staff'], ['noticias', 'Noticias', 'news', 'admin'], ['productos', 'Productos', 'shop', 'admin'],
  ['galeria', 'Galería', 'image', 'admin'], ['colaboradores', 'Colaboradores', 'star', 'admin'], ['usuarios', 'Usuarios', 'users', 'admin'], ['ajustes', 'Ajustes', 'gear', 'admin'],
];

export async function viewAdmin(el) {
  if (!S.session) { go('entrar'); return; }
  if (!isStaff()) {
    el.innerHTML = `<div class="wrap auth-wrap"><div class="auth-card" style="text-align:center"><div class="auth-pelon">${pelonSVG({ mood: 'wow' })}</div><h1>Zona del equipo</h1><p class="sub">Tu cuenta no tiene permisos de voluntario. Pide a la administración que te los active.</p><a class="btn" href="#cuenta">Ir a mi cuenta</a></div></div>`;
    return;
  }
  el.innerHTML = `<div class="wrap admin-layout"><nav class="admin-nav" aria-label="Secciones del panel">${TABS.filter(t => t[3] === 'staff' || isAdmin()).map(([k, t, i]) => `<button data-t="${k}" class="${tab === k ? 'on' : ''}">${icon(i)} ${t}<span class="badge" data-badge="${k}" hidden></span></button>`).join('')}
    <hr style="border:0;border-top:1px dashed var(--line);width:100%"><button data-out>${icon('logout')} Cerrar sesión</button></nav><div class="admin-main" id="am"></div></div>`;
  $$('[data-t]', el).forEach(b => b.onclick = () => { tab = b.dataset.t; $$('[data-t]', el).forEach(x => x.classList.toggle('on', x === b)); renderTab(); });
  $('[data-out]', el).onclick = async () => { await S.api.auth.signOut(); S.session = null; location.hash = 'inicio'; location.reload(); };
  const main = $('#am', el);
  async function renderTab() {
    unsubs.forEach(u => u()); unsubs = [];
    main.innerHTML = '<p class="muted">Cargando…</p>';
    try { await ({ resumen, sorteos, pedidos, mensajes, noticias, productos, galeria, colaboradores, usuarios, ajustes })[tab](main); }
    catch (e) { main.innerHTML = `<div class="form-msg err">${esc(e.message)}</div>`; }
    badges(el);
  }
  await renderTab();
  return () => { unsubs.forEach(u => u()); unsubs = []; };
}

async function badges(root) {
  try {
    const [o, m] = await Promise.all([S.api.orders.list(), S.api.messages.list()]);
    const set = (k, n) => { const b = $(`[data-badge="${k}"]`, root); if (b) { b.hidden = !n; b.textContent = n; } };
    set('pedidos', o.filter(x => x.status === 'nuevo').length); set('mensajes', m.filter(x => !x.handled).length);
  } catch { /* */ }
}

const roleName = { admin: 'Administración', staff: 'Voluntario', user: 'Usuario' };
const head = (t, sub, actions = '') => `<div class="section-head" style="margin-bottom:0"><div><span class="eyebrow">Panel · ${roleName[S.session.profile.role]}</span><h2>${t}</h2>${sub ? `<p class="muted" style="margin:0">${sub}</p>` : ''}</div><div style="display:flex;gap:10px;flex-wrap:wrap">${actions}</div></div>`;
const toggleHTML = (id, checked, label, disabled = false) => `<label class="toggle"><input type="checkbox" id="${id}" ${checked ? 'checked' : ''} ${disabled ? 'disabled' : ''}><span class="track"></span><span>${label}</span></label>`;

// ---------------------------------------------------------------------
async function resumen(main) {
  const [orders, msgs, raffles, products] = await Promise.all([S.api.orders.list(), S.api.messages.list(), S.api.raffles.list(true), S.api.products.list(true)]);
  const nuevos = orders.filter(o => o.status === 'nuevo');
  const ingresos = orders.filter(o => !['cancelado'].includes(o.status)).reduce((a, b) => a + Number(b.total || 0), 0);
  main.innerHTML = `${head(`Hola, ${esc(S.session.profile.full_name?.split(' ')[0] || '')}`, 'Esto es lo que hay pendiente hoy.')}
  <div class="kpis"><div class="kpi"><b>${nuevos.length}</b><span>pedidos nuevos</span></div><div class="kpi"><b>${msgs.filter(m => !m.handled).length}</b><span>mensajes sin atender</span></div>
  <div class="kpi"><b>${raffles.filter(r => r.status === 'venta').length}</b><span>sorteos a la venta</span></div><div class="kpi"><b>${fmtMoney(ingresos)}</b><span>en pedidos (no cancelados)</span></div><div class="kpi"><b>${products.filter(p => p.active).length}</b><span>productos en la tienda</span></div></div>
  <div class="grid c2"><div class="card"><h3>${icon('bag')} Últimos pedidos</h3>${orders.slice(0, 5).map(o => `<div style="display:flex;justify-content:space-between;gap:10px;padding:8px 0;border-bottom:1px solid var(--line)"><span><b>${esc(o.code)}</b> · ${esc(o.name)}</span><span>${fmtMoney(o.total)}</span></div>`).join('') || '<p class="muted">Sin pedidos todavía.</p>'}<button class="btn small ghost" style="margin-top:12px" data-go="pedidos">Ver pedidos</button></div>
  <div class="card"><h3>${icon('mail')} Últimos mensajes</h3>${msgs.slice(0, 5).map(m => `<div style="padding:8px 0;border-bottom:1px solid var(--line)"><b>${esc(m.name)}</b> <span class="tag ${m.handled ? 'ok' : 'sun'}">${m.handled ? 'Atendido' : 'Pendiente'}</span><div class="muted" style="font-size:.9rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(m.message)}</div></div>`).join('') || '<p class="muted">Sin mensajes todavía.</p>'}<button class="btn small ghost" style="margin-top:12px" data-go="mensajes">Ver mensajes</button></div></div>
  ${S.api.mode === 'demo' ? `<div class="form-msg ok" style="font-weight:600">Estás en <b>modo demostración</b>: todo se guarda en este navegador. Con el backend conectado (ver README) los datos se comparten en tiempo real entre todos los dispositivos.</div>` : ''}`;
  $$('[data-go]', main).forEach(b => b.onclick = () => $(`[data-t="${b.dataset.go}"]`).click());
}

// ---------------------------------------------------------------------
//  SORTEOS
// ---------------------------------------------------------------------
async function sorteos(main) {
  const raffles = await S.api.raffles.list(true);
  let cur = S.raffleId && raffles.find(r => r.id === S.raffleId) ? S.raffleId : raffles[0]?.id;
  const enabled = S.settings.raffles_enabled === true;
  main.innerHTML = `${head('Sorteos', 'Marca los números vendidos y publica los premiados.', isAdmin() ? `<button class="btn" id="new-r">${icon('plus')} Nuevo sorteo</button>` : '')}
    <div class="switch-card ${enabled ? 'on' : ''}"><div style="min-width:0"><h3 style="margin:0">App de sorteos en la web</h3><p class="muted" style="margin:0">${enabled ? 'Activada: el público ve la sección Sorteos y los sorteos publicados.' : 'Desactivada: la sección Sorteos no aparece para el público.'}</p></div>${toggleHTML('r-enabled', enabled, enabled ? 'Activada' : 'Desactivada', !isAdmin())}</div>
    <div id="rsel"></div><div id="rdetail"></div>`;
  if (isAdmin()) {
    $('#new-r', main).onclick = () => raffleForm(null, async (r) => { S.raffleId = r.id; await sorteos(main); });
    $('#r-enabled', main).onchange = async (e) => {
      try { await S.api.settings.set('raffles_enabled', e.target.checked); S.settings.raffles_enabled = e.target.checked; toast(e.target.checked ? 'Sorteos visibles en la web' : 'Sorteos ocultos al público', 'ok'); S.world?.setZoneVisible?.('sorteos', true); document.dispatchEvent(new Event('pelones:settings')); await sorteos(main); }
      catch (e2) { toast(e2.message, 'err'); e.target.checked = !e.target.checked; }
    };
  }
  if (!raffles.length) { $('#rdetail', main).innerHTML = `<div class="empty">${pelonSVG({ wink: true })}<h3>Todavía no hay ningún sorteo</h3><p class="muted">${isAdmin() ? 'Crea el primero con el botón "Nuevo sorteo".' : 'La administración tiene que crear el sorteo antes de vender números.'}</p></div>`; return; }
  $('#rsel', main).innerHTML = `<div class="shop-toolbar" style="margin:0">${raffles.map(r => `<button class="chip ${r.id === cur ? 'on' : ''}" data-r="${r.id}">${esc(r.title)} ${r.published ? '' : '· borrador'}</button>`).join('')}</div>`;
  $$('[data-r]', main).forEach(b => b.onclick = () => { cur = b.dataset.r; S.raffleId = cur; $$('[data-r]', main).forEach(x => x.classList.toggle('on', x === b)); detail(); });

  let drawing = false;
  async function detail() {
    unsubs.forEach(u => u()); unsubs = [];
    const box = $('#rdetail', main);
    const r = raffles.find(x => x.id === cur);
    const [tickets, contacts, winners] = await Promise.all([S.api.tickets.list(cur), S.api.tickets.contacts(cur), S.api.winners.list(cur)]);
    const cmap = new Map(contacts.map(c => [c.number, c])), tmap = new Map(tickets.map(t => [t.number, t]));
    const unpaid = contacts.filter(c => !c.paid).length;
    const recaudado = contacts.filter(c => c.paid).length * Number(r.ticket_price || 0);
    box.innerHTML = `
    <div class="card"><div style="display:flex;justify-content:space-between;gap:16px;flex-wrap:wrap;align-items:flex-start">
      <div style="min-width:0"><h3 style="margin:0 0 6px">${esc(r.title)}</h3><p class="muted" style="margin:0">${fmtMoney(r.ticket_price)} el número · del ${r.number_start} al ${r.number_start + r.total_numbers - 1}${r.draw_date ? ' · sorteo ' + fmtDateTime(r.draw_date) : ''}${r.location ? ' · ' + esc(r.location) : ''}</p></div>
      ${isAdmin() ? `<div class="row-actions"><button class="btn tiny ghost" id="r-edit">${icon('edit')} Editar</button><button class="btn tiny danger" id="r-del">${icon('trash')} Borrar</button></div>` : ''}</div>
      <div style="display:flex;gap:26px;flex-wrap:wrap;margin-top:16px">${toggleHTML('r-pub', r.published, 'Publicado (el público ve los números)', !isAdmin())}${toggleHTML('r-res', r.results_published, 'Resultados publicados', !isAdmin())}
      <label class="field" style="min-width:180px"><span class="sr-only">Estado</span><select id="r-status" ${isAdmin() ? '' : 'disabled'}>${[['preparacion', 'En preparación'], ['venta', 'A la venta'], ['cerrado', 'Venta cerrada'], ['sorteado', 'Sorteado']].map(([v, t]) => `<option value="${v}" ${r.status === v ? 'selected' : ''}>${t}</option>`).join('')}</select></label></div></div>
    <div class="kpis"><div class="kpi"><b>${tickets.length}</b><span>vendidos</span></div><div class="kpi"><b>${r.total_numbers - tickets.length}</b><span>libres</span></div><div class="kpi"><b>${unpaid}</b><span>pendientes de pago</span></div><div class="kpi"><b>${fmtMoney(recaudado)}</b><span>cobrado</span></div></div>
    <div class="card"><h3>${icon('ticket')} Venta rápida</h3><p class="muted" style="margin-top:-6px">Escribe uno o varios números: <b>7</b>, <b>7, 12, 30</b> o un rango <b>40-45</b>.</p>
      <form class="form" id="quick"><div class="row"><div class="field"><label for="q-nums">Número(s)</label><input id="q-nums" name="nums" required inputmode="numeric" placeholder="Ej. 7, 12, 40-45"></div><div class="field"><label for="q-name">Nombre y apellidos</label><input id="q-name" name="full_name" required></div></div>
      <div class="row"><div class="field"><label for="q-phone">Teléfono</label><input id="q-phone" name="phone" type="tel"></div><div class="field"><label for="q-email">Correo</label><input id="q-email" name="email" type="email"></div></div>
      <div style="display:flex;gap:20px;flex-wrap:wrap;align-items:center"><label class="check"><input type="checkbox" name="paid" checked> Pagado</label><label class="check"><input type="checkbox" name="reserved"> Solo reservar</label><button class="btn" type="submit" style="margin-left:auto">${icon('check')} Registrar venta</button></div>
      <div class="form-msg" hidden></div></form></div>
    <div class="card"><div style="display:flex;justify-content:space-between;gap:10px;flex-wrap:wrap;align-items:center;margin-bottom:12px"><h3 style="margin:0">${icon('cube')} Tablero de números</h3><div class="legend"><span><i></i>Libre</span><span><i class="l-sold"></i>Vendido</span><span><i class="l-res"></i>Reservado</span><span>€ = sin pagar</span></div></div>
      <p class="muted" style="margin-top:0">Pulsa un número para venderlo, ver quién lo tiene, editarlo o liberarlo.</p>
      <div class="num-grid">${Array.from({ length: r.total_numbers }, (_, i) => r.number_start + i).map(n => { const t = tmap.get(n), c = cmap.get(n); return `<button class="num ${t ? (t.status === 'reservado' ? 'reserved' : 'sold') : ''} ${c && !c.paid ? 'unpaid' : ''}" data-n="${n}" aria-label="Número ${n}${t ? ', ' + esc(c?.full_name || t.holder_label) : ', libre'}">${n}${t ? `<small>${esc(t.holder_label)}</small>` : ''}</button>`; }).join('')}</div></div>
    <div class="card"><div style="display:flex;justify-content:space-between;gap:10px;flex-wrap:wrap;align-items:center"><h3 style="margin:0">${icon('users')} Compradores (${contacts.length})</h3><button class="btn tiny ghost" id="csv" ${contacts.length ? '' : 'disabled'}>${icon('download')} Exportar CSV</button></div>
      <div class="table-wrap" style="box-shadow:none;margin-top:12px;max-height:420px;overflow:auto"><table class="tbl"><thead><tr><th>Nº</th><th>Nombre</th><th>Teléfono</th><th>Correo</th><th>Pago</th></tr></thead><tbody>${contacts.sort((a, b) => a.number - b.number).map(c => `<tr><td class="num-cell">${c.number}</td><td>${esc(c.full_name)}</td><td>${esc(c.phone || '—')}</td><td>${esc(c.email || '—')}</td><td><span class="tag ${c.paid ? 'ok' : 'sun'}">${c.paid ? 'Pagado' : 'Pendiente'}</span></td></tr>`).join('') || '<tr><td colspan="5" class="muted">Aún no hay números vendidos.</td></tr>'}</tbody></table></div></div>
    ${isAdmin() ? `<div class="card"><div style="display:flex;justify-content:space-between;gap:10px;flex-wrap:wrap;align-items:center"><h3 style="margin:0">${icon('trophy')} Premiados</h3><div class="row-actions"><button class="btn small sun" id="draw" ${tickets.length ? '' : 'disabled'}>${icon('shuffle')} Sacar número al azar</button><button class="btn small" id="add-w">${icon('plus')} Añadir premio</button></div></div>
      <p class="muted">Los premiados solo se ven en la web cuando activas <b>Resultados publicados</b> arriba y marcas cada fila como visible.</p>
      <div class="table-wrap" style="box-shadow:none"><table class="tbl"><thead><tr><th>Puesto</th><th>Premio</th><th>Número</th><th>Nombre</th><th>Visible</th><th></th></tr></thead><tbody>${winners.map(w => `<tr><td><span class="medal m${w.position}">${w.position}</span></td><td><b>${esc(w.prize)}</b></td><td class="num-cell">${w.number ?? '—'}</td><td>${esc(w.winner_name)}</td><td>${toggleHTML('wp-' + w.id, w.published, '')}</td><td><div class="row-actions"><button class="btn tiny ghost" data-we="${w.id}" aria-label="Editar">${icon('edit')}</button><button class="btn tiny danger" data-wd="${w.id}" aria-label="Borrar">${icon('trash')}</button></div></td></tr>`).join('') || '<tr><td colspan="6" class="muted">Añade los premios del sorteo.</td></tr>'}</tbody></table></div></div>` : ''}`;

    // --- Ajustes del sorteo (admin)
    if (isAdmin()) {
      const upd = async (patch, msg) => { try { Object.assign(r, await S.api.raffles.save({ id: r.id, ...patch })); toast(msg, 'ok'); sorteos(main); } catch (e) { toast(e.message, 'err'); detail(); } };
      $('#r-pub', box).onchange = (e) => upd({ published: e.target.checked }, e.target.checked ? 'Sorteo publicado' : 'Sorteo oculto');
      $('#r-res', box).onchange = (e) => upd({ results_published: e.target.checked }, e.target.checked ? 'Resultados publicados' : 'Resultados ocultos');
      $('#r-status', box).onchange = (e) => upd({ status: e.target.value }, 'Estado actualizado');
      $('#r-edit', box).onclick = () => raffleForm(r, async () => { sorteos(main); });
      $('#r-del', box).onclick = async () => { if (await confirmBox(`Se borrará <b>${esc(r.title)}</b> con todos sus números y premiados. No se puede deshacer.`, { ok: 'Borrar sorteo', danger: true })) { try { await S.api.raffles.remove(r.id); S.raffleId = null; toast('Sorteo borrado', 'ok'); sorteos(main); } catch (e) { toast(e.message, 'err'); } } };
      $('#add-w', box).onclick = () => winnerForm(r, null, cmap, winners, detail);
      $$('[data-we]', box).forEach(b => b.onclick = () => winnerForm(r, winners.find(w => w.id === b.dataset.we), cmap, winners, detail));
      $$('[data-wd]', box).forEach(b => b.onclick = async () => { if (await confirmBox('¿Borrar este premio?', { ok: 'Borrar', danger: true })) { await S.api.winners.remove(b.dataset.wd); detail(); } });
      winners.forEach(w => { const t = $('#wp-' + w.id, box); if (t) t.onchange = async () => { await S.api.winners.save({ id: w.id, published: t.checked }); toast(t.checked ? 'Premiado visible' : 'Premiado oculto', 'ok'); }; });
      $('#draw', box).onclick = () => drawRandom(r, tickets, cmap, winners, detail);
    }
    $('#csv', box).onclick = () => downloadCSV(`sorteo-${r.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.csv`, [['Número', 'Nombre', 'Teléfono', 'Correo', 'Pagado', 'Notas'], ...contacts.map(c => [c.number, c.full_name, c.phone, c.email, c.paid ? 'Sí' : 'No', c.notes])]);

    // --- Venta rápida
    const qf = $('#quick', box);
    qf.onsubmit = async (e) => {
      e.preventDefault(); const d = formData(qf), m = $('.form-msg', qf), btn = $('[type=submit]', qf);
      m.hidden = true;
      let nums; try { nums = parseNumbers(d.nums); } catch (e2) { m.className = 'form-msg err'; m.textContent = e2.message; m.hidden = false; return; }
      if (!nums.length || !d.full_name?.trim()) { m.className = 'form-msg err'; m.textContent = 'Escribe al menos un número y el nombre.'; m.hidden = false; return; }
      busy(btn, true, 'Guardando…');
      const ok = [], ko = [];
      for (const n of nums) { try { await S.api.tickets.sell(r.id, n, { full_name: d.full_name, phone: d.phone, email: d.email, paid: !!d.paid, status: d.reserved ? 'reservado' : 'vendido' }); ok.push(n); } catch (e2) { ko.push(`${n}: ${e2.message.replace(/^.*?:\s*/, '')}`); } }
      busy(btn, false);
      if (ok.length) toast(`${ok.length === 1 ? 'Número ' + ok[0] : ok.length + ' números'} para ${d.full_name}`, 'ok');
      if (ko.length) { await detail(); const m2 = $('#quick .form-msg', box); m2.className = 'form-msg err'; m2.innerHTML = 'No se pudieron registrar:<br>' + ko.map(esc).join('<br>'); m2.hidden = false; }
      else detail();
    };
    // --- Clic en un número
    $$('[data-n]', box).forEach(b => b.onclick = () => numberModal(r, +b.dataset.n, tmap.get(+b.dataset.n), cmap.get(+b.dataset.n), detail));

    // --- Tiempo real (otro voluntario vende a la vez)
    unsubs.push(S.api.subscribe('raffle:' + cur, () => { if (!drawing && !document.querySelector('.modal-backdrop')) detail(); }));
  }
  await detail();

  function drawRandom(r, tickets, cmap, winners, refresh) {
    const used = new Set(winners.map(w => w.number));
    const pool = tickets.filter(t => t.status === 'vendido' && !used.has(t.number)).map(t => t.number);
    if (!pool.length) { toast('No quedan números vendidos sin premio', 'err'); return; }
    drawing = true;
    const m = openModal(`${modalHead('Sorteo al azar')}<p class="muted" style="text-align:center">Entre ${pool.length} números vendidos que aún no tienen premio</p><div class="drum" id="drum">?</div><p id="dname" style="text-align:center;font:800 1.4rem var(--f-display);min-height:1.6em"></p><div class="modal-actions" id="dact" hidden><button class="btn ghost small" data-close>Cerrar</button><button class="btn" id="dsave">${icon('trophy')} Guardar como premiado</button></div>`, { onClose: () => { drawing = false; refresh(); } });
    const drum = $('#drum', m.el); let i = 0; const pick = pool[crypto.getRandomValues(new Uint32Array(1))[0] % pool.length];
    const spin = () => { drum.textContent = pool[Math.random() * pool.length | 0]; if (++i < 32) setTimeout(spin, 40 + i * 6); else { drum.textContent = pick; $('#dname', m.el).textContent = cmap.get(pick)?.full_name || ''; $('#dact', m.el).hidden = false; confetti(); } };
    spin();
    $('#dsave', m.el).onclick = () => { m.close(); winnerForm(r, { position: winners.length + 1, number: pick, winner_name: cmap.get(pick)?.full_name || '', prize: '' }, cmap, winners, refresh); };
  }
}

function raffleForm(r, done) {
  const v = r || { title: '', description: '', ticket_price: 2, number_start: 1, total_numbers: 100, draw_date: '', location: '', status: 'preparacion' };
  const local = v.draw_date ? new Date(new Date(v.draw_date).getTime() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16) : '';
  const m = openModal(`${modalHead(r ? 'Editar sorteo' : 'Nuevo sorteo')}<form class="form">
    <div class="field"><label for="rf-t">Título</label><input id="rf-t" name="title" required value="${esc(v.title)}" placeholder="Ej. Cesta solidaria de Navidad"></div>
    <div class="field"><label for="rf-d">Descripción y premios</label><textarea id="rf-d" name="description" rows="3" style="min-height:80px">${esc(v.description)}</textarea></div>
    <div class="row"><div class="field"><label for="rf-p">Precio del número (€)</label><input id="rf-p" name="ticket_price" type="number" min="0" step="0.5" value="${v.ticket_price}"></div><div class="field"><label for="rf-s">Estado</label><select id="rf-s" name="status">${[['preparacion', 'En preparación'], ['venta', 'A la venta'], ['cerrado', 'Venta cerrada'], ['sorteado', 'Sorteado']].map(([a, b]) => `<option value="${a}" ${v.status === a ? 'selected' : ''}>${b}</option>`).join('')}</select></div></div>
    <div class="row"><div class="field"><label for="rf-n0">Primer número</label><input id="rf-n0" name="number_start" type="number" min="0" value="${v.number_start}" ${r ? 'disabled' : ''}></div><div class="field"><label for="rf-n">Cantidad de números</label><input id="rf-n" name="total_numbers" type="number" min="1" max="10000" value="${v.total_numbers}"><span class="hint">Ej. 100 → del 1 al 100</span></div></div>
    <div class="row"><div class="field"><label for="rf-dd">Fecha y hora del sorteo</label><input id="rf-dd" name="draw_date" type="datetime-local" value="${local}"></div><div class="field"><label for="rf-l">Lugar</label><input id="rf-l" name="location" value="${esc(v.location || '')}" placeholder="Ej. Mercadillo de la Plaza Porticada"></div></div>
    <div class="form-msg err" hidden></div><div class="modal-actions"><button type="button" class="btn ghost small" data-close>Cancelar</button><button class="btn" type="submit">${r ? 'Guardar cambios' : 'Crear sorteo'}</button></div></form>`);
  const f = $('form', m.el);
  f.onsubmit = async (e) => {
    e.preventDefault(); const d = formData(f), msg = $('.form-msg', f);
    if (!d.title?.trim()) { msg.textContent = 'Ponle un título.'; msg.hidden = false; return; }
    const row = { title: d.title.trim(), description: d.description, ticket_price: +d.ticket_price || 0, total_numbers: Math.max(1, Math.min(10000, +d.total_numbers || 100)), draw_date: d.draw_date ? new Date(d.draw_date).toISOString() : null, location: d.location, status: d.status };
    if (!r) row.number_start = +d.number_start || 0; else row.id = r.id;
    try { const saved = await S.api.raffles.save(row); m.close(); toast(r ? 'Sorteo actualizado' : 'Sorteo creado. Publícalo cuando esté listo.', 'ok'); done(saved); }
    catch (e2) { msg.textContent = e2.message; msg.hidden = false; }
  };
}

function numberModal(r, n, t, c, refresh) {
  const sold = !!t;
  const m = openModal(`${modalHead(`Número <span style="color:var(--pink)">${n}</span>`)}
    ${sold ? `<p><span class="tag ${t.status === 'reservado' ? 'sun' : 'pink'}">${t.status === 'reservado' ? 'Reservado' : 'Vendido'}</span> <span class="muted">En la web aparece como "<b>${esc(t.holder_label)}</b>"</span></p>` : '<p><span class="tag ok">Libre</span></p>'}
    <form class="form"><div class="field"><label for="nm-n">Nombre y apellidos</label><input id="nm-n" name="full_name" required value="${esc(c?.full_name || '')}"></div>
    <div class="row"><div class="field"><label for="nm-p">Teléfono</label><input id="nm-p" name="phone" type="tel" value="${esc(c?.phone || '')}"></div><div class="field"><label for="nm-e">Correo</label><input id="nm-e" name="email" type="email" value="${esc(c?.email || '')}"></div></div>
    <div class="field"><label for="nm-no">Notas</label><input id="nm-no" name="notes" value="${esc(c?.notes || '')}" placeholder="Ej. lo recoge su hermana"></div>
    <div style="display:flex;gap:20px;flex-wrap:wrap"><label class="check"><input type="checkbox" name="paid" ${!c || c.paid ? 'checked' : ''}> Pagado</label><label class="check"><input type="checkbox" name="reserved" ${t?.status === 'reservado' ? 'checked' : ''}> Solo reservado</label></div>
    <div class="form-msg err" hidden></div>
    <div class="modal-actions">${sold ? `<button type="button" class="btn small danger" id="nm-free" style="margin-right:auto">${icon('trash')} Liberar número</button>` : ''}<button type="button" class="btn ghost small" data-close>Cancelar</button><button class="btn" type="submit">${sold ? 'Guardar cambios' : 'Marcar como vendido'}</button></div></form>`);
  const f = $('form', m.el);
  f.onsubmit = async (e) => {
    e.preventDefault(); const d = formData(f), msg = $('.form-msg', f);
    if (!d.full_name?.trim()) { msg.textContent = 'Escribe el nombre del comprador.'; msg.hidden = false; return; }
    try { await S.api.tickets.sell(r.id, n, { ...d, paid: !!d.paid, status: d.reserved ? 'reservado' : 'vendido' }, sold); m.close(); toast(`Número ${n} guardado`, 'ok'); refresh(); }
    catch (e2) { msg.textContent = e2.message; msg.hidden = false; }
  };
  const fr = $('#nm-free', m.el);
  if (fr) fr.onclick = async () => { m.close(); if (await confirmBox(`¿Liberar el número ${n}? Se borrarán los datos de ${esc(c?.full_name || 'su comprador')}.`, { ok: 'Liberar', danger: true })) { try { await S.api.tickets.release(r.id, n); toast(`Número ${n} libre`, 'ok'); } catch (e2) { toast(e2.message, 'err'); } } refresh(); };
}

function winnerForm(r, w, cmap, winners, refresh) {
  const v = w || { position: winners.length + 1, prize: '', number: '', winner_name: '' };
  const m = openModal(`${modalHead(w?.id ? 'Editar premio' : 'Nuevo premio')}<form class="form">
    <div class="row"><div class="field"><label for="wf-pos">Puesto</label><input id="wf-pos" name="position" type="number" min="1" value="${v.position}"></div><div class="field"><label for="wf-num">Número premiado</label><input id="wf-num" name="number" type="number" value="${v.number ?? ''}"><span class="hint" id="wf-hint"></span></div></div>
    <div class="field"><label for="wf-prize">Premio</label><input id="wf-prize" name="prize" required value="${esc(v.prize)}" placeholder="Ej. Cesta de productos de Cantabria"></div>
    <div class="field"><label for="wf-name">Nombre que se publica</label><input id="wf-name" name="winner_name" value="${esc(v.winner_name)}"><span class="hint">Se rellena solo con el comprador del número. Puedes acortarlo (p. ej. "María G.").</span></div>
    <label class="check"><input type="checkbox" name="published" ${v.published ? 'checked' : ''}> Visible en la web (si los resultados están publicados)</label>
    <div class="form-msg err" hidden></div><div class="modal-actions"><button type="button" class="btn ghost small" data-close>Cancelar</button><button class="btn" type="submit">Guardar</button></div></form>`);
  const f = $('form', m.el), num = $('#wf-num', f), name = $('#wf-name', f), hint = $('#wf-hint', f);
  num.oninput = () => { const c = cmap.get(+num.value); hint.textContent = num.value === '' ? '' : c ? 'Comprador: ' + c.full_name : 'Este número no está vendido'; if (c && !name.value) name.value = c.full_name; };
  num.oninput();
  f.onsubmit = async (e) => {
    e.preventDefault(); const d = formData(f), msg = $('.form-msg', f);
    if (!d.prize?.trim()) { msg.textContent = 'Escribe el premio.'; msg.hidden = false; return; }
    try { await S.api.winners.save({ ...(w?.id ? { id: w.id } : {}), raffle_id: r.id, position: +d.position || 1, prize: d.prize.trim(), number: d.number === '' ? null : +d.number, winner_name: d.winner_name.trim(), published: !!d.published }); m.close(); toast('Premio guardado', 'ok'); refresh(); }
    catch (e2) { msg.textContent = e2.message; msg.hidden = false; }
  };
}

// ---------------------------------------------------------------------
//  PEDIDOS
// ---------------------------------------------------------------------
const ORDER_ST = [['nuevo', 'Nuevo', 'sun'], ['confirmado', 'Confirmado', ''], ['preparado', 'Preparado', 'pink'], ['entregado', 'Entregado', 'ok'], ['cancelado', 'Cancelado', 'bad']];
async function pedidos(main) {
  const orders = await S.api.orders.list();
  let filter = 'activos';
  const draw = () => {
    const list = orders.filter(o => filter === 'todos' || (filter === 'activos' ? !['entregado', 'cancelado'].includes(o.status) : o.status === filter));
    main.innerHTML = `${head('Pedidos', 'Cambia el estado según avance cada pedido.', `<button class="btn small ghost" id="ocsv" ${orders.length ? '' : 'disabled'}>${icon('download')} Exportar</button>`)}
    <div class="shop-toolbar" style="margin:0">${[['activos', 'Pendientes'], ['todos', 'Todos'], ...ORDER_ST.map(s => [s[0], s[1]])].map(([v, t]) => `<button class="chip ${filter === v ? 'on' : ''}" data-f="${v}">${t}</button>`).join('')}</div>
    <div class="table-wrap"><table class="tbl"><thead><tr><th>Pedido</th><th>Cliente</th><th>Productos</th><th>Total</th><th>Pago</th><th>Entrega</th><th>Estado</th>${isAdmin() ? '<th></th>' : ''}</tr></thead><tbody>
    ${list.map(o => `<tr><td><b>${esc(o.code)}</b><div class="muted" style="font-size:.82rem">${fmtDateTime(o.created_at)}</div></td>
      <td><b>${esc(o.name)}</b><div style="font-size:.85rem"><a href="mailto:${esc(o.email)}">${esc(o.email)}</a>${o.phone ? '<br>' + esc(o.phone) : ''}</div></td>
      <td style="font-size:.9rem">${o.items.map(i => `${i.qty}× ${esc(i.name)}`).join('<br>')}${o.notes ? `<div class="muted" style="font-size:.82rem;margin-top:4px">“${esc(o.notes)}”</div>` : ''}</td>
      <td><b>${fmtMoney(o.total)}</b></td><td style="font-size:.85rem">${({ en_mano: 'En mano', bizum: 'Bizum', transferencia: 'Transferencia', tarjeta: 'Tarjeta' })[o.payment_method || 'en_mano']}<br><label class="check" style="font-size:.82rem;margin-top:4px"><input type="checkbox" data-paid="${o.id}" ${o.paid ? 'checked' : ''}> Cobrado</label></td><td style="font-size:.88rem">${o.delivery === 'envio' ? 'Envío:<br>' + esc(o.address || '') : 'Recogida'}</td>
      <td><select data-st="${o.id}" aria-label="Estado del pedido ${esc(o.code)}" style="border:2px solid var(--line);border-radius:10px;padding:6px;font:inherit">${ORDER_ST.map(([v, t]) => `<option value="${v}" ${o.status === v ? 'selected' : ''}>${t}</option>`).join('')}</select></td>
      ${isAdmin() ? `<td><button class="btn tiny danger" data-del="${o.id}" aria-label="Borrar">${icon('trash')}</button></td>` : ''}</tr>`).join('') || `<tr><td colspan="7" class="muted">No hay pedidos aquí.</td></tr>`}</tbody></table></div>`;
    $$('[data-f]', main).forEach(b => b.onclick = () => { filter = b.dataset.f; draw(); });
    $$('[data-st]', main).forEach(s => s.onchange = async () => { try { await S.api.orders.setStatus(s.dataset.st, s.value); orders.find(o => o.id === s.dataset.st).status = s.value; toast('Estado actualizado', 'ok'); } catch (e) { toast(e.message, 'err'); } });
    $$('[data-paid]', main).forEach(c => c.onchange = async () => { try { await S.api.orders.setPaid(c.dataset.paid, c.checked); orders.find(o => o.id === c.dataset.paid).paid = c.checked; toast(c.checked ? 'Marcado como cobrado' : 'Marcado como pendiente de cobro', 'ok'); } catch (e) { toast(e.message, 'err'); c.checked = !c.checked; } });
    $$('[data-del]', main).forEach(b => b.onclick = async () => { if (await confirmBox('¿Borrar este pedido definitivamente?', { ok: 'Borrar', danger: true })) { await S.api.orders.remove(b.dataset.del); orders.splice(orders.findIndex(o => o.id === b.dataset.del), 1); draw(); } });
    $('#ocsv', main).onclick = () => downloadCSV('pedidos-pelones.csv', [['Código', 'Fecha', 'Nombre', 'Correo', 'Teléfono', 'Productos', 'Total', 'Pago', 'Cobrado', 'Entrega', 'Dirección', 'Notas', 'Estado'], ...orders.map(o => [o.code, fmtDateTime(o.created_at), o.name, o.email, o.phone, o.items.map(i => `${i.qty}x ${i.name}`).join(' | '), o.total, o.payment_method, o.paid ? 'Sí' : 'No', o.delivery, o.address, o.notes, o.status])]);
  };
  draw();
}

// ---------------------------------------------------------------------
//  MENSAJES
// ---------------------------------------------------------------------
async function mensajes(main) {
  const msgs = await S.api.messages.list();
  const subj = { general: 'Información', pedido: 'Pedido', voluntariado: 'Voluntariado', evento: 'Evento', patrocinio: 'Patrocinio', otro: 'Otro' };
  main.innerHTML = `${head('Mensajes', 'Lo que llega desde el formulario de contacto.')}
  <div style="display:grid;gap:14px">${msgs.map(m => `<div class="card" style="${m.handled ? 'opacity:.7' : ''}"><div style="display:flex;justify-content:space-between;gap:10px;flex-wrap:wrap;align-items:center"><div><b style="font:800 1.1rem var(--f-display)">${esc(m.name)}</b> <span class="tag">${subj[m.subject] || esc(m.subject)}</span> <span class="tag ${m.handled ? 'ok' : 'sun'}">${m.handled ? 'Atendido' : 'Pendiente'}</span></div><span class="muted" style="font-size:.88rem">${fmtDateTime(m.created_at)}</span></div>
    <p style="margin:12px 0;white-space:pre-wrap">${esc(m.message)}</p><div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center"><a class="btn tiny blue" href="mailto:${esc(m.email)}?subject=${encodeURIComponent('Pelones Cantabria · Respuesta a tu mensaje')}">${icon('mail')} Responder</a><span class="muted" style="font-size:.88rem">${esc(m.email)}${m.phone ? ' · ' + esc(m.phone) : ''}</span>
    <span style="margin-left:auto" class="row-actions"><button class="btn tiny ghost" data-h="${m.id}">${m.handled ? 'Marcar pendiente' : icon('check') + ' Atendido'}</button>${isAdmin() ? `<button class="btn tiny danger" data-d="${m.id}" aria-label="Borrar">${icon('trash')}</button>` : ''}</span></div></div>`).join('') || `<div class="empty">${pelonSVG({ wink: true })}<p>No hay mensajes todavía.</p></div>`}</div>`;
  $$('[data-h]', main).forEach(b => b.onclick = async () => { const m = msgs.find(x => x.id === b.dataset.h); await S.api.messages.setHandled(m.id, !m.handled); mensajes(main); });
  $$('[data-d]', main).forEach(b => b.onclick = async () => { if (await confirmBox('¿Borrar este mensaje?', { ok: 'Borrar', danger: true })) { await S.api.messages.remove(b.dataset.d); mensajes(main); } });
}

// ---------------------------------------------------------------------
//  Subida de imagen (archivo o URL)
// ---------------------------------------------------------------------
const imageField = (val) => `<div class="field"><label for="img-url">Imagen</label><div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap"><input id="img-url" name="image_url" value="${esc(val && !String(val).startsWith('data:') ? val : '')}" placeholder="Pega una URL o sube una foto" style="flex:1;min-width:160px"><label class="btn small ghost" style="cursor:pointer">${icon('upload')} Subir<input type="file" accept="image/*" id="img-file" hidden></label></div><input type="hidden" name="image_data" value="${esc(val && String(val).startsWith('data:') ? val : '')}"><div id="img-prev" style="margin-top:8px">${val ? `<img src="${esc(safeUrl(val))}" alt="" style="max-height:120px;border-radius:12px">` : ''}</div></div>`;
function bindImage(f) {
  const file = $('#img-file', f); if (!file) return;
  file.onchange = async () => {
    const fl = file.files[0]; if (!fl) return;
    const prev = $('#img-prev', f); prev.innerHTML = '<span class="muted">Subiendo…</span>';
    try { const url = await S.api.upload(fl); if (url.startsWith('data:')) { f.image_data.value = url; f.image_url.value = ''; } else f.image_url.value = url; prev.innerHTML = `<img src="${esc(url)}" alt="" style="max-height:120px;border-radius:12px">`; }
    catch (e) { prev.innerHTML = `<span class="form-msg err">${esc(e.message)}</span>`; }
  };
}
const imgVal = (d) => d.image_url?.trim() || d.image_data || null;

// ---------------------------------------------------------------------
//  NOTICIAS
// ---------------------------------------------------------------------
async function noticias(main) {
  const list = await S.api.news.list(true);
  main.innerHTML = `${head('Noticias y agenda', 'Las noticias con fecha futura aparecen en "Próximas citas".', `<button class="btn" id="nn">${icon('plus')} Nueva</button>`)}
  <div class="table-wrap"><table class="tbl"><thead><tr><th>Fecha</th><th>Título</th><th>Tipo</th><th>Estado</th><th></th></tr></thead><tbody>${list.map(n => `<tr><td style="white-space:nowrap">${fmtDate(n.event_date || n.created_at, { day: 'numeric', month: 'short', year: 'numeric' })}</td><td><b>${esc(n.title)}</b></td><td><span class="tag">${esc(n.kind)}</span></td><td><span class="tag ${n.published ? 'ok' : 'sun'}">${n.published ? 'Publicada' : 'Borrador'}</span></td><td><div class="row-actions"><button class="btn tiny ghost" data-e="${n.id}" aria-label="Editar">${icon('edit')}</button><button class="btn tiny danger" data-d="${n.id}" aria-label="Borrar">${icon('trash')}</button></div></td></tr>`).join('') || '<tr><td colspan="5" class="muted">Sin noticias.</td></tr>'}</tbody></table></div>`;
  const form = (n) => {
    const v = n || { title: '', excerpt: '', body: '', kind: 'evento', event_date: '', location: '', link: '', image_url: '', published: true };
    const m = openModal(`${modalHead(n ? 'Editar noticia' : 'Nueva noticia')}<form class="form">
      <div class="field"><label for="nf-t">Título</label><input id="nf-t" name="title" required value="${esc(v.title)}"></div>
      <div class="row"><div class="field"><label for="nf-k">Tipo</label><select id="nf-k" name="kind">${[['evento', 'Evento / próxima cita'], ['logro', 'Logro'], ['noticia', 'Noticia']].map(([a, b]) => `<option value="${a}" ${v.kind === a ? 'selected' : ''}>${b}</option>`).join('')}</select></div><div class="field"><label for="nf-d">Fecha</label><input id="nf-d" name="event_date" type="date" value="${esc(v.event_date || '')}"></div></div>
      <div class="field"><label for="nf-l">Lugar</label><input id="nf-l" name="location" value="${esc(v.location || '')}"></div>
      <div class="field"><label for="nf-e">Resumen</label><textarea id="nf-e" name="excerpt" rows="2" style="min-height:70px">${esc(v.excerpt)}</textarea></div>
      <div class="field"><label for="nf-b">Texto completo <span class="muted">(opcional)</span></label><textarea id="nf-b" name="body" rows="5">${esc(v.body || '')}</textarea></div>
      <div class="field"><label for="nf-u">Enlace externo <span class="muted">(opcional)</span></label><input id="nf-u" name="link" type="url" value="${esc(v.link || '')}"></div>
      ${imageField(v.image_url)}<label class="check"><input type="checkbox" name="published" ${v.published ? 'checked' : ''}> Publicada</label>
      <div class="form-msg err" hidden></div><div class="modal-actions"><button type="button" class="btn ghost small" data-close>Cancelar</button><button class="btn" type="submit">Guardar</button></div></form>`, { wide: true });
    const f = $('form', m.el); bindImage(f);
    f.onsubmit = async (e) => { e.preventDefault(); const d = formData(f);
      try { await S.api.news.save({ ...(n ? { id: n.id } : {}), title: d.title.trim(), kind: d.kind, event_date: d.event_date || null, location: d.location, excerpt: d.excerpt, body: d.body, link: d.link || null, image_url: imgVal(d), published: !!d.published }); m.close(); toast('Noticia guardada', 'ok'); noticias(main); }
      catch (e2) { const msg = $('.form-msg', f); msg.textContent = e2.message; msg.hidden = false; } };
  };
  $('#nn', main).onclick = () => form(null);
  $$('[data-e]', main).forEach(b => b.onclick = () => form(list.find(x => x.id === b.dataset.e)));
  $$('[data-d]', main).forEach(b => b.onclick = async () => { if (await confirmBox('¿Borrar esta noticia?', { ok: 'Borrar', danger: true })) { await S.api.news.remove(b.dataset.d); noticias(main); } });
}

// ---------------------------------------------------------------------
//  PRODUCTOS
// ---------------------------------------------------------------------
async function productos(main) {
  const list = await S.api.products.list(true);
  main.innerHTML = `${head('Productos', 'Sin foto, el producto se muestra con un pelón ilustrado con los colores que elijas.', `<button class="btn" id="np">${icon('plus')} Nuevo producto</button>`)}
  <div class="grid c3">${list.map(p => `<div class="card" style="display:grid;grid-template-columns:70px 1fr;gap:14px;align-items:center;${p.active ? '' : 'opacity:.55'}"><div style="width:70px;height:70px;border-radius:16px;background:var(--pink-100);display:grid;place-items:center;overflow:hidden">${p.image_url ? `<img src="${esc(safeUrl(p.image_url))}" alt="" style="width:100%;height:100%;object-fit:cover">` : `<div style="width:80%">${productArt(p)}</div>`}</div>
    <div style="min-width:0"><b>${esc(p.name)}</b><div class="muted" style="font-size:.88rem">${fmtMoney(p.price)} · ${esc(p.category)}${p.active ? '' : ' · oculto'}</div><div class="row-actions" style="margin-top:6px"><button class="btn tiny ghost" data-e="${p.id}">${icon('edit')} Editar</button><button class="btn tiny danger" data-d="${p.id}" aria-label="Borrar">${icon('trash')}</button></div></div></div>`).join('')}</div>`;
  const form = (p) => {
    const v = p || { name: '', description: '', category: 'muñecos', price: 5, stock: 'disponible', featured: false, active: true, sort: list.length + 1, colors: { theme: 'clasico' }, image_url: '' };
    const m = openModal(`${modalHead(p ? 'Editar producto' : 'Nuevo producto')}<form class="form">
      <div class="row"><div class="field"><label for="pf-n">Nombre</label><input id="pf-n" name="name" required value="${esc(v.name)}"></div><div class="field"><label for="pf-c">Categoría</label><input id="pf-c" name="category" list="cats" value="${esc(v.category)}"><datalist id="cats"><option>muñecos</option><option>equipos</option><option>temporada</option><option>broches</option><option>imanes</option><option>llaveros</option><option>pulseras</option><option>lápices</option><option>encargos</option><option>otros</option></datalist></div></div>
      <div class="field"><label for="pf-d">Descripción</label><textarea id="pf-d" name="description" rows="3" style="min-height:80px">${esc(v.description)}</textarea></div>
      <div class="row"><div class="field"><label for="pf-p">Precio (€)</label><input id="pf-p" name="price" type="number" min="0" step="0.5" value="${v.price ?? ''}"><span class="hint">Vacío = "Consultar"</span></div><div class="field"><label for="pf-s">Disponibilidad</label><select id="pf-s" name="stock">${[['disponible', 'Disponible'], ['bajo_pedido', 'Bajo pedido'], ['agotado', 'Agotado']].map(([a, b]) => `<option value="${a}" ${v.stock === a ? 'selected' : ''}>${b}</option>`).join('')}</select></div></div>
      <div class="row"><div class="field"><label for="pf-th">Diseño del pelón</label><select id="pf-th" name="theme"><option value="">Colores personalizados</option>${Object.entries(THEMES).map(([k, t]) => `<option value="${k}" ${v.colors?.theme === k ? 'selected' : ''}>${t.name}</option>`).join('')}</select><span class="hint">Se usa cuando no hay foto.</span></div><div id="pf-prev" style="width:110px;justify-self:center">${productArt(v)}</div></div>
      <div class="row" id="pf-custom" ${v.colors?.theme ? 'hidden' : ''}><div class="field"><label for="pf-b">Color del pañuelo</label><input id="pf-b" name="band" type="color" value="${v.colors?.band || '#1d6fb8'}" style="height:48px;padding:4px"></div><div class="field"><label for="pf-k">Color del nudo</label><input id="pf-k" name="knot" type="color" value="${v.colors?.knot || '#ec4f8e'}" style="height:48px;padding:4px"></div></div>
      ${imageField(v.image_url)}
      <div style="display:flex;gap:20px;flex-wrap:wrap;align-items:center"><label class="check"><input type="checkbox" name="featured" ${v.featured ? 'checked' : ''}> Destacado en inicio</label><label class="check"><input type="checkbox" name="active" ${v.active ? 'checked' : ''}> Visible en la tienda</label><label class="field" style="width:110px"><span style="font-size:.85rem">Orden</span><input name="sort" type="number" value="${v.sort}"></label></div>
      <div class="form-msg err" hidden></div><div class="modal-actions"><button type="button" class="btn ghost small" data-close>Cancelar</button><button class="btn" type="submit">Guardar</button></div></form>`, { wide: true });
    const f = $('form', m.el); bindImage(f);
    const prev = () => { const d = formData(f); $('#pf-custom', f).hidden = !!d.theme; $('#pf-prev', f).innerHTML = productArt({ colors: d.theme ? { theme: d.theme } : { band: d.band, knot: d.knot } }); };
    ['#pf-th', '#pf-b', '#pf-k'].forEach(q => $(q, f).addEventListener('input', prev));
    f.onsubmit = async (e) => { e.preventDefault(); const d = formData(f);
      try { await S.api.products.save({ ...(p ? { id: p.id } : {}), name: d.name.trim(), category: (d.category || 'otros').trim().toLowerCase(), description: d.description, price: d.price === '' ? null : +d.price, stock: d.stock, colors: d.theme ? { theme: d.theme } : { band: d.band, knot: d.knot }, image_url: imgVal(d), featured: !!d.featured, active: !!d.active, sort: +d.sort || 0 }); m.close(); toast('Producto guardado', 'ok'); productos(main); }
      catch (e2) { const msg = $('.form-msg', f); msg.textContent = e2.message; msg.hidden = false; } };
  };
  $('#np', main).onclick = () => form(null);
  $$('[data-e]', main).forEach(b => b.onclick = () => form(list.find(x => x.id === b.dataset.e)));
  $$('[data-d]', main).forEach(b => b.onclick = async () => { if (await confirmBox('¿Borrar este producto? Si solo quieres ocultarlo, edítalo y desmarca "Visible".', { ok: 'Borrar', danger: true })) { await S.api.products.remove(b.dataset.d); productos(main); } });
}

// ---------------------------------------------------------------------
//  GALERÍA
// ---------------------------------------------------------------------
async function galeria(main) {
  const list = await S.api.gallery.list(true);
  main.innerHTML = `${head('Galería', 'Sube fotos de mercadillos, talleres y entregas. Se reducen automáticamente para que carguen rápido.')}
  <div class="card"><form class="form" id="gup"><div class="row"><div class="field"><label for="g-t">Título</label><input id="g-t" name="title" placeholder="Ej. Mercadillo de Navidad 2026"></div><div class="field"><label for="g-c">Categoría</label><input id="g-c" name="category" list="gcats" value="eventos"><datalist id="gcats"><option>eventos</option><option>taller</option><option>entregas</option><option>pelones</option><option>campañas</option></datalist></div></div>
  <div class="field"><label for="g-f">Fotos</label><input id="g-f" type="file" accept="image/*" multiple></div><div class="form-msg" hidden></div><button class="btn" type="submit">${icon('upload')} Subir fotos</button></form></div>
  <div class="masonry">${list.map(g => `<figure style="cursor:default;${g.published ? '' : 'opacity:.5'}"><img src="${esc(safeUrl(g.image_url))}" alt="${esc(g.title)}" loading="lazy"><figcaption><span>${esc(g.title || 'Sin título')}</span><span class="row-actions"><button class="btn tiny ghost" data-p="${g.id}">${g.published ? 'Ocultar' : 'Mostrar'}</button><button class="btn tiny danger" data-d="${g.id}" aria-label="Borrar">${icon('trash')}</button></span></figcaption></figure>`).join('')}</div>`;
  const f = $('#gup', main);
  f.onsubmit = async (e) => {
    e.preventDefault(); const files = [...$('#g-f', f).files], msg = $('.form-msg', f), btn = $('[type=submit]', f);
    if (!files.length) { msg.className = 'form-msg err'; msg.textContent = 'Elige al menos una foto.'; msg.hidden = false; return; }
    busy(btn, true, `Subiendo 0/${files.length}…`);
    try { let i = 0; for (const fl of files) { const url = await S.api.upload(fl); await S.api.gallery.save({ title: f.title.value || fl.name.replace(/\.[^.]+$/, ''), category: f.category.value || 'eventos', image_url: url, published: true }); btn.innerHTML = `Subiendo ${++i}/${files.length}…`; } toast('Fotos subidas', 'ok'); galeria(main); }
    catch (e2) { msg.className = 'form-msg err'; msg.textContent = e2.message + (S.api.mode === 'demo' ? ' (En la demo el espacio del navegador es limitado.)' : ''); msg.hidden = false; busy(btn, false); }
  };
  $$('[data-p]', main).forEach(b => b.onclick = async () => { const g = list.find(x => x.id === b.dataset.p); await S.api.gallery.save({ id: g.id, published: !g.published }); galeria(main); });
  $$('[data-d]', main).forEach(b => b.onclick = async () => { if (await confirmBox('¿Borrar esta foto?', { ok: 'Borrar', danger: true })) { await S.api.gallery.remove(b.dataset.d); galeria(main); } });
}

// ---------------------------------------------------------------------
//  COLABORADORES
// ---------------------------------------------------------------------
async function colaboradores(main) {
  const list = await S.api.partners.list(true);
  main.innerHTML = `${head('Colaboradores', 'Sube el logo o una foto de cada colaborador. Sin imagen se muestran sus iniciales.', `<button class="btn" id="npa">${icon('plus')} Nuevo</button>`)}
  <div class="logo-wall">${list.map(p => `<div class="partner" style="${p.active ? '' : 'opacity:.5'}">${p.logo_url ? `<span class="logo"><img src="${esc(safeUrl(p.logo_url))}" alt=""></span>` : `<span class="mono" style="background:${esc(p.color)}">${esc(p.name.slice(0, 2).toUpperCase())}</span>`}<b>${esc(p.name)}</b><small>${esc(p.grp)}</small><div class="row-actions"><button class="btn tiny ghost" data-e="${p.id}">${icon('edit')} Editar</button><button class="btn tiny danger" data-d="${p.id}" aria-label="Borrar">${icon('trash')}</button></div></div>`).join('')}</div>`;
  const form = (p) => {
    const v = p || { name: '', description: '', grp: 'Nos apoyan', url: '', logo_url: '', color: '#ec4f8e', sort: list.length + 1, active: true };
    const m = openModal(`${modalHead(p ? 'Editar colaborador' : 'Nuevo colaborador')}<form class="form">
      <div class="field"><label for="pa-n">Nombre</label><input id="pa-n" name="name" required value="${esc(v.name)}"></div>
      <div class="field"><label for="pa-d">Descripción</label><input id="pa-d" name="description" value="${esc(v.description)}"></div>
      <div class="row"><div class="field"><label for="pa-g">Grupo</label><select id="pa-g" name="grp">${['Destino de la ayuda', 'Nos apoyan', 'Patrocinadores'].map(g => `<option ${v.grp === g ? 'selected' : ''}>${g}</option>`).join('')}</select></div><div class="field"><label for="pa-u">Web</label><input id="pa-u" name="url" type="url" value="${esc(v.url || '')}"></div></div>
      ${imageField(v.logo_url).replace('>Imagen<', '>Logo o foto<')}
      <div class="row"><div class="field"><label for="pa-c">Color (sin logo)</label><input id="pa-c" name="color" type="color" value="${esc(v.color)}" style="height:48px;padding:4px"></div><div class="field"><label for="pa-s">Orden</label><input id="pa-s" name="sort" type="number" value="${v.sort}"></div></div>
      <label class="check"><input type="checkbox" name="active" ${v.active ? 'checked' : ''}> Visible en la web</label>
      <p class="muted" style="font-size:.85rem;margin:0">Usa logos con permiso de cada entidad.</p>
      <div class="form-msg err" hidden></div><div class="modal-actions"><button type="button" class="btn ghost small" data-close>Cancelar</button><button class="btn" type="submit">Guardar</button></div></form>`, { wide: true });
    const f = $('form', m.el); bindImage(f);
    f.onsubmit = async (e) => { e.preventDefault(); const d = formData(f);
      try { await S.api.partners.save({ ...(p ? { id: p.id } : {}), name: d.name.trim(), description: d.description, grp: d.grp, url: d.url || null, logo_url: imgVal(d), color: d.color, sort: +d.sort || 0, active: !!d.active }); m.close(); toast('Colaborador guardado', 'ok'); colaboradores(main); }
      catch (e2) { const msg = $('.form-msg', f); msg.textContent = e2.message; msg.hidden = false; } };
  };
  $('#npa', main).onclick = () => form(null);
  $$('[data-e]', main).forEach(b => b.onclick = () => form(list.find(x => x.id === b.dataset.e)));
  $$('[data-d]', main).forEach(b => b.onclick = async () => { if (await confirmBox('¿Quitar este colaborador?', { ok: 'Quitar', danger: true })) { await S.api.partners.remove(b.dataset.d); colaboradores(main); } });
}

// ---------------------------------------------------------------------
//  USUARIOS
// ---------------------------------------------------------------------
async function usuarios(main) {
  const list = await S.api.users.list();
  main.innerHTML = `${head('Usuarios y permisos', '<b>Voluntario</b>: vende números de sorteo, ve pedidos y mensajes. <b>Administración</b>: además publica, edita contenido y gestiona permisos.')}
  <div class="search" style="max-width:380px">${icon('search')}<input id="uq" placeholder="Buscar por nombre o correo" aria-label="Buscar usuario"></div>
  <div class="table-wrap"><table class="tbl"><thead><tr><th>Nombre</th><th>Correo</th><th>Alta</th><th>Permisos</th></tr></thead><tbody id="ub"></tbody></table></div>`;
  const draw = (q = '') => { $('#ub', main).innerHTML = list.filter(u => !q || (u.full_name + ' ' + u.email).toLowerCase().includes(q)).map(u => `<tr><td><b>${esc(u.full_name || '—')}</b></td><td>${esc(u.email || '')}</td><td>${fmtDate(u.created_at, { day: 'numeric', month: 'short', year: 'numeric' })}</td><td><select data-u="${u.id}" ${u.id === S.session.user.id ? 'disabled title="No puedes cambiar tus propios permisos"' : ''} aria-label="Permisos de ${esc(u.full_name)}" style="border:2px solid var(--line);border-radius:10px;padding:6px;font:inherit">${['user', 'staff', 'admin'].map(r => `<option value="${r}" ${u.role === r ? 'selected' : ''}>${roleName[r]}</option>`).join('')}</select></td></tr>`).join('');
    $$('[data-u]', main).forEach(s => s.onchange = async () => { try { await S.api.users.setRole(s.dataset.u, s.value); list.find(u => u.id === s.dataset.u).role = s.value; toast('Permisos actualizados', 'ok'); } catch (e) { toast(e.message, 'err'); } }); };
  $('#uq', main).oninput = (e) => draw(e.target.value.toLowerCase()); draw();
}

// ---------------------------------------------------------------------
//  AJUSTES
// ---------------------------------------------------------------------
async function ajustes(main) {
  const s = await S.api.settings.get();
  const F = [['contact_email', 'Correo de contacto', 'email', 'hola@…'], ['whatsapp', 'WhatsApp (con prefijo)', 'tel', '+34 600 000 000'], ['phone', 'Teléfono', 'tel', ''], ['address', 'Dirección / zona', 'text', 'Santander, Cantabria'], ['facebook', 'Facebook', 'url', ''], ['instagram', 'Instagram', 'url', ''], ['twitter', 'X (Twitter)', 'url', ''], ['migranodearena', 'Mi Grano de Arena', 'url', ''], ['pay_bizum', 'Bizum (teléfono de la asociación)', 'tel', '600 000 000'], ['pay_iban', 'IBAN para transferencias', 'text', 'ES00 0000 0000 0000 0000 0000'], ['pay_holder', 'Titular de la cuenta', 'text', 'Asociación Pelones Cantabria'], ['pay_card_url', 'Enlace de pago con tarjeta', 'url', 'https://buy.stripe.com/…', 'Crea un enlace de pago gratis en Stripe (stripe.com → Payment Links) o PayPal y pégalo aquí. Stripe cobra una pequeña comisión por pago; no hay cuota fija.']];
  main.innerHTML = `${head('Ajustes de la web', 'Datos de contacto y redes que aparecen en toda la web. Si dejas un campo vacío, no se muestra.')}
  <div class="card"><form class="form" id="sf"><h3>${icon('mail')} Contacto y redes</h3>${F.filter(f => !f[0].startsWith('pay_')).map(([k, l, t, ph]) => `<div class="field"><label for="s-${k}">${l}</label><input id="s-${k}" name="${k}" type="${t}" value="${esc(s[k] || '')}" placeholder="${ph}"></div>`).join('')}
  <h3 style="margin-top:14px">${icon('euro')} Pagos</h3><p class="muted" style="margin-top:-6px">Cada método aparece en los pedidos y en "Haz un donativo" en cuanto rellenas su dato. Vacío = "Próximamente".</p>
  <label class="check"><input type="checkbox" name="pay_cash" ${s.pay_cash !== false ? 'checked' : ''}> Permitir pago en mano al recoger</label>
  ${F.filter(f => f[0].startsWith('pay_')).map(([k, l, t, ph, hint]) => `<div class="field"><label for="s-${k}">${l}</label><input id="s-${k}" name="${k}" type="${t}" value="${esc(s[k] || '')}" placeholder="${ph}">${hint ? `<span class="hint">${hint}</span>` : ''}</div>`).join('')}
  <div class="form-msg" hidden></div><button class="btn" type="submit">Guardar ajustes</button></form></div>
  ${S.api.mode === 'demo' ? `<div class="card"><h3>Datos de demostración</h3><p class="muted">Borra todo lo que has probado en este navegador y vuelve al estado inicial.</p><button class="btn danger small" id="reset">Reiniciar demo</button></div>` : ''}`;
  $('#sf', main).onsubmit = async (e) => {
    e.preventDefault(); const d = formData(e.target), msg = $('.form-msg', e.target);
    try { for (const [k] of F) if ((s[k] || '') !== (d[k] || '').trim()) await S.api.settings.set(k, (d[k] || '').trim()); if ((s.pay_cash !== false) !== !!d.pay_cash) await S.api.settings.set('pay_cash', !!d.pay_cash); Object.assign(S.settings, await S.api.settings.get()); document.dispatchEvent(new Event('pelones:settings')); msg.className = 'form-msg ok'; msg.textContent = 'Ajustes guardados.'; msg.hidden = false; }
    catch (e2) { msg.className = 'form-msg err'; msg.textContent = e2.message; msg.hidden = false; }
  };
  const r = $('#reset', main); if (r) r.onclick = async () => { if (await confirmBox('Se borrarán pedidos, sorteos, mensajes y cuentas de prueba de este navegador.', { ok: 'Reiniciar', danger: true })) { S.api.resetDemo(); location.hash = 'inicio'; location.reload(); } };
}

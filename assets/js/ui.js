// Utilidades compartidas de interfaz
import { icon } from './content.js';

export const S = {
  api: null, session: null, settings: {}, mode: 'classic', cart: [],
  route: 'inicio', world: null,
};

export const $ = (s, r = document) => r.querySelector(s);
export const $$ = (s, r = document) => [...r.querySelectorAll(s)];
export const esc = (s) => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
export const fmtMoney = (n) => (n === null || n === undefined || n === '') ? 'Consultar' : Number(n).toLocaleString('es-ES', { style: 'currency', currency: 'EUR' });
export const fmtDate = (d, opts = { day: 'numeric', month: 'long', year: 'numeric' }) => { if (!d) return ''; const x = new Date(String(d).length === 10 ? d + 'T12:00:00' : d); return isNaN(x) ? '' : x.toLocaleDateString('es-ES', opts); };
export const fmtDateTime = (d) => { if (!d) return ''; const x = new Date(d); return isNaN(x) ? '' : x.toLocaleString('es-ES', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }); };
export const isStaff = () => ['staff', 'admin'].includes(S.session?.profile?.role);
export const isAdmin = () => S.session?.profile?.role === 'admin';
export const safeUrl = (u) => /^(https?:|mailto:|tel:|data:image\/|assets\/|\/)/i.test(String(u || '')) ? u : '#';
export const ls = {
  get(k, d = null) { try { const v = localStorage.getItem(k); return v === null ? d : JSON.parse(v); } catch { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* */ } },
};

export function toast(msg, type = '') {
  let box = $('.toasts'); if (!box) { box = document.createElement('div'); box.className = 'toasts'; box.setAttribute('role', 'status'); document.body.appendChild(box); }
  const t = document.createElement('div'); t.className = 'toast ' + type;
  t.innerHTML = (type === 'ok' ? icon('check') : type === 'err' ? icon('info') : icon('heart')) + `<span>${esc(msg)}</span>`;
  box.appendChild(t); setTimeout(() => { t.style.opacity = '0'; t.style.transition = 'opacity .4s'; setTimeout(() => t.remove(), 400); }, 3800);
}

export function openModal(html, { wide = false, onClose } = {}) {
  const bd = document.createElement('div'); bd.className = 'modal-backdrop';
  bd.innerHTML = `<div class="modal ${wide ? 'wide' : ''}" role="dialog" aria-modal="true">${html}</div>`;
  document.body.appendChild(bd);
  const prevFocus = document.activeElement;
  const close = () => { bd.remove(); document.removeEventListener('keydown', onKey); onClose && onClose(); prevFocus && prevFocus.focus && prevFocus.focus(); };
  const onKey = (e) => { if (e.key === 'Escape') close(); };
  document.addEventListener('keydown', onKey);
  bd.addEventListener('mousedown', (e) => { if (e.target === bd) close(); });
  $$('[data-close]', bd).forEach(b => b.addEventListener('click', close));
  setTimeout(() => { const f = $('input:not([type=hidden]),select,textarea,button.btn', bd); f && f.focus(); }, 50);
  return { el: $('.modal', bd), close };
}
export const modalHead = (title) => `<div class="modal-head"><h3>${title}</h3><button class="icon-btn" data-close aria-label="Cerrar">${icon('x')}</button></div>`;

export function confirmBox(text, { ok = 'Sí, continuar', danger = false } = {}) {
  return new Promise(res => {
    let done = false;
    const m = openModal(`${modalHead('¿Seguro?')}<p>${text}</p><div class="modal-actions"><button class="btn ghost small" data-no>Cancelar</button><button class="btn small ${danger ? 'danger' : ''}" data-yes>${ok}</button></div>`, { onClose: () => { if (!done) res(false); } });
    $('[data-no]', m.el).onclick = () => { done = true; res(false); m.close(); };
    $('[data-yes]', m.el).onclick = () => { done = true; res(true); m.close(); };
  });
}

export function confetti(n = 140) {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const c = document.createElement('canvas'); c.className = 'confetti'; document.body.appendChild(c);
  const ctx = c.getContext('2d'); const W = c.width = innerWidth, H = c.height = innerHeight;
  const cols = ['#ec4f8e', '#26a9e0', '#ffb01f', '#1d6fb8', '#f9c6dc', '#2bb673'];
  const ps = Array.from({ length: n }, () => ({ x: W / 2 + (Math.random() - .5) * W * .4, y: H * .35, vx: (Math.random() - .5) * 14, vy: -Math.random() * 14 - 4, r: Math.random() * 6 + 4, c: cols[Math.random() * cols.length | 0], a: Math.random() * 6, s: Math.random() < .3 }));
  let f = 0;
  (function tick() {
    ctx.clearRect(0, 0, W, H);
    ps.forEach(p => { p.vy += .35; p.vx *= .99; p.x += p.vx; p.y += p.vy; p.a += .1; ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.a); ctx.fillStyle = p.c;
      if (p.s) { ctx.beginPath(); ctx.moveTo(0, p.r * .4); ctx.bezierCurveTo(-p.r, -p.r * .5, -p.r * .3, -p.r, 0, -p.r * .3); ctx.bezierCurveTo(p.r * .3, -p.r, p.r, -p.r * .5, 0, p.r * .4); ctx.fill(); }
      else ctx.fillRect(-p.r / 2, -p.r / 4, p.r, p.r / 2);
      ctx.restore(); });
    if (++f < 190) requestAnimationFrame(tick); else c.remove();
  })();
}

// "5, 7, 10-15" → [5,7,10,11,12,13,14,15]
export function parseNumbers(str) {
  const out = new Set();
  for (const part of String(str).split(/[,;\s]+/).filter(Boolean)) {
    const m = part.match(/^(\d+)\s*-\s*(\d+)$/);
    if (m) { let [a, b] = [+m[1], +m[2]]; if (a > b) [a, b] = [b, a]; if (b - a > 500) throw new Error('Rango demasiado grande (máx. 500 números de golpe)'); for (let i = a; i <= b; i++) out.add(i); }
    else if (/^\d+$/.test(part)) out.add(+part);
    else throw new Error(`"${part}" no es un número válido`);
  }
  return [...out].sort((a, b) => a - b);
}

export function downloadCSV(name, rows) {
  const csv = rows.map(r => r.map(v => `"${String(v ?? '').replace(/"/g, '""')}"`).join(';')).join('\r\n');
  const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' })); a.download = name;
  document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500);
}

export function busy(btn, on, label) {
  if (!btn) return;
  if (on) { btn.dataset.label = btn.innerHTML; btn.disabled = true; btn.innerHTML = label || 'Un momento…'; }
  else { btn.disabled = false; if (btn.dataset.label) btn.innerHTML = btn.dataset.label; }
}

export function formData(form) { return Object.fromEntries(new FormData(form).entries()); }

export const waLink = (num, text) => `https://wa.me/${String(num || '').replace(/\D/g, '')}?text=${encodeURIComponent(text)}`;

export const wave = (fill = '#ffffff') => `<svg class="wave-top" viewBox="0 0 1440 40" preserveAspectRatio="none" aria-hidden="true"><path d="M0 40V22C120 6 240 0 360 10s240 28 360 22 240-30 360-30 240 18 360 22V40z" fill="${fill}"/></svg>`;

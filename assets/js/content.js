// =====================================================================
//  Contenido estático, iconos e ilustraciones de Pelones Cantabria
// =====================================================================

const P = {
  heart: '<path d="M12 21s-7.5-4.6-9.5-9.2C1 8.3 3.2 4.5 7 4.5c2.1 0 3.6 1.2 5 3 1.4-1.8 2.9-3 5-3 3.8 0 6 3.8 4.5 7.3C19.5 16.4 12 21 12 21z"/>',
  smile: '<circle cx="12" cy="12" r="9.5"/><path d="M8 14.5c1 1.4 2.4 2 4 2s3-.6 4-2M9 9.5h.01M15 9.5h.01"/>',
  hands: '<path d="M12 8.5c1-1.8 3.8-2 4.6 0 .7 1.6-.5 3-4.6 5.7C7.9 11.5 6.7 10.1 7.4 8.5c.8-2 3.6-1.8 4.6 0z"/><path d="M2 14l3.5-1.5c1-.4 2-.2 2.8.5L12 16.5l3.7-3.5c.8-.7 1.8-.9 2.8-.5L22 14M5 20h14"/>',
  star: '<path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z"/>',
  cart: '<path d="M3 4h2l2.4 11.2a2 2 0 0 0 2 1.6h7.7a2 2 0 0 0 2-1.5L21 8H6.2"/><circle cx="10" cy="20.5" r="1.3"/><circle cx="17" cy="20.5" r="1.3"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 21c1.2-4 4.3-6 8-6s6.8 2 8 6"/>',
  users: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c.9-3.4 3.4-5.2 6.5-5.2s5.6 1.8 6.5 5.2M16 4.8a3.5 3.5 0 0 1 0 6.4M18 14.9c1.8.8 3 2.5 3.5 5.1"/>',
  menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
  x: '<path d="M6 6l12 12M18 6L6 18"/>',
  mail: '<rect x="3" y="5" width="18" height="14" rx="3"/><path d="M4 7l8 6 8-6"/>',
  whatsapp: '<path d="M4 20l1.2-4A8.5 8.5 0 1 1 8.4 19z"/><path d="M9 8.5c0 3.5 3 6.5 6.5 6.5l1-1.6-2-1-1 .9c-1.2-.6-2.2-1.6-2.8-2.8l.9-1-1-2z"/>',
  phone: '<path d="M5 3h3.5l1.7 4.5-2.2 1.4a11 11 0 0 0 7.1 7.1l1.4-2.2L21 15.5V19a2 2 0 0 1-2 2A16 16 0 0 1 3 5a2 2 0 0 1 2-2z"/>',
  pin: '<path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/>',
  facebook: '<path d="M14 21v-8h3l.5-3.5H14V7.5c0-1 .4-1.8 1.9-1.8H18V2.6c-.4 0-1.6-.2-3-.2-3 0-4.6 1.8-4.6 5v2.1H7.5V13h2.9v8"/>',
  instagram: '<rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><path d="M17.5 6.5h.01"/>',
  xsocial: '<path d="M4 4l16 16M20 4L4 20" /><path d="M4 4h4l12 16h-4z" fill="none"/>',
  gift: '<rect x="3" y="8" width="18" height="5" rx="1.5"/><path d="M5 13v7h14v-7M12 8v12M12 8c-1-3-5-4-5-1.5S10 8 12 8zm0 0c1-3 5-4 5-1.5S14 8 12 8z"/>',
  ticket: '<path d="M3 8a2 2 0 0 0 2-2h14a2 2 0 0 0 2 2v2a2 2 0 0 0 0 4v2a2 2 0 0 0-2 2H5a2 2 0 0 0-2-2v-2a2 2 0 0 0 0-4z"/><path d="M14 6v12" stroke-dasharray="2 2"/>',
  calendar: '<rect x="3" y="5" width="18" height="16" rx="3"/><path d="M3 10h18M8 3v4M16 3v4"/>',
  image: '<rect x="3" y="4" width="18" height="16" rx="3"/><circle cx="9" cy="10" r="2"/><path d="M21 16l-5-5-9 9"/>',
  news: '<rect x="3" y="4" width="15" height="16" rx="2"/><path d="M18 8h3v10a2 2 0 0 1-2 2M7 8h7M7 12h7M7 16h4"/>',
  sparkles: '<path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8zM19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8z"/>',
  home: '<path d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>',
  info: '<circle cx="12" cy="12" r="9.5"/><path d="M12 11v6M12 7.5h.01"/>',
  shop: '<path d="M4 9l1.5-5h13L20 9M4 9h16v2a3 3 0 0 1-5.3 2 3 3 0 0 1-5.4 0A3 3 0 0 1 4 11zM5 13.5V21h14v-7.5M10 21v-4h4v4"/>',
  lock: '<rect x="4" y="10" width="16" height="11" rx="3"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/>',
  eye: '<path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
  eyeoff: '<path d="M3 3l18 18M10.6 5.1A10 10 0 0 1 12 5c6.4 0 10 7 10 7a17 17 0 0 1-3 3.9M6.6 6.6C3.8 8.4 2 12 2 12s3.6 7 10 7c1.9 0 3.5-.6 4.9-1.4M9.9 9.9a3 3 0 0 0 4.2 4.2"/>',
  logout: '<path d="M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3M10 17l-5-5 5-5M5 12h11"/>',
  gear: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  minus: '<path d="M5 12h14"/>',
  trash: '<path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/>',
  edit: '<path d="M4 20h4L19 9l-4-4L4 16zM13.5 6.5l4 4"/>',
  download: '<path d="M12 4v11M7 10l5 5 5-5M5 20h14"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/>',
  cube: '<path d="M12 2.5l8.5 4.8v9.4L12 21.5l-8.5-4.8V7.3z"/><path d="M3.5 7.3L12 12l8.5-4.7M12 12v9.5"/>',
  monitor: '<rect x="2.5" y="4" width="19" height="13" rx="2.5"/><path d="M8 21h8M12 17v4"/>',
  arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
  check: '<path d="M4 12.5l5 5L20 6.5"/>',
  hospital: '<rect x="4" y="3" width="16" height="18" rx="2"/><path d="M12 7v6M9 10h6M9 21v-4h6v4"/>',
  flask: '<path d="M9 3h6M10 3v6L4.5 18.5A1.7 1.7 0 0 0 6 21h12a1.7 1.7 0 0 0 1.5-2.5L14 9V3M7 15h10"/>',
  tent: '<path d="M3 20L12 4l9 16zM12 4v16M9 20l3-6 3 6"/>',
  book: '<path d="M4 4.5A1.5 1.5 0 0 1 5.5 3H20v15H5.5A1.5 1.5 0 0 0 4 19.5zM4 19.5A1.5 1.5 0 0 0 5.5 21H20v-3"/>',
  box: '<path d="M3 7.5L12 3l9 4.5v9L12 21l-9-4.5z"/><path d="M3 7.5L12 12l9-4.5M12 12v9"/>',
  scissors: '<circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><path d="M8.5 7.5L20 18M8.5 16.5L20 6"/>',
  trophy: '<path d="M7 4h10v5a5 5 0 0 1-10 0zM7 6H4a3 3 0 0 0 3 4M17 6h3a3 3 0 0 1-3 4M9 21h6M12 14v7"/>',
  megaphone: '<path d="M3 10v4a1 1 0 0 0 1 1h3l8 5V4L7 9H4a1 1 0 0 0-1 1zM19 9a3 3 0 0 1 0 6M7 15l1 5h3l-1-5"/>',
  shuffle: '<path d="M3 6h3.5c2 0 3.2 1 4.5 3l2 3c1.3 2 2.5 3 4.5 3H21M18 12l3 3-3 3M3 18h3.5c1.4 0 2.4-.5 3.3-1.4M14.2 7.4C15 6.5 16 6 17.5 6H21M18 3l3 3-3 3"/>',
  upload: '<path d="M12 16V5M7 10l5-5 5 5M5 20h14"/>',
  link: '<path d="M10 14a4 4 0 0 0 6 .4l3-3a4 4 0 0 0-5.7-5.7l-1.2 1.2M14 10a4 4 0 0 0-6-.4l-3 3a4 4 0 0 0 5.7 5.7l1.2-1.2"/>',
  cookie: '<path d="M21 12.5A9 9 0 1 1 11.5 3a3 3 0 0 0 3.5 3.5 3 3 0 0 0 3.5 3.5 3 3 0 0 0 2.5 2.5z"/><path d="M8.5 9h.01M8 14.5h.01M12.5 12.5h.01M15.5 16h.01M11 17.5h.01"/>',
  euro: '<path d="M17 6.5A7 7 0 1 0 17 17.5M4 10h9M4 14h9"/>',
  clock: '<circle cx="12" cy="12" r="9.5"/><path d="M12 7v5l3 2"/>',
  bag: '<path d="M5 8h14l-1 13H6zM9 8V6a3 3 0 0 1 6 0v2"/>',
  refresh: '<path d="M20 11a8 8 0 0 0-14.6-4.5M4 4v3.5h3.5M4 13a8 8 0 0 0 14.6 4.5M20 20v-3.5h-3.5"/>',
  sound: '<path d="M4 9v6h4l5 4V5L8 9zM16 9a4 4 0 0 1 0 6M18.5 6.5a8 8 0 0 1 0 11"/>',
  mute: '<path d="M4 9v6h4l5 4V5L8 9zM17 9l5 5M22 9l-5 5"/>',
};

export function icon(name, cls = 'icon') {
  const fill = name === 'heart' || name === 'star' ? 'currentColor' : 'none';
  const sw = fill === 'none' ? '2' : '0';
  return `<svg class="${cls}" viewBox="0 0 24 24" fill="${fill}" stroke="currentColor" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${P[name] || ''}</svg>`;
}

// ---------------------------------------------------------------------
//  El Pelón dibujado en SVG (variaciones de color para tienda/galería)
// ---------------------------------------------------------------------
let _pid = 0;
// Opciones: band, knot, skin, mood ('happy'|'wow'), wink,
//   pattern: 'waves' | 'stripes' | 'dots' | 'stars' | 'hearts' | 'plain' | 'checks'
//   stripes: ['#c00','#ffc400','#c00'] (franjas horizontales del pañuelo)
//   acc: 'pompom' | 'crown' | 'flower' | 'ball' | 'star' | 'heart' | 'bow' | 'cap' | 'mask' | 'glasses'
export function pelonSVG(o = {}) {
  const { band = '#1d6fb8', knot = '#ec4f8e', skin = '#ffb01f', mood = 'happy', wink = false, pattern = 'waves', stripes = null, acc = null, ink = '#ffffff' } = o;
  const id = 'pl' + (++_pid);
  const eyes = mood === 'wow'
    ? `<circle cx="78" cy="112" r="7" fill="#3a2410"/><circle cx="122" cy="112" r="7" fill="#3a2410"/>`
    : `<path d="M68 114q10-12 20 0" stroke="#3a2410" stroke-width="6" fill="none" stroke-linecap="round"/>` +
      (wink ? `<path d="M112 112h20" stroke="#3a2410" stroke-width="6" stroke-linecap="round"/>` : `<path d="M112 114q10-12 20 0" stroke="#3a2410" stroke-width="6" fill="none" stroke-linecap="round"/>`);
  const mouth = mood === 'wow'
    ? `<ellipse cx="100" cy="146" rx="9" ry="11" fill="#7a2d12"/>`
    : `<path d="M74 136q26 28 52 0" stroke="#3a2410" stroke-width="6" fill="none" stroke-linecap="round"/>`;
  const capPath = 'M30 104C30 50 66 28 104 28c40 0 70 28 68 72-22-14-50-20-72-20-26 0-50 8-70 24z';
  const pats = {
    waves: `<pattern id="${id}w" width="28" height="16" patternUnits="userSpaceOnUse"><path d="M2 11c3-5 7-5 9-2s1 5-2 5-2-4 1-5M16 4c3-5 7-5 9-2s1 5-2 5-2-4 1-5" fill="none" stroke="${ink}" stroke-width="1.8" stroke-linecap="round" opacity=".9"/></pattern>`,
    dots: `<pattern id="${id}w" width="18" height="18" patternUnits="userSpaceOnUse"><circle cx="5" cy="5" r="3.2" fill="${ink}"/><circle cx="14" cy="14" r="3.2" fill="${ink}"/></pattern>`,
    stars: `<pattern id="${id}w" width="24" height="22" patternUnits="userSpaceOnUse"><path d="M6 2l1.6 3.4 3.6.4-2.7 2.4.8 3.6L6 10l-3.3 1.8.8-3.6L.8 5.8l3.6-.4z" fill="${ink}"/><circle cx="18" cy="16" r="1.6" fill="${ink}"/></pattern>`,
    hearts: `<pattern id="${id}w" width="22" height="20" patternUnits="userSpaceOnUse"><path d="M7 14s-5-3-5-6.5C2 5.5 3.5 4 5 4c1 0 1.6.6 2 1.3C7.4 4.6 8 4 9 4c1.5 0 3 1.5 3 3.5C12 11 7 14 7 14z" fill="${ink}"/></pattern>`,
    checks: `<pattern id="${id}w" width="16" height="16" patternUnits="userSpaceOnUse"><rect width="8" height="8" fill="${ink}" opacity=".85"/><rect x="8" y="8" width="8" height="8" fill="${ink}" opacity=".85"/></pattern>`,
  };
  let bandFill = `<path d="${capPath}" fill="${band}"/>`;
  if (pattern === 'stripes' && stripes) {
    const h = 80 / stripes.length;
    bandFill = `<clipPath id="${id}c"><path d="${capPath}"/></clipPath><g clip-path="url(#${id}c)">${stripes.map((c, i) => `<rect x="20" y="${26 + i * h}" width="160" height="${h + .5}" fill="${c}"/>`).join('')}</g>`;
  } else if (pats[pattern]) bandFill += `<path d="${capPath}" fill="url(#${id}w)"/>`;
  const accs = {
    pompom: `<circle cx="160" cy="40" r="16" fill="#fff"/><circle cx="155" cy="35" r="5" fill="#f1f1f1"/>`,
    crown: `<path d="M70 34l8-26 14 16 8-20 8 20 14-16 8 26z" fill="#ffd34d" stroke="#e0a400" stroke-width="3" stroke-linejoin="round"/><circle cx="100" cy="24" r="4" fill="#ec4f8e"/>`,
    flower: `<g transform="translate(150 54)"><circle r="9" cx="0" cy="-12" fill="#fff"/><circle r="9" cx="11" cy="-4" fill="#fff"/><circle r="9" cx="7" cy="10" fill="#fff"/><circle r="9" cx="-7" cy="10" fill="#fff"/><circle r="9" cx="-11" cy="-4" fill="#fff"/><circle r="7" fill="#ffb01f"/></g>`,
    ball: `<g transform="translate(160 168)"><circle r="20" fill="#fff" stroke="#1d2b53" stroke-width="3"/><path d="M0-8l7 5-3 8h-8l-3-8z" fill="#1d2b53"/><path d="M0-8V-19M7-3l10-4M4 5l6 10M-4 5l-6 10M-7-3l-10-4" stroke="#1d2b53" stroke-width="2"/></g>`,
    star: `<path d="M160 22l6 13 14 2-10 10 2 14-12-7-12 7 2-14-10-10 14-2z" fill="#ffd34d" stroke="#e0a400" stroke-width="2"/>`,
    heart: `<path d="M158 62s-16-9-16-20c0-6 4-10 9-10 3 0 6 2 7 5 1-3 4-5 7-5 5 0 9 4 9 10 0 11-16 20-16 20z" fill="#ec4f8e" stroke="#fff" stroke-width="3"/>`,
    bow: `<path d="M84 28l-22-12v26zM116 28l22-12v26z" fill="${knot}"/><circle cx="100" cy="28" r="8" fill="${knot}"/>`,
    cap: `<path d="M24 102c24-10 60-14 90-10 22 3 40 8 56 16-30 2-62 2-90-2-22-3-40-4-56-4z" fill="${knot}"/>`,
    mask: `<path d="M56 100c14-8 30-6 44 2 14-8 30-10 44-2 0 14-8 24-22 24-10 0-16-6-22-12-6 6-12 12-22 12-14 0-22-10-22-24z" fill="${knot}"/>`,
    glasses: `<g fill="none" stroke="#1d2b53" stroke-width="5"><circle cx="78" cy="112" r="17"/><circle cx="122" cy="112" r="17"/><path d="M95 112h10"/></g>`,
  };
  const front = acc === 'mask' || acc === 'glasses' || acc === 'ball';
  return `<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Pelón">
  <defs>
    <radialGradient id="${id}s" cx="38%" cy="35%" r="70%"><stop offset="0" stop-color="#ffe08a"/><stop offset=".55" stop-color="${skin}"/><stop offset="1" stop-color="#e2780a"/></radialGradient>
    ${pats[pattern] || ''}
  </defs>
  <ellipse cx="100" cy="190" rx="54" ry="7" fill="#1d2b53" opacity=".12"/>
  ${acc === 'bow' ? '' : `<path d="M150 92c18 2 34 14 38 30-12-4-22-2-30 4 2-12-2-24-8-34z" fill="${knot}"/>
  <path d="M154 96c10 12 14 30 10 46-7-9-15-13-24-13 8-9 12-21 14-33z" fill="${knot}" opacity=".85"/>`}
  <circle cx="100" cy="116" r="66" fill="url(#${id}s)"/>
  ${bandFill}
  ${front ? '' : (accs[acc] || '')}
  ${eyes}${mouth}
  <ellipse cx="62" cy="134" rx="10" ry="6" fill="#ff7aa8" opacity=".55"/><ellipse cx="138" cy="134" rx="10" ry="6" fill="#ff7aa8" opacity=".55"/>
  <ellipse cx="76" cy="92" rx="14" ry="6" fill="#fff" opacity=".25" transform="rotate(-18 76 92)"/>
  ${front ? accs[acc] : ''}
</svg>`;
}

// La familia pelona: todos los diseños (se usan en tienda, galería y 3D)
export const THEMES = {
  clasico:    { name: 'Pelón clásico',     band: '#1d6fb8', knot: '#ec4f8e' },
  rosa:       { name: 'Pelón rosa',        band: '#ec4f8e', knot: '#1d6fb8' },
  racing:     { name: 'Pelón racinguista', band: '#ffffff', knot: '#1a9a4b', pattern: 'stripes', stripes: ['#1a9a4b', '#ffffff', '#1a9a4b', '#ffffff', '#1a9a4b'], acc: 'ball' },
  espana:     { name: 'Pelón de la Selección', band: '#c8102e', knot: '#ffc400', pattern: 'stripes', stripes: ['#c8102e', '#ffc400', '#ffc400', '#c8102e'], acc: 'ball' },
  cantabria:  { name: 'Pelón cántabro',    band: '#ffffff', knot: '#d52b1e', pattern: 'stripes', stripes: ['#ffffff', '#ffffff', '#d52b1e', '#d52b1e'] },
  navidad:    { name: 'Pelón navideño',    band: '#d62839', knot: '#2bb673', pattern: 'stars', acc: 'pompom' },
  flamenco:   { name: 'Pelón de lunares',  band: '#e63946', knot: '#1d2b53', pattern: 'dots', acc: 'flower' },
  estrellas:  { name: 'Pelón de las estrellas', band: '#22306b', knot: '#ffb01f', pattern: 'stars', ink: '#ffd34d', acc: 'star' },
  corazones:  { name: 'Pelón de corazones', band: '#f9c6dc', knot: '#ec4f8e', pattern: 'hearts', ink: '#ec4f8e', acc: 'heart' },
  princesa:   { name: 'Pelón princesa',    band: '#b07ce8', knot: '#ec4f8e', pattern: 'dots', acc: 'crown' },
  heroe:      { name: 'Pelón superhéroe',  band: '#1d6fb8', knot: '#d62839', pattern: 'stars', acc: 'mask' },
  primavera:  { name: 'Pelón primavera',   band: '#2bb673', knot: '#ffb01f', pattern: 'dots', acc: 'flower' },
  cielo:      { name: 'Pelón cielo',       band: '#26a9e0', knot: '#ffb01f', wink: true },
  menta:      { name: 'Pelón menta',       band: '#5fcfa0', knot: '#1d6fb8', pattern: 'checks' },
  sabio:      { name: 'Pelón sabio',       band: '#7c5cc4', knot: '#ffb01f', acc: 'glasses' },
  marinero:   { name: 'Pelón marinero',    band: '#ffffff', knot: '#1d6fb8', pattern: 'stripes', stripes: ['#1d6fb8', '#ffffff', '#1d6fb8', '#ffffff', '#1d6fb8', '#ffffff'], acc: 'cap' },
  lazo:       { name: 'Pelona con lazo',   band: '#ec4f8e', knot: '#ffb01f', pattern: 'hearts', acc: 'bow' },
  naranja:    { name: 'Pelón naranja',     band: '#f7941d', knot: '#ec4f8e' },
};
export const PALETTES = [THEMES.clasico, THEMES.rosa, THEMES.cielo, THEMES.sabio, THEMES.primavera, THEMES.naranja];

// ---------------------------------------------------------------------
//  Contenido de la asociación (fuentes en el README)
// ---------------------------------------------------------------------
export const VALUES = [
  { k: 'Solidaridad', i: 'heart' }, { k: 'Esperanza', i: 'smile' },
  { k: 'Apoyo', i: 'hands' }, { k: 'Unión', i: 'star' },
];

export const WHAT_WE_DO = [
  { i: 'scissors', t: 'Hacemos pelones a mano', d: 'Muñecos de goma eva con su gorrito o pañuelo, como los que llevan los niños y niñas que pierden el pelo con la quimioterapia. Así se ven en un juguete que se parece a ellos.' },
  { i: 'shop', t: 'Los vendemos por la causa', d: 'Pelones, broches, imanes, llaveros, pulseras, lápices y calendarios en mercadillos, comercios amigos y por encargo, con envíos a toda España.' },
  { i: 'hands', t: 'Lo damos todo', d: 'Lo recaudado va íntegro a proyectos de salud infantil: investigación, aulas hospitalarias, ocio terapéutico y familias en momentos difíciles.' },
  { i: 'users', t: 'Sumamos gente', d: 'Colegios, clubes, peñas, deportistas y comercios organizan retos y eventos a beneficio de Pelones. Cada gesto cuenta.' },
];

export const MONEY_FLOW = [
  { i: 'scissors', t: 'Un pelón nace', d: 'Voluntarios lo recortan, pintan y montan a mano en su tiempo libre.' },
  { i: 'heart', t: 'Alguien lo adopta', d: 'En un mercadillo, un evento o con un pedido desde esta web.' },
  { i: 'euro', t: 'Se reúne la ayuda', d: 'La asociación se autofinancia: no hay sueldos, lo recaudado va a la causa.' },
  { i: 'hospital', t: 'Llega a los niños', d: 'Se entrega a proyectos de salud infantil, sobre todo en Cantabria.' },
];

export const DESTINATIONS = [
  { i: 'flask', t: 'Investigación pediátrica en Valdecilla', d: 'Colaboración con IDIVAL (Instituto de Investigación Marqués de Valdecilla) para impulsar proyectos de investigación en hematología pediátrica.' },
  { i: 'book', t: 'Aula Hospitalaria de Valdecilla', d: 'Apoyo al aula donde los niños ingresados siguen aprendiendo y jugando durante su tratamiento.' },
  { i: 'tent', t: 'Campamentos para niños que han pasado un cáncer', d: 'En 2026 lo recaudado en la semana solidaria de Ramales se destina a un campamento con profesionales del ocio y la salud.' },
  { i: 'smile', t: 'Fundación Theodora', d: 'Financiamos visitas de los Doctores Sonrisa, payasos profesionales que llevan humor y juego a los niños hospitalizados.' },
  { i: 'heart', t: 'Fundación Josep Carreras', d: 'Donaciones a la lucha contra la leucemia y otras enfermedades de la sangre.' },
];

export const TIMELINE = [
  { y: '2015', t: 'Cuatro amigas y unas tijeras', d: 'Cuatro amigas de Santander empiezan a hacer imanes y muñequitos de goma eva para ayudar a niños con enfermedades. Así nace Pelones Cantabria.' },
  { y: '2016', t: 'Broches que vuelan', d: 'Los broches se agotan y hay lista de espera. En Navidad, la Asociación Comercio Astillero-Guarnizo los vende a 2 € con un photocall y un sorteo solidario.' },
  { y: '2016', t: 'Más de 20 voluntarios', d: 'El Real Racing Club recibe a la asociación en las Instalaciones Nando Yosu y le da su respaldo. Ya se financian visitas de los Doctores Sonrisa de la Fundación Theodora.' },
  { y: '2017', t: 'Colegios y retos deportivos', d: 'Calendarios solidarios con la AMPA del CEIP Cabo Mayor y Everesting en Estacas de Trueba: 12 subidas y más de 9.500 m de desnivel.' },
  { y: '2018', t: 'Trail Solidario La Guariza', d: 'La segunda edición del trail de Salces (Campoo de Suso) dedica toda su recaudación a Pelones.' },
  { y: '2023', t: 'Tarde solidaria en Soto de la Marina', d: 'El Ayuntamiento de Santa Cruz de Bezana organiza juegos, talleres, mercadillo y sorteo a favor de la asociación.' },
  { y: '2026', t: 'Ramales y la Semana Grande', d: 'La Marcha Solidaria del CEO Príncipe de Asturias y la peña Bonitos del Norte se vuelcan con Pelones.' },
];

export const PARTNERS = [
  { n: 'IDIVAL', d: 'Instituto de Investigación Marqués de Valdecilla. Proyectos de hematología pediátrica.', c: '#1d6fb8', url: 'https://www.idival.org/colaboracion-de-la-asociacion-de-pelones-cantabria-para-la-investigacion-pediatrica-en-valdecilla/', g: 'Destino de la ayuda' },
  { n: 'Aula Hospitalaria Valdecilla', d: 'Escuela dentro del hospital para los niños ingresados.', c: '#26a9e0', g: 'Destino de la ayuda' },
  { n: 'Fundación Theodora', d: 'Doctores Sonrisa en los hospitales infantiles.', c: '#ec4f8e', url: 'https://www.theodora.org/es/', g: 'Destino de la ayuda' },
  { n: 'Fundación Josep Carreras', d: 'Contra la leucemia y las enfermedades de la sangre.', c: '#c7306c', url: 'https://www.fcarreras.org/', g: 'Destino de la ayuda' },
  { n: 'Real Racing Club', d: 'Respaldo del club y camiseta firmada por la plantilla.', c: '#2bb673', url: 'https://www.realracingclub.es/noticias/el-racing-respalda-a-la-asociacion-pelones-cantabria-en-su-lucha-contra-la-enfermedad-infantil', g: 'Nos apoyan' },
  { n: 'Ayto. Santa Cruz de Bezana', d: 'Evento solidario en Soto de la Marina (2023).', c: '#1d6fb8', url: 'https://eldiariocantabria.publico.es/articulo/arco-de-la-bahia/ayuntamiento-organiza-evento-solidario-favor-asociacion-pelones-cantabria/20230807170309140939.html', g: 'Nos apoyan' },
  { n: 'Urban Chic Eva Díez', d: 'Peluquería coorganizadora de la tarde solidaria.', c: '#ec4f8e', g: 'Nos apoyan' },
  { n: 'Peña Bonitos del Norte', d: 'Marmita solidaria en la Semana Grande de Santander.', c: '#f7941d', url: 'https://www.santanderquehacer.com/14-penas-14-causas-fiestas-semana-grande-santander/', g: 'Nos apoyan' },
  { n: 'CEO Príncipe de Asturias', d: 'Semana y Marcha Solidaria de Ramales de la Victoria.', c: '#7c5cc4', url: 'https://ramalesblog.wordpress.com/2026/01/30/semana-solidaria-7/', g: 'Nos apoyan' },
  { n: 'AMPA CEIP Cabo Mayor', d: 'Venta de calendarios solidarios.', c: '#26a9e0', url: 'https://comunidadeducativacabomayor.wordpress.com/2017/01/17/pelones-cantabria/', g: 'Nos apoyan' },
  { n: 'Trail Solidario La Guariza', d: 'Carrera en Salces (Campoo de Suso) a beneficio de Pelones.', c: '#2bb673', url: 'https://www.vivecampoo.es/noticia/trail-solidario-guariza-se-vuelca-ano-pelones-cantabria-14550.html', g: 'Nos apoyan' },
  { n: 'Pelayadas Solidarias', d: 'Reto de la reconquista contra el cáncer infantil en Mi Grano de Arena.', c: '#c7306c', url: 'https://www.migranodearena.org/usuario/pelones-cantabria', g: 'Nos apoyan' },
  { n: 'Everesting Estacas de Trueba', d: 'Adrián y Daniel, 9.516 m de desnivel por la causa.', c: '#f7941d', url: 'https://masters.abloque.com/2017/06/17/everesting-challenge-pelones-cantabria/', g: 'Nos apoyan' },
  { n: 'Residencia Sancibrián', d: 'Manualidades para el mercadillo solidario de 2023.', c: '#7c5cc4', g: 'Nos apoyan' },
  { n: 'Comercio Astillero-Guarnizo', d: 'Campaña navideña de broches con photocall y sorteo (2016).', c: '#ec4f8e', url: 'https://www.astillero.es/content/arranca-la-campa%C3%B1a-solidaria-de-la-asociaci%C3%B3n-comercio-astillero-guarnizo-con-pelones', g: 'Nos apoyan' },
];

export const FAQ = [
  { q: '¿Por qué se llaman "pelones"?', a: 'Es el nombre cariñoso de los niños y niñas que pierden el pelo con la quimioterapia y se cubren la cabeza con un gorro o un pañuelo. Nuestros muñecos lo llevan para que se sientan menos diferentes.' },
  { q: '¿Cuánto dinero llega a la causa?', a: 'Todo lo recaudado. La asociación se autofinancia y funciona con voluntariado: los materiales se pagan aparte y nadie cobra por hacer pelones.' },
  { q: '¿Cuánto cuesta un pelón?', a: 'Los broches e imanes rondan los 2 €, los llaveros, pulseras y lápices unos 3 € y los muñecos unos 5 €. Es un donativo: lo que pagas va a la causa.' },
  { q: '¿Cómo puedo pagar?', a: 'En mano al recoger el pedido y, a medida que los activemos, por Bizum, transferencia o tarjeta online. En el pedido verás las opciones disponibles.' },
  { q: '¿Hacéis envíos?', a: 'Sí, a toda España. Haz tu pedido desde la tienda y te escribimos para cerrar el envío y la forma de pago.' },
  { q: '¿Puedo organizar un evento a beneficio de Pelones?', a: 'Claro. Colegios, peñas, clubes y empresas ya lo hacen. Escríbenos desde Contacto y te ayudamos con pelones para vender, cartelería y difusión.' },
  { q: '¿Hacéis pelones de mi equipo o personalizados?', a: 'Sí. Tenemos pelones del Racing, de la Selección, navideños y muchos más, y preparamos diseños por encargo para eventos, clubes y empresas.' },
  { q: '¿Cómo puedo ser voluntario o voluntaria?', a: 'Escríbenos. No hace falta experiencia en manualidades: hay sitio para recortar, pintar, montar, atender mercadillos o mover las redes.' },
];

export const HOW_TO_HELP = [
  { i: 'bag', t: 'Adopta un pelón', d: 'Haz un pedido desde la web o búscanos en mercadillos. Un broche cuesta lo mismo que un café.' },
  { i: 'euro', t: 'Haz un donativo', d: 'Cualquier cantidad suma. Puedes hacerlo por Bizum, transferencia o tarjeta cuando esté disponible.' },
  { i: 'scissors', t: 'Hazte voluntario', d: 'Recortar, pintar, montar, atender puestos o mover las redes. No hace falta experiencia.' },
  { i: 'megaphone', t: 'Organiza un evento', d: 'Un partido, una carrera, una fiesta de cole o una comida de peña a beneficio de Pelones.' },
  { i: 'shop', t: 'Pon una hucha en tu comercio', d: 'Panaderías, peluquerías y tiendas ya venden pelones en su mostrador.' },
  { i: 'heart', t: 'Compártenos', d: 'Sigue y comparte nuestras redes con el hashtag #cadapeloncuenta.' },
];

export const MAKING = [
  { i: 'scissors', t: 'Recortar', d: 'Cada pieza de goma eva se recorta a mano: la cara, el pañuelo y el nudo.' },
  { i: 'smile', t: 'Dar vida', d: 'Se pintan los ojos, la sonrisa y los coloretes. Aquí cada pelón coge su carácter.' },
  { i: 'sparkles', t: 'Vestir', d: 'Se elige el pañuelo: de olas, de lunares, del Racing, de Navidad… y los detalles.' },
  { i: 'heart', t: 'Montar', d: 'Se convierte en muñeco, broche, imán, llavero, pulsera o lápiz, listo para su nueva casa.' },
];

export const PRESS = [
  { m: 'Real Racing Club', y: '2016', t: 'El Racing respalda a la Asociación Pelones Cantabria', u: 'https://www.realracingclub.es/noticias/el-racing-respalda-a-la-asociacion-pelones-cantabria-en-su-lucha-contra-la-enfermedad-infantil' },
  { m: 'El Faradio', y: '2016', t: 'Pañuelos mágicos para pequeños héroes', u: 'https://www.elfaradio.com/2016/02/04/panuelos-magicos-para-pequenos-heroes/' },
  { m: 'Ayto. de Astillero', y: '2016', t: 'Campaña solidaria de Comercio Astillero-Guarnizo con Pelones', u: 'https://www.astillero.es/content/arranca-la-campa%C3%B1a-solidaria-de-la-asociaci%C3%B3n-comercio-astillero-guarnizo-con-pelones' },
  { m: 'Real Racing Club', y: '2017', t: 'El Racing apoya a Pelones Cantabria en su lucha contra la enfermedad infantil', u: 'https://www.realracingclub.es/noticias/el-racing-apoya-a-la-asociacion-pelones-cantabria-en-su-lucha-contra-la-enfermedad-infantil' },
  { m: 'IDIVAL', y: '—', t: 'Colaboración de Pelones Cantabria para la investigación pediátrica en Valdecilla', u: 'https://www.idival.org/colaboracion-de-la-asociacion-de-pelones-cantabria-para-la-investigacion-pediatrica-en-valdecilla/' },
  { m: 'El Diario Cantabria', y: '2023', t: 'El Ayuntamiento organiza un evento solidario a favor de Pelones', u: 'https://eldiariocantabria.publico.es/articulo/arco-de-la-bahia/ayuntamiento-organiza-evento-solidario-favor-asociacion-pelones-cantabria/20230807170309140939.html' },
  { m: 'CEO Príncipe de Asturias', y: '2026', t: 'Semana solidaria de Ramales a favor de Pelones', u: 'https://ramalesblog.wordpress.com/2026/01/30/semana-solidaria-7/' },
];

// Dibujo de un producto: tema de la familia pelona + colores propios
export const productArt = (p, extra = {}) => pelonSVG({ ...(THEMES[p?.colors?.theme] || {}), ...(p?.colors || {}), ...extra });

// Catálogo inicial (precios orientativos: broches, imanes y lápices según
// la prensa de 2016; el resto, a confirmar por la asociación)
export const CATALOG = [
  ['Pelón clásico', 'El de siempre: pañuelo azul de olas y nudo rosa. Hecho a mano, uno a uno, por el equipo de voluntarios.', 'muñecos', 5, 'clasico', true],
  ['Pelón rosa', 'Pañuelo rosa con olas blancas. Cada pelón es único: ninguno sale exactamente igual que otro.', 'muñecos', 5, 'rosa', true],
  ['Pelón racinguista', 'Verde y blanco de pies a cabeza, con su balón. Para la afición del Racing que también juega por los niños.', 'equipos', 5, 'racing', true],
  ['Pelón de la Selección', 'Rojo y gualda para animar a España en cada partido… y a los peques en cada tratamiento.', 'equipos', 5, 'espana', true],
  ['Pelón cántabro', 'Con los colores de la bandera de Cantabria. Orgullo de tierruca.', 'muñecos', 5, 'cantabria', false],
  ['Pelón navideño', 'Pañuelo rojo de estrellas con pompón. El detalle solidario perfecto para el árbol o el amigo invisible.', 'temporada', 5, 'navidad', true],
  ['Pelón de lunares', 'Pañuelo flamenco con flor. Para las ferias y para quien lleva el arte dentro.', 'muñecos', 5, 'flamenco', false],
  ['Pelón de las estrellas', 'Azul noche con estrellas doradas, para soñar a lo grande.', 'muñecos', 5, 'estrellas', false],
  ['Pelón de corazones', 'Rosa clarito con corazones. Un abrazo que se puede regalar.', 'muñecos', 5, 'corazones', false],
  ['Pelón princesa', 'Pañuelo lila de lunares y corona dorada.', 'muñecos', 5, 'princesa', false],
  ['Pelón superhéroe', 'Con antifaz y estrellas: porque los niños pelones son los verdaderos héroes.', 'muñecos', 5, 'heroe', true],
  ['Pelón primavera', 'Verde con lunares y una flor. Alegría para cualquier estantería.', 'muñecos', 5, 'primavera', false],
  ['Pelón marinero', 'Rayas azules y gorra, con olor a Sardinero.', 'muñecos', 5, 'marinero', false],
  ['Pelona con lazo', 'Pañuelo de corazones rematado con un gran lazo.', 'muñecos', 5, 'lazo', false],
  ['Broche pelón', 'Para la ropa, la mochila o el bolso. Llévalo puesto y cuenta la historia.', 'broches', 2, 'clasico', true],
  ['Broche racinguista', 'El broche más verdiblanco para ir a los Campos de Sport.', 'broches', 2, 'racing', false],
  ['Broche navideño', 'Con pompón y estrellas. Se agota cada diciembre.', 'broches', 2, 'navidad', false],
  ['Imán pelón', 'Para la nevera de casa o la pizarra de clase.', 'imanes', 2, 'cielo', false],
  ['Imán de lunares', 'Un toque flamenco para la nevera.', 'imanes', 2, 'flamenco', false],
  ['Llavero pelón', 'Para que te acompañe a todas partes. Ideal como detalle de boda, comunión o cumpleaños.', 'llaveros', 3, 'sabio', false],
  ['Llavero de la Selección', 'Rojo y gualda para tus llaves.', 'llaveros', 3, 'espana', false],
  ['Pulsera pelona', 'Pulsera con un mini pelón de corazones.', 'pulseras', 3, 'corazones', false],
  ['Lápiz pelón', 'Lápiz con un pelón en la punta. El favorito de los coles.', 'lápices', 3, 'primavera', true],
  ['Calendario solidario', 'Calendario anual de la asociación. Todo lo recaudado va a la causa.', 'otros', 6, 'naranja', false],
  ['Detalles para eventos', 'Pelones personalizados para bodas, bautizos, comuniones y empresas. Escríbenos y lo preparamos contigo.', 'encargos', null, 'lazo', true],
];

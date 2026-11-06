// =====================================================================
//  ISLA PELONA · Vista 3D (Three.js)
//  Mueve al pelón por la isla y entra en cada zona de la web.
// =====================================================================
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';
import { icon, pelonSVG } from './content.js';

const ZONE_STYLE = {
  conoce:        { color: '#ec4f8e', build: buildHouse,      hint: 'La casa pelona' },
  tienda:        { color: '#ffb01f', build: buildStall,      hint: 'El puesto de pedidos' },
  galeria:       { color: '#7c5cc4', build: buildGallery,    hint: 'El museo de fotos' },
  noticias:      { color: '#26a9e0', build: buildKiosk,      hint: 'El quiosco de noticias' },
  sorteos:       { color: '#f7941d', build: buildDrum,       hint: 'El bombo de la suerte' },
  colaboradores: { color: '#2bb673', build: buildPodium,     hint: 'El podio de amigos' },
  contacto:      { color: '#1d6fb8', build: buildLighthouse, hint: 'El faro de contacto' },
};
const ISLAND_R = 30;
const mat = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: .75, metalness: 0, ...o });
const M = {};

export async function startWorld({ zones, onEnter, onClosePanel, onExit, onCart, onAccount, logo }) {
  try { await document.fonts?.ready; } catch { /* */ }
  // ---------- DOM ----------
  let root = document.getElementById('world');
  if (!root) { root = document.createElement('div'); root.id = 'world'; root.className = 'world'; document.body.appendChild(root); }
  const coarse = matchMedia('(pointer: coarse)').matches;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const renderer = new THREE.WebGLRenderer({ antialias: !coarse, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(devicePixelRatio, coarse ? 1.5 : 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  root.appendChild(renderer.domElement);
  renderer.domElement.setAttribute('aria-label', 'Isla 3D de Pelones Cantabria. Usa los botones de zonas para navegar.');

  const hud = document.createElement('div'); hud.className = 'hud';
  hud.innerHTML = `<div class="hud-top"><div class="hud-brand"><img src="${logo}" alt=""><div><b>pelones</b><i>Cantabria</i></div></div>
    <div class="hud-actions"><button class="hud-pill" data-cart>${icon('bag')} Mi pedido</button><button class="hud-pill" data-acc>${icon('user')} Cuenta</button><button class="hud-pill" data-exit>${icon('monitor')} Vista web</button></div></div>
    <div class="hud-help">${icon('heart')} <b>Mueve al pelón</b><br><kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd> o flechas · <kbd>Shift</kbd> correr · <kbd>Espacio</kbd> saltar<br>Clic en el suelo para ir · arrastra para girar · <kbd>E</kbd> entrar</div>
    <div class="hud-zones" role="navigation" aria-label="Zonas de la isla"></div>
    <div class="joystick" aria-hidden="true"><i></i></div>`;
  root.appendChild(hud);
  const labelsBox = document.createElement('div'); labelsBox.style.cssText = 'position:absolute;inset:0;pointer-events:none;overflow:hidden';
  root.insertBefore(labelsBox, hud);
  let prompt = null;
  hud.querySelector('[data-exit]').onclick = () => onExit();
  hud.querySelector('[data-cart]').onclick = () => onCart && onCart();
  hud.querySelector('[data-acc]').onclick = () => onAccount && onAccount();

  // ---------- Escena ----------
  const scene = new THREE.Scene();
  scene.background = skyTexture();
  scene.fog = new THREE.Fog('#dff2fc', 55, 140);
  const camera = new THREE.PerspectiveCamera(50, 1, .1, 400);
  scene.add(new THREE.HemisphereLight('#ffffff', '#f9c6dc', 1.15));
  const sun = new THREE.DirectionalLight('#fff3e0', 1.7);
  sun.position.set(22, 34, 14); sun.castShadow = true;
  sun.shadow.mapSize.set(coarse ? 1024 : 2048, coarse ? 1024 : 2048);
  Object.assign(sun.shadow.camera, { left: -38, right: 38, top: 38, bottom: -38, near: 1, far: 100 });
  sun.shadow.bias = -0.0005; scene.add(sun);

  Object.assign(M, {
    grass: mat('#bfe8c4'), sand: mat('#ffe8cc'), path: mat('#fff4f9'), white: mat('#ffffff'), pink: mat('#ec4f8e'), pinkSoft: mat('#f9c6dc'),
    blue: mat('#1d6fb8'), sky: mat('#26a9e0'), sun: mat('#ffb01f'), dark: mat('#3a2410'), wood: mat('#c98b5a'), green: mat('#2bb673'),
    lilac: mat('#7c5cc4'), orange: mat('#f7941d'), rock: mat('#b9c3d6', { flatShading: true }), glass: mat('#fff7c2', { emissive: '#ffd34d', emissiveIntensity: .9 }),
  });

  // Isla
  const sand = new THREE.Mesh(new THREE.CylinderGeometry(ISLAND_R + 2.5, ISLAND_R + 4, 2.4, 72), M.sand); sand.position.y = -1.35; sand.receiveShadow = true; scene.add(sand);
  const island = new THREE.Mesh(new THREE.CylinderGeometry(ISLAND_R, ISLAND_R + 1, 2, 72), M.grass); island.position.y = -1; island.receiveShadow = true; scene.add(island);
  const ground = new THREE.Mesh(new THREE.CircleGeometry(ISLAND_R + 3, 72), new THREE.MeshBasicMaterial({ visible: false })); ground.rotation.x = -Math.PI / 2; ground.position.y = .01; scene.add(ground);

  // Mar con olas
  const seaGeo = new THREE.PlaneGeometry(320, 320, coarse ? 40 : 64, coarse ? 40 : 64); seaGeo.rotateX(-Math.PI / 2);
  const sea = new THREE.Mesh(seaGeo, new THREE.MeshStandardMaterial({ color: '#6cc6f0', roughness: .35, flatShading: true, transparent: true, opacity: .96 }));
  sea.position.y = -1.6; scene.add(sea);
  const seaBase = Float32Array.from(seaGeo.attributes.position.array);

  // Plaza central con corazón
  const plaza = new THREE.Mesh(new THREE.CylinderGeometry(6.2, 6.2, .16, 48), M.pinkSoft); plaza.position.y = .08; plaza.receiveShadow = true; scene.add(plaza);
  const plazaIn = new THREE.Mesh(new THREE.CylinderGeometry(4.6, 4.6, .18, 48), M.path); plazaIn.position.y = .1; plazaIn.receiveShadow = true; scene.add(plazaIn);
  const ped = new THREE.Mesh(new THREE.CylinderGeometry(1.3, 1.6, 1.2, 24), M.white); ped.position.y = .7; ped.castShadow = true; scene.add(ped);
  const heartGeo = makeHeart();
  const bigHeart = new THREE.Mesh(heartGeo, mat('#ec4f8e', { roughness: .35, emissive: '#ec4f8e', emissiveIntensity: .12 })); bigHeart.scale.setScalar(.045); bigHeart.position.y = 3.6; bigHeart.castShadow = true; scene.add(bigHeart);
  const banner = textSprite('#cadapeloncuenta', '#ec4f8e'); banner.position.set(0, 6.8, 0); banner.scale.set(9, 1.6, 1); scene.add(banner);

  // Zonas
  const zoneObjs = [];
  const all = zones.filter(z => ZONE_STYLE[z.key]);
  all.forEach((z, i) => {
    const a = (i / all.length) * Math.PI * 2 + Math.PI / all.length;
    const st = ZONE_STYLE[z.key];
    const pos = new THREE.Vector3(Math.sin(a) * 19.5, 0, Math.cos(a) * 19.5);
    const padPos = new THREE.Vector3(Math.sin(a) * 14.2, 0, Math.cos(a) * 14.2);
    const g = st.build(st.color); g.position.copy(pos); g.lookAt(0, 0, 0); g.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; o.userData.zone = z.key; } });
    scene.add(g);
    // camino
    const len = 14.2 - 6.2;
    const path = new THREE.Mesh(new THREE.BoxGeometry(2.2, .1, len), M.path); path.position.set(Math.sin(a) * (6.2 + len / 2), .06, Math.cos(a) * (6.2 + len / 2)); path.rotation.y = a; path.receiveShadow = true; scene.add(path);
    // plataforma de entrada
    const pad = new THREE.Mesh(new THREE.CylinderGeometry(1.7, 1.7, .14, 40), mat(st.color, { emissive: st.color, emissiveIntensity: .25 })); pad.position.copy(padPos).setY(.09); pad.receiveShadow = true; pad.userData.zone = z.key; scene.add(pad);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(1.95, .07, 8, 48), mat('#ffffff', { emissive: '#ffffff', emissiveIntensity: .6 })); ring.rotation.x = -Math.PI / 2; ring.position.copy(padPos).setY(.2); scene.add(ring);
    const label = document.createElement('div'); label.className = 'label3d'; label.style.setProperty('--c', st.color); label.textContent = z.title; labelsBox.appendChild(label);
    const obj = { ...z, ...st, group: g, pad, ring, path, pos, padPos, label, radius: 3.6 };
    zoneObjs.push(obj);
    if (!z.visible) setVis(obj, false);
  });
  function setVis(o, v) { o.visible = v; o.group.visible = v; o.pad.visible = v; o.ring.visible = v; o.path.visible = v; o.label.style.display = v ? '' : 'none'; renderZoneButtons(); }

  // Decoración: árboles, flores, rocas, nubes, globos, barco
  const rnd = mulberry(7);
  const blocked = (x, z) => Math.hypot(x, z) < 8 || zoneObjs.some(o => Math.hypot(x - o.pos.x, z - o.pos.z) < 5.5 || Math.hypot(x - o.padPos.x, z - o.padPos.z) < 3) || zoneObjs.some(o => distToSeg(x, z, 0, 0, o.padPos.x, o.padPos.z) < 2.2);
  const trees = [];
  for (let n = 0, tries = 0; n < (coarse ? 26 : 40) && tries < 900; tries++) {
    const r = 7 + rnd() * (ISLAND_R - 9), a = rnd() * Math.PI * 2, x = Math.sin(a) * r, z = Math.cos(a) * r;
    if (blocked(x, z) || trees.some(t => Math.hypot(t.x - x, t.z - z) < 2.6)) continue;
    const t = makeTree(rnd); t.position.set(x, 0, z); t.rotation.y = rnd() * 6; scene.add(t); trees.push({ x, z, r: .8 }); n++;
  }
  const flowerGeo = new THREE.SphereGeometry(.16, 8, 6); const flowerMats = [M.pink, M.sun, M.white, M.sky, M.lilac];
  for (let n = 0; n < 90; n++) { const r = 6.5 + rnd() * (ISLAND_R - 7.5), a = rnd() * Math.PI * 2, x = Math.sin(a) * r, z = Math.cos(a) * r; if (blocked(x, z)) continue; const f = new THREE.Mesh(flowerGeo, flowerMats[n % 5]); f.position.set(x, .15, z); scene.add(f); }
  for (let n = 0; n < 14; n++) { const a = rnd() * Math.PI * 2, r = ISLAND_R + 1 + rnd() * 2.5; const k = new THREE.Mesh(new THREE.DodecahedronGeometry(.6 + rnd() * 1.1, 0), M.rock); k.position.set(Math.sin(a) * r, -.5, Math.cos(a) * r); k.rotation.set(rnd() * 3, rnd() * 3, 0); k.castShadow = true; scene.add(k); }
  const clouds = []; for (let n = 0; n < 9; n++) { const c = makeCloud(rnd); c.position.set((rnd() - .5) * 160, 16 + rnd() * 10, (rnd() - .5) * 160); scene.add(c); clouds.push(c); }
  const balloons = []; const bCols = ['#ec4f8e', '#26a9e0', '#ffb01f', '#7c5cc4', '#2bb673'];
  for (let n = 0; n < 5; n++) { const b = makeBalloon(bCols[n]); const a = n / 5 * Math.PI * 2; b.position.set(Math.sin(a) * 5.5, 3, Math.cos(a) * 5.5); b.userData.p = rnd() * 6; scene.add(b); balloons.push(b); }
  const boat = makeBoat(); boat.position.set(-44, -1.4, 18); scene.add(boat);
  const hearts = []; const hm = [M.pink, M.sky, M.sun];
  for (let n = 0; n < 16; n++) { const h = new THREE.Mesh(heartGeo, hm[n % 3]); h.scale.setScalar(.008 + rnd() * .006); h.position.set((rnd() - .5) * 50, rnd() * 10, (rnd() - .5) * 50); h.userData.s = .5 + rnd(); scene.add(h); hearts.push(h); }

  // ---------- El pelón ----------
  const pelon = makePelon();
  pelon.position.set(0, 0, 8.5); scene.add(pelon);
  const blob = new THREE.Mesh(new THREE.CircleGeometry(1, 24), new THREE.MeshBasicMaterial({ color: '#1d2b53', transparent: true, opacity: .18, depthWrite: false }));
  blob.rotation.x = -Math.PI / 2; blob.position.y = .03; scene.add(blob);
  const marker = new THREE.Mesh(new THREE.TorusGeometry(.6, .08, 8, 32), mat('#ec4f8e', { emissive: '#ec4f8e', emissiveIntensity: .5 })); marker.rotation.x = -Math.PI / 2; marker.visible = false; scene.add(marker);

  // ---------- Controles ----------
  const keys = new Set();
  let yaw = 0, dist = coarse ? 17 : 15, pitch = .62;
  let target = null, targetZone = null, vy = 0, onGround = true, walkT = 0, panelOpen = false, near = null;
  const joy = { x: 0, y: 0, active: false };
  const vel = new THREE.Vector3();
  const typing = (e) => /INPUT|TEXTAREA|SELECT/.test(e.target.tagName) || e.target.isContentEditable;
  const onKeyDown = (e) => {
    if (panelOpen) { if (e.key === 'Escape' && !document.querySelector('.modal-backdrop,.lightbox')) closePanel(); return; }
    if (typing(e) || document.querySelector('.modal-backdrop,.drawer.open')) return;
    const k = e.key.toLowerCase();
    if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' '].includes(k)) e.preventDefault();
    keys.add(k); if (['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(k)) { target = null; targetZone = null; marker.visible = false; }
    if (k === ' ' && onGround) { vy = 7.5; onGround = false; }
    if ((k === 'e' || k === 'enter') && near) enter(near.key);
  };
  const onKeyUp = (e) => keys.delete(e.key.toLowerCase());
  addEventListener('keydown', onKeyDown); addEventListener('keyup', onKeyUp);
  addEventListener('blur', () => keys.clear());

  const ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
  let drag = null;
  const cv = renderer.domElement;
  cv.addEventListener('pointerdown', (e) => { if (panelOpen) return; drag = { x: e.clientX, y: e.clientY, yaw, moved: false, id: e.pointerId }; try { cv.setPointerCapture(e.pointerId); } catch { /* */ } });
  cv.addEventListener('pointermove', (e) => {
    if (!drag || drag.id !== e.pointerId) { hoverCheck(e); return; }
    const dx = e.clientX - drag.x; if (Math.abs(dx) > 6 || Math.abs(e.clientY - drag.y) > 6) drag.moved = true;
    if (drag.moved) yaw = drag.yaw - dx * .006;
  });
  cv.addEventListener('pointerup', (e) => { if (drag && !drag.moved) clickAt(e); drag = null; });
  cv.addEventListener('wheel', (e) => { e.preventDefault(); dist = THREE.MathUtils.clamp(dist + e.deltaY * .01, 8, 26); }, { passive: false });
  function pick(e, objs) { const r = cv.getBoundingClientRect(); ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1); ray.setFromCamera(ndc, camera); return ray.intersectObjects(objs, true); }
  const zoneMeshes = () => zoneObjs.filter(o => o.visible).flatMap(o => [o.group, o.pad]);
  function hoverCheck(e) { const h = pick(e, zoneMeshes()); cv.style.cursor = h.length ? 'pointer' : 'grab'; }
  function clickAt(e) {
    const hz = pick(e, zoneMeshes());
    if (hz.length) { const z = zoneObjs.find(o => o.key === hz[0].object.userData.zone); if (z) { walkTo(z); return; } }
    const hg = pick(e, [ground]);
    if (hg.length) { const p = hg[0].point; target = new THREE.Vector3(p.x, 0, p.z); targetZone = null; marker.position.set(p.x, .08, p.z); marker.visible = true; }
  }
  function walkTo(z) { target = z.padPos.clone(); targetZone = z; marker.position.set(z.padPos.x, .25, z.padPos.z); marker.visible = true; if (panelOpen) closePanel(); }

  // Joystick táctil
  const js = hud.querySelector('.joystick'), knob = js.querySelector('i');
  js.addEventListener('pointerdown', (e) => { joy.active = true; js.setPointerCapture(e.pointerId); moveJoy(e); target = null; targetZone = null; marker.visible = false; });
  js.addEventListener('pointermove', (e) => { if (joy.active) moveJoy(e); });
  const endJoy = () => { joy.active = false; joy.x = joy.y = 0; knob.style.transform = ''; };
  js.addEventListener('pointerup', endJoy); js.addEventListener('pointercancel', endJoy);
  function moveJoy(e) { const r = js.getBoundingClientRect(); let x = (e.clientX - r.left - r.width / 2) / (r.width / 2), y = (e.clientY - r.top - r.height / 2) / (r.height / 2); const l = Math.hypot(x, y); if (l > 1) { x /= l; y /= l; } joy.x = x; joy.y = y; knob.style.transform = `translate(${x * 35}px, ${y * 35}px)`; }

  // Botones de zonas
  function renderZoneButtons() {
    const box = hud.querySelector('.hud-zones'); if (!box) return;
    box.innerHTML = zoneObjs.filter(o => o.visible).map(o => `<button data-z="${o.key}" title="Ir a ${o.title}"><i style="background:${o.color}"></i><span>${o.title}</span></button>`).join('');
    box.querySelectorAll('[data-z]').forEach(b => b.onclick = () => { const z = zoneObjs.find(o => o.key === b.dataset.z); walkTo(z); });
  }
  renderZoneButtons();

  // ---------- Panel de contenido ----------
  let panel = null;
  function openPanel(title, key) {
    const z = zoneObjs.find(o => o.key === key);
    if (!panel) {
      panel = document.createElement('section'); panel.className = 'world-panel'; panel.setAttribute('role', 'dialog'); panel.setAttribute('aria-modal', 'false');
      panel.innerHTML = `<div class="wp-head"><h3></h3><div style="display:flex;gap:8px"><button class="hud-pill" data-classic title="Abrir en la vista web">${icon('monitor')}</button><button class="hud-pill" data-close aria-label="Volver a la isla">${icon('x')} Isla</button></div></div><div class="wp-body"></div>`;
      root.appendChild(panel);
      panel.querySelector('[data-close]').onclick = () => closePanel();
      panel.querySelector('[data-classic]').onclick = () => onExit();
    }
    panel.querySelector('h3').textContent = title;
    if (z) panel.querySelector('.wp-head').style.backgroundColor = z.color;
    const body = panel.querySelector('.wp-body'); body.innerHTML = ''; body.scrollTop = 0;
    panelOpen = true; keys.clear(); target = null; marker.visible = false;
    if (prompt) { prompt.remove(); prompt = null; }
    if (z) { const dir = new THREE.Vector3().subVectors(z.pos, pelon.position); pelon.rotation.y = Math.atan2(dir.x, dir.z); }
    setTimeout(() => panel?.querySelector('[data-close]')?.focus(), 60);
    return body;
  }
  function closePanel() { if (!panel) return; panel.remove(); panel = null; panelOpen = false; onClosePanel && onClosePanel(); cv.focus?.(); }
  function enter(key) { if (panelOpen) return; jumpHappy = 1; onEnter(key); }
  let jumpHappy = 0;

  // ---------- Bucle ----------
  const clock = new THREE.Clock();
  let intro = reduce ? 1 : 0, raf = 0, frame = 0;
  const camPos = new THREE.Vector3(0, 60, 70), look = new THREE.Vector3();
  function resize() { const w = root.clientWidth, h = root.clientHeight; renderer.setSize(w, h, false); camera.aspect = w / h; camera.fov = w < 700 ? 62 : 50; camera.updateProjectionMatrix(); }
  addEventListener('resize', resize); resize();

  const tmp = new THREE.Vector3(), proj = new THREE.Vector3();
  function tick() {
    raf = requestAnimationFrame(tick);
    const dt = Math.min(clock.getDelta(), .05), t = clock.elapsedTime; frame++;
    if (document.hidden) return;
    intro = Math.min(1, intro + dt * .45);

    // Movimiento
    let ix = 0, iz = 0;
    if (!panelOpen) {
      if (keys.has('w') || keys.has('arrowup')) iz -= 1; if (keys.has('s') || keys.has('arrowdown')) iz += 1;
      if (keys.has('a') || keys.has('arrowleft')) ix -= 1; if (keys.has('d') || keys.has('arrowright')) ix += 1;
      if (joy.active) { ix = joy.x; iz = joy.y; }
    }
    const fwd = new THREE.Vector3(-Math.sin(yaw), 0, -Math.cos(yaw)), right = new THREE.Vector3(Math.cos(yaw), 0, -Math.sin(yaw));
    const want = new THREE.Vector3().addScaledVector(fwd, -iz).addScaledVector(right, ix);
    if (!ix && !iz && target && !panelOpen) {
      want.subVectors(target, pelon.position).setY(0);
      if (want.length() < .35) { want.set(0, 0, 0); marker.visible = false; const tz = targetZone; target = null; targetZone = null; if (tz) enter(tz.key); }
    }
    if (want.lengthSq() > 1) want.normalize();
    const speed = (keys.has('shift') ? 12 : 7.5);
    vel.lerp(want.multiplyScalar(speed), 1 - Math.pow(.0005, dt));
    const moving = vel.length() > .4;
    pelon.position.addScaledVector(vel, dt);
    // límites de la isla y choques
    const r = Math.hypot(pelon.position.x, pelon.position.z);
    if (r > ISLAND_R - 1.2) pelon.position.multiplyScalar((ISLAND_R - 1.2) / r).setY(pelon.position.y);
    for (const o of zoneObjs) if (o.visible) push(o.pos.x, o.pos.z, 3.4);
    for (const tr of trees) push(tr.x, tr.z, 1.1);
    push(0, 0, 1.9);
    function push(x, z, rad) { const dx = pelon.position.x - x, dz = pelon.position.z - z, d = Math.hypot(dx, dz); if (d < rad && d > 0) { pelon.position.x = x + dx / d * rad; pelon.position.z = z + dz / d * rad; } }
    // salto
    vy -= 22 * dt; pelon.position.y = Math.max(0, pelon.position.y + vy * dt); if (pelon.position.y === 0) { vy = 0; onGround = true; }
    if (jumpHappy > 0 && onGround) { vy = 6; onGround = false; jumpHappy = 0; }
    // orientación y animación
    if (moving) { const ang = Math.atan2(vel.x, vel.z); let d = ang - pelon.rotation.y; d = Math.atan2(Math.sin(d), Math.cos(d)); pelon.rotation.y += d * Math.min(1, dt * 12); walkT += dt * vel.length() * 1.6; }
    const P = pelon.userData;
    const bob = moving ? Math.abs(Math.sin(walkT)) * .22 : Math.sin(t * 2.2) * .05;
    P.body.position.y = 1.0 + bob * .6; P.head.position.y = 2.35 + bob; P.head.rotation.z = moving ? Math.sin(walkT) * .08 : Math.sin(t * 1.4) * .04;
    P.footL.position.z = moving ? Math.sin(walkT) * .35 : 0; P.footR.position.z = moving ? -Math.sin(walkT) * .35 : 0;
    P.footL.position.y = .22 + (moving ? Math.max(0, Math.sin(walkT)) * .2 : 0); P.footR.position.y = .22 + (moving ? Math.max(0, -Math.sin(walkT)) * .2 : 0);
    P.armL.rotation.x = moving ? -Math.sin(walkT) * .8 : Math.sin(t * 2) * .1; P.armR.rotation.x = moving ? Math.sin(walkT) * .8 : -Math.sin(t * 2) * .1;
    P.knot.rotation.z = Math.sin(t * 6 + walkT) * .25;
    blob.position.set(pelon.position.x, .03, pelon.position.z); blob.scale.setScalar(1.1 - pelon.position.y * .08);

    // Zona cercana
    let nz = null; for (const o of zoneObjs) if (o.visible && Math.hypot(pelon.position.x - o.padPos.x, pelon.position.z - o.padPos.z) < 2.6) nz = o;
    if (nz !== near) {
      near = nz; zoneObjs.forEach(o => o.label.classList.toggle('near', o === near));
      hud.querySelectorAll('[data-z]').forEach(b => b.classList.toggle('near', near && b.dataset.z === near.key));
      if (prompt) { prompt.remove(); prompt = null; }
      if (near && !panelOpen) { prompt = document.createElement('div'); prompt.className = 'hud-prompt'; prompt.innerHTML = `<span>${near.hint}</span><button class="btn small">Entrar ${coarse ? '' : '<kbd style="background:#fff3;padding:1px 6px;border-radius:6px">E</kbd>'}</button>`; prompt.querySelector('button').onclick = () => enter(near.key); hud.appendChild(prompt); }
    }

    // Ambiente
    bigHeart.rotation.y = t * .8; bigHeart.position.y = 3.6 + Math.sin(t * 1.5) * .25;
    banner.position.y = 6.8 + Math.sin(t) * .15;
    zoneObjs.forEach((o, i) => { o.ring.scale.setScalar(1 + Math.sin(t * 3 + i) * .06); o.group.userData.anim && o.group.userData.anim(t, dt); });
    marker.rotation.z = t * 3; marker.scale.setScalar(1 + Math.sin(t * 6) * .15);
    clouds.forEach((c, i) => { c.position.x += dt * (1 + i % 3 * .4); if (c.position.x > 90) c.position.x = -90; });
    balloons.forEach(b => { b.position.y = 3 + Math.sin(t + b.userData.p) * .4; b.rotation.z = Math.sin(t * .8 + b.userData.p) * .1; });
    hearts.forEach(h => { h.position.y += dt * h.userData.s; h.rotation.y += dt; if (h.position.y > 14) h.position.y = -1; });
    boat.position.y = -1.3 + Math.sin(t * 1.3) * .15; boat.rotation.z = Math.sin(t * 1.1) * .06; boat.position.z = 18 + Math.sin(t * .1) * 10;
    if (!reduce && frame % (coarse ? 3 : 2) === 0) {
      const p = seaGeo.attributes.position;
      for (let i = 0; i < p.count; i++) { const x = seaBase[i * 3], z = seaBase[i * 3 + 2]; p.array[i * 3 + 1] = Math.sin(x * .12 + t * 1.2) * .28 + Math.cos(z * .1 + t * .9) * .22; }
      p.needsUpdate = true;
    }

    // Cámara
    const focus = tmp.set(pelon.position.x, 1.6, pelon.position.z);
    const e = 1 - Math.pow(1 - intro, 3);
    const d = THREE.MathUtils.lerp(70, dist, e), pt = THREE.MathUtils.lerp(1.0, pitch, e), yw = THREE.MathUtils.lerp(yaw + 1.2, yaw, e);
    const want3 = new THREE.Vector3(focus.x + Math.sin(yw) * Math.cos(pt) * d, focus.y + Math.sin(pt) * d, focus.z + Math.cos(yw) * Math.cos(pt) * d);
    camPos.lerp(want3, 1 - Math.pow(.001, dt)); look.lerp(focus, 1 - Math.pow(.0001, dt));
    camera.position.copy(camPos); camera.lookAt(look);
    if (panelOpen && innerWidth > 900) camera.setViewOffset(innerWidth, innerHeight, innerWidth * .22, 0, innerWidth, innerHeight); else camera.clearViewOffset();

    renderer.render(scene, camera);

    // Etiquetas HTML
    const w = root.clientWidth, h = root.clientHeight;
    zoneObjs.forEach(o => {
      if (!o.visible) return;
      proj.copy(o.pos).setY(o.group.userData.h || 6.5).project(camera);
      const vis = proj.z < 1 && Math.abs(proj.x) < 1.2 && Math.abs(proj.y) < 1.2 && !(panelOpen && innerWidth <= 900);
      o.label.style.display = vis ? '' : 'none';
      if (vis) o.label.style.left = ((proj.x + 1) / 2 * w) + 'px', o.label.style.top = ((1 - proj.y) / 2 * h) + 'px';
    });
  }
  root.querySelector('.world-loading')?.remove();
  tick();

  return {
    openPanel, closePanel,
    setZoneVisible(key, v) { const o = zoneObjs.find(z => z.key === key); if (o && o.visible !== v) setVis(o, v); },
    destroy() {
      cancelAnimationFrame(raf);
      removeEventListener('keydown', onKeyDown); removeEventListener('keyup', onKeyUp); removeEventListener('resize', resize);
      scene.traverse(o => { if (o.geometry) o.geometry.dispose(); if (o.material) [].concat(o.material).forEach(m => { m.map?.dispose(); m.dispose(); }); });
      renderer.dispose(); root.remove();
    },
  };
}

// =====================================================================
//  Constructores de piezas
// =====================================================================
function makeHeart() {
  const s = new THREE.Shape();
  s.moveTo(25, 25); s.bezierCurveTo(25, 25, 20, 0, 0, 0); s.bezierCurveTo(-30, 0, -30, 35, -30, 35);
  s.bezierCurveTo(-30, 55, -10, 77, 25, 95); s.bezierCurveTo(60, 77, 80, 55, 80, 35);
  s.bezierCurveTo(80, 35, 80, 0, 50, 0); s.bezierCurveTo(35, 0, 25, 25, 25, 25);
  const g = new THREE.ExtrudeGeometry(s, { depth: 18, bevelEnabled: true, bevelSegments: 4, bevelSize: 6, bevelThickness: 6, curveSegments: 18 });
  g.center(); g.rotateZ(Math.PI); return g;
}

function bandanaTexture(base = '#1d6fb8') {
  const c = document.createElement('canvas'); c.width = 256; c.height = 128; const x = c.getContext('2d');
  x.fillStyle = base; x.fillRect(0, 0, 256, 128);
  x.strokeStyle = '#ffffff'; x.lineWidth = 5; x.lineCap = 'round';
  for (let row = 0; row < 3; row++) for (let col = 0; col < 5; col++) {
    const ox = col * 54 + (row % 2) * 27 + 6, oy = row * 44 + 26;
    x.beginPath(); x.moveTo(ox, oy); x.bezierCurveTo(ox + 8, oy - 16, ox + 26, oy - 16, ox + 28, oy - 2); x.bezierCurveTo(ox + 30, oy + 10, ox + 14, oy + 10, ox + 16, oy - 2); x.stroke();
  }
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(3, 2); t.colorSpace = THREE.SRGBColorSpace; return t;
}

function makePelon() {
  const g = new THREE.Group();
  const skin = mat('#ffb01f', { roughness: .55 });
  const head = new THREE.Group(); head.position.y = 2.35; g.add(head);
  const face = new THREE.Mesh(new THREE.SphereGeometry(1.15, 40, 28), skin); face.castShadow = true; head.add(face);
  const band = new THREE.Mesh(new THREE.SphereGeometry(1.19, 40, 20, 0, Math.PI * 2, 0, Math.PI * .43), new THREE.MeshStandardMaterial({ map: bandanaTexture(), roughness: .8 }));
  band.rotation.x = -.32; band.castShadow = true; head.add(band);
  const rim = new THREE.Mesh(new THREE.TorusGeometry(1.16, .08, 10, 48), M.blue); rim.rotation.x = Math.PI / 2 - .32; rim.position.set(0, .26, -.08); head.add(rim);
  const knot = new THREE.Group(); knot.position.set(.55, .25, -1.0); head.add(knot);
  const k1 = new THREE.Mesh(new THREE.ConeGeometry(.28, .9, 12), M.pink); k1.rotation.set(-1.9, 0, .5); k1.position.set(.15, -.1, -.35); knot.add(k1);
  const k2 = new THREE.Mesh(new THREE.ConeGeometry(.24, .8, 12), M.pink); k2.rotation.set(-1.4, 0, -.4); k2.position.set(-.1, -.35, -.3); knot.add(k2);
  knot.add(new THREE.Mesh(new THREE.SphereGeometry(.2, 12, 10), M.pink));
  const arc = new THREE.TorusGeometry(.17, .045, 8, 20, Math.PI);
  const eyeL = new THREE.Mesh(arc, M.dark); eyeL.position.set(-.38, .02, 1.07); eyeL.rotation.set(-.1, -.3, 0); head.add(eyeL);
  const eyeR = new THREE.Mesh(arc, M.dark); eyeR.position.set(.38, .02, 1.07); eyeR.rotation.set(-.1, .3, 0); head.add(eyeR);
  const mouth = new THREE.Mesh(new THREE.TorusGeometry(.32, .05, 8, 24, Math.PI), M.dark); mouth.position.set(0, -.32, 1.06); mouth.rotation.set(.15, 0, Math.PI); head.add(mouth);
  const cheekM = mat('#ff7aa8', { transparent: true, opacity: .7 });
  [-1, 1].forEach(s => { const c = new THREE.Mesh(new THREE.SphereGeometry(.17, 12, 8), cheekM); c.scale.set(1, .6, .4); c.position.set(.66 * s, -.2, .9); head.add(c); });
  const body = new THREE.Mesh(new THREE.CapsuleGeometry(.55, .55, 8, 16), M.pink); body.position.y = 1.0; body.castShadow = true; g.add(body);
  const belly = new THREE.Mesh(makeHeart(), M.white); belly.scale.setScalar(.006); belly.position.set(0, 1.05, .52); g.add(belly);
  const footG = new THREE.SphereGeometry(.26, 14, 10);
  const footL = new THREE.Mesh(footG, M.blue); footL.scale.set(1, .7, 1.3); footL.position.set(-.3, .22, 0); footL.castShadow = true; g.add(footL);
  const footR = new THREE.Mesh(footG, M.blue); footR.scale.set(1, .7, 1.3); footR.position.set(.3, .22, 0); footR.castShadow = true; g.add(footR);
  const armG = new THREE.CapsuleGeometry(.14, .45, 4, 8);
  const armL = new THREE.Group(); armL.position.set(-.62, 1.3, 0); const al = new THREE.Mesh(armG, skin); al.position.y = -.3; armL.add(al); armL.rotation.z = -.3; g.add(armL);
  const armR = new THREE.Group(); armR.position.set(.62, 1.3, 0); const ar = new THREE.Mesh(armG, skin); ar.position.y = -.3; armR.add(ar); armR.rotation.z = .3; g.add(armR);
  g.userData = { head, body, footL, footR, armL, armR, knot };
  return g;
}

function makeTree(rnd) {
  const g = new THREE.Group();
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(.18, .26, 1.4, 8), M.wood); trunk.position.y = .7; trunk.castShadow = true; g.add(trunk);
  const cols = ['#9fe0ae', '#f9c6dc', '#7fd09a', '#ffd6e8', '#bfe3f7'];
  const m = mat(cols[Math.floor(rnd() * cols.length)], { flatShading: true });
  const kind = rnd();
  if (kind < .5) { [[0, 1.9, 0, 1.0], [.45, 2.4, .1, .7], [-.35, 2.5, -.2, .65]].forEach(([x, y, z, r]) => { const s = new THREE.Mesh(new THREE.IcosahedronGeometry(r, 1), m); s.position.set(x, y, z); s.castShadow = true; g.add(s); }); }
  else { [[1.9, 1.1], [2.6, .85], [3.2, .55]].forEach(([y, r]) => { const c = new THREE.Mesh(new THREE.ConeGeometry(r, 1.1, 8), m); c.position.y = y; c.castShadow = true; g.add(c); }); }
  const s = .85 + rnd() * .5; g.scale.setScalar(s); return g;
}
function makeCloud(rnd) { const g = new THREE.Group(); const m = mat('#ffffff', { roughness: 1, transparent: true, opacity: .95 }); for (let i = 0; i < 5; i++) { const s = new THREE.Mesh(new THREE.IcosahedronGeometry(1.6 + rnd() * 1.4, 1), m); s.position.set(i * 1.8 - 3.6, rnd() * .8, rnd() * 1.5); g.add(s); } g.scale.setScalar(1 + rnd()); return g; }
function makeBalloon(color) { const g = new THREE.Group(); const b = new THREE.Mesh(new THREE.SphereGeometry(.5, 20, 16), mat(color, { roughness: .3 })); b.scale.y = 1.2; b.position.y = 1.6; b.castShadow = true; g.add(b); const s = new THREE.Mesh(new THREE.CylinderGeometry(.015, .015, 1.6, 4), M.white); s.position.y = .8; g.add(s); return g; }
function makeBoat() {
  const g = new THREE.Group(); const hull = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 1, 1, 6, 1, false, 0, Math.PI), M.white); hull.rotation.set(Math.PI / 2, 0, Math.PI / 2); hull.scale.set(1, 2.4, 1); g.add(hull);
  const mast = new THREE.Mesh(new THREE.CylinderGeometry(.08, .08, 5, 6), M.wood); mast.position.y = 2.6; g.add(mast);
  const sailS = new THREE.Shape(); sailS.moveTo(0, 0); sailS.lineTo(0, 4); sailS.lineTo(2.6, 0); sailS.lineTo(0, 0);
  const sail = new THREE.Mesh(new THREE.ShapeGeometry(sailS), new THREE.MeshStandardMaterial({ map: bandanaTexture('#ec4f8e'), side: THREE.DoubleSide })); sail.position.set(.1, .6, 0); g.add(sail);
  g.scale.setScalar(1.2); return g;
}
function textSprite(text, color) {
  const c = document.createElement('canvas'); c.width = 1024; c.height = 180; const x = c.getContext('2d');
  x.fillStyle = 'rgba(255,255,255,.95)'; roundRect(x, 10, 20, 1004, 140, 70); x.fill();
  x.lineWidth = 10; x.strokeStyle = color; roundRect(x, 10, 20, 1004, 140, 70); x.stroke();
  x.font = '800 96px "Baloo 2", "Trebuchet MS", sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillStyle = color; x.fillText(text, 512, 96);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, depthWrite: false })); return s;
}
function roundRect(x, l, t, w, h, r) { x.beginPath(); x.moveTo(l + r, t); x.arcTo(l + w, t, l + w, t + h, r); x.arcTo(l + w, t + h, l, t + h, r); x.arcTo(l, t + h, l, t, r); x.arcTo(l, t, l + w, t, r); x.closePath(); }
function skyTexture() {
  const c = document.createElement('canvas'); c.width = 4; c.height = 256; const x = c.getContext('2d');
  const g = x.createLinearGradient(0, 0, 0, 256); g.addColorStop(0, '#7fcdf3'); g.addColorStop(.55, '#d7f0fd'); g.addColorStop(1, '#fde3ee');
  x.fillStyle = g; x.fillRect(0, 0, 4, 256); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}
function svgTexture(svg) {
  const t = new THREE.Texture(); const img = new Image();
  img.onload = () => { const c = document.createElement('canvas'); c.width = c.height = 256; const x = c.getContext('2d'); x.fillStyle = '#fff'; x.fillRect(0, 0, 256, 256); x.drawImage(img, 28, 28, 200, 200); t.image = c; t.needsUpdate = true; };
  img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg); t.colorSpace = THREE.SRGBColorSpace; return t;
}
const mulberry = (a) => () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
function distToSeg(px, pz, ax, az, bx, bz) { const dx = bx - ax, dz = bz - az; const l = dx * dx + dz * dz; let t = ((px - ax) * dx + (pz - az) * dz) / l; t = Math.max(0, Math.min(1, t)); return Math.hypot(px - (ax + t * dx), pz - (az + t * dz)); }

// ----- Edificios de cada zona (miran hacia +Z local = hacia la plaza) -----
function buildHouse(color) {
  const g = new THREE.Group();
  const base = new THREE.Mesh(new THREE.BoxGeometry(5, 3.4, 4.2), M.white); base.position.y = 1.7; g.add(base);
  const roof = new THREE.Mesh(new THREE.ConeGeometry(4.1, 2.6, 4), mat(color, { flatShading: true })); roof.position.y = 4.7; roof.rotation.y = Math.PI / 4; g.add(roof);
  const door = new THREE.Mesh(new THREE.BoxGeometry(1.2, 2, .2), M.blue); door.position.set(0, 1, 2.12); g.add(door);
  [-1.6, 1.6].forEach(x => { const w = new THREE.Mesh(new THREE.BoxGeometry(.9, .9, .2), M.sky); w.position.set(x, 2.1, 2.12); g.add(w); });
  const h = new THREE.Mesh(makeHeart(), M.pink); h.scale.setScalar(.018); h.position.set(0, 6.4, 0); g.add(h);
  g.userData.h = 8; g.userData.anim = (t) => { h.rotation.y = t * 1.5; }; return g;
}
function buildStall(color) {
  const g = new THREE.Group();
  const counter = new THREE.Mesh(new THREE.BoxGeometry(5, 1.4, 2), M.wood); counter.position.set(0, .7, .4); g.add(counter);
  [-2.3, 2.3].forEach(x => [-0.5, 1.3].forEach(z => { const p = new THREE.Mesh(new THREE.CylinderGeometry(.1, .1, 3.6, 6), M.white); p.position.set(x, 1.8, z); g.add(p); }));
  for (let i = 0; i < 7; i++) { const s = new THREE.Mesh(new THREE.BoxGeometry(5.6 / 7, .25, 2.8), i % 2 ? M.white : mat(color)); s.position.set(-2.8 + 5.6 / 14 + i * 5.6 / 7, 3.7, .4); s.rotation.x = -.18; g.add(s); }
  const cols = ['#1d6fb8', '#ec4f8e', '#26a9e0', '#7c5cc4'];
  const minis = cols.map((c, i) => { const m = new THREE.Group(); const hd = new THREE.Mesh(new THREE.SphereGeometry(.32, 16, 12), M.sun); const cap = new THREE.Mesh(new THREE.SphereGeometry(.34, 16, 8, 0, Math.PI * 2, 0, Math.PI * .45), mat(c)); cap.rotation.x = -.3; m.add(hd, cap); m.position.set(-1.8 + i * 1.2, 1.75, .9); g.add(m); return m; });
  g.userData.h = 6; g.userData.anim = (t) => minis.forEach((m, i) => { m.position.y = 1.75 + Math.abs(Math.sin(t * 3 + i)) * .2; }); return g;
}
function buildGallery(color) {
  const g = new THREE.Group();
  const wall = new THREE.Mesh(new THREE.BoxGeometry(6, 3.6, .5), mat(color)); wall.position.y = 1.8; g.add(wall);
  const pals = [{ band: '#1d6fb8', knot: '#ec4f8e' }, { band: '#ec4f8e', knot: '#1d6fb8' }, { band: '#26a9e0', knot: '#ffb01f' }];
  pals.forEach((p, i) => { const fr = new THREE.Mesh(new THREE.BoxGeometry(1.6, 1.6, .15), M.sun); fr.position.set(-1.9 + i * 1.9, 2.1, .3); g.add(fr); const pic = new THREE.Mesh(new THREE.PlaneGeometry(1.3, 1.3), new THREE.MeshBasicMaterial({ map: svgTexture(pelonSVG(p)) })); pic.position.set(-1.9 + i * 1.9, 2.1, .39); g.add(pic); });
  const easel = new THREE.Group(); [-.5, .5].forEach(x => { const l = new THREE.Mesh(new THREE.CylinderGeometry(.06, .06, 2.6, 5), M.wood); l.position.set(x, 1.3, 0); l.rotation.z = x * .2; easel.add(l); });
  const cv = new THREE.Mesh(new THREE.BoxGeometry(1.5, 1.1, .08), M.white); cv.position.set(0, 1.9, .1); easel.add(cv); easel.position.set(3.6, 0, 1.6); easel.rotation.y = -.5; g.add(easel);
  g.userData.h = 5.6; return g;
}
function buildKiosk(color) {
  const g = new THREE.Group();
  const col = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.3, 3.6, 20), M.white); col.position.y = 1.8; g.add(col);
  const band = new THREE.Mesh(new THREE.CylinderGeometry(1.25, 1.25, .5, 20), mat(color)); band.position.y = 2.6; g.add(band);
  const roof = new THREE.Mesh(new THREE.ConeGeometry(1.8, 1.4, 20), mat(color)); roof.position.y = 4.3; g.add(roof);
  const board = new THREE.Mesh(new THREE.BoxGeometry(3.4, 2, .2), M.white); board.position.set(2.8, 2.2, 0); g.add(board);
  const bl = new THREE.Mesh(new THREE.CylinderGeometry(.08, .08, 2.2, 6), M.wood); bl.position.set(2.8, 1.1, -.1); g.add(bl);
  [0, 1, 2].forEach(i => { const l = new THREE.Mesh(new THREE.BoxGeometry(2.6 - i * .5, .18, .05), i ? M.pinkSoft : M.pink); l.position.set(2.8 - i * .25, 2.7 - i * .45, .13); g.add(l); });
  const meg = new THREE.Mesh(new THREE.ConeGeometry(.5, 1.1, 16, 1, true), mat('#ffb01f', { side: THREE.DoubleSide })); meg.rotation.z = -Math.PI / 2; meg.position.set(-.2, 5.3, 0); g.add(meg);
  g.userData.h = 6.6; g.userData.anim = (t) => { meg.rotation.x = Math.sin(t * 2) * .3; }; return g;
}
function buildDrum(color) {
  const g = new THREE.Group();
  const stand = new THREE.Mesh(new THREE.BoxGeometry(3.6, 1.4, 1.6), M.wood); stand.position.y = .7; g.add(stand);
  [-1.4, 1.4].forEach(x => { const s = new THREE.Mesh(new THREE.BoxGeometry(.2, 2.4, .2), M.white); s.position.set(x, 2.2, 0); g.add(s); });
  const drum = new THREE.Group(); drum.position.y = 3.2; g.add(drum);
  const cage = new THREE.Mesh(new THREE.IcosahedronGeometry(1.3, 1), new THREE.MeshStandardMaterial({ color, wireframe: true })); drum.add(cage);
  const ballC = ['#ec4f8e', '#26a9e0', '#ffb01f', '#ffffff', '#2bb673'];
  for (let i = 0; i < 9; i++) { const b = new THREE.Mesh(new THREE.SphereGeometry(.22, 10, 8), mat(ballC[i % 5])); b.position.set(Math.sin(i * 2.1) * .6, Math.cos(i * 1.3) * .5, Math.sin(i * 3.7) * .6); drum.add(b); }
  const axle = new THREE.Mesh(new THREE.CylinderGeometry(.08, .08, 3, 6), M.white); axle.rotation.z = Math.PI / 2; axle.position.y = 3.2; g.add(axle);
  const tk = new THREE.Mesh(new THREE.BoxGeometry(1.4, .8, .1), mat('#ffb01f')); tk.position.set(0, 1.0, .85); g.add(tk);
  g.userData.h = 6; g.userData.anim = (t) => { drum.rotation.x = t * 1.2; }; return g;
}
function buildPodium(color) {
  const g = new THREE.Group();
  [[0, 2.2, M.sun], [-1.8, 1.5, mat(color)], [1.8, 1.0, M.sky]].forEach(([x, h, m]) => { const b = new THREE.Mesh(new THREE.BoxGeometry(1.7, h, 1.7), m); b.position.set(x, h / 2, 0); g.add(b); });
  const stars = [[0, 2.2], [-1.8, 1.5], [1.8, 1.0]].map(([x, h], i) => { const s = new THREE.Mesh(new THREE.OctahedronGeometry(.5 - i * .08, 0), mat('#ffd34d', { emissive: '#ffb01f', emissiveIntensity: .4, flatShading: true })); s.position.set(x, h + .9, 0); g.add(s); return s; });
  const arch = new THREE.Mesh(new THREE.TorusGeometry(3, .18, 10, 40, Math.PI), mat(color)); arch.position.y = .2; g.add(arch);
  g.userData.h = 5.5; g.userData.anim = (t) => stars.forEach((s, i) => { s.rotation.y = t * 2 + i; s.position.y = [3.1, 2.4, 1.9][i] + Math.sin(t * 2 + i) * .15; }); return g;
}
function buildLighthouse(color) {
  const g = new THREE.Group();
  const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(2.2, 0), M.rock); rock.scale.set(1.3, .5, 1.3); rock.position.y = .3; g.add(rock);
  for (let i = 0; i < 4; i++) { const s = new THREE.Mesh(new THREE.CylinderGeometry(1.15 - i * .14, 1.3 - i * .14, 1.4, 20), i % 2 ? mat(color) : M.white); s.position.y = 1.2 + i * 1.4; g.add(s); }
  const balcony = new THREE.Mesh(new THREE.CylinderGeometry(1.05, 1.05, .15, 20), M.dark); balcony.position.y = 6.6; g.add(balcony);
  const lamp = new THREE.Mesh(new THREE.CylinderGeometry(.6, .6, .9, 16), M.glass); lamp.position.y = 7.15; g.add(lamp);
  const cap = new THREE.Mesh(new THREE.ConeGeometry(.8, .8, 16), mat('#ec4f8e')); cap.position.y = 8; g.add(cap);
  const beam = new THREE.Mesh(new THREE.ConeGeometry(1.2, 9, 16, 1, true), new THREE.MeshBasicMaterial({ color: '#fff3a0', transparent: true, opacity: .22, side: THREE.DoubleSide, depthWrite: false }));
  beam.rotation.z = Math.PI / 2; beam.position.set(4.5, 0, 0); const bg = new THREE.Group(); bg.position.y = 7.15; bg.add(beam); g.add(bg);
  const mail = new THREE.Group(); const mb = new THREE.Mesh(new THREE.BoxGeometry(.8, .6, .6), M.pink); mb.position.y = 1.3; const mp = new THREE.Mesh(new THREE.CylinderGeometry(.06, .06, 1.1, 6), M.wood); mp.position.y = .55; mail.add(mb, mp); mail.position.set(2.4, 0, 1.8); g.add(mail);
  g.userData.h = 9.4; g.userData.anim = (t) => { bg.rotation.y = t * 1.2; }; return g;
}

'use strict';
/* graph3u.js : unified-depth 3D graph.
   One painter-sorted face list per frame for: surface cells (fn / fn2 / walls), solids, Riemann columns, cylindrical / spherical
   wedges, slices, boxes, planes and depth-sorted lines (axes, `depth:true` curves). Camera keyframes (`orbit`, layer kind 'orbit').
   Every frame is still a pure function of t: Board.render calls n.post(t) after the page's updates; the graph repaints only when the
   camera, the build or a layer's animation state changed (signature check), reusing a pool of <path> elements.
   Activated automatically (isUnified3d) when a graph3d uses a new layer kind, `orbit`, or `unified:true`; classic graphs keep the
   old renderer in graph.js untouched (pixel-identical). */

const U3_KINDS = new Set(['cols', 'wedge', 'solid', 'slices', 'orbit', 'pulse']);
function isUnified3d(spec) { return !!(spec.unified || spec.orbit || (spec.layers || []).some(l => U3_KINDS.has(l.kind))); }

const U3_LIGHT = (() => { const l = [-.35, -.55, .75], m = Math.hypot(...l); return l.map(v => v / m); })();
const U3_EDGE = 'rgba(12,20,18,.78)';
const u3rgb = c => { c = col(c); if (c[0] === '#') return hexRgb(c); const m = c.match(/[\d.]+/g); return m ? m.slice(0, 3).map(Number) : [242, 180, 64]; };
const u3str = (rgb, k = 1) => `rgb(${Math.round(clamp(rgb[0] * k, 0, 255))},${Math.round(clamp(rgb[1] * k, 0, 255))},${Math.round(clamp(rgb[2] * k, 0, 255))})`;
const u3mix = (a, b, u) => a.map((v, i) => v + (b[i] - v) * u);

/* ---------- Graph3U node ---------- */
function Graph3U(spec) {
  const n = { type: 'graph3d', spec, id: spec.id, writes: true, kids: [], parts: [], tail: .3, unified: true };
  const P = Object.assign({}, SURF[spec.surface] || {}, spec);
  const f = P.fn || null, polar = P.polar, showSurf = !!f && P.showSurf !== false;
  n.dur = spec.build ?? (showSurf ? 1.6 : .8); n.headDur = n.dur;
  if (polar) { P.x = [-polar, polar]; P.y = [-polar, polar]; }
  const rad = d => d * Math.PI / 180, zs = P.zs ?? .72;

  /* ---- ranges + normalisation (world -> normalized box) ---- */
  const [X0, X1] = P.x || [-1, 1], [Y0, Y1] = P.y || [-1, 1]; let Z0, Z1;
  if (P.z) [Z0, Z1] = P.z;
  else if (f) { Z0 = 1e9; Z1 = -1e9; for (let i = 0; i <= 30; i++) for (let j = 0; j <= 30; j++) { const xx = X0 + (X1 - X0) * i / 30, yy = Y0 + (Y1 - Y0) * j / 30; for (const z of P.fn2 ? [f(xx, yy), P.fn2(xx, yy)] : [f(xx, yy)]) { Z0 = Math.min(Z0, z); Z1 = Math.max(Z1, z); } } }
  else [Z0, Z1] = [-1, 1];
  const cx = (X0 + X1) / 2, cy = (Y0 + Y1) / 2, cz = (Z0 + Z1) / 2, hx = (X1 - X0) / 2, hy = (Y1 - Y0) / 2, hz = (Z1 - Z0) / 2 || 1;
  let kx, ky, kz;
  if (P.aspect === 'equal') { kx = ky = kz = 1 / Math.max(hx, hy); } else { kx = 1 / hx; ky = 1 / hy; kz = zs / hz; }
  const N = n.N = (x, y, z) => [(x - cx) * kx, (y - cy) * ky, (z - cz) * kz];
  const B = n.B = { x0: -hx * kx, x1: hx * kx, y0: -hy * ky, y1: hy * ky, z0: -hz * kz, z1: hz * kz };
  n.R = () => ({ X0, X1, Y0, Y1, Z0, Z1 });
  n.fn = f; n.zAt = (x, y) => f ? f(x, y) : 0;
  n.floorZ = Z0 <= 0 && 0 <= Z1 ? 0 : Z0;
  n.planeCorners = sp => { const e = sp.ext ?? [X0, X1, Y0, Y1]; return sp.x !== undefined ? [[sp.x, Y0, Z0], [sp.x, Y1, Z0], [sp.x, Y1, Z1], [sp.x, Y0, Z1]] : sp.y !== undefined ? [[X0, sp.y, Z0], [X1, sp.y, Z0], [X1, sp.y, Z1], [X0, sp.y, Z1]] : [[e[0], e[2], sp.z], [e[1], e[2], sp.z], [e[1], e[3], sp.z], [e[0], e[3], sp.z]]; };

  /* ---- layers ---- */
  n.kids = (spec.layers || []).map(l => LayerU(l, n));
  (spec.labels || []).forEach(l => n.kids.push(Rich(l)));
  const faceLayers = n.kids.filter(k => k.faces), overlays = n.kids.filter(k => k.reproj);
  n.resolveKids = ctx => { ctx.last = n.t0 + n.headDur - GAP + .1; };
  n.layout = function (maxW) { n.w = spec.w ?? maxW; n.h = spec.h ?? 520; };
  n.setPos = (ax, ay) => { n.ax = ax; n.ay = ay; n.kids.forEach(k => { if (k.type === 'rich') { const p = k.spec.pos || [0, 0]; k.layout(n.w - p[0]); k.setPos(ax + p[0], ay + p[1]); } }); };

  /* ---- camera: az/el (deg) + keyframes ---- */
  const az0 = P.az ?? -34, el0 = P.el ?? 24, rot = P.rotate ?? 0;
  let camSegs = [];
  n.afterResolve = function () {
    const S0 = [], o = spec.orbit;
    if (Array.isArray(o)) { let tp = 0; for (const k of o) { S0.push({ t0: n.t0 + tp, t1: n.t0 + k.t, az: k.az, el: k.el }); tp = k.t; } }
    else if (o) { const at = o.at ?? 0; S0.push({ t0: n.t0 + at, t1: n.t0 + at + (o.dur ?? 3), az: o.to ?? o.az, el: o.el }); }
    n.kids.filter(k => k.spec && k.spec.kind === 'orbit').forEach(k => S0.push({ t0: k.t0, t1: k.t0 + k.dur, az: k.spec.az, el: k.spec.el }));
    camSegs = S0.sort((a, b) => a.t0 - b.t0);
  };
  function camAt(t) {
    let az = az0, el = el0;
    for (const s of camSegs) { if (t < s.t0) break; const u = ease(clamp((t - s.t0) / Math.max(1e-6, s.t1 - s.t0))); if (s.az != null) az = lerp(az, s.az, u); if (s.el != null) el = lerp(el, s.el, u); if (u < 1) break; }
    if (rot) az += rot * Math.max(0, t - n.t0);
    return { az, el };
  }
  const viewer = (azd, eld) => {
    const a = rad(azd), e = rad(eld), c = Math.cos(a), s = Math.sin(a), ce = Math.cos(e), se = Math.sin(e);
    return { P: (x, y, z) => { const X = x * c - y * s, D = x * s + y * c; return [X, -(z * ce + D * se), D * ce - z * se]; }, toCam: [-s * ce, -c * ce, se] };
  };
  n.cam = { az: az0, el: el0 };

  /* ---- fit: whole content in frame for every camera the graph will use ---- */
  let fit = null, fitW = 0, fitH = 0, fitPtsN = [];
  function fitView() {
    if (fit && fitW === n.w && fitH === n.h) return fit;
    fitW = n.w; fitH = n.h;
    const azs = [az0, ...camSegs.filter(s => s.az != null).map(s => s.az)], els = [el0, ...camSegs.filter(s => s.el != null).map(s => s.el)];
    let a0 = Math.min(...azs), a1 = Math.max(...azs); if (rot) { a0 = az0; a1 = az0 + 360; }
    const e0 = Math.min(...els), e1 = Math.max(...els), cams = [];
    const na = a1 > a0 ? 16 : 0, ne = e1 > e0 ? 3 : 0;
    for (let i = 0; i <= na; i++) for (let j = 0; j <= ne; j++) cams.push(viewer(a0 + (a1 - a0) * (na ? i / na : 0), e0 + (e1 - e0) * (ne ? j / ne : 0)));
    let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9;
    for (const V of cams) for (const p of fitPtsN) { const q = V.P(p[0], p[1], p[2]); x0 = Math.min(x0, q[0]); x1 = Math.max(x1, q[0]); y0 = Math.min(y0, q[1]); y1 = Math.max(y1, q[1]); }
    const [pt, pr, pb, pl] = spec.pad || [66, 24, 26, 24];
    const s = Math.min((n.w - pl - pr) / (x1 - x0 || 1), (n.h - pt - pb) / (y1 - y0 || 1));
    return fit = { s, ox: pl + (n.w - pl - pr) / 2 - s * (x0 + x1) / 2, oy: pt + (n.h - pt - pb) / 2 - s * (y0 + y1) / 2 };
  }
  /* world -> absolute screen (current camera unless az/el given) */
  n.proj = function (x, y, z, az, el) {
    const F = fitView(); if (z === undefined || z === null) z = n.zAt(x, y);
    const q = viewer(az ?? n.cam.az, el ?? n.cam.el).P(...N(x, y, z)); return [n.ax + F.ox + F.s * q[0], n.ay + F.oy + F.s * q[1], q[2]];
  };

  /* ---- surface cells (static geometry; color as the classic renderer) ---- */
  const cells = [];
  function buildSurf(fn, pal, op) {
    const ni = polar ? (P.nr ?? 40) : (P.n ?? 48), nj = polar ? (P.nt ?? 72) : (P.n ?? 48), V = [], Wd = [];
    for (let i = 0; i <= ni; i++) { V[i] = []; Wd[i] = []; for (let j = 0; j <= nj; j++) {
      let x, y;
      if (polar) { const r = polar * i / ni, th = 2 * Math.PI * j / nj; x = r * Math.cos(th); y = r * Math.sin(th); }
      else { x = X0 + (X1 - X0) * i / ni; y = Y0 + (Y1 - Y0) * j / nj; }
      V[i][j] = N(x, y, clamp(fn(x, y), Z0, Z1)); Wd[i][j] = [x, y];
    } }
    for (let i = 0; i < ni; i++) for (let j = 0; j < nj; j++) {
      const a = V[i][j], b = V[i + 1][j], c = V[i + 1][j + 1], d = V[i][j + 1];
      const wx = (Wd[i][j][0] + Wd[i + 1][j][0] + Wd[i + 1][j + 1][0] + Wd[i][j + 1][0]) / 4, wy = (Wd[i][j][1] + Wd[i + 1][j][1] + Wd[i + 1][j + 1][1] + Wd[i][j + 1][1]) / 4;
      const ex = (X1 - X0) * .004, ey = (Y1 - Y0) * .004;
      const gx = (fn(wx + ex, wy) - fn(wx - ex, wy)) / (2 * ex) * kz / kx, gy = (fn(wx, wy + ey) - fn(wx, wy - ey)) / (2 * ey) * kz / ky;
      const m = Math.hypot(gx, gy, 1), nrmS = [-gx / m, -gy / m, 1 / m];
      const zc = (a[2] + b[2] + c[2] + d[2]) / 4, h = clamp((zc - B.z0) / (B.z1 - B.z0 || 1));
      cells.push({ v: [a, b, c, d], rgb: (pal || palette)(h), nrm: nrmS, key: i / ni, op, surf: true });
    }
  }
  if (showSurf) {
    buildSurf(f, null, 1);
    if (P.fn2) {
      const WARM = ['#7a3d1c', '#b8661f', '#e0953a', '#f2b440', '#fbe1a0'];
      buildSurf(P.fn2, u => { u = clamp(u) * (WARM.length - 1); const i = Math.min(WARM.length - 2, Math.floor(u)), a = hexRgb(WARM[i]), b = hexRgb(WARM[i + 1]), q = u - i; return a.map((v, k) => v + (b[k] - v) * q); }, P.op2 ?? .8);
      if (!polar && (P.opWall ?? .6) > 0) {
        const M = 28, E = [[X0, Y0, X1, Y0], [X1, Y0, X1, Y1], [X1, Y1, X0, Y1], [X0, Y1, X0, Y0]];
        E.forEach((e, k) => { for (let m = 0; m < M; m++) {
          const xa = lerp(e[0], e[2], m / M), ya = lerp(e[1], e[3], m / M), xb = lerp(e[0], e[2], (m + 1) / M), yb = lerp(e[1], e[3], (m + 1) / M), q = (x, y, fn) => N(x, y, clamp(fn(x, y), Z0, Z1));
          cells.push({ v: [q(xa, ya, f), q(xb, yb, f), q(xb, yb, P.fn2), q(xa, ya, P.fn2)], rgb: [111, 211, 176], nrm: [0, 0, 0], wallK: k % 2 ? .62 : .8, key: .5, op: P.opWall ?? .6, surf: true });
        } });
      }
    }
  }
  const mesh = spec.mesh ?? false, surfAlpha = P.surfAlpha ?? 1;

  /* ---- mount ---- */
  const axMode = spec.axes === false ? null : spec.axes === 'origin' ? 'origin' : 'corner';
  n.mount = function (pg) {
    const g = n.g = S('g', { style: 'display:none' }, pg.content);
    n.sub = { axes: S('g', {}, g), faces: S('g', {}, g), curves: S('g', {}, g), points: S('g', {}, g) };
    /* fit points (normalized): surface (subsampled), layers' final geometry, axes, spec.fitPts */
    fitPtsN = [];
    cells.forEach((c, i) => { if (i % 3 === 0) fitPtsN.push(...c.v); });
    faceLayers.forEach(L => fitPtsN.push(...L.fitPts()));
    (spec.fitPts || []).forEach(p => fitPtsN.push(N(...p)));
    axesGeom().pts.forEach(p => fitPtsN.push(p));
    if (!fitPtsN.length) fitPtsN.push([B.x0, B.y0, B.z0], [B.x1, B.y1, B.z1]);
    fit = null; fitView();
    n.pool = []; n.sig = null; n.camKey = null;
    if (axMode) mountAxes();
  };

  /* ---- axes ---- */
  function axesGeom() {
    if (!axMode) return { pts: [] };
    if (axMode === 'corner') {
      const o = [B.x0, B.y0, B.z0], L = { x: .6 * (B.x1 - B.x0), y: .425 * (B.y1 - B.y0), z: 1.08 * (B.z1 - B.z0) };
      const ends = { x: [o[0] + L.x, o[1], o[2]], y: [o[0], o[1] + L.y, o[2]], z: [o[0], o[1], o[2] + L.z] };
      return { o, ends, pts: [o, ends.x, ends.y, ends.z] };
    }
    const ext = P.axisExt ?? .22, o = N(0, 0, 0);
    const ends = { x: N(Math.max(X1, 0) + ext * (X1 - X0), 0, 0), y: N(0, Math.max(Y1, 0) + ext * (Y1 - Y0), 0), z: N(0, 0, Math.max(Z1, 0) + ext * (Z1 - Z0)) };
    return { o, ends, pts: [o, ends.x, ends.y, ends.z] };
  }
  let AXE = null;
  function mountAxes() {
    const ax = n.sub.axes, G = axesGeom(); AXE = { G, floor: null, lines: {}, heads: {}, labs: {} };
    if (axMode === 'corner' || spec.floor) AXE.floor = S('path', { fill: 'none', stroke: COL.grey, 'stroke-width': 1.4, 'stroke-dasharray': '6 7', opacity: .35 }, ax);
    for (const k of ['x', 'y', 'z']) {
      if (axMode === 'corner') AXE.lines[k] = S('path', { stroke: COL.grey, 'stroke-width': 2.6, fill: 'none', 'stroke-linecap': 'round', opacity: .95 }, ax);
      AXE.heads[k] = S('path', { stroke: COL.grey, 'stroke-width': 2.6, fill: 'none', 'stroke-linecap': 'round', opacity: .95 }, ax);
      const mg = mathGroup(ax, k, 46, COL.grey); setGlyphStatic(mg.gl); AXE.labs[k] = mg.g; if (spec.axisLabels === false) mg.g.style.display = 'none';
    }
  }
  function updateAxes() {
    if (!AXE) return;
    const F = fitView(), V = viewer(n.cam.az, n.cam.el), T = p => { const q = V.P(p[0], p[1], p[2]); return [F.ox + F.s * q[0] + n.ax, F.oy + F.s * q[1] + n.ay]; }, f1 = v => v.toFixed(1);
    if (AXE.floor) { const zf = axMode === 'corner' ? B.z0 : N(0, 0, n.floorZ)[2]; const fl = [[B.x0, B.y0, zf], [B.x1, B.y0, zf], [B.x1, B.y1, zf], [B.x0, B.y1, zf]].map(T); AXE.floor.setAttribute('d', 'M' + fl.map(p => f1(p[0]) + ' ' + f1(p[1])).join('L') + 'Z'); }
    const G = AXE.G;
    for (const k of ['x', 'y', 'z']) {
      const a = T(G.o), b = T(G.ends[k]), dx = b[0] - a[0], dy = b[1] - a[1], Ln = Math.hypot(dx, dy) || 1, ux = dx / Ln, uy = dy / Ln;
      if (AXE.lines[k]) AXE.lines[k].setAttribute('d', `M${f1(a[0])} ${f1(a[1])}L${f1(b[0])} ${f1(b[1])}`);
      AXE.heads[k].setAttribute('d', `M${f1(b[0])} ${f1(b[1])}l${f1(-ux * 14 - uy * 6)} ${f1(-uy * 14 + ux * 6)}M${f1(b[0])} ${f1(b[1])}l${f1(-ux * 14 + uy * 6)} ${f1(-uy * 14 - ux * 6)}`);
      AXE.heads[k].style.display = Ln < 8 ? 'none' : '';
      AXE.labs[k].setAttribute('transform', `translate(${f1(b[0] + ux * 10 - 12)},${f1(b[1] + uy * 10 + (k === 'z' ? 2 : 18))}) scale(${46 / 1000})`);
    }
  }
  /* origin axes are depth-sorted lines (hidden behind solids where appropriate) */
  function axisLines(out) {
    if (axMode !== 'origin') return;
    const G = AXE.G;
    for (const k of ['x', 'y', 'z']) u3line(out, G.o, G.ends[k], 14, { color: COL.grey, w: 2.6, op: .95 });
  }

  /* ---- painter ---- */
  function slot(k) { let e = n.pool[k]; if (!e) { e = S('path', { 'stroke-linejoin': 'round', 'stroke-linecap': 'round' }, n.sub.faces); e._a = {}; n.pool[k] = e; } return e; }
  function set(e, k, v) { if (e._a[k] !== v) { e._a[k] = v; e.setAttribute(k, v); } }
  function paint(t, u) {
    const V = viewer(n.cam.az, n.cam.el), F = fitView(), OX = F.ox + n.ax, OY = F.oy + n.ay, s = F.s, tc = V.toCam;
    const list = [];
    /* light: world light of the classic renderer, attached to the camera (rotates with az) unless light:'world' */
    const lb = spec.light === 'world' ? 0 : rad(-34 - n.cam.az), LT = [U3_LIGHT[0] * Math.cos(lb) - U3_LIGHT[1] * Math.sin(lb), U3_LIGHT[0] * Math.sin(lb) + U3_LIGHT[1] * Math.cos(lb), U3_LIGHT[2]];
    const shadeS = c => c.fill || (c.fill = c.wallK ? u3str(c.rgb, c.wallK) : u3str(c.rgb, .55 + .56 * clamp(c.nrm[0] * LT[0] + c.nrm[1] * LT[1] + c.nrm[2] * LT[2], 0, 1)));
    if (n.lightKey !== lb) { n.lightKey = lb; cells.forEach(c => { c.fill = null; }); }
    if (showSurf && u > 0) for (const c of cells) { const al = clamp((u * 1.12 - c.key) / .12) * (c.op ?? 1) * surfAlpha; if (al > 0) list.push({ v: c.v, fillS: shadeS(c), op: al, seam: true, surf: true }); }
    axisLines(list);
    for (const L of faceLayers) { const fs = L.faces(t); if (fs) for (const fc of fs) list.push(fc); }
    const items = [];
    for (let i = 0; i < list.length; i++) {
      const fc = list[i], v = fc.v, q = new Array(v.length); let dep = 0;
      let dmax = -1e9;
      for (let k = 0; k < v.length; k++) { q[k] = V.P(v[k][0], v[k][1], v[k][2]); dep += q[k][2]; if (q[k][2] > dmax) dmax = q[k][2]; }
      dep = fc.dk === 'max' ? dmax - 1e-4 : dep / v.length;
      let fill = fc.fillS, pass = 1;
      if (!fc.line && !fc.fillS) {
        /* Newell normal, oriented outward (away from fc.ctr) when given */
        let nx = 0, ny = 0, nz = 0, mx = 0, my = 0, mz = 0;
        for (let k = 0; k < v.length; k++) { const a = v[k], b = v[(k + 1) % v.length]; nx += (a[1] - b[1]) * (a[2] + b[2]); ny += (a[2] - b[2]) * (a[0] + b[0]); nz += (a[0] - b[0]) * (a[1] + b[1]); mx += a[0]; my += a[1]; mz += a[2]; }
        const m = Math.hypot(nx, ny, nz) || 1; nx /= m; ny /= m; nz /= m;
        if (fc.ctr) { const L = v.length; if (nx * (mx / L - fc.ctr[0]) + ny * (my / L - fc.ctr[1]) + nz * (mz / L - fc.ctr[2]) < 0) { nx = -nx; ny = -ny; nz = -nz; } }
        const facing = nx * tc[0] + ny * tc[1] + nz * tc[2];
        if (fc.cull && facing <= 1e-6) continue;
        if (fc.shell) pass = facing >= 0 ? 2 : 0;
        if (facing < 0) { nx = -nx; ny = -ny; nz = -nz; }
        const lam = fc.shade === false ? .75 : clamp(nx * LT[0] + ny * LT[1] + nz * LT[2], 0, 1);
        let rgb = fc.rgb; if (fc.glow) rgb = u3mix(rgb, [255, 240, 200], .5 * fc.glow);
        fill = u3str(rgb, (.55 + .56 * lam) * (fc.k ?? 1) * (facing < 0 ? .82 : 1));
      }
      items.push({ fc, q, dep: dep - (fc.bias ?? (fc.line ? .02 : 0)), fill, i, pass });
    }
    /* pass 0: back faces of translucent shells, 1: everything else (painter's depth), 2: front faces of shells */
    items.sort((a, b) => a.pass - b.pass || b.dep - a.dep || a.i - b.i);
    const XY = p => (OX + s * p[0]).toFixed(1) + ' ' + (OY + s * p[1]).toFixed(1);
    let k = 0;
    for (const it of items) {
      const fc = it.fc, q = it.q;
      if (fc.line) {
        const e = slot(k++); set(e, 'display', 'inline'); set(e, 'd', 'M' + XY(q[0]) + 'L' + XY(q[1])); set(e, 'fill', 'none'); set(e, 'stroke', fc.color); set(e, 'stroke-width', fc.w ?? 3); set(e, 'opacity', (fc.op ?? 1).toFixed(3)); set(e, 'stroke-dasharray', fc.dash || 'none');
        continue;
      }
      const d = 'M' + q.map(XY).join('L') + 'Z', op = clamp(fc.op ?? 1), opaque = op > .985 || fc.seam;
      const e = slot(k++); set(e, 'display', 'inline'); set(e, 'd', d); set(e, 'fill', it.fill);
      set(e, 'stroke', fc.surf ? (mesh ? 'rgba(10,22,28,.38)' : it.fill) : opaque ? it.fill : 'none'); set(e, 'stroke-width', fc.surf ? (mesh ? .8 : .7) : .8);
      set(e, 'opacity', op.toFixed(3)); set(e, 'stroke-dasharray', 'none');
      if (fc.edges) {
        let ed = '';
        if (fc.edges === true) ed = d;
        else { for (let j = 0; j < q.length; j++) if (fc.edges[j]) ed += 'M' + XY(q[j]) + 'L' + XY(q[(j + 1) % q.length]); }
        if (ed) { const e2 = slot(k++); set(e2, 'display', 'inline'); set(e2, 'd', ed); set(e2, 'fill', 'none'); set(e2, 'stroke', fc.glow ? u3str(u3mix(u3rgb(fc.ec || U3_EDGE), [242, 180, 64], fc.glow)) : (fc.ec || U3_EDGE)); set(e2, 'stroke-width', ((fc.ew ?? 1.4) * (1 + 1.2 * (fc.glow || 0))).toFixed(2)); set(e2, 'opacity', Math.min(1, op * (fc.eop ?? 1) * (opaque ? 1 : 1.6)).toFixed(3)); set(e2, 'stroke-dasharray', 'none'); }
      }
    }
    for (; k < n.pool.length; k++) set(n.pool[k], 'display', 'none');
  }

  n.update = function (t, st) {
    const lt = t - n.t0;
    if (st === 0) { n.g.style.display = 'none'; return; }
    n.g.style.display = '';
    n.sub.axes.setAttribute('opacity', clamp(lt / .5).toFixed(2));
  };
  n.post = function (t) {
    if (t < n.t0 || !n.g || n.g.style.display === 'none') return;
    for (const L of overlays) if (L.spec.until || L.spec.out != null) L.applyVis(t);
    const cam = camAt(t), u = ease(clamp((t - n.t0) / n.headDur)), camKey = cam.az.toFixed(4) + ',' + cam.el.toFixed(4);
    const sig = camKey + '|' + u.toFixed(4) + '|' + faceLayers.map(L => L.state(t)).join(';');
    if (sig === n.sig) return;
    n.cam = cam;
    if (camKey !== n.camKey) { n.camKey = camKey; updateAxes(); overlays.forEach(L => L.reproj()); }
    paint(t, u); n.sig = sig;
  };
  n.events = push => push({ type: 'draw', t: n.t0, dur: n.headDur, seed: hstr(n.id || n.type), amp: 1 });
  return n;
}

/* a depth-sorted line split into m pieces (normalized endpoints) */
function u3line(out, a, b, m, o) { for (let i = 0; i < m; i++) out.push(Object.assign({ line: true, v: [u3l(a, b, i / m), u3l(a, b, (i + 1) / m)] }, o)); }
const u3l = (a, b, u) => [a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u, a[2] + (b[2] - a[2]) * u];

/* ---------- geometry builders (world coordinates in, normalized faces out) ---------- */
/* vertical pieces for a side face of normalized height h and width w: keeps tall side faces sortable against neighbours */
const u3pieces = (h, w) => clamp(Math.ceil(Math.abs(h) / Math.max(.02, .9 * w)), 1, 10);
/* prism over a polar cell (or a rectangle) between zb and zt; returns faces; o = {rgb, op, ec, ew, glow, k, off:[dx,dy,dz]} */
function u3prism(G, base, zb, zt, o) {
  const N = G.N, off = o.off || [0, 0, 0], out = [];
  const W = (x, y, z) => N(x + off[0], y + off[1], z + off[2]);
  const ring = base.ring, M = ring.length, closed = base.closed;           // ring: [[x,y]...] outline (counter-clockwise), sides: which outline edges are "corners"
  const cxy = base.c, ctr = W(cxy[0], cxy[1], (zb + zt) / 2);
  const hN = Math.abs(W(0, 0, zt)[2] - W(0, 0, zb)[2]), wN = base.wN;
  const F = (v, edges, dk) => out.push({ v, rgb: o.rgb, op: o.op, cull: o.cull !== false, ctr, edges: o.edges === false ? false : edges, ec: o.ec, ew: o.ew, glow: o.glow, k: o.k, eop: o.eop, dk });
  /* caps (sorted by their farthest vertex: whatever stands on a cap is drawn after it) */
  const cap = z => {
    if (M <= 12 || !base.fan) { F(ring.map(p => W(p[0], p[1], z)), true, 'max'); return; }
    /* disk: polar grid of small pieces (radial bands x angular sectors) so a smaller slab standing on it sorts correctly */
    const C = W(cxy[0], cxy[1], z), P0 = W(ring[0][0], ring[0][1], z), rN = Math.hypot(P0[0] - C[0], P0[1] - C[1], P0[2] - C[2]);
    const nb = clamp(Math.ceil(rN / .14), 1, 6), step = Math.max(4, Math.ceil(M / 10)), at = (p, f) => W(cxy[0] + (p[0] - cxy[0]) * f, cxy[1] + (p[1] - cxy[1]) * f, z);
    for (let b = 0; b < nb; b++) for (let i = 0; i < M; i += step) {
      const js = []; for (let j = i; j <= Math.min(i + step, M); j++) js.push(j % M);
      const pts = js.map(j => at(ring[j], (b + 1) / nb)), ed = js.map(() => b === nb - 1); ed[ed.length - 1] = false;
      if (b === 0) { pts.push(C); ed.push(false); } else for (let q = js.length - 1; q >= 0; q--) { pts.push(at(ring[js[q]], b / nb)); ed.push(false); }
      F(pts, ed, 'max');
    }
  };
  cap(zt); if (o.bottom !== false) cap(zb);
  /* sides */
  const mF = o.pieces ?? u3pieces(hN, wN), E = closed ? M : M - 1;
  for (let i = 0; i < E; i++) {
    const a = ring[i], b = ring[(i + 1) % M], ca = base.corner[i], cb = base.corner[(i + 1) % M];
    /* o.clip(edge) -> visible z-intervals [[z0,z1,edgeBottom,edgeTop],...] (parts hidden by a touching neighbour are not emitted) */
    const ivs = (o.clip && o.clip(base.nbr ? base.nbr[i] : i)) || [[zb, zt, true, true]];
    for (const [ya, yb, eb, et] of ivs) {
      const m = Math.max(1, Math.round(mF * Math.abs(yb - ya) / (Math.abs(zt - zb) || 1)));
      for (let j = 0; j < m; j++) {
        const z0 = lerp(ya, yb, j / m), z1 = lerp(ya, yb, (j + 1) / m);
        F([W(a[0], a[1], z0), W(b[0], b[1], z0), W(b[0], b[1], z1), W(a[0], a[1], z1)], [j === 0 && eb, cb, j === m - 1 && et, ca]);
      }
    }
  }
  return out;
}
/* outline of a polar cell r0..r1, t0..t1 with seg arc pieces (centre cx,cy); corner flags mark the 4 real corners */
function u3polarBase(G, r0, r1, t0, t1, seg, c = [0, 0]) {
  const ring = [], corner = [], nbr = [];      // nbr[edge]: 'o' outer arc, 't1' / 't0' radial sides, 'i' inner arc
  for (let i = 0; i <= seg; i++) { const t = lerp(t0, t1, i / seg); ring.push([c[0] + r1 * Math.cos(t), c[1] + r1 * Math.sin(t)]); corner.push(i === 0 || i === seg); if (i < seg) nbr.push('o'); }
  nbr.push('t1');
  const full = Math.abs(t1 - t0) >= 2 * Math.PI - 1e-6;
  if (r0 > 1e-9) { for (let i = seg; i >= 0; i--) { const t = lerp(t0, t1, i / seg); ring.push([c[0] + r0 * Math.cos(t), c[1] + r0 * Math.sin(t)]); corner.push(i === 0 || i === seg); if (i > 0) nbr.push('i'); } }
  else ring.push([c[0], c[1]]), corner.push(true);
  nbr.push('t0');
  const tm = (t0 + t1) / 2, rm = r0 > 1e-9 ? (r0 + r1) / 2 : r1 * .6;
  const N = G.N, A = N(0, 0, 0), wR = Math.hypot(...N(r1 - r0, 0, 0).map((v, i) => v - A[i])), wT = Math.hypot(...N(r1 * Math.abs(t1 - t0) / Math.max(1, seg), 0, 0).map((v, i) => v - A[i]));
  if (full && r0 <= 1e-9) { ring.pop(); corner.pop(); return { ring, corner: corner.map(() => false), closed: true, c: [...c], fan: true, wN: Math.min(wR, wT * seg) }; }
  return { ring, corner, nbr, closed: true, c: [c[0] + rm * Math.cos(tm), c[1] + rm * Math.sin(tm)], fan: false, wN: Math.min(wR, wT * seg) };
}
function u3rectBase(G, x0, x1, y0, y1) {
  const N = G.N, A = N(0, 0, 0), wx = Math.abs(N(x1 - x0, 0, 0)[0] - A[0]), wy = Math.abs(N(0, y1 - y0, 0)[1] - A[1]);
  return { ring: [[x0, y0], [x1, y0], [x1, y1], [x0, y1]], corner: [true, true, true, true], nbr: ['s', 'e', 'n', 'w'], closed: true, c: [(x0 + x1) / 2, (y0 + y1) / 2], fan: false, wN: Math.min(wx, wy) };
}
/* spherical cell [p0,p1]x[t0,t1]x[f0,f1] around c (world) */
function u3sphCell(G, p0, p1, t0, t1, f0, f1, nt, nf, c, o) {
  const N = G.N, off = o.off || [0, 0, 0], out = [];
  const W = (r, t, f) => N(c[0] + off[0] + r * Math.sin(f) * Math.cos(t), c[1] + off[1] + r * Math.sin(f) * Math.sin(t), c[2] + off[2] + r * Math.cos(f));
  const ctr = W((p0 + p1) / 2, (t0 + t1) / 2, (f0 + f1) / 2);
  const F = (v, edges) => out.push({ v, rgb: o.rgb, op: o.op, cull: o.cull !== false, ctr, edges: o.edges === false ? false : edges, ec: o.ec, ew: o.ew, glow: o.glow, k: o.k, eop: o.eop });
  const T = i => lerp(t0, t1, i / nt), Fi = j => lerp(f0, f1, j / nf);
  for (const r of p0 > 1e-9 ? [p0, p1] : [p1]) for (let i = 0; i < nt; i++) for (let j = 0; j < nf; j++)
    F([W(r, T(i), Fi(j)), W(r, T(i + 1), Fi(j)), W(r, T(i + 1), Fi(j + 1)), W(r, T(i), Fi(j + 1))], [j === 0, i === nt - 1, j === nf - 1, i === 0]);
  if (Math.abs(t1 - t0) < 2 * Math.PI - 1e-6) for (const t of [t0, t1]) for (let j = 0; j < nf; j++)
    F([W(p0, t, Fi(j)), W(p1, t, Fi(j)), W(p1, t, Fi(j + 1)), W(p0, t, Fi(j + 1))], [j === 0, true, j === nf - 1, p0 > 1e-9]);
  for (const fz of [f0, f1]) if (Math.sin(fz) > 1e-6) for (let i = 0; i < nt; i++)
    F([W(p0, T(i), fz), W(p1, T(i), fz), W(p1, T(i + 1), fz), W(p0, T(i + 1), fz)], [i === 0, true, i === nt - 1, p0 > 1e-9]);
  return out;
}

/* ---------- unified layers ---------- */
function LayerU(spec, gr) {
  const kind = spec.kind;
  const n = { type: 'layer-' + kind, spec, id: spec.id, writes: false, kids: [], parts: [], tail: .3, parent: gr };
  const c = col(spec.color || (kind === 'solid' ? 'mint' : kind === 'cols' ? 'surf' : 'amber'));
  n.layout = () => { }; n.setPos = () => { };
  n.update = () => { }; n.mount = () => { }; n.afterResolve = () => { };
  n.events = push => { if (kind === 'orbit') return; push({ type: kind === 'pulse' ? 'tick' : 'draw', t: n.t0, dur: kind === 'pulse' ? .1 : n.dur, seed: hstr(kind + n.t0), amp: .5 }); };

  if (kind === 'point' || (kind === 'curve' && !spec.depth)) return overlayLayer(n, spec, gr, c);
  if (kind === 'orbit') { n.dur = spec.dur ?? 2.5; return n; }
  if (kind === 'pulse') { n.dur = (spec.n ?? 2) * (spec.per ?? .7); return n; }

  /* ---- face layer: visibility (until / out fade), pulses, cached faces by state key ---- */
  const legacy = kind === 'box' || kind === 'plane' || kind === 'curve';
  const outDur = spec.outDur ?? (legacy ? 0 : .5);
  const grow = spec.grow ?? (kind === 'slices' ? .4 : .5);
  n.dur = spec.dur ?? (kind === 'cols' ? (spec.stagger ?? 1.2) + grow : kind === 'slices' ? (spec.mode === 'sweep' ? 3 : (spec.stagger ?? 1.6) + grow) : kind === 'wedge' ? (spec.anim === 'explode' || spec.explode ? .5 + .9 : .9) : kind === 'solid' ? 1.2 : kind === 'curve' ? .9 : kind === 'box' ? .6 : .9);
  if (kind === 'plane' && spec.fadeAfter != null) n.dur = Math.max(n.dur, spec.fadeAfter + .9);
  const vis = t => {
    if (t < n.t0) return 0; let a = 1;
    if (spec.until) { const k = gr.kids.find(k => k.id === spec.until); if (k && t >= k.t0) a *= outDur ? 1 - clamp((t - k.t0) / outDur) : 0; }
    if (spec.out != null) a *= outDur ? 1 - clamp((t - n.t0 - spec.out) / outDur) : (t - n.t0 >= spec.out ? 0 : 1);
    return a;
  };
  const pulses = () => {
    const L = [], add = (t0, p) => L.push({ t0, n: p.n ?? 2, per: p.per ?? .7 });
    const own = spec.pulse; if (own != null && own !== false) [].concat(own).forEach(p => add(n.t0 + (p === true ? n.dur + .15 : typeof p === 'number' ? p : p.at ?? n.dur + .15), typeof p === 'object' ? p : {}));
    if (spec.id) gr.kids.forEach(k => { if (k.spec && k.spec.kind === 'pulse' && k.spec.target === spec.id) add(k.t0, k.spec); });
    return L;
  };
  let PL = null;
  const glowAt = t => { PL = PL || pulses(); let q = 0; for (const p of PL) { const lt = t - p.t0; if (lt > 0 && lt < p.n * p.per) q = Math.max(q, Math.sin(Math.PI * (lt % p.per) / p.per) ** 2); } return q; };
  let cacheKey = null, cache = null;
  n.state = t => { const a = vis(t); if (a <= 0) return '-'; return a.toFixed(3) + ':' + clamp(t - n.t0, 0, n.dur).toFixed(4) + ':' + glowAt(t).toFixed(3); };
  n.faces = t => {
    const a = vis(t); if (a <= 0) return null;
    const key = n.state(t); if (key === cacheKey) return cache;
    cacheKey = key; cache = build(clamp(t - n.t0, 0, n.dur), a, glowAt(t));
    return cache;
  };
  const rgb0 = u3rgb(c), palZ = z => { const { Z0, Z1 } = gr.R(); return palette(clamp((z - Z0) / (Z1 - Z0 || 1) * 1.1)); };
  const alpha = spec.alpha ?? (kind === 'solid' ? .42 : kind === 'plane' ? .26 : 1);
  const ew = spec.ew, ec = spec.ec;
  let build, fitPts;

  if (kind === 'cols') {
    const { X0, X1, Y0, Y1 } = gr.R(), pol = !!spec.r, nn = [].concat(spec.n ?? (pol ? [4, 12] : [6, 6])), [na, nb] = nn.length > 1 ? nn : [nn[0], nn[0]];
    const hi = spec.hi || gr.fn || (() => 1), lo = spec.z0, shrink = spec.shrink ?? 0, cellsL = [];
    const zLo = (x, y) => typeof lo === 'function' ? lo(x, y) : lo ?? gr.floorZ;
    const smp = (fn, xs, ys, cxv, cyv) => spec.sample === 'max' ? Math.max(...xs.map((x, i) => fn(x, ys[i])), fn(cxv, cyv)) : spec.sample === 'min' ? Math.min(...xs.map((x, i) => fn(x, ys[i])), fn(cxv, cyv)) : fn(cxv, cyv);
    for (let i = 0; i < na; i++) for (let j = 0; j < nb; j++) {
      let base, px, py, xs, ys;
      if (pol) {
        const [r0, r1] = spec.r, [t0, t1] = spec.th ?? [0, 2 * Math.PI], ra = lerp(r0, r1, i / na), rb = lerp(r0, r1, (i + 1) / na), ta = lerp(t0, t1, j / nb), tb = lerp(t0, t1, (j + 1) / nb);
        const sr = (rb - ra) * shrink / 2, st = (tb - ta) * shrink / 2, uv = Array.isArray(spec.sample) ? spec.sample : [.5, .5];
        const seg = spec.seg ?? Math.max(1, Math.ceil(Math.abs(tb - ta) / (7 * Math.PI / 180)));
        base = u3polarBase(gr, ra + (ra > 1e-9 ? sr : 0), rb - sr, ta + st, tb - st, seg, spec.center || [0, 0]);
        const rr = lerp(ra, rb, uv[0]), tt = lerp(ta, tb, uv[1]); px = (spec.center || [0, 0])[0] + rr * Math.cos(tt); py = (spec.center || [0, 0])[1] + rr * Math.sin(tt);
        xs = [ra, rb, rb, ra].map((r, k) => r * Math.cos([ta, ta, tb, tb][k])); ys = [ra, rb, rb, ra].map((r, k) => r * Math.sin([ta, ta, tb, tb][k]));
        cellsL.push({ i, j, base, z0: smp(zLo, xs, ys, px, py), z1: smp(hi, xs, ys, px, py), oi: i / Math.max(1, na - 1), oj: j / Math.max(1, nb - 1), rr: (ra + rb) / 2 / Math.max(1e-9, Math.abs(r1)) });
      } else {
        const [a0, a1] = spec.x ?? [X0, X1], [b0, b1] = spec.y ?? [Y0, Y1], xa = lerp(a0, a1, i / na), xb = lerp(a0, a1, (i + 1) / na), ya = lerp(b0, b1, j / nb), yb = lerp(b0, b1, (j + 1) / nb);
        const sx = (xb - xa) * shrink / 2, sy = (yb - ya) * shrink / 2, uv = Array.isArray(spec.sample) ? spec.sample : [.5, .5];
        base = u3rectBase(gr, xa + sx, xb - sx, ya + sy, yb - sy); px = lerp(xa, xb, uv[0]); py = lerp(ya, yb, uv[1]);
        xs = [xa, xb, xb, xa]; ys = [ya, ya, yb, yb];
        const mx = (xa + xb) / 2 - (a0 + a1) / 2, my = (ya + yb) / 2 - (b0 + b1) / 2;
        cellsL.push({ i, j, base, z0: smp(zLo, xs, ys, px, py), z1: smp(hi, xs, ys, px, py), oi: i / Math.max(1, na - 1), oj: j / Math.max(1, nb - 1), rr: Math.hypot(mx / (a1 - a0), my / (b1 - b0)) / Math.SQRT1_2 });
      }
    }
    const order = spec.order ?? 'sweep', R = rng(hstr(spec.id || 'cols' + cellsL.length)), perm = cellsL.map((_, k) => k);
    if (order === 'random') { for (let k = perm.length - 1; k > 0; k--) { const r = Math.floor(R() * (k + 1)); [perm[k], perm[r]] = [perm[r], perm[k]]; } }
    cellsL.forEach((cl, k) => { cl.ord = order === 'radial' ? clamp(cl.rr * .85 + cl.oj * .15) : order === 'random' ? perm.indexOf(k) / Math.max(1, perm.length - 1) : order === 'none' ? 0 : (cl.oi * .8 + cl.oj * .2); });
    const stagger = spec.stagger ?? 1.2, ew_ = ew ?? (cellsL.length > 100 ? .8 : cellsL.length > 40 ? 1.1 : 1.6);
    /* neighbour across each side (for hidden-face removal between touching columns) */
    const fullT = pol && Math.abs((spec.th ?? [0, 2 * Math.PI])[1] - (spec.th ?? [0, 2 * Math.PI])[0]) >= 2 * Math.PI - 1e-6;
    const cellAt = (i, j) => { if (pol && fullT) j = (j + nb) % nb; return i < 0 || j < 0 || i >= na || j >= nb ? null : cellsL[i * nb + j]; };
    const NB = { s: [0, -1], e: [1, 0], n: [0, 1], w: [-1, 0], o: [1, 0], i: [-1, 0], t1: [0, 1], t0: [0, -1] };
    const opaque = alpha > .985 && !shrink;
    build = (lt, a, glow) => {
      const out = [];
      for (const cl of cellsL) { const k = order === 'none' && !stagger ? 1 : easeOut(clamp((lt - cl.ord * stagger) / grow)); cl.k = k; const zt = lerp(cl.z0, cl.z1, k); cl.lo = Math.min(cl.z0, zt); cl.hi = Math.max(cl.z0, zt); }
      for (const cl of cellsL) {
        if (cl.k <= 0 || cl.hi - cl.lo < 1e-6) continue;
        const rgb = c === 'surf' ? palZ(cl.z1) : rgb0;
        const clip = opaque ? tag => {
          const d = NB[tag], q = d && cellAt(cl.i + d[0], cl.j + d[1]); if (!q || q.k <= 0 || q.hi - q.lo < 1e-6) return null;
          const iv = []; if (cl.lo < q.lo - 1e-9) iv.push([cl.lo, Math.min(cl.hi, q.lo), true, false]); if (cl.hi > q.hi + 1e-9) iv.push([Math.max(cl.lo, q.hi), cl.hi, false, true]);
          return iv;
        } : null;
        out.push(...u3prism(gr, cl.base, cl.lo, cl.hi, { rgb, op: alpha * a, ec, ew: ew_, glow, edges: spec.edges, bottom: true, clip }));
      }
      return out;
    };
    fitPts = () => cellsL.flatMap(cl => cl.base.ring.flatMap(p => [gr.N(p[0], p[1], cl.z0), gr.N(p[0], p[1], cl.z1)]));
  }

  else if (kind === 'wedge') {
    const sph = !!spec.sph, anim = spec.anim ?? 'grow', exD = spec.explode === true || (anim === 'explode' && spec.explode == null) ? .35 : (spec.explode || 0);
    const appear = anim === 'none' ? 0 : exD ? Math.min(.5, n.dur) : n.dur, [t0, t1] = spec.th ?? [0, Math.PI / 4];
    const cen = spec.center || [0, 0, 0];
    let dir;
    if (sph) { const [p0, p1] = spec.rho ?? spec.r ?? [1, 1.5], [f0, f1] = spec.phi ?? [Math.PI / 4, Math.PI / 2], tm = (t0 + t1) / 2, fm = (f0 + f1) / 2; dir = [Math.sin(fm) * Math.cos(tm), Math.sin(fm) * Math.sin(tm), Math.cos(fm)]; }
    else { const tm = (t0 + t1) / 2; dir = [Math.cos(tm), Math.sin(tm), 0]; }
    const geo = (k, ex, glow, a) => {
      const off = dir.map(v => v * ex), o = { rgb: rgb0, op: alpha * a, ec, ew: ew ?? 1.8, glow, edges: spec.edges, off };
      if (sph) {
        const [p0, p1] = spec.rho ?? spec.r ?? [1, 1.5], [f0, f1] = spec.phi ?? [Math.PI / 4, Math.PI / 2];
        const nt = spec.seg ?? Math.max(2, Math.ceil(Math.abs(t1 - t0) / (6 * Math.PI / 180))), nf = spec.segPhi ?? Math.max(2, Math.ceil(Math.abs(f1 - f0) / (6 * Math.PI / 180)));
        return u3sphCell(gr, p0, p0 + (p1 - p0) * k, t0, t1, f0, f1, nt, nf, cen, o);
      }
      const [r0, r1] = spec.r ?? [1, 1.5], [z0, z1] = spec.z ?? [0, 1], seg = spec.seg ?? Math.max(2, Math.ceil(Math.abs(t1 - t0) / (6 * Math.PI / 180)));
      return u3prism(gr, u3polarBase(gr, r0, r1, t0, t1, seg, [cen[0], cen[1]]), z0, z0 + (z1 - z0) * k, Object.assign(o, { off: [off[0], off[1], off[2] + (cen[2] || 0)] }));
    };
    build = (lt, a, glow) => {
      const u = appear ? clamp(lt / appear) : 1, k = anim === 'grow' ? easeOut(u) : 1, fa = anim === 'fade' || anim === 'explode' ? ease(u) : 1;
      const ex = exD * ease(clamp((lt - appear) / Math.max(.01, n.dur - appear)));
      if (k <= 1e-4) return [];
      return geo(k, ex, glow, a * fa);
    };
    fitPts = () => [...geo(1, 0, 0, 1), ...geo(1, exD, 0, 1)].flatMap(fc => fc.v);
  }

  else if (kind === 'solid') {
    const [u0, u1] = spec.u ?? [0, 1], [v0, v1] = spec.v ?? [0, 1], nn = [].concat(spec.n ?? [24, 24]), [nu, nv] = nn.length > 1 ? nn : [nn[0], nn[0]];
    const Pm = spec.param, G = [];
    for (let i = 0; i <= nu; i++) { G[i] = []; for (let j = 0; j <= nv; j++) G[i][j] = gr.N(...Pm(lerp(u0, u1, i / nu), lerp(v0, v1, j / nv))); }
    const quads = []; for (let i = 0; i < nu; i++) for (let j = 0; j < nv; j++) quads.push({ i, v: [G[i][j], G[i + 1][j], G[i + 1][j + 1], G[i][j + 1]] });
    const shell = spec.shell ?? !spec.cull, sctr = spec.ctr ? gr.N(...spec.ctr) : (() => { const a = [0, 0, 0]; let k = 0; G.forEach(r => r.forEach(p => { a[0] += p[0]; a[1] += p[1]; a[2] += p[2]; k++; })); return a.map(v => v / k); })();
    const reveal = spec.reveal ?? 'sweep', meshE = spec.mesh ? true : false, Wb = 2.5;
    const mc = spec.mc ?? 'rgba(241,234,216,.30)';
    build = (lt, a, glow) => {
      const p = ease(clamp(lt / n.dur)), out = [];
      for (const q of quads) {
        const al = reveal === 'sweep' ? clamp((p * (nu + Wb) - q.i) / Wb) : reveal === 'fade' ? p : 1; if (al <= 0) continue;
        out.push({ v: q.v, rgb: rgb0, op: alpha * a * al, cull: !!spec.cull, shell, ctr: sctr, shade: spec.shade !== false, edges: meshE, ec: mc, ew: ew ?? .9, eop: 1, glow, bias: spec.bias, k: spec.k });
      }
      return out;
    };
    fitPts = () => quads.flatMap(q => q.v);
  }

  else if (kind === 'slices') {
    const ax = spec.axis ?? 'z', { X0, X1, Y0, Y1, Z0, Z1 } = gr.R(), [a, b] = spec.range ?? (ax === 'z' ? [Z0, Z1] : ax === 'x' ? [X0, X1] : [Y0, Y1]), Nn = spec.n ?? 8;
    const seg = spec.seg ?? 40, cen = spec.center || [0, 0], h = (b - a) / Nn, smp = spec.sample ?? 'mid';
    const toW = (p, q, l) => ax === 'z' ? [p, q, l] : ax === 'x' ? [l, p, q] : [p, l, q];
    const fakeG = { N: (x, y, z) => gr.N(...toW(x, y, z)) };                      // build prisms in (p,q,level) space
    const section = l => {
      if (spec.poly) { const pts = spec.poly(l); if (!pts || pts.length < 3) return null; const cxy = pts.reduce((s, p) => [s[0] + p[0] / pts.length, s[1] + p[1] / pts.length], [0, 0]); return { ring: pts, corner: pts.map(() => true), closed: true, c: cxy, fan: false, wN: 1 }; }
      const r = spec.disk ? spec.disk(l) : 1; if (!(r > 1e-6)) return null;
      const ring = []; for (let i = 0; i < seg; i++) { const t = 2 * Math.PI * i / seg; ring.push([cen[0] + r * Math.cos(t), cen[1] + r * Math.sin(t)]); }
      return { ring, corner: ring.map(() => false), closed: true, c: [...cen], fan: true, wN: 1 };
    };
    const lvl = (lo, hi) => smp === 'lo' ? lo : smp === 'hi' ? hi : (lo + hi) / 2;
    const slab = (lo, hi, top, kk, av, glow) => {
      const s = section(lvl(lo, hi)); if (!s) return [];
      const rgb = c === 'surf' ? palZ(lerp(Z0, Z1, (lo - a) / (b - a || 1))) : rgb0;
      return u3prism(fakeG, s, lo, top, { rgb, op: alpha * av, ec, ew: ew ?? 1.3, glow, k: kk, pieces: 1, edges: spec.edges });
    };
    const stagger = spec.stagger ?? 1.6;
    build = (lt, av, glow) => {
      const out = [];
      if (spec.mode === 'sweep') { const s = ease(clamp(lt / n.dur)), lo = a + (b - a - h) * s; out.push(...slab(lo, lo + h, lo + h, 1, av, glow)); return out; }
      for (let k = 0; k < Nn; k++) {
        const lo = a + h * k, hi = lo + h, g = easeOut(clamp((lt - k / Nn * stagger) / grow)); if (g <= 0) continue;
        out.push(...slab(lo, hi, lo + h * g, k % 2 ? .9 : 1, av, glow).map(fc => (fc.op *= Math.min(1, g * 2.5), fc)));
      }
      return out;
    };
    fitPts = () => { const pts = []; for (let k = 0; k < Nn; k++) { const lo = a + h * k, s = section(lvl(lo, lo + h)); if (s) s.ring.forEach(p => pts.push(fakeG.N(p[0], p[1], lo), fakeG.N(p[0], p[1], lo + h))); } return pts; };
  }

  else if (kind === 'box') {
    const { X0, X1, Y0, Y1, Z0 } = gr.R();
    let bx = spec.boxes || [];
    if (spec.grid) { const [gx, gy] = spec.grid, z0 = spec.z0 ?? Z0; bx = []; for (let i = 0; i < gx; i++) for (let j = 0; j < gy; j++) { const x0 = X0 + (X1 - X0) * i / gx, x1 = X0 + (X1 - X0) * (i + 1) / gx, y0 = Y0 + (Y1 - Y0) * j / gy, y1 = Y0 + (Y1 - Y0) * (j + 1) / gy; bx.push([x0, x1, y0, y1, z0, gr.zAt((x0 + x1) / 2, (y0 + y1) / 2)]); } }
    build = (lt, a, glow) => { const u = ease(clamp(lt / n.dur)); return bx.flatMap(b => u3prism(gr, u3rectBase(gr, b[0], b[1], b[2], b[3]), b[4], b[5], { rgb: spec.color === 'surf' ? palZ(b[5]) : rgb0, op: alpha * a * u, ew: ew ?? (bx.length > 80 ? .8 : 2), ec, glow })); };
    fitPts = () => bx.flatMap(b => [[b[0], b[2]], [b[1], b[2]], [b[1], b[3]], [b[0], b[3]]].flatMap(p => [gr.N(p[0], p[1], b[4]), gr.N(p[0], p[1], b[5])]));
  }

  else if (kind === 'plane') {
    const C = gr.planeCorners(spec).map(p => gr.N(...p)), m = spec.split ?? 8;
    const bil = (u, v) => u3l(u3l(C[0], C[1], u), u3l(C[3], C[2], u), v);
    build = (lt, a) => {
      let o = ease(clamp(lt / .9)); if (spec.fadeAfter != null) o *= 1 - (1 - (spec.fadeTo ?? 0)) * easeSine(clamp((lt - spec.fadeAfter) / .8));
      const out = [];
      for (let i = 0; i < m; i++) for (let j = 0; j < m; j++) out.push({ v: [bil(i / m, j / m), bil((i + 1) / m, j / m), bil((i + 1) / m, (j + 1) / m), bil(i / m, (j + 1) / m)], fillS: c, op: alpha * o * a });
      for (let k = 0; k < 4; k++) u3line(out, C[k], C[(k + 1) % 4], m, { color: c, w: spec.w ?? 3, op: o * a });
      return out;
    };
    fitPts = () => C;
  }

  else if (kind === 'curve') {          /* depth:true curve -> depth-sorted polyline, drawn progressively */
    const M = spec.samples ?? 90, pts = [];
    for (let i = 0; i <= M; i++) { const s = i / M; let x, y, z; if (spec.pts) [x, y, z] = spec.pts(s); else if (spec.along === 'x') { const { X0, X1 } = gr.R(); x = lerp(X0, X1, s); y = spec.fix; } else { const { Y0, Y1 } = gr.R(); y = lerp(Y0, Y1, s); x = spec.fix; } if (z === undefined) z = gr.zAt(x, y); pts.push(gr.N(x, y, z)); }
    build = (lt, a) => {
      const u = ease(clamp(lt / n.dur)), out = [], L = u * M;
      for (let i = 0; i < M && i < L; i++) out.push({ line: true, v: [pts[i], i + 1 <= L ? pts[i + 1] : u3l(pts[i], pts[i + 1], L - i)], color: c, w: spec.w ?? 5, op: a, dash: spec.dash, bias: spec.bias });
      return out;
    };
    fitPts = () => [];
  }
  else throw new Error('unknown 3D layer kind: ' + kind);

  n.fitPts = fitPts;
  return n;
}

/* point / curve drawn on top of the faces (as in classic graphs), re-projected whenever the camera moves */
function overlayLayer(n, spec, gr, c) {
  const kind = spec.kind;
  n.dur = spec.dur ?? (kind === 'curve' ? .9 : .5);
  if (kind === 'point' && spec.label) { n.lab = Rich({ text: spec.label, size: spec.size ?? 40, color: spec.lcolor ?? spec.color ?? 'amber', msize: spec.msize ?? 46 }); n.parts.push(n.lab); n.dur = .5 + n.lab.dur * .5; }
  n.afterResolve = function () { if (n.lab) { n.lab.t0 = n.t0 + .25; n.lab.t1 = n.lab.t0 + n.lab.dur; } n.t1 = Math.max(n.t1, n.lab ? n.lab.t1 : 0); };
  let W3 = null; n.prog = 0;
  const gone = t => (spec.until && gr.kids.some(k => k.id === spec.until && t >= k.t0)) || (spec.out != null && t - n.t0 >= spec.out);
  /* called by the graph every frame (Board skips updates of finished items, so until/out are applied here) */
  n.applyVis = t => { const hide = t < n.t0 || gone(t); if (n.g) n.g.style.display = hide ? 'none' : ''; if (n.lab && n.lab.g && (spec.until || spec.out != null)) n.lab.g.style.display = hide || t < n.lab.t0 ? 'none' : ''; };
  n.mount = function (pg) {
    const g = n.g = S('g', { style: 'display:none' }, gr.sub[kind === 'curve' ? 'curves' : 'points']);
    if (kind === 'point') {
      n.pt = S('circle', { r: spec.r ?? 9, fill: c, stroke: COL.board, 'stroke-width': 3 }, g);
      if (n.lab) { n.lab.layout(520); n.lab.setPos(0, 0); n.lab.mount(pg); if (spec.arrow !== false) { n.arrow = S('path', { stroke: c, 'stroke-width': 3, fill: 'none', 'stroke-linecap': 'round', 'stroke-dasharray': 200 }, g); } }
    } else {
      W3 = []; const M = spec.samples ?? 90; const { X0, X1, Y0, Y1 } = gr.R();
      for (let i = 0; i <= M; i++) { const s = i / M; let x, y, z; if (spec.pts) [x, y, z] = spec.pts(s); else if (spec.along === 'x') { x = gr.spec.x ? lerp(gr.spec.x[0], gr.spec.x[1], s) : lerp(X0, X1, s); y = spec.fix; } else { y = lerp(Y0, Y1, s); x = spec.fix; } W3.push([x, y, z]); }
      n.path = S('path', { fill: spec.fill ? c : 'none', 'fill-opacity': 0, stroke: spec.w === 0 ? 'none' : c, 'stroke-width': spec.w ?? 5, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, g);
    }
    n.reproj();
  };
  n.reproj = function () {
    if (kind === 'point') {
      const p = gr.proj(spec.p[0], spec.p[1], spec.p[2]); n.pt.setAttribute('cx', p[0].toFixed(1)); n.pt.setAttribute('cy', p[1].toFixed(1));
      if (n.lab) {
        const dx = spec.dx ?? 26, dy = spec.dy ?? -50, l = n.lab.lines[0], lx = dx >= 0 ? p[0] + dx : p[0] + dx - l.w, ly = p[1] + dy - n.lab.h / 2;
        n.lab.ax = lx - l.x0; n.lab.ay = ly; if (n.lab.g) n.lab.g.setAttribute('transform', `translate(${n.lab.ax},${n.lab.ay})`);
        if (n.arrow) n.arrow.setAttribute('d', `M${(lx + (dx >= 0 ? -6 : l.w + 6)).toFixed(1)} ${(p[1] + dy + 4).toFixed(1)}L${(p[0] + (dx >= 0 ? 7 : -7)).toFixed(1)} ${(p[1] - (dy < 0 ? 8 : -8)).toFixed(1)}`);
      }
    } else {
      const pts = W3.map(p => gr.proj(p[0], p[1], p[2])); let len = 0; for (let i = 1; i < pts.length; i++) len += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
      n.len = len; n.path.setAttribute('d', 'M' + pts.map(p => p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join('L'));
      n.path.setAttribute('stroke-dasharray', spec.dash || (len + 2)); if (!spec.dash) n.path.setAttribute('stroke-dashoffset', (len * (1 - n.prog)).toFixed(1));
    }
  };
  n.update = function (t, st) {
    const lt = t - n.t0;
    if (st === 0 || gone(t)) { n.g.style.display = 'none'; return; } n.g.style.display = '';
    const u = st === 2 ? 1 : clamp(lt / Math.min(n.dur, kind === 'point' ? .35 : n.dur));
    if (kind === 'point') { const k = easeOut(u), ov = 1 + .35 * Math.sin(Math.PI * u); n.pt.setAttribute('r', ((spec.r ?? 9) * k * ov).toFixed(2)); if (n.arrow) n.arrow.setAttribute('stroke-dashoffset', (200 * (1 - clamp((lt - .2) / .3))).toFixed(1)); }
    else { n.prog = ease(u); if (spec.dash) n.path.setAttribute('opacity', n.prog.toFixed(2)); else n.path.setAttribute('stroke-dashoffset', (n.len * (1 - n.prog)).toFixed(1)); if (spec.fill) n.path.setAttribute('fill-opacity', ((spec.fillAlpha ?? .15) * n.prog).toFixed(3)); }
  };
  return n;
}

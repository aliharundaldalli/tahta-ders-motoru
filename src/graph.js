'use strict';
/* graph.js : deterministic SVG 3D surface renderer (painter's sort) + minimal 2D graph; layers: point / curve / plane */

/* ---------- surface presets ---------- */
const gauss = (x, y, A, cx, cy, s) => A * Math.exp(-((x - cx) ** 2 + (y - cy) ** 2) / (2 * s * s));
const SURF = {
  /* 3 peaks (highest first), 2 pits */
  bumps: { fn: (x, y) => gauss(x, y, 1.5, .9, .6, .62) + gauss(x, y, 1.0, -1.1, -.5, .55) + gauss(x, y, .8, -.1, -1.45, .45) + gauss(x, y, -.9, -.1, .95, .5) + gauss(x, y, -.8, 1.35, -1.0, .5), x: [-2.2, 2.2], y: [-2.2, 2.2], n: 70,
    info: { peaks: [[.9, .6], [-1.1, -.5], [-.1, -1.45]], pits: [[-.1, .95], [1.35, -1.0]] } },
  saddle: { fn: (x, y) => y * y - x * x, x: [-1.2, 1.2], y: [-1.2, 1.2], z: [-1.44, 1.44], n: 64 },
  cone: { fn: (x, y) => 1 - Math.hypot(x, y), polar: 1.4, z: [-.4, 1] },
  dome: { fn: (x, y) => 1 - (x * x + y * y), polar: 1.4, z: [-.96, 1] },
  bowl: { fn: (x, y) => (x + 1) ** 2 + (y - 3) ** 2 + 4, x: [-3, 1], y: [1, 5], z: [4, 12], n: 64 }
};
const PAL = ['#244e73', '#2c7a9b', '#3fa6a6', '#7fd3c4', '#c4efe0'];
function palette(u) { u = clamp(u) * (PAL.length - 1); const i = Math.min(PAL.length - 2, Math.floor(u)), a = hexRgb(PAL[i]), b = hexRgb(PAL[i + 1]), f = u - i; return a.map((v, k) => v + (b[k] - v) * f); }

/* ---------- Graph node (graph3d / graph2d) ---------- */
function Graph(spec, is3d) {
  const n = { type: is3d ? 'graph3d' : 'graph2d', spec, id: spec.id, writes: true, kids: [], parts: [], tail: .3 };
  const P = Object.assign({}, SURF[spec.surface] || {}, spec);
  n.dur = spec.build ?? (is3d ? 1.6 : .7); n.headDur = n.dur;
  const f = P.fn, polar = P.polar;
  if (is3d && polar) { P.x = [-polar, polar]; P.y = [-polar, polar]; }
  const gp = spec.layers || [];
  n.kids = gp.map(l => Layer(l, n));
  (spec.labels || []).forEach(l => n.kids.push(Rich(l)));
  n.resolveKids = ctx => { ctx.last = n.t0 + n.headDur - GAP + .1; };
  n.layout = function (maxW) { n.w = spec.w ?? maxW; n.h = spec.h ?? (is3d ? 520 : 420); };
  n.setPos = (ax, ay) => { n.ax = ax; n.ay = ay; n.kids.forEach(k => { if (k.type === 'rich') { const p = k.spec.pos || [0, 0]; k.layout(n.w - p[0]); k.setPos(ax + p[0], ay + p[1]); } }); };

  /* ---- projection ---- */
  const rad = d => d * Math.PI / 180, zs = P.zs ?? .72, el = rad(P.el ?? 24), az0 = rad(P.az ?? -34), rot = rad(P.rotate ?? 0);
  const AX = { Lx: 1.2, Ly: .85, Lz: 2 * zs * 1.08 };
  let X0, X1, Y0, Y1, Z0, Z1;
  function ranges() {
    [X0, X1] = P.x || [-1, 1]; [Y0, Y1] = P.y || [-1, 1];
    if (is3d) { if (P.z) [Z0, Z1] = P.z; else { Z0 = 1e9; Z1 = -1e9; for (let i = 0; i <= 30; i++) for (let j = 0; j <= 30; j++) { const xx = X0 + (X1 - X0) * i / 30, yy = Y0 + (Y1 - Y0) * j / 30; for (const z of P.fn2 ? [f(xx, yy), P.fn2(xx, yy)] : [f(xx, yy)]) { Z0 = Math.min(Z0, z); Z1 = Math.max(Z1, z); } } } }
  }
  ranges();
  const nrm = (x, y, z) => [(x - (X0 + X1) / 2) / ((X1 - X0) / 2), (y - (Y0 + Y1) / 2) / ((Y1 - Y0) / 2), (z - (Z0 + Z1) / 2) / ((Z1 - Z0) / 2 || 1) * zs];
  const view = az => { const c = Math.cos(az), s = Math.sin(az), ce = Math.cos(el), se = Math.sin(el); return (a, b, z) => { const X = a * c - b * s, D = a * s + b * c; return [X, -(z * ce + D * se), D]; }; };
  /* axes endpoints (normalized) */
    let fit = null, lastW = 0, lastH = 0;
  function fitView() {
    if (fit && lastW === n.w && lastH === n.h) return fit;
    lastW = n.w; lastH = n.h;
    if (!is3d) { const m = 34; return fit = { s: 1, ox: 0, oy: 0, sx: (n.w - 2 * m) / (X1 - X0), sy: (n.h - 2 * m) / (Y1 - Y0), m }; }
    const pts = n.fitPts || []; const R = 1.12;
    if (!n.fitPts) for (const a of [-R, R]) for (const b of [-R, R]) for (const z of [-zs * 1.02, zs * 1.12]) pts.push([a, b, z]);
    let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9; const steps = rot ? 12 : 1;
    for (let k = 0; k < steps; k++) { const v = view(az0 + (rot ? k / steps * Math.PI / 2 : 0)); for (const p of pts) { const q = v(...p); x0 = Math.min(x0, q[0]); x1 = Math.max(x1, q[0]); y0 = Math.min(y0, q[1]); y1 = Math.max(y1, q[1]); } }
    const [pt, pr, pb, pl] = spec.pad || [66, 24, 26, 24];     // headroom for labels / plane edges (px)
    const s = Math.min((n.w - pl - pr) / (x1 - x0), (n.h - pt - pb) / (y1 - y0));
    return fit = { s, ox: pl + (n.w - pl - pr) / 2 - s * (x0 + x1) / 2, oy: pt + (n.h - pt - pb) / 2 - s * (y0 + y1) / 2 };
  }
  /* world -> absolute screen */
  n.proj = function (x, y, z, az = az0) {
    const F = fitView();
    if (!is3d) return [n.ax + F.m + (x - X0) * F.sx, n.ay + n.h - F.m - (y - Y0) * F.sy];
    if (z === undefined || z === null) z = f(x, y);
    const q = view(az)(...nrm(x, y, z)); return [n.ax + F.ox + F.s * q[0], n.ay + F.oy + F.s * q[1], q[2]];
  };
  n.zAt = (x, y) => f(x, y);
  const planeCorners = n.planeCorners = spec => { const e = spec.ext ?? [X0, X1, Y0, Y1]; return spec.x !== undefined ? [[spec.x, Y0, Z0], [spec.x, Y1, Z0], [spec.x, Y1, Z1], [spec.x, Y0, Z1]] : spec.y !== undefined ? [[X0, spec.y, Z0], [X1, spec.y, Z0], [X1, spec.y, Z1], [X0, spec.y, Z1]] : [[e[0], e[2], spec.z], [e[1], e[2], spec.z], [e[1], e[3], spec.z], [e[0], e[3], spec.z]]; };
  n.R = () => ({ X0, X1, Y0, Y1, Z0, Z1 });

  /* ---- mount ---- */
  n.mount = function (pg) {
    const g = n.g = S('g', { style: 'display:none' }, pg.content);
    n.sub = { axes: S('g', {}, g), surf: S('g', {}, g), planes: S('g', {}, g), curves: S('g', {}, g), points: S('g', {}, g) };
    if (is3d) mountSurface(); else if (spec.axes !== false) mountAxes2d();
  };

  function mountAxes2d() {
    const ax = n.sub.axes, a = n.proj(Math.min(Math.max(0, X0), X1), Math.min(Math.max(0, Y0), Y1)), L = n.proj(X0, Y0), R = n.proj(X1, Y1);
    S('path', { d: `M${L[0]} ${a[1]}H${R[0] + 10}M${a[0]} ${L[1]}V${R[1] - 10}`, stroke: COL.grey, 'stroke-width': 2.4, fill: 'none', 'stroke-linecap': 'round' }, ax);
    S('path', { d: `M${R[0] + 10} ${a[1]}l-12 -6m12 6l-12 6M${a[0]} ${R[1] - 10}l-6 12m6 -12l6 12`, stroke: COL.grey, 'stroke-width': 2.4, fill: 'none', 'stroke-linecap': 'round' }, ax);
    labelM(ax, 'x', R[0] + 6, a[1] + 40); labelM(ax, 'y', a[0] + 16, R[1] - 4);
  }
  function labelM(parent, tex, x, y, ms = 46) { const mg = mathGroup(parent, tex, ms, COL.grey); mg.g.setAttribute('transform', `translate(${x.toFixed(1)},${y.toFixed(1)}) scale(${ms / 1000})`); setGlyphStatic(mg.gl); }

  function mountSurface() {
    const ni = polar ? (P.nr ?? 56) : (P.n ?? 64), nj = polar ? (P.nt ?? 96) : (P.n ?? 64);
    const light = (() => { const l = [-.35, -.55, .75], m = Math.hypot(...l); return l.map(v => v / m); })();
    const WARM = ['#7a3d1c', '#b8661f', '#e0953a', '#f2b440', '#fbe1a0'];
    const palW = u => { u = clamp(u) * (WARM.length - 1); const i = Math.min(WARM.length - 2, Math.floor(u)), a = hexRgb(WARM[i]), b = hexRgb(WARM[i + 1]), f = u - i; return a.map((v, k) => v + (b[k] - v) * f); };
    const cells = []; let allV = [];
    function buildSurf(fn, pal, op) {
      const V = [], Wd = [];
      for (let i = 0; i <= ni; i++) { V[i] = []; Wd[i] = []; for (let j = 0; j <= nj; j++) {
        let x, y;
        if (polar) { const r = polar * i / ni, th = 2 * Math.PI * j / nj; x = r * Math.cos(th); y = r * Math.sin(th); }
        else { x = X0 + (X1 - X0) * i / ni; y = Y0 + (Y1 - Y0) * j / nj; }
        const z = clamp(fn(x, y), Z0, Z1); V[i][j] = nrm(x, y, z); Wd[i][j] = [x, y];
      } }
      allV = allV.concat(...V);
      for (let i = 0; i < ni; i++) for (let j = 0; j < nj; j++) {
        const a = V[i][j], b = V[i + 1][j], c = V[i + 1][j + 1], d = V[i][j + 1];
        const wx = (Wd[i][j][0] + Wd[i + 1][j][0] + Wd[i + 1][j + 1][0] + Wd[i][j + 1][0]) / 4, wy = (Wd[i][j][1] + Wd[i + 1][j][1] + Wd[i + 1][j + 1][1] + Wd[i][j + 1][1]) / 4;
        const hx = (X1 - X0) * .004, hy = (Y1 - Y0) * .004, kz = zs / ((Z1 - Z0) / 2 || 1);
        const gx = (fn(wx + hx, wy) - fn(wx - hx, wy)) / (2 * hx) * kz * (X1 - X0) / 2, gy = (fn(wx, wy + hy) - fn(wx, wy - hy)) / (2 * hy) * kz * (Y1 - Y0) / 2;
        const m = Math.hypot(gx, gy, 1), nx = -gx / m, ny = -gy / m, nz = 1 / m;
        const lam = clamp(nx * light[0] + ny * light[1] + nz * light[2], 0, 1);
        const zc = (a[2] + b[2] + c[2] + d[2]) / 4, h = clamp((zc / zs + 1) / 2);
        const base = (pal || palette)(h), sh = .55 + .56 * lam;
        cells.push({ i, j, c: [a, b, c, d], fill: `rgb(${base.map(v => Math.round(clamp(v * sh, 0, 255))).join(',')})`, key: i / ni, op });
      }
    }
    buildSurf(f, null, 1);
    if (P.fn2) {
      buildSurf(P.fn2, palW, P.op2 ?? .8);
      /* vertical walls between the two surfaces along the four edges of the rectangle (translucent solid) */
      const M = 28, e = [[X0, Y0, X1, Y0], [X1, Y0, X1, Y1], [X1, Y1, X0, Y1], [X0, Y1, X0, Y0]];
      e.forEach((E, k) => { for (let m = 0; m < M; m++) {
        const u0 = m / M, u1 = (m + 1) / M, xa = lerp(E[0], E[2], u0), ya = lerp(E[1], E[3], u0), xb = lerp(E[0], E[2], u1), yb = lerp(E[1], E[3], u1);
        const q = (x, y, fn) => nrm(x, y, clamp(fn(x, y), Z0, Z1)); const sh = k % 2 ? .62 : .8;
        cells.push({ i: 0, j: 0, c: [q(xa, ya, f), q(xb, yb, f), q(xb, yb, P.fn2), q(xa, ya, P.fn2)], fill: `rgb(${[111, 211, 176].map(v => Math.round(v * sh)).join(',')})`, key: .5, op: P.opWall ?? .6 });
      } });
    }
    const planePts = gp.filter(l => l.kind === 'plane').flatMap(l => planeCorners(l).map(c => nrm(...c))).concat((spec.fitPts || []).map(c => nrm(...c)));
    n.fitPts = [].concat(allV, planePts).concat([[-1, -1, -zs], [-1 + AX.Lx, -1, -zs], [-1, -1 + AX.Ly, -zs], [-1, -1, -zs + AX.Lz]]); fit = null;
    const mesh = spec.mesh ?? false;
    n.cells = cells; n.cellEls = cells.map(() => S('path', { fill: 'none', 'stroke-linejoin': 'round' }, n.sub.surf));
    n.az = null;
    n.paint = function (az, u) {
      const v = view(az);
      const items = cells.map(c => { const q = c.c.map(p => v(...p)); return { c, q, dep: (q[0][2] + q[1][2] + q[2][2] + q[3][2]) / 4 }; });
      items.sort((p, q) => q.dep - p.dep);
      const Fv = fitView();
      items.forEach((it, k) => {
        const e = n.cellEls[k], q = it.q;
        const d = `M${q.map(p => (Fv.ox + Fv.s * p[0] + n.ax).toFixed(1) + ' ' + (Fv.oy + Fv.s * p[1] + n.ay).toFixed(1)).join('L')}Z`;
        const al = clamp((u * 1.12 - it.c.key) / .12);
        e.setAttribute('d', d); e.setAttribute('fill', it.c.fill);
        e.setAttribute('stroke', mesh ? 'rgba(10,22,28,.38)' : it.c.fill); e.setAttribute('stroke-width', mesh ? .8 : .7);
        e.setAttribute('opacity', (al * (it.c.op ?? 1) * (P.surfAlpha ?? 1)).toFixed(2)); e.style.display = al <= 0 ? 'none' : '';
      });
    };
    /* axes: classic corner triad at the lowest floor corner (-1,-1,zmin); drawn behind the surface */
    if (spec.axes !== false) {
      const ax = n.sub.axes, v = view(az0), Fv = fitView(), zf = -zs, { Lx, Ly, Lz } = AX;
      const T = p => { const q = v(...p); return [Fv.ox + Fv.s * q[0] + n.ax, Fv.oy + Fv.s * q[1] + n.ay]; };
      const fl = [[-1, -1, zf], [1, -1, zf], [1, 1, zf], [-1, 1, zf]].map(T);
      S('path', { d: 'M' + fl.map(p => p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join('L') + 'Z', fill: 'none', stroke: COL.grey, 'stroke-width': 1.4, 'stroke-dasharray': '6 7', opacity: .35 }, ax);
      const ends = { x: [-1 + Lx, -1, zf], y: [-1, -1 + Ly, zf], z: [-1, -1, zf + Lz] };
      for (const k of ['x', 'y', 'z']) {
        const a = T([-1, -1, zf]), b = T(ends[k]), dx = b[0] - a[0], dy = b[1] - a[1], Ln = Math.hypot(dx, dy), ux = dx / Ln, uy = dy / Ln;
        S('path', { d: `M${a[0].toFixed(1)} ${a[1].toFixed(1)}L${b[0].toFixed(1)} ${b[1].toFixed(1)}M${b[0].toFixed(1)} ${b[1].toFixed(1)}l${(-ux * 14 - uy * 6).toFixed(1)} ${(-uy * 14 + ux * 6).toFixed(1)}M${b[0].toFixed(1)} ${b[1].toFixed(1)}l${(-ux * 14 + uy * 6).toFixed(1)} ${(-uy * 14 - ux * 6).toFixed(1)}`, stroke: COL.grey, 'stroke-width': 2.6, fill: 'none', 'stroke-linecap': 'round', opacity: .95 }, ax);
        labelM(ax, k, b[0] + ux * 10 - 12, b[1] + uy * 10 + (k === 'z' ? 2 : 18));
      }
    }
    n.paint(az0, 0);
  }
  n.update = function (t, st) {
    const lt = t - n.t0;
    if (st === 0) { n.g.style.display = 'none'; return; }
    n.g.style.display = '';
    const u = st === 2 ? 1 : ease(clamp(lt / n.headDur));
    if (is3d) { const az = az0 + rot * Math.max(0, lt); if (rot || n.lastU !== u || n.az === null) { n.paint(az, u); n.lastU = u; n.az = az; } }
    n.sub.axes.setAttribute('opacity', clamp(lt / .5).toFixed(2));
  };
  n.events = push => push({ type: 'draw', t: n.t0, dur: n.headDur, seed: hstr(n.id || n.type), amp: 1 });
  return n;
}

/* ---------- layers: point | curve | plane ---------- */
function Layer(spec, gr) {
  const n = { type: 'layer-' + spec.kind, spec, id: spec.id, writes: false, kids: [], parts: [], tail: .3, parent: gr };
  const c = col(spec.color || 'amber'), kind = spec.kind;
  n.dur = spec.dur ?? (kind === 'curve' ? .9 : kind === 'plane' ? .9 : kind === 'box' ? .6 : .5);
  if (kind === 'plane' && spec.fadeAfter != null) n.dur = Math.max(n.dur, spec.fadeAfter + .9);   // keep updating while the plane fades out
  if (kind === 'point' && spec.label) { n.lab = Rich({ text: spec.label, size: spec.size ?? 40, color: spec.lcolor ?? spec.color ?? 'amber', msize: spec.msize ?? 46 }); n.parts.push(n.lab); n.dur = .5 + n.lab.dur * .5; }
  n.layout = () => { }; n.setPos = () => { };
  n.afterResolve = function () { if (n.lab) { n.lab.t0 = n.t0 + .25; n.lab.t1 = n.lab.t0 + n.lab.dur; } n.t1 = Math.max(n.t1, n.lab ? n.lab.t1 : 0); };
  n.mount = function (pg) {
    const G = gr, { X0, X1, Y0, Y1, Z0, Z1 } = G.R(), grp = G.sub[kind === 'plane' || kind === 'box' ? 'planes' : kind === 'curve' ? 'curves' : 'points'], g = n.g = S('g', { style: 'display:none' }, grp);
    if (kind === 'point') {
      const p = G.proj(spec.p[0], spec.p[1], spec.p[2]), r = spec.r ?? 9;
      n.pt = S('circle', { cx: p[0].toFixed(1), cy: p[1].toFixed(1), r, fill: c, stroke: COL.board, 'stroke-width': 3 }, g);
      n.p = p;
      if (n.lab) {
        const dx = spec.dx ?? 26, dy = spec.dy ?? -50; n.lab.layout(520); const l = n.lab.lines[0];
        const lx = dx >= 0 ? p[0] + dx : p[0] + dx - l.w, ly = p[1] + dy - n.lab.h / 2;
        n.lab.setPos(lx - l.x0, ly); n.lab.mount(pg);
        if (spec.arrow !== false) { n.arrow = S('path', { d: `M${(lx + (dx >= 0 ? -6 : l.w + 6)).toFixed(1)} ${(p[1] + dy + 4).toFixed(1)}L${(p[0] + (dx >= 0 ? 7 : -7)).toFixed(1)} ${(p[1] - (dy < 0 ? 8 : -8)).toFixed(1)}`, stroke: c, 'stroke-width': 3, fill: 'none', 'stroke-linecap': 'round' }, g); n.arrow.setAttribute('stroke-dasharray', 200); }
      }
    } else if (kind === 'curve') {
      const pts = []; const N = spec.samples ?? 90;
      for (let i = 0; i <= N; i++) {
        const s = i / N; let x, y, z;
        if (spec.pts) [x, y, z] = spec.pts(s);
        else if (spec.along === 'x') { x = G.spec.x ? lerp(G.spec.x[0], G.spec.x[1], s) : lerp(X0, X1, s); y = spec.fix; }
        else { y = lerp(Y0, Y1, s); x = spec.fix; }
        pts.push(G.proj(x, y, z));
      }
      const d = 'M' + pts.map(p => p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join('L'); let len = 0; for (let i = 1; i < pts.length; i++) len += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
      n.path = S('path', { d, fill: spec.fill ? c : 'none', 'fill-opacity': 0, stroke: spec.w === 0 ? 'none' : c, 'stroke-width': spec.w ?? 5, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-dasharray': spec.dash || (len + 2) }, g); n.len = len;
    } else if (kind === 'box') {
      let bx = spec.boxes || [];
      if (spec.grid) { const [gx, gy] = spec.grid, z0 = spec.z0 ?? Z0; bx = []; for (let i = 0; i < gx; i++) for (let j = 0; j < gy; j++) { const x0 = X0 + (X1 - X0) * i / gx, x1 = X0 + (X1 - X0) * (i + 1) / gx, y0 = Y0 + (Y1 - Y0) * j / gy, y1 = Y0 + (Y1 - Y0) * (j + 1) / gy; bx.push([x0, x1, y0, y1, z0, G.zAt((x0 + x1) / 2, (y0 + y1) / 2)]); } }
      const base = hexRgb(c), list = bx.map(b => { const P8 = [[b[0], b[2], b[4]], [b[1], b[2], b[4]], [b[1], b[3], b[4]], [b[0], b[3], b[4]], [b[0], b[2], b[5]], [b[1], b[2], b[5]], [b[1], b[3], b[5]], [b[0], b[3], b[5]]].map(p => G.proj(p[0], p[1], p[2])); return { b, P8, dep: P8.reduce((a, p) => a + p[2], 0) / 8 }; });
      list.sort((p, q) => q.dep - p.dep);
      const sw = list.length > 80 ? .8 : 2;
      for (const it of list) {
        const P8 = it.P8, mk = (ids, sh, vis) => { if (!vis) return; const dd = ids.map(i => P8[i][0].toFixed(1) + ' ' + P8[i][1].toFixed(1)).join('L'); let rgb = base; if (spec.color === 'surf') rgb = palette(clamp((it.b[5] - Z0) / (Z1 - Z0 || 1) * 1.1)); S('path', { d: 'M' + dd + 'Z', fill: `rgb(${rgb.map(v => Math.round(clamp(v * sh, 0, 255))).join(',')})`, stroke: 'rgba(12,20,18,.75)', 'stroke-width': sw, 'stroke-linejoin': 'round' }, g); };
        const cd = it.dep, fd = ids => ids.reduce((a, i) => a + P8[i][2], 0) / 4;
        mk([0, 3, 7, 4], .6, fd([0, 3, 7, 4]) < cd); mk([1, 2, 6, 5], .6, fd([1, 2, 6, 5]) < cd);
        mk([0, 1, 5, 4], .8, fd([0, 1, 5, 4]) < cd); mk([3, 2, 6, 7], .8, fd([3, 2, 6, 7]) < cd);
        mk([4, 5, 6, 7], 1.08, true);
      }
      if (spec.alpha != null) g.setAttribute('data-alpha', spec.alpha);
    } else if (kind === 'plane') {
      const corners = G.planeCorners(spec);
      const d = 'M' + corners.map(p => { const q = G.proj(...p); return q[0].toFixed(1) + ' ' + q[1].toFixed(1); }).join('L') + 'Z';
      n.path = S('path', { d, fill: c, 'fill-opacity': spec.alpha ?? .26, stroke: c, 'stroke-width': 3, 'stroke-linejoin': 'round' }, g);
    }
  };
  n.update = function (t, st) {
    const lt = t - n.t0; if (st === 0 || (spec.until && gr.kids.some(k => k.id === spec.until && t >= k.t0))) { n.g.style.display = 'none'; return; } n.g.style.display = '';
    const u = st === 2 ? 1 : clamp(lt / Math.min(n.dur, kind === 'point' ? .35 : kind === 'plane' ? .9 : n.dur));
    if (kind === 'point') { const k = easeOut(u), ov = 1 + .35 * Math.sin(Math.PI * u); n.pt.setAttribute('r', ((spec.r ?? 9) * k * ov).toFixed(2)); if (n.arrow) n.arrow.setAttribute('stroke-dashoffset', (200 * (1 - clamp((lt - .2) / .3))).toFixed(1)); }
    else if (kind === 'curve') { if (spec.dash) n.path.setAttribute('opacity', ease(u).toFixed(2)); else n.path.setAttribute('stroke-dashoffset', (n.len * (1 - ease(u))).toFixed(1)); if (spec.fill) n.path.setAttribute('fill-opacity', ((spec.fillAlpha ?? .15) * ease(u)).toFixed(3)); }
    else if (kind === 'box') n.g.setAttribute('opacity', ((spec.alpha ?? 1) * ease(u)).toFixed(3));
    else { let o = ease(u); if (spec.fadeAfter != null) o *= 1 - (1 - (spec.fadeTo ?? 0)) * easeSine(clamp((lt - spec.fadeAfter) / .8)); n.path.setAttribute('opacity', o.toFixed(3)); }
  };
  n.events = push => { if (kind === 'point') push({ type: 'tick', t: n.t0, dur: .1, seed: hstr(spec.label || 'p'), amp: 1 }); else push({ type: 'draw', t: n.t0, dur: n.dur, seed: hstr(kind + n.t0), amp: kind === 'curve' ? .8 : .5 }); };
  return n;
}

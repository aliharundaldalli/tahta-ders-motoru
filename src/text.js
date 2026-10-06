'use strict';
/* text.js : Turkish prose + MathJax glyph handwriting ("rich" lines), math rendering helpers */
const FONT = 'Kalam';
let _cv; function tw(s, size, wt = 400) { _cv = _cv || document.createElement('canvas').getContext('2d'); _cv.font = `${wt} ${size}px ${FONT}`; return _cv.measureText(s).width; }
function mathData(tex) { const m = window.MATH && MATH[tex]; if (!m) throw new Error('math cache miss: "' + tex + '"  -> run: node tools/build_math.mjs'); return m; }
const SW = 30;           // outline stroke width while writing (1000-unit em)
const EDGE = 22;         // soft edge of prose wipe (px)

/* ---- glyph group: stroke-draw outline then fill ---- */
function mathGroup(parent, tex, ms, color) {
  const m = mathData(tex), g = S('g', {}, parent);
  const gl = m.g.map(o => {
    const c = o.c || color;
    const el = S('path', { d: o.d, fill: c, stroke: c, 'stroke-width': SW, 'stroke-linejoin': 'round', 'stroke-linecap': 'round', 'stroke-dasharray': o.len + 2, opacity: 0 }, g);
    return { el, len: o.len, x0: o.x0, x1: o.x1, p: -1 };
  });
  return { g, gl, m };
}
function setGlyph(o, p) {
  if (o.p === p) return; o.p = p; const e = o.el;
  if (p <= 0) { e.setAttribute('opacity', 0); return; }
  e.setAttribute('opacity', 1);
  if (p >= 1) { e.setAttribute('fill-opacity', 1); e.setAttribute('stroke-opacity', 0); e.setAttribute('stroke-dashoffset', 0); return; }
  const pd = clamp(p / .6), pf = clamp((p - .3) / .7);
  e.setAttribute('stroke-dashoffset', (o.len * (1 - easeSine(pd))).toFixed(1));
  e.setAttribute('fill-opacity', pf.toFixed(2));
  e.setAttribute('stroke-opacity', (p < .65 ? 1 : 1 - (p - .65) / .35).toFixed(2));
}
function setGlyphStatic(gl) { gl.forEach(o => { o.el.setAttribute('opacity', 1); o.el.setAttribute('stroke-opacity', 0); o.el.setAttribute('stroke-dashoffset', 0); }); }

/* ---- parsing: "prose $tex$ prose <amber>colored</amber>" -> tokens ---- */
function parseRich(src) {
  const toks = [], segs = []; let pend = false, last = 0, m;
  const re = /<(amber|mint|coral|grey|ink)>([\s\S]*?)<\/\1>/g;
  while ((m = re.exec(src))) { if (m.index > last) segs.push([null, src.slice(last, m.index)]); segs.push([m[1], m[2]]); last = re.lastIndex; }
  if (last < src.length) segs.push([null, src.slice(last)]);
  for (const [c, txt] of segs) txt.split(/\$([^$]+)\$/).forEach((p, i) => {
    if (i % 2) { toks.push({ k: 'm', tex: p, c, sp: pend }); pend = false; return; }
    const r = /(\s*)(\S+)/g; let mm;
    while ((mm = r.exec(p))) { toks.push({ k: 'w', s: mm[2], c, sp: mm[1].length > 0 || pend }); pend = false; }
    if (/\s$/.test(p)) pend = true;
  });
  if (toks[0]) toks[0].sp = false;
  return toks;
}

let _mask = 0;
/* ---- Rich node ---- */
function Rich(spec) {
  const n = { type: 'rich', spec, id: spec.id, writes: true, kids: [], parts: [], tail: .25 };
  const size = spec.size ?? 48, ms = spec.msize ?? Math.round(size * 1.2), wt = spec.weight ?? 400, color = col(spec.color);
  const align = spec.align ?? (spec.tex != null ? 'center' : 'left'), indent = spec.indent ?? 0;
  const toks = parseRich(spec.tex != null ? '$' + spec.tex + '$' : spec.text);
  n.toks = toks;
  /* durations: prose ~16 chars/s, math ~0.09 s/glyph; item clamped (math-only 0.6-2.5 s) unless spec.dur */
  const cps = spec.cps ?? 16; let raw = 0, onlyMath = true;
  toks.forEach(t => { if (t.k === 'w') { t.raw = .04 + t.s.length / cps; onlyMath = false; } else { t.raw = clamp(mathData(t.tex).g.length * .09, .35, 2.5); } raw += t.raw; });
  n.dur = spec.dur ?? clamp(raw, .6, onlyMath ? 2.5 : 6);
  let acc = 0; const k = n.dur / raw;
  toks.forEach(t => { t.a = acc * k; t.b = (acc + t.raw) * k; acc += t.raw; });

  n.layout = function (maxW) {
    const spw = tw(' ', size, wt) * 1.0, avail = maxW - indent;
    toks.forEach(t => {
      if (t.k === 'w') { t.w = tw(t.s, size, t.wt ?? wt); t.asc = .8 * size; t.desc = .3 * size; }
      else { t.m = mathData(t.tex); t.w = t.m.w * ms / 1000; t.asc = t.m.asc * ms / 1000; t.desc = t.m.desc * ms / 1000; }
    });
    const units = []; toks.forEach(t => { if (!units.length || t.sp) units.push([t]); else units[units.length - 1].push(t); });
    n.lines = []; let cur = null;
    for (const u of units) {
      const uw = u.reduce((s, t) => s + t.w, 0); let gap = cur ? spw : 0;
      if (cur && cur.w + gap + uw > avail + .5) { cur = null; gap = 0; }
      if (!cur) { cur = { toks: [], w: 0 }; n.lines.push(cur); }
      let x = cur.w + gap; for (const t of u) { t.x = x; x += t.w; t.line = cur; cur.toks.push(t); } cur.w = x;
    }
    let y = 0;
    n.lines.forEach((l, i) => {
      l.asc = Math.max(size * .86, ...l.toks.map(t => t.asc)); l.desc = Math.max(size * .34, ...l.toks.map(t => t.desc));
      y += (i ? size * .16 : 0) + l.asc; l.base = y; y += l.desc;
      const off = indent + (align === 'center' ? (avail - l.w) / 2 : align === 'right' ? avail - l.w : 0);
      l.toks.forEach(t => t.x += off); l.x0 = off; l.x1 = off + l.w;
    });
    n.w = maxW; n.h = y + 4;
    if (n.lines.some(l => l.w > avail + 1)) console.warn('overflow (unbreakable line wider than box):', spec.text || spec.tex);
  };
  n.setPos = (ax, ay) => { n.ax = ax; n.ay = ay; };

  /* geometry of tokens i..j (inclusive) -> list of absolute rects, one per line */
  n.tokBox = function (i = 0, j = toks.length - 1) {
    const rs = [];
    for (let q = i; q <= j; q++) {
      const t = toks[q], b = t.line.base, y0 = b - Math.max(.78 * size, t.k === 'm' ? Math.min(t.asc, size * .95) : 0), y1 = b + Math.max(.28 * size, t.k === 'm' ? Math.min(t.desc, size * .5) : 0);
      const r = rs[rs.length - 1];
      if (r && r.line === t.line) { r.x1 = n.ax + t.x + t.w; r.y0 = Math.min(r.y0, n.ay + y0); r.y1 = Math.max(r.y1, n.ay + y1); }
      else rs.push({ line: t.line, x0: n.ax + t.x, x1: n.ax + t.x + t.w, y0: n.ay + y0, y1: n.ay + y1 });
    }
    return rs;
  };

  n.mount = function (pg) {
    const g = n.g = S('g', { transform: `translate(${n.ax},${n.ay})`, style: 'display:none' }, pg.content);
    n.runs = []; n.maths = [];
    for (const l of n.lines) {
      let run = null;
      for (const t of l.toks) {
        const c = col(t.c || spec.color);
        if (t.k === 'w') {
          if (run && run.c === c && run.line === l) { run.toks.push(t); }
          else { run = { toks: [t], c, line: l }; n.runs.push(run); }
        } else {
          run = null;
          const mg = mathGroup(g, t.tex, ms, c);
          mg.g.setAttribute('transform', `translate(${t.x.toFixed(1)},${l.base.toFixed(1)}) scale(${ms / 1000})`);
          t.mg = mg; n.maths.push(t);
          /* glyph start times: x-proportional within the token */
          const m = mg.m, x0 = m.g.length ? m.g[0].x0 : 0, x1 = m.g.length ? Math.max(...m.g.map(q => q.x0)) : 1, span = Math.max(1, x1 - x0);
          const d = t.b - t.a, gd = Math.min(Math.max(d * .35, .2), .45, d * .8 || .2);
          mg.gl.forEach(o => { o.gs = t.a + ((o.x0 - x0) / span) * (d - gd); o.gd = gd; });
        }
      }
    }
    n.runs.forEach(r => {
      const l = r.line, t0 = r.toks[0], base = l.base;
      r.x0 = t0.x; r.x1 = r.toks[r.toks.length - 1].x + r.toks[r.toks.length - 1].w;
      const txt = r.toks.map((t, i) => (i && t.sp ? ' ' : '') + t.s).join('');
      r.el = S('text', { x: r.x0.toFixed(1), y: base.toFixed(1), fill: r.c, 'font-family': FONT, 'font-size': size, 'font-weight': spec.weight ?? 400, 'xml:space': 'preserve' }, g);
      r.el.textContent = txt;
      const id = 'mk' + (++_mask);
      const mk = S('mask', { id, maskUnits: 'userSpaceOnUse', x: r.x0 - 40, y: base - l.asc - 30, width: r.x1 - r.x0 + 90, height: l.asc + l.desc + 60 }, g);
      r.r1 = S('rect', { fill: '#fff', y: base - l.asc - 30, height: l.asc + l.desc + 60, x: r.x0 - 40, width: 0 }, mk);
      r.r2 = S('rect', { fill: 'url(#softEdge)', y: base - l.asc - 30, height: l.asc + l.desc + 60, width: EDGE, x: r.x0 - 40 }, mk);
      r.maskId = id; r.state = '';
      /* word-paced front knots (time, x), monotone */
      let px = r.x0 - 4; r.knots = [[r.toks[0].a - .001, r.x0 - 4]];
      for (const t of r.toks) { px = Math.max(px, t.x); r.knots.push([t.a, px]); px = Math.max(px, t.x + t.w + EDGE * .8); r.knots.push([t.b, px]); }
      r.end = r.toks[r.toks.length - 1].b;
    });
    n.nib = S('g', { opacity: 0 }, g);
    S('circle', { r: 13, fill: '#fff6dc', opacity: .16 }, n.nib); S('circle', { r: 5.5, fill: '#fff6dc', opacity: .95 }, n.nib);
    n.st = -1;
  };

  function front(r, lt) { const k = r.knots; if (lt <= k[0][0]) return k[0][1]; for (let i = 1; i < k.length; i++) if (lt <= k[i][0]) { const u = (lt - k[i - 1][0]) / Math.max(1e-6, k[i][0] - k[i - 1][0]); return lerp(k[i - 1][1], k[i][1], u); } return k[k.length - 1][1]; }

  n.update = function (t, st) {
    const lt = t - n.t0;
    if (st === 0) { n.g.style.display = 'none'; return; }
    n.g.style.display = '';
    let nibRun = null, nibGl = null;      // nib = position of the most recently started run / glyph (pure function of t)
    for (const r of n.runs) {
      if (lt <= r.toks[0].a) { if (r.state !== 'h') { r.el.setAttribute('visibility', 'hidden'); r.state = 'h'; } continue; }
      const st0 = r.toks[0].a; if (!nibRun || st0 >= nibRun.a) nibRun = { a: st0, r };
      if (lt >= r.end) { if (r.state !== 'f') { r.el.setAttribute('visibility', 'visible'); r.el.removeAttribute('mask'); r.state = 'f'; } continue; }
      const f = front(r, lt);
      r.el.setAttribute('visibility', 'visible'); r.el.setAttribute('mask', `url(#${r.maskId})`); r.state = 'p';
      r.r1.setAttribute('width', Math.max(0, f - EDGE - (r.x0 - 40)).toFixed(1)); r.r2.setAttribute('x', (f - EDGE).toFixed(1));
    }
    for (const tk of n.maths) {
      for (const o of tk.mg.gl) {
        const p = clamp((lt - o.gs) / o.gd); setGlyph(o, p);
        if (p > 0 && (!nibGl || o.gs >= nibGl.a)) nibGl = { a: o.gs, o, tk, p };
      }
    }
    let nib = null;
    if (nibGl && (!nibRun || nibGl.a >= nibRun.a)) { const { o, tk, p } = nibGl, pt = o.el.getPointAtLength(o.len * easeSine(clamp(p / .6))); nib = [tk.x + pt.x * ms / 1000, tk.line.base + pt.y * ms / 1000]; }
    else if (nibRun) { const r = nibRun.r; nib = [front(r, lt) - EDGE * .7, r.line.base - .3 * size + Math.sin(Math.min(lt, r.end) * 23 + r.x0) * 3.2]; }
    if (nib && lt < n.dur + n.tail) {
      const o = lt <= n.dur ? 1 : 1 - (lt - n.dur) / n.tail;
      n.nib.setAttribute('transform', `translate(${nib[0].toFixed(1)},${nib[1].toFixed(1)})`); n.nib.setAttribute('opacity', o.toFixed(2));
    } else n.nib.setAttribute('opacity', 0);
    if (st === 2) { n.nib.setAttribute('opacity', 0); }
  };
  n.events = push => push({ type: 'scratch', t: n.t0, dur: n.dur, seed: hstr(spec.text || spec.tex || ''), amp: 1 });
  return n;
}

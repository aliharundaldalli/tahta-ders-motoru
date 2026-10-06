'use strict';
/* board.js : node factory (templates), timing/cue resolution, layout into pages, annotations, camera, render(t) */
const GAP = .25;           // default gap between consecutive items (s)
const REG = new Map(); let LAST = null;

function noop() { }
function fill(n) {
  n.kids = n.kids || []; n.parts = n.parts || []; n.dur = n.dur ?? 0; n.tail = n.tail ?? .3;
  n.layout = n.layout || (() => { n.w = 0; n.h = 0; }); n.setPos = n.setPos || ((x, y) => { n.ax = x; n.ay = y; });
  n.mount = n.mount || noop; n.update = n.update || noop; n.events = n.events || noop; n.afterResolve = n.afterResolve || noop;
  return n;
}

/* ---------- containers: col | row | box (theorem / note / definition / steps) ---------- */
function Container(spec, kind) {
  const n = { type: kind, spec, id: spec.id, writes: false, kids: [], parts: [], tail: .3 };
  const box = kind === 'theorem' || kind === 'note' || kind === 'definition';
  n.headDur = kind === 'theorem' ? .7 : kind === 'note' ? .5 : kind === 'definition' ? .4 : 0;
  n.dur = n.headDur; n.writes = n.headDur > 0;
  const gap = spec.gap ?? (kind === 'row' ? 40 : 14);
  let items = spec.items || [];
  if (kind === 'theorem') items = [...(spec.hyp || []), ...(spec.concl || []).map(s => ({ color: 'mint', ...s }))];
  if (kind === 'definition' || kind === 'note') {
    const lab = spec.label ?? (kind === 'note' ? 'NOT' : 'Tanım');
    items = [{ type: 'text', text: lab, size: 44, weight: 700, color: kind === 'note' ? 'coral' : 'amber', dur: spec.labelDur, cue: spec.labelCue, gap: 0 }, ...items];
  }
  n.kids = items.map(mk);
  if (kind === 'theorem') { n.lab = Rich({ text: spec.label ?? ('TEOREM ' + (spec.n ?? '')), size: 38, weight: 700, color: 'amber' }); n.parts.push(n.lab); }
  const pad = kind === 'theorem' ? { l: 44, r: 44, t: 58, b: 30 } : kind === 'note' ? { l: 46, r: 30, t: 20, b: 20 } : kind === 'definition' ? { l: 30, r: 0, t: 0, b: 0 } : { l: 0, r: 0, t: 0, b: 0 };
  n.layout = function (maxW) {
    const inner = maxW - pad.l - pad.r; let y = pad.t, h = 0;
    if (kind === 'row') {
      const k = n.kids.length, cw = (maxW - gap * (k - 1)) / k;
      n.kids.forEach((c, i) => { c.layout(cw); c.cx = i * (cw + gap); c.cy = 0; h = Math.max(h, c.h); });
      n.w = maxW; n.h = h; return;
    }
    let first = true;
    for (const c of n.kids) {
      if (c.noflow) { c.layout(inner); continue; }
      if (c.spec.pos) { c.layout(inner - c.spec.pos[0]); c.cx = pad.l + c.spec.pos[0]; c.cy = pad.t + c.spec.pos[1]; continue; }
      c.layout(inner); y += (first ? 0 : gap) + (c.spec.mt || 0); c.cx = pad.l; c.cy = y; y += c.h; first = false;
    }
    n.w = maxW; n.h = y + pad.b;
    if (n.lab) n.lab.layout(400);
  };
  n.setPos = function (ax, ay) {
    n.ax = ax; n.ay = ay; n.kids.forEach(c => c.setPos(ax + c.cx, ay + c.cy));
    if (n.lab) n.lab.setPos(ax + 34 - n.lab.lines[0].x0, ay - n.lab.h / 2 - 2);
  };
  n.mount = function (pg) {
    if (!box) return;
    const g = n.g = S('g', { style: 'display:none' }, pg.content), x = n.ax, y = n.ay, w = n.w, h = n.h, r = 16; n.pathEls = [];
    const P = (d, attrs, len) => { const e = S('path', Object.assign({ d, fill: 'none', 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-dasharray': len }, attrs), g); e.len = len; n.pathEls.push(e); return e; };
    const per = 2 * (w + h) - 8 * r + 2 * Math.PI * r;
    const rr = `M${x + r} ${y}H${x + w - r}A${r} ${r} 0 0 1 ${x + w} ${y + r}V${y + h - r}A${r} ${r} 0 0 1 ${x + w - r} ${y + h}H${x + r}A${r} ${r} 0 0 1 ${x} ${y + h - r}V${y + r}A${r} ${r} 0 0 1 ${x + r} ${y}`;
    if (kind === 'theorem') {
      P(rr, { stroke: COL.ink, 'stroke-width': 3.2, opacity: .88 }, per + 4);
      const l = n.lab.lines[0]; S('rect', { x: n.lab.ax + l.x0 - 14, y: n.lab.ay + 4, width: l.w + 28, height: n.lab.h - 8, fill: COL.board }, g);
    } else if (kind === 'note') {
      S('rect', { x, y, width: w, height: h, rx: r, fill: rgba('coral', .07) }, g).setAttribute('class', 'fillbox');
      P(rr, { stroke: COL.coral, 'stroke-width': 2.4, opacity: .6 }, per + 4);
      P(`M${x + 8} ${y + 10}V${y + h - 10}`, { stroke: COL.coral, 'stroke-width': 8 }, h);
    } else P(`M${x + 6} ${y + 6}V${y + h - 6}`, { stroke: COL.amber, 'stroke-width': 4, opacity: .75 }, h);
    n.st = -1;
  };
  n.update = function (t, st) {
    if (!n.g) return; if (st === 0) { n.g.style.display = 'none'; return; } n.g.style.display = '';
    const u = st === 2 ? 1 : ease(clamp((t - n.t0) / n.headDur));
    n.pathEls.forEach(e => e.setAttribute('stroke-dashoffset', (e.len * (1 - u)).toFixed(1)));
    const f = n.g.querySelector('.fillbox'); if (f) f.setAttribute('opacity', u.toFixed(2));
  };
  n.resolveKids = function (ctx) { ctx.last = n.t0 + n.headDur - GAP + (kind === 'theorem' ? -.15 : 0); };
  n.afterResolve = function () { if (n.lab) { n.lab.t0 = n.t0 + .08; n.lab.t1 = n.lab.t0 + n.lab.dur; n.t1 = Math.max(n.t1, n.lab.t1); } };
  n.events = push => { if (n.headDur) push({ type: 'scratch', t: n.t0, dur: n.headDur, seed: hstr(kind + (n.id || '')), amp: .8 }); };
  return n;
}

/* ---------- annotations: highlight | circle | underline | arrow ---------- */
function Annot(spec, kind) {
  const n = { type: kind, spec, id: spec.id, writes: false, kids: [], parts: [], tail: .2, prev: LAST };
  n.dur = spec.dur ?? (kind === 'highlight' ? .7 : .6);
  n.layer = kind === 'highlight' ? 'under' : 'over';
  const c = spec.color ?? (kind === 'highlight' ? '#ffd84a' : kind === 'circle' ? 'coral' : 'amber');
  if (kind === 'arrow' && spec.text) { n.lab = Rich({ text: spec.text, size: spec.size ?? 40, color: spec.tcolor ?? spec.color ?? 'amber' }); n.parts.push(n.lab); }
  n.layout = noop; n.setPos = noop; n.noflow = true;
  n.afterResolve = () => { if (n.lab) { n.lab.t0 = n.t0 + .3; n.lab.t1 = n.lab.t0 + n.lab.dur; n.t1 = Math.max(n.t1, n.lab.t1); } };
  n.mount = function (pg) {
    const tg = spec.target ? REG.get(spec.target) : n.prev;
    if (!tg) { console.warn('annotation target not found:', spec.target); n.g = S('g', { style: 'display:none' }, pg[n.layer]); return; }
    let rects = tg.tokBox ? tg.tokBox(...(spec.tokens || [0, tg.toks.length - 1])) : [{ x0: tg.ax, y0: tg.ay, x1: tg.ax + tg.w, y1: tg.ay + tg.h }];
    const g = n.g = S('g', { style: 'display:none' }, pg[n.layer]), R = rng(hstr((spec.target || '') + kind + (spec.tokens || '')));
    n.rects = rects;
    if (kind === 'highlight') {
      const hc = col(c); g.setAttribute('opacity', spec.alpha ?? .4);
      n.bands = rects.map(r => {
        const x0 = r.x0 - 8, x1 = r.x1 + 8, y0 = r.y0 + 2, y1 = r.y1 - 2, j = () => (R() - .5) * 5;
        const bg = S('g', {}, g); const p = S('path', { d: `M${x0} ${y0 + j()}L${x1} ${y0 + j()}L${x1 + 3} ${y1 + j()}L${x0 - 3} ${y1 + j()}Z`, fill: hc, stroke: hc, 'stroke-width': 8, 'stroke-linejoin': 'round' }, bg);
        return { bg, x0, w: x1 - x0 };
      });
    } else if (kind === 'underline') {
      n.paths = rects.map(r => { const y = r.y1 + 2, x0 = r.x0 - 4, x1 = r.x1 + 4, pts = []; for (let i = 0; i <= 24; i++) { const u = i / 24; pts.push(`${(x0 + (x1 - x0) * u).toFixed(1)} ${(y + Math.sin(u * 7 + R() * .3) * 2.2 + u * 2).toFixed(1)}`); } return mkStroke(g, 'M' + pts.join('L'), col(c), spec.w ?? 5, x1 - x0 + 20); });
    } else if (kind === 'circle') {
      const r0 = rects[0], b = rects.reduce((a, r) => ({ x0: Math.min(a.x0, r.x0), y0: Math.min(a.y0, r.y0), x1: Math.max(a.x1, r.x1), y1: Math.max(a.y1, r.y1) }), r0);
      const cx = (b.x0 + b.x1) / 2, cy = (b.y0 + b.y1) / 2, rx = (b.x1 - b.x0) / 2 * 1.08 + 26, ry = (b.y1 - b.y0) / 2 * 1.1 + 14, pts = [], st = -Math.PI * .6;
      for (let i = 0; i <= 64; i++) { const u = i / 64, th = st + u * Math.PI * 2.16, k = 1 + .035 * Math.sin(u * 9 + 1) + u * .05; pts.push(`${(cx + Math.cos(th) * rx * k).toFixed(1)} ${(cy + Math.sin(th) * ry * k).toFixed(1)}`); }
      n.paths = [mkStroke(g, 'M' + pts.join('L'), col(c), spec.w ?? 4.5, 2 * Math.PI * Math.hypot(rx, ry) * 1.2)];
    } else if (kind === 'arrow') {
      const b = rects[0], side = spec.from ?? 'left', L = spec.len ?? 120, gap = 14, cx = (b.x0 + b.x1) / 2, cy = (b.y0 + b.y1) / 2;
      const d = { left: [-1, 0], right: [1, 0], up: [0, -1], down: [0, 1] }[side];
      const hx = side === 'left' ? b.x0 - gap : side === 'right' ? b.x1 + gap : cx, hy = side === 'up' ? b.y0 - gap : side === 'down' ? b.y1 + gap : cy;
      const tx = hx + d[0] * L, ty = hy + d[1] * L, mx = (hx + tx) / 2 - d[1] * 18, my = (hy + ty) / 2 + d[0] * 18, ang = Math.atan2(hy - my, hx - mx);
      const head = `M${hx + Math.cos(ang + 2.7) * 20} ${hy + Math.sin(ang + 2.7) * 20}L${hx} ${hy}L${hx + Math.cos(ang - 2.7) * 20} ${hy + Math.sin(ang - 2.7) * 20}`;
      n.paths = [mkStroke(g, `M${tx} ${ty}Q${mx} ${my} ${hx} ${hy}`, col(c), spec.w ?? 4.5, L * 1.3), mkStroke(g, head, col(c), spec.w ?? 4.5, 60)];
      if (n.lab) { n.lab.layout(520); const l = n.lab.lines[0]; const lx = side === 'left' ? tx - l.w - 14 : side === 'right' ? tx + 14 : tx - l.w / 2, ly = side === 'up' ? ty - n.lab.h - 6 : side === 'down' ? ty + 6 : ty - n.lab.h / 2; n.lab.setPos(lx - l.x0, ly); n.lab.mount(pg); }
    }
  };
  n.update = function (t, st) {
    if (!n.g) return; if (st === 0) { n.g.style.display = 'none'; return; } n.g.style.display = '';
    const u = st === 2 ? 1 : clamp((t - n.t0) / n.dur);
    if (kind === 'highlight') {
      const tot = n.bands.reduce((s, b) => s + b.w, 0); let a = 0;
      for (const b of n.bands) { const f0 = a / tot, f1 = (a + b.w) / tot; a += b.w; const p = ease(clamp((u - f0) / (f1 - f0))); b.bg.setAttribute('transform', `translate(${b.x0},0) scale(${Math.max(p, .0001).toFixed(4)},1) translate(${-b.x0},0)`); b.bg.style.display = p <= 0 ? 'none' : ''; }
    } else if (n.paths) { const tot = n.paths.reduce((s, p) => s + p.len, 0); let a = 0; for (const p of n.paths) { const f0 = a / tot, f1 = (a + p.len) / tot; a += p.len; p.el.setAttribute('stroke-dashoffset', (p.len * (1 - easeSine(clamp((u - f0) / (f1 - f0))))).toFixed(1)); } }
  };
  n.events = push => push({ type: kind === 'highlight' ? 'marker' : 'scratch', t: n.t0, dur: n.dur, seed: hstr(kind + (spec.target || '')), amp: kind === 'highlight' ? 1 : .7 });
  return n;
}
function mkStroke(g, d, color, w, len) { const el = S('path', { d, fill: 'none', stroke: color, 'stroke-width': w, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-dasharray': len + 2, 'stroke-dashoffset': len + 2 }, g); return { el, len }; }

/* ---------- page / camera / space ---------- */
function PageBreak(spec) { const n = fill({ type: spec.type, spec, writes: true, dur: spec.type === 'clear' ? .5 : .75 }); n.style = spec.type === 'clear' ? 'fade' : 'flip'; return n; }
function Camera(spec) { const n = fill({ type: 'camera', spec, noflow: true, dur: spec.dur ?? 1.2 }); n.state = { z: spec.zoom ?? 1, x: spec.x ?? 960, y: spec.y ?? 540 }; return n; }
function Space(spec) { const n = fill({ type: 'space', spec }); n.layout = () => { n.w = 0; n.h = spec.h ?? 30; }; return n; }

/* ---------- factory ---------- */
function mk(spec) {
  let n; const t = spec.type;
  if (t === 'text' || t === 'math') n = Rich(spec);
  else if (t === 'title') {
    const kids = [{ type: 'text', text: spec.text, size: spec.size ?? 68, weight: 700, align: 'center', id: spec.id ? spec.id + '_t' : 'title_t' }];
    if (spec.sub) kids.push({ type: 'text', text: spec.sub, size: 44, color: 'grey', align: 'center' });
    kids.splice(1, 0, { type: 'underline', target: kids[0].id, color: 'amber', w: 6 });
    n = Container({ items: kids, gap: 10, id: spec.id, cue: spec.cue, at: spec.at, gap_: 0 }, 'col'); n.spec = spec;
  }
  else if (t === 'definition' || t === 'theorem' || t === 'note') n = Container(spec, t);
  else if (t === 'steps' || t === 'col') n = Container(spec, 'col');
  else if (t === 'row') n = Container(spec, 'row');
  else if (t === 'graph3d') n = Graph(spec, true);
  else if (t === 'graph2d') n = Graph(spec, false);
  else if (['highlight', 'circle', 'underline', 'arrow'].includes(t)) n = Annot(spec, t);
  else if (t === 'page' || t === 'clear') n = PageBreak(spec);
  else if (t === 'camera') n = Camera(spec);
  else if (t === 'space') n = Space(spec);
  else throw new Error('unknown item type: ' + t);
  fill(n); n.spec = spec;
  if (spec.id) REG.set(spec.id, n);
  if (!['highlight', 'circle', 'underline', 'arrow', 'camera', 'space', 'page', 'clear'].includes(t)) LAST = n;
  return n;
}
const walk = (n, f) => { f(n); n.kids.forEach(k => walk(k, f)); n.parts.forEach(k => walk(k, f)); };

/* ---------- timing ---------- */
function findCue(seg, spec) {
  const q = spec.cue.split(/\s+/).map(norm).filter(Boolean), Wd = seg.words; let cnt = 0; const nth = spec.nth || 1;
  for (let i = 0; i + q.length <= Wd.length; i++) {
    if (q.every((tok, k) => { const w = Wd[i + k].n; return w === tok || (tok.length >= 5 && w.startsWith(tok)) || (w.length >= 5 && tok.startsWith(w)); }))
      if (++cnt === nth) return spec.cueEnd ? seg.t0 + Wd[i + q.length - 1].end : seg.t0 + Wd[i].start;
  }
  return null;
}
function resolve(list, ctx) {
  for (const n of list) {
    const sp = n.spec; let t, cueT = null; const segSave = ctx.seg;
    if (sp.seg) ctx.seg = Board.segs.find(s => s.id === sp.seg) || ctx.seg;   // optional per-item segment override (cue/at refer to that segment)
    if (sp.cue) { cueT = findCue(ctx.seg, sp); if (cueT == null) { Board.warn(`cue not found in ${ctx.seg.id}: "${sp.cue}"`); } }
    if (cueT != null) t = cueT + (sp.off || 0);
    else if (sp.at != null) t = ctx.seg.t0 + sp.at;
    else t = ctx.last + (sp.gap ?? GAP);
    if (n.writes && !sp.overlap) t = Math.max(t, ctx.wEnd + .08);
    if (cueT != null && t > cueT + (sp.off || 0) + .3) Board.warn(`late by ${(t - cueT - (sp.off || 0)).toFixed(2)}s (queued behind previous writing): ${ctx.seg.id} "${sp.cue}"`);
    n.t0 = t; n.t1 = t + n.dur; n.seg = ctx.seg.id; n.cueT = cueT;
    if (sp.cue) Board.cues.push({ seg: ctx.seg.id, cue: sp.cue, want: cueT, start: t, type: n.type });
    if (n.resolveKids) n.resolveKids(ctx);
    if (n.kids.length) { resolve(n.kids, ctx); n.t1 = Math.max(n.t1, ...n.kids.map(k => k.t1)); }
    n.afterResolve();
    ctx.last = n.t1; if (n.writes) ctx.wEnd = Math.max(ctx.wEnd, n.t0 + n.dur);
    ctx.seg = segSave;
  }
}

/* ---------- Board ---------- */
const Board = {
  warnings: [], cues: [], pages: [], segs: [], events: [], cams: [],
  warn(m) { this.warnings.push(m); console.warn(m); },

  init(L, svg) {
    const pad = L.pad || { pre: .5, post: .8 }, policy = L.overflow || 'scroll';
    /* segments in order of first appearance */
    let cur = 0; const ids = [...new Set(L.scenes.map(s => s.seg))];
    this.segs = ids.map(id => {
      const w = WORDS[id]; if (!w) throw new Error('no timing for ' + id);
      const scs = L.scenes.filter(s => s.seg === id), pre = scs.find(s => s.pre != null)?.pre ?? pad.pre, post = scs.find(s => s.post != null)?.post ?? pad.post;
      const sg = { id, t0: cur + pre, dur: w.duration, words: w.words.map(x => ({ ...x, n: norm(x.w) })).filter(x => x.n) , all: w.words };
      sg.tStart = cur; sg.tEnd = sg.t0 + sg.dur + post; cur = sg.tEnd; return sg;
    });
    this.total = cur + .3;
    /* build nodes + resolve timing */
    const top = []; const ctxW = { v: 0 };
    for (const sc of L.scenes) {
      const seg = this.segs.find(s => s.id === sc.seg), ctx = { seg, last: seg.t0 - GAP + .1, wEnd: ctxW.v };
      const nodes = sc.items.map(mk); resolve(nodes, ctx); ctxW.v = ctx.wEnd; nodes.forEach(n => n.scene = sc.seg); top.push(...nodes);
    }
    /* layout into pages */
    const pages = this.pages = []; let page = null;
    const newPage = (t, style) => { page = { t, style, nodes: [], cy: LAY.mt, scroll: 0, scrolls: [], top: [] }; pages.push(page); };
    newPage(0, 'none');
    for (const n of top) {
      if (n.type === 'page' || n.type === 'clear') { if (page.top.length) { newPage(n.t0, n.style); Board.events.push({ type: 'flip', t: n.t0, style: n.style }); } continue; }
      if (n.type === 'camera') { this.cams.push(n); continue; }
      n.layout(LAY.w);
      let y = page.top.length ? page.cy + (n.spec.mt ?? 22) : page.cy;
      if (n.type !== 'highlight' && n.type !== 'circle' && n.type !== 'underline' && n.type !== 'arrow' && n.h > 0) {
        if (y + n.h > LAY.bottom + page.scroll) {
          if (policy === 'page' && page.top.length) { newPage(n.t0 - .45, 'flip'); Board.events.push({ type: 'flip', t: n.t0 - .45, style: 'flip' }); y = page.cy; }
          else { const to = y + n.h - LAY.bottom + 6; page.scrolls.push({ t: n.t0 - .25, dur: .8, from: page.scroll, to }); Board.events.push({ type: 'flip', t: n.t0 - .25, style: 'scroll' }); page.scroll = to; }
        }
        if (n.h > LAY.bottom - LAY.mt) Board.warn('item taller than a page: ' + n.type + ' ' + (n.id || ''));
        n.setPos(LAY.ml, y); page.cy = y + n.h;
      } else n.setPos(LAY.ml, y);
      page.top.push(n);
    }
    /* mount */
    const cam = this.cam = S('g', {}, svg);
    this.defs();
    for (const p of pages) {
      p.g = S('g', { style: 'display:none' }, cam); p.sg = S('g', {}, p.g);
      p.under = S('g', {}, p.sg); p.content = S('g', {}, p.sg); p.over = S('g', {}, p.sg);
      p.flat = [];
      for (const n of p.top) walk(n, m => { p.flat.push(m); if (!m.g) m.mount(p); });
      p.post = p.flat.filter(m => m.post);
    }
    /* final scroll bookkeeping */
    for (const p of pages) p.final = p.scroll;
    /* sfx events */
    pages.forEach(p => p.flat.forEach(m => m.events(e => this.events.push(e))));
    this.events.sort((a, b) => a.t - b.t);
    this.total = Math.max(this.total, ...pages.flatMap(p => p.flat.filter(m => !['row', 'col', 'steps'].includes(m.type)).map(m => m.t1 + .3)));
    window.__events = this.events;
  },
  defs() {
    const d = S('defs', {}, this.cam.ownerSVGElement);
    const lg = S('linearGradient', { id: 'softEdge', x1: 0, x2: 1, y1: 0, y2: 0 }, d); S('stop', { offset: 0, 'stop-color': '#fff' }, lg); S('stop', { offset: 1, 'stop-color': '#000' }, lg);
    const tg = S('linearGradient', { id: 'topGrad', gradientUnits: 'userSpaceOnUse', x1: 0, y1: 8, x2: 0, y2: 72 }, d); S('stop', { offset: 0, 'stop-color': '#000' }, tg); S('stop', { offset: 1, 'stop-color': '#fff' }, tg);
    const mk_ = S('mask', { id: 'topFade', maskUnits: 'userSpaceOnUse', x: 0, y: 0, width: W, height: H }, d); S('rect', { width: W, height: H, fill: 'url(#topGrad)' }, mk_);
  },

  /* ---- render: pure function of t ---- */
  render(t) {
    /* camera */
    let st = { z: 1, x: 960, y: 540 };
    for (const c of this.cams) { if (t < c.t0) break; const u = ease(clamp((t - c.t0) / c.dur)); st = { z: lerp(st.z, c.state.z, u), x: lerp(st.x, c.state.x, u), y: lerp(st.y, c.state.y, u) }; if (u < 1) break; }
    this.cam.setAttribute('transform', st.z === 1 && st.x === 960 && st.y === 540 ? '' : `translate(960,540) scale(${st.z.toFixed(4)}) translate(${-st.x.toFixed(2)},${-st.y.toFixed(2)})`);
    const P = this.pages;
    P.forEach((p, i) => {
      const nx = P[i + 1], tin = p.t, pin = i === 0 ? 1 : ease(clamp((t - tin - .12) / .55)), pout = nx ? ease(clamp((t - nx.t) / .5)) : 0;
      const vis = (i === 0 || t >= tin) && pout < 1 && (i === 0 || pin > 0 || t >= tin);
      if (!vis || (i > 0 && t < tin)) { if (p.g.style.display !== 'none') p.g.style.display = 'none'; return; }
      p.g.style.display = '';
      const slide = (i === 0 || p.style === 'fade' ? 0 : (1 - pin) * 70) - (nx && nx.style !== 'fade' ? pout * 90 : 0);
      p.g.setAttribute('opacity', (pin * (1 - pout)).toFixed(3)); p.g.setAttribute('transform', slide ? `translate(${slide.toFixed(1)},0)` : '');
      /* scroll */
      let sy = 0; for (const s of p.scrolls) { if (t < s.t) break; sy = lerp(s.from, s.to, ease(clamp((t - s.t) / s.dur))); }
      p.sg.setAttribute('transform', sy ? `translate(0,${-sy.toFixed(1)})` : '');
      if (sy > .5) p.g.setAttribute('mask', 'url(#topFade)'); else p.g.removeAttribute('mask');
      for (const m of p.flat) {
        if (!m.update || m.update === noop) continue;
        const s = t < m.t0 ? 0 : t >= m.t1 + m.tail ? 2 : 1;
        if (s !== 1 && m.st === s) continue; m.st = s; m.update(t, s);
      }
      for (const m of p.post) m.post(t);    // per-frame hooks (unified graph3d painter) after all updates of the page
    });
  },
  segAt(t) { let c = this.segs[0]; for (const s of this.segs) if (t >= s.tStart) c = s; return c; }
};

/* lesson_parts/A.js — Ardışık İntegraller ve Fubini, a00–a19. Standalone preview: index.html?lesson=lesson_parts/A */
(function () {
const PG = { type: 'page', at: -0.78 };
const SEC = (text, cue, extra) => Object.assign({ type: 'text', text, weight: 700, color: 'amber', cue, dur: 1.4 }, extra);
const PI = Math.PI;

/* ---------- 2D helpers ---------- */
const polyF = arr => s => { const f = s * (arr.length - 1), i = Math.min(arr.length - 2, Math.floor(f)), u = f - i; return [arr[i][0] + (arr[i + 1][0] - arr[i][0]) * u, arr[i][1] + (arr[i + 1][1] - arr[i][1]) * u]; };
const polyF3 = arr => s => { const f = s * (arr.length - 1), i = Math.min(arr.length - 2, Math.floor(f)), u = f - i; return arr[i].map((v, k) => v + (arr[i + 1][k] - v) * u); };
const lin = (a, b, n = 30) => Array.from({ length: n + 1 }, (_, i) => [a[0] + (b[0] - a[0]) * i / n, a[1] + (b[1] - a[1]) * i / n]);
const rng_ = (a, b, n = 60) => Array.from({ length: n + 1 }, (_, i) => a + (b - a) * i / n);
const CV = (arr, o) => Object.assign({ kind: 'curve', pts: polyF(arr), samples: arr.length - 1 }, o);
const LB = (p, tex, dx, dy, color, o) => Object.assign({ kind: 'point', p, r: .1, label: tex, color, arrow: false, dx, dy, size: 46, msize: 56 }, o);
const arc = (r, a0, a1, n = 60, k = 1) => Array.from({ length: n + 1 }, (_, i) => { const a = a0 + (a1 - a0) * i / n; return [r * Math.cos(a), r * k * Math.sin(a)]; });

/* sweeping strip: n strips appear one after another (each replaced by the next); mk(i) -> polygon; T = first-cue spec */
function sweep(prefix, n, mk, T, step, color, alpha, o) {
  o = o || {}; const L = [];
  for (let i = 0; i < n; i++) L.push(CV(mk(i), { color, w: 0, fill: true, fillAlpha: alpha ?? .55, dur: .18, id: prefix + i, until: i < n - 1 ? prefix + (i + 1) : o.until, cue: T.cue, nth: T.nth, cueEnd: T.cueEnd, off: (T.off || 0) + i * step }));
  return L;
}
/* one static strip shown from cue until the sweep id (or other id) appears */
const strip1 = (id, poly, T, color, until) => CV(poly, { color, w: 0, fill: true, fillAlpha: .6, dur: .3, id, until, ...T });

/* ---- rectangle [0,2]x[0,1] ---- */
function rectFig(w, h, T, extra) {
  T = T || {};
  return { type: 'graph2d', x: [-.3, 2.5], y: [-.3, 1.4], w, h, overlap: true, build: .5, ...(T.g || {}), layers: [
    CV([[0, 0], [2, 0], [2, 1], [0, 1], [0, 0]], { color: 'amber', w: 6, fill: true, fillAlpha: .22, dur: 1.0, ...T.rect }),
    LB([2, 0], '$2$', 0, 42, 'grey', T.lab), LB([0, 1], '$1$', -34, 0, 'grey', T.lab), LB([1, .5], '$R$', 0, 0, 'mint', T.lR),
    ...(extra || []) ] };
}
/* ---- region under y=x^2 on [0,1] ---- */
const par = rng_(0, 1, 50).map(x => [x, x * x]);
function parFig(w, h, T, extra) {
  T = T || {};
  return { type: 'graph2d', x: [-.2, 1.3], y: [-.2, 1.15], w, h, overlap: true, build: .5, ...(T.g || {}), layers: [
    CV(par.concat([[1, 0], [0, 0]]), { color: 'amber', w: 0, fill: true, fillAlpha: .26, dur: 1.0, ...T.fill }),
    CV(par, { color: 'amber', w: 6, dur: 1.0, ...T.c }),
    CV(lin([1, 0], [1, 1]), { color: 'grey', w: 3, dash: '10 9', dur: .6, ...T.v }),
    LB([1, 0], '$1$', 0, 42, 'grey', T.lab), LB([.6, .36], '$y=x^2$', -26, -26, 'amber', T.lc), LB([.8, .22], '$R$', 0, 0, 'mint', T.lR),
    ...(extra || []) ] };
}
const vS = (x, dw) => [[x, 0], [x + dw, 0], [x + dw, (x + dw) ** 2], [x, x * x], [x, 0]];
const hS = (y, dh) => [[Math.sqrt(y), y], [1, y], [1, y + dh], [Math.sqrt(y + dh), y + dh], [Math.sqrt(y), y]];

/* ---- vertical / horizontal simple region (a01, a02, a14) ---- */
const g1 = x => .4 + .3 * Math.sin(x), g2 = x => 2.2 + .4 * Math.cos(1.3 * x), A_ = .5, B_ = 3.5;
function vRegion(w, h, T, extra) {
  T = T || {};
  const low = rng_(A_, B_).map(x => [x, g1(x)]), up = rng_(B_, A_).map(x => [x, g2(x)]);
  return { type: 'graph2d', x: [0, 4], y: [-.45, 3.1], w, h, overlap: true, build: .5, ...(T.g || {}), layers: [
    CV(low.concat(up), { color: 'amber', w: 0, fill: true, fillAlpha: .26, dur: 1.0, ...T.fill }),
    CV(low, { color: 'amber', w: 6, dur: 1.0, ...T.c1 }), CV(up, { color: 'amber', w: 6, dur: 1.0, ...T.c2 }),
    CV(lin([A_, 0], [A_, g2(A_)]), { color: 'grey', w: 3, dash: '10 9', dur: .6, ...T.v }), CV(lin([B_, 0], [B_, g2(B_)]), { color: 'grey', w: 3, dash: '10 9', dur: .6, ...T.v }),
    LB([2.2, g1(2.2)], '$g_1$', 6, 56, 'amber', T.l1), LB([B_, g2(B_)], '$g_2$', 20, -10, 'amber', T.l2),
    LB([A_, 0], '$a$', 0, 42, 'grey', T.la), LB([B_, 0], '$b$', 0, 42, 'grey', T.la), LB([2.0, 1.45], '$R$', 0, 0, 'mint', T.lR),
    ...(extra || []) ] };
}
const vstrip = (x, dw) => [[x, g1(x)], [x + dw, g1(x + dw)], [x + dw, g2(x + dw)], [x, g2(x)], [x, g1(x)]];
const h1 = y => .4 + .3 * Math.sin(y), h2 = y => 2.2 + .4 * Math.cos(1.3 * y), C_ = .5, D_ = 3.5;
function hRegion(w, h, T, extra) {
  T = T || {};
  const lf = rng_(C_, D_).map(y => [h1(y), y]), rt = rng_(D_, C_).map(y => [h2(y), y]);
  return { type: 'graph2d', x: [-.5, 3.3], y: [-.1, 4], w, h, overlap: true, build: .5, ...(T.g || {}), layers: [
    CV(lf.concat(rt), { color: 'amber', w: 0, fill: true, fillAlpha: .26, dur: 1.0, ...T.fill }),
    CV(lf, { color: 'amber', w: 6, dur: 1.0, ...T.c1 }), CV(rt, { color: 'amber', w: 6, dur: 1.0, ...T.c2 }),
    CV(lin([0, C_], [h2(C_), C_]), { color: 'grey', w: 3, dash: '10 9', dur: .6, ...T.v }), CV(lin([0, D_], [h2(D_), D_]), { color: 'grey', w: 3, dash: '10 9', dur: .6, ...T.v }),
    LB([h1(2.0), 2.0], '$h_1$', -16, 0, 'amber', T.l1), LB([h2(D_), D_], '$h_2$', 20, -30, 'amber', T.l2),
    LB([0, C_], '$c$', -34, 0, 'grey', T.la), LB([0, D_], '$d$', -34, 0, 'grey', T.la), LB([1.3, 2.0], '$R$', 0, 0, 'mint', T.lR),
    ...(extra || []) ] };
}
const hstrip = (y, dh) => [[h1(y), y], [h2(y), y], [h2(y + dh), y + dh], [h1(y + dh), y + dh], [h1(y), y]];

/* ---- circle / ellipse region (a16, a17) ---- */
const upper = arc(2, 0, PI, 60).concat(arc(2, PI, 0, 60, .5)), lower = arc(2, PI, 2 * PI, 60).concat(arc(2, 2 * PI, PI, 60, .5));
function ringFig(w, h, T, extra) {
  T = T || {};
  return { type: 'graph2d', x: [-2.6, 2.6], y: [-2.3, 2.6], w, h, overlap: true, build: .5, ...(T.g || {}), layers: [
    CV(upper, { color: 'amber', w: 0, fill: true, fillAlpha: .4, dur: .9, ...T.fu }),
    CV(lower, { color: 'mint', w: 0, fill: true, fillAlpha: .4, dur: .9, ...T.fl }),
    CV(arc(2, 0, 2 * PI, 90), { color: 'ink', w: 5, dur: 1.0, ...T.c }), CV(arc(2, 0, 2 * PI, 90, .5), { color: 'ink', w: 5, dur: 1.0, ...T.e }),
    LB([.2, 2.3], '$x^2+y^2=4$', 0, 0, 'ink', { size: 42, msize: 50, ...T.lc }), LB([-.85, .3], '$x^2+4y^2=4$', 0, 0, 'ink', { size: 42, msize: 50, ...T.le }),
    LB([-1.2, 1.2], '$R_1$', 0, 0, 'amber', { size: 50, msize: 62, ...T.l1 }), LB([-1.2, -1.2], '$R_2$', 0, 0, 'mint', { size: 50, msize: 62, ...T.l2 }),
    ...(extra || []) ] };
}
const sq = x => Math.sqrt(Math.max(0, 4 - x * x));
const rS = (x, dw, sgn) => [[x, sgn * sq(x) / 2], [x + dw, sgn * sq(x + dw) / 2], [x + dw, sgn * sq(x + dw)], [x, sgn * sq(x)], [x, sgn * sq(x) / 2]];

/* ---------- 3D helpers ---------- */
const FS = (x, y) => 2 + .6 * Math.sin(x) * Math.cos(y);
const S3 = { fn: FS, x: [0, 3], y: [0, 2], z: [0, 3.2], zs: 1.0 };
function surf3(w, h, layers, extra) { return Object.assign({ type: 'graph3d', ...S3, w, h, overlap: true, build: 1.6, az: -38, el: 26, pad: [30, 20, 20, 20], layers }, extra || {}); }
function slabs(ns, nx, frac) { const out = [], dy = 2 / ns; for (let j = 0; j < ns; j++) { const yc = (j + .5) * dy; for (let i = 0; i < nx; i++) { const x0 = 3 * i / nx, x1 = 3 * (i + 1) / nx; out.push([x0, x1, yc - frac * dy / 2, yc + frac * dy / 2, 0, FS((x0 + x1) / 2, yc)]); } } return out; }
const LB3 = (p, tex, dx, dy, color, o) => LB(p, tex, dx, dy, color, Object.assign({ r: 9 }, o));
const hl = (cue, extra) => Object.assign({ type: 'highlight', color: '#6fd3b0', alpha: .38, cue, dur: .8 }, extra);

(window.LESSON_PARTS = window.LESSON_PARTS || {}).A = { scenes: [

  /* ---------------- a00 : title ---------------- */
  { seg: 'a00', items: [
    { type: 'space', h: 260 },
    { type: 'title', text: 'Ardışık İntegraller', sub: 'Analiz III', cue: 'Herkese merhaba', off: .1 },
    { type: 'text', text: 'iki katlı integral $\\to$ <mint>iki tek katlı integral</mint>', size: 52, color: 'grey', align: 'center', cue: 'Bugün', mt: 110, dur: 2.4 },
  ] },

  /* ---------------- a01 : vertical simple, I_R ---------------- */
  { seg: 'a01', items: [
    PG,
    { type: 'row', gap: 30, mt: 0, items: [
      { type: 'col', gap: 20, items: [
        SEC('Dikey basit bölge', 'Fe', { dur: .9 }),
        { type: 'text', text: '$f$, $R$ üzerinde sürekli', cue: 'basit', dur: 1.8, size: 50, mt: 20 },
        { type: 'math', tex: 'R=\\{\\,a\\le x\\le b,', align: 'left', cue: 'iks', dur: 1.5, mt: 20, size: 62 },
        { type: 'math', tex: '\\quad\\ g_1(x)\\le y\\le g_2(x)\\,\\}', align: 'left', cue: 'ye ise', dur: 1.7, size: 62 },
      ] },
      vRegion(835, 500, { g: { cue: 'Fe', off: .3 }, c1: { cue: 'dikey', off: .2 }, c2: { cue: 'dikey', off: .5 }, fill: { cue: 'bölgesinde', off: .2 }, v: { cue: 'iks', off: .1 }, la: { cue: 'a ile', off: .1 }, l1: { cue: 'ge bir', off: -.2 }, l2: { cue: 'ge iki', off: -.2 }, lR: { cue: 'bölgesinde', off: .8 } }, [
        strip1('v_', vstrip(1.6, .1), { cue: 'Önce', off: .3 }, 'amber', 'v0'),
        ...sweep('v', 9, i => vstrip(.6 + i * .33, .1), { cue: 'sonra', off: 0 }, .34, 'amber', .6),
      ]),
    ] },
    { type: 'math', tex: 'I_R=\\int_a^b\\Big(\\amber{\\int_{g_1(x)}^{g_2(x)}f(x,y)\\,dy}\\Big)\\,dx', size: 62, cue: 'Önce', off: .1, dur: 5.2, mt: 22 },
    { type: 'text', text: '$I_R$ = <mint>ardışık integral</mint>', size: 52, cue: 'ardışık', dur: 1.6, mt: 14 },
    { type: 'text', text: '<amber>içteki: $y$\'ye göre</amber>,  sonra  <mint>çıkan sonuç: $x$\'e göre</mint>', size: 50, cue: 'Yani önce', dur: 3.8 },
  ] },

  /* ---------------- a02 : horizontal simple, J_R ---------------- */
  { seg: 'a02', items: [
    PG,
    { type: 'row', gap: 30, mt: 0, items: [
      { type: 'col', gap: 20, items: [
        SEC('Yatay basit bölge', 'Yatay', { dur: .9 }),
        { type: 'math', tex: 'R=\\{\\,c\\le y\\le d,', align: 'left', cue: 'sıra', dur: 1.1, mt: 20, size: 62 },
        { type: 'math', tex: '\\quad\\ h_1(y)\\le x\\le h_2(y)\\,\\}', align: 'left', cue: 'önce', dur: 1.4, size: 62 },
      ] },
      hRegion(835, 450, { g: { cue: 'Yatay', off: .3 }, c1: { cue: 'Yatay', off: .9 }, c2: { cue: 'Yatay', off: 1.2 }, fill: { cue: 'de', off: 0 }, v: { cue: 'sıra', off: .3 }, la: { cue: 'ce\'den', off: 0 }, l1: { cue: 'ha bir', off: 0 }, l2: { cue: 'ha iki', off: 0 }, lR: { cue: 'tersine', off: .5 } }, [
        strip1('h_', hstrip(1.2, .1), { cue: 'önce', off: .3 }, 'amber', 'h0'),
        ...sweep('h', 9, i => hstrip(.6 + i * .32, .1), { cue: 'sonra', off: 0 }, .34, 'amber', .6),
      ]),
    ] },
    { type: 'math', tex: 'J_R=\\int_c^d\\Big(\\amber{\\int_{h_1(y)}^{h_2(y)}f(x,y)\\,dx}\\Big)\\,dy', size: 62, cue: 'iks\'e', off: 1.5, dur: 3.5, mt: 22 },
    { type: 'text', text: '$J_R$ = <mint>ardışık integral</mint>', size: 52, cue: 'je er', dur: 1.5, mt: 14 },
    { type: 'text', text: 'parantezsiz: $\\int_a^b dx\\int_{g_1(x)}^{g_2(x)} f\\,dy$', size: 50, color: 'grey', cue: 'Bu ifadeler', dur: 2.6 },
    { type: 'text', text: 'hangi yazım olursa olsun: <mint>içten dışa</mint>', size: 52, cue: 'Hangi yazımı', dur: 3.0 },
  ] },

  /* ---------------- a03 : note ---------------- */
  { seg: 'a03', items: [
    PG,
    { type: 'space', h: 40 },
    { type: 'note', label: 'NOT', cue: 'Burada', items: [
      { type: 'text', text: 'İçteki integralde <coral>diğer değişken sabit</coral>', size: 66, cue: 'içteki', dur: 3.0, mt: 14 },
      { type: 'text', text: '$y$\'ye göre integral alırken $x$ sadece bir <amber>sayı</amber>', size: 54, cue: 'Ye\'ye göre', dur: 2.0, mt: 20 },
    ] },
    { type: 'math', tex: '\\int_0^1 2\\,\\coral{x}\\,y\\,dy\\ =\\ \\coral{x}\\,\\Big[y^2\\Big]_0^1\\ =\\ \\coral{x}', size: 72, align: 'center', cue: 'sadece', off: .1, dur: 1.5, mt: 70 },
    { type: 'text', text: 'kısmi türevin tersi gibi düşün', size: 56, color: 'grey', align: 'center', cue: 'Kısmi', mt: 90, dur: 2.2 },
  ] },

  /* ---------------- a04 : example 1 question ---------------- */
  { seg: 'a04', items: [
    PG,
    { type: 'row', gap: 30, mt: 0, items: [
      { type: 'col', gap: 22, items: [
        SEC('Örnek 1', 'İlk', { dur: .6 }),
        { type: 'math', tex: 'f(x,y)=2xy+3y^2', align: 'left', size: 66, color: 'amber', cue: 'fe', dur: 2.6, mt: 20 },
        { type: 'math', tex: 'R=[0,2]\\times[0,1]', align: 'left', size: 62, cue: 'bölge de', dur: 1.5, mt: 20 },
        { type: 'text', text: '$0\\le x\\le2,\\quad 0\\le y\\le1$', size: 52, color: 'grey', cue: 'ye\'nin', dur: 1.8 },
        { type: 'text', text: 'hem <mint>dikey</mint> hem <mint>yatay</mint> basit', size: 54, cue: 'Bu bölge hem', dur: 2.0, mt: 36 },
        { type: 'text', text: '$\\Rightarrow$ iki sırayla da hesapla', size: 52, cue: 'iki sırayla', dur: 1.4, mt: 14 },
        { type: 'text', text: '$I_R$ (önce $y$)  ve  $J_R$ (önce $x$)', size: 50, cue: 'İkisini', dur: 1.6 },
      ] },
      rectFig(835, 620, { g: { cue: 'İlk', off: .6 }, rect: { cue: 'bölge de', off: .4 }, lab: { cue: 'sıfırla iki', off: .3 }, lR: { cue: 'dikdörtgen', off: .2 } }),
    ] },
  ] },

  /* ---------------- a05 : I_R ---------------- */
  { seg: 'a05', items: [
    PG,
    { type: 'row', gap: 30, mt: 0, items: [
      { type: 'col', gap: 14, items: [
        { type: 'text', text: '$I_R$ : önce <amber>$y$</amber>, sonra <mint>$x$</mint>', size: 52, weight: 700, cue: 'Önce', dur: .7 },
        { type: 'math', tex: '\\int_0^1(2xy+3y^2)\\,dy', align: 'left', size: 56, cue: 'İçteki', dur: 1.4, mt: 20 },
        { type: 'math', tex: '=\\Big[xy^2+y^3\\Big]_0^1', align: 'left', size: 56, cue: 'iki iks', dur: 3.6 },
        { type: 'math', tex: '=\\mint{x+1}', align: 'left', size: 60, cue: 'iks artı bir', dur: 1.0 },
        { type: 'math', tex: '\\int_0^2(x+1)\\,dx', align: 'left', size: 56, cue: 'Şimdi bunu', dur: 1.6, mt: 24 },
        { type: 'math', tex: '=\\Big[\\tfrac{x^2}{2}+x\\Big]_0^2', align: 'left', size: 56, cue: 'iks kare bölü', dur: 1.7 },
        { type: 'math', tex: '=2+2=\\mint{4}', align: 'left', size: 68, cue: 'iki\'yi', dur: 1.4, id: 'r4' },
        hl('yani dört', { target: 'r4' }),
      ] },
      rectFig(835, 560, { g: { cue: 'Önce', off: -.5 }, rect: { cue: 'Önce', off: -.4, dur: .5 }, lab: { cue: 'Önce', off: .1 }, lR: { cue: 'Önce', off: .1 } }, [
        strip1('p_', [[.9, 0], [1.0, 0], [1.0, 1], [.9, 1], [.9, 0]], { cue: 'İçteki', off: .3 }, 'amber', 'p0'),
        LB([.95, 1], '$y$', 6, -34, 'amber', { cue: 'integral', off: 0 }),
        ...sweep('p', 10, i => [[.05 + i * .19, 0], [.15 + i * .19, 0], [.15 + i * .19, 1], [.05 + i * .19, 1], [.05 + i * .19, 0]], { cue: 'Şimdi bunu', off: .2 }, .27, 'amber', .6),
      ]),
    ] },
  ] },

  /* ---------------- a06 : J_R ---------------- */
  { seg: 'a06', items: [
    PG,
    { type: 'row', gap: 30, mt: 0, items: [
      { type: 'col', gap: 14, items: [
        { type: 'text', text: '$J_R$ : önce <amber>$x$</amber>, sonra <mint>$y$</mint>', size: 52, weight: 700, cue: 'Şimdi', dur: 1.2 },
        { type: 'math', tex: '\\int_0^2(2xy+3y^2)\\,dx', align: 'left', size: 56, cue: 'İçte', dur: 1.4, mt: 20 },
        { type: 'math', tex: '=\\Big[x^2y+3xy^2\\Big]_0^2', align: 'left', size: 56, cue: 'iki iks', off: .8, dur: 2.9 },
        { type: 'math', tex: '=\\mint{4y+6y^2}', align: 'left', size: 60, cue: 'dört ye', dur: 1.8 },
        { type: 'math', tex: '\\int_0^1(4y+6y^2)\\,dy', align: 'left', size: 56, cue: 'Dışta', dur: 1.0, mt: 24 },
        { type: 'math', tex: '=\\Big[2y^2+2y^3\\Big]_0^1', align: 'left', size: 56, cue: 'iki ye kare', off: .2, dur: 1.3 },
        { type: 'math', tex: '=2+2=\\mint{4}', align: 'left', size: 68, cue: 'bir\'i', dur: .8, id: 'r4' },
        hl('yine', { target: 'r4' }),
      ] },
      { type: 'col', gap: 30, items: [
        rectFig(835, 500, { g: { cue: 'Şimdi', off: -.5 }, rect: { cue: 'Şimdi', off: -.4, dur: .5 }, lab: { cue: 'Şimdi', off: .1 }, lR: { cue: 'Şimdi', off: .1 } }, [
          strip1('q_', [[0, .45], [2, .45], [2, .55], [0, .55], [0, .45]], { cue: 'İçte', off: .3 }, 'amber', 'q0'),
          LB([2, .5], '$x$', 22, -2, 'amber', { cue: 'integral', off: 0 }),
          ...sweep('q', 8, i => [[0, .04 + i * .12], [2, .04 + i * .12], [2, .14 + i * .12], [0, .14 + i * .12], [0, .04 + i * .12]], { cue: 'Dışta', off: .1 }, .3, 'amber', .6),
        ]),
        { type: 'math', tex: '\\mint{I_R=4=J_R}', size: 84, align: 'center', cue: 'yine', dur: 1.0, mt: 40 },
      ] },
    ] },
  ] },

  /* ---------------- a07 : coincidence? ---------------- */
  { seg: 'a07', items: [
    PG,
    { type: 'space', h: 40 },
    { type: 'text', text: 'İki farklı sıra, <mint>aynı sonuç</mint>', size: 68, align: 'center', cue: 'İki farklı', dur: 1.2 },
    { type: 'math', tex: 'I_R=4\\qquad J_R=4', size: 84, align: 'center', cue: 'sonuç', dur: .8, mt: 50 },
    { type: 'text', text: 'Tesadüf mü?', size: 100, weight: 700, color: 'amber', align: 'center', cue: 'tesadüf', dur: .7, mt: 80 },
    { type: 'math', tex: 'I_R\\ \\overset{?}{=}\\ J_R', size: 90, align: 'center', cue: 'örnek daha', off: -.3, dur: .9, mt: 50 },
    { type: 'text', text: 'bir örnek daha: bu sefer bölge <coral>dikdörtgen değil</coral>', size: 52, color: 'grey', align: 'center', cue: 'bu sefer', mt: 80, dur: 1.4 },
  ] },

  /* ---------------- a08 : example 2 question ---------------- */
  { seg: 'a08', items: [
    PG,
    { type: 'row', gap: 30, mt: 0, items: [
      { type: 'col', gap: 18, items: [
        SEC('Örnek 2', 'İkinci', { dur: .6 }),
        { type: 'math', tex: 'f(x,y)=x+2y', align: 'left', size: 66, color: 'amber', cue: 'fe', dur: 1.8, mt: 14 },
        { type: 'text', text: '$R$: $y=x^2$ altında, $0\\le x\\le1$', size: 50, cue: 'bölge de', dur: 3.0, mt: 14 },
        { type: 'text', text: '<amber>dikey basit:</amber>', size: 50, cue: 'Dikey', dur: .9, mt: 40 },
        { type: 'math', tex: '0\\le x\\le1,\\quad 0\\le y\\le x^2', align: 'left', size: 54, cue: 'sıfırla iks', off: -.3, dur: 2.2 },
        { type: 'text', text: '<mint>yatay basit:</mint>', size: 50, cue: 'Yatay', dur: .9, mt: 30 },
        { type: 'math', tex: '0\\le y\\le1,\\quad \\sqrt{y}\\le x\\le1', align: 'left', size: 54, cue: 'bakarsak', off: .5, dur: 2.8 },
      ] },
      parFig(800, 720, { g: { cue: 'İkinci', off: .5 }, c: { cue: 'eşittir', off: 1.6 }, lc: { cue: 'parabolünün', off: .5 }, fill: { cue: 'altında', off: .0 }, v: { cue: 'bir arasında', off: 0 }, lab: { cue: 'bir arasında', off: .2 }, lR: { cue: 'kalan', off: .3 } }, [
        strip1('s_', vS(.7, .05), { cue: 'Dikey', off: .3 }, 'amber', 'u_'),
        strip1('u_', hS(.3, .04), { cue: 'Yatay', off: .3 }, 'mint'),
      ]),
    ] },
  ] },

  /* ---------------- a09 : I_R = 9/20 ---------------- */
  { seg: 'a09', items: [
    PG,
    { type: 'row', gap: 30, mt: 0, items: [
      { type: 'col', gap: 14, items: [
        { type: 'text', text: '$I_R$ : önce <amber>$y$</amber>, sonra <mint>$x$</mint>', size: 52, weight: 700, cue: 'Önce', dur: .7 },
        { type: 'math', tex: '\\int_0^{x^2}(x+2y)\\,dy', align: 'left', size: 56, cue: 'İçte', dur: 1.6, mt: 20 },
        { type: 'math', tex: '=\\Big[xy+y^2\\Big]_0^{x^2}', align: 'left', size: 56, cue: 'iks ye', dur: 2.4 },
        { type: 'math', tex: '=\\mint{x^3+x^4}', align: 'left', size: 60, cue: 'iks küp', dur: 1.6 },
        { type: 'math', tex: '\\int_0^1(x^3+x^4)\\,dx', align: 'left', size: 56, cue: 'Dışta', dur: 1.4, mt: 24 },
        { type: 'math', tex: '=\\tfrac14+\\tfrac15', align: 'left', size: 56, cue: 'dörtte bir', dur: 1.4 },
        { type: 'math', tex: '=\\mint{\\tfrac{9}{20}}', align: 'left', size: 72, cue: 'yirmide', dur: 1.0, id: 'r9' },
        hl('yirmide dokuz', { target: 'r9' }),
      ] },
      parFig(800, 720, { g: { cue: 'Önce', off: -.5 }, c: { cue: 'Önce', off: -.4, dur: .5 }, fill: { cue: 'Önce', off: -.4, dur: .5 }, v: { cue: 'Önce', off: -.4, dur: .5 }, lab: { cue: 'Önce', off: .1 }, lc: { cue: 'Önce', off: .1 }, lR: { cue: 'Önce', off: .1 } }, [
        strip1('t_', vS(.55, .06), { cue: 'İçte', off: .3 }, 'amber', 't0'),
        ...sweep('t', 14, i => vS(.02 + i * .07, .06), { cue: 'Dışta', off: .3 }, .25, 'amber', .6),
      ]),
    ] },
  ] },

  /* ---------------- a10 : J_R = 9/20 ---------------- */
  { seg: 'a10', items: [
    PG,
    { type: 'row', gap: 30, mt: 0, items: [
      { type: 'col', gap: 14, items: [
        { type: 'text', text: '$J_R$ : önce <amber>$x$</amber>, sonra <mint>$y$</mint>', size: 52, weight: 700, cue: 'Şimdi', dur: .9 },
        { type: 'math', tex: '\\int_{\\sqrt y}^{1}(x+2y)\\,dx', align: 'left', size: 54, cue: 'İçte', dur: 1.2, mt: 16 },
        { type: 'math', tex: '=\\Big[\\tfrac{x^2}{2}+2xy\\Big]_{\\sqrt y}^{1}', align: 'left', size: 54, cue: 'iks kare bölü', dur: 2.4 },
        { type: 'math', tex: '=\\mint{\\tfrac12+\\tfrac{3y}{2}-2y^{3/2}}', align: 'left', size: 54, cue: 'bir bölü iki', dur: 3.4 },
        { type: 'math', tex: '\\int_0^1\\Big(\\tfrac12+\\tfrac{3y}{2}-2y^{3/2}\\Big)dy', align: 'left', size: 50, cue: 'Dışta', dur: 1.7, mt: 16 },
        { type: 'math', tex: '=\\tfrac12+\\tfrac34-\\tfrac45', align: 'left', size: 54, cue: 'yarım', dur: 1.6 },
        { type: 'math', tex: '=\\mint{\\tfrac{9}{20}}', align: 'left', size: 72, cue: 'bu da', dur: 1.0, id: 'r9' },
        hl('yirmide dokuz', { target: 'r9' }),
      ] },
      { type: 'col', gap: 20, items: [
        parFig(800, 580, { g: { cue: 'Şimdi', off: -.5 }, c: { cue: 'Şimdi', off: -.4, dur: .5 }, fill: { cue: 'Şimdi', off: -.4, dur: .5 }, v: { cue: 'Şimdi', off: -.4, dur: .5 }, lab: { cue: 'Şimdi', off: .1 }, lc: { cue: 'Şimdi', off: .1 }, lR: { cue: 'Şimdi', off: .1 } }, [
          strip1('w_', hS(.3, .04), { cue: 'İçte', off: .3 }, 'mint', 'w0'),
          ...sweep('w', 14, i => hS(.01 + i * .07, .06), { cue: 'Dışta', off: .3 }, .25, 'mint', .6),
        ]),
        { type: 'math', tex: '\\mint{I_R=J_R=\\tfrac{9}{20}}', size: 72, align: 'center', cue: 'dokuz', dur: .9, mt: 10 },
      ] },
    ] },
  ] },

  /* ---------------- a11 : Fubini theorem ---------------- */
  { seg: 'a11', items: [
    PG,
    { type: 'space', h: 70 },
    { type: 'theorem', label: 'TEOREM (FUBİNİ)', cue: 'Bunun', mt: 40, hyp: [
      { type: 'text', text: '$f$ sürekli,  $R$ <amber>yatay basit</amber> bölge:', size: 58, cue: 'fe', dur: 2.0, mt: 8 },
      { type: 'math', tex: 'R=\\{(x,y):\\ c\\le y\\le d,\\ h_1(y)\\le x\\le h_2(y)\\}', size: 60, align: 'left', cue: 'sürekliyse', dur: 1.1, mt: 14 },
    ], concl: [
      { type: 'math', tex: '\\iint_R f\\,dA=\\int_c^d\\Big(\\int_{h_1(y)}^{h_2(y)}f(x,y)\\,dx\\Big)dy', size: 66, align: 'left', cue: 'er üzerindeki', dur: 3.6, mt: 40 },
      { type: 'text', text: 'yani  $\\iint_R f\\,dA=J_R$', size: 62, cue: 'eşittir', dur: .6, mt: 24 },
    ] },
    { type: 'text', text: 'limit hesabı yok: <mint>iki tek değişkenli integral</mint>', size: 56, color: 'grey', align: 'center', cue: 'tanımdaki', mt: 100, dur: 3.6 },
  ] },

  /* ---------------- a12 : proof idea, cross-section ---------------- */
  { seg: 'a12', items: [
    PG,
    { type: 'row', gap: 30, mt: 6, items: [
      { type: 'col', gap: 22, items: [
        { type: 'text', text: 'İspatın fikri', weight: 700, color: 'amber', cue: 'İspatın', dur: .9, mt: 10 },
        { type: 'text', text: '$f\\ge0$ olsun', size: 54, cue: 'Fe', dur: .8, mt: 20 },
        { type: 'math', tex: 'J(y)=\\int_{h_1(y)}^{h_2(y)}f(x,y)\\,dx', align: 'left', size: 54, cue: 'içteki', dur: 2.0, mt: 20 },
        { type: 'text', text: '$y=\\tilde y$ sabit', size: 54, color: 'amber', cue: 'Ye\'yi', dur: 1.0, mt: 40 },
        { type: 'text', text: 'cismi bu düzlemle kes', size: 50, color: 'grey', cue: 'cismi', dur: 1.5 },
        { type: 'text', text: '<mint>$J(\\tilde y)$</mint> = kesitin alanı', size: 56, cue: 'kesitin', dur: 1.0, mt: 24 },
      ] },
      surf3(850, 720, [
        { kind: 'plane', y: 1, color: 'amber', alpha: .2, dur: 1.0, cue: 'Ye\'yi', off: .6 },
        { kind: 'curve', pts: s => { const x = 3 * s; return [x, 1, FS(x, 1)]; }, samples: 40, color: 'amber', w: 7, dur: 1.2, cue: 'kestiğimizde', off: -.2 },
        { kind: 'curve', pts: polyF3([[0, 1, 0], [3, 1, 0]].concat(rng_(3, 0, 40).map(x => [x, 1, FS(x, 1)]), [[0, 1, 0]])), samples: 43, color: 'mint', w: 3, fill: true, fillAlpha: .55, dur: 1.2, cue: 'kesitin', off: 0 },
        LB3([3, 1, 0], '$\\tilde y$', 14, 40, 'amber', { cue: 'Ye\'yi', off: 1.0 }),
        LB3([1.5, 1, 1.0], '$J(\\tilde y)$', 0, 0, 'ink', { size: 52, msize: 62, r: 0, cue: 'alanını', off: .0 }),
      ], { surfAlpha: .55, cue: 'İspatın', off: .3, fitPts: [[0, 1, 0], [3, 1, 3.2]] }),
    ] },
  ] },

  /* ---------------- a13 : slices -> volume ---------------- */
  { seg: 'a13', items: [
    PG,
    { type: 'row', gap: 30, mt: 6, items: [
      { type: 'col', gap: 16, items: [
        { type: 'text', text: 'ince dilimler', weight: 700, color: 'amber', cue: 'ince', dur: 1.0, mt: 10 },
        { type: 'text', text: 'dilimin hacmi $\\approx$', size: 50, cue: 'Her', dur: 1.0, mt: 14 },
        { type: 'math', tex: 'J(\\tilde y)\\cdot\\Delta y', align: 'left', size: 58, color: 'amber', cue: 'alanı çarpı', off: -.5, dur: 1.6 },
        { type: 'math', tex: 'V\\approx\\sum_j J(y_j)\\,\\Delta y', align: 'left', size: 56, cue: 'topladığımızda', off: -.5, dur: 1.4, mt: 26 },
        { type: 'math', tex: 'V=\\int_c^d J(y)\\,dy=\\mint{J_R}', align: 'left', size: 56, cue: 'kalınlık', nth: 2, dur: 2.6 },
        { type: 'math', tex: 'V=\\iint_R f\\,dA', align: 'left', size: 56, cue: 'iki katlı', dur: 1.6, mt: 20 },
        { type: 'math', tex: '\\mint{\\iint_R f\\,dA=J_R}', align: 'left', size: 66, cue: 'ikisi', dur: 1.4, mt: 30, id: 'fin' },
      ] },
      surf3(850, 740, [
        { kind: 'box', id: 'sl1', boxes: slabs(4, 14, .55), color: 'amber', alpha: .9, dur: 1.0, cue: 'ince', off: .0, until: 'sl2' },
        { kind: 'box', id: 'sl2', boxes: slabs(10, 12, .6), color: 'amber', alpha: .9, dur: 1.0, cue: 'topladığımızda', off: -.5, until: 'sl3' },
        { kind: 'box', id: 'sl3', boxes: slabs(20, 10, .7), color: 'mint', alpha: .85, dur: 1.2, cue: 'kalınlık', nth: 2, off: .0 },
        LB3([0, 0, 1.9], '$V$', -24, -50, 'ink', { size: 60, msize: 72, r: 9, arrow: true, cue: 'hacmini', off: .5 }),
      ], { surfAlpha: .3, cue: 'Şimdi', off: .1 }),
    ] },
  ] },

  /* ---------------- a14 : conclusion ---------------- */
  { seg: 'a14', items: [
    PG,
    { type: 'text', text: 'Aynı fikirle dikey basit bölge için de: $\\iint_R f\\,dA=I_R$', size: 52, cue: 'Aynı', dur: 3.9, mt: 0 },
    { type: 'row', gap: 30, mt: 14, items: [
      vRegion(835, 440, { g: { cue: 'dikey', off: -.1 }, c1: { cue: 'dikey', off: .3 }, c2: { cue: 'dikey', off: .5 }, fill: { cue: 'dikey', off: .8 }, v: { cue: 'dikey', off: .6 }, la: { cue: 'bölge', off: .2 }, l1: { cue: 'bölge', off: .4 }, l2: { cue: 'bölge', off: .6 }, lR: { cue: 'bölge', off: .8 } }, [
        ...sweep('m', 8, i => vstrip(.6 + i * .33, .1), { cue: 'integralin', off: 0 }, .12, 'amber', .6),
        LB([.3, 2.85], '$I_R$', 0, 0, 'amber', { size: 56, msize: 64, cue: 'er\'ye', off: -.1 }),
      ]),
      hRegion(835, 440, { g: { cue: 'hem', off: -.5 }, c1: { cue: 'hem', off: -.1 }, c2: { cue: 'hem', off: .1 }, fill: { cue: 'hem', off: .4 }, v: { cue: 'basitse', off: 0 }, la: { cue: 'basitse', off: .2 }, l1: { cue: 'basitse', off: .4 }, l2: { cue: 'basitse', off: .6 }, lR: { cue: 'basitse', off: .8 } }, [
        ...sweep('n', 8, i => hstrip(.6 + i * .32, .1), { cue: 'je', off: -.2 }, .12, 'mint', .6),
        LB([1.0, 3.85], '$J_R$', 0, 0, 'mint', { size: 56, msize: 64, cue: 'je', off: .0 }),
      ]),
    ] },
    { type: 'theorem', label: 'SONUÇ', cue: 'iki katlı', nth: 2, mt: 34, hyp: [], concl: [
      { type: 'math', tex: '\\iint_R f\\,dA\\ =\\ I_R\\ =\\ J_R', size: 76, align: 'center', cue: 'iki katlı', nth: 2, off: .4, dur: 3.1, mt: 6 },
    ] },
    { type: 'text', text: 'iki sıra aynı sonucu verir', size: 50, color: 'grey', align: 'center', cue: 'Örneklerimizde', dur: 2.4, mt: 24 },
  ] },

  /* ---------------- a15 : order choice, dA = dx dy ---------------- */
  { seg: 'a15', items: [
    PG,
    { type: 'row', gap: 30, mt: 0, items: [
      { type: 'col', gap: 24, items: [
        SEC('Sıra seçimi', 'Pratikte', { dur: .9 }),
        { type: 'text', text: 'hangi sırayla integral alacağımızı <amber>biz seçeriz</amber>', size: 52, cue: 'hangi', dur: 1.6, mt: 14 },
        { type: 'text', text: 'bir sıra: <mint>kolay</mint>', size: 56, cue: 'Bazen', dur: 1.1, mt: 40 },
        { type: 'text', text: 'diğer sıra: <coral>zahmetli</coral>', size: 56, cue: 'diğeri', dur: 1.2 },
        { type: 'text', text: '$\\Rightarrow$ kolay olanı seç', size: 56, color: 'grey', cue: 'olabilir', dur: .6, mt: 30 },
      ] },
      { type: 'graph2d', x: [-.3, 3], y: [-.3, 2.2], w: 835, h: 520, overlap: true, build: .5, cue: 'Bundan', layers: [
        CV([[.6, .4], [2.7, .4], [2.7, 1.6], [.6, 1.6], [.6, .4]], { color: 'amber', w: 5, fill: true, fillAlpha: .12, dur: .9, cue: 'Bundan', off: .3 }),
        CV([[1.2, .7], [2.0, .7], [2.0, 1.3], [1.2, 1.3], [1.2, .7]], { color: 'mint', w: 5, fill: true, fillAlpha: .5, dur: .7, cue: 'yerine', off: -.2 }),
        LB([1.6, .7], '$dx$', 0, 44, 'amber', { cue: 'iks', off: -.1 }), LB([2.0, 1.0], '$dy$', 44, 0, 'amber', { cue: 'ye', off: -.1 }),
        LB([1.6, 1.0], '$dA$', 0, 0, 'ink', { size: 46, msize: 54, cue: 'yerine', off: .2 }),
      ] },
    ] },
    { type: 'math', tex: '\\iint_R f(x,y)\\,dA\\ =\\ \\iint_R f(x,y)\\,\\mint{dx\\,dy}', size: 70, align: 'center', cue: 'Bundan', off: .3, dur: 3.0, mt: 40 },
    { type: 'text', text: '<amber>$dA=dx\\,dy$</amber>', size: 60, align: 'center', cue: 'yazarak', dur: 1.0, mt: 16 },
  ] },

  /* ---------------- a16 : example 3 question ---------------- */
  { seg: 'a16', items: [
    PG,
    { type: 'row', gap: 30, mt: 0, items: [
      { type: 'col', gap: 18, items: [
        SEC('Örnek 3', 'Son', { dur: .7 }),
        { type: 'text', text: 'çember: $x^2+y^2=4$', size: 52, color: 'ink', cue: 'Er', dur: 2.3, mt: 30 },
        { type: 'text', text: 'elips: $x^2+4y^2=4$', size: 52, color: 'ink', cue: 'ile', dur: 2.2 },
        { type: 'text', text: '$R$: ikisi arasında kalan bölge', size: 50, cue: 'arasında', dur: 1.4, mt: 14 },
        { type: 'math', tex: '\\iint_R x^2\\,dA', size: 76, align: 'left', color: 'amber', cue: 'iks karenin', dur: 1.6, mt: 20 },
        { type: 'text', text: 'ortada elips var', size: 50, color: 'grey', cue: 'ortasında', off: -.4, dur: 1.4, mt: 30 },
        { type: 'text', text: '$\\to$ <amber>$R_1$ üst</amber>  ve  <mint>$R_2$ alt</mint>', size: 54, cue: 'üst', dur: 2.0 },
      ] },
      ringFig(835, 760, { g: { cue: 'Son', off: .5 }, c: { cue: 'çemberi', off: -.6 }, e: { cue: 'elipsi', off: -.6 }, lc: { cue: 'çemberi', off: .2 }, le: { cue: 'elipsi', off: .2 }, fu: { cue: 'üst ve alt', off: -.3, id: 'fu' }, fl: { cue: 'üst ve alt', off: .3 }, l1: { cue: 'üst ve alt', off: .6 }, l2: { cue: 'üst ve alt', off: 1.0 } }, [
        CV(upper, { color: 'ink', w: 0, fill: true, fillAlpha: .22, dur: .8, cue: 'kalan', until: 'fu' }),
        CV(lower, { color: 'ink', w: 0, fill: true, fillAlpha: .22, dur: .8, cue: 'kalan', until: 'fu' }),
      ]),
    ] },
  ] },

  /* ---------------- a17 : inner integral ---------------- */
  { seg: 'a17', items: [
    PG,
    { type: 'row', gap: 30, mt: 0, items: [
      { type: 'col', gap: 14, items: [
        { type: 'text', text: '<amber>$R_1$</amber> (üst parça)', size: 52, weight: 700, cue: 'Üst', dur: .9 },
        { type: 'math', tex: '-2\\le x\\le2', align: 'left', size: 54, cue: 'iks', off: .3, dur: 1.4, mt: 10 },
        { type: 'math', tex: '\\tfrac12\\sqrt{4-x^2}\\le y\\le\\sqrt{4-x^2}', align: 'left', size: 54, cue: 'ye ise', dur: 3.6 },
        { type: 'math', tex: '\\int_{\\frac12\\sqrt{4-x^2}}^{\\sqrt{4-x^2}}x^2\\,dy', align: 'left', size: 56, cue: 'İçteki', dur: 1.0, mt: 20 },
        { type: 'math', tex: '=\\mint{\\tfrac12\\,x^2\\sqrt{4-x^2}}', align: 'left', size: 58, cue: 'iks kare çarpı', dur: 2.2 },
        { type: 'text', text: '<mint>$R_2$</mint> simetrik: <grey>aynı katkı</grey>', size: 50, cue: 'Alt', dur: 2.0, mt: 20 },
        { type: 'math', tex: '\\iint_R x^2\\,dA', align: 'left', size: 54, cue: 'Toplamda', dur: 1.0, mt: 14 },
        { type: 'math', tex: '=\\mint{\\int_{-2}^{2}x^2\\sqrt{4-x^2}\\,dx}', align: 'left', size: 58, cue: 'ikiden', dur: 3.4 },
      ] },
      ringFig(835, 760, { g: { cue: 'Üst', off: -.5 }, c: { cue: 'Üst', off: -.4, dur: .5 }, e: { cue: 'Üst', off: -.4, dur: .5 }, lc: { cue: 'Üst', off: .1 }, le: { cue: 'Üst', off: .1 }, fu: { cue: 'Üst', off: -.4, dur: .5 }, fl: { cue: 'Üst', off: -.4, dur: .5 }, l1: { cue: 'Üst', off: .2 }, l2: { cue: 'Üst', off: .2 } }, [
        strip1('z_', rS(.8, .08, 1), { cue: 'ye ise', off: .0 }, 'amber', 'z0'),
        ...sweep('z', 12, i => rS(-1.9 + i * .33, .08, 1), { cue: 'İçteki', off: 1.3 }, .22, 'amber', .75, { until: 'y_' }),
        strip1('y_', rS(-.5, .08, -1), { cue: 'Alt', off: .2 }, 'mint'),
      ]),
    ] },
  ] },

  /* ---------------- a18 : substitution ---------------- */
  { seg: 'a18', items: [
    PG,
    { type: 'math', tex: 'x=2\\sin t,\\qquad dx=2\\cos t\\,dt', size: 56, align: 'left', color: 'amber', cue: 'Burada', dur: 3.5, mt: 0 },
    { type: 'math', tex: '\\int_{-2}^{2}x^2\\sqrt{4-x^2}\\,dx=16\\int_{-\\pi/2}^{\\pi/2}\\sin^2t\\cos^2t\\,dt', size: 54, align: 'left', cue: 'İntegral', dur: 3.6, mt: 6 },
    { type: 'math', tex: '=4\\int_{-\\pi/2}^{\\pi/2}\\sin^2 2t\\,dt', size: 54, align: 'left', cue: 'Bu da', dur: 1.8, mt: 6 },
    { type: 'math', tex: '=2\\int_{-\\pi/2}^{\\pi/2}(1-\\cos 4t)\\,dt', size: 54, align: 'left', cue: 'o da', dur: 2.0, mt: 6 },
    { type: 'math', tex: '=2\\Big[t-\\tfrac{\\sin 4t}{4}\\Big]_{-\\pi/2}^{\\pi/2}=2\\pi', size: 54, align: 'left', cue: 'terim', off: -.5, dur: 2.6, mt: 6 },
    { type: 'theorem', label: 'SONUÇ', cue: 'Yani', mt: 40, hyp: [], concl: [
      { type: 'math', tex: '\\iint_R x^2\\,dA=2\\pi', size: 76, align: 'center', cue: 'iki pi', nth: 2, dur: 1.2, mt: 6 },
    ] },
  ] },

  /* ---------------- a19 : summary ---------------- */
  { seg: 'a19', post: 2.5, items: [
    { type: 'page', at: -0.95 },
    SEC('Özet', 'Bugün', { dur: .3 }),
    { type: 'text', text: '<amber>•</amber>  <mint>ardışık integral</mint>', size: 60, cue: 'ardışık', mt: 44, dur: 1.0 },
    { type: 'text', text: '<amber>•</amber>  iki sırayla hesaplama: $I_R$, $J_R$', size: 60, cue: 'sırayla', mt: 36, dur: 1.5 },
    { type: 'text', text: '<amber>•</amber>  Fubini: <mint>aynı sonuç</mint>', size: 60, cue: 'aynı', mt: 36, dur: 1.2 },
    { type: 'math', tex: '\\mint{\\iint_R f\\,dA=I_R=J_R}', size: 70, align: 'center', cue: 'Artık', mt: 40, dur: 2.4 },
    { type: 'text', text: 'sonraki ders: üç katlı integral', size: 56, color: 'grey', cue: 'Bir', mt: 56, dur: 1.8 },
    { type: 'text', text: 'AHD Akademi', size: 60, color: 'grey', align: 'center', cue: 'Görüşmek', mt: 60, dur: .9 },
  ] },
] };
if (!window.__FULL) window.LESSON = { pad: { pre: .5, post: .7 }, overflow: 'scroll', scenes: window.LESSON_PARTS.A.scenes };
})();

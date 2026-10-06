/* lesson_parts/DEMO.js — 3D engine demo (unified depth: cols / wedge / solid / slices / orbit) + 2 classic graph3d scenes for regression.
   Standalone preview: index.html?lesson=lesson_parts/DEMO   (no narration: segments d1..d7 have fixed durations and no words; items use `at`) */
(function () {
const PI = Math.PI, D = PI / 180, PG = { type: 'page', at: -0.78 };
const SEC = (text, at, extra) => Object.assign({ type: 'text', text, weight: 700, color: 'amber', at, dur: 1.0 }, extra);
const TX = (text, at, extra) => Object.assign({ type: 'text', text, size: 48, at, dur: 1.4, mt: 18 }, extra);
const LB = (p, tex, dx, dy, color, o) => Object.assign({ kind: 'point', p, r: 0, label: tex, color, arrow: false, dx, dy, size: 44, msize: 50 }, o);
const seg3 = (a, b, o) => Object.assign({ kind: 'curve', pts: s => [a[0] + (b[0] - a[0]) * s, a[1] + (b[1] - a[1]) * s, a[2] + (b[2] - a[2]) * s], samples: 12, color: 'grey', w: 3, dur: .4, depth: true }, o);
const arc3 = (r, t0, t1, z, o) => Object.assign({ kind: 'curve', pts: s => { const t = t0 + (t1 - t0) * s; return [r * Math.cos(t), r * Math.sin(t), z]; }, samples: 40, color: 'grey', w: 3, dur: .5, depth: true }, o);
const sph = (R) => (u, v) => [R * Math.sin(u) * Math.cos(v), R * Math.sin(u) * Math.sin(v), R * Math.cos(u)];

/* fake narration timing for the demo segments (no audio): only durations */
const DUR = { d1: 12, d2: 10.5, d3: 11, d4: 12, d5: 11.5, d6: 7, d7: 8 };
window.WORDS = Object.assign({}, window.WORDS || {}, ...Object.entries(DUR).map(([k, v]) => ({ [k]: { duration: v, words: [] } })));

/* ---------- classic scenes copied from ders-uc-katli-integral (a01 ellipsoid, a17 parabolic cylinder) ---------- */
const polyF3 = arr => s => { const f = s * (arr.length - 1), i = Math.min(arr.length - 2, Math.floor(f)), u = f - i; return arr[i].map((v, k) => v + (arr[i + 1][k] - v) * u); };
const sq1 = (x, y) => Math.sqrt(Math.max(0, 1 - x * x - y * y));
const G1 = (x, y) => 1.3 - 1.0 * sq1(x, y), G2 = (x, y) => 1.3 + 1.0 * sq1(x, y);
const ellFig = (w, h, layers, extra) => Object.assign({ type: 'graph3d', fn: G1, fn2: G2, polar: 1, z: [0, 2.6], zs: 1.0, w, h, overlap: true, build: 1.6, az: -38, el: 26, pad: [30, 20, 20, 20], opWall: 0, surfAlpha: .6, layers }, extra || {});
const circ = (z, r = 1) => s => [r * Math.cos(2 * PI * s), r * Math.sin(2 * PI * s), z];
const LB3 = (p, tex, dx, dy, color, o) => Object.assign({ kind: 'point', p, r: 9, label: tex, color, arrow: false, dx, dy, size: 46, msize: 56 }, o);
const cylFig = (w, h, layers, extra) => Object.assign({ type: 'graph3d', fn: () => 0, x: [0, 4], y: [-2, 2], z: [0, 4], zs: 1.0, w, h, overlap: true, build: 1.4, az: -38, el: 26, pad: [30, 20, 20, 20], surfAlpha: .18, fitPts: [[0, -2, 4], [0, 2, 4], [4, -2, 0], [4, 2, 0], [0, -2, 0], [0, 2, 0]], layers }, extra || {});
const ys_ = n => Array.from({ length: n + 1 }, (_, i) => -2 + 4 * i / n);
const wallPoly = () => polyF3(ys_(40).map(y => [0, y, y * y]).concat([[0, 2, 4], [0, -2, 4]]));
const planePoly = () => polyF3(ys_(40).map(y => [4 - y * y, y, y * y]).concat([[0, 2, 4], [0, -2, 4], [0, -2, 4]]));
const stripsCyl = (at, step) => Array.from({ length: 32 }, (_, i) => { const y0 = -2 + 4 * i / 32, y1 = -2 + 4 * (i + 1) / 32; const P = [[0, y0, y0 * y0], [4 - y0 * y0, y0, y0 * y0], [4 - y1 * y1, y1, y1 * y1], [0, y1, y1 * y1], [0, y0, y0 * y0]]; return { kind: 'curve', pts: polyF3(P), samples: 4, color: 'amber', w: 0, fill: true, fillAlpha: .2, dur: .25, at: at + i * step }; });

const CP = (r, td, z) => [r * Math.cos(td * D), r * Math.sin(td * D), z];          // cylindrical point (theta in degrees)
const SP = (r, td, pd) => [r * Math.sin(pd * D) * Math.cos(td * D), r * Math.sin(pd * D) * Math.sin(td * D), r * Math.cos(pd * D)];
const PAR = (x, y) => 4 - x * x - y * y;
const R2 = Math.SQRT2;

window.LESSON_PARTS = window.LESSON_PARTS || {};
window.LESSON_PARTS.DEMO = { scenes: [

  /* ---------- d1 : Riemann columns under a paraboloid, n = 6 -> 12 ---------- */
  { seg: 'd1', items: [
    { type: 'row', gap: 30, items: [
      { type: 'col', gap: 16, items: [
        SEC('Riemann sütunları', .1),
        TX('$z=4-x^2-y^2$', .9, { color: 'amber', size: 52 }),
        TX('$V\\approx\\sum f(x_i,y_j)\\,\\Delta A$', 2.6, { size: 52 }),
        TX('<grey>$n=6$</grey>', 3.2, { dur: .5 }),
        TX('<mint>$n=12$: hacme yaklaşıyor</mint>', 6.2, { dur: 1.2 }),
      ] },
      { type: 'graph3d', fn: PAR, x: [-1.4, 1.4], y: [-1.4, 1.4], z: [0, 4], zs: 1.0, w: 835, h: 760, at: .3, build: 1.2, surfAlpha: .22, overlap: true, pad: [30, 20, 20, 20],
        layers: [
          { kind: 'cols', id: 'c6', n: 6, order: 'sweep', stagger: 1.6, grow: .5, at: 1.8, until: 'c12' },
          { kind: 'cols', id: 'c12', n: 12, order: 'sweep', stagger: 1.8, grow: .5, at: 6.0 },
        ] },
    ] },
  ] },

  /* ---------- d2 : hemisphere filled with disk slices ---------- */
  { seg: 'd2', items: [
    PG,
    { type: 'row', gap: 30, items: [
      { type: 'col', gap: 16, items: [
        SEC('Dilimlerle hacim', .1),
        TX('yarıküre  $x^2+y^2+z^2\\le 4,\\ z\\ge 0$', .8, { size: 46 }),
        TX('kesit: disk  $A(z)=\\pi(4-z^2)$', 2.6, { size: 46 }),
        TX('$V=\\int_0^2 \\pi(4-z^2)\\,dz=\\tfrac{16\\pi}{3}$', 5.2, { size: 52, color: 'mint', dur: 1.8 }),
      ] },
      { type: 'graph3d', x: [-2, 2], y: [-2, 2], z: [0, 2], aspect: 'equal', axes: 'origin', w: 835, h: 760, at: .3, build: .6, overlap: true, pad: [40, 20, 20, 20],
        layers: [
          { kind: 'solid', param: sph(2), u: [0, PI / 2], v: [0, 2 * PI], n: [12, 40], color: 'mint', alpha: .26, mesh: true, at: .7, dur: 1.4 },
          { kind: 'slices', axis: 'z', range: [0, 2], n: 8, disk: z => Math.sqrt(Math.max(0, 4 - z * z)), seg: 48, color: 'amber', stagger: 3.2, grow: .45, at: 2.8 },
        ] },
    ] },
  ] },

  /* ---------- d3 : polar columns (cylindrical wedge prisms) under z = 4 - r^2, camera orbit 40 deg ---------- */
  { seg: 'd3', items: [
    PG,
    { type: 'row', gap: 30, items: [
      { type: 'col', gap: 16, items: [
        SEC('Kutupsal sütunlar', .1),
        TX('$z=4-r^2,\\quad 0\\le r\\le 2$', .8, { color: 'amber', size: 52 }),
        TX('taban: halka dilimi  $r\\,\\Delta r\\,\\Delta\\theta$', 2.4, { size: 46 }),
        TX('$V\\approx\\sum f(r_i,\\theta_j)\\,r_i\\,\\Delta r\\,\\Delta\\theta$', 4.4, { size: 50, color: 'mint', dur: 1.8 }),
      ] },
      { type: 'graph3d', fn: (x, y) => 4 - x * x - y * y, polar: 2, z: [0, 4], zs: 1.0, w: 835, h: 760, at: .3, build: 1.2, surfAlpha: .28, overlap: true, pad: [30, 20, 20, 20],
        orbit: { to: -34 + 40, dur: 4.5, at: 5.2 },
        layers: [
          { kind: 'cols', r: [0, 2], th: [0, 2 * PI], n: [5, 16], order: 'radial', stagger: 2.2, grow: .55, at: 1.8 },
        ] },
    ] },
  ] },

  /* ---------- d4 : a cylindrical cell and a spherical cell ---------- */
  { seg: 'd4', items: [
    PG,
    SEC('Hacim elemanları', .1),
    TX('silindirik: <amber>$dV=r\\,dr\\,d\\theta\\,dz$</amber>     küresel: <mint>$dV=\\rho^2\\sin\\phi\\,d\\rho\\,d\\phi\\,d\\theta$</mint>', .6, { size: 46, dur: 2.2, mt: 8 }),
    { type: 'row', gap: 30, mt: 6, items: [
      { type: 'graph3d', x: [-.2, 1.8], y: [-.2, 1.8], z: [0, 1.4], aspect: 'equal', axes: 'origin', az: -72, el: 26, w: 835, h: 650, at: 1.0, build: .6, overlap: true, pad: [40, 30, 20, 30],
        layers: [
          arc3(1, 0, PI / 2, 0, { dash: '6 8', w: 2, at: 1.3 }), arc3(1.6, 0, PI / 2, 0, { dash: '6 8', w: 2, at: 1.4 }),
          seg3([0, 0, 0], CP(1.6, 20, 0), { w: 2, at: 1.5, dash: '6 8' }), seg3([0, 0, 0], CP(1.6, 60, 0), { w: 2, at: 1.5, dash: '6 8' }),
          seg3(CP(1, 20, 0), CP(1, 20, .5), { w: 2, at: 1.6, dash: '4 6' }), seg3(CP(1.6, 20, 0), CP(1.6, 20, .5), { w: 2, at: 1.6, dash: '4 6' }), seg3(CP(1.6, 60, 0), CP(1.6, 60, .5), { w: 2, at: 1.6, dash: '4 6' }),
          { kind: 'wedge', id: 'wc', r: [1, 1.6], th: [20 * D, 60 * D], z: [.5, 1.1], color: 'amber', at: 2.0, dur: 1.0, pulse: { at: 4.0, n: 2 } },
          seg3(CP(1, 60, 1.1), CP(1.6, 60, 1.1), { color: 'coral', w: 6, at: 3.0, bias: .05 }),
          arc3(1.6, 20 * D, 60 * D, 1.1, { color: 'mint', w: 6, at: 3.2, bias: .05 }),
          seg3(CP(1.6, 60, .5), CP(1.6, 60, 1.1), { color: 'coral', w: 6, at: 3.4, bias: .05 }),
          LB(CP(1.3, 60, 1.1), '$\\Delta r$', 10, -40, 'coral', { at: 3.0 }),
          LB(CP(1.6, 40, 1.1), '$r\\,\\Delta\\theta$', -40, 70, 'mint', { at: 3.2 }),
          LB(CP(1.6, 60, .8), '$\\Delta z$', 20, 0, 'coral', { at: 3.4 }),
          arc3(.55, 0, 20 * D, 0, { color: 'ink', w: 3, at: 1.7 }), LB(CP(.6, 10, 0), '$\\theta$', 12, 24, 'ink', { at: 1.8, size: 40, msize: 44 }),
        ] },
      { type: 'graph3d', x: [-.2, 1.8], y: [-.2, 1.8], z: [0, 1.9], aspect: 'equal', axes: 'origin', az: -72, el: 26, w: 835, h: 650, at: 5.6, build: .6, overlap: true, pad: [40, 30, 20, 30],
        layers: [
          seg3([0, 0, 0], SP(1.45, 40, 45), { dash: '6 8', w: 2, at: 5.9 }),
          seg3([0, 0, 0], CP(1.4, 40, 0), { dash: '6 8', w: 2, at: 5.9 }),
          { kind: 'curve', depth: true, pts: s => SP(.6, 40, 45 * s), samples: 20, color: 'ink', w: 3, dur: .5, at: 6.0 },
          arc3(.6, 0, 40 * D, 0, { color: 'ink', w: 3, at: 6.1 }),
          { kind: 'wedge', id: 'ws', sph: true, rho: [1.2, 1.8], th: [20 * D, 60 * D], phi: [30 * D, 60 * D], color: 'mint', at: 6.2, dur: 1.1, explode: .25, pulse: { at: 8.6, n: 2 } },
          LB(SP(.66, 40, 16), '$\\phi$', -4, -40, 'ink', { at: 7.0, size: 40, msize: 44 }),
          LB(CP(.65, 20, 0), '$\\theta$', 10, 26, 'ink', { at: 7.1, size: 40, msize: 44 }),
          LB(SP(.95, 40, 45), '$\\rho$', 18, 26, 'ink', { at: 7.2, size: 40, msize: 44 }),
        ] },
    ] },
  ] },

  /* ---------- d5 : ice-cream cone: sphere cap above the cone z = r, polar columns inside, orbit ---------- */
  { seg: 'd5', items: [
    PG,
    { type: 'row', gap: 30, items: [
      { type: 'col', gap: 16, items: [
        SEC('Dondurma külahı', .1),
        TX('küre  $x^2+y^2+z^2=4$', .8, { color: 'mint', size: 48 }),
        TX('koni  $z=\\sqrt{x^2+y^2}=r$', 1.6, { color: 'coral', size: 48 }),
        TX('$V=\\int_0^{2\\pi}\\!\\int_0^{\\sqrt2}\\!\\int_r^{\\sqrt{4-r^2}} r\\,dz\\,dr\\,d\\theta$', 3.6, { size: 52, dur: 2.2 }),
      ] },
      { type: 'graph3d', x: [-2, 2], y: [-2, 2], z: [0, 2.1], aspect: 'equal', axes: 'origin', w: 835, h: 760, at: .3, build: .6, overlap: true, pad: [40, 20, 20, 20],
        orbit: { to: -34 + 60, dur: 5, at: 5.5 },
        layers: [
          { kind: 'solid', param: (s, v) => [s * Math.cos(v), s * Math.sin(v), s], u: [0, R2], v: [0, 2 * PI], n: [8, 40], color: 'coral', alpha: .3, mesh: true, at: .7, dur: 1.2 },
          { kind: 'solid', param: sph(2), u: [0, PI / 4], v: [0, 2 * PI], n: [8, 40], color: 'mint', alpha: .3, mesh: true, at: 1.5, dur: 1.2 },
          { kind: 'cols', r: [0, R2], th: [0, 2 * PI], n: [4, 14], z0: (x, y) => Math.hypot(x, y), hi: (x, y) => Math.sqrt(Math.max(0, 4 - x * x - y * y)), color: 'amber', order: 'radial', stagger: 1.8, grow: .5, at: 3.0 },
        ] },
    ] },
  ] },

  /* ---------- d6 : classic graph3d (uc-katli a01): ellipsoid between g1 and g2 ---------- */
  { seg: 'd6', items: [
    PG,
    { type: 'row', gap: 30, items: [
      { type: 'col', gap: 20, items: [SEC('Klasik: $z$-basit bölge', .1, { dur: 1.3 })] },
      ellFig(835, 700, [
        { kind: 'curve', pts: circ(0), samples: 72, color: 'mint', w: 4, fill: true, fillAlpha: .35, dur: 1.0, at: 2.0 },
        LB3([.62, -.55, 0], '$R_{xy}$', 24, 30, 'mint', { at: 3.0, arrow: false, r: 0 }),
        { kind: 'curve', pts: circ(1.3), samples: 72, color: 'amber', w: 3, dur: 1.2, at: 3.4 },
        LB3([0, 0, 2.3], '$g_2$', 36, -14, 'amber', { at: 4.4 }),
        LB3([0, 0, .3], '$g_1$', 36, 34, 'mint', { at: 4.8 }),
      ], { at: .5 }),
    ] },
  ] },

  /* ---------- d7 : classic graph3d (uc-katli a17): parabolic cylinder + planes ---------- */
  { seg: 'd7', items: [
    PG,
    { type: 'row', gap: 30, items: [
      { type: 'col', gap: 18, items: [SEC('Klasik: $z=y^2$, $x+z=4$', .1, { dur: 1.2 })] },
      cylFig(835, 780, [
        { kind: 'curve', pts: wallPoly(), samples: 43, color: 'mint', w: 0, fill: true, fillAlpha: .3, dur: .9, at: 2.0 },
        ...stripsCyl(2.4, .03),
        { kind: 'curve', pts: planePoly(), samples: 44, color: 'coral', w: 0, fill: true, fillAlpha: .32, dur: .9, at: 3.6 },
        { kind: 'curve', pts: s => { const y = -2 + 4 * s; return [0, y, y * y]; }, samples: 40, color: 'amber', w: 6, dur: 1.2, at: 2.6 },
        { kind: 'curve', pts: s => [0, -2 + 4 * s, 4], samples: 2, color: 'mint', w: 5, dur: .8, at: 3.0 },
        { kind: 'curve', pts: s => { const y = -2 + 4 * s; return [4 - y * y, y, y * y]; }, samples: 40, color: 'coral', w: 6, dur: 1.2, at: 4.0 },
        LB3([0, -1.55, 2.4], '$z=y^2$', -14, 40, 'amber', { at: 4.6, arrow: false, r: 0, size: 44, msize: 52 }),
        LB3([0, 1.2, 3.9], '$x=0$', 0, -36, 'mint', { at: 5.0, arrow: false, r: 0, size: 44, msize: 52 }),
        LB3([2.2, 0, 1.8], '$x+z=4$', 0, -40, 'coral', { at: 5.4, arrow: false, r: 0, size: 44, msize: 52 }),
      ], { at: .3 }),
    ] },
  ] },
] };
if (!window.__FULL) window.LESSON = { pad: { pre: .5, post: .7 }, overflow: 'scroll', scenes: window.LESSON_PARTS.DEMO.scenes };
})();

// Usage: node tools/build_math.mjs   -> math_cache.js  (window.MATH = { tex: {w,asc,desc,g:[{d,c,len,x0,x1}]} })
// Collects every TeX string from lesson.js (field `tex`, and $...$ spans inside any other string) and pre-renders it
// with MathJax (SVG, no font cache). Coordinates: 1000 units = 1 em, baseline y=0, y grows downward.
import {mathjax} from 'mathjax-full/js/mathjax.js';
import {TeX} from 'mathjax-full/js/input/tex.js';
import {SVG} from 'mathjax-full/js/output/svg.js';
import {liteAdaptor} from 'mathjax-full/js/adaptors/liteAdaptor.js';
import {RegisterHTMLHandler} from 'mathjax-full/js/handlers/html.js';
import {AllPackages} from 'mathjax-full/js/input/tex/AllPackages.js';
import fs from 'fs'; import vm from 'vm'; import path from 'path'; import {fileURLToPath} from 'url';
const here = path.dirname(path.dirname(fileURLToPath(import.meta.url)));

const rgb = (r, g, b) => `{\\color[RGB]{${r},${g},${b}}#1}`;
const macros = {
  amber: [rgb(242, 180, 64), 1], mint: [rgb(111, 211, 176), 1], coral: [rgb(239, 122, 99), 1], grey: [rgb(169, 165, 150), 1],
  R: '\\mathbb{R}', grad: '\\nabla'
};
const adaptor = liteAdaptor(); RegisterHTMLHandler(adaptor);
const html = mathjax.document('', { InputJax: new TeX({ packages: AllPackages, macros }), OutputJax: new SVG({ fontCache: 'none' }) });

/* ---- collect TeX from lesson.js ---- */
const set = new Set(['x', 'y', 'z', 'P']);
const SKIP = new Set(['cue', 'type', 'id', 'seg', 'target', 'color', 'kind', 'surface', 'from']);
const LFILES = [...fs.readdirSync(here).filter(f => /^lesson.*\.js$/.test(f) && f !== 'lesson_full.js'), ...(fs.existsSync(here + '/lesson_parts') ? fs.readdirSync(here + '/lesson_parts').filter(f => f.endsWith('.js')).map(f => 'lesson_parts/' + f) : [])];
const LESSONS = LFILES.map(f => vm.runInNewContext('var window={};' + fs.readFileSync(here + '/' + f, 'utf8') + '\n;window.LESSON||LESSON', {}));
function walk(o, key) {
  if (typeof o === 'string') {
    if (key === 'tex') set.add(o);
    else if (!SKIP.has(key)) for (const m of o.matchAll(/\$([^$]+)\$/g)) set.add(m[1]);
  } else if (Array.isArray(o)) o.forEach(v => walk(v, key));
  else if (o && typeof o === 'object') for (const k in o) walk(o[k], k);
}
LESSONS.forEach(L => { walk(L); (L.mathExtra || []).forEach(t => set.add(t)); });

/* ---- affine matrices [a b c d e f] ---- */
const mul = (m, n) => [m[0] * n[0] + m[2] * n[1], m[1] * n[0] + m[3] * n[1], m[0] * n[2] + m[2] * n[3], m[1] * n[2] + m[3] * n[3], m[0] * n[4] + m[2] * n[5] + m[4], m[1] * n[4] + m[3] * n[5] + m[5]];
function parseT(s) {
  let m = [1, 0, 0, 1, 0, 0]; if (!s) return m;
  for (const t of s.matchAll(/(\w+)\(([^)]*)\)/g)) {
    const v = t[2].split(/[\s,]+/).filter(Boolean).map(Number);
    if (t[1] === 'translate') m = mul(m, [1, 0, 0, 1, v[0], v[1] || 0]);
    else if (t[1] === 'scale') m = mul(m, [v[0], 0, 0, v[1] ?? v[0], 0, 0]);
    else if (t[1] === 'matrix') m = mul(m, v);
    else throw new Error('transform ' + t[1]);
  }
  return m;
}
const ap = (m, x, y) => [m[0] * x + m[2] * y + m[4], m[1] * x + m[3] * y + m[5]];

/* path: absolute M L H V Q C Z -> transformed d + polyline length + bbox */
function xform(d, m) {
  const tk = d.match(/[A-Za-z]|-?\d*\.?\d+(?:e-?\d+)?/g) || []; let i = 0, cmd, cx = 0, cy = 0, sx = 0, sy = 0;
  let lq = null, lc = null, out = '', len = 0, x0 = 1e9, x1 = -1e9; const num = () => +tk[i++];
  const P = (x, y) => { const [a, b] = ap(m, x, y); x0 = Math.min(x0, a); x1 = Math.max(x1, a); return a.toFixed(1) + ' ' + b.toFixed(1); };
  const seg = (ax, ay, bx, by) => { const [a, b] = ap(m, ax, ay), [c, e] = ap(m, bx, by); len += Math.hypot(c - a, e - b); };
  while (i < tk.length) {
    if (/[A-Za-z]/.test(tk[i])) cmd = tk[i++];
    if (cmd === 'T') { const x = num(), y = num(); const ax = lq ? 2 * cx - lq[0] : cx, ay = lq ? 2 * cy - lq[1] : cy; tk.splice(i, 0, ...[ax, ay, x, y].map(String)); tk.splice(i - 0, 0); i -= 0; cmd = 'Q'; i -= 0; }
    else if (cmd === 'S') { const bx = num(), by = num(), x = num(), y = num(); const ax = lc ? 2 * cx - lc[0] : cx, ay = lc ? 2 * cy - lc[1] : cy; tk.splice(i, 0, ...[ax, ay, bx, by, x, y].map(String)); cmd = 'C'; }
    if (cmd === 'M') { cx = sx = num(); cy = sy = num(); out += 'M' + P(cx, cy); cmd = 'L'; }
    else if (cmd === 'L') { const x = num(), y = num(); seg(cx, cy, x, y); cx = x; cy = y; out += 'L' + P(x, y); }
    else if (cmd === 'H') { const x = num(); seg(cx, cy, x, cy); cx = x; out += 'L' + P(cx, cy); }
    else if (cmd === 'V') { const y = num(); seg(cx, cy, cx, y); cy = y; out += 'L' + P(cx, cy); }
    else if (cmd === 'Q') { const ax = num(), ay = num(), x = num(), y = num(); let px = cx, py = cy; for (let k = 1; k <= 8; k++) { const u = k / 8, qx = (1 - u) ** 2 * cx + 2 * u * (1 - u) * ax + u * u * x, qy = (1 - u) ** 2 * cy + 2 * u * (1 - u) * ay + u * u * y; seg(px, py, qx, qy); px = qx; py = qy; } P(ax, ay); out += 'Q' + P(ax, ay) + ' ' + P(x, y); lq = [ax, ay]; lc = null; cx = x; cy = y; continue; }
    else if (cmd === 'C') { const ax = num(), ay = num(), bx = num(), by = num(), x = num(), y = num(); let px = cx, py = cy; for (let k = 1; k <= 10; k++) { const u = k / 10, v = 1 - u, qx = v ** 3 * cx + 3 * v * v * u * ax + 3 * v * u * u * bx + u ** 3 * x, qy = v ** 3 * cy + 3 * v * v * u * ay + 3 * v * u * u * by + u ** 3 * y; seg(px, py, qx, qy); px = qx; py = qy; } out += 'C' + P(ax, ay) + ' ' + P(bx, by) + ' ' + P(x, y); lc = [bx, by]; lq = null; cx = x; cy = y; continue; }
    else if (cmd === 'Z' || cmd === 'z') { seg(cx, cy, sx, sy); cx = sx; cy = sy; out += 'Z'; }
    else throw new Error('path cmd ' + cmd);
  }
  return { d: out, len: len, x0, x1 };
}

function render(tex) {
  const node = html.convert(tex, { display: false });
  const svg = adaptor.firstChild(node);
  if (adaptor.innerHTML(node).includes('data-mjx-error')) throw new Error('MathJax error in: ' + tex);
  const vb = adaptor.getAttribute(svg, 'viewBox').split(/\s+/).map(Number);
  const glyphs = [];
  (function walk(n, M, fill) {
    for (const c of adaptor.childNodes(n)) {
      const k = adaptor.kind(c); if (k === '#text') continue;
      const tr = parseT(adaptor.getAttribute(c, 'transform')); const M2 = mul(M, tr);
      if (k === 'g') { const f = adaptor.getAttribute(c, 'fill'); walk(c, M2, f && f !== 'currentColor' ? f : fill); }
      else if (k === 'svg') { const vbn = (adaptor.getAttribute(c, 'viewBox') || '0 0 0 0').split(/\s+/).map(Number), sx = +adaptor.getAttribute(c, 'x') || 0, sy = +adaptor.getAttribute(c, 'y') || 0; walk(c, mul(M2, [1, 0, 0, 1, sx - vbn[0], sy - vbn[1]]), fill); }  /* stretchy delimiters (vmatrix, left|): scale 1 */
      else if (k === 'path') { if (adaptor.getAttribute(c, 'd')) glyphs.push({ ...xform(adaptor.getAttribute(c, 'd'), M2), c: fill }); }
      else if (k === 'rect') {
        const x = +adaptor.getAttribute(c, 'x') || 0, y = +adaptor.getAttribute(c, 'y') || 0, w = +adaptor.getAttribute(c, 'width'), h = +adaptor.getAttribute(c, 'height');
        if (adaptor.getAttribute(c, 'data-background')) continue;
        glyphs.push({ ...xform(`M${x} ${y}L${x + w} ${y}L${x + w} ${y + h}L${x} ${y + h}Z`, M2), c: fill });
      } else if (k === 'use' || k === 'text') throw new Error(k + ' in svg: ' + tex);
    }
  })(svg, [1, 0, 0, 1, -vb[0], 0], null);
  glyphs.forEach((g, i) => g.i = i);
  glyphs.sort((a, b) => a.x0 - b.x0 || a.i - b.i);
  return { w: +vb[2].toFixed(1), asc: +(-vb[1]).toFixed(1), desc: +(vb[1] + vb[3]).toFixed(1),
    g: glyphs.map(g => ({ d: g.d, c: g.c, len: +g.len.toFixed(1), x0: +g.x0.toFixed(1), x1: +g.x1.toFixed(1) })) };
}

const out = {}; for (const t of set) out[t] = render(t);
fs.writeFileSync(here + '/math_cache.js', '/* generated by tools/build_math.mjs */\nwindow.MATH = ' + JSON.stringify(out) + ';\n');
console.log('math_cache.js:', set.size, 'expressions');

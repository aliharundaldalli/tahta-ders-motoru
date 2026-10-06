// Usage: node tools/determinism.mjs [lesson]  -> renders 24 frames sequentially, then again in shuffled order (= scrubbing), and
// compares pixels (tolerance: <=400 px (0.02%) differing by >8 levels: Chrome's incremental repaint of the 5k-path meshes antialiases a few edge pixels differently).
import puppeteer from 'puppeteer-core'; import path from 'path'; import { fileURLToPath } from 'url';
const here = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const b = await puppeteer.launch({ executablePath: process.env.CHROME || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true, args: ['--hide-scrollbars', '--num-raster-threads=1', '--disable-gpu'] });
const p = await b.newPage(); await p.setViewport({ width: 1920, height: 1080 }); p.on('pageerror', e => { console.error(e.message); process.exit(1); });
await p.goto('file://' + here + '/index.html?render' + (process.argv[2] ? '&lesson=' + process.argv[2] : '')); await p.waitForFunction('window.__ready');
const T = await p.evaluate(() => window.__total), ts = Array.from({ length: 24 }, (_, i) => +(T * (i + .37) / 24).toFixed(3));
const shot = async t => { await p.evaluate(x => window.__render(x), t); return (await p.screenshot({ encoding: 'base64' })); };
const diff = (a, c) => p.evaluate(async (a, c) => {
  const load = s => new Promise(r => { const i = new Image(); i.onload = () => { const k = document.createElement('canvas'); k.width = i.width; k.height = i.height; const x = k.getContext('2d'); x.drawImage(i, 0, 0); r(x.getImageData(0, 0, i.width, i.height).data); }; i.src = 'data:image/png;base64,' + s; });
  const [A, B] = await Promise.all([load(a), load(c)]); let bad = 0, mx = 0; for (let i = 0; i < A.length; i += 4) { const d = Math.max(Math.abs(A[i] - B[i]), Math.abs(A[i + 1] - B[i + 1]), Math.abs(A[i + 2] - B[i + 2])); mx = Math.max(mx, d); if (d > 8) bad++; } return { bad, mx };
}, a, c);
const seq = []; for (const t of ts) seq.push(await shot(t));
const order = ts.map((t, i) => [t, i]).sort((a, b) => Math.sin(a[1] * 91.7) - Math.sin(b[1] * 91.7)); let fails = 0, worst = 0;
for (const [t, i] of order) { const d = await diff(seq[i], await shot(t)); worst = Math.max(worst, d.bad); if (d.bad > 400) { fails++; console.log('MISMATCH t=' + t, d); } }
console.log(fails ? fails + ' frames differ' : 'deterministic: ' + ts.length + ' frames match (sequential vs shuffled order; worst frame: ' + worst + ' px differ by >8 levels)'); await b.close();

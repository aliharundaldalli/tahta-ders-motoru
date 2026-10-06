// Usage: node tools/shots.mjs t1 t2 ... [--subs] [--debug] [--lesson=lesson_gallery] [--words=path/to/words.js] [--out=output/qa]   -> PNG stills at absolute times (seconds)
//        node tools/shots.mjs --seg=s02:0.5,3.0   -> times relative to a segment's audio start
import puppeteer from 'puppeteer-core'; import path from 'path'; import fs from 'fs'; import {fileURLToPath} from 'url';
const here = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const args = process.argv.slice(2), flag = k => args.find(a => a.startsWith('--' + k + '='))?.split('=')[1];
const out = path.resolve(here, flag('out') || 'output/qa'); fs.mkdirSync(out, { recursive: true });
const CHROME = process.env.CHROME || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const b = await puppeteer.launch({ executablePath: CHROME, headless: true, args: ['--hide-scrollbars', '--num-raster-threads=1', '--disable-gpu'] });
const p = await b.newPage(); await p.setViewport({ width: 1920, height: 1080, deviceScaleFactor: 1 });
p.on('pageerror', e => { console.error('PAGE ERROR', e.message); process.exit(1); }); p.on('console', m => { if (['error', 'warning'].includes(m.type())) console.log('console.' + m.type(), m.text()); });
const q = '?render' + (args.includes('--subs') ? '&subs=1' : '') + (args.includes('--debug') ? '&debug' : '') + (flag('lesson') ? '&lesson=' + flag('lesson') : '') + (flag('words') ? '&words=' + flag('words') : '');
await p.goto('file://' + here + '/index.html' + q); await p.waitForFunction('window.__ready', { timeout: 20000 });
let times = args.filter(a => !a.startsWith('--')).map(Number);
const sg = flag('seg'); if (sg) { const [id, ts] = sg.split(':'); const s = (await p.evaluate(() => window.__segs)).find(s => s.id === id); times.push(...ts.split(',').map(x => s.audioStart + +x)); }
for (const t of times) { await p.evaluate(x => window.__render(x), t); const f = path.join(out, `t_${t.toFixed(2).padStart(6, '0')}.png`); await p.screenshot({ path: f }); console.log(f); }
await b.close();

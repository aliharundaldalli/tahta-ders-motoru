// Usage: node tools/export_sfx.mjs [output/sfx.wav]   -> SFX track (same event list as the visuals) + output/timeline.json + output/events.json
import puppeteer from 'puppeteer-core'; import fs from 'fs'; import path from 'path'; import { fileURLToPath } from 'url'; import { createRequire } from 'module';
import { CHROME_DEFAULT } from './chrome_path.mjs';
import { pathToFileURL } from 'url';
const here = path.dirname(path.dirname(fileURLToPath(import.meta.url))), require = createRequire(import.meta.url);
const outWav = path.resolve(process.argv[2] || here + '/output/sfx.wav'); fs.mkdirSync(path.dirname(outWav), { recursive: true });
const CHROME = CHROME_DEFAULT;
const b = await puppeteer.launch({ executablePath: CHROME, headless: true });
const p = await b.newPage(); p.on('pageerror', e => console.error('PAGE ERROR', e.message));
await p.goto(pathToFileURL(here + '/index.html').href + '?render'); await p.waitForFunction('window.__ready');
const { events, total, segs } = await p.evaluate(() => ({ events: window.__events, total: window.__total, segs: window.__segs }));
await b.close();
await import(here + '/src/sfx.js'); const SFX = globalThis.SFX, f = SFX.render(events, total, 44100);
fs.writeFileSync(outWav, SFX.wav(f, 44100));
fs.writeFileSync(path.dirname(outWav) + '/timeline.json', JSON.stringify({ total, segments: segs }, null, 1));   // place each narration file at segs[i].audioStart
fs.writeFileSync(path.dirname(outWav) + '/events.json', JSON.stringify(events));
let pk = 0, rms = 0; for (const v of f) { pk = Math.max(pk, Math.abs(v)); rms += v * v; }
console.log(outWav, 'events', events.length, 'total', total.toFixed(1) + 's', 'peak', (20 * Math.log10(pk)).toFixed(1) + 'dBFS', 'rms', (10 * Math.log10(rms / f.length)).toFixed(1) + 'dBFS');

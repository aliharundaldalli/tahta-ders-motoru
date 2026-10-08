// Usage: node tools/warnings.mjs [--lesson=lesson_parts/A] [--words=../other/timing/words.js]  -> prints Board.warnings and cue table (want vs start)
import puppeteer from 'puppeteer-core'; import path from 'path'; import {fileURLToPath} from 'url';
import { CHROME_DEFAULT } from './chrome_path.mjs';
import { pathToFileURL } from 'url';
const here = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const args = process.argv.slice(2), flag = k => args.find(a => a.startsWith('--' + k + '='))?.split('=')[1];
const b = await puppeteer.launch({ executablePath: CHROME_DEFAULT, headless: true, args: ['--disable-gpu'] });
const p = await b.newPage(); await p.setViewport({ width: 1920, height: 1080 });
p.on('pageerror', e => { console.error('PAGE ERROR', e.message); process.exit(1); });
await p.goto(pathToFileURL(here + '/index.html').href + '?render' + (flag('lesson') ? '&lesson=' + flag('lesson') : '') + (flag('words') ? '&words=' + flag('words') : ''));
await p.waitForFunction('window.__ready', { timeout: 20000 });
const r = await p.evaluate(() => ({ w: Board.warnings, c: Board.cues.map(c => ({ seg: c.seg, cue: c.cue, want: c.want, start: c.start, type: c.type })), segs: window.__segs.map(s => ({ id: s.id, a: s.audioStart })) }));
console.log('WARNINGS (' + r.w.length + ')'); r.w.forEach(x => console.log('  ' + x));
if (args.includes('--cues')) r.c.forEach(c => console.log(c.seg, (c.start - (r.segs.find(s => s.id === c.seg).a)).toFixed(2), 'want', c.want == null ? '-' : (c.want - r.segs.find(s => s.id === c.seg).a).toFixed(2), c.type, c.cue));
await b.close();

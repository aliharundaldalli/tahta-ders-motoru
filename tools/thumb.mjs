// Kullanım: node tools/thumb.mjs templates/thumbnail.html output/thumbnail.png   -> 1280×720 PNG
import { pathToFileURL } from 'url';
import puppeteer from 'puppeteer-core'; import path from 'path';
import { CHROME_DEFAULT } from './chrome_path.mjs';
const [inp, out] = process.argv.slice(2);
const b = await puppeteer.launch({ executablePath: CHROME_DEFAULT, headless: true });
const p = await b.newPage(); await p.setViewport({ width: 1280, height: 720 });
await p.goto(pathToFileURL(path.resolve(inp)).href); await p.evaluateHandle('document.fonts.ready'); await new Promise(r => setTimeout(r, 300));
await p.screenshot({ path: out, clip: { x: 0, y: 0, width: 1280, height: 720 } }); await b.close();

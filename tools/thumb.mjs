// Kullanım: node tools/thumb.mjs templates/thumbnail.html output/thumbnail.png   -> 1280×720 PNG
import puppeteer from 'puppeteer-core'; import path from 'path';
const [inp, out] = process.argv.slice(2);
const b = await puppeteer.launch({ executablePath: process.env.CHROME || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true });
const p = await b.newPage(); await p.setViewport({ width: 1280, height: 720 });
await p.goto('file://' + path.resolve(inp)); await p.evaluateHandle('document.fonts.ready'); await new Promise(r => setTimeout(r, 300));
await p.screenshot({ path: out, clip: { x: 0, y: 0, width: 1280, height: 720 } }); await b.close();

// Usage: node tools/sheet.mjs out.png cols scale img1 img2 ...   -> contact sheet via headless Chrome
import puppeteer from 'puppeteer-core'; import fs from 'fs'; import path from 'path';
import { CHROME_DEFAULT } from './chrome_path.mjs'; import os from 'os'; import { pathToFileURL } from 'url';
const [out, cols, scale, ...imgs] = process.argv.slice(2); const c = +cols, w = Math.round(1920 * +scale), h = Math.round(1080 * +scale);
const rows = Math.ceil(imgs.length / c);
const html = `<body style="margin:0;background:#000"><div style="display:grid;grid-template-columns:repeat(${c},${w}px);gap:6px;width:${c * w + (c - 1) * 6}px">${imgs.map(f => `<img src="${pathToFileURL(path.resolve(f)).href}" width="${w}" height="${h}">`).join('')}</div>`;
fs.writeFileSync(path.join(os.tmpdir(), 'sheet.html'), html);
const b = await puppeteer.launch({ executablePath: CHROME_DEFAULT, headless: true, args: ['--allow-file-access-from-files'] });
const p = await b.newPage(); await p.setViewport({ width: c * w + (c - 1) * 6, height: rows * h + (rows - 1) * 6 });
await p.goto(pathToFileURL(path.join(os.tmpdir(), 'sheet.html')).href); await new Promise(r => setTimeout(r, 800)); await p.screenshot({ path: out }); await b.close();

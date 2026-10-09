// Beceri örnek sahnelerini (kare/skills/canvas-*/SKILL.md içindeki ```json blokları) headless Chrome'da PNG'ye çizer.
// Sunucu gerekmez: motor dosyaları tek betik olarak sayfaya gömülür.
// Kullanım: node tools/render_skill_examples.mjs --out=DIR [--at=0.5,1] [watercolor kinetic-type ...]
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import puppeteer from 'puppeteer-core';
import {CHROME_DEFAULT} from './chrome_path.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const out = path.resolve((args.find(a => a.startsWith('--out=')) || '--out=output/skill-examples').slice(6));
const at = (args.find(a => a.startsWith('--at=')) || '--at=0.5,1').slice(5).split(',').map(Number);
const only = args.filter(a => !a.startsWith('--'));
fs.mkdirSync(out, {recursive: true});

const bundle = ['primitives.js', 'catalog.js', 'renderers.js', 'pro.js', 'render.js']
  .map(f => fs.readFileSync(path.join(root, 'kare/engine', f), 'utf8').replace(/^import .*?;\s*$/gm, '').replace(/^export /gm, ''))
  .join('\n');
const scenes = [];
for (const dir of fs.readdirSync(path.join(root, 'kare/skills')).sort()) {
  const id = dir.replace(/^canvas-/, '');
  if (only.length && !only.includes(id)) continue;
  const md = fs.readFileSync(path.join(root, 'kare/skills', dir, 'SKILL.md'), 'utf8');
  [...md.matchAll(/```json\n([\s\S]*?)\n```/g)].forEach((m, i) => scenes.push({label: `${id}-${i + 1}`, scene: {...JSON.parse(m[1]), composed: true}}));
}

const browser = await puppeteer.launch({executablePath: process.env.CHROME_PATH || CHROME_DEFAULT, headless: true, args: ['--disable-gpu']});
try {
  const page = await browser.newPage();
  await page.setViewport({width: 1280, height: 720});
  await page.setContent('<!doctype html><meta charset="utf-8"><body style="margin:0"><canvas id="c" width="1280" height="720"></canvas>');
  // about:blank güvenli bağlam değil: crypto.randomUUID yok; yalnızca kimlik üretimi için sayaç yeter.
  await page.addScriptTag({content: 'if(!crypto.randomUUID){let n=0;crypto.randomUUID=()=>"00000000-0000-4000-8000-"+String(++n).padStart(12,"0");}\n' + bundle + '\nwindow.kareRender=(s,t)=>{const p=validateProject({version:1,scenes:[s]});renderScene(document.getElementById("c").getContext("2d"),t,p.scenes[0],p);};'});
  for (const {label, scene} of scenes) {
    for (const f of at) {
      await page.evaluate((s, t) => window.kareRender(s, t), scene, scene.duration * f);
      const file = path.join(out, `${label}-t${String(f).replace('.', '_')}.png`);
      await (await page.$('#c')).screenshot({path: file});
      console.log(file);
    }
  }
} finally {
  await browser.close();
}

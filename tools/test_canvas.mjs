import {closeRenderBrowser} from './close_render_browser.mjs';
import puppeteer from 'puppeteer-core';
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const arg=process.argv.find(x=>x.startsWith('--out='));
const out=arg?path.resolve(arg.slice(6)):path.join(root,'output','canvas-qa');fs.mkdirSync(out,{recursive:true});
const chrome=process.env.CHROME_PATH||['C:/Program Files/Google/Chrome/Application/chrome.exe','C:/Program Files (x86)/Google/Chrome/Application/chrome.exe','/Applications/Google Chrome.app/Contents/MacOS/Google Chrome','/usr/bin/google-chrome'].find(p=>fs.existsSync(p));
if(!chrome)throw new Error('CHROME_PATH gerekli');
const browser=await puppeteer.launch({executablePath:chrome,headless:true,args:['--disable-gpu']});
const errors=[];
try{
  const page=await browser.newPage();await page.setViewport({width:1600,height:1000});page.on('pageerror',e=>errors.push(e.message));
  await page.goto(`http://127.0.0.1:${process.env.STUDIO_PORT||8770}/studio/`,{waitUntil:'networkidle0'});await page.waitForFunction(()=>!!window.canvasStudio);
  assert.ok(await page.$eval('#homeView',el=>!el.hidden));
  assert.equal(await page.$$eval('[data-family]',els=>els.length),5);
  await page.screenshot({path:path.join(out,'kare-home-live.png'),fullPage:true});
  await page.click('[data-family="paint"]');
  assert.ok(await page.$eval('#editorView',el=>!el.hidden));
  assert.ok(await page.$eval('#fineDetails',el=>!el.open));assert.ok(await page.$eval('#knowledgeDetails',el=>!el.open));
  await page.click('#styleOpen');assert.equal(await page.$$eval('.category',els=>els.length),7);
  await page.click('[data-group="all"]');assert.equal(await page.$$eval('.category',els=>els.length),20);
  const results=await page.evaluate(async()=>{
    const {CATEGORIES}=await import('/studio/engine/catalog.js');const {defaultScene,renderScene,validateProject}=await import('/studio/engine/render.js');
    const canvas=document.createElement('canvas');canvas.width=640;canvas.height=360;const ctx=canvas.getContext('2d');
    function hash(){let h=2166136261;for(const b of ctx.getImageData(0,0,640,360).data)h=Math.imul(h^b,16777619);return h>>>0;}
    const list=[];for(const c of CATEGORIES){const scene=defaultScene(c.id);const start=performance.now();renderScene(ctx,1.8,scene);const early=hash();renderScene(ctx,7.2,scene);const late=hash();renderScene(ctx,.1,scene);renderScene(ctx,1.8,scene);list.push({id:c.id,deterministic:early===hash(),animated:early!==late,hash:late,ms:+(performance.now()-start).toFixed(1)});}
    let invalidRejected=false;try{const bad=defaultScene();bad.duration=-1;validateProject({version:1,scenes:[bad]});}catch{invalidRejected=true;}
    return {list,invalidRejected};
  });
  for(const c of results.list){assert.ok(c.deterministic,`${c.id}: geri sarma farklı`);assert.ok(c.animated,`${c.id}: animasyon değişmiyor`);}
  assert.equal(new Set(results.list.map(c=>c.hash)).size,20,'Kategoriler görsel olarak farklı olmalı');assert.ok(results.invalidRejected);
  await page.click('[data-category="watercolor"]');assert.equal(await page.evaluate(()=>canvasStudio.project.scenes[0].category),'watercolor');
  await page.click('#duplicate');assert.equal(await page.evaluate(()=>canvasStudio.project.scenes.length),2);
  await page.click('#moveLeft');assert.equal(await page.evaluate(()=>canvasStudio.selected),0);
  await page.click('#undo');assert.equal(await page.evaluate(()=>canvasStudio.selected),1);
  await page.click('#undo');assert.equal(await page.evaluate(()=>canvasStudio.project.scenes.length),1);
  await page.$eval('#duration',el=>{el.value='14';el.dispatchEvent(new Event('change'));});assert.equal(await page.evaluate(()=>canvasStudio.project.scenes[0].duration),14);
  await page.reload({waitUntil:'networkidle0'});assert.equal(await page.evaluate(()=>canvasStudio.project.scenes[0].duration),14);
  await page.click('#knowledgeDetails summary');await page.waitForFunction(()=>document.getElementById('skillText').textContent.includes('name: canvas-watercolor'));
  await page.click('[data-tab="source"]');assert.ok(await page.$eval('#settings',el=>!el.hidden));await page.click('[data-tab="skill"]');
  await page.click('#knowledgeDetails summary');
  const offlineHtml=await page.evaluate(()=>canvasStudio.standaloneHtml(canvasStudio.project));
  fs.writeFileSync(path.join(out,'canvas-example.html'),offlineHtml);
  const offline=await browser.newPage();offline.on('pageerror',e=>errors.push('offline: '+e.message));await offline.setContent(offlineHtml,{waitUntil:'load'});
  await offline.waitForFunction(()=>document.querySelector('canvas').getContext('2d').getImageData(640,360,1,1).data[3]>0);
  await page.bringToFront();
  const example=await page.evaluate(()=>canvasStudio.project);fs.writeFileSync(path.join(out,'canvas-example.json'),JSON.stringify(example,null,2));
  await page.screenshot({path:path.join(out,'canvas-studio.png'),fullPage:false});await page.screenshot({path:path.join(out,'kare-editor-live.png'),fullPage:true});
  const sheet=await page.evaluate(async()=>{
    const {CATEGORIES}=await import('/studio/engine/catalog.js');const {renderScene,defaultScene}=await import('/studio/engine/render.js');
    const sheet=document.createElement('canvas');sheet.width=1600;sheet.height=960;const g=sheet.getContext('2d');g.fillStyle='#f5f3ec';g.fillRect(0,0,1600,960);
    const cv=document.createElement('canvas');cv.width=304;cv.height=171;const cc=cv.getContext('2d');
    CATEGORIES.forEach((c,i)=>{const x=i%5*320+8,y=Math.floor(i/5)*240+8;renderScene(cc,7.2,defaultScene(c.id));g.drawImage(cv,x,y);g.fillStyle='#243d34';g.font='600 16px system-ui';g.fillText(c.name,x,y+198);g.fillStyle='#7d8277';g.font='11px system-ui';g.fillText(c.technique,x,y+216);});return sheet.toDataURL('image/png').split(',')[1];
  });fs.writeFileSync(path.join(out,'canvas-20-categories.png'),Buffer.from(sheet,'base64'));
  await page.setViewport({width:390,height:844});await page.screenshot({path:path.join(out,'canvas-studio-mobile.png'),fullPage:true});
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'Mobil yatay taşma');
  console.log('20 renderer, editör, yerel kayıt ve mobil genişlik doğrulandı.');
  await page.click('#homeBack');assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'Mobil giriş taşması');await page.screenshot({path:path.join(out,'kare-home-mobile.png'),fullPage:true});
  console.log('Mobil kategori ekranı doğrulandı.');
  const saved=await page.evaluate(()=>JSON.stringify(canvasStudio.project));await page.click('[data-family="motion"]');assert.ok(await page.$eval('#styleDialog',el=>el.open));assert.equal(await page.$$eval('.category',els=>els.length),5);await page.click('[data-close="styleDialog"]');assert.equal(await page.evaluate(()=>JSON.stringify(canvasStudio.project)),saved,'Alan değiştirmek projeyi değiştirmemeli');
  await page.click('#aiOpen');assert.ok(await page.$eval('#aiDialog',el=>el.open));await page.click('[data-close="aiDialog"]');
  console.log('Alan değişimi ve AI penceresi doğrulandı.');
  const skills=[];for(const c of results.list){const res=await fetch(`http://127.0.0.1:8770/api/animation/skill?category=${c.id}`);assert.equal(res.status,200);skills.push(c.id);}
  assert.equal((await fetch(`http://127.0.0.1:${process.env.STUDIO_PORT||8770}/studio/recording.html`)).status,200);
  const state=await(await fetch(`http://127.0.0.1:${process.env.STUDIO_PORT||8770}/api/animation/status`)).json();
  if(!state.configured){const r=await fetch(`http://127.0.0.1:${process.env.STUDIO_PORT||8770}/api/animation/generate`,{method:'POST',body:JSON.stringify({category:'watercolor',prompt:'Suluboya çiçek'})});assert.equal(r.status,503);}
  assert.deepEqual(errors,[],'Tarayıcı JavaScript hataları');
  const report={categories:results.list,skills:skills.length,invalidImportRejected:true,editorActions:true,persistence:true,offlineHtml:true,mobileOverflow:false,aiConfigured:state.configured,errors};
  fs.writeFileSync(path.join(out,'canvas-test-report.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
}finally{await closeRenderBrowser(browser);}

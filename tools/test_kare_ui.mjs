import {closeRenderBrowser} from './close_render_browser.mjs';
import {BASE,CHROME,kareUrl,kfetch} from './kare_test_env.mjs';
import puppeteer from 'puppeteer-core';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
const out=path.resolve(process.argv[2]||'output/canvas-qa');fs.mkdirSync(out,{recursive:true});
const browser=await puppeteer.launch({executablePath:CHROME,headless:true,args:['--disable-gpu']});
const errors=[];
try{
  const page=await browser.newPage();page.on('pageerror',e=>errors.push(e.message));await page.setViewport({width:1366,height:900});
  await page.goto(kareUrl(),{waitUntil:'networkidle0'});await page.waitForFunction(()=>!!window.canvasStudio);await page.evaluate(()=>document.fonts.ready);
  await page.click('#homeContinue');
  await page.$eval('.skip-link',el=>el.click());assert.equal(await page.evaluate(()=>document.activeElement.id),'editorContent');
  const layout=await page.evaluate(()=>{const r=document.getElementById('stage').getBoundingClientRect();return {width:r.width,height:r.height,ratio:r.width/r.height,storyBottom:document.querySelector('.storyboard').getBoundingClientRect().bottom,viewHeight:innerHeight};});
  assert.ok(Math.abs(layout.ratio-16/9)<.01,'Önizleme oranı korunmalı');
  assert.ok(layout.storyBottom<=layout.viewHeight,'Sahneler dizüstü ekranda görünmeli');
  for(const width of [390,700,1024,1366]){await page.setViewport({width,height:900});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),`${width}px editör taşması`);}
  await page.setViewport({width:1366,height:900});
  // Matematik/Seslendirme bağlantıları mevcut ders kayıt stüdyosunu (ayrı sunucu, 8770) yeni sekmede açar.
  for(const id of ['mathStudioLink','voiceStudioLink']){assert.equal(await page.$eval('#'+id,el=>el.getAttribute('href')),'http://localhost:8770/studio/');assert.equal(await page.$eval('#'+id,el=>el.target),'_blank');}
  assert.equal(await page.$eval('.education-link',el=>el.getAttribute('href')),'http://localhost:8770/studio/');
  // Ayarlar: maskeli alanlar, tam anahtar sayfada yok.
  await page.click('#settingsOpen');await page.waitForSelector('#settingsDialog[open] #settingsSave');
  assert.ok((await page.$$eval('#settingsDialog input[type=password]',els=>els.length))>=4);
  assert.ok(await page.$$eval('#settingsDialog input[type=password]',els=>els.every(e=>e.value==='')));
  await page.screenshot({path:path.join(out,'kare-settings.png')});await page.keyboard.press('Escape');
  assert.deepEqual(errors,[]);const report={layout,lessonStudioLinks:true,settingsDialog:true,viewportWidths:[390,700,1024,1366],errors};fs.writeFileSync(path.join(out,'kare-ui-report.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
}finally{await closeRenderBrowser(browser);}

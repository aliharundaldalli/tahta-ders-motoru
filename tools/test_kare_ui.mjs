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
  // Gemini bölümü, güçlü model notu ve küçük model uyarısı (yalnızca uyarı; kaydetmeden).
  assert.ok(await page.$('#settings-gemini #set_GEMINI_API_KEY'));assert.ok(await page.$('#set_AI_PROVIDER option[value="gemini"]'));
  assert.match(await page.$eval('#settingsModelNote',e=>e.textContent),/Haiku, GPT luna/);
  const hint=id=>page.$eval(`#${id}`,e=>e.closest('label').querySelector('.settings-hint').hidden);
  assert.equal(await hint('set_ANTHROPIC_MODEL'),true);
  await page.type('#set_ANTHROPIC_MODEL','claude-haiku-4-5');assert.equal(await hint('set_ANTHROPIC_MODEL'),false);
  await page.type('#set_GEMINI_MODEL','gemini-3.5-flash-lite');assert.equal(await hint('set_GEMINI_MODEL'),false);
  await page.type('#set_OPENAI_MODEL','gpt-luna');assert.equal(await hint('set_OPENAI_MODEL'),false);
  await page.screenshot({path:path.join(out,'kare-settings.png')});await page.keyboard.press('Escape');
  assert.deepEqual(errors,[]);const report={layout,lessonStudioLinks:true,settingsDialog:true,viewportWidths:[390,700,1024,1366],errors};fs.writeFileSync(path.join(out,'kare-ui-report.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
}finally{await closeRenderBrowser(browser);}

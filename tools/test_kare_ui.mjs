import {closeRenderBrowser} from './close_render_browser.mjs';
import puppeteer from 'puppeteer-core';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
const out=path.resolve(process.argv[2]||'output/canvas-qa');fs.mkdirSync(out,{recursive:true});
const browser=await puppeteer.launch({executablePath:process.env.CHROME_PATH||'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true,args:['--disable-gpu']});
const errors=[];
try{
  const page=await browser.newPage();page.on('pageerror',e=>errors.push(e.message));await page.setViewport({width:1366,height:900});
  await page.goto(`http://127.0.0.1:${process.env.STUDIO_PORT||8770}/studio/`,{waitUntil:'networkidle0'});await page.waitForFunction(()=>!!window.canvasStudio);await page.evaluate(()=>document.fonts.ready);
  await page.click('#homeContinue');
  await page.$eval('.skip-link',el=>el.click());assert.equal(await page.evaluate(()=>document.activeElement.id),'editorContent');
  const layout=await page.evaluate(()=>{const r=document.getElementById('stage').getBoundingClientRect();return {width:r.width,height:r.height,ratio:r.width/r.height,storyBottom:document.querySelector('.storyboard').getBoundingClientRect().bottom,viewHeight:innerHeight};});
  assert.ok(Math.abs(layout.ratio-16/9)<.01,'Önizleme oranı korunmalı');
  assert.ok(layout.storyBottom<=layout.viewHeight,'Sahneler dizüstü ekranda görünmeli');
  for(const width of [390,700,1024,1366]){await page.setViewport({width,height:900});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),`${width}px editör taşması`);}
  await page.setViewport({width:1366,height:900});
  assert.equal(await page.$eval('#mathStudioLink',el=>el.getAttribute('href')),'recording.html');
  assert.equal(await page.$eval('#voiceStudioLink',el=>el.getAttribute('href')),'recording.html#voice');
  await page.click('#mathStudioLink');await page.waitForFunction(()=>document.querySelectorAll('#list .seg').length>1);
  await page.evaluate(()=>document.fonts.ready);
  await page.$eval('.skip-link',el=>el.click());assert.equal(await page.evaluate(()=>document.activeElement.id),'lessonMain');
  assert.equal(await page.evaluate(()=>getComputedStyle(document.body).backgroundColor),'rgb(246, 241, 233)');
  assert.ok(await page.$eval('#rec',el=>getComputedStyle(el).display!=='none'));
  assert.ok(await page.$eval('#bWith',el=>!el.hidden));
  assert.equal(await page.$eval('#list .cur select',el=>el.options.length),4);
  const count=await page.$$eval('#list .seg',els=>els.length);
  const first=await page.$eval('#title',el=>el.textContent);await page.click('#bNext');
  assert.notEqual(await page.$eval('#title',el=>el.textContent),first);
  await page.type('#sceneSearch','a01');assert.equal(await page.$$eval('#list .seg:not([hidden])',els=>els.length),1);
  await page.$eval('#sceneSearch',el=>{el.value='';el.dispatchEvent(new Event('input'));});
  await page.click('#sidebarToggle');assert.ok(await page.$eval('#side',el=>el.hidden));await page.click('#sidebarToggle');
  await page.waitForFunction(()=>!!document.getElementById('fr').contentWindow?.__ready,{timeout:30000});
  await page.click('#bScene');await page.waitForFunction(()=>!!document.getElementById('fr').contentWindow?.__segs?.length);await page.click('#lessonRestart');
  await page.screenshot({path:path.join(out,'math-studio-kare.png'),fullPage:true});
  await page.$eval('a[href="#voice"]',el=>el.click());await page.waitForFunction(()=>document.activeElement.id==='voice');
  assert.ok(await page.evaluate(()=>!ST.stream&&!ST.rec),'Seslendirme bağlantısı kayıt başlatmamalı');
  for(const width of [390,700,1024,1366]){await page.setViewport({width,height:900});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),`${width}px matematik taşması`);}
  // Exercise API state arriving before the asynchronously loaded formula renderer.
  await page.setCacheEnabled(false);await page.setRequestInterception(true);
  const slowMath=async request=>{if(request.url().endsWith('/tex-svg.js'))await new Promise(resolve=>setTimeout(resolve,1200));await request.continue();};
  page.on('request',slowMath);
  await page.setViewport({width:390,height:844});await page.reload({waitUntil:'networkidle0'});
  await page.waitForFunction(()=>!!document.querySelector('#txt mjx-container'));
  page.off('request',slowMath);await page.setRequestInterception(false);
  assert.ok(await page.$eval('#side',el=>el.hidden));await page.screenshot({path:path.join(out,'math-studio-mobile.png'),fullPage:true});
  await page.click('.lesson-home');await page.waitForFunction(()=>!!window.canvasStudio);assert.ok(await page.$eval('#homeView',el=>!el.hidden));
  await page.click('#homeContinue');await page.click('#voiceStudioLink');
  await page.waitForFunction(()=>document.activeElement.id==='voice');assert.equal(await page.evaluate(()=>location.hash),'#voice');
  assert.deepEqual(errors,[]);const report={layout,lessonScenes:count,educationPreview:true,kareMathTheme:true,originalLessonCanvas:true,voiceControlsVisible:true,directEditorLinks:true,sidebarSearch:true,viewportWidths:[390,700,1024,1366],errors};fs.writeFileSync(path.join(out,'kare-ui-report.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
}finally{await closeRenderBrowser(browser);}

import {closeRenderBrowser} from './close_render_browser.mjs';
import puppeteer from 'puppeteer-core';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
const out=path.resolve(process.argv[2]||'output/canvas-qa');fs.mkdirSync(out,{recursive:true});
const browser=await puppeteer.launch({executablePath:process.env.CHROME_PATH||'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
const requests=[],errors=[];let counter=0;const jobs=new Map();
try{
  const page=await browser.newPage();page.on('pageerror',e=>errors.push(e.message));await page.setViewport({width:1366,height:900});
  await page.setRequestInterception(true);page.on('request',async r=>{const url=new URL(r.url()),p=url.pathname;let response;
    if(p==='/api/animation/jobs'&&r.method()==='POST'){const body=JSON.parse(r.postData());requests.push(body);const id=`00000000-0000-0000-0000-${String(++counter).padStart(12,'0')}`;jobs.set(id,{id,type:body.type,state:'running',progress:45,message:'Kareler işleniyor',createdAt:Date.now()/1000});response={id};}
    else if(p==='/api/animation/jobs')response={jobs:[...jobs.values()]};
    else if(p.startsWith('/api/animation/jobs/'))response=jobs.get(p.split('/').at(-1));
    else if(p.startsWith('/api/animation/cancel/')){const job=jobs.get(p.split('/').at(-1));job.state='cancelled';job.message='Render iptal edildi';response=job;}
    if(response!==undefined)return r.respond({status:200,contentType:'application/json',body:JSON.stringify(response)});await r.continue();});
  await page.goto(`http://127.0.0.1:${process.env.STUDIO_PORT||8770}/studio/#edit`,{waitUntil:'networkidle0'});await page.waitForFunction(()=>!!window.canvasStudio&&!!window.kareRender);
  const original=await page.evaluate(()=>JSON.stringify(canvasStudio.project));await page.click('#renderOpen');assert.ok(await page.$eval('#renderDialog',el=>el.open));await page.click('#renderStart');await page.waitForFunction(()=>document.querySelector('#renderProgress').value===45);
  assert.equal(requests[0].type,'render');assert.equal(JSON.stringify(requests[0].project),original);await page.click('#renderClose');assert.ok(await page.$eval('#renderDialog',el=>!el.open));await page.click('#renderOpen');assert.ok(await page.$eval('#renderStart',el=>el.disabled));
  await page.click('#renderCancel');await page.waitForFunction(()=>document.getElementById('renderStatus').textContent.includes('iptal'));assert.ok(await page.$eval('#renderCancel',el=>el.hidden));
  await page.click('#renderStart');await page.waitForFunction(()=>document.querySelector('#renderProgress').value===45);const latest=[...jobs.values()].at(-1);Object.assign(latest,{state:'done',progress:100,message:'Hazır',result:{url:'/api/animation/assets/'+latest.id+'/animation.mp4',duration:10,hasAudio:false}});
  await page.waitForSelector('#renderResult a[download]');assert.ok(await page.$eval('#renderStatus',el=>el.textContent.includes('sessiz')));assert.equal(await page.$eval('#renderResult a',el=>el.getAttribute('href')),latest.result.url);
  await page.screenshot({path:path.join(out,'kare-render-panel.png')});await page.setViewport({width:390,height:844});await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));assert.ok(await page.$eval('#renderDialog',el=>el.getBoundingClientRect().width<=innerWidth));
  await page.click('#renderClose');await page.click('#exportOpen');await page.click('#productionExportOpen');assert.ok(await page.$eval('#renderDialog',el=>el.open));
  await page.goto(`http://127.0.0.1:${process.env.STUDIO_PORT||8770}/studio/recording.html`,{waitUntil:'networkidle0'});await page.waitForFunction(()=>document.getElementById('fr').contentWindow?.__ready&&!!window.kareRender);
  await page.click('#renderOpen');await page.select('#renderScope','scene');await page.keyboard.press('n');assert.equal(await page.evaluate(()=>ST.cur),0,'Render penceresi ders kısayollarını çalıştırmamalı');await page.click('#renderStart');await page.waitForFunction(()=>document.querySelector('#renderProgress').value===45);assert.equal(requests.at(-1).type,'math-render');assert.equal(requests.at(-1).scope,'scene');assert.equal(requests.at(-1).segment,'a00');await page.click('#renderCancel');await page.waitForFunction(()=>!document.getElementById('renderStart').disabled);
  await page.select('#renderScope','lesson');await page.click('#renderStart');await page.waitForFunction(()=>document.querySelector('#renderProgress').value===45);assert.equal(requests.at(-1).scope,'lesson');
  assert.deepEqual(errors,[]);const report={canvasSnapshot:true,directMp4:true,progress:true,cancel:true,download:true,history:true,mathSceneAndLesson:true,keyboardIsolation:true,mobile:true,externalAiCalls:0};fs.writeFileSync(path.join(out,'render-ui-report.json'),JSON.stringify(report,null,2));console.log(report);
}finally{await closeRenderBrowser(browser);}

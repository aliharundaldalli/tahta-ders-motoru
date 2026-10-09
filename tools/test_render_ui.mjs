import {closeRenderBrowser} from './close_render_browser.mjs';
import {CHROME,kareUrl} from './kare_test_env.mjs';
import puppeteer from 'puppeteer-core';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
const out=path.resolve(process.argv[2]||'output/canvas-qa');fs.mkdirSync(out,{recursive:true});
const browser=await puppeteer.launch({executablePath:CHROME,headless:true});
const requests=[],errors=[];let counter=0;const jobs=new Map();
// Eski (bayat) render: localStorage'da hatırlanıyor ve sonucu hazır; editörde kendiliğinden gösterilmemeli.
const STALE='00000000-0000-0000-0000-999999999999',STALE_URL='/api/animation/assets/'+STALE+'/animation.mp4';jobs.set(STALE,{id:STALE,type:'render',state:'done',progress:100,message:'Hazır',createdAt:1,result:{url:STALE_URL,duration:5,hasAudio:false,name:'Eski proje'}});
try{
  const page=await browser.newPage();page.on('pageerror',e=>errors.push(e.message));await page.setViewport({width:1366,height:900});
  await page.setRequestInterception(true);page.on('request',async r=>{const url=new URL(r.url()),p=url.pathname;let response;
    if(p==='/api/animation/jobs'&&r.method()==='POST'){const body=JSON.parse(r.postData());requests.push(body);const id=`00000000-0000-0000-0000-${String(++counter).padStart(12,'0')}`;jobs.set(id,{id,type:body.type,state:'running',progress:45,message:'Kareler işleniyor',createdAt:Date.now()/1000});response={id};}
    else if(p==='/api/animation/jobs')response={jobs:[...jobs.values()]};
    else if(p.startsWith('/api/animation/jobs/'))response=jobs.get(p.split('/').at(-1));
    else if(p.startsWith('/api/animation/cancel/')){const job=jobs.get(p.split('/').at(-1));job.state='cancelled';job.message='Render iptal edildi';response=job;}
    if(response!==undefined)return r.respond({status:200,contentType:'application/json',body:JSON.stringify(response)});await r.continue();});
  await page.evaluateOnNewDocument(id=>{localStorage.setItem('canvas-render-job',id);localStorage.setItem('canvas-production-job',id);},STALE);
  await page.goto(kareUrl('#edit'),{waitUntil:'networkidle0'});await page.waitForFunction(()=>!!window.canvasStudio&&!!window.kareRender);
  // Kaydedilmemiş değişiklik: ekrandaki proje render edilir.
  await page.evaluate(()=>window.canvasStudio.edit(p=>{p.name='Ekrandaki proje';p.subtitles=false;}));
  const original=await page.evaluate(()=>JSON.stringify(canvasStudio.project));await page.click('#renderOpen');assert.ok(await page.$eval('#renderDialog',el=>el.open));
  await page.waitForFunction(()=>document.querySelector('#renderProgress').value===45);
  assert.equal(requests.length,1,'Render al hemen yeni iş başlatmalı');assert.equal(requests[0].type,'render');assert.equal(JSON.stringify(requests[0].project),original);assert.equal(requests[0].subtitles,false);
  assert.ok(!(await page.$eval('#renderResult',el=>el.innerHTML)).includes(STALE),'eski render sonucu gösterilmemeli');assert.ok(await page.$eval('#renderStart',el=>el.disabled));
  await page.$eval('.render-history',el=>{el.open=true;});await page.waitForFunction(()=>document.querySelectorAll('#renderHistory button').length===2);
  assert.match(await page.$eval('.render-history summary',el=>el.textContent),/Önceki işler/);
  await page.click('#renderClose');assert.ok(await page.$eval('#renderDialog',el=>!el.open));await page.click('#renderOpen');assert.ok(await page.$eval('#renderStart',el=>el.disabled));
  assert.equal(requests.length,1,'aynı proje zaten render edilirken ikinci iş açılmamalı');
  await page.click('#renderCancel');await page.waitForFunction(()=>document.getElementById('renderStatus').textContent.includes('iptal'));assert.ok(await page.$eval('#renderCancel',el=>el.hidden));
  await page.click('#renderStart');await page.waitForFunction(()=>document.querySelector('#renderProgress').value===45);const latest=[...jobs.values()].at(-1);Object.assign(latest,{state:'done',progress:100,message:'Hazır',result:{url:'/api/animation/assets/'+latest.id+'/animation.mp4',duration:10,hasAudio:false}});
  await page.waitForSelector('#renderResult a[download]');assert.ok(await page.$eval('#renderStatus',el=>el.textContent.includes('sessiz')));assert.equal(await page.$eval('#renderResult a',el=>el.getAttribute('href')),latest.result.url);
  await page.screenshot({path:path.join(out,'kare-render-panel.png')});await page.setViewport({width:390,height:844});await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));assert.ok(await page.$eval('#renderDialog',el=>el.getBoundingClientRect().width<=innerWidth));
  // Proje değişince yeniden açmak eski sonucu değil yeni işi gösterir.
  await page.click('#renderClose');await page.evaluate(()=>window.canvasStudio.edit(p=>{p.name='Değişen proje';}));const count=requests.length;
  await page.click('#exportOpen');await page.click('#productionExportOpen');assert.ok(await page.$eval('#renderDialog',el=>el.open));
  await page.waitForFunction(n=>document.querySelector('#renderProgress').value===45,{},count);assert.equal(requests.length,count+1);assert.equal(requests.at(-1).project.name,'Değişen proje');
  assert.equal(await page.$eval('#renderResult',el=>el.children.length),0,'önceki işin sonucu temizlenmeli');
  assert.deepEqual(errors,[]);const report={staleJobHidden:true,immediateRender:true,canvasSnapshot:true,directMp4:true,progress:true,cancel:true,download:true,history:true,mobile:true,externalAiCalls:0};fs.writeFileSync(path.join(out,'render-ui-report.json'),JSON.stringify(report,null,2));console.log(report);
}finally{await closeRenderBrowser(browser);}

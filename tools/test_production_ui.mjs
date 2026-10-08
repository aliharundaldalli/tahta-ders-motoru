import {closeRenderBrowser} from './close_render_browser.mjs';
// UI workflow uses synthetic plan/build jobs; it never spends model credits.
import puppeteer from 'puppeteer-core';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
const out=path.resolve(process.argv[2]||'output/production-qa');fs.mkdirSync(out,{recursive:true});
const browser=await puppeteer.launch({executablePath:process.env.CHROME_PATH||'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true,args:['--disable-gpu']});
const errors=[],requests=[],jobs=new Map();
const plan={title:'Su döngüsü',theme:'chalk',scenes:Array.from({length:6},(_,i)=>({title:'Su döngüsü '+(i+1),category:'line-art',duration:30,narration:'Su buharlaşır ve atmosferde yoğuşarak bulutları oluşturur.',visual:'Deniz, bulut ve yükselen oklar çiz.',sourceRefs:['metin']}))};
try{
 const page=await browser.newPage();page.on('pageerror',e=>errors.push(e.message));await page.setViewport({width:1366,height:900});
 await page.setRequestInterception(true);page.on('request',async request=>{
  const url=new URL(request.url());let response;
  if(url.pathname==='/api/animation/jobs'&&request.method()==='POST'){
   const body=JSON.parse(request.postData());requests.push(body);const id=`11111111-1111-4111-8111-${String(jobs.size+1).padStart(12,'0')}`;
   const project={version:1,name:'Su döngüsü',subtitles:true,scenes:plan.scenes.map((s,i)=>({id:'scene-'+i,category:s.category,title:s.title,duration:30,seed:42,speed:1,detail:1,palette:['#f1ead8','#f2b440'],background:'#1d2420',objects:[],composed:true,theme:'chalk',narration:s.narration,sourceRefs:s.sourceRefs}))};
   jobs.set(id,{id,type:body.type,state:'done',progress:100,message:'Hazır',result:body.type==='plan'?{plan}: {project}});response={id};
  }else if(url.pathname.startsWith('/api/animation/jobs/')&&jobs.has(url.pathname.split('/').at(-1)))response=jobs.get(url.pathname.split('/').at(-1));
  else if(url.pathname==='/api/animation/jobs')response={jobs:[]};
  if(response)await request.respond({status:200,contentType:'application/json',body:JSON.stringify(response)});else await request.continue();
 });
 await page.goto(`http://127.0.0.1:${process.env.STUDIO_PORT||8770}/studio/`,{waitUntil:'networkidle0'});await page.waitForFunction(()=>!!window.canvasStudio);
 await page.click('#homeProduction');assert.ok(await page.$eval('#productionDialog',e=>e.open));
 const source=path.join(out,'production-ui-source.txt');fs.writeFileSync(source,'Su buharlaşır ve atmosferde yoğuşarak bulutları oluşturur. Yağışlar suyu yeryüzüne geri getirir.');
 await (await page.$('#documentFile')).uploadFile(source);await page.waitForFunction(()=>document.querySelector('#documentStatus').textContent.includes('karakter'));
 await page.$eval('#targetMinutes',e=>e.value='3');await page.click('#createPlan');await page.waitForFunction(()=>document.querySelectorAll('.plan-scene').length===6);
 assert.equal(requests[0].durationSeconds,180);assert.ok(requests[0].documentId);
 await page.$eval('.plan-scene textarea',e=>{e.value='Düzenlenmiş anlatım';e.dispatchEvent(new Event('input'));});
 await page.click('#buildProduction');await page.waitForFunction(()=>!!document.querySelector('#productionResult button'));
 assert.equal(requests[1].plan.scenes[0].narration,'Düzenlenmiş anlatım');
 await page.screenshot({path:path.join(out,'studio-dokumandan-uretim.png'),fullPage:true});
 await page.click('#productionResult button');assert.equal(await page.evaluate(()=>canvasStudio.project.scenes.length),6);assert.ok(await page.$eval('#editorView',e=>!e.hidden));
 await page.click('#undo');assert.equal(await page.evaluate(()=>canvasStudio.project.scenes.length),1,'Üretim açıldığında önceki projeye geri dönülebilmeli');
 const limits=await page.evaluate(async()=>{const {defaultScene,validateProject,projectDuration}=await import('/kare/engine/render.js');const scenes=Array.from({length:360},()=>({...defaultScene('line-art'),duration:30}));const p=validateProject({version:1,name:'180 dakika',scenes});let rejected=false;try{validateProject({...p,scenes:[...p.scenes,defaultScene()]});}catch{rejected=true;}canvasStudio.import(p);return {count:p.scenes.length,seconds:projectDuration(p),rejected};});
 assert.deepEqual(limits,{count:360,seconds:10800,rejected:true});assert.ok(await page.$$eval('.scene-card',els=>els.length<=15));
 await page.select('#sceneNavigator','359');assert.equal(await page.evaluate(()=>canvasStudio.selected),359);
 await page.click('#productionOpen');await page.setViewport({width:390,height:844});const layout=await page.evaluate(()=>({document:document.documentElement.scrollWidth,window:innerWidth,wide:[...document.querySelectorAll('*')].filter(e=>e.getBoundingClientRect().right>innerWidth+2).map(e=>[e.tagName,e.id,e.className,Math.round(e.getBoundingClientRect().width)]).slice(0,12)}));if(layout.document>layout.window+1)console.log(layout);assert.ok(layout.document<=layout.window+1);assert.ok(await page.$eval('#productionDialog',e=>e.scrollWidth<=e.clientWidth+1));await page.screenshot({path:path.join(out,'studio-dokumandan-uretim-mobile.png'),fullPage:true});
 await page.click('#clearDocument');assert.ok(await page.$eval('#documentPreviewDetails',e=>e.hidden));
 assert.deepEqual(errors,[]);const report={documentUpload:true,planReview:true,editedNarrationSent:true,productionApplyUndo:true,longProject:limits,virtualTimeline:true,mobile:true,externalModelRequests:0,errors};fs.writeFileSync(path.join(out,'production-ui-report.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
}finally{await closeRenderBrowser(browser);}

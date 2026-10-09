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
  // Anlatım & ses: "Bu sahneyi seslendir" düğmesi ve AI anlatımı (generate/production/jobs yanıtları sahte; API çağrısı yok).
  const voiceHint=()=>page.$eval('#sceneVoiceHint',e=>e.textContent);
  await page.evaluate(()=>{document.getElementById('narrationDetails').open=true;window.canvasStudio.edit(p=>{p.scenes[window.canvasStudio.selected].narration='';});});
  assert.equal(await page.$eval('#sceneVoice',b=>b.disabled),true,'Anlatım boşken seslendirme kapalı olmalı');
  assert.match(await page.$eval('#sceneVoice',b=>b.textContent),/Bu sahneyi seslendir/);
  const mocked={jobs:[],generateNarration:'Yeni anlatım: çiçekler güneşe doğru açılıyor.'},JOB='11111111-2222-4333-8444-555555555555',AUDIO='/api/animation/assets/66666666-7777-4888-8999-000000000000/scene_001.wav';
  await page.setRequestInterception(true);
  const intercept=req=>{const url=new URL(req.url()),json=(body,status=200)=>req.respond({status,contentType:'application/json',body:JSON.stringify(body)});
    if(url.pathname==='/api/animation/status')return json({configured:true,model:'test-model',provider:'openai',categories:20});
    if(url.pathname==='/api/animation/production')return json({voices:[{id:'windows',label:'Windows',available:false},{id:'cartesia',label:'Cartesia',available:true}]});
    if(url.pathname==='/api/animation/generate'){const {category}=JSON.parse(req.postData());const scene={id:'ai',category,title:'AI çiçekleri',duration:8,seed:3,speed:1,detail:1,background:'#f6f1e9',palette:['#392936','#c65339'],composed:true,narration:mocked.generateNarration,objects:[{type:'circle',x:.5,y:.45,width:.2,height:.35,color:'#c65339',lineWidth:1,start:1,duration:2,text:'',points:[],motion:'fade'}]};return json({scene,model:'test-model'});}
    if(url.pathname==='/api/animation/jobs'&&req.method()==='POST'){mocked.jobs.push(JSON.parse(req.postData()));return json({id:JOB},202);}
    if(url.pathname==='/api/animation/jobs/'+JOB){const body=mocked.jobs.at(-1),scene=structuredClone(body.project.scenes[body.sceneIndex]);scene.audio={url:AUDIO,duration:12,provider:'cartesia'};scene.duration=Math.max(scene.duration,12.4);scene.words=[];scene.alignment='';return json({id:JOB,type:'voice',state:'done',progress:100,message:'Hazır',result:{project:body.project,sceneIndex:body.sceneIndex,sceneId:scene.id,scene}});}
    if(url.pathname===AUDIO)return req.respond({status:404,body:''});
    req.continue();};page.on('request',intercept);
  await page.evaluate(()=>window.dispatchEvent(new CustomEvent('kare-settings-changed')));
  await page.waitForFunction(()=>/Seslendirmek için önce anlatım/.test(document.getElementById('sceneVoiceHint').textContent));
  // Eski anlatım + eski ses: AI taslağı uygulanınca AI anlatımı gelir, eski ses/kelimeler silinir.
  const OLD='/api/animation/assets/66666666-7777-4888-8999-111111111111/old.wav';
  await page.evaluate(old=>window.canvasStudio.edit(p=>{const s=p.scenes[window.canvasStudio.selected];s.narration='Eski anlatım metni.';s.audio={url:old,duration:3,provider:'upload'};s.words=[{text:'Eski',start:0,end:.5}];}),OLD);
  const generate=async()=>{await page.click('#aiOpen');await page.waitForSelector('#aiDialog[open]');await page.$eval('#prompt',e=>{e.value='';});await page.type('#prompt','Güneşe dönen çiçekler');await page.click('#generate');await page.waitForSelector('#aiPreview[open]');};
  await generate();assert.match(await page.$eval('#aiDescription',e=>e.textContent),/Anlatım: Yeni anlatım/);
  await page.click('#applyAi');
  let scene=await page.evaluate(()=>window.canvasStudio.project.scenes[window.canvasStudio.selected]);
  assert.equal(scene.narration,mocked.generateNarration);assert.equal(scene.audio,undefined);assert.ok(!scene.words?.length,'eski kelime zamanları silinmeli');
  assert.equal(await page.$eval('#sceneNarration',e=>e.value),mocked.generateNarration);
  assert.equal(await page.$eval('#sceneVoice',b=>b.disabled),false,'Anlatım ve sağlayıcı varken düğme açık olmalı');
  // AI anlatım döndürmezse: üzerine uygulamada mevcut anlatım korunur, yeni sahnede boş kalır.
  await page.evaluate(old=>window.canvasStudio.edit(p=>{p.scenes[window.canvasStudio.selected].audio={url:old,duration:3,provider:'upload'};}),OLD);
  mocked.generateNarration='';await generate();await page.click('#applyAi');
  scene=await page.evaluate(()=>window.canvasStudio.project.scenes[window.canvasStudio.selected]);
  assert.equal(scene.narration,'Yeni anlatım: çiçekler güneşe doğru açılıyor.');assert.equal(scene.audio,undefined);
  const voicedIndex=await page.evaluate(()=>window.canvasStudio.selected);
  await generate();await page.click('#addAi');
  scene=await page.evaluate(()=>window.canvasStudio.project.scenes[window.canvasStudio.selected]);
  assert.equal(scene.narration,'');assert.equal(scene.audio,undefined);
  assert.equal(await page.$eval('#sceneVoice',b=>b.disabled),true);assert.match(await voiceHint(),/önce anlatım metnini yaz/);
  // Tek sahne seslendirme: yalnızca seçili sahne iş olarak gönderilir, dönen ses yalnızca o sahneye işlenir.
  await page.evaluate(i=>window.canvasStudio.select(i),voicedIndex);await page.evaluate(()=>{document.getElementById('narrationDetails').open=true;});
  const before=await page.evaluate(()=>window.canvasStudio.project);
  await page.click('#sceneVoice');
  await page.waitForFunction(()=>/cartesia · 12\.0 sn ses/.test(document.getElementById('sceneAudioStatus').textContent),{timeout:15000});
  const after=await page.evaluate(()=>window.canvasStudio.project);const sent=mocked.jobs.at(-1);
  assert.equal(sent.type,'voice');assert.equal(sent.provider,'cartesia');assert.equal(sent.sceneIndex,voicedIndex);assert.equal(sent.sceneId,before.scenes[voicedIndex].id);
  assert.equal(after.scenes[voicedIndex].audio.url,AUDIO);assert.equal(after.scenes[voicedIndex].duration,12.4);
  after.scenes.forEach((s,i)=>{if(i!==voicedIndex)assert.deepEqual(s,before.scenes[i],`sahne ${i+1} değişmemeli`);});
  assert.equal(await page.$eval('#sceneVoice',b=>b.disabled),false);
  page.off('request',intercept);await page.setRequestInterception(false);
  assert.deepEqual(errors,[]);const report={layout,lessonStudioLinks:true,settingsDialog:true,sceneVoice:true,aiNarration:true,viewportWidths:[390,700,1024,1366],errors};fs.writeFileSync(path.join(out,'kare-ui-report.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
}finally{await closeRenderBrowser(browser);}

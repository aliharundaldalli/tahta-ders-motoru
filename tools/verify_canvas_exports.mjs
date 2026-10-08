import puppeteer from 'puppeteer-core';
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';

const out=path.resolve(process.argv[2]||'output/canvas-qa');fs.mkdirSync(out,{recursive:true});
const browser=await puppeteer.launch({executablePath:process.env.CHROME_PATH||'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true,args:['--disable-gpu']});
try{
  const page=await browser.newPage();page.on('pageerror',e=>console.error('Export JS error:',e.message));await page.goto(`http://127.0.0.1:${process.env.STUDIO_PORT||8770}/studio/`,{waitUntil:'networkidle0'});
  const demo=await page.evaluate(async()=>{const {CATEGORIES}=await import('/kare/engine/catalog.js');const {defaultScene}=await import('/kare/engine/render.js');return {version:1,name:'20 Canvas animasyon kategorisi',scenes:CATEGORIES.map(c=>({...defaultScene(c.id),duration:2}))};});
  const html=await page.evaluate(p=>canvasStudio.standaloneHtml(p),demo);fs.writeFileSync(path.join(out,'canvas-20-kategori.html'),html);
  await page.evaluate(async()=>{
    window.recordEvents=[];const NativeRecorder=window.MediaRecorder;window.MediaRecorder=class extends NativeRecorder{constructor(...args){super(...args);window.recordEvents.push({type:'construct',time:performance.now(),duration:canvasStudio.project.scenes[0].duration});for(const type of ['start','stop','dataavailable','error'])this.addEventListener(type,e=>{window.recordEvents.push({type,size:e.data?.size,error:e.error?.message,time:performance.now()});});}stop(){window.recordEvents.push({type:'stop-called',stack:new Error().stack,time:performance.now()});super.stop();}};
    const {defaultScene}=await import('/kare/engine/render.js');const scene=defaultScene('physics');scene.duration=2;
    canvasStudio.import({version:1,name:'Canvas WebM kontrolü',scenes:[scene]});
    const original=URL.createObjectURL;URL.createObjectURL=function(blob){if(blob.type.startsWith('video/'))blob.arrayBuffer().then(buffer=>window.exportBytes=Array.from(new Uint8Array(buffer)));return original.call(this,blob);};
  });
  await page.click('#exportOpen');await page.click('#downloadVideo');
  try{await page.waitForFunction(()=>Array.isArray(window.exportBytes),{timeout:10000});}
  catch(e){console.error(await page.evaluate(()=>({progress:document.getElementById('exportProgress').textContent,notice:document.getElementById('notice').textContent,hidden:document.hidden,events:window.recordEvents})));throw e;}
  const bytes=await page.evaluate(()=>window.exportBytes);assert.ok(bytes.length>1000);fs.writeFileSync(path.join(out,'canvas-webm-test.webm'),Buffer.from(bytes));
  assert.equal((await fetch(`http://127.0.0.1:${process.env.STUDIO_PORT||8770}/.env.example`)).status,404);
  const p=await browser.newPage();const errors=[];p.on('pageerror',e=>errors.push(e.message));await p.setContent(html,{waitUntil:'load'});
  await p.waitForFunction(()=>document.querySelector('canvas').getContext('2d').getImageData(100,100,1,1).data[3]===255);assert.deepEqual(errors,[]);
  console.log('WebM kaydı, 20 kategorilik bağımsız HTML ve gizli dosya engeli doğrulandı.');
}finally{await browser.close();}

import {BASE,CHROME,kareUrl,kfetch} from './kare_test_env.mjs';
/* Real local MP4 smoke test. No model request; no user lesson/project is modified. */
import puppeteer from 'puppeteer-core';import assert from 'node:assert/strict';import fs from 'node:fs';import path from 'node:path';import {execFileSync} from 'node:child_process';
import {closeRenderBrowser} from './close_render_browser.mjs';
const out=path.resolve(process.argv[2]||'output/canvas-qa');fs.mkdirSync(out,{recursive:true});
const browser=await puppeteer.launch({executablePath:CHROME,headless:true});
const errors=[],report=[];
try{
  // A short synthetic tone checks actual audio muxing without using user recordings.
  const rate=48000,pcm=Buffer.alloc(rate*2);for(let i=0;i<rate;i++)pcm.writeInt16LE(Math.round(Math.sin(i/rate*2*Math.PI*440)*1600*Math.min(i/2400,(rate-i)/2400,1)),i*2);
  const header=Buffer.alloc(44);header.write('RIFF');header.writeUInt32LE(pcm.length+36,4);header.write('WAVEfmt ',8);header.writeUInt32LE(16,16);header.writeUInt16LE(1,20);header.writeUInt16LE(1,22);header.writeUInt32LE(rate,24);header.writeUInt32LE(rate*2,28);header.writeUInt16LE(2,32);header.writeUInt16LE(16,34);header.write('data',36);header.writeUInt32LE(pcm.length,40);
  const upload=await kfetch(`${BASE}/api/animation/audio?name=render-check.wav`,{method:'POST',body:Buffer.concat([header,pcm])});assert.ok(upload.ok);const audio=await upload.json();
  console.log("Ses yüklemesi tamamlandı");const canvas=await browser.newPage();for(const page of [canvas]){page.on('pageerror',e=>errors.push(e.message));await page.setViewport({width:1366,height:900});}
  await canvas.bringToFront();console.log('Canvas açılıyor');await canvas.goto(kareUrl('#edit'),{waitUntil:'networkidle0'});await canvas.waitForFunction(()=>!!window.kareRender&&!!window.canvasStudio);
  console.log("20 stil hazırlanıyor");await canvas.evaluate(async voice=>{const {CATEGORIES}=await import('/kare/engine/catalog.js'),{defaultScene}=await import('/kare/engine/render.js');const scenes=CATEGORIES.map(c=>({...defaultScene(c.id),duration:2}));scenes[0].audio=voice;canvasStudio.import({version:1,name:'MP4 doğrulama · 20 çizim dili',scenes,subtitles:false});},audio);
  console.log('Canvas render başlıyor');await canvas.click('#renderOpen');await canvas.click('#renderStart');await canvas.waitForFunction(()=>localStorage.getItem('canvas-render-job'));
  const canvasJob=await canvas.evaluate(()=>localStorage.getItem('canvas-render-job'));
  for(const [id,page,name,width,height,expected] of [[canvasJob,canvas,'kare-20-stil-render.mp4',1280,720,40]]){
    let job,iteration=0;const start=Date.now();
    do{job=await kfetch(`${BASE}/api/animation/jobs/`+id).then(r=>r.json());if(iteration++%10===0)console.log(name,job.state,job.progress,job.message);assert.ok(!['error','cancelled'].includes(job.state),job.message);if(job.state==='done')break;await new Promise(r=>setTimeout(r,1000));assert.ok(Date.now()-start<900000,'Render zaman aşımı');}while(true);
    await page.waitForSelector('#renderResult a[download]',{timeout:10000});const result=await kfetch(`${BASE}`+job.result.url);assert.ok(result.ok);const file=path.join(out,name);fs.writeFileSync(file,Buffer.from(await result.arrayBuffer()));
    const probe=JSON.parse(execFileSync('ffprobe',['-v','error','-show_streams','-show_format','-of','json',file],{encoding:'utf8',windowsHide:true}));const video=probe.streams.find(s=>s.codec_type==='video');assert.equal(video.codec_name,'h264');assert.equal(video.width,width);assert.equal(video.height,height);assert.equal(video.r_frame_rate,'30/1');if(expected)assert.ok(Math.abs(+probe.format.duration-expected)<.1);if(expected)assert.ok(probe.streams.some(s=>s.codec_name==='aac'));
    const range=await kfetch(`${BASE}`+job.result.url,{headers:{Range:'bytes=0-63'}});assert.equal(range.status,206);assert.equal((await range.arrayBuffer()).byteLength,64);
    await page.screenshot({path:path.join(out,name.replace('.mp4','.png')),fullPage:true});report.push({name,job:id,duration:+probe.format.duration,width,height,fps:30,hasAudio:job.result.hasAudio,download:true,range:true});
  }
  assert.deepEqual(errors,[]);fs.writeFileSync(path.join(out,'render-integration-report.json'),JSON.stringify({videos:report,externalAiCalls:0,errors},null,2));console.log(JSON.stringify(report,null,2));
}finally{await closeRenderBrowser(browser);}

/* Real local MP4 smoke test. No model request; no user lesson/project is modified. */
import puppeteer from 'puppeteer-core';import assert from 'node:assert/strict';import fs from 'node:fs';import path from 'node:path';import {execFileSync} from 'node:child_process';
import {closeRenderBrowser} from './close_render_browser.mjs';
const out=path.resolve(process.argv[2]||'output/canvas-qa');fs.mkdirSync(out,{recursive:true});
const browser=await puppeteer.launch({executablePath:process.env.CHROME_PATH||'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
const errors=[],report=[];
try{
  // A short synthetic tone checks actual audio muxing without using user recordings.
  const rate=48000,pcm=Buffer.alloc(rate*2);for(let i=0;i<rate;i++)pcm.writeInt16LE(Math.round(Math.sin(i/rate*2*Math.PI*440)*1600*Math.min(i/2400,(rate-i)/2400,1)),i*2);
  const header=Buffer.alloc(44);header.write('RIFF');header.writeUInt32LE(pcm.length+36,4);header.write('WAVEfmt ',8);header.writeUInt32LE(16,16);header.writeUInt16LE(1,20);header.writeUInt16LE(1,22);header.writeUInt32LE(rate,24);header.writeUInt32LE(rate*2,28);header.writeUInt16LE(2,32);header.writeUInt16LE(16,34);header.write('data',36);header.writeUInt32LE(pcm.length,40);
  const upload=await fetch(`http://127.0.0.1:${process.env.STUDIO_PORT||8770}/api/animation/audio?name=render-check.wav`,{method:'POST',body:Buffer.concat([header,pcm])});assert.ok(upload.ok);const audio=await upload.json();
  console.log("Ses yüklemesi tamamlandı");const canvas=await browser.newPage(),math=await browser.newPage();for(const page of [canvas,math]){page.on('pageerror',e=>errors.push(e.message));await page.setViewport({width:1366,height:900});}
  await canvas.bringToFront();console.log('Canvas açılıyor');await canvas.goto(`http://127.0.0.1:${process.env.STUDIO_PORT||8770}/studio/#edit`,{waitUntil:'networkidle0'});await canvas.waitForFunction(()=>!!window.kareRender&&!!window.canvasStudio);
  console.log("20 stil hazırlanıyor");await canvas.evaluate(async voice=>{const {CATEGORIES}=await import('/studio/engine/catalog.js'),{defaultScene}=await import('/studio/engine/render.js');const scenes=CATEGORIES.map(c=>({...defaultScene(c.id),duration:2}));scenes[0].audio=voice;canvasStudio.import({version:1,name:'MP4 doğrulama · 20 çizim dili',scenes,subtitles:false});},audio);
  console.log('Canvas render başlıyor');await canvas.click('#renderOpen');await canvas.click('#renderStart');await canvas.waitForFunction(()=>localStorage.getItem('canvas-render-job'));
  const canvasJob=await canvas.evaluate(()=>localStorage.getItem('canvas-render-job'));
  await math.bringToFront();console.log('Matematik açılıyor');await math.goto(`http://127.0.0.1:${process.env.STUDIO_PORT||8770}/studio/recording.html`,{waitUntil:'networkidle0'});await math.waitForFunction(()=>document.getElementById('fr').contentWindow?.__ready&&!!window.kareRender);await math.click('#renderOpen');await math.select('#renderScope','scene');await math.click('#renderStart');await math.waitForFunction(()=>localStorage.getItem('math-render-job'));const mathJob=await math.evaluate(()=>localStorage.getItem('math-render-job'));
  for(const [id,page,name,width,height,expected] of [[canvasJob,canvas,'kare-20-stil-render.mp4',1280,720,40],[mathJob,math,'kare-matematik-render.mp4',1920,1080,null]]){
    let job,iteration=0;const start=Date.now();
    do{job=await fetch(`http://127.0.0.1:${process.env.STUDIO_PORT||8770}/api/animation/jobs/`+id).then(r=>r.json());if(iteration++%10===0)console.log(name,job.state,job.progress,job.message);assert.ok(!['error','cancelled'].includes(job.state),job.message);if(job.state==='done')break;await new Promise(r=>setTimeout(r,1000));assert.ok(Date.now()-start<900000,'Render zaman aşımı');}while(true);
    await page.waitForSelector('#renderResult a[download]',{timeout:10000});const result=await fetch(`http://127.0.0.1:${process.env.STUDIO_PORT||8770}`+job.result.url);assert.ok(result.ok);const file=path.join(out,name);fs.writeFileSync(file,Buffer.from(await result.arrayBuffer()));
    const probe=JSON.parse(execFileSync('ffprobe',['-v','error','-show_streams','-show_format','-of','json',file],{encoding:'utf8',windowsHide:true}));const video=probe.streams.find(s=>s.codec_type==='video');assert.equal(video.codec_name,'h264');assert.equal(video.width,width);assert.equal(video.height,height);assert.equal(video.r_frame_rate,'30/1');if(expected)assert.ok(Math.abs(+probe.format.duration-expected)<.1);if(expected)assert.ok(probe.streams.some(s=>s.codec_name==='aac'));
    const range=await fetch(`http://127.0.0.1:${process.env.STUDIO_PORT||8770}`+job.result.url,{headers:{Range:'bytes=0-63'}});assert.equal(range.status,206);assert.equal((await range.arrayBuffer()).byteLength,64);
    await page.screenshot({path:path.join(out,name.replace('.mp4','.png')),fullPage:true});report.push({name,job:id,duration:+probe.format.duration,width,height,fps:30,hasAudio:job.result.hasAudio,download:true,range:true});
  }
  assert.deepEqual(errors,[]);fs.writeFileSync(path.join(out,'render-integration-report.json'),JSON.stringify({videos:report,externalAiCalls:0,errors},null,2));console.log(JSON.stringify(report,null,2));
}finally{await closeRenderBrowser(browser);}

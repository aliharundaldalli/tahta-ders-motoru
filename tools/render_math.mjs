/* Capture the unchanged SVG/chalk lesson, using its own cue/word timeline. */
import fs from 'node:fs';
import path from 'node:path';
import {spawn} from 'node:child_process';
import {once} from 'node:events';
import puppeteer from 'puppeteer-core';
import {closeRenderBrowser} from './close_render_browser.mjs';
const [input,destination,progressFile]=process.argv.slice(2),request=JSON.parse(fs.readFileSync(input,'utf8'));
const chrome=process.env.CHROME_PATH||['C:/Program Files/Google/Chrome/Application/chrome.exe','C:/Program Files (x86)/Google/Chrome/Application/chrome.exe','/Applications/Google Chrome.app/Contents/MacOS/Google Chrome','/usr/bin/google-chrome'].find(p=>fs.existsSync(p));
if(!chrome)throw new Error('CHROME_PATH gerekli');
const browser=await puppeteer.launch({executablePath:chrome,headless:true,args:['--disable-gpu','--hide-scrollbars']});let encoder;
try{
  const page=await browser.newPage();await page.setViewport({width:1920,height:1080,deviceScaleFactor:1});
  await page.setRequestInterception(true);page.on('request',r=>r.url().endsWith('/timing/words.js')?r.respond({status:200,contentType:'application/javascript',body:fs.readFileSync(path.join(path.dirname(input),'words-snapshot.js'),'utf8')}):r.continue());
  await page.goto(`http://127.0.0.1:${process.env.STUDIO_PORT||8770}/index.html?render${request.subtitles?'&subs=1':''}`,{waitUntil:'networkidle0'});await page.waitForFunction(()=>window.__ready,{timeout:30000});
  const manifest=await page.evaluate(req=>{const selected=window.__segs.find(s=>s.id===req.segment);if(req.scope==='scene'&&!selected)throw new Error('Sahne bulunamadı');const from=req.scope==='scene'?selected.start:0,to=req.scope==='scene'?selected.end:window.__total;return {from,to,duration:to-from,segments:window.__segs.filter(s=>s.end>from&&s.start<to)};},request);
  fs.writeFileSync(path.join(path.dirname(input),'timeline.json'),JSON.stringify(manifest));
  const frames=Math.ceil(manifest.duration*30);
  encoder=spawn('ffmpeg',['-hide_banner','-loglevel','error','-y','-f','image2pipe','-vcodec','mjpeg','-framerate','30','-i','pipe:0','-an','-c:v','libx264','-preset','medium','-crf','17','-pix_fmt','yuv420p','-movflags','+faststart',destination],{stdio:['pipe','ignore','pipe'],windowsHide:true});
  let stderr='',failure;encoder.stderr.on('data',b=>stderr=(stderr+b).slice(-6000));const ended=new Promise((resolve,reject)=>{encoder.on('error',reject);encoder.on('close',code=>code===0?resolve():reject(new Error(stderr)));});ended.catch(e=>failure=e);encoder.stdin.on('error',e=>failure=e);
  for(let i=0;i<frames;i++){if(failure)throw failure;await page.evaluate(t=>window.__render(t),manifest.from+i/30);const frame=await page.screenshot({type:'jpeg',quality:96});if(!encoder.stdin.write(frame))await Promise.race([once(encoder.stdin,'drain'),ended]);if(i%30===0&&progressFile){fs.writeFileSync(progressFile+'.tmp',JSON.stringify({progress:i/frames*100,frame:i,frames}));fs.renameSync(progressFile+'.tmp',progressFile);}}
  encoder.stdin.end();await ended;
}finally{if(encoder&&encoder.exitCode===null)encoder.kill();await closeRenderBrowser(browser);}

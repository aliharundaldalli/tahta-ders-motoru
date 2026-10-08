import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import puppeteer from 'puppeteer-core';
import {closeRenderBrowser} from './close_render_browser.mjs';

const [source,destination,progressFile]=process.argv.slice(2);
if(!source||!destination){console.error('Kullanım: node tools/render_canvas.mjs project.json output.mp4');process.exit(1);}
const project=JSON.parse(fs.readFileSync(source,'utf8'));
const chrome=process.env.CHROME_PATH||['C:/Program Files/Google/Chrome/Application/chrome.exe','C:/Program Files (x86)/Google/Chrome/Application/chrome.exe','/Applications/Google Chrome.app/Contents/MacOS/Google Chrome','/usr/bin/google-chrome'].find(p=>fs.existsSync(p));
if(!chrome)throw new Error('CHROME_PATH gerekli');
fs.mkdirSync(path.dirname(path.resolve(destination)),{recursive:true});
const browser=await puppeteer.launch({executablePath:chrome,headless:true,args:['--disable-gpu']});
let encoder;
try{
  const page=await browser.newPage();await page.goto(`http://127.0.0.1:${process.env.STUDIO_PORT||8770}/studio/`,{waitUntil:'networkidle0'});
  const duration=await page.evaluate(async p=>{const {validateProject,projectDuration,renderProject}=await import('/kare/engine/render.js');const {preloadProject}=await import('/kare/engine/pro.js');window.exportProject=validateProject(p);await preloadProject(exportProject);window.exportRender=renderProject;window.exportCanvas=document.createElement('canvas');const size={720:[1280,720],1080:[1920,1080],'4k':[3840,2160],vertical:[1080,1920]}[p.delivery||'720'];exportCanvas.width=size[0];exportCanvas.height=size[1];window.exportSegments=p.renderSegments||null;return projectDuration(exportProject);},project);
  await page.evaluate(async()=>{await Promise.all(['400 34px Kalam','700 34px Kalam','500 34px Manrope'].map(font=>document.fonts.load(font)));});
  const segments=project.renderSegments||[{offset:0,duration,destination}];let total=0,completed=0;
  for(const segment of segments)total+=Math.ceil(segment.duration*30);
  for(const segment of segments){if(segment.cached){completed+=Math.ceil(segment.duration*30);continue;}
  const frames=Math.ceil(segment.duration*30);encoder=spawn('ffmpeg',['-hide_banner','-y','-f','image2pipe','-vcodec','png','-framerate','30','-i','pipe:0','-an','-c:v','libx264','-pix_fmt','yuv420p','-crf','18','-movflags','+faststart',segment.destination],{stdio:['pipe','ignore','pipe'],windowsHide:true});
  let stderr='';encoder.stderr.on('data',b=>stderr=(stderr+b.toString()).slice(-6000));
  const ended=new Promise((resolve,reject)=>{encoder.on('error',reject);encoder.on('close',code=>code===0?resolve():reject(new Error(stderr)));});
  // Handle early encoder failure while browser frames are still being prepared.
  let encoderError;ended.catch(e=>{encoderError=e;});encoder.stdin.on('error',e=>{encoderError=e;});
  for(let i=0;i<frames;i++){
    if(encoderError)throw encoderError;
    const data=await page.evaluate(t=>{exportRender(exportCanvas.getContext('2d'),t,exportProject);return exportCanvas.toDataURL('image/png').split(',')[1];},segment.offset+i/30);
    if(!encoder.stdin.write(Buffer.from(data,'base64')))await Promise.race([once(encoder.stdin,'drain'),ended]);
    if(i%90===0){console.log(`${i}/${frames} kare`);if(progressFile){const temporary=progressFile+'.tmp';fs.writeFileSync(temporary,JSON.stringify({progress:(completed+i)/total*100,frame:i,frames}));fs.renameSync(temporary,progressFile);}}
  }
  encoder.stdin.end();await ended;completed+=frames;console.log(`Sahne hazır: ${segment.destination}`);
  }
}finally{if(encoder&&encoder.exitCode===null)encoder.kill();await closeRenderBrowser(browser);}

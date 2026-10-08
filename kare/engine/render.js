import {objectMeta,projectMeta,enforceStyle,pose,carryScene,formulaImage,brushPath} from './pro.js';
import { CATEGORIES } from './catalog.js';
import { RENDERERS } from './renderers.js';
import { clamp, smooth, line, polygon, circle, ellipse, text, grain } from './primitives.js';

export function defaultScene(category = 'botanical') {
  const c = CATEGORIES.find(c => c.id === category);
  if (!c) throw new Error('Bilinmeyen animasyon kategorisi');
  return { id: crypto.randomUUID(), category, title: c.title, duration: 10, seed: 42, speed: 1, detail: 1, palette: [...c.palette], background: c.background, objects: [], composed:false, theme:'editorial', narration:'', sourceRefs:[] };
}

const finite = (value, min, max, label) => {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < min || value > max) throw new Error(`${label}: ${min}–${max} aralığında sayı olmalı`);
  return value;
};
const hexColor = (value, label) => { if (typeof value !== 'string' || !/^#[0-9a-f]{6}$/i.test(value)) throw new Error(`${label}: #RRGGBB biçiminde renk olmalı`); return value; };

export function validateScene(input) {
  if (!input || typeof input !== 'object' || !CATEGORIES.some(c => c.id === input.category)) throw new Error('Geçerli kategori seçilmedi');
  if (typeof input.title !== 'string' || !input.title.trim() || input.title.length > 160) throw new Error('Başlık 1–160 karakter olmalı');
  if (!Array.isArray(input.palette) || input.palette.length < 2 || input.palette.length > 8) throw new Error('Palet 2–8 renk içermeli');
  const objects = input.objects ?? [];
  if (!Array.isArray(objects) || objects.length > 80) throw new Error('En fazla 80 çizim öğesi kullanılabilir');
  const scene = { id: typeof input.id === 'string' ? input.id.slice(0, 80) : crypto.randomUUID(), category: input.category, title: input.title.trim(),
    duration: finite(input.duration, 2, 120, 'Süre'), seed: finite(input.seed, 0, 2147483647, 'Seed'), speed: finite(input.speed, .2, 3, 'Hareket hızı'),
    detail: finite(input.detail, .25, 2, 'Ayrıntı'), palette: input.palette.map(v => hexColor(v, 'Palet')), background: hexColor(input.background, 'Arka plan'), objects: [] };
  for (const o of objects) {
    if (!o || !['circle','ellipse','rect','path','text'].includes(o.type)) throw new Error('Desteklenmeyen çizim öğesi');
    const obj = { type:o.type, x:finite(o.x,0,1,'x'), y:finite(o.y,0,1,'y'), width:finite(o.width,0,1,'Genişlik'), height:finite(o.height,0,1,'Yükseklik'),
      color:hexColor(o.color,'Öğe rengi'), lineWidth:finite(o.lineWidth,.1,30,'Çizgi kalınlığı'), start:finite(o.start,0,scene.duration,'Başlama'),
      duration:finite(o.duration,.1,120,'Öğe süresi'), text:typeof o.text === 'string' ? o.text.slice(0,200) : '', points: [], motion:o.motion };
    if (!['draw','fade','float','rotate','slide'].includes(obj.motion)) throw new Error('Geçersiz hareket');
    if (!Array.isArray(o.points) || o.points.length > 500) throw new Error('Yol en fazla 500 nokta içerebilir');
    for (const point of o.points) { if (!Array.isArray(point) || point.length !== 2) throw new Error('Yol noktası [x,y] olmalı'); obj.points.push([finite(point[0],0,1,'Nokta x'),finite(point[1],0,1,'Nokta y')]); }
    if (obj.type === 'path' && obj.points.length < 2) throw new Error('Yol en az iki nokta içermeli');
    Object.assign(obj,objectMeta(o,scene.objects.length));scene.objects.push(obj);
  }
  scene.composed = input.composed === true;
  scene.theme = ['chalk','editorial','artistic'].includes(input.theme) ? input.theme : 'editorial';
  if(input.narration!==undefined && (typeof input.narration!=='string'||input.narration.length>4000))throw new Error('Anlatım en fazla 4000 karakter olabilir');
  scene.narration = input.narration || '';
  scene.sourceRefs = Array.isArray(input.sourceRefs) ? input.sourceRefs.filter(r=>typeof r==='string').slice(0,20).map(r=>r.slice(0,120)) : [];
  if(input.audio){if(typeof input.audio.url!=='string'||!/^\/api\/animation\/assets\/[0-9a-f-]{36}\/[a-zA-Z0-9_-]+\.wav$/.test(input.audio.url))throw new Error('Geçersiz ses adresi');scene.audio={url:input.audio.url,duration:finite(input.audio.duration,0,120,'Ses süresi'),provider:String(input.audio.provider||'upload').slice(0,50)};}
  scene.carry=!!input.carry;scene.notes=String(input.notes||'').slice(0,3000);
  if(!Array.isArray(input.words||[])||(input.words||[]).length>2000)throw Error('Kelime zamanları geçersiz');
  scene.words=(input.words||[]).map(w=>({w:String(w.w).slice(0,100),start:finite(w.start,0,120,'Kelime başlangıcı'),end:finite(w.end,0,120,'Kelime bitişi'),matched:w.matched!==false}));
  if(scene.words.some((w,i)=>w.end<w.start||(i&&w.start<scene.words[i-1].start)))throw Error('Kelime zamanları sıralı olmalı');
  scene.alignment=String(input.alignment||'').slice(0,50);
  return scene;
}

export function validateProject(p) {
  if (!p || p.version !== 1 || !Array.isArray(p.scenes) || p.scenes.length < 1 || p.scenes.length > 360) throw new Error('Proje 1–360 sahne içermeli ve sürümü 1 olmalı');
  const scenes = p.scenes.map(validateScene);
  if (scenes.reduce((a,s)=>a+s.duration,0) > 10800) throw new Error('Toplam süre 180 dakikayı geçmemeli');
  const ids = new Set(); for (const scene of scenes) { if (ids.has(scene.id)) scene.id = crypto.randomUUID(); ids.add(scene.id); }
  const result={ version:1, name:typeof p.name==='string'?p.name.slice(0,160):'Çizim projesi', width:1280, height:720, fps:30, subtitles:p.subtitles!==false, scenes };
  if(p.source&&typeof p.source==='object')result.source=Object.fromEntries(['id','name','sha256'].map(k=>[k,String(p.source[k]||'').slice(0,160)]));
  Object.assign(result,projectMeta({...p,scenes},validateScene));return enforceStyle(result);
}

export function wrappedText(ctx,value,x,y,size,color,width,font='Manrope',maxLines=3){
  ctx.font=`500 ${size}px ${font}, system-ui, sans-serif`;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillStyle=color;
  const lines=[];let current='';for(const word of value.split(/\s+/)){const next=current?current+' '+word:word;if(current&&ctx.measureText(next).width>width){lines.push(current);current=word;}else current=next;}if(current)lines.push(current);
  const visible=lines.slice(0,maxLines);if(lines.length>maxLines)visible[visible.length-1]+='…';
  visible.forEach((line,i)=>ctx.fillText(line,x,y+(i-(visible.length-1)/2)*size*1.28,width));
}

export function drawObjects(ctx, t, scene, project={assets:[]}) {
  for (const original of scene.objects) {
    const o=pose(original,t,scene);if(o.hidden)continue;
    if (t < o.start) continue; const p = o.carried?1:clamp((t-o.start)/o.duration), u = smooth(p);
    ctx.save(); ctx.translate(o.x*1280,o.y*720);ctx.rotate(o.rotation*Math.PI/180);ctx.scale(o.scale,o.scale);ctx.globalAlpha*=o.opacity;
    if(scene.composed&&scene.category==='watercolor')ctx.globalAlpha=.72;
    if (o.motion === 'float') ctx.translate(0,Math.sin((t-o.start)*scene.speed*1.5)*14);
    if (o.motion === 'rotate') ctx.rotate((t-o.start)*scene.speed*.3);
    if (o.motion === 'slide') ctx.translate((1-u)*-180,0);
    if (o.motion === 'fade' || o.motion === 'slide') ctx.globalAlpha*=u;
    const w=o.width*1280,h=o.height*720;
    if(o.assetId){const asset=project.assets?.find(a=>a.id===o.assetId);if(asset){ctx.scale(o.width,o.height);ctx.translate(-640,-360);drawObjects(ctx,t,{...scene,objects:asset.objects},project);}ctx.restore();continue;}
    if(o.svg&&formulaImage(o.svg)){const image=formulaImage(o.svg),ratio=Math.min(w/image.naturalWidth,h/image.naturalHeight),fw=image.naturalWidth*ratio,fh=image.naturalHeight*ratio;ctx.drawImage(image,-fw/2,-fh/2,fw,fh);ctx.restore();continue;}
    if (o.type==='circle') circle(ctx,0,0,w/2,o.color);
    if (o.type==='ellipse') ellipse(ctx,0,0,w/2,h/2,0,o.color);
    if (o.type==='rect') {ctx.fillStyle=o.color;ctx.fillRect(-w/2,-h/2,w,h);}
    if (o.type==='text') {const size=Math.min(Math.max(h,12),110);if(scene.composed)wrappedText(ctx,o.text,0,0,size,o.color,Math.max(w,80),project.style?.locked?project.style.font:scene.theme==='chalk'?'Kalam':'Manrope');else text(ctx,o.text,0,0,size,o.color);}
    if (o.type==='path'){const points=o.points.map(q=>[(q[0]-original.x)*1280,(q[1]-original.y)*720]);if(o.brush&&o.brush!=='solid')brushPath(ctx,points,o,scene.seed,o.motion==='draw'?p:1);else line(ctx,points,o.color,o.lineWidth,o.motion==='draw'?p:1);}
    ctx.restore();
  }
}

export function renderScene(ctx, time, scene, project={assets:[]}) {
  const {width,height}=ctx.canvas;
  ctx.resetTransform(); ctx.clearRect(0,0,width,height); ctx.save();
  ctx.scale(width/1280,height/720); if(!project.transparent){ctx.fillStyle=scene.background;ctx.fillRect(0,0,1280,720);}
  ctx.save(); if(!scene.composed)RENDERERS[scene.category](ctx,clamp(time,0,scene.duration),scene);ctx.restore();
  drawObjects(ctx,time,scene,project);if(scene.composed)grain(ctx,scene.seed,1000,scene.theme==='chalk'?.018:.035);ctx.restore();
}

export const projectDuration = project => project.scenes.reduce((n,s)=>n+s.duration,0);
export function sceneAt(project,time) {
  let offset=0; for(let i=0;i<project.scenes.length;i++){const s=project.scenes[i];if(time<offset+s.duration||i===project.scenes.length-1)return {scene:s,index:i,local:clamp(time-offset,0,s.duration),offset};offset+=s.duration;}
}
const fittedCanvases=new WeakMap();
export function renderProject(ctx,time,project) {
  if(Math.abs(ctx.canvas.width/ctx.canvas.height-16/9)>.01){let c=fittedCanvases.get(ctx);if(!c){c=document.createElement('canvas');c.width=1280;c.height=720;fittedCanvases.set(ctx,c);}const at=renderProject(c.getContext('2d'),time,project),scale=Math.min(ctx.canvas.width/1280,ctx.canvas.height/720);ctx.resetTransform();ctx.clearRect(0,0,ctx.canvas.width,ctx.canvas.height);if(!project.transparent){ctx.fillStyle=at.scene.background;ctx.fillRect(0,0,ctx.canvas.width,ctx.canvas.height);}ctx.drawImage(c,(ctx.canvas.width-1280*scale)/2,(ctx.canvas.height-720*scale)/2,1280*scale,720*scale);return at;}

  const at=sceneAt(project,time);renderScene(ctx,at.local,carryScene(project,at.index),project);
  if(project.subtitles!==false&&at.scene.narration){const words=at.scene.narration.split(/\s+/),count=Math.ceil(words.length/12),speechDuration=at.scene.audio?.duration||at.scene.duration,index=Math.min(count-1,Math.floor(at.local/speechDuration*count)),caption=at.scene.words?.length?(()=>{const n=Math.max(0,at.scene.words.findLastIndex(w=>w.start<=at.local)),i=Math.floor(n/8)*8;return at.local>(at.scene.words.at(-1)?.end||0)?'':at.scene.words.slice(i,i+8).map(w=>w.w).join(' ');})():words.slice(index*12,index*12+12).join(' ');ctx.save();ctx.scale(ctx.canvas.width/1280,ctx.canvas.height/720);ctx.fillStyle=at.scene.theme==='chalk'?'rgba(23,29,26,.94)':'rgba(246,241,233,.94)';ctx.fillRect(80,624,1120,84);wrappedText(ctx,caption,640,666,26,at.scene.theme==='chalk'?'#f1ead8':'#392936',1050,'Manrope',2);ctx.restore();}
  return at;
}

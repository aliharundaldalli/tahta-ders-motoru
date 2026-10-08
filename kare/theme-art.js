import {defaultScene,renderScene} from './engine/render.js';
import {circle,ellipse,line,polygon,text,TAU} from './engine/primitives.js';

const ink='#392936',plum='#725367',coral='#c65339',paper='#f6f1e9',lilac='#e8dfe6',butter='#e9cb75';
function cover(canvas,type,t=7.8){
  const ctx=canvas.getContext('2d');ctx.resetTransform();ctx.clearRect(0,0,canvas.width,canvas.height);
  if(type==='paint'){const s=defaultScene('watercolor');s.title='';renderScene(ctx,t,s);return;}
  ctx.save();ctx.scale(canvas.width/1200,canvas.height/330);ctx.fillStyle=type==='nature'?lilac:paper;ctx.fillRect(0,0,1200,330);
  if(type==='motion'){
    const a=t*.2;for(let i=0;i<4;i++){ctx.beginPath();ctx.ellipse(390,165,125+i*40,125+i*40,a,0,TAU);ctx.strokeStyle=i%2?coral:plum;ctx.lineWidth=1.5;ctx.stroke();}
    polygon(ctx,[[88,90],[210,76],[229,221],[104,242]],butter);text(ctx,'A',390,180,210,ink,'center',800);
    for(let i=0;i<7;i++){ctx.globalAlpha=.17+i*.07;circle(ctx,650+i*64,165,18+i*8,i%2?plum:coral);}ctx.globalAlpha=1;
    line(ctx,[[60,160],[655,160]],ink,1.5);circle(ctx,600+Math.sin(a)*45,165,10,ink);
  }
  if(type==='nature'){
    circle(ctx,853,76,45,butter);
    for(let k=0;k<4;k++){const pts=[[0,330],...Array.from({length:91},(_,i)=>[i/90*1200,150+k*40+Math.sin(i*.12+k+t*.01)*24+Math.cos(i*.21+k)*13]),[1200,330]];polygon(ctx,pts,['#c0adc0','#a18b9e','#80677d',ink][k]);}
    for(const side of [0,1])for(let j=0;j<4;j++){const x=side?1080+j*32:30+j*50,y=300,h=150+j*24;
      line(ctx,[[x,y],[x+(side?-15:15),y-h]],ink,3);
      for(let k=0;k<5;k++){const yy=y-k*h/6-25;ellipse(ctx,x+(side?-17:17),yy,22,7,side?.8:-.8,ink);ellipse(ctx,x+(side?9:-9),yy-18,20,7,side?-.8:.8,ink);}
    }
  }
  if(type==='story'){
    const panels=[[20,18,460,295],[499,18,225,295],[746,18,430,295]];
    for(const [x,y,w,h]of panels){ctx.strokeStyle=ink;ctx.lineWidth=2;ctx.strokeRect(x,y,w,h);}
    circle(ctx,250,166,107,lilac);ctx.save();ctx.translate(250,165);for(let k=0;k<20;k++){ctx.rotate(TAU/20);line(ctx,[[96,0],[158,0]],coral,1);}ctx.restore();text(ctx,'Bir fikir.',250,165,50,ink,'center',750);
    circle(ctx,611,87,39,coral);for(let k=0;k<8;k++){const x=514+k*25;ctx.fillStyle=k%2?plum:ink;ctx.fillRect(x,200-k%3*16,21,112+k%3*16);}
    line(ctx,[[785,259],[785,67],[784,259],[1135,259]],plum,1.5);for(let k=0;k<5;k++){ctx.fillStyle=[plum,coral,butter][k%3];const h=45+k*28;ctx.fillRect(816+k*57,257-h,31,h);}text(ctx,'Veriler de anlatır.',962,55,19,ink,'center',500);
  }
  ctx.restore();
}
function frameSketch(canvas,t){const ctx=canvas.getContext('2d');ctx.clearRect(0,0,720,210);ctx.strokeStyle=ink;ctx.lineWidth=1.5;
  for(let k=0;k<5;k++){const x=16+k*135;ctx.strokeRect(x,38+(k%2?3:0),115,103);const q=(Math.sin(t*.65-k*.6)+1)/2;circle(ctx,x+22+q*69,115-q*48,10+k*1.5,coral);}
  ctx.setLineDash([9,10]);line(ctx,Array.from({length:75},(_,i)=>[24+i*9,99+Math.sin(i*.17)*31]),plum,1);ctx.setLineDash([]);
  ctx.font='500 17px Manrope, sans-serif';ctx.textAlign='left';ctx.fillStyle=plum;ctx.fillText('fikrin, harekete geçsin.',33,178);line(ctx,[[511,172],[664,164]],butter,5);
}
function mathSketch(canvas){const ctx=canvas.getContext('2d');ctx.scale(canvas.width/360,canvas.height/150);line(ctx,[[25,124],[25,20],[25,124],[337,124]],ink,1.8);const pts=Array.from({length:91},(_,i)=>{const x=30+i*3.2;return[x,124-83*Math.exp(-(((x-185)/67)**2))];});line(ctx,pts,ink,2.2);for(let x=105;x<240;x+=9){const y=124-83*Math.exp(-(((x-185)/67)**2));line(ctx,[[x,123],[x,y]],plum,1);}text(ctx,'f(x)',215,25,19,ink);circle(ctx,304,38,10,coral);}
export function initAtelierArt(){
  const frame=document.getElementById('frameArt'),home=document.getElementById('homeView'),covers=[...document.querySelectorAll('[data-cover]')];
  covers.forEach(cv=>cover(cv,cv.dataset.cover));mathSketch(document.getElementById('mathCover'));frameSketch(frame,0);
  let hovered=null,last=0;const motion=matchMedia('(prefers-reduced-motion: reduce)');
  covers.forEach(cv=>{cv.parentElement.addEventListener('pointerenter',()=>{hovered=cv;});cv.parentElement.addEventListener('pointerleave',()=>{hovered=null;cover(cv,cv.dataset.cover);});});
  document.fonts.ready.then(()=>{covers.forEach(cv=>cover(cv,cv.dataset.cover));frameSketch(frame,0);});
  function tick(now){if(!document.hidden&&!home.hidden&&!motion.matches&&now-last>100){frameSketch(frame,now/1000);if(hovered)cover(hovered,hovered.dataset.cover,7.8+Math.sin(now/3000)*.6);last=now;}requestAnimationFrame(tick);}requestAnimationFrame(tick);
}

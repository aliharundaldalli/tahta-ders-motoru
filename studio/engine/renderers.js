import { TAU, clamp, lerp, smooth, random, colorAt, circle, ellipse, line, polygon, text, grain, wash, flowerPath } from './primitives.js';

export function lineArt(ctx, t, s) {
  const p = clamp(t / s.duration * s.speed * 1.25), r = random(s.seed);
  for (let k = 0; k < 7; k++) {
    const cx = 265 + k * 122, cy = 335 + Math.sin(k * 1.7) * 82;
    const pts = flowerPath(cx, cy, 65 + r() * 30, 5 + k % 3);
    line(ctx, pts, colorAt(s, k), 2.2, clamp(p * 2 - k * .14));
    line(ctx, [[cx, cy + 45], [cx - 18, 552], [cx + 20, 580]], colorAt(s, k + 1), 2, clamp(p * 2 - .7 - k * .06));
  }
  ctx.globalAlpha = .55; text(ctx, s.title, 640, 640, 23, colorAt(s, 0), 'center', 400);
}

export function watercolor(ctx, t, s) {
  const p=clamp(t/s.duration*s.speed*1.4),r=random(s.seed),centers=[[348,312,185],[842,373,168],[622,174,84]];
  for(let k=0;k<centers.length;k++){
    const [x,y,size]=centers[k],sway=Math.sin(t*.65+k)*8;
    const stem=Array.from({length:51},(_,j)=>{const u=j/50;return [x-100+110*u+sway*u*u,730-(730-y)*u];});
    ctx.save();ctx.globalAlpha=.58;line(ctx,stem,colorAt(s,0),2.4,smooth(p*1.8-k*.12));
    for(let j=0;j<5;j++){
      const u=.2+j*.12,xx=x-100+110*u+sway*u*u,yy=730-(730-y)*u,direction=j%2?1:-1,growth=smooth(p*1.8-.18-j*.045);
      ctx.save();ctx.translate(xx,yy);ctx.rotate(direction*.65-.9);ctx.scale(growth,growth);ctx.fillStyle=colorAt(s,k+3);ctx.globalAlpha=.42;ctx.beginPath();ctx.moveTo(0,0);ctx.bezierCurveTo(-25,-24,-19,-75,0,-102);ctx.bezierCurveTo(29,-61,20,-21,0,0);ctx.fill();ctx.restore();
    }ctx.restore();
    for(let j=0;j<7;j++){
      const rr=random(s.seed+k*997+j*83),u=smooth(p*1.6-k*.1-j*.035),length=size*(.82+rr()*.3),width=length*(.3+rr()*.12),angle=j/7*TAU+k*.42;
      if(!u)continue;ctx.save();ctx.translate(x+sway,y);ctx.rotate(angle);ctx.scale(u,u);const col=colorAt(s,k+1);
      ctx.beginPath();ctx.moveTo(-10,8);ctx.bezierCurveTo(-width,-length*.22,-width*1.12,-length*.84,-8,-length);ctx.bezierCurveTo(width*.72,-length*1.1,width*1.2,-length*.28,12,8);ctx.closePath();
      ctx.fillStyle=col;ctx.globalAlpha=.32;ctx.fill();ctx.strokeStyle=col;ctx.lineWidth=1;ctx.globalAlpha=.18;ctx.stroke();ctx.clip();
      for(let n=0;n<90*s.detail;n++){ctx.globalAlpha=.035+rr()*.075;circle(ctx,(rr()-.5)*width*2,-rr()*length,2+rr()*12,col);}
      ctx.globalAlpha=.17;line(ctx,[[0,0],[-8,-length*.37],[3,-length*.72]],colorAt(s,0),.7);ctx.restore();
    }
    const u=smooth(p*1.5-k*.1-.2);ctx.save();ctx.globalAlpha=.7*u;
    for(let j=0;j<33;j++){const a=r()*TAU,q=6+r()*20;circle(ctx,x+sway+Math.cos(a)*q,y+Math.sin(a)*q,1.3+r()*2,colorAt(s,0));}ctx.restore();
  }
  const scatter=random(s.seed+991);for(let k=0;k<20;k++){const x=120+scatter()*1040,y=80+scatter()*580;ctx.save();ctx.translate(x,y);ctx.rotate(scatter()*TAU);ctx.globalAlpha=.18*smooth(p*1.5-k*.03);ellipse(ctx,0,0,7+scatter()*13,20+scatter()*22,0,colorAt(s,k+1));ctx.restore();}
  grain(ctx,s.seed,2400*s.detail,.06);
}

export function pastel(ctx, t, s) {
  const p = clamp(t / s.duration * s.speed * 1.3), r = random(s.seed);
  for (let k = 0; k < 7; k++) {
    const u = smooth(p * 1.8 - k * .12); if (!u) continue;
    const y = 180 + k * 49;
    for (let j = 0; j < Math.round(95 * s.detail); j++) {
      ctx.globalAlpha = .12 + r() * .25;
      const a = 240 + r() * 790 * u, yy = y + (r() - .5) * 35;
      line(ctx, [[a, yy], [a + 38 + r() * 35, yy + 5]], colorAt(s, k), 2 + r() * 7);
    }
  }
  ctx.globalAlpha = 1; grain(ctx, s.seed, 2600, .06); text(ctx, s.title, 640, 625, 28, '#403d3b');
}

export function pencil(ctx, t, s) {
  const p = clamp(t / s.duration * s.speed * 1.4), r = random(s.seed);
  for (let k = 0; k < 24; k++) {
    const x = 385 + k * 22, height = 120 + Math.sin(k * .38) * 98;
    line(ctx, [[x, 478], [x + 42, 478 - height]], '#5d5a52', .8, clamp(p * 2 - k / 28));
  }
  for (let k = 0; k < 9; k++) {
    const pts = Array.from({ length: 101 }, (_, i) => { const a = i / 100 * TAU; return [640 + Math.cos(a) * (170 + r() * 4), 355 + Math.sin(a) * (130 + r() * 3)]; });
    ctx.globalAlpha = .12; line(ctx, pts, '#252525', .7, p);
  }
  ctx.globalAlpha = 1; line(ctx, [[405, 485], [875, 485]], '#34322d', 1, p); grain(ctx, s.seed, 2400, .04);
  text(ctx, s.title, 640, 610, 27, '#55524a', 'center', 400);
}

export function ink(ctx, t, s) {
  const p = clamp(t / s.duration * s.speed * 1.25), r = random(s.seed);
  for (let k = 0; k < 5; k++) {
    const pts = Array.from({ length: 180 }, (_, j) => { const a = j / 179; return [235 + a * 800, 245 + k * 55 + Math.sin(a * TAU * 1.5 + k) * 43]; });
    line(ctx, pts, colorAt(s, k), 3 + k * 2, clamp(p * 1.7 - k * .12));
  }
  for (let k = 0; k < 70 * s.detail; k++) { const x = 180 + r() * 920, y = 160 + r() * 370; if (p > r()) { ctx.globalAlpha = .3 + r() * .5; circle(ctx, x, y, r() * 3.5, colorAt(s, 0)); } }
  ctx.globalAlpha = 1; text(ctx, s.title, 640, 625, 29, colorAt(s, 0));
}

export function charcoal(ctx, t, s) {
  const p = clamp(t / s.duration * s.speed * 1.3), r = random(s.seed);
  for (let i = 0; i < 1700 * s.detail * p; i++) {
    const a = r() * TAU, q = Math.sqrt(r()), x = 640 + Math.cos(a) * q * 215, y = 360 + Math.sin(a) * q * 145;
    ctx.globalAlpha = .025 + r() * .06; circle(ctx, x, y, 3 + r() * 18, '#25221f');
  }
  ctx.globalAlpha = .45; line(ctx, [[403, 493], [905, 493]], '#292521', 3, p); ctx.globalAlpha = 1;
  grain(ctx, s.seed, 2500, .05); text(ctx, s.title, 640, 621, 28, '#3f3b34');
}

export function oilPaint(ctx, t, s) {
  const p = clamp(t / s.duration * s.speed * 1.5), r = random(s.seed);
  for (let k = 0; k < 170 * s.detail; k++) {
    const x = 170 + r() * 940, y = 140 + r() * 420, ww = 22 + r() * 90, hh = 6 + r() * 20, a = (r() - .5) * .6;
    if (p < k / (170 * s.detail)) continue;
    ctx.save(); ctx.translate(x, y); ctx.rotate(a); ctx.fillStyle = colorAt(s, Math.floor(y / 75)); ctx.fillRect(-ww / 2, -hh / 2, ww, hh);
    ctx.globalAlpha = .23; for (let j = 0; j < 5; j++) line(ctx, [[-ww / 2, -hh / 2 + j * hh / 5], [ww / 2, -hh / 2 + j * hh / 5]], '#fff6d7', .8);
    ctx.restore();
  }
  text(ctx, s.title, 640, 629, 28, '#e9dfc9');
}

export function pixelArt(ctx, t, s) {
  const step = 10, frame = Math.floor(t * s.speed * 8), r = random(s.seed);
  ctx.imageSmoothingEnabled = false;
  for (let k = 0; k < 70; k++) { ctx.fillStyle = colorAt(s, 2); ctx.globalAlpha = .2 + .5 * ((Math.sin(frame * .14 + k) + 1) / 2); ctx.fillRect(Math.floor(r() * 128) * step, Math.floor(r() * 38) * step, step / 2, step / 2); }
  ctx.globalAlpha = 1;
  for (let x = 0; x < 128; x++) { const h = Math.floor(10 + Math.sin(x * .09) * 6 + Math.sin(x * .23) * 3); ctx.fillStyle = colorAt(s, 1); ctx.fillRect(x * step, 720 - h * step, step, h * step); }
  const sprite = ['0011100','0111110','1111111','1101011','1111111','0111110','0011100','0110110','1100011'];
  const xx = 610 + Math.sin(t * s.speed) * 170, yy = 360 + Math.sin(t * s.speed * 2) * 30;
  sprite.forEach((row, y) => [...row].forEach((v, x) => { if (v === '1') { ctx.fillStyle = colorAt(s, 0); ctx.fillRect(Math.round(xx / step + x) * step, Math.round(yy / step + y) * step, step, step); } }));
  text(ctx, s.title.toUpperCase(), 640, 100, 31, colorAt(s, 0));
}

export function retro(ctx, t, s) {
  const tt = t * s.speed, grad = ctx.createLinearGradient(0, 80, 0, 380); grad.addColorStop(0, colorAt(s, 0)); grad.addColorStop(1, colorAt(s, 1));
  ctx.save(); ctx.beginPath(); ctx.arc(640, 290, 137, 0, TAU); ctx.clip(); ctx.fillStyle = grad; ctx.fillRect(490, 135, 300, 300);
  ctx.fillStyle = s.background; for (let y = 310; y < 440; y += 16) ctx.fillRect(490, y, 300, 5 + (y - 310) / 17); ctx.restore();
  polygon(ctx, [[0,440],[155,335],[290,440],[397,351],[505,440],[810,440],[960,334],[1100,430],[1280,345],[1280,720],[0,720]], '#121525');
  for (let k = -12; k <= 12; k++) line(ctx, [[640 + k * 18, 445], [640 + k * 155, 720]], colorAt(s, 2), 1);
  for (let k = 0; k < 14; k++) { const z = ((k / 14 + tt * .11) % 1) ** 2; line(ctx, [[0, 445 + z * 275], [1280, 445 + z * 275]], colorAt(s, 2), 1); }
  text(ctx, s.title.toUpperCase(), 640, 89, 43, '#fff1e8', 'center', 700);
}

export function kineticType(ctx, t, s) {
  const words = s.title.split(/\s+/).filter(Boolean).slice(0, 5), tt = t * s.speed;
  words.forEach((w, i) => { const u = smooth(tt / 1.3 - i * .35); ctx.save(); ctx.translate(640 + (1 - u) * (i % 2 ? -500 : 500), 220 + i * 85); ctx.rotate((1 - u) * .2); ctx.globalAlpha = u; text(ctx, w.toUpperCase(), 0, 0, Math.min(76, 840 / Math.max(1, w.length) * 1.6), colorAt(s, i)); ctx.restore(); });
  const xx = 200 + (tt * 80) % 880; ctx.fillStyle = colorAt(s, 1); ctx.fillRect(xx, 622, 80, 5);
}

export function geometric(ctx, t, s) {
  const tt = t * s.speed;
  for (let k = 0; k < 7; k++) {
    ctx.save(); ctx.translate(640, 348); ctx.rotate(tt * .15 * (k % 2 ? 1 : -1) + k * .2);
    ctx.strokeStyle = colorAt(s, k); ctx.lineWidth = 2; const rr = 60 + k * 29;
    line(ctx, Array.from({ length: 7 }, (_, j) => [Math.cos(j / 6 * TAU) * rr, Math.sin(j / 6 * TAU) * rr]), colorAt(s, k), 2);
    circle(ctx, rr, 0, 6, colorAt(s, k)); ctx.restore();
  }
  text(ctx, s.title, 640, 650, 25, colorAt(s, 0), 'center', 400);
}

export function particles(ctx, t, s) {
  const r = random(s.seed), tt = t * s.speed;
  ctx.globalCompositeOperation = 'screen';
  for (let i = 0; i < 230 * s.detail; i++) {
    const a = r() * TAU, v = .25 + r() * .9, age = (tt * v + r() * 4) % 4, radius = age * 85;
    ctx.globalAlpha = Math.sin(age / 4 * Math.PI) * .7;
    circle(ctx, 640 + Math.cos(a) * radius, 360 + Math.sin(a) * radius * .75, 1 + r() * 4, colorAt(s, i));
  }
  ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over'; text(ctx, s.title, 640, 640, 27, colorAt(s, 0));
}

export function flowField(ctx, t, s) {
  const r = random(s.seed), tt = t * s.speed * .25;
  for (let i = 0; i < 110 * s.detail; i++) {
    let x = r() * 1280, y = r() * 720; const pts = [[x, y]];
    for (let k = 0; k < 70; k++) { const a = Math.sin(x * .004 + tt) * 2 + Math.cos(y * .005 - tt) * 2; x += Math.cos(a) * 4; y += Math.sin(a) * 4; pts.push([x,y]); }
    ctx.globalAlpha = .3; line(ctx, pts, colorAt(s, i), 1.2, clamp(t / 2));
  }
  ctx.globalAlpha = 1; text(ctx, s.title, 640, 655, 26, colorAt(s, 0));
}

export function botanical(ctx, t, s) {
  const tt = t * s.speed, p = smooth(tt / (s.duration * .65)), r = random(s.seed);
  for (let k = 0; k < 6; k++) {
    const x = 220 + k * 168, top = 195 + r() * 130, sway = Math.sin(tt * .8 + k) * 9;
    const pts = Array.from({ length: 41 }, (_, j) => { const u = j / 40; return [x + Math.sin(u * Math.PI) * 22 + sway * u, 590 - u * (590 - top)]; });
    line(ctx, pts, colorAt(s, 1), 3, p);
    for (let j = 1; j < 5; j++) { const u = j / 6; if (p < u) continue; const yy = 590 - u * (590 - top), xx = x + Math.sin(u * Math.PI) * 22 + sway * u; ellipse(ctx, xx + (j % 2 ? 25 : -25), yy - 12, 34 * smooth((p - u) * 5), 11, j % 2 ? -.6 : .6, colorAt(s, 1)); }
    if (p > .8) { const rr = smooth((p - .8) * 5) * 38; for (let j = 0; j < 6; j++) { const a = j / 6 * TAU; ellipse(ctx, x + sway + Math.cos(a) * rr * .65, top + Math.sin(a) * rr * .65, rr * .62, rr * .28, a, colorAt(s, k)); } circle(ctx, x + sway, top, rr * .2, colorAt(s, 2)); }
  }
  grain(ctx, s.seed, 2000, .025); text(ctx, s.title, 640, 660, 26, '#3d5147');
}

export function landscape(ctx, t, s) {
  const tt = t * s.speed;
  circle(ctx, 890, 188, 65, colorAt(s, 0));
  for (let k = 0; k < 5; k++) {
    const pts = [[0,720]]; for (let x = 0; x <= 1280; x += 12) { const y = 280 + k * 65 + Math.sin(x * (.003 + k * .001) + tt * (.04 + k * .025) + k) * (65 - k * 8) + Math.cos(x * .009 + k) * 15; pts.push([x,y]); }
    pts.push([1280,720]); polygon(ctx, pts, colorAt(s, k + 1));
  }
  for (let k = 0; k < 4; k++) { const x = (tt * 26 + k * 130 + 170) % 1400; line(ctx, [[x - 9,154],[x,149],[x + 9,154]], '#f7ead2', 2); }
  text(ctx, s.title, 640, 85, 35, '#fff5df');
}

export function paperCut(ctx, t, s) {
  const tt = t * s.speed;
  for (let k = 0; k < 7; k++) {
    ctx.save(); ctx.shadowColor = '#19191940'; ctx.shadowBlur = 15; ctx.shadowOffsetY = 9;
    const pts = [[0,720]]; for (let x = 0; x <= 1280; x += 15) pts.push([x, 205 + k * 61 + Math.sin(x * .006 + k + Math.sin(tt * .25) * .2) * 55]);
    pts.push([1280,720]); polygon(ctx, pts, colorAt(s,k)); ctx.restore();
  }
  ctx.save(); ctx.translate(880,190); ctx.rotate(Math.sin(tt * .3) * .05); ctx.shadowColor='#16161635'; ctx.shadowBlur=15; polygon(ctx,[[-70,0],[0,-70],[70,0],[0,70]],'#f5dfac'); ctx.restore();
  text(ctx, s.title, 270, 105, 33, '#fff3de', 'left');
}

export function comic(ctx, t, s) {
  const tt = t * s.speed, p = smooth(tt / 2);
  ctx.strokeStyle = colorAt(s,0); ctx.lineWidth = 6; ctx.strokeRect(90,90,1100,530);
  for (let k=0;k<48;k++) { const a=k/48*TAU, inner=140+Math.sin(k*2)*24; line(ctx,[[640+Math.cos(a)*inner,355+Math.sin(a)*inner*.65],[640+Math.cos(a)*570,355+Math.sin(a)*270]],colorAt(s,1),1.8); }
  const star = Array.from({length:24},(_,i)=>{const a=i/24*TAU,rr=i%2?135:207;return [640+Math.cos(a)*rr*p,355+Math.sin(a)*rr*.68*p];}); polygon(ctx,star,colorAt(s,2)); line(ctx,[...star,star[0]],colorAt(s,0),4);
  ctx.save(); ctx.translate(640,355); ctx.rotate(Math.sin(tt*5)*.02); text(ctx,s.title.toUpperCase(),0,0,Math.min(63,550/Math.max(1,s.title.length)*1.6),colorAt(s,0)); ctx.restore();
  for(let y=115;y<600;y+=18) for(let x=112;x<1180;x+=18) {ctx.globalAlpha=.08;circle(ctx,x,y,2,colorAt(s,0));} ctx.globalAlpha=1;
}

export function dataViz(ctx, t, s) {
  const p = smooth(t * s.speed / (s.duration * .65)), r = random(s.seed), vals = Array.from({length:6},()=>.25+r()*.65);
  line(ctx, [[190,180],[190,550],[1100,550]], colorAt(s,0), 1.5);
  for(let k=0;k<6;k++) { const h=vals[k]*320*p; ctx.fillStyle=colorAt(s,k); ctx.fillRect(245+k*140,550-h,85,h); text(ctx,String(Math.round(vals[k]*100*p)),287+k*140,526-h,23,colorAt(s,0)); text(ctx,String.fromCharCode(65+k),287+k*140,583,20,colorAt(s,0)); }
  text(ctx,s.title,190,107,34,colorAt(s,0),'left');
}

export function isometric(ctx, t, s) {
  const tt=t*s.speed, r=random(s.seed), iso=(x,y,z)=>[640+(x-y)*58,210+(x+y)*29-z];
  for(let sum=0;sum<9;sum++) for(let x=0;x<5;x++) {const y=sum-x;if(y<0||y>4)continue; const h=(35+r()*95)*(.7+.3*Math.sin(tt*.8+x+y)); const a=iso(x,y,0),b=iso(x+1,y,0),c=iso(x+1,y+1,0),d=iso(x,y+1,0),aa=iso(x,y,h),bb=iso(x+1,y,h),cc=iso(x+1,y+1,h),dd=iso(x,y+1,h); polygon(ctx,[a,b,bb,aa],colorAt(s,1)); polygon(ctx,[b,c,cc,bb],colorAt(s,2)); polygon(ctx,[aa,bb,cc,dd],colorAt(s,0)); line(ctx,[aa,bb,cc,dd,aa],'#ffffff25',1); }
  text(ctx,s.title,640,650,28,colorAt(s,0));
}

export function physics(ctx, t, s) {
  const tt=t*s.speed, origin=[640,160], len=260, a=Math.sin(tt*1.6)*.72;
  line(ctx,[[420,160],[860,160]],colorAt(s,0),5); circle(ctx,...origin,6,colorAt(s,0));
  for(let k=0;k<24;k++){const aa=Math.sin((tt-k*.025)*1.6)*.72;ctx.globalAlpha=(1-k/24)*.045;circle(ctx,origin[0]+Math.sin(aa)*len,origin[1]+Math.cos(aa)*len,28,colorAt(s,1));}ctx.globalAlpha=1;
  const pos=[origin[0]+Math.sin(a)*len,origin[1]+Math.cos(a)*len]; line(ctx,[origin,pos],colorAt(s,0),3);circle(ctx,...pos,28,colorAt(s,1));
  line(ctx,Array.from({length:161},(_,i)=>[350+i*3.6,560+Math.sin(tt*1.6-i*.04)*23]),colorAt(s,2),2);
  text(ctx,s.title,640,83,32,colorAt(s,0));
}

export const RENDERERS = { 'line-art':lineArt, watercolor, pastel, pencil, ink, charcoal, 'oil-paint':oilPaint, 'pixel-art':pixelArt, retro, 'kinetic-type':kineticType, geometric, particles, 'flow-field':flowField, botanical, landscape, 'paper-cut':paperCut, comic, 'data-viz':dataViz, isometric, physics };

'use strict';
/* main.js : boot, background texture, preview UI (play/scrub/subs/debug/sfx), window.__render for the renderer */
(async function () {
  const Q = new URLSearchParams(location.search), RENDER = Q.has('render');
  if (RENDER) document.body.classList.add('render');
  await Promise.all(['400', '700'].map(w => document.fonts.load(`${w} 48px Kalam`, 'abcğşıİçöüĞŞÇÖÜ∇')));
  await document.fonts.ready;
  const $ = id => document.getElementById(id), stage = $('stage');

  /* board texture: seeded grain + faint chalk-dust blotches + vignette (CSS background, deterministic) */
  (function () {
    const c = document.createElement('canvas'); c.width = c.height = 256; const x = c.getContext('2d'), im = x.createImageData(256, 256), R = rng(1234);
    for (let i = 0; i < 256 * 256; i++) { const v = R() < .5 ? 255 : 0; im.data[i * 4] = im.data[i * 4 + 1] = im.data[i * 4 + 2] = v; im.data[i * 4 + 3] = Math.floor(R() * 9); }
    x.putImageData(im, 0, 0);
    const R2 = rng(77), blots = []; for (let i = 0; i < 7; i++) blots.push(`radial-gradient(${300 + R2() * 500}px ${200 + R2() * 300}px at ${R2() * 100}% ${R2() * 100}%,rgba(255,255,240,.018),transparent)`);
    stage.style.backgroundImage = [`radial-gradient(ellipse at 50% 45%,rgba(0,0,0,0) 55%,rgba(0,0,0,.34) 100%)`, ...blots, `url(${c.toDataURL()})`].join(',');
  })();

  Board.init(LESSON, $('svg'));
  const TOTAL = Board.total, segs = Board.segs;
  /* subtitle chunks per segment */
  segs.forEach(sg => {
    const ch = []; let cur = [];
    sg.all.forEach((w, i) => { cur.push(w); const last = /[.?!]$/.test(w.w) || i === sg.all.length - 1; if (last || (cur.length > 14 && /[,;:]$/.test(w.w))) { ch.push({ t0: sg.t0 + cur[0].start, text: cur.map(x => x.w).join(' ') }); cur = []; } });
    ch.forEach((c, i) => c.t1 = i < ch.length - 1 ? ch[i + 1].t0 : sg.tEnd); sg.chunks = ch;
  });
  const subsOn = Q.get('subs') === '1'; let flags = { subs: subsOn, debug: Q.has('debug'), sfx: true };
  let tNow = 0;
  function overlays(t) {
    const sg = Board.segAt(t);
    if (flags.subs) { const c = sg.chunks.find(c => t >= c.t0 && t < c.t1); $('sub').style.display = 'flex'; const sp = document.querySelector('#sub span'); sp.textContent = c ? c.text : ''; sp.style.display = c ? '' : 'none'; } else $('sub').style.display = 'none';
    if (flags.debug) {
      const lt = t - sg.t0, W = sg.all, wi = W.findIndex(w => lt < w.end); const i0 = Math.max(0, wi - 3);
      const cues = Board.cues.filter(c => c.seg === sg.id).map(c => `${(c.start).toFixed(2).padStart(7)}  ${c.want == null ? 'NOCUE' : (c.want - sg.t0 >= 0 ? '+' : '') + (c.want - sg.t0).toFixed(2)}  ${c.type.padEnd(9)} ${c.cue}`).join('\n');
      $('debug').style.display = 'block';
      $('debug').textContent = `t ${t.toFixed(2)}  frame ${Math.round(t * 30)}  seg ${sg.id}  local ${lt.toFixed(2)}/${sg.dur.toFixed(1)}  warnings ${Board.warnings.length}\n` +
        'words: ' + W.slice(i0, i0 + 8).map((w, k) => (i0 + k === wi ? '▶' : '') + w.w + '@' + w.start.toFixed(2)).join('  ') + '\n--- cues (abs start | seg-local want | type | phrase)\n' + cues + (Board.warnings.length ? '\n--- warnings\n' + Board.warnings.slice(-6).join('\n') : '');
    } else $('debug').style.display = 'none';
  }
  window.__render = t => { tNow = t; Board.render(t); overlays(t); };
  window.__total = TOTAL; window.__segs = segs.map(s => ({ id: s.id, start: s.tStart, audioStart: s.t0, dur: s.dur, end: s.tEnd }));
  Board.render(0); overlays(0);

  /* ---- preview ---- */
  function fit() { const s = Math.min(innerWidth / 1920, innerHeight / 1080); stage.style.transform = `translate(${(innerWidth - 1920 * s) / 2}px,${(innerHeight - 1080 * s) / 2}px) scale(${s})`; }
  if (RENDER) { stage.style.transform = 'none'; window.__ready = true; return; }
  fit(); addEventListener('resize', fit);
  const seek = $('seek'); seek.max = TOTAL;
  segs.forEach(s => { const i = document.createElement('i'); i.style.left = (s.tStart / TOTAL * 100) + '%'; const b = document.createElement('b'); b.textContent = s.id; b.style.left = (s.tStart / TOTAL * 100) + '%'; $('marks').append(i, b); });
  let playing = false, wall0 = 0, t0 = 0, actx, sfxBuf, src;
  async function ensureAudio() { if (actx) return; actx = new AudioContext(); const f = SFX.render(Board.events, TOTAL, 44100); sfxBuf = actx.createBuffer(1, f.length, 44100); sfxBuf.copyToChannel(f, 0); }
  function stopAudio() { if (src) { try { src.stop(); } catch (e) { } src = null; } }
  async function startAudio() { stopAudio(); if (!flags.sfx) return; await ensureAudio(); src = actx.createBufferSource(); src.buffer = sfxBuf; src.connect(actx.destination); src.start(0, tNow); }
  function play() { if (tNow >= TOTAL - .05) tNow = 0; playing = true; t0 = tNow; wall0 = performance.now(); $('bPlay').textContent = '❚❚'; startAudio().then(() => { wall0 = performance.now(); t0 = tNow; }); }
  function pause() { playing = false; stopAudio(); $('bPlay').textContent = '▶'; }
  const toggle = () => playing ? pause() : play();
  const go = t => { tNow = clamp(t, 0, TOTAL); if (playing) { t0 = tNow; wall0 = performance.now(); startAudio(); } window.__render(tNow); };
  $('bPlay').onclick = toggle; $('bRestart').onclick = () => { go(0); if (!playing) play(); };
  seek.oninput = () => go(+seek.value);
  const tog = (id, k, fn) => { $(id).onclick = () => { flags[k] = !flags[k]; $(id).classList.toggle('on', flags[k]); fn && fn(); window.__render(tNow); }; $(id).classList.toggle('on', flags[k]); };
  tog('bSfx', 'sfx', () => { playing ? startAudio() : 0; }); tog('bSubs', 'subs'); tog('bDebug', 'debug');
  $('bFs').onclick = () => document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen();
  addEventListener('keydown', e => {
    if (e.code === 'Space') { e.preventDefault(); toggle(); } else if (e.key === 'ArrowRight') go(tNow + (e.shiftKey ? 10 : 2)); else if (e.key === 'ArrowLeft') go(tNow - (e.shiftKey ? 10 : 2));
    else if (/^[cC]$/.test(e.key)) $('bSubs').click(); else if (/^[dD]$/.test(e.key)) $('bDebug').click(); else if (/^[mM]$/.test(e.key)) $('bSfx').click();
    else if (/^[hH]$/.test(e.key)) $('panel').classList.toggle('hide'); else if (/^[fF]$/.test(e.key)) $('bFs').click(); else if (/^[rR]$/.test(e.key)) $('bRestart').click();
    else if (e.key === ']') { const n = segs.find(s => s.tStart > tNow + .01); if (n) go(n.tStart); } else if (e.key === '[') { const p = [...segs].reverse().find(s => s.tStart < tNow - .5); go(p ? p.tStart : 0); }
  });
  (function loop() {
    if (playing) { tNow = t0 + (performance.now() - wall0) / 1000; if (tNow >= TOTAL) { tNow = TOTAL; pause(); } window.__render(tNow); }
    seek.value = tNow; $('tlabel').textContent = fmt(tNow) + ' / ' + fmt(TOTAL); $('slabel').textContent = Board.segAt(tNow).id;
    requestAnimationFrame(loop);
  })();
  window.__ready = true;
})();

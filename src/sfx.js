'use strict';
/* sfx.js : deterministic synthesized SFX (chalk/pen scratch, marker, page flip, draw swish, tick). Pure JS, no WebAudio:
   used by the browser preview AND by tools/export_sfx.mjs (same event list the visuals produce -> window.__events).
   SFX.render(events,total,sr) -> Float32Array (mono);  SFX.wav(f32,sr) -> Uint8Array. Levels are intentionally low. */
(function (root) {
  function rng(seed) { let a = seed >>> 0; return () => { a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  function bp() { return { x1: 0, x2: 0, y1: 0, y2: 0, b0: 0, b1: 0, b2: 0, a1: 0, a2: 0, set(fc, q, sr) { const w = 2 * Math.PI * fc / sr, al = Math.sin(w) / (2 * q), a0 = 1 + al; this.b0 = al / a0; this.b1 = 0; this.b2 = -al / a0; this.a1 = -2 * Math.cos(w) / a0; this.a2 = (1 - al) / a0; }, run(x) { const y = this.b0 * x + this.b2 * this.x2 - this.a1 * this.y1 - this.a2 * this.y2; this.x2 = this.x1; this.x1 = x; this.y2 = this.y1; this.y1 = y; return y; } }; }
  const env = (k, n, a, r) => Math.min(1, k / a, (n - k) / r);

  /* chalk / pen scratch: noise through a moving band-pass, amplitude pulsed like individual strokes (~8-14 Hz) */
  function scratch(o, e, sr, kind) {
    const R = rng(e.seed + 7), i0 = Math.floor(e.t * sr), n = Math.floor((e.dur + .05) * sr), f = bp();
    const mark = kind === 'marker', rate = (mark ? 5 : 9) + R() * 4, ph0 = R() * 6.28, g = (mark ? .55 : 1.0) * (e.amp ?? 1) * .13;
    let phase = ph0;
    for (let k = 0; k < n; k++) {
      const tt = k / sr;
      phase += 2 * Math.PI * (rate + 3 * Math.sin(tt * 1.7 + ph0) + 1.5 * Math.sin(tt * 4.3)) / sr;
      if (k % 48 === 0) f.set((mark ? 1500 : 2900) + (mark ? 500 : 1400) * (.5 + .5 * Math.sin(phase * .5 + 1)), mark ? 2.2 : 1.2, sr);
      const stroke = .35 + .65 * Math.pow(Math.abs(Math.sin(phase)), .7);
      const x = f.run(R() * 2 - 1);
      if (i0 + k < o.length) o[i0 + k] += x * stroke * env(k, n, .03 * sr, .06 * sr) * g;
    }
  }
  function flip(o, e, sr) {
    const R = rng(e.seed || 3), i0 = Math.floor(e.t * sr), scroll = e.style === 'scroll', dur = scroll ? .8 : .45, n = Math.floor(dur * sr), f = bp(); let lp = 0;
    for (let k = 0; k < n; k++) {
      const u = k / n, h = Math.sin(Math.PI * Math.pow(u, .7)); if (k % 32 === 0) f.set(scroll ? 700 + 500 * u : 4200 - 3000 * u, .7, sr);
      const x = f.run(R() * 2 - 1); lp += (x - lp) * .5;
      let v = lp * h * (scroll ? .09 : .25);
      if (!scroll && k < .09 * sr) v += Math.sin(2 * Math.PI * 95 * k / sr) * Math.exp(-k / (.025 * sr)) * .09;
      if (i0 + k < o.length) o[i0 + k] += v;
    }
  }
  function draw(o, e, sr) {
    const R = rng(e.seed + 1), i0 = Math.floor(e.t * sr), n = Math.floor(e.dur * sr), f = bp();
    for (let k = 0; k < n; k++) { const u = k / n; if (k % 32 === 0) f.set(1500 + 2200 * u, .9, sr); const x = f.run(R() * 2 - 1); if (i0 + k < o.length) o[i0 + k] += x * Math.sin(Math.PI * u) * .1 * (e.amp ?? 1); }
  }
  function tick(o, e, sr) {
    const R = rng(e.seed + 2), i0 = Math.floor(e.t * sr), n = Math.floor(.06 * sr);
    for (let k = 0; k < n; k++) if (i0 + k < o.length) o[i0 + k] += (Math.sin(2 * Math.PI * 1500 * k / sr) * .7 + (R() - .5) * .3) * Math.exp(-k / (.012 * sr)) * .07;
  }
  function render(events, total, sr = 44100) {
    const L = Math.ceil((total + 1) * sr), o = new Float32Array(L), w = new Float32Array(L), x = new Float32Array(L);
    for (const e of events) {   /* w: writing sounds, x: everything else (separate gains, see SFX.gain) */
      if (e.type === 'scratch') scratch(w, e, sr); else if (e.type === 'marker') scratch(w, e, sr, 'marker');
      else if (e.type === 'flip') flip(x, e, sr); else if (e.type === 'draw') draw(x, e, sr); else if (e.type === 'tick') tick(x, e, sr);
    }
    const gw = 10 ** (SFX.gain.write / 20), gx = 10 ** (SFX.gain.other / 20);
    for (let i = 0; i < L; i++) o[i] = w[i] * gw + x[i] * gx;
    for (let i = 0; i < o.length; i++) o[i] = Math.tanh(o[i] * 1.5) / 1.5;
    return o;
  }
  function wav(f32, sr = 44100) {
    const n = f32.length, b = new Uint8Array(44 + n * 2), v = new DataView(b.buffer), s = (o, t) => [...t].forEach((c, i) => v.setUint8(o + i, c.charCodeAt(0)));
    s(0, 'RIFF'); v.setUint32(4, 36 + n * 2, true); s(8, 'WAVEfmt '); v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 1, true); v.setUint32(24, sr, true); v.setUint32(28, sr * 2, true); v.setUint16(32, 2, true); v.setUint16(34, 16, true); s(36, 'data'); v.setUint32(40, n * 2, true);
    for (let i = 0; i < n; i++) v.setInt16(44 + i * 2, Math.max(-1, Math.min(1, f32[i])) * 32767, true);
    return b;
  }
  const api = { render, wav, gain: { write: -Infinity, other: -6 } }; root.SFX = api; if (typeof module !== 'undefined') module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);

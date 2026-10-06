'use strict';
/* util.js : constants, colors, SVG helpers, easing, seeded rng, cue normalisation */
const NS = 'http://www.w3.org/2000/svg';
const W = 1920, H = 1080;
/* layout: left/right margin 110, top 80, bottom 130 px always free (subtitle band) */
const LAY = { ml: 110, mr: 110, mt: 80, bottom: H - 130, w: W - 220 };
const COL = { ink: '#f1ead8', amber: '#f2b440', mint: '#6fd3b0', coral: '#ef7a63', grey: '#a9a596', board: '#1d2420', plane: '#f29a52' };
const col = c => COL[c] || c || COL.ink;
function S(tag, attrs, parent) { const e = document.createElementNS(NS, tag); if (attrs) for (const k in attrs) e.setAttribute(k, attrs[k]); if (parent) parent.appendChild(e); return e; }
function A(e, attrs) { for (const k in attrs) e.setAttribute(k, attrs[k]); return e; }
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const lerp = (a, b, u) => a + (b - a) * u;
const ease = u => u < .5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2;
const easeOut = u => 1 - Math.pow(1 - u, 3);
const easeSine = u => .5 - .5 * Math.cos(Math.PI * u);
function rng(seed) { let a = seed >>> 0; return () => { a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
function hstr(s) { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
function hexRgb(h) { const n = parseInt(h.slice(1), 16); return [n >> 16 & 255, n >> 8 & 255, n & 255]; }
function rgba(c, a) { c = col(c); if (c[0] !== '#') return c; const [r, g, b] = hexRgb(c); return `rgba(${r},${g},${b},${a})`; }
/* diacritic / case-insensitive normalisation for cue matching (Turkish aware) */
function norm(s) { return s.replace(/İ/g, 'i').replace(/I/g, 'ı').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/ı/g, 'i').replace(/[^a-z0-9]/g, ''); }
const fmt = s => { s = Math.max(0, s); return Math.floor(s / 60) + ':' + (s % 60).toFixed(1).padStart(4, '0'); };

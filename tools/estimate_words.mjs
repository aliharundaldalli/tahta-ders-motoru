// Usage: node tools/estimate_words.mjs   -> timing/words.json (+ timing/words.js)
// ESTIMATE of word timings from docs/NARRATION.md (spoken text = non-`>>` lines under `## sNN` headings, ~2.3 words/s).
// words.json format (also what a real ElevenLabs-derived file must look like):
//   { "s02": { "duration": 31.2, "words": [ {"w":"İlk","start":0.0,"end":0.31}, ... ] }, ... }   (seconds, relative to audio start)
import fs from 'fs'; import path from 'path'; import {fileURLToPath} from 'url';
const here = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const md = fs.readFileSync(here + '/docs/NARRATION.md', 'utf8').split('\n');
const segs = {}; let cur = null;
for (const ln of md) {
  const h = ln.match(/^## ([a-z]+\d\d[a-z]?)\b/); if (h) { cur = h[1]; segs[cur] = []; continue; }
  if (cur && ln.trim() && !ln.startsWith('>>') && !ln.startsWith('---')) segs[cur].push(ln.trim());
}
const out = {};
for (const [id, lines] of Object.entries(segs)) {
  const words = []; let t = 0.15;
  for (const w of lines.join(' ').split(/\s+/).filter(Boolean)) {
    const letters = w.replace(/[^\p{L}\p{N}]/gu, '').length || 1;
    const d = 0.17 + 0.04 * letters;                    // ≈0.43 s/word for 6-letter words -> ~2.3 words/s incl. pauses
    words.push({ w, start: +t.toFixed(3), end: +(t + d).toFixed(3) });
    t += d + (/[.?!]$/.test(w) ? 0.45 : /[,;:]$/.test(w) ? 0.2 : 0.03);
  }
  out[id] = { duration: +(t + 0.2).toFixed(2), words };
}
fs.mkdirSync(here + '/timing', { recursive: true });
fs.writeFileSync(here + '/timing/words.json', JSON.stringify(out, null, 1));
fs.writeFileSync(here + '/timing/words.js', 'window.WORDS = ' + JSON.stringify(out) + ';\n');
console.log(Object.keys(out).length, 'segments; total', Object.values(out).reduce((a, s) => a + s.duration, 0).toFixed(0), 's');

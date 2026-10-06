// Usage: node tools/words_from_alignment.mjs s02=align_s02.json s12=align_s12.json ...  -> timing/words.json (+words.js)
// Converts ElevenLabs character alignment ({characters, character_start_times_seconds, character_end_times_seconds}
// or {alignment:{...}}) into the words.json format. Whitespace-separated words, same as estimate_words.mjs.
import fs from 'fs'; import path from 'path'; import {fileURLToPath} from 'url';
const here = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const out = fs.existsSync(here + '/timing/words.json') ? JSON.parse(fs.readFileSync(here + '/timing/words.json', 'utf8')) : {};
for (const a of process.argv.slice(2)) {
  const [id, file] = a.split('='); let j = JSON.parse(fs.readFileSync(file, 'utf8')); j = j.alignment || j.normalized_alignment || j;
  const ch = j.characters, s = j.character_start_times_seconds, e = j.character_end_times_seconds, words = []; let w = '', ws = 0, we = 0;
  ch.forEach((c, i) => { if (/\s/.test(c)) { if (w) words.push({ w, start: +ws.toFixed(3), end: +we.toFixed(3) }); w = ''; } else { if (!w) ws = s[i]; w += c; we = e[i]; } });
  if (w) words.push({ w, start: +ws.toFixed(3), end: +we.toFixed(3) });
  out[id] = { duration: +(e[e.length - 1] + 0.05).toFixed(2), words };
}
fs.writeFileSync(here + '/timing/words.json', JSON.stringify(out, null, 1));
fs.writeFileSync(here + '/timing/words.js', 'window.WORDS = ' + JSON.stringify(out) + ';\n'); console.log('merged', process.argv.length - 2, 'segments');

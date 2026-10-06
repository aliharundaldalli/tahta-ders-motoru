// Usage: node tools/pack_words.mjs  -> wraps timing/words.json into timing/words.js (needed because file:// can't fetch JSON)
import fs from 'fs'; import path from 'path'; import {fileURLToPath} from 'url';
const here = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
fs.writeFileSync(here + '/timing/words.js', 'window.WORDS = ' + JSON.stringify(JSON.parse(fs.readFileSync(here + '/timing/words.json', 'utf8'))) + ';\n'); console.log('timing/words.js written');

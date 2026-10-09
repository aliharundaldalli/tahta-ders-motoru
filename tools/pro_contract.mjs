import fs from 'node:fs';import {validateProject} from '../kare/engine/render.js';import {qualityCheck,subtitleFile} from '../kare/engine/pro.js';
try{const p=validateProject(JSON.parse(fs.readFileSync(0,'utf8')));process.stdout.write(JSON.stringify({project:p,issues:qualityCheck(p),srt:subtitleFile(p),vtt:subtitleFile(p,'vtt')}));}catch(e){process.stderr.write(e.message);process.exitCode=1;}

// Kare tarayıcı/entegrasyon testleri için ortak ayarlar. Sunucu: tools/kare.sh start (oturum anahtarı .studio-data/kare-session.json'da).
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {CHROME_DEFAULT} from './chrome_path.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
let session={};try{session=JSON.parse(fs.readFileSync(path.join(process.env.KARE_DATA_DIR||path.join(root,'.studio-data'),'kare-session.json'),'utf8'));}catch{}
export const PORT=process.env.KARE_PORT||session.port||8771;
export const TOKEN=process.env.KARE_TOKEN||session.token||'';
export const BASE=`http://127.0.0.1:${PORT}`;
export const CHROME=process.env.CHROME_PATH||CHROME_DEFAULT;
export const kareUrl=(hash='')=>`${BASE}/kare/?t=${encodeURIComponent(TOKEN)}${hash}`;
export const kfetch=(url,options={})=>fetch(url.startsWith('http')?url:BASE+url,{...options,headers:{'X-Kare-Token':TOKEN,...(options.headers||{})}});
if(!TOKEN)console.warn('Uyarı: Kare oturum anahtarı yok. Önce tools/kare.sh start çalıştır ya da KARE_TOKEN ver.');

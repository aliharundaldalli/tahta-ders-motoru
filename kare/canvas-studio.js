import {enforceStyle,preloadProject} from './engine/pro.js';
import { CATEGORIES } from './engine/catalog.js';
import { RENDERERS } from './engine/renderers.js';
import { defaultScene, validateScene, validateProject, renderScene, renderProject, projectDuration, sceneAt } from './engine/render.js';
import { initAtelierArt } from './theme-art.js';

const FAMILIES=[{id:'paint',name:'Çizim & boya',label:'Çizim',styles:['line-art','watercolor','pastel','pencil','ink','charcoal','oil-paint']},{id:'motion',name:'Hareket & tasarım',label:'Hareket',styles:['pixel-art','retro','kinetic-type','geometric','isometric']},{id:'nature',name:'Doğa & atmosfer',label:'Doğa',styles:['particles','flow-field','botanical','landscape']},{id:'story',name:'Hikâye & veri',label:'Anlatım',styles:['paper-cut','comic','data-viz']},{id:'learn',name:'Matematik & eğitim',label:'Eğitim',styles:['physics']}];
const familyFor=category=>FAMILIES.find(f=>f.styles.includes(category))||FAMILIES[0];

const $ = id => document.getElementById(id), clone = value => structuredClone(value);
const STORE = 'canvas-studio-project-v1', ctx = $('stage').getContext('2d'), history = [];
let project = { version:1, name:'Çiçeklerin dansı', width:1280, height:720, fps:30, scenes:[defaultScene('watercolor')] };
let selected=0,time=6.8,playing=false,lastTick=0,group='paint',tab='skill',pendingAi=null,exporting=false,cancelVideo=null,hadSavedProject=false;
let connection={configured:false,model:''}, skillRequest=0;
let narrationAudio=null,audioKey='',audioAttempted=false;
let voiceProvider=null,voiceChecked=false,voiceJob=null;
try { const raw=localStorage.getItem(STORE); if(raw){project=validateProject(JSON.parse(raw));hadSavedProject=true;} } catch { notice('Önceki yerel proje okunamadı; yeni proje açıldı.',true); }
project=validateProject(project);time=Math.min(time,projectDuration(project));
const current=()=>project.scenes[selected];
const category=()=>CATEGORIES.find(c=>c.id===current().category);
const offsetAt=index=>project.scenes.slice(0,index).reduce((n,s)=>n+s.duration,0);
const stamp=t=>`${Math.floor(t/60)}:${String(Math.floor(t%60)).padStart(2,'0')}`;
function notice(message,error=false){$('notice').textContent=message;$('notice').classList.toggle('error',error);}
function save(){window.dispatchEvent(new CustomEvent('kare-project-change'));try{localStorage.setItem(STORE,JSON.stringify(project));$('saveState').textContent='Değişiklikler kaydedildi';$('recentProject').textContent=`Açık çalışma: ${project.name}`;}catch{$('saveState').textContent='Yerel kayıt dolu — JSON indir';}}
function remember(){history.push(clone(project));if(history.length>60)history.shift();$('undo').disabled=false;}
function commit(edit,{refresh=true}={}){
  if(exporting){notice('Video kaydı sırasında düzenleme bekliyor.',true);return false;}
  const before=clone(project);const index=selected;
  try{edit();project=validateProject(enforceStyle(project));rememberSnapshot(before);selected=Math.max(0,Math.min(selected,project.scenes.length-1));time=Math.min(time,projectDuration(project));save();if(refresh)refreshUI();else{drawTimeline();draw();}return true;}
  catch(e){project=before;selected=index;notice(e.message,true);return false;}
}
function rememberSnapshot(before){history.push(before);if(history.length>60)history.shift();$('undo').disabled=false;}
function syncNarration(at){const key=at.scene.audio?.url||'';if(key!==audioKey){narrationAudio?.pause();audioKey=key;narrationAudio=key?new Audio(key):null;audioAttempted=false;}if(!narrationAudio)return;if(!playing){narrationAudio.pause();audioAttempted=false;return;}if(at.local>=at.scene.audio.duration){narrationAudio.pause();return;}if(Math.abs(narrationAudio.currentTime-at.local)>.35)try{narrationAudio.currentTime=at.local;}catch{}if(narrationAudio.paused&&!audioAttempted){audioAttempted=true;narrationAudio.play().catch(()=>notice('Ses başlatılamadı; ses dosyasını ve tarayıcı izinlerini kontrol et.',true));}}
function draw(){const at=renderProject(ctx,time,project);syncNarration(at);$('clock').textContent=`${stamp(time)} / ${stamp(projectDuration(project))}`;$('seek').max=projectDuration(project);$('seek').value=time;$('play').textContent=playing?'Ⅱ':'▶';$('play').setAttribute('aria-label',playing?'Duraklat':'Oynat');return at;}
function setPlaying(on){playing=on;lastTick=performance.now();draw();}
function jump(index){if(exporting)return;selected=index;setPlaying(false);time=offsetAt(index)+Math.min(current().duration*.65,current().duration);refreshUI();}
function updateSelectedFromTime(){const next=sceneAt(project,time).index;if(next!==selected){selected=next;drawTimeline();drawInspector();drawLibrary();}}
function tick(now){if(playing&&!exporting){const dt=(now-lastTick)/1000;time+=dt;const total=projectDuration(project);if(time>=total){if($('loop').checked)time%=total;else{time=total;playing=false;}}updateSelectedFromTime();draw();}lastTick=now;requestAnimationFrame(tick);}

function thumbnail(canvas,scene){renderScene(canvas.getContext('2d'),scene.duration*.72,scene,project);}
function drawLibrary(){
  const q=$('search').value.toLocaleLowerCase('tr');$('categories').replaceChildren();
  const list=CATEGORIES.filter(c=>(group==='all'||familyFor(c.id).id===group)&&`${c.name} ${c.description} ${c.id}`.toLocaleLowerCase('tr').includes(q));
  if(!list.length){const p=document.createElement('p');p.className='muted';p.textContent='Bu aramada kategori bulunamadı.';$('categories').append(p);}
  for(const c of list){const b=document.createElement('button');b.className='category'+(c.id===current().category?' active':'');b.dataset.category=c.id;b.setAttribute('aria-pressed',String(c.id===current().category));
    const cv=document.createElement('canvas');cv.width=384;cv.height=216;thumbnail(cv,defaultScene(c.id));
    const words=document.createElement('span'),name=document.createElement('b'),label=document.createElement('small');name.textContent=c.name;label.textContent=c.description;words.append(name,label);b.append(cv,words);
    b.onclick=()=>{if(commit(()=>{const old=current(),fresh=defaultScene(c.id);fresh.id=old.id;fresh.duration=old.duration;fresh.narration=old.narration;fresh.sourceRefs=[...old.sourceRefs];for(const k of ['carry','notes','words','alignment'])fresh[k]=clone(old[k]);if(old.audio)fresh.audio=clone(old.audio);if(old.composed){fresh.composed=true;fresh.theme=old.theme;fresh.objects=clone(old.objects);if(old.theme==='chalk'){fresh.background=old.background;fresh.palette=[...old.palette];}else for(const obj of fresh.objects){const i=old.palette.indexOf(obj.color);if(i>=0)obj.color=fresh.palette[i%fresh.palette.length];}}project.scenes[selected]=fresh;time=offsetAt(selected)+fresh.duration*.65;playing=false;})){$('styleDialog').close();notice(`${c.name} örneği uygulandı. İstersen geri alabilirsin.`);}};$('categories').append(b);
  }
}
function drawGroups(){const groups=[...FAMILIES,{id:'all',label:'Tümü'}];$('groups').replaceChildren();for(const g of groups){const b=document.createElement('button');b.textContent=g.label;b.dataset.group=g.id;b.className=g.id===group?'active':'';b.setAttribute('aria-pressed',String(g.id===group));b.onclick=()=>{group=g.id;drawGroups();drawLibrary();};$('groups').append(b);}}
function drawTimeline(){
  $('sceneList').replaceChildren();$('sceneCount').textContent=`${project.scenes.length} sahne · ${stamp(projectDuration(project))}`;
  $('sceneNavigatorLabel').hidden=project.scenes.length<=15;$('sceneNavigator').replaceChildren();project.scenes.forEach((s,i)=>{const option=document.createElement('option');option.value=i;option.textContent=`${i+1}. ${s.title}`;$('sceneNavigator').append(option);});$('sceneNavigator').value=selected;
  project.scenes.forEach((s,i)=>{if(project.scenes.length>15&&Math.abs(i-selected)>7)return;const b=document.createElement('button');b.className='scene-card'+(i===selected?' active':'');b.dataset.scene=i;b.setAttribute('aria-label',`Sahne ${i+1}: ${s.title}`);
    const cv=document.createElement('canvas');cv.width=288;cv.height=162;thumbnail(cv,s);const caption=document.createElement('div');caption.className='scene-caption';const title=document.createElement('span'),duration=document.createElement('time');title.textContent=`${i+1}. ${s.title}`;duration.textContent=`${s.duration} sn`;caption.append(title,duration);b.append(cv,caption);b.onclick=()=>jump(i);$('sceneList').append(b);});
  $('moveLeft').disabled=selected===0;$('moveRight').disabled=selected===project.scenes.length-1;$('removeScene').disabled=project.scenes.length===1;$('addScene').disabled=project.scenes.length>=360;$('duplicate').disabled=project.scenes.length>=360;$('undo').disabled=!history.length;
}
async function loadSkill(){const request=++skillRequest,cat=category();$('skillText').textContent='Beceri yükleniyor…';try{const r=await fetch(`/api/animation/skill?category=${encodeURIComponent(cat.id)}`);const result=await r.json();if(!r.ok)throw new Error(result.error);if(request!==skillRequest)return;$('skillText').textContent=result.text;$('researchLink').href=cat.source;}catch(e){if(request===skillRequest)$('skillText').textContent=e.message;}}
function drawInspector(){
  const s=current(),c=category();$('sceneHeading').textContent=s.title;$('categoryTag').textContent=c.name;$('familyName').textContent=familyFor(s.category).name;
  for(const key of ['duration','speed','detail','seed','background'])$(key).value=s[key];$('sceneTitle').value=s.title;
  $('durationValue').textContent=`${s.duration} sn`;$('speedValue').textContent=`${s.speed}×`;$('detailValue').textContent=`${s.detail}×`;
  $('technique').textContent=c.technique;$('objectCount').textContent=s.objects.length?`${s.objects.length} çizim öğesi`:'Prosedürel kategori örneği';
  $('sceneNarration').value=s.narration;$('subtitles').checked=project.subtitles;$('sceneSource').textContent=s.sourceRefs.length?'Kaynak: '+s.sourceRefs.join(', '):'';drawAudioStatus();drawVoiceButton();
  $('palette').replaceChildren();s.palette.forEach((color,i)=>{const input=document.createElement('input');input.type='color';input.value=color;input.setAttribute('aria-label',`Palet rengi ${i+1}`);input.onchange=()=>commit(()=>{current().palette[i]=input.value;});$('palette').append(input);});
  $('sourceText').textContent=RENDERERS[s.category].toString();if(tab==='skill'&&$('knowledgeDetails').open)loadSkill();
}
function drawAudioStatus(){const s=current();$('sceneAudioStatus').textContent=voiceJob?.sceneId===s.id?voiceJob.message:s.audio?`${s.audio.provider} · ${s.audio.duration.toFixed(1)} sn ses`:'Bu sahnede ses dosyası yok.';}
function drawVoiceButton(){const empty=!$('sceneNarration').value.trim(),b=$('sceneVoice');b.disabled=!!voiceJob||exporting||empty||!voiceProvider;b.textContent=voiceJob?'Seslendiriliyor…':'Bu sahneyi seslendir';
  $('sceneVoiceHint').textContent=voiceJob?'Ses hazırlanıyor; yalnızca bu sahnenin sesi değişecek.':!voiceChecked?'Ses sağlayıcısı kontrol ediliyor…':!voiceProvider?'Ses sağlayıcısı hazır değil: ⚙ Ayarlar bölümünden Cartesia anahtarı ve ses kimliği ekle.':empty?'Seslendirmek için önce anlatım metnini yaz.':`${voiceProvider.label} · yalnızca bu sahne seslendirilir; API kullanımı oluşturabilir.`;}
async function updateVoiceProvider(){try{const r=await fetch('/api/animation/production');const cap=await r.json();if(!r.ok)throw new Error(cap.error);voiceProvider=(cap.voices||[]).find(v=>v.available)||null;}catch{voiceProvider=null;}voiceChecked=true;drawVoiceButton();}
// AI taslağını sahneye dönüştürür: AI anlatımı varsa o, yoksa (üzerine uygularken) mevcut sahnenin anlatımı korunur;
// eski ses/kelime zamanları hiçbir durumda taşınmaz.
function aiScene(base){const s=clone(pendingAi),text=typeof s.narration==='string'?s.narration.trim():'';s.narration=text||(base?base.narration:'');delete s.audio;delete s.words;delete s.alignment;return s;}
function refreshUI(){preloadProject(project).then(draw).catch(e=>notice(e.message,true));window.dispatchEvent(new CustomEvent('kare-selection-change'));$('projectName').value=project.name;drawGroups();drawLibrary();drawTimeline();drawInspector();draw();}
function download(content,type,name){const blob=content instanceof Blob?content:new Blob([content],{type});const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),5000);}
const filename=()=>project.name.replace(/[^\p{L}\p{N}_-]+/gu,'-').slice(0,60)||'canvas-projesi';
const safeJson=obj=>JSON.stringify(obj).replace(/</g,'\\u003c').replace(/>/g,'\\u003e').replace(/&/g,'\\u0026');
export async function standaloneHtml(p){
  p=validateProject(p); // ham proje (ör. içe aktarılan) de assets/style alanlarıyla tamamlansın
  const res=await fetch('/api/animation/bundle');if(!res.ok)throw new Error('Canvas kod paketi alınamadı');const bundle=await res.text();
  const fonts=await Promise.all([['Kalam','kalam-latin-400-normal.woff2','400 500',''],['Kalam','kalam-latin-ext-400-normal.woff2','400 500','unicode-range:U+0100-024F;'],['Manrope','manrope-latin-wght-normal.woff2','200 800',''],['Manrope','manrope-latin-ext-wght-normal.woff2','200 800','unicode-range:U+0100-024F;']].map(async([family,file,weight,range])=>{const r=await fetch('/assets/fonts/'+file);if(!r.ok)throw new Error('Yazı dosyası alınamadı');const bytes=new Uint8Array(await r.arrayBuffer());let raw='';for(let i=0;i<bytes.length;i+=16384)raw+=String.fromCharCode(...bytes.subarray(i,i+16384));return `@font-face{font-family:${family};src:url(data:font/woff2;base64,${btoa(raw)}) format('woff2');font-weight:${weight};${range}}`;}));

  return `<!doctype html><html lang="tr"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Canvas animasyonu</title><style>${fonts.join('')}body{margin:0;background:#172d27;color:#eee;font:14px system-ui;display:grid;place-items:center;min-height:100vh}main{width:min(100%,1280px)}canvas{width:100%;display:block}nav{display:flex;gap:15px;align-items:center;padding:20px}input{flex:1}button{padding:10px}</style><main><canvas id="c" width="1280" height="720"></canvas><nav><button id="p">Duraklat</button><input id="s" type="range" min="0" step=".01"><span id="clock"></span></nav></main><script>${bundle}\nconst project=${safeJson(p)};const ctx=document.getElementById('c').getContext('2d'),seek=document.getElementById('s'),button=document.getElementById('p');let playing=true,t=0,last=performance.now();seek.max=projectDuration(project);seek.oninput=()=>{t=Number(seek.value);renderProject(ctx,t,project);};button.onclick=()=>{playing=!playing;button.textContent=playing?'Duraklat':'Oynat';};function tick(now){if(playing)t=(t+(now-last)/1000)%projectDuration(project);last=now;renderProject(ctx,t,project);seek.value=t;document.getElementById('clock').textContent=t.toFixed(1)+' / '+projectDuration(project)+' sn';requestAnimationFrame(tick);}Promise.all(['500 34px Kalam','500 34px Manrope'].map(f=>document.fonts.load(f)).concat([preloadProject(project)])).then(()=>{last=performance.now();requestAnimationFrame(tick);});<\/script></html>`;
}

$('search').oninput=drawLibrary;
$('play').onclick=()=>{if(!exporting){if(time>=projectDuration(project))time=0;setPlaying(!playing);}};
$('restart').onclick=()=>{if(!exporting){time=0;selected=0;setPlaying(false);refreshUI();}};
$('seek').oninput=()=>{if(exporting)return;setPlaying(false);time=Number($('seek').value);updateSelectedFromTime();draw();};
$('undo').onclick=()=>{if(exporting||!history.length)return;const id=current().id;project=history.pop();const prior=project.scenes.findIndex(s=>s.id===id);selected=prior>=0?prior:Math.min(selected,project.scenes.length-1);time=offsetAt(selected)+current().duration*.65;setPlaying(false);save();refreshUI();notice('Son değişiklik geri alındı.');};
$('projectName').onchange=()=>commit(()=>{project.name=$('projectName').value.trim()||'Çizim projesi';});
$('sceneTitle').onchange=()=>commit(()=>{current().title=$('sceneTitle').value;});
$('sceneNavigator').onchange=()=>jump(Number($('sceneNavigator').value));
$('sceneNarration').onchange=()=>commit(()=>{current().narration=$('sceneNarration').value;delete current().audio;current().words=[];});
$('sceneNarration').oninput=drawVoiceButton;
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
$('sceneVoice').onclick=async()=>{
  if(voiceJob||exporting)return;
  if($('sceneNarration').value!==current().narration&&!commit(()=>{current().narration=$('sceneNarration').value;delete current().audio;current().words=[];}))return;
  await updateVoiceProvider();const s=current();if(!s.narration.trim()||!voiceProvider)return;
  const id=s.id,sent=JSON.stringify(s),setMessage=m=>{if(voiceJob)voiceJob.message=m;if(current().id===id)$('sceneAudioStatus').textContent=m;};
  voiceJob={sceneId:id,message:'Seslendiriliyor…'};drawAudioStatus();drawVoiceButton();
  try{
    const r=await fetch('/api/animation/jobs',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({type:'voice',project,provider:voiceProvider.id,sceneIndex:selected,sceneId:id})});
    const created=await r.json();if(!r.ok)throw new Error(created.error||'Seslendirme başlatılamadı');
    let job;for(;;){await sleep(1200);const q=await fetch('/api/animation/jobs/'+created.id);job=await q.json();if(!q.ok)throw new Error(job.error||'Seslendirme durumu alınamadı');if(['done','error','cancelled'].includes(job.state))break;setMessage(`Seslendiriliyor… %${job.progress||0}`);}
    if(job.state!=='done')throw new Error(job.message||'Seslendirme tamamlanamadı');
    const voiced=job.result.scene;if(!voiced?.audio||voiced.id!==id)throw new Error('Sunucu bu sahnenin sesini döndürmedi');
    voiceJob=null;
    const ok=commit(()=>{const i=project.scenes.findIndex(x=>x.id===id);if(i<0)throw new Error('Seslendirilen sahne artık yok');const scene=project.scenes[i];
      if(JSON.stringify(scene)===sent)project.scenes[i]=clone(voiced); // sahne değişmediyse sunucunun uzattığı süre ve nesne zamanları da alınır
      else{if(scene.narration!==voiced.narration)throw new Error('Anlatım seslendirme sırasında değişti; yeniden seslendir.');scene.audio=clone(voiced.audio);scene.words=[];scene.alignment='';scene.duration=Math.max(scene.duration,voiced.duration);}});
    if(ok)notice(`Sahne seslendirildi: ${voiced.audio.provider} · ${voiced.audio.duration.toFixed(1)} sn. Oynatınca ses çalar.`);
  }catch(e){voiceJob=null;notice(e.message,true);if(current().id===id)$('sceneAudioStatus').textContent=e.message;}
  finally{voiceJob=null;drawVoiceButton();}
};
$('subtitles').onchange=()=>commit(()=>{project.subtitles=$('subtitles').checked;});
$('sceneAudioUpload').onclick=()=>$('sceneAudioFile').click();
$('sceneAudioFile').onchange=async()=>{const file=$('sceneAudioFile').files[0],id=current().id;if(!file)return;try{if(file.size>20*1024*1024)throw new Error('Ses dosyası en fazla 20 MB olabilir');const response=await fetch('/api/animation/audio?name='+encodeURIComponent(file.name),{method:'POST',body:file});const audio=await response.json();if(!response.ok)throw new Error(audio.error);commit(()=>{const scene=project.scenes.find(s=>s.id===id);if(!scene)throw new Error('Sesin ekleneceği sahne artık yok');scene.audio=audio;scene.words=[];scene.alignment='';scene.duration=Math.max(scene.duration,Math.min(120,audio.duration+.4));});notice('Ses dosyası sahneye eklendi.');}catch(e){notice(e.message,true);}finally{$('sceneAudioFile').value='';}};
for(const key of ['duration','speed','detail']){$(key).oninput=()=>$(key+'Value').textContent=$(key).value+(key==='duration'?' sn':'×');$(key).onchange=()=>commit(()=>{current()[key]=Number($(key).value);time=offsetAt(selected)+Math.min(current().duration*.65,current().duration);});}
$('seed').onchange=()=>commit(()=>{current().seed=Number($('seed').value);});
$('shuffle').onclick=()=>commit(()=>{current().seed=crypto.getRandomValues(new Uint32Array(1))[0]%2147483647;});
$('background').onchange=()=>commit(()=>{current().background=$('background').value;});
$('addScene').onclick=()=>commit(()=>{project.scenes.splice(selected+1,0,defaultScene(current().category));selected++;time=offsetAt(selected)+current().duration*.65;playing=false;});
$('duplicate').onclick=()=>commit(()=>{const copy=clone(current());copy.id=crypto.randomUUID();copy.title+=' kopya';project.scenes.splice(selected+1,0,copy);selected++;time=offsetAt(selected)+current().duration*.65;playing=false;});
$('removeScene').onclick=()=>{if(project.scenes.length>1)commit(()=>{project.scenes.splice(selected,1);selected=Math.min(selected,project.scenes.length-1);time=offsetAt(selected)+current().duration*.65;playing=false;});};
function move(delta){if(selected+delta<0||selected+delta>=project.scenes.length)return;commit(()=>{const [s]=project.scenes.splice(selected,1);selected+=delta;project.scenes.splice(selected,0,s);time=offsetAt(selected)+current().duration*.65;playing=false;});}
$('moveLeft').onclick=()=>move(-1);$('moveRight').onclick=()=>move(1);
document.querySelectorAll('[data-tab]').forEach(b=>b.onclick=()=>{tab=b.dataset.tab;document.querySelectorAll('[data-tab]').forEach(x=>x.setAttribute('aria-selected',String(x===b)));for(const id of ['skill','source'])$(id).hidden=id!==tab;if(tab==='skill')loadSkill();});
$('knowledgeDetails').ontoggle=()=>{if($('knowledgeDetails').open&&tab==='skill')loadSkill();};
document.querySelectorAll('[data-close]').forEach(b=>b.onclick=()=>{if(b.dataset.close==='exportDialog'&&cancelVideo)cancelVideo();$(b.dataset.close).close();});
$('editJson').onclick=()=>{$('jsonEditor').value=JSON.stringify(current(),null,2);$('jsonDialog').showModal();};
$('applyJson').onclick=()=>{try{const s=validateScene(JSON.parse($('jsonEditor').value));s.id=current().id;if(commit(()=>{project.scenes[selected]=s;time=offsetAt(selected)+s.duration*.65;})){$('jsonDialog').close();notice('Sahne verisi uygulandı.');}}catch(e){notice(e.message,true);$('jsonEditor').setCustomValidity(e.message);$('jsonEditor').reportValidity();}};
$('jsonEditor').oninput=()=>$('jsonEditor').setCustomValidity('');
$('importProject').onclick=()=>$('fileInput').click();
$('fileInput').onchange=async()=>{const f=$('fileInput').files[0];if(!f)return;try{if(f.size>16e6)throw new Error('Proje dosyası 16 MB sınırını aşıyor');const p=validateProject(JSON.parse(await f.text()));if(commit(()=>{project=p;selected=0;time=p.scenes[0].duration*.65;playing=false;})){showView('edit');notice('Proje içe aktarıldı.');}}catch(e){showView('edit');notice(e.message,true);}finally{$('fileInput').value='';}};
$('snapshot').onclick=()=>{draw();$('stage').toBlob(blob=>{if(blob)download(blob,'image/png',filename()+'.png');});};
$('exportOpen').onclick=()=>$('exportDialog').showModal();
$('downloadJson').onclick=()=>download(JSON.stringify(project,null,2),'application/json',filename()+'.json');
$('downloadHtml').onclick=async()=>{try{download(await standaloneHtml(project),'text/html',filename()+'.html');$('exportProgress').textContent='Bağımsız HTML indirildi.';}catch(e){$('exportProgress').textContent=e.message;}};
$('downloadSkill').onclick=async()=>{try{const r=await fetch(`/api/animation/skill?category=${current().category}`),body=await r.json();if(!r.ok)throw new Error(body.error);download(body.text,'text/markdown',category().skill+'-SKILL.md');}catch(e){notice(e.message,true);}};

async function updateConnection(){try{const r=await fetch('/api/animation/status');if(!r.ok)throw new Error('API kullanılamıyor');connection=await r.json();$('aiStatus').textContent=connection.configured?`${connection.model} · ayarlı`:'AI bağlı değil';$('aiStatus').classList.toggle('connected',connection.configured);$('aiHelp').textContent=connection.configured?`${connection.model} · üretim isteği API kullanımı oluşturur.`:'AI için ⚙ Ayarlar bölümünden bir sağlayıcı anahtarı ekle. Hazır örnekleri hemen kullanabilirsin.';}catch{$('aiStatus').textContent='Sunucuya erişilemiyor';connection.configured=false;}}
$('generate').onclick=async()=>{
  await updateConnection();if(!connection.configured){notice($('aiHelp').textContent,true);return;}
  const prompt=$('prompt').value.trim();if(prompt.length<5){$('prompt').focus();notice('Oluşturmak istediğin animasyonu en az 5 karakterle anlat.',true);return;}
  const button=$('generate');button.disabled=true;button.textContent='Sahne tasarlanıyor…';$('aiResult').textContent='Kategori becerisi modele gönderiliyor.';
  try{const r=await fetch('/api/animation/generate',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({category:current().category,prompt})});const result=await r.json();if(!r.ok)throw new Error(result.error);pendingAi=validateScene(result.scene);renderScene($('aiCanvas').getContext('2d'),pendingAi.duration*.65,pendingAi);$('aiDescription').textContent=`${pendingAi.title} · ${pendingAi.duration} sn · ${pendingAi.objects.length} çizim öğesi · ${result.model}`+(pendingAi.narration.trim()?` — Anlatım: ${pendingAi.narration.trim()}`:' — Anlatım üretilmedi; sahnenin mevcut anlatımı korunur.');$('aiDialog').close();$('aiPreview').showModal();$('aiResult').textContent='Taslak hazır; henüz projeye uygulanmadı.';}
  catch(e){notice(e.message,true);$('aiResult').textContent=e.message;}
  finally{button.disabled=false;button.textContent='Taslak oluştur ↗';}
};
$('applyAi').onclick=()=>{if(pendingAi&&commit(()=>{const s=aiScene(current());s.id=current().id;project.scenes[selected]=s;time=offsetAt(selected)+s.duration*.65;playing=false;})){$('sceneNarration').value=current().narration;drawVoiceButton();$('aiPreview').close();notice('AI taslağı sahneye uygulandı; eski ses kaldırıldı.');}};
$('addAi').onclick=()=>{if(pendingAi&&commit(()=>{const s=aiScene(null);s.id=crypto.randomUUID();project.scenes.splice(selected+1,0,s);selected++;time=offsetAt(selected)+s.duration*.65;playing=false;})){$('sceneNarration').value=current().narration;drawVoiceButton();$('aiPreview').close();notice('AI taslağı yeni sahne olarak eklendi.');}};

$('downloadVideo').onclick=()=>{
  if(exporting)return;if(typeof MediaRecorder==='undefined'||!$('stage').captureStream){$('exportProgress').textContent='Bu tarayıcı video kaydını desteklemiyor. HTML veya MP4 aracını kullan.';return;}
  const mime=['video/webm;codecs=vp8','video/webm;codecs=vp9','video/webm'].find(x=>MediaRecorder.isTypeSupported(x));if(!mime){$('exportProgress').textContent='WebM desteklenmiyor.';return;}
  const savedTime=time,recorded=clone(project),total=projectDuration(recorded),chunks=[];
  const videoCanvas=document.createElement('canvas');videoCanvas.width=1280;videoCanvas.height=720;const videoCtx=videoCanvas.getContext('2d');renderProject(videoCtx,0,recorded);
  let stream,recorder;try{stream=videoCanvas.captureStream(0);recorder=new MediaRecorder(stream,{mimeType:mime,videoBitsPerSecond:6000000});}catch(e){stream?.getTracks().forEach(track=>track.stop());$('exportProgress').textContent=`Video kaydı başlatılamadı: ${e.message}`;return;}
  const track=stream.getVideoTracks()[0];let canceled=false,done=false,start=performance.now(),frame,lastFrame=-Infinity,failure='';setPlaying(false);exporting=true;
  const disabled=new Map();document.querySelectorAll('.workspace button,.workspace input,.workspace textarea,.topbar button,.topbar input,.export-options button').forEach(el=>{disabled.set(el,el.disabled);el.disabled=true;});
  function finish(cancel=false){if(done)return;done=true;canceled=cancel;cancelAnimationFrame(frame);if(recorder.state!=='inactive')recorder.stop();}
  recorder.ondataavailable=e=>{if(e.data.size)chunks.push(e.data);};
  recorder.onstop=()=>{stream.getTracks().forEach(track=>track.stop());exporting=false;cancelVideo=null;$('cancelExport').hidden=true;for(const [el,value]of disabled)el.disabled=value;time=savedTime;draw();if(!canceled&&chunks.length){download(new Blob(chunks,{type:mime}),'video/webm',filename()+'.webm');$('exportProgress').textContent='WebM kaydı indirildi.';}else $('exportProgress').textContent=failure||(canceled?'Video kaydı iptal edildi.':'Tarayıcı video karesi üretmedi. HTML veya MP4 aracını kullan.');};
  recorder.onerror=e=>{failure=`Video kaydı başarısız: ${e.error?.message||'Kodlayıcı kullanılamıyor'}`;finish(true);};cancelVideo=()=>finish(true);$('cancelExport').hidden=false;$('cancelExport').onclick=cancelVideo;
  $('exportDialog').oncancel=()=>finish(true);try{recorder.start(1000);}catch(e){failure=`Video kaydı başlatılamadı: ${e.message}`;recorder.onstop();return;}
  function capture(now){if(done)return;if(document.hidden){finish(true);notice('Sekme arka plana geçtiği için video kaydı iptal edildi.',true);return;}const t=Math.min((now-start)/1000,total);if(now-lastFrame>=1000/30||t>=total){renderProject(videoCtx,t,recorded);track.requestFrame();lastFrame=now;$('exportProgress').textContent=`Kaydediliyor: ${t.toFixed(1)} / ${total} sn — sekmeyi etkin tut.`;}if(t>=total)finish();else frame=requestAnimationFrame(capture);}
  frame=requestAnimationFrame(capture);
};
addEventListener('keydown',e=>{if(/INPUT|TEXTAREA|SELECT/.test(e.target.tagName)||document.querySelector('dialog[open]')||exporting)return;if(e.code==='Space'){e.preventDefault();$('play').click();}if((e.ctrlKey||e.metaKey)&&e.key==='z'){e.preventDefault();$('undo').click();}});
addEventListener('beforeunload',()=>{if(cancelVideo)cancelVideo();});

function showView(view,writeHistory=true){if(exporting)return;setPlaying(false);$('homeView').hidden=view==='edit';$('editorView').hidden=view!=='edit';document.querySelector('.skip-link').href=view==='edit'?'#editorContent':'#mainContent';if(writeHistory&&location.hash!==`#${view}`)window.history.pushState(null,'',`#${view}`);if(view==='edit')refreshUI();window.scrollTo(0,0);}
function openStyles(family=familyFor(current().category).id){if(exporting)return;group=family;$('search').value='';drawGroups();drawLibrary();$('styleDialog').showModal();$('search').focus();}
document.querySelectorAll('[data-family]').forEach(b=>b.onclick=()=>{showView('edit');if(familyFor(current().category).id!==b.dataset.family)openStyles(b.dataset.family);});
$('homeBack').onclick=$('categoriesBack').onclick=()=>showView('home');$('homeContinue').onclick=()=>showView('edit');$('homeImport').onclick=()=>$('fileInput').click();$('styleOpen').onclick=()=>openStyles();
document.querySelector('.skip-link').onclick=e=>{e.preventDefault();const target=document.querySelector(e.currentTarget.getAttribute('href'));target.tabIndex=-1;target.focus();target.scrollIntoView({block:'start'});};
$('aiOpen').onclick=()=>{$('aiCategory').textContent=`Çizim dili: ${category().name}. Taslağı uygulamadan önce görebilirsin.`;updateConnection();$('aiDialog').showModal();$('prompt').focus();};
const route=()=>showView(['#edit','#editorContent'].includes(location.hash)?'edit':'home',false);addEventListener('popstate',route);addEventListener('hashchange',route);
$('homeContinue').firstChild.textContent=hadSavedProject?'Devam et ':'Örnekle başla ';
refreshUI();save();updateConnection();updateVoiceProvider();route();initAtelierArt();requestAnimationFrame(tick);setInterval(updateConnection,20000);setInterval(updateVoiceProvider,20000);addEventListener('kare-settings-changed',updateVoiceProvider);
window.canvasStudio={ get project(){return clone(project);}, get selected(){return selected;}, edit:fn=>commit(()=>fn(project)), select:jump, seek:t=>{time=t;setPlaying(false);updateSelectedFromTime();refreshUI();}, get time(){return time;}, pause:()=>setPlaying(false), render:t=>{time=Math.min(Math.max(0,t),projectDuration(project));draw();}, import:p=>{if(commit(()=>{project=validateProject(p);selected=0;time=0;playing=false;}))showView('edit');}, standaloneHtml };

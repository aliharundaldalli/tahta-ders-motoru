/* Ayarlar: proje .env dosyasındaki API anahtarları. Sunucu yalnızca maskeli değer döndürür; tam anahtar tarayıcıya gelmez.
   Boş bırakılan anahtar alanı değişmez; "Kaldır" anahtarı siler. Bağlantı testi sunucuda, kayıtlı değerlerle yapılır. */
const GROUPS=[
  {id:'cartesia',name:'Cartesia · seslendirme',fields:[['CARTESIA_API_KEY','API anahtarı'],['CARTESIA_VOICE','Ses kimliği (voice id)']]},
  {id:'glm',name:'GLM (Z.ai)',fields:[['GLM_API_KEY','API anahtarı'],['GLM_MODEL','Model'],['GLM_BASE_URL','Uç nokta']]},
  {id:'openai',name:'OpenAI',fields:[['OPENAI_API_KEY','API anahtarı'],['OPENAI_MODEL','Model']]},
  {id:'anthropic',name:'Anthropic (Claude)',fields:[['ANTHROPIC_API_KEY','API anahtarı'],['ANTHROPIC_MODEL','Model']]},
];
const GLM_BASES=['https://api.z.ai/api/coding/paas/v4','https://api.z.ai/api/paas/v4','https://open.bigmodel.cn/api/paas/v4'];
const el=(tag,props={},...kids)=>{const n=Object.assign(document.createElement(tag),props);n.append(...kids);return n;};
const dialog=el('dialog',{id:'settingsDialog',className:'settings-dialog'});dialog.setAttribute('aria-labelledby','settingsHeading');
const status=el('p',{id:'settingsStatus',className:'muted'});status.setAttribute('role','status');status.setAttribute('aria-live','polite');
let state=null;
async function api(path,options={}){
  const r=await fetch(path,{credentials:'same-origin',...options,headers:{'Content-Type':'application/json',...(options.headers||{})}});
  let body={};try{body=await r.json();}catch{}
  if(!r.ok)throw new Error(r.status===403?'Oturum anahtarı yok: Kare\'yi tools/kare.sh ile açılan adresten aç.':body.error||'İstek başarısız');
  return body;
}
function input(key,label,field){
  const id='set_'+key,wrap=el('label',{className:'settings-field',htmlFor:id},el('span',{},label));
  let control;
  if(key==='GLM_BASE_URL'){control=el('select',{id});for(const v of ['',...GLM_BASES])control.append(el('option',{value:v,textContent:v||`Varsayılan (${field.default})`}));control.value=field.value||'';}
  else if(field.secret){control=el('input',{id,type:'password',autocomplete:'off',spellcheck:false,placeholder:field.set?`${field.value} · değiştirmek için yeni anahtarı yaz`:'boş',maxLength:300});
    control.dataset.secret='1';}
  else control=el('input',{id,type:'text',autocomplete:'off',spellcheck:false,value:field.value||'',placeholder:field.default?`Varsayılan: ${field.default}`:'boş',maxLength:100});
  control.dataset.key=key;wrap.append(control);
  const note=el('small',{className:'settings-current'});
  if(field.secret){note.textContent=field.set?`Kayıtlı: ${field.value}`:'Kayıtlı: boş';
    if(field.set){const remove=el('button',{type:'button',className:'text-button danger',textContent:'Kaldır'});remove.onclick=()=>save({[key]:''},`${key} silindi`);note.append(' ',remove);}}
  if(field.envOverride)note.append(' · ortam değişkeni bu değeri geçersiz kılıyor');
  wrap.append(note);return wrap;
}
function render(){
  const f=state.fields;dialog.replaceChildren();
  const head=el('div',{className:'dialog-head'},el('div',{},el('h2',{id:'settingsHeading',textContent:'Ayarlar'}),el('p',{textContent:`API anahtarları sunucudaki ${state.file} dosyasında saklanır (izin 600, git'e girmez). Tam anahtar bu sayfaya hiç gelmez.`})));
  const close=el('button',{type:'button',textContent:'×'});close.setAttribute('aria-label','Kapat');close.onclick=()=>dialog.close();head.append(close);
  const provider=el('select',{id:'set_AI_PROVIDER'});provider.dataset.key='AI_PROVIDER';
  for(const [v,t] of [['','Otomatik (anahtarı olan ilk sağlayıcı)'],['glm','GLM'],['openai','OpenAI'],['anthropic','Anthropic (Claude)']])provider.append(el('option',{value:v,textContent:t}));
  provider.value=f.AI_PROVIDER.value||'';
  const top=el('section',{className:'settings-group'},el('h3',{textContent:'AI sağlayıcısı'}),el('label',{className:'settings-field',htmlFor:'set_AI_PROVIDER'},el('span',{},'Sahne ve plan üretimi için'),provider),
    el('p',{className:'muted',textContent:'Hazır stil örnekleri, düzenleme ve dışa aktarma anahtarsız çalışır. AI üretimi seçili sağlayıcıya ücretli istek gönderir.'}));
  dialog.append(head,top);
  for(const g of GROUPS){
    const sec=el('section',{className:'settings-group',id:'settings-'+g.id},el('h3',{textContent:g.name}));
    for(const [k,label] of g.fields)sec.append(input(k,label,f[k]));
    const result=el('span',{className:'settings-test muted'});result.setAttribute('role','status');
    const test=el('button',{type:'button',className:'outline-button',textContent:'Bağlantıyı test et'});
    test.onclick=async()=>{test.disabled=true;result.className='settings-test muted';result.textContent='Deneniyor…';
      try{const r=await api('/api/settings/test/'+g.id,{method:'POST',body:'{}'});result.textContent=(r.ok?'✓ ':'✗ ')+r.message;result.classList.toggle('ok',!!r.ok);result.classList.toggle('bad',!r.ok);}
      catch(e){result.textContent='✗ '+e.message;result.classList.add('bad');}finally{test.disabled=false;}};
    sec.append(el('div',{className:'settings-row'},test,result));dialog.append(sec);
  }
  const saveButton=el('button',{type:'button',className:'primary',id:'settingsSave',textContent:'Kaydet'});
  saveButton.onclick=()=>{const updates={};for(const c of dialog.querySelectorAll('[data-key]')){const k=c.dataset.key,v=c.value.trim();
      if(c.dataset.secret){if(v)updates[k]=v;}else if(v!==(f[k].value||''))updates[k]=v;}
    if(!Object.keys(updates).length){status.textContent='Değişiklik yok.';return;}save(updates,'Kaydedildi.');};
  dialog.append(el('div',{className:'dialog-actions'},saveButton),status);
}
async function save(updates,message){
  try{state=await api('/api/settings',{method:'PUT',body:JSON.stringify(updates)});render();status.textContent=message;
    window.dispatchEvent(new CustomEvent('kare-settings-changed'));}
  catch(e){status.textContent=e.message;}
}
export async function openSettings(){
  if(!dialog.isConnected)document.body.append(dialog);
  try{state=await api('/api/settings');render();status.textContent='';}catch(e){dialog.replaceChildren(el('div',{className:'dialog-head'},el('h2',{id:'settingsHeading',textContent:'Ayarlar'})),el('p',{textContent:e.message}));
    const close=el('button',{type:'button',textContent:'Kapat'});close.onclick=()=>dialog.close();dialog.append(close);}
  if(!dialog.open)dialog.showModal();
}
for(const id of ['homeSettings','settingsOpen']){const b=document.getElementById(id);if(b)b.addEventListener('click',openSettings);}
if(location.hash==='#ayarlar')openSettings();
window.addEventListener('hashchange',()=>{if(location.hash==='#ayarlar')openSettings();});
window.kareSettings={open:openSettings};

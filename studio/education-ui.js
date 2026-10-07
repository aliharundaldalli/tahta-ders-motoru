/* Navigation enhancements around the original chalkboard recording controller. */
(()=>{
  const get=id=>document.getElementById(id),toggle=get('sidebarToggle');
  const labels=['Ardışık integraller','Dikey basit bölge','Yatay basit bölge','İç integralde sabit değişken','Örnek 1 · Dikdörtgen bölge','Önce y, sonra x','Önce x, sonra y','İki sıra, aynı sonuç','Örnek 2 · Eğri sınır','Dikey sıra ile çözüm','Yatay sıra ile çözüm','Fubini teoremi','Kesit alanı · 3D','Kesitlerden hacme','İntegral sıralarının eşitliği','Sıra seçimi & gösterim','Örnek 3 · Çember & elips','Sınırlar ve simetri','Trigonometrik dönüşüm','Özet & kapanış'];
  document.querySelector('.skip-link').onclick=e=>{e.preventDefault();get('lessonMain').tabIndex=-1;get('lessonMain').focus();};
  function sidebar(open){get('side').hidden=!open;toggle.setAttribute('aria-expanded',String(open));requestAnimationFrame(fit);}
  toggle.onclick=()=>sidebar(get('side').hidden);
  if(matchMedia('(max-width:700px)').matches)sidebar(false);
  function filter(){
    const query=get('sceneSearch').value.toLocaleLowerCase('tr').trim();let visible=0;
    [...get('list').children].forEach((item,i)=>{
      const id=ST.order[i],description=ST.script[id]?.summary||'';
      item.title=description;item.tabIndex=0;item.setAttribute('role','button');item.setAttribute('aria-label',`${id}: ${description}`);
      item.querySelector('select')?.setAttribute('aria-label',`${id} ses kaynağı`);
      item.querySelector('b').textContent=String(i+1).padStart(2,'0');
      if(!item.querySelector('.seg-title')){const title=document.createElement('span');title.className='seg-title';title.textContent=labels[i]||description;item.insertBefore(title,item.querySelector('select'));}
      item.setAttribute('aria-current',item.classList.contains('cur')?'step':'false');
      item.onkeydown=e=>{if(e.target!==item)return;if(e.key==='Enter'||e.key===' '){e.preventDefault();e.stopPropagation();if(!ST.busy&&!ST.rec)go(i);}};
      item.hidden=!(id+' '+description).toLocaleLowerCase('tr').includes(query);if(!item.hidden)visible++;
    });get('searchEmpty').hidden=!!visible;
    const active=get('list').querySelector('.cur');if(active&&!active.hidden){const row=active.getBoundingClientRect(),list=get('list').getBoundingClientRect();if(row.top<list.top)get('list').scrollTop-=list.top-row.top;else if(row.bottom>list.bottom)get('list').scrollTop+=row.bottom-list.bottom;}
  }
  get('sceneSearch').oninput=filter;new MutationObserver(filter).observe(get('list'),{childList:true});
  function voice(){if(location.hash!=='#voice')return;get('voice').scrollIntoView({block:'center'});get('voice').focus({preventScroll:true});}
  addEventListener('hashchange',voice);requestAnimationFrame(voice);
  get('lessonRestart').onclick=()=>{stopAudio();const w=get('fr').contentWindow,s=w?.__segs?.find(s=>s.id===seg());if(s&&w.__render)w.__render(s.start);get('pmsg').textContent='';};
  function duration(){const w=get('fr').contentWindow,s=w?.__segs?.find(s=>s.id===seg());if(s)get('mathDuration').textContent=`${Math.ceil(s.end-s.start)} sn · ${ST.cur+1}. sahne`;}
  new MutationObserver(duration).observe(get('title'),{childList:true});
  get('fr').addEventListener('load',()=>{const timer=setInterval(()=>{if(get('fr').contentWindow?.__ready){clearInterval(timer);duration();}},150);setTimeout(()=>clearInterval(timer),20000);});
})();

'use strict';
const $ = id => document.getElementById(id), api = (p, body) => fetch('/api/' + p, body === undefined ? {} : { method: 'POST', body: JSON.stringify(body) }).then(async r => ({ code: r.status, ...(await r.json()) }));
const ST = { script: {}, status: {}, order: [], cur: 0, takeSel: {}, audio: null, rec: null, stream: null, busy: false };
const LS = { get: (k, d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch (e) { return d; } }, set: (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} } };
const esc = s => s.replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
const VOICES = { own: 'Kendi sesim', cartesia: 'Cartesia (hazır)', eleven: 'ElevenLabs', ahd: 'AHD Ses' };
const seg = () => ST.order[ST.cur], S = id => ST.status[id] || { takes: [], voice: 'own' };
function stateOf(id) {
  const s = S(id); if (s.skipped) return ['atlandı ⏭', 'skip']; if (s.approved) return ['onaylandı ✓', 'ok'];
  const t = (s.takes || []).find(t => t.n === s.chosen); if (!t) return ['bekliyor', ''];
  return t.verdict === 'ok' ? ['kaydedildi ✅', 'ok'] : ['uyarı ⚠️', 'warn'];
}
async function refresh() { const r = await api('state'); Object.assign(ST, { script: r.script, status: r.status, order: r.order }); $('whisper').textContent = r.whisper.error ? 'Whisper hatası: ' + r.whisper.error : r.whisper.ready ? 'Whisper hazır' : 'Whisper yükleniyor…'; drawSide(); drawSummary(); }
function drawSide() {
  $('list').innerHTML = ''; ST.order.forEach((id, i) => {
    const [txt, cls] = stateOf(id), d = document.createElement('div'); d.className = 'seg' + (i === ST.cur ? ' cur' : '');
    d.innerHTML = `<b>${id}</b><span class="st ${cls}">${txt}</span><select>${Object.entries(VOICES).map(([k, v]) => `<option value="${k}"${S(id).voice === k ? ' selected' : ''}>${v}</option>`).join('')}</select>`;
    d.onclick = () => go(i); d.querySelector('select').onclick = e => e.stopPropagation();
    d.querySelector('select').onchange = async e => { ST.status = (await api('voice', { seg: id, voice: e.target.value })).status; drawSummary(); };
    $('list').appendChild(d);
  });
}
function drawSummary() {
  const n = ST.order.length, c = k => ST.order.filter(id => stateOf(id)[1] === k && !S(id).approved && !S(id).skipped).length;
  const ap = ST.order.filter(id => S(id).approved).length, sk = ST.order.filter(id => S(id).skipped).length, wr = ST.order.filter(id => stateOf(id)[1] === 'warn').length;
  $('summary').textContent = `${n} sahneden ${ap} onaylandı` + (wr ? `, ${wr} uyarılı` : '') + (sk ? `, ${sk} atlandı` : '');
}
function go(i) { if (ST.rec) return; stopAudio(); ST.cur = Math.max(0, Math.min(ST.order.length - 1, i)); LS.set('studio.cur', ST.cur); drawSide(); drawSeg(); }
async function typeset(el) {
  try {
    // The local MathJax script is async: API state can arrive before it loads.
    if (!window.MathJax?.typesetPromise) await new Promise((resolve, reject) => {
      const loader = document.querySelector('script[src*="mathjax-full"]');
      if (!loader) return reject(new Error('MathJax yükleyicisi bulunamadı'));
      loader.addEventListener('load', resolve, { once: true });
      loader.addEventListener('error', reject, { once: true });
    });
    await MathJax.startup.promise; await MathJax.typesetPromise([el]);
  } catch (e) { console.warn('Formül gösterimi yüklenemedi', e); }
}
function drawSeg() {
  const id = seg(), sc = ST.script[id]; if (!sc) return;
  $('title').textContent = `${id} — Sahne ${ST.cur + 1}/${ST.order.length}`; $('sum').textContent = 'Sahnede: ' + sc.summary;
  $('txt').innerHTML = esc(sc.display).replace(/\n/g, '<br>'); typeset($('txt')); applyToggles(); drawResult(); setPrev(false); if (ST.script[id].display_original) $('title').textContent += ' (metin düzenlendi)';
}
function editing(on) { $('edt').classList.toggle('hide', !on); if (on) { $('txt').classList.add('hide'); $('ta').value = ST.script[seg()].display; $('ta').focus(); } else applyToggles(); }
$('bEdit').onclick = () => editing(true); $('eCancel').onclick = () => editing(false);
$('eSave').onclick = async () => { const id = seg(), r = await api('edit', { seg: id, display: $('ta').value }); ST.script = r.script; ST.status = r.status; editing(false); drawSeg(); drawSide(); };
$('eReset').onclick = async () => { const id = seg(); if (!confirm('Metin orijinaline dönsün mü?')) return; const r = await api('edit_reset', { seg: id }); ST.script = r.script; ST.status = r.status; editing(false); drawSeg(); drawSide(); };
function applyToggles() { const a = LS.get('studio.sum', true), b = LS.get('studio.txt', true); $('sum').classList.toggle('hide', !a); $('txt').classList.toggle('hide', !b); $('edt').classList.add('hide'); $('mnote').classList.toggle('hide', !S(seg()).math_edited); $('tSum').classList.toggle('on', a); $('tTxt').classList.toggle('on', b); }
$('tSum').onclick = () => { LS.set('studio.sum', !LS.get('studio.sum', true)); applyToggles(); };
$('tTxt').onclick = () => { LS.set('studio.txt', !LS.get('studio.txt', true)); applyToggles(); };

/* ---- sonuç kartı ---- */
const takeMeta = async (id, n) => (await fetch(`/studio/takes/${id}_${n}.json`)).json();
async function drawResult() {
  const id = seg(), s = S(id), box = $('res'); box.innerHTML = '';
  const sel = ST.takeSel[id] ?? s.chosen; if (!sel) { updButtons(); return; }
  const m = await takeMeta(id, sel).catch(() => null); if (seg() !== id) return; if (!m) { updButtons(); return; }
  const ok = m.verdict === 'ok', d = m.diff;
  const ops = d ? d.ops.map(o => `<span class="${o.t}">${esc(o.w)}</span>`).join(' ') : '';
  box.innerHTML = `<div class="card ${m.verdict}"><div class="verdict ${ok ? '' : ''}">${ok ? '✅ Tamam' : m.verdict === 'error' ? '⚠️ Hata' : '⚠️ Uyarı'} <span class="m">kayıt ${m.n}${s.approved === m.n ? ' · onaylı ✓' : ''}</span></div>
    <div><span class="m">süre ${m.duration}s</span><span class="m">tepe ${m.peak_db ?? '-'} dBFS</span><span class="m">${m.lufs ?? '-'} LUFS</span>${d ? `<span class="m">eşleşme %${Math.round(d.ratio * 100)} (${d.matched}/${d.total})</span>` : ''}<span class="m">işlem ${m.took}s</span></div>
    ${m.warnings?.length ? `<ul class="warns">${m.warnings.map(w => `<li>${esc(w)}</li>`).join('')}</ul>` : ''}
    ${d ? `<div class="m" style="font-size:18px"><label><input type="checkbox" id="chImp" ${m.improv ? 'checked' : ''}> Doğaçlama var — kesme</label> <span class="muted">(${d.n_extra} fazla kelime; onayda gerçek söylediğin metin sahne metni olur)</span></div>` : ''}
    ${m.cues && m.cues.total ? `<div class="cues ${m.cues.missing.length ? '' : 'allok'}">${m.cues.missing.length ? 'Eşleşmeyen sahne işaretleri: <b>' + m.cues.missing.map(esc).join(' · ') + '</b>' : `Tüm sahne işaretleri bulundu (${m.cues.total})`}</div>` : ''}
    ${d ? `<div class="muted">Whisper ne duydu <span class="diff"><span class="ok">eşleşti</span> · <span class="miss">eksik</span> · <span class="extra">doğaçlama</span></span></div><div class="diff">${ops}</div>` : ''}
    <div class="muted">${esc(m.transcript || '')}</div>
    <div class="takes">${s.takes.map(t => `<button class="b${t.n === m.n ? ' sel' : ''}" data-n="${t.n}">${t.n}. ${t.verdict === 'ok' ? '✅' : '⚠️'} ${t.duration ?? ''}s${s.approved === t.n ? ' ✓' : ''}</button>`).join('')}</div></div>`;
  const ci = $('chImp'); if (ci) ci.onchange = () => api('improv', { seg: id, n: m.n, value: ci.checked });
  box.querySelectorAll('.takes .b').forEach(b => b.onclick = () => { ST.takeSel[id] = +b.dataset.n; stopAudio(); drawResult(); });
  updButtons();
}
function updButtons() {
  const id = seg(), s = S(id), has = (s.takes || []).length > 0, rec = !!ST.rec;
  $('bRec').textContent = rec ? '■ Durdur' : '● Kayıt'; $('bRec').classList.toggle('rec', rec); $('bRec').disabled = ST.busy;
  ['bPlay', 'bOk', 'bWith'].forEach(b => $(b).disabled = !has || rec || ST.busy); $('bRetake').disabled = !has || rec || ST.busy; $('bSkip').textContent = s.skipped ? '↩ Atlamayı kaldır' : '⏭ Atla';
  $('bPrev').disabled = ST.cur === 0; $('bNext').disabled = ST.cur === ST.order.length - 1;
}

/* ---- kayıt ---- */
let ctx, analyser, raf;
async function ensureMic() {
  if (ST.stream) return;
  ST.stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false } });
  ctx = new AudioContext(); const src = ctx.createMediaStreamSource(ST.stream); analyser = ctx.createAnalyser(); analyser.fftSize = 1024; src.connect(analyser);
  const buf = new Float32Array(1024); (function tick() { analyser.getFloatTimeDomainData(buf); let p = 0; for (const v of buf) p = Math.max(p, Math.abs(v)); const db = 20 * Math.log10(p + 1e-6);
    $('lvl').style.width = Math.max(0, Math.min(100, (db + 60) / 60 * 100)) + '%'; $('lvlt').textContent = (db > -90 ? db.toFixed(0) : '-∞') + ' dBFS'; raf = requestAnimationFrame(tick); })();
}
async function toggleRec() {
  if (ST.busy) return;
  if (ST.rec) { ST.rec.stop(); return; }
  stopAudio(); const id = seg();
  try { await ensureMic(); } catch (e) { $('res').innerHTML = `<div class="card warn">Mikrofona erişilemedi: ${esc(e.message)}</div>`; return; }
  ST.busy = true; updButtons(); $('cd').style.display = 'flex'; $('cd').textContent = '1'; await new Promise(r => setTimeout(r, 1000)); $('cd').style.display = 'none'; ST.busy = false;
  const mr = new MediaRecorder(ST.stream, { mimeType: 'audio/webm;codecs=opus' }), chunks = []; ST.rec = mr;
  mr.ondataavailable = e => e.data.size && chunks.push(e.data);
  mr.onstop = async () => {
    ST.rec = null; ST.busy = true; updButtons(); $('res').innerHTML = '<div class="card">⏳ İşleniyor (Whisper dinliyor)…</div>';
    try {
      const blob = new Blob(chunks, { type: 'audio/webm' }), r = await fetch(`/api/take?seg=${id}&ext=webm`, { method: 'POST', body: blob }).then(r => r.json());
      if (r.error) throw new Error(r.error); ST.takeSel[id] = r.n;
    } catch (e) { $('res').innerHTML = `<div class="card warn">Hata: ${esc(e.message)} (kayıt diske kaydedildiyse studio/takes içinde duruyor)</div>`; }
    ST.busy = false; await refresh(); drawResult();
  };
  mr.start(250); updButtons();
}
$('bRec').onclick = toggleRec; $('bRetake').onclick = () => { if (!ST.rec) toggleRec(); };

/* ---- dinleme / onay / atla ---- */
function stopAudio() { if (ST.audio) { ST.audio.pause(); ST.audio = null; } if (ST.playRaf) cancelAnimationFrame(ST.playRaf); ST.playRaf = 0; }
const chosenN = () => ST.takeSel[seg()] ?? S(seg()).chosen;
async function takeAudio(n) { const b = await fetch(`/studio/takes/${seg()}_${n}.wav`).then(r => r.blob()); return new Audio(URL.createObjectURL(b)); }
async function playTake() { if (ST.audio) return stopAudio(); const n = chosenN(); if (!n) return; const a = await takeAudio(n); ST.audio = a; a.onended = () => { ST.audio = null; }; a.play(); }
$('bPlay').onclick = playTake;
$('bOk').onclick = async () => {
  const id = seg(), n = chosenN(); if (!n || ST.busy) return; let overwrite = false;
  if (S(id).approved) { if (!confirm(`${id} zaten onaylı (kayıt ${S(id).approved}). assets/narration/${id}.wav üzerine yazılsın mı?`)) return; overwrite = true; }
  ST.busy = true; updButtons(); const r = await api('approve', { seg: id, n, overwrite }); ST.busy = false;
  if (r.code !== 200) { alert(r.error === 'overwrite_needed' ? 'Üzerine yazma onayı gerekli.' : r.error); return updButtons(); }
  ST.status = r.status; drawSide(); drawSummary(); drawResult(); $('pmsg').textContent = 'Onaylandı; zamanlar gerçek sese göre güncellendi.'; reloadFrame(null);
};
$('bSkip').onclick = async () => { const id = seg(); ST.status = (await api('skip', { seg: id, skip: !S(id).skipped })).status; drawSide(); drawSummary(); drawResult(); };
$('bPrev').onclick = () => go(ST.cur - 1); $('bNext').onclick = () => go(ST.cur + 1);
$('bDone').onclick = async () => { const r = await api('done', {}); alert(`studio/DONE.json yazıldı.\nonaylı: ${r.approved.length}, atlanan: ${r.skipped.length}, uyarılı: ${r.warned.length}, bekleyen: ${r.pending.length}`); };

/* ---- sahne önizleme ---- */
const fr = $('fr'); let frKey = null;
function fit() { fr.style.transform = `scale(${$('stagewrap').clientWidth / 1920})`; } addEventListener('resize', fit);
function reloadFrame(take) {
  const key = take ? seg() + ':' + take : 'plain'; if (key === frKey && fr.contentWindow?.__ready) return Promise.resolve();
  frKey = key; const id = seg();
  fr.src = '../index.html?render' + (take ? `&words=${encodeURIComponent(`/api/words_js?seg=${id}&take=${take}`)}` : '');
  return new Promise(res => { const t0 = Date.now(), iv = setInterval(() => { const w = fr.contentWindow; if ((w && w.__ready && w.__segs) || Date.now() - t0 > 20000) { clearInterval(iv); res(); } }, 100); });
}
function setPrev(show) { const w = fr.contentWindow; if (!w || !w.__render) return; const s = (w.__segs || []).find(s => s.id === seg()); if (s) w.__render(Math.max(s.start, s.end - 0.05)); }
fr.onload = () => { fit(); setTimeout(() => setPrev(), 300); };
async function watch(take) {
  stopAudio(); await reloadFrame(take); const w = fr.contentWindow; if (!w?.__ready || !Array.isArray(w.__segs)) { $('pmsg').textContent = 'Ders önizlemesi yüklenemedi. Sayfayı yenileyip tekrar dene.'; return; } const s = w.__segs.find(s => s.id === seg()); if (!s) { $('pmsg').textContent = 'Bu sahne önizlemede yok'; return; }
  let audio = null; if (take) { audio = await takeAudio(take); ST.audio = audio; }
  const t0 = performance.now(), t1 = s.end; $('pmsg').textContent = take ? 'Kaydınla izleniyor…' : '';
  const startAt = audio ? s.audioStart : s.start; if (audio) { w.__render(s.start); }
  const myAudio = audio, begin = performance.now() + (audio ? 0 : 0);
  if (audio) audio.currentTime = 0;
  const tick = () => {
    let t; if (audio) { t = audio.currentTime > 0 || !audio.paused ? s.audioStart + audio.currentTime : s.start; } else t = s.start + (performance.now() - begin) / 1000;
    w.__render(Math.min(t, t1)); if (t < t1 && (ST.audio === myAudio)) ST.playRaf = requestAnimationFrame(tick); else { if (audio) ST.audio = null; $('pmsg').textContent = ''; }
  };
  if (audio) { ST.audio = audio; const lead = s.audioStart - s.start; await new Promise(r => setTimeout(r, 0)); const b0 = performance.now(); ST.playRaf = 0;
    const pre = () => { const e = (performance.now() - b0) / 1000; if (e < lead) { w.__render(s.start + e); ST.playRaf = requestAnimationFrame(pre); } else { audio.play(); tick(); } }; pre(); }
  else tick();
}
$('bScene').onclick = () => watch(null); $('bWith').onclick = () => watch(chosenN());

/* ---- klavye ---- */
const nextTodo = () => { for (let i = ST.cur + 1; i < ST.order.length; i++) { const s = S(ST.order[i]); if (!s.skipped && !s.approved) return i; } return ST.cur + 1; };
addEventListener('keydown', e => {
  if (/INPUT|SELECT|TEXTAREA/.test(e.target.tagName) || document.querySelector('dialog[open]') || e.metaKey || e.ctrlKey) return;
  if (e.key === 'r' || e.key === 'R') toggleRec(); else if (e.key === ' ') { e.preventDefault(); playTake(); } else if (e.key === 'Enter') $('bOk').click();
  else if (e.key === 'n' || e.key === 'N') go(nextTodo()); else if (e.key === 'ArrowRight') go(ST.cur + 1); else if (e.key === 'ArrowLeft') go(ST.cur - 1);
});
(async () => { await refresh(); ST.cur = Math.min(LS.get('studio.cur', 0), ST.order.length - 1); fr.src = '../index.html?render'; frKey = 'plain'; fit(); drawSide(); drawSeg(); setInterval(async () => { if (!ST.busy && !ST.rec) { const w = (await api('state')).whisper; $('whisper').textContent = w.error ? 'Whisper hatası' : w.ready ? 'Whisper hazır' : 'Whisper yükleniyor…'; } }, 3000); })();

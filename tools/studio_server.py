#!/usr/bin/env python3
"""Kayıt stüdyosu sunucusu: statik dosyalar (proje kökü) + JSON API + yerel Whisper kontrolü.
Çalıştır: $PY (bkz. tools/studio.sh) tools/studio_server.py   (tools/studio.sh ile)"""
import json, os, re, sys, wave, shutil, subprocess, threading, difflib, unicodedata, time, glob
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from urllib.parse import urlparse, parse_qs
import numpy as np

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ST = f'{ROOT}/studio'; TAKES = f'{ST}/takes'; NARR = f'{ROOT}/assets/narration'
PORT = int(os.environ.get('STUDIO_PORT', 8770))
MODEL = 'mlx-community/whisper-large-v3-turbo'
if glob.glob(os.path.expanduser('~/.cache/huggingface/hub/models--mlx-community--whisper-large-v3-turbo')):
    os.environ.setdefault('HF_HUB_OFFLINE', '1')
os.makedirs(TAKES, exist_ok=True); os.makedirs(NARR, exist_ok=True)
LOCK = threading.Lock()          # status.json / words.json yazımları
WLOCK = threading.Lock()         # Whisper tek seferde bir iş
WSTATE = {'ready': False, 'error': None}

# ---------------------------------------------------------------- yardımcılar
def jload(p, d=None):
    try: return json.load(open(p))
    except Exception: return d
def jsave(p, o, **kw):
    tmp = p + '.tmp'; json.dump(o, open(tmp, 'w'), ensure_ascii=False, **kw); os.replace(tmp, p)
def script():
    s = jload(f'{ST}/script.json', {}); s.update(jload(f'{ST}/_test_script.json', {})); return s
def status(): return jload(f'{ST}/status.json', {})
def seg_status(st, seg): return st.setdefault(seg, {'voice': 'own', 'takes': [], 'chosen': None, 'approved': None, 'skipped': False})

# ---------------------------------------------------------------- metin normalleştirme
ONES = 'sıfır bir iki üç dört beş altı yedi sekiz dokuz'.split()
TENS = '_ on yirmi otuz kırk elli altmış yetmiş seksen doksan'.split()
def num_words(n):
    if n < 10: return [ONES[n]]
    if n < 100: return ([TENS[n // 10]] if True else []) + ([ONES[n % 10]] if n % 10 else [])
    if n < 1000: return ([] if n // 100 == 1 else [ONES[n // 100]]) + ['yüz'] + (num_words(n % 100) if n % 100 else [])
    if n < 10**6: return ([] if n // 1000 == 1 else num_words(n // 1000)) + ['bin'] + (num_words(n % 1000) if n % 1000 else [])
    return [ONES[int(c)] for c in str(n)]
SUP = {'⁰': 0, '¹': 1, '²': 2, '³': 3, '⁴': 4, '⁵': 5, '⁶': 6, '⁷': 7, '⁸': 8, '⁹': 9}
SYM = {'=': ' eşittir ', '+': ' artı ', '^': ' üzeri ', '×': ' çarpı ', '·': ' çarpı ', '*': ' çarpı ', '÷': ' bölü ', '/': ' bölü ', '%': ' yüzde ', '²': ' kare ', '³': ' küp '}
FOLD = str.maketrans('çğıöşüâî', 'cgiosuai')
EQUIV = {'iks': 'x', 'ikis': 'x', 'eks': 'x', 'ye': 'y', 'igrek': 'y', 'ıgrek': 'y', 'fe': 'f', 'de': 'd', 'be': 'b', 'ce': 'c', 'ge': 'g', 'he': 'h', 'ke': 'k', 'le': 'l', 'me': 'm', 'ne': 'n', 'pe': 'p', 're': 'r', 'se': 's', 'te': 't', 've': 'v', 'ze': 'z'}
def tr_lower(s): return unicodedata.normalize('NFC', s.replace('İ', 'i').replace('I', 'ı').lower())
def expand(raw, fold=True, equiv=True):
    """Ham kelime/ifade -> normalleştirilmiş jeton listesi (rakamlar sayı sözcüklerine, simgeler sözcüklere)."""
    s = tr_lower(raw)
    s = ''.join(f' üzeri {SUP[c]} ' if c in SUP and c not in '²³' else c for c in s)
    s = re.sub(r"(?<=\d)[’'`´][^\s]*", '', s)                      # 4'ün -> 4
    s = re.sub(r"[’'`´].*$", '', s)                                  # f'nin -> f
    s = re.sub(r'(?<=\d)[.,](?=\d)', ' ', s)
    s = re.sub(r'(?<![\wçğıöşü])[-−–—](?=\S)', ' eksi ', s); s = re.sub(r'(?<=[\wçğıöşü])[-−–—](?=[\d(])', ' eksi ', s)
    s = ''.join(SYM.get(c, c) for c in s)
    s = re.sub(r'(\d+)', r' \1 ', s)
    out = []
    for t in s.split():
        if t.isdigit(): out += num_words(int(t)) if len(t) < 7 else [ONES[int(c)] for c in t]; continue
        # harf yığınları: '12x' zaten ayrıldı; "xy" gibi ayrı bırakılır
        for t in re.split(r'[^0-9a-zçğıöşüâî]+', t):
            if not t: continue
            if re.fullmatch(r'[xyz]{2,3}|f[xy]{1,2}', t): out += list(t)       # xy -> x y, fxy -> f x y
            else: out.append(t)
    if equiv: out = [EQUIV.get(t, t) for t in out]
    return [t.translate(FOLD) for t in out] if fold else out
def ref_words(text): return [w for w in text.split() if expand(w)]

# ---------------------------------------------------------------- Whisper
def whisper_boot():
    try:
        import mlx_whisper
        silent = os.path.join(TAKES, '_warm.wav')
        with wave.open(silent, 'wb') as w: w.setnchannels(1); w.setsampwidth(2); w.setframerate(16000); w.writeframes(b'\0\0' * 16000)
        mlx_whisper.transcribe(silent, path_or_hf_repo=MODEL, language='tr', word_timestamps=True); os.remove(silent)
        WSTATE['ready'] = True; print('Whisper hazır', flush=True)
    except Exception as e: WSTATE['error'] = str(e); print('Whisper hatası', e, flush=True)
def transcribe(path):
    import mlx_whisper
    with WLOCK:
        r = mlx_whisper.transcribe(path, path_or_hf_repo=MODEL, language='tr', word_timestamps=True, condition_on_previous_text=False)
    toks = []                                                      # (jeton, başlangıç, bitiş, ham kelime)
    for s in r['segments']:
        for w in s.get('words', []):
            raw = w['word'].strip(); e = expand(raw); u = expand(raw, False, False)
            plain = len(e) == 1 and not re.search(r'[\d=+^×÷/%²³⁰-⁹]', raw)
            for k, t in enumerate(e):
                a, b = w['start'], w['end']; d = (b - a) / len(e)
                toks.append((t, a + d * k, a + d * (k + 1), raw, raw if plain else (u[k] if len(u) == len(e) else t)))
    return r.get('text', '').strip(), toks

def match(ref, hyp):
    """ref: ham kelimeler, hyp: jetonlar. -> T (ref başına hyp indeksi|None), ops (fark listesi)"""
    # ref kelimesi birden fazla jetona açılırsa (nadir) ilk jeton yerine birleşimi kullan
    Rn = [(expand(w) or [''])[0] if len(expand(w)) <= 1 else ''.join(expand(w)) for w in ref]
    Hn = [h[0] for h in hyp]
    sm = difflib.SequenceMatcher(None, Rn, Hn, autojunk=False)
    M = [None] * len(ref); extra = set(range(len(hyp)))
    for a, b, n in sm.get_matching_blocks():
        for k in range(n): M[a + k] = b + k; extra.discard(b + k)
    for tag, i1, i2, j1, j2 in sm.get_opcodes():                  # eşit uzunlukta 'replace': benzer kelimeleri eşle (soruyu~soru)
        if tag == 'replace' and i2 - i1 == j2 - j1:
            for k in range(i2 - i1):
                if difflib.SequenceMatcher(None, Rn[i1 + k], Hn[j1 + k]).ratio() >= .75: M[i1 + k] = j1 + k; extra.discard(j1 + k)
    return M, extra, sm

def compare(spoken, hyp):
    ref = ref_words(spoken); M, extra, sm = match(ref, hyp)
    n = len(ref); ok = sum(m is not None for m in M)
    run = best = 0
    for m in M: run = run + 1 if m is None else 0; best = max(best, run)
    # fark gösterimi: ref sırasında; her ref kelimesinden önce eşlenmemiş hyp jetonları 'extra'
    ops = []; hj = 0
    for i, m in enumerate(M):
        if m is not None:
            ops += [{'t': 'extra', 'w': hyp[j][4]} for j in range(hj, m) if j in extra]; hj = m + 1
            ops.append({'t': 'ok', 'w': ref[i]})
        else: ops.append({'t': 'miss', 'w': ref[i]})
    ops += [{'t': 'extra', 'w': hyp[j][4]} for j in range(hj, len(hyp)) if j in extra]
    return dict(total=n, matched=ok, n_extra=len(extra), ratio=ok / max(1, n), max_missing_run=best,
                missing=[ref[i] for i, m in enumerate(M) if m is None], extra=[hyp[j][3] or hyp[j][0] for j in sorted(extra)], ops=ops)

def align(text, hyp, D):
    """align_words.py mantığı: ref (bilinen metin) kelimeleri -> Whisper zamanları; boşlukları komşulardan doldur."""
    ref = ref_words(text); M, extra, sm = match(ref, hyp)
    T = [(hyp[m][1], hyp[m][2]) if m is not None else None for m in M]
    Rn = [''.join(expand(w)) for w in ref]
    for tag, i1, i2, j1, j2 in sm.get_opcodes():
        if tag == 'replace' and j2 > j1 and any(T[k] is None for k in range(i1, i2)):
            s0, e0 = hyp[j1][1], hyp[j2 - 1][2]; L = sum(len(Rn[k]) + 1 for k in range(i1, i2)); acc = 0
            for k in range(i1, i2):
                l = len(Rn[k]) + 1
                if T[k] is None: T[k] = (s0 + (e0 - s0) * acc / L, s0 + (e0 - s0) * (acc + l) / L)
                acc += l
    for k in range(len(T)):
        if T[k] is None:
            p = next((T[j][1] for j in range(k - 1, -1, -1) if T[j]), 0.0); q = next((T[j][0] for j in range(k + 1, len(T)) if T[j]), D)
            T[k] = (p, max(p, min(q, p + .35)))
    for k in range(1, len(T)):                                    # monoton yap
        if T[k][0] < T[k - 1][0]: T[k] = (T[k - 1][0], max(T[k - 1][0], T[k][1]))
    return dict(duration=round(D, 3), matched=f'{sum(m is not None for m in M)}/{len(ref)}', words=[dict(w=w, start=round(s, 3), end=round(e, 3)) for w, (s, e) in zip(ref, T)])

def improv_align(spoken, hyp, D):
    """Doğaçlama: eşleşen kelimeler özgün yazımıyla, fazladan söylenenler Whisper'dan; eksikler düşer. Hepsi eşleşmiş zamanlı liste."""
    ref = ref_words(spoken); M, extra, sm = match(ref, hyp); W = []; hj = 0
    for i, m in enumerate(M):
        if m is None: continue
        W += [(hyp[j][4], hyp[j][1], hyp[j][2]) for j in range(hj, m) if j in extra]; hj = m + 1; W.append((ref[i], hyp[m][1], hyp[m][2]))
    W += [(hyp[j][4], hyp[j][1], hyp[j][2]) for j in range(hj, len(hyp)) if j in extra]
    return ' '.join(w for w, _, _ in W), dict(duration=round(D, 3), matched=f'{len(W)}/{len(W)}', improv=True, words=[dict(w=w, start=round(a, 3), end=round(b, 3)) for w, a, b in W])

def enorm(s): return re.sub(r'[^a-z0-9]', '', unicodedata.normalize('NFD', s.replace('İ', 'i').replace('I', 'ı').lower()).encode('ascii', 'ignore').decode().replace('ı', 'i'))
_CUES = {'mt': None, 'v': None}
def lesson_cues():
    """lesson_parts/A.js -> {seg: [{cue, nth}]} (node ile değerlendirilir; dosya değişince yenilenir)"""
    fs = [f for f in glob.glob(f'{ROOT}/lesson_parts/*.js')]; mt = max(os.path.getmtime(f) for f in fs) if fs else 0
    if _CUES['mt'] == mt: return _CUES['v']
    js = r'''global.window={};const fs=require('fs');const out={};
for(const f of process.argv.slice(1)){(0,eval)(fs.readFileSync(f,'utf8'));}
const P=window.LESSON_PARTS||{};
function walk(o,seg){if(Array.isArray(o)){o.forEach(x=>walk(x,seg));return;}if(!o||typeof o!=='object')return;
 const sg=o.seg&&o.type?o.seg:seg; for(const k of ['cue','labelCue']) if(typeof o[k]==='string') (out[sg]=out[sg]||[]).push({cue:o[k],nth:o.nth||1});
 for(const v of Object.values(o)) if(v&&typeof v==='object') walk(v,sg);}
for(const part of Object.values(P)) for(const sc of part.scenes) walk(sc.items,sc.seg);
console.log(JSON.stringify(out));'''
    try: v = json.loads(subprocess.run(['node', '-e', js, *fs], capture_output=True, text=True, timeout=20).stdout or '{}')
    except Exception: v = {}
    _CUES.update(mt=mt, v=v); return v
def cue_check(seg, hyp):
    """Motorun cue kuralı: ardışık kelimeler eşit ya da (>=5 harf) önek eşleşmesi. Bulunamayan cue ifadelerini döndür."""
    W = [w for t in hyp for w in ([enorm(x) for x in expand(t[3], False, True)] if re.search(r'[\d=+^]', t[3]) else [enorm(t[3])]) if w]
    W = [EQUIV.get(w, w) for w in W]; miss = []; cues = lesson_cues().get(seg, [])
    for c in cues:
        q = [EQUIV.get(enorm(x), enorm(x)) for x in c['cue'].split() if enorm(x)]; cnt = 0
        for i in range(len(W) - len(q) + 1):
            if all(W[i + k] == t or (len(t) >= 5 and W[i + k].startswith(t)) or (len(W[i + k]) >= 5 and t.startswith(W[i + k])) for k, t in enumerate(q)):
                cnt += 1
                if cnt >= c['nth']: break
        if cnt < c['nth'] and c['cue'] not in miss: miss.append(c['cue'])
    return {'total': len(cues), 'missing': miss}

# ---------------------------------------------------------------- metin düzenleme
MATH_RE = re.compile(r'\$[^$]+\$')
def split_display(d):
    """-> (düzyazı kelimeleri, formül listesi). \'de gibi ekler ve noktalama-tek kelimeler düzyazıya sayılmaz."""
    toks = [w for w in MATH_RE.sub(' \0 ', d).split() if not w.startswith(("'", '’')) and (w == '\0' or enorm(w))]
    prose = [w for w in toks if w != '\0']; split_display.before_math = {sum(t != '\0' for t in toks[:i]) - 1 for i, t in enumerate(toks) if t == '\0'}
    return prose, MATH_RE.findall(d)
def edit_spoken(old_disp, new_disp, spoken):
    op, om = split_display(old_disp); np_, nm = split_display(new_disp); nbm = split_display.before_math; sw = spoken.split()
    sm = difflib.SequenceMatcher(None, [enorm(w) for w in op], [enorm(w) for w in sw], autojunk=False); pos = {}
    for a, b, n in sm.get_matching_blocks():
        for k in range(n): pos[a + k] = b + k
    def at(i):                                   # i. eski düzyazı kelimesinden itibaren ilk eşlenmiş konuşma indeksi
        return next((pos[j] for j in range(i, len(op)) if j in pos), None)
    ed = []                                      # (başla, bitir, yeni_kelimeler) konuşma indeksinde
    for tag, i1, i2, j1, j2 in difflib.SequenceMatcher(None, [enorm(w) for w in op], [enorm(w) for w in np_], autojunk=False).get_opcodes():
        if tag == 'equal': continue
        new = np_[j1:j2]
        if tag == 'insert':
            p = at(i1)
            if (j2 - 1) in nbm and any(j in pos for j in range(i1)): p = None
            if p is None: p = next((pos[j] + 1 for j in range(i1 - 1, -1, -1) if j in pos), len(sw))
            ed.append((p, p, new))
        else:
            idx = [pos[j] for j in range(i1, i2) if j in pos]
            if not idx: p = at(i1) if at(i1) is not None else len(sw); ed.append((p, p, new)); continue
            if len(idx) == i2 - i1 and len(new) == len(idx):
                for q, w in zip(idx, new): ed.append((q, q + 1, [w]))
            else:
                ed.append((idx[0], idx[0] + 1, new))
                ed += [(q, q + 1, []) for q in idx[1:]]
    for a, b, new in sorted(ed, key=lambda e: (e[0], e[1]), reverse=True): sw[a:b] = new
    return ' '.join(sw), om != nm
def edit_script(seg, display):
    with LOCK:
        sc = jload(f'{ST}/script.json', {}); e = sc[seg]
        if not os.path.exists(f'{ST}/script.orig.json'): shutil.copy(f'{ST}/script.json', f'{ST}/script.orig.json')
        nj = f'{ROOT}/narration_segments.json'
        if not os.path.exists(f'{ST}/narration_segments.orig.json') and os.path.exists(nj): shutil.copy(nj, f'{ST}/narration_segments.orig.json')
        e.setdefault('display_original', e['display']); e.setdefault('spoken_original', e['spoken'])
        spoken, math_ch = edit_spoken(e['display'], display, e['spoken']); e['display'] = display; e['spoken'] = spoken
        o_math = split_display(e['display_original'])[1]; math_ch = split_display(display)[1] != o_math
        jsave(f'{ST}/script.json', sc, indent=1)
        ns = jload(nj, {})
        if seg in ns: ns[seg] = spoken; jsave(nj, ns, indent=1)
        st = status(); S = seg_status(st, seg); S['math_edited'] = math_ch; jsave(f'{ST}/status.json', st, indent=1)
    return {'script': script(), 'status': st}
def reset_script(seg):
    with LOCK:
        sc = jload(f'{ST}/script.json', {}); e = sc[seg]
        if 'display_original' in e:
            e['display'] = e.pop('display_original'); e['spoken'] = e.pop('spoken_original'); jsave(f'{ST}/script.json', sc, indent=1)
            nj = f'{ROOT}/narration_segments.json'; ns = jload(nj, {})
            if seg in ns: ns[seg] = e['spoken']; jsave(nj, ns, indent=1)
        st = status(); seg_status(st, seg)['math_edited'] = False; jsave(f'{ST}/status.json', st, indent=1)
    return {'script': script(), 'status': st}

# ---------------------------------------------------------------- ses işleme
def ff(*a, **k): return subprocess.run(['ffmpeg', '-hide_banner', '-nostdin', '-y', *a], capture_output=True, **k)
def process_audio(src, dst):
    r = ff('-i', src, '-ac', '1', '-ar', '48000', '-f', 'f32le', '-')
    x = np.frombuffer(r.stdout, dtype=np.float32).copy()
    if len(x) < 480: raise ValueError('ses çözülemedi / boş kayıt')
    sr = 48000; hop = 960                                           # 20 ms RMS
    n = len(x) // hop; rms = np.sqrt((x[:n * hop].reshape(n, hop) ** 2).mean(1) + 1e-12); db = 20 * np.log10(rms)
    thr = max(-55.0, db.max() - 40); idx = np.where(db > thr)[0]
    a = max(0, (idx[0] * hop if len(idx) else 0) - int(.15 * sr)); b = min(len(x), ((idx[-1] + 1) * hop if len(idx) else len(x)) + int(.15 * sr))
    y = x[a:b]; peak = float(np.abs(y).max()) if len(y) else 0.0
    clip = int((np.abs(y) >= .999).sum())
    with wave.open(dst, 'wb') as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(sr); w.writeframes((np.clip(y, -1, 1) * 32767).astype('<i2').tobytes())
    e = ff('-i', dst, '-af', 'ebur128=peak=true', '-f', 'null', '-').stderr.decode('utf8', 'ignore')
    m = re.findall(r'I:\s+(-?[\d.]+) LUFS', e); lufs = float(m[-1]) if m else None
    return dict(duration=round(len(y) / sr, 3), raw_duration=round(len(x) / sr, 3), trimmed=[round(a / sr, 2), round(len(x) / sr - b / sr, 2)],
                peak_db=round(20 * np.log10(max(peak, 1e-6)), 1), lufs=lufs, clipped=clip)

def process_take(seg, raw_bytes, ext):
    with LOCK:
        st = status(); S = seg_status(st, seg); n = max([t['n'] for t in S['takes']] + [len(glob.glob(f'{TAKES}/{seg}_*.json'))]) + 1
        orig = f'{TAKES}/{seg}_{n}.{ext}'; open(orig, 'wb').write(raw_bytes)      # asla kaybolmasın: önce diske
        S['takes'].append({'n': n, 'file': os.path.basename(orig), 'pending': True}); jsave(f'{ST}/status.json', st, indent=1)
    t0 = time.time(); wav = f'{TAKES}/{seg}_{n}.wav'
    meta = {'n': n, 'seg': seg, 'orig': os.path.basename(orig), 'wav': os.path.basename(wav), 'created': time.strftime('%Y-%m-%d %H:%M:%S')}
    try:
        meta.update(process_audio(orig, wav))
        text, hyp = transcribe(wav)
        cmp = compare(script()[seg]['spoken'], hyp); meta.update(transcript=text, diff=cmp)
        meta['cues'] = cue_check(seg, hyp); meta['lenient'] = bool(status().get(seg, {}).get('math_edited')); meta['improv'] = cmp['n_extra'] >= 5 or meta['lenient']
        meta['text_improv'], meta['align_improv'] = improv_align(script()[seg]['spoken'], hyp, meta['duration'])
        meta['align'] = align((jload(f'{ROOT}/narration_segments.json', {}).get(seg)) or script()[seg]['spoken'], hyp, meta['duration'])
        warns = []
        if meta['lenient']: pass                                   # formül değişti: eşleşme denetimi gevşek
        elif cmp['ratio'] < .9: warns.append(f"Eşleşme %{round(cmp['ratio'] * 100)} (en az %90 gerekir)")
        if not meta['lenient'] and cmp['max_missing_run'] >= 3: warns.append(f"{cmp['max_missing_run']} kelimelik eksik dizi var")
        if meta['peak_db'] > -1: warns.append(f"Ses patlıyor (tepe {meta['peak_db']} dBFS) — mikrofonu biraz uzaklaştırın")
        if meta['lufs'] is not None and meta['lufs'] < -30: warns.append(f"Ses çok kısık ({meta['lufs']} LUFS)")
        if meta['peak_db'] < -50: warns.append('Kayıtta ses yok — mikrofon seçili mi?')
        if meta['duration'] < .8: warns.append('Kayıt çok kısa')
        meta['warnings'] = warns; meta['verdict'] = 'warn' if warns else 'ok'
    except Exception as e:
        meta.update(verdict='error', warnings=[f'İşleme hatası: {e}']); print('take hatası', e, file=sys.stderr)
    meta['took'] = round(time.time() - t0, 1); jsave(f'{TAKES}/{seg}_{n}.json', meta, indent=1)
    with LOCK:
        st = status(); S = seg_status(st, seg); S['takes'] = [t for t in S['takes'] if t['n'] != n] + [{'n': n, 'file': meta['orig'], 'verdict': meta['verdict'], 'duration': meta.get('duration')}]
        S['takes'].sort(key=lambda t: t['n']); S['chosen'] = n; jsave(f'{ST}/status.json', st, indent=1)
    return meta

def write_words(seg, al):
    d = jload(f'{ROOT}/timing/words.json', {}); d[seg] = al
    jsave(f'{ROOT}/timing/words.json', d, indent=0)
    open(f'{ROOT}/timing/words.js', 'w').write('window.WORDS = ' + json.dumps(d, ensure_ascii=False, separators=(',', ':')) + ';\n')

def approve(seg, n, overwrite):
    with LOCK:
        st = status(); S = seg_status(st, seg); dst = f'{NARR}/{seg}.wav'
        if S.get('approved') and os.path.exists(dst) and not overwrite: return 409, {'error': 'overwrite_needed', 'approved': S['approved']}
        meta = jload(f'{TAKES}/{seg}_{n}.json')
        if not meta or 'align' not in meta: return 400, {'error': 'Bu kayıt işlenemedi, onaylanamaz'}
        shutil.copy(f'{TAKES}/{meta["wav"]}', dst + '.tmp'); os.replace(dst + '.tmp', dst)
        nj = f'{ROOT}/narration_segments.json'; ns = jload(nj, {}); orig = ns.get(seg) or script()[seg]['spoken']
        if not os.path.exists(f'{ST}/narration_segments.orig.json') and ns: shutil.copy(nj, f'{ST}/narration_segments.orig.json')
        if meta.get('improv'):
            S.setdefault('spoken_original', orig); ns[seg] = meta['text_improv']; write_words(seg, meta['align_improv'])
        else:
            if S.get('spoken_original'): ns[seg] = S.pop('spoken_original')
            write_words(seg, meta['align'])
        if seg in ns or meta.get('improv'): jsave(nj, ns, indent=1)
        S.update(approved=n, chosen=n, skipped=False, improv=bool(meta.get('improv')), approved_at=time.strftime('%Y-%m-%d %H:%M:%S'), verdict=meta['verdict']); jsave(f'{ST}/status.json', st, indent=1)
    return 200, {'ok': True, 'status': st}

# ---------------------------------------------------------------- HTTP
class H(SimpleHTTPRequestHandler):
    def __init__(self, *a, **k): super().__init__(*a, directory=ROOT, **k)
    def log_message(self, *a): pass
    def end_headers(self): self.send_header('Cache-Control', 'no-store'); super().end_headers()
    def reply(self, code, obj, ctype='application/json'):
        b = obj if isinstance(obj, bytes) else json.dumps(obj, ensure_ascii=False).encode(); self.send_response(code)
        self.send_header('Content-Type', ctype + ('; charset=utf-8' if 'json' in ctype or 'javascript' in ctype else '')); self.send_header('Content-Length', str(len(b))); self.end_headers(); self.wfile.write(b)
    def do_GET(self):
        u = urlparse(self.path); q = {k: v[0] for k, v in parse_qs(u.query).items()}
        if u.path == '/api/state': return self.reply(200, {'script': script(), 'status': status(), 'whisper': WSTATE, 'order': list(script())})
        if u.path == '/api/take': return self.reply(200, jload(f'{TAKES}/{os.path.basename(q["seg"])}_{int(q["n"])}.json', {}))
        if u.path == '/api/words_js':        # "Kaydınla izle": bu kaydın hizalamasını geçici olarak kullanan words.js
            d = jload(f'{ROOT}/timing/words.json', {})
            if q.get('take'): d[q['seg']] = jload(f'{TAKES}/{os.path.basename(q["seg"])}_{int(q["take"])}.json', {}).get('align', d.get(q['seg']))
            return self.reply(200, ('window.WORDS = ' + json.dumps(d, ensure_ascii=False) + ';').encode(), 'application/javascript')
        if u.path in ('/', '/studio'): self.send_response(302); self.send_header('Location', '/studio/'); self.end_headers(); return
        super().do_GET()
    def do_POST(self):
        u = urlparse(self.path); q = {k: v[0] for k, v in parse_qs(u.query).items()}
        body = self.rfile.read(int(self.headers.get('Content-Length') or 0))
        try:
            J = json.loads(body) if body and u.path != '/api/take' else {}
            sc = script()
            if u.path == '/api/take':
                seg = q['seg']
                if seg not in sc: return self.reply(404, {'error': 'bilinmeyen sahne'})
                return self.reply(200, process_take(seg, body, re.sub(r'\W', '', q.get('ext', 'webm')) or 'webm'))
            if u.path == '/api/edit': return self.reply(200, edit_script(J['seg'], J['display'].strip()))
            if u.path == '/api/edit_reset': return self.reply(200, reset_script(J['seg']))
            if u.path == '/api/approve': c, o = approve(J['seg'], int(J['n']), bool(J.get('overwrite'))); return self.reply(c, o)
            with LOCK:
                st = status()
                if u.path == '/api/skip': S = seg_status(st, J['seg']); S['skipped'] = bool(J.get('skip', True))
                elif u.path == '/api/voice': seg_status(st, J['seg'])['voice'] = J['voice']
                elif u.path == '/api/edit': pass
                elif u.path == '/api/improv':
                    mp = f"{TAKES}/{os.path.basename(J['seg'])}_{int(J['n'])}.json"; m = jload(mp, {}); m['improv'] = bool(J['value']); jsave(mp, m, indent=1)
                elif u.path == '/api/choose': seg_status(st, J['seg'])['chosen'] = int(J['n'])
                elif u.path == '/api/done':
                    info = {k: [] for k in ('approved', 'skipped', 'warned', 'pending')}
                    for s in sc:
                        S = st.get(s, {})
                        if S.get('approved'): info['approved'].append({'seg': s, 'file': f'assets/narration/{s}.wav', 'take': S['approved'], 'improv': S.get('improv', False), 'unmatched_cues': (jload(f"{TAKES}/{s}_{S['approved']}.json", {}) or {}).get('cues', {}).get('missing', []), 'voice': S.get('voice', 'own'), 'verdict': S.get('verdict')})
                        elif S.get('skipped'): info['skipped'].append({'seg': s, 'voice': S.get('voice', 'own')})
                        elif S.get('takes'): info['warned'].append({'seg': s, 'chosen': S.get('chosen'), 'unmatched_cues': (jload(f"{TAKES}/{s}_{S.get('chosen')}.json", {}) or {}).get('cues', {}).get('missing', []), 'verdict': (jload(f"{TAKES}/{s}_{S.get('chosen')}.json", {}) or {}).get('verdict')})
                        else: info['pending'].append({'seg': s})
                    for k in ('approved', 'skipped', 'warned', 'pending'):
                        for it in info[k]:
                            S = st.get(it['seg'], {}); it['math_edited'] = bool(S.get('math_edited')); it['display'] = sc[it['seg']]['display']
                            if 'display_original' in sc[it['seg']]: it['display_original'] = sc[it['seg']]['display_original']
                    info['voices'] = {s: st.get(s, {}).get('voice', 'own') for s in sc}; info['time'] = time.strftime('%Y-%m-%d %H:%M:%S')
                    jsave(f'{ST}/DONE.json', info, indent=1); return self.reply(200, info)
                else: return self.reply(404, {'error': 'yok'})
                jsave(f'{ST}/status.json', st, indent=1)
            return self.reply(200, {'ok': True, 'status': st})
        except Exception as e:
            import traceback; traceback.print_exc(); return self.reply(500, {'error': str(e)})

if __name__ == '__main__':
    threading.Thread(target=whisper_boot, daemon=True).start()
    srv = ThreadingHTTPServer(('127.0.0.1', PORT), H); print(f'Stüdyo: http://localhost:{PORT}/studio/', flush=True)
    try: srv.serve_forever()
    except KeyboardInterrupt: pass

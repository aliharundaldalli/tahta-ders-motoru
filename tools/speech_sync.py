"""Ses → sahne eşzamanlaması.

1) fit_scene_to_audio: sahne süresini sese uydurur (ses + 0,6 sn), nesne/anahtar kare zamanlarını orantılı ölçekler.
2) align_words: Whisper kelime zamanlarını anlatım metnine eşler (eşleşmeyenler komşulardan doldurulur).
3) retime_objects: nesnelerin girişini, anlatımda kendilerinden söz edilen kelimeye (cueText / ad / metin) taşır.
"""
import difflib
import re
import threading
import unicodedata

TAIL = .6                 # sesten sonra sahnede kalan sessiz pay (sn)
LEAD = .2                 # nesne, kelimeden bu kadar önce girer
STAGGER = .15             # aynı ana düşen girişler arasındaki en küçük fark
MIN_SCENE, MAX_SCENE = 2, 120
_WHISPER = threading.Lock()   # aynı anda tek Whisper çözümlemesi (bellek, mlx iş parçacığı güvenliği)
STOP = frozenset('ve ile bir bu şu o da de ki mi için gibi daha çok en ne her olan olarak sonra önce ama veya ya hem '
                 'şimdi burada şurada işte bunu şunu bunun onun yani kadar göre değil var yok'.split())


def fit_scene_to_audio(scene, audio_duration):
    """Sahne süresi = ses + 0,6 sn (2–120). Nesne başlangıç/süre ve anahtar kare zamanları eski→yeni oranla ölçeklenir,
    sahnenin içinde kalacak biçimde kırpılır. Ses kısa da uzun da olsa uygulanır. Yeni süreyi döndürür."""
    old = float(scene['duration'])
    new = round(min(MAX_SCENE, max(MIN_SCENE, audio_duration + TAIL)), 3)
    ratio = new / old if old > 0 else 1
    last = max(0, new - .1)
    for obj in scene['objects']:
        obj['start'] = round(min(last, max(0, obj['start'] * ratio)), 3)
        obj['duration'] = round(max(.1, min(obj['duration'] * ratio, new - obj['start'], 120)), 3)
        for frame in obj.get('keyframes') or []:
            frame['time'] = round(min(new, max(0, frame['time'] * ratio)), 3)
    scene['duration'] = new
    return new


def norm(word):
    """Türkçe küçük harf; kesme işaretinden sonraki ek atılır (Pisagor'un → pisagor); yalnız harf/rakam kalır."""
    word = unicodedata.normalize('NFC', word.replace('İ', 'i').replace('I', 'ı').lower())
    word = re.sub(r"[’'`´].*$", '', word)
    return re.sub(r'[^0-9a-zçğıöşüâîû]', '', word)


def _loose(word):
    """Whisper eşlemesi için aksan/büyük-küçük farkını yok sayan biçim (pro_api hizalamasıyla aynı)."""
    return ''.join(c for c in unicodedata.normalize('NFD', word.casefold()) if c.isalnum())


def align_words(audio_path, narration, duration, transcribe=None):
    """Whisper kelime zamanları → [{w,start,end,matched}] (anlatımın her kelimesi için), eşleşen sayı, toplam.
    Önce anlatım ipucu (initial_prompt) ile dener; kapsama %50'nin altındaysa ipucusuz yeniden dener.
    Whisper yoksa/başarısızsa istisna fırlatır (çağıran yakalar)."""
    if transcribe is None:
        import whisper_backend          # macOS: mlx-whisper, diğerleri: faster-whisper
        transcribe = whisper_backend.transcribe
    reference = narration.split()
    if not reference:
        return [], 0, 0
    matches = {}
    for prompt in (narration, None):
        with _WHISPER:
            result = transcribe(str(audio_path), language='tr', word_timestamps=True, initial_prompt=prompt)
        heard = [w for segment in result.get('segments', []) for w in segment.get('words', [])]
        found = {}
        matcher = difflib.SequenceMatcher(None, [_loose(w) for w in reference], [_loose(w['word']) for w in heard], autojunk=False)
        for block in matcher.get_matching_blocks():
            for k in range(block.size):
                found[block.a + k] = heard[block.b + k]
        if len(found) > len(matches):
            matches = found
        if len(matches) >= .5 * len(reference):
            break
    return interpolate(reference, matches, duration), len(matches), len(reference)


def interpolate(reference, matches, duration):
    """Eşleşmeyen kelimeleri komşu eşleşmeler arasına eşit dağıtır; zamanlar sıralı ve 0–duration içinde kalır."""
    spans = {k: (float(v['start']), float(v['end'])) for k, v in matches.items()}
    k = 0
    while k < len(reference):
        if k in spans:
            k += 1; continue
        first = k
        while k < len(reference) and k not in spans:
            k += 1
        left = spans[first - 1][1] if first else 0
        right = spans[k][0] if k < len(reference) else duration
        step = max(0, right - left) / (k - first)
        for j in range(first, k):
            spans[j] = (left + (j - first) * step, left + (j - first + 1) * step)
    words = []
    for k, w in enumerate(reference):
        start, end = spans[k]
        start = max(words[-1]['start'] if words else 0, min(start, duration))
        end = max(start, min(end, duration))
        words.append({'w': w, 'start': round(start, 3), 'end': round(end, 3), 'matched': k in matches})
    return words


def _same(a, b):
    """Kelime eşleşmesi: birebir ya da kısa olan ≥4 harf ve uzunun başı (üçgen ~ üçgenin, kare ~ kareyi)."""
    if a == b:
        return True
    short, long = sorted((a, b), key=len)
    return len(short) >= 4 and long.startswith(short)


def find_cue(phrase, tokens, used=()):
    """phrase (serbest metin) anlatım belirteçlerinde (norm'lanmış) nerede geçiyor? Kelime sırası ya da None.
    Önce bütün ifade ardışık aranır, sonra anahtar kelimeler (≥3 harf, bağlaç değil); en erken geçen seçilir."""
    words = [w for w in (norm(x) for x in re.split(r'\s+', phrase or '')) if w]
    if not words or not tokens:
        return None
    for i in range(len(tokens) - len(words) + 1):
        if all(_same(words[j], tokens[i + j]) for j in range(len(words))):
            return i
    keys = {w for w in words if len(w) >= 3 and w not in STOP and not w.isdigit()}
    hits = sorted(i for i, t in enumerate(tokens) if any(_same(key, t) for key in keys))
    free = [i for i in hits if i not in used]
    return (free or hits or [None])[0]      # ilk anıldığı an: anahtar kelimelerden anlatımda en önce geçeni


def object_phrases(obj):
    """Nesne için aday ipuçları, öncelik sırasıyla: AI'nin verdiği cueText, kullanıcı adı (tür adı değilse), metin."""
    out = []
    if isinstance(obj.get('cueText'), str) and obj['cueText'].strip():
        out.append(obj['cueText'])
    name = obj.get('name')
    if isinstance(name, str) and name.strip() and name not in (obj.get('type'), obj.get('text')):
        out.append(name)
    if obj.get('type') == 'text' and isinstance(obj.get('text'), str) and obj['text'].strip():
        out.append(obj['text'])
    return out


def retime_objects(scene, words):
    """Anlatımda adı geçen nesnelerin girişini o kelimeye taşır (kelime başı − 0,2 sn). Süre korunur, sahne sonuna kırpılır.
    Eşleşmeyen nesneler ve kilitli/elle konuşmaya bağlanmış/taşınan nesneler olduğu gibi kalır.
    Aynı ana düşen girişler 0,15 sn kaydırılır. Eşleşen [(nesne sırası, kelime sırası, yeni başlangıç)] döndürür."""
    tokens = [norm(w['w']) for w in words]
    if not tokens:
        return []
    duration = scene['duration']
    last = max(0, duration - .1)
    plan, used = [], set()
    for index, obj in enumerate(scene['objects']):
        if obj.get('locked') or obj.get('cue') or obj.get('carried'):
            continue
        for phrase in object_phrases(obj):
            hit = find_cue(phrase, tokens, used)
            if hit is not None:
                used.add(hit)
                plan.append([index, hit, max(0, words[hit]['start'] - LEAD)])
                break
    plan.sort(key=lambda p: (p[2], p[0]))
    previous = None
    for item in plan:
        if previous is not None and item[2] < previous + STAGGER:
            item[2] = previous + STAGGER
        item[2] = round(min(last, item[2]), 3)
        previous = item[2]
    for index, _, start in plan:
        obj = scene['objects'][index]
        shift = start - obj['start']
        obj['start'] = start
        obj['duration'] = round(max(.1, min(obj['duration'], duration - start)), 3)
        for frame in obj.get('keyframes') or []:
            frame['time'] = round(min(duration, max(0, frame['time'] + shift)), 3)
    return [tuple(p) for p in sorted(plan)]


def sync_scene(scene, audio_path, audio_duration, fit=True, transcribe=None):
    """Seslendirilmiş sahneyi sese uydurur. Döndürür: {'aligned': bool, 'matched', 'total', 'cues'} — hizalama
    yapılamazsa aligned=False (1. adım yine uygulanmış olur)."""
    if fit:
        fit_scene_to_audio(scene, audio_duration)
    else:
        scene['duration'] = round(max(scene['duration'], min(MAX_SCENE, audio_duration + .4)), 3)
    scene['words'] = []
    scene['alignment'] = ''
    try:
        words, matched, total = align_words(audio_path, scene['narration'], scene['duration'], transcribe)
    except Exception:            # Whisper yok, model inmemiş, ses okunamadı… → hizalamasız devam
        return {'aligned': False, 'matched': 0, 'total': len(scene['narration'].split()), 'cues': 0}
    if not words or matched == 0:
        return {'aligned': False, 'matched': 0, 'total': total, 'cues': 0}
    scene['words'] = words
    scene['alignment'] = f'Whisper {matched}/{total}'
    cues = retime_objects(scene, words) if fit else []
    return {'aligned': True, 'matched': matched, 'total': total, 'cues': len(cues)}

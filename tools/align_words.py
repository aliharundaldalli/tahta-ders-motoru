#!/usr/bin/env python3
"""Gerçek anlatımdan kelime zamanları → timing/words.json
Kullanım: .venv/bin/python tools/align_words.py [s05 s12 ...]   (boşsa hepsi)
mlx-whisper (yerel) ile kelime zaman damgaları alınır, sonra bilinen metnin
kelimelerine difflib ile eşlenir; eşlenmeyenler komşulardan doğrusal doldurulur.
Çıktı: {seg: {duration, words:[{w,start,end}]}} — kelimeler = narration_segments.json metni."""
import json, re, sys, os, difflib, subprocess, unicodedata
import whisper_backend
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SEG = json.load(open(f'{ROOT}/narration_segments.json'))
OUT = f'{ROOT}/timing/words.json'
MODEL = 'mlx-community/whisper-large-v3-turbo'
def norm(w):
    w = unicodedata.normalize('NFC', w.lower().replace('İ', 'i').replace('I', 'ı'))
    w = re.sub(r"[’'].*$", '', w)            # ek'leri at: f'nin → f
    return re.sub(r'[^0-9a-zçğıöşüâî]', '', w)
def dur(p): return float(subprocess.run(['ffprobe','-v','error','-show_entries','format=duration','-of','csv=p=0',p],capture_output=True,text=True).stdout)
res = json.load(open(OUT)) if os.path.exists(OUT) else {}
for seg in (sys.argv[1:] or list(SEG)):
    mp3 = next(f for f in (f'{ROOT}/assets/narration/{seg}.wav', f'{ROOT}/assets/narration/{seg}.mp3') if os.path.exists(f)); text = SEG[seg]
    ref = [w for w in text.split() if norm(w)]
    for prompt in (text, None):              # prompt bazen Whisper'ı parça atlatıyor → düşük eşleşmede prompt'suz dene
        r = whisper_backend.transcribe(mp3, language='tr', word_timestamps=True, initial_prompt=prompt)
        hyp = [(w['word'].strip(), w['start'], w['end']) for s in r['segments'] for w in s.get('words', [])]
        sm = difflib.SequenceMatcher(None, [norm(w) for w in ref], [norm(h[0]) for h in hyp], autojunk=False)
        if sum(n for *_, n in sm.get_matching_blocks()) >= .5 * len(ref): break
    T = [None] * len(ref)
    for a, b, n in sm.get_matching_blocks():
        for k in range(n): T[a + k] = (hyp[b + k][1], hyp[b + k][2])
    # replace/eşitsiz bloklar: orantılı dağıt
    for tag, i1, i2, j1, j2 in sm.get_opcodes():
        if tag in ('replace',) and j2 > j1:
            s0, e0 = hyp[j1][1], hyp[j2 - 1][2]
            L = sum(len(norm(w)) + 1 for w in ref[i1:i2]); acc = 0
            for k in range(i1, i2):
                l = len(norm(ref[k])) + 1
                T[k] = (s0 + (e0 - s0) * acc / L, s0 + (e0 - s0) * (acc + l) / L); acc += l
    D = dur(mp3); matched = sum(t is not None for t in T)
    for k in range(len(T)):                      # kalan boşluklar: komşular arası
        if T[k] is None:
            p = next((T[j][1] for j in range(k - 1, -1, -1) if T[j]), 0.0)
            q = next((T[j][0] for j in range(k + 1, len(T)) if T[j]), D)
            T[k] = (p, max(p, min(q, p + .35)))
    res[seg] = dict(duration=D, matched=f'{matched}/{len(ref)}', words=[dict(w=w, start=round(s, 3), end=round(e, 3)) for w, (s, e) in zip(ref, T)])
    print(seg, f'{D:.2f}s', res[seg]['matched'], flush=True)
    json.dump(res, open(OUT, 'w'), ensure_ascii=False, indent=0)

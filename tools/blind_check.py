#!/usr/bin/env python3
"""TTS çıktılarını Whisper ile KÖR yazıya döküp metinle karşılaştırır (tekrar / yutulan kelime / yanlış okuma).
'iks'→'x', 'üç'→'3' gibi farklar normal; asıl bakılacak: eksik/fazla kelime, tuhaf kelime.
Kullanım: .venv/bin/python tools/blind_check.py [seg ...]   (öğretmen stüdyoda kayıttayken ÇALIŞTIRMA)"""
import json, os, re, sys, difflib
os.environ.setdefault('HF_HUB_OFFLINE', '1'); sys.path.insert(0, os.path.dirname(os.path.abspath(__file__))); import whisper_backend
R = os.path.dirname(os.path.dirname(os.path.abspath(__file__))); os.chdir(R)
M = 'mlx-community/whisper-large-v3-turbo'; sc = json.load(open('studio/script.json')); only = sys.argv[1:]
norm = lambda s: re.sub(r"[^\wçğıöşüâ' ]", " ", s.lower().replace("’", "'")).split()
for k, v in sc.items():
    if v.get('voice') != 'cartesia' or (only and k not in only) or not os.path.exists(f'assets/narration/{k}.wav'): continue
    h = whisper_backend.transcribe(f'assets/narration/{k}.wav', language='tr')['text']
    a, b = norm(v['spoken']), norm(h); sm = difflib.SequenceMatcher(None, a, b)
    d = [(t, ' '.join(a[i1:i2]), ' '.join(b[j1:j2])) for t, i1, i2, j1, j2 in sm.get_opcodes() if t != 'equal']
    print(k, round(sm.ratio(), 2), d[:8], flush=True)

#!/usr/bin/env python3
"""Stüdyoda onaylanan KENDİ SES kayıtlarını (voice='own') yedekleyip seviyeler: studio/approved_raw/ ← ham, assets/narration/ ← −18 LUFS.
Kullanım: python3 tools/normalize_takes.py"""
import json, os, shutil, subprocess
R = os.path.dirname(os.path.dirname(os.path.abspath(__file__))); os.chdir(R)
sc = json.load(open('studio/script.json')); os.makedirs('studio/approved_raw', exist_ok=True)
for k, v in sc.items():
    src = f'assets/narration/{k}.wav'
    if v.get('voice') != 'own' or not os.path.exists(src): continue
    raw = f'studio/approved_raw/{k}.wav'
    if not os.path.exists(raw): shutil.copy(src, raw)
    subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', raw, '-af', 'highpass=f=80,loudnorm=I=-18:TP=-2:LRA=9', '-ar', '48000', '-ac', '1', src], check=True)
    print(k, 'ok')

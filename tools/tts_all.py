#!/usr/bin/env python3
"""studio/script.json'da voice='cartesia' olan sahneleri Cartesia ile seslendirir (SIRAYLA — paralel istek 429 verir),
kırpar ve seviyeler (−18 LUFS) → assets/narration/<seg>.wav. Var olanları atlar; --force hepsini yeniden üretir.
Kullanım: python3 tools/tts_all.py [--force] [seg1 seg2 ...]"""
import json, os, subprocess, sys, time
R = os.path.dirname(os.path.dirname(os.path.abspath(__file__))); os.chdir(R)
force = '--force' in sys.argv; only = [a for a in sys.argv[1:] if not a.startswith('--')]
sc = json.load(open('studio/script.json'))
AF = "silenceremove=start_periods=1:start_threshold=-45dB,areverse,silenceremove=start_periods=1:start_threshold=-45dB,areverse,highpass=f=80,loudnorm=I=-18:TP=-2"
os.makedirs('assets/cartesia', exist_ok=True); os.makedirs('assets/narration', exist_ok=True)
todo = [k for k, v in sc.items() if v.get('voice') == 'cartesia' and (not only or k in only) and (force or not os.path.exists(f'assets/narration/{k}.wav'))]
print(len(todo), 'parça,', sum(len(sc[k]['spoken']) for k in todo), 'karakter')
for k in todo:
    for tr in range(5):
        r = subprocess.run([sys.executable, 'tools/cartesia_tts.py', sc[k]['spoken'], f'assets/cartesia/{k}.wav'], capture_output=True, text=True)
        if r.returncode == 0: break
        if '402' in r.stderr: sys.exit('Cartesia kredisi bitti (402). .env içindeki anahtarı değiştir.')
        time.sleep(5 * (tr + 1))
    else: print(k, 'HATA', r.stderr[-200:]); continue
    subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', f'assets/cartesia/{k}.wav', '-af', AF, '-ar', '48000', '-ac', '1', f'assets/narration/{k}.wav'], check=True)
    print(k, end=' ', flush=True)
print()

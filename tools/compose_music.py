#!/usr/bin/env python3
"""Ders müzik yatağı — sentez, telifsiz, deterministik. Çok sakin pad (Fmaj7 – Am7 – Dm9 – B♭maj7, akor başı ~9.6 sn),
seyrek yumuşak çan notaları, ritim/perküsyon yok. Anlatıma göre ducking burada hesaplanır:
müzik konuşma sırasında anlatım RMS'inin ~DUCK_DB altında, boşluklarda GAP_DB altında.
Kullanım: .venv/bin/python tools/compose_music.py   (assets/narration.wav gerekir) → assets/music.wav"""
import numpy as np, wave, os, sys
R = os.path.dirname(os.path.dirname(os.path.abspath(__file__))); SR = 44100
DUCK_DB = float(os.environ.get('DUCK_DB', 21)); GAP_DB = float(os.environ.get('GAP_DB', 15))
with wave.open(f'{R}/assets/narration.wav') as w: nar = np.frombuffer(w.readframes(w.getnframes()), np.int16).reshape(-1, 2)[:, 0].astype(np.float32) / 32768
N = len(nar); T = N / SR; rng = np.random.default_rng(7); t = np.arange(N) / SR
def hz(m): return 440 * 2 ** ((m - 69) / 12)
CH = [(41, [53, 57, 60, 64]), (45, [52, 55, 60, 64]), (38, [53, 57, 60, 64, 69]), (46, [50, 53, 57, 62])]   # Fmaj7 Am7 Dm9 Bbmaj7
CD = 9.6
L = np.zeros(N, np.float32); Rr = np.zeros(N, np.float32)
def seg_env(n, a, r):
    e = np.ones(n, np.float32); na, nr = min(int(a * SR), n // 2), min(int(r * SR), n // 2); e[:na] = np.sin(np.linspace(0, np.pi / 2, na)) ** 2; e[-nr:] *= np.cos(np.linspace(0, np.pi / 2, nr)) ** 2; return e
k = 0; s0 = 0.0
while s0 < T:
    bass, notes = CH[k % 4]; dur = CD + 3.0; i0 = int(s0 * SR); n = min(int(dur * SR), N - i0)
    if n <= 0: break
    tt = np.arange(n) / SR; e = seg_env(n, 2.8, 3.0)
    for j, m in enumerate(notes):
        f = hz(m); det = 1 + .0018 * (j - 2)
        v = (np.sin(2 * np.pi * f * tt) + .22 * np.sin(2 * np.pi * 2 * f * tt + .3) + .05 * np.sin(2 * np.pi * 3 * f * tt)) * .07
        tr = 1 + .12 * np.sin(2 * np.pi * (.07 + .013 * j) * tt + j)        # yavaş nefes
        L[i0:i0 + n] += (v * tr * e)[:n] * (1.1 - .1 * j / 4); Rr[i0:i0 + n] += (np.sin(2 * np.pi * f * det * tt) * .07 * tr * e * (1 + .22 * np.cos(2 * np.pi * f * tt)))[:n] * (.9 + .1 * j / 4)
    b = np.sin(2 * np.pi * hz(bass) * tt) * .09 * e; L[i0:i0 + n] += b; Rr[i0:i0 + n] += b
    if k % 2 == 1:                                                          # seyrek çan: yüksek, uzun sönümlü
        m = notes[rng.integers(len(notes))] + 12; st = s0 + rng.uniform(1.5, 5); i = int(st * SR); nn = min(int(5 * SR), N - i)
        if nn > 0:
            q = np.arange(nn) / SR; bell = (np.sin(2 * np.pi * hz(m) * q) + .3 * np.sin(2 * np.pi * hz(m) * 2.76 * q)) * np.exp(-q * 1.1) * .045
            pan = rng.uniform(.3, .7); L[i:i + nn] += bell * (1 - pan); Rr[i:i + nn] += bell * pan
    s0 += CD; k += 1
mus = np.stack([L, Rr], 1)
fade = np.ones(N, np.float32); fi, fo = int(3 * SR), int(4 * SR); fade[:fi] = np.linspace(0, 1, fi); fade[-fo:] = np.linspace(1, 0, fo); mus *= fade[:, None]
# ducking: anlatım zarfı (yavaş atak/bırakma)
win = 2048; env = np.sqrt(np.convolve(nar ** 2, np.ones(win) / win, 'same')); talk = (env > .012).astype(np.float32)
a = np.exp(-1 / (SR * .25)); r = np.exp(-1 / (SR * .9)); g = np.zeros(N, np.float32); y = 0.0
for i in range(0, N, 64):                                                    # 64 örnek adımlı zarf takibi
    x = talk[i]; c = a if x > y else r; y = c * y + (1 - c) * x; g[i:i + 64] = y
fr = nar[:N // 1024 * 1024].reshape(-1, 1024); rr = np.sqrt((fr ** 2).mean(1)); sp = float(np.sqrt((rr[rr > .012] ** 2).mean()))
mr = float(np.sqrt((mus[:, 0] ** 2).mean()))
lvl_talk = sp * 10 ** (-DUCK_DB / 20) / mr; lvl_gap = sp * 10 ** (-GAP_DB / 20) / mr
mus *= (lvl_gap + (lvl_talk - lvl_gap) * g)[:, None]
st = (np.clip(mus, -1, 1) * 32767).astype(np.int16)
with wave.open(f'{R}/assets/music.wav', 'wb') as w: w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes(st.tobytes())
print(f'assets/music.wav {T:.1f}s  talk -{DUCK_DB} dB / gap -{GAP_DB} dB rel. speech RMS')

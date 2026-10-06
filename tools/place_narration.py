#!/usr/bin/env python3
"""Anlatım parçalarını timeline.json'daki audioStart'lara yerleştirir → assets/narration.wav (44.1 kHz stereo).
Parçalar arası seviye eşitlenir (konuşma RMS'i medyana). Kullanım: .venv/bin/python tools/place_narration.py"""
import json, os, subprocess, numpy as np, wave
R = os.path.dirname(os.path.dirname(os.path.abspath(__file__))); SR = 44100
tl = json.load(open(f'{R}/output/timeline.json')); N = int(SR * tl['total']) + SR
def load(p):
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', p, '-f', 's16le', '-ac', '1', '-ar', str(SR), '-'], capture_output=True).stdout
    return np.frombuffer(raw, np.int16).astype(np.float32) / 32768
def speech_rms(x):
    f = x[:len(x) // 1024 * 1024].reshape(-1, 1024); r = np.sqrt((f ** 2).mean(1)); r = r[r > .01]
    return float(np.sqrt((r ** 2).mean()))
clips = {s['id']: load(next(f for f in (f"{R}/assets/narration/{s['id']}.wav", f"{R}/assets/narration/{s['id']}.mp3") if os.path.exists(f))) for s in tl['segments']}
lv = {k: speech_rms(v) for k, v in clips.items()}; ref = float(np.median(list(lv.values())))
out = np.zeros(N, np.float32)
for s in tl['segments']:
    x = clips[s['id']] * (ref / lv[s['id']]); i = int(s['audioStart'] * SR); out[i:i + len(x)] += x[:N - i]
    print(f"{s['id']} @ {s['audioStart']:7.2f}s  gain {20*np.log10(ref/lv[s['id']]):+.1f} dB")
pk = np.abs(out).max(); out *= min(1, .89 / pk)
st = np.repeat((out * 32767).astype(np.int16)[:, None], 2, 1)
with wave.open(f'{R}/assets/narration.wav', 'wb') as w: w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes(st.tobytes())
print('assets/narration.wav', f'{len(out)/SR:.1f}s')

#!/usr/bin/env python3
"""Cartesia TTS (tek HTTP POST). Kullanım: python3 tools/cartesia_tts.py "metin" cikti.wav [voice_id]
Anahtar: proje kökündeki .env içinde CARTESIA_API_KEY."""
import https_ctx
import json, os, sys, urllib.request
R = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
env = dict(l.strip().split('=', 1) for l in open(os.path.join(R, '.env')) if '=' in l)
key = os.environ.get('CARTESIA_API_KEY') or env['CARTESIA_API_KEY']
text, out = sys.argv[1], sys.argv[2]
voice = sys.argv[3] if len(sys.argv) > 3 else env.get('CARTESIA_VOICE') or sys.exit('CARTESIA_VOICE .env içinde yok (Cartesia panelinden ses id)')
body = {"model_id": "sonic-3.6", "transcript": text, "voice": voice,
        "output_format": {"container": "wav", "encoding": "pcm_s16le", "sample_rate": 44100},
        "locale": "tr", "generation_config": {"speed": 1, "volume": 1}}
req = urllib.request.Request('https://api.cartesia.ai/tts/bytes', data=json.dumps(body).encode(), method='POST',
      headers={'Content-Type': 'application/json', 'X-API-Key': key, 'Cartesia-Version': '2026-08-14', 'User-Agent': 'ahd-video/1.0'})
data = bytearray(urllib.request.urlopen(req, context=https_ctx.CTX).read())
# Cartesia akış WAV'ı: RIFF/data boyut alanları 0xFFFFFFFF (bilinmiyor) gelebilir → gerçek boyutlarla düzelt
if data[:4] == b'RIFF' and data[8:12] == b'WAVE':
    i = 12
    while i + 8 <= len(data):
        cid, size = bytes(data[i:i + 4]), int.from_bytes(data[i + 4:i + 8], 'little')
        if cid == b'data':
            real = len(data) - (i + 8); real -= real % 2
            data[i + 4:i + 8] = real.to_bytes(4, 'little'); del data[i + 8 + real:]
            data[4:8] = (len(data) - 8).to_bytes(4, 'little'); break
        i += 8 + size + (size & 1)
open(out, 'wb').write(data); print(out)

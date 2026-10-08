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
open(out, 'wb').write(urllib.request.urlopen(req, context=https_ctx.CTX).read()); print(out)

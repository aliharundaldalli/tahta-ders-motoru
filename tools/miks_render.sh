#!/bin/bash
# Ses miksi + render. Kullanım: tools/miks_render.sh output/video.mp4   (GAIN_DB ile seviye; hedef ≈ −15 LUFS)
set -e; cd "$(dirname "$0")/.."; OUT="${1:-output/video.mp4}"
node tools/warnings.mjs --lesson=lesson_full | head -3
node tools/export_sfx.mjs | tail -1
.venv/bin/python tools/place_narration.py | tail -1
.venv/bin/python tools/compose_music.py | tail -1; sleep 1
GAIN_DB=${GAIN_DB:-0.5} tools/final_mix.sh >/dev/null
ffmpeg -i output/final_mix.wav -af ebur128=peak=true -f null - 2>&1 | grep -E "^\s+(I|Peak):"
echo "uzun sessizlik: $(ffmpeg -i output/final_mix.wav -af silencedetect=n=-45dB:d=2.5 -f null - 2>&1 | grep -c silence_duration)"
node tools/render_video.mjs "$OUT" output/final_mix.wav | tail -1

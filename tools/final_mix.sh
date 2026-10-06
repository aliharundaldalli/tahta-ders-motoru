#!/bin/sh
# assets/narration.wav (tools/place_narration.py) + output/sfx.wav (tools/export_sfx.mjs) + assets/music.wav (tools/compose_music.py, already ducked)
# -> output/final_mix.wav.  Narration is the 0 dB reference. SFX_DB / MUSIC_DB = extra offsets (default 0).
cd "$(dirname "$0")/.."
T=$(python3 -c "import json;print(json.load(open('output/timeline.json'))['total'])")
if [ -f assets/music.wav ] && [ "${NO_MUSIC:-0}" = 0 ]; then
ffmpeg -y -loglevel error -i assets/narration.wav -i output/sfx.wav -i assets/music.wav -filter_complex "[1:a]volume=${SFX_DB:-0}dB[s];[2:a]volume=${MUSIC_DB:-0}dB[m];[0:a][s][m]amix=inputs=3:normalize=0:duration=longest,volume=${GAIN_DB:-3}dB,alimiter=limit=.89:level=false[o]" -map "[o]" -t $T output/final_mix.wav
else
ffmpeg -y -loglevel error -i assets/narration.wav -i output/sfx.wav -filter_complex "[1:a]volume=${SFX_DB:-0}dB[s];[0:a][s]amix=inputs=2:normalize=0:duration=longest,alimiter=limit=.95[o]" -map "[o]" -t $T output/final_mix.wav
fi
echo output/final_mix.wav

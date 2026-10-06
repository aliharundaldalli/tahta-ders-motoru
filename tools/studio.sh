#!/bin/bash
# Kayıt stüdyosunu başlatır ve tarayıcıda açar. Durdurmak için Ctrl+C.
cd "$(dirname "$0")/.."
PY="${PY:-$HOME/.venvs/ders-whisper/bin/python}"
if ! curl -s -o /dev/null http://127.0.0.1:8770/api/state; then
  $PY tools/studio_server.py &
  SRV=$!; trap "kill $SRV 2>/dev/null" EXIT
  for i in $(seq 1 30); do curl -s -o /dev/null http://127.0.0.1:8770/api/state && break; sleep .3; done
  open "http://localhost:8770/studio/"; wait $SRV
else open "http://localhost:8770/studio/"; fi

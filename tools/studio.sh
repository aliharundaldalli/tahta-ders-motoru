#!/bin/bash
# Kayıt stüdyosunu başlatır ve tarayıcıda açar. Durdurmak için Ctrl+C (ya da: pkill -f tools/studio_server.py).
cd "$(dirname "$0")/.."; . tools/_ortam.sh
if ! curl -s -o /dev/null http://127.0.0.1:8770/api/state; then
  "$PY" tools/studio_server.py &
  SRV=$!; trap "kill $SRV 2>/dev/null" EXIT
  for i in $(seq 1 60); do curl -s -o /dev/null http://127.0.0.1:8770/api/state && break; sleep .5; done
  ac "http://localhost:8770/studio/"; wait $SRV
else ac "http://localhost:8770/studio/"; fi

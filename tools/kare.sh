#!/bin/bash
# Kare animasyon atölyesi: tools/kare.sh start | stop | status | url
#   start  → sunucuyu arka planda başlatır (127.0.0.1:${KARE_PORT:-8771}), hazır olunca tarayıcıda açar (KARE_NO_OPEN=1 ile açmaz)
#   stop   → yalnızca bu betiğin başlattığı sunucuyu durdurur
# Oturum anahtarı her başlatmada yenilenir; .studio-data/kare-session.json (izin 600) içinde tutulur.
cd "$(dirname "$0")/.."; . tools/_ortam.sh
PORT="${KARE_PORT:-8771}"; DATA=".studio-data"; SESSION="$DATA/kare-session.json"; LOG="$DATA/kare-server.log"
umask 077; mkdir -p "$DATA"
field() { [ -f "$SESSION" ] && "$PY" -c "import json,sys;print(json.load(open(sys.argv[1])).get(sys.argv[2],''))" "$SESSION" "$1" 2>/dev/null; }
alive() { local pid; pid="$(field pid)"; [ -n "$pid" ] && kill -0 "$pid" 2>/dev/null && ps -p "$pid" -o command= 2>/dev/null | grep -q kare_server.py; }
healthy() { curl -s -m 2 "http://127.0.0.1:$PORT/api/health" 2>/dev/null | grep -q '"app": "kare"'; }
url() { echo "http://localhost:$(field port)/kare/?t=$(field token)"; }
case "${1:-start}" in
  start)
    if alive && healthy; then echo "Kare zaten çalışıyor: $(url)"; [ -z "$KARE_NO_OPEN" ] && ac "$(url)"; exit 0; fi
    if curl -s -m 2 -o /dev/null "http://127.0.0.1:$PORT/"; then echo "Port $PORT başka bir süreç tarafından kullanılıyor (KARE_PORT ile başka port seç)." >&2; exit 1; fi
    TOKEN="$("$PY" -c 'import secrets;print(secrets.token_urlsafe(32))')"
    KARE_PORT="$PORT" KARE_TOKEN="$TOKEN" nohup "$PY" tools/kare_server.py >"$LOG" 2>&1 &
    PID=$!
    printf '{"pid": %s, "port": %s, "token": "%s"}\n' "$PID" "$PORT" "$TOKEN" > "$SESSION"; chmod 600 "$SESSION" "$LOG" 2>/dev/null
    for i in $(seq 1 60); do healthy && break; kill -0 "$PID" 2>/dev/null || break; sleep .5; done
    if ! healthy; then echo "Kare başlatılamadı. Günlük: $LOG" >&2; tail -20 "$LOG" >&2; kill "$PID" 2>/dev/null; rm -f "$SESSION"; exit 1; fi
    echo "Kare hazır (PID $PID): $(url)"
    [ -z "$KARE_NO_OPEN" ] && ac "$(url)"; exit 0;;
  stop)
    if alive; then kill "$(field pid)" && echo "Kare durduruldu (PID $(field pid))."; else echo "Çalışan Kare sunucusu yok."; fi
    rm -f "$SESSION"; exit 0;;
  status) if alive && healthy; then echo "Çalışıyor (PID $(field pid)): $(url)"; else echo "Çalışmıyor."; exit 1; fi;;
  url) alive && url || { echo "Çalışmıyor." >&2; exit 1; };;
  *) echo "Kullanım: tools/kare.sh start|stop|status|url" >&2; exit 2;;
esac

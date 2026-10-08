#!/bin/bash
# Yeni ders klasörü oluşturur (motor + araçlar + stüdyo; ders içeriği boş).
# Kullanım: tools/yeni_ders.sh ../ders-konu-adi
set -e
SRC="$(cd "$(dirname "$0")/.." && pwd)"; DST="$1"
[ -z "$DST" ] && { echo "Kullanım: tools/yeni_ders.sh ../ders-konu-adi"; exit 1; }
[ -e "$DST" ] && { echo "$DST zaten var"; exit 1; }
mkdir -p "$DST"
rsync -a --exclude .git --exclude output --exclude 'assets/narration*' --exclude 'assets/cartesia*' --exclude 'assets/music.wav' \
  --exclude 'assets/thumb_*' --exclude timing --exclude 'docs/*' --exclude 'studio/takes' --exclude 'studio/approved_raw' \
  --exclude 'studio/status.json' --exclude 'studio/DONE.json' --exclude '__pycache__' --exclude math_cache.js \
  --exclude node_modules --exclude .venv --exclude .env "$SRC/" "$DST/"
mkdir -p "$DST"/{output,assets/narration,assets/cartesia,timing,docs}
cp "$SRC/docs/ENGINE.md" "$SRC/docs/NARRATION.md" "$DST/docs/" 2>/dev/null || true
# Bağımlılıklar (node_modules, .venv) kopyalanmaz, bağlanır: macOS/Linux'ta symlink, Windows'ta klasör bağlantısı (junction)
bagla() { local hedef="$1" ad="$2"; [ -e "$hedef" ] || return 0
  case "$(uname -s)" in MINGW*|MSYS*|CYGWIN*) cmd //c mklink /J "$(cygpath -w "$DST/$ad")" "$(cygpath -w "$hedef")" >/dev/null;;
    *) ln -s "$hedef" "$DST/$ad";; esac; }
real() { (cd "$1" 2>/dev/null && pwd -P); }
bagla "$(real "$SRC/node_modules")" node_modules; bagla "$(real "$SRC/.venv")" .venv
[ -f "$SRC/.env" ] && cp "$SRC/.env" "$DST/.env" && chmod 600 "$DST/.env"
echo '{}' > "$DST/studio/script.json"; echo '{}' > "$DST/narration_segments.json"
(cd "$DST" && git init -q && git add -A && git commit -qm "yeni ders: iskelet")
echo "Hazır: $DST  (sonraki adım: docs/script.py yaz → python3 docs/script.py)"

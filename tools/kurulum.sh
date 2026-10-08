#!/bin/bash
# Tek seferlik kurulum (macOS, Apple Silicon). Kullanım: tools/kurulum.sh
# Kurar/kontrol eder: Homebrew paketleri (node, ffmpeg, python@3.12), Google Chrome, npm bağımlılıkları,
# Whisper ortamı (.venv: mlx-whisper), Whisper modeli, .env dosyası. Sonunda örnek dersi derleyip test eder.
set -e
cd "$(dirname "$0")/.."; ok(){ printf "  ✓ %s\n" "$1"; }; warn(){ printf "  ! %s\n" "$1"; }
echo "== Sistem"
[ "$(uname -s)" = Darwin ] || { echo "Bu sistem yalnızca macOS'ta çalışır."; exit 1; }
[ "$(uname -m)" = arm64 ] || { echo "Apple Silicon (M1/M2/M3/M4) Mac gerekli (Whisper için mlx)."; exit 1; }
case "$PWD" in *"/Desktop/"*|*"/Documents/"*) warn "Klasör Masaüstü/Belgeler altında. iCloud eşitlemesi açıksa büyük dosyaları buluta taşıyıp işleri yavaşlatabilir; ~/tahta-ders-motoru önerilir.";; esac
command -v brew >/dev/null || { echo "Homebrew yok. Kur: /bin/bash -c \"\$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)\""; exit 1; }
ok "macOS arm64, Homebrew"
echo "== Paketler"
for p in node ffmpeg; do brew list --versions $p >/dev/null 2>&1 && ok "$p" || { echo "  → brew install $p"; brew install $p; }; done
PY=""; for c in python3.12 python3.11 python3.13; do command -v $c >/dev/null && { PY=$(command -v $c); break; }; done
[ -z "$PY" ] && { echo "  → brew install python@3.12"; brew install python@3.12; PY="$(brew --prefix python@3.12)/bin/python3.12"; }
ok "Python: $PY"
[ -d "/Applications/Google Chrome.app" ] && ok "Google Chrome" || { echo "  → brew install --cask google-chrome"; brew install --cask google-chrome; }
echo "== Node bağımlılıkları"
[ -d node_modules ] && ok "node_modules var" || npm install --silent
echo "== Whisper ortamı (.venv)"
[ -x .venv/bin/python ] || "$PY" -m venv .venv
.venv/bin/pip install -q --upgrade pip && .venv/bin/pip install -q mlx-whisper numpy && ok "mlx-whisper"
echo "== Whisper modeli (ilk seferde ~1,6 GB indirilir)"
.venv/bin/python - <<'PY'
import mlx_whisper, numpy as np, tempfile, wave, os
p = tempfile.mktemp(suffix='.wav'); w = wave.open(p, 'wb'); w.setnchannels(1); w.setsampwidth(2); w.setframerate(16000); w.writeframes(np.zeros(16000, np.int16).tobytes()); w.close()
mlx_whisper.transcribe(p, path_or_hf_repo='mlx-community/whisper-large-v3-turbo', language='tr'); os.remove(p); print('  ✓ model hazır')
PY
echo "== .env"
if [ -f .env ]; then ok ".env var"; else cp .env.example .env && chmod 600 .env && warn ".env oluşturuldu: CARTESIA_API_KEY ve CARTESIA_VOICE'u doldur (Claude'a söyleyebilirsin)."; fi
echo "== Test: örnek ders"
node tools/build_math.mjs | tail -1 && node tools/warnings.mjs --lesson=lesson_full | head -1
node tools/shots.mjs 5 --out=output/kurulum_test >/dev/null && ok "tarayıcı ile kare alındı: output/kurulum_test/"
echo "Kurulum tamam."

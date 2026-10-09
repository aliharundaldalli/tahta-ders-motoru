#!/bin/bash
# Tek seferlik kurulum. macOS (Apple Silicon → mlx-whisper; Intel → faster-whisper) ve Windows (Claude Code'un Git Bash'i, winget → faster-whisper).
# Kurar/kontrol eder: node, ffmpeg, Python 3.10–3.13, Google Chrome, npm bağımlılıkları, Whisper ortamı (.venv) + model, .env. Sonunda örnek dersle test eder.
# Kullanım: tools/kurulum.sh
set -e
cd "$(dirname "$0")/.."; ok(){ printf "  ✓ %s\n" "$1"; }; warn(){ printf "  ! %s\n" "$1"; }
case "$(uname -s)" in MINGW*|MSYS*|CYGWIN*) OS=win;; Darwin) OS=mac;; *) OS=linux;; esac
echo "== Sistem: $OS $(uname -m)"
case "$PWD" in *"/Desktop/"*|*"/Documents/"*|*"/OneDrive/"*) warn "Klasör Masaüstü/Belgeler/OneDrive altında; bulut eşitlemesi büyük dosyaları taşıyıp yavaşlatabilir. Ev klasörü (~/tahta-ders-motoru) önerilir.";; esac
need_restart=0
if [ $OS = mac ]; then
  command -v brew >/dev/null || { echo "Homebrew yok. Terminal'de kur: /bin/bash -c \"\$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)\""; exit 1; }
  for p in node ffmpeg; do brew list --versions $p >/dev/null 2>&1 && ok "$p" || { echo "  → brew install $p"; brew install $p; }; done
  [ -d "/Applications/Google Chrome.app" ] && ok "Google Chrome" || { echo "  → brew install --cask google-chrome"; brew install --cask google-chrome; }
  BASEPY=""; for c in python3.12 python3.11 python3.13 python3.10; do command -v $c >/dev/null && { BASEPY=$(command -v $c); break; }; done
  [ -z "$BASEPY" ] && { echo "  → brew install python@3.12"; brew install python@3.12; BASEPY="$(brew --prefix python@3.12)/bin/python3.12"; }
elif [ $OS = win ]; then
  command -v winget >/dev/null || { echo "winget yok (Microsoft Store'dan 'App Installer' kurun)."; exit 1; }
  wg(){ echo "  → winget install $1"; winget install -e --id "$1" --accept-package-agreements --accept-source-agreements --silent || true; need_restart=1; }
  command -v node >/dev/null && ok "node" || wg OpenJS.NodeJS.LTS
  command -v ffmpeg >/dev/null && ok "ffmpeg" || wg Gyan.FFmpeg
  ls "$PROGRAMFILES/Google/Chrome/Application/chrome.exe" "$LOCALAPPDATA/Google/Chrome/Application/chrome.exe" >/dev/null 2>&1 && ok "Google Chrome" || wg Google.Chrome
  BASEPY=""; for v in 3.12 3.11 3.13 3.10; do py -$v -c "" >/dev/null 2>&1 && { BASEPY="py -$v"; break; }; done
  [ -z "$BASEPY" ] && { wg Python.Python.3.12; }
  if [ $need_restart = 1 ]; then echo; echo "Yeni programlar kuruldu. Claude Code'u KAPATIP AÇIN ve /kurulum komutunu tekrar çalıştırın (PATH yenilensin)."; exit 0; fi
else
  for p in node ffmpeg python3; do command -v $p >/dev/null && ok "$p" || { echo "$p eksik (ör. sudo apt install nodejs npm ffmpeg python3-venv)"; exit 1; }; done
  BASEPY=python3
fi
ok "Python: $BASEPY"
echo "== Node bağımlılıkları"
[ -d node_modules ] && ok "node_modules var" || npm install --silent
echo "== Whisper ortamı (.venv)"
[ -x .venv/bin/python ] || [ -x .venv/Scripts/python.exe ] || $BASEPY -m venv .venv
. tools/_ortam.sh
"$PY" -m pip install -q --upgrade pip
if [ $OS = mac ] && [ "$(uname -m)" = arm64 ]; then "$PY" -m pip install -q mlx-whisper numpy && ok "mlx-whisper (Apple Silicon)"
else "$PY" -m pip install -q faster-whisper numpy && ok "faster-whisper"; fi
# Kare animasyon atölyesi (isteğe bağlı): PDF/DOCX doküman okuma ve matematik masası
"$PY" -m pip install -q pypdf python-docx sympy certifi && ok "Kare için pypdf, python-docx, sympy" || warn "Kare paketleri kurulamadı (yalnızca Kare'de doküman/matematik araçları etkilenir)"
echo "== Whisper modeli (ilk seferde ~1,5 GB indirilir)"
HF_HUB_OFFLINE=0 "$PY" - <<'PY'
import sys, os, tempfile, wave, numpy as np
sys.path.insert(0, 'tools'); import whisper_backend as wb
p = os.path.join(tempfile.gettempdir(), 'whisper_warm.wav'); w = wave.open(p, 'wb'); w.setnchannels(1); w.setsampwidth(2); w.setframerate(16000); w.writeframes(np.zeros(16000, np.int16).tobytes()); w.close()
wb.transcribe(p, language='tr'); os.remove(p); print('  ✓ model hazır (' + wb.backend() + ')')
PY
echo "== .env"
if [ -f .env ]; then ok ".env var"; else cp .env.example .env; chmod 600 .env 2>/dev/null || true; warn ".env oluşturuldu: CARTESIA_API_KEY ve CARTESIA_VOICE'u doldur (Claude'a söyleyebilirsin)."; fi
echo "== Test: örnek ders"
node tools/build_math.mjs | tail -1 && node tools/warnings.mjs --lesson=lesson_full | head -1
node tools/shots.mjs 5 --out=output/kurulum_test >/dev/null && ok "tarayıcı ile kare alındı: output/kurulum_test/"
echo "Kurulum tamam."

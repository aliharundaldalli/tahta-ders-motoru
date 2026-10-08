# Ortak ortam ayarları (diğer .sh betikleri "source" eder): proje Python'u ve tarayıcı açma, macOS + Windows (Git Bash) + Linux.
case "$(uname -s)" in MINGW*|MSYS*|CYGWIN*) OS=win;; Darwin) OS=mac;; *) OS=linux;; esac
if [ -x .venv/Scripts/python.exe ]; then PY="${PY:-.venv/Scripts/python.exe}"; elif [ -x .venv/bin/python ]; then PY="${PY:-.venv/bin/python}"; else PY="${PY:-python3}"; fi
export HF_HUB_OFFLINE="${HF_HUB_OFFLINE:-1}" PYTHONUTF8=1
ac() { case "$OS" in mac) open "$1";; win) cmd //c start "" "$1";; *) xdg-open "$1" >/dev/null 2>&1 & ;; esac; }

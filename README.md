Profesyonel çalışma masası: [12 araç, kullanım ve sınırlar](docs/PRO_STUDIO.md). Stil/nesne/katman/konuşma/matematik/AI düzeltme/sürüm/MP4 araçları üst menüde **Stüdyo araçları** içinde.

# Tahta Ders Motoru

## Kare · Canvas 2D animasyon atölyesi

`http://localhost:8770/studio/` beş çalışma alanıyla açılır: Çizim & boya, Hareket & tasarım, Doğa & atmosfer, Hikâye & veri, Matematik & eğitim. 20 Canvas 2D stil örneği “Stil seç” içinde bulunur. Editörde sahne sıralama, süre/renk ayarları, açılır ince ayarlar/beceri/kod ve JSON/PNG/HTML/WebM dışa aktarma vardır. Matematik & eğitim alanı `/studio/recording.html` ders atölyesini açar; orijinal koyu tahta teması ve görünür kayıt/dinleme/onay araçları korunur. Canvas editöründen matematik ve seslendirmeye kalıcı bağlantılar vardır. Mevcut projeler korunur.

**AI üretim akışı:** Dokümandan üret ile PDF/DOCX/TXT/MD → düzenlenebilir anlatım planı → GLM-5.3 Canvas sahneleri → Türkçe ses → sesli MP4. 360 sahne ve 180 dakika proje desteği, ilerleme/kayıt/devam etme ve diske kayıt eklendi. Ayrıntılar: [AI üretim rehberi](docs/AI_PRODUCTION.md). Özgün matematik teması korunur.


Kare teması: mürdüm, mercan, leylak ve sarı; yerel Manrope fontu ve Canvas ile çizilmiş kategori kapakları. Önce üretilen iki imagegen referansı `studio/design-references/` içinde, tasarım kararları [docs/KARE_DESIGN.md](docs/KARE_DESIGN.md) içindedir.

Windows: Node.js, Python, FFmpeg ve Chrome kurulu olmalı. `python -m pip install numpy faster-whisper pypdf python-docx sympy` sonrası `powershell -File start-studio.ps1`. Whisper ilk kullanımda modeli indirebilir; Canvas editörü hazır örnekler için AI bağlantısı gerektirmez.

İsteğe bağlı AI sahne üretimi: `.env.example` dosyasını `.env` olarak kopyala, `GLM_API_KEY` ekle. Varsayılan sağlayıcı GLM, model `glm-5.3`; alternatif OpenAI adaptörü ayrıca seçilebilir. AI seçilen kategori becerisini kullanır ve doğrulanan Canvas çizim verisi döndürür; kullanıcı taslağı inceleyip uygular. Serbest JavaScript çalıştırılmaz. Henüz anahtar bağlanmadığında UI bunu açıkça gösterir.

Kategori becerileri `.agents/skills/canvas-*/SKILL.md` içinde, araştırma [docs/CANVAS_RESEARCH.md](docs/CANVAS_RESEARCH.md), motor sözleşmesi [docs/CANVAS_ENGINE.md](docs/CANVAS_ENGINE.md) içindedir.

Kontrol: `npm run test:canvas`, `node tools/test_kare_ui.mjs`, `node tools/verify_canvas_exports.mjs`, `python -X utf8 tools/test_animation_api.py`, `python -X utf8 tools/test_production_api.py`, `node tools/test_production_ui.mjs`. MP4: `node tools/render_canvas.mjs project.json output.mp4` (sunucu açık olmalı).

AHD Akademi'nin "tahtada ders anlatımı" videolarını üreten sistem. Bir hoca tahtada yazıyormuş gibi:
matematik satırları anlatımın tam o kelimesinde el yazısıyla çıkar, grafikler ve 3D yüzeyler anlatımla birlikte çizilir.

- 1920×1080, 30 fps. Her kare yalnızca zamanın fonksiyonu (`window.__render(t)`): tarayıcı önizlemesi ile render birebir aynı.
- Matematik MathJax ile önceden SVG'ye çevrilir, el yazısı animasyonuyla yazılır.
- Ses: **kendi sesinle kayıt stüdyosu** (yerel Whisper kontrolü) ve/veya TTS (Cartesia, ElevenLabs).
- Senkron: gerçek sesten kelime zamanları (mlx-whisper) → her satır anlatımdaki "cue" kelimesinde başlar.

Örnek ders olarak repo, "Ardışık İntegraller ve Fubini" dersinin sahnelerini ve metnini içerir (ses dosyaları hariç).

## Kurulum (macOS, Apple Silicon)
```bash
# 1) Node bağımlılıkları (mathjax-full, puppeteer-core, kalam fontu)
npm install
# 2) Whisper ortamı (kelime zamanları + stüdyo kontrolü). Masaüstü iCloud'daysa venv'i Masaüstü DIŞINDA kur!
python3.12 -m venv ~/.venvs/ders-whisper && ~/.venvs/ders-whisper/bin/pip install mlx-whisper numpy
ln -s ~/.venvs/ders-whisper .venv
# 3) ffmpeg ve Google Chrome gerekli
brew install ffmpeg
# 4) TTS kullanacaksan
cp .env.example .env   # içine kendi anahtarını yaz, .env asla git'e girmez
```

## Hızlı deneme
```bash
node tools/build_math.mjs                       # formül önbelleği
open index.html                                 # önizleme: Boşluk oynat, D debug (cue zamanları), C altyazı
node tools/warnings.mjs --lesson=lesson_full    # senkron kontrolü → WARNINGS (0) olmalı
```

## Belgeler
- **[CLAUDE.md](CLAUDE.md)** — baştan sona üretim hattı ve kurallar (Claude Code ile çalışmak için yazıldı; insan için de okunur).
- **[docs/ENGINE.md](docs/ENGINE.md)** — sahne öğeleri (text, math, theorem, graph2d, graph3d…), cue/zamanlama, SFX, render ayrıntıları.

Kalam fontu SIL Open Font License altındadır. Bu repo özeldir; izin almadan paylaşmayın.

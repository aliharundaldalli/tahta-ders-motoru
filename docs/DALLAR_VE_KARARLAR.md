# Dallar ve kararlar

## `codex/kare-animation-studio` (Eray, 2026-10-07) — main'e alınmadı, dalda duruyor
Ayrı bir ürün: "Kare" Canvas 2D animasyon atölyesi (20 stil), krem/mürdüm arayüz (Manrope), dokümandan GLM-5.3 ile sahne
üretimi + sesli MP4 hattı (`tools/production_api.py`, `animation_api.py`, `pro_api.py`), Windows betikleri, testler.
Ders motoruna (`src/`) dokunmuyor.

**Neden main'e alınmadı:** `/studio/` giriş sayfası Kare'ye dönüşüyor, kayıt stüdyosu `/studio/recording.html`'e taşınıp
yeniden temalanıyor (kenar çubuğunda sabit "Çift integraller · Fubini" yazısı var), `studio_server.py`'ye ~60 satır AI/üretim
API'si ekleniyor. Bunlar mevcut ders üretim akışını (CLAUDE.md, `tools/studio.sh`) değiştiriyor ve Mac'te denenmedi.

**Main'e alınanlar (aynı daldan, küçük düzeltmeler):**
1. `studio/studio.js` — MathJax geç yüklenince formüllerin görünmemesi (yükleyiciyi bekle).
2. `studio/studio.js` — açık bir `dialog` varken klavye kısayolları (R/Enter/N) çalışmasın.
3. `studio/studio.js` — "Sahneyi izle": önizleme yüklenmediyse çökme yerine uyarı.
4. `tools/studio_server.py` — noktayla başlayan yollar (`.env`, `.git/…`, `%2E…`) 404 döner; `.gitignore`'a `.env.*`, sunucu logları.

**Sonra:** Kare ayrı bir klasörde/repo'da ya da `/studio/kare/` gibi ayrı bir yolda, kayıt stüdyosunu değiştirmeden
geliştirilebilir. Main'e alınacaksa önce Mac'te kayıt + hizalama + render akışı uçtan uca denenmeli.

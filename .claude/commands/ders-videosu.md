---
description: Tahtada ders anlatımı videosu üret (metin → ses → sahneler → miks → render → thumbnail)
argument-hint: <konu ve kaynak, ör. "Green teoremi, notlar.pdf s.169-176">
---
Bir "tahtada ders anlatımı" videosu üreteceksin. Konu/kaynak: $ARGUMENTS

Önce CLAUDE.md ve docs/ENGINE.md'yi oku; kurallar orada (önce metin, sonra ses; örnekleri kaynaktan kopyalama;
her sonucu python ile sayısal doğrula; kalem efekti yok; alt 130 px boş; cue = söylenen kelime).

Adımlar (her adımın sonunda kısa durum ver):
1. **Kaynağı oku.** PDF taranmışsa sayfaları görsel oku. Konuyu 4–7 dakikalık videolara böl; bu videonun planını çıkar.
2. **Proje aç:** `tools/yeni_ders.sh ../ders-<kisa-ad>` ve oradan çalış.
3. **Metni yaz:** `docs/script.py` (biçim: `docs/script_ornek.py`) → `python3 docs/script.py`. 10–16 sahne, sahne başına 10–25 sn.
   `display` = ekrandaki metin ($TeX$), `spoken` = TTS için fonetik (x→"iks", y→"ye", sayılar yazıyla). Örnek sayılarını değiştir,
   sonuçları python ile doğrula. Ses kaynağı: `voice: 'cartesia'` (TTS) veya `'own'` (öğretmenin stüdyo kaydı).
   **Metni kullanıcıya göster ve onay al.** Onaysız TTS kredisi harcama.
4. **Ses:** `.env` içinde CARTESIA_API_KEY ve CARTESIA_VOICE olmalı (yoksa kullanıcıdan iste; anahtarı asla ekrana basma/commitleme).
   - TTS: `python3 tools/tts_all.py` (sırayla üretir, seviyeler). Sonra `.venv/bin/python tools/blind_check.py` ile kör kontrol.
   - Kendi ses: `tools/studio.sh` → kullanıcı kaydeder (o sırada Whisper çalıştırma) → bitince `python3 tools/normalize_takes.py`;
     stüdyo sunucusunu MUTLAKA kapat (`pkill -f tools/studio_server.py`).
5. **Hizala:** `HF_HUB_OFFLINE=1 .venv/bin/python tools/align_words.py && node tools/pack_words.mjs`.
6. **Sahneler:** `lesson_parts/A.js`'i baştan yaz (biçim ve örnekler: docs/ENGINE.md, lesson_parts/DEMO.js). Metin solda, şekil sağda,
   3B için `cols / wedge / solid / slices / orbit`. Önceki sayfada olan şekil yeni sayfada anında gelsin (`at:-1.15, dur:.05`);
   boş eksen bırakma; ızgaralar simetrik; etiketler ≥ 44; ondalıkta virgül; altyazı yok.
   `node tools/build_math.mjs && node tools/warnings.mjs --lesson=lesson_full` → **WARNINGS (0)** olana kadar düzelt.
   Kareleri gözle kontrol et: `node tools/shots.mjs 10 40 80 --out=/tmp/qa` ve PNG'leri oku.
7. **Miks + render:** `tools/miks_render.sh output/<ad>.mp4` (≈ −15 LUFS, uzun sessizlik 0). Videodan kareler alıp son kontrol yap.
8. **Thumbnail + açıklama:** `templates/thumbnail.html`'i kopyala (görsel: videodan bir kare) → `node tools/thumb.mjs <html> output/thumbnail.png`.
   `docs/YOUTUBE.md`: başlık, açıklama, gerçek bölüm zamanları (`output/timeline.json`), etiketler.
9. Sonucu özetle: video yolu, süre, loudness, bilinen küçük kusurlar.

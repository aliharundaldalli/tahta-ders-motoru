# Tahta ders videosu üretim hattı — Claude için çalışma kılavuzu

Bu repo ile uzun (5–15 dk) matematik ders videoları üretilir. Kullanıcı öğretmendir: içeriği ve sesi o onaylar,
üretimi sen yaparsın. Aşağıdaki sıra ve kurallar, birkaç ders boyunca deneme–yanılmayla oturdu; değiştirmeden önce sor.

## Platform
macOS (Apple Silicon: mlx-whisper; Intel: faster-whisper) ve Windows (Claude Code'un Git Bash'i; faster-whisper). Whisper çağrıları
`tools/whisper_backend.py` üzerinden; Chrome yolu `tools/chrome_path.mjs`; Python yolu ve tarayıcı açma `tools/_ortam.sh` (`$PY`, `ac`).
Kurulum: `tools/kurulum.sh` (ya da `/kurulum`).

## Hızlı başlangıç (Claude Code)
- `/ders-videosu <konu ve kaynak>` — tam ders videosu (metin → onay → ses → sahne → render → thumbnail).
- `/soru-videosu <soru/konu>` — kısa soru çözümü.
- `/kare-studio` — isteğe bağlı Kare Canvas animasyon atölyesi (aşağıda).
- Yardımcı araçlar: `tools/yeni_ders.sh` (yeni proje), `tools/tts_all.py` (Cartesia, sırayla), `tools/blind_check.py` (kör Whisper kontrolü),
  `tools/normalize_takes.py` (kendi ses kayıtları), `tools/miks_render.sh` (miks + render). Metin şablonu: `docs/script_ornek.py`.

## Altın kurallar
1. **Önce metin, sonra ses.** Anlatım metnini kullanıcıya göster; onay olmadan TTS kredisi harcama, kayda geçme.
2. **Kaynak not**: konu sırası ve notasyon kaynağa sadık; ama **örnekleri birebir kopyalama** (sayıları/fonksiyonu değiştir).
   Notun ifadesi eksikse (ör. teoremde "sürekli" şartı) düzelt. **Her sonucu python ile yeniden hesapla/doğrula.**
3. **Ses → matematik senkronu:** bir satır, anlatım onu söylediği kelimede yazılmaya başlar. Kontrol:
   `node tools/warnings.mjs --lesson=lesson_full` → `WARNINGS (0)` (cue bulunamadı / 0,4 sn'den geç yok).
4. **Görsel:** koyu tahta `#1d2420`, krem yazı. Renkler fonksiyonel: amber = anahtar nesne, nane = sonuç,
   mercan = uyarı/NOT, gri = ikincil. Yazı asla küçülmez; alt 130 px boş (altyazı bandı). Tahtayı doldur:
   metin solda / şekil sağda (row), grafikler büyük (h ≥ 420). Kamera sakin.
5. **Ses miksi:** kalem/yazma efekti KAPALI (`src/sfx.js` → `gain.write = -Infinity`; kullanıcılar rahatsız oldu).
   Müzik konuşmanın ~20 LU altında. Final ≈ −15 LUFS, tepe ≤ −1 dBFS.
6. Anlatım dili: sakin, akademik ama konuşma dili; "Şimdi şuna bakalım", "Burada dikkat edelim" gibi doğal köprüler, abartısız.

## Proje yapısı
```
lesson_full.js            dersi yükler (lesson_parts/A.js)
lesson_parts/A.js         sahneler: [{ seg:'a03', post?, items:[ {type:'math', tex:'…', cue:'İçteki', off:.3, dur:1.6}, … ] }]
narration_segments.json   seg → SÖYLENEN metin (hizalama bunu kullanır)
studio/script.json        seg → { summary, display, spoken, voice }   (stüdyo + TTS girdisi)
timing/words.json|js      gerçek kelime zamanları (align_words.py üretir, pack_words.mjs paketler)
docs/NARRATION.md         okunabilir metin (## a00 başlıkları; estimate_words.mjs tahmini zaman üretir)
src/                      motor (board, text, graph, sfx, main)
tools/                    aşağıdaki komutlar
```
- `display`: ekranda/öğretmenin okuduğu metin, matematik `$TeX$` olarak normal yazılır.
- `spoken`: TTS'e ve Whisper karşılaştırmasına giden **fonetik** metin: x → "iks", y → "ye", f → "fe", a/b/c/d → "a, be, ce, de",
  sayılar yazıyla. (TTS tek harfi bozuk okuyor; öğretmen kaydında `display` yeter.)
- Segment başına 10–35 sn. Cue'ları formül okunuşuna değil, sağlam çapa kelimelere bağla ("Önce", "Şimdi", "İçteki", "Dışta")
  ve cümle içi öğeler için `off` kullan. Önek eşleşmesine dikkat: kısa cue, önceki uzun bir kelimenin başıyla eşleşebilir.

## Uçtan uca akış
1. **Kaynağı oku** (PDF taranmışsa sayfaları görsel olarak oku), ders planı çıkar; uzun konuyu 5–10 dk'lık videolara böl.
2. **Metni yaz** (`docs/*_script.py` → `studio/script.json`, `narration_segments.json`, `docs/NARRATION.md`); her parçaya ses kaynağı ata:
   - `own` (öğretmenin kendi kaydı; formül okunan yerler için en doğal),
   - `cartesia` / `eleven` (düz anlatım, giriş/kapanış).
   **Kullanıcıya göster, onay al.**
3. **Sahneleri kur** (`lesson_parts/A.js`). Ses yokken `node tools/estimate_words.mjs && node tools/pack_words.mjs` ile tahmini zaman,
   `node tools/build_math.mjs`, önizleme `open index.html`. Kareleri gözle kontrol: `node tools/shots.mjs 12.5 40 --out=output/qa`.
4. **Ses üret / kaydet**
   - TTS: `python3 tools/cartesia_tts.py "<spoken>" assets/cartesia/a03.wav` (.env: `CARTESIA_API_KEY`, `CARTESIA_VOICE`).
     Sonra kırp + seviye: `ffmpeg -i in.wav -af "silenceremove=start_periods=1:start_threshold=-45dB,areverse,silenceremove=start_periods=1:start_threshold=-45dB,areverse,highpass=f=80,loudnorm=I=-18:TP=-2" -ar 48000 -ac 1 assets/narration/a03.wav`
   - Kendi ses: **kayıt stüdyosu** (aşağıda).
   - Her TTS çıktısını Whisper ile **kör** yazıya döküp metinle karşılaştır (tekrar, yutulan kelime, yanlış okuma).
     Whisper sessizlikte "İzlediğiniz için teşekkürler" uydurabilir; kelime zaman damgalarıyla doğrula.
5. **Hizala**: `.venv/bin/python tools/align_words.py [a03 a04 …]` → `node tools/pack_words.mjs` → `node tools/warnings.mjs --lesson=lesson_full`.
   Kullanıcı kayıtta metni değiştirdiyse cue'ları yeni kelimelere taşı (formüller ekranda kalabilir).
6. **Miks + render**
   ```bash
   node tools/export_sfx.mjs                     # output/sfx.wav + output/timeline.json
   .venv/bin/python tools/place_narration.py     # assets/narration.wav (parçalar zaman çizelgesine)
   .venv/bin/python tools/compose_music.py       # sakin pad, konuşmaya göre ducking
   GAIN_DB=0 tools/final_mix.sh                  # → output/final_mix.wav (~ −15 LUFS hedefle; GAIN_DB ile ayarla)
   node tools/render_video.mjs output/ders.mp4 output/final_mix.wav     # ~13 fps; 6 dk video ≈ 25 dk
   ```
   Sonra: süre, `silencedetect` (2,5 sn'den uzun sessizlik yok), loudness ve birkaç kare kontrolü.
   Tek sahne değiştiyse tüm videoyu yeniden render etme: `--from/--to` ile parça render edip ffmpeg ile birleştir.
7. **Thumbnail** `templates/thumbnail.html` (videodan bir kareyi `thumb_gorsel.png` olarak yanına koy) →
   `node tools/thumb.mjs templates/thumbnail.html output/thumbnail.png`. Başlık/açıklama + gerçek bölüm zamanları `output/timeline.json`'dan.

## Kayıt stüdyosu (öğretmenin kendi sesi)
```bash
tools/studio.sh        # http://localhost:8770/studio/  (mikrofon izni localhost ister; file:// çalışmaz)
```
- Solda sahne listesi ve ses kaynağı; ortada Özet/Metin (aç-kapa) ve **✎ Düzenle** (metni kayıttan önce değiştirme);
  sağda sahne önizlemesi ("Sahneyi izle", kayıttan sonra "Kaydınla izle").
- Kısayollar: R kayıt/durdur, Boşluk dinle, Enter onayla, N sıradaki.
- Her kayıt birkaç saniyede Whisper'la kontrol edilir: ✅ / ⚠️ (eksik ≥3 kelime, kısık/patlayan ses).
  Fazla kelime = "doğaçlama", hata sayılmaz; "Doğaçlama var — kesme" işaretliyse onayda gerçek söylenen metin sahne metni olur.
- Bitince "Bitti" → `studio/DONE.json` (onaylı, atlanan, `unmatched_cues`, `math_edited`). Sadece bu dosyadaki sorunlu sahneleri konuş.
- **Öğretmen kayıt yaparken başka Whisper işi çalıştırma** (aynı GPU'yu paylaşır, stüdyo yanıt veremez → BrokenPipe).
- Ham kayıtlar ~−25 LUFS gelir: önce yedekle, sonra `highpass=f=80,loudnorm=I=-18:TP=-2:LRA=9`.

## Kare animasyon atölyesi (isteğe bağlı, ayrı ürün)
Eray'ın Canvas 2D atölyesi (20 çizim stili, dokümandan AI ile sahne planı, sesli MP4). Ders hattından **ayrı**:
```bash
tools/kare.sh start    # 127.0.0.1:8771, tarayıcıda http://localhost:8771/kare/?t=<oturum anahtarı> açılır
tools/kare.sh stop     # işin bitince mutlaka durdur (yalnızca kendi başlattığı PID'i kapatır)
```
- Kod: arayüz `kare/` (motor `kare/engine/`, beceriler `kare/skills/`), sunucu `tools/kare_server.py` + `animation_api.py`,
  `production_api.py`, `pro_api.py`, `kare_env.py` (ayarlar), `kare_guard.py` (yükleme/ZIP korumaları). Veri: `.studio-data/` (git dışı).
- Ders stüdyosu (`tools/studio.sh`, `/studio/`, 8770) ve `studio_server.py` Kare'den etkilenmez; `/api/animation/*` yalnızca 8771'de.
  Kare'deki "Matematik & eğitim" bağlantısı bu mevcut stüdyoyu açar.
- **Ayarlar (⚙)**: Cartesia, GLM, OpenAI, Anthropic anahtarları ve `AI_PROVIDER` (glm|openai|anthropic) proje `.env`'ine yazılır
  (atomik, izin 600, bilinmeyen satırlar korunur). Sayfa tam anahtarı asla görmez (maskeli: ilk 7 + son 4). "Bağlantıyı test et"
  sunucuda küçük bir gerçek çağrı yapar. Anahtarları sohbete/loga/commit'e yazma.
- Güvenlik: yalnızca 127.0.0.1; açılış başına oturum anahtarı (`?t=` → HttpOnly SameSite=Strict çerez ya da `X-Kare-Token`), bütün
  `/api/` istekleri ister; Host (421) ve Origin (403) denetimi; statik dosyalar yalnızca izinli öneklerden; yüklemelerde boyut sınırı
  (413), uzantı + sihirli bayt; ZIP'te zip-slip/sembolik bağ/zip bombası denetimi; model çıktısı yalnızca doğrulanmış çizim verisi
  (serbest JS çalıştırılmaz). Test: `$PY -m unittest tools/test_kare_security.py` (Kare API testleri: `discover -s tools -p "test_*api.py"`,
  tarayıcı testleri: `npm run test:canvas`, `npm run test:kare` — sunucu açıkken). Ayrıntı: `docs/kare/`.
- Kare çalışırken öğretmen kayıt yapıyorsa Kare'de hizalama/render başlatma (aynı CPU/GPU).

## 3B integral görselleri
- Kolonlar (Riemann), silindirik/küresel hücreler, yarı saydam cisimler, dilimler ve kamera dönüşü için `src/graph3u.js` katmanlarını kullan:
  `cols`, `wedge`, `solid`, `slices`, `orbit`, `pulse` (ayrıntı: docs/ENGINE.md). Örnekler: `lesson_parts/DEMO.js`
  (`node tools/shots.mjs 9 19 33 --lesson=lesson_parts/DEMO --out=output/demo`). Küre/koni için `aspect:'equal'`.

## Dallar
- Ana dal `main`: ders üretim hattı. Diğer dallar ve neden alınmadıkları: [docs/DALLAR_VE_KARARLAR.md](docs/DALLAR_VE_KARARLAR.md).
  Stüdyo sunucusunu kapatmayı unutma (aynı portta eski bir sunucu kalırsa yeni proje açılmaz, istekler eskisine gider).

## Bilinen tuzaklar
- **iCloud Masaüstü** büyük klasörleri buluta boşaltır → `node_modules` ve Python venv'i Masaüstü dışında tut, symlink ver.
  Belirti: Python/Node import'ta sessizce takılır (dosyalar `dataless`).
- Sahne süresi hesabı yalnızca görünen öğelerden yapılır (row/col kapsayıcıları hariç) — aksi halde videonun sonunda boş kuyruk oluşur.
- Sayfa çevirme: `{type:'page', at:-0.78}` (çevirme segment öncesi sessizlikte biter, ilk satır gecikmez).
- Grafik bir metin sütununun yanındaysa `overlap:true` (yoksa yazma kuyruğunda bekler).
- Thumbnail/başlıkta "yeni format", "Ders 2" gibi ifadeler kullanma.
- Cartesia paralel isteklerde 429 verir → parçaları sırayla üret.
- Stüdyo, `script.json`'daki `voice` alanını varsayılan alır: `own` dışındaki sahneler "atlandı" başlar; N tuşu kaydedilmemiş sıradaki sahneye atlar.
- Öğretmen doğaçlama yaptıysa cue kelimesi metinden çıkmış olabilir (ör. "Hacim" yerine "Önce") → `warnings.mjs` çıktısına göre cue'yu taşı.

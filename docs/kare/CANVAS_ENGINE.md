# Canvas animasyon sözleşmesi

> Bu repoda Kare ayrı bir sunucuda çalışır: `tools/kare.sh start` → `http://localhost:8771/kare/` (oturum anahtarlı adres). Arayüz `kare/`, motor `kare/engine/`, beceriler `kare/skills/`. Ders kayıt stüdyosu (`/studio/`, 8770) ayrıdır ve değişmedi. Güvenlik ve ayarlar: CLAUDE.md → "Kare animasyon atölyesi".

Kare `/kare/` (Kare sunucusu, 8771), mevcut ders/ses kayıt aracı `/studio/` (ders sunucusu, 8770) adresindedir.

## Renderer

`kare/engine/renderers.js` içinde kategori başına `render(ctx, t, scene)` fonksiyonu bulunur. Tüm çizimler Canvas 2D ve JavaScript'tir. Mantıksal alan 1280×720; çıktı canvas boyutuna ölçeklenir. SVG, WebGL, görsel dosyası ve video modeli kullanılmaz. İzometrik kategori, Canvas üzerinde 2D izdüşümdür.

Render zamanı saniyedir. `renderScene` canvası sıfırlar; her renderer kendi save/restore dengesini korur. Seed değişmedikçe çizim dokusu sabittir. Kare geçmişine bağımlı state, Math.random ve Date.now kullanılmaz. rAF yalnızca oynatma saatini sürer; çizim `t` ile tekrar üretilebilir.

## Sahne ve proje

`defaultScene(category)` çalışır bir sahne verir. `validateScene` ve `validateProject` içe aktarılan ve AI'ın döndürdüğü veriyi sınırlar.

- `category`: katalogdaki 20 kategori kimliğinden biri.
- `title`: 1–160 karakter, konuya göre hazırlanır.
- `duration`: 2–120 saniye; `seed`: 0–2147483647.
- `speed`: 0.2–3; `detail`: 0.25–2.
- `palette`: 2–8 adet #RRGGBB; `background`: #RRGGBB.
- `objects`: en fazla 80 ilave Canvas öğesi. Türler circle, ellipse, rect, path ve text. Konum ve boyutlar 0–1 aralığında. Path noktaları normalize [x,y]. Başlama ve süre saniye. Hareketler draw, fade, float, rotate, slide.

Proje sürümü 1, sahne sayısı 1–360, toplam süre en fazla 10.800 saniye (180 dakika). UI sahne ekleme, çoğaltma, yeniden sıralama, silme, süre/palet/doku ayarı, geri alma, yerel kaydetme, JSON içe/dışa aktarma ve bağımsız HTML dışa aktarma sağlar.

## AI

`POST /api/animation/generate`: sunucu ilgili kategori SKILL.md'sini ve JSON sahne şemasını modele gönderir. Model kategoriye özgü sahne parametreleri ve özgün çizim öğeleri üretir. Dönen veriler sunucuda ve tarayıcıda doğrulanır; kullanıcı inceler, sonra sahneye uygulanır. Bu sürüm serbest JavaScript çalıştırmaz ve AI üretimi ile hazır örnek seçimini ayrı gösterir. Model ayrıca isteğe bağlı kısa bir Türkçe `narration` (≤600 karakter, ~2,3 kelime/sn) döndürür; sunucu kontrol karakterlerini/Markdown işaretlerini temizler ve kısaltır. Taslak uygulanınca AI anlatımı (yoksa sahnenin mevcut anlatımı; yeni sahnede boş) kullanılır, eski `audio`/`words`/`alignment` her zaman silinir.

AI bağlantısı için Kare'de ⚙ Ayarlar (ya da `.env`): GLM_API_KEY (GLM_MODEL varsayılanı glm-5.3), OPENAI_API_KEY, ANTHROPIC_API_KEY ya da GEMINI_API_KEY (GEMINI_MODEL varsayılanı gemini-3.8-flash); seçim AI_PROVIDER=glm|openai|anthropic|gemini. Sahne üretimi uzamsal düşünme ister: en iyi sonuç güçlü modellerle (ör. Claude Sonnet/Opus, GPT'nin üst modelleri, Gemini Pro, GLM'in en büyük modeli). Haiku, GPT luna gibi çok ucuz/küçük modellerle tam performans alınamaz; sahneler basit ya da dağınık olabilir. Anahtar yalnızca sunucudadır. Anahtar olmadan bütün kategori örnekleri ve düzenleme/dışa aktarma çalışır. AI sonucu olmadığı halde AI oluşturdu ifadesi gösterilmez.

## Dışa aktarma

- JSON: düzenlenebilir proje.
- PNG: geçerli Canvas karesi.
- HTML: ağ isteği ve bağımlılık gerektirmeyen, tüm Canvas kodunu içeren oynatıcı.
- WebM: tarayıcıda gerçek zamanlı video kaydı; ses eklemez. Kayıt süresince sekmeyi açık ve etkin tut.
- MP4: `node tools/render_canvas.mjs project.json output.mp4` Chrome headless ile sabit kare zamanlarını çizip FFmpeg'e aktarır; sunucu çalışıyor olmalı. Bu yöntem gerçek zamanlı kayıt değildir.

## Kontroller

Beceriler (`kare/skills/canvas-*/SKILL.md`, Türkçe, ~130–170 satır): stilin amacı ve görünümü, tuval/güvenli alan, kompozisyon, tema paleti (hex + kontrast), zamanlama ritmi, metin kuralları, AI çıktısının 12 alanlı nesne sözleşmesi, stil teknikleri, sık hatalar ve **iki geçerli örnek sahne JSON'u** (kısa + zengin). `POST /api/animation/generate` modele ortak bir "art director" ön metni (`ART_DIRECTOR`) ve beceri metnini (ön bilgi çıkarılmış, en fazla `SKILL_PROMPT_CHARS`=28.000 karakter ≈ 7k token; aşarsa bölüm sınırından kısaltılır) gönderir. Örnekler `python tools/check_skill_examples.py` ile doğrulanır (AI şeması + sunucu kontrolleri, `pro_contract.mjs` motor doğrulaması/qualityCheck, güvenli alan, metin boyu/çakışma/kontrast ≥4.5, kademeli girişler); `node tools/render_skill_examples.mjs --out=DIR [--at=0.5,1] [kategori…]` sunucusuz PNG çizer. Beceri değiştirince ikisini de çalıştır.

`node tools/test_canvas.mjs` 20 kategorinin çizim, deterministik geri sarma, zamana göre değişme, proje doğrulama ve temel editör davranışlarını kontrol eder. Skill biçimi skill-creator quick_validate.py ile denetlenir.

Teknik araştırma ve kategoriye özgü kabul ölçütleri: [CANVAS_RESEARCH.md](CANVAS_RESEARCH.md).


`composed=true` sahneleri hazır renderer yerine yalnızca özgün nesneleri çizer. `theme`, `narration`, `sourceRefs`, isteğe bağlı `audio` ve proje düzeyinde `subtitles` alanları korunur. Ses adresleri yalnızca yerel medya API’sine ait olabilir. Doküman/uzun animasyon/sesli MP4 akışı [AI_PRODUCTION.md](AI_PRODUCTION.md) dosyasında anlatılır.

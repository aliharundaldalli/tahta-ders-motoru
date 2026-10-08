# Canvas animasyon sözleşmesi

Yeni stüdyo `/studio/`, mevcut ders/ses kayıt aracı `/studio/recording.html` adresindedir.

## Renderer

`studio/engine/renderers.js` içinde kategori başına `render(ctx, t, scene)` fonksiyonu bulunur. Tüm çizimler Canvas 2D ve JavaScript'tir. Mantıksal alan 1280×720; çıktı canvas boyutuna ölçeklenir. SVG, WebGL, görsel dosyası ve video modeli kullanılmaz. İzometrik kategori, Canvas üzerinde 2D izdüşümdür.

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

`POST /api/animation/generate`: sunucu ilgili kategori SKILL.md'sini ve JSON sahne şemasını modele gönderir. Model kategoriye özgü sahne parametreleri ve özgün çizim öğeleri üretir. Dönen veriler sunucuda ve tarayıcıda doğrulanır; kullanıcı inceler, sonra sahneye uygulanır. Bu sürüm serbest JavaScript çalıştırmaz ve AI üretimi ile hazır örnek seçimini ayrı gösterir.

GLM bağlantısı için sunucudaki `.env` dosyasına GLM_API_KEY eklenir; GLM_MODEL varsayılanı glm-5.3, AI_PROVIDER=glm. OpenAI alternatif olarak seçilebilir. Anahtar yalnızca sunucudadır. Anahtar olmadan bütün kategori örnekleri ve düzenleme/dışa aktarma çalışır. AI sonucu olmadığı halde AI oluşturdu ifadesi gösterilmez.

## Dışa aktarma

- JSON: düzenlenebilir proje.
- PNG: geçerli Canvas karesi.
- HTML: ağ isteği ve bağımlılık gerektirmeyen, tüm Canvas kodunu içeren oynatıcı.
- WebM: tarayıcıda gerçek zamanlı video kaydı; ses eklemez. Kayıt süresince sekmeyi açık ve etkin tut.
- MP4: `node tools/render_canvas.mjs project.json output.mp4` Chrome headless ile sabit kare zamanlarını çizip FFmpeg'e aktarır; sunucu çalışıyor olmalı. Bu yöntem gerçek zamanlı kayıt değildir.

## Kontroller

`node tools/test_canvas.mjs` 20 kategorinin çizim, deterministik geri sarma, zamana göre değişme, proje doğrulama ve temel editör davranışlarını kontrol eder. Skill biçimi skill-creator quick_validate.py ile denetlenir.

Teknik araştırma ve kategoriye özgü kabul ölçütleri: [CANVAS_RESEARCH.md](CANVAS_RESEARCH.md).


`composed=true` sahneleri hazır renderer yerine yalnızca özgün nesneleri çizer. `theme`, `narration`, `sourceRefs`, isteğe bağlı `audio` ve proje düzeyinde `subtitles` alanları korunur. Ses adresleri yalnızca yerel medya API’sine ait olabilir. Doküman/uzun animasyon/sesli MP4 akışı [AI_PRODUCTION.md](AI_PRODUCTION.md) dosyasında anlatılır.

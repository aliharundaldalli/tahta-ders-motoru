---
name: canvas-pixel-art
description: "Create pixel-art animations with JavaScript Canvas 2D using deterministic scene timing. Use for Piksel sanatı animation requests."
---

# Piksel sanatı animasyonu

Bu beceri Canvas 2D ve JavaScript ile piksel sanatı animasyonu üretir. Raster görsel/video üretim servisini bu çizim motorunun yerine koyma. Kullanıcının konu, süre, oran ve metin tercihini koru.

## Kategori tekniği

Tam sayı ızgarasına oturt. Sprite silüetini küçük çözünürlükte doğrula. imageSmoothingEnabled kapalı olmalı. Frame durumunu floor(t*fps) ile seç; delta biriktirme. Paleti sınırlı tut ve sprite çevresindeki boşluğu koru.

## Stüdyo ile çalışma

1. [Canvas sözleşmesini](../../../docs/CANVAS_ENGINE.md) oku. Renderer `render(ctx, t, scene)` biçiminde, mantıksal 1280×720 alanda çalışır. `t` saniyedir; scene seed, palette, speed, detail ve duration taşır.
2. [Çalışan örneği](assets/example.js) aç. Örneğin kullandığı renderer [renderers.js](../../../studio/engine/renderers.js) içindedir; kategori kimliği `pixel-art`. Yeni konu için geometriyi değiştir, yalnızca başlık/palet değiştirmeyi yeni çizim üretimi diye sunma.
3. Tam piksel ızgarası ve ayrık sprite kareleri tekniğini kompozisyona uygula. Hazır çizim yardımcıları [primitives.js](../../../studio/engine/primitives.js) içinde bulunur. Tüm görselleri `getContext('2d')` ile çiz; WebGL, SVG, GIF ve dış görsel kullanma.
4. Zamanı `t / duration` üzerinden türet. Rastgeleliği scene.seed ile başlat; render içinde Math.random, Date.now veya kareler arasında biriken simülasyon state kullanma. Çizim öncesi canvas temizlensin; save/restore dengeli olsun.
5. Başlangıç, ara ve final karelerini incele. Aynı zamana ileri ve geri gidildiğinde aynı piksel sonucu alınmalı. Metin taşmasını, boş kareleri ve 20 saniyelik playback maliyetini kontrol et.

## Kabul ölçütleri

Pikseller keskin; sprite sıçramaları bilinçli; hareket kareleri zamanla tekrar üretilebilir.

## Kaynak

[Birincil teknik referans](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API/Tutorial/Pixel_manipulation_with_canvas). Kaynak yöntemi açıklar; bu stüdyodaki kategori uygulaması özgün, prosedürel bir uyarlamadır.

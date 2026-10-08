---
name: canvas-ink
description: "Create ink animations with JavaScript Canvas 2D using deterministic scene timing. Use for Mürekkep animation requests."
---

# Mürekkep animasyonu

Bu beceri Canvas 2D ve JavaScript ile mürekkep animasyonu üretir. Raster görsel/video üretim servisini bu çizim motorunun yerine koyma. Kullanıcının konu, süre, oran ve metin tercihini koru.

## Kategori tekniği

Yol yönüne göre kalınlık değişimini segmentlerle üret. Dar giriş, geniş gövde ve ince çıkış farklı çizilsin. Sıçrama konumları seeded olsun ve ana kompozisyonu örtmesin. Negatif alan bırak; her boşluğu noktayla doldurma.

## Stüdyo ile çalışma

1. [Canvas sözleşmesini](../../../docs/kare/CANVAS_ENGINE.md) oku. Renderer `render(ctx, t, scene)` biçiminde, mantıksal 1280×720 alanda çalışır. `t` saniyedir; scene seed, palette, speed, detail ve duration taşır.
2. [Çalışan örneği](assets/example.js) aç. Örneğin kullandığı renderer [renderers.js](../../engine/renderers.js) içindedir; kategori kimliği `ink`. Yeni konu için geometriyi değiştir, yalnızca başlık/palet değiştirmeyi yeni çizim üretimi diye sunma.
3. Basınç hissi veren yollar ve nokta sıçramaları tekniğini kompozisyona uygula. Hazır çizim yardımcıları [primitives.js](../../engine/primitives.js) içinde bulunur. Tüm görselleri `getContext('2d')` ile çiz; WebGL, SVG, GIF ve dış görsel kullanma.
4. Zamanı `t / duration` üzerinden türet. Rastgeleliği scene.seed ile başlat; render içinde Math.random, Date.now veya kareler arasında biriken simülasyon state kullanma. Çizim öncesi canvas temizlensin; save/restore dengeli olsun.
5. Başlangıç, ara ve final karelerini incele. Aynı zamana ileri ve geri gidildiğinde aynı piksel sonucu alınmalı. Metin taşmasını, boş kareleri ve 20 saniyelik playback maliyetini kontrol et.

## Kabul ölçütleri

Kalınlık geçişleri kontrollü; sıçramalar sabit; çizgi ritmi görünür.

## Kaynak

[Birincil teknik referans](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API/Tutorial/Drawing_shapes). Kaynak yöntemi açıklar; bu stüdyodaki kategori uygulaması özgün, prosedürel bir uyarlamadır.

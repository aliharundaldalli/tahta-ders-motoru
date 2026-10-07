---
name: canvas-landscape
description: "Create landscape animations with JavaScript Canvas 2D using deterministic scene timing. Use for Katmanlı manzara animation requests."
---

# Katmanlı manzara animasyonu

Bu beceri Canvas 2D ve JavaScript ile katmanlı manzara animasyonu üretir. Raster görsel/video üretim servisini bu çizim motorunun yerine koyma. Kullanıcının konu, süre, oran ve metin tercihini koru.

## Kategori tekniği

Arka, orta ve ön plan ayrı derinlik hızları kullansın. Ufku ve güneşi ana kompozisyon çıpası olarak tut. Silüetleri tam sahne kenarlarına kadar çiz. Pan sırasında seam oluşmasını önle. Renk değerleri uzak planda daha düşük kontrastlı olsun.

## Stüdyo ile çalışma

1. [Canvas sözleşmesini](../../../docs/CANVAS_ENGINE.md) oku. Renderer `render(ctx, t, scene)` biçiminde, mantıksal 1280×720 alanda çalışır. `t` saniyedir; scene seed, palette, speed, detail ve duration taşır.
2. [Çalışan örneği](assets/example.js) aç. Örneğin kullandığı renderer [renderers.js](../../../studio/engine/renderers.js) içindedir; kategori kimliği `landscape`. Yeni konu için geometriyi değiştir, yalnızca başlık/palet değiştirmeyi yeni çizim üretimi diye sunma.
3. Prosedürel silüetler ve parallax tekniğini kompozisyona uygula. Hazır çizim yardımcıları [primitives.js](../../../studio/engine/primitives.js) içinde bulunur. Tüm görselleri `getContext('2d')` ile çiz; WebGL, SVG, GIF ve dış görsel kullanma.
4. Zamanı `t / duration` üzerinden türet. Rastgeleliği scene.seed ile başlat; render içinde Math.random, Date.now veya kareler arasında biriken simülasyon state kullanma. Çizim öncesi canvas temizlensin; save/restore dengeli olsun.
5. Başlangıç, ara ve final karelerini incele. Aynı zamana ileri ve geri gidildiğinde aynı piksel sonucu alınmalı. Metin taşmasını, boş kareleri ve 20 saniyelik playback maliyetini kontrol et.

## Kabul ölçütleri

Katman derinliği görünür; boş kenar yok; uzak ve yakın hızları ayrışıyor.

## Kaynak

[Birincil teknik referans](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API/Tutorial/Transformations). Kaynak yöntemi açıklar; bu stüdyodaki kategori uygulaması özgün, prosedürel bir uyarlamadır.

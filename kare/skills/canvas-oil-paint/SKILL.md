---
name: canvas-oil-paint
description: "Create oil-paint animations with JavaScript Canvas 2D using deterministic scene timing. Use for Yağlıboya animation requests."
---

# Yağlıboya animasyonu

Bu beceri Canvas 2D ve JavaScript ile yağlıboya animasyonu üretir. Raster görsel/video üretim servisini bu çizim motorunun yerine koyma. Kullanıcının konu, süre, oran ve metin tercihini koru.

## Kategori tekniği

Opak fırça işaretlerini alttan üste düzenle. Her izin içinde yönlü ince aydınlık çizgiler kabartma hissi verir. Hareket doku üzerinde kaydırma değil, yeni boya izlerinin açılması olsun. Doku yönü kompozisyon akışını izlesin.

## Stüdyo ile çalışma

1. [Canvas sözleşmesini](../../../docs/kare/CANVAS_ENGINE.md) oku. Renderer `render(ctx, t, scene)` biçiminde, mantıksal 1280×720 alanda çalışır. `t` saniyedir; scene seed, palette, speed, detail ve duration taşır.
2. [Çalışan örneği](assets/example.js) aç. Örneğin kullandığı renderer [renderers.js](../../engine/renderers.js) içindedir; kategori kimliği `oil-paint`. Yeni konu için geometriyi değiştir, yalnızca başlık/palet değiştirmeyi yeni çizim üretimi diye sunma.
3. Opak fırça blokları ve impasto çizgileri tekniğini kompozisyona uygula. Hazır çizim yardımcıları [primitives.js](../../engine/primitives.js) içinde bulunur. Tüm görselleri `getContext('2d')` ile çiz; WebGL, SVG, GIF ve dış görsel kullanma.
4. Zamanı `t / duration` üzerinden türet. Rastgeleliği scene.seed ile başlat; render içinde Math.random, Date.now veya kareler arasında biriken simülasyon state kullanma. Çizim öncesi canvas temizlensin; save/restore dengeli olsun.
5. Başlangıç, ara ve final karelerini incele. Aynı zamana ileri ve geri gidildiğinde aynı piksel sonucu alınmalı. Metin taşmasını, boş kareleri ve 20 saniyelik playback maliyetini kontrol et.

## Kabul ölçütleri

Kalın boya hissi görünür; izler birlikte bir kompozisyon oluşturur; doku sabit.

## Kaynak

[Birincil teknik referans](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API/Tutorial/Drawing_shapes). Kaynak yöntemi açıklar; bu stüdyodaki kategori uygulaması özgün, prosedürel bir uyarlamadır.

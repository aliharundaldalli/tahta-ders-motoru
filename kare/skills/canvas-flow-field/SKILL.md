---
name: canvas-flow-field
description: "Create flow-field animations with JavaScript Canvas 2D using deterministic scene timing. Use for Akış alanları animation requests."
---

# Akış alanları animasyonu

Bu beceri Canvas 2D ve JavaScript ile akış alanları animasyonu üretir. Raster görsel/video üretim servisini bu çizim motorunun yerine koyma. Kullanıcının konu, süre, oran ve metin tercihini koru.

## Kategori tekniği

Alan vektörünü konum ve zamana bağlı üret. Yolları seeded başlangıçlardan sabit adımla örnekle. Hız ile yönü ayrı parametreleştir. Tam Navier-Stokes simülasyonu vaat etme; bu örnek vektör alanıdır. Ayrıntı düzeyinde adım ve yol sayısını sınırla.

## Stüdyo ile çalışma

1. [Canvas sözleşmesini](../../../docs/kare/CANVAS_ENGINE.md) oku. Renderer `render(ctx, t, scene)` biçiminde, mantıksal 1280×720 alanda çalışır. `t` saniyedir; scene seed, palette, speed, detail ve duration taşır.
2. [Çalışan örneği](assets/example.js) aç. Örneğin kullandığı renderer [renderers.js](../../engine/renderers.js) içindedir; kategori kimliği `flow-field`. Yeni konu için geometriyi değiştir, yalnızca başlık/palet değiştirmeyi yeni çizim üretimi diye sunma.
3. Trigonometrik vektör alanı ve örneklenmiş yollar tekniğini kompozisyona uygula. Hazır çizim yardımcıları [primitives.js](../../engine/primitives.js) içinde bulunur. Tüm görselleri `getContext('2d')` ile çiz; WebGL, SVG, GIF ve dış görsel kullanma.
4. Zamanı `t / duration` üzerinden türet. Rastgeleliği scene.seed ile başlat; render içinde Math.random, Date.now veya kareler arasında biriken simülasyon state kullanma. Çizim öncesi canvas temizlensin; save/restore dengeli olsun.
5. Başlangıç, ara ve final karelerini incele. Aynı zamana ileri ve geri gidildiğinde aynı piksel sonucu alınmalı. Metin taşmasını, boş kareleri ve 20 saniyelik playback maliyetini kontrol et.

## Kabul ölçütleri

Yollar akış yönünü takip eder; adım sınırı var; animasyon dt geçmişine bağlı değil.

## Kaynak

[Birincil teknik referans](https://natureofcode.com/autonomous-agents/). Kaynak yöntemi açıklar; bu stüdyodaki kategori uygulaması özgün, prosedürel bir uyarlamadır.

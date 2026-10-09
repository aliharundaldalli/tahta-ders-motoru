---
name: canvas-kinetic-type
description: "Kare Canvas 2D sahnelerini hareketli tipografi (kinetic typography) stilinde üretir: kelimelerin sırayla kayarak geldiği, büyük harfli, ritmik metin kompozisyonları. Slogan, alıntı, başlık animasyonu, motivasyon metni istekleri için kullan."
---

# canvas-kinetic-type · Hareketli tipografi

Bu beceri, Kare'nin Canvas 2D motorunda **Hareketli tipografi** stilinde, AI'ın JSON olarak döndürdüğü düzenlenebilir sahneler içindir (kod değil, yalnızca sahne verisi; `composed` sahnelerde hazır prosedürel çizim kapalıdır, her şeyi nesnelerle sen kurarsın).

## Amaç ve görünüm

Kelimeler sahnenin kendisidir: büyük (80–110 px), kalın görünen, satır satır dizilmiş metin blokları; her kelime ayrı text nesnesi olarak sırayla `slide` ile gelir. Az sayıda çizgi, nokta ve kare ritmi destekler. Grafik yok denecek kadar az.

## Tuval ve güvenli alan

- Mantıksal tuval **1280×720**. Tüm `x`, `y`, `width`, `height` ve path noktaları **0–1 normalize** değerdir: piksel = x·1280, y·720.
- `x`,`y` nesnenin **merkezidir** (circle, ellipse, rect, text). Path için `x`,`y` noktaların sınır kutusunun merkezi, `width`/`height` kutunun boyu olsun (döndürme ve kalite denetimi bunu kullanır).
- **Güvenli alan:** x .04–.96, y .08–.82. Alt ~100 px (y > .86) altyazı bandıdır; metni ve odak nesnesini oraya koyma. Zemin/gökyüzü gibi arka plan bantları kenara kadar uzanabilir ama 0–1 dışına taşmasın.
- Circle'da `width` çaptır ve 1280 px'e göredir: dikey yarıçap = width·1280/720/2 (ör. width .1 → 128 px çap, y'de ±.089). `height` circle için kullanılmaz, width ile aynı oranı yaz.
- Nesneler dizideki **sırayla** çizilir: önce arka plan, sonra orta plan, en son ön plan ve metin.

## Kompozisyon

- Bir **odak nesnesi** seç ve üçte bir noktalarına (x≈.33/.67, y≈.33/.6) ya da bilinçli olarak merkeze yerleştir; 3–7 ana form + destekleyici ayrıntı.
- Derinlik katmanları: arka plan (büyük, düşük kontrast) → orta plan → ön plan (en koyu/en doygun) → metin. Boş alan bırak; ana formlar çerçeve genişliğinin en az %12'si olsun.
- Metni okuma sırasına göre ızgaraya diz: 2–3 satır, satır aralığı ≈ yazı boyu×1.3 (90 px yazı → 120 px).
- Her kelimenin `width` değeri onu tek satırda tutacak kadar geniş (karakter × boy × .56) ama komşusuyla çakışmayacak kadar dar.
- Bir anahtar kelime renk ya da boyutla ayrışsın.

## Palet

Arka plan **#25332f**. Tema paleti (sırayla): `#ece4ce`, `#b99b6c`, `#87a399`.
- `#ece4ce` — ana kelimeler (arka planla kontrast 10.4:1)
- `#b99b6c` — vurgu kelimesi, çizgiler (arka planla kontrast 5.0:1)
- `#87a399` — ikincil kelimeler (arka planla kontrast 4.9:1)
Üç renk de koyu zeminde okunur (≥4.9:1). Her satırda en fazla bir vurgu rengi.

## Zamanlama ve koreografi

Süre D için ritim: **%0–15** sahneyi kur (arka plan, zemin, büyük renk alanları) · **%15–60** odak nesnesini inşa et (ana çizgiler `draw`, ana formlar `fade`/`slide`) · **%55–85** ayrıntı, vurgu ve etiketler · **%85–100** bekleme: yeni nesne yok, yalnızca 1–4 `float`/`rotate` ortam hareketi.
- Girişleri **kademelendir**: kardeş öğeler arasında .15–.6 sn aralık; aynı anda en fazla 2–3 nesne başlasın. `start` değerlerinin hepsi 0 olmasın.
- Tipik giriş süresi: fade .6–1.5 sn, slide .8–1.2 sn, draw 1.5–4 sn (uzun yol = daha uzun süre). Çok kısa (<.3 sn) girişler sıçrama gibi görünür.
- Son nesne en geç D·0.8'de başlasın; izleyici bitmiş resmi en az 2 sn görsün.
- Kelimeler okuma hızında: .5–.7 sn arayla, `slide` .8 sn. Önemli kelimeden önce .3 sn ekstra boşluk.
- Alt çizgi/kural `draw` ile kelimelerden sonra; küçük açıklama en son `fade`.
- Bitişte 1–2 küçük `float`/`rotate` aksan.

## Metin

- Türkçe karakterleri doğru yaz (ç ğ ı İ ö ş ü). Başlık en fazla ~5 kelime, etiket 1–3 kelime; bir text nesnesinde en fazla 8 kelime.
- Boyut (`height`): başlık .06–.09 (43–65 px), alt başlık .04–.05, etiket .033–.04 (24–29 px). 20 px altı okunmaz.
- `width` metni sığdıracak kadar geniş olsun (yaklaşık karakter sayısı × yazı boyu × .56 / 1280). Metinler birbiriyle ve yoğun şekillerle çakışmasın.
- Metin rengi arka planla en az 4.5:1 kontrast vermeli: bu stilde metin için **#ece4ce** kullan.

## Nesne sözleşmesi (AI çıktısı — alanlar birebir)

Sahne: `category` (bu beceri: **kinetic-type**), `title` (1–160), `duration` (2–60 sn), `seed` (tamsayı), `speed` (.2–3, float/rotate hızını çarpar), `detail` (.25–2), `background` (#RRGGBB), `palette` (2–8 × #RRGGBB), `objects` (en fazla 80; iyi sahne 8–30).
İsteğe bağlı `narration`: sahnenin üzerine okunacak 1–4 kısa cümlelik sade Türkçe anlatım (en fazla 600 karakter, süre × ~2,3 kelime; 10 sn ≈ 20–23 kelime). Bu görseli anlatır; Markdown, emoji, tırnak veya sahne yönergesi yazma, örnek metinleri kopyalama.
Her nesnede **12 alanın hepsi** bulunur, başka alan yoktur:

| alan | değer |
|---|---|
| `type` | `circle` · `ellipse` · `rect` · `path` · `text` |
| `x`, `y`, `width`, `height` | 0–1 |
| `color` | `#RRGGBB` (6 hane; isim, rgba, kısa hex yok) |
| `lineWidth` | .1–30 px (yalnız path çizgisi; diğerlerinde 1 yaz) |
| `start` | 0–sahne süresi (sn) · `duration` .1–60 (giriş animasyonu süresi) |
| `text` | yalnız text için, ≤200 karakter; diğerlerinde `""` |
| `points` | yalnız path için 2–500 adet `[x,y]`; diğerlerinde `[]` |
| `motion` | `draw` · `fade` · `float` · `rotate` · `slide` |

Hareketler: **draw** path'i baştan sona çizer (diğer türler `start` anında belirir) · **fade** saydamlık 0→1 · **slide** 180 px soldan kayarak ve belirerek gelir · **float** sürekli ±14 px yukarı-aşağı salınır (belirmez, anında gelir) · **rotate** (x,y) çevresinde sürekli yavaş döner (circle'da görünmez). Nesneler girdikten sonra **kaybolmaz**; son kare tüm nesneleri gösterir. `keyframes`, `opacity`, `rotation`, `brush` gibi editör alanları AI çıktısında **yoktur**.
Path yalnızca **çizgidir, dolgu yapmaz**. Dolu şekil için circle/ellipse/rect kullan; eğik dolu form için kalın (12–30) kısa path "kapsül" ya da zikzak tarama path'i kullan. Text `height` = yazı boyu/720 (12–110 px), `width` = satır kırma genişliği; en fazla 3 satır, ortalanır.

## Stil teknikleri

- Satır kurma: kelime merkezlerini x'te genişliklerin yarısı + 20 px boşlukla diz.
- Vurgu: aynı satırda bir kelimeyi altın renge al ya da 1.2× büyüt.
- Çerçeve köşeleri: 3 noktalı L path'ler, köşelerde.
- Türkçe büyük harf: i → İ, ı → I (ör. "DİLİ", "BİRAZ").

## Sık hatalar (kaçın)

- Nesneyi çerçeve dışına taşırmak (x±width/2, circle'da dikey yarıçap, float için +14 px pay) ya da metni altyazı bandına koymak.
- Bütün nesneleri `start: 0` ile başlatmak; ya da son saniyede yeni nesne getirmek.
- Minik şekiller (width < .015) ve 20 px altı yazılar; ana form çerçevenin %12'sinden küçük.
- 40'tan fazla benzer küçük nesne (parçacık/nokta yığını) — ritim kaybolur, sahne kirlenir. 10–25 yeterli.
- Yanlış alan adları (`radius`, `fill`, `size`, `fontSize`, `delay`, `animation`, `keyframes`) ya da eksik alan; renkleri `rgb()`/isimle yazmak.
- Path'i dolgu sanmak; path `x`,`y` değerini sınır kutusu merkezine koymamak; 2'den az nokta.
- Her şeyi aynı boyutta, ortada üst üste yığmak; odak nesnesi olmayan "dağınık" kompozisyon.
- Tüm cümleyi tek text nesnesine koymak (kinetik etki kaybolur).
- Kelimeleri üst üste bindirmek ya da `width`'i dar tutup 3+ satıra kırılmasına izin vermek.
- "i" harfini büyük harfe I olarak çevirmek (DILI yanlış, DİLİ doğru).

## Örnek 1 — kısa: dört kelime

```json
{"category":"kinetic-type","title":"Her gün biraz daha","duration":8,"seed":12,"speed":1,"detail":1,"background":"#25332f","palette":["#ece4ce","#b99b6c","#87a399"],"objects":[
 {"type":"text","x":0.258,"y":0.347,"width":0.172,"height":0.125,"color":"#ece4ce","lineWidth":1,"start":0.4,"duration":0.8,"text":"HER","points":[],"motion":"slide"},
 {"type":"text","x":0.445,"y":0.347,"width":0.188,"height":0.125,"color":"#b99b6c","lineWidth":1,"start":1.0,"duration":0.8,"text":"GÜN","points":[],"motion":"slide"},
 {"type":"text","x":0.328,"y":0.514,"width":0.281,"height":0.125,"color":"#87a399","lineWidth":1,"start":1.8,"duration":0.8,"text":"BİRAZ","points":[],"motion":"slide"},
 {"type":"text","x":0.594,"y":0.514,"width":0.234,"height":0.125,"color":"#ece4ce","lineWidth":1,"start":2.4,"duration":0.8,"text":"DAHA","points":[],"motion":"slide"},
 {"type":"path","x":0.445,"y":0.611,"width":0.562,"height":0.003,"color":"#b99b6c","lineWidth":6,"start":3.4,"duration":1.2,"text":"","points":[[0.164,0.611],[0.727,0.611]],"motion":"draw"},
 {"type":"text","x":0.445,"y":0.694,"width":0.469,"height":0.039,"color":"#ece4ce","lineWidth":1,"start":4.4,"duration":1.0,"text":"küçük adımlar, büyük yol","points":[],"motion":"fade"},
 {"type":"rect","x":0.789,"y":0.347,"width":0.031,"height":0.056,"color":"#b99b6c","lineWidth":1,"start":2.8,"duration":0.5,"text":"","points":[],"motion":"rotate"}
]}
```

## Örnek 2 — zengin: başlık ve ritim

```json
{"category":"kinetic-type","title":"Hareketin dili","duration":12,"seed":7,"speed":1,"detail":1,"background":"#25332f","palette":["#ece4ce","#b99b6c","#87a399"],"objects":[
 {"type":"path","x":0.141,"y":0.181,"width":0.031,"height":0.056,"color":"#b99b6c","lineWidth":4,"start":0.0,"duration":0.6,"text":"","points":[[0.125,0.208],[0.125,0.153],[0.156,0.153]],"motion":"draw"},
 {"type":"path","x":0.891,"y":0.792,"width":0.031,"height":0.056,"color":"#b99b6c","lineWidth":4,"start":0.2,"duration":0.6,"text":"","points":[[0.875,0.819],[0.906,0.819],[0.906,0.764]],"motion":"draw"},
 {"type":"text","x":0.5,"y":0.319,"width":0.781,"height":0.133,"color":"#ece4ce","lineWidth":1,"start":0.6,"duration":1.0,"text":"HAREKETİN","points":[],"motion":"slide"},
 {"type":"text","x":0.5,"y":0.514,"width":0.469,"height":0.153,"color":"#b99b6c","lineWidth":1,"start":1.8,"duration":1.0,"text":"DİLİ","points":[],"motion":"fade"},
 {"type":"path","x":0.5,"y":0.625,"width":0.406,"height":0.003,"color":"#87a399","lineWidth":3,"start":2.8,"duration":1.0,"text":"","points":[[0.297,0.625],[0.703,0.625]],"motion":"draw"},
 {"type":"text","x":0.234,"y":0.708,"width":0.156,"height":0.044,"color":"#87a399","lineWidth":1,"start":3.4,"duration":0.8,"text":"kelime","points":[],"motion":"slide"},
 {"type":"text","x":0.5,"y":0.708,"width":0.156,"height":0.044,"color":"#ece4ce","lineWidth":1,"start":3.9,"duration":0.8,"text":"ritim","points":[],"motion":"slide"},
 {"type":"text","x":0.766,"y":0.708,"width":0.156,"height":0.044,"color":"#87a399","lineWidth":1,"start":4.4,"duration":0.8,"text":"zaman","points":[],"motion":"slide"},
 {"type":"circle","x":0.367,"y":0.708,"width":0.009,"height":0.017,"color":"#b99b6c","lineWidth":1,"start":4.0,"duration":0.4,"text":"","points":[],"motion":"fade"},
 {"type":"circle","x":0.633,"y":0.708,"width":0.009,"height":0.017,"color":"#b99b6c","lineWidth":1,"start":4.5,"duration":0.4,"text":"","points":[],"motion":"fade"},
 {"type":"text","x":0.5,"y":0.806,"width":0.391,"height":0.036,"color":"#ece4ce","lineWidth":1,"start":5.4,"duration":1.0,"text":"her harf bir adım","points":[],"motion":"fade"},
 {"type":"circle","x":0.844,"y":0.278,"width":0.016,"height":0.028,"color":"#b99b6c","lineWidth":1,"start":6.2,"duration":0.5,"text":"","points":[],"motion":"float"},
 {"type":"circle","x":0.156,"y":0.528,"width":0.013,"height":0.022,"color":"#87a399","lineWidth":1,"start":6.6,"duration":0.5,"text":"","points":[],"motion":"float"}
]}
```

## Kabul ölçütleri

Kelime sırası okunur; hiçbir kelime taşmıyor ya da çakışmıyor; Türkçe karakterler doğru; ritim düzenli.
Son kare tek başına bakıldığında bitmiş, dengeli bir resim olmalı; tüm metin okunur ve güvenli alanda.

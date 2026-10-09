---
name: canvas-retro
description: "Kare Canvas 2D sahnelerini retro synthwave stilinde üretir: dilimli güneş, perspektif ızgara, neon ufuk, 80ler tipografisi. Retro, synthwave, neon, 80ler, gece sürüşü istekleri için kullan."
---

# canvas-retro · Retro / synthwave

Bu beceri, Kare'nin Canvas 2D motorunda **Retro / synthwave** stilinde, AI'ın JSON olarak döndürdüğü düzenlenebilir sahneler içindir (kod değil, yalnızca sahne verisi; `composed` sahnelerde hazır prosedürel çizim kapalıdır, her şeyi nesnelerle sen kurarsın).

## Amaç ve görünüm

80ler albüm kapağı: koyu lacivert gece, ufukta yarısı batmış dilimli turuncu güneş, ufuktan aşağı açılan mavi perspektif ızgara, pembe neon çizgiler, büyük harfli başlık. Her şey simetrik ve tek kaçış noktasına bağlı.

## Tuval ve güvenli alan

- Mantıksal tuval **1280×720**. Tüm `x`, `y`, `width`, `height` ve path noktaları **0–1 normalize** değerdir: piksel = x·1280, y·720.
- `x`,`y` nesnenin **merkezidir** (circle, ellipse, rect, text). Path için `x`,`y` noktaların sınır kutusunun merkezi, `width`/`height` kutunun boyu olsun (döndürme ve kalite denetimi bunu kullanır).
- **Güvenli alan:** x .04–.96, y .08–.82. Alt ~100 px (y > .86) altyazı bandıdır; metni ve odak nesnesini oraya koyma. Zemin/gökyüzü gibi arka plan bantları kenara kadar uzanabilir ama 0–1 dışına taşmasın.
- Circle'da `width` çaptır ve 1280 px'e göredir: dikey yarıçap = width·1280/720/2 (ör. width .1 → 128 px çap, y'de ±.089). `height` circle için kullanılmaz, width ile aynı oranı yaz.
- Nesneler dizideki **sırayla** çizilir: önce arka plan, sonra orta plan, en son ön plan ve metin.

## Kompozisyon

- Bir **odak nesnesi** seç ve üçte bir noktalarına (x≈.33/.67, y≈.33/.6) ya da bilinçli olarak merkeze yerleştir; 3–7 ana form + destekleyici ayrıntı.
- Derinlik katmanları: arka plan (büyük, düşük kontrast) → orta plan → ön plan (en koyu/en doygun) → metin. Boş alan bırak; ana formlar çerçeve genişliğinin en az %12'si olsun.
- Ufuk y≈.55 (400 px), kaçış noktası (640, 400). Güneş merkezi ufkun hemen üstünde.
- Izgara: dikey çizgiler kaçış noktasından alt kenara yelpaze; yatay çizgiler aşağı indikçe aralığı artar (420, 450, 495, 560).
- Başlık üst üçte birde, ortada.

## Palet

Arka plan **#191a30**. Tema paleti (sırayla): `#efa678`, `#b75b90`, `#6084b4`.
- `#efa678` — güneş, başlık, yol çizgileri (arka planla kontrast 8.4:1)
- `#b75b90` — neon ufuk ve dağ konturu (arka planla kontrast 4.0:1)
- `#6084b4` — perspektif ızgara (arka planla kontrast 4.4:1)
Ufuk altı zemin için arka plandan biraz açık `#1d1e38`; ikincil yazı için açık mavi `#9db8e0` (mavi `#6084b4` metin için zayıf, 4.4:1). Silüetler `#0f1022`.

## Zamanlama ve koreografi

Süre D için ritim: **%0–15** sahneyi kur (arka plan, zemin, büyük renk alanları) · **%15–60** odak nesnesini inşa et (ana çizgiler `draw`, ana formlar `fade`/`slide`) · **%55–85** ayrıntı, vurgu ve etiketler · **%85–100** bekleme: yeni nesne yok, yalnızca 1–4 `float`/`rotate` ortam hareketi.
- Girişleri **kademelendir**: kardeş öğeler arasında .15–.6 sn aralık; aynı anda en fazla 2–3 nesne başlasın. `start` değerlerinin hepsi 0 olmasın.
- Tipik giriş süresi: fade .6–1.5 sn, slide .8–1.2 sn, draw 1.5–4 sn (uzun yol = daha uzun süre). Çok kısa (<.3 sn) girişler sıçrama gibi görünür.
- Son nesne en geç D·0.8'de başlasın; izleyici bitmiş resmi en az 2 sn görsün.
- Güneş `fade` → dilimler (.2 sn arayla) → ufuk `draw` → ızgara `draw` → yatay çizgiler → başlık `slide`.
- Ortam: 2–4 yıldız `float`.

## Metin

- Türkçe karakterleri doğru yaz (ç ğ ı İ ö ş ü). Başlık en fazla ~5 kelime, etiket 1–3 kelime; bir text nesnesinde en fazla 8 kelime.
- Boyut (`height`): başlık .06–.09 (43–65 px), alt başlık .04–.05, etiket .033–.04 (24–29 px). 20 px altı okunmaz.
- `width` metni sığdıracak kadar geniş olsun (yaklaşık karakter sayısı × yazı boyu × .56 / 1280). Metinler birbiriyle ve yoğun şekillerle çakışmasın.
- Metin rengi arka planla en az 4.5:1 kontrast vermeli: bu stilde metin için **#efa678** kullan.

## Nesne sözleşmesi (AI çıktısı — alanlar birebir)

Sahne: `category` (bu beceri: **retro**), `title` (1–160), `duration` (2–60 sn), `seed` (tamsayı), `speed` (.2–3, float/rotate hızını çarpar), `detail` (.25–2), `background` (#RRGGBB), `palette` (2–8 × #RRGGBB), `objects` (en fazla 80; iyi sahne 8–30).
İsteğe bağlı `narration`: sahnenin üzerine okunacak 1–4 kısa cümlelik sade Türkçe anlatım (en fazla 600 karakter, süre × ~2,3 kelime; 10 sn ≈ 20–23 kelime). Bu görseli anlatır; Markdown, emoji, tırnak veya sahne yönergesi yazma, örnek metinleri kopyalama.
Her nesnede **12 alanın hepsi** bulunur (+ isteğe bağlı `cue`), başka alan yoktur:

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
| `cue` | isteğe bağlı: nesneyi tanıtan, anlatımdan birebir kelime/kısa ifade (≤40 karakter; arka plan için `""`). Seslendirmede nesne bu kelime söylenirken girer. |

Hareketler: **draw** path'i baştan sona çizer (diğer türler `start` anında belirir) · **fade** saydamlık 0→1 · **slide** 180 px soldan kayarak ve belirerek gelir · **float** sürekli ±14 px yukarı-aşağı salınır (belirmez, anında gelir) · **rotate** (x,y) çevresinde sürekli yavaş döner (circle'da görünmez). Nesneler girdikten sonra **kaybolmaz**; son kare tüm nesneleri gösterir. `keyframes`, `opacity`, `rotation`, `brush` gibi editör alanları AI çıktısında **yoktur**.
Path yalnızca **çizgidir, dolgu yapmaz**. Dolu şekil için circle/ellipse/rect kullan; eğik dolu form için kalın (12–30) kısa path "kapsül" ya da zikzak tarama path'i kullan. Text `height` = yazı boyu/720 (12–110 px), `width` = satır kırma genişliği; en fazla 3 satır, ortalanır.

## Stil teknikleri

- Dilimli güneş: circle + güneşin alt yarısına arka plan renginde, aşağı doğru kalınlaşan ince rect'ler.
- Güneşi ufukta kesmek: güneşten SONRA ufuk altını kaplayan tam genişlik rect.
- Dikey ızgara tek zikzak path olabilir (kaçış noktası ↔ alt kenar).
- Palmiye: kalın eğri gövde path + 4 bükülmüş kapsül yaprak, koyu silüet.

## Sık hatalar (kaçın)

- Nesneyi çerçeve dışına taşırmak (x±width/2, circle'da dikey yarıçap, float için +14 px pay) ya da metni altyazı bandına koymak.
- Bütün nesneleri `start: 0` ile başlatmak; ya da son saniyede yeni nesne getirmek.
- Minik şekiller (width < .015) ve 20 px altı yazılar; ana form çerçevenin %12'sinden küçük.
- 40'tan fazla benzer küçük nesne (parçacık/nokta yığını) — ritim kaybolur, sahne kirlenir. 10–25 yeterli.
- Yanlış alan adları (`radius`, `fill`, `size`, `fontSize`, `delay`, `animation`, `keyframes`) ya da eksik alan; renkleri `rgb()`/isimle yazmak.
- Path'i dolgu sanmak; path `x`,`y` değerini sınır kutusu merkezine koymamak; 2'den az nokta.
- Her şeyi aynı boyutta, ortada üst üste yığmak; odak nesnesi olmayan "dağınık" kompozisyon.
- Kaçış noktasını tutarsız kullanmak (ızgara ve yol farklı noktalara gider).
- Mavi ya da pembe ince metin (okunmaz); başlığı ızgaranın üstüne koymak.

## Örnek 1 — kısa: neon ufuk

```json
{"category":"retro","title":"Neon ufuk","duration":8,"seed":86,"speed":1,"detail":1,"background":"#191a30","palette":["#efa678","#b75b90","#6084b4","#1d1e38"],"objects":[
 {"type":"circle","x":0.5,"y":0.458,"width":0.188,"height":0.333,"color":"#efa678","lineWidth":1,"start":0.3,"duration":1.5,"text":"","points":[],"motion":"fade"},
 {"type":"rect","x":0.5,"y":0.486,"width":0.203,"height":0.008,"color":"#191a30","lineWidth":1,"start":1.6,"duration":0.4,"text":"","points":[],"motion":"fade"},
 {"type":"rect","x":0.5,"y":0.517,"width":0.203,"height":0.013,"color":"#191a30","lineWidth":1,"start":1.8,"duration":0.4,"text":"","points":[],"motion":"fade"},
 {"type":"rect","x":0.5,"y":0.544,"width":0.203,"height":0.017,"color":"#191a30","lineWidth":1,"start":2.0,"duration":0.4,"text":"","points":[],"motion":"fade"},
 {"type":"rect","x":0.5,"y":0.689,"width":1.0,"height":0.261,"color":"#1d1e38","lineWidth":1,"start":2.0,"duration":0.3,"text":"","points":[],"motion":"fade"},
 {"type":"path","x":0.5,"y":0.556,"width":0.906,"height":0.003,"color":"#b75b90","lineWidth":4,"start":2.2,"duration":1.2,"text":"","points":[[0.047,0.556],[0.953,0.556]],"motion":"draw"},
 {"type":"path","x":0.5,"y":0.689,"width":1.0,"height":0.261,"color":"#6084b4","lineWidth":2,"start":3.0,"duration":2.0,"text":"","points":[[0.0,0.819],[0.383,0.558],[0.406,0.558],[0.0,0.819],[0.0,0.819],[0.43,0.558],[0.453,0.558],[0.141,0.819],[0.32,0.819],[0.477,0.558],[0.5,0.558],[0.5,0.819],[0.68,0.819],[0.523,0.558],[0.547,0.558],[0.859,0.819],[1.0,0.819],[0.57,0.558],[0.594,0.558],[1.0,0.819],[1.0,0.819],[0.617,0.558]],"motion":"draw"},
 {"type":"path","x":0.5,"y":0.583,"width":0.875,"height":0.003,"color":"#6084b4","lineWidth":2,"start":3.4,"duration":0.6,"text":"","points":[[0.062,0.583],[0.938,0.583]],"motion":"draw"},
 {"type":"path","x":0.5,"y":0.625,"width":0.875,"height":0.003,"color":"#6084b4","lineWidth":2,"start":3.7,"duration":0.6,"text":"","points":[[0.062,0.625],[0.938,0.625]],"motion":"draw"},
 {"type":"path","x":0.5,"y":0.688,"width":0.875,"height":0.003,"color":"#6084b4","lineWidth":2,"start":4.0,"duration":0.6,"text":"","points":[[0.062,0.688],[0.938,0.688]],"motion":"draw"},
 {"type":"path","x":0.5,"y":0.778,"width":0.875,"height":0.003,"color":"#6084b4","lineWidth":2,"start":4.3,"duration":0.6,"text":"","points":[[0.062,0.778],[0.938,0.778]],"motion":"draw"},
 {"type":"text","x":0.5,"y":0.194,"width":0.469,"height":0.089,"color":"#efa678","lineWidth":1,"start":4.8,"duration":1.0,"text":"NEON UFUK","points":[],"motion":"slide"},
 {"type":"circle","x":0.172,"y":0.278,"width":0.006,"height":0.011,"color":"#9db8e0","lineWidth":1,"start":5.6,"duration":0.5,"text":"","points":[],"motion":"float"},
 {"type":"circle","x":0.828,"y":0.222,"width":0.006,"height":0.011,"color":"#9db8e0","lineWidth":1,"start":5.9,"duration":0.5,"text":"","points":[],"motion":"float"}
]}
```

## Örnek 2 — zengin: gece sürüşü

```json
{"category":"retro","title":"Gece sürüşü","duration":14,"seed":1986,"speed":1,"detail":1,"background":"#191a30","palette":["#efa678","#b75b90","#6084b4","#1d1e38","#9db8e0","#0f1022"],"objects":[
 {"type":"circle","x":0.156,"y":0.167,"width":0.005,"height":0.008,"color":"#9db8e0","lineWidth":1,"start":0.0,"duration":0.5,"text":"","points":[],"motion":"fade"},
 {"type":"circle","x":0.375,"y":0.125,"width":0.005,"height":0.008,"color":"#9db8e0","lineWidth":1,"start":0.2,"duration":0.5,"text":"","points":[],"motion":"fade"},
 {"type":"circle","x":0.703,"y":0.153,"width":0.005,"height":0.008,"color":"#9db8e0","lineWidth":1,"start":0.4,"duration":0.5,"text":"","points":[],"motion":"fade"},
 {"type":"circle","x":0.875,"y":0.278,"width":0.005,"height":0.008,"color":"#9db8e0","lineWidth":1,"start":0.6,"duration":0.5,"text":"","points":[],"motion":"fade"},
 {"type":"circle","x":0.5,"y":0.458,"width":0.188,"height":0.333,"color":"#efa678","lineWidth":1,"start":0.8,"duration":1.5,"text":"","points":[],"motion":"fade"},
 {"type":"rect","x":0.5,"y":0.486,"width":0.203,"height":0.008,"color":"#191a30","lineWidth":1,"start":2.1,"duration":0.4,"text":"","points":[],"motion":"fade"},
 {"type":"rect","x":0.5,"y":0.517,"width":0.203,"height":0.013,"color":"#191a30","lineWidth":1,"start":2.3,"duration":0.4,"text":"","points":[],"motion":"fade"},
 {"type":"rect","x":0.5,"y":0.544,"width":0.203,"height":0.017,"color":"#191a30","lineWidth":1,"start":2.5,"duration":0.4,"text":"","points":[],"motion":"fade"},
 {"type":"path","x":0.5,"y":0.468,"width":0.906,"height":0.175,"color":"#b75b90","lineWidth":3,"start":2.4,"duration":2.0,"text":"","points":[[0.047,0.556],[0.047,0.542],[0.092,0.431],[0.138,0.542],[0.183,0.5],[0.228,0.542],[0.273,0.431],[0.319,0.542],[0.364,0.478],[0.409,0.536],[0.455,0.381],[0.5,0.536],[0.545,0.478],[0.591,0.536],[0.636,0.381],[0.681,0.542],[0.727,0.5],[0.772,0.542],[0.817,0.431],[0.863,0.542],[0.908,0.5],[0.953,0.542],[0.953,0.556]],"motion":"draw"},
 {"type":"rect","x":0.5,"y":0.689,"width":1.0,"height":0.261,"color":"#1d1e38","lineWidth":1,"start":3.4,"duration":0.3,"text":"","points":[],"motion":"fade"},
 {"type":"path","x":0.5,"y":0.556,"width":0.906,"height":0.003,"color":"#b75b90","lineWidth":4,"start":3.6,"duration":1.0,"text":"","points":[[0.047,0.556],[0.953,0.556]],"motion":"draw"},
 {"type":"path","x":0.359,"y":0.689,"width":0.25,"height":0.261,"color":"#6084b4","lineWidth":4,"start":4.6,"duration":1.0,"text":"","points":[[0.484,0.558],[0.234,0.819]],"motion":"draw"},
 {"type":"path","x":0.641,"y":0.689,"width":0.25,"height":0.261,"color":"#6084b4","lineWidth":4,"start":4.8,"duration":1.0,"text":"","points":[[0.516,0.558],[0.766,0.819]],"motion":"draw"},
 {"type":"path","x":0.5,"y":0.597,"width":0.002,"height":0.017,"color":"#efa678","lineWidth":3,"start":6.0,"duration":0.4,"text":"","points":[[0.5,0.589],[0.5,0.597],[0.5,0.606]],"motion":"fade"},
 {"type":"path","x":0.5,"y":0.653,"width":0.002,"height":0.031,"color":"#efa678","lineWidth":5,"start":6.3,"duration":0.4,"text":"","points":[[0.5,0.637],[0.5,0.653],[0.5,0.668]],"motion":"fade"},
 {"type":"path","x":0.5,"y":0.736,"width":0.002,"height":0.05,"color":"#efa678","lineWidth":7,"start":6.6,"duration":0.4,"text":"","points":[[0.5,0.711],[0.5,0.736],[0.5,0.761]],"motion":"fade"},
 {"type":"path","x":0.125,"y":0.722,"width":0.016,"height":0.194,"color":"#0f1022","lineWidth":10,"start":7.2,"duration":0.8,"text":"","points":[[0.117,0.819],[0.123,0.722],[0.133,0.625]],"motion":"draw"},
 {"type":"path","x":0.103,"y":0.615,"width":0.059,"height":0.038,"color":"#0f1022","lineWidth":8,"start":8.0,"duration":0.4,"text":"","points":[[0.133,0.634],[0.106,0.604],[0.074,0.596]],"motion":"fade"},
 {"type":"path","x":0.117,"y":0.599,"width":0.031,"height":0.096,"color":"#0f1022","lineWidth":8,"start":8.15,"duration":0.4,"text":"","points":[[0.133,0.647],[0.123,0.593],[0.102,0.55]],"motion":"fade"},
 {"type":"path","x":0.148,"y":0.599,"width":0.031,"height":0.096,"color":"#0f1022","lineWidth":8,"start":8.3,"duration":0.4,"text":"","points":[[0.133,0.647],[0.154,0.604],[0.164,0.55]],"motion":"fade"},
 {"type":"path","x":0.162,"y":0.615,"width":0.059,"height":0.038,"color":"#0f1022","lineWidth":8,"start":8.45,"duration":0.4,"text":"","points":[[0.133,0.634],[0.164,0.625],[0.192,0.596]],"motion":"fade"},
 {"type":"path","x":0.875,"y":0.722,"width":0.016,"height":0.194,"color":"#0f1022","lineWidth":10,"start":7.8,"duration":0.8,"text":"","points":[[0.867,0.819],[0.873,0.722],[0.883,0.625]],"motion":"draw"},
 {"type":"path","x":0.853,"y":0.615,"width":0.059,"height":0.038,"color":"#0f1022","lineWidth":8,"start":8.6,"duration":0.4,"text":"","points":[[0.883,0.634],[0.856,0.604],[0.824,0.596]],"motion":"fade"},
 {"type":"path","x":0.867,"y":0.599,"width":0.031,"height":0.096,"color":"#0f1022","lineWidth":8,"start":8.75,"duration":0.4,"text":"","points":[[0.883,0.647],[0.873,0.593],[0.852,0.55]],"motion":"fade"},
 {"type":"path","x":0.898,"y":0.599,"width":0.031,"height":0.096,"color":"#0f1022","lineWidth":8,"start":8.9,"duration":0.4,"text":"","points":[[0.883,0.647],[0.904,0.604],[0.914,0.55]],"motion":"fade"},
 {"type":"path","x":0.912,"y":0.615,"width":0.059,"height":0.038,"color":"#0f1022","lineWidth":8,"start":9.05,"duration":0.4,"text":"","points":[[0.883,0.634],[0.914,0.625],[0.942,0.596]],"motion":"fade"},
 {"type":"text","x":0.5,"y":0.164,"width":0.5,"height":0.081,"color":"#efa678","lineWidth":1,"start":9.2,"duration":1.0,"text":"GECE SÜRÜŞÜ","points":[],"motion":"slide"},
 {"type":"text","x":0.5,"y":0.247,"width":0.391,"height":0.036,"color":"#9db8e0","lineWidth":1,"start":9.8,"duration":1.0,"text":"1986 · yolun sonu yok","points":[],"motion":"fade"}
]}
```

## Kabul ölçütleri

Kaçış noktası tutarlı; ufuk sabit; güneş dilimleri net; başlık okunur.
Son kare tek başına bakıldığında bitmiş, dengeli bir resim olmalı; tüm metin okunur ve güvenli alanda.

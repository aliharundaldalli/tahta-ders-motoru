---
name: canvas-oil-paint
description: "Kare Canvas 2D sahnelerini yağlıboya stilinde üretir: koyu zemin üzerinde kalın, opak, yönlü fırça darbeleri; sıcak ışık vurguları. Yağlıboya, impasto, klasik tablo, Van Gogh havası istekleri için kullan."
---

# canvas-oil-paint · Yağlıboya

Bu beceri, Kare'nin Canvas 2D motorunda **Yağlıboya** stilinde, AI'ın JSON olarak döndürdüğü düzenlenebilir sahneler içindir (kod değil, yalnızca sahne verisi; `composed` sahnelerde hazır prosedürel çizim kapalıdır, her şeyi nesnelerle sen kurarsın).

## Amaç ve görünüm

Koyu astarlı tuval üzerinde kalın boya: her alan, yan yana kalın (lineWidth 24–30) yönlü fırça darbeleriyle (zikzak tarama ya da kapsüller) örülür. Işıklı formlar (ay, çiçek) opak, sıcak ve parlak; gölgeler serin. Fırça yönü formu izler: gökyüzü yatay, sap dikey, taç yaprak ışınsal.

## Tuval ve güvenli alan

- Mantıksal tuval **1280×720**. Tüm `x`, `y`, `width`, `height` ve path noktaları **0–1 normalize** değerdir: piksel = x·1280, y·720.
- `x`,`y` nesnenin **merkezidir** (circle, ellipse, rect, text). Path için `x`,`y` noktaların sınır kutusunun merkezi, `width`/`height` kutunun boyu olsun (döndürme ve kalite denetimi bunu kullanır).
- **Güvenli alan:** x .04–.96, y .08–.82. Alt ~100 px (y > .86) altyazı bandıdır; metni ve odak nesnesini oraya koyma. Zemin/gökyüzü gibi arka plan bantları kenara kadar uzanabilir ama 0–1 dışına taşmasın.
- Circle'da `width` çaptır ve 1280 px'e göredir: dikey yarıçap = width·1280/720/2 (ör. width .1 → 128 px çap, y'de ±.089). `height` circle için kullanılmaz, width ile aynı oranı yaz.
- Nesneler dizideki **sırayla** çizilir: önce arka plan, sonra orta plan, en son ön plan ve metin.

## Kompozisyon

- Bir **odak nesnesi** seç ve üçte bir noktalarına (x≈.33/.67, y≈.33/.6) ya da bilinçli olarak merkeze yerleştir; 3–7 ana form + destekleyici ayrıntı.
- Derinlik katmanları: arka plan (büyük, düşük kontrast) → orta plan → ön plan (en koyu/en doygun) → metin. Boş alan bırak; ana formlar çerçeve genişliğinin en az %12'si olsun.
- Ufuk çizgisi y≈.45–.55; gökyüzü ve zemin iki büyük fırça alanı.
- Odak (en büyük ve en parlak form) üçte bir noktasında; ikincil formlar daha küçük ve daha alçak.
- Işık kaynağı (ay/güneş) odağın karşı köşesinde.

## Palet

Arka plan **#252f32**. Tema paleti (sırayla): `#4b6964`, `#bd8353`, `#d4b97c`, `#81798b`.
- `#4b6964` — gökyüzü ve serin alanlar (arka planla kontrast 2.3:1)
- `#bd8353` — sıcak orta ton: tekne, çiçek göbeği (arka planla kontrast 4.3:1)
- `#d4b97c` — ışık: ay, güneş, taç yaprak, metin (arka planla kontrast 7.2:1)
- `#81798b` — su ve gölgeler (arka planla kontrast 3.3:1)
Koyu zemin üzerinde metin için altın `#d4b97c` (7.2:1) ya da krem `#f1e6cf`. Yeşil gerekiyorsa koyu ve doygunluğu düşük tutun (ör. `#3c5650`, `#6f8f6a`).

## Zamanlama ve koreografi

Süre D için ritim: **%0–15** sahneyi kur (arka plan, zemin, büyük renk alanları) · **%15–60** odak nesnesini inşa et (ana çizgiler `draw`, ana formlar `fade`/`slide`) · **%55–85** ayrıntı, vurgu ve etiketler · **%85–100** bekleme: yeni nesne yok, yalnızca 1–4 `float`/`rotate` ortam hareketi.
- Girişleri **kademelendir**: kardeş öğeler arasında .15–.6 sn aralık; aynı anda en fazla 2–3 nesne başlasın. `start` değerlerinin hepsi 0 olmasın.
- Tipik giriş süresi: fade .6–1.5 sn, slide .8–1.2 sn, draw 1.5–4 sn (uzun yol = daha uzun süre). Çok kısa (<.3 sn) girişler sıçrama gibi görünür.
- Son nesne en geç D·0.8'de başlasın; izleyici bitmiş resmi en az 2 sn görsün.
- Büyük alanlar 2–2.5 sn'de `draw` ile boyanır (fırçanın gidip gelmesi görünür).
- Her çiçek: sap → taç yapraklar (.06 sn aralık) → göbek; çiçekler ≈1.6 sn arayla.
- Son vuruşlar (ışık yansımaları) kısa kapsüller.

## Metin

- Türkçe karakterleri doğru yaz (ç ğ ı İ ö ş ü). Başlık en fazla ~5 kelime, etiket 1–3 kelime; bir text nesnesinde en fazla 8 kelime.
- Boyut (`height`): başlık .06–.09 (43–65 px), alt başlık .04–.05, etiket .033–.04 (24–29 px). 20 px altı okunmaz.
- `width` metni sığdıracak kadar geniş olsun (yaklaşık karakter sayısı × yazı boyu × .56 / 1280). Metinler birbiriyle ve yoğun şekillerle çakışmasın.
- Metin rengi arka planla en az 4.5:1 kontrast vermeli: bu stilde metin için **#d4b97c** kullan.

## Nesne sözleşmesi (AI çıktısı — alanlar birebir)

Sahne: `category` (bu beceri: **oil-paint**), `title` (1–160), `duration` (2–60 sn), `seed` (tamsayı), `speed` (.2–3, float/rotate hızını çarpar), `detail` (.25–2), `background` (#RRGGBB), `palette` (2–8 × #RRGGBB), `objects` (en fazla 80; iyi sahne 8–30).
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

- Fırça alanı: bölgeyi zikzak path ile tara (lineWidth 30, aralık .95×lineWidth) — opak impasto görünümü.
- Işık yansıması: aşağı doğru kısalan yatay kapsüller.
- Ayçiçeği: taç yaprak halkası tek path — 12 köşeli yıldız çokgeni (dış yarıçap R, iç .45R) kalın (lineWidth ≈ .24R) çizilir ve `draw` ile çiçek çevresinde açılır; üstüne turuncu göbek circle + koyu ring path.
- Tekne: bükülmüş kalın kapsül gövde + ince direk.

## Sık hatalar (kaçın)

- Nesneyi çerçeve dışına taşırmak (x±width/2, circle'da dikey yarıçap, float için +14 px pay) ya da metni altyazı bandına koymak.
- Bütün nesneleri `start: 0` ile başlatmak; ya da son saniyede yeni nesne getirmek.
- Minik şekiller (width < .015) ve 20 px altı yazılar; ana form çerçevenin %12'sinden küçük.
- 40'tan fazla benzer küçük nesne (parçacık/nokta yığını) — ritim kaybolur, sahne kirlenir. 10–25 yeterli.
- Yanlış alan adları (`radius`, `fill`, `size`, `fontSize`, `delay`, `animation`, `keyframes`) ya da eksik alan; renkleri `rgb()`/isimle yazmak.
- Path'i dolgu sanmak; path `x`,`y` değerini sınır kutusu merkezine koymamak; 2'den az nokta.
- Her şeyi aynı boyutta, ortada üst üste yığmak; odak nesnesi olmayan "dağınık" kompozisyon.
- İnce çizgilerle yağlıboya denemek (suluboya/eskiz gibi durur).
- Koyu zeminde koyu metin; ya da tüm renkleri aynı parlaklıkta kullanmak.

## Örnek 1 — kısa: gece limanı

```json
{"category":"oil-paint","title":"Gece limanı","duration":8,"seed":21,"speed":1,"detail":1,"background":"#252f32","palette":["#4b6964","#bd8353","#d4b97c","#81798b"],"objects":[
 {"type":"path","x":0.5,"y":0.285,"width":0.883,"height":0.306,"color":"#4b6964","lineWidth":30,"start":0.0,"duration":2.4,"text":"","points":[[0.059,0.132],[0.941,0.132],[0.941,0.17],[0.059,0.17],[0.059,0.208],[0.941,0.208],[0.941,0.247],[0.059,0.247],[0.059,0.285],[0.941,0.285],[0.941,0.323],[0.059,0.323],[0.059,0.361],[0.941,0.361],[0.941,0.399],[0.059,0.399],[0.059,0.438],[0.941,0.438]],"motion":"draw"},
 {"type":"circle","x":0.703,"y":0.25,"width":0.086,"height":0.153,"color":"#d4b97c","lineWidth":1,"start":1.6,"duration":1.0,"text":"","points":[],"motion":"fade"},
 {"type":"path","x":0.5,"y":0.688,"width":0.883,"height":0.222,"color":"#81798b","lineWidth":30,"start":2.0,"duration":2.2,"text":"","points":[[0.059,0.576],[0.941,0.576],[0.941,0.613],[0.059,0.613],[0.059,0.65],[0.941,0.65],[0.941,0.688],[0.059,0.688],[0.059,0.725],[0.941,0.725],[0.941,0.762],[0.059,0.762],[0.059,0.799],[0.941,0.799]],"motion":"draw"},
 {"type":"path","x":0.703,"y":0.597,"width":0.109,"height":0.003,"color":"#d4b97c","lineWidth":16,"start":4.2,"duration":0.4,"text":"","points":[[0.648,0.597],[0.703,0.597],[0.758,0.597]],"motion":"fade"},
 {"type":"path","x":0.703,"y":0.653,"width":0.086,"height":0.003,"color":"#d4b97c","lineWidth":14,"start":4.5,"duration":0.4,"text":"","points":[[0.66,0.653],[0.703,0.653],[0.746,0.653]],"motion":"fade"},
 {"type":"path","x":0.703,"y":0.708,"width":0.062,"height":0.003,"color":"#d4b97c","lineWidth":12,"start":4.8,"duration":0.4,"text":"","points":[[0.672,0.708],[0.703,0.708],[0.734,0.708]],"motion":"fade"},
 {"type":"path","x":0.703,"y":0.761,"width":0.039,"height":0.003,"color":"#d4b97c","lineWidth":10,"start":5.1,"duration":0.4,"text":"","points":[[0.684,0.761],[0.703,0.761],[0.723,0.761]],"motion":"fade"},
 {"type":"path","x":0.328,"y":0.59,"width":0.141,"height":0.014,"color":"#bd8353","lineWidth":20,"start":5.0,"duration":0.6,"text":"","points":[[0.258,0.583],[0.328,0.597],[0.398,0.583]],"motion":"fade"},
 {"type":"path","x":0.328,"y":0.486,"width":0.002,"height":0.167,"color":"#d4b97c","lineWidth":5,"start":5.6,"duration":0.6,"text":"","points":[[0.328,0.569],[0.328,0.403]],"motion":"draw"},
 {"type":"path","x":0.362,"y":0.483,"width":0.058,"height":0.132,"color":"#e6d3a8","lineWidth":6,"start":6.0,"duration":0.8,"text":"","points":[[0.333,0.417],[0.391,0.549],[0.333,0.549]],"motion":"draw"},
 {"type":"text","x":0.234,"y":0.236,"width":0.312,"height":0.064,"color":"#d4b97c","lineWidth":1,"start":6.4,"duration":1.0,"text":"Gece limanı","points":[],"motion":"fade"}
]}
```

## Örnek 2 — zengin: ayçiçekleri

```json
{"category":"oil-paint","title":"Ayçiçekleri","duration":15,"seed":33,"speed":1,"detail":1,"background":"#252f32","palette":["#4b6964","#bd8353","#d4b97c","#81798b","#3c5650","#6f8f6a"],"objects":[
 {"type":"path","x":0.5,"y":0.299,"width":0.883,"height":0.361,"color":"#4b6964","lineWidth":30,"start":0.0,"duration":2.5,"text":"","points":[[0.059,0.118],[0.941,0.118],[0.941,0.154],[0.059,0.154],[0.059,0.19],[0.941,0.19],[0.941,0.226],[0.059,0.226],[0.059,0.263],[0.941,0.263],[0.941,0.299],[0.059,0.299],[0.059,0.335],[0.941,0.335],[0.941,0.371],[0.059,0.371],[0.059,0.407],[0.941,0.407],[0.941,0.443],[0.059,0.443],[0.059,0.479],[0.941,0.479]],"motion":"draw"},
 {"type":"circle","x":0.82,"y":0.222,"width":0.094,"height":0.167,"color":"#d4b97c","lineWidth":1,"start":1.0,"duration":1.0,"text":"","points":[],"motion":"fade"},
 {"type":"path","x":0.5,"y":0.715,"width":0.883,"height":0.194,"color":"#3c5650","lineWidth":30,"start":1.2,"duration":2.0,"text":"","points":[[0.059,0.618],[0.941,0.618],[0.941,0.657],[0.059,0.657],[0.059,0.696],[0.941,0.696],[0.941,0.735],[0.059,0.735],[0.059,0.774],[0.941,0.774],[0.941,0.812],[0.059,0.812]],"motion":"draw"},
 {"type":"path","x":0.534,"y":0.618,"width":0.007,"height":0.403,"color":"#6f8f6a","lineWidth":14,"start":3.0,"duration":1.2,"text":"","points":[[0.531,0.417],[0.533,0.457],[0.535,0.497],[0.537,0.537],[0.537,0.578],[0.537,0.618],[0.537,0.658],[0.536,0.699],[0.534,0.739],[0.532,0.779],[0.53,0.819]],"motion":"draw"},
 {"type":"path","x":0.531,"y":0.417,"width":0.128,"height":0.228,"color":"#d4b97c","lineWidth":24.0,"start":4.2,"duration":1.2,"text":"","points":[[0.531,0.303],[0.54,0.356],[0.563,0.318],[0.556,0.372],[0.587,0.36],[0.565,0.4],[0.595,0.417],[0.565,0.433],[0.587,0.474],[0.556,0.461],[0.563,0.515],[0.54,0.477],[0.531,0.531],[0.522,0.477],[0.499,0.515],[0.506,0.461],[0.476,0.474],[0.497,0.433],[0.467,0.417],[0.497,0.4],[0.476,0.36],[0.506,0.372],[0.499,0.318],[0.522,0.356],[0.531,0.303]],"motion":"draw"},
 {"type":"circle","x":0.531,"y":0.417,"width":0.066,"height":0.117,"color":"#bd8353","lineWidth":1,"start":5.0,"duration":0.6,"text":"","points":[],"motion":"fade"},
 {"type":"path","x":0.531,"y":0.417,"width":0.044,"height":0.078,"color":"#3a2a22","lineWidth":6,"start":5.5,"duration":0.8,"text":"","points":[[0.531,0.378],[0.538,0.38],[0.544,0.385],[0.549,0.394],[0.552,0.405],[0.553,0.417],[0.552,0.429],[0.549,0.44],[0.544,0.448],[0.538,0.454],[0.531,0.456],[0.524,0.454],[0.518,0.448],[0.514,0.44],[0.51,0.429],[0.509,0.417],[0.51,0.405],[0.514,0.394],[0.518,0.385],[0.524,0.38],[0.531,0.378]],"motion":"draw"},
 {"type":"path","x":0.299,"y":0.646,"width":0.007,"height":0.347,"color":"#6f8f6a","lineWidth":14,"start":4.6,"duration":1.2,"text":"","points":[[0.297,0.472],[0.299,0.507],[0.301,0.542],[0.302,0.576],[0.303,0.611],[0.303,0.646],[0.303,0.681],[0.301,0.715],[0.3,0.75],[0.298,0.785],[0.296,0.819]],"motion":"draw"},
 {"type":"path","x":0.297,"y":0.472,"width":0.103,"height":0.182,"color":"#d4b97c","lineWidth":19.2,"start":5.8,"duration":1.2,"text":"","points":[[0.297,0.381],[0.304,0.424],[0.323,0.393],[0.317,0.437],[0.341,0.427],[0.324,0.459],[0.348,0.472],[0.324,0.485],[0.341,0.518],[0.317,0.508],[0.323,0.551],[0.304,0.521],[0.297,0.563],[0.29,0.521],[0.271,0.551],[0.277,0.508],[0.252,0.518],[0.27,0.485],[0.246,0.472],[0.27,0.459],[0.252,0.427],[0.277,0.437],[0.271,0.393],[0.29,0.424],[0.297,0.381]],"motion":"draw"},
 {"type":"circle","x":0.297,"y":0.472,"width":0.053,"height":0.093,"color":"#bd8353","lineWidth":1,"start":6.6,"duration":0.6,"text":"","points":[],"motion":"fade"},
 {"type":"path","x":0.297,"y":0.472,"width":0.035,"height":0.062,"color":"#3a2a22","lineWidth":6,"start":7.1,"duration":0.8,"text":"","points":[[0.297,0.441],[0.302,0.443],[0.307,0.447],[0.311,0.454],[0.314,0.463],[0.314,0.472],[0.314,0.482],[0.311,0.491],[0.307,0.497],[0.302,0.502],[0.297,0.503],[0.291,0.502],[0.287,0.497],[0.283,0.491],[0.28,0.482],[0.279,0.472],[0.28,0.463],[0.283,0.454],[0.287,0.447],[0.291,0.443],[0.297,0.441]],"motion":"draw"},
 {"type":"path","x":0.753,"y":0.688,"width":0.007,"height":0.264,"color":"#6f8f6a","lineWidth":14,"start":6.2,"duration":1.2,"text":"","points":[[0.75,0.556],[0.752,0.582],[0.754,0.608],[0.755,0.635],[0.756,0.661],[0.756,0.688],[0.756,0.714],[0.755,0.74],[0.753,0.767],[0.751,0.793],[0.749,0.819]],"motion":"draw"},
 {"type":"path","x":0.75,"y":0.556,"width":0.085,"height":0.15,"color":"#d4b97c","lineWidth":15.8,"start":7.4,"duration":1.2,"text":"","points":[[0.75,0.48],[0.756,0.516],[0.771,0.49],[0.766,0.526],[0.787,0.518],[0.772,0.545],[0.792,0.556],[0.772,0.566],[0.787,0.593],[0.766,0.585],[0.771,0.621],[0.756,0.595],[0.75,0.631],[0.744,0.595],[0.729,0.621],[0.734,0.585],[0.713,0.593],[0.728,0.566],[0.708,0.556],[0.728,0.545],[0.713,0.518],[0.734,0.526],[0.729,0.49],[0.744,0.516],[0.75,0.48]],"motion":"draw"},
 {"type":"circle","x":0.75,"y":0.556,"width":0.043,"height":0.077,"color":"#bd8353","lineWidth":1,"start":8.2,"duration":0.6,"text":"","points":[],"motion":"fade"},
 {"type":"path","x":0.75,"y":0.556,"width":0.029,"height":0.051,"color":"#3a2a22","lineWidth":6,"start":8.7,"duration":0.8,"text":"","points":[[0.75,0.53],[0.754,0.531],[0.758,0.535],[0.762,0.54],[0.764,0.548],[0.764,0.556],[0.764,0.563],[0.762,0.571],[0.758,0.576],[0.754,0.58],[0.75,0.581],[0.746,0.58],[0.742,0.576],[0.738,0.571],[0.736,0.563],[0.736,0.556],[0.736,0.548],[0.738,0.54],[0.742,0.535],[0.746,0.531],[0.75,0.53]],"motion":"draw"},
 {"type":"path","x":0.156,"y":0.722,"width":0.124,"height":0.031,"color":"#81798b","lineWidth":16,"start":9.2,"duration":0.6,"text":"","points":[[0.094,0.738],[0.156,0.722],[0.218,0.707]],"motion":"fade"},
 {"type":"path","x":0.859,"y":0.75,"width":0.109,"height":0.02,"color":"#81798b","lineWidth":14,"start":9.5,"duration":0.6,"text":"","points":[[0.805,0.74],[0.859,0.75],[0.914,0.76]],"motion":"fade"},
 {"type":"text","x":0.195,"y":0.181,"width":0.266,"height":0.064,"color":"#d4b97c","lineWidth":1,"start":10.0,"duration":1.0,"text":"Ayçiçekleri","points":[],"motion":"fade"}
]}
```

## Kabul ölçütleri

Kalın boya hissi görünür; fırça yönü formu izler; sıcak ışık odağı belirgin; metin okunur.
Son kare tek başına bakıldığında bitmiş, dengeli bir resim olmalı; tüm metin okunur ve güvenli alanda.

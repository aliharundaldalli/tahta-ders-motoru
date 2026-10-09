---
name: canvas-watercolor
description: "Kare Canvas 2D sahnelerini suluboya stilinde üretir: saydam üst üste binen lekeler, yumuşak renk alanları, kâğıt dokusu. Suluboya, çiçek, doğa, yumuşak illüstrasyon istekleri için kullan."
---

# canvas-watercolor · Suluboya

Bu beceri, Kare'nin Canvas 2D motorunda **Suluboya** stilinde, AI'ın JSON olarak döndürdüğü düzenlenebilir sahneler içindir (kod değil, yalnızca sahne verisi; `composed` sahnelerde hazır prosedürel çizim kapalıdır, her şeyi nesnelerle sen kurarsın).

## Amaç ve görünüm

Kâğıda emdirilmiş saydam pigment: büyük, yumuşak renk lekeleri (circle/ellipse) arka planda; üstte daha küçük, daha doygun formlar. Kenarlar sert çizgi değil, renk alanıdır. Konturlar ince ve az. Genel his: ferah, ışıklı, nefes alan bir sayfa.

## Tuval ve güvenli alan

- Mantıksal tuval **1280×720**. Tüm `x`, `y`, `width`, `height` ve path noktaları **0–1 normalize** değerdir: piksel = x·1280, y·720.
- `x`,`y` nesnenin **merkezidir** (circle, ellipse, rect, text). Path için `x`,`y` noktaların sınır kutusunun merkezi, `width`/`height` kutunun boyu olsun (döndürme ve kalite denetimi bunu kullanır).
- **Güvenli alan:** x .04–.96, y .08–.82. Alt ~100 px (y > .86) altyazı bandıdır; metni ve odak nesnesini oraya koyma. Zemin/gökyüzü gibi arka plan bantları kenara kadar uzanabilir ama 0–1 dışına taşmasın.
- Circle'da `width` çaptır ve 1280 px'e göredir: dikey yarıçap = width·1280/720/2 (ör. width .1 → 128 px çap, y'de ±.089). `height` circle için kullanılmaz, width ile aynı oranı yaz.
- Nesneler dizideki **sırayla** çizilir: önce arka plan, sonra orta plan, en son ön plan ve metin.

## Kompozisyon

- Bir **odak nesnesi** seç ve üçte bir noktalarına (x≈.33/.67, y≈.33/.6) ya da bilinçli olarak merkeze yerleştir; 3–7 ana form + destekleyici ayrıntı.
- Derinlik katmanları: arka plan (büyük, düşük kontrast) → orta plan → ön plan (en koyu/en doygun) → metin. Boş alan bırak; ana formlar çerçeve genişliğinin en az %12'si olsun.
- 2–3 büyük arka plan lekesi (çap .25–.45) sahnenin "havasını" kurar; odak nesnesi bunlardan birinin önünde durur.
- Odak çiçek/nesne x≈.67, ikincil x≈.33, üçüncüsü daha küçük ve alçakta: boy farkıyla derinlik.
- Lekeler birbirine değebilir (suluboya sızması), ama metin daima boş kâğıt üzerinde.

## Palet

Arka plan **#f6f1e9**. Tema paleti (sırayla): `#392936`, `#c65339`, `#97748c`, `#c9b5c7`, `#e9cb75`.
- `#392936` — metin, sap/kontur, çiçek göbeği (arka planla kontrast 12.1:1)
- `#c65339` — sıcak vurgu: ana çiçek, gün batımı (arka planla kontrast 4.0:1)
- `#97748c` — orta ton: tepeler, ikinci çiçek (arka planla kontrast 3.6:1)
- `#c9b5c7` — büyük arka plan lekeleri, su (arka planla kontrast 1.7:1)
- `#e9cb75` — ışık: güneş, sıcak leke (arka planla kontrast 1.4:1)
Yeşil gerekiyorsa paletin yumuşaklığında bir ton ekle (ör. `#7a8c62`). Kompozit suluboya sahnelerinde motor her nesneyi %72 opaklıkla çizer: üst üste binen lekeler doğal katman verir, ama metni lekelerin üstüne koyma.

## Zamanlama ve koreografi

Süre D için ritim: **%0–15** sahneyi kur (arka plan, zemin, büyük renk alanları) · **%15–60** odak nesnesini inşa et (ana çizgiler `draw`, ana formlar `fade`/`slide`) · **%55–85** ayrıntı, vurgu ve etiketler · **%85–100** bekleme: yeni nesne yok, yalnızca 1–4 `float`/`rotate` ortam hareketi.
- Girişleri **kademelendir**: kardeş öğeler arasında .15–.6 sn aralık; aynı anda en fazla 2–3 nesne başlasın. `start` değerlerinin hepsi 0 olmasın.
- Tipik giriş süresi: fade .6–1.5 sn, slide .8–1.2 sn, draw 1.5–4 sn (uzun yol = daha uzun süre). Çok kısa (<.3 sn) girişler sıçrama gibi görünür.
- Son nesne en geç D·0.8'de başlasın; izleyici bitmiş resmi en az 2 sn görsün.
- İlk 2–3 sn: büyük lekeler yavaş `fade` (2–2.5 sn) ile "ıslak kâğıda" yayılır.
- Sap/gövde `draw` (≈2 sn) → yapraklar → taç yapraklar .1–.15 sn arayla → göbek. Her çiçek bir öncekinden ≈1.5 sn sonra başlar.
- Son bölümde 2–3 küçük yaprak/kuş `float` ile süzülür.

## Metin

- Türkçe karakterleri doğru yaz (ç ğ ı İ ö ş ü). Başlık en fazla ~5 kelime, etiket 1–3 kelime; bir text nesnesinde en fazla 8 kelime.
- Boyut (`height`): başlık .06–.09 (43–65 px), alt başlık .04–.05, etiket .033–.04 (24–29 px). 20 px altı okunmaz.
- `width` metni sığdıracak kadar geniş olsun (yaklaşık karakter sayısı × yazı boyu × .56 / 1280). Metinler birbiriyle ve yoğun şekillerle çakışmasın.
- Metin rengi arka planla en az 4.5:1 kontrast vermeli: bu stilde metin için **#392936** kullan.

## Nesne sözleşmesi (AI çıktısı — alanlar birebir)

Sahne: `category` (bu beceri: **watercolor**), `title` (1–160), `duration` (2–60 sn), `seed` (tamsayı), `speed` (.2–3, float/rotate hızını çarpar), `detail` (.25–2), `background` (#RRGGBB), `palette` (2–8 × #RRGGBB), `objects` (en fazla 80; iyi sahne 8–30).
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

- Taç yaprak = kısa kalın path kapsülü: 3 nokta, lineWidth 16–30, uzunluk ≈ çiçek yarıçapı; merkez etrafında eşit açılarla 5–8 tane.
- Yaprak = hafif bükülmüş kapsül (orta nokta yana kayık), yeşil, sapın ortasına yakın.
- Su yansıması: 3 kısa dalgalı path, aşağı doğru kısalan.
- Gökyüzü/göl: geniş ellipse ve rect lekeleri; aynı renkte iki leke üst üste = koyu katman.

## Sık hatalar (kaçın)

- Nesneyi çerçeve dışına taşırmak (x±width/2, circle'da dikey yarıçap, float için +14 px pay) ya da metni altyazı bandına koymak.
- Bütün nesneleri `start: 0` ile başlatmak; ya da son saniyede yeni nesne getirmek.
- Minik şekiller (width < .015) ve 20 px altı yazılar; ana form çerçevenin %12'sinden küçük.
- 40'tan fazla benzer küçük nesne (parçacık/nokta yığını) — ritim kaybolur, sahne kirlenir. 10–25 yeterli.
- Yanlış alan adları (`radius`, `fill`, `size`, `fontSize`, `delay`, `animation`, `keyframes`) ya da eksik alan; renkleri `rgb()`/isimle yazmak.
- Path'i dolgu sanmak; path `x`,`y` değerini sınır kutusu merkezine koymamak; 2'den az nokta.
- Her şeyi aynı boyutta, ortada üst üste yığmak; odak nesnesi olmayan "dağınık" kompozisyon.
- Lekeleri koyu/opak renklerle yapmak (çamurlu görünür); büyük alanlar açık tonda kalsın.
- Çiçekleri aynı boyda yan yana dizmek; boy ve yükseklik farkı ver.
- Metni lekelerin üstüne yazmak.

## Örnek 1 — kısa: göl kıyısı

```json
{"category":"watercolor","title":"Göl kıyısında sabah","duration":9,"seed":5,"speed":1,"detail":1,"background":"#f6f1e9","palette":["#392936","#c65339","#97748c","#c9b5c7","#e9cb75","#7a8c62"],"objects":[
 {"type":"ellipse","x":0.5,"y":0.292,"width":0.875,"height":0.333,"color":"#c9b5c7","lineWidth":1,"start":0.0,"duration":2.0,"text":"","points":[],"motion":"fade"},
 {"type":"circle","x":0.688,"y":0.319,"width":0.109,"height":0.194,"color":"#e9cb75","lineWidth":1,"start":0.8,"duration":1.5,"text":"","points":[],"motion":"fade"},
 {"type":"ellipse","x":0.297,"y":0.597,"width":0.516,"height":0.222,"color":"#97748c","lineWidth":1,"start":1.6,"duration":1.5,"text":"","points":[],"motion":"fade"},
 {"type":"ellipse","x":0.719,"y":0.618,"width":0.453,"height":0.172,"color":"#97748c","lineWidth":1,"start":2.2,"duration":1.5,"text":"","points":[],"motion":"fade"},
 {"type":"rect","x":0.5,"y":0.736,"width":0.875,"height":0.167,"color":"#c9b5c7","lineWidth":1,"start":2.8,"duration":1.5,"text":"","points":[],"motion":"fade"},
 {"type":"path","x":0.688,"y":0.688,"width":0.094,"height":0.007,"color":"#e9cb75","lineWidth":6,"start":3.6,"duration":1.0,"text":"","points":[[0.641,0.688],[0.648,0.691],[0.656,0.691],[0.664,0.688],[0.672,0.684],[0.68,0.684],[0.688,0.688],[0.695,0.691],[0.703,0.691],[0.711,0.688],[0.719,0.684],[0.727,0.684],[0.734,0.688]],"motion":"draw"},
 {"type":"path","x":0.688,"y":0.722,"width":0.062,"height":0.008,"color":"#e9cb75","lineWidth":6,"start":4.0,"duration":1.0,"text":"","points":[[0.656,0.722],[0.662,0.726],[0.669,0.725],[0.675,0.72],[0.681,0.718],[0.688,0.722],[0.694,0.726],[0.7,0.725],[0.706,0.72],[0.713,0.718],[0.719,0.722]],"motion":"draw"},
 {"type":"path","x":0.688,"y":0.757,"width":0.039,"height":0.006,"color":"#e9cb75","lineWidth":5,"start":4.4,"duration":1.0,"text":"","points":[[0.668,0.757],[0.673,0.76],[0.678,0.757],[0.683,0.754],[0.688,0.757],[0.692,0.76],[0.697,0.757],[0.702,0.754],[0.707,0.757]],"motion":"draw"},
 {"type":"path","x":0.156,"y":0.736,"width":0.008,"height":0.167,"color":"#392936","lineWidth":3,"start":5.0,"duration":1.0,"text":"","points":[[0.156,0.819],[0.152,0.722],[0.16,0.653]],"motion":"draw"},
 {"type":"path","x":0.18,"y":0.75,"width":0.014,"height":0.139,"color":"#392936","lineWidth":3,"start":5.3,"duration":1.0,"text":"","points":[[0.173,0.819],[0.176,0.736],[0.188,0.681]],"motion":"draw"},
 {"type":"text","x":0.258,"y":0.194,"width":0.422,"height":0.064,"color":"#392936","lineWidth":1,"start":6.0,"duration":1.2,"text":"Göl kıyısında sabah","points":[],"motion":"fade"},
 {"type":"path","x":0.48,"y":0.189,"width":0.023,"height":0.017,"color":"#392936","lineWidth":3,"start":6.8,"duration":0.5,"text":"","points":[[0.469,0.181],[0.48,0.197],[0.492,0.181]],"motion":"float"}
],"narration":"Sabahın ilk ışığı gölün üzerine yayılıyor. Kıyıdaki sazlar hafifçe eğilirken suyun yüzeyinde güneşin altın yansıması titriyor."}
```

## Örnek 2 — zengin: üç çiçek (Çiçeklerin dansı)

```json
{"category":"watercolor","title":"Çiçeklerin dansı","duration":16,"seed":42,"speed":1,"detail":1,"background":"#f6f1e9","palette":["#392936","#c65339","#97748c","#c9b5c7","#e9cb75","#7a8c62"],"objects":[
 {"type":"circle","x":0.703,"y":0.375,"width":0.328,"height":0.583,"color":"#c9b5c7","lineWidth":1,"start":0.0,"duration":2.5,"text":"","points":[],"motion":"fade"},
 {"type":"circle","x":0.258,"y":0.375,"width":0.219,"height":0.389,"color":"#e9cb75","lineWidth":1,"start":0.6,"duration":2.5,"text":"","points":[],"motion":"fade"},
 {"type":"ellipse","x":0.5,"y":0.833,"width":0.938,"height":0.139,"color":"#c9b5c7","lineWidth":1,"start":1.0,"duration":2.0,"text":"","points":[],"motion":"fade"},
 {"type":"path","x":0.656,"y":0.59,"width":0.031,"height":0.486,"color":"#7a8c62","lineWidth":5,"start":1.6,"duration":2.0,"text":"","points":[[0.641,0.833],[0.642,0.793],[0.643,0.752],[0.645,0.712],[0.647,0.671],[0.65,0.631],[0.652,0.59],[0.655,0.55],[0.658,0.509],[0.662,0.469],[0.665,0.428],[0.668,0.388],[0.672,0.347]],"motion":"draw"},
 {"type":"path","x":0.623,"y":0.59,"width":0.059,"height":0.038,"color":"#7a8c62","lineWidth":18,"start":3.0,"duration":0.8,"text":"","points":[[0.652,0.609],[0.625,0.577],[0.593,0.571]],"motion":"fade"},
 {"type":"path","x":0.684,"y":0.646,"width":0.05,"height":0.041,"color":"#7a8c62","lineWidth":16,"start":3.3,"duration":0.8,"text":"","points":[[0.659,0.666],[0.681,0.636],[0.708,0.625]],"motion":"fade"},
 {"type":"path","x":0.672,"y":0.275,"width":0.002,"height":0.119,"color":"#c65339","lineWidth":30,"start":3.6,"duration":0.8,"text":"","points":[[0.672,0.334],[0.672,0.275],[0.672,0.215]],"motion":"fade"},
 {"type":"path","x":0.704,"y":0.302,"width":0.052,"height":0.074,"color":"#c65339","lineWidth":30,"start":3.72,"duration":0.8,"text":"","points":[[0.678,0.339],[0.704,0.302],[0.73,0.265]],"motion":"fade"},
 {"type":"path","x":0.712,"y":0.363,"width":0.065,"height":0.026,"color":"#c65339","lineWidth":30,"start":3.84,"duration":0.8,"text":"","points":[[0.679,0.35],[0.712,0.363],[0.744,0.377]],"motion":"fade"},
 {"type":"path","x":0.69,"y":0.413,"width":0.029,"height":0.107,"color":"#c65339","lineWidth":30,"start":3.96,"duration":0.8,"text":"","points":[[0.675,0.359],[0.69,0.413],[0.704,0.466]],"motion":"fade"},
 {"type":"path","x":0.654,"y":0.413,"width":0.029,"height":0.107,"color":"#c65339","lineWidth":30,"start":4.08,"duration":0.8,"text":"","points":[[0.669,0.359],[0.654,0.413],[0.64,0.466]],"motion":"fade"},
 {"type":"path","x":0.632,"y":0.363,"width":0.065,"height":0.026,"color":"#c65339","lineWidth":30,"start":4.2,"duration":0.8,"text":"","points":[[0.665,0.35],[0.632,0.363],[0.6,0.377]],"motion":"fade"},
 {"type":"path","x":0.64,"y":0.302,"width":0.052,"height":0.074,"color":"#c65339","lineWidth":30,"start":4.32,"duration":0.8,"text":"","points":[[0.666,0.339],[0.64,0.302],[0.614,0.265]],"motion":"fade"},
 {"type":"circle","x":0.672,"y":0.347,"width":0.03,"height":0.053,"color":"#392936","lineWidth":1,"start":4.44,"duration":0.6,"text":"","points":[],"motion":"fade"},
 {"type":"path","x":0.352,"y":0.653,"width":0.031,"height":0.361,"color":"#7a8c62","lineWidth":5,"start":3.2,"duration":2.0,"text":"","points":[[0.367,0.833],[0.366,0.803],[0.365,0.773],[0.363,0.743],[0.36,0.713],[0.358,0.683],[0.355,0.653],[0.352,0.623],[0.349,0.593],[0.346,0.562],[0.343,0.532],[0.34,0.502],[0.336,0.472]],"motion":"draw"},
 {"type":"path","x":0.326,"y":0.653,"width":0.059,"height":0.038,"color":"#7a8c62","lineWidth":18,"start":4.6,"duration":0.8,"text":"","points":[[0.355,0.672],[0.328,0.64],[0.296,0.634]],"motion":"fade"},
 {"type":"path","x":0.387,"y":0.708,"width":0.05,"height":0.041,"color":"#7a8c62","lineWidth":16,"start":4.9,"duration":0.8,"text":"","points":[[0.362,0.729],[0.384,0.698],[0.411,0.688]],"motion":"fade"},
 {"type":"path","x":0.336,"y":0.415,"width":0.002,"height":0.094,"color":"#97748c","lineWidth":24.0,"start":5.2,"duration":0.8,"text":"","points":[[0.336,0.462],[0.336,0.415],[0.336,0.368]],"motion":"fade"},
 {"type":"path","x":0.364,"y":0.444,"width":0.046,"height":0.047,"color":"#97748c","lineWidth":24.0,"start":5.32,"duration":0.8,"text":"","points":[[0.341,0.467],[0.364,0.444],[0.387,0.42]],"motion":"fade"},
 {"type":"path","x":0.364,"y":0.501,"width":0.046,"height":0.047,"color":"#97748c","lineWidth":24.0,"start":5.44,"duration":0.8,"text":"","points":[[0.341,0.477],[0.364,0.501],[0.387,0.524]],"motion":"fade"},
 {"type":"path","x":0.336,"y":0.53,"width":0.002,"height":0.094,"color":"#97748c","lineWidth":24.0,"start":5.56,"duration":0.8,"text":"","points":[[0.336,0.483],[0.336,0.53],[0.336,0.576]],"motion":"fade"},
 {"type":"path","x":0.308,"y":0.501,"width":0.046,"height":0.047,"color":"#97748c","lineWidth":24.0,"start":5.68,"duration":0.8,"text":"","points":[[0.331,0.477],[0.308,0.501],[0.285,0.524]],"motion":"fade"},
 {"type":"path","x":0.308,"y":0.444,"width":0.046,"height":0.047,"color":"#97748c","lineWidth":24.0,"start":5.8,"duration":0.8,"text":"","points":[[0.331,0.467],[0.308,0.444],[0.285,0.42]],"motion":"fade"},
 {"type":"circle","x":0.336,"y":0.472,"width":0.023,"height":0.042,"color":"#392936","lineWidth":1,"start":5.92,"duration":0.6,"text":"","points":[],"motion":"fade"},
 {"type":"path","x":0.5,"y":0.715,"width":0.002,"height":0.236,"color":"#7a8c62","lineWidth":5,"start":4.8,"duration":2.0,"text":"","points":[[0.5,0.833],[0.5,0.814],[0.5,0.794],[0.5,0.774],[0.5,0.755],[0.5,0.735],[0.5,0.715],[0.5,0.696],[0.5,0.676],[0.5,0.656],[0.5,0.637],[0.5,0.617],[0.5,0.597]],"motion":"draw"},
 {"type":"path","x":0.47,"y":0.715,"width":0.059,"height":0.038,"color":"#7a8c62","lineWidth":18,"start":6.2,"duration":0.8,"text":"","points":[[0.5,0.734],[0.473,0.702],[0.441,0.696]],"motion":"fade"},
 {"type":"path","x":0.531,"y":0.771,"width":0.05,"height":0.041,"color":"#7a8c62","lineWidth":16,"start":6.5,"duration":0.8,"text":"","points":[[0.506,0.791],[0.529,0.761],[0.556,0.75]],"motion":"fade"},
 {"type":"path","x":0.5,"y":0.555,"width":0.002,"height":0.069,"color":"#e9cb75","lineWidth":17.6,"start":6.8,"duration":0.8,"text":"","points":[[0.5,0.59],[0.5,0.555],[0.5,0.521]],"motion":"fade"},
 {"type":"path","x":0.52,"y":0.576,"width":0.033,"height":0.034,"color":"#e9cb75","lineWidth":17.6,"start":6.92,"duration":0.8,"text":"","points":[[0.504,0.593],[0.52,0.576],[0.537,0.559]],"motion":"fade"},
 {"type":"path","x":0.52,"y":0.618,"width":0.033,"height":0.034,"color":"#e9cb75","lineWidth":17.6,"start":7.04,"duration":0.8,"text":"","points":[[0.504,0.601],[0.52,0.618],[0.537,0.635]],"motion":"fade"},
 {"type":"path","x":0.5,"y":0.639,"width":0.002,"height":0.069,"color":"#e9cb75","lineWidth":17.6,"start":7.16,"duration":0.8,"text":"","points":[[0.5,0.605],[0.5,0.639],[0.5,0.674]],"motion":"fade"},
 {"type":"path","x":0.48,"y":0.618,"width":0.033,"height":0.034,"color":"#e9cb75","lineWidth":17.6,"start":7.28,"duration":0.8,"text":"","points":[[0.496,0.601],[0.48,0.618],[0.463,0.635]],"motion":"fade"},
 {"type":"path","x":0.48,"y":0.576,"width":0.033,"height":0.034,"color":"#e9cb75","lineWidth":17.6,"start":7.4,"duration":0.8,"text":"","points":[[0.496,0.593],[0.48,0.576],[0.463,0.559]],"motion":"fade"},
 {"type":"circle","x":0.5,"y":0.597,"width":0.017,"height":0.031,"color":"#392936","lineWidth":1,"start":7.52,"duration":0.6,"text":"","points":[],"motion":"fade"},
 {"type":"path","x":0.844,"y":0.528,"width":0.018,"height":0.018,"color":"#c65339","lineWidth":14,"start":11.0,"duration":0.8,"text":"","points":[[0.835,0.519],[0.844,0.528],[0.853,0.537]],"motion":"float"},
 {"type":"path","x":0.789,"y":0.653,"width":0.013,"height":0.02,"color":"#c65339","lineWidth":12,"start":11.5,"duration":0.8,"text":"","points":[[0.782,0.663],[0.789,0.653],[0.796,0.643]],"motion":"float"},
 {"type":"path","x":0.203,"y":0.653,"width":0.009,"height":0.026,"color":"#97748c","lineWidth":12,"start":12.0,"duration":0.8,"text":"","points":[[0.199,0.64],[0.203,0.653],[0.207,0.666]],"motion":"float"},
 {"type":"text","x":0.25,"y":0.153,"width":0.406,"height":0.075,"color":"#392936","lineWidth":1,"start":9.0,"duration":1.2,"text":"Çiçeklerin dansı","points":[],"motion":"fade"},
 {"type":"text","x":0.25,"y":0.233,"width":0.359,"height":0.036,"color":"#392936","lineWidth":1,"start":9.8,"duration":1.0,"text":"bahar rüzgârında üç çiçek","points":[],"motion":"fade"}
]}
```

## Kabul ölçütleri

Lekeler yumuşak ve saydam; katmanlar okunuyor; büyüme sırası (sap → yaprak → taç) mantıklı; metin boş kâğıtta.
Son kare tek başına bakıldığında bitmiş, dengeli bir resim olmalı; tüm metin okunur ve güvenli alanda.

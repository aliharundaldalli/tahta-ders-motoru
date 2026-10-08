---
name: canvas-particles
description: "Kare Canvas 2D sahnelerini parçacık stilinde üretir: koyu gecede parlayan noktalar, yıldız tozu, ateşböceği, kıvılcım kümeleri; sınırlı sayıda, ritmik beliren ışıklar. Parçacık, yıldız, ışık, kıvılcım, büyü efekti istekleri için kullan."
---

# canvas-particles · Parçacıklar

Bu beceri, Kare'nin Canvas 2D motorunda **Parçacıklar** stilinde, AI'ın JSON olarak döndürdüğü düzenlenebilir sahneler içindir (kod değil, yalnızca sahne verisi; `composed` sahnelerde hazır prosedürel çizim kapalıdır, her şeyi nesnelerle sen kurarsın).

## Amaç ve görünüm

Koyu, derin bir zeminde küçük (çap 6–14 px) parlak noktalar: altın oran sarmalı, küme ya da rastgele görünen ama dengeli dağılım. Büyük, koyu, yumuşak hale daireleri derinlik verir. Parçacıklar farklı anlarda doğar; bir kısmı süzülür (`float`).

## Tuval ve güvenli alan

- Mantıksal tuval **1280×720**. Tüm `x`, `y`, `width`, `height` ve path noktaları **0–1 normalize** değerdir: piksel = x·1280, y·720.
- `x`,`y` nesnenin **merkezidir** (circle, ellipse, rect, text). Path için `x`,`y` noktaların sınır kutusunun merkezi, `width`/`height` kutunun boyu olsun (döndürme ve kalite denetimi bunu kullanır).
- **Güvenli alan:** x .04–.96, y .08–.82. Alt ~100 px (y > .86) altyazı bandıdır; metni ve odak nesnesini oraya koyma. Zemin/gökyüzü gibi arka plan bantları kenara kadar uzanabilir ama 0–1 dışına taşmasın.
- Circle'da `width` çaptır ve 1280 px'e göredir: dikey yarıçap = width·1280/720/2 (ör. width .1 → 128 px çap, y'de ±.089). `height` circle için kullanılmaz, width ile aynı oranı yaz.
- Nesneler dizideki **sırayla** çizilir: önce arka plan, sonra orta plan, en son ön plan ve metin.

## Kompozisyon

- Bir **odak nesnesi** seç ve üçte bir noktalarına (x≈.33/.67, y≈.33/.6) ya da bilinçli olarak merkeze yerleştir; 3–7 ana form + destekleyici ayrıntı.
- Derinlik katmanları: arka plan (büyük, düşük kontrast) → orta plan → ön plan (en koyu/en doygun) → metin. Boş alan bırak; ana formlar çerçeve genişliğinin en az %12'si olsun.
- 10–25 parçacık yeter. Bir odak (merkez yıldız, ay, ışık kümesi) ve ona doğru seyrelen dağılım.
- Dağılımı "rastgele ama planlı" yap: altın açı sarmalı (a = i·137.5°, r = r0 + i·k) ya da modüler aritmetik ((i·263) mod genişlik).
- Silüet (çimen, ağaç) alt kenarda, koyu; parçacıklar onun üstünde.

## Palet

Arka plan **#15282c**. Tema paleti (sırayla): `#e4c893`, `#6fa5a2`, `#ae9ab6`.
- `#e4c893` — parlak parçacıklar, merkez yıldız, başlık (arka planla kontrast 9.5:1)
- `#6fa5a2` — serin parçacıklar, alt yazı (arka planla kontrast 5.5:1)
- `#ae9ab6` — ikincil parçacıklar, ay (arka planla kontrast 5.9:1)
Parıltı halesi için zemine yakın koyu ton (`#1f3d40`), silüetler için `#2c4a48`, en parlak çekirdek için `#f3e2b0`/`#f8ecd0`.

## Zamanlama ve koreografi

Süre D için ritim: **%0–15** sahneyi kur (arka plan, zemin, büyük renk alanları) · **%15–60** odak nesnesini inşa et (ana çizgiler `draw`, ana formlar `fade`/`slide`) · **%55–85** ayrıntı, vurgu ve etiketler · **%85–100** bekleme: yeni nesne yok, yalnızca 1–4 `float`/`rotate` ortam hareketi.
- Girişleri **kademelendir**: kardeş öğeler arasında .15–.6 sn aralık; aynı anda en fazla 2–3 nesne başlasın. `start` değerlerinin hepsi 0 olmasın.
- Tipik giriş süresi: fade .6–1.5 sn, slide .8–1.2 sn, draw 1.5–4 sn (uzun yol = daha uzun süre). Çok kısa (<.3 sn) girişler sıçrama gibi görünür.
- Son nesne en geç D·0.8'de başlasın; izleyici bitmiş resmi en az 2 sn görsün.
- Önce hale/merkez, sonra parçacıklar .2–.3 sn arayla (doğum dalgası); her biri .5–.8 sn `fade`.
- Parçacıkların yarısı `float` (sürekli canlılık), yarısı sabit.
- Metin parçacıklar tamamlandıktan sonra.

## Metin

- Türkçe karakterleri doğru yaz (ç ğ ı İ ö ş ü). Başlık en fazla ~5 kelime, etiket 1–3 kelime; bir text nesnesinde en fazla 8 kelime.
- Boyut (`height`): başlık .06–.09 (43–65 px), alt başlık .04–.05, etiket .033–.04 (24–29 px). 20 px altı okunmaz.
- `width` metni sığdıracak kadar geniş olsun (yaklaşık karakter sayısı × yazı boyu × .56 / 1280). Metinler birbiriyle ve yoğun şekillerle çakışmasın.
- Metin rengi arka planla en az 4.5:1 kontrast vermeli: bu stilde metin için **#e4c893** kullan.

## Nesne sözleşmesi (AI çıktısı — alanlar birebir)

Sahne: `category` (bu beceri: **particles**), `title` (1–160), `duration` (2–60 sn), `seed` (tamsayı), `speed` (.2–3, float/rotate hızını çarpar), `detail` (.25–2), `background` (#RRGGBB), `palette` (2–8 × #RRGGBB), `objects` (en fazla 80; iyi sahne 8–30).
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

- Parçacık: circle, çap .005–.012 (6–15 px). Daha büyüğü leke gibi görünür.
- Işıltı: aynı noktada büyük koyu hale circle + küçük parlak çekirdek.
- Yıldız ışınları: merkezde kesişen 2 kapsül (lineWidth 4–6), biri `rotate`.
- Çimen: alt kenardan yukarı 2 noktalı ince path'ler, koyu.

## Sık hatalar (kaçın)

- Nesneyi çerçeve dışına taşırmak (x±width/2, circle'da dikey yarıçap, float için +14 px pay) ya da metni altyazı bandına koymak.
- Bütün nesneleri `start: 0` ile başlatmak; ya da son saniyede yeni nesne getirmek.
- Minik şekiller (width < .015) ve 20 px altı yazılar; ana form çerçevenin %12'sinden küçük.
- 40'tan fazla benzer küçük nesne (parçacık/nokta yığını) — ritim kaybolur, sahne kirlenir. 10–25 yeterli.
- Yanlış alan adları (`radius`, `fill`, `size`, `fontSize`, `delay`, `animation`, `keyframes`) ya da eksik alan; renkleri `rgb()`/isimle yazmak.
- Path'i dolgu sanmak; path `x`,`y` değerini sınır kutusu merkezine koymamak; 2'den az nokta.
- Her şeyi aynı boyutta, ortada üst üste yığmak; odak nesnesi olmayan "dağınık" kompozisyon.
- 40+ parçacık (kalabalık, kirli, yavaş) ya da hepsini aynı anda başlatmak.
- Parçacıkları metnin üstüne düşürmek; çok büyük parlak daireler (parçacık değil leke olur).

## Örnek 1 — kısa: yıldız tozu

```json
{"category":"particles","title":"Yıldız tozu","duration":8,"seed":14,"speed":1,"detail":1,"background":"#15282c","palette":["#e4c893","#6fa5a2","#ae9ab6","#1f3d40"],"objects":[
 {"type":"circle","x":0.5,"y":0.5,"width":0.141,"height":0.25,"color":"#1f3d40","lineWidth":1,"start":0.0,"duration":1.5,"text":"","points":[],"motion":"fade"},
 {"type":"path","x":0.5,"y":0.5,"width":0.002,"height":0.167,"color":"#e4c893","lineWidth":6,"start":0.6,"duration":0.6,"text":"","points":[[0.5,0.417],[0.5,0.5],[0.5,0.583]],"motion":"fade"},
 {"type":"path","x":0.5,"y":0.5,"width":0.094,"height":0.003,"color":"#e4c893","lineWidth":6,"start":0.9,"duration":0.6,"text":"","points":[[0.453,0.5],[0.5,0.5],[0.547,0.5]],"motion":"fade"},
 {"type":"path","x":0.5,"y":0.5,"width":0.039,"height":0.069,"color":"#e4c893","lineWidth":4,"start":1.2,"duration":0.6,"text":"","points":[[0.481,0.466],[0.5,0.5],[0.519,0.534]],"motion":"rotate"},
 {"type":"circle","x":0.5,"y":0.5,"width":0.022,"height":0.039,"color":"#f8ecd0","lineWidth":1,"start":1.3,"duration":0.5,"text":"","points":[],"motion":"fade"},
 {"type":"circle","x":0.566,"y":0.5,"width":0.006,"height":0.011,"color":"#e4c893","lineWidth":1,"start":1.6,"duration":0.6,"text":"","points":[],"motion":"float"},
 {"type":"circle","x":0.441,"y":0.562,"width":0.009,"height":0.017,"color":"#6fa5a2","lineWidth":1,"start":1.82,"duration":0.6,"text":"","points":[],"motion":"fade"},
 {"type":"circle","x":0.508,"y":0.393,"width":0.013,"height":0.022,"color":"#ae9ab6","lineWidth":1,"start":2.04,"duration":0.6,"text":"","points":[],"motion":"fade"},
 {"type":"circle","x":0.566,"y":0.598,"width":0.006,"height":0.011,"color":"#e4c893","lineWidth":1,"start":2.26,"duration":0.6,"text":"","points":[],"motion":"fade"},
 {"type":"circle","x":0.379,"y":0.476,"width":0.009,"height":0.017,"color":"#6fa5a2","lineWidth":1,"start":2.48,"duration":0.6,"text":"","points":[],"motion":"float"},
 {"type":"circle","x":0.615,"y":0.416,"width":0.013,"height":0.022,"color":"#ae9ab6","lineWidth":1,"start":2.7,"duration":0.6,"text":"","points":[],"motion":"fade"},
 {"type":"circle","x":0.461,"y":0.667,"width":0.006,"height":0.011,"color":"#e4c893","lineWidth":1,"start":2.92,"duration":0.6,"text":"","points":[],"motion":"fade"},
 {"type":"circle","x":0.424,"y":0.332,"width":0.009,"height":0.017,"color":"#6fa5a2","lineWidth":1,"start":3.14,"duration":0.6,"text":"","points":[],"motion":"fade"},
 {"type":"circle","x":0.668,"y":0.57,"width":0.013,"height":0.022,"color":"#ae9ab6","lineWidth":1,"start":3.36,"duration":0.6,"text":"","points":[],"motion":"float"},
 {"type":"circle","x":0.321,"y":0.584,"width":0.006,"height":0.011,"color":"#e4c893","lineWidth":1,"start":3.58,"duration":0.6,"text":"","points":[],"motion":"fade"},
 {"type":"circle","x":0.588,"y":0.285,"width":0.009,"height":0.017,"color":"#6fa5a2","lineWidth":1,"start":3.8,"duration":0.6,"text":"","points":[],"motion":"fade"},
 {"type":"circle","x":0.566,"y":0.742,"width":0.013,"height":0.022,"color":"#ae9ab6","lineWidth":1,"start":4.02,"duration":0.6,"text":"","points":[],"motion":"fade"},
 {"type":"circle","x":0.296,"y":0.365,"width":0.006,"height":0.011,"color":"#e4c893","lineWidth":1,"start":4.24,"duration":0.6,"text":"","points":[],"motion":"float"},
 {"type":"circle","x":0.745,"y":0.439,"width":0.009,"height":0.017,"color":"#6fa5a2","lineWidth":1,"start":4.46,"duration":0.6,"text":"","points":[],"motion":"fade"},
 {"type":"text","x":0.5,"y":0.153,"width":0.312,"height":0.061,"color":"#e4c893","lineWidth":1,"start":5.2,"duration":1.0,"text":"Yıldız tozu","points":[],"motion":"fade"}
]}
```

## Örnek 2 — zengin: ateşböcekleri

```json
{"category":"particles","title":"Ateşböcekleri","duration":14,"seed":88,"speed":1,"detail":1,"background":"#15282c","palette":["#e4c893","#6fa5a2","#ae9ab6","#1f3d40","#2c4a48","#f3e2b0"],"objects":[
 {"type":"circle","x":0.82,"y":0.208,"width":0.072,"height":0.128,"color":"#2a4448","lineWidth":1,"start":0.0,"duration":1.5,"text":"","points":[],"motion":"fade"},
 {"type":"circle","x":0.82,"y":0.208,"width":0.047,"height":0.083,"color":"#ae9ab6","lineWidth":1,"start":0.6,"duration":1.2,"text":"","points":[],"motion":"fade"},
 {"type":"rect","x":0.5,"y":0.861,"width":1.0,"height":0.056,"color":"#2c4a48","lineWidth":1,"start":0.2,"duration":0.8,"text":"","points":[],"motion":"fade"},
 {"type":"path","x":0.07,"y":0.771,"width":0.002,"height":0.125,"color":"#2c4a48","lineWidth":6,"start":0.4,"duration":0.5,"text":"","points":[[0.07,0.833],[0.07,0.708]],"motion":"draw"},
 {"type":"path","x":0.113,"y":0.743,"width":0.007,"height":0.181,"color":"#2c4a48","lineWidth":6,"start":0.45,"duration":0.5,"text":"","points":[[0.109,0.833],[0.116,0.653]],"motion":"draw"},
 {"type":"path","x":0.152,"y":0.785,"width":0.007,"height":0.097,"color":"#2c4a48","lineWidth":6,"start":0.5,"duration":0.5,"text":"","points":[[0.148,0.833],[0.156,0.736]],"motion":"draw"},
 {"type":"path","x":0.204,"y":0.757,"width":0.002,"height":0.153,"color":"#2c4a48","lineWidth":6,"start":0.55,"duration":0.5,"text":"","points":[[0.203,0.833],[0.204,0.681]],"motion":"draw"},
 {"type":"path","x":0.255,"y":0.792,"width":0.006,"height":0.083,"color":"#2c4a48","lineWidth":6,"start":0.6,"duration":0.5,"text":"","points":[[0.258,0.833],[0.252,0.75]],"motion":"draw"},
 {"type":"path","x":0.324,"y":0.764,"width":0.007,"height":0.139,"color":"#2c4a48","lineWidth":6,"start":0.65,"duration":0.5,"text":"","points":[[0.328,0.833],[0.321,0.694]],"motion":"draw"},
 {"type":"path","x":0.405,"y":0.778,"width":0.002,"height":0.111,"color":"#2c4a48","lineWidth":6,"start":0.7,"duration":0.5,"text":"","points":[[0.406,0.833],[0.404,0.722]],"motion":"draw"},
 {"type":"path","x":0.479,"y":0.75,"width":0.005,"height":0.167,"color":"#2c4a48","lineWidth":6,"start":0.75,"duration":0.5,"text":"","points":[[0.477,0.833],[0.482,0.667]],"motion":"draw"},
 {"type":"path","x":0.551,"y":0.785,"width":0.008,"height":0.097,"color":"#2c4a48","lineWidth":6,"start":0.8,"duration":0.5,"text":"","points":[[0.547,0.833],[0.555,0.736]],"motion":"draw"},
 {"type":"path","x":0.619,"y":0.76,"width":0.003,"height":0.146,"color":"#2c4a48","lineWidth":6,"start":0.85,"duration":0.5,"text":"","points":[[0.617,0.833],[0.62,0.688]],"motion":"draw"},
 {"type":"path","x":0.685,"y":0.774,"width":0.004,"height":0.118,"color":"#2c4a48","lineWidth":6,"start":0.9,"duration":0.5,"text":"","points":[[0.688,0.833],[0.683,0.715]],"motion":"draw"},
 {"type":"path","x":0.746,"y":0.743,"width":0.008,"height":0.181,"color":"#2c4a48","lineWidth":6,"start":0.95,"duration":0.5,"text":"","points":[[0.75,0.833],[0.742,0.653]],"motion":"draw"},
 {"type":"path","x":0.818,"y":0.781,"width":0.004,"height":0.104,"color":"#2c4a48","lineWidth":6,"start":1.0,"duration":0.5,"text":"","points":[[0.82,0.833],[0.816,0.729]],"motion":"draw"},
 {"type":"path","x":0.884,"y":0.753,"width":0.003,"height":0.16,"color":"#2c4a48","lineWidth":6,"start":1.05,"duration":0.5,"text":"","points":[[0.883,0.833],[0.886,0.674]],"motion":"draw"},
 {"type":"path","x":0.934,"y":0.771,"width":0.008,"height":0.125,"color":"#2c4a48","lineWidth":6,"start":1.1,"duration":0.5,"text":"","points":[[0.93,0.833],[0.937,0.708]],"motion":"draw"},
 {"type":"circle","x":0.328,"y":0.556,"width":0.172,"height":0.306,"color":"#1f3d40","lineWidth":1,"start":2.4,"duration":1.5,"text":"","points":[],"motion":"fade"},
 {"type":"circle","x":0.656,"y":0.458,"width":0.188,"height":0.333,"color":"#1f3d40","lineWidth":1,"start":2.8,"duration":1.5,"text":"","points":[],"motion":"fade"},
 {"type":"circle","x":0.363,"y":0.556,"width":0.013,"height":0.022,"color":"#f3e2b0","lineWidth":1,"start":3.0,"duration":0.8,"text":"","points":[],"motion":"fade"},
 {"type":"circle","x":0.63,"y":0.481,"width":0.009,"height":0.017,"color":"#e4c893","lineWidth":1,"start":3.3,"duration":0.8,"text":"","points":[],"motion":"float"},
 {"type":"circle","x":0.333,"y":0.498,"width":0.009,"height":0.017,"color":"#e4c893","lineWidth":1,"start":3.6,"duration":0.8,"text":"","points":[],"motion":"fade"},
 {"type":"circle","x":0.693,"y":0.504,"width":0.013,"height":0.022,"color":"#e4c893","lineWidth":1,"start":3.9,"duration":0.8,"text":"","points":[],"motion":"float"},
 {"type":"circle","x":0.243,"y":0.541,"width":0.009,"height":0.017,"color":"#f3e2b0","lineWidth":1,"start":4.2,"duration":0.8,"text":"","points":[],"motion":"fade"},
 {"type":"circle","x":0.729,"y":0.414,"width":0.009,"height":0.017,"color":"#e4c893","lineWidth":1,"start":4.5,"duration":0.8,"text":"","points":[],"motion":"float"},
 {"type":"circle","x":0.299,"y":0.659,"width":0.013,"height":0.022,"color":"#e4c893","lineWidth":1,"start":4.8,"duration":0.8,"text":"","points":[],"motion":"fade"},
 {"type":"circle","x":0.604,"y":0.364,"width":0.009,"height":0.017,"color":"#e4c893","lineWidth":1,"start":5.1,"duration":0.8,"text":"","points":[],"motion":"float"},
 {"type":"circle","x":0.458,"y":0.601,"width":0.009,"height":0.017,"color":"#f3e2b0","lineWidth":1,"start":5.4,"duration":0.8,"text":"","points":[],"motion":"fade"},
 {"type":"circle","x":0.528,"y":0.508,"width":0.013,"height":0.022,"color":"#e4c893","lineWidth":1,"start":5.7,"duration":0.8,"text":"","points":[],"motion":"float"},
 {"type":"circle","x":0.398,"y":0.415,"width":0.009,"height":0.017,"color":"#e4c893","lineWidth":1,"start":6.0,"duration":0.8,"text":"","points":[],"motion":"fade"},
 {"type":"circle","x":0.705,"y":0.607,"width":0.009,"height":0.017,"color":"#e4c893","lineWidth":1,"start":6.3,"duration":0.8,"text":"","points":[],"motion":"float"},
 {"type":"circle","x":0.164,"y":0.465,"width":0.013,"height":0.022,"color":"#f3e2b0","lineWidth":1,"start":6.6,"duration":0.8,"text":"","points":[],"motion":"fade"},
 {"type":"circle","x":0.842,"y":0.42,"width":0.009,"height":0.017,"color":"#e4c893","lineWidth":1,"start":6.9,"duration":0.8,"text":"","points":[],"motion":"float"},
 {"type":"circle","x":0.204,"y":0.723,"width":0.009,"height":0.017,"color":"#e4c893","lineWidth":1,"start":7.2,"duration":0.8,"text":"","points":[],"motion":"fade"},
 {"type":"circle","x":0.629,"y":0.256,"width":0.013,"height":0.022,"color":"#e4c893","lineWidth":1,"start":7.5,"duration":0.8,"text":"","points":[],"motion":"float"},
 {"type":"circle","x":0.513,"y":0.703,"width":0.009,"height":0.017,"color":"#f3e2b0","lineWidth":1,"start":7.8,"duration":0.8,"text":"","points":[],"motion":"fade"},
 {"type":"circle","x":0.415,"y":0.468,"width":0.009,"height":0.017,"color":"#e4c893","lineWidth":1,"start":8.1,"duration":0.8,"text":"","points":[],"motion":"float"},
 {"type":"text","x":0.234,"y":0.181,"width":0.328,"height":0.064,"color":"#e4c893","lineWidth":1,"start":9.2,"duration":1.0,"text":"Ateşböcekleri","points":[],"motion":"fade"},
 {"type":"text","x":0.234,"y":0.257,"width":0.328,"height":0.036,"color":"#6fa5a2","lineWidth":1,"start":9.8,"duration":1.0,"text":"yaz gecesinde ışık","points":[],"motion":"fade"}
]}
```

## Kabul ölçütleri

Doğumlar ritmik; parçacık sayısı sınırlı; bir ışık odağı var; metin boş alanda okunur.
Son kare tek başına bakıldığında bitmiş, dengeli bir resim olmalı; tüm metin okunur ve güvenli alanda.

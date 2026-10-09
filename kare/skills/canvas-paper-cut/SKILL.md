---
name: canvas-paper-cut
description: "Kare Canvas 2D sahnelerini kâğıt kesme (paper-cut) stilinde üretir: düz renkli opak katmanlar, her katmanın altında aynı yöne düşen gölge, yavaş kayan karton hissi. Kâğıt, kolaj, katmanlı illüstrasyon, çocuk kitabı istekleri için kullan."
---

# canvas-paper-cut · Kâğıt kesme

Bu beceri, Kare'nin Canvas 2D motorunda **Kâğıt kesme** stilinde, AI'ın JSON olarak döndürdüğü düzenlenebilir sahneler içindir (kod değil, yalnızca sahne verisi; `composed` sahnelerde hazır prosedürel çizim kapalıdır, her şeyi nesnelerle sen kurarsın).

## Amaç ve görünüm

Elle kesilmiş renkli karton katmanları: her şekil düz, opak, temiz kenarlı; hemen altında aynı yöne (sağ-alt 8 px) kaymış koyu gölge kopyası. Katmanlar arkadan öne dizilir; yumuşak dalga ve üçgen dağ silüetleri; doku yok.

## Tuval ve güvenli alan

- Mantıksal tuval **1280×720**. Tüm `x`, `y`, `width`, `height` ve path noktaları **0–1 normalize** değerdir: piksel = x·1280, y·720.
- `x`,`y` nesnenin **merkezidir** (circle, ellipse, rect, text). Path için `x`,`y` noktaların sınır kutusunun merkezi, `width`/`height` kutunun boyu olsun (döndürme ve kalite denetimi bunu kullanır).
- **Güvenli alan:** x .04–.96, y .08–.82. Alt ~100 px (y > .86) altyazı bandıdır; metni ve odak nesnesini oraya koyma. Zemin/gökyüzü gibi arka plan bantları kenara kadar uzanabilir ama 0–1 dışına taşmasın.
- Circle'da `width` çaptır ve 1280 px'e göredir: dikey yarıçap = width·1280/720/2 (ör. width .1 → 128 px çap, y'de ±.089). `height` circle için kullanılmaz, width ile aynı oranı yaz.
- Nesneler dizideki **sırayla** çizilir: önce arka plan, sonra orta plan, en son ön plan ve metin.

## Kompozisyon

- Bir **odak nesnesi** seç ve üçte bir noktalarına (x≈.33/.67, y≈.33/.6) ya da bilinçli olarak merkeze yerleştir; 3–7 ana form + destekleyici ayrıntı.
- Derinlik katmanları: arka plan (büyük, düşük kontrast) → orta plan → ön plan (en koyu/en doygun) → metin. Boş alan bırak; ana formlar çerçeve genişliğinin en az %12'si olsun.
- 3–4 katman: uzak (açık-serin) → orta → ön (sıcak, en büyük). Her katman tam genişlik.
- Her nesneden ÖNCE onun gölge kopyası listelenir (x+8 px, y+8 px, gölge renginde).
- Gökyüzü nesneleri (ay, bulut) üst üçte birde; metin karşı köşede.

## Palet

Arka plan **#2e514f**. Tema paleti (sırayla): `#e0b98b`, `#b87566`, `#8bafa0`, `#557d77`.
- `#e0b98b` — ön katman, güneş/ay (arka planla kontrast 4.8:1)
- `#b87566` — küçük vurgu: çatı, ağaç (arka planla kontrast 2.4:1)
- `#8bafa0` — uzak katman, bulut (arka planla kontrast 3.6:1)
- `#557d77` — orta katman (arka planla kontrast 1.9:1)
Gölge rengi `#1f3836` (her katmanın +8 px sağ-alt kopyası). Metin için krem `#f3e8d2` (7.2:1).

## Zamanlama ve koreografi

Süre D için ritim: **%0–15** sahneyi kur (arka plan, zemin, büyük renk alanları) · **%15–60** odak nesnesini inşa et (ana çizgiler `draw`, ana formlar `fade`/`slide`) · **%55–85** ayrıntı, vurgu ve etiketler · **%85–100** bekleme: yeni nesne yok, yalnızca 1–4 `float`/`rotate` ortam hareketi.
- Girişleri **kademelendir**: kardeş öğeler arasında .15–.6 sn aralık; aynı anda en fazla 2–3 nesne başlasın. `start` değerlerinin hepsi 0 olmasın.
- Tipik giriş süresi: fade .6–1.5 sn, slide .8–1.2 sn, draw 1.5–4 sn (uzun yol = daha uzun süre). Çok kısa (<.3 sn) girişler sıçrama gibi görünür.
- Son nesne en geç D·0.8'de başlasın; izleyici bitmiş resmi en az 2 sn görsün.
- Katmanlar arkadan öne `slide` (.9 sn, 1 sn arayla): karton parçaları sahneye yerleştiriliyor gibi. Gölge ve şekil aynı anda (şekil .15 sn sonra).
- Bulut `float`; küçük ayrıntılar (ev, ağaç) en son.

## Metin

- Türkçe karakterleri doğru yaz (ç ğ ı İ ö ş ü). Başlık en fazla ~5 kelime, etiket 1–3 kelime; bir text nesnesinde en fazla 8 kelime.
- Boyut (`height`): başlık .06–.09 (43–65 px), alt başlık .04–.05, etiket .033–.04 (24–29 px). 20 px altı okunmaz.
- `width` metni sığdıracak kadar geniş olsun (yaklaşık karakter sayısı × yazı boyu × .56 / 1280). Metinler birbiriyle ve yoğun şekillerle çakışmasın.
- Metin rengi arka planla en az 4.5:1 kontrast vermeli: bu stilde metin için **#f3e8d2** kullan.

## Nesne sözleşmesi (AI çıktısı — alanlar birebir)

Sahne: `category` (bu beceri: **paper-cut**), `title` (1–160), `duration` (2–60 sn), `seed` (tamsayı), `speed` (.2–3, float/rotate hızını çarpar), `detail` (.25–2), `background` (#RRGGBB), `palette` (2–8 × #RRGGBB), `objects` (en fazla 80; iyi sahne 8–30).
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

- Dalgalı katman üst kenarı: kalın (30) sinüs path (genlik ≤ 12 px) + üst kenarı dalga orta çizgisinde başlayan rect gövde. Genlik lineWidth/2'den küçük olmalı, yoksa boşluk açılır.
- Üçgen dağ: üçgeni yatay zikzak path ile tara (lineWidth 26).
- Gölge kopyası: aynı geometri, tüm noktalara +8 px.
- Ev: rect gövde + yatay kalın kapsül çatı.

## Sık hatalar (kaçın)

- Nesneyi çerçeve dışına taşırmak (x±width/2, circle'da dikey yarıçap, float için +14 px pay) ya da metni altyazı bandına koymak.
- Bütün nesneleri `start: 0` ile başlatmak; ya da son saniyede yeni nesne getirmek.
- Minik şekiller (width < .015) ve 20 px altı yazılar; ana form çerçevenin %12'sinden küçük.
- 40'tan fazla benzer küçük nesne (parçacık/nokta yığını) — ritim kaybolur, sahne kirlenir. 10–25 yeterli.
- Yanlış alan adları (`radius`, `fill`, `size`, `fontSize`, `delay`, `animation`, `keyframes`) ya da eksik alan; renkleri `rgb()`/isimle yazmak.
- Path'i dolgu sanmak; path `x`,`y` değerini sınır kutusu merkezine koymamak; 2'den az nokta.
- Her şeyi aynı boyutta, ortada üst üste yığmak; odak nesnesi olmayan "dağınık" kompozisyon.
- Gölgeleri farklı yönlere düşürmek ya da gölgeyi şekilden SONRA listelemek (şeklin üstünü örter).
- Doku, gradyan, ince kontur eklemek (kâğıt hissini bozar).

## Örnek 1 — kısa: kâğıt dalgalar

```json
{"category":"paper-cut","title":"Kâğıt dalgalar","duration":8,"seed":50,"speed":1,"detail":1,"background":"#2e514f","palette":["#e0b98b","#b87566","#8bafa0","#557d77","#f3e8d2","#1f3836"],"objects":[
 {"type":"circle","x":0.694,"y":0.289,"width":0.109,"height":0.194,"color":"#1f3836","lineWidth":1,"start":0.0,"duration":1.0,"text":"","points":[],"motion":"fade"},
 {"type":"circle","x":0.688,"y":0.278,"width":0.109,"height":0.194,"color":"#e0b98b","lineWidth":1,"start":0.15,"duration":1.0,"text":"","points":[],"motion":"fade"},
 {"type":"path","x":0.506,"y":0.539,"width":0.977,"height":0.033,"color":"#1f3836","lineWidth":30,"start":1.0,"duration":0.9,"text":"","points":[[0.018,0.539],[0.042,0.545],[0.067,0.551],[0.091,0.554],[0.116,0.556],[0.14,0.554],[0.164,0.551],[0.189,0.545],[0.213,0.539],[0.238,0.533],[0.262,0.527],[0.287,0.523],[0.311,0.522],[0.335,0.523],[0.36,0.527],[0.384,0.533],[0.409,0.539],[0.433,0.545],[0.457,0.551],[0.482,0.554],[0.506,0.556],[0.531,0.554],[0.555,0.551],[0.579,0.545],[0.604,0.539],[0.628,0.533],[0.653,0.527],[0.677,0.523],[0.702,0.522],[0.726,0.523],[0.75,0.527],[0.775,0.533],[0.799,0.539],[0.824,0.545],[0.848,0.551],[0.872,0.554],[0.897,0.556],[0.921,0.554],[0.946,0.551],[0.97,0.545],[0.995,0.539]],"motion":"slide"},
 {"type":"rect","x":0.5,"y":0.768,"width":1.0,"height":0.458,"color":"#1f3836","lineWidth":1,"start":1.0,"duration":0.9,"text":"","points":[],"motion":"slide"},
 {"type":"path","x":0.5,"y":0.528,"width":0.977,"height":0.033,"color":"#8bafa0","lineWidth":30,"start":1.15,"duration":0.9,"text":"","points":[[0.012,0.528],[0.036,0.534],[0.061,0.54],[0.085,0.543],[0.109,0.544],[0.134,0.543],[0.158,0.54],[0.183,0.534],[0.207,0.528],[0.231,0.521],[0.256,0.516],[0.28,0.512],[0.305,0.511],[0.329,0.512],[0.354,0.516],[0.378,0.521],[0.402,0.528],[0.427,0.534],[0.451,0.54],[0.476,0.543],[0.5,0.544],[0.524,0.543],[0.549,0.54],[0.573,0.534],[0.598,0.528],[0.622,0.521],[0.646,0.516],[0.671,0.512],[0.695,0.511],[0.72,0.512],[0.744,0.516],[0.769,0.521],[0.793,0.528],[0.817,0.534],[0.842,0.54],[0.866,0.543],[0.891,0.544],[0.915,0.543],[0.939,0.54],[0.964,0.534],[0.988,0.528]],"motion":"slide"},
 {"type":"rect","x":0.5,"y":0.762,"width":1.0,"height":0.469,"color":"#8bafa0","lineWidth":1,"start":1.15,"duration":0.9,"text":"","points":[],"motion":"slide"},
 {"type":"path","x":0.506,"y":0.636,"width":0.977,"height":0.033,"color":"#1f3836","lineWidth":30,"start":2.0,"duration":0.9,"text":"","points":[[0.018,0.651],[0.042,0.647],[0.067,0.642],[0.091,0.636],[0.116,0.629],[0.14,0.624],[0.164,0.62],[0.189,0.619],[0.213,0.621],[0.238,0.625],[0.262,0.63],[0.287,0.637],[0.311,0.643],[0.335,0.648],[0.36,0.652],[0.384,0.653],[0.409,0.651],[0.433,0.647],[0.457,0.642],[0.482,0.636],[0.506,0.629],[0.531,0.624],[0.555,0.62],[0.579,0.619],[0.604,0.621],[0.628,0.625],[0.653,0.63],[0.677,0.637],[0.702,0.643],[0.726,0.648],[0.75,0.652],[0.775,0.653],[0.799,0.651],[0.824,0.647],[0.848,0.642],[0.872,0.636],[0.897,0.629],[0.921,0.624],[0.946,0.62],[0.97,0.619],[0.995,0.621]],"motion":"slide"},
 {"type":"rect","x":0.5,"y":0.817,"width":1.0,"height":0.361,"color":"#1f3836","lineWidth":1,"start":2.0,"duration":0.9,"text":"","points":[],"motion":"slide"},
 {"type":"path","x":0.5,"y":0.625,"width":0.977,"height":0.033,"color":"#557d77","lineWidth":30,"start":2.15,"duration":0.9,"text":"","points":[[0.012,0.64],[0.036,0.636],[0.061,0.631],[0.085,0.624],[0.109,0.618],[0.134,0.613],[0.158,0.609],[0.183,0.608],[0.207,0.61],[0.231,0.614],[0.256,0.619],[0.28,0.626],[0.305,0.632],[0.329,0.637],[0.354,0.641],[0.378,0.642],[0.402,0.64],[0.427,0.636],[0.451,0.631],[0.476,0.624],[0.5,0.618],[0.524,0.613],[0.549,0.609],[0.573,0.608],[0.598,0.61],[0.622,0.614],[0.646,0.619],[0.671,0.626],[0.695,0.632],[0.72,0.637],[0.744,0.641],[0.769,0.642],[0.793,0.64],[0.817,0.636],[0.842,0.631],[0.866,0.624],[0.891,0.618],[0.915,0.613],[0.939,0.609],[0.964,0.608],[0.988,0.61]],"motion":"slide"},
 {"type":"rect","x":0.5,"y":0.811,"width":1.0,"height":0.372,"color":"#557d77","lineWidth":1,"start":2.15,"duration":0.9,"text":"","points":[],"motion":"slide"},
 {"type":"path","x":0.506,"y":0.733,"width":0.977,"height":0.033,"color":"#1f3836","lineWidth":30,"start":3.0,"duration":0.9,"text":"","points":[[0.018,0.721],[0.042,0.718],[0.067,0.717],[0.091,0.718],[0.116,0.722],[0.14,0.728],[0.164,0.735],[0.189,0.741],[0.213,0.746],[0.238,0.749],[0.262,0.75],[0.287,0.748],[0.311,0.744],[0.335,0.739],[0.36,0.732],[0.384,0.726],[0.409,0.721],[0.433,0.718],[0.457,0.717],[0.482,0.718],[0.506,0.722],[0.531,0.728],[0.555,0.735],[0.579,0.741],[0.604,0.746],[0.628,0.749],[0.653,0.75],[0.677,0.748],[0.702,0.744],[0.726,0.739],[0.75,0.732],[0.775,0.726],[0.799,0.721],[0.824,0.718],[0.848,0.717],[0.872,0.718],[0.897,0.722],[0.921,0.728],[0.946,0.735],[0.97,0.741],[0.995,0.746]],"motion":"slide"},
 {"type":"rect","x":0.5,"y":0.865,"width":1.0,"height":0.264,"color":"#1f3836","lineWidth":1,"start":3.0,"duration":0.9,"text":"","points":[],"motion":"slide"},
 {"type":"path","x":0.5,"y":0.722,"width":0.977,"height":0.033,"color":"#e0b98b","lineWidth":30,"start":3.15,"duration":0.9,"text":"","points":[[0.012,0.71],[0.036,0.706],[0.061,0.706],[0.085,0.707],[0.109,0.711],[0.134,0.717],[0.158,0.723],[0.183,0.73],[0.207,0.735],[0.231,0.738],[0.256,0.739],[0.28,0.737],[0.305,0.733],[0.329,0.727],[0.354,0.721],[0.378,0.715],[0.402,0.71],[0.427,0.706],[0.451,0.706],[0.476,0.707],[0.5,0.711],[0.524,0.717],[0.549,0.723],[0.573,0.73],[0.598,0.735],[0.622,0.738],[0.646,0.739],[0.671,0.737],[0.695,0.733],[0.72,0.727],[0.744,0.721],[0.769,0.715],[0.793,0.71],[0.817,0.706],[0.842,0.706],[0.866,0.707],[0.891,0.711],[0.915,0.717],[0.939,0.723],[0.964,0.73],[0.988,0.735]],"motion":"slide"},
 {"type":"rect","x":0.5,"y":0.86,"width":1.0,"height":0.275,"color":"#e0b98b","lineWidth":1,"start":3.15,"duration":0.9,"text":"","points":[],"motion":"slide"},
 {"type":"text","x":0.234,"y":0.208,"width":0.344,"height":0.067,"color":"#f3e8d2","lineWidth":1,"start":4.6,"duration":1.0,"text":"Kâğıt dalgalar","points":[],"motion":"fade"}
]}
```

## Örnek 2 — zengin: kâğıt vadisi

```json
{"category":"paper-cut","title":"Kâğıt vadisi","duration":14,"seed":51,"speed":1,"detail":1,"background":"#2e514f","palette":["#e0b98b","#b87566","#8bafa0","#557d77","#f3e8d2","#1f3836"],"objects":[
 {"type":"circle","x":0.787,"y":0.233,"width":0.087,"height":0.156,"color":"#1f3836","lineWidth":1,"start":0.0,"duration":1.0,"text":"","points":[],"motion":"fade"},
 {"type":"circle","x":0.781,"y":0.222,"width":0.087,"height":0.156,"color":"#e0b98b","lineWidth":1,"start":0.2,"duration":1.0,"text":"","points":[],"motion":"fade"},
 {"type":"ellipse","x":0.264,"y":0.317,"width":0.125,"height":0.072,"color":"#1f3836","lineWidth":1,"start":0.8,"duration":0.8,"text":"","points":[],"motion":"float"},
 {"type":"ellipse","x":0.258,"y":0.306,"width":0.125,"height":0.072,"color":"#8bafa0","lineWidth":1,"start":1.0,"duration":0.8,"text":"","points":[],"motion":"float"},
 {"type":"path","x":0.334,"y":0.636,"width":0.428,"height":0.381,"color":"#1f3836","lineWidth":26,"start":1.8,"duration":0.8,"text":"","points":[[0.334,0.446],[0.334,0.446],[0.35,0.473],[0.319,0.473],[0.304,0.5],[0.365,0.5],[0.38,0.527],[0.289,0.527],[0.273,0.555],[0.396,0.555],[0.411,0.582],[0.258,0.582],[0.243,0.609],[0.426,0.609],[0.441,0.636],[0.227,0.636],[0.212,0.663],[0.457,0.663],[0.472,0.69],[0.197,0.69],[0.181,0.718],[0.487,0.718],[0.503,0.745],[0.166,0.745],[0.151,0.772],[0.518,0.772],[0.533,0.799],[0.136,0.799],[0.12,0.826],[0.548,0.826]],"motion":"draw"},
 {"type":"path","x":0.328,"y":0.625,"width":0.428,"height":0.381,"color":"#8bafa0","lineWidth":26,"start":2.0,"duration":0.8,"text":"","points":[[0.328,0.435],[0.328,0.435],[0.343,0.462],[0.313,0.462],[0.298,0.489],[0.359,0.489],[0.374,0.516],[0.282,0.516],[0.267,0.543],[0.389,0.543],[0.405,0.571],[0.252,0.571],[0.236,0.598],[0.42,0.598],[0.435,0.625],[0.221,0.625],[0.206,0.652],[0.45,0.652],[0.466,0.679],[0.191,0.679],[0.175,0.707],[0.481,0.707],[0.496,0.734],[0.16,0.734],[0.145,0.761],[0.512,0.761],[0.527,0.788],[0.129,0.788],[0.114,0.815],[0.542,0.815]],"motion":"draw"},
 {"type":"path","x":0.678,"y":0.608,"width":0.491,"height":0.436,"color":"#1f3836","lineWidth":26,"start":2.8,"duration":0.8,"text":"","points":[[0.678,0.39],[0.678,0.39],[0.693,0.418],[0.663,0.418],[0.647,0.445],[0.709,0.445],[0.724,0.472],[0.632,0.472],[0.617,0.499],[0.739,0.499],[0.755,0.527],[0.601,0.527],[0.586,0.554],[0.77,0.554],[0.785,0.581],[0.571,0.581],[0.555,0.608],[0.801,0.608],[0.816,0.636],[0.54,0.636],[0.525,0.663],[0.831,0.663],[0.847,0.69],[0.509,0.69],[0.494,0.717],[0.862,0.717],[0.877,0.745],[0.479,0.745],[0.463,0.772],[0.893,0.772],[0.908,0.799],[0.448,0.799],[0.433,0.826],[0.923,0.826]],"motion":"draw"},
 {"type":"path","x":0.672,"y":0.597,"width":0.491,"height":0.436,"color":"#557d77","lineWidth":26,"start":3.0,"duration":0.8,"text":"","points":[[0.672,0.379],[0.672,0.379],[0.687,0.406],[0.657,0.406],[0.641,0.434],[0.703,0.434],[0.718,0.461],[0.626,0.461],[0.611,0.488],[0.733,0.488],[0.749,0.515],[0.595,0.515],[0.58,0.543],[0.764,0.543],[0.779,0.57],[0.565,0.57],[0.549,0.597],[0.795,0.597],[0.81,0.624],[0.534,0.624],[0.519,0.652],[0.825,0.652],[0.841,0.679],[0.503,0.679],[0.488,0.706],[0.856,0.706],[0.871,0.734],[0.473,0.734],[0.457,0.761],[0.887,0.761],[0.902,0.788],[0.442,0.788],[0.427,0.815],[0.917,0.815]],"motion":"draw"},
 {"type":"rect","x":0.506,"y":0.831,"width":0.938,"height":0.056,"color":"#1f3836","lineWidth":1,"start":3.8,"duration":0.6,"text":"","points":[],"motion":"fade"},
 {"type":"rect","x":0.5,"y":0.819,"width":0.938,"height":0.056,"color":"#e0b98b","lineWidth":1,"start":4.0,"duration":0.6,"text":"","points":[],"motion":"fade"},
 {"type":"rect","x":0.5,"y":0.757,"width":0.047,"height":0.069,"color":"#f3e8d2","lineWidth":1,"start":5.0,"duration":0.6,"text":"","points":[],"motion":"fade"},
 {"type":"path","x":0.5,"y":0.711,"width":0.059,"height":0.003,"color":"#b87566","lineWidth":14,"start":5.4,"duration":0.5,"text":"","points":[[0.47,0.711],[0.5,0.711],[0.53,0.711]],"motion":"fade"},
 {"type":"path","x":0.422,"y":0.75,"width":0.026,"height":0.092,"color":"#b87566","lineWidth":14,"start":6.0,"duration":0.5,"text":"","points":[[0.422,0.704],[0.422,0.704],[0.422,0.717],[0.422,0.717],[0.421,0.73],[0.423,0.73],[0.425,0.743],[0.418,0.743],[0.416,0.757],[0.428,0.757],[0.43,0.77],[0.414,0.77],[0.411,0.783],[0.433,0.783],[0.435,0.796],[0.409,0.796]],"motion":"draw"},
 {"type":"path","x":0.578,"y":0.75,"width":0.026,"height":0.092,"color":"#b87566","lineWidth":14,"start":6.3,"duration":0.5,"text":"","points":[[0.578,0.704],[0.578,0.704],[0.578,0.717],[0.578,0.717],[0.577,0.73],[0.579,0.73],[0.582,0.743],[0.575,0.743],[0.572,0.757],[0.584,0.757],[0.586,0.77],[0.57,0.77],[0.567,0.783],[0.589,0.783],[0.591,0.796],[0.565,0.796]],"motion":"draw"},
 {"type":"path","x":0.625,"y":0.75,"width":0.026,"height":0.092,"color":"#b87566","lineWidth":14,"start":6.6,"duration":0.5,"text":"","points":[[0.625,0.704],[0.625,0.704],[0.625,0.717],[0.625,0.717],[0.624,0.73],[0.626,0.73],[0.628,0.743],[0.622,0.743],[0.619,0.757],[0.631,0.757],[0.633,0.77],[0.617,0.77],[0.614,0.783],[0.636,0.783],[0.638,0.796],[0.612,0.796]],"motion":"draw"},
 {"type":"text","x":0.234,"y":0.167,"width":0.312,"height":0.067,"color":"#f3e8d2","lineWidth":1,"start":7.2,"duration":1.0,"text":"Kâğıt vadisi","points":[],"motion":"fade"}
]}
```

## Kabul ölçütleri

Katmanlar ayrışır; gölgeler aynı yönde; kesim kenarları temiz; metin okunur.
Son kare tek başına bakıldığında bitmiş, dengeli bir resim olmalı; tüm metin okunur ve güvenli alanda.

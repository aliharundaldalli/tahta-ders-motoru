---
name: canvas-ink
description: "Kare Canvas 2D sahnelerini mürekkep / sumi-e stilinde üretir: kalın-ince fırça vuruşları, geniş negatif alan, kırmızı mühür vurgusu. Mürekkep, fırça, Uzak Doğu resmi, kaligrafik çizim istekleri için kullan."
---

# canvas-ink · Mürekkep

Bu beceri, Kare'nin Canvas 2D motorunda **Mürekkep** stilinde, AI'ın JSON olarak döndürdüğü düzenlenebilir sahneler içindir (kod değil, yalnızca sahne verisi; `composed` sahnelerde hazır prosedürel çizim kapalıdır, her şeyi nesnelerle sen kurarsın).

## Amaç ve görünüm

Pirinç kâğıdında sumi-e: az sayıda, kendinden emin fırça vuruşu. Kalın kapsüller (12–30) gövde ve yaprak, ince çizgiler (2–4) ayrıntı. Sahnenin en az %40'ı boş kalır; boşluk resmin parçasıdır. Uzak planlar gri-yeşil, yakın planlar koyu.

## Tuval ve güvenli alan

- Mantıksal tuval **1280×720**. Tüm `x`, `y`, `width`, `height` ve path noktaları **0–1 normalize** değerdir: piksel = x·1280, y·720.
- `x`,`y` nesnenin **merkezidir** (circle, ellipse, rect, text). Path için `x`,`y` noktaların sınır kutusunun merkezi, `width`/`height` kutunun boyu olsun (döndürme ve kalite denetimi bunu kullanır).
- **Güvenli alan:** x .04–.96, y .08–.82. Alt ~100 px (y > .86) altyazı bandıdır; metni ve odak nesnesini oraya koyma. Zemin/gökyüzü gibi arka plan bantları kenara kadar uzanabilir ama 0–1 dışına taşmasın.
- Circle'da `width` çaptır ve 1280 px'e göredir: dikey yarıçap = width·1280/720/2 (ör. width .1 → 128 px çap, y'de ±.089). `height` circle için kullanılmaz, width ile aynı oranı yaz.
- Nesneler dizideki **sırayla** çizilir: önce arka plan, sonra orta plan, en son ön plan ve metin.

## Kompozisyon

- Bir **odak nesnesi** seç ve üçte bir noktalarına (x≈.33/.67, y≈.33/.6) ya da bilinçli olarak merkeze yerleştir; 3–7 ana form + destekleyici ayrıntı.
- Derinlik katmanları: arka plan (büyük, düşük kontrast) → orta plan → ön plan (en koyu/en doygun) → metin. Boş alan bırak; ana formlar çerçeve genişliğinin en az %12'si olsun.
- Asimetrik: ana form bir yanda (x≈.35–.45), metin ve mühür diğer yanda.
- Derinlik: uzak sırt (ince, gri) → sis bandı → yakın kütle (koyu, büyük).
- Sıçrama noktaları 2–4 tane, ana formun yanında; her boşluğu noktayla doldurma.

## Palet

Arka plan **#eee9dc**. Tema paleti (sırayla): `#233b42`, `#8c4c3e`, `#8a9a87`.
- `#233b42` — ana fırça vuruşu, metin (arka planla kontrast 9.8:1)
- `#8c4c3e` — tek kırmızı vurgu: mühür, güneş (arka planla kontrast 5.4:1)
- `#8a9a87` — uzak planlar, sulandırılmış ton (arka planla kontrast 2.5:1)
Kırmızı yalnızca bir-iki küçük nokta: mühür kare ya da güneş. Sisi arka planın biraz açığı (ör. `#f6f2e8`) ile yap.

## Zamanlama ve koreografi

Süre D için ritim: **%0–15** sahneyi kur (arka plan, zemin, büyük renk alanları) · **%15–60** odak nesnesini inşa et (ana çizgiler `draw`, ana formlar `fade`/`slide`) · **%55–85** ayrıntı, vurgu ve etiketler · **%85–100** bekleme: yeni nesne yok, yalnızca 1–4 `float`/`rotate` ortam hareketi.
- Girişleri **kademelendir**: kardeş öğeler arasında .15–.6 sn aralık; aynı anda en fazla 2–3 nesne başlasın. `start` değerlerinin hepsi 0 olmasın.
- Tipik giriş süresi: fade .6–1.5 sn, slide .8–1.2 sn, draw 1.5–4 sn (uzun yol = daha uzun süre). Çok kısa (<.3 sn) girişler sıçrama gibi görünür.
- Son nesne en geç D·0.8'de başlasın; izleyici bitmiş resmi en az 2 sn görsün.
- Her vuruş kısa ve kararlı: kapsül/segment `draw` .4–.6 sn, .3 sn arayla (fırça ritmi).
- Büyük mürekkep kütlesi zikzak `draw` ile 2.5–3 sn'de yayılır.
- Mühür en son, küçük `fade`.

## Metin

- Türkçe karakterleri doğru yaz (ç ğ ı İ ö ş ü). Başlık en fazla ~5 kelime, etiket 1–3 kelime; bir text nesnesinde en fazla 8 kelime.
- Boyut (`height`): başlık .06–.09 (43–65 px), alt başlık .04–.05, etiket .033–.04 (24–29 px). 20 px altı okunmaz.
- `width` metni sığdıracak kadar geniş olsun (yaklaşık karakter sayısı × yazı boyu × .56 / 1280). Metinler birbiriyle ve yoğun şekillerle çakışmasın.
- Metin rengi arka planla en az 4.5:1 kontrast vermeli: bu stilde metin için **#233b42** kullan.

## Nesne sözleşmesi (AI çıktısı — alanlar birebir)

Sahne: `category` (bu beceri: **ink**), `title` (1–160), `duration` (2–60 sn), `seed` (tamsayı), `speed` (.2–3, float/rotate hızını çarpar), `detail` (.25–2), `background` (#RRGGBB), `palette` (2–8 × #RRGGBB), `objects` (en fazla 80; iyi sahne 8–30).
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

- Bambu gövdesi: aralarında küçük boşluk bırakılmış kalın dikey segment path'ler (boğumlar).
- Yaprak: bükülmüş kapsül (3 nokta, orta nokta yana kayık), lineWidth 10–14.
- Dağ kütlesi: siluet çokgenini dikey zikzakla tara (lineWidth 24–28) → mürekkep yıkaması.
- Sis: geniş, basık, arka plandan biraz açık ellipse; dağların alt kısmını örter.
- Mühür: 30–44 px kırmızı rect.

## Sık hatalar (kaçın)

- Nesneyi çerçeve dışına taşırmak (x±width/2, circle'da dikey yarıçap, float için +14 px pay) ya da metni altyazı bandına koymak.
- Bütün nesneleri `start: 0` ile başlatmak; ya da son saniyede yeni nesne getirmek.
- Minik şekiller (width < .015) ve 20 px altı yazılar; ana form çerçevenin %12'sinden küçük.
- 40'tan fazla benzer küçük nesne (parçacık/nokta yığını) — ritim kaybolur, sahne kirlenir. 10–25 yeterli.
- Yanlış alan adları (`radius`, `fill`, `size`, `fontSize`, `delay`, `animation`, `keyframes`) ya da eksik alan; renkleri `rgb()`/isimle yazmak.
- Path'i dolgu sanmak; path `x`,`y` değerini sınır kutusu merkezine koymamak; 2'den az nokta.
- Her şeyi aynı boyutta, ortada üst üste yığmak; odak nesnesi olmayan "dağınık" kompozisyon.
- Tüm vuruşları aynı kalınlıkta yapmak; sahneyi sıçrama noktalarıyla doldurmak.
- Kırmızıyı büyük alanlarda kullanmak.

## Örnek 1 — kısa: bambu

```json
{"category":"ink","title":"Bambu","duration":8,"seed":8,"speed":1,"detail":1,"background":"#eee9dc","palette":["#233b42","#8c4c3e","#8a9a87"],"objects":[
 {"type":"path","x":0.47,"y":0.75,"width":0.002,"height":0.139,"color":"#8a9a87","lineWidth":12,"start":0.0,"duration":0.5,"text":"","points":[[0.469,0.819],[0.471,0.681]],"motion":"draw"},
 {"type":"path","x":0.472,"y":0.6,"width":0.002,"height":0.139,"color":"#8a9a87","lineWidth":12,"start":0.3,"duration":0.5,"text":"","points":[[0.471,0.669],[0.474,0.531]],"motion":"draw"},
 {"type":"path","x":0.475,"y":0.45,"width":0.002,"height":0.139,"color":"#8a9a87","lineWidth":12,"start":0.6,"duration":0.5,"text":"","points":[[0.474,0.519],[0.476,0.381]],"motion":"draw"},
 {"type":"path","x":0.407,"y":0.75,"width":0.002,"height":0.139,"color":"#233b42","lineWidth":15,"start":0.6,"duration":0.5,"text":"","points":[[0.406,0.819],[0.409,0.681]],"motion":"draw"},
 {"type":"path","x":0.41,"y":0.6,"width":0.002,"height":0.139,"color":"#233b42","lineWidth":15,"start":0.9,"duration":0.5,"text":"","points":[[0.409,0.669],[0.411,0.531]],"motion":"draw"},
 {"type":"path","x":0.412,"y":0.45,"width":0.002,"height":0.139,"color":"#233b42","lineWidth":15,"start":1.2,"duration":0.5,"text":"","points":[[0.411,0.519],[0.414,0.381]],"motion":"draw"},
 {"type":"path","x":0.415,"y":0.3,"width":0.002,"height":0.139,"color":"#233b42","lineWidth":15,"start":1.5,"duration":0.5,"text":"","points":[[0.414,0.369],[0.416,0.231]],"motion":"draw"},
 {"type":"path","x":0.461,"y":0.347,"width":0.085,"height":0.07,"color":"#233b42","lineWidth":13,"start":2.6,"duration":0.5,"text":"","points":[[0.418,0.382],[0.458,0.337],[0.503,0.312]],"motion":"fade"},
 {"type":"path","x":0.367,"y":0.417,"width":0.078,"height":0.065,"color":"#233b42","lineWidth":12,"start":2.9,"duration":0.5,"text":"","points":[[0.406,0.449],[0.37,0.407],[0.328,0.384]],"motion":"fade"},
 {"type":"path","x":0.469,"y":0.514,"width":0.073,"height":0.048,"color":"#233b42","lineWidth":11,"start":3.2,"duration":0.5,"text":"","points":[[0.432,0.49],[0.47,0.506],[0.505,0.538]],"motion":"fade"},
 {"type":"path","x":0.516,"y":0.278,"width":0.054,"height":0.08,"color":"#8a9a87","lineWidth":10,"start":3.5,"duration":0.5,"text":"","points":[[0.489,0.318],[0.513,0.271],[0.543,0.238]],"motion":"fade"},
 {"type":"circle","x":0.562,"y":0.417,"width":0.011,"height":0.019,"color":"#233b42","lineWidth":1,"start":4.0,"duration":0.3,"text":"","points":[],"motion":"fade"},
 {"type":"circle","x":0.582,"y":0.442,"width":0.006,"height":0.011,"color":"#233b42","lineWidth":1,"start":4.1,"duration":0.3,"text":"","points":[],"motion":"fade"},
 {"type":"circle","x":0.547,"y":0.458,"width":0.008,"height":0.014,"color":"#233b42","lineWidth":1,"start":4.2,"duration":0.3,"text":"","points":[],"motion":"fade"},
 {"type":"text","x":0.703,"y":0.417,"width":0.234,"height":0.083,"color":"#233b42","lineWidth":1,"start":4.6,"duration":1.0,"text":"Bambu","points":[],"motion":"fade"},
 {"type":"text","x":0.703,"y":0.514,"width":0.312,"height":0.036,"color":"#233b42","lineWidth":1,"start":5.2,"duration":1.0,"text":"rüzgârda eğilir, kırılmaz","points":[],"motion":"fade"},
 {"type":"rect","x":0.828,"y":0.417,"width":0.031,"height":0.056,"color":"#8c4c3e","lineWidth":1,"start":5.8,"duration":0.6,"text":"","points":[],"motion":"fade"}
]}
```

## Örnek 2 — zengin: sisli dağlar

```json
{"category":"ink","title":"Sisli dağlar","duration":14,"seed":77,"speed":1,"detail":1,"background":"#eee9dc","palette":["#233b42","#8c4c3e","#8a9a87"],"objects":[
 {"type":"circle","x":0.766,"y":0.236,"width":0.066,"height":0.117,"color":"#8c4c3e","lineWidth":1,"start":0.2,"duration":1.5,"text":"","points":[],"motion":"fade"},
 {"type":"path","x":0.5,"y":0.512,"width":0.844,"height":0.143,"color":"#8a9a87","lineWidth":8,"start":0.8,"duration":3.0,"text":"","points":[[0.078,0.583],[0.078,0.569],[0.12,0.539],[0.163,0.513],[0.205,0.506],[0.247,0.526],[0.289,0.574],[0.331,0.531],[0.373,0.473],[0.416,0.44],[0.458,0.45],[0.5,0.506],[0.542,0.573],[0.584,0.501],[0.627,0.463],[0.669,0.466],[0.711,0.501],[0.753,0.553],[0.795,0.565],[0.838,0.533],[0.88,0.526],[0.922,0.538]],"motion":"draw"},
 {"type":"ellipse","x":0.5,"y":0.597,"width":0.844,"height":0.072,"color":"#f6f2e8","lineWidth":1,"start":3.2,"duration":1.5,"text":"","points":[],"motion":"fade"},
 {"type":"path","x":0.68,"y":0.669,"width":0.464,"height":0.215,"color":"#8a9a87","lineWidth":26,"start":3.8,"duration":2.6,"text":"","points":[[0.448,0.777],[0.448,0.777],[0.466,0.777],[0.466,0.777],[0.483,0.776],[0.483,0.776],[0.501,0.774],[0.501,0.774],[0.519,0.771],[0.519,0.771],[0.537,0.768],[0.537,0.768],[0.555,0.763],[0.555,0.763],[0.573,0.76],[0.573,0.751],[0.59,0.732],[0.59,0.76],[0.608,0.76],[0.608,0.71],[0.626,0.684],[0.626,0.76],[0.644,0.76],[0.644,0.656],[0.662,0.628],[0.662,0.76],[0.68,0.76],[0.68,0.602],[0.698,0.58],[0.698,0.76],[0.715,0.76],[0.715,0.566],[0.733,0.562],[0.733,0.76],[0.751,0.76],[0.751,0.566],[0.769,0.578],[0.769,0.76],[0.787,0.76],[0.787,0.598],[0.805,0.624],[0.805,0.76],[0.822,0.76],[0.822,0.652],[0.84,0.68],[0.84,0.76],[0.858,0.76],[0.858,0.707],[0.876,0.73],[0.876,0.76],[0.894,0.76],[0.894,0.749],[0.912,0.766],[0.912,0.766]],"motion":"draw"},
 {"type":"path","x":0.281,"y":0.588,"width":0.384,"height":0.345,"color":"#233b42","lineWidth":28,"start":5.0,"duration":3.0,"text":"","points":[[0.089,0.712],[0.089,0.758],[0.108,0.758],[0.108,0.67],[0.128,0.643],[0.128,0.758],[0.147,0.758],[0.147,0.623],[0.166,0.596],[0.166,0.758],[0.185,0.758],[0.185,0.552],[0.204,0.493],[0.204,0.758],[0.224,0.758],[0.224,0.441],[0.243,0.416],[0.243,0.758],[0.262,0.758],[0.262,0.427],[0.281,0.462],[0.281,0.758],[0.3,0.758],[0.3,0.499],[0.32,0.523],[0.32,0.758],[0.339,0.758],[0.339,0.541],[0.358,0.569],[0.358,0.758],[0.377,0.758],[0.377,0.616],[0.397,0.675],[0.397,0.758],[0.416,0.758],[0.416,0.728],[0.435,0.759],[0.435,0.759],[0.454,0.761],[0.454,0.761],[0.473,0.757],[0.473,0.758]],"motion":"draw"},
 {"type":"path","x":0.656,"y":0.799,"width":0.062,"height":0.008,"color":"#233b42","lineWidth":8,"start":8.4,"duration":0.6,"text":"","points":[[0.625,0.794],[0.656,0.803],[0.688,0.794]],"motion":"fade"},
 {"type":"path","x":0.664,"y":0.765,"width":0.002,"height":0.042,"color":"#233b42","lineWidth":4,"start":8.8,"duration":0.4,"text":"","points":[[0.664,0.786],[0.664,0.744]],"motion":"draw"},
 {"type":"path","x":0.676,"y":0.764,"width":0.055,"height":0.083,"color":"#233b42","lineWidth":2,"start":9.0,"duration":0.5,"text":"","points":[[0.648,0.806],[0.703,0.722]],"motion":"draw"},
 {"type":"path","x":0.664,"y":0.819,"width":0.109,"height":0.006,"color":"#8a9a87","lineWidth":2,"start":9.3,"duration":0.8,"text":"","points":[[0.609,0.819],[0.616,0.822],[0.623,0.821],[0.63,0.818],[0.637,0.817],[0.644,0.818],[0.65,0.821],[0.657,0.822],[0.664,0.819],[0.671,0.817],[0.678,0.817],[0.685,0.821],[0.691,0.822],[0.698,0.821],[0.705,0.817],[0.712,0.817],[0.719,0.819]],"motion":"draw"},
 {"type":"path","x":0.556,"y":0.312,"width":0.019,"height":0.014,"color":"#233b42","lineWidth":3,"start":9.8,"duration":0.5,"text":"","points":[[0.547,0.306],[0.556,0.319],[0.566,0.306]],"motion":"draw"},
 {"type":"path","x":0.586,"y":0.346,"width":0.016,"height":0.011,"color":"#233b42","lineWidth":3,"start":10.1,"duration":0.5,"text":"","points":[[0.578,0.34],[0.586,0.351],[0.594,0.34]],"motion":"draw"},
 {"type":"text","x":0.234,"y":0.181,"width":0.297,"height":0.067,"color":"#233b42","lineWidth":1,"start":10.6,"duration":1.0,"text":"Sisli dağlar","points":[],"motion":"fade"},
 {"type":"rect","x":0.391,"y":0.181,"width":0.023,"height":0.042,"color":"#8c4c3e","lineWidth":1,"start":11.2,"duration":0.5,"text":"","points":[],"motion":"fade"}
]}
```

## Kabul ölçütleri

Kalınlık geçişleri kontrollü; negatif alan korunmuş; vuruş ritmi görünür; tek kırmızı vurgu.
Son kare tek başına bakıldığında bitmiş, dengeli bir resim olmalı; tüm metin okunur ve güvenli alanda.

---
name: canvas-charcoal
description: "Kare Canvas 2D sahnelerini kömür (charcoal) çizim stilinde üretir: geniş sürtme lekeleri, güçlü koyu-açık zıtlığı, silgiyle açılmış ışık. Kömür, dramatik ışık, fırtına, gece, portre havası istekleri için kullan."
---

# canvas-charcoal · Kömür

Bu beceri, Kare'nin Canvas 2D motorunda **Kömür** stilinde, AI'ın JSON olarak döndürdüğü düzenlenebilir sahneler içindir (kod değil, yalnızca sahne verisi; `composed` sahnelerde hazır prosedürel çizim kapalıdır, her şeyi nesnelerle sen kurarsın).

## Amaç ve görünüm

Kömür kalem: geniş, yumuşak kenarlı koyu kütleler (büyük ellipse/circle ve kalın zikzak sürtmeler), içinden silgiyle açılmış parlak ışık alanları ve kapsül şeklinde açık izler. Sert çizgi az; kontur yalnızca odakta.

## Tuval ve güvenli alan

- Mantıksal tuval **1280×720**. Tüm `x`, `y`, `width`, `height` ve path noktaları **0–1 normalize** değerdir: piksel = x·1280, y·720.
- `x`,`y` nesnenin **merkezidir** (circle, ellipse, rect, text). Path için `x`,`y` noktaların sınır kutusunun merkezi, `width`/`height` kutunun boyu olsun (döndürme ve kalite denetimi bunu kullanır).
- **Güvenli alan:** x .04–.96, y .08–.82. Alt ~100 px (y > .86) altyazı bandıdır; metni ve odak nesnesini oraya koyma. Zemin/gökyüzü gibi arka plan bantları kenara kadar uzanabilir ama 0–1 dışına taşmasın.
- Circle'da `width` çaptır ve 1280 px'e göredir: dikey yarıçap = width·1280/720/2 (ör. width .1 → 128 px çap, y'de ±.089). `height` circle için kullanılmaz, width ile aynı oranı yaz.
- Nesneler dizideki **sırayla** çizilir: önce arka plan, sonra orta plan, en son ön plan ve metin.

## Kompozisyon

- Bir **odak nesnesi** seç ve üçte bir noktalarına (x≈.33/.67, y≈.33/.6) ya da bilinçli olarak merkeze yerleştir; 3–7 ana form + destekleyici ayrıntı.
- Derinlik katmanları: arka plan (büyük, düşük kontrast) → orta plan → ön plan (en koyu/en doygun) → metin. Boş alan bırak; ana formlar çerçeve genişliğinin en az %12'si olsun.
- Değer planı: büyük koyu alan + tek bir parlak odak (alev, fener ışığı). Göz en parlak noktaya gider; onu üçte bir noktasına koy.
- Kenarların bir kısmı "kayıp" kalsın: sürtme lekeleri birbirine karışır.

## Palet

Arka plan **#e6ddcd**. Tema paleti (sırayla): `#282622`, `#6a6358`, `#9f9381`.
- `#282622` — en koyu kütleler, kontur, metin (arka planla kontrast 11.2:1)
- `#6a6358` — orta değer sürtmeler (arka planla kontrast 4.4:1)
- `#9f9381` — açık sis/gökyüzü sürtmeleri (arka planla kontrast 2.2:1)
"Silgi" ışığı için arka plandan açık kâğıt tonları ekle: `#f2ead9`, `#f4ede0`. Işık bu açık tonlar, gölge koyu kömürdür.

## Zamanlama ve koreografi

Süre D için ritim: **%0–15** sahneyi kur (arka plan, zemin, büyük renk alanları) · **%15–60** odak nesnesini inşa et (ana çizgiler `draw`, ana formlar `fade`/`slide`) · **%55–85** ayrıntı, vurgu ve etiketler · **%85–100** bekleme: yeni nesne yok, yalnızca 1–4 `float`/`rotate` ortam hareketi.
- Girişleri **kademelendir**: kardeş öğeler arasında .15–.6 sn aralık; aynı anda en fazla 2–3 nesne başlasın. `start` değerlerinin hepsi 0 olmasın.
- Tipik giriş süresi: fade .6–1.5 sn, slide .8–1.2 sn, draw 1.5–4 sn (uzun yol = daha uzun süre). Çok kısa (<.3 sn) girişler sıçrama gibi görünür.
- Son nesne en geç D·0.8'de başlasın; izleyici bitmiş resmi en az 2 sn görsün.
- Önce büyük sürtmeler (2 sn `fade`), sonra koyu kütleler `draw`, en son ışık (silgi izleri ve parlak alan) — ışığın "açılması" sahnenin doruğudur.
- Alev gibi tek bir öğe `float` ile titreşebilir.

## Metin

- Türkçe karakterleri doğru yaz (ç ğ ı İ ö ş ü). Başlık en fazla ~5 kelime, etiket 1–3 kelime; bir text nesnesinde en fazla 8 kelime.
- Boyut (`height`): başlık .06–.09 (43–65 px), alt başlık .04–.05, etiket .033–.04 (24–29 px). 20 px altı okunmaz.
- `width` metni sığdıracak kadar geniş olsun (yaklaşık karakter sayısı × yazı boyu × .56 / 1280). Metinler birbiriyle ve yoğun şekillerle çakışmasın.
- Metin rengi arka planla en az 4.5:1 kontrast vermeli: bu stilde metin için **#282622** kullan.

## Nesne sözleşmesi (AI çıktısı — alanlar birebir)

Sahne: `category` (bu beceri: **charcoal**), `title` (1–160), `duration` (2–60 sn), `seed` (tamsayı), `speed` (.2–3, float/rotate hızını çarpar), `detail` (.25–2), `background` (#RRGGBB), `palette` (2–8 × #RRGGBB), `objects` (en fazla 80; iyi sahne 8–30).
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

- Sürtme: kalın (24–30) kısa kapsüller ya da bölge taraması (zikzak, aralık .9×lineWidth).
- Silgi izi: açık kâğıt renginde kapsül (lineWidth 6–10) koyu alanın üstüne.
- Işık hüzmesi: uzun açık kapsül (lineWidth 18–24) ışık kaynağından çıkar.
- Kontur: odak nesnesinde 2–3 px koyu path.

## Sık hatalar (kaçın)

- Nesneyi çerçeve dışına taşırmak (x±width/2, circle'da dikey yarıçap, float için +14 px pay) ya da metni altyazı bandına koymak.
- Bütün nesneleri `start: 0` ile başlatmak; ya da son saniyede yeni nesne getirmek.
- Minik şekiller (width < .015) ve 20 px altı yazılar; ana form çerçevenin %12'sinden küçük.
- 40'tan fazla benzer küçük nesne (parçacık/nokta yığını) — ritim kaybolur, sahne kirlenir. 10–25 yeterli.
- Yanlış alan adları (`radius`, `fill`, `size`, `fontSize`, `delay`, `animation`, `keyframes`) ya da eksik alan; renkleri `rgb()`/isimle yazmak.
- Path'i dolgu sanmak; path `x`,`y` değerini sınır kutusu merkezine koymamak; 2'den az nokta.
- Her şeyi aynı boyutta, ortada üst üste yığmak; odak nesnesi olmayan "dağınık" kompozisyon.
- Gölgeyi tek düz siyah daire yapmak; her yeri aynı koyulukta bırakmak (odak kaybolur).
- Metni koyu sürtme alanının üstüne koymak.

## Örnek 1 — kısa: mum ışığı

```json
{"category":"charcoal","title":"Mum ışığı","duration":8,"seed":13,"speed":1,"detail":1,"background":"#e6ddcd","palette":["#282622","#6a6358","#9f9381","#f2ead9"],"objects":[
 {"type":"circle","x":0.547,"y":0.5,"width":0.453,"height":0.806,"color":"#9f9381","lineWidth":1,"start":0.0,"duration":2.5,"text":"","points":[],"motion":"fade"},
 {"type":"circle","x":0.547,"y":0.458,"width":0.25,"height":0.444,"color":"#f2ead9","lineWidth":1,"start":1.2,"duration":1.6,"text":"","points":[],"motion":"fade"},
 {"type":"path","x":0.367,"y":0.778,"width":0.117,"height":0.076,"color":"#6a6358","lineWidth":30,"start":0.6,"duration":0.8,"text":"","points":[[0.308,0.816],[0.367,0.778],[0.426,0.74]],"motion":"fade"},
 {"type":"path","x":0.734,"y":0.208,"width":0.099,"height":0.082,"color":"#6a6358","lineWidth":30,"start":0.9,"duration":0.8,"text":"","points":[[0.685,0.167],[0.734,0.208],[0.784,0.249]],"motion":"fade"},
 {"type":"rect","x":0.547,"y":0.653,"width":0.055,"height":0.236,"color":"#f2ead9","lineWidth":1,"start":2.4,"duration":1.0,"text":"","points":[],"motion":"fade"},
 {"type":"path","x":0.547,"y":0.653,"width":0.055,"height":0.236,"color":"#282622","lineWidth":3,"start":2.8,"duration":1.2,"text":"","points":[[0.52,0.771],[0.52,0.535],[0.574,0.535],[0.574,0.771]],"motion":"draw"},
 {"type":"ellipse","x":0.547,"y":0.472,"width":0.025,"height":0.089,"color":"#fbf5e8","lineWidth":1,"start":3.8,"duration":0.8,"text":"","points":[],"motion":"float"},
 {"type":"path","x":0.547,"y":0.467,"width":0.019,"height":0.1,"color":"#282622","lineWidth":2,"start":4.2,"duration":0.8,"text":"","points":[[0.547,0.417],[0.556,0.465],[0.547,0.517],[0.537,0.465],[0.547,0.417]],"motion":"draw"},
 {"type":"path","x":0.547,"y":0.526,"width":0.002,"height":0.018,"color":"#282622","lineWidth":3,"start":4.6,"duration":0.3,"text":"","points":[[0.547,0.535],[0.547,0.517]],"motion":"draw"},
 {"type":"ellipse","x":0.547,"y":0.778,"width":0.188,"height":0.05,"color":"#6a6358","lineWidth":1,"start":4.8,"duration":1.0,"text":"","points":[],"motion":"fade"},
 {"type":"text","x":0.156,"y":0.208,"width":0.219,"height":0.061,"color":"#282622","lineWidth":1,"start":5.4,"duration":1.0,"text":"Mum ışığı","points":[],"motion":"fade"}
]}
```

## Örnek 2 — zengin: fırtınada fener

```json
{"category":"charcoal","title":"Fırtınada fener","duration":14,"seed":61,"speed":1,"detail":1,"background":"#e6ddcd","palette":["#282622","#6a6358","#9f9381","#f2ead9"],"objects":[
 {"type":"ellipse","x":0.328,"y":0.278,"width":0.562,"height":0.361,"color":"#9f9381","lineWidth":1,"start":0.0,"duration":2.0,"text":"","points":[],"motion":"fade"},
 {"type":"ellipse","x":0.703,"y":0.222,"width":0.5,"height":0.278,"color":"#6a6358","lineWidth":1,"start":0.6,"duration":2.0,"text":"","points":[],"motion":"fade"},
 {"type":"path","x":0.5,"y":0.743,"width":0.884,"height":0.142,"color":"#282622","lineWidth":28,"start":1.6,"duration":2.5,"text":"","points":[[0.058,0.672],[0.942,0.672],[0.942,0.701],[0.058,0.701],[0.058,0.729],[0.942,0.729],[0.942,0.757],[0.058,0.757],[0.058,0.786],[0.942,0.786],[0.942,0.814],[0.058,0.814]],"motion":"draw"},
 {"type":"path","x":0.797,"y":0.691,"width":0.303,"height":0.268,"color":"#6a6358","lineWidth":12,"start":3.0,"duration":2.0,"text":"","points":[[0.808,0.557],[0.948,0.557],[0.948,0.57],[0.698,0.57],[0.681,0.582],[0.948,0.582],[0.948,0.595],[0.664,0.595],[0.66,0.608],[0.948,0.608],[0.948,0.621],[0.659,0.621],[0.659,0.634],[0.948,0.634],[0.948,0.646],[0.658,0.646],[0.657,0.659],[0.948,0.659],[0.948,0.672],[0.656,0.672],[0.655,0.685],[0.948,0.685],[0.948,0.697],[0.654,0.697],[0.653,0.71],[0.948,0.71],[0.948,0.723],[0.653,0.723],[0.652,0.736],[0.948,0.736],[0.948,0.748],[0.651,0.748],[0.65,0.761],[0.948,0.761],[0.948,0.774],[0.649,0.774],[0.648,0.787],[0.948,0.787],[0.948,0.799],[0.648,0.799],[0.647,0.812],[0.948,0.812],[0.948,0.825],[0.646,0.825]],"motion":"draw"},
 {"type":"rect","x":0.75,"y":0.451,"width":0.039,"height":0.208,"color":"#f2ead9","lineWidth":1,"start":4.8,"duration":0.8,"text":"","points":[],"motion":"fade"},
 {"type":"path","x":0.75,"y":0.451,"width":0.039,"height":0.208,"color":"#282622","lineWidth":3,"start":5.2,"duration":1.0,"text":"","points":[[0.73,0.556],[0.73,0.347],[0.77,0.347],[0.77,0.556]],"motion":"draw"},
 {"type":"rect","x":0.75,"y":0.328,"width":0.052,"height":0.042,"color":"#282622","lineWidth":1,"start":6.0,"duration":0.6,"text":"","points":[],"motion":"fade"},
 {"type":"path","x":0.594,"y":0.292,"width":0.311,"height":0.058,"color":"#f4ede0","lineWidth":24,"start":6.8,"duration":0.8,"text":"","points":[[0.438,0.321],[0.594,0.292],[0.749,0.263]],"motion":"fade"},
 {"type":"path","x":0.594,"y":0.372,"width":0.308,"height":0.096,"color":"#f4ede0","lineWidth":18,"start":7.1,"duration":0.8,"text":"","points":[[0.44,0.324],[0.594,0.372],[0.748,0.42]],"motion":"fade"},
 {"type":"path","x":0.188,"y":0.722,"width":0.093,"height":0.015,"color":"#f2ead9","lineWidth":7,"start":7.8,"duration":0.5,"text":"","points":[[0.141,0.729],[0.188,0.722],[0.234,0.715]],"motion":"fade"},
 {"type":"path","x":0.375,"y":0.75,"width":0.125,"height":0.016,"color":"#f2ead9","lineWidth":6,"start":8.1,"duration":0.5,"text":"","points":[[0.313,0.742],[0.375,0.75],[0.437,0.758]],"motion":"fade"},
 {"type":"path","x":0.531,"y":0.715,"width":0.086,"height":0.008,"color":"#f2ead9","lineWidth":6,"start":8.4,"duration":0.5,"text":"","points":[[0.488,0.719],[0.531,0.715],[0.574,0.711]],"motion":"fade"},
 {"type":"path","x":0.113,"y":0.458,"width":0.023,"height":0.083,"color":"#9f9381","lineWidth":2,"start":8.8,"duration":0.4,"text":"","points":[[0.125,0.417],[0.102,0.5]],"motion":"draw"},
 {"type":"path","x":0.246,"y":0.486,"width":0.023,"height":0.083,"color":"#9f9381","lineWidth":2,"start":9.0,"duration":0.4,"text":"","points":[[0.258,0.444],[0.234,0.528]],"motion":"draw"},
 {"type":"path","x":0.426,"y":0.458,"width":0.023,"height":0.083,"color":"#9f9381","lineWidth":2,"start":9.2,"duration":0.4,"text":"","points":[[0.438,0.417],[0.414,0.5]],"motion":"draw"},
 {"type":"text","x":0.234,"y":0.556,"width":0.344,"height":0.061,"color":"#282622","lineWidth":1,"start":9.8,"duration":1.0,"text":"Fırtınada fener","points":[],"motion":"fade"}
]}
```

## Kabul ölçütleri

Toz/sürtme karakteri belli; tek güçlü ışık odağı var; gölgeler katmanlı; metin açık zeminde okunur.
Son kare tek başına bakıldığında bitmiş, dengeli bir resim olmalı; tüm metin okunur ve güvenli alanda.

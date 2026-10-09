---
name: canvas-line-art
description: "Kare Canvas 2D sahnelerini çizgi sanatı (line art) stilinde üretir: tek renkli konturlar, kademeli draw ile açılan yollar, bol boşluk. Çizgi sanatı, eskiz, kontur, tek çizgi istekleri için kullan."
---

# canvas-line-art · Çizgi sanatı

Bu beceri, Kare'nin Canvas 2D motorunda **Çizgi sanatı** stilinde, AI'ın JSON olarak döndürdüğü düzenlenebilir sahneler içindir (kod değil, yalnızca sahne verisi; `composed` sahnelerde hazır prosedürel çizim kapalıdır, her şeyi nesnelerle sen kurarsın).

## Amaç ve görünüm

Kâğıt üzerinde kalemle tek hamlede çizilmiş gibi temiz, tek kalınlıkta (3–4 px) konturlar. Formlar `draw` ile çizilerek ortaya çıkar; izleyici kalemin yolunu takip eder. Dolu alanlar yalnızca küçük vurgu (pencere, nokta) olarak kullanılır. Sakin, zarif, editoryal bir görünüm.

## Tuval ve güvenli alan

- Mantıksal tuval **1280×720**. Tüm `x`, `y`, `width`, `height` ve path noktaları **0–1 normalize** değerdir: piksel = x·1280, y·720.
- `x`,`y` nesnenin **merkezidir** (circle, ellipse, rect, text). Path için `x`,`y` noktaların sınır kutusunun merkezi, `width`/`height` kutunun boyu olsun (döndürme ve kalite denetimi bunu kullanır).
- **Güvenli alan:** x .04–.96, y .08–.82. Alt ~100 px (y > .86) altyazı bandıdır; metni ve odak nesnesini oraya koyma. Zemin/gökyüzü gibi arka plan bantları kenara kadar uzanabilir ama 0–1 dışına taşmasın.
- Circle'da `width` çaptır ve 1280 px'e göredir: dikey yarıçap = width·1280/720/2 (ör. width .1 → 128 px çap, y'de ±.089). `height` circle için kullanılmaz, width ile aynı oranı yaz.
- Nesneler dizideki **sırayla** çizilir: önce arka plan, sonra orta plan, en son ön plan ve metin.

## Kompozisyon

- Bir **odak nesnesi** seç ve üçte bir noktalarına (x≈.33/.67, y≈.33/.6) ya da bilinçli olarak merkeze yerleştir; 3–7 ana form + destekleyici ayrıntı.
- Derinlik katmanları: arka plan (büyük, düşük kontrast) → orta plan → ön plan (en koyu/en doygun) → metin. Boş alan bırak; ana formlar çerçeve genişliğinin en az %12'si olsun.
- Ana konturu tek uzun path olarak kur (20–60 nokta); ayrıntıları ayrı kısa path'ler yap.
- Metin bir yanda, çizim diğer yanda: üçte bir düzeni (ör. metin x≈.25, çizim x≈.62).

## Palet

Arka plan **#f2eee5**. Tema paleti (sırayla): `#1e3930`, `#ba684b`, `#929c70`.
- `#1e3930` — ana kontur ve metin (arka planla kontrast 10.8:1)
- `#ba684b` — tek vurgu çizgisi (buhar, ay, alt çizgi) (arka planla kontrast 3.5:1)
- `#929c70` — ikincil çizgiler, su, yıldız (arka planla kontrast 2.5:1)
Dolgu neredeyse yok: kâğıt (arka plan) boş kalır. Vurgu rengi sahnenin en fazla %15'i.

## Zamanlama ve koreografi

Süre D için ritim: **%0–15** sahneyi kur (arka plan, zemin, büyük renk alanları) · **%15–60** odak nesnesini inşa et (ana çizgiler `draw`, ana formlar `fade`/`slide`) · **%55–85** ayrıntı, vurgu ve etiketler · **%85–100** bekleme: yeni nesne yok, yalnızca 1–4 `float`/`rotate` ortam hareketi.
- Girişleri **kademelendir**: kardeş öğeler arasında .15–.6 sn aralık; aynı anda en fazla 2–3 nesne başlasın. `start` değerlerinin hepsi 0 olmasın.
- Tipik giriş süresi: fade .6–1.5 sn, slide .8–1.2 sn, draw 1.5–4 sn (uzun yol = daha uzun süre). Çok kısa (<.3 sn) girişler sıçrama gibi görünür.
- Son nesne en geç D·0.8'de başlasın; izleyici bitmiş resmi en az 2 sn görsün.
- Ana kontur uzun bir `draw` (3–5 sn); ikincil çizgiler ondan sonra sırayla 1–2 sn.
- Çizim bitince metin `fade` ile gelir; son %15'te yalnızca bir küçük `float` öğe.

## Metin

- Türkçe karakterleri doğru yaz (ç ğ ı İ ö ş ü). Başlık en fazla ~5 kelime, etiket 1–3 kelime; bir text nesnesinde en fazla 8 kelime.
- Boyut (`height`): başlık .06–.09 (43–65 px), alt başlık .04–.05, etiket .033–.04 (24–29 px). 20 px altı okunmaz.
- `width` metni sığdıracak kadar geniş olsun (yaklaşık karakter sayısı × yazı boyu × .56 / 1280). Metinler birbiriyle ve yoğun şekillerle çakışmasın.
- Metin rengi arka planla en az 4.5:1 kontrast vermeli: bu stilde metin için **#1e3930** kullan.

## Nesne sözleşmesi (AI çıktısı — alanlar birebir)

Sahne: `category` (bu beceri: **line-art**), `title` (1–160), `duration` (2–60 sn), `seed` (tamsayı), `speed` (.2–3, float/rotate hızını çarpar), `detail` (.25–2), `background` (#RRGGBB), `palette` (2–8 × #RRGGBB), `objects` (en fazla 80; iyi sahne 8–30).
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

- Daire/elips kontur: 32–40 noktalı kapalı path (ilk ve son nokta aynı).
- Siluet (şehir, dağ): basamaklı ya da dalgalı tek path, soldan sağa çizilir.
- Kuş: 3 noktalı küçük "V" path, lineWidth 2–3.
- Buhar/su: 12–20 noktalı sinüs path; birkaç tanesini .4 sn arayla başlat.
- Çizgi kalınlığı tutarlı olsun: ana 3–4, ikincil 2–3.

## Sık hatalar (kaçın)

- Nesneyi çerçeve dışına taşırmak (x±width/2, circle'da dikey yarıçap, float için +14 px pay) ya da metni altyazı bandına koymak.
- Bütün nesneleri `start: 0` ile başlatmak; ya da son saniyede yeni nesne getirmek.
- Minik şekiller (width < .015) ve 20 px altı yazılar; ana form çerçevenin %12'sinden küçük.
- 40'tan fazla benzer küçük nesne (parçacık/nokta yığını) — ritim kaybolur, sahne kirlenir. 10–25 yeterli.
- Yanlış alan adları (`radius`, `fill`, `size`, `fontSize`, `delay`, `animation`, `keyframes`) ya da eksik alan; renkleri `rgb()`/isimle yazmak.
- Path'i dolgu sanmak; path `x`,`y` değerini sınır kutusu merkezine koymamak; 2'den az nokta.
- Her şeyi aynı boyutta, ortada üst üste yığmak; odak nesnesi olmayan "dağınık" kompozisyon.
- Kalınlıkları karıştırmak (1 px ile 12 px yan yana) ya da çizgiyi dolgu gibi kullanmaya çalışmak.
- Path'i 2–3 noktayla eğri sanmak: eğri için en az 12 nokta.

## Örnek 1 — kısa: tek fincan

```json
{"category":"line-art","title":"Sabah kahvesi","duration":8,"seed":11,"speed":1,"detail":1,"background":"#f2eee5","palette":["#1e3930","#ba684b","#929c70"],"objects":[
 {"type":"path","x":0.625,"y":0.722,"width":0.297,"height":0.072,"color":"#1e3930","lineWidth":4,"start":0.3,"duration":1.6,"text":"","points":[[0.625,0.686],[0.651,0.687],[0.676,0.688],[0.699,0.691],[0.72,0.695],[0.739,0.699],[0.754,0.704],[0.764,0.71],[0.771,0.716],[0.773,0.722],[0.771,0.728],[0.764,0.735],[0.754,0.74],[0.739,0.745],[0.72,0.75],[0.699,0.753],[0.676,0.756],[0.651,0.758],[0.625,0.758],[0.599,0.758],[0.574,0.756],[0.551,0.753],[0.53,0.75],[0.511,0.745],[0.496,0.74],[0.486,0.735],[0.479,0.728],[0.477,0.722],[0.479,0.716],[0.486,0.71],[0.496,0.704],[0.511,0.699],[0.53,0.695],[0.551,0.691],[0.574,0.688],[0.599,0.687],[0.625,0.686]],"motion":"draw"},
 {"type":"path","x":0.625,"y":0.556,"width":0.188,"height":0.194,"color":"#1e3930","lineWidth":4,"start":1.0,"duration":2.0,"text":"","points":[[0.719,0.458],[0.718,0.484],[0.716,0.509],[0.712,0.533],[0.706,0.556],[0.699,0.577],[0.691,0.596],[0.682,0.613],[0.672,0.627],[0.661,0.638],[0.649,0.646],[0.637,0.651],[0.625,0.653],[0.613,0.651],[0.601,0.646],[0.589,0.638],[0.578,0.627],[0.568,0.613],[0.559,0.596],[0.551,0.577],[0.544,0.556],[0.538,0.533],[0.534,0.509],[0.532,0.484],[0.531,0.458]],"motion":"draw"},
 {"type":"path","x":0.625,"y":0.458,"width":0.188,"height":0.05,"color":"#1e3930","lineWidth":3,"start":1.8,"duration":1.2,"text":"","points":[[0.625,0.433],[0.641,0.434],[0.657,0.435],[0.672,0.437],[0.685,0.439],[0.697,0.442],[0.706,0.446],[0.713,0.45],[0.717,0.454],[0.719,0.458],[0.717,0.463],[0.713,0.467],[0.706,0.471],[0.697,0.474],[0.685,0.477],[0.672,0.48],[0.657,0.482],[0.641,0.483],[0.625,0.483],[0.609,0.483],[0.593,0.482],[0.578,0.48],[0.565,0.477],[0.553,0.474],[0.544,0.471],[0.537,0.467],[0.533,0.463],[0.531,0.458],[0.533,0.454],[0.537,0.45],[0.544,0.446],[0.553,0.442],[0.565,0.439],[0.578,0.437],[0.593,0.435],[0.609,0.434],[0.625,0.433]],"motion":"draw"},
 {"type":"path","x":0.736,"y":0.549,"width":0.035,"height":0.111,"color":"#1e3930","lineWidth":4,"start":2.6,"duration":0.9,"text":"","points":[[0.719,0.493],[0.727,0.494],[0.734,0.499],[0.741,0.505],[0.746,0.514],[0.75,0.525],[0.753,0.536],[0.754,0.549],[0.753,0.561],[0.75,0.573],[0.746,0.583],[0.741,0.592],[0.734,0.599],[0.727,0.603],[0.719,0.604]],"motion":"draw"},
 {"type":"path","x":0.594,"y":0.319,"width":0.022,"height":0.194,"color":"#ba684b","lineWidth":3,"start":3.4,"duration":2.0,"text":"","points":[[0.594,0.417],[0.597,0.403],[0.601,0.389],[0.603,0.375],[0.604,0.361],[0.605,0.347],[0.604,0.333],[0.602,0.319],[0.599,0.306],[0.595,0.292],[0.592,0.278],[0.588,0.264],[0.585,0.25],[0.584,0.236],[0.583,0.222]],"motion":"draw"},
 {"type":"path","x":0.625,"y":0.319,"width":0.022,"height":0.194,"color":"#ba684b","lineWidth":3,"start":3.8,"duration":2.0,"text":"","points":[[0.634,0.417],[0.636,0.403],[0.636,0.389],[0.635,0.375],[0.633,0.361],[0.63,0.347],[0.627,0.333],[0.623,0.319],[0.62,0.306],[0.617,0.292],[0.615,0.278],[0.614,0.264],[0.615,0.25],[0.616,0.236],[0.619,0.222]],"motion":"draw"},
 {"type":"path","x":0.656,"y":0.319,"width":0.021,"height":0.194,"color":"#ba684b","lineWidth":3,"start":4.2,"duration":2.0,"text":"","points":[[0.666,0.417],[0.664,0.403],[0.661,0.389],[0.658,0.375],[0.654,0.361],[0.651,0.347],[0.648,0.333],[0.646,0.319],[0.645,0.306],[0.646,0.292],[0.647,0.278],[0.65,0.264],[0.653,0.25],[0.657,0.236],[0.66,0.222]],"motion":"draw"},
 {"type":"text","x":0.258,"y":0.417,"width":0.359,"height":0.072,"color":"#1e3930","lineWidth":1,"start":4.6,"duration":1.0,"text":"Sabah kahvesi","points":[],"motion":"fade"},
 {"type":"path","x":0.258,"y":0.479,"width":0.219,"height":0.003,"color":"#ba684b","lineWidth":3,"start":5.2,"duration":1.0,"text":"","points":[[0.148,0.479],[0.367,0.479]],"motion":"draw"},
 {"type":"text","x":0.258,"y":0.542,"width":0.312,"height":0.039,"color":"#1e3930","lineWidth":1,"start":5.6,"duration":1.0,"text":"tek çizgiyle","points":[],"motion":"fade"}
]}
```

## Örnek 2 — zengin: gece şehri silueti

```json
{"category":"line-art","title":"Gece şehri","duration":14,"seed":23,"speed":1,"detail":1,"background":"#f2eee5","palette":["#1e3930","#ba684b","#929c70"],"objects":[
 {"type":"path","x":0.781,"y":0.208,"width":0.078,"height":0.139,"color":"#ba684b","lineWidth":3,"start":0.3,"duration":1.5,"text":"","points":[[0.781,0.139],[0.789,0.14],[0.796,0.144],[0.803,0.151],[0.809,0.159],[0.814,0.17],[0.817,0.182],[0.82,0.195],[0.82,0.208],[0.82,0.222],[0.817,0.235],[0.814,0.247],[0.809,0.257],[0.803,0.266],[0.796,0.272],[0.789,0.276],[0.781,0.278],[0.774,0.276],[0.766,0.272],[0.76,0.266],[0.754,0.257],[0.749,0.247],[0.745,0.235],[0.743,0.222],[0.742,0.208],[0.743,0.195],[0.745,0.182],[0.749,0.17],[0.754,0.159],[0.76,0.151],[0.766,0.144],[0.774,0.14],[0.781,0.139]],"motion":"draw"},
 {"type":"circle","x":0.117,"y":0.292,"width":0.008,"height":0.014,"color":"#929c70","lineWidth":1,"start":1.0,"duration":0.8,"text":"","points":[],"motion":"fade"},
 {"type":"circle","x":0.438,"y":0.167,"width":0.008,"height":0.014,"color":"#929c70","lineWidth":1,"start":1.3,"duration":0.8,"text":"","points":[],"motion":"fade"},
 {"type":"circle","x":0.672,"y":0.292,"width":0.008,"height":0.014,"color":"#929c70","lineWidth":1,"start":1.6,"duration":0.8,"text":"","points":[],"motion":"fade"},
 {"type":"path","x":0.5,"y":0.486,"width":0.875,"height":0.472,"color":"#1e3930","lineWidth":4,"start":1.4,"duration":4.5,"text":"","points":[[0.062,0.722],[0.062,0.528],[0.117,0.528],[0.117,0.597],[0.164,0.597],[0.164,0.403],[0.234,0.403],[0.234,0.472],[0.273,0.472],[0.273,0.306],[0.344,0.306],[0.344,0.431],[0.406,0.431],[0.406,0.25],[0.469,0.25],[0.469,0.361],[0.531,0.361],[0.531,0.458],[0.594,0.458],[0.594,0.333],[0.648,0.333],[0.648,0.514],[0.727,0.514],[0.727,0.389],[0.789,0.389],[0.789,0.556],[0.859,0.556],[0.859,0.722],[0.938,0.722],[0.938,0.722]],"motion":"draw"},
 {"type":"rect","x":0.363,"y":0.361,"width":0.011,"height":0.025,"color":"#ba684b","lineWidth":1,"start":6.0,"duration":0.6,"text":"","points":[],"motion":"fade"},
 {"type":"rect","x":0.387,"y":0.417,"width":0.011,"height":0.025,"color":"#ba684b","lineWidth":1,"start":6.3,"duration":0.6,"text":"","points":[],"motion":"fade"},
 {"type":"rect","x":0.488,"y":0.306,"width":0.011,"height":0.025,"color":"#ba684b","lineWidth":1,"start":6.6,"duration":0.6,"text":"","points":[],"motion":"fade"},
 {"type":"rect","x":0.512,"y":0.375,"width":0.011,"height":0.025,"color":"#ba684b","lineWidth":1,"start":6.9,"duration":0.6,"text":"","points":[],"motion":"fade"},
 {"type":"rect","x":0.676,"y":0.417,"width":0.011,"height":0.025,"color":"#ba684b","lineWidth":1,"start":7.2,"duration":0.6,"text":"","points":[],"motion":"fade"},
 {"type":"rect","x":0.699,"y":0.472,"width":0.011,"height":0.025,"color":"#ba684b","lineWidth":1,"start":7.5,"duration":0.6,"text":"","points":[],"motion":"fade"},
 {"type":"path","x":0.5,"y":0.771,"width":0.812,"height":0.014,"color":"#929c70","lineWidth":3,"start":7.0,"duration":2.0,"text":"","points":[[0.094,0.771],[0.114,0.776],[0.134,0.777],[0.155,0.773],[0.175,0.767],[0.195,0.764],[0.216,0.767],[0.236,0.773],[0.256,0.777],[0.277,0.776],[0.297,0.771],[0.317,0.765],[0.338,0.764],[0.358,0.769],[0.378,0.775],[0.398,0.778],[0.419,0.775],[0.439,0.769],[0.459,0.764],[0.48,0.765],[0.5,0.771],[0.52,0.776],[0.541,0.777],[0.561,0.773],[0.581,0.767],[0.602,0.764],[0.622,0.767],[0.642,0.773],[0.662,0.777],[0.683,0.776],[0.703,0.771],[0.723,0.765],[0.744,0.764],[0.764,0.769],[0.784,0.775],[0.805,0.778],[0.825,0.775],[0.845,0.769],[0.866,0.764],[0.886,0.765],[0.906,0.771]],"motion":"draw"},
 {"type":"path","x":0.5,"y":0.812,"width":0.594,"height":0.011,"color":"#929c70","lineWidth":3,"start":7.6,"duration":2.0,"text":"","points":[[0.203,0.817],[0.221,0.818],[0.238,0.814],[0.256,0.809],[0.273,0.807],[0.29,0.809],[0.308,0.814],[0.325,0.818],[0.343,0.817],[0.36,0.813],[0.378,0.808],[0.395,0.807],[0.413,0.81],[0.43,0.815],[0.448,0.818],[0.465,0.817],[0.483,0.812],[0.5,0.808],[0.517,0.807],[0.535,0.811],[0.552,0.816],[0.57,0.818],[0.587,0.816],[0.605,0.811],[0.622,0.807],[0.64,0.808],[0.657,0.812],[0.675,0.817],[0.692,0.818],[0.71,0.815],[0.727,0.81],[0.744,0.807],[0.762,0.808],[0.779,0.813],[0.797,0.817]],"motion":"draw"},
 {"type":"path","x":0.777,"y":0.369,"width":0.023,"height":0.017,"color":"#1e3930","lineWidth":2.5,"start":8.6,"duration":0.6,"text":"","points":[[0.766,0.361],[0.777,0.378],[0.789,0.361]],"motion":"draw"},
 {"type":"path","x":0.814,"y":0.396,"width":0.019,"height":0.014,"color":"#1e3930","lineWidth":2.5,"start":9.0,"duration":0.6,"text":"","points":[[0.805,0.389],[0.814,0.403],[0.823,0.389]],"motion":"draw"},
 {"type":"circle","x":0.562,"y":0.208,"width":0.009,"height":0.017,"color":"#929c70","lineWidth":1,"start":9.4,"duration":0.5,"text":"","points":[],"motion":"float"},
 {"type":"text","x":0.234,"y":0.174,"width":0.328,"height":0.069,"color":"#1e3930","lineWidth":1,"start":9.8,"duration":1.0,"text":"Gece şehri","points":[],"motion":"fade"},
 {"type":"text","x":0.234,"y":0.247,"width":0.328,"height":0.036,"color":"#1e3930","lineWidth":1,"start":10.4,"duration":1.0,"text":"tek bir çizginin hikâyesi","points":[],"motion":"fade"}
]}
```

## Kabul ölçütleri

Kontur ucu çizilen yolu takip ediyor; form son karede tanınıyor; çizgi ağırlığı tutarlı; kâğıt boşluğu korunmuş.
Son kare tek başına bakıldığında bitmiş, dengeli bir resim olmalı; tüm metin okunur ve güvenli alanda.

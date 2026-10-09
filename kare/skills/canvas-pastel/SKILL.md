---
name: canvas-pastel
description: "Kare Canvas 2D sahnelerini pastel boya stilinde üretir: kısa, geniş, kuru sürtmeler, aralarından görünen kâğıt, yumuşak açık tonlar. Pastel, tebeşir pastel, yumuşak renk çalışması istekleri için kullan."
---

# canvas-pastel · Pastel

Bu beceri, Kare'nin Canvas 2D motorunda **Pastel** stilinde, AI'ın JSON olarak döndürdüğü düzenlenebilir sahneler içindir (kod değil, yalnızca sahne verisi; `composed` sahnelerde hazır prosedürel çizim kapalıdır, her şeyi nesnelerle sen kurarsın).

## Amaç ve görünüm

Kuru pastel tebeşir: renk alanları tek düz dolgu değil, aralarında kâğıt görünen yan yana geniş sürtmelerden (lineWidth 22–30) oluşur. Kenarlar hafif yuvarlak, tonlar açık ve tozlu. Parlak gradyan ve sert kontur yok.

## Tuval ve güvenli alan

- Mantıksal tuval **1280×720**. Tüm `x`, `y`, `width`, `height` ve path noktaları **0–1 normalize** değerdir: piksel = x·1280, y·720.
- `x`,`y` nesnenin **merkezidir** (circle, ellipse, rect, text). Path için `x`,`y` noktaların sınır kutusunun merkezi, `width`/`height` kutunun boyu olsun (döndürme ve kalite denetimi bunu kullanır).
- **Güvenli alan:** x .04–.96, y .08–.82. Alt ~100 px (y > .86) altyazı bandıdır; metni ve odak nesnesini oraya koyma. Zemin/gökyüzü gibi arka plan bantları kenara kadar uzanabilir ama 0–1 dışına taşmasın.
- Circle'da `width` çaptır ve 1280 px'e göredir: dikey yarıçap = width·1280/720/2 (ör. width .1 → 128 px çap, y'de ±.089). `height` circle için kullanılmaz, width ile aynı oranı yaz.
- Nesneler dizideki **sırayla** çizilir: önce arka plan, sonra orta plan, en son ön plan ve metin.

## Kompozisyon

- Bir **odak nesnesi** seç ve üçte bir noktalarına (x≈.33/.67, y≈.33/.6) ya da bilinçli olarak merkeze yerleştir; 3–7 ana form + destekleyici ayrıntı.
- Derinlik katmanları: arka plan (büyük, düşük kontrast) → orta plan → ön plan (en koyu/en doygun) → metin. Boş alan bırak; ana formlar çerçeve genişliğinin en az %12'si olsun.
- Arka plan bantları (gökyüzü, duvar, masa) yatay sürtme dokusuyla tüm genişliği kaplar; odak nesneleri bunların üstünde dolu circle/ellipse.
- Odak grubu merkezde ya da hafif sağda; metin solda boş bir bantta.

## Palet

Arka plan **#f2e9da**. Tema paleti (sırayla): `#df9c91`, `#a1b6b3`, `#d3b47d`, `#a6a0c5`.
- `#df9c91` — sıcak vurgu: meyve, gün doğumu (arka planla kontrast 1.9:1)
- `#a1b6b3` — serin alanlar: deniz, kâse (arka planla kontrast 1.8:1)
- `#d3b47d` — ışık ve zemin: güneş, masa (arka planla kontrast 1.6:1)
- `#a6a0c5` — gökyüzü/arka duvar (arka planla kontrast 2.1:1)
Tema renklerinin hepsi açıktır ve metin için yetersizdir: metin için koyu mor `#5b4a63` ekle (kontrast 6.7:1). Gölge sürtmeleri için tema renklerinin biraz koyusunu kullanabilirsin (ör. `#c98479`).

## Zamanlama ve koreografi

Süre D için ritim: **%0–15** sahneyi kur (arka plan, zemin, büyük renk alanları) · **%15–60** odak nesnesini inşa et (ana çizgiler `draw`, ana formlar `fade`/`slide`) · **%55–85** ayrıntı, vurgu ve etiketler · **%85–100** bekleme: yeni nesne yok, yalnızca 1–4 `float`/`rotate` ortam hareketi.
- Girişleri **kademelendir**: kardeş öğeler arasında .15–.6 sn aralık; aynı anda en fazla 2–3 nesne başlasın. `start` değerlerinin hepsi 0 olmasın.
- Tipik giriş süresi: fade .6–1.5 sn, slide .8–1.2 sn, draw 1.5–4 sn (uzun yol = daha uzun süre). Çok kısa (<.3 sn) girişler sıçrama gibi görünür.
- Son nesne en geç D·0.8'de başlasın; izleyici bitmiş resmi en az 2 sn görsün.
- Bantlar `draw` ile 2–3 sn'de "sürülür" (zikzak yol doğal olarak sürtme hissi verir).
- Nesneler .5 sn arayla `fade`; vurgu/gölge sürtmeleri en son.

## Metin

- Türkçe karakterleri doğru yaz (ç ğ ı İ ö ş ü). Başlık en fazla ~5 kelime, etiket 1–3 kelime; bir text nesnesinde en fazla 8 kelime.
- Boyut (`height`): başlık .06–.09 (43–65 px), alt başlık .04–.05, etiket .033–.04 (24–29 px). 20 px altı okunmaz.
- `width` metni sığdıracak kadar geniş olsun (yaklaşık karakter sayısı × yazı boyu × .56 / 1280). Metinler birbiriyle ve yoğun şekillerle çakışmasın.
- Metin rengi arka planla en az 4.5:1 kontrast vermeli: bu stilde metin için **#5b4a63** kullan.

## Nesne sözleşmesi (AI çıktısı — alanlar birebir)

Sahne: `category` (bu beceri: **pastel**), `title` (1–160), `duration` (2–60 sn), `seed` (tamsayı), `speed` (.2–3, float/rotate hızını çarpar), `detail` (.25–2), `background` (#RRGGBB), `palette` (2–8 × #RRGGBB), `objects` (en fazla 80; iyi sahne 8–30).
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

- Sürtme dokusu: dikdörtgen bölgeyi zikzak path ile tara (satır aralığı ≈ lineWidth×1.2–1.6 → aralarda kâğıt görünür). Points: her satır için iki uç nokta, yön değiştirerek.
- Işık/gölge: nesnenin üstüne kısa açık ya da koyu kapsül (lineWidth 10–14).
- Yansıma: aşağı doğru kısalan 2–4 yatay kapsül.

## Sık hatalar (kaçın)

- Nesneyi çerçeve dışına taşırmak (x±width/2, circle'da dikey yarıçap, float için +14 px pay) ya da metni altyazı bandına koymak.
- Bütün nesneleri `start: 0` ile başlatmak; ya da son saniyede yeni nesne getirmek.
- Minik şekiller (width < .015) ve 20 px altı yazılar; ana form çerçevenin %12'sinden küçük.
- 40'tan fazla benzer küçük nesne (parçacık/nokta yığını) — ritim kaybolur, sahne kirlenir. 10–25 yeterli.
- Yanlış alan adları (`radius`, `fill`, `size`, `fontSize`, `delay`, `animation`, `keyframes`) ya da eksik alan; renkleri `rgb()`/isimle yazmak.
- Path'i dolgu sanmak; path `x`,`y` değerini sınır kutusu merkezine koymamak; 2'den az nokta.
- Her şeyi aynı boyutta, ortada üst üste yığmak; odak nesnesi olmayan "dağınık" kompozisyon.
- Açık tema renklerini metin için kullanmak (okunmaz).
- Satır aralığını çok sık yapıp düz, plastik bir dolgu elde etmek; ya da çok seyrek yapıp çizgili görüntü.

## Örnek 1 — kısa: gün doğumu bantları

```json
{"category":"pastel","title":"Gün doğumu","duration":8,"seed":3,"speed":1,"detail":1,"background":"#f2e9da","palette":["#df9c91","#a1b6b3","#d3b47d","#a6a0c5","#5b4a63"],"objects":[
 {"type":"path","x":0.5,"y":0.333,"width":0.823,"height":0.214,"color":"#a6a0c5","lineWidth":26,"start":0.0,"duration":2.5,"text":"","points":[[0.088,0.226],[0.912,0.226],[0.912,0.269],[0.088,0.269],[0.088,0.312],[0.912,0.312],[0.912,0.355],[0.088,0.355],[0.088,0.397],[0.912,0.397],[0.912,0.44],[0.088,0.44]],"motion":"draw"},
 {"type":"path","x":0.5,"y":0.528,"width":0.823,"height":0.103,"color":"#df9c91","lineWidth":26,"start":0.8,"duration":2.0,"text":"","points":[[0.088,0.476],[0.912,0.476],[0.912,0.511],[0.088,0.511],[0.088,0.545],[0.912,0.545],[0.912,0.579],[0.088,0.579]],"motion":"draw"},
 {"type":"circle","x":0.5,"y":0.597,"width":0.125,"height":0.222,"color":"#d3b47d","lineWidth":1,"start":1.8,"duration":1.5,"text":"","points":[],"motion":"fade"},
 {"type":"path","x":0.5,"y":0.71,"width":0.823,"height":0.183,"color":"#a1b6b3","lineWidth":26,"start":2.4,"duration":2.0,"text":"","points":[[0.088,0.618],[0.912,0.618],[0.912,0.655],[0.088,0.655],[0.088,0.691],[0.912,0.691],[0.912,0.728],[0.088,0.728],[0.088,0.765],[0.912,0.765],[0.912,0.801],[0.088,0.801]],"motion":"draw"},
 {"type":"path","x":0.5,"y":0.653,"width":0.102,"height":0.003,"color":"#d3b47d","lineWidth":14,"start":4.4,"duration":0.6,"text":"","points":[[0.449,0.653],[0.5,0.653],[0.551,0.653]],"motion":"fade"},
 {"type":"path","x":0.5,"y":0.694,"width":0.07,"height":0.003,"color":"#d3b47d","lineWidth":12,"start":4.7,"duration":0.6,"text":"","points":[[0.465,0.694],[0.5,0.694],[0.535,0.694]],"motion":"fade"},
 {"type":"path","x":0.5,"y":0.736,"width":0.039,"height":0.003,"color":"#d3b47d","lineWidth":10,"start":5.0,"duration":0.6,"text":"","points":[[0.48,0.736],[0.5,0.736],[0.52,0.736]],"motion":"fade"},
 {"type":"text","x":0.5,"y":0.139,"width":0.312,"height":0.061,"color":"#5b4a63","lineWidth":1,"start":5.4,"duration":1.0,"text":"Gün doğumu","points":[],"motion":"fade"}
]}
```

## Örnek 2 — zengin: natürmort

```json
{"category":"pastel","title":"Meyve tabağı","duration":14,"seed":17,"speed":1,"detail":1,"background":"#f2e9da","palette":["#df9c91","#a1b6b3","#d3b47d","#a6a0c5","#5b4a63"],"objects":[
 {"type":"path","x":0.5,"y":0.389,"width":0.856,"height":0.494,"color":"#a6a0c5","lineWidth":24,"start":0.0,"duration":3.0,"text":"","points":[[0.072,0.142],[0.928,0.142],[0.928,0.191],[0.072,0.191],[0.072,0.241],[0.928,0.241],[0.928,0.29],[0.072,0.29],[0.072,0.339],[0.928,0.339],[0.928,0.389],[0.072,0.389],[0.072,0.438],[0.928,0.438],[0.928,0.488],[0.072,0.488],[0.072,0.537],[0.928,0.537],[0.928,0.587],[0.072,0.587],[0.072,0.636],[0.928,0.636]],"motion":"draw"},
 {"type":"path","x":0.5,"y":0.736,"width":0.853,"height":0.128,"color":"#d3b47d","lineWidth":28,"start":0.6,"duration":2.5,"text":"","points":[[0.073,0.672],[0.927,0.672],[0.927,0.715],[0.073,0.715],[0.073,0.757],[0.927,0.757],[0.927,0.8],[0.073,0.8]],"motion":"draw"},
 {"type":"circle","x":0.438,"y":0.556,"width":0.113,"height":0.2,"color":"#df9c91","lineWidth":1,"start":3.2,"duration":1.0,"text":"","points":[],"motion":"fade"},
 {"type":"circle","x":0.547,"y":0.549,"width":0.103,"height":0.183,"color":"#d3b47d","lineWidth":1,"start":3.7,"duration":1.0,"text":"","points":[],"motion":"fade"},
 {"type":"circle","x":0.617,"y":0.597,"width":0.044,"height":0.078,"color":"#a6a0c5","lineWidth":1,"start":4.2,"duration":0.8,"text":"","points":[],"motion":"fade"},
 {"type":"circle","x":0.641,"y":0.556,"width":0.044,"height":0.078,"color":"#a6a0c5","lineWidth":1,"start":4.4,"duration":0.8,"text":"","points":[],"motion":"fade"},
 {"type":"circle","x":0.656,"y":0.608,"width":0.044,"height":0.078,"color":"#a6a0c5","lineWidth":1,"start":4.6,"duration":0.8,"text":"","points":[],"motion":"fade"},
 {"type":"path","x":0.5,"y":0.729,"width":0.339,"height":0.122,"color":"#a1b6b3","lineWidth":22,"start":5.0,"duration":2.0,"text":"","points":[[0.33,0.668],[0.67,0.668],[0.664,0.693],[0.336,0.693],[0.346,0.717],[0.654,0.717],[0.638,0.741],[0.362,0.741],[0.388,0.766],[0.612,0.766],[0.569,0.79],[0.431,0.79]],"motion":"draw"},
 {"type":"path","x":0.414,"y":0.521,"width":0.02,"height":0.06,"color":"#c98479","lineWidth":12,"start":7.2,"duration":0.6,"text":"","points":[[0.404,0.551],[0.414,0.521],[0.424,0.491]],"motion":"fade"},
 {"type":"path","x":0.531,"y":0.514,"width":0.017,"height":0.053,"color":"#b8995f","lineWidth":12,"start":7.5,"duration":0.6,"text":"","points":[[0.523,0.54],[0.531,0.514],[0.54,0.487]],"motion":"fade"},
 {"type":"path","x":0.469,"y":0.458,"width":0.038,"height":0.048,"color":"#7f9a8b","lineWidth":18,"start":7.8,"duration":0.7,"text":"","points":[[0.45,0.482],[0.472,0.467],[0.488,0.434]],"motion":"fade"},
 {"type":"path","x":0.5,"y":0.722,"width":0.281,"height":0.003,"color":"#8a7f6a","lineWidth":6,"start":8.4,"duration":1.0,"text":"","points":[[0.359,0.722],[0.5,0.722],[0.641,0.722]],"motion":"fade"},
 {"type":"text","x":0.195,"y":0.222,"width":0.297,"height":0.067,"color":"#5b4a63","lineWidth":1,"start":9.0,"duration":1.2,"text":"Meyve tabağı","points":[],"motion":"fade"},
 {"type":"text","x":0.195,"y":0.299,"width":0.281,"height":0.039,"color":"#5b4a63","lineWidth":1,"start":9.6,"duration":1.0,"text":"pastel etüt","points":[],"motion":"fade"},
 {"type":"circle","x":0.82,"y":0.278,"width":0.022,"height":0.039,"color":"#df9c91","lineWidth":1,"start":10.4,"duration":0.8,"text":"","points":[],"motion":"float"}
]}
```

## Kabul ölçütleri

Kuru sürtme dokusu görünür; renk bantları ayrışır; metin koyu ve okunur.
Son kare tek başına bakıldığında bitmiş, dengeli bir resim olmalı; tüm metin okunur ve güvenli alanda.

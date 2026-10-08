---
name: canvas-pencil
description: "Kare Canvas 2D sahnelerini karakalem stilinde üretir: ince kontur, çapraz tarama ile hacim, grafit griler. Karakalem, eskiz, hacim etüdü, mimari çizim istekleri için kullan."
---

# canvas-pencil · Karakalem

Bu beceri, Kare'nin Canvas 2D motorunda **Karakalem** stilinde, AI'ın JSON olarak döndürdüğü düzenlenebilir sahneler içindir (kod değil, yalnızca sahne verisi; `composed` sahnelerde hazır prosedürel çizim kapalıdır, her şeyi nesnelerle sen kurarsın).

## Amaç ve görünüm

Grafit kalem etüdü: önce ince konturlar (lineWidth 2–2.5), sonra gölge tarafında ince (1–1.5) paralel tarama çizgileri; en koyu bölgede ikinci yön çapraz tarama. Dolu şekil neredeyse yok; gölge yoğunluğu çizgi sıklığıyla kurulur.

## Tuval ve güvenli alan

- Mantıksal tuval **1280×720**. Tüm `x`, `y`, `width`, `height` ve path noktaları **0–1 normalize** değerdir: piksel = x·1280, y·720.
- `x`,`y` nesnenin **merkezidir** (circle, ellipse, rect, text). Path için `x`,`y` noktaların sınır kutusunun merkezi, `width`/`height` kutunun boyu olsun (döndürme ve kalite denetimi bunu kullanır).
- **Güvenli alan:** x .04–.96, y .08–.82. Alt ~100 px (y > .86) altyazı bandıdır; metni ve odak nesnesini oraya koyma. Zemin/gökyüzü gibi arka plan bantları kenara kadar uzanabilir ama 0–1 dışına taşmasın.
- Circle'da `width` çaptır ve 1280 px'e göredir: dikey yarıçap = width·1280/720/2 (ör. width .1 → 128 px çap, y'de ±.089). `height` circle için kullanılmaz, width ile aynı oranı yaz.
- Nesneler dizideki **sırayla** çizilir: önce arka plan, sonra orta plan, en son ön plan ve metin.

## Kompozisyon

- Bir **odak nesnesi** seç ve üçte bir noktalarına (x≈.33/.67, y≈.33/.6) ya da bilinçli olarak merkeze yerleştir; 3–7 ana form + destekleyici ayrıntı.
- Derinlik katmanları: arka plan (büyük, düşük kontrast) → orta plan → ön plan (en koyu/en doygun) → metin. Boş alan bırak; ana formlar çerçeve genişliğinin en az %12'si olsun.
- Tek bir hacimli konu (küre, kemer, nesne) büyük ölçekte (yükseklik .35–.6).
- Işık yönü sabit: gölge tarafı ve düşen gölge aynı yönde.
- Metin konunun karşı tarafında boş kâğıtta.

## Palet

Arka plan **#f1ede3**. Tema paleti (sırayla): `#403d36`, `#817a6e`, `#b2aa9b`.
- `#403d36` — kontur, koyu tarama, metin (arka planla kontrast 9.3:1)
- `#817a6e` — orta ton tarama, ok/işaret (arka planla kontrast 3.6:1)
- `#b2aa9b` — açık tarama, düşen gölge (arka planla kontrast 2.0:1)
Renk yok: değer (açık-koyu) hiyerarşisi her şeydir. Işık yönünü seç ve tüm taramalar ona göre olsun.

## Zamanlama ve koreografi

Süre D için ritim: **%0–15** sahneyi kur (arka plan, zemin, büyük renk alanları) · **%15–60** odak nesnesini inşa et (ana çizgiler `draw`, ana formlar `fade`/`slide`) · **%55–85** ayrıntı, vurgu ve etiketler · **%85–100** bekleme: yeni nesne yok, yalnızca 1–4 `float`/`rotate` ortam hareketi.
- Girişleri **kademelendir**: kardeş öğeler arasında .15–.6 sn aralık; aynı anda en fazla 2–3 nesne başlasın. `start` değerlerinin hepsi 0 olmasın.
- Tipik giriş süresi: fade .6–1.5 sn, slide .8–1.2 sn, draw 1.5–4 sn (uzun yol = daha uzun süre). Çok kısa (<.3 sn) girişler sıçrama gibi görünür.
- Son nesne en geç D·0.8'de başlasın; izleyici bitmiş resmi en az 2 sn görsün.
- Kontur `draw` (2 sn) → orta ton tarama (2–2.5 sn) → koyu çapraz tarama → düşen gölge → metin.
- Tarama path'leri uzun zikzaktır; `draw` ile kalemin gidip gelmesi görünür.

## Metin

- Türkçe karakterleri doğru yaz (ç ğ ı İ ö ş ü). Başlık en fazla ~5 kelime, etiket 1–3 kelime; bir text nesnesinde en fazla 8 kelime.
- Boyut (`height`): başlık .06–.09 (43–65 px), alt başlık .04–.05, etiket .033–.04 (24–29 px). 20 px altı okunmaz.
- `width` metni sığdıracak kadar geniş olsun (yaklaşık karakter sayısı × yazı boyu × .56 / 1280). Metinler birbiriyle ve yoğun şekillerle çakışmasın.
- Metin rengi arka planla en az 4.5:1 kontrast vermeli: bu stilde metin için **#403d36** kullan.

## Nesne sözleşmesi (AI çıktısı — alanlar birebir)

Sahne: `category` (bu beceri: **pencil**), `title` (1–160), `duration` (2–60 sn), `seed` (tamsayı), `speed` (.2–3, float/rotate hızını çarpar), `detail` (.25–2), `background` (#RRGGBB), `palette` (2–8 × #RRGGBB), `objects` (en fazla 80; iyi sahne 8–30).
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

- Tarama: gölge bölgesini kapsayan çokgeni açılı paralel çizgilerle zikzak path olarak tara (aralık 7–10 px, lineWidth 1.2–1.5). Bir path = bir tarama katmanı.
- Çapraz tarama: aynı bölgenin daha küçük çekirdeğine ters açıyla ikinci katman.
- Düşen gölge: açık gri basık ellipse ya da yatay tarama.
- Ok/işaret: 2 noktalı çizgi + 3 noktalı ok ucu.

## Sık hatalar (kaçın)

- Nesneyi çerçeve dışına taşırmak (x±width/2, circle'da dikey yarıçap, float için +14 px pay) ya da metni altyazı bandına koymak.
- Bütün nesneleri `start: 0` ile başlatmak; ya da son saniyede yeni nesne getirmek.
- Minik şekiller (width < .015) ve 20 px altı yazılar; ana form çerçevenin %12'sinden küçük.
- 40'tan fazla benzer küçük nesne (parçacık/nokta yığını) — ritim kaybolur, sahne kirlenir. 10–25 yeterli.
- Yanlış alan adları (`radius`, `fill`, `size`, `fontSize`, `delay`, `animation`, `keyframes`) ya da eksik alan; renkleri `rgb()`/isimle yazmak.
- Path'i dolgu sanmak; path `x`,`y` değerini sınır kutusu merkezine koymamak; 2'den az nokta.
- Her şeyi aynı boyutta, ortada üst üste yığmak; odak nesnesi olmayan "dağınık" kompozisyon.
- Gölgeyi tek koyu dolu daire ile yapmak (karakalem hissini öldürür).
- Tarama yönünü her bölgede rastgele değiştirmek; ışık yönüyle çelişen gölge.

## Örnek 1 — kısa: küre etüdü

```json
{"category":"pencil","title":"Küre: ışık ve gölge","duration":9,"seed":9,"speed":1,"detail":1,"background":"#f1ede3","palette":["#403d36","#817a6e","#b2aa9b"],"objects":[
 {"type":"ellipse","x":0.641,"y":0.75,"width":0.266,"height":0.072,"color":"#b2aa9b","lineWidth":1,"start":0.2,"duration":1.2,"text":"","points":[],"motion":"fade"},
 {"type":"path","x":0.609,"y":0.5,"width":0.234,"height":0.417,"color":"#403d36","lineWidth":2.5,"start":0.8,"duration":2.2,"text":"","points":[[0.609,0.292],[0.628,0.294],[0.646,0.302],[0.663,0.314],[0.678,0.331],[0.692,0.353],[0.704,0.378],[0.714,0.405],[0.721,0.436],[0.725,0.467],[0.727,0.5],[0.725,0.533],[0.721,0.564],[0.714,0.595],[0.704,0.622],[0.692,0.647],[0.678,0.669],[0.663,0.686],[0.646,0.698],[0.628,0.706],[0.609,0.708],[0.591,0.706],[0.573,0.698],[0.556,0.686],[0.54,0.669],[0.527,0.647],[0.515,0.622],[0.505,0.595],[0.498,0.564],[0.494,0.533],[0.492,0.5],[0.494,0.467],[0.498,0.436],[0.505,0.405],[0.515,0.378],[0.527,0.353],[0.54,0.331],[0.556,0.314],[0.573,0.302],[0.591,0.294],[0.609,0.292]],"motion":"draw"},
 {"type":"path","x":0.628,"y":0.532,"width":0.19,"height":0.342,"color":"#817a6e","lineWidth":1.5,"start":3.2,"duration":2.5,"text":"","points":[[0.688,0.361],[0.707,0.396],[0.716,0.429],[0.683,0.37],[0.678,0.379],[0.72,0.455],[0.723,0.476],[0.673,0.388],[0.668,0.396],[0.723,0.495],[0.723,0.512],[0.663,0.405],[0.658,0.414],[0.722,0.529],[0.721,0.543],[0.653,0.423],[0.648,0.432],[0.719,0.558],[0.716,0.571],[0.643,0.441],[0.638,0.449],[0.713,0.583],[0.71,0.595],[0.633,0.458],[0.628,0.467],[0.706,0.606],[0.702,0.617],[0.623,0.476],[0.618,0.485],[0.698,0.627],[0.693,0.637],[0.613,0.494],[0.608,0.502],[0.689,0.646],[0.683,0.654],[0.603,0.511],[0.598,0.52],[0.678,0.662],[0.672,0.669],[0.593,0.529],[0.588,0.538],[0.666,0.676],[0.659,0.682],[0.583,0.547],[0.578,0.555],[0.653,0.688],[0.645,0.692],[0.573,0.564],[0.568,0.573],[0.638,0.696],[0.629,0.699],[0.563,0.582],[0.558,0.591],[0.621,0.701],[0.611,0.703],[0.553,0.6],[0.548,0.609],[0.601,0.702],[0.589,0.699],[0.543,0.617],[0.538,0.626],[0.576,0.694],[0.56,0.682],[0.533,0.635]],"motion":"draw"},
 {"type":"path","x":0.653,"y":0.578,"width":0.13,"height":0.232,"color":"#403d36","lineWidth":1.5,"start":5.0,"duration":2.0,"text":"","points":[[0.588,0.658],[0.698,0.462],[0.703,0.472],[0.593,0.666],[0.599,0.673],[0.707,0.482],[0.71,0.493],[0.606,0.679],[0.613,0.685],[0.713,0.506],[0.716,0.519],[0.62,0.689],[0.628,0.692],[0.717,0.534],[0.718,0.55],[0.637,0.694],[0.647,0.694],[0.718,0.567],[0.716,0.589],[0.659,0.69],[0.675,0.68],[0.711,0.617]],"motion":"draw"},
 {"type":"path","x":0.367,"y":0.312,"width":0.141,"height":0.097,"color":"#817a6e","lineWidth":2,"start":6.2,"duration":0.8,"text":"","points":[[0.297,0.264],[0.438,0.361]],"motion":"draw"},
 {"type":"path","x":0.428,"y":0.353,"width":0.019,"height":0.028,"color":"#817a6e","lineWidth":2,"start":6.8,"duration":0.4,"text":"","points":[[0.422,0.339],[0.438,0.361],[0.419,0.367]],"motion":"draw"},
 {"type":"text","x":0.234,"y":0.472,"width":0.281,"height":0.064,"color":"#403d36","lineWidth":1,"start":6.6,"duration":1.0,"text":"Küre etüdü","points":[],"motion":"fade"},
 {"type":"text","x":0.234,"y":0.549,"width":0.281,"height":0.039,"color":"#403d36","lineWidth":1,"start":7.0,"duration":1.0,"text":"ışık soldan","points":[],"motion":"fade"}
]}
```

## Örnek 2 — zengin: kemerler

```json
{"category":"pencil","title":"Kemerli geçit","duration":14,"seed":31,"speed":1,"detail":1,"background":"#f1ede3","palette":["#403d36","#817a6e","#b2aa9b"],"objects":[
 {"type":"path","x":0.5,"y":0.808,"width":0.844,"height":0.003,"color":"#403d36","lineWidth":2,"start":0.2,"duration":1.5,"text":"","points":[[0.078,0.808],[0.922,0.808]],"motion":"draw"},
 {"type":"path","x":0.5,"y":0.564,"width":0.547,"height":0.489,"color":"#403d36","lineWidth":2.5,"start":0.6,"duration":2.0,"text":"","points":[[0.227,0.808],[0.227,0.319],[0.773,0.319],[0.773,0.808]],"motion":"draw"},
 {"type":"path","x":0.328,"y":0.604,"width":0.141,"height":0.403,"color":"#403d36","lineWidth":2.5,"start":1.4,"duration":1.8,"text":"","points":[[0.258,0.806],[0.258,0.528],[0.258,0.528],[0.259,0.503],[0.263,0.48],[0.27,0.458],[0.278,0.439],[0.289,0.424],[0.301,0.412],[0.314,0.405],[0.328,0.403],[0.342,0.405],[0.355,0.412],[0.367,0.424],[0.378,0.439],[0.387,0.458],[0.393,0.48],[0.397,0.503],[0.398,0.528],[0.398,0.806]],"motion":"draw"},
 {"type":"path","x":0.5,"y":0.604,"width":0.141,"height":0.403,"color":"#403d36","lineWidth":2.5,"start":2.4,"duration":1.8,"text":"","points":[[0.43,0.806],[0.43,0.528],[0.43,0.528],[0.431,0.503],[0.435,0.48],[0.442,0.458],[0.45,0.439],[0.461,0.424],[0.473,0.412],[0.486,0.405],[0.5,0.403],[0.514,0.405],[0.527,0.412],[0.539,0.424],[0.55,0.439],[0.558,0.458],[0.565,0.48],[0.569,0.503],[0.57,0.528],[0.57,0.806]],"motion":"draw"},
 {"type":"path","x":0.672,"y":0.604,"width":0.141,"height":0.403,"color":"#403d36","lineWidth":2.5,"start":3.4,"duration":1.8,"text":"","points":[[0.602,0.806],[0.602,0.528],[0.602,0.528],[0.603,0.503],[0.607,0.48],[0.613,0.458],[0.622,0.439],[0.633,0.424],[0.645,0.412],[0.658,0.405],[0.672,0.403],[0.686,0.405],[0.699,0.412],[0.711,0.424],[0.722,0.439],[0.73,0.458],[0.737,0.48],[0.741,0.503],[0.742,0.528],[0.742,0.806]],"motion":"draw"},
 {"type":"path","x":0.328,"y":0.606,"width":0.134,"height":0.394,"color":"#817a6e","lineWidth":1.5,"start":5.0,"duration":2.0,"text":"","points":[[0.358,0.421],[0.388,0.474],[0.393,0.499],[0.344,0.412],[0.334,0.409],[0.395,0.517],[0.395,0.534],[0.325,0.409],[0.317,0.411],[0.395,0.55],[0.395,0.566],[0.31,0.414],[0.303,0.418],[0.395,0.582],[0.395,0.597],[0.297,0.422],[0.292,0.428],[0.395,0.613],[0.395,0.629],[0.286,0.435],[0.282,0.442],[0.395,0.644],[0.395,0.66],[0.277,0.45],[0.274,0.459],[0.395,0.676],[0.395,0.691],[0.27,0.469],[0.267,0.479],[0.395,0.707],[0.395,0.723],[0.265,0.491],[0.263,0.503],[0.395,0.739],[0.395,0.754],[0.262,0.517],[0.261,0.531],[0.395,0.77],[0.395,0.786],[0.261,0.547],[0.261,0.563],[0.395,0.801],[0.387,0.803],[0.261,0.578],[0.261,0.594],[0.378,0.803],[0.37,0.803],[0.261,0.61],[0.261,0.625],[0.361,0.803],[0.352,0.803],[0.261,0.641],[0.261,0.657],[0.343,0.803],[0.334,0.803],[0.261,0.673],[0.261,0.688],[0.325,0.803],[0.316,0.803],[0.261,0.704],[0.261,0.72],[0.308,0.803],[0.299,0.803],[0.261,0.735],[0.261,0.751],[0.29,0.803],[0.281,0.803],[0.261,0.767],[0.261,0.783],[0.272,0.803]],"motion":"draw"},
 {"type":"path","x":0.5,"y":0.606,"width":0.134,"height":0.394,"color":"#817a6e","lineWidth":1.5,"start":5.6,"duration":2.0,"text":"","points":[[0.53,0.421],[0.56,0.474],[0.565,0.499],[0.516,0.412],[0.506,0.409],[0.567,0.517],[0.567,0.534],[0.497,0.409],[0.489,0.411],[0.567,0.55],[0.567,0.566],[0.482,0.414],[0.475,0.418],[0.567,0.582],[0.567,0.597],[0.469,0.422],[0.463,0.428],[0.567,0.613],[0.567,0.629],[0.458,0.435],[0.454,0.442],[0.567,0.644],[0.567,0.66],[0.449,0.45],[0.445,0.459],[0.567,0.676],[0.567,0.691],[0.442,0.469],[0.439,0.479],[0.567,0.707],[0.567,0.723],[0.437,0.491],[0.434,0.503],[0.567,0.739],[0.567,0.754],[0.434,0.517],[0.433,0.531],[0.567,0.77],[0.567,0.786],[0.433,0.547],[0.433,0.563],[0.567,0.801],[0.559,0.803],[0.433,0.578],[0.433,0.594],[0.55,0.803],[0.541,0.803],[0.433,0.61],[0.433,0.625],[0.533,0.803],[0.524,0.803],[0.433,0.641],[0.433,0.657],[0.515,0.803],[0.506,0.803],[0.433,0.673],[0.433,0.688],[0.497,0.803],[0.488,0.803],[0.433,0.704],[0.433,0.72],[0.48,0.803],[0.471,0.803],[0.433,0.735],[0.433,0.751],[0.462,0.803],[0.453,0.803],[0.433,0.767],[0.433,0.783],[0.444,0.803]],"motion":"draw"},
 {"type":"path","x":0.672,"y":0.606,"width":0.134,"height":0.394,"color":"#817a6e","lineWidth":1.5,"start":6.2,"duration":2.0,"text":"","points":[[0.702,0.421],[0.732,0.474],[0.737,0.499],[0.688,0.412],[0.678,0.409],[0.738,0.517],[0.739,0.534],[0.669,0.409],[0.661,0.411],[0.739,0.55],[0.739,0.566],[0.653,0.414],[0.647,0.418],[0.739,0.582],[0.739,0.597],[0.641,0.422],[0.635,0.428],[0.739,0.613],[0.739,0.629],[0.63,0.435],[0.625,0.442],[0.739,0.644],[0.739,0.66],[0.621,0.45],[0.617,0.459],[0.739,0.676],[0.739,0.691],[0.614,0.469],[0.611,0.479],[0.739,0.707],[0.739,0.723],[0.608,0.491],[0.606,0.503],[0.739,0.739],[0.739,0.754],[0.605,0.517],[0.605,0.531],[0.739,0.77],[0.739,0.786],[0.605,0.547],[0.605,0.563],[0.739,0.801],[0.731,0.803],[0.605,0.578],[0.605,0.594],[0.722,0.803],[0.713,0.803],[0.605,0.61],[0.605,0.625],[0.704,0.803],[0.696,0.803],[0.605,0.641],[0.605,0.657],[0.687,0.803],[0.678,0.803],[0.605,0.673],[0.605,0.688],[0.669,0.803],[0.66,0.803],[0.605,0.704],[0.605,0.72],[0.651,0.803],[0.643,0.803],[0.605,0.735],[0.605,0.751],[0.634,0.803],[0.625,0.803],[0.605,0.767],[0.605,0.783],[0.616,0.803]],"motion":"draw"},
 {"type":"path","x":0.5,"y":0.828,"width":0.844,"height":0.028,"color":"#b2aa9b","lineWidth":1.5,"start":7.2,"duration":1.6,"text":"","points":[[0.918,0.814],[0.922,0.834],[0.915,0.842],[0.909,0.814],[0.901,0.814],[0.907,0.842],[0.898,0.842],[0.893,0.814],[0.884,0.814],[0.89,0.842],[0.882,0.842],[0.876,0.814],[0.868,0.814],[0.874,0.842],[0.865,0.842],[0.86,0.814],[0.851,0.814],[0.857,0.842],[0.849,0.842],[0.843,0.814],[0.835,0.814],[0.84,0.842],[0.832,0.842],[0.826,0.814],[0.818,0.814],[0.824,0.842],[0.815,0.842],[0.81,0.814],[0.801,0.814],[0.807,0.842],[0.799,0.842],[0.793,0.814],[0.785,0.814],[0.79,0.842],[0.782,0.842],[0.776,0.814],[0.768,0.814],[0.774,0.842],[0.765,0.842],[0.76,0.814],[0.751,0.814],[0.757,0.842],[0.749,0.842],[0.743,0.814],[0.735,0.814],[0.74,0.842],[0.732,0.842],[0.726,0.814],[0.718,0.814],[0.724,0.842],[0.716,0.842],[0.71,0.814],[0.702,0.814],[0.707,0.842],[0.699,0.842],[0.693,0.814],[0.685,0.814],[0.691,0.842],[0.682,0.842],[0.677,0.814],[0.668,0.814],[0.674,0.842],[0.666,0.842],[0.66,0.814],[0.652,0.814],[0.657,0.842],[0.649,0.842],[0.643,0.814],[0.635,0.814],[0.641,0.842],[0.632,0.842],[0.627,0.814],[0.618,0.814],[0.624,0.842],[0.616,0.842],[0.61,0.814],[0.602,0.814],[0.607,0.842],[0.599,0.842],[0.593,0.814],[0.585,0.814],[0.591,0.842],[0.583,0.842],[0.577,0.814],[0.569,0.814],[0.574,0.842],[0.566,0.842],[0.56,0.814],[0.552,0.814],[0.558,0.842],[0.549,0.842],[0.544,0.814],[0.535,0.814],[0.541,0.842],[0.533,0.842],[0.527,0.814],[0.519,0.814],[0.524,0.842],[0.516,0.842],[0.51,0.814],[0.502,0.814],[0.508,0.842],[0.499,0.842],[0.494,0.814],[0.485,0.814],[0.491,0.842],[0.483,0.842],[0.477,0.814],[0.469,0.814],[0.474,0.842],[0.466,0.842],[0.46,0.814],[0.452,0.814],[0.458,0.842],[0.45,0.842],[0.444,0.814],[0.436,0.814],[0.441,0.842],[0.433,0.842],[0.427,0.814],[0.419,0.814],[0.425,0.842],[0.416,0.842],[0.411,0.814],[0.402,0.814],[0.408,0.842],[0.4,0.842],[0.394,0.814],[0.386,0.814],[0.391,0.842],[0.383,0.842],[0.377,0.814],[0.369,0.814],[0.375,0.842],[0.366,0.842],[0.361,0.814],[0.352,0.814],[0.358,0.842],[0.35,0.842],[0.344,0.814],[0.336,0.814],[0.341,0.842],[0.333,0.842],[0.327,0.814],[0.319,0.814],[0.325,0.842],[0.316,0.842],[0.311,0.814],[0.302,0.814],[0.308,0.842],[0.3,0.842],[0.294,0.814],[0.286,0.814],[0.292,0.842],[0.283,0.842],[0.278,0.814],[0.269,0.814],[0.275,0.842],[0.267,0.842],[0.261,0.814],[0.253,0.814],[0.258,0.842],[0.25,0.842],[0.244,0.814],[0.236,0.814],[0.242,0.842],[0.233,0.842],[0.228,0.814],[0.219,0.814],[0.225,0.842],[0.217,0.842],[0.211,0.814],[0.203,0.814],[0.208,0.842],[0.2,0.842],[0.194,0.814],[0.186,0.814],[0.192,0.842],[0.183,0.842],[0.178,0.814],[0.169,0.814],[0.175,0.842],[0.167,0.842],[0.161,0.814],[0.153,0.814],[0.159,0.842],[0.15,0.842],[0.145,0.814],[0.136,0.814],[0.142,0.842],[0.134,0.842],[0.128,0.814],[0.12,0.814],[0.125,0.842],[0.117,0.842],[0.111,0.814],[0.103,0.814],[0.109,0.842],[0.1,0.842],[0.095,0.814],[0.086,0.814],[0.092,0.842],[0.084,0.842],[0.078,0.814]],"motion":"draw"},
 {"type":"path","x":0.711,"y":0.396,"width":0.109,"height":0.125,"color":"#b2aa9b","lineWidth":1.2,"start":7.8,"duration":1.2,"text":"","points":[[0.762,0.333],[0.766,0.34],[0.766,0.354],[0.754,0.333],[0.746,0.333],[0.766,0.368],[0.766,0.381],[0.739,0.333],[0.731,0.333],[0.766,0.395],[0.766,0.409],[0.723,0.333],[0.715,0.333],[0.766,0.423],[0.766,0.436],[0.708,0.333],[0.7,0.333],[0.766,0.45],[0.762,0.458],[0.692,0.333],[0.684,0.333],[0.755,0.458],[0.747,0.458],[0.677,0.333],[0.669,0.333],[0.739,0.458],[0.732,0.458],[0.661,0.333],[0.656,0.338],[0.724,0.458],[0.716,0.458],[0.656,0.352],[0.656,0.366],[0.708,0.458],[0.701,0.458],[0.656,0.38],[0.656,0.393],[0.693,0.458],[0.685,0.458],[0.656,0.407],[0.656,0.421],[0.677,0.458],[0.67,0.458],[0.656,0.434],[0.656,0.448],[0.662,0.458]],"motion":"draw"},
 {"type":"text","x":0.5,"y":0.167,"width":0.391,"height":0.061,"color":"#403d36","lineWidth":1,"start":8.6,"duration":1.0,"text":"Kemerli geçit","points":[],"motion":"fade"},
 {"type":"text","x":0.5,"y":0.233,"width":0.391,"height":0.036,"color":"#403d36","lineWidth":1,"start":9.2,"duration":1.0,"text":"kontur, tarama, gölge","points":[],"motion":"fade"}
]}
```

## Kabul ölçütleri

Kontur okunur; tarama formu destekler; ışık yönü tutarlı; kâğıt beyazı ışık olarak korunur.
Son kare tek başına bakıldığında bitmiş, dengeli bir resim olmalı; tüm metin okunur ve güvenli alanda.

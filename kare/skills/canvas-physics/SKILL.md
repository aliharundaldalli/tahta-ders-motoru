---
name: canvas-physics
description: "Kare Canvas 2D sahnelerini fizik diyagramı stilinde üretir: sarkaç, eğik atış, yay, yörünge; stroboskopik ardışık konumlar, vektör okları, etiketli büyüklükler. Fizik, mekanik, salınım, hareket, bilim eğitimi istekleri için kullan."
---

# canvas-physics · Fizik ve salınım

Bu beceri, Kare'nin Canvas 2D motorunda **Fizik ve salınım** stilinde, AI'ın JSON olarak döndürdüğü düzenlenebilir sahneler içindir (kod değil, yalnızca sahne verisi; `composed` sahnelerde hazır prosedürel çizim kapalıdır, her şeyi nesnelerle sen kurarsın).

## Amaç ve görünüm

Ders kitabı fizik diyagramı, canlandırılmış: sabit referans (tavan, zemin) koyu, yörünge ince soluk çizgi, hareketli cisim eşit zaman aralıklarında ardışık konumlarla (stroboskop) gösterilir. Vektör okları, açı yayları, kısa etiketler ve bir formül. Motor nesneleri yerinden oynatamaz; hareket, ardışık konumların zamanla belirmesiyle anlatılır.

## Tuval ve güvenli alan

- Mantıksal tuval **1280×720**. Tüm `x`, `y`, `width`, `height` ve path noktaları **0–1 normalize** değerdir: piksel = x·1280, y·720.
- `x`,`y` nesnenin **merkezidir** (circle, ellipse, rect, text). Path için `x`,`y` noktaların sınır kutusunun merkezi, `width`/`height` kutunun boyu olsun (döndürme ve kalite denetimi bunu kullanır).
- **Güvenli alan:** x .04–.96, y .08–.82. Alt ~100 px (y > .86) altyazı bandıdır; metni ve odak nesnesini oraya koyma. Zemin/gökyüzü gibi arka plan bantları kenara kadar uzanabilir ama 0–1 dışına taşmasın.
- Circle'da `width` çaptır ve 1280 px'e göredir: dikey yarıçap = width·1280/720/2 (ör. width .1 → 128 px çap, y'de ±.089). `height` circle için kullanılmaz, width ile aynı oranı yaz.
- Nesneler dizideki **sırayla** çizilir: önce arka plan, sonra orta plan, en son ön plan ve metin.

## Kompozisyon

- Bir **odak nesnesi** seç ve üçte bir noktalarına (x≈.33/.67, y≈.33/.6) ya da bilinçli olarak merkeze yerleştir; 3–7 ana form + destekleyici ayrıntı.
- Derinlik katmanları: arka plan (büyük, düşük kontrast) → orta plan → ön plan (en koyu/en doygun) → metin. Boş alan bırak; ana formlar çerçeve genişliğinin en az %12'si olsun.
- Deney düzeneği sahnenin sol %60'ında, formül ve açıklama sağda.
- Yörünge ve konumlar fizik denklemiyle hesaplanır (sarkaç: (px + L sinθ, py + L cosθ); atış: x = v₀cosθ·t, y = v₀sinθ·t − gt²/2) ve piksele ölçeklenir.
- Etiketler ilgili öğenin 30–50 px yanında; okların üstüne binmez.

## Palet

Arka plan **#ece9df**. Tema paleti (sırayla): `#455b57`, `#bd896c`, `#879f94`.
- `#455b57` — sabit yapı, oklar, tüm metin (arka planla kontrast 6.0:1)
- `#bd896c` — hareket eden cisim, açı yayı (arka planla kontrast 2.5:1)
- `#879f94` — yörünge izi (arka planla kontrast 2.3:1)
Geçmiş konumlar (stroboskop hayaletleri) için soluk `#cfc8b8`. Son/güncel konum dolu vurgu renginde.

## Zamanlama ve koreografi

Süre D için ritim: **%0–15** sahneyi kur (arka plan, zemin, büyük renk alanları) · **%15–60** odak nesnesini inşa et (ana çizgiler `draw`, ana formlar `fade`/`slide`) · **%55–85** ayrıntı, vurgu ve etiketler · **%85–100** bekleme: yeni nesne yok, yalnızca 1–4 `float`/`rotate` ortam hareketi.
- Girişleri **kademelendir**: kardeş öğeler arasında .15–.6 sn aralık; aynı anda en fazla 2–3 nesne başlasın. `start` değerlerinin hepsi 0 olmasın.
- Tipik giriş süresi: fade .6–1.5 sn, slide .8–1.2 sn, draw 1.5–4 sn (uzun yol = daha uzun süre). Çok kısa (<.3 sn) girişler sıçrama gibi görünür.
- Son nesne en geç D·0.8'de başlasın; izleyici bitmiş resmi en az 2 sn görsün.
- Yapı (zemin/tavan, pivot) → yörünge `draw` → konumlar zaman sırasıyla. Yörünge noktaları eşit zaman adımlarıyla örneklenirse `draw` ilerlemesi fiziksel zamana denk gelir: konum i'nin start'ı = yörünge start + süre × i/n.
- Oklar (gövde `draw` + uç) → açı yayı → etiketler → formül.

## Metin

- Türkçe karakterleri doğru yaz (ç ğ ı İ ö ş ü). Başlık en fazla ~5 kelime, etiket 1–3 kelime; bir text nesnesinde en fazla 8 kelime.
- Boyut (`height`): başlık .06–.09 (43–65 px), alt başlık .04–.05, etiket .033–.04 (24–29 px). 20 px altı okunmaz.
- `width` metni sığdıracak kadar geniş olsun (yaklaşık karakter sayısı × yazı boyu × .56 / 1280). Metinler birbiriyle ve yoğun şekillerle çakışmasın.
- Metin rengi arka planla en az 4.5:1 kontrast vermeli: bu stilde metin için **#455b57** kullan.

## Nesne sözleşmesi (AI çıktısı — alanlar birebir)

Sahne: `category` (bu beceri: **physics**), `title` (1–160), `duration` (2–60 sn), `seed` (tamsayı), `speed` (.2–3, float/rotate hızını çarpar), `detail` (.25–2), `background` (#RRGGBB), `palette` (2–8 × #RRGGBB), `objects` (en fazla 80; iyi sahne 8–30).
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

- Stroboskop: aynı cismin 5–7 kopyası, öncekiler soluk, sonuncusu vurgu renginde.
- Ok: 2 noktalı gövde + 3 noktalı uç path (uç uzunluğu 14 px, yarı genişlik 8 px).
- Açı yayı: merkezden 50–60 px yarıçaplı kısa arc path + "θ" etiketi.
- Formülü Unicode ile yaz (√, π, ², ₀, θ, ↓); TeX kullanma.

## Sık hatalar (kaçın)

- Nesneyi çerçeve dışına taşırmak (x±width/2, circle'da dikey yarıçap, float için +14 px pay) ya da metni altyazı bandına koymak.
- Bütün nesneleri `start: 0` ile başlatmak; ya da son saniyede yeni nesne getirmek.
- Minik şekiller (width < .015) ve 20 px altı yazılar; ana form çerçevenin %12'sinden küçük.
- 40'tan fazla benzer küçük nesne (parçacık/nokta yığını) — ritim kaybolur, sahne kirlenir. 10–25 yeterli.
- Yanlış alan adları (`radius`, `fill`, `size`, `fontSize`, `delay`, `animation`, `keyframes`) ya da eksik alan; renkleri `rgb()`/isimle yazmak.
- Path'i dolgu sanmak; path `x`,`y` değerini sınır kutusu merkezine koymamak; 2'den az nokta.
- Her şeyi aynı boyutta, ortada üst üste yığmak; odak nesnesi olmayan "dağınık" kompozisyon.
- Cismin hareket ettiğini sanıp tek kopya çizmek; yörüngeyi denklem yerine gözle çizmek.
- İp uzunluğunu konumdan konuma değiştirmek; ölçek/birim belirtmeden kesin bilimsel iddia.

## Örnek 1 — kısa: sarkaç stroboskop

```json
{"category":"physics","title":"Sarkaç","duration":9,"seed":2,"speed":1,"detail":1,"background":"#ece9df","palette":["#455b57","#bd896c","#879f94","#cfc8b8"],"objects":[
 {"type":"rect","x":0.406,"y":0.144,"width":0.234,"height":0.022,"color":"#455b57","lineWidth":1,"start":0.0,"duration":0.6,"text":"","points":[],"motion":"fade"},
 {"type":"circle","x":0.406,"y":0.161,"width":0.013,"height":0.022,"color":"#455b57","lineWidth":1,"start":0.4,"duration":0.4,"text":"","points":[],"motion":"fade"},
 {"type":"path","x":0.406,"y":0.55,"width":0.234,"height":0.056,"color":"#879f94","lineWidth":2,"start":1.0,"duration":1.4,"text":"","points":[[0.523,0.522],[0.513,0.532],[0.502,0.542],[0.49,0.55],[0.479,0.557],[0.467,0.564],[0.455,0.569],[0.443,0.573],[0.431,0.575],[0.419,0.577],[0.406,0.578],[0.394,0.577],[0.382,0.575],[0.37,0.573],[0.358,0.569],[0.346,0.564],[0.334,0.557],[0.322,0.55],[0.311,0.542],[0.3,0.532],[0.289,0.522]],"motion":"draw"},
 {"type":"path","x":0.348,"y":0.342,"width":0.117,"height":0.361,"color":"#cfc8b8","lineWidth":2,"start":2.6,"duration":0.4,"text":"","points":[[0.406,0.161],[0.289,0.522]],"motion":"draw"},
 {"type":"circle","x":0.289,"y":0.522,"width":0.034,"height":0.061,"color":"#cfc8b8","lineWidth":1,"start":2.8,"duration":0.4,"text":"","points":[],"motion":"fade"},
 {"type":"path","x":0.376,"y":0.362,"width":0.061,"height":0.402,"color":"#cfc8b8","lineWidth":2,"start":3.1,"duration":0.4,"text":"","points":[[0.406,0.161],[0.346,0.564]],"motion":"draw"},
 {"type":"circle","x":0.346,"y":0.564,"width":0.034,"height":0.061,"color":"#cfc8b8","lineWidth":1,"start":3.3,"duration":0.4,"text":"","points":[],"motion":"fade"},
 {"type":"path","x":0.406,"y":0.369,"width":0.002,"height":0.417,"color":"#cfc8b8","lineWidth":2,"start":3.6,"duration":0.4,"text":"","points":[[0.406,0.161],[0.406,0.578]],"motion":"draw"},
 {"type":"circle","x":0.406,"y":0.578,"width":0.034,"height":0.061,"color":"#cfc8b8","lineWidth":1,"start":3.8,"duration":0.4,"text":"","points":[],"motion":"fade"},
 {"type":"path","x":0.437,"y":0.362,"width":0.061,"height":0.402,"color":"#cfc8b8","lineWidth":2,"start":4.1,"duration":0.4,"text":"","points":[[0.406,0.161],[0.467,0.564]],"motion":"draw"},
 {"type":"circle","x":0.467,"y":0.564,"width":0.034,"height":0.061,"color":"#cfc8b8","lineWidth":1,"start":4.3,"duration":0.4,"text":"","points":[],"motion":"fade"},
 {"type":"path","x":0.465,"y":0.342,"width":0.117,"height":0.361,"color":"#455b57","lineWidth":2.5,"start":4.6,"duration":0.4,"text":"","points":[[0.406,0.161],[0.523,0.522]],"motion":"draw"},
 {"type":"circle","x":0.523,"y":0.522,"width":0.034,"height":0.061,"color":"#bd896c","lineWidth":1,"start":4.8,"duration":0.4,"text":"","points":[],"motion":"fade"},
 {"type":"text","x":0.453,"y":0.361,"width":0.047,"height":0.042,"color":"#455b57","lineWidth":1,"start":5.4,"duration":0.6,"text":"L","points":[],"motion":"fade"},
 {"type":"text","x":0.375,"y":0.264,"width":0.047,"height":0.042,"color":"#455b57","lineWidth":1,"start":5.8,"duration":0.6,"text":"θ","points":[],"motion":"fade"},
 {"type":"text","x":0.773,"y":0.417,"width":0.266,"height":0.047,"color":"#455b57","lineWidth":1,"start":6.2,"duration":1.0,"text":"T = 2π√(L/g)","points":[],"motion":"fade"},
 {"type":"text","x":0.773,"y":0.5,"width":0.266,"height":0.033,"color":"#455b57","lineWidth":1,"start":6.8,"duration":1.0,"text":"küçük açı yaklaşımı","points":[],"motion":"fade"}
]}
```

## Örnek 2 — zengin: eğik atış

```json
{"category":"physics","title":"Eğik atış","duration":14,"seed":50,"speed":1,"detail":1,"background":"#ece9df","palette":["#455b57","#bd896c","#879f94","#cfc8b8"],"objects":[
 {"type":"path","x":0.508,"y":0.781,"width":0.828,"height":0.003,"color":"#455b57","lineWidth":3,"start":0.0,"duration":1.0,"text":"","points":[[0.094,0.781],[0.922,0.781]],"motion":"draw"},
 {"type":"path","x":0.155,"y":0.747,"width":0.035,"height":0.074,"color":"#455b57","lineWidth":22,"start":0.6,"duration":0.6,"text":"","points":[[0.137,0.784],[0.155,0.747],[0.172,0.71]],"motion":"fade"},
 {"type":"path","x":0.483,"y":0.597,"width":0.684,"height":0.362,"color":"#879f94","lineWidth":2.5,"start":2.0,"duration":4.8,"text":"","points":[[0.141,0.778],[0.169,0.72],[0.198,0.667],[0.226,0.619],[0.255,0.577],[0.283,0.539],[0.312,0.506],[0.34,0.478],[0.369,0.456],[0.397,0.438],[0.426,0.426],[0.454,0.418],[0.483,0.416],[0.511,0.418],[0.54,0.426],[0.568,0.438],[0.597,0.456],[0.625,0.478],[0.654,0.506],[0.682,0.539],[0.711,0.577],[0.739,0.619],[0.768,0.667],[0.796,0.72],[0.825,0.778]],"motion":"draw"},
 {"type":"circle","x":0.141,"y":0.778,"width":0.017,"height":0.031,"color":"#bd896c","lineWidth":1,"start":2.0,"duration":0.3,"text":"","points":[],"motion":"fade"},
 {"type":"circle","x":0.255,"y":0.577,"width":0.017,"height":0.031,"color":"#bd896c","lineWidth":1,"start":2.8,"duration":0.3,"text":"","points":[],"motion":"fade"},
 {"type":"circle","x":0.369,"y":0.456,"width":0.017,"height":0.031,"color":"#bd896c","lineWidth":1,"start":3.6,"duration":0.3,"text":"","points":[],"motion":"fade"},
 {"type":"circle","x":0.483,"y":0.416,"width":0.017,"height":0.031,"color":"#bd896c","lineWidth":1,"start":4.4,"duration":0.3,"text":"","points":[],"motion":"fade"},
 {"type":"circle","x":0.597,"y":0.456,"width":0.017,"height":0.031,"color":"#bd896c","lineWidth":1,"start":5.2,"duration":0.3,"text":"","points":[],"motion":"fade"},
 {"type":"circle","x":0.711,"y":0.577,"width":0.017,"height":0.031,"color":"#bd896c","lineWidth":1,"start":6.0,"duration":0.3,"text":"","points":[],"motion":"fade"},
 {"type":"circle","x":0.825,"y":0.778,"width":0.017,"height":0.031,"color":"#bd896c","lineWidth":1,"start":6.8,"duration":0.3,"text":"","points":[],"motion":"fade"},
 {"type":"path","x":0.168,"y":0.719,"width":0.055,"height":0.117,"color":"#455b57","lineWidth":3,"start":7.2,"duration":0.5,"text":"","points":[[0.141,0.778],[0.196,0.661]],"motion":"draw"},
 {"type":"path","x":0.19,"y":0.672,"width":0.012,"height":0.022,"color":"#455b57","lineWidth":3,"start":7.6,"duration":0.3,"text":"","points":[[0.184,0.668],[0.196,0.661],[0.194,0.683]],"motion":"draw"},
 {"type":"path","x":0.51,"y":0.416,"width":0.055,"height":0.003,"color":"#455b57","lineWidth":3,"start":7.8,"duration":0.5,"text":"","points":[[0.483,0.416],[0.538,0.416]],"motion":"draw"},
 {"type":"path","x":0.532,"y":0.416,"width":0.011,"height":0.022,"color":"#455b57","lineWidth":3,"start":8.2,"duration":0.3,"text":"","points":[[0.527,0.404],[0.538,0.416],[0.527,0.427]],"motion":"draw"},
 {"type":"path","x":0.179,"y":0.746,"width":0.017,"height":0.064,"color":"#bd896c","lineWidth":2,"start":8.4,"duration":0.5,"text":"","points":[[0.171,0.714],[0.174,0.719],[0.177,0.724],[0.179,0.73],[0.181,0.736],[0.183,0.743],[0.185,0.749],[0.186,0.756],[0.187,0.763],[0.187,0.771],[0.188,0.778]],"motion":"draw"},
 {"type":"text","x":0.219,"y":0.736,"width":0.047,"height":0.039,"color":"#455b57","lineWidth":1,"start":8.8,"duration":0.5,"text":"θ","points":[],"motion":"fade"},
 {"type":"text","x":0.172,"y":0.569,"width":0.055,"height":0.039,"color":"#455b57","lineWidth":1,"start":9.0,"duration":0.5,"text":"v₀","points":[],"motion":"fade"},
 {"type":"text","x":0.828,"y":0.417,"width":0.094,"height":0.042,"color":"#455b57","lineWidth":1,"start":9.4,"duration":0.5,"text":"g ↓","points":[],"motion":"fade"},
 {"type":"text","x":0.297,"y":0.208,"width":0.281,"height":0.064,"color":"#455b57","lineWidth":1,"start":10.0,"duration":1.0,"text":"Eğik atış","points":[],"motion":"fade"},
 {"type":"text","x":0.297,"y":0.285,"width":0.328,"height":0.033,"color":"#455b57","lineWidth":1,"start":10.6,"duration":1.0,"text":"eşit zaman aralıklı konumlar","points":[],"motion":"fade"}
]}
```

## Kabul ölçütleri

İp uzunluğu sabit; pivot kaymıyor; konumlar zamanla tutarlı; formül ve etiketler okunur.
Son kare tek başına bakıldığında bitmiş, dengeli bir resim olmalı; tüm metin okunur ve güvenli alanda.

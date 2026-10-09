---
name: canvas-botanical
description: "Kare Canvas 2D sahnelerini botanik illüstrasyon stilinde üretir: büyüyen saplar, sırayla açılan yapraklar ve çiçekler, sıcak toprak tonları. Bitki, çiçek, büyüme, bahçe, doğa eğitimi istekleri için kullan."
---

# canvas-botanical · Botanik

Bu beceri, Kare'nin Canvas 2D motorunda **Botanik** stilinde, AI'ın JSON olarak döndürdüğü düzenlenebilir sahneler içindir (kod değil, yalnızca sahne verisi; `composed` sahnelerde hazır prosedürel çizim kapalıdır, her şeyi nesnelerle sen kurarsın).

## Amaç ve görünüm

Sıcak kâğıt üzerinde düz renkli botanik çizim: saplar ince-orta (5–6 px) yeşil eğriler, yapraklar bükülmüş kalın kapsüller, çiçekler ışınsal taç yapraklar ya da yuvarlak çanaklar. Bitki tabanı zemine ya da saksıya oturur; havada yaprak yok.

## Tuval ve güvenli alan

- Mantıksal tuval **1280×720**. Tüm `x`, `y`, `width`, `height` ve path noktaları **0–1 normalize** değerdir: piksel = x·1280, y·720.
- `x`,`y` nesnenin **merkezidir** (circle, ellipse, rect, text). Path için `x`,`y` noktaların sınır kutusunun merkezi, `width`/`height` kutunun boyu olsun (döndürme ve kalite denetimi bunu kullanır).
- **Güvenli alan:** x .04–.96, y .08–.82. Alt ~100 px (y > .86) altyazı bandıdır; metni ve odak nesnesini oraya koyma. Zemin/gökyüzü gibi arka plan bantları kenara kadar uzanabilir ama 0–1 dışına taşmasın.
- Circle'da `width` çaptır ve 1280 px'e göredir: dikey yarıçap = width·1280/720/2 (ör. width .1 → 128 px çap, y'de ±.089). `height` circle için kullanılmaz, width ile aynı oranı yaz.
- Nesneler dizideki **sırayla** çizilir: önce arka plan, sonra orta plan, en son ön plan ve metin.

## Kompozisyon

- Bir **odak nesnesi** seç ve üçte bir noktalarına (x≈.33/.67, y≈.33/.6) ya da bilinçli olarak merkeze yerleştir; 3–7 ana form + destekleyici ayrıntı.
- Derinlik katmanları: arka plan (büyük, düşük kontrast) → orta plan → ön plan (en koyu/en doygun) → metin. Boş alan bırak; ana formlar çerçeve genişliğinin en az %12'si olsun.
- Zemin bandı ya da saksı alt üçte birde (y≈.75–.8); bitkiler oradan yükselir.
- Birden çok bitki varsa farklı boy (250–380 px) ve tür; en uzunu üçte bir noktasında.
- Güneş karşı üst köşede; metin boş üst-sol bölgede.

## Palet

Arka plan **#f1eedf**. Tema paleti (sırayla): `#cf9d77`, `#6d9171`, `#dbc187`.
- `#cf9d77` — toprak, saksı, sıcak çiçek (arka planla kontrast 2.1:1)
- `#6d9171` — sap ve yaprak (arka planla kontrast 3.0:1)
- `#dbc187` — güneş, çiçek göbeği (arka planla kontrast 1.5:1)
Metin için koyu yeşil `#3e5a44` ekle (tema renkleri metin için açık). Beyaz taç yaprak için `#fbf7ec`, açık ton için `#e0b089`.

## Zamanlama ve koreografi

Süre D için ritim: **%0–15** sahneyi kur (arka plan, zemin, büyük renk alanları) · **%15–60** odak nesnesini inşa et (ana çizgiler `draw`, ana formlar `fade`/`slide`) · **%55–85** ayrıntı, vurgu ve etiketler · **%85–100** bekleme: yeni nesne yok, yalnızca 1–4 `float`/`rotate` ortam hareketi.
- Girişleri **kademelendir**: kardeş öğeler arasında .15–.6 sn aralık; aynı anda en fazla 2–3 nesne başlasın. `start` değerlerinin hepsi 0 olmasın.
- Tipik giriş süresi: fade .6–1.5 sn, slide .8–1.2 sn, draw 1.5–4 sn (uzun yol = daha uzun süre). Çok kısa (<.3 sn) girişler sıçrama gibi görünür.
- Son nesne en geç D·0.8'de başlasın; izleyici bitmiş resmi en az 2 sn görsün.
- Zemin/saksı → sap `draw` (2–2.2 sn, aşağıdan yukarı) → yapraklar sap o yüksekliğe ulaştığında (start = sap başlangıcı + oran×sap süresi) → çiçek en son.
- Bitkiler 1.2 sn arayla; güneş ışınları `rotate` ile ortam hareketi.

## Metin

- Türkçe karakterleri doğru yaz (ç ğ ı İ ö ş ü). Başlık en fazla ~5 kelime, etiket 1–3 kelime; bir text nesnesinde en fazla 8 kelime.
- Boyut (`height`): başlık .06–.09 (43–65 px), alt başlık .04–.05, etiket .033–.04 (24–29 px). 20 px altı okunmaz.
- `width` metni sığdıracak kadar geniş olsun (yaklaşık karakter sayısı × yazı boyu × .56 / 1280). Metinler birbiriyle ve yoğun şekillerle çakışmasın.
- Metin rengi arka planla en az 4.5:1 kontrast vermeli: bu stilde metin için **#3e5a44** kullan.

## Nesne sözleşmesi (AI çıktısı — alanlar birebir)

Sahne: `category` (bu beceri: **botanical**), `title` (1–160), `duration` (2–60 sn), `seed` (tamsayı), `speed` (.2–3, float/rotate hızını çarpar), `detail` (.25–2), `background` (#RRGGBB), `palette` (2–8 × #RRGGBB), `objects` (en fazla 80; iyi sahne 8–30).
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

- Sap: 12–15 noktalı, hafif sinüslü dikey path; ilk nokta zeminde.
- Yaprak: sapın üstündeki noktanın yanına bükülmüş kapsül (lineWidth 18–20, uzunluk 70–90), açısı sola ≈200°, sağa ≈−20°.
- Papatya: 8 beyaz kapsül + sarı göbek; lale: üç dikey kapsül; çan çiçeği: circle + ring kontur.
- Dönen güneş ışını: güneş merkezinde kesişen iki uzun ince kapsül, `rotate`.

## Sık hatalar (kaçın)

- Nesneyi çerçeve dışına taşırmak (x±width/2, circle'da dikey yarıçap, float için +14 px pay) ya da metni altyazı bandına koymak.
- Bütün nesneleri `start: 0` ile başlatmak; ya da son saniyede yeni nesne getirmek.
- Minik şekiller (width < .015) ve 20 px altı yazılar; ana form çerçevenin %12'sinden küçük.
- 40'tan fazla benzer küçük nesne (parçacık/nokta yığını) — ritim kaybolur, sahne kirlenir. 10–25 yeterli.
- Yanlış alan adları (`radius`, `fill`, `size`, `fontSize`, `delay`, `animation`, `keyframes`) ya da eksik alan; renkleri `rgb()`/isimle yazmak.
- Path'i dolgu sanmak; path `x`,`y` değerini sınır kutusu merkezine koymamak; 2'den az nokta.
- Her şeyi aynı boyutta, ortada üst üste yığmak; odak nesnesi olmayan "dağınık" kompozisyon.
- Yaprakları sapın açılmasından önce başlatmak (havada oluşur).
- Sapı yukarıdan aşağı çizmek; bitkiyi zeminden koparmak.
- Tema renkleriyle metin yazmak (kontrast yetersiz).

## Örnek 1 — kısa: saksıda filiz

```json
{"category":"botanical","title":"Filiz","duration":8,"seed":19,"speed":1,"detail":1,"background":"#f1eedf","palette":["#cf9d77","#6d9171","#dbc187","#3e5a44"],"objects":[
 {"type":"circle","x":0.812,"y":0.236,"width":0.078,"height":0.139,"color":"#dbc187","lineWidth":1,"start":0.0,"duration":1.2,"text":"","points":[],"motion":"float"},
 {"type":"rect","x":0.5,"y":0.729,"width":0.117,"height":0.153,"color":"#cf9d77","lineWidth":1,"start":0.4,"duration":0.8,"text":"","points":[],"motion":"fade"},
 {"type":"rect","x":0.5,"y":0.646,"width":0.145,"height":0.036,"color":"#b9825c","lineWidth":1,"start":0.7,"duration":0.6,"text":"","points":[],"motion":"fade"},
 {"type":"path","x":0.504,"y":0.517,"width":0.008,"height":0.229,"color":"#6d9171","lineWidth":6,"start":1.6,"duration":2.0,"text":"","points":[[0.5,0.632],[0.502,0.611],[0.504,0.59],[0.505,0.569],[0.507,0.549],[0.507,0.528],[0.508,0.507],[0.508,0.486],[0.507,0.465],[0.506,0.444],[0.505,0.424],[0.503,0.403]],"motion":"draw"},
 {"type":"path","x":0.469,"y":0.521,"width":0.066,"height":0.043,"color":"#6d9171","lineWidth":20,"start":3.4,"duration":0.7,"text":"","points":[[0.502,0.542],[0.472,0.505],[0.436,0.499]],"motion":"fade"},
 {"type":"path","x":0.534,"y":0.444,"width":0.059,"height":0.038,"color":"#6d9171","lineWidth":18,"start":3.9,"duration":0.7,"text":"","points":[[0.505,0.463],[0.532,0.431],[0.564,0.425]],"motion":"fade"},
 {"type":"circle","x":0.503,"y":0.389,"width":0.025,"height":0.044,"color":"#dbc187","lineWidth":1,"start":4.8,"duration":0.8,"text":"","points":[],"motion":"fade"},
 {"type":"text","x":0.258,"y":0.361,"width":0.234,"height":0.083,"color":"#3e5a44","lineWidth":1,"start":5.4,"duration":1.0,"text":"Filiz","points":[],"motion":"fade"},
 {"type":"text","x":0.258,"y":0.451,"width":0.297,"height":0.039,"color":"#3e5a44","lineWidth":1,"start":6.0,"duration":1.0,"text":"ilk yaprak, ilk ışık","points":[],"motion":"fade"}
]}
```

## Örnek 2 — zengin: üç bitkili bahçe

```json
{"category":"botanical","title":"Büyüyen bahçe","duration":15,"seed":47,"speed":1,"detail":1,"background":"#f1eedf","palette":["#cf9d77","#6d9171","#dbc187","#3e5a44","#fbf7ec","#e0b089"],"objects":[
 {"type":"circle","x":0.836,"y":0.222,"width":0.081,"height":0.144,"color":"#dbc187","lineWidth":1,"start":0.0,"duration":1.2,"text":"","points":[],"motion":"fade"},
 {"type":"path","x":0.836,"y":0.222,"width":0.125,"height":0.003,"color":"#dbc187","lineWidth":5,"start":0.6,"duration":0.6,"text":"","points":[[0.773,0.222],[0.836,0.222],[0.898,0.222]],"motion":"rotate"},
 {"type":"path","x":0.836,"y":0.222,"width":0.002,"height":0.222,"color":"#dbc187","lineWidth":5,"start":0.6,"duration":0.6,"text":"","points":[[0.836,0.111],[0.836,0.222],[0.836,0.333]],"motion":"rotate"},
 {"type":"rect","x":0.5,"y":0.806,"width":0.922,"height":0.05,"color":"#cf9d77","lineWidth":1,"start":0.3,"duration":1.0,"text":"","points":[],"motion":"fade"},
 {"type":"path","x":0.336,"y":0.569,"width":0.019,"height":0.417,"color":"#6d9171","lineWidth":6,"start":1.4,"duration":2.2,"text":"","points":[[0.336,0.778],[0.339,0.748],[0.342,0.718],[0.344,0.688],[0.345,0.659],[0.345,0.629],[0.344,0.599],[0.343,0.569],[0.34,0.54],[0.337,0.51],[0.334,0.48],[0.331,0.45],[0.329,0.421],[0.327,0.391],[0.327,0.361]],"motion":"draw"},
 {"type":"path","x":0.318,"y":0.659,"width":0.051,"height":0.033,"color":"#6d9171","lineWidth":18,"start":2.77,"duration":0.6,"text":"","points":[[0.343,0.675],[0.32,0.646],[0.292,0.642]],"motion":"fade"},
 {"type":"path","x":0.37,"y":0.569,"width":0.051,"height":0.033,"color":"#6d9171","lineWidth":18,"start":3.21,"duration":0.6,"text":"","points":[[0.344,0.586],[0.367,0.556],[0.396,0.553]],"motion":"fade"},
 {"type":"path","x":0.307,"y":0.48,"width":0.05,"height":0.041,"color":"#6d9171","lineWidth":18,"start":3.65,"duration":0.6,"text":"","points":[[0.332,0.501],[0.31,0.468],[0.282,0.46]],"motion":"fade"},
 {"type":"path","x":0.322,"y":0.331,"width":0.011,"height":0.075,"color":"#cf9d77","lineWidth":26,"start":3.8,"duration":0.6,"text":"","points":[[0.316,0.293],[0.322,0.331],[0.328,0.368]],"motion":"fade"},
 {"type":"path","x":0.35,"y":0.331,"width":0.011,"height":0.075,"color":"#cf9d77","lineWidth":26,"start":4.0,"duration":0.6,"text":"","points":[[0.356,0.293],[0.35,0.331],[0.344,0.368]],"motion":"fade"},
 {"type":"path","x":0.336,"y":0.325,"width":0.002,"height":0.083,"color":"#e0b089","lineWidth":26,"start":4.2,"duration":0.6,"text":"","points":[[0.336,0.283],[0.336,0.325],[0.336,0.367]],"motion":"fade"},
 {"type":"path","x":0.516,"y":0.514,"width":0.019,"height":0.528,"color":"#6d9171","lineWidth":6,"start":2.6,"duration":2.2,"text":"","points":[[0.516,0.778],[0.519,0.74],[0.521,0.702],[0.524,0.665],[0.525,0.627],[0.525,0.589],[0.524,0.552],[0.522,0.514],[0.52,0.476],[0.517,0.438],[0.514,0.401],[0.511,0.363],[0.509,0.325],[0.507,0.288],[0.506,0.25]],"motion":"draw"},
 {"type":"path","x":0.497,"y":0.627,"width":0.051,"height":0.033,"color":"#6d9171","lineWidth":18,"start":3.97,"duration":0.6,"text":"","points":[[0.523,0.644],[0.5,0.614],[0.472,0.61]],"motion":"fade"},
 {"type":"path","x":0.55,"y":0.514,"width":0.051,"height":0.033,"color":"#6d9171","lineWidth":18,"start":4.41,"duration":0.6,"text":"","points":[[0.524,0.531],[0.547,0.501],[0.575,0.497]],"motion":"fade"},
 {"type":"path","x":0.486,"y":0.401,"width":0.05,"height":0.041,"color":"#6d9171","lineWidth":18,"start":4.85,"duration":0.6,"text":"","points":[[0.511,0.421],[0.49,0.388],[0.462,0.38]],"motion":"fade"},
 {"type":"path","x":0.541,"y":0.236,"width":0.042,"height":0.003,"color":"#fbf7ec","lineWidth":18,"start":5.0,"duration":0.5,"text":"","points":[[0.52,0.236],[0.541,0.236],[0.562,0.236]],"motion":"fade"},
 {"type":"path","x":0.534,"y":0.269,"width":0.03,"height":0.053,"color":"#fbf7ec","lineWidth":18,"start":5.08,"duration":0.5,"text":"","points":[[0.519,0.242],[0.534,0.269],[0.549,0.295]],"motion":"fade"},
 {"type":"path","x":0.516,"y":0.282,"width":0.002,"height":0.075,"color":"#fbf7ec","lineWidth":18,"start":5.16,"duration":0.5,"text":"","points":[[0.516,0.244],[0.516,0.282],[0.516,0.319]],"motion":"fade"},
 {"type":"path","x":0.497,"y":0.269,"width":0.03,"height":0.053,"color":"#fbf7ec","lineWidth":18,"start":5.24,"duration":0.5,"text":"","points":[[0.512,0.242],[0.497,0.269],[0.482,0.295]],"motion":"fade"},
 {"type":"path","x":0.49,"y":0.236,"width":0.042,"height":0.003,"color":"#fbf7ec","lineWidth":18,"start":5.32,"duration":0.5,"text":"","points":[[0.511,0.236],[0.49,0.236],[0.469,0.236]],"motion":"fade"},
 {"type":"path","x":0.497,"y":0.204,"width":0.03,"height":0.053,"color":"#fbf7ec","lineWidth":18,"start":5.4,"duration":0.5,"text":"","points":[[0.512,0.23],[0.497,0.204],[0.482,0.177]],"motion":"fade"},
 {"type":"path","x":0.516,"y":0.19,"width":0.002,"height":0.075,"color":"#fbf7ec","lineWidth":18,"start":5.48,"duration":0.5,"text":"","points":[[0.516,0.228],[0.516,0.19],[0.516,0.153]],"motion":"fade"},
 {"type":"path","x":0.534,"y":0.204,"width":0.03,"height":0.053,"color":"#fbf7ec","lineWidth":18,"start":5.56,"duration":0.5,"text":"","points":[[0.519,0.23],[0.534,0.204],[0.549,0.177]],"motion":"fade"},
 {"type":"circle","x":0.516,"y":0.236,"width":0.022,"height":0.039,"color":"#dbc187","lineWidth":1,"start":5.7,"duration":0.5,"text":"","points":[],"motion":"fade"},
 {"type":"path","x":0.687,"y":0.604,"width":0.019,"height":0.347,"color":"#6d9171","lineWidth":6,"start":3.8,"duration":2.2,"text":"","points":[[0.688,0.778],[0.691,0.753],[0.693,0.728],[0.695,0.703],[0.697,0.679],[0.697,0.654],[0.696,0.629],[0.694,0.604],[0.692,0.579],[0.689,0.555],[0.686,0.53],[0.683,0.505],[0.68,0.48],[0.679,0.455],[0.678,0.431]],"motion":"draw"},
 {"type":"path","x":0.669,"y":0.679,"width":0.051,"height":0.033,"color":"#6d9171","lineWidth":18,"start":5.17,"duration":0.6,"text":"","points":[[0.695,0.695],[0.672,0.666],[0.644,0.662]],"motion":"fade"},
 {"type":"path","x":0.722,"y":0.604,"width":0.051,"height":0.033,"color":"#6d9171","lineWidth":18,"start":5.61,"duration":0.6,"text":"","points":[[0.696,0.621],[0.719,0.591],[0.747,0.588]],"motion":"fade"},
 {"type":"path","x":0.658,"y":0.53,"width":0.05,"height":0.041,"color":"#6d9171","lineWidth":18,"start":6.05,"duration":0.6,"text":"","points":[[0.683,0.55],[0.662,0.517],[0.634,0.509]],"motion":"fade"},
 {"type":"circle","x":0.688,"y":0.408,"width":0.047,"height":0.083,"color":"#dbc187","lineWidth":1,"start":6.2,"duration":0.8,"text":"","points":[],"motion":"fade"},
 {"type":"path","x":0.688,"y":0.408,"width":0.047,"height":0.083,"color":"#cf9d77","lineWidth":3,"start":6.6,"duration":0.8,"text":"","points":[[0.688,0.367],[0.694,0.368],[0.699,0.372],[0.704,0.379],[0.708,0.388],[0.71,0.398],[0.711,0.408],[0.71,0.419],[0.708,0.429],[0.704,0.438],[0.699,0.444],[0.694,0.449],[0.688,0.45],[0.681,0.449],[0.676,0.444],[0.671,0.438],[0.667,0.429],[0.665,0.419],[0.664,0.408],[0.665,0.398],[0.667,0.388],[0.671,0.379],[0.676,0.372],[0.681,0.368],[0.688,0.367]],"motion":"draw"},
 {"type":"circle","x":0.438,"y":0.306,"width":0.013,"height":0.022,"color":"#cf9d77","lineWidth":1,"start":9.4,"duration":0.5,"text":"","points":[],"motion":"float"},
 {"type":"circle","x":0.449,"y":0.294,"width":0.013,"height":0.022,"color":"#cf9d77","lineWidth":1,"start":9.4,"duration":0.5,"text":"","points":[],"motion":"float"},
 {"type":"text","x":0.188,"y":0.208,"width":0.266,"height":0.064,"color":"#3e5a44","lineWidth":1,"start":9.8,"duration":1.0,"text":"Büyüyen bahçe","points":[],"motion":"fade"},
 {"type":"text","x":0.188,"y":0.285,"width":0.266,"height":0.036,"color":"#3e5a44","lineWidth":1,"start":10.4,"duration":1.0,"text":"tohumdan çiçeğe","points":[],"motion":"fade"}
]}
```

## Kabul ölçütleri

Yapraklar havada oluşmuyor; kök kaymıyor; büyüme sırası botanik olarak anlaşılır; metin okunur.
Son kare tek başına bakıldığında bitmiş, dengeli bir resim olmalı; tüm metin okunur ve güvenli alanda.

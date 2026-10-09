---
name: canvas-geometric
description: "Kare Canvas 2D sahnelerini geometrik hareket stilinde üretir: eş merkezli halkalar, düzgün çokgenler, simetri, yavaşça dönen formlar. Geometri, yörünge, simetri, matematiksel desen, logo animasyonu istekleri için kullan."
---

# canvas-geometric · Geometrik hareket

Bu beceri, Kare'nin Canvas 2D motorunda **Geometrik hareket** stilinde, AI'ın JSON olarak döndürdüğü düzenlenebilir sahneler içindir (kod değil, yalnızca sahne verisi; `composed` sahnelerde hazır prosedürel çizim kapalıdır, her şeyi nesnelerle sen kurarsın).

## Amaç ve görünüm

Temiz, matematiksel, Bauhaus esintili: tek bir merkez etrafında eş merkezli halkalar ve düzgün çokgenler, köşelerde vurgu noktaları. Çizgiler ince ve eşit (2–3 px), dolgu yalnızca küçük daireler. Hareket yavaş ve ölçülü: çizimle kurulur, bir-iki form döner.

## Tuval ve güvenli alan

- Mantıksal tuval **1280×720**. Tüm `x`, `y`, `width`, `height` ve path noktaları **0–1 normalize** değerdir: piksel = x·1280, y·720.
- `x`,`y` nesnenin **merkezidir** (circle, ellipse, rect, text). Path için `x`,`y` noktaların sınır kutusunun merkezi, `width`/`height` kutunun boyu olsun (döndürme ve kalite denetimi bunu kullanır).
- **Güvenli alan:** x .04–.96, y .08–.82. Alt ~100 px (y > .86) altyazı bandıdır; metni ve odak nesnesini oraya koyma. Zemin/gökyüzü gibi arka plan bantları kenara kadar uzanabilir ama 0–1 dışına taşmasın.
- Circle'da `width` çaptır ve 1280 px'e göredir: dikey yarıçap = width·1280/720/2 (ör. width .1 → 128 px çap, y'de ±.089). `height` circle için kullanılmaz, width ile aynı oranı yaz.
- Nesneler dizideki **sırayla** çizilir: önce arka plan, sonra orta plan, en son ön plan ve metin.

## Kompozisyon

- Bir **odak nesnesi** seç ve üçte bir noktalarına (x≈.33/.67, y≈.33/.6) ya da bilinçli olarak merkeze yerleştir; 3–7 ana form + destekleyici ayrıntı.
- Derinlik katmanları: arka plan (büyük, düşük kontrast) → orta plan → ön plan (en koyu/en doygun) → metin. Boş alan bırak; ana formlar çerçeve genişliğinin en az %12'si olsun.
- Tek bir simetri merkezi seç (ör. x≈.6, y=.5) ve tüm formları ona göre kur; metin karşı tarafta.
- Halka yarıçaplarını oranlı seç (ör. 110/180/250 ya da 120/200/240); en büyük halka güvenli alanda kalsın (dikey yarıçap ≤ 250 px).
- Noktaları açılarla yerleştir: (cx + r·cos a, cy + r·sin a).

## Palet

Arka plan **#202e2f**. Tema paleti (sırayla): `#d5bb89`, `#99b8af`, `#bb806c`.
- `#d5bb89` — merkez, ana çokgenler, başlık (arka planla kontrast 7.6:1)
- `#99b8af` — halkalar, ince yapı çizgileri, alt yazı (arka planla kontrast 6.6:1)
- `#bb806c` — vurgu noktaları, dönen form (arka planla kontrast 4.3:1)
Koyu zeminde açık çizgiler; yardımcı arka halka için zemine yakın koyu ton (`#2f4444`). Renk sayısını 3–4'te tut.

## Zamanlama ve koreografi

Süre D için ritim: **%0–15** sahneyi kur (arka plan, zemin, büyük renk alanları) · **%15–60** odak nesnesini inşa et (ana çizgiler `draw`, ana formlar `fade`/`slide`) · **%55–85** ayrıntı, vurgu ve etiketler · **%85–100** bekleme: yeni nesne yok, yalnızca 1–4 `float`/`rotate` ortam hareketi.
- Girişleri **kademelendir**: kardeş öğeler arasında .15–.6 sn aralık; aynı anda en fazla 2–3 nesne başlasın. `start` değerlerinin hepsi 0 olmasın.
- Tipik giriş süresi: fade .6–1.5 sn, slide .8–1.2 sn, draw 1.5–4 sn (uzun yol = daha uzun süre). Çok kısa (<.3 sn) girişler sıçrama gibi görünür.
- Son nesne en geç D·0.8'de başlasın; izleyici bitmiş resmi en az 2 sn görsün.
- İçten dışa ya da dıştan içe halkalar `draw` (1.6–2 sn, .6 sn arayla) → çokgenler → köşe noktaları saat yönünde .25 sn arayla → merkez → dönen form → metin.
- `rotate` yalnızca bbox merkezi simetri merkezine denk gelen path'lerde (kare, altıgen) kullanılır.

## Metin

- Türkçe karakterleri doğru yaz (ç ğ ı İ ö ş ü). Başlık en fazla ~5 kelime, etiket 1–3 kelime; bir text nesnesinde en fazla 8 kelime.
- Boyut (`height`): başlık .06–.09 (43–65 px), alt başlık .04–.05, etiket .033–.04 (24–29 px). 20 px altı okunmaz.
- `width` metni sığdıracak kadar geniş olsun (yaklaşık karakter sayısı × yazı boyu × .56 / 1280). Metinler birbiriyle ve yoğun şekillerle çakışmasın.
- Metin rengi arka planla en az 4.5:1 kontrast vermeli: bu stilde metin için **#d5bb89** kullan.

## Nesne sözleşmesi (AI çıktısı — alanlar birebir)

Sahne: `category` (bu beceri: **geometric**), `title` (1–160), `duration` (2–60 sn), `seed` (tamsayı), `speed` (.2–3, float/rotate hızını çarpar), `detail` (.25–2), `background` (#RRGGBB), `palette` (2–8 × #RRGGBB), `objects` (en fazla 80; iyi sahne 8–30).
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

- Daire/halka: 40–60 noktalı kapalı path (ring).
- Düzgün n-gen: n+1 nokta (ilk nokta sonda tekrar), açı adımı 360/n.
- İç içe üçgenler (Davut yıldızı) iki ayrı path.
- Dönen kare: köşeleri merkezden eşit uzaklıkta 5 noktalı path + `rotate`.

## Sık hatalar (kaçın)

- Nesneyi çerçeve dışına taşırmak (x±width/2, circle'da dikey yarıçap, float için +14 px pay) ya da metni altyazı bandına koymak.
- Bütün nesneleri `start: 0` ile başlatmak; ya da son saniyede yeni nesne getirmek.
- Minik şekiller (width < .015) ve 20 px altı yazılar; ana form çerçevenin %12'sinden küçük.
- 40'tan fazla benzer küçük nesne (parçacık/nokta yığını) — ritim kaybolur, sahne kirlenir. 10–25 yeterli.
- Yanlış alan adları (`radius`, `fill`, `size`, `fontSize`, `delay`, `animation`, `keyframes`) ya da eksik alan; renkleri `rgb()`/isimle yazmak.
- Path'i dolgu sanmak; path `x`,`y` değerini sınır kutusu merkezine koymamak; 2'den az nokta.
- Her şeyi aynı boyutta, ortada üst üste yığmak; odak nesnesi olmayan "dağınık" kompozisyon.
- `rotate`'i merkezi kayık bir path'e vermek (form savrulur); circle'a vermek (görünmez).
- Simetriyi bozan rastgele yerleşim; farklı kalınlıkta çizgiler.

## Örnek 1 — kısa: yörüngeler

```json
{"category":"geometric","title":"Yörüngeler","duration":10,"seed":5,"speed":1,"detail":1,"background":"#202e2f","palette":["#d5bb89","#99b8af","#bb806c"],"objects":[
 {"type":"path","x":0.609,"y":0.5,"width":0.172,"height":0.306,"color":"#99b8af","lineWidth":2,"start":0.6,"duration":1.8,"text":"","points":[[0.609,0.347],[0.623,0.349],[0.636,0.355],[0.648,0.364],[0.66,0.376],[0.67,0.392],[0.679,0.41],[0.686,0.431],[0.691,0.453],[0.694,0.476],[0.695,0.5],[0.694,0.524],[0.691,0.547],[0.686,0.569],[0.679,0.59],[0.67,0.608],[0.66,0.624],[0.648,0.636],[0.636,0.645],[0.623,0.651],[0.609,0.653],[0.596,0.651],[0.583,0.645],[0.57,0.636],[0.559,0.624],[0.549,0.608],[0.54,0.59],[0.533,0.569],[0.528,0.547],[0.524,0.524],[0.523,0.5],[0.524,0.476],[0.528,0.453],[0.533,0.431],[0.54,0.41],[0.549,0.392],[0.559,0.376],[0.57,0.364],[0.583,0.355],[0.596,0.349],[0.609,0.347]],"motion":"draw"},
 {"type":"path","x":0.609,"y":0.5,"width":0.281,"height":0.5,"color":"#99b8af","lineWidth":2,"start":1.2,"duration":1.8,"text":"","points":[[0.609,0.25],[0.628,0.252],[0.646,0.259],[0.663,0.269],[0.68,0.283],[0.695,0.302],[0.709,0.323],[0.721,0.348],[0.731,0.375],[0.739,0.404],[0.745,0.435],[0.749,0.467],[0.75,0.5],[0.749,0.533],[0.745,0.565],[0.739,0.596],[0.731,0.625],[0.721,0.652],[0.709,0.677],[0.695,0.698],[0.68,0.717],[0.663,0.731],[0.646,0.741],[0.628,0.748],[0.609,0.75],[0.591,0.748],[0.573,0.741],[0.556,0.731],[0.539,0.717],[0.524,0.698],[0.51,0.677],[0.498,0.652],[0.488,0.625],[0.479,0.596],[0.474,0.565],[0.47,0.533],[0.469,0.5],[0.47,0.467],[0.474,0.435],[0.479,0.404],[0.488,0.375],[0.498,0.348],[0.51,0.323],[0.524,0.302],[0.539,0.283],[0.556,0.269],[0.573,0.259],[0.591,0.252],[0.609,0.25]],"motion":"draw"},
 {"type":"path","x":0.609,"y":0.5,"width":0.391,"height":0.694,"color":"#99b8af","lineWidth":2,"start":1.8,"duration":1.8,"text":"","points":[[0.609,0.153],[0.631,0.155],[0.653,0.161],[0.674,0.172],[0.694,0.187],[0.713,0.206],[0.731,0.229],[0.747,0.254],[0.762,0.284],[0.775,0.315],[0.785,0.349],[0.794,0.385],[0.8,0.423],[0.803,0.461],[0.805,0.5],[0.803,0.539],[0.8,0.577],[0.794,0.615],[0.785,0.651],[0.775,0.685],[0.762,0.716],[0.747,0.746],[0.731,0.771],[0.713,0.794],[0.694,0.813],[0.674,0.828],[0.653,0.839],[0.631,0.845],[0.609,0.847],[0.588,0.845],[0.566,0.839],[0.545,0.828],[0.525,0.813],[0.505,0.794],[0.488,0.771],[0.471,0.746],[0.457,0.716],[0.444,0.685],[0.433,0.651],[0.425,0.615],[0.419,0.577],[0.415,0.539],[0.414,0.5],[0.415,0.461],[0.419,0.423],[0.425,0.385],[0.433,0.349],[0.444,0.315],[0.457,0.284],[0.471,0.254],[0.488,0.229],[0.505,0.206],[0.525,0.187],[0.545,0.172],[0.566,0.161],[0.588,0.155],[0.609,0.153]],"motion":"draw"},
 {"type":"circle","x":0.609,"y":0.5,"width":0.062,"height":0.111,"color":"#d5bb89","lineWidth":1,"start":0.2,"duration":1.0,"text":"","points":[],"motion":"fade"},
 {"type":"circle","x":0.684,"y":0.424,"width":0.022,"height":0.039,"color":"#bb806c","lineWidth":1,"start":3.4,"duration":0.6,"text":"","points":[],"motion":"fade"},
 {"type":"circle","x":0.488,"y":0.625,"width":0.031,"height":0.056,"color":"#99b8af","lineWidth":1,"start":3.9,"duration":0.6,"text":"","points":[],"motion":"fade"},
 {"type":"circle","x":0.707,"y":0.801,"width":0.019,"height":0.033,"color":"#d5bb89","lineWidth":1,"start":4.4,"duration":0.6,"text":"","points":[],"motion":"fade"},
 {"type":"path","x":0.609,"y":0.5,"width":0.122,"height":0.216,"color":"#bb806c","lineWidth":2,"start":5.0,"duration":1.2,"text":"","points":[[0.67,0.608],[0.549,0.608],[0.549,0.392],[0.67,0.392],[0.67,0.608]],"motion":"rotate"},
 {"type":"text","x":0.195,"y":0.458,"width":0.266,"height":0.064,"color":"#d5bb89","lineWidth":1,"start":5.6,"duration":1.0,"text":"Yörüngeler","points":[],"motion":"fade"},
 {"type":"text","x":0.195,"y":0.535,"width":0.266,"height":0.036,"color":"#99b8af","lineWidth":1,"start":6.2,"duration":1.0,"text":"uyum ve periyot","points":[],"motion":"fade"}
]}
```

## Örnek 2 — zengin: altıgen simetri

```json
{"category":"geometric","title":"Altıgen simetri","duration":14,"seed":6,"speed":1,"detail":1,"background":"#202e2f","palette":["#d5bb89","#99b8af","#bb806c"],"objects":[
 {"type":"path","x":0.609,"y":0.5,"width":0.375,"height":0.667,"color":"#2f4444","lineWidth":6,"start":0.0,"duration":2.0,"text":"","points":[[0.609,0.167],[0.629,0.168],[0.648,0.174],[0.667,0.183],[0.686,0.195],[0.703,0.211],[0.72,0.23],[0.735,0.252],[0.749,0.277],[0.761,0.304],[0.772,0.333],[0.781,0.364],[0.788,0.397],[0.793,0.431],[0.796,0.465],[0.797,0.5],[0.796,0.535],[0.793,0.569],[0.788,0.603],[0.781,0.636],[0.772,0.667],[0.761,0.696],[0.749,0.723],[0.735,0.748],[0.72,0.77],[0.703,0.789],[0.686,0.805],[0.667,0.817],[0.648,0.826],[0.629,0.832],[0.609,0.833],[0.59,0.832],[0.57,0.826],[0.551,0.817],[0.533,0.805],[0.516,0.789],[0.499,0.77],[0.484,0.748],[0.47,0.723],[0.458,0.696],[0.447,0.667],[0.438,0.636],[0.431,0.603],[0.426,0.569],[0.423,0.535],[0.422,0.5],[0.423,0.465],[0.426,0.431],[0.431,0.397],[0.438,0.364],[0.447,0.333],[0.458,0.304],[0.47,0.277],[0.484,0.252],[0.499,0.23],[0.516,0.211],[0.533,0.195],[0.551,0.183],[0.57,0.174],[0.59,0.168],[0.609,0.167]],"motion":"draw"},
 {"type":"path","x":0.609,"y":0.5,"width":0.271,"height":0.556,"color":"#99b8af","lineWidth":3,"start":0.8,"duration":2.0,"text":"","points":[[0.609,0.222],[0.745,0.361],[0.745,0.639],[0.609,0.778],[0.474,0.639],[0.474,0.361],[0.609,0.222]],"motion":"draw"},
 {"type":"path","x":0.609,"y":0.5,"width":0.188,"height":0.289,"color":"#99b8af","lineWidth":2,"start":1.8,"duration":1.6,"text":"","points":[[0.656,0.356],[0.703,0.5],[0.656,0.644],[0.562,0.644],[0.516,0.5],[0.562,0.356],[0.656,0.356]],"motion":"draw"},
 {"type":"path","x":0.609,"y":0.431,"width":0.271,"height":0.417,"color":"#d5bb89","lineWidth":2.5,"start":2.8,"duration":1.4,"text":"","points":[[0.609,0.222],[0.745,0.639],[0.474,0.639],[0.609,0.222]],"motion":"draw"},
 {"type":"path","x":0.609,"y":0.569,"width":0.271,"height":0.417,"color":"#d5bb89","lineWidth":2.5,"start":3.4,"duration":1.4,"text":"","points":[[0.609,0.778],[0.474,0.361],[0.745,0.361],[0.609,0.778]],"motion":"draw"},
 {"type":"circle","x":0.609,"y":0.222,"width":0.025,"height":0.044,"color":"#d5bb89","lineWidth":1,"start":4.6,"duration":0.5,"text":"","points":[],"motion":"fade"},
 {"type":"circle","x":0.745,"y":0.361,"width":0.025,"height":0.044,"color":"#bb806c","lineWidth":1,"start":4.85,"duration":0.5,"text":"","points":[],"motion":"fade"},
 {"type":"circle","x":0.745,"y":0.639,"width":0.025,"height":0.044,"color":"#d5bb89","lineWidth":1,"start":5.1,"duration":0.5,"text":"","points":[],"motion":"fade"},
 {"type":"circle","x":0.609,"y":0.778,"width":0.025,"height":0.044,"color":"#bb806c","lineWidth":1,"start":5.35,"duration":0.5,"text":"","points":[],"motion":"fade"},
 {"type":"circle","x":0.474,"y":0.639,"width":0.025,"height":0.044,"color":"#d5bb89","lineWidth":1,"start":5.6,"duration":0.5,"text":"","points":[],"motion":"fade"},
 {"type":"circle","x":0.474,"y":0.361,"width":0.025,"height":0.044,"color":"#bb806c","lineWidth":1,"start":5.85,"duration":0.5,"text":"","points":[],"motion":"fade"},
 {"type":"circle","x":0.609,"y":0.5,"width":0.047,"height":0.083,"color":"#bb806c","lineWidth":1,"start":6.4,"duration":0.8,"text":"","points":[],"motion":"fade"},
 {"type":"path","x":0.609,"y":0.5,"width":0.094,"height":0.167,"color":"#d5bb89","lineWidth":3,"start":7.0,"duration":0.8,"text":"","points":[[0.656,0.5],[0.609,0.583],[0.562,0.5],[0.609,0.417],[0.656,0.5]],"motion":"rotate"},
 {"type":"path","x":0.701,"y":0.217,"width":0.184,"height":0.189,"color":"#bb806c","lineWidth":2,"start":8.0,"duration":0.8,"text":"","points":[[0.609,0.122],[0.793,0.311]],"motion":"draw"},
 {"type":"text","x":0.203,"y":0.417,"width":0.312,"height":0.064,"color":"#d5bb89","lineWidth":1,"start":8.4,"duration":1.0,"text":"Altıgen simetri","points":[],"motion":"fade"},
 {"type":"text","x":0.203,"y":0.493,"width":0.312,"height":0.039,"color":"#99b8af","lineWidth":1,"start":9.0,"duration":1.0,"text":"altı katlı dönme","points":[],"motion":"fade"},
 {"type":"text","x":0.203,"y":0.556,"width":0.312,"height":0.036,"color":"#99b8af","lineWidth":1,"start":9.6,"duration":1.0,"text":"60° · 120° · 180°","points":[],"motion":"fade"}
]}
```

## Kabul ölçütleri

Merkez kaymıyor; simetri okunur; dönüş yavaş ve kontrollü; çizgi kalınlığı tutarlı.
Son kare tek başına bakıldığında bitmiş, dengeli bir resim olmalı; tüm metin okunur ve güvenli alanda.

---
name: canvas-isometric
description: "Kare Canvas 2D sahnelerini izometrik stilde üretir: 30° izdüşümle çizilmiş bloklar, üç yüzü farklı tonda kutular, arkadan öne sıralanmış küçük şehir/diyagram. İzometrik, blok, şehir, mimari diyagram, sistem şeması istekleri için kullan."
---

# canvas-isometric · İzometrik

Bu beceri, Kare'nin Canvas 2D motorunda **İzometrik** stilinde, AI'ın JSON olarak döndürdüğü düzenlenebilir sahneler içindir (kod değil, yalnızca sahne verisi; `composed` sahnelerde hazır prosedürel çizim kapalıdır, her şeyi nesnelerle sen kurarsın).

## Amaç ve görünüm

Canvas 2D üzerinde izometrik izdüşüm (gerçek 3D değil): her blok üç paralelkenar yüzden oluşur, üst en açık, sol orta, sağ koyu. Yüzler zikzak taramalı kalın path'lerle "boyanır"; bloklar arkadan öne dizilir. Temiz, oyuncak gibi, diyagram netliğinde.

## Tuval ve güvenli alan

- Mantıksal tuval **1280×720**. Tüm `x`, `y`, `width`, `height` ve path noktaları **0–1 normalize** değerdir: piksel = x·1280, y·720.
- `x`,`y` nesnenin **merkezidir** (circle, ellipse, rect, text). Path için `x`,`y` noktaların sınır kutusunun merkezi, `width`/`height` kutunun boyu olsun (döndürme ve kalite denetimi bunu kullanır).
- **Güvenli alan:** x .04–.96, y .08–.82. Alt ~100 px (y > .86) altyazı bandıdır; metni ve odak nesnesini oraya koyma. Zemin/gökyüzü gibi arka plan bantları kenara kadar uzanabilir ama 0–1 dışına taşmasın.
- Circle'da `width` çaptır ve 1280 px'e göredir: dikey yarıçap = width·1280/720/2 (ör. width .1 → 128 px çap, y'de ±.089). `height` circle için kullanılmaz, width ile aynı oranı yaz.
- Nesneler dizideki **sırayla** çizilir: önce arka plan, sonra orta plan, en son ön plan ve metin.

## Kompozisyon

- Bir **odak nesnesi** seç ve üçte bir noktalarına (x≈.33/.67, y≈.33/.6) ya da bilinçli olarak merkeze yerleştir; 3–7 ana form + destekleyici ayrıntı.
- Derinlik katmanları: arka plan (büyük, düşük kontrast) → orta plan → ön plan (en koyu/en doygun) → metin. Boş alan bırak; ana formlar çerçeve genişliğinin en az %12'si olsun.
- İzdüşüm: ekran = (ox + (i − j)·cos30°·s, oy + (i + j)·s/2 − k·s); s = birim kenar (60–120 px).
- Zemin rombu ızgarası tek kapalı path; bloklar onun üstünde.
- Çizim sırası: i + j küçük olan (arkadaki) önce. Metin solda, sahne sağ üçte ikide.

## Palet

Arka plan **#1d3034**. Tema paleti (sırayla): `#c6d1ad`, `#608c85`, `#3d6267`.
- `#c6d1ad` — üst yüz (en açık), başlık (arka planla kontrast 8.6:1)
- `#608c85` — sol yüz (orta) (arka planla kontrast 3.7:1)
- `#3d6267` — sağ yüz (koyu), zemin ızgarası (arka planla kontrast 2.1:1)
Kenar çizgisi ve gölge için koyu `#142427`/`#15252a`. Üç yüz tonu her blokta aynı sırayla: ışık üstten-soldan.

## Zamanlama ve koreografi

Süre D için ritim: **%0–15** sahneyi kur (arka plan, zemin, büyük renk alanları) · **%15–60** odak nesnesini inşa et (ana çizgiler `draw`, ana formlar `fade`/`slide`) · **%55–85** ayrıntı, vurgu ve etiketler · **%85–100** bekleme: yeni nesne yok, yalnızca 1–4 `float`/`rotate` ortam hareketi.
- Girişleri **kademelendir**: kardeş öğeler arasında .15–.6 sn aralık; aynı anda en fazla 2–3 nesne başlasın. `start` değerlerinin hepsi 0 olmasın.
- Tipik giriş süresi: fade .6–1.5 sn, slide .8–1.2 sn, draw 1.5–4 sn (uzun yol = daha uzun süre). Çok kısa (<.3 sn) girişler sıçrama gibi görünür.
- Son nesne en geç D·0.8'de başlasın; izleyici bitmiş resmi en az 2 sn görsün.
- Zemin `draw` → bloklar arkadan öne .8 sn arayla; her blokta sol yüz → sağ yüz (+.3) → üst yüz (+.6), her biri `draw` .8 sn (yüz boyanıyor).
- Ağaç/nokta ayrıntıları ve metin en son; bir öğe `float`.

## Metin

- Türkçe karakterleri doğru yaz (ç ğ ı İ ö ş ü). Başlık en fazla ~5 kelime, etiket 1–3 kelime; bir text nesnesinde en fazla 8 kelime.
- Boyut (`height`): başlık .06–.09 (43–65 px), alt başlık .04–.05, etiket .033–.04 (24–29 px). 20 px altı okunmaz.
- `width` metni sığdıracak kadar geniş olsun (yaklaşık karakter sayısı × yazı boyu × .56 / 1280). Metinler birbiriyle ve yoğun şekillerle çakışmasın.
- Metin rengi arka planla en az 4.5:1 kontrast vermeli: bu stilde metin için **#c6d1ad** kullan.

## Nesne sözleşmesi (AI çıktısı — alanlar birebir)

Sahne: `category` (bu beceri: **isometric**), `title` (1–160), `duration` (2–60 sn), `seed` (tamsayı), `speed` (.2–3, float/rotate hızını çarpar), `detail` (.25–2), `background` (#RRGGBB), `palette` (2–8 × #RRGGBB), `objects` (en fazla 80; iyi sahne 8–30).
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

- Yüz dolgusu: paralelkenarı yatay zikzak path ile tara, lineWidth 7–10 (ince çizgi = düzgün kenar), aralık .8×lineWidth; kalın çizgi kenarları tırtıklı yapar.
- Üst yüz konturu: 5 noktalı kapalı path, lineWidth 2, koyu kenar renginde.
- Ağaç: küçük circle (üst ton) yüksekliği k ile kaldırılmış noktada.
- Gölge: blok altına basık koyu ellipse.

## Sık hatalar (kaçın)

- Nesneyi çerçeve dışına taşırmak (x±width/2, circle'da dikey yarıçap, float için +14 px pay) ya da metni altyazı bandına koymak.
- Bütün nesneleri `start: 0` ile başlatmak; ya da son saniyede yeni nesne getirmek.
- Minik şekiller (width < .015) ve 20 px altı yazılar; ana form çerçevenin %12'sinden küçük.
- 40'tan fazla benzer küçük nesne (parçacık/nokta yığını) — ritim kaybolur, sahne kirlenir. 10–25 yeterli.
- Yanlış alan adları (`radius`, `fill`, `size`, `fontSize`, `delay`, `animation`, `keyframes`) ya da eksik alan; renkleri `rgb()`/isimle yazmak.
- Path'i dolgu sanmak; path `x`,`y` değerini sınır kutusu merkezine koymamak; 2'den az nokta.
- Her şeyi aynı boyutta, ortada üst üste yığmak; odak nesnesi olmayan "dağınık" kompozisyon.
- Önde olan bloğu önce çizmek (arkadaki onun üstüne biner).
- Yüz tonlarını bloktan bloğa değiştirmek; negatif yükseklik; 3D mesh/perspektif vaat etmek.

## Örnek 1 — kısa: birim küp

```json
{"category":"isometric","title":"Birim küp","duration":8,"seed":2,"speed":1,"detail":1,"background":"#1d3034","palette":["#c6d1ad","#608c85","#3d6267","#142427"],"objects":[
 {"type":"ellipse","x":0.5,"y":0.544,"width":0.234,"height":0.083,"color":"#15252a","lineWidth":1,"start":0.0,"duration":1.0,"text":"","points":[],"motion":"fade"},
 {"type":"path","x":0.459,"y":0.389,"width":0.075,"height":0.237,"color":"#608c85","lineWidth":9,"start":0.8,"duration":0.8,"text":"","points":[[0.422,0.27],[0.422,0.27],[0.431,0.28],[0.422,0.28],[0.422,0.29],[0.441,0.29],[0.45,0.3],[0.422,0.3],[0.422,0.31],[0.46,0.31],[0.47,0.32],[0.422,0.32],[0.422,0.33],[0.479,0.33],[0.489,0.339],[0.422,0.339],[0.422,0.349],[0.496,0.349],[0.496,0.359],[0.422,0.359],[0.422,0.369],[0.496,0.369],[0.496,0.379],[0.422,0.379],[0.422,0.389],[0.496,0.389],[0.496,0.399],[0.422,0.399],[0.422,0.409],[0.496,0.409],[0.496,0.419],[0.422,0.419],[0.422,0.428],[0.496,0.428],[0.496,0.438],[0.43,0.438],[0.44,0.448],[0.496,0.448],[0.496,0.458],[0.449,0.458],[0.459,0.468],[0.496,0.468],[0.496,0.478],[0.469,0.478],[0.478,0.488],[0.496,0.488],[0.496,0.498],[0.488,0.498],[0.497,0.508],[0.497,0.508]],"motion":"draw"},
 {"type":"path","x":0.541,"y":0.389,"width":0.075,"height":0.237,"color":"#3d6267","lineWidth":9,"start":1.1,"duration":0.8,"text":"","points":[[0.578,0.27],[0.578,0.27],[0.578,0.28],[0.569,0.28],[0.559,0.29],[0.578,0.29],[0.578,0.3],[0.55,0.3],[0.54,0.31],[0.578,0.31],[0.578,0.32],[0.53,0.32],[0.521,0.33],[0.578,0.33],[0.578,0.339],[0.511,0.339],[0.504,0.349],[0.578,0.349],[0.578,0.359],[0.504,0.359],[0.504,0.369],[0.578,0.369],[0.578,0.379],[0.504,0.379],[0.504,0.389],[0.578,0.389],[0.578,0.399],[0.504,0.399],[0.504,0.409],[0.578,0.409],[0.578,0.419],[0.504,0.419],[0.504,0.428],[0.578,0.428],[0.57,0.438],[0.504,0.438],[0.504,0.448],[0.56,0.448],[0.551,0.458],[0.504,0.458],[0.504,0.468],[0.541,0.468],[0.531,0.478],[0.504,0.478],[0.504,0.488],[0.522,0.488],[0.512,0.498],[0.504,0.498],[0.503,0.508],[0.503,0.508]],"motion":"draw"},
 {"type":"path","x":0.5,"y":0.264,"width":0.155,"height":0.154,"color":"#c6d1ad","lineWidth":9,"start":1.4,"duration":0.8,"text":"","points":[[0.497,0.187],[0.503,0.187],[0.512,0.196],[0.488,0.196],[0.479,0.206],[0.521,0.206],[0.531,0.216],[0.469,0.216],[0.46,0.225],[0.54,0.225],[0.55,0.235],[0.45,0.235],[0.441,0.245],[0.559,0.245],[0.568,0.254],[0.432,0.254],[0.422,0.264],[0.578,0.264],[0.568,0.274],[0.432,0.274],[0.441,0.283],[0.559,0.283],[0.55,0.293],[0.45,0.293],[0.46,0.302],[0.54,0.302],[0.531,0.312],[0.469,0.312],[0.479,0.322],[0.521,0.322],[0.512,0.331],[0.488,0.331],[0.497,0.341],[0.503,0.341]],"motion":"draw"},
 {"type":"path","x":0.5,"y":0.264,"width":0.162,"height":0.167,"color":"#142427","lineWidth":2,"start":2.0,"duration":0.6,"text":"","points":[[0.5,0.181],[0.581,0.264],[0.5,0.347],[0.419,0.264],[0.5,0.181]],"motion":"draw"},
 {"type":"path","x":0.541,"y":0.472,"width":0.081,"height":0.083,"color":"#142427","lineWidth":2,"start":3.0,"duration":0.5,"text":"","points":[[0.581,0.431],[0.5,0.514]],"motion":"draw"},
 {"type":"text","x":0.5,"y":0.653,"width":0.234,"height":0.042,"color":"#c6d1ad","lineWidth":1,"start":3.6,"duration":1.0,"text":"1 birim küp","points":[],"motion":"fade"},
 {"type":"text","x":0.195,"y":0.278,"width":0.25,"height":0.061,"color":"#c6d1ad","lineWidth":1,"start":4.2,"duration":1.0,"text":"İzometrik","points":[],"motion":"fade"},
 {"type":"text","x":0.195,"y":0.347,"width":0.25,"height":0.036,"color":"#c6d1ad","lineWidth":1,"start":4.8,"duration":1.0,"text":"30° izdüşüm","points":[],"motion":"fade"}
]}
```

## Örnek 2 — zengin: küçük şehir

```json
{"category":"isometric","title":"Küçük şehir","duration":14,"seed":9,"speed":1,"detail":1,"background":"#1d3034","palette":["#c6d1ad","#608c85","#3d6267","#142427","#15252a"],"objects":[
 {"type":"path","x":0.562,"y":0.5,"width":0.433,"height":0.444,"color":"#3d6267","lineWidth":3,"start":0.0,"duration":1.2,"text":"","points":[[0.562,0.278],[0.779,0.5],[0.562,0.722],[0.346,0.5],[0.562,0.278]],"motion":"draw"},
 {"type":"path","x":0.541,"y":0.247,"width":0.037,"height":0.228,"color":"#608c85","lineWidth":9,"start":1.2,"duration":0.8,"text":"","points":[[0.522,0.133],[0.522,0.133],[0.531,0.143],[0.523,0.143],[0.523,0.153],[0.541,0.153],[0.551,0.163],[0.523,0.163],[0.523,0.172],[0.559,0.172],[0.559,0.182],[0.523,0.182],[0.523,0.192],[0.559,0.192],[0.559,0.202],[0.523,0.202],[0.523,0.212],[0.559,0.212],[0.559,0.222],[0.523,0.222],[0.523,0.232],[0.559,0.232],[0.559,0.242],[0.523,0.242],[0.523,0.252],[0.559,0.252],[0.559,0.262],[0.523,0.262],[0.523,0.271],[0.559,0.271],[0.559,0.281],[0.523,0.281],[0.523,0.291],[0.559,0.291],[0.559,0.301],[0.523,0.301],[0.523,0.311],[0.559,0.311],[0.559,0.321],[0.523,0.321],[0.531,0.331],[0.559,0.331],[0.559,0.341],[0.541,0.341],[0.55,0.351],[0.559,0.351],[0.559,0.36],[0.559,0.36]],"motion":"draw"},
 {"type":"path","x":0.584,"y":0.247,"width":0.037,"height":0.228,"color":"#3d6267","lineWidth":9,"start":1.5,"duration":0.8,"text":"","points":[[0.603,0.133],[0.603,0.133],[0.602,0.143],[0.594,0.143],[0.584,0.153],[0.602,0.153],[0.602,0.163],[0.574,0.163],[0.566,0.172],[0.602,0.172],[0.602,0.182],[0.566,0.182],[0.566,0.192],[0.602,0.192],[0.602,0.202],[0.566,0.202],[0.566,0.212],[0.602,0.212],[0.602,0.222],[0.566,0.222],[0.566,0.232],[0.602,0.232],[0.602,0.242],[0.566,0.242],[0.566,0.252],[0.602,0.252],[0.602,0.262],[0.566,0.262],[0.566,0.271],[0.602,0.271],[0.602,0.281],[0.566,0.281],[0.566,0.291],[0.602,0.291],[0.602,0.301],[0.566,0.301],[0.566,0.311],[0.602,0.311],[0.602,0.321],[0.566,0.321],[0.566,0.331],[0.594,0.331],[0.584,0.341],[0.566,0.341],[0.566,0.351],[0.575,0.351],[0.566,0.36],[0.566,0.36]],"motion":"draw"},
 {"type":"path","x":0.562,"y":0.127,"width":0.08,"height":0.076,"color":"#c6d1ad","lineWidth":9,"start":1.8,"duration":0.8,"text":"","points":[[0.56,0.088],[0.565,0.088],[0.574,0.098],[0.551,0.098],[0.541,0.108],[0.584,0.108],[0.593,0.117],[0.532,0.117],[0.523,0.127],[0.602,0.127],[0.593,0.136],[0.532,0.136],[0.541,0.146],[0.584,0.146],[0.574,0.155],[0.551,0.155],[0.56,0.165],[0.565,0.165]],"motion":"draw"},
 {"type":"path","x":0.562,"y":0.127,"width":0.087,"height":0.089,"color":"#142427","lineWidth":2,"start":2.4,"duration":0.6,"text":"","points":[[0.562,0.082],[0.606,0.127],[0.562,0.171],[0.519,0.127],[0.562,0.082]],"motion":"draw"},
 {"type":"path","x":0.649,"y":0.393,"width":0.081,"height":0.201,"color":"#608c85","lineWidth":9,"start":2.0,"duration":0.8,"text":"","points":[[0.609,0.293],[0.609,0.293],[0.618,0.302],[0.609,0.302],[0.609,0.312],[0.627,0.312],[0.636,0.322],[0.609,0.322],[0.609,0.331],[0.646,0.331],[0.655,0.341],[0.609,0.341],[0.609,0.35],[0.664,0.35],[0.674,0.36],[0.609,0.36],[0.609,0.369],[0.683,0.369],[0.689,0.379],[0.609,0.379],[0.609,0.389],[0.689,0.389],[0.689,0.398],[0.609,0.398],[0.609,0.408],[0.689,0.408],[0.689,0.417],[0.615,0.417],[0.625,0.427],[0.689,0.427],[0.689,0.436],[0.634,0.436],[0.643,0.446],[0.689,0.446],[0.689,0.455],[0.653,0.455],[0.662,0.465],[0.689,0.465],[0.689,0.475],[0.671,0.475],[0.681,0.484],[0.689,0.484],[0.689,0.494],[0.689,0.494]],"motion":"draw"},
 {"type":"path","x":0.714,"y":0.416,"width":0.037,"height":0.156,"color":"#3d6267","lineWidth":9,"start":2.3,"duration":0.8,"text":"","points":[[0.733,0.337],[0.733,0.337],[0.732,0.347],[0.724,0.347],[0.714,0.357],[0.732,0.357],[0.732,0.367],[0.705,0.367],[0.696,0.376],[0.732,0.376],[0.732,0.386],[0.696,0.386],[0.696,0.396],[0.732,0.396],[0.732,0.406],[0.696,0.406],[0.696,0.416],[0.732,0.416],[0.732,0.425],[0.696,0.425],[0.696,0.435],[0.732,0.435],[0.732,0.445],[0.696,0.445],[0.696,0.455],[0.732,0.455],[0.724,0.464],[0.696,0.464],[0.696,0.474],[0.714,0.474],[0.705,0.484],[0.696,0.484],[0.695,0.494],[0.695,0.494]],"motion":"draw"},
 {"type":"path","x":0.671,"y":0.309,"width":0.121,"height":0.121,"color":"#c6d1ad","lineWidth":9,"start":2.6,"duration":0.8,"text":"","points":[[0.647,0.248],[0.652,0.248],[0.661,0.258],[0.637,0.258],[0.628,0.267],[0.67,0.267],[0.679,0.276],[0.619,0.276],[0.61,0.286],[0.688,0.286],[0.697,0.295],[0.617,0.295],[0.626,0.304],[0.706,0.304],[0.715,0.314],[0.635,0.314],[0.645,0.323],[0.724,0.323],[0.731,0.332],[0.654,0.332],[0.663,0.341],[0.722,0.341],[0.713,0.351],[0.672,0.351],[0.681,0.36],[0.704,0.36],[0.695,0.369],[0.69,0.369]],"motion":"draw"},
 {"type":"path","x":0.671,"y":0.309,"width":0.13,"height":0.133,"color":"#142427","lineWidth":2,"start":3.2,"duration":0.6,"text":"","points":[[0.649,0.242],[0.736,0.331],[0.692,0.376],[0.606,0.287],[0.649,0.242]],"motion":"draw"},
 {"type":"path","x":0.411,"y":0.433,"width":0.037,"height":0.121,"color":"#608c85","lineWidth":9,"start":2.8,"duration":0.8,"text":"","points":[[0.392,0.373],[0.392,0.373],[0.401,0.382],[0.393,0.382],[0.393,0.392],[0.41,0.392],[0.419,0.401],[0.393,0.401],[0.393,0.41],[0.428,0.41],[0.429,0.419],[0.393,0.419],[0.393,0.429],[0.429,0.429],[0.429,0.438],[0.393,0.438],[0.393,0.447],[0.429,0.447],[0.429,0.457],[0.394,0.457],[0.403,0.466],[0.429,0.466],[0.429,0.475],[0.412,0.475],[0.421,0.484],[0.429,0.484],[0.43,0.494],[0.43,0.494]],"motion":"draw"},
 {"type":"path","x":0.476,"y":0.411,"width":0.081,"height":0.165,"color":"#3d6267","lineWidth":9,"start":3.1,"duration":0.8,"text":"","points":[[0.516,0.328],[0.516,0.328],[0.516,0.338],[0.507,0.338],[0.498,0.348],[0.516,0.348],[0.516,0.358],[0.488,0.358],[0.479,0.367],[0.516,0.367],[0.516,0.377],[0.469,0.377],[0.46,0.387],[0.516,0.387],[0.516,0.397],[0.45,0.397],[0.441,0.406],[0.516,0.406],[0.511,0.416],[0.436,0.416],[0.436,0.426],[0.501,0.426],[0.492,0.435],[0.436,0.435],[0.436,0.445],[0.483,0.445],[0.473,0.455],[0.436,0.455],[0.436,0.465],[0.464,0.465],[0.454,0.474],[0.436,0.474],[0.436,0.484],[0.445,0.484],[0.436,0.494],[0.436,0.494]],"motion":"draw"},
 {"type":"path","x":0.454,"y":0.344,"width":0.121,"height":0.121,"color":"#c6d1ad","lineWidth":9,"start":3.4,"duration":0.8,"text":"","points":[[0.473,0.284],[0.478,0.284],[0.488,0.293],[0.464,0.293],[0.455,0.303],[0.497,0.303],[0.506,0.312],[0.446,0.312],[0.437,0.321],[0.515,0.321],[0.508,0.331],[0.428,0.331],[0.419,0.34],[0.499,0.34],[0.49,0.349],[0.41,0.349],[0.401,0.358],[0.48,0.358],[0.471,0.368],[0.394,0.368],[0.403,0.377],[0.462,0.377],[0.453,0.386],[0.412,0.386],[0.421,0.396],[0.444,0.396],[0.435,0.405],[0.43,0.405]],"motion":"draw"},
 {"type":"path","x":0.454,"y":0.344,"width":0.13,"height":0.133,"color":"#142427","lineWidth":2,"start":4.0,"duration":0.6,"text":"","points":[[0.476,0.278],[0.519,0.322],[0.433,0.411],[0.389,0.367],[0.476,0.278]],"motion":"draw"},
 {"type":"path","x":0.584,"y":0.487,"width":0.037,"height":0.192,"color":"#608c85","lineWidth":9,"start":3.6,"duration":0.8,"text":"","points":[[0.566,0.391],[0.566,0.391],[0.574,0.4],[0.566,0.4],[0.566,0.41],[0.584,0.41],[0.593,0.419],[0.566,0.419],[0.566,0.429],[0.602,0.429],[0.602,0.439],[0.566,0.439],[0.566,0.448],[0.602,0.448],[0.602,0.458],[0.566,0.458],[0.566,0.467],[0.602,0.467],[0.602,0.477],[0.566,0.477],[0.566,0.487],[0.602,0.487],[0.602,0.496],[0.566,0.496],[0.566,0.506],[0.602,0.506],[0.602,0.515],[0.566,0.515],[0.566,0.525],[0.602,0.525],[0.602,0.535],[0.566,0.535],[0.566,0.544],[0.602,0.544],[0.602,0.554],[0.575,0.554],[0.585,0.563],[0.602,0.563],[0.602,0.573],[0.594,0.573],[0.603,0.583],[0.603,0.583]],"motion":"draw"},
 {"type":"path","x":0.627,"y":0.487,"width":0.037,"height":0.192,"color":"#3d6267","lineWidth":9,"start":3.9,"duration":0.8,"text":"","points":[[0.646,0.391],[0.646,0.391],[0.646,0.4],[0.637,0.4],[0.628,0.41],[0.646,0.41],[0.646,0.419],[0.618,0.419],[0.609,0.429],[0.646,0.429],[0.646,0.439],[0.609,0.439],[0.609,0.448],[0.646,0.448],[0.646,0.458],[0.609,0.458],[0.609,0.467],[0.646,0.467],[0.646,0.477],[0.609,0.477],[0.609,0.487],[0.646,0.487],[0.646,0.496],[0.609,0.496],[0.609,0.506],[0.646,0.506],[0.646,0.515],[0.609,0.515],[0.609,0.525],[0.646,0.525],[0.646,0.535],[0.609,0.535],[0.609,0.544],[0.646,0.544],[0.636,0.554],[0.609,0.554],[0.609,0.563],[0.627,0.563],[0.618,0.573],[0.609,0.573],[0.609,0.583],[0.609,0.583]],"motion":"draw"},
 {"type":"path","x":0.606,"y":0.384,"width":0.08,"height":0.076,"color":"#c6d1ad","lineWidth":9,"start":4.2,"duration":0.8,"text":"","points":[[0.603,0.346],[0.608,0.346],[0.618,0.356],[0.594,0.356],[0.585,0.365],[0.627,0.365],[0.636,0.375],[0.575,0.375],[0.566,0.384],[0.646,0.384],[0.636,0.394],[0.575,0.394],[0.585,0.404],[0.627,0.404],[0.618,0.413],[0.594,0.413],[0.603,0.423],[0.608,0.423]],"motion":"draw"},
 {"type":"path","x":0.606,"y":0.384,"width":0.087,"height":0.089,"color":"#142427","lineWidth":2,"start":4.8,"duration":0.6,"text":"","points":[[0.606,0.34],[0.649,0.384],[0.606,0.429],[0.562,0.384],[0.606,0.34]],"motion":"draw"},
 {"type":"path","x":0.476,"y":0.598,"width":0.081,"height":0.147,"color":"#608c85","lineWidth":9,"start":4.4,"duration":0.8,"text":"","points":[[0.436,0.524],[0.436,0.524],[0.445,0.534],[0.436,0.534],[0.436,0.544],[0.454,0.544],[0.464,0.554],[0.436,0.554],[0.436,0.563],[0.473,0.563],[0.483,0.573],[0.436,0.573],[0.436,0.583],[0.493,0.583],[0.502,0.593],[0.44,0.593],[0.45,0.603],[0.512,0.603],[0.516,0.613],[0.459,0.613],[0.469,0.622],[0.516,0.622],[0.516,0.632],[0.478,0.632],[0.488,0.642],[0.516,0.642],[0.516,0.652],[0.497,0.652],[0.507,0.662],[0.516,0.662],[0.516,0.672],[0.516,0.672]],"motion":"draw"},
 {"type":"path","x":0.541,"y":0.62,"width":0.037,"height":0.103,"color":"#3d6267","lineWidth":9,"start":4.7,"duration":0.8,"text":"","points":[[0.559,0.568],[0.559,0.568],[0.559,0.578],[0.551,0.578],[0.542,0.587],[0.559,0.587],[0.559,0.597],[0.533,0.597],[0.523,0.606],[0.559,0.606],[0.559,0.615],[0.523,0.615],[0.523,0.625],[0.559,0.625],[0.558,0.634],[0.523,0.634],[0.523,0.643],[0.549,0.643],[0.54,0.653],[0.523,0.653],[0.523,0.662],[0.531,0.662],[0.522,0.672],[0.522,0.672]],"motion":"draw"},
 {"type":"path","x":0.498,"y":0.54,"width":0.121,"height":0.121,"color":"#c6d1ad","lineWidth":9,"start":5.0,"duration":0.8,"text":"","points":[[0.473,0.48],[0.478,0.48],[0.488,0.489],[0.464,0.489],[0.455,0.498],[0.497,0.498],[0.506,0.507],[0.446,0.507],[0.437,0.517],[0.515,0.517],[0.524,0.526],[0.444,0.526],[0.453,0.535],[0.533,0.535],[0.542,0.545],[0.462,0.545],[0.471,0.554],[0.551,0.554],[0.558,0.563],[0.48,0.563],[0.489,0.573],[0.549,0.573],[0.54,0.582],[0.499,0.582],[0.508,0.591],[0.531,0.591],[0.522,0.6],[0.517,0.6]],"motion":"draw"},
 {"type":"path","x":0.498,"y":0.54,"width":0.13,"height":0.133,"color":"#142427","lineWidth":2,"start":5.6,"duration":0.6,"text":"","points":[[0.476,0.473],[0.562,0.562],[0.519,0.607],[0.433,0.518],[0.476,0.473]],"motion":"draw"},
 {"type":"circle","x":0.731,"y":0.442,"width":0.022,"height":0.039,"color":"#608c85","lineWidth":1,"start":6.4,"duration":0.6,"text":"","points":[],"motion":"fade"},
 {"type":"circle","x":0.567,"y":0.371,"width":0.019,"height":0.033,"color":"#608c85","lineWidth":1,"start":6.7,"duration":0.6,"text":"","points":[],"motion":"fade"},
 {"type":"text","x":0.188,"y":0.222,"width":0.281,"height":0.064,"color":"#c6d1ad","lineWidth":1,"start":7.6,"duration":1.0,"text":"Küçük şehir","points":[],"motion":"fade"},
 {"type":"text","x":0.188,"y":0.299,"width":0.281,"height":0.036,"color":"#c6d1ad","lineWidth":1,"start":8.2,"duration":1.0,"text":"beş blok, bir meydan","points":[],"motion":"fade"},
 {"type":"circle","x":0.875,"y":0.194,"width":0.016,"height":0.028,"color":"#c6d1ad","lineWidth":1,"start":8.8,"duration":0.5,"text":"","points":[],"motion":"float"}
]}
```

## Kabul ölçütleri

Örtüşme sırası tutarlı; yüzler birleşiyor; ışık yönü tüm bloklarda aynı; metin okunur.
Son kare tek başına bakıldığında bitmiş, dengeli bir resim olmalı; tüm metin okunur ve güvenli alanda.

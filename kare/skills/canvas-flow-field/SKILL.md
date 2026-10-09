---
name: canvas-flow-field
description: "Kare Canvas 2D sahnelerini akış alanı stilinde üretir: bir vektör alanını izleyen, sırayla çizilen organik eğri demetleri. Akış, rüzgâr, akıntı, enerji, veri akışı, soyut hareket istekleri için kullan."
---

# canvas-flow-field · Akış alanları

Bu beceri, Kare'nin Canvas 2D motorunda **Akış alanları** stilinde, AI'ın JSON olarak döndürdüğü düzenlenebilir sahneler içindir (kod değil, yalnızca sahne verisi; `composed` sahnelerde hazır prosedürel çizim kapalıdır, her şeyi nesnelerle sen kurarsın).

## Amaç ve görünüm

Bir rüzgâr ya da akıntı haritası: 7–12 uzun, paralel ama birbirinden hafif farklı eğri; hepsi aynı alanın (sinüs toplamı, yakınsama-ıraksama) yönünü izler. Çizgiler soldan sağa `draw` ile akar. Kalınlık 2.5–4, renkler 2–3 tonda dönüşümlü.

## Tuval ve güvenli alan

- Mantıksal tuval **1280×720**. Tüm `x`, `y`, `width`, `height` ve path noktaları **0–1 normalize** değerdir: piksel = x·1280, y·720.
- `x`,`y` nesnenin **merkezidir** (circle, ellipse, rect, text). Path için `x`,`y` noktaların sınır kutusunun merkezi, `width`/`height` kutunun boyu olsun (döndürme ve kalite denetimi bunu kullanır).
- **Güvenli alan:** x .04–.96, y .08–.82. Alt ~100 px (y > .86) altyazı bandıdır; metni ve odak nesnesini oraya koyma. Zemin/gökyüzü gibi arka plan bantları kenara kadar uzanabilir ama 0–1 dışına taşmasın.
- Circle'da `width` çaptır ve 1280 px'e göredir: dikey yarıçap = width·1280/720/2 (ör. width .1 → 128 px çap, y'de ±.089). `height` circle için kullanılmaz, width ile aynı oranı yaz.
- Nesneler dizideki **sırayla** çizilir: önce arka plan, sonra orta plan, en son ön plan ve metin.

## Kompozisyon

- Bir **odak nesnesi** seç ve üçte bir noktalarına (x≈.33/.67, y≈.33/.6) ya da bilinçli olarak merkeze yerleştir; 3–7 ana form + destekleyici ayrıntı.
- Derinlik katmanları: arka plan (büyük, düşük kontrast) → orta plan → ön plan (en koyu/en doygun) → metin. Boş alan bırak; ana formlar çerçeve genişliğinin en az %12'si olsun.
- Çizgiler ortak bir alan fonksiyonundan türesin: y = y0 + A·sin(x/λ + faz·k) + küçük ikinci harmonik. Her çizgide faz biraz kaysın.
- Çizgiler arası mesafe 30–50 px; demet sahnenin orta %60'ını kaplasın, metin üst ya da alt boşlukta.
- Yakınsama noktası (delta, odak) üçte bir çizgisinde.

## Palet

Arka plan **#203530**. Tema paleti (sırayla): `#bbcea1`, `#c18f65`, `#83aaa5`.
- `#bbcea1` — ana akış çizgileri, başlık (arka planla kontrast 7.7:1)
- `#c18f65` — vurgu çizgisi ve düğüm noktası (arka planla kontrast 4.6:1)
- `#83aaa5` — ikincil akış, etiketler (arka planla kontrast 5.1:1)
Akış bölgesinin arkasına zemine yakın büyük koyu leke (`#2b4640`) derinlik verir. Çizgilerin %20'sinden fazlası vurgu renginde olmasın.

## Zamanlama ve koreografi

Süre D için ritim: **%0–15** sahneyi kur (arka plan, zemin, büyük renk alanları) · **%15–60** odak nesnesini inşa et (ana çizgiler `draw`, ana formlar `fade`/`slide`) · **%55–85** ayrıntı, vurgu ve etiketler · **%85–100** bekleme: yeni nesne yok, yalnızca 1–4 `float`/`rotate` ortam hareketi.
- Girişleri **kademelendir**: kardeş öğeler arasında .15–.6 sn aralık; aynı anda en fazla 2–3 nesne başlasın. `start` değerlerinin hepsi 0 olmasın.
- Tipik giriş süresi: fade .6–1.5 sn, slide .8–1.2 sn, draw 1.5–4 sn (uzun yol = daha uzun süre). Çok kısa (<.3 sn) girişler sıçrama gibi görünür.
- Son nesne en geç D·0.8'de başlasın; izleyici bitmiş resmi en az 2 sn görsün.
- Çizgiler .3–.4 sn arayla, her biri 2.5–3 sn `draw` — dalga gibi bir yayılma. Ortadaki çizgi önce, kenarlar sonra başlarsa yelpaze açılır.
- Düğüm/etiketler akış bittikten sonra; 1–2 nokta `float`.

## Metin

- Türkçe karakterleri doğru yaz (ç ğ ı İ ö ş ü). Başlık en fazla ~5 kelime, etiket 1–3 kelime; bir text nesnesinde en fazla 8 kelime.
- Boyut (`height`): başlık .06–.09 (43–65 px), alt başlık .04–.05, etiket .033–.04 (24–29 px). 20 px altı okunmaz.
- `width` metni sığdıracak kadar geniş olsun (yaklaşık karakter sayısı × yazı boyu × .56 / 1280). Metinler birbiriyle ve yoğun şekillerle çakışmasın.
- Metin rengi arka planla en az 4.5:1 kontrast vermeli: bu stilde metin için **#bbcea1** kullan.

## Nesne sözleşmesi (AI çıktısı — alanlar birebir)

Sahne: `category` (bu beceri: **flow-field**), `title` (1–160), `duration` (2–60 sn), `seed` (tamsayı), `speed` (.2–3, float/rotate hızını çarpar), `detail` (.25–2), `background` (#RRGGBB), `palette` (2–8 × #RRGGBB), `objects` (en fazla 80; iyi sahne 8–30).
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

- Eğri: 30–35 nokta, x eşit aralıklı, y alan fonksiyonundan.
- Yelpaze/delta: y = merkez + u·genişlik·(|x−x0|/L)^1.3 — x0'da toplanır, iki yana açılır.
- Akış yönünü vurgulamak için bir çizgiyi vurgu renginde ve biraz kalın çiz.

## Sık hatalar (kaçın)

- Nesneyi çerçeve dışına taşırmak (x±width/2, circle'da dikey yarıçap, float için +14 px pay) ya da metni altyazı bandına koymak.
- Bütün nesneleri `start: 0` ile başlatmak; ya da son saniyede yeni nesne getirmek.
- Minik şekiller (width < .015) ve 20 px altı yazılar; ana form çerçevenin %12'sinden küçük.
- 40'tan fazla benzer küçük nesne (parçacık/nokta yığını) — ritim kaybolur, sahne kirlenir. 10–25 yeterli.
- Yanlış alan adları (`radius`, `fill`, `size`, `fontSize`, `delay`, `animation`, `keyframes`) ya da eksik alan; renkleri `rgb()`/isimle yazmak.
- Path'i dolgu sanmak; path `x`,`y` değerini sınır kutusu merkezine koymamak; 2'den az nokta.
- Her şeyi aynı boyutta, ortada üst üste yığmak; odak nesnesi olmayan "dağınık" kompozisyon.
- Çizgileri birbirini kesecek kadar büyük genlikle çizmek (karmaşa).
- Tüm çizgileri aynı anda başlatmak; çok kısa (<10 nokta) köşeli çizgiler.

## Örnek 1 — kısa: rüzgâr çizgileri

```json
{"category":"flow-field","title":"Rüzgâr çizgileri","duration":8,"seed":15,"speed":1,"detail":1,"background":"#203530","palette":["#bbcea1","#c18f65","#83aaa5"],"objects":[
 {"type":"path","x":0.5,"y":0.34,"width":0.844,"height":0.146,"color":"#bbcea1","lineWidth":4,"start":0.4,"duration":2.6,"text":"","points":[[0.078,0.347],[0.106,0.369],[0.134,0.388],[0.163,0.403],[0.191,0.411],[0.219,0.413],[0.247,0.41],[0.275,0.402],[0.303,0.392],[0.331,0.382],[0.359,0.373],[0.388,0.368],[0.416,0.365],[0.444,0.365],[0.472,0.366],[0.5,0.366],[0.528,0.364],[0.556,0.358],[0.584,0.347],[0.613,0.332],[0.641,0.315],[0.669,0.298],[0.697,0.283],[0.725,0.272],[0.753,0.267],[0.781,0.27],[0.809,0.279],[0.838,0.294],[0.866,0.313],[0.894,0.333],[0.922,0.352]],"motion":"draw"},
 {"type":"path","x":0.5,"y":0.406,"width":0.844,"height":0.145,"color":"#83aaa5","lineWidth":3,"start":0.75,"duration":2.6,"text":"","points":[[0.078,0.457],[0.106,0.47],[0.134,0.477],[0.163,0.478],[0.191,0.474],[0.219,0.466],[0.247,0.456],[0.275,0.447],[0.303,0.44],[0.331,0.435],[0.359,0.434],[0.388,0.434],[0.416,0.435],[0.444,0.435],[0.472,0.432],[0.5,0.425],[0.528,0.413],[0.556,0.397],[0.584,0.38],[0.613,0.362],[0.641,0.347],[0.669,0.337],[0.697,0.334],[0.725,0.337],[0.753,0.347],[0.781,0.363],[0.809,0.382],[0.838,0.402],[0.866,0.42],[0.894,0.434],[0.922,0.444]],"motion":"draw"},
 {"type":"path","x":0.5,"y":0.472,"width":0.844,"height":0.143,"color":"#c18f65","lineWidth":3,"start":1.1,"duration":2.6,"text":"","points":[[0.078,0.543],[0.106,0.543],[0.134,0.538],[0.163,0.53],[0.191,0.521],[0.219,0.512],[0.247,0.506],[0.275,0.503],[0.303,0.502],[0.331,0.503],[0.359,0.505],[0.388,0.504],[0.416,0.5],[0.444,0.491],[0.472,0.479],[0.5,0.462],[0.528,0.444],[0.556,0.427],[0.584,0.412],[0.613,0.403],[0.641,0.4],[0.669,0.405],[0.697,0.416],[0.725,0.432],[0.753,0.451],[0.781,0.471],[0.809,0.488],[0.838,0.501],[0.866,0.509],[0.894,0.513],[0.922,0.513]],"motion":"draw"},
 {"type":"path","x":0.5,"y":0.535,"width":0.844,"height":0.136,"color":"#bbcea1","lineWidth":4,"start":1.45,"duration":2.6,"text":"","points":[[0.078,0.603],[0.106,0.594],[0.134,0.586],[0.163,0.578],[0.191,0.573],[0.219,0.571],[0.247,0.571],[0.275,0.573],[0.303,0.574],[0.331,0.572],[0.359,0.567],[0.388,0.558],[0.416,0.544],[0.444,0.527],[0.472,0.508],[0.5,0.491],[0.528,0.477],[0.556,0.468],[0.584,0.467],[0.613,0.473],[0.641,0.485],[0.669,0.501],[0.697,0.52],[0.725,0.539],[0.753,0.555],[0.781,0.567],[0.809,0.575],[0.838,0.578],[0.866,0.577],[0.894,0.575],[0.922,0.574]],"motion":"draw"},
 {"type":"path","x":0.5,"y":0.592,"width":0.844,"height":0.116,"color":"#83aaa5","lineWidth":3,"start":1.8,"duration":2.6,"text":"","points":[[0.078,0.651],[0.106,0.644],[0.134,0.64],[0.163,0.639],[0.191,0.64],[0.219,0.642],[0.247,0.643],[0.275,0.641],[0.303,0.635],[0.331,0.624],[0.359,0.609],[0.388,0.591],[0.416,0.572],[0.444,0.555],[0.472,0.542],[0.5,0.534],[0.528,0.534],[0.556,0.541],[0.584,0.554],[0.613,0.571],[0.641,0.589],[0.669,0.607],[0.697,0.623],[0.725,0.634],[0.753,0.64],[0.781,0.642],[0.809,0.642],[0.838,0.64],[0.866,0.639],[0.894,0.639],[0.922,0.643]],"motion":"draw"},
 {"type":"path","x":0.5,"y":0.664,"width":0.844,"height":0.126,"color":"#c18f65","lineWidth":3,"start":2.15,"duration":2.6,"text":"","points":[[0.078,0.707],[0.106,0.707],[0.134,0.709],[0.163,0.711],[0.191,0.712],[0.219,0.709],[0.247,0.702],[0.275,0.69],[0.303,0.674],[0.331,0.656],[0.359,0.637],[0.388,0.62],[0.416,0.607],[0.444,0.601],[0.472,0.601],[0.5,0.609],[0.528,0.623],[0.556,0.64],[0.584,0.658],[0.613,0.676],[0.641,0.69],[0.669,0.7],[0.697,0.705],[0.725,0.707],[0.753,0.706],[0.781,0.704],[0.809,0.704],[0.838,0.706],[0.866,0.711],[0.894,0.718],[0.922,0.727]],"motion":"draw"},
 {"type":"path","x":0.5,"y":0.738,"width":0.844,"height":0.143,"color":"#bbcea1","lineWidth":4,"start":2.5,"duration":2.6,"text":"","points":[[0.078,0.778],[0.106,0.78],[0.134,0.78],[0.163,0.777],[0.191,0.769],[0.219,0.756],[0.247,0.739],[0.275,0.72],[0.303,0.701],[0.331,0.684],[0.359,0.672],[0.388,0.667],[0.416,0.669],[0.444,0.678],[0.472,0.692],[0.5,0.709],[0.528,0.727],[0.556,0.744],[0.584,0.757],[0.613,0.766],[0.641,0.77],[0.669,0.771],[0.697,0.77],[0.725,0.769],[0.753,0.769],[0.781,0.772],[0.809,0.778],[0.838,0.787],[0.866,0.796],[0.894,0.804],[0.922,0.81]],"motion":"draw"},
 {"type":"circle","x":0.875,"y":0.222,"width":0.016,"height":0.028,"color":"#c18f65","lineWidth":1,"start":4.2,"duration":0.6,"text":"","points":[],"motion":"float"},
 {"type":"text","x":0.234,"y":0.167,"width":0.375,"height":0.064,"color":"#bbcea1","lineWidth":1,"start":4.6,"duration":1.0,"text":"Rüzgâr çizgileri","points":[],"motion":"fade"}
]}
```

## Örnek 2 — zengin: nehir deltası

```json
{"category":"flow-field","title":"Nehir deltası","duration":14,"seed":27,"speed":1,"detail":1,"background":"#203530","palette":["#bbcea1","#c18f65","#83aaa5","#2b4640"],"objects":[
 {"type":"ellipse","x":0.703,"y":0.542,"width":0.469,"height":0.556,"color":"#2b4640","lineWidth":1,"start":0.0,"duration":2.0,"text":"","points":[],"motion":"fade"},
 {"type":"path","x":0.503,"y":0.322,"width":0.85,"height":0.456,"color":"#83aaa5","lineWidth":3.5,"start":2.75,"duration":3.0,"text":"","points":[[0.078,0.344],[0.105,0.364],[0.131,0.38],[0.158,0.394],[0.184,0.407],[0.211,0.42],[0.237,0.434],[0.264,0.45],[0.291,0.467],[0.317,0.486],[0.344,0.505],[0.37,0.523],[0.397,0.539],[0.423,0.55],[0.45,0.548],[0.477,0.533],[0.503,0.512],[0.53,0.489],[0.556,0.465],[0.583,0.441],[0.609,0.419],[0.636,0.398],[0.662,0.378],[0.689,0.359],[0.716,0.338],[0.742,0.316],[0.769,0.29],[0.795,0.262],[0.822,0.23],[0.848,0.197],[0.875,0.162],[0.902,0.127],[0.928,0.094]],"motion":"draw"},
 {"type":"path","x":0.503,"y":0.365,"width":0.85,"height":0.363,"color":"#bbcea1","lineWidth":2.5,"start":2.4,"duration":3.0,"text":"","points":[[0.078,0.382],[0.105,0.393],[0.131,0.403],[0.158,0.414],[0.184,0.426],[0.211,0.439],[0.237,0.455],[0.264,0.472],[0.291,0.49],[0.317,0.507],[0.344,0.522],[0.37,0.534],[0.397,0.542],[0.423,0.546],[0.45,0.541],[0.477,0.525],[0.503,0.508],[0.53,0.491],[0.556,0.475],[0.583,0.461],[0.609,0.448],[0.636,0.435],[0.662,0.421],[0.689,0.404],[0.716,0.386],[0.742,0.363],[0.769,0.339],[0.795,0.311],[0.822,0.284],[0.848,0.256],[0.875,0.23],[0.902,0.205],[0.928,0.183]],"motion":"draw"},
 {"type":"path","x":0.503,"y":0.409,"width":0.85,"height":0.256,"color":"#83aaa5","lineWidth":3.5,"start":2.05,"duration":3.0,"text":"","points":[[0.078,0.414],[0.105,0.421],[0.131,0.43],[0.158,0.44],[0.184,0.454],[0.211,0.468],[0.237,0.484],[0.264,0.499],[0.291,0.512],[0.317,0.523],[0.344,0.53],[0.37,0.534],[0.397,0.536],[0.423,0.536],[0.45,0.531],[0.477,0.521],[0.503,0.512],[0.53,0.503],[0.556,0.496],[0.583,0.489],[0.609,0.481],[0.636,0.471],[0.662,0.458],[0.689,0.442],[0.716,0.423],[0.742,0.402],[0.769,0.38],[0.795,0.359],[0.822,0.34],[0.848,0.323],[0.875,0.307],[0.902,0.294],[0.928,0.281]],"motion":"draw"},
 {"type":"path","x":0.503,"y":0.453,"width":0.85,"height":0.153,"color":"#c18f65","lineWidth":2.5,"start":1.7,"duration":3.0,"text":"","points":[[0.078,0.448],[0.105,0.455],[0.131,0.465],[0.158,0.477],[0.184,0.49],[0.211,0.502],[0.237,0.512],[0.264,0.52],[0.291,0.526],[0.317,0.528],[0.344,0.529],[0.37,0.528],[0.397,0.529],[0.423,0.53],[0.45,0.529],[0.477,0.527],[0.503,0.525],[0.53,0.523],[0.556,0.52],[0.583,0.516],[0.609,0.508],[0.636,0.498],[0.662,0.484],[0.689,0.469],[0.716,0.454],[0.742,0.439],[0.769,0.426],[0.795,0.415],[0.822,0.406],[0.848,0.399],[0.875,0.393],[0.902,0.386],[0.928,0.377]],"motion":"draw"},
 {"type":"path","x":0.503,"y":0.503,"width":0.85,"height":0.078,"color":"#83aaa5","lineWidth":3.5,"start":1.35,"duration":3.0,"text":"","points":[[0.078,0.492],[0.105,0.5],[0.131,0.509],[0.158,0.518],[0.184,0.525],[0.211,0.53],[0.237,0.532],[0.264,0.532],[0.291,0.53],[0.317,0.528],[0.344,0.526],[0.37,0.526],[0.397,0.528],[0.423,0.533],[0.45,0.537],[0.477,0.54],[0.503,0.542],[0.53,0.542],[0.556,0.539],[0.583,0.533],[0.609,0.525],[0.636,0.516],[0.662,0.506],[0.689,0.496],[0.716,0.489],[0.742,0.484],[0.769,0.481],[0.795,0.48],[0.822,0.48],[0.848,0.479],[0.875,0.476],[0.902,0.471],[0.928,0.464]],"motion":"draw"},
 {"type":"path","x":0.503,"y":0.542,"width":0.85,"height":0.022,"color":"#bbcea1","lineWidth":2.5,"start":1.0,"duration":3.0,"text":"","points":[[0.078,0.543],[0.105,0.548],[0.131,0.552],[0.158,0.553],[0.184,0.551],[0.211,0.548],[0.237,0.543],[0.264,0.537],[0.291,0.533],[0.317,0.531],[0.344,0.531],[0.37,0.534],[0.397,0.538],[0.423,0.544],[0.45,0.548],[0.477,0.552],[0.503,0.553],[0.53,0.551],[0.556,0.547],[0.583,0.542],[0.609,0.537],[0.636,0.533],[0.662,0.531],[0.689,0.531],[0.716,0.534],[0.742,0.539],[0.769,0.544],[0.795,0.549],[0.822,0.552],[0.848,0.553],[0.875,0.551],[0.902,0.547],[0.928,0.542]],"motion":"draw"},
 {"type":"path","x":0.503,"y":0.582,"width":0.85,"height":0.076,"color":"#83aaa5","lineWidth":3.5,"start":1.35,"duration":3.0,"text":"","points":[[0.078,0.593],[0.105,0.59],[0.131,0.585],[0.158,0.577],[0.184,0.569],[0.211,0.56],[0.237,0.552],[0.264,0.547],[0.291,0.544],[0.317,0.544],[0.344,0.546],[0.37,0.549],[0.397,0.551],[0.423,0.553],[0.45,0.553],[0.477,0.554],[0.503,0.553],[0.53,0.552],[0.556,0.551],[0.583,0.551],[0.609,0.553],[0.636,0.558],[0.662,0.566],[0.689,0.576],[0.716,0.586],[0.742,0.596],[0.769,0.605],[0.795,0.611],[0.822,0.614],[0.848,0.616],[0.875,0.617],[0.902,0.618],[0.928,0.62]],"motion":"draw"},
 {"type":"path","x":0.503,"y":0.627,"width":0.85,"height":0.158,"color":"#c18f65","lineWidth":2.5,"start":1.7,"duration":3.0,"text":"","points":[[0.078,0.634],[0.105,0.623],[0.131,0.61],[0.158,0.597],[0.184,0.585],[0.211,0.576],[0.237,0.57],[0.264,0.567],[0.291,0.565],[0.317,0.564],[0.344,0.564],[0.37,0.561],[0.397,0.558],[0.423,0.552],[0.45,0.548],[0.477,0.548],[0.503,0.549],[0.53,0.552],[0.556,0.558],[0.583,0.567],[0.609,0.579],[0.636,0.593],[0.662,0.608],[0.689,0.623],[0.716,0.636],[0.742,0.647],[0.769,0.656],[0.795,0.662],[0.822,0.669],[0.848,0.675],[0.875,0.683],[0.902,0.693],[0.928,0.706]],"motion":"draw"},
 {"type":"path","x":0.503,"y":0.67,"width":0.85,"height":0.264,"color":"#83aaa5","lineWidth":3.5,"start":2.05,"duration":3.0,"text":"","points":[[0.078,0.667],[0.105,0.65],[0.131,0.634],[0.158,0.621],[0.184,0.611],[0.211,0.603],[0.237,0.598],[0.264,0.593],[0.291,0.588],[0.317,0.582],[0.344,0.574],[0.37,0.565],[0.397,0.554],[0.423,0.543],[0.45,0.538],[0.477,0.542],[0.503,0.55],[0.53,0.561],[0.556,0.576],[0.583,0.593],[0.609,0.612],[0.636,0.63],[0.662,0.647],[0.689,0.663],[0.716,0.676],[0.742,0.687],[0.769,0.698],[0.795,0.71],[0.822,0.723],[0.848,0.739],[0.875,0.758],[0.902,0.779],[0.928,0.802]],"motion":"draw"},
 {"type":"path","x":0.503,"y":0.717,"width":0.85,"height":0.366,"color":"#bbcea1","lineWidth":2.5,"start":2.4,"duration":3.0,"text":"","points":[[0.078,0.699],[0.105,0.681],[0.131,0.667],[0.158,0.655],[0.184,0.645],[0.211,0.636],[0.237,0.627],[0.264,0.617],[0.291,0.605],[0.317,0.591],[0.344,0.575],[0.37,0.56],[0.397,0.546],[0.423,0.535],[0.45,0.534],[0.477,0.545],[0.503,0.561],[0.53,0.58],[0.556,0.6],[0.583,0.622],[0.609,0.642],[0.636,0.66],[0.662,0.677],[0.689,0.693],[0.716,0.708],[0.742,0.724],[0.769,0.742],[0.795,0.763],[0.822,0.786],[0.848,0.813],[0.875,0.842],[0.902,0.871],[0.928,0.9]],"motion":"draw"},
 {"type":"path","x":0.503,"y":0.762,"width":0.85,"height":0.455,"color":"#83aaa5","lineWidth":3.5,"start":2.75,"duration":3.0,"text":"","points":[[0.078,0.74],[0.105,0.723],[0.131,0.709],[0.158,0.696],[0.184,0.682],[0.211,0.667],[0.237,0.65],[0.264,0.631],[0.291,0.611],[0.317,0.591],[0.344,0.572],[0.37,0.556],[0.397,0.543],[0.423,0.535],[0.45,0.539],[0.477,0.556],[0.503,0.577],[0.53,0.6],[0.556,0.622],[0.583,0.642],[0.609,0.662],[0.636,0.68],[0.662,0.699],[0.689,0.719],[0.716,0.741],[0.742,0.766],[0.769,0.794],[0.795,0.826],[0.822,0.859],[0.848,0.893],[0.875,0.927],[0.902,0.959],[0.928,0.99]],"motion":"draw"},
 {"type":"circle","x":0.438,"y":0.542,"width":0.025,"height":0.044,"color":"#c18f65","lineWidth":1,"start":4.6,"duration":0.6,"text":"","points":[],"motion":"fade"},
 {"type":"circle","x":0.898,"y":0.264,"width":0.013,"height":0.022,"color":"#bbcea1","lineWidth":1,"start":5.4,"duration":0.5,"text":"","points":[],"motion":"float"},
 {"type":"circle","x":0.898,"y":0.806,"width":0.013,"height":0.022,"color":"#bbcea1","lineWidth":1,"start":5.7,"duration":0.5,"text":"","points":[],"motion":"float"},
 {"type":"text","x":0.156,"y":0.347,"width":0.156,"height":0.039,"color":"#83aaa5","lineWidth":1,"start":6.4,"duration":0.8,"text":"kaynak","points":[],"motion":"fade"},
 {"type":"text","x":0.82,"y":0.153,"width":0.156,"height":0.039,"color":"#83aaa5","lineWidth":1,"start":6.8,"duration":0.8,"text":"delta","points":[],"motion":"fade"},
 {"type":"text","x":0.258,"y":0.167,"width":0.328,"height":0.064,"color":"#bbcea1","lineWidth":1,"start":7.6,"duration":1.0,"text":"Nehir deltası","points":[],"motion":"fade"},
 {"type":"text","x":0.258,"y":0.778,"width":0.359,"height":0.036,"color":"#bbcea1","lineWidth":1,"start":8.4,"duration":1.0,"text":"akış ayrılır, toprak doğar","points":[],"motion":"fade"}
]}
```

## Kabul ölçütleri

Çizgiler aynı akış yönünü izler; demet dengeli; yayılma ritmi görünür; metin boşlukta.
Son kare tek başına bakıldığında bitmiş, dengeli bir resim olmalı; tüm metin okunur ve güvenli alanda.

---
name: canvas-data-viz
description: "Kare Canvas 2D sahnelerini veri anlatımı (data storytelling) stilinde üretir: ölçekli çubuk ve çizgi grafikler, eksen ve etiketler, sırayla beliren değerler, tek vurgu. Grafik, istatistik, karşılaştırma, trend, infografik istekleri için kullan."
---

# canvas-data-viz · Veri anlatımı

Bu beceri, Kare'nin Canvas 2D motorunda **Veri anlatımı** stilinde, AI'ın JSON olarak döndürdüğü düzenlenebilir sahneler içindir (kod değil, yalnızca sahne verisi; `composed` sahnelerde hazır prosedürel çizim kapalıdır, her şeyi nesnelerle sen kurarsın).

## Amaç ve görünüm

Sakin, editoryal infografik: ince ızgara, net bir taban çizgisi, ölçekli çubuklar ya da çizgi, değer etiketleri, tek bir vurgulanan bulgu ve kısa başlık. Süs yok; her öğe veri taşır.

## Tuval ve güvenli alan

- Mantıksal tuval **1280×720**. Tüm `x`, `y`, `width`, `height` ve path noktaları **0–1 normalize** değerdir: piksel = x·1280, y·720.
- `x`,`y` nesnenin **merkezidir** (circle, ellipse, rect, text). Path için `x`,`y` noktaların sınır kutusunun merkezi, `width`/`height` kutunun boyu olsun (döndürme ve kalite denetimi bunu kullanır).
- **Güvenli alan:** x .04–.96, y .08–.82. Alt ~100 px (y > .86) altyazı bandıdır; metni ve odak nesnesini oraya koyma. Zemin/gökyüzü gibi arka plan bantları kenara kadar uzanabilir ama 0–1 dışına taşmasın.
- Circle'da `width` çaptır ve 1280 px'e göredir: dikey yarıçap = width·1280/720/2 (ör. width .1 → 128 px çap, y'de ±.089). `height` circle için kullanılmaz, width ile aynı oranı yaz.
- Nesneler dizideki **sırayla** çizilir: önce arka plan, sonra orta plan, en son ön plan ve metin.

## Kompozisyon

- Bir **odak nesnesi** seç ve üçte bir noktalarına (x≈.33/.67, y≈.33/.6) ya da bilinçli olarak merkeze yerleştir; 3–7 ana form + destekleyici ayrıntı.
- Derinlik katmanları: arka plan (büyük, düşük kontrast) → orta plan → ön plan (en koyu/en doygun) → metin. Boş alan bırak; ana formlar çerçeve genişliğinin en az %12'si olsun.
- Grafik alanı sahnenin ortası (x .15–.88, y .2–.78); başlık üstte ortalı, kaynak/not sağ altta küçük.
- **Ölçek tek ve tutarlı:** piksel yüksekliği = değer × birim (ör. 1 birim = 32 px); tüm çubuklar aynı tabana oturur: rect y = taban − yükseklik/2.
- Değer etiketi çubuğun 24 px üstünde; kategori etiketi tabanın 26 px altında.

## Palet

Arka plan **#eee9dd**. Tema paleti (sırayla): `#344b48`, `#91aaa1`, `#bc9165`, `#ba7464`.
- `#344b48` — eksen, etiket, başlık, veri noktası (arka planla kontrast 7.7:1)
- `#91aaa1` — normal çubuklar (arka planla kontrast 2.0:1)
- `#bc9165` — vurgulanan seri/çubuk, çizgi (arka planla kontrast 2.4:1)
- `#ba7464` — tek vurgu işareti (arka planla kontrast 3.0:1)
Izgara çizgisi için çok açık `#d6d0c2`. Vurgu rengi yalnızca bir veri noktasında; diğerleri nötr.

## Zamanlama ve koreografi

Süre D için ritim: **%0–15** sahneyi kur (arka plan, zemin, büyük renk alanları) · **%15–60** odak nesnesini inşa et (ana çizgiler `draw`, ana formlar `fade`/`slide`) · **%55–85** ayrıntı, vurgu ve etiketler · **%85–100** bekleme: yeni nesne yok, yalnızca 1–4 `float`/`rotate` ortam hareketi.
- Girişleri **kademelendir**: kardeş öğeler arasında .15–.6 sn aralık; aynı anda en fazla 2–3 nesne başlasın. `start` değerlerinin hepsi 0 olmasın.
- Tipik giriş süresi: fade .6–1.5 sn, slide .8–1.2 sn, draw 1.5–4 sn (uzun yol = daha uzun süre). Çok kısa (<.3 sn) girişler sıçrama gibi görünür.
- Son nesne en geç D·0.8'de başlasın; izleyici bitmiş resmi en az 2 sn görsün.
- Eksen/ızgara (0–1.5 sn) → kategori etiketleri → çubuklar soldan sağa .35 sn arayla `fade` → değerler → vurgu → başlık/not.
- Çizgi grafik: çizgi `draw` (3–4 sn); nokta i'nin start'ı = çizgi start + süre × i/(n−1) — nokta çizgi oraya ulaşınca belirir.

## Metin

- Türkçe karakterleri doğru yaz (ç ğ ı İ ö ş ü). Başlık en fazla ~5 kelime, etiket 1–3 kelime; bir text nesnesinde en fazla 8 kelime.
- Boyut (`height`): başlık .06–.09 (43–65 px), alt başlık .04–.05, etiket .033–.04 (24–29 px). 20 px altı okunmaz.
- `width` metni sığdıracak kadar geniş olsun (yaklaşık karakter sayısı × yazı boyu × .56 / 1280). Metinler birbiriyle ve yoğun şekillerle çakışmasın.
- Metin rengi arka planla en az 4.5:1 kontrast vermeli: bu stilde metin için **#344b48** kullan.

## Nesne sözleşmesi (AI çıktısı — alanlar birebir)

Sahne: `category` (bu beceri: **data-viz**), `title` (1–160), `duration` (2–60 sn), `seed` (tamsayı), `speed` (.2–3, float/rotate hızını çarpar), `detail` (.25–2), `background` (#RRGGBB), `palette` (2–8 × #RRGGBB), `objects` (en fazla 80; iyi sahne 8–30).
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

- Çubuk: rect, genişlik 60–80 px, aralık 120–140 px.
- Çizgi grafik: veri noktalarından path (x eşit aralıklı); noktalar küçük circle.
- Vurgu: büyük renkli circle + 2 noktalı işaret çizgisi + kısa açıklama metni.
- Kullanıcı verisi yoksa uydurma sayıları gerçek gibi sunma: "örnek veri" notu ekle.

## Sık hatalar (kaçın)

- Nesneyi çerçeve dışına taşırmak (x±width/2, circle'da dikey yarıçap, float için +14 px pay) ya da metni altyazı bandına koymak.
- Bütün nesneleri `start: 0` ile başlatmak; ya da son saniyede yeni nesne getirmek.
- Minik şekiller (width < .015) ve 20 px altı yazılar; ana form çerçevenin %12'sinden küçük.
- 40'tan fazla benzer küçük nesne (parçacık/nokta yığını) — ritim kaybolur, sahne kirlenir. 10–25 yeterli.
- Yanlış alan adları (`radius`, `fill`, `size`, `fontSize`, `delay`, `animation`, `keyframes`) ya da eksik alan; renkleri `rgb()`/isimle yazmak.
- Path'i dolgu sanmak; path `x`,`y` değerini sınır kutusu merkezine koymamak; 2'den az nokta.
- Her şeyi aynı boyutta, ortada üst üste yığmak; odak nesnesi olmayan "dağınık" kompozisyon.
- Çubukları farklı tabanlara oturtmak ya da ölçeği çubuk başına değiştirmek.
- Etiketleri çubuklarla çakıştırmak; 20 px altı eksen yazıları.
- Sahte kaynak yazmak; her çubuğu farklı renge boyamak.

## Örnek 1 — kısa: çubuk grafik

```json
{"category":"data-viz","title":"Haftalık adım sayısı","duration":9,"seed":3,"speed":1,"detail":1,"background":"#eee9dd","palette":["#344b48","#91aaa1","#bc9165","#ba7464","#d6d0c2"],"objects":[
 {"type":"path","x":0.48,"y":0.75,"width":0.508,"height":0.003,"color":"#344b48","lineWidth":3,"start":0.2,"duration":0.8,"text":"","points":[[0.227,0.75],[0.734,0.75]],"motion":"draw"},
 {"type":"text","x":0.281,"y":0.786,"width":0.07,"height":0.031,"color":"#344b48","lineWidth":1,"start":1.0,"duration":0.5,"text":"Pzt","points":[],"motion":"fade"},
 {"type":"text","x":0.383,"y":0.786,"width":0.07,"height":0.031,"color":"#344b48","lineWidth":1,"start":1.1,"duration":0.5,"text":"Sal","points":[],"motion":"fade"},
 {"type":"text","x":0.484,"y":0.786,"width":0.07,"height":0.031,"color":"#344b48","lineWidth":1,"start":1.2,"duration":0.5,"text":"Çar","points":[],"motion":"fade"},
 {"type":"text","x":0.586,"y":0.786,"width":0.07,"height":0.031,"color":"#344b48","lineWidth":1,"start":1.3,"duration":0.5,"text":"Per","points":[],"motion":"fade"},
 {"type":"text","x":0.688,"y":0.786,"width":0.07,"height":0.031,"color":"#344b48","lineWidth":1,"start":1.4,"duration":0.5,"text":"Cum","points":[],"motion":"fade"},
 {"type":"rect","x":0.281,"y":0.617,"width":0.055,"height":0.267,"color":"#91aaa1","lineWidth":1,"start":1.4,"duration":0.7,"text":"","points":[],"motion":"fade"},
 {"type":"rect","x":0.383,"y":0.572,"width":0.055,"height":0.356,"color":"#91aaa1","lineWidth":1,"start":1.75,"duration":0.7,"text":"","points":[],"motion":"fade"},
 {"type":"rect","x":0.484,"y":0.639,"width":0.055,"height":0.222,"color":"#91aaa1","lineWidth":1,"start":2.1,"duration":0.7,"text":"","points":[],"motion":"fade"},
 {"type":"rect","x":0.586,"y":0.55,"width":0.055,"height":0.4,"color":"#bc9165","lineWidth":1,"start":2.45,"duration":0.7,"text":"","points":[],"motion":"fade"},
 {"type":"rect","x":0.688,"y":0.594,"width":0.055,"height":0.311,"color":"#91aaa1","lineWidth":1,"start":2.8,"duration":0.7,"text":"","points":[],"motion":"fade"},
 {"type":"text","x":0.281,"y":0.45,"width":0.086,"height":0.033,"color":"#344b48","lineWidth":1,"start":2.2,"duration":0.6,"text":"6 bin","points":[],"motion":"fade"},
 {"type":"text","x":0.383,"y":0.361,"width":0.086,"height":0.033,"color":"#344b48","lineWidth":1,"start":2.55,"duration":0.6,"text":"8 bin","points":[],"motion":"fade"},
 {"type":"text","x":0.484,"y":0.494,"width":0.086,"height":0.033,"color":"#344b48","lineWidth":1,"start":2.9,"duration":0.6,"text":"5 bin","points":[],"motion":"fade"},
 {"type":"text","x":0.586,"y":0.317,"width":0.086,"height":0.033,"color":"#344b48","lineWidth":1,"start":3.25,"duration":0.6,"text":"9 bin","points":[],"motion":"fade"},
 {"type":"text","x":0.688,"y":0.406,"width":0.086,"height":0.033,"color":"#344b48","lineWidth":1,"start":3.6,"duration":0.6,"text":"7 bin","points":[],"motion":"fade"},
 {"type":"text","x":0.5,"y":0.153,"width":0.438,"height":0.056,"color":"#344b48","lineWidth":1,"start":4.6,"duration":1.0,"text":"Haftalık adım sayısı","points":[],"motion":"fade"},
 {"type":"text","x":0.852,"y":0.417,"width":0.141,"height":0.031,"color":"#344b48","lineWidth":1,"start":5.2,"duration":0.8,"text":"örnek veri","points":[],"motion":"fade"}
]}
```

## Örnek 2 — zengin: çizgi grafik ve vurgu

```json
{"category":"data-viz","title":"Bir yılın sıcaklığı","duration":15,"seed":12,"speed":1,"detail":1,"background":"#eee9dd","palette":["#344b48","#91aaa1","#bc9165","#ba7464","#d6d0c2"],"objects":[
 {"type":"path","x":0.516,"y":0.597,"width":0.719,"height":0.003,"color":"#d6d0c2","lineWidth":1.5,"start":0.2,"duration":0.6,"text":"","points":[[0.156,0.597],[0.875,0.597]],"motion":"draw"},
 {"type":"path","x":0.516,"y":0.444,"width":0.719,"height":0.003,"color":"#d6d0c2","lineWidth":1.5,"start":0.35,"duration":0.6,"text":"","points":[[0.156,0.444],[0.875,0.444]],"motion":"draw"},
 {"type":"path","x":0.516,"y":0.292,"width":0.719,"height":0.003,"color":"#d6d0c2","lineWidth":1.5,"start":0.5,"duration":0.6,"text":"","points":[[0.156,0.292],[0.875,0.292]],"motion":"draw"},
 {"type":"path","x":0.516,"y":0.75,"width":0.719,"height":0.003,"color":"#344b48","lineWidth":3,"start":0.0,"duration":0.8,"text":"","points":[[0.156,0.75],[0.875,0.75]],"motion":"draw"},
 {"type":"text","x":0.125,"y":0.75,"width":0.055,"height":0.031,"color":"#344b48","lineWidth":1,"start":0.6,"duration":0.5,"text":"0°","points":[],"motion":"fade"},
 {"type":"text","x":0.125,"y":0.597,"width":0.055,"height":0.031,"color":"#344b48","lineWidth":1,"start":0.75,"duration":0.5,"text":"10°","points":[],"motion":"fade"},
 {"type":"text","x":0.125,"y":0.444,"width":0.055,"height":0.031,"color":"#344b48","lineWidth":1,"start":0.9,"duration":0.5,"text":"20°","points":[],"motion":"fade"},
 {"type":"text","x":0.125,"y":0.292,"width":0.055,"height":0.031,"color":"#344b48","lineWidth":1,"start":1.05,"duration":0.5,"text":"30°","points":[],"motion":"fade"},
 {"type":"text","x":0.172,"y":0.792,"width":0.055,"height":0.031,"color":"#344b48","lineWidth":1,"start":1.0,"duration":0.5,"text":"Oca","points":[],"motion":"fade"},
 {"type":"text","x":0.297,"y":0.792,"width":0.055,"height":0.031,"color":"#344b48","lineWidth":1,"start":1.1,"duration":0.5,"text":"Mar","points":[],"motion":"fade"},
 {"type":"text","x":0.422,"y":0.792,"width":0.055,"height":0.031,"color":"#344b48","lineWidth":1,"start":1.2,"duration":0.5,"text":"May","points":[],"motion":"fade"},
 {"type":"text","x":0.547,"y":0.792,"width":0.055,"height":0.031,"color":"#344b48","lineWidth":1,"start":1.3,"duration":0.5,"text":"Tem","points":[],"motion":"fade"},
 {"type":"text","x":0.672,"y":0.792,"width":0.055,"height":0.031,"color":"#344b48","lineWidth":1,"start":1.4,"duration":0.5,"text":"Eyl","points":[],"motion":"fade"},
 {"type":"text","x":0.797,"y":0.792,"width":0.055,"height":0.031,"color":"#344b48","lineWidth":1,"start":1.5,"duration":0.5,"text":"Kas","points":[],"motion":"fade"},
 {"type":"path","x":0.516,"y":0.475,"width":0.688,"height":0.397,"color":"#bc9165","lineWidth":4,"start":2.4,"duration":4.0,"text":"","points":[[0.172,0.674],[0.234,0.643],[0.297,0.582],[0.359,0.506],[0.422,0.429],[0.484,0.353],[0.547,0.276],[0.609,0.292],[0.672,0.368],[0.734,0.475],[0.797,0.582],[0.859,0.643]],"motion":"draw"},
 {"type":"circle","x":0.172,"y":0.674,"width":0.011,"height":0.019,"color":"#344b48","lineWidth":1,"start":2.4,"duration":0.3,"text":"","points":[],"motion":"fade"},
 {"type":"circle","x":0.297,"y":0.582,"width":0.011,"height":0.019,"color":"#344b48","lineWidth":1,"start":3.13,"duration":0.3,"text":"","points":[],"motion":"fade"},
 {"type":"circle","x":0.422,"y":0.429,"width":0.011,"height":0.019,"color":"#344b48","lineWidth":1,"start":3.85,"duration":0.3,"text":"","points":[],"motion":"fade"},
 {"type":"circle","x":0.547,"y":0.276,"width":0.011,"height":0.019,"color":"#344b48","lineWidth":1,"start":4.58,"duration":0.3,"text":"","points":[],"motion":"fade"},
 {"type":"circle","x":0.672,"y":0.368,"width":0.011,"height":0.019,"color":"#344b48","lineWidth":1,"start":5.31,"duration":0.3,"text":"","points":[],"motion":"fade"},
 {"type":"circle","x":0.797,"y":0.582,"width":0.011,"height":0.019,"color":"#344b48","lineWidth":1,"start":6.04,"duration":0.3,"text":"","points":[],"motion":"fade"},
 {"type":"circle","x":0.547,"y":0.276,"width":0.025,"height":0.044,"color":"#ba7464","lineWidth":1,"start":7.0,"duration":0.6,"text":"","points":[],"motion":"fade"},
 {"type":"path","x":0.58,"y":0.246,"width":0.044,"height":0.022,"color":"#ba7464","lineWidth":2,"start":7.4,"duration":0.5,"text":"","points":[[0.558,0.257],[0.602,0.235]],"motion":"draw"},
 {"type":"text","x":0.703,"y":0.235,"width":0.219,"height":0.036,"color":"#344b48","lineWidth":1,"start":7.8,"duration":0.8,"text":"En sıcak: Temmuz 31°","points":[],"motion":"fade"},
 {"type":"text","x":0.438,"y":0.132,"width":0.438,"height":0.061,"color":"#344b48","lineWidth":1,"start":9.0,"duration":1.0,"text":"Bir yılın sıcaklığı","points":[],"motion":"fade"},
 {"type":"text","x":0.844,"y":0.153,"width":0.141,"height":0.031,"color":"#344b48","lineWidth":1,"start":9.6,"duration":0.8,"text":"örnek veri","points":[],"motion":"fade"}
]}
```

## Kabul ölçütleri

Final etiketleri veriyle aynı; taban ve ölçek tutarlı; tek vurgu; sahte kaynak yok.
Son kare tek başına bakıldığında bitmiş, dengeli bir resim olmalı; tüm metin okunur ve güvenli alanda.

---
name: canvas-comic
description: "Kare Canvas 2D sahnelerini çizgi roman stilinde üretir: kalın siyah konturlu paneller, patlama yıldızları, hız çizgileri, konuşma balonları, halftone noktaları. Çizgi roman, süper kahraman, onomatope (BAM, POW), hikâye paneli istekleri için kullan."
---

# canvas-comic · Çizgi roman

Bu beceri, Kare'nin Canvas 2D motorunda **Çizgi roman** stilinde, AI'ın JSON olarak döndürdüğü düzenlenebilir sahneler içindir (kod değil, yalnızca sahne verisi; `composed` sahnelerde hazır prosedürel çizim kapalıdır, her şeyi nesnelerle sen kurarsın).

## Amaç ve görünüm

Gazete çizgi romanı: 5–6 px koyu konturlu panel çerçeveleri, düz renk dolgular, patlama yıldızı (zikzak çokgen) üstünde büyük onomatope, odağa yönelen kısa hız çizgileri, köşelerde düzenli halftone nokta ızgarası. Hareketler kısa ve vurucu.

## Tuval ve güvenli alan

- Mantıksal tuval **1280×720**. Tüm `x`, `y`, `width`, `height` ve path noktaları **0–1 normalize** değerdir: piksel = x·1280, y·720.
- `x`,`y` nesnenin **merkezidir** (circle, ellipse, rect, text). Path için `x`,`y` noktaların sınır kutusunun merkezi, `width`/`height` kutunun boyu olsun (döndürme ve kalite denetimi bunu kullanır).
- **Güvenli alan:** x .04–.96, y .08–.82. Alt ~100 px (y > .86) altyazı bandıdır; metni ve odak nesnesini oraya koyma. Zemin/gökyüzü gibi arka plan bantları kenara kadar uzanabilir ama 0–1 dışına taşmasın.
- Circle'da `width` çaptır ve 1280 px'e göredir: dikey yarıçap = width·1280/720/2 (ör. width .1 → 128 px çap, y'de ±.089). `height` circle için kullanılmaz, width ile aynı oranı yaz.
- Nesneler dizideki **sırayla** çizilir: önce arka plan, sonra orta plan, en son ön plan ve metin.

## Kompozisyon

- Bir **odak nesnesi** seç ve üçte bir noktalarına (x≈.33/.67, y≈.33/.6) ya da bilinçli olarak merkeze yerleştir; 3–7 ana form + destekleyici ayrıntı.
- Derinlik katmanları: arka plan (büyük, düşük kontrast) → orta plan → ön plan (en koyu/en doygun) → metin. Boş alan bırak; ana formlar çerçeve genişliğinin en az %12'si olsun.
- 1 büyük panel ya da 2 yan yana panel (her biri ≈520×500 px, aralarında 40 px). Paneller güvenli alanın içinde.
- Odak (karakter/patlama) panel ortasında; hız çizgileri odaktan dışa ya da harekete ters yönde.
- Konuşma balonu ellipse + kontur + kuyruk; metin balonun içinde ve balondan dar.

## Palet

Arka plan **#f2e8cb**. Tema paleti (sırayla): `#243a3d`, `#b7745b`, `#e1ba70`.
- `#243a3d` — kontur, karakter, tüm metin (arka planla kontrast 9.8:1)
- `#b7745b` — patlama içi, hız çizgileri, halftone (arka planla kontrast 3.0:1)
- `#e1ba70` — patlama dışı, anlatıcı kutusu, halftone (arka planla kontrast 1.5:1)
Balon içi için kâğıt beyazı `#fffaf0`. Metin daima koyu `#243a3d`; turuncu/sarı üstüne yazılsa bile kontrast denetimi arka plana göre yapılır.

## Zamanlama ve koreografi

Süre D için ritim: **%0–15** sahneyi kur (arka plan, zemin, büyük renk alanları) · **%15–60** odak nesnesini inşa et (ana çizgiler `draw`, ana formlar `fade`/`slide`) · **%55–85** ayrıntı, vurgu ve etiketler · **%85–100** bekleme: yeni nesne yok, yalnızca 1–4 `float`/`rotate` ortam hareketi.
- Girişleri **kademelendir**: kardeş öğeler arasında .15–.6 sn aralık; aynı anda en fazla 2–3 nesne başlasın. `start` değerlerinin hepsi 0 olmasın.
- Tipik giriş süresi: fade .6–1.5 sn, slide .8–1.2 sn, draw 1.5–4 sn (uzun yol = daha uzun süre). Çok kısa (<.3 sn) girişler sıçrama gibi görünür.
- Son nesne en geç D·0.8'de başlasın; izleyici bitmiş resmi en az 2 sn görsün.
- Hızlı ritim: girişler .3–.5 sn, aralar .1–.3 sn. Panel çerçevesi `draw` .8 sn → karakter parçaları → hız çizgileri → balon → onomatope en son "patlar".
- Toplam 6–10 sn yeterli.

## Metin

- Türkçe karakterleri doğru yaz (ç ğ ı İ ö ş ü). Başlık en fazla ~5 kelime, etiket 1–3 kelime; bir text nesnesinde en fazla 8 kelime.
- Boyut (`height`): başlık .06–.09 (43–65 px), alt başlık .04–.05, etiket .033–.04 (24–29 px). 20 px altı okunmaz.
- `width` metni sığdıracak kadar geniş olsun (yaklaşık karakter sayısı × yazı boyu × .56 / 1280). Metinler birbiriyle ve yoğun şekillerle çakışmasın.
- Metin rengi arka planla en az 4.5:1 kontrast vermeli: bu stilde metin için **#243a3d** kullan.

## Nesne sözleşmesi (AI çıktısı — alanlar birebir)

Sahne: `category` (bu beceri: **comic**), `title` (1–160), `duration` (2–60 sn), `seed` (tamsayı), `speed` (.2–3, float/rotate hızını çarpar), `detail` (.25–2), `background` (#RRGGBB), `palette` (2–8 × #RRGGBB), `objects` (en fazla 80; iyi sahne 8–30).
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

- Patlama: 12–16 köşeli yıldız çokgeni path (dış/iç yarıçap oranı ≈1.6, dikey ölçek .75) + içinde dolu circle'lar.
- Halftone: 3×4 ya da 3×6 düzenli circle ızgarası (çap 12–14 px, aralık 32–34 px), köşede.
- Çöp adam: circle kafa + kalın (10–14) path gövde/kol/bacak — koşu pozu için dirsekli 3 noktalı kollar.
- Hız çizgileri: kısa kalın kapsüller ya da yatay 2 noktalı path'ler.

## Sık hatalar (kaçın)

- Nesneyi çerçeve dışına taşırmak (x±width/2, circle'da dikey yarıçap, float için +14 px pay) ya da metni altyazı bandına koymak.
- Bütün nesneleri `start: 0` ile başlatmak; ya da son saniyede yeni nesne getirmek.
- Minik şekiller (width < .015) ve 20 px altı yazılar; ana form çerçevenin %12'sinden küçük.
- 40'tan fazla benzer küçük nesne (parçacık/nokta yığını) — ritim kaybolur, sahne kirlenir. 10–25 yeterli.
- Yanlış alan adları (`radius`, `fill`, `size`, `fontSize`, `delay`, `animation`, `keyframes`) ya da eksik alan; renkleri `rgb()`/isimle yazmak.
- Path'i dolgu sanmak; path `x`,`y` değerini sınır kutusu merkezine koymamak; 2'den az nokta.
- Her şeyi aynı boyutta, ortada üst üste yığmak; odak nesnesi olmayan "dağınık" kompozisyon.
- Onomatopeyi panelden taşırmak ya da hız çizgilerini metnin üstünden geçirmek.
- İnce (1–2 px) konturlar; yumuşak gradyan ve suluboya lekeleri (stil karışır).

## Örnek 1 — kısa: BAM! patlaması

```json
{"category":"comic","title":"BAM!","duration":6,"seed":99,"speed":1,"detail":1,"background":"#f2e8cb","palette":["#243a3d","#b7745b","#e1ba70","#fffaf0"],"objects":[
 {"type":"circle","x":0.094,"y":0.167,"width":0.011,"height":0.019,"color":"#b7745b","lineWidth":1,"start":0.2,"duration":0.3,"text":"","points":[],"motion":"fade"},
 {"type":"circle","x":0.12,"y":0.167,"width":0.011,"height":0.019,"color":"#b7745b","lineWidth":1,"start":0.25,"duration":0.3,"text":"","points":[],"motion":"fade"},
 {"type":"circle","x":0.147,"y":0.167,"width":0.011,"height":0.019,"color":"#b7745b","lineWidth":1,"start":0.3,"duration":0.3,"text":"","points":[],"motion":"fade"},
 {"type":"circle","x":0.173,"y":0.167,"width":0.011,"height":0.019,"color":"#b7745b","lineWidth":1,"start":0.35,"duration":0.3,"text":"","points":[],"motion":"fade"},
 {"type":"circle","x":0.094,"y":0.214,"width":0.011,"height":0.019,"color":"#b7745b","lineWidth":1,"start":0.4,"duration":0.3,"text":"","points":[],"motion":"fade"},
 {"type":"circle","x":0.12,"y":0.214,"width":0.011,"height":0.019,"color":"#b7745b","lineWidth":1,"start":0.45,"duration":0.3,"text":"","points":[],"motion":"fade"},
 {"type":"circle","x":0.147,"y":0.214,"width":0.011,"height":0.019,"color":"#b7745b","lineWidth":1,"start":0.5,"duration":0.3,"text":"","points":[],"motion":"fade"},
 {"type":"circle","x":0.173,"y":0.214,"width":0.011,"height":0.019,"color":"#b7745b","lineWidth":1,"start":0.55,"duration":0.3,"text":"","points":[],"motion":"fade"},
 {"type":"circle","x":0.094,"y":0.261,"width":0.011,"height":0.019,"color":"#b7745b","lineWidth":1,"start":0.6,"duration":0.3,"text":"","points":[],"motion":"fade"},
 {"type":"circle","x":0.12,"y":0.261,"width":0.011,"height":0.019,"color":"#b7745b","lineWidth":1,"start":0.65,"duration":0.3,"text":"","points":[],"motion":"fade"},
 {"type":"circle","x":0.147,"y":0.261,"width":0.011,"height":0.019,"color":"#b7745b","lineWidth":1,"start":0.7,"duration":0.3,"text":"","points":[],"motion":"fade"},
 {"type":"circle","x":0.173,"y":0.261,"width":0.011,"height":0.019,"color":"#b7745b","lineWidth":1,"start":0.75,"duration":0.3,"text":"","points":[],"motion":"fade"},
 {"type":"circle","x":0.5,"y":0.472,"width":0.312,"height":0.556,"color":"#e1ba70","lineWidth":1,"start":0.6,"duration":0.3,"text":"","points":[],"motion":"fade"},
 {"type":"path","x":0.5,"y":0.472,"width":0.457,"height":0.625,"color":"#243a3d","lineWidth":6,"start":0.8,"duration":1.0,"text":"","points":[[0.5,0.16],[0.533,0.279],[0.602,0.191],[0.593,0.317],[0.683,0.277],[0.634,0.386],[0.728,0.403],[0.648,0.472],[0.728,0.542],[0.634,0.558],[0.683,0.667],[0.593,0.627],[0.602,0.754],[0.533,0.665],[0.5,0.785],[0.467,0.665],[0.398,0.754],[0.407,0.627],[0.317,0.667],[0.366,0.558],[0.272,0.542],[0.352,0.472],[0.272,0.403],[0.366,0.386],[0.317,0.277],[0.407,0.317],[0.398,0.191],[0.467,0.279],[0.5,0.16]],"motion":"draw"},
 {"type":"circle","x":0.5,"y":0.472,"width":0.188,"height":0.333,"color":"#b7745b","lineWidth":1,"start":1.6,"duration":0.3,"text":"","points":[],"motion":"fade"},
 {"type":"text","x":0.5,"y":0.472,"width":0.328,"height":0.139,"color":"#243a3d","lineWidth":1,"start":2.0,"duration":0.3,"text":"BAM!","points":[],"motion":"fade"},
 {"type":"path","x":0.221,"y":0.353,"width":0.051,"height":0.033,"color":"#243a3d","lineWidth":4,"start":3.0,"duration":0.3,"text":"","points":[[0.247,0.37],[0.221,0.353],[0.195,0.337]],"motion":"fade"},
 {"type":"path","x":0.29,"y":0.227,"width":0.039,"height":0.069,"color":"#243a3d","lineWidth":4,"start":3.12,"duration":0.3,"text":"","points":[[0.309,0.261],[0.29,0.227],[0.271,0.192]],"motion":"fade"},
 {"type":"path","x":0.71,"y":0.227,"width":0.039,"height":0.069,"color":"#243a3d","lineWidth":4,"start":3.24,"duration":0.3,"text":"","points":[[0.691,0.261],[0.71,0.227],[0.729,0.192]],"motion":"fade"},
 {"type":"path","x":0.779,"y":0.353,"width":0.051,"height":0.033,"color":"#243a3d","lineWidth":4,"start":3.36,"duration":0.3,"text":"","points":[[0.753,0.37],[0.779,0.353],[0.805,0.337]],"motion":"fade"},
 {"type":"path","x":0.779,"y":0.591,"width":0.051,"height":0.033,"color":"#243a3d","lineWidth":4,"start":3.48,"duration":0.3,"text":"","points":[[0.753,0.574],[0.779,0.591],[0.805,0.608]],"motion":"fade"},
 {"type":"path","x":0.221,"y":0.591,"width":0.051,"height":0.033,"color":"#243a3d","lineWidth":4,"start":3.6,"duration":0.3,"text":"","points":[[0.247,0.574],[0.221,0.591],[0.195,0.608]],"motion":"fade"}
]}
```

## Örnek 2 — zengin: iki panel

```json
{"category":"comic","title":"Yetişeceğim!","duration":10,"seed":7,"speed":1,"detail":1,"background":"#f2e8cb","palette":["#243a3d","#b7745b","#e1ba70","#fffaf0"],"objects":[
 {"type":"path","x":0.266,"y":0.472,"width":0.406,"height":0.694,"color":"#243a3d","lineWidth":6,"start":0.0,"duration":0.8,"text":"","points":[[0.062,0.125],[0.469,0.125],[0.469,0.819],[0.062,0.819],[0.062,0.125]],"motion":"draw"},
 {"type":"path","x":0.719,"y":0.472,"width":0.438,"height":0.694,"color":"#243a3d","lineWidth":6,"start":0.4,"duration":0.8,"text":"","points":[[0.5,0.125],[0.938,0.125],[0.938,0.819],[0.5,0.819],[0.5,0.125]],"motion":"draw"},
 {"type":"rect","x":0.199,"y":0.181,"width":0.258,"height":0.078,"color":"#e1ba70","lineWidth":1,"start":0.9,"duration":0.4,"text":"","points":[],"motion":"fade"},
 {"type":"text","x":0.199,"y":0.181,"width":0.234,"height":0.036,"color":"#243a3d","lineWidth":1,"start":1.1,"duration":0.5,"text":"O sabah otobüs...","points":[],"motion":"fade"},
 {"type":"circle","x":0.258,"y":0.417,"width":0.053,"height":0.094,"color":"#243a3d","lineWidth":1,"start":1.6,"duration":0.4,"text":"","points":[],"motion":"fade"},
 {"type":"path","x":0.246,"y":0.539,"width":0.023,"height":0.144,"color":"#243a3d","lineWidth":14,"start":1.9,"duration":0.4,"text":"","points":[[0.258,0.467],[0.234,0.611]],"motion":"draw"},
 {"type":"path","x":0.254,"y":0.694,"width":0.039,"height":0.167,"color":"#243a3d","lineWidth":12,"start":2.2,"duration":0.4,"text":"","points":[[0.234,0.611],[0.273,0.694],[0.258,0.778]],"motion":"draw"},
 {"type":"path","x":0.195,"y":0.667,"width":0.078,"height":0.111,"color":"#243a3d","lineWidth":12,"start":2.3,"duration":0.4,"text":"","points":[[0.234,0.611],[0.195,0.694],[0.156,0.722]],"motion":"draw"},
 {"type":"path","x":0.288,"y":0.528,"width":0.08,"height":0.056,"color":"#243a3d","lineWidth":10,"start":2.5,"duration":0.4,"text":"","points":[[0.248,0.514],[0.297,0.556],[0.328,0.5]],"motion":"draw"},
 {"type":"path","x":0.214,"y":0.528,"width":0.069,"height":0.056,"color":"#243a3d","lineWidth":10,"start":2.6,"duration":0.4,"text":"","points":[[0.248,0.514],[0.203,0.5],[0.18,0.556]],"motion":"draw"},
 {"type":"path","x":0.117,"y":0.444,"width":0.062,"height":0.003,"color":"#b7745b","lineWidth":4,"start":2.8,"duration":0.3,"text":"","points":[[0.086,0.444],[0.148,0.444]],"motion":"draw"},
 {"type":"path","x":0.129,"y":0.528,"width":0.086,"height":0.003,"color":"#b7745b","lineWidth":4,"start":2.9,"duration":0.3,"text":"","points":[[0.086,0.528],[0.172,0.528]],"motion":"draw"},
 {"type":"path","x":0.113,"y":0.611,"width":0.055,"height":0.003,"color":"#b7745b","lineWidth":4,"start":3.0,"duration":0.3,"text":"","points":[[0.086,0.611],[0.141,0.611]],"motion":"draw"},
 {"type":"path","x":0.125,"y":0.694,"width":0.078,"height":0.003,"color":"#b7745b","lineWidth":4,"start":3.1,"duration":0.3,"text":"","points":[[0.086,0.694],[0.164,0.694]],"motion":"draw"},
 {"type":"circle","x":0.547,"y":0.181,"width":0.009,"height":0.017,"color":"#e1ba70","lineWidth":1,"start":4.0,"duration":0.3,"text":"","points":[],"motion":"fade"},
 {"type":"circle","x":0.572,"y":0.181,"width":0.009,"height":0.017,"color":"#e1ba70","lineWidth":1,"start":4.03,"duration":0.3,"text":"","points":[],"motion":"fade"},
 {"type":"circle","x":0.597,"y":0.181,"width":0.009,"height":0.017,"color":"#e1ba70","lineWidth":1,"start":4.06,"duration":0.3,"text":"","points":[],"motion":"fade"},
 {"type":"circle","x":0.622,"y":0.181,"width":0.009,"height":0.017,"color":"#e1ba70","lineWidth":1,"start":4.09,"duration":0.3,"text":"","points":[],"motion":"fade"},
 {"type":"circle","x":0.647,"y":0.181,"width":0.009,"height":0.017,"color":"#e1ba70","lineWidth":1,"start":4.12,"duration":0.3,"text":"","points":[],"motion":"fade"},
 {"type":"circle","x":0.672,"y":0.181,"width":0.009,"height":0.017,"color":"#e1ba70","lineWidth":1,"start":4.15,"duration":0.3,"text":"","points":[],"motion":"fade"},
 {"type":"circle","x":0.547,"y":0.225,"width":0.009,"height":0.017,"color":"#e1ba70","lineWidth":1,"start":4.18,"duration":0.3,"text":"","points":[],"motion":"fade"},
 {"type":"circle","x":0.572,"y":0.225,"width":0.009,"height":0.017,"color":"#e1ba70","lineWidth":1,"start":4.21,"duration":0.3,"text":"","points":[],"motion":"fade"},
 {"type":"circle","x":0.597,"y":0.225,"width":0.009,"height":0.017,"color":"#e1ba70","lineWidth":1,"start":4.24,"duration":0.3,"text":"","points":[],"motion":"fade"},
 {"type":"circle","x":0.622,"y":0.225,"width":0.009,"height":0.017,"color":"#e1ba70","lineWidth":1,"start":4.27,"duration":0.3,"text":"","points":[],"motion":"fade"},
 {"type":"circle","x":0.647,"y":0.225,"width":0.009,"height":0.017,"color":"#e1ba70","lineWidth":1,"start":4.3,"duration":0.3,"text":"","points":[],"motion":"fade"},
 {"type":"circle","x":0.672,"y":0.225,"width":0.009,"height":0.017,"color":"#e1ba70","lineWidth":1,"start":4.33,"duration":0.3,"text":"","points":[],"motion":"fade"},
 {"type":"circle","x":0.547,"y":0.269,"width":0.009,"height":0.017,"color":"#e1ba70","lineWidth":1,"start":4.36,"duration":0.3,"text":"","points":[],"motion":"fade"},
 {"type":"circle","x":0.572,"y":0.269,"width":0.009,"height":0.017,"color":"#e1ba70","lineWidth":1,"start":4.39,"duration":0.3,"text":"","points":[],"motion":"fade"},
 {"type":"circle","x":0.597,"y":0.269,"width":0.009,"height":0.017,"color":"#e1ba70","lineWidth":1,"start":4.42,"duration":0.3,"text":"","points":[],"motion":"fade"},
 {"type":"circle","x":0.622,"y":0.269,"width":0.009,"height":0.017,"color":"#e1ba70","lineWidth":1,"start":4.45,"duration":0.3,"text":"","points":[],"motion":"fade"},
 {"type":"circle","x":0.647,"y":0.269,"width":0.009,"height":0.017,"color":"#e1ba70","lineWidth":1,"start":4.48,"duration":0.3,"text":"","points":[],"motion":"fade"},
 {"type":"circle","x":0.672,"y":0.269,"width":0.009,"height":0.017,"color":"#e1ba70","lineWidth":1,"start":4.51,"duration":0.3,"text":"","points":[],"motion":"fade"},
 {"type":"ellipse","x":0.727,"y":0.458,"width":0.344,"height":0.333,"color":"#fffaf0","lineWidth":1,"start":5.0,"duration":0.4,"text":"","points":[],"motion":"fade"},
 {"type":"path","x":0.727,"y":0.458,"width":0.344,"height":0.333,"color":"#243a3d","lineWidth":4,"start":5.1,"duration":0.6,"text":"","points":[[0.727,0.292],[0.753,0.294],[0.78,0.3],[0.805,0.31],[0.828,0.323],[0.848,0.34],[0.866,0.36],[0.88,0.383],[0.89,0.407],[0.896,0.432],[0.898,0.458],[0.896,0.484],[0.89,0.51],[0.88,0.534],[0.866,0.556],[0.848,0.576],[0.828,0.593],[0.805,0.607],[0.78,0.617],[0.753,0.623],[0.727,0.625],[0.7,0.623],[0.673,0.617],[0.649,0.607],[0.626,0.593],[0.605,0.576],[0.588,0.556],[0.573,0.534],[0.563,0.51],[0.557,0.484],[0.555,0.458],[0.557,0.432],[0.563,0.407],[0.573,0.383],[0.588,0.36],[0.605,0.34],[0.626,0.323],[0.649,0.31],[0.673,0.3],[0.7,0.294],[0.727,0.292]],"motion":"draw"},
 {"type":"path","x":0.656,"y":0.667,"width":0.062,"height":0.111,"color":"#243a3d","lineWidth":4,"start":5.6,"duration":0.3,"text":"","points":[[0.656,0.611],[0.625,0.722],[0.688,0.618]],"motion":"draw"},
 {"type":"text","x":0.727,"y":0.458,"width":0.297,"height":0.061,"color":"#243a3d","lineWidth":1,"start":6.0,"duration":0.5,"text":"Yetişeceğim!","points":[],"motion":"fade"},
 {"type":"path","x":0.859,"y":0.722,"width":0.094,"height":0.167,"color":"#b7745b","lineWidth":5,"start":6.8,"duration":0.5,"text":"","points":[[0.859,0.639],[0.87,0.679],[0.893,0.663],[0.884,0.704],[0.906,0.722],[0.884,0.74],[0.893,0.781],[0.87,0.766],[0.859,0.806],[0.849,0.766],[0.826,0.781],[0.835,0.74],[0.812,0.722],[0.835,0.704],[0.826,0.663],[0.849,0.679],[0.859,0.639]],"motion":"draw"},
 {"type":"text","x":0.859,"y":0.722,"width":0.125,"height":0.042,"color":"#243a3d","lineWidth":1,"start":7.2,"duration":0.3,"text":"HIZ!","points":[],"motion":"fade"}
]}
```

## Kabul ölçütleri

Panel taşmıyor; kelime okunuyor; odağa yönelen çizgiler var; kontur kalınlığı tutarlı.
Son kare tek başına bakıldığında bitmiş, dengeli bir resim olmalı; tüm metin okunur ve güvenli alanda.

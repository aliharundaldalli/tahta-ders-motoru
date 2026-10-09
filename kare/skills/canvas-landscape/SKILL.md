---
name: canvas-landscape
description: "Kare Canvas 2D sahnelerini katmanlı manzara stilinde üretir: uzaktan yakına koyulaşan tepe silüetleri, güneş, nehir, ağaçlar; atmosferik derinlik. Manzara, doğa, dağ, vadi, gün batımı istekleri için kullan."
---

# canvas-landscape · Katmanlı manzara

Bu beceri, Kare'nin Canvas 2D motorunda **Katmanlı manzara** stilinde, AI'ın JSON olarak döndürdüğü düzenlenebilir sahneler içindir (kod değil, yalnızca sahne verisi; `composed` sahnelerde hazır prosedürel çizim kapalıdır, her şeyi nesnelerle sen kurarsın).

## Amaç ve görünüm

Kartpostal sadeliğinde katmanlı manzara: gökyüzü (arka plan rengi) önünde güneş, sonra 3–4 dalgalı tepe silüeti, her biri bir öncekinden koyu ve alçak. Tepeler kenardan kenara uzanır; ön planda birkaç ağaç, nehir ya da kuş.

## Tuval ve güvenli alan

- Mantıksal tuval **1280×720**. Tüm `x`, `y`, `width`, `height` ve path noktaları **0–1 normalize** değerdir: piksel = x·1280, y·720.
- `x`,`y` nesnenin **merkezidir** (circle, ellipse, rect, text). Path için `x`,`y` noktaların sınır kutusunun merkezi, `width`/`height` kutunun boyu olsun (döndürme ve kalite denetimi bunu kullanır).
- **Güvenli alan:** x .04–.96, y .08–.82. Alt ~100 px (y > .86) altyazı bandıdır; metni ve odak nesnesini oraya koyma. Zemin/gökyüzü gibi arka plan bantları kenara kadar uzanabilir ama 0–1 dışına taşmasın.
- Circle'da `width` çaptır ve 1280 px'e göredir: dikey yarıçap = width·1280/720/2 (ör. width .1 → 128 px çap, y'de ±.089). `height` circle için kullanılmaz, width ile aynı oranı yaz.
- Nesneler dizideki **sırayla** çizilir: önce arka plan, sonra orta plan, en son ön plan ve metin.

## Kompozisyon

- Bir **odak nesnesi** seç ve üçte bir noktalarına (x≈.33/.67, y≈.33/.6) ya da bilinçli olarak merkeze yerleştir; 3–7 ana form + destekleyici ayrıntı.
- Derinlik katmanları: arka plan (büyük, düşük kontrast) → orta plan → ön plan (en koyu/en doygun) → metin. Boş alan bırak; ana formlar çerçeve genişliğinin en az %12'si olsun.
- Ufuk/ilk tepe y≈.5; her yakın katman 60–80 px daha aşağıda. Katmanlar sahnenin tüm genişliğini kaplar (x .03–.97).
- Güneş ya ortada tepelerin arkasında (simetrik, sakin) ya da üçte bir noktasında.
- Metin gökyüzünde, tepelerden uzak.

## Palet

Arka plan **#b4c9bf**. Tema paleti (sırayla): `#e3ba8a`, `#8fada2`, `#638d85`, `#446f72`, `#31555e`.
- `#e3ba8a` — güneş, ışık (arka planla kontrast 1.0:1)
- `#8fada2` — en uzak tepe (arka planla kontrast 1.4:1)
- `#638d85` — orta tepe (arka planla kontrast 2.1:1)
- `#446f72` — yakın tepe (arka planla kontrast 3.2:1)
- `#31555e` — en yakın: ağaç, silüet (arka planla kontrast 4.6:1)
Metin için `#1f3c44` (6.7:1); `#31555e` sınırda (4.6:1). Uzak = açık ve düşük kontrast, yakın = koyu: hava perspektifi.

## Zamanlama ve koreografi

Süre D için ritim: **%0–15** sahneyi kur (arka plan, zemin, büyük renk alanları) · **%15–60** odak nesnesini inşa et (ana çizgiler `draw`, ana formlar `fade`/`slide`) · **%55–85** ayrıntı, vurgu ve etiketler · **%85–100** bekleme: yeni nesne yok, yalnızca 1–4 `float`/`rotate` ortam hareketi.
- Girişleri **kademelendir**: kardeş öğeler arasında .15–.6 sn aralık; aynı anda en fazla 2–3 nesne başlasın. `start` değerlerinin hepsi 0 olmasın.
- Tipik giriş süresi: fade .6–1.5 sn, slide .8–1.2 sn, draw 1.5–4 sn (uzun yol = daha uzun süre). Çok kısa (<.3 sn) girişler sıçrama gibi görünür.
- Son nesne en geç D·0.8'de başlasın; izleyici bitmiş resmi en az 2 sn görsün.
- Güneş → en uzak tepe → orta → yakın (her biri 2–2.2 sn `draw`, 1.2 sn arayla): manzara derinlikten öne doğru kurulur.
- Nehir, ağaçlar, kuşlar son bölümde; bir kuş `float`.

## Metin

- Türkçe karakterleri doğru yaz (ç ğ ı İ ö ş ü). Başlık en fazla ~5 kelime, etiket 1–3 kelime; bir text nesnesinde en fazla 8 kelime.
- Boyut (`height`): başlık .06–.09 (43–65 px), alt başlık .04–.05, etiket .033–.04 (24–29 px). 20 px altı okunmaz.
- `width` metni sığdıracak kadar geniş olsun (yaklaşık karakter sayısı × yazı boyu × .56 / 1280). Metinler birbiriyle ve yoğun şekillerle çakışmasın.
- Metin rengi arka planla en az 4.5:1 kontrast vermeli: bu stilde metin için **#1f3c44** kullan.

## Nesne sözleşmesi (AI çıktısı — alanlar birebir)

Sahne: `category` (bu beceri: **landscape**), `title` (1–160), `duration` (2–60 sn), `seed` (tamsayı), `speed` (.2–3, float/rotate hızını çarpar), `detail` (.25–2), `background` (#RRGGBB), `palette` (2–8 × #RRGGBB), `objects` (en fazla 80; iyi sahne 8–30).
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

- Dolu tepe: üst kenarı sinüs eğrisi, alt kenarı zemin olan çokgeni dikey zikzak path ile tara (lineWidth 30, aralık .8×lineWidth) — `draw` ile soldan sağa boyanır.
- Ağaç: gövde rect + gövdenin üstünde ellipse taç, en koyu renkte.
- Nehir: yukarıda dar, aşağıda geniş kıvrımlı path (lineWidth 10–16), açık renk.
- Atmosfer: ufkun hemen altına açık bir tam genişlik rect bandı.

## Sık hatalar (kaçın)

- Nesneyi çerçeve dışına taşırmak (x±width/2, circle'da dikey yarıçap, float için +14 px pay) ya da metni altyazı bandına koymak.
- Bütün nesneleri `start: 0` ile başlatmak; ya da son saniyede yeni nesne getirmek.
- Minik şekiller (width < .015) ve 20 px altı yazılar; ana form çerçevenin %12'sinden küçük.
- 40'tan fazla benzer küçük nesne (parçacık/nokta yığını) — ritim kaybolur, sahne kirlenir. 10–25 yeterli.
- Yanlış alan adları (`radius`, `fill`, `size`, `fontSize`, `delay`, `animation`, `keyframes`) ya da eksik alan; renkleri `rgb()`/isimle yazmak.
- Path'i dolgu sanmak; path `x`,`y` değerini sınır kutusu merkezine koymamak; 2'den az nokta.
- Her şeyi aynı boyutta, ortada üst üste yığmak; odak nesnesi olmayan "dağınık" kompozisyon.
- Yakın tepeleri uzaklardan açık renkte çizmek (derinlik ters döner).
- Tepeyi çerçevenin ortasında bitirmek (boş kenar); güneşi yakın tepenin önüne koymak.

## Örnek 1 — kısa: üç katman tepe

```json
{"category":"landscape","title":"Uzak tepeler","duration":8,"seed":40,"speed":1,"detail":1,"background":"#b4c9bf","palette":["#e3ba8a","#8fada2","#638d85","#446f72","#31555e","#1f3c44"],"objects":[
 {"type":"circle","x":0.703,"y":0.333,"width":0.109,"height":0.194,"color":"#e3ba8a","lineWidth":1,"start":0.0,"duration":1.2,"text":"","points":[],"motion":"fade"},
 {"type":"path","x":0.5,"y":0.702,"width":0.977,"height":0.555,"color":"#8fada2","lineWidth":30,"start":0.6,"duration":2.0,"text":"","points":[[0.012,0.467],[0.012,0.979],[0.03,0.979],[0.03,0.456],[0.049,0.447],[0.049,0.979],[0.067,0.979],[0.067,0.439],[0.085,0.431],[0.085,0.979],[0.104,0.979],[0.104,0.428],[0.122,0.424],[0.122,0.979],[0.141,0.979],[0.141,0.425],[0.159,0.427],[0.159,0.979],[0.178,0.979],[0.178,0.432],[0.196,0.439],[0.196,0.979],[0.214,0.979],[0.214,0.447],[0.233,0.457],[0.233,0.979],[0.251,0.979],[0.251,0.467],[0.27,0.478],[0.27,0.979],[0.288,0.979],[0.288,0.489],[0.307,0.498],[0.307,0.979],[0.325,0.979],[0.325,0.507],[0.343,0.514],[0.343,0.979],[0.362,0.979],[0.362,0.519],[0.38,0.522],[0.38,0.979],[0.399,0.979],[0.399,0.522],[0.417,0.521],[0.417,0.979],[0.436,0.979],[0.436,0.516],[0.454,0.51],[0.454,0.979],[0.472,0.979],[0.472,0.502],[0.491,0.492],[0.491,0.979],[0.509,0.979],[0.509,0.482],[0.528,0.471],[0.528,0.979],[0.546,0.979],[0.546,0.461],[0.564,0.451],[0.564,0.979],[0.583,0.979],[0.583,0.441],[0.601,0.435],[0.601,0.979],[0.62,0.979],[0.62,0.428],[0.638,0.426],[0.638,0.979],[0.657,0.979],[0.657,0.425],[0.675,0.426],[0.675,0.979],[0.693,0.979],[0.693,0.43],[0.712,0.435],[0.712,0.979],[0.73,0.979],[0.73,0.444],[0.749,0.452],[0.749,0.979],[0.767,0.979],[0.767,0.463],[0.786,0.474],[0.786,0.979],[0.804,0.979],[0.804,0.484],[0.822,0.495],[0.822,0.979],[0.841,0.979],[0.841,0.504],[0.859,0.511],[0.859,0.979],[0.878,0.979],[0.878,0.518],[0.896,0.521],[0.896,0.979],[0.915,0.979],[0.915,0.523],[0.933,0.521],[0.933,0.979],[0.951,0.979],[0.951,0.518],[0.97,0.513],[0.97,0.979],[0.988,0.979],[0.988,0.505]],"motion":"draw"},
 {"type":"path","x":0.5,"y":0.765,"width":0.977,"height":0.429,"color":"#638d85","lineWidth":30,"start":1.8,"duration":2.0,"text":"","points":[[0.012,0.557],[0.012,0.979],[0.03,0.979],[0.03,0.566],[0.049,0.575],[0.049,0.979],[0.067,0.979],[0.067,0.587],[0.085,0.599],[0.085,0.979],[0.104,0.979],[0.104,0.608],[0.122,0.618],[0.122,0.979],[0.141,0.979],[0.141,0.622],[0.159,0.625],[0.159,0.979],[0.178,0.979],[0.178,0.623],[0.196,0.618],[0.196,0.979],[0.214,0.979],[0.214,0.611],[0.233,0.601],[0.233,0.979],[0.251,0.979],[0.251,0.59],[0.27,0.579],[0.27,0.979],[0.288,0.979],[0.288,0.567],[0.307,0.56],[0.307,0.979],[0.325,0.979],[0.325,0.553],[0.343,0.55],[0.343,0.979],[0.362,0.979],[0.362,0.552],[0.38,0.555],[0.38,0.979],[0.399,0.979],[0.399,0.563],[0.417,0.572],[0.417,0.979],[0.436,0.979],[0.436,0.584],[0.454,0.595],[0.454,0.979],[0.472,0.979],[0.472,0.605],[0.491,0.615],[0.491,0.979],[0.509,0.979],[0.509,0.621],[0.528,0.624],[0.528,0.979],[0.546,0.979],[0.546,0.625],[0.564,0.62],[0.564,0.979],[0.583,0.979],[0.583,0.615],[0.601,0.604],[0.601,0.979],[0.62,0.979],[0.62,0.593],[0.638,0.582],[0.638,0.979],[0.657,0.979],[0.657,0.571],[0.675,0.562],[0.675,0.979],[0.693,0.979],[0.693,0.555],[0.712,0.55],[0.712,0.979],[0.73,0.979],[0.73,0.551],[0.749,0.553],[0.749,0.979],[0.767,0.979],[0.767,0.561],[0.786,0.569],[0.786,0.979],[0.804,0.979],[0.804,0.58],[0.822,0.592],[0.822,0.979],[0.841,0.979],[0.841,0.603],[0.859,0.612],[0.859,0.979],[0.878,0.979],[0.878,0.62],[0.896,0.623],[0.896,0.979],[0.915,0.979],[0.915,0.626],[0.933,0.621],[0.933,0.979],[0.951,0.979],[0.951,0.616],[0.97,0.607],[0.97,0.979],[0.988,0.979],[0.988,0.596]],"motion":"draw"},
 {"type":"path","x":0.5,"y":0.827,"width":0.977,"height":0.304,"color":"#446f72","lineWidth":30,"start":3.0,"duration":2.0,"text":"","points":[[0.012,0.734],[0.012,0.979],[0.03,0.979],[0.03,0.738],[0.049,0.737],[0.049,0.979],[0.067,0.979],[0.067,0.729],[0.085,0.721],[0.085,0.979],[0.104,0.979],[0.104,0.708],[0.122,0.695],[0.122,0.979],[0.141,0.979],[0.141,0.686],[0.159,0.678],[0.159,0.979],[0.178,0.979],[0.178,0.676],[0.196,0.679],[0.196,0.979],[0.214,0.979],[0.214,0.684],[0.233,0.695],[0.233,0.979],[0.251,0.979],[0.251,0.707],[0.27,0.719],[0.27,0.979],[0.288,0.979],[0.288,0.73],[0.307,0.735],[0.307,0.979],[0.325,0.979],[0.325,0.738],[0.343,0.735],[0.343,0.979],[0.362,0.979],[0.362,0.728],[0.38,0.718],[0.38,0.979],[0.399,0.979],[0.399,0.705],[0.417,0.693],[0.417,0.979],[0.436,0.979],[0.436,0.685],[0.454,0.676],[0.454,0.979],[0.472,0.979],[0.472,0.677],[0.491,0.679],[0.491,0.979],[0.509,0.979],[0.509,0.686],[0.528,0.698],[0.528,0.979],[0.546,0.979],[0.546,0.709],[0.564,0.721],[0.564,0.979],[0.583,0.979],[0.583,0.733],[0.601,0.736],[0.601,0.979],[0.62,0.979],[0.62,0.739],[0.638,0.734],[0.638,0.979],[0.657,0.979],[0.657,0.726],[0.675,0.716],[0.675,0.979],[0.693,0.979],[0.693,0.703],[0.712,0.691],[0.712,0.979],[0.73,0.979],[0.73,0.683],[0.749,0.675],[0.749,0.979],[0.767,0.979],[0.767,0.677],[0.786,0.68],[0.786,0.979],[0.804,0.979],[0.804,0.689],[0.822,0.7],[0.822,0.979],[0.841,0.979],[0.841,0.712],[0.859,0.723],[0.859,0.979],[0.878,0.979],[0.878,0.734],[0.896,0.736],[0.896,0.979],[0.915,0.979],[0.915,0.739],[0.933,0.732],[0.933,0.979],[0.951,0.979],[0.951,0.724],[0.97,0.713],[0.97,0.979],[0.988,0.979],[0.988,0.7]],"motion":"draw"},
 {"type":"path","x":0.4,"y":0.285,"width":0.019,"height":0.014,"color":"#1f3c44","lineWidth":3,"start":4.6,"duration":0.5,"text":"","points":[[0.391,0.278],[0.4,0.292],[0.409,0.278]],"motion":"draw"},
 {"type":"path","x":0.43,"y":0.314,"width":0.016,"height":0.011,"color":"#1f3c44","lineWidth":3,"start":4.9,"duration":0.5,"text":"","points":[[0.422,0.308],[0.43,0.319],[0.438,0.308]],"motion":"draw"},
 {"type":"text","x":0.234,"y":0.194,"width":0.328,"height":0.067,"color":"#1f3c44","lineWidth":1,"start":5.2,"duration":1.0,"text":"Uzak tepeler","points":[],"motion":"fade"}
]}
```

## Örnek 2 — zengin: vadi ve nehir

```json
{"category":"landscape","title":"Vadide gün batımı","duration":14,"seed":41,"speed":1,"detail":1,"background":"#b4c9bf","palette":["#e3ba8a","#8fada2","#638d85","#446f72","#31555e","#1f3c44","#d9e4dc"],"objects":[
 {"type":"rect","x":0.5,"y":0.472,"width":1.0,"height":0.083,"color":"#c7d3c3","lineWidth":1,"start":0.0,"duration":1.2,"text":"","points":[],"motion":"fade"},
 {"type":"circle","x":0.5,"y":0.417,"width":0.125,"height":0.222,"color":"#e3ba8a","lineWidth":1,"start":0.4,"duration":1.5,"text":"","points":[],"motion":"fade"},
 {"type":"path","x":0.5,"y":0.674,"width":0.977,"height":0.61,"color":"#8fada2","lineWidth":30,"start":1.2,"duration":2.2,"text":"","points":[[0.012,0.375],[0.012,0.979],[0.03,0.979],[0.03,0.371],[0.049,0.369],[0.049,0.979],[0.067,0.979],[0.067,0.37],[0.085,0.372],[0.085,0.979],[0.104,0.979],[0.104,0.378],[0.122,0.385],[0.122,0.979],[0.141,0.979],[0.141,0.394],[0.159,0.405],[0.159,0.979],[0.178,0.979],[0.178,0.416],[0.196,0.428],[0.196,0.979],[0.214,0.979],[0.214,0.44],[0.233,0.451],[0.233,0.979],[0.251,0.979],[0.251,0.462],[0.27,0.471],[0.27,0.979],[0.288,0.979],[0.288,0.479],[0.307,0.484],[0.307,0.979],[0.325,0.979],[0.325,0.488],[0.343,0.489],[0.343,0.979],[0.362,0.979],[0.362,0.488],[0.38,0.485],[0.38,0.979],[0.399,0.979],[0.399,0.479],[0.417,0.472],[0.417,0.979],[0.436,0.979],[0.436,0.462],[0.454,0.452],[0.454,0.979],[0.472,0.979],[0.472,0.44],[0.491,0.428],[0.491,0.979],[0.509,0.979],[0.509,0.416],[0.528,0.405],[0.528,0.979],[0.546,0.979],[0.546,0.394],[0.564,0.386],[0.564,0.979],[0.583,0.979],[0.583,0.377],[0.601,0.373],[0.601,0.979],[0.62,0.979],[0.62,0.369],[0.638,0.369],[0.638,0.979],[0.657,0.979],[0.657,0.371],[0.675,0.375],[0.675,0.979],[0.693,0.979],[0.693,0.381],[0.712,0.388],[0.712,0.979],[0.73,0.979],[0.73,0.399],[0.749,0.409],[0.749,0.979],[0.767,0.979],[0.767,0.421],[0.786,0.433],[0.786,0.979],[0.804,0.979],[0.804,0.444],[0.822,0.456],[0.822,0.979],[0.841,0.979],[0.841,0.466],[0.859,0.474],[0.859,0.979],[0.878,0.979],[0.878,0.482],[0.896,0.486],[0.896,0.979],[0.915,0.979],[0.915,0.49],[0.933,0.489],[0.933,0.979],[0.951,0.979],[0.951,0.487],[0.97,0.482],[0.97,0.979],[0.988,0.979],[0.988,0.476]],"motion":"draw"},
 {"type":"path","x":0.5,"y":0.744,"width":0.977,"height":0.471,"color":"#638d85","lineWidth":30,"start":2.4,"duration":2.2,"text":"","points":[[0.012,0.552],[0.012,0.979],[0.03,0.979],[0.03,0.564],[0.049,0.574],[0.049,0.979],[0.067,0.979],[0.067,0.583],[0.085,0.59],[0.085,0.979],[0.104,0.979],[0.104,0.593],[0.122,0.595],[0.122,0.979],[0.141,0.979],[0.141,0.592],[0.159,0.588],[0.159,0.979],[0.178,0.979],[0.178,0.58],[0.196,0.57],[0.196,0.979],[0.214,0.979],[0.214,0.56],[0.233,0.548],[0.233,0.979],[0.251,0.979],[0.251,0.537],[0.27,0.527],[0.27,0.979],[0.288,0.979],[0.288,0.518],[0.307,0.513],[0.307,0.979],[0.325,0.979],[0.325,0.509],[0.343,0.509],[0.343,0.979],[0.362,0.979],[0.362,0.511],[0.38,0.516],[0.38,0.979],[0.399,0.979],[0.399,0.525],[0.417,0.533],[0.417,0.979],[0.436,0.979],[0.436,0.545],[0.454,0.556],[0.454,0.979],[0.472,0.979],[0.472,0.567],[0.491,0.577],[0.491,0.979],[0.509,0.979],[0.509,0.585],[0.528,0.591],[0.528,0.979],[0.546,0.979],[0.546,0.595],[0.564,0.593],[0.564,0.979],[0.583,0.979],[0.583,0.592],[0.601,0.585],[0.601,0.979],[0.62,0.979],[0.62,0.577],[0.638,0.567],[0.638,0.979],[0.657,0.979],[0.657,0.556],[0.675,0.545],[0.675,0.979],[0.693,0.979],[0.693,0.534],[0.712,0.524],[0.712,0.979],[0.73,0.979],[0.73,0.517],[0.749,0.51],[0.749,0.979],[0.767,0.979],[0.767,0.509],[0.786,0.509],[0.786,0.979],[0.804,0.979],[0.804,0.513],[0.822,0.519],[0.822,0.979],[0.841,0.979],[0.841,0.527],[0.859,0.538],[0.859,0.979],[0.878,0.979],[0.878,0.548],[0.896,0.56],[0.896,0.979],[0.915,0.979],[0.915,0.571],[0.933,0.58],[0.933,0.979],[0.951,0.979],[0.951,0.588],[0.97,0.592],[0.97,0.979],[0.988,0.979],[0.988,0.594]],"motion":"draw"},
 {"type":"path","x":0.5,"y":0.807,"width":0.977,"height":0.345,"color":"#446f72","lineWidth":30,"start":3.6,"duration":2.2,"text":"","points":[[0.012,0.693],[0.012,0.979],[0.03,0.979],[0.03,0.685],[0.049,0.676],[0.049,0.979],[0.067,0.979],[0.067,0.665],[0.085,0.654],[0.085,0.979],[0.104,0.979],[0.104,0.645],[0.122,0.637],[0.122,0.979],[0.141,0.979],[0.141,0.635],[0.159,0.634],[0.159,0.979],[0.178,0.979],[0.178,0.639],[0.196,0.646],[0.196,0.979],[0.214,0.979],[0.214,0.655],[0.233,0.667],[0.233,0.979],[0.251,0.979],[0.251,0.678],[0.27,0.686],[0.27,0.979],[0.288,0.979],[0.288,0.694],[0.307,0.696],[0.307,0.979],[0.325,0.979],[0.325,0.696],[0.343,0.691],[0.343,0.979],[0.362,0.979],[0.362,0.683],[0.38,0.674],[0.38,0.979],[0.399,0.979],[0.399,0.662],[0.417,0.651],[0.417,0.979],[0.436,0.979],[0.436,0.643],[0.454,0.636],[0.454,0.979],[0.472,0.979],[0.472,0.634],[0.491,0.635],[0.491,0.979],[0.509,0.979],[0.509,0.64],[0.528,0.649],[0.528,0.979],[0.546,0.979],[0.546,0.658],[0.564,0.669],[0.564,0.979],[0.583,0.979],[0.583,0.681],[0.601,0.688],[0.601,0.979],[0.62,0.979],[0.62,0.695],[0.638,0.696],[0.638,0.979],[0.657,0.979],[0.657,0.695],[0.675,0.69],[0.675,0.979],[0.693,0.979],[0.693,0.681],[0.712,0.671],[0.712,0.979],[0.73,0.979],[0.73,0.66],[0.749,0.649],[0.749,0.979],[0.767,0.979],[0.767,0.642],[0.786,0.635],[0.786,0.979],[0.804,0.979],[0.804,0.634],[0.822,0.636],[0.822,0.979],[0.841,0.979],[0.841,0.641],[0.859,0.651],[0.859,0.979],[0.878,0.979],[0.878,0.661],[0.896,0.672],[0.896,0.979],[0.915,0.979],[0.915,0.683],[0.933,0.69],[0.933,0.979],[0.951,0.979],[0.951,0.696],[0.97,0.696],[0.97,0.979],[0.988,0.979],[0.988,0.694]],"motion":"draw"},
 {"type":"path","x":0.508,"y":0.74,"width":0.062,"height":0.175,"color":"#d9e4dc","lineWidth":14,"start":5.6,"duration":2.0,"text":"","points":[[0.539,0.653],[0.539,0.665],[0.539,0.678],[0.538,0.69],[0.534,0.703],[0.529,0.715],[0.523,0.728],[0.515,0.74],[0.507,0.753],[0.499,0.765],[0.492,0.778],[0.486,0.79],[0.481,0.803],[0.479,0.815],[0.477,0.828]],"motion":"draw"},
 {"type":"rect","x":0.195,"y":0.759,"width":0.009,"height":0.067,"color":"#31555e","lineWidth":1,"start":6.8,"duration":0.4,"text":"","points":[],"motion":"fade"},
 {"type":"ellipse","x":0.195,"y":0.709,"width":0.049,"height":0.113,"color":"#31555e","lineWidth":1,"start":7.0,"duration":0.6,"text":"","points":[],"motion":"fade"},
 {"type":"rect","x":0.258,"y":0.781,"width":0.008,"height":0.056,"color":"#31555e","lineWidth":1,"start":7.1,"duration":0.4,"text":"","points":[],"motion":"fade"},
 {"type":"ellipse","x":0.258,"y":0.739,"width":0.041,"height":0.094,"color":"#31555e","lineWidth":1,"start":7.3,"duration":0.6,"text":"","points":[],"motion":"fade"},
 {"type":"rect","x":0.797,"y":0.776,"width":0.01,"height":0.072,"color":"#31555e","lineWidth":1,"start":7.4,"duration":0.4,"text":"","points":[],"motion":"fade"},
 {"type":"ellipse","x":0.797,"y":0.722,"width":0.053,"height":0.123,"color":"#31555e","lineWidth":1,"start":7.6,"duration":0.6,"text":"","points":[],"motion":"fade"},
 {"type":"path","x":0.306,"y":0.243,"width":0.019,"height":0.014,"color":"#1f3c44","lineWidth":3,"start":8.4,"duration":0.5,"text":"","points":[[0.297,0.236],[0.306,0.25],[0.316,0.236]],"motion":"float"},
 {"type":"path","x":0.336,"y":0.276,"width":0.016,"height":0.011,"color":"#1f3c44","lineWidth":3,"start":8.7,"duration":0.5,"text":"","points":[[0.328,0.271],[0.336,0.282],[0.344,0.271]],"motion":"draw"},
 {"type":"text","x":0.5,"y":0.153,"width":0.438,"height":0.067,"color":"#1f3c44","lineWidth":1,"start":9.4,"duration":1.0,"text":"Vadide gün batımı","points":[],"motion":"fade"}
]}
```

## Kabul ölçütleri

Katman derinliği görünür; kenarlar boş değil; uzak-yakın değerleri ayrışıyor; metin gökyüzünde okunur.
Son kare tek başına bakıldığında bitmiş, dengeli bir resim olmalı; tüm metin okunur ve güvenli alanda.

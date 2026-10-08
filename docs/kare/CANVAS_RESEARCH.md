# Canvas 2D animasyon araştırması

Araştırma: 7 Ekim 2026. Bu 20 kategori JavaScript ve Canvas 2D ile çizilir. Kategoriler sanat tarzı, hareket sistemi ve anlatım kullanımını kapsar. Suluboya, yağlıboya ve kömür örnekleri malzemenin prosedürel görsel benzetimleridir; fiziksel pigment veya gerçek sıvı simülasyonu değildir. İzometrik kategori 2D izdüşümdür.

| Kategori | Uygulanan teknik | Birincil kaynak |
|---|---|---|
| Çizgi sanatı | Fırça yolu ve kademeli çizim | [Referans](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API/Tutorial/Drawing_shapes) |
| Suluboya | Katmanlı pigment lekeleri ve kâğıt dokusu | [Referans](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API/Tutorial/Compositing) |
| Pastel | Kısa kuru sürtmeler ve granül doku | [Referans](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API/Tutorial/Drawing_shapes) |
| Karakalem | Kontur, çapraz tarama ve basınç | [Referans](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API/Tutorial/Drawing_shapes) |
| Mürekkep | Basınç hissi veren yollar ve nokta sıçramaları | [Referans](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API/Tutorial/Drawing_shapes) |
| Kömür | Yoğun nokta birikimi ve geniş sürtme | [Referans](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API/Tutorial/Compositing) |
| Yağlıboya | Opak fırça blokları ve impasto çizgileri | [Referans](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API/Tutorial/Drawing_shapes) |
| Piksel sanatı | Tam piksel ızgarası ve ayrık sprite kareleri | [Referans](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API/Tutorial/Pixel_manipulation_with_canvas) |
| Retro / synthwave | Perspektif ızgara, dilimli güneş, tarama çizgileri | [Referans](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API/Tutorial/Transformations) |
| Hareketli tipografi | Kelime gecikmesi, dönüş ve yumuşak giriş | [Referans](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API/Tutorial/Transformations) |
| Geometrik hareket | Harmonik dönüş ve simetrik yol sistemleri | [Referans](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API/Tutorial/Transformations) |
| Parçacıklar | Analitik doğum-yaşam-ölüm döngüsü | [Referans](https://natureofcode.com/particles/) |
| Akış alanları | Trigonometrik vektör alanı ve örneklenmiş yollar | [Referans](https://natureofcode.com/autonomous-agents/) |
| Botanik | Büyüme yolu, gecikmeli yapraklar ve rüzgâr | [Referans](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API/Tutorial/Drawing_shapes) |
| Katmanlı manzara | Prosedürel silüetler ve parallax | [Referans](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API/Tutorial/Transformations) |
| Kâğıt kesme | Düz renk silüetler ve tutarlı düşen gölge | [Referans](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API/Tutorial/Compositing) |
| Çizgi roman | Patlama poligonu, hız çizgileri ve halftone | [Referans](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API/Tutorial/Drawing_shapes) |
| Veri anlatımı | Ölçekli sütunlar, etiketler ve zamanlı vurgu | [Referans](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API/Tutorial/Drawing_shapes) |
| İzometrik | 2D izdüşüm ve arka-ön yüz sıralaması | [Referans](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API/Tutorial/Transformations) |
| Fizik ve salınım | Analitik salınım ve yörünge izi | [Referans](https://natureofcode.com/oscillation/) |

## Değerlendirme

### Çizgi sanatı

Yolları eşit yay uzunluğuyla örnekle; nokta indeksini hız sanma. Kalem hareketini görünür uçla eşleştir. Ayrı nesneler arasında görünmez seyahat kullan. Çizgi ağırlığını sabit tut, köşelerde yuvarlak birleşim kullan.

Kontrol: Çizim ucu bitmiş yolun üzerinde; form anlaşılır; geri sarınca aynı çizgi çıkar.

### Suluboya

Saydam pigment lekelerini ayrı geçişler olarak biriktir. Kenarları seeded düzensiz poligonlarla oluştur. Aynı karede aşırı alpha üst üste binmesi çamurlu renk yaratır; geçişleri sınırla. Boya yayılması zamanla genişlesin; hareket eden objeler ayrı katmanlar olsun. Bu yaklaşımı fiziksel sıvı simülasyonu olarak adlandırma.

Kontrol: Kâğıt dokusu sabit; lekeler yumuşak ve şeffaf; pigment yayılması titremeden ilerler.

### Pastel

Kısa, geniş, parçalı fırça izlerini kâğıt tanesiyle kır. İzlerin yönünü yüzeyin formuna göre seç. Parlak sıvı gradyanları kullanma; pastel kuru malzemedir. Seed ile doku parçacıklarını sabitle. Leke içinde ana rengi okunabilir tut.

Kontrol: Kuru sürtünme görünür; renk bantları ayrışır; doku her karede aynı yerde kalır.

### Karakalem

Konturu ve gölge taramasını ayrı zamanla. Koyu gölgeyi tek opak dolgu yerine çizgi yoğunluğu ile kur. Hatch yönü yüzey eğimini izlesin. Hafif seeded çoklu kontur grafit kararsızlığını taklit eder; değişken seed titreşime neden olur.

Kontrol: Kontur okunur; tarama formu destekler; ışık yönü tutarlı.

### Mürekkep

Yol yönüne göre kalınlık değişimini segmentlerle üret. Dar giriş, geniş gövde ve ince çıkış farklı çizilsin. Sıçrama konumları seeded olsun ve ana kompozisyonu örtmesin. Negatif alan bırak; her boşluğu noktayla doldurma.

Kontrol: Kalınlık geçişleri kontrollü; sıçramalar sabit; çizgi ritmi görünür.

### Kömür

Toz yoğunluğunu yüzey normaline göre dağıt. Geniş düşük alfa katmanlardan koyu hacim üret. Silgi vurgusu için ayrı layer mask veya açık kâğıt izi kullan. Kenarların tamamını keskin çizme; odak ve kayıp kenarları ayır.

Kontrol: Toz karakteri belli; gölgeler tek düz daire değil; ışık alanı okunur.

### Yağlıboya

Opak fırça işaretlerini alttan üste düzenle. Her izin içinde yönlü ince aydınlık çizgiler kabartma hissi verir. Hareket doku üzerinde kaydırma değil, yeni boya izlerinin açılması olsun. Doku yönü kompozisyon akışını izlesin.

Kontrol: Kalın boya hissi görünür; izler birlikte bir kompozisyon oluşturur; doku sabit.

### Piksel sanatı

Tam sayı ızgarasına oturt. Sprite silüetini küçük çözünürlükte doğrula. imageSmoothingEnabled kapalı olmalı. Frame durumunu floor(t*fps) ile seç; delta biriktirme. Paleti sınırlı tut ve sprite çevresindeki boşluğu koru.

Kontrol: Pikseller keskin; sprite sıçramaları bilinçli; hareket kareleri zamanla tekrar üretilebilir.

### Retro / synthwave

Ufku sabitle; ızgara yatay çizgilerinde perspektif aralığını kullan. Güneş dilimlerini clip içinde oluştur. Neon doygunluğunu koyu arka planla dengele. Analog tarama ince olsun, yazıları okunmaz yapmasın. Bunu gerçek 3D olarak sunma.

Kontrol: Kaçış noktası tutarlı; ufuk akmıyor; retro estetikte metin okunur.

### Hareketli tipografi

Metni kelime veya harf birimlerine ayır. Ölçümü measureText ile yap ve uzun başlıkları sahneye sığdır. Giriş gecikmesi okuma sırasını desteklesin. Metin render sırasında font yükleme beklememeli. Türkçe karakterleri test et.

Kontrol: Uzun metin taşmıyor; Türkçe karakterler doğru; kelime sırası okunabilir.

### Geometrik hareket

Hareket hiyerarşisini transform save/restore ile ayır. Şekil köşelerinin fazları belirli olsun. Merkez ve simetri eksenini açık seç. Döngü isteniyorsa t=0 ve t=duration eşleşmesini doğrula; yalnızca modulo uygulamak kusursuz döngü garantilemez.

Kontrol: Merkez kaymıyor; dönüş hızı kontrollü; tüm transformlar restore ediliyor.

### Parçacıklar

Parçacık yaşını t ve seeded doğum fazından hesapla. Konumu analitik hızla belirle; önceki frame durumuna bağımlı olma. Yaşam sonunda alpha sıfıra yaklaşsın. Additive veya screen karışımı kullanırken parlaklık yığılmasını kontrol et.

Kontrol: Doğum ve ölümde sert sıçrama yok; parçacık sayısı sınırlı; geri sarma aynı konumları verir.

### Akış alanları

Alan vektörünü konum ve zamana bağlı üret. Yolları seeded başlangıçlardan sabit adımla örnekle. Hız ile yönü ayrı parametreleştir. Tam Navier-Stokes simülasyonu vaat etme; bu örnek vektör alanıdır. Ayrıntı düzeyinde adım ve yol sayısını sınırla.

Kontrol: Yollar akış yönünü takip eder; adım sınırı var; animasyon dt geçmişine bağlı değil.

### Botanik

Gövdeyi önce, yaprakları bağlantı yerlerine erişildiğinde aç. Rüzgâr etkisini kökte sıfır uçta fazla yap. Yaprak yönlerini gövdeye bağlı tut. Çiçek açılmasında ölçeği sıfırdan smooth ile artır; petal rastgeleliğini seed ile sabitle.

Kontrol: Yapraklar havada oluşmuyor; kök kaymıyor; büyüme sırası botanik olarak anlaşılır.

### Katmanlı manzara

Arka, orta ve ön plan ayrı derinlik hızları kullansın. Ufku ve güneşi ana kompozisyon çıpası olarak tut. Silüetleri tam sahne kenarlarına kadar çiz. Pan sırasında seam oluşmasını önle. Renk değerleri uzak planda daha düşük kontrastlı olsun.

Kontrol: Katman derinliği görünür; boş kenar yok; uzak ve yakın hızları ayrışıyor.

### Kâğıt kesme

Her kesilmiş yüzey opak bir katman olsun. Gölge yönünü tüm katmanlarda ortak tut. Yavaş küçük hareketlerle karton hissini koru. Kesim konturunu düzgün tut, boya granülü ekleme. Katman sayısını ve shadowBlur maliyetini sınırla.

Kontrol: Katmanlar ayrışır; gölgeler aynı yönde; kesim kenarları temiz.

### Çizgi roman

Önce panel ve odak nesnesini kur. Hız çizgileri odağa yönelsin; metnin üzerinden geçmesin. Halftone noktalarını sabit ızgaraya koy. Ünlem tipografisini alanın sınırına göre ölç. Etki hareketlerini kısa ve net tut.

Kontrol: Panel taşmıyor; kelime okunuyor; odak merkezine yönlenen çizgiler var.

### Veri anlatımı

Veri ile görsel yüksekliği aynı ölçekten türet. Kullanıcı verisini koru; demo sayıları gerçek ölçüm gibi sunma. Çubuk başlangıcı ortak tabana otursun. Eksenler ve etiketler sahne içinde kalsın. Sayısal interpolasyonda final değerleri tam göster.

Kontrol: Final etiketleri veriyle aynı; taban ve ölçek tutarlı; sahte kaynak yok.

### İzometrik

Noktaları izometrik koordinattan 2D koordinata dönüştür. Blokları derinliğe göre arkadan öne çiz. Üst ve yan yüzler ayrı renk değerleri alsın. Bunu Canvas 2D izdüşümü olarak belirt, 3D mesh çıktısı vaat etme. Yükseklikler negatif olmasın.

Kontrol: Örtüşme sırası tutarlı; yüzler birleşiyor; negatif yükseklik yok.

### Fizik ve salınım

Salınımı t üzerinden analitik hesapla; render çağrıları fizik state ilerletmesin. İzi geçmiş zaman örneklerinden üret. Basit sinüs sarkacı küçük açı yaklaşımıdır; bilimsel doğruluk iddiasında sınırını belirt. Büyüklük ve birimleri ayrı göster.

Kontrol: İp uzunluğu sabit; iz zamanla tutarlı; sarkaç pivotu kaymıyor.

# Kare — stüdyoya eklenen 12 araç

> Bu repoda Kare ayrı bir sunucuda çalışır: `tools/kare.sh start` → `http://localhost:8771/kare/` (oturum anahtarlı adres). Arayüz `kare/`, motor `kare/engine/`, beceriler `kare/skills/`. Ders kayıt stüdyosu (`/studio/`, 8770) ayrıdır ve değişmedi. Güvenlik ve ayarlar: CLAUDE.md → "Kare animasyon atölyesi".

Başlat: `tools/kurulum.sh` (pypdf, python-docx, sympy dahil), ardından `tools/kare.sh start` (macOS/Linux ya da Windows'ta Git Bash). Chrome, Node ve FFmpeg kurulu olmalı. Kare: `http://localhost:8771/kare/?t=…#edit` (adres betik tarafından verilir). Üst menüde **Stüdyo araçları** çalışma masasını açar. Mevcut matematik dersine **Matematik & eğitim** bağlantısından ulaşılır.

Kare'nin mevcut renkleri ve yerel fontları korundu. Çalışma masasında sabit sahne önizlemesi, zaman sürgüsü ve sekmeler var. Her işlem açık projede çalışır; geri al ve yerel kayıt devam eder. AI, ses, hizalama ve video işleri sunucuda yürür; ilerleme, iptal ve sonuç uygulama ekranları stüdyonun içindedir. Bir sağlayıcının sitesine geçmek gerekmez. GLM API dış servise istek gönderir; Windows sesi, Whisper ve FFmpeg yerelde çalışır. Cartesia isteğe bağlıdır ve ayrı hesap ayarı gerekir.

| # | Araç | Kullanımı ve davranışı |
|---|---|---|
| 1 | Proje stil kilidi | **Stil & nesneler**: palet, arka plan, Manrope/Kalam, çizgi kalınlığı, fırça ve hareket türünü belirle. Kilidi açınca bütün sahneler ve ortak nesneler aynı stili kullanır. Nesne kilidi açık öğeler korunur. Dokümandan yeni üretime de açık projenin stil ayarları gönderilir. |
| 2 | Ortak nesne/karakter kütüphanesi | Sahnenin düzenlenebilir nesnelerini kaydet, başka sahneye bağlı örnek ekle. Ortak nesneyi güncelleyince bütün bağlı örneklerin çizimi değişir. Kütüphane proje, sürüm ve ZIP içinde saklanır. İç içe ortak nesneler desteklenmez. |
| 3 | Sahne devamlılığı | **Katman & hareket**: nesnelere aynı devamlılık kimliğini ver. Sonraki sahnede devamlılığı aç; önceki nesnenin son konumu/dönüşü/ölçeği/saydamlığı taşınır. Aynı kimlikli yeni bir nesne eski durumu değiştirir. Devamlılığı kapatmak akışı sıfırlar. Bu mekanizma karakter yüzü üreten bir görüntü modeli değildir; Canvas nesne durumunu korur. |
| 4 | Üretim öncesi senaryo incelemesi | **Doküman & uzun animasyon**: anlatım, görsel yön, süre, kategori, sıra ve kaynak referanslarını üretimden önce gözden geçir. Kategori hareket referansları taslak yönünü gösterir; nihai sahne üretimden sonra oluşur. **Senaryo** sekmesinde açık filmin notları, metinleri, süreleri ve sırası düzenlenir. |
| 5 | Konuşma–hareket hizalama | Ses üret/yükle, ardından **Konuşmayı kelimelere hizala**. Yerel Whisper gerçek WAV üzerinden zaman çıkarır. Katmanda bir kelime seçerek hareketin başlangıcını bağla. Eşleşen/toplam kelime sayısı gösterilir; eşleşmeyen kelimeler aradaki zamana bölüştürülür ve kalite kontrolünde uyarılır. |
| 6 | Katman ve anahtar kare düzenleme | Daire, dikdörtgen, yol ve metin ekle. İsim, konum, boyut, dönüş, ölçek, saydamlık, renk, başlangıç/süre, hareket ve fırça düzenlenir. Gruplar konum değişiminde birlikte taşınır; kilit/gizle/sil/öne taşı vardır. Konumları zamanlı anahtar karelere kaydet; doğrusal/yumuşak/bekle eğrilerini kullan. Nesneler çalışma masasının önizlemesinde sürüklenebilir. |
| 7 | Fırça davranışları | Düzenlenebilir yollar için düz çizgi, çok katmanlı suluboya, tanecikli pastel, değişen kalınlıklı mürekkep ve piksel ızgarasına oturan retro çizimi. Aynı tohum ve zaman aynı kareyi verir. Mevcut 20 kategori ve becerileri korunur. Bunlar fiziksel boya simülasyonu değildir. |
| 8 | Matematik masası | TeX formülünü MathJax ile rasterleştirilip Canvas'a çizilen SVG olarak ekle. `x`, `a`, temel fonksiyonlarla grafik üret; x/y görünür aralıklarını ve a parametresini değiştir. Eksen ve aralık etiketi birlikte gelir; görünür aralık dışı değerler kırpılır. Türev, eşdeğerlik ve belirli integral hesapla; sonucu zamanlı bir anlatım adımı olarak sahneye ekle. İntegral aracı şu anda en fazla 10. derece polinomla sınırlıdır. Eşdeğerlik ortak tanım bölgesinde değerlendirilir; tekillik uyarısı gösterilir. |
| 9 | Ses masası | Sabit yerel Türkçe anlatıcı, hız, perde, cümle duraklaması ve telaffuz sözlüğü. WAV/MP3/OGG/M4A müziği yükle; kısa müzik döngüye alınır. Renderda konuşma süresince seçilen müzik çarpanı uygulanır; ses yüksekliği dengelenir. Cartesia kendi hesap ses ayarını kullanır. Anlatımı olmayan sahneler seslendirme sırasında atlanır. |
| 10 | Hedefli GLM düzeltmesi | Seçili nesne, sahne çizimi, arka plan rengi veya başlama zamanı seçilen aralıkta bulunan nesneler için düzeltme iste. Önce/sonra taslağı incelenmeden proje değişmez. Kilitli nesneler, diğer sahneler, anlatım ve ses korunur. Sahne düzeltmesi o sahnenin kilitsiz çizimini yeniden oluşturabilir; aralık seçimi bir video karesi retuşu değildir. |
| 11 | Kalite ve kaynak kontrolü | Kadraj taşması, küçük/düşük kontrastlı yazı, görünmeyen öğe, eksik kelime işareti, sahne dışına çıkan hareket, eksik ses/hizalama ve kaynak bağlantıları denetlenir. Yapısal hatalar renderı durdurur; uyarılar incelemeyi kolaylaştırır. Kaynağı anlatımla yan yana açabilirsin. Kontroller bilimsel doğruluğu veya yazı çakışmamasını garanti etmez. |
| 12 | Sürüm ve teslim | Düzenlemelerden 4 saniye sonra sunucuya otomatik sürüm; değişmeyen sürüm tekrar yazılmaz. Son 50 sürüm listeden geri yüklenir, eski kayıtlar diskte tutulur. ZIP: proje + ortak nesneler + gerçek sahne/müzik WAV'ları + varsa kaynak + SRT/VTT. ZIP yeniden içe aktarılabilir. 720p/1080p/4K/dikey H.264 MP4, AAC ses ve ayrı WAV miksi. Değişmeyen sahneler render önbelleğinden alınır. |

## Önerilen çalışma sırası

1. Dokümanı ekle, senaryoyu hazırla, metin/görsel yön/süre/sırayı incele.
2. Ortak stil ve nesneleri belirle; çizimleri üret ve katmanları düzenle.
3. Ses ayarlarını kaydet, seslendir ve kelimelere hizala.
4. Konuşma işaretlerini, devamlılığı ve hareket anahtarlarını ekle.
5. Kalite/kaynak kontrolünü incele; gerekirse hedefli AI taslağı üret.
6. Sürüm ve ZIP kaydet; teslim boyutunu seçip **Render al** → MP4/WAV indir.

Projeler 1–360 sahne ve en fazla 180 dakika destekler; sahne 2–120 saniye, sahne başına 80 düzenlenebilir nesne. Müzik yüklemesi 20 MB / yaklaşık 120 saniye; döngüye alınır. Paket içe aktarma 250 MB, en fazla 2000 dosya ve 500 MB açılmış boyut sınırındadır; yol/sembolik bağ/zip bombası denetimi yapılır. Projeler ve medya sunucudaki `.studio-data` altında, tarayıcı kaydı ayrıca localStorage'da saklanır. Sunucu başka cihazda çalışırsa kayıtların ve API erişiminin dağıtımı ayrıca yapılandırılmalıdır.

Dikey teslim mevcut 16:9 kompozisyonu 1080×1920 kadraja sığdırır; otomatik nesne yeniden yerleştirmesi yapmaz. MP4 saydamlık taşımaz; saydam arka plan PNG kare ve Canvas/HTML önizlemesi içindir. Bağımsız HTML geometri/formüller/fontlarla çalışır; MP4 ve medya ZIP'i sesli teslim için kullanılır.

Ders hattının dosyaları (`studio/`, `src/`, `tools/studio_server.py`) Kare'den etkilenmez. Özgün tahta anlatımı ve kayıt stüdyosu ayrı sunucuda durur; yeni matematik masası genel Canvas stüdyosuna eklenmiştir.

## Kontroller

```text
$PY -X utf8 -m unittest discover -s tools -p "test_*api.py"
$PY -m unittest tools/test_kare_security.py
node tools/test_canvas.mjs
node tools/test_kare_ui.mjs
node tools/test_production_ui.mjs
node tools/test_render_ui.mjs
node tools/test_pro_ui.mjs
node tools/test_pro_integration.mjs
```

`test_pro_live_patch.mjs` seçili sağlayıcıya tek gerçek AI çağrısı yapar ve API kullanımı oluşturur; diğer yeni testler model ücreti oluşturmadan yerel ses/Whisper/FFmpeg veya sentetik model yanıtlarıyla çalışır. Gerçek sesli 1080p, 4K ve dikey video; iki sahneli önbelleğin 0 → 2 → 1 tekrar kullanım davranışı doğrulanmıştır. Bu kısa doğrulama bir 180 dakikalık render dayanıklılık testi değildir.

Windows ses ayarları [Microsoft SpeechSynthesizerOptions](https://learn.microsoft.com/en-us/uwp/api/windows.media.speechsynthesis.speechsynthesizeroptions) ile uygulanır. Matematik ifadesi Python AST izin listesi üzerinden SymPy nesnelerine çevrilir; kullanıcı girdisine eval uygulanmaz. [SymPy ayrıştırma belgesi](https://docs.sympy.org/latest/modules/parsing.html) eval kullanan standart ayrıştırma yöntemini ayrıca açıklar.

Tarayıcı testleri `tools/kare.sh start` ile açılan sunucuya bağlanır (port ve oturum anahtarı `.studio-data/kare-session.json`; `KARE_PORT`/`KARE_TOKEN` ile değiştirilebilir). `test_pro_integration.mjs` Whisper hizalaması da çalıştırır. Raporlar repo içindeki `output/` altında oluşur. Tarayıcı yolu `CHROME` ya da `CHROME_PATH` ile değiştirilebilir.

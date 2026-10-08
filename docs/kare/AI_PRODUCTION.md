# AI animasyon üretimi

> Bu repoda Kare ayrı bir sunucuda çalışır: `tools/kare.sh start` → `http://localhost:8771/kare/` (oturum anahtarlı adres). Arayüz `kare/`, motor `kare/engine/`, beceriler `kare/skills/`. Ders kayıt stüdyosu (`/studio/`, 8770) ayrıdır ve değişmedi. Güvenlik ve ayarlar: CLAUDE.md → "Kare animasyon atölyesi".

Ürün hedefi: kullanıcı bir fikri anlatır veya doküman verir; stüdyo içeriği ayıklar, anlatım ve görsel sahne planı hazırlayıp Canvas 2D animasyonlarını çizer, seslendirir ve uzun videoya dönüştürür. Kategoriler başlangıç çizim dilleridir; ürün yalnızca hazır örnek oynatıcısı değildir.

## Çalışan akış

Ana ekrandan **Dokümandan üret**, editörden **Doküman & uzun animasyon** seçilir.

1. PDF, DOCX, UTF-8 TXT veya MD yükle; çıkarılan metni incele. Görsel tarama/OCR ve resimlerin yorumlanması bu sürümde yoktur. Dosya sınırı 20 MB, PDF 300 sayfa, çıkarılan metin 300.000 karakterdir; aşan dokümanlar sessizce kesilmez.
2. Hedef süreyi 0,5–180 dakika aralığında seç, görsel yönü anlat. Tema dokümana göre seçilebilir veya koyu tahta/açık eğitim/sanatsal olarak sabitlenebilir.
3. Seçili AI sağlayıcısı (GLM-5.3, OpenAI, Anthropic Claude ya da Google Gemini), bölüm referanslarıyla anlatım ve somut çizim yönergeleri hazırlar. Plan, öğretim doğruluğu ve görsel yön için kullanıcı tarafından düzenlenebilir.
4. **Sahneleri çiz** her sahneyi seçili kategori becerisiyle üretir. JSON doğrulanır; modelden gelen JS çalıştırılmaz. Özgün kompozisyonlar path, text, rect, circle ve ellipse öğelerinden Canvas 2D ile çizilir. Hazır kategori örneği AI çiziminin altına eklenmez.
5. **Çizimleri editörde aç** yeni projeyi açar; geri al önceki projeyi geri getirir. Anlatım & ses alanında metin veya ses dosyası düzenlenir. Anlatım değişirse eski ses bağlantısı kaldırılır; tekrar seslendirmek gerekir.
6. **Projeyi seslendir** sahne başına WAV üretir. Windows'ta yerel Türkçe Microsoft sesi (ör. Tolga) kullanılabilir; macOS'ta Cartesia kullanılır. Cartesia için ayrıca CARTESIA_API_KEY ve CARTESIA_VOICE gerekir. GLM-5.3 bir metin modelidir; ses sağlayıcısının yerini almaz.
7. **Sesli projeyi editörde aç** ardından editörün üstündeki **Render al → MP4 renderı başlat → MP4 indir** ile 1280×720, 30 FPS Canvas kareleri ve sahne sesleri birleştirilir. Sekmeyi açık/etkin tutmak gerekmez; yerel stüdyo sunucusu çalışmalıdır. Uzun videoların render süresi donanım ve sahne karmaşıklığına bağlıdır.

## Süre ve zamanlama

Proje sınırı 360 sahne / 180 dakika; sahne 2–120 saniyedir. Plan hedef süreye bölünür. Ses planlanandan uzunsa sahne ve nesne zamanları genişletilir; gerçek toplam süre hedefi aşabilir. Altyazı kelime grupları ses süresine yaklaşık yerleştirilir; kelime düzeyinde konuşma hizalaması değildir. Sahne sesleri aralarına sessizlik eklenerek video zaman çizelgesine oturtulur. Sesli oynatma, duraklatma, zaman çubuğu ve sahne geçişleri editörde aynı proje zamanını izler.

WebM ve bağımsız HTML görsel çıktılardır, ses içermez. Sesli çıktı için MP4 kullanılır. JSON ses dosyalarını içine gömmez; yerel sunucudaki medya kimliklerini içerir. Başka bilgisayara taşımak için seslerin ayrıca paketlenmesi sonraki geliştirmedir.

## Model bağlantısı

> **Model seçimi:** Sahne üretimi uzamsal düşünme ister: en iyi sonuç güçlü modellerle (ör. Claude Sonnet/Opus, GPT'nin üst modelleri, Gemini Pro, GLM'in en büyük modeli). Haiku, GPT luna gibi çok ucuz/küçük modellerle tam performans alınamaz; sahneler basit ya da dağınık olabilir. Ayarlar sayfası, model adı küçük bir katmana benziyorsa (haiku, mini, nano, lite, luna; GLM'de air/flash) alanın yanında turuncu bir uyarı gösterir; üretimi engellemez.

Sunucu `.env` dosyasından (Kare'de **⚙ Ayarlar** ile düzenlenir) `AI_PROVIDER=glm|openai|anthropic|gemini` (boşsa anahtarı olan ilk sağlayıcı: glm → openai → anthropic → gemini), `GEMINI_API_KEY`/`GEMINI_MODEL` (varsayılan gemini-3.8-flash; v1beta `generateContent`, anahtar `x-goog-api-key` başlığında, JSON çıktı `responseMimeType=application/json`), `ANTHROPIC_API_KEY`/`ANTHROPIC_MODEL` (varsayılan claude-sonnet-5-5), `OPENAI_API_KEY`/`OPENAI_MODEL`, `AI_PROVIDER=glm`, `GLM_MODEL=glm-5.3`, `GLM_API_KEY`, `GLM_BASE_URL=https://api.z.ai/api/coding/paas/v4` okur. Kodlama hesabıyla uyumlu Chat Completions protokolü, açık reasoning ve düşük reasoning effort kullanılır. JSON mode yanında uygulama doğrulaması vardır; hatalı JSON/şema için yalnızca bir düzeltme çağrısı yapılır. Sonuç yine geçersizse üretim durur, önceki sahneler saklanır. Model erişimi ve hesap kotası sağlayıcı tarafından belirlenir.

Anahtar tarayıcıya, proje dosyasına veya kaynak paketine yazılmaz. Genel bağlantı durumu anahtarın ayarlı olduğunu gösterir; canlı servis kullanılabilirliği her üretimde ayrıca anlaşılır. Sağlayıcı modelini sessizce başka bir modelle değiştirme yoktur. OpenAI eski projeler için alternatif adaptör olarak kalır.

## İşler ve saklama

Dokümanlar, planlar, tamamlanan sahneler, sesler ve MP4 dosyaları `.studio-data/` altında saklanır. Bu klasör statik olarak sunulmaz, Git ve dağıtım ZIP'inden dışlanır. Medya yalnızca doğrulanmış UUID/dosya adreslerinden sunulur; video ve ses için HTTP Range desteklenir.

İki iş aynı anda çalışır, kuyruk en fazla dört etkin iş kabul eder. İlerleme ve geçmiş arayüzde görünür. Sunucu yeniden başlarsa işler hata durumuna alınır; çizim işi aynı planla tamamlanan sahnelerden devam edebilir. İptal modelin hâlihazırda gönderilmiş çağrısını geri almaz; sonraki sahneleri durdurur. Render iptali yalnızca bu işe ait yerel süreçleri sonlandırır.

Yerel tarayıcı kaydı korunur. Büyük projelerde tarayıcı kotası dolabilir; **Projeyi diske kaydet** düzenlenmiş projeyi de sunucuya yazar. Dağıtım ZIP'i kişisel kaynakları ve üretim dosyalarını içermez.

## Matematik teması sınırı

Bu repoda Eray'ın `studio/recording.html` (yeniden temalanmış kayıt sayfası) alınmadı; "Matematik & eğitim" bağlantısı mevcut ders kayıt stüdyosunu (`tools/studio.sh`, `http://localhost:8770/studio/`) açar ve matematik MP4 renderı ders hattının `tools/render_video.mjs` aracıyla yapılır. Aşağıdaki not Eray'ın dalındaki tasarımı anlatır: Özgün `studio.css` dosyası, ders metinleri, Fubini sahneleri, eski 3D matematik çizimleri ve kayıt/onay/Whisper akışı korunur. Yeni AI derslerinin koyu tahta teması aynı renkleri ve Kalam yazısını kullanır. AI Canvas sahneleri mevcut karmaşık SVG/MathJax matematik motorunun bütün yeteneklerini otomatik üretmez; bu sürümde formüller Canvas metni/Unicode ve geometrik çizimlerle anlatılır. Eski ders motoruna AI planının gelişmiş matematik sahneleri olarak aktarılması ayrı bir sonraki adımdır.

## Tüm kategorilerde MP4

**Render al** 20 Canvas kategorisinin tamamında çalışır; AI üretimi şart değildir. Projenin o anki kopyası render edilir; düzenlemeye devam etmek çalışan videoyu değiştirmez. Ekli ses dosyaları ve isteğe bağlı yaklaşık altyazılar dahil edilir. Ses dosyası yoksa çıktı sessizdir. Pencere kapansa veya sayfa yenilense de iş kimliğiyle ilerleme/sonuç geri açılır. Önceki renderlar sunucuda saklanır.

Matematik ekranı aynı düğmeyle seçili sahneyi veya dersin tamamını özgün SVG/3D tahta motorundan 1920×1080, 30 FPS olarak alır. Mevcut onaylı `assets/narration/*.wav` dosyaları, motorun gerçek `audioStart` zamanlarıyla videoya eklenir; bu render için ses ve kelime zamanları kopyalanır. Render ders dosyalarını değiştirmez. Ses kaynağını seçmek tek başına ses dosyası üretmez.

## Sonraki kalite adımları

Kelime hizalaması ve görsel işaretler, gelişmiş matematik sahne şeması, fırça/katman/nesne düzenleme, sahne geçişleri ve kamera hareketleri, kaynak doğruluğu denetimi, kullanıcı ses kayıtlarının aynı zaman çizelgesine alınması, proje+medya paketi ve yüksek kaliteli bulut TTS sesleri.

Resmi kaynaklar: [GLM-5.3](https://docs.z.ai/guides/llm/glm-5.3), [JSON mode](https://docs.z.ai/guides/capabilities/struct-output), [Windows SpeechSynthesizer](https://learn.microsoft.com/en-us/uwp/api/windows.media.speechsynthesis.speechsynthesizer).

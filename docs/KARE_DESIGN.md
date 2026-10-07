# Kare · arayüz tasarım kararı

Önce iki ayrı ekran referansı yerleşik imagegen aracıyla üretildi: studio/design-references/kare-home.png ve kare-editor.png. Araç belirli bir model sürümü seçtirmediği için bunlar “2.5 ile üretildi” diye etiketlenmez. Referanslar tasarım kaynağıdır; çalışma arayüzüne ekran görüntüsü olarak gömülmez.

Görsellerden çıkarılan sistem: parchment #F6F1E9, mürdüm yazı #392936, ikincil mürdüm #725367, mercan eylem #C65339, leylak çalışma zemini #E8DFE6, eğitim alanında sarı #E9CB75. Dört köşeli kare işareti marka ve hareket eskizinde tekrar eder. Yerel Manrope değişken fontu Türkçe karakterleri destekler; marka 34px, giriş başlığı 32–52px, kategori 23px, editör 24px, kontroller 12–14px.

Giriş referansı: 64px dış boşluk, 28px galeri arası, açık iki sütun, dört geniş resimli seçim ve ayrı sarı eğitim şeridi. Editör: 78px üst şerit, büyük 16:9 önizleme, 285px sağ ayar alanı, tek satır oynatma, yatay sahne şeridi. Mercan oynatma/AI/MP4 render, koyu mürdüm diğer birincil eylemler; diğer eylemler metin veya ince çerçeve. 4–7px köşe, görünür klavye odağı, az ve işlevsel hareket.

Beş ana alan, Canvas motorunun 20 stilini gruplar. Editörde kalıcı kategori listesi yoktur; “Stil seç” kitaplığı açar. İnce ayarlar, beceri ve kod kapalı açıklayıcılarda, AI isteği ayrı diyalogdadır. Matematik & eğitim mevcut ders motorunu açar. Matematik çalışma arayüzü Kare renklerini amber vurgular, koordinat kâğıdı ve numaralı sahnelerle kullanır. Görsel referans kare-math.png, prompt ve analiz studio/math-design-prompt.md içindedir. Kontroller Manrope, ders metni Kalam kullanır. Özgün koyu yeşil tahta içeriği, formüller, anlatım biçimi ve görünür ses kayıt araçları korunur. Canvas editöründe Matematik ve Seslendirme bağlantıları her zaman görünür. Sahne arama ve küçük ekran desteği ayrı recording-enhancements.css dosyasındadır; özgün studio.css değişmez. Eski ders motoru SVG; yeni 20 stil Canvas 2D kullanır.

Kapaklar ve hareket eskizi Canvas 2D ile çizilir. Suluboya sahnesinin katmanlı çiçekleri de deterministik JavaScript'tir. Görsel referansta okunabilen başlıklar korunur; işlev kapsamını aşan açıklamalar gerçek stil adlarıyla değiştirilir. Küçük ekranda giriş ve editör tek sütuna iner.

Editör ve matematik ekranındaki Render al, aynı MP4 penceresini açar: ilerleme, iptal, önizleme, indirme ve önceki dosyalar. Canvas 1280×720, özgün matematik motoru 1920×1080; ikisi de 30 FPS H.264 kullanır. Matematikte seçili sahne veya bütün ders seçilir.

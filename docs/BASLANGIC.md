# Ders notundan "tahtada anlatım" videosu: adım adım başlangıç

Bu kılavuz, ders notunuzdan (PDF) otomatik olarak **tahtada ders anlatımı** videosu üretmek içindir. Formüller anlatımın
tam o kelimesinde el yazısıyla yazılır, grafikler ve 3B şekiller anlatımla birlikte çizilir, seslendirme yapay zekayla
(isterseniz kendi sesinizin klonuyla) ya da kendi kaydınızla yapılır. İşin teknik kısmını **Claude Code** yapar; sizin
işiniz notu verip metni onaylamak.

Akış kısaca: **notu ve sayfaları verirsiniz → Claude planı ve anlatım metnini gösterir → "onaylıyorum" dersiniz → video hazır.**

---

## 0. Gerekenler

| | |
|---|---|
| Bilgisayar | **Mac** (M1/M2/M3/M4 en hızlısı; Intel Mac de olur) veya **Windows 10/11** (16 GB RAM önerilir; NVIDIA ekran kartı varsa ses tanıma hızlanır) |
| Disk | ~5 GB boş yer |
| Claude | **Claude Pro veya Max** aboneliği (Claude Code bununla çalışır) |
| Seslendirme | **Cartesia** hesabı (cartesia.ai). Video başına ~4–6 bin karakter harcanır. |
| Süre | Kurulum bir kez ~20 dk; her video ~30–60 dk (çoğu bekleme) |

---

## 1. Hazırlık (bir kez)

**Mac:** **Terminal**'i açın (⌘ + Boşluk → "Terminal") ve Homebrew'u kurun:
```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```
Kurulum sonunda "Next steps" altında yazan iki satırı da kopyalayıp çalıştırın. Sonra: `brew install git`

**Windows:** [git-scm.com/download/win](https://git-scm.com/download/win) adresinden **Git for Windows**'u kurun
(varsayılan seçeneklerle; Claude Code bunun içindeki "Git Bash"i kullanır).

## 2. Bu repoyu indirin (bir kez)

**Mac** (Terminal):
```bash
git clone https://github.com/aliharundaldalli/ahd-blackboard.git ~/ahd-blackboard
```
**Windows** (Başlat → "Git Bash"):
```bash
git clone https://github.com/aliharundaldalli/ahd-blackboard.git ~/ahd-blackboard
```
Klasör kullanıcı klasörünüzde `ahd-blackboard` adıyla oluşur. (Masaüstü, Belgeler veya OneDrive altına koymayın:
bulut eşitlemesi büyük dosyaları taşıyıp işleri yavaşlatabilir.)

## 3. Claude Code'u açın

**Yol A — Claude masaüstü uygulaması (önerilen, Mac ve Windows):** [claude.ai/download](https://claude.ai/download) adresinden indirin,
Claude hesabınızla girin, üstteki **Code** sekmesine geçin ve klasör olarak `ahd-blackboard`'nu seçin.

**Yol B — Terminal:** Node.js kurulu olmalı (Mac: `brew install node`, Windows: [nodejs.org](https://nodejs.org) LTS). Sonra:
```bash
npm install -g @anthropic-ai/claude-code
cd ~/ahd-blackboard && claude
```

## 4. Kurulumu Claude'a yaptırın (bir kez)

Claude Code'un mesaj kutusuna şunu yazın:

```
/kurulum
```

Claude gerekli programları (Node.js, ffmpeg, Python, Chrome, ses tanıma modeli) kurar ve bir test yapar.
- Mac'te bir yerde şifre isterse (Homebrew) Terminal'de siz girersiniz.
- Windows'ta programlar `winget` ile kurulur; ilk seferde Claude size **"Claude Code'u kapatıp açın ve /kurulum'u tekrar çalıştırın"** diyebilir — öyle yapın.
- Ses tanıma Apple Silicon Mac'te mlx-whisper, diğer bilgisayarlarda faster-whisper ile çalışır (otomatik seçilir).

Sonunda sizden Cartesia bilgilerini isteyecek (5. adım).

## 5. Seslendirme: Cartesia anahtarı ve ses

1. [play.cartesia.ai](https://play.cartesia.ai) adresinde hesap açın.
2. **API Keys** bölümünden yeni bir anahtar oluşturup kopyalayın (`sk_car_…` ile başlar).
3. Bir ses seçin:
   - **Kendi sesiniz:** *Voices → Clone* ile 10–20 saniyelik bir kaydınızı yükleyin (en doğal sonuç bu);
   - ya da *Voice Library*'den Türkçe bir ses seçin.
   Sesin sayfasındaki **ID**'yi kopyalayın.
4. Claude'a yazın: `Cartesia anahtarım: sk_car_… , ses ID: …`
   Claude bunu yalnızca bilgisayarınızdaki `.env` dosyasına yazar ve kısa bir test sesi üretir; dinleyip beğenip beğenmediğinizi söyleyin.

> Anahtarınızı kimseyle paylaşmayın; `.env` dosyası GitHub'a hiçbir zaman gönderilmez.

---

## 6. İlk video

1. Ders notunuzun PDF'ini Claude Code'un mesaj kutusuna **sürükleyip bırakın**.
2. Aynı mesaja şunu yazın (konu ve sayfaları kendinize göre değiştirin):

```
/ders-videosu Ekteki Akışkanlar Mekaniği notu, sayfa 34–41: Bernoulli denklemi ve uygulamaları
```

3. Claude notu okur, konuyu 4–7 dakikalık video(lar)a böler ve size **planı ve anlatım metnini** gösterir. Okuyun:
   - Beğendiyseniz: `Planı onaylıyorum, devam et.`
   - Değişiklik istiyorsanız yazın: `2. sahnede süreklilik denkleminden önce kütle korunumunu da hatırlat`, `örnekte boru çapını 10 cm al`, `daha yavaş ve sade anlatsın` …
4. Onaydan sonra Claude seslendirme, tahta sahneleri, müzik/ses miksi ve videoyu üretir. Bu sırada başka işinize bakabilirsiniz.
5. Bittiğinde size söyler. Dosyalar, Claude'un açtığı ders klasöründe (`~/ders-<konu>`):
   - `output/<ad>.mp4` — video (1920×1080),
   - `output/thumbnail.png` — kapak görseli,
   - `docs/YOUTUBE.md` — başlık, açıklama ve bölüm zamanları.
6. İzleyin; beğenmediğiniz yeri yazın: `3:20'deki şekilde akım çizgileri ters yönde`, `Reynolds sayısını yazarken virgül kullan` → Claude düzeltip yeniden üretir.

**Kısa soru çözümü videosu için:** `/soru-videosu Ekteki notun 52. sayfasındaki 3. soru (sayıları değiştirerek)`

## 7. (İsteğe bağlı) Kendi sesinizle okumak

Metni onaylarken yazın: `Formül okunan sahneleri ben seslendireceğim, gerisi Cartesia olsun.`
Claude tarayıcıda bir **kayıt stüdyosu** açar: soldan sahneyi seçin, metni okuyun (**R** kayıt/durdur, **Boşluk** dinle,
**Enter** onayla, **N** sıradaki). Her kayıt anında kontrol edilir (✅ / ⚠️). Bitince **Bitti**'ye basıp Claude'a
`Kayıtları bitirdim, devam et` yazın.

## 8. Kare animasyon atölyesi (isteğe bağlı)

Ders videolarından ayrı, renkli Canvas animasyonları (suluboya, çizgi roman, veri anlatımı… 20 çizim dili) için bir atölye.
Claude Code'da `/kare-studio` yazın (ya da terminalde `tools/kare.sh start`); tarayıcıda Kare açılır.

- Hazır örnekler, düzenleme ve video dışa aktarma **anahtarsız** çalışır.
- Dokümandan AI ile anlatım ve sahne üretmek isterseniz sağ üstteki **⚙ Ayarlar**'dan bir sağlayıcı anahtarı girin
  (GLM, OpenAI, Anthropic veya Google Gemini; seslendirme için Cartesia) ve **Bağlantıyı test et**'e basın.
- **Model seçimi:** Sahne üretimi uzamsal düşünme ister: en iyi sonuç güçlü modellerle (ör. Claude Sonnet/Opus, GPT'nin üst modelleri, Gemini Pro, GLM'in en büyük modeli). Haiku, GPT luna gibi çok ucuz/küçük modellerle tam performans alınamaz; sahneler basit ya da dağınık olabilir. Anahtar bilgisayarınızdaki `.env`
  dosyasında kalır, sayfada yalnızca kısaltılmış hâli görünür. AI üretimi sağlayıcı hesabınızdan ücretlendirilir.
- "Matematik & eğitim" bağlantısı yukarıdaki kayıt stüdyosunu açar (o ayrıca `tools/studio.sh` ile başlatılır).
- İşiniz bitince Claude'a `Kare'yi kapat` yazın (ya da `tools/kare.sh stop`).

---

## Sık sorulanlar

- **Akışkanlar mekaniği gibi fizik/mühendislik konuları olur mu?** Evet. Formüller, grafikler (ör. hız profili, basınç dağılımı),
  basit şemalar ve 3B yüzeyler çizilebilir. Karmaşık teknik çizimler (pompa kesiti gibi) yerine sade şematik gösterim yapılır;
  özel bir şekil istiyorsanız tarif edin.
- **Notumdaki örnekleri birebir kullanır mı?** Hayır; sayıları değiştirip sonuçları kendisi yeniden hesaplar ve doğrular. Aynısını istiyorsanız söyleyin.
- **Video ne kadar sürer?** Konuya göre 4–7 dk. Uzun konular birkaç videoya bölünür.
- **Hata olursa?** Claude'a hatayı olduğu gibi yazın/yapıştırın. Kurulum bozulduysa `/kurulum` komutunu tekrar çalıştırın.
- **Cartesia kredisi bitti (402 hatası)?** Cartesia panelinden kredi ekleyin ya da yeni anahtarı Claude'a verin.
- **Repoyu güncellemek:** Claude'a `Repoyu güncelle (git pull)` yazmanız yeterli.

## Teknik ayrıntılar (merak edenler için)

[CLAUDE.md](../CLAUDE.md) — üretim hattı ve kurallar · [docs/ENGINE.md](ENGINE.md) — tahta motoru ve sahne öğeleri ·
`tools/` — betikler · lisans: MIT.

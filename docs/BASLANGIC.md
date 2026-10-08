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
| Bilgisayar | **Apple Silicon Mac** (M1, M2, M3, M4). Intel Mac ve Windows şu an desteklenmiyor. |
| Disk | ~5 GB boş yer |
| Claude | **Claude Pro veya Max** aboneliği (Claude Code bununla çalışır) |
| Seslendirme | **Cartesia** hesabı (cartesia.ai). Video başına ~4–6 bin karakter harcanır. |
| Süre | Kurulum bir kez ~20 dk; her video ~30–60 dk (çoğu bekleme) |

---

## 1. Homebrew ve Git (bir kez)

**Terminal** uygulamasını açın (Spotlight: ⌘ + Boşluk → "Terminal") ve sırayla yapıştırın:

```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```
Kurulum sonunda ekranda "Next steps" altında iki satır komut yazar; onları da kopyalayıp çalıştırın. Sonra:

```bash
brew install git
```

## 2. Bu repoyu indirin (bir kez)

```bash
git clone https://github.com/aliharundaldalli/tahta-ders-motoru.git ~/tahta-ders-motoru
```
Klasör ana dizininizde `tahta-ders-motoru` adıyla oluşur. (Masaüstü veya Belgeler'e koymayın: iCloud eşitlemesi
büyük dosyaları buluta taşıyıp işleri yavaşlatabilir.)

## 3. Claude Code'u açın

**Yol A — Claude masaüstü uygulaması (önerilen):** [claude.ai/download](https://claude.ai/download) adresinden indirin,
Claude hesabınızla girin, üstteki **Code** sekmesine geçin ve klasör olarak `tahta-ders-motoru`'nu seçin.

**Yol B — Terminal:**
```bash
brew install node
npm install -g @anthropic-ai/claude-code
cd ~/tahta-ders-motoru && claude
```

## 4. Kurulumu Claude'a yaptırın (bir kez)

Claude Code'un mesaj kutusuna şunu yazın:

```
/kurulum
```

Claude gerekli programları (ffmpeg, Chrome, ses tanıma modeli vb.) kurar ve bir test yapar. Bir yerde şifre isterse
(ör. Homebrew) Terminal'de siz girersiniz. Sonunda sizden Cartesia bilgilerini isteyecek (5. adım).

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

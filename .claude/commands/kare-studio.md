---
description: Kare animasyon atölyesini (Canvas, isteğe bağlı) başlat ve tarayıcıda aç
---
Kare animasyon atölyesini başlat ve kullanıcıya sade Türkçe ile durum ver. Ders kayıt stüdyosuna (`tools/studio.sh`, port 8770) dokunma.

1. `tools/kare.sh start` çalıştır. Betik proje Python'unu (`tools/_ortam.sh` → `$PY`) kullanır, sunucuyu arka planda
   `127.0.0.1:8771` üzerinde başlatır, sağlık kontrolü geçene kadar bekler ve tarayıcıyı (`ac`) oturum anahtarlı adresle açar.
   - "Port kullanılıyor" derse: `tools/kare.sh status` ile bak; başka bir süreçse `KARE_PORT=8772 tools/kare.sh start` dene.
   - Başlamazsa `.studio-data/kare-server.log` dosyasının son satırlarını oku ve nedeni açıkla (ör. eksik paket → `tools/kurulum.sh`).
2. Kullanıcıya betiğin yazdığı adresi ver (`http://localhost:8771/kare/?t=…`). Adresteki anahtar bu oturuma özeldir; sayfayı
   açınca adres çubuğundan silinir ve tarayıcıda çerez olarak kalır. Anahtarı başka bir yere yazma/commit etme.
3. Hatırlat:
   - API anahtarları için sayfadaki **⚙ Ayarlar** (Cartesia, GLM, OpenAI, Anthropic; `AI_PROVIDER`). Anahtarlar `.env`'e yazılır,
     ekranda yalnızca maskeli görünür. Kullanıcı anahtarı sohbete yazarsa ekrana geri yazma; Ayarlar sayfasını kullanmasını öner.
   - Hazır 20 Canvas stili, düzenleme ve dışa aktarma anahtarsız çalışır; AI üretimi seçili sağlayıcıya ücretli istek gönderir.
   - "Matematik & eğitim" bağlantısı mevcut ders kayıt stüdyosunu (`tools/studio.sh`, 8770) açar.
4. Kullanıcıya "İşin bitince söyle, sunucuyu durdururum" de. Kullanıcı bitirdiğinde (ya da oturumun sonunda) `tools/kare.sh stop`
   çalıştır; başka süreçleri (`pkill` vb.) öldürme.

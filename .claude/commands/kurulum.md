---
description: Tek seferlik kurulum (bağımlılıklar, Whisper, Chrome, .env) ve test
---
Bu repo için kurulumu yap ve kullanıcıya sade Türkçe ile durum ver.

1. `tools/kurulum.sh` çalıştır (uzun sürebilir; Whisper modeli ~1,6 GB iner). Bir adım hata verirse nedenini açıkla ve çözmeye çalış
   (ör. Homebrew yoksa kurulum komutunu kullanıcıya ver; şifre gereken adımları kullanıcının kendisi yapsın).
2. `.env` dosyasında `CARTESIA_API_KEY` ve `CARTESIA_VOICE` dolu değilse kullanıcıdan iste. Kullanıcı verince `.env`'e yaz
   (`chmod 600 .env`), anahtarı ekrana geri yazma, hiçbir dosyaya veya commit'e koyma. Sonra kısa bir test sesi üret:
   `python3 tools/cartesia_tts.py "Merhaba, bu bir ses denemesidir." output/ses_test.wav` ve kullanıcının dinlemesi için yolunu söyle.
3. Bitince kullanıcıya şunu söyle: "Kurulum tamam. Ders notunuzu (PDF) bu sohbete sürükleyin ve hangi sayfaları/konuyu istediğinizi yazın."

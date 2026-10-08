# Ayrı video — x² + 1 = 0: kökler nerede? Reel grafik ve karmaşık düzlemde 3B görünüm. Tamamı Cartesia. (seg, özet, display, spoken)
S = [
("a00","Giriş: x² + 1 = 0'ın kökleri ±i; ama grafikte neredeler?",
 "Herkese merhaba. $x^2+1=0$ denkleminin reel kökü yok, kökleri $\\pm i$. Bunu hepimiz ezberledik. Ama hiç sordunuz mu: bu kökler grafikte nerede? Parabol $x$ eksenini kesmiyorsa, $i$ nereden çıkıyor? Bugün bunu üç boyutta göreceğiz.",
 "Herkese merhaba. İks kare artı bir eşittir sıfır denkleminin reel kökü yok, kökleri artı eksi i. Bunu hepimiz ezberledik. Ama hiç sordunuz mu: bu kökler grafikte nerede? Parabol iks eksenini kesmiyorsa, i nereden çıkıyor? Bugün bunu üç boyutta göreceğiz."),
("a01","Reel grafik: y = x² + 1, tepe noktası (0,1), x eksenini kesmiyor.",
 "Önce tanıdık resim: $y=x^2+1$ parabolü. Tepe noktası $(0,1)$'de ve yukarı açılıyor. Yani grafik $x$ ekseninin hep üstünde kalıyor; hiçbir reel $x$ için $x^2+1$ sıfır olmuyor. Reel kök yok.",
 "Önce tanıdık resim: ye eşittir iks kare artı bir parabolü. Tepe noktası sıfır, bir noktasında ve yukarı açılıyor. Yani grafik iks ekseninin hep üstünde kalıyor; hiçbir reel iks için iks kare artı bir sıfır olmuyor. Reel kök yok."),
("a02","Cebir: i² = −1 ⇒ x = ±i kökler; reel eksende yer yok.",
 "Cebirle bakınca $x^2=-1$, ve $i^2=-1$ olduğu için kökler $x=i$ ve $x=-i$. Ama bu sayılar reel eksen üzerinde değil. Demek ki onları görmek için girdiyi genişletmemiz lazım: $x$ yerine karmaşık bir sayı koyacağız.",
 "Cebirle bakınca iks kare eşittir eksi bir, ve i kare eksi bir olduğu için kökler iks eşittir i ve iks eşittir eksi i. Ama bu sayılar reel eksen üzerinde değil. Demek ki onları görmek için girdiyi genişletmemiz lazım: iks yerine karmaşık bir sayı koyacağız."),
("a03","Girdi: z = a + bi; yatay düzlem: a reel ekseni, b sanal ekseni. Dikey eksen: çıktı.",
 "Girdi artık $z=a+bi$. Bu sayıyı bir düzlemde gösteriyoruz: yatayda reel kısım $a$, onun dik doğrultusunda sanal kısım $b$. Eski $x$ ekseni, bu düzlemde sadece $b=0$ doğrusu. Çıktıyı da yukarı doğru, üçüncü eksende göstereceğiz.",
 "Girdi artık ze eşittir a artı be i. Bu sayıyı bir düzlemde gösteriyoruz: yatayda reel kısım a, onun dik doğrultusunda sanal kısım be. Eski iks ekseni, bu düzlemde sadece be eşittir sıfır doğrusu. Çıktıyı da yukarı doğru, üçüncü eksende göstereceğiz."),
("a04","f(a+bi) = (a² − b² + 1) + 2ab·i; Re ve Im.",
 "Hesaplayalım: $f(z)=z^2+1=(a+bi)^2+1=a^2-b^2+1+2ab\\,i$. Çıktı da karmaşık; reel kısmı $a^2-b^2+1$, sanal kısmı $2ab$. Bir kök için ikisinin de aynı anda sıfır olması gerekiyor.",
 "Hesaplayalım: ze kare artı bir, a artı be i'nin karesi artı bir; bu da a kare eksi be kare artı bir, artı iki a be i. Çıktı da karmaşık; reel kısmı a kare eksi be kare artı bir, sanal kısmı iki a be. Bir kök için ikisinin de aynı anda sıfır olması gerekiyor."),
("a05","3B: Re f = a² − b² + 1 yüzeyi (semer). b = 0 kesiti: eski parabol.",
 "Şimdi reel kısmı yükseklik olarak çizelim: $\\mathrm{Re}\\,f=a^2-b^2+1$. Bu bir semer yüzeyi. Reel eksen doğrultusunda, yani $b=0$ kesitinde, karşımıza tanıdık parabol çıkıyor: $a^2+1$. Bu yönde yüzey yukarı kıvrılıyor ve sıfıra hiç inmiyor.",
 "Şimdi reel kısmı yükseklik olarak çizelim: a kare eksi be kare artı bir. Bu bir semer yüzeyi. Reel eksen doğrultusunda, yani be eşittir sıfır kesitinde, karşımıza tanıdık parabol çıkıyor: a kare artı bir. Bu yönde yüzey yukarı kıvrılıyor ve sıfıra hiç inmiyor."),
("a06","a = 0 kesiti: 1 − b², aşağı açılan 'hayalet parabol' sanal eksen yönünde.",
 "Ama semerin öbür yönüne bakalım: $a=0$ kesiti, yani sanal eksen doğrultusu. Orada yükseklik $1-b^2$. Bu, aşağı açılan bir parabol! Eski parabolümüzle aynı tepe noktasından çıkıyor, ama ona dik bir düzlemde ve ters yönde açılıyor. Buna hayalet parabol diyebiliriz.",
 "Ama semerin öbür yönüne bakalım: a eşittir sıfır kesiti, yani sanal eksen doğrultusu. Orada yükseklik bir eksi be kare. Bu, aşağı açılan bir parabol! Eski parabolümüzle aynı tepe noktasından çıkıyor, ama ona dik bir düzlemde ve ters yönde açılıyor. Buna hayalet parabol diyebiliriz."),
("a07","Hayalet parabol sıfır düzlemini b = ±1'de keser; orada Im = 2ab = 0 ⇒ f(±i) = 0.",
 "Hayalet parabol sıfır düzlemini $b=\\pm1$'de kesiyor. Bu noktalarda $a=0$ olduğu için sanal kısım $2ab$ de sıfır. Yani $f$'nin tamamı sıfır: $f(i)=0$ ve $f(-i)=0$. İşte kökler: sanal eksen üzerinde, $\\pm i$ noktalarında.",
 "Hayalet parabol sıfır düzlemini be eşittir artı eksi birde kesiyor. Bu noktalarda a sıfır olduğu için sanal kısım iki a be de sıfır. Yani fe'nin tamamı sıfır: fe i sıfır ve fe eksi i sıfır. İşte kökler: sanal eksen üzerinde, artı eksi i noktalarında."),
("a08","|f| yüzeyi: |z² + 1| = |z − i||z + i|; yüzey yalnız ±i'de yere değer.",
 "Bir başka bakış: yükseklik olarak $|f(z)|$'yi, yani çıktının büyüklüğünü çizelim. $|z^2+1|=|z-i|\\,|z+i|$ olduğu için bu yüzey her yerde pozitif, sadece iki noktada yere değiyor: tam $z=i$ ve $z=-i$ üzerinde. Yüzeyin içine iki huni gibi çöken bu noktalar, köklerin ta kendisi.",
 "Bir başka bakış: yükseklik olarak fe'nin mutlak değerini, yani çıktının büyüklüğünü çizelim. Ze kare artı birin mutlak değeri, ze eksi i ile ze artı i'nin mutlak değerlerinin çarpımı olduğu için bu yüzey her yerde pozitif, sadece iki noktada yere değiyor: tam ze eşittir i ve ze eşittir eksi i üzerinde. Yüzeyin içine iki huni gibi çöken bu noktalar, köklerin ta kendisi."),
("a09","Neden reel grafik kesmez: kökler reel eksene dik doğrultuda; tepe yüksekliği 1 ↔ kökler ±1·i.",
 "Şimdi resim netleşti: reel grafik $x$ eksenini kesmiyor, çünkü kökler reel eksenin üstünde değil, ona dik doğrultuda duruyor. Hatta bir ilişki de var: parabolün tepe yüksekliği bir, kökler de sanal eksende bir birim uzakta.",
 "Şimdi resim netleşti: reel grafik iks eksenini kesmiyor, çünkü kökler reel eksenin üstünde değil, ona dik doğrultuda duruyor. Hatta bir ilişki de var: parabolün tepe yüksekliği bir, kökler de sanal eksende bir birim uzakta."),
("a10","Genelleme: (x − h)² + k, k > 0 ⇒ kökler h ± i√k. Örnek x² − 4x + 13 = (x−2)² + 9 ⇒ 2 ± 3i.",
 "Bu her zaman böyle. $y=(x-h)^2+k$ ve $k>0$ ise kökler $h\\pm i\\sqrt k$: hayalet parabol $a=h$ düzleminde aşağı açılıyor ve sıfırı $\\pm\\sqrt k$'da kesiyor. Örneğin $x^2-4x+13=(x-2)^2+9$; tepe noktası $(2,9)$, kökler $2\\pm3i$. Grafiğe bakıp kökleri okuyabiliyorsunuz.",
 "Bu her zaman böyle. Ye eşittir iks eksi ha'nın karesi artı ka, ve ka pozitifse, kökler ha artı eksi i karekök ka. Hayalet parabol a eşittir ha düzleminde aşağı açılıyor ve sıfırı artı eksi karekök ka'da kesiyor. Örneğin iks kare eksi dört iks artı on üç, iks eksi ikinin karesi artı dokuz; tepe noktası iki, dokuz; kökler iki artı eksi üç i. Grafiğe bakıp kökleri okuyabiliyorsunuz."),
("a11","Kapanış.",
 "Özetle: karmaşık kökler hayali şeyler değil; grafiği bir boyut genişletince, reel eksenin dik doğrultusunda gerçekten oradalar. Bir sonraki videoda görüşmek üzere.",
 "Özetle: karmaşık kökler hayali şeyler değil; grafiği bir boyut genişletince, reel eksenin dik doğrultusunda gerçekten oradalar. Bir sonraki videoda görüşmek üzere."),
]
import json
out={k:{'summary':su,'display':d,'spoken':sp,'voice':'cartesia'} for k,su,d,sp in S}
json.dump(out,open('studio/script.json','w'),ensure_ascii=False,indent=1)
json.dump({k:sp for k,su,d,sp in S},open('narration_segments.json','w'),ensure_ascii=False,indent=1)
open('docs/NARRATION.md','w').write('# x² + 1 = 0: kökler nerede?\n\n'+'\n'.join(f"## {k} · {su}\n{sp}\n" for k,su,d,sp in S))
print(len(S),'sahne;',sum(len(sp) for *_,sp in S),'karakter; ~',round(sum(len(sp.split()) for *_,sp in S)/2.3/60,1),'dk')

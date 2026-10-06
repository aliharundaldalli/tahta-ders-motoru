# Ardışık integraller — Video 2

## a00 · Başlık: Ardışık İntegraller.
Herkese merhaba. Geçen derste iki katlı integrali bir limit olarak tanımladık ve hacim olarak ne anlama geldiğini gördük. Ama bu limiti her seferinde elle hesaplamak pratik değil. Bugün iki katlı integrali, tek değişkenli iki integrale dönüştürerek nasıl hesaplayacağımızı göreceğiz.

## a01 · Dikey basit bölge üzerinde I_R tanımı: önce y, sonra x.
Fe, dikey basit bir er bölgesinde sürekli olsun: iks, a ile be arasında; ye ise ge bir iks ile ge iki iks arasında. Önce ye'ye göre, ge bir iks'ten ge iki iks'e kadar; sonra iks'e göre, a'dan be'ye kadar integral alıyoruz. Bu ifadeye ardışık integral diyor ve ı er ile gösteriyoruz. Yani önce içteki integrali ye'ye göre alıyoruz, sonra çıkan sonucu iks'e göre integre ediyoruz.

## a02 · Yatay basit bölge üzerinde J_R: önce x, sonra y; alternatif yazım ∫dx ∫ f dy.
Yatay basit bölgede de sıra tersine döner: önce iks'e göre, ha bir ye'den ha iki ye'ye kadar; sonra ye'ye göre, ce'den de'ye kadar. Bunu je er ile gösteriyoruz. Bu ifadeler bazen parantez kullanmadan da yazılır. Hangi yazımı görürseniz görün, mantık aynı: içten dışa doğru ilerliyoruz.

## a03 · Uyarı kutusu: içteki integralde diğer değişken sabit.
Burada en önemli nokta şu: içteki integrali alırken diğer değişken bir sabit gibi davranır. Ye'ye göre integral alırken iks sadece bir sayıdır. Kısmi türevde yaptığımızın tam tersi gibi düşünebilirsiniz.

## a04 · Örnek 1 soru: f = 2xy + 3y², R = [0,2]×[0,1]; dikdörtgen çizimi.
İlk örneğimiz: fe iks ye eşittir iki iks ye artı üç ye kare, bölge de iks'in sıfırla iki, ye'nin sıfırla bir arasında olduğu dikdörtgen. Bu bölge hem dikey hem de yatay basit, yani iki sırayla da hesaplayabiliriz. İkisini de yapıp sonuçları karşılaştıralım.

## a05 · I_R: içte y'ye göre → x + 1; dışta ∫_0^2 (x+1)dx = 4.
Önce ı er. İçteki integral ye'ye göre: iki iks ye'nin integrali iks ye kare, üç ye karenin integrali ye küp. Ye'yi sıfırdan bire kadar koyunca iks artı bir kalıyor. Şimdi bunu iks'e göre sıfırdan ikiye integre ediyoruz: iks kare bölü iki artı iks; iki'yi koyunca iki artı iki, yani dört.

## a06 · J_R: içte x'e göre → 4y + 6y²; dışta ∫_0^1 = 2 + 2 = 4.
Şimdi sırayı değiştirelim. İçte iks'e göre: iki iks ye'nin integrali iks kare ye, üç ye karenin integrali üç iks ye kare. İks'i sıfırdan ikiye koyunca dört ye artı altı ye kare buluyoruz. Dışta ye'ye göre: iki ye kare artı iki ye küp; bir'i koyunca yine dört.

## a07 · Soru: iki sıra aynı sonucu verdi — tesadüf mü?
İki farklı sıra, aynı sonuç. Bu bir tesadüf mü? Bir örnek daha yapalım, bu sefer bölge dikdörtgen olmasın.

## a08 · Örnek 2: f = x + 2y, bölge y = x² altında, 0 ≤ x ≤ 1; şekil.
İkinci örnek: fe eşittir iks artı iki ye, bölge de ye eşittir iks kare parabolünün altında, iks sıfırla bir arasında kalan kısım. Dikey basit olarak ye, sıfırla iks kare arasında. Yatay basit olarak bakarsak ye sıfırla bir arasında, iks ise karekök ye'den bire kadar gidiyor.

## a09 · I_R = ∫_0^1 (x³ + x⁴) dx = 1/4 + 1/5 = 9/20.
Önce ı er. İçte ye'ye göre integral alınca iks ye artı ye kare geliyor; ye'yi sıfırdan iks kareye koyunca iks küp artı iks üzeri dört kalıyor. Dışta sıfırdan bire integral: dörtte bir artı beşte bir, yani yirmide dokuz.

## a10 · J_R = ∫_0^1 (1/2 + 3y/2 − 2y^{3/2}) dy = 9/20.
Şimdi je er. İçte iks'e göre integral: iks kare bölü iki artı iki iks ye. Sınırları, karekök ye'den bire koyunca bir bölü iki artı üç ye bölü iki eksi iki ye üzeri üç bölü iki kalıyor. Dışta sıfırdan bire integral alınca: yarım artı dörtte üç eksi beşte dört; bu da yine yirmide dokuz.

## a11 · Teorem (Fubini): yatay basit bölgede sürekli f için ∬_R f dA = J_R.
Bunun nedeni şu teorem: fe, yatay basit bir er bölgesinde sürekliyse, er üzerindeki iki katlı integral, je er ardışık integraline eşittir. Yani tanımdaki limiti hiç hesaplamadan, iki tane tek değişkenli integralle sonucu bulabiliyoruz.

## a12 · İspat fikri: J(ỹ) = ∫ f(x,ỹ) dx kesit alanı; 3D cismin y = ỹ düzlemiyle kesiti.
İspatın fikri çok güzel. Fe pozitif olsun ve içteki integrale je ye diyelim. Ye'yi sabit bir değere koyduğumuzda bu integral, cismi o düzlemle kestiğimizde ortaya çıkan kesitin alanını veriyor.

## a13 · Kesitler × kalınlık toplamı → hacim V; ∬ = V = J_R.
Şimdi bu kesitleri ince dilimler gibi düşünelim. Her dilimin hacmi yaklaşık olarak kesit alanı çarpı kalınlık. Dilimleri topladığımızda, kalınlık sıfıra giderken cismin hacmini elde ediyoruz. Bu hacim aynı zamanda iki katlı integral olduğu için, ikisi eşit oluyor.

## a14 · Dikey basit için I_R; basit bölgede ∬ = I_R = J_R.
Aynı fikirle dikey basit bölge için de iki katlı integralin ı er'ye eşit olduğunu gösterebiliriz. Bölge hem dikey hem yatay basitse ikisi birden geçerli: iki katlı integral, ı er'ye de je er'ye de eşit. Örneklerimizde iki sıranın aynı sonucu vermesinin nedeni tam olarak bu.

## a15 · Not: sıra seçimi işi kolaylaştırır; dA = dx dy gösterimi.
Pratikte bunun anlamı şu: hangi sırayla integral alacağımızı seçebiliyoruz. Bazen bir sıra çok kolay, diğeri çok zahmetli olabilir. Bundan sonra iki katlı integrali de a yerine de iks de ye yazarak da göstereceğiz.

## a16 · Örnek 3 soru: R, x²+y²=4 çemberi ile x²+4y²=4 elipsi arası; ∬ x² dA. Şekil.
Son örneğimiz biraz daha zorlu. Er, iks kare artı ye kare eşittir dört çemberi ile iks kare artı dört ye kare eşittir dört elipsi arasında kalan bölge olsun. Bu bölge üzerinde iks karenin integralini hesaplayalım. Bölgenin ortasında elips var; bu yüzden onu üst ve alt olmak üzere iki parçaya ayıracağız.

## a17 · Üst parça: √(4−x²)/2 ≤ y ≤ √(4−x²); içte y'ye göre → x²·½√(4−x²); alt parça aynı; toplam ∫_{−2}^{2} x²√(4−x²)dx.
Üst parçada iks, eksi iki ile iki arasında; ye ise elipsten çembere, yani karekök dört eksi iks karenin yarısından, karekök dört eksi iks kareye gidiyor. İçteki integral, iks kare çarpı karekök dört eksi iks karenin yarısı. Alt parça simetrik olduğu için aynı katkıyı yapıyor. Toplamda, eksi ikiden ikiye iks kare çarpı karekök dört eksi iks karenin integrali kalıyor.

## a18 · x = 2 sin t: ∫ = 16∫ sin²t cos²t dt = 4∫ sin²2t dt = 2∫(1−cos4t)dt = 2π.
Burada iks eşittir iki sinüs te dönüşümü yapalım; de iks eşittir iki kosinüs te de te. İntegral, on altı çarpı sinüs kare te kosinüs kare te'nin integraline dönüşüyor. Bu da dört çarpı sinüs kare iki te'nin integrali; o da iki çarpı bir eksi kosinüs dört te'nin integrali. Kosinüslü terim sıfır veriyor, geriye iki pi kalıyor. Yani aradığımız integral iki pi.

## a19 · Özet ve kapanış.
Bugün ardışık integralleri, iki sırayla hesaplamayı ve bu iki sıranın neden aynı sonucu verdiğini gördük. Artık iki katlı integralleri rahatça hesaplayabiliyoruz. Bir sonraki derste üç katlı integrale geçeceğiz. Görüşmek üzere.

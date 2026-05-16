# HAVALİMANI BAGAJ OTOMASYONU SİMÜLASYON SİSTEMİ (ABASS)
## Kapsamlı Teknik Rapor ve Proje Dokümantasyonu

**Geliştirici:** Furkan Fatih Çiftçi  
**Öğrenci Numarası:** 22430070037  
**Bölüm:** Havalimanı Otomasyon Sistemleri / Bilgisayar Programcılığı  
**Ders:** Havalimanı Operasyonları ve Simülasyonu

---

## 1. GİRİŞ: SİSTEMİN AMACI VE DİJİTAL İKİZ (DIGITAL TWIN) KAVRAMI
Havalimanı Bagaj Otomasyonu Simülasyon Sistemi (ABASS), modern havalimanı terminallerinin en kritik ve hata kabul etmeyen süreçlerinden biri olan "Bagaj İşleme Sistemi"nin (BHS - Baggage Handling System) dijital bir kopyasıdır. 

Günümüzde havalimanı yöneticileri, fiziksel hatlar üzerinde deneme yanılma yapamazlar. Bir X-Ray cihazını kapatmanın veya bagaj bandı hızını değiştirmenin gerçek dünyadaki maliyeti rötarlar, kaybolan bagajlar ve binlerce dolarlık zarardır. ABASS, bu riskleri ortadan kaldırarak yöneticilere **sıfır riskli bir test ortamı** sunar. Proje, sadece bir görselleştirme değil, arkasındaki güçlü matematiksel modellerle bir **Karar Destek Sistemi** olarak kurgulanmıştır.

---

## 2. TEKNOLOJİK MİMARİ VE SEÇİLEN TEKNOLOJİLERİN ANALİZİ

### 2.1. Backend: Simülasyonun Kalbi ve SimPy Mantığı
Backend katmanında Python 3.10+ ve **SimPy** kütüphanesi kullanılmıştır. SimPy, "Discrete Event Simulation" (Ayrık Olay Simülasyonu) alanında endüstri standartlarını belirleyen bir kütüphanedir.

*   **Ayrık Olay Simülasyonu Nedir?:** Standart bir döngüden farklı olarak, sadece olayların (bagaj girişi, tarama bitişi vb.) gerçekleştiği anlara odaklanır. Bu, sistemin binlerce bagajı aynı anda, performans kaybı yaşamadan ve zamanı gerçekçi bir şekilde bükerek işlemesini sağlar.
*   **Kaynak Yönetimi (Resources):** X-Ray tarayıcıları ve ayıştırma robotları kısıtlı kapasiteye sahip kaynaklar (`simpy.Resource`) olarak modellenmiştir. Bu sayede, aynı anda 3 tarayıcı varsa 4. bagajın matematiksel olarak sıraya girmesi ve saniye saniye bekleme süresinin kaydedilmesi sağlanır.

### 2.2. FastAPI ve SSE (Server-Sent Events) İle Canlı Veri Akışı
Proje, verileri frontend'e aktarmak için standart HTTP istekleri yerine **SSE** teknolojisini kullanır.
*   **Gerçek Zamanlılık:** Simülasyonun her 10 dakikalık (simülasyon zamanı) dilimi, backend tarafından JSON paketine dönüştürülür ve tarayıcıya "itilir".
*   **Neden SSE?:** WebSocket'e göre daha az kaynak tüketir ve tek yönlü veri akışı (sunucudan istemciye) için idealdir. Bu sayede kullanıcı, "Simülasyonu Çalıştır" dediği anda grafiklerin canlı bir yayın gibi aktığını görür.

### 2.3. Frontend: React ve Recharts İle Veri Görselleştirme
Arayüz tarafında **React 19** ve **TypeScript** tercih edilmiştir.
*   **Modüler Yapı:** Her bir grafik, KPI kartı ve parametre slider'ı bağımsız birer bileşendir. Bu, sistemin bakımını kolaylaştırır.
*   **Recharts Performansı:** Binlerce veri noktasını içeren zaman serisi grafikleri, Recharts'ın SVG tabanlı optimizasyonu sayesinde kasmadan ve akıcı bir şekilde render edilir.
*   **Glassmorphism Tasarımı:** Kullanıcı arayüzü, modern karanlık mod ve şeffaf katmanlarla tasarlanarak "premium" bir yazılım hissi verilmiştir.

---

## 3. MATEMATİKSEL MODELLEME VE İSTATİSTİKSEL DAĞILIMLAR

### 3.1. Bagaj Geliş Süreçleri ve Poisson Dağılımı
Simülasyonda en kritik noktalardan biri "gerçekçilik"tir. Bagajlar sisteme saat gibi tık tık ve düzenli aralıklarla gelmez. Bazı anlarda yığılma olur, bazı anlarda boşluklar oluşur.
*   **Poisson Süreci:** Bagaj varışları bir Poisson süreci olarak modellenmiştir.
*   **Üstel Dağılım (Exponential Distribution):** Bagajlar arası varış süresi (Inter-arrival time), Python'daki `random.expovariate` fonksiyonu ile belirlenir. Bu, sistemin bazen stres altında kalmasını, bazen de rahatlamasını sağlayarak gerçek hayatı %100 taklit eder.

### 3.2. Operasyonel Süreler ve Standartlar
Simülasyonda kullanılan süreler rastgele değil, gerçek havalimanı operasyon standartlarına dayanır:
*   **X-Ray Tarama:** 8 ile 20 saniye arası (Rastgele üniform dağılım).
*   **Sıralama Robotu:** 4 ile 10 saniye arası işlem süresi.
*   **Gecikme Eşiği (8 Dakika):** Havalimanı standartlarına göre bir bagajın sisteme girişi ile kapıya ulaşması arasındaki süre 8 dakikayı geçerse, bu bagaj "gecikmeli" (delayed) statüsüne alınır.

---

## 4. GÖRSEL VE FONKSİYONEL BİLEŞEN ANALİZİ (3 TEMEL PANEL)

Projenin arayüzündeki görseller, sistemin çalışma mantığının görsel kanıtlarıdır.

### 4.1. Parametre Yönetim Paneli (`parametreler.png`)
Bu panel, yöneticinin sistem üzerindeki mutlak hakimiyetini temsil eder. Kullanıcı, simülasyonu başlatmadan önce 4 ana parametre üzerinden senaryosunu kurgular:

1.  **Tarayıcı Sayısı (X-Ray Kapasitesi):** Sistemin ana işlem gücünü belirler. Cihaz sayısı artırıldığında birim zamanda taranan bagaj sayısı artar, ancak operasyonel maliyet yükselir.
2.  **Aktif Uçuş Sayısı (Kapı Dağılımı):** Bagajların kaç farklı kapıya (Gate) yönlendirileceğini belirler. Uçuş sayısı arttıkça, ayıştırma (sorting) robotunun üzerindeki yük ve karmaşıklık artar.
3.  **Bagaj Geliş Hızı (Dakikadaki Yük):** Sisteme binen yük miktarını belirler (Örn: Dakikada 10 bagaj). Sistemin "Stres Testi" ve "Çökme Noktası" (Break-point) analizi burada yapılır.
4.  **Simülasyon Süresi (Vardiya Planlama):** Operasyonun ne kadar uzun süre (Örn: 480 dk / 8 saat) takip edileceğini belirler. Bu, günlük performans tahminleri için kritiktir.
5.  **Simülasyonu Çalıştır Butonu (Motor Tetikleyici):** Butona basıldığı anda, backend tarafında yeni bir asenkron `simpy.Environment` oluşturulur. Belirlenen parametreler matematiksel modele aktarılır ve veri akışı (SSE) başlar.

### 4.2. Performans Metrikleri ve KPI Kartları (`simülasyon_sonucları.png`)
Sistemin operasyonel başarısı, arayüzdeki 8 ana gösterge (KPI) üzerinden saniye saniye takip edilir. Her bir kart, havalimanı yöneticisi için farklı bir stratejik veri sunar:

1.  **Toplam Bagaj (Total Bags):** Simülasyonun başladığı andan itibaren sisteme giriş yapan toplam bagaj sayısıdır. Sistemin o anki yük hacmini (Volume) gösterir.
2.  **İşlenen Bagaj (Processed Bags):** Tüm süreçleri (X-Ray, Sıralama, Kapı) başarıyla tamamlayan bagaj sayısıdır. Sistemin toplam çıktısını (Throughput) temsil eder.
3.  **Gecikmiş Bagaj (Delayed Bags):** Belirlenen 8 dakikalık kritik süreyi aşan bagajların sayısıdır. Bu değerin artması, operasyonel bir başarısızlığın göstergesidir.
4.  **Gecikme Oranı (Delay Rate %):** Toplam bagaj içindeki gecikmeli bagajların yüzdesidir. %5'in altı genellikle "Sistem Sağlıklı" olarak kabul edilir.
5.  **Kuyruk Bekleme (Wait Time):** Bir bagajın sadece X-Ray cihazı önünde, sıranın kendisine gelmesi için harcadığı süredir. Darboğazların en net ölçüsüdür. 1 dakikanın üzeri "Cihaz Sayısını Artır" sinyalidir.
6.  **Uçtan Uca Süre (Lead Time):** Bir bagajın sisteme girdiği an ile uçağa yüklendiği an arasındaki toplam süredir. Maksimum ve ortalama değerler üzerinden sistem hızı ölçülür.
7.  **Tarayıcı Kullanımı (Utilization %):** Cihazların doluluk oranıdır. %70-80 arası "İdeal Verimlilik", %90 üzeri "Aşırı Yük/Arıza Riski", %30 altı ise "İsraf/Gereksiz Enerji Tüketimi" demektir.
8.  **Başarı Oranı (Success Rate %):** Zamanında uçağa ulaştırılan bagajların tüm bagajlara oranıdır. %100 olması, havalimanı operasyonunun kusursuz işlediğini kanıtlar.

### 4.3. Zaman Serisi Analizi ve Grafik Okuma (`zaman_serisi_analizi.png`)
Bu grafik, sistemin "röntgeni"dir:
*   **Turuncu Çizgi (Kuyruk):** Bu çizgideki yükselişler (pikler), bagaj geliş hızının tarayıcı hızını geçtiği anları gösterir.
*   **Mavi Çizgi (İşlenen Bagaj):** Sistemin toplam çıktısını gösterir.
*   **Korelasyon:** Turuncu çizgi (kuyruk) çok yüksek olduğunda, mavi çizginin eğimi (işlem hızı) sabit kalırsa bu bir "kapasite yetersizliği" kanıtıdır. Eğer turuncu çizgi düşerken mavi çizgi hızla yükseliyorsa sistem darboğazdan başarıyla çıkmış demektir.

---

## 5. SİSTEMİN KARAR DESTEK SÜRECİNE KATKISI
ABASS projesi sadece bir kod yığını değil, bir yönetim aracıdır. Sistem sayesinde şu sorulara net yanıtlar verilir:
1.  **Kapasite Artırımı:** "Bayram tatili gibi yoğun dönemlerde 2 ekstra X-Ray cihazı kuyrukları % kaç azaltır?"
2.  **Maliyet Analizi:** "Daha hızlı (ama pahalı) bir ayıştırma robotu almak, toplam bagaj geçiş süresini anlamlı ölçüde kısaltır mı?"
3.  **Risk Tahmini:** "Bir cihaz arızalanıp devre dışı kaldığında bagajların uçağa yetişme oranı kaça düşer?"

---

## 6. SONUÇ
Havalimanı Bagaj Otomasyonu Simülasyon Sistemi; modern yazılım mimarisi (React/FastAPI), güçlü matematiksel modeller (SimPy/Poisson) ve estetik veri görselleştirme (Recharts/Tailwind) ile karmaşık bir fiziksel süreci kontrol edilebilir hale getirmiştir. Bu çalışma, endüstriyel otomasyonun dijitalleşme sürecinde verinin ne kadar kritik bir rol oynadığını göstermektedir.

---
<div align="center">
  <p><b>Havalimanı Operasyonları ve Simülasyonu Dersi Bitirme Projesi</b></p>
  <p>© 2024 Furkan Fatih Çiftçi - Tüm Hakları Saklıdır.</p>
</div>

# Havalimanı Bagaj Otomasyonu Simülasyon Sistemi - Proje Raporu

Bu proje, bir havalimanındaki bagaj kontrol ve yönlendirme süreçlerinin ayrık olay simülasyonu (Discrete-Event Simulation) yöntemiyle modellenmesi ve sonuçların dinamik bir web arayüzü üzerinden görselleştirilmesini amaçlamaktadır.

---

## 1. Proje Amacı ve Kapsamı

Havalimanı operasyonlarında en kritik darboğazlardan biri (bottleneck) bagaj kontrol ve ayıştırma süreçleridir. Bu simülasyon, sistem operatörlerine şu konularda yardımcı olmayı hedefler:
- **Kuyruk Yönetimi:** X-Ray tarayıcı sayısının operasyonel verimliliğe etkisini analiz etmek.
- **Kapasite Planlama:** Beklenen bagaj yoğunluğuna göre personel ve cihaz planlaması yapmak.
- **Performans Metrikleri:** Ortalama bekleme süresi, sistemde geçirilen süre ve tarayıcı doluluk oranlarını ölçmek.

---

## 2. Teknik Mimari

Proje, modern bir tam yığın (full-stack) mimarisi üzerine inşa edilmiştir:

### 2.1. Simülasyon Motoru (SimPy)
Python tabanlı **SimPy** kütüphanesi kullanılarak her bagajın sistemdeki yaşam döngüsü modellenmiştir.
- **Poisson Dağılımı:** Bagaj girişleri rastgele aralıklarla, gerçek hayat verilerine uygun şekilde Poisson dağılımı ile oluşturulur.
- **Paylaşımlı Kaynaklar:** X-Ray cihazları `simpy.Resource` olarak tanımlanmıştır ve aynı anda yalnızca belirli bir sayıda bagaja hizmet verebilir.
- **Akış Adımları:** Bagajın girişi, kuyrukta bekleyişi, taranması, ayıştırılması ve uçağa yüklenmesi adımları simüle edilir.

### 2.2. Arka Plan (Backend - FastAPI)
- Simülasyon sonuçları, **Server-Sent Events (SSE)** teknolojisi ile gerçek zamanlı olarak frontend'e aktarılır.
- **Pydantic** ile parametre doğrulama ve hata kontrolü yapılır.

### 2.3. Ön Yüz (Frontend - React & Recharts)
- **React + TypeScript** ile geliştirilen arayüz, simulasyonu adım adım takip etmeyi sağlar.
- **Recharts** kütüphanesi ile kuyruk uzunluğu ve işlem hızı canlı olarak grafiklere dökülür.

---

## 3. Simülasyon Parametreleri

Kullanıcılar arayüz üzerinden aşağıdaki parametreleri değiştirerek farklı senaryoları test edebilirler:
- **Tarayıcı Sayısı (X-Ray):** Sistemin ana kapasite belirleyicisi.
- **Aktif Uçuş Sayısı:** Bagajların dağılım göstereceği kapı sayısını simüle eder.
- **Bagaj Geliş Hızı (Bagaj/Dakika):** Sisteme binen yük yoğunluğunu belirler.
- **Simülasyon Süresi (Dakika):** Operasyonun ne kadar süre boyunca izleneceğini ayarlar.

---

## 4. Analiz ve İzleme (Dashboard)

Simülasyon çalışmaya başladığında aşağıdaki metrikler anlık olarak hesaplanır:
- **Kuyruk Durumu:** X-Ray önünde bekleyen bagaj sayısı.
- **İşlenen Toplam Bagaj:** Sistemin o ana kadarki throughput (çıktı) performansı.
- **Darboğaz Tespiti:** Tarayıcıların doluluk oranı (Utilization) %100'e yaklaştığında sistemin nasıl "çöktüğü" ve kuyruğun katlanarak büyüdüğü grafiklerle gözlemlenebilir.

---

## 5. Kurulum ve Çalıştırma

### 5.1. Gereksinimler
- Python 3.10+
- Node.js & npm

### 5.2. Çalıştırma Talimatları

**Backend:**
```bash
cd backend
python -m pip install -r requirements.txt
python -m uvicorn main:app --reload --port 8001
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```

Uygulamayı tarayıcıda `http://localhost:5173` adresinde görebilirsiniz. API varsayılan olarak `http://127.0.0.1:8001` üzerinden iletişim kurar.

---

## 6. Sonuç

Bu çalışma; karmaşık sistemlerin matematiksel modellemesinin, gerçek zamanlı veri akışı ve interaktif görselleştirme ile birleştiğinde operasyonel karar destek süreçleri için ne kadar güçlü bir araç olabileceğini göstermektedir.

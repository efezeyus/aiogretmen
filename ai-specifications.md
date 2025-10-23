# Yapay Zeka Öğretmen - AI Modülü Teknik Şartnamesi

Bu doküman, Yapay Zeka Öğretmen projesinin yapay zeka modülünün teknik şartnamesini, işlevlerini ve entegrasyonunu tanımlamaktadır.

## 1. Genel Bakış

Yapay Zeka Öğretmen uygulamasının AI modülü, öğrencilere kişiselleştirilmiş eğitim içeriği sunmak, müfredat PDFlerini işlemek ve doğal dil etkileşimiyle soruları cevaplamak üzere tasarlanmıştır.

### 1.1. Temel İşlevler

- Doğal dil anlama ve üretme
- PDF formatındaki müfredat dokümanlarını işleme ve bilgi çıkarımı
- Öğrenci sorularını anlama ve cevaplama
- Kişiselleştirilmiş eğitim içeriği oluşturma
- Öğrenci ilerleme ve anlama düzeyini tespit etme
- Farklı zorluk seviyelerinde içerik ve soru üretimi

## 2. Yapay Zeka Bileşenleri

### 2.1. Dil Modeli

- **Temel Model**: Deepseek veya eşdeğeri büyük dil modeli
- **Fine-tuning Yaklaşımı**: Türkçe eğitim içeriği ve müfredat bilgisi üzerinde ince ayar
- **Bağlam Penceresi**: Uzun diyaloglar ve içerik için minimum 8K token desteği
- **Çoklu Dil Desteği**: Öncelikli olarak Türkçe, ikincil olarak İngilizce

### 2.2. Müfredat İşleme Modülü

- **PDF İşleme**: Yapılandırılmış ve yapılandırılmamış müfredat dokümanlarını analiz edebilme
- **İçerik Çıkarımı**: Konu başlıkları, alt başlıklar, öğrenme hedefleri ve içerik hiyerarşisini çıkarma
- **İçerik İndeksleme**: Vektör veritabanı kullanarak aranabilir ve ilişkilendirilebilir içerik oluşturma
- **Görsel Tanıma**: PDF içindeki görselleri, diyagramları ve matematiksel formülleri anlama

### 2.3. Öğrenci Modelleme Sistemi

- **Bilgi Durum Takibi**: Öğrencinin her konu için bilgi durumunu modelleme
- **Zayıf Noktaları Tespit**: Öğrencinin zorlandığı konuları tespit etme
- **Öğrenme Stili Tanıma**: Öğrencinin öğrenme stilini analiz etme (görsel, işitsel, vb.)
- **İlerleme Analizi**: Zaman içinde öğrencinin gelişimini analiz etme

### 2.4. İçerik Üretim Motoru

- **Konu Anlatımı**: Öğrenci seviyesine göre konuları açıklama
- **Soru Üretimi**: Farklı zorluk seviyelerinde özgün sorular oluşturma
- **Geri Bildirim**: Öğrenci cevaplarına detaylı geri bildirim sağlama
- **Örnek ve Analoglar**: Konuyu pekiştirmek için örnekler ve benzetmeler üretme

### 2.5. Diyalog Sistemi

- **Doğal Dil Etkileşimi**: Doğal konuşma akışında soru-cevap desteği
- **Bağlam Farkındalığı**: Önceki konuşma geçmişini dikkate alma
- **Öğretmen Karakteri**: Erkek/kadın öğretmen kişiliği ve hitap şekli
- **Sokratik Öğretim**: Direk cevap yerine düşündürücü sorularla yönlendirme

## 3. Teknik Mimari

### 3.1. Altyapı

- **Model Hosting**: Düşük gecikme süreli, yüksek erişilebilirlikli bulut altyapısı
- **Ölçeklenebilirlik**: Otomatik ölçeklendirme ile yoğun kullanım dönemlerini yönetme
- **Yedeklilik**: Kesintisiz hizmet için çoklu bölge dağıtımı
- **Önbellek**: Sık sorulan sorular ve yaygın konu anlatımları için önbellek mekanizması

### 3.2. Entegrasyon

- **API Servisleri**: RESTful ve WebSocket API'lar ile diğer sistemlere entegrasyon
- **Web ve Mobil İstemciler**: Tüm platformlarla uyumlu iletişim protokolleri
- **Asenkron İşleme**: Uzun süren işlemler için kuyruk tabanlı mimari
- **Oturum Yönetimi**: Kullanıcı bağlamını koruma ve oturum devamlılığı

### 3.3. Veri Yapıları

- **Vektör Veritabanı**: Semantik arama için gömme (embedding) depolama
- **Bilgi Grafiği**: Müfredat konuları arasındaki ilişkileri modelleme
- **Kullanıcı Profilleri**: Öğrenci bilgi durumu ve tercihlerinin saklanması
- **Etkileşim Günlükleri**: Öğrenme analizi için etkileşim verilerinin kaydedilmesi

## 4. Güvenlik ve Etik

### 4.1. Veri Güvenliği

- **Kişisel Veri Minimizasyonu**: Sadece gerekli verilerin toplanması
- **Uçtan Uca Şifreleme**: Hassas verilerin şifrelenmesi
- **Veri Lokalizasyonu**: Yasal gerekliliklere uygun veri saklama politikaları
- **Erişim Kontrolleri**: Rol tabanlı erişim yönetimi

### 4.2. Etik Yapay Zeka

- **Adil ve Tarafsız İçerik**: Önyargılardan arındırılmış eğitim içeriği üretimi
- **Şeffaflık**: Yapay zekanın kararlarının açıklanabilirliği
- **İnsan Gözetimi**: Kritik içerikler için insan kontrolü mekanizması
- **Yaş Uygunluğu**: Farklı yaş grupları için uygun ton ve içerik

### 4.3. İçerik Güvenliği

- **Zararlı İçerik Filtreleme**: Uygunsuz veya yanıltıcı içerik önleme
- **Bilgi Doğruluğu**: Sunulan bilgilerin kaynaklara ve müfredata uygunluğu
- **İçerik Moderasyonu**: Öğrenci-AI etkileşimlerinin denetimi
- **Aşırı Yük Koruması**: Öğrencileri aşırı bilgi yükünden koruma

## 5. Performans ve Kalite Metrikleri

### 5.1. Teknik Performans

- **Yanıt Süresi**: Ortalama <3 saniye yanıt süresi
- **Eşzamanlı Kullanıcı**: Minimum 5,000 eşzamanlı kullanıcı desteği
- **Erişilebilirlik**: %99.9 hizmet süresi (uptime)
- **Ölçeklenebilirlik**: 1 milyon kullanıcıya kadar lineer ölçeklenebilme

### 5.2. Eğitim Kalitesi

- **Müfredat Uyumu**: MEB müfredatı ile %100 uyum
- **Doğruluk**: En az %95 bilgi doğruluğu
- **Pedagojik Etkinlik**: Öğrencilerin anlama seviyelerinde ölçülebilir artış
- **Kullanıcı Memnuniyeti**: %90 üzerinde öğrenci memnuniyet oranı

## 6. Geliştirme ve Dağıtım Planı

### 6.1. Geliştirme Aşamaları

1. **Müfredat İşleme Sistemi**: PDF işleme ve içerik çıkarımı (2 ay)
2. **Temel AI Modeli Entegrasyonu**: Büyük dil modeli entegrasyonu (1 ay)
3. **Fine-tuning ve Özelleştirme**: Müfredata özel ince ayar (3 ay)
4. **Öğrenci Modelleme Sistemi**: Kişiselleştirme altyapısı (2 ay)
5. **İçerik Üretim Motoru**: Ders anlatımı ve soru üretimi (3 ay)
6. **Diyalog Arayüzü**: Doğal dil etkileşim arayüzü (2 ay)
7. **Test ve Optimizasyon**: Performans iyileştirme (2 ay)

### 6.2. Kaynak Gereksinimleri

- **Hesaplama Kaynakları**: GPU/TPU tabanlı eğitim altyapısı
- **Depolama**: Büyük ölçekli vektör veritabanı
- **Ağ**: Düşük gecikme süreli CDN
- **İnsan Kaynakları**: AI araştırmacıları, ML mühendisleri, eğitim uzmanları

## 7. Lisanslama ve Yasal Konular

- **Model Lisansları**: Kullanılan AI modellerinin lisans gereksinimleri
- **Veri Koruma**: KVKK ve GDPR uyumluluğu
- **İçerik Hakları**: Üretilen içeriklerin telif hakkı durumu
- **Sorumluluk Sınırları**: Yapay zeka tarafından üretilen içerikler için sorumluluk

---

Bu şartname, projenin geliştirilmesi sırasında bir rehber görevi görecektir. Teknik gereksinimler ve tasarım, proje ilerledikçe güncellenebilir. 
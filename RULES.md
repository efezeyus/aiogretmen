# Yapay Zeka Öğretmen Uygulaması Kuralları

## 1. Proje Genel Tanımı

"Yapay Zeka Öğretmen" uygulaması, 2-12. sınıf öğrencileri için tasarlanmış yapay zeka destekli bir eğitim platformudur. Uygulama, öğrencilerin okul müfredatını takip etmelerini, anlamadıkları konuları pekiştirmelerini ve kişiselleştirilmiş eğitim desteği almalarını sağlar.

## 2. Teknik Altyapı

### 2.1. Platform Gereksinimleri
- **Web Uygulaması**: Tüm tarayıcılarla uyumlu, responsive tasarım
- **Mobil Uygulamalar**: 
  - iOS (en son 2 majör sürüm desteği)
  - Android (API 24 ve üzeri)
- **Sunucu Altyapısı**: Ölçeklenebilir bulut mimarisi 
- **Veritabanı**: Öğrenci verilerinin ve müfredat içeriklerinin depolanması için NoSQL/SQL hibrit yapı

### 2.2. Yapay Zeka Entegrasyonu
- İleri seviye NLP modelleri kullanılacak (GPT türevi modeller)
- Eğitim alanına özel ince ayar (fine-tuning) uygulanmış modeller
- Öğrenci seviyesine göre otomatik içerik zorluk ayarlaması
- Konuşma tabanlı etkileşim ve soruları anlama yeteneği

## 3. İçerik Yönetimi

### 3.1. Müfredat Desteği
- 2-12. sınıflar arası tüm zorunlu dersler
- MEB müfredatı ile tam uyumlu içerikler
- PDF formatında yüklenecek müfredat dokümanlarından otomatik içerik çıkarımı
- Konular, alt konular ve öğrenme hedefleri hiyerarşisi

### 3.2. İçerik Formatları
- Metin tabanlı açıklamalar
- İnteraktif görsel materyaller
- Konu anlatım videoları
- Alıştırma ve test soruları
- Oyunlaştırılmış öğrenme modülleri

## 4. Kullanıcı Deneyimi

### 4.1. Kullanıcı Arayüzü
- Yaş gruplarına göre uyarlanmış kullanıcı arayüzleri
- Sezgisel ve kolay kullanım
- Yüksek erişilebilirlik standartları (WCAG 2.1 AA)
- Hem erkek hem kadın öğretmen karakterleri/emojileri

### 4.2. Kişiselleştirme
- Öğrencinin sınıf seviyesine göre başlangıç noktası belirleme
- Öğrenme hızına göre içerik adaptasyonu
- Zayıf konuların tespiti ve pekiştirme önerileri
- Öğrenme stiline göre içerik sunumu (görsel, işitsel, pratik)

## 5. Öğrenci Takip Sistemi

### 5.1. İlerleme Takibi
- Konu bazlı ilerleme ölçümü
- Başarı istatistikleri ve grafikler
- Hatalı cevapların analizi
- Öğrenme zamanı ve sıklığı istatistikleri

### 5.2. Raporlama
- Öğrenci için ilerleme raporları
- Ebeveynler için detaylı durum raporları
- Aylık gelişim özeti
- Önerilen çalışma planları

## 6. Üyelik ve Ödeme Sistemi

### 6.1. Üyelik Modelleri
- 3 günlük ücretsiz deneme süresi
- Aylık üyelik planı
- Yıllık üyelik planı (indirimli)
- Sınıf/okul bazlı toplu üyelik seçenekleri

### 6.2. Ödeme Altyapısı
- Güvenli online ödeme sistemi
- Kredi kartı, banka kartı, havale desteği
- Abonelik yönetimi ve otomatik yenileme
- İptal ve iade süreçleri

## 7. Güvenlik ve Veri Koruma

### 7.1. Kullanıcı Verileri
- KVKK ve GDPR uyumlu veri işleme
- 13 yaş altı için ebeveyn onayı
- Kişisel verilerin şifrelenmesi
- Veri saklama ve silme politikaları

### 7.2. Sistem Güvenliği
- Düzenli güvenlik denetimleri
- DDoS koruması
- Güvenli API mimarisi
- Düzenli yedekleme prosedürleri

## 8. Kalite Standartları

### 8.1. Yapay Zeka İçeriği
- Eğitim uzmanları tarafından onaylanmış içerikler
- Müfredat ile %100 uyum
- Yasalara ve etik kurallara uygun içerik üretimi
- Düzenli içerik güncellemeleri

### 8.2. Performans Kriterleri
- Web uygulaması için 2 saniyeden az yükleme süresi
- Mobil uygulamalar için optimize edilmiş veri tüketimi
- 99.9% uptime hedefi
- Eşzamanlı kullanıcı desteği (min. 10,000)

## 9. Geliştirme ve Test Süreci

### 9.1. Geliştirme Metodolojisi
- Çevik (Agile) geliştirme yaklaşımı
- 2 haftalık sprint döngüleri
- Sürekli entegrasyon ve sürekli dağıtım (CI/CD)
- Test odaklı geliştirme (TDD)

### 9.2. Test Prosedürleri
- Otomatik birim testleri
- Kullanıcı arayüzü testleri
- Yük ve stres testleri
- Gerçek kullanıcılarla beta testleri

## 10. İşbirliği ve Entegrasyonlar

### 10.1. Eğitimci İşbirlikleri
- Öğretmenlerden içerik doğrulama ve geliştirme
- Eğitim kurumlarıyla işbirliği
- Eğitim uzmanlarından danışmanlık

### 10.2. Sistem Entegrasyonları
- Okul yönetim sistemleri ile entegrasyon
- E-okul benzeri sistemlerle veri alışverişi
- Popüler öğrenme yönetim sistemleri (LMS) ile entegrasyon
- Takvim uygulamaları ile çalışma programı senkronizasyonu

---

Bu kurallar dokümanı, projenin geliştirilmesi sırasında bir rehber görevi görecektir. Proje ilerledikçe güncellemeler yapılabilir. 
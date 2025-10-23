# PDF Tabanlı RAG Ders Anlatım Sistemi Kullanım Kılavuzu

## 🚀 Genel Bakış

Bu sistem, PDF formatındaki ders kitaplarını işleyerek yapay zekanın bu içeriklere dayalı ders anlatmasını sağlar.

### Temel Özellikler:
- 📄 PDF yükleme ve metin çıkarma (OCR desteği)
- 🔍 Vektör veritabanı ile hızlı içerik arama
- 🤖 RAG (Retrieval Augmented Generation) tabanlı ders anlatımı
- 💬 Soru-cevap sistemi
- 📝 Konu özetleri oluşturma

## 📦 Kurulum

### 1. Gerekli Paketleri Yükleyin

```bash
cd yapayzekaogretmen_python/backend
pip install -r requirements.txt
```

### 2. Tesseract OCR Kurulumu (OCR için gerekli)

**Ubuntu/Debian:**
```bash
sudo apt-get install tesseract-ocr tesseract-ocr-tur
```

**macOS:**
```bash
brew install tesseract
brew install tesseract-lang
```

**Windows:**
- [Tesseract GitHub](https://github.com/tesseract-ocr/tesseract) sayfasından indirin
- Türkçe dil paketini de yüklediğinizden emin olun

### 3. Ortam Değişkenlerini Ayarlayın

`.env` dosyasında:
```env
# OpenAI (Opsiyonel - daha iyi sonuçlar için)
OPENAI_API_KEY=your_openai_api_key

# DeepSeek (Zorunlu - ücretsiz alternatif)
DEEPSEEK_API_KEY=sk-8c6dda23f1964a509af4fd8cfd9ec9cc
```

## 🎯 Kullanım

### 1. API Sunucusunu Başlatın

```bash
cd yapayzekaogretmen_python/backend
python run.py
```

API Dokümantasyonu: http://localhost:8000/api/docs

### 2. PDF Yükleme

**Tek PDF Yükleme:**
```bash
curl -X POST "http://localhost:8000/api/curriculum/pdf/upload" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@5_sinif_matematik.pdf" \
  -F "grade=5" \
  -F "subject=matematik"
```

**Çoklu PDF Yükleme:**
```bash
curl -X POST "http://localhost:8000/api/curriculum/pdf/process-multiple" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "files=@kitap1.pdf" \
  -F "files=@kitap2.pdf" \
  -F "grade=5" \
  -F "subject=matematik"
```

### 3. Ders Anlatımı

```python
import requests

# Ders anlat
response = requests.post(
    "http://localhost:8000/api/lessons/rag/teach",
    headers={"Authorization": "Bearer YOUR_TOKEN"},
    json={
        "grade": 5,
        "subject": "matematik",
        "topic": "kesirler",
        "question": "Kesirler konusunu örneklerle anlatır mısın?"
    }
)

print(response.json()["lesson"])
```

### 4. Soru Cevaplama

```python
# Soru sor
response = requests.post(
    "http://localhost:8000/api/lessons/rag/ask",
    headers={"Authorization": "Bearer YOUR_TOKEN"},
    json={
        "question": "5/8 kesrini nasıl sadeleştiririz?",
        "grade": 5,
        "subject": "matematik"
    }
)

print(response.json()["answer"])
```

### 5. Konu Özeti

```python
# Özet oluştur
response = requests.post(
    "http://localhost:8000/api/lessons/rag/summary",
    headers={"Authorization": "Bearer YOUR_TOKEN"},
    json={
        "grade": 5,
        "subject": "matematik",
        "topic": "doğal sayılar"
    }
)

print(response.json()["summary"])
```

## 🧪 Test Scripti

Sistemi test etmek için:

```bash
cd yapayzekaogretmen_python/backend
python test_pdf_rag_system.py
```

Test için örnek PDF'ler:
1. `test_documents` klasörü oluşturun
2. İçine test PDF'leri koyun (örn: `5_sinif_matematik.pdf`)
3. Test scriptini çalıştırın

## 📚 API Endpoint'leri

### PDF Yönetimi
- `POST /api/curriculum/pdf/upload` - Tek PDF yükle
- `POST /api/curriculum/pdf/process-multiple` - Çoklu PDF yükle
- `GET /api/curriculum/pdf/collections` - Koleksiyonları listele
- `DELETE /api/curriculum/pdf/collections/{name}` - Koleksiyon sil
- `POST /api/curriculum/pdf/search` - İçerik ara

### RAG Ders Anlatımı
- `POST /api/lessons/rag/teach` - Ders anlat
- `POST /api/lessons/rag/ask` - Soru cevapla
- `POST /api/lessons/rag/summary` - Özet oluştur
- `GET /api/lessons/rag/topics/{grade}/{subject}` - Konuları listele
- `GET /api/lessons/rag/conversation/{student_id}` - Konuşma geçmişi

## 🔧 Yapılandırma

### Vektör Veritabanı Seçimi

`vector_db_service.py` içinde:
- **ChromaDB** (Varsayılan): Kolay kurulum, iyi performans
- **FAISS**: Daha hızlı, bellek içi arama

### Embedding Modeli

- **OpenAI Ada-002**: En iyi sonuçlar (API anahtarı gerekli)
- **HuggingFace Multilingual**: Ücretsiz alternatif

### PDF İşleme Ayarları

`pdf_service.py` içinde:
```python
self.text_splitter = RecursiveCharacterTextSplitter(
    chunk_size=1000,      # Parça boyutu
    chunk_overlap=200,    # Örtüşme miktarı
    separators=["\n\n", "\n", " ", ""]
)
```

## 🚨 Önemli Notlar

1. **PDF Kalitesi**: Net taranmış PDF'ler daha iyi sonuç verir
2. **Dil Desteği**: Türkçe OCR için `tesseract-ocr-tur` paketi gerekli
3. **Bellek Kullanımı**: Büyük PDF'ler için yeterli RAM gerekli
4. **API Limitleri**: OpenAI/DeepSeek API limitlerini göz önünde bulundurun

## 📈 Performans İpuçları

1. **Önbellekleme**: Sık kullanılan konular için sonuçları önbellekleyin
2. **İndeksleme**: Büyük koleksiyonlar için FAISS kullanın
3. **Batch İşleme**: Çoklu PDF'leri toplu işleyin
4. **Chunk Boyutu**: İçerik tipine göre chunk boyutunu ayarlayın

## 🐛 Sorun Giderme

### "PDF'den metin çıkarılamadı" hatası
- PDF'in taranmış resim olup olmadığını kontrol edin
- OCR için Tesseract'ın kurulu olduğundan emin olun

### "Koleksiyon bulunamadı" hatası
- PDF'in başarıyla işlendiğinden emin olun
- `/api/curriculum/pdf/collections` ile mevcut koleksiyonları kontrol edin

### Yavaş performans
- Chunk boyutunu artırın
- FAISS vektör veritabanına geçin
- Daha güçlü bir embedding modeli kullanın

## 🔮 Gelecek Geliştirmeler

- [ ] Görsel içerik analizi
- [ ] Çoklu dil desteği
- [ ] Otomatik konu çıkarımı
- [ ] Öğrenci performans takibi
- [ ] Adaptif öğrenme algoritmaları

## 📞 Destek

Sorunlar için:
1. Log dosyalarını kontrol edin: `yapayzekaogretmen_python/backend/logs/`
2. Test scriptini çalıştırın
3. API dokümantasyonunu inceleyin: http://localhost:8000/api/docs
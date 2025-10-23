# AI Fine-tuning Sistemi - MEB Müfredatı

Bu sistem, OpenAI modellerini MEB müfredatına uygun şekilde fine-tune etmek için geliştirilmiştir.

## 🎯 Amaç

Genel amaçlı dil modellerini Türkiye'deki öğrencilere MEB müfredatına uygun eğitim verebilecek şekilde özelleştirmek.

## 🤖 Desteklenen AI Sağlayıcıları

### OpenAI
- GPT-3.5-turbo (fine-tuning desteği)
- GPT-4 (temel model)
- Custom fine-tuned modeller

### DeepSeek
- **DeepSeek-V3**: Genel amaçlı, hızlı ve ekonomik
- **DeepSeek-R1**: Gelişmiş muhakeme yeteneği, özellikle matematik ve problem çözme için ideal
- OpenAI API uyumlu (kolay entegrasyon)
- Fine-tuning gerektirmez, doğrudan kullanıma hazır

## 📁 Klasör Yapısı

```
ai-fine-tuning/
├── data/                    # Veri dosyaları
│   ├── raw/                # Ham eğitim verileri (JSONL)
│   ├── processed/          # İşlenmiş veriler
│   └── validation/         # Doğrulama verileri
├── models/                 # Model bilgileri ve çıktıları
├── scripts/                # Python scriptleri
│   ├── prepare_data.py     # Veri hazırlama
│   ├── validate_data.py    # Veri doğrulama
│   ├── openai_client.py    # OpenAI API istemcisi
│   ├── train_model.py      # Eğitim yönetimi
│   └── model_evaluator.py  # Model değerlendirme
├── config/                 # Konfigürasyon dosyaları
├── logs/                   # Log dosyaları
└── results/                # Test sonuçları
```

## 🚀 Hızlı Başlangıç

### 1. Kurulum

```bash
# Gerekli paketleri yükle
pip install -r requirements.txt

# Environment değişkenlerini ayarla
export OPENAI_API_KEY="your-api-key"

# DeepSeek kullanmak için (opsiyonel)
export DEEPSEEK_API_KEY="your-deepseek-api-key"
```

### 2. Veri Hazırlama

```bash
cd scripts

# Ham verileri işle
python prepare_data.py

# Veriyi doğrula
python validate_data.py
```

### 3. Fine-tuning Başlatma

```bash
# Tam pipeline'ı çalıştır
python train_model.py

# Veya sadece örnek veri ile test
python train_model.py --sample 100
```

### 4. Model Test Etme

```bash
# Hızlı test
python model_evaluator.py ft:gpt-3.5-turbo:org:meb-ogretmen:xyz --quick

# Kapsamlı test
python model_evaluator.py ft:gpt-3.5-turbo:org:meb-ogretmen:xyz
```

## 📊 Veri Formatı

### JSONL Formatı

Her satır bir konuşmayı temsil eder:

```json
{
  "messages": [
    {
      "role": "system",
      "content": "Sen 5. sınıf öğrencilerine matematik öğreten..."
    },
    {
      "role": "user",
      "content": "Kesirler nedir?"
    },
    {
      "role": "assistant",
      "content": "Kesirler, bir bütünün parçalarını gösteren..."
    }
  ]
}
```

### Veri Gereksinimleri

- Minimum 10 örnek (önerilen: 50-100)
- Her örnek max 4096 token
- Dengeli sınıf ve konu dağılımı
- Doğru Türkçe yazım ve gramer

## 🛠️ Scriptler

### prepare_data.py

Veri hazırlama ve işleme:

```bash
python prepare_data.py --raw-path ../data/raw --processed-path ../data/processed
```

**Özellikler:**
- JSONL format doğrulama
- Veri augmentasyonu
- Train/validation split (90/10)
- Token sayımı

### validate_data.py

Veri kalite kontrolü:

```bash
python validate_data.py --data-path ../data/processed
```

**Kontroller:**
- Format doğruluğu
- Token limitleri
- Rol sıralaması
- İstatistiksel analiz

### openai_client.py

OpenAI API yönetimi:

```bash
# Dosya yükle
python openai_client.py upload train.jsonl

# Fine-tuning başlat
python openai_client.py create file-abc123 --epochs 3

# İşlemi izle
python openai_client.py monitor ftjob-xyz789

# Model test et
python openai_client.py test ft:model:name "Test sorusu"
```

### train_model.py

End-to-end eğitim:

```bash
# Varsayılan ayarlarla
python train_model.py

# Özel konfigürasyon
python train_model.py --config custom_config.json

# Örnek veri ile
python train_model.py --sample 50
```

### model_evaluator.py

Model performans değerlendirme:

```bash
# Varsayılan testler
python model_evaluator.py model-name

# Özel test dosyası
python model_evaluator.py model-name --test-file tests.json
```

## 📈 Metrikler

### Değerlendirme Kriterleri

1. **Doğruluk (Accuracy)**: Verilen bilginin doğruluğu
2. **İlgililik (Relevance)**: Soruya uygun cevap
3. **Tamlık (Completeness)**: Yeterli detay
4. **Pedagoji**: Öğretici yaklaşım
5. **Dil Kalitesi**: Anlaşılır Türkçe
6. **Seviye Uygunluğu**: Sınıf seviyesine uyum

### Başarı Metrikleri

- Genel başarı skoru: > 0.8
- Yanıt süresi: < 2 saniye
- Token verimliliği: Optimal kullanım

## 💰 Maliyet Tahmini

### OpenAI GPT-3.5-turbo Fine-tuning

- **Eğitim**: $0.0080 / 1K token
- **Kullanım**: $0.0030 / 1K token (input) + $0.0060 / 1K token (output)

### DeepSeek Modelleri (Fine-tuning gerekmez)

- **DeepSeek-V3**: $0.0001 / 1K token (input) + $0.0003 / 1K token (output)
- **DeepSeek-R1**: $0.0005 / 1K token (input) + $0.0020 / 1K token (output)

**Not**: DeepSeek modelleri OpenAI'ye göre %90'a varan maliyet tasarrufu sağlar!

### Örnek Maliyet Karşılaştırması

100 konuşma × 500 token = 50,000 token
- OpenAI GPT-3.5: ~$0.40
- DeepSeek-V3: ~$0.02 (20x daha ucuz)

## 🔧 Backend Entegrasyonu

### AI Servisi Güncelleme

```python
# Fine-tuned modeli aktif et
ai_service.update_fine_tuned_model("ft:gpt-3.5-turbo:org:suffix:id")
```

### API Endpoints

- `GET /api/fine-tuning/models` - Model listesi
- `PUT /api/fine-tuning/models/fine-tuned` - Model güncelle
- `POST /api/fine-tuning/upload-training-data` - Veri yükle
- `GET /api/fine-tuning/test-model/{model_name}` - Model test

## 📝 En İyi Uygulamalar

### Veri Kalitesi

1. **Çeşitlilik**: Farklı konular ve soru tipleri
2. **Tutarlılık**: Aynı öğretim stili
3. **Doğruluk**: MEB müfredatına uygunluk
4. **Güncellik**: Son müfredat değişiklikleri

### Model Seçimi

- **DeepSeek-V3**: En düşük maliyet, hızlı yanıt
- **DeepSeek-R1**: Gelişmiş muhakeme, matematik için ideal
- **GPT-3.5-turbo**: Hız ve maliyet dengesi
- **GPT-4**: Maksimum kalite (en pahalı)

### İteratif Geliştirme

1. Küçük veri seti ile başla
2. Test et ve değerlendir
3. Veriyi genişlet
4. Tekrar eğit

## 🚨 Sorun Giderme

### Sık Karşılaşılan Hatalar

1. **Token limiti aşımı**: Konuşmaları böl
2. **Format hatası**: validate_data.py kullan
3. **API limitleri**: Rate limiting uygula
4. **Model bulunamadı**: Model ID'yi kontrol et

### Debug Modları

```bash
# Detaylı loglar
export LOG_LEVEL=DEBUG

# Dry run (gerçek API çağrısı yapmaz)
python train_model.py --dry-run
```

## 📚 Kaynaklar

- [OpenAI Fine-tuning Docs](https://platform.openai.com/docs/guides/fine-tuning)
- [MEB Müfredat](http://mufredat.meb.gov.tr)
- [Proje Wiki](wiki/Home.md)

## 🤝 Katkıda Bulunma

1. Yeni eğitim verileri ekleyin
2. Test senaryoları geliştirin
3. Performans iyileştirmeleri önerin
4. Dokümantasyonu güncelleyin

## 📄 Lisans

Bu proje [MIT Lisansı](LICENSE) altında lisanslanmıştır. 
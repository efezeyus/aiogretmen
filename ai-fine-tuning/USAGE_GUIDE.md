# Fine-tuning Kullanım Kılavuzu

Bu kılavuz, MEB müfredatına uygun AI modeli oluşturmak için adım adım talimatlar içerir.

## İçindekiler

1. [Başlamadan Önce](#başlamadan-önce)
2. [Veri Hazırlama](#veri-hazırlama)
3. [Model Eğitimi](#model-eğitimi)
4. [Test ve Değerlendirme](#test-ve-değerlendirme)
5. [Production Kullanımı](#production-kullanımı)
6. [İpuçları ve Püf Noktaları](#ipuçları-ve-püf-noktaları)

## Başlamadan Önce

### Gereksinimler

1. **OpenAI API Key**: [platform.openai.com](https://platform.openai.com) adresinden alın
2. **Python 3.8+**: Sistem yüklü olmalı
3. **En az 4GB RAM**: Veri işleme için
4. **İnternet bağlantısı**: API çağrıları için

### Kurulum

```bash
# Repoyu klonla
git clone [repo-url]
cd ai-fine-tuning

# Sanal ortam oluştur
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Gereksinimleri yükle
pip install -r requirements.txt

# Environment ayarla
cp .env.example .env
# .env dosyasını düzenleyip API key'i ekle
```

## Veri Hazırlama

### 1. Ham Veri Oluşturma

`data/raw/` klasörüne JSONL dosyaları ekleyin:

```jsonl
{"messages": [{"role": "system", "content": "Sen 5. sınıf matematik öğretmenisin..."}, {"role": "user", "content": "Kesirler nedir?"}, {"role": "assistant", "content": "Kesirler..."}]}
```

### 2. Veri Şablonları

#### Matematik Örneği
```json
{
  "messages": [
    {
      "role": "system",
      "content": "Sen [SINIF]. sınıf öğrencilerine matematik öğreten, MEB müfredatına uygun, sabırlı bir öğretmensin."
    },
    {
      "role": "user",
      "content": "[KONU] hakkında bilgi verir misin?"
    },
    {
      "role": "assistant",
      "content": "[AÇIKLAMA]\n\n🔍 Örnek:\n[ÖRNEK]\n\n💡 İpucu: [İPUCU]"
    }
  ]
}
```

### 3. Veri İşleme

```bash
cd scripts

# Veriyi işle
python prepare_data.py

# İstatistikleri gör
python validate_data.py

# Çıktı:
# Toplam konuşma: 120
# Ortalama token: 450
# Format hataları: 0
```

## Model Eğitimi

### 1. Otomatik Eğitim

En kolay yöntem - her şeyi otomatik yapar:

```bash
python train_model.py
```

### 2. Manuel Eğitim

Daha fazla kontrol için:

```bash
# 1. Dosya yükle
python openai_client.py upload ../data/processed/train.jsonl
# Çıktı: file-ABC123

# 2. Eğitimi başlat
python openai_client.py create file-ABC123 --epochs 3 --suffix meb-v1
# Çıktı: ftjob-XYZ789

# 3. İzle
python openai_client.py monitor ftjob-XYZ789
```

### 3. Özel Konfigürasyon

```bash
# Kendi config dosyanızla
python train_model.py --config my_config.json

# Örnek veri ile test
python train_model.py --sample 50
```

## Test ve Değerlendirme

### 1. Hızlı Test

```bash
# 5 test vakası ile
python model_evaluator.py ft:gpt-3.5-turbo:org:meb-v1:abc123 --quick
```

### 2. Kapsamlı Test

```bash
# Tüm test senaryoları
python model_evaluator.py ft:gpt-3.5-turbo:org:meb-v1:abc123

# Özel test dosyası
python model_evaluator.py [MODEL] --test-file my_tests.json
```

### 3. Model Karşılaştırma

```bash
# API üzerinden
curl -X GET "http://localhost:8000/api/fine-tuning/model-comparison?prompt=Kesirler%20nedir&grade=5&subject=matematik"
```

## Production Kullanımı

### 1. Backend Entegrasyonu

```python
# app/services/ai_service.py güncellenir
ai_service.update_fine_tuned_model("ft:gpt-3.5-turbo:org:meb-v1:abc123")
```

### 2. API Kullanımı

```bash
# Model güncelle
curl -X PUT http://localhost:8000/api/fine-tuning/models/fine-tuned \
  -H "Authorization: Bearer [TOKEN]" \
  -H "Content-Type: application/json" \
  -d '{"model_name": "ft:gpt-3.5-turbo:org:meb-v1:abc123"}'
```

### 3. Fallback Stratejisi

`config/ai_models.json`:
```json
{
  "models": {
    "fine_tuned": {
      "name": "ft:gpt-3.5-turbo:org:meb-v1:abc123",
      "enabled": true,
      "priority": 1
    },
    "gpt4": {
      "name": "gpt-4",
      "enabled": true,
      "priority": 2
    }
  },
  "fallback_enabled": true
}
```

## İpuçları ve Püf Noktaları

### Veri Kalitesi

1. **Çeşitlilik Sağlayın**
   - Her sınıf seviyesi için örnekler
   - Farklı konu ve soru tipleri
   - Değişik zorluk seviyeleri

2. **Tutarlı Format**
   ```json
   {
     "emoji_kullan": true,
     "adim_adim_aciklama": true,
     "ornek_ver": true,
     "seviyeye_uygun_dil": true
   }
   ```

3. **Kalite Kontrol**
   - Her 10 örnekten birini manuel kontrol edin
   - Gramer ve yazım hatalarını düzeltin
   - MEB müfredatına uygunluğu doğrulayın

### Performans Optimizasyonu

1. **Token Yönetimi**
   - Gereksiz tekrarlardan kaçının
   - Özlü ama açıklayıcı yanıtlar
   - Sistem promptunu optimize edin

2. **Maliyet Kontrolü**
   - Önce küçük veri setiyle test edin
   - Epoch sayısını dikkatli seçin (genelde 3 yeterli)
   - Validation split kullanın

3. **Model Seçimi**
   - Başlangıç: GPT-3.5-turbo (hızlı ve ucuz)
   - İleri seviye: GPT-4 (daha iyi kalite)

### Sık Yapılan Hatalar

1. **❌ Çok az örnek** → ✅ En az 50-100 örnek kullanın

2. **❌ Dengesiz veri** → ✅ Her kategori için eşit örnek

3. **❌ Uzun konuşmalar** → ✅ Max 3-4 mesaj tut

4. **❌ Tutarsız format** → ✅ Şablon kullanın

### İzleme ve Bakım

1. **Logları Kontrol Edin**
   ```bash
   tail -f logs/fine_tuning_*.json
   ```

2. **Performans Metrikleri**
   - Yanıt süresi < 2 saniye
   - Başarı oranı > %80
   - Token kullanımı optimize

3. **Periyodik Değerlendirme**
   - Ayda bir model performansını test edin
   - Kullanıcı geri bildirimlerini toplayın
   - Gerekirse yeniden eğitin

## Sorun Giderme

### "API key geçersiz"
```bash
export OPENAI_API_KEY="sk-..."
# veya .env dosyasını kontrol edin
```

### "Token limiti aşıldı"
- Konuşmaları kısaltın
- max_tokens değerini düşürün

### "Model bulunamadı"
- Model ID'yi tam olarak kopyalayın
- Eğitim tamamlanmış mı kontrol edin

### "Format hatası"
```bash
python validate_data.py --data-path ../data/raw/problem_file.jsonl
```

## Yardım ve Destek

- 📧 Email: destek@yapayzekaogretmen.com
- 📚 Wiki: [Proje Wiki](../wiki)
- 💬 Discord: [Topluluk Kanalı](#)
- 🐛 Hata Bildirimi: [GitHub Issues](#) 
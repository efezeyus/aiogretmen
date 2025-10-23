# DeepSeek API Entegrasyon Kılavuzu

## DeepSeek Nedir?

DeepSeek, yüksek performanslı ve maliyet-etkin bir AI sağlayıcısıdır. OpenAI API'si ile uyumlu olduğu için mevcut OpenAI entegrasyonlarına kolayca eklenebilir.

## Neden DeepSeek?

### 1. Maliyet Avantajı
- OpenAI GPT-3.5'e göre **20x daha ucuz**
- Özellikle yüksek hacimli eğitim uygulamaları için ideal
- Öğrenci başına işletme maliyetini düşürür

### 2. Performans
- **DeepSeek-V3**: Hızlı yanıt süresi, genel amaçlı kullanım
- **DeepSeek-R1**: Gelişmiş muhakeme yeteneği, matematik ve problem çözme için optimize

### 3. Türkçe Desteği
- Türkçe dil desteği mevcut
- MEB müfredatına uygun içerik üretebilir

## API Anahtarı Alma

1. [DeepSeek Platform](https://platform.deepseek.com) adresine gidin
2. Hesap oluşturun veya giriş yapın
3. API Keys bölümünden yeni bir anahtar oluşturun
4. Anahtarı güvenli bir yerde saklayın

## Kurulum

### 1. Environment Değişkeni

```bash
# .env dosyasına ekleyin
DEEPSEEK_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxxxxx
```

### 2. Model Önceliklendirme

Sistem otomatik olarak DeepSeek modellerini önceliklendirir. Varsayılan öncelik sırası:

1. Fine-tuned OpenAI modeli (varsa)
2. DeepSeek-V3 (genel kullanım)
3. DeepSeek-R1 (matematik/muhakeme)
4. GPT-4
5. GPT-3.5-turbo

### 3. Özel Konfigürasyon

`config/ai_models.json` dosyası oluşturarak öncelikleri değiştirebilirsiniz:

```json
{
  "models": {
    "deepseek_v3": {
      "name": "deepseek-chat",
      "enabled": true,
      "priority": 1,
      "provider": "deepseek"
    },
    "deepseek_reasoner": {
      "name": "deepseek-reasoner",
      "enabled": true,
      "priority": 2,
      "provider": "deepseek"
    },
    "gpt35": {
      "name": "gpt-3.5-turbo",
      "enabled": true,
      "priority": 3,
      "provider": "openai"
    }
  },
  "fallback_enabled": true,
  "temperature": 0.7,
  "max_tokens": 800
}
```

## Kullanım Senaryoları

### 1. Genel Eğitim İçeriği
```python
# DeepSeek-V3 otomatik seçilir
response = ai_service.get_ai_response(
    prompt="Kesirler nedir?",
    grade_level=5,
    subject="matematik"
)
```

### 2. Karmaşık Problem Çözme
```python
# DeepSeek-R1 için priority ayarlayın
# config/ai_models.json'da deepseek_reasoner priority: 1 yapın
response = ai_service.get_ai_response(
    prompt="Bu kelime problemini çöz: Ali'nin 15 kalemi var...",
    grade_level=6,
    subject="matematik"
)
```

## Model Karşılaştırması

| Özellik | DeepSeek-V3 | DeepSeek-R1 | GPT-3.5 | GPT-4 |
|---------|-------------|-------------|---------|--------|
| Maliyet (1K token) | $0.0001/$0.0003 | $0.0005/$0.0020 | $0.0030/$0.0060 | $0.0300/$0.0600 |
| Hız | Çok Hızlı | Hızlı | Hızlı | Orta |
| Türkçe Kalitesi | İyi | Çok İyi | İyi | Mükemmel |
| Matematik | İyi | Mükemmel | Orta | Çok İyi |
| Muhakeme | İyi | Mükemmel | Orta | Çok İyi |

## Test ve Doğrulama

### 1. API Bağlantı Testi

```bash
curl https://api.deepseek.com/v1/models \
  -H "Authorization: Bearer $DEEPSEEK_API_KEY"
```

### 2. Python Test

```python
from openai import OpenAI

client = OpenAI(
    api_key="your-deepseek-api-key",
    base_url="https://api.deepseek.com"
)

response = client.chat.completions.create(
    model="deepseek-chat",
    messages=[
        {"role": "system", "content": "Sen yardımcı bir asistansın."},
        {"role": "user", "content": "Merhaba!"}
    ]
)

print(response.choices[0].message.content)
```

### 3. Backend API Testi

```bash
# Model bilgilerini kontrol et
curl http://localhost:8000/api/ai/models

# Test sorusu gönder
curl -X POST http://localhost:8000/api/ai/chat \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -d '{
    "prompt": "5. sınıf matematik kesirler konusunu anlat",
    "grade_level": 5,
    "subject": "matematik"
  }'
```

## Performans İzleme

### Metrikler

Backend otomatik olarak şu metrikleri kaydeder:
- Kullanılan model
- Yanıt süresi
- Token kullanımı
- Hata oranları

### Log İnceleme

```bash
# AI servis logları
tail -f yapayzekaogretmen_python/backend/logs/ai_service.log

# Model kullanım istatistikleri
grep "Model deneniyor" logs/*.log | sort | uniq -c
```

## Sorun Giderme

### 1. API Anahtarı Hatası
```
Error: Invalid API key
```
**Çözüm**: DEEPSEEK_API_KEY environment değişkenini kontrol edin.

### 2. Model Bulunamadı
```
Error: Model 'deepseek-chat' not found
```
**Çözüm**: Model adının doğru olduğundan emin olun.

### 3. Rate Limit
```
Error: Rate limit exceeded
```
**Çözüm**: İstek sayısını azaltın veya plan yükseltin.

## En İyi Uygulamalar

### 1. Model Seçimi
- **Basit sorular**: DeepSeek-V3
- **Problem çözme**: DeepSeek-R1
- **Kritik içerik**: GPT-4 (fallback)

### 2. Maliyet Optimizasyonu
- Önbellek kullanın (Redis)
- Benzer soruları gruplayın
- Token limitlerini optimize edin

### 3. Güvenilirlik
- Fallback mekanizmasını aktif tutun
- Birden fazla provider kullanın
- Düzenli performans testleri yapın

## Destek

- **DeepSeek Dokümantasyon**: [docs.deepseek.com](https://docs.deepseek.com)
- **API Status**: [status.deepseek.com](https://status.deepseek.com)
- **Topluluk**: [Discord](https://discord.gg/deepseek)

## Sık Sorulan Sorular

**S: DeepSeek fine-tuning destekliyor mu?**
C: Şu anda hayır, ancak base modeller MEB müfredatı için yeterli performans gösteriyor.

**S: Hangi model daha iyi?**
C: Kullanım senaryosuna bağlı. Genel kullanım için V3, matematik için R1 önerilir.

**S: OpenAI ve DeepSeek aynı anda kullanılabilir mi?**
C: Evet, sistem otomatik fallback ile her iki provider'ı destekler.

**S: Ücretsiz deneme var mı?**
C: DeepSeek yeni kullanıcılara ücretsiz kredi sunuyor. Detaylar için platform sayfasını kontrol edin. 
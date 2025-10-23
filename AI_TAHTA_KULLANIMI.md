# 🎨 AI Öğretmen İnteraktif Tahta Sistemi

## 🌟 Özellikler

AI Öğretmen artık gerçek bir öğretmen gibi tahta üzerinde ders anlatabilir!

### ✨ Ana Özellikler

- **🎨 İnteraktif Canvas**: HTML5 Canvas tabanlı gerçek tahta deneyimi
- **🤖 AI Öğretmen**: Adım adım problem çözümü gösterimi
- **✏️ Çizim Araçları**: Kalem, silgi, renk seçimi, kalınlık ayarı
- **📊 Görselleştirme**: Sayı doğrusu, grafik, geometrik şekiller
- **🔄 Real-time Sync**: WebSocket ile canlı senkronizasyon
- **↩️ Geri Al/İleri Al**: Sınırsız geri alma
- **📝 Matematiksel Formüller**: LaTeX desteği (planlandı)

## 🚀 Kullanım

### 1. Frontend'de Kullanım

```jsx
import AIWhiteboard from './components/AIWhiteboard';

function LessonPage() {
  return (
    <AIWhiteboard 
      lessonId="lesson_123"
      onComplete={(result) => {
        console.log('Ders tamamlandı:', result);
      }}
    />
  );
}
```

### 2. API Kullanımı

#### Problem Çözümü İsteği

```javascript
POST /api/whiteboard/solve

{
  "problem": "2x + 5 = 15",
  "lesson_id": "lesson_123",
  "subject": "matematik",
  "grade": 6,
  "detailed": true
}
```

**Yanıt:**
```json
{
  "problem": "2x + 5 = 15",
  "steps": [
    {
      "number": 1,
      "explanation": "Denklemi yazalım",
      "expression": "2x + 5 = 15",
      "visual": null
    },
    {
      "number": 2,
      "explanation": "5'i her iki taraftan çıkaralım",
      "expression": "2x = 15 - 5 = 10",
      "visual": null
    },
    {
      "number": 3,
      "explanation": "Her iki tarafı 2'ye bölelim",
      "expression": "x = 10 ÷ 2 = 5",
      "visual": null
    },
    {
      "number": 4,
      "explanation": "Sonucu kontrol edelim",
      "expression": "2 × 5 + 5 = 15 ✓",
      "visual": null
    },
    {
      "number": 5,
      "explanation": "Sayı doğrusunda gösterelim",
      "expression": null,
      "visual": {
        "type": "number_line",
        "data": {
          "min": 0,
          "max": 10,
          "highlight": 5
        }
      }
    }
  ],
  "total_time_estimate": 15,
  "difficulty": "orta"
}
```

### 3. WebSocket Bağlantısı

```javascript
const ws = new WebSocket('ws://localhost:8000/ws/whiteboard/lesson_123');

ws.onopen = () => {
  console.log('Tahta bağlantısı kuruldu');
};

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  
  if (data.type === 'ai_step') {
    // AI'ın adım adım çözümü
    console.log('AI Adımı:', data.step);
  }
};

// Çizim paylaş
ws.send(JSON.stringify({
  type: 'draw',
  x: 100,
  y: 150,
  tool: 'pen',
  color: '#FF0000',
  lineWidth: 2
}));
```

## 📚 Desteklenen Problem Tipleri

### 1. Denklemler
```
2x + 5 = 15
3x - 7 = 20
5x + 10 = 35
```

### 2. Aritmetik İşlemler
```
123 + 456
789 - 234
12 × 8
144 ÷ 12
```

### 3. Geometri
```
Kenar uzunluğu 5 cm olan bir karenin alanını bulunuz
Yarıçapı 3 cm olan bir dairenin çevresini bulunuz
```

### 4. Kesirler ve Yüzdeler
```
1/2 + 1/4
%25'i 80 eder
3/4 × 2/3
```

## 🎯 AI Öğretmen Özellikleri

### Adım Adım Çözüm
AI öğretmen her problemi şu şekilde çözer:

1. **Problem Tanımlama**: Problemi tahta üzerine yazar
2. **Strateji Belirleme**: Çözüm yöntemini açıklar
3. **Adım Adım İlerle**: Her adımı ayrı ayrı gösterir
4. **Görselleştirme**: Gerektiğinde grafik/diyagram çizer
5. **Kontrol**: Sonucu doğrular
6. **Özet**: Öğrenilen kavramları özetler

### Örnek Çözüm Süreci

**Problem**: `2x + 5 = 15`

```
Adım 1: Denklemi Yazalım
┌─────────────────┐
│  2x + 5 = 15   │
└─────────────────┘

Adım 2: Sabiti Karşı Tarafa Geçirelim
┌─────────────────┐
│  2x = 15 - 5   │
│  2x = 10       │
└─────────────────┘

Adım 3: x'i Bulalım
┌─────────────────┐
│  x = 10 ÷ 2    │
│  x = 5         │
└─────────────────┘

Adım 4: Kontrol Edelim
┌─────────────────┐
│  2(5) + 5 = 15 │
│  10 + 5 = 15 ✓ │
└─────────────────┘

Adım 5: Sayı Doğrusunda Gösterelim
    0───1───2───3───4───⭕───6───7───8───9───10
                        5
```

## 🎨 Görselleştirme Tipleri

### 1. Sayı Doğrusu
```javascript
{
  "type": "number_line",
  "data": {
    "min": 0,
    "max": 10,
    "highlight": 5,
    "marks": [0, 2, 4, 6, 8, 10]
  }
}
```

### 2. Grafik
```javascript
{
  "type": "graph",
  "data": {
    "points": [
      {"x": 0, "y": 0},
      {"x": 1, "y": 2},
      {"x": 2, "y": 4}
    ],
    "type": "line"
  }
}
```

### 3. Geometrik Şekiller
```javascript
{
  "type": "diagram",
  "data": {
    "shape": "square",
    "side": 5,
    "labels": true
  }
}
```

## 🛠️ Araç Çubuğu

### Çizim Araçları
- ✏️ **Kalem**: Serbest çizim
- 🧹 **Silgi**: Çizimleri sil
- 🗑️ **Temizle**: Tüm tahtayı temizle

### Düzenleme Araçları
- ↶ **Geri Al**: Son işlemi geri al
- ↷ **İleri Al**: Geri alınan işlemi tekrarla

### Stil Ayarları
- 🎨 **Renk Seçici**: Çizim rengi
- 📏 **Kalınlık**: Çizgi kalınlığı (1-20px)

### AI Araçları
- 🤖 **AI Yardımı**: AI öğretmenden yardım iste

## 💡 Kullanım Örnekleri

### Örnek 1: Denklem Çözümü

```javascript
// Problem gir
const problem = "3x - 7 = 20";

// AI'dan yardım iste
const response = await fetch('/api/whiteboard/solve', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer YOUR_TOKEN'
  },
  body: JSON.stringify({
    problem: problem,
    subject: "matematik",
    grade: 7
  })
});

const solution = await response.json();

// Adımları tahta üzerinde göster
for (const step of solution.steps) {
  await displayStepOnWhiteboard(step);
  await sleep(3000); // Her adım arası 3 saniye bekle
}
```

### Örnek 2: Geometri Problemi

```javascript
const problem = "Kenar uzunluğu 5 cm olan bir karenin alanını bulunuz";

// AI çöz ve görselleştir
const solution = await solveWithVisualization(problem);

// Tahta üzerinde kare çiz
drawSquare(5); // 5 cm kenar uzunluğu
animateAreaCalculation(5 * 5); // Alan hesaplama animasyonu
```

### Örnek 3: Öğrenci-AI İş Birliği

```javascript
// Öğrenci çizim yapar
student.draw(points);

// AI yorum yapar
const feedback = await ai.analyzeDraw(points);

// AI tahta üzerinde düzeltmeler yapar
ai.correctOnWhiteboard(feedback.corrections);

// Öğrenci ve AI birlikte problemi çözer
collaborativeSolve(problem);
```

## 🎓 Pedagojik Faydalar

### 1. **Görsel Öğrenme**
- Soyut kavramların somutlaştırılması
- Adım adım görsel takip
- Renkli ve dikkat çekici sunumlar

### 2. **İnteraktif Katılım**
- Öğrenci tahta üzerinde çalışabilir
- AI ile birlikte problem çözme
- Anında geri bildirim

### 3. **Kişiselleştirilmiş Hız**
- Her öğrenci kendi hızında ilerler
- İstediği kadar tekrar izleyebilir
- Kendi çözümlerini deneyebilir

### 4. **Hata Yönetimi**
- Hataları güvenli ortamda yapma
- AI'ın nazik düzeltmeleri
- Öğrenme fırsatı olarak hatalar

## 🔧 Gelişmiş Özellikler

### 1. Kayıt ve Tekrar İzleme
```javascript
// Tahta seansını kaydet
const recording = await whiteboard.startRecording();

// Kaydı durdur ve kaydet
const savedSession = await whiteboard.stopRecording();

// Kaydı tekrar oynat
await whiteboard.playRecording(savedSession.id);
```

### 2. Çoklu Kullanıcı
```javascript
// Birden fazla öğrenci aynı tahtada
const session = await whiteboard.createMultiUserSession();

// Kullanıcı izinleri
session.setPermissions({
  student1: ['draw', 'erase'],
  teacher: ['draw', 'erase', 'clear', 'ai_control']
});
```

### 3. Özel AI Promptları
```javascript
// Özel öğretim stili
const customAI = {
  style: 'encouraging', // 'strict', 'fun', 'professional'
  pace: 'slow', // 'normal', 'fast'
  detailLevel: 'high', // 'low', 'medium', 'high'
  visualPreference: 'always' // 'never', 'sometimes', 'always'
};

await whiteboard.solve(problem, customAI);
```

## 📊 Performans ve Optimizasyon

### WebSocket Bağlantı Havuzu
- Maksimum 100 eşzamanlı bağlantı
- Otomatik yeniden bağlanma
- Mesaj kuyruklama

### Canvas Optimizasyonu
- Layer-based rendering
- Dirty rectangle optimization
- RequestAnimationFrame kullanımı

### AI Yanıt Önbellekleme
- Sık sorulan problemler önbellekte
- 5 dakika TTL
- Redis tabanlı cache

## 🚨 Hata Yönetimi

```javascript
try {
  await whiteboard.solve(problem);
} catch (error) {
  if (error.code === 'WEBSOCKET_ERROR') {
    // WebSocket hatası - yeniden bağlan
    await whiteboard.reconnect();
  } else if (error.code === 'AI_ERROR') {
    // AI hatası - alternatif çözüm göster
    await whiteboard.showAlternativeSolution();
  } else {
    // Genel hata
    whiteboard.showError('Bir hata oluştu, lütfen tekrar deneyin');
  }
}
```

## 🎯 Gelecek Özellikler

- [ ] **LaTeX Desteği**: Matematiksel formül editörü
- [ ] **Voice Control**: Sesli komutlarla tahta kontrolü
- [ ] **AR Mode**: Artırılmış gerçeklik tahta
- [ ] **3D Görselleştirme**: Three.js ile 3D geometri
- [ ] **Handwriting Recognition**: El yazısı tanıma
- [ ] **Collaborative Drawing**: Çoklu kullanıcı çizimi
- [ ] **Export to PDF**: Tahtayı PDF olarak kaydet
- [ ] **Animation Templates**: Hazır animasyon şablonları

## 📝 Örnek Senaryolar

### Senaryo 1: Matematik Dersi
```
1. Öğretmen AI tahtayı açar
2. "2x + 5 = 15" problemini yazar
3. AI adım adım çözer:
   - Problemi analiz eder
   - Her adımı görsel olarak gösterir
   - Sayı doğrusunda çizer
   - Sonucu doğrular
4. Öğrenci benzer bir problemi çözer
5. AI öğrencinin çözümünü kontrol eder
```

### Senaryo 2: Geometri Dersi
```
1. "Kare çiz" komutu
2. AI tahta üzerinde kare çizer
3. Kenar uzunluklarını etiketler
4. Alan formülünü yazar
5. Hesaplama adımlarını gösterir
6. Sonucu renkli olarak vurgular
```

### Senaryo 3: Grup Çalışması
```
1. 3 öğrenci aynı tahtada
2. Her biri farklı renkte çizer
3. AI problemin farklı yönlerini açıklar
4. Öğrenciler birlikte çözüme ulaşır
5. AI sonucu doğrular ve tebrik eder
```

---

## 🎊 Başlangıç

```bash
# Frontend'i başlat
cd frontend
npm start

# Backend'i başlat
cd yapayzekaogretmen_python/backend
source venv/bin/activate
uvicorn app.main:app --reload

# Tarayıcıda aç
http://localhost:3000/student/lesson/123
```

**AI Tahta'ya tıklayın ve öğrenmeye başlayın!** 🚀

---

*AI Öğretmen ile geleceğin eğitimi şimdi başlıyor!* 🤖📚


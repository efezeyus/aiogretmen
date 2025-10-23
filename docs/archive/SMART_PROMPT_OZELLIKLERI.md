# 🎯 Smart Prompt Input - Son Teknoloji Chat Sistemi

## 🌟 Genel Bakış

**SmartPromptInput**, dünyanın en gelişmiş eğitim chat arayüzüdür!

---

## ✨ ÖZELLİKLER

### 1. **Auto-Complete & Smart Suggestions** 🤖

#### Nasıl Çalışır:
Yazmaya başladığınızda otomatik öneriler gelir:

```
Kullanıcı: "Bu kon"
        ↓
Öneriler: 
💡 Bu konuyu anlamadım, tekrar anlatır mısın?
💡 Bu konuyla ilgili örnek verir misin?
💡 Bu konu hakkında quiz çözebilir miyim?
```

**Klavye Kısayolları:**
- `↑` / `↓` → Öneriler arasında gezin
- `Enter` → Seçili öneriyi kullan
- `Esc` → Önerileri kapat

---

### 2. **Command System** ⌘

Slash (/) ile hızlı komutlar:

```
/help      → Yardım menüsü
/quiz      → Hızlı quiz başlat
/example   → Örnek iste
/explain   → Detaylı açıklama
/summary   → Konu özeti
/practice  → Alıştırma soruları
/hint      → İpucu al
/clear     → Sohbeti temizle
```

**Kullanım:**
```
Kullanıcı: "/quiz"
AI: "Harika! Hemen bir quiz başlatalım! Hangi konu?"
```

---

### 3. **Voice Input (Sesli Girdi)** 🎤

#### Özellikler:
- ✅ Türkçe ses tanıma
- ✅ Gerçek zamanlı transkripsiyon
- ✅ Otomatik duraklatma
- ✅ Pulse animasyonu

#### Kullanım:
1. 🎤 ikonuna tıkla
2. Konuş
3. Otomatik yazıya çevrilir

**Görsel:**
```
[🔴 Dinliyorum... ███ ███ ███]
```

---

### 4. **Emoji Picker** 😊

#### 5 Kategori:
- 😊 Duygular (12 emoji)
- 👍 Tepkiler (10 emoji)
- 🎓 Eğitim (10 emoji)
- ⭐ Başarı (10 emoji)
- 🎯 Semboller (10 emoji)

**Toplam:** 52 emoji!

#### Kullanım:
- 😊 butonuna tıkla
- Kategori seç
- Emoji seç
- Otomatik ekle

---

### 5. **Math Input Tools** 🧮

Hızlı matematik girişi:

```
Butonlar:
¾  → Kesir şablonu (a/b)
√  → Karekök (√x)
x² → Üs (x²)
```

**Örnek:**
```
Kullanıcı: "Hesapla: " + [¾ butonu]
→ "Hesapla: a/b"
```

---

### 6. **Multi-line Support** 📝

- `Enter` → Gönder
- `Shift+Enter` → Yeni satır
- Otomatik genişleme (max 150px)
- Satır sayısına göre textarea boyutu

---

### 7. **Character Counter** 🔢

Gerçek zamanlı karakter sayacı:
```
"0/1000" → Yazarken güncellenir
```

Limite yaklaşınca:
- 900-950: Sarı renk
- 950-1000: Kırmızı renk

---

### 8. **Smart Chips (Hızlı Öneriler)** 💡

Input boşken gösterilen akıllı öneriler:

```
Hızlı sorular:
[Bu konuyu anlamadım]  [Örnek ister misin?]
[Günlük hayat örneği]  [Quiz çözelim]
```

Tıkla → Otomatik input'a gelir

---

### 9. **Typing Indicator** ⌨️

Yazmaya başladığınızda:
- Parent component'e bildirim
- AI "Yazıyor..." gösterir
- 1 saniye debounce

---

### 10. **Keyboard Shortcuts** ⌨️

```
Enter          → Gönder
Shift+Enter    → Yeni satır
Esc            → Önerileri kapat
↑ / ↓          → Öneri seç
Ctrl+/         → Komutlar
```

---

## 🎨 Görsel Tasarım

### **Modern Glassmorphism:**
```css
background: white
border-radius: 16px
box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1)
border: 2px solid #e0e0e0

[Focus]
border-color: #667eea
box-shadow: 0 4px 30px rgba(102, 126, 234, 0.2)
```

### **Animasyonlar:**
- Suggestions: slideUp
- Emoji Picker: scaleIn
- Recording: pulse
- Send Button: rotate on hover
- Chips: translateY on hover

### **Renkler:**
- Primary: `#667eea` (Mor-Mavi gradient)
- Success: `#27ae60` (Yeşil)
- Recording: `#e74c3c` (Kırmızı)
- Background: `#f8f9fa` (Açık Gri)

---

## 🔧 Kullanım (Component)

### **Basic:**
```jsx
import SmartPromptInput from './components/SmartPromptInput';

<SmartPromptInput
  onSend={(message) => console.log(message)}
  placeholder="Mesajınızı yazın..."
/>
```

### **Advanced (Lesson Room):**
```jsx
<SmartPromptInput
  onSend={sendMessage}
  onTyping={(typing) => setIsTyping(typing)}
  maxLength={500}
  enableVoice={true}
  enableEmoji={true}
  enableCommands={true}
  enableMath={true}
  enableImage={false}
  aiSuggestions={[
    "Bu konuyu tekrar anlatır mısın?",
    "Örnek verir misin?",
    "Quiz çözelim!"
  ]}
/>
```

### **Props:**

| Prop | Tip | Varsayılan | Açıklama |
|------|-----|------------|----------|
| `onSend` | function | - | Mesaj gönderme callback |
| `onTyping` | function | - | Typing indicator callback |
| `placeholder` | string | "AI öğretmenine sor..." | Placeholder metni |
| `maxLength` | number | 1000 | Max karakter sayısı |
| `enableVoice` | boolean | true | Sesli girdi aktif/pasif |
| `enableEmoji` | boolean | true | Emoji picker |
| `enableCommands` | boolean | true | Slash komutlar |
| `enableMath` | boolean | true | Matematik araçları |
| `enableImage` | boolean | false | Resim yükleme |
| `aiSuggestions` | array | [] | Özel öneriler |

---

## 🚀 Kullanım Senaryoları

### Senaryo 1: Basit Soru
```
1. Input'a "kesir nedir" yaz
2. Auto-complete önerileri görünür
3. ↓ tuşu ile "Kesir kavramını açıklar mısın?" seç
4. Enter → Gönder
```

### Senaryo 2: Matematik Problemi
```
1. ¾ butonuna tıkla → "a/b" eklenir
2. "1/2 + 1/4 =" yaz
3. Enter → AI hesaplar
```

### Senaryo 3: Sesli Girdi
```
1. 🎤 butonuna tıkla
2. "Kesirler konusunu açıklar mısın?" de
3. Otomatik yazıya çevrilir
4. 📤 ile gönder
```

### Senaryo 4: Hızlı Komut
```
1. "/" yaz
2. Komut listesi açılır
3. "/quiz" seç
4. Enter → Quiz başlar
```

### Senaryo 5: Emoji İfadesi
```
1. 😊 butonuna tıkla
2. Emoji picker açılır
3. 🤔 emoji'sine tıkla
4. "🤔 Bunu anlamadım" yaz
5. Gönder
```

---

## 🎯 Teknik Özellikler

### **Performance:**
- Debounced typing (1s)
- Memoized suggestions
- Lazy emoji loading
- Optimized re-renders

### **Accessibility:**
- Keyboard navigation
- Screen reader support
- Focus indicators
- ARIA labels

### **Browser Compat:**
- Chrome ✅
- Firefox ✅
- Safari ✅
- Edge ✅
- Mobile browsers ✅

---

## 🎊 Sonuç

**SmartPromptInput Özellikleri:**

| Özellik | Durum |
|---------|-------|
| Auto-complete | ✅ |
| Voice Input | ✅ |
| Emoji Picker | ✅ |
| Commands | ✅ |
| Math Tools | ✅ |
| Multi-line | ✅ |
| Char Counter | ✅ |
| Smart Chips | ✅ |
| Keyboard Shortcuts | ✅ |
| Animations | ✅ |
| Dark Mode | ✅ |
| Responsive | ✅ |

---

**DÜNYANIN EN MODERN PROMPT ALANI HAZIR!** 🎉

*AI destekli, sesli girdi, emoji, komutlar ve daha fazlası!*

**LessonRoomUltimate'de kullanımda! Test edin:** 
```
http://localhost:3000/student/lesson/1
```


# 🎯 RENDER - 5 DAKİKALIK BAŞLANGIÇ

## ✅ ÖN HAZIRLIK (Yapın!)

### 1. MongoDB Atlas Connection String Hazırlayın
```
mongodb+srv://admin:SIFRE@cluster.mongodb.net/yapay_zeka_ogretmen
```

### 2. OpenAI API Key Hazırlayın
```
sk-xxxxxxxxxxxxxxxxxxxxxx
```

### 3. JWT Secret Oluşturun (64+ karakter)
```
yapay-zeka-ogretmen-super-secret-production-key-2024-very-long-string
```

---

## 🚀 HIZLI ADIMLAR

### 1. GitHub'a Push
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/KULLANICI/yapayzekaogretmen.git
git push -u origin main
```

### 2. Render'a Git
```
https://render.com
→ Sign in with GitHub
```

### 3. Backend Oluştur
```
New + → Web Service
Repository: yapayzekaogretmen
Root: yapayzekaogretmen_python/backend
Build: pip install -r requirements.txt
Start: uvicorn app.main:app --host 0.0.0.0 --port $PORT
```

**Environment Variables:**
```
MONGODB_URL=mongodb+srv://...
OPENAI_API_KEY=sk-...
JWT_SECRET=...
ENVIRONMENT=production
```

### 4. Frontend Oluştur
```
New + → Static Site
Repository: yapayzekaogretmen
Root: frontend
Build: npm install && npm run build
Publish: build
```

**Environment Variables:**
```
REACT_APP_API_URL=https://BACKEND.onrender.com/api
REACT_APP_WEBSOCKET_URL=wss://BACKEND.onrender.com/ws
```

### 5. Test Et!
```
https://FRONTEND.onrender.com
```

---

## 🎊 TAMAM!

Backend: `https://yapayzekaogretmen-backend.onrender.com`
Frontend: `https://yapayzekaogretmen-frontend.onrender.com`

**Detaylı rehber:** RENDER_DEPLOYMENT_ADIM_ADIM.md

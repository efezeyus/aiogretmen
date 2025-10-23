#!/bin/bash

# Yapay Zeka Öğretmen Backend Başlatma Script'i
# ================================================

echo "🚀 Backend başlatılıyor..."

# Backend klasörüne git
cd "$(dirname "$0")"

# Virtual environment'ı aktifleştir
if [ -d "venv" ]; then
    echo "✅ Virtual environment aktifleştiriliyor..."
    source venv/bin/activate
else
    echo "❌ Virtual environment bulunamadı! Önce 'python3 -m venv venv' komutunu çalıştırın."
    exit 1
fi

# Environment kontrol
if [ ! -f ".env" ]; then
    echo "⚠️  .env dosyası bulunamadı, env.example kopyalanıyor..."
    cp env.example .env
    echo "📝 Lütfen .env dosyasını düzenleyin ve API keylerini ekleyin!"
fi

# Port kontrolü
PORT=8000
if lsof -Pi :$PORT -sTCP:LISTEN -t >/dev/null ; then
    echo "⚠️  Port $PORT zaten kullanımda! Mevcut process sonlandırılıyor..."
    kill $(lsof -t -i:$PORT) 2>/dev/null || true
    sleep 2
fi

# Backend başlat
echo "🎯 Backend $PORT portunda başlatılıyor..."
echo "📚 API Docs: http://localhost:$PORT/api/docs"
echo "🔍 Health: http://localhost:$PORT/api/"
echo ""
echo "Loglar backend.log dosyasına yazılıyor..."
echo "Durdurmak için: pkill -f 'python run.py'"
echo ""

# Run backend
nohup python run.py > backend.log 2>&1 &
BACKEND_PID=$!

echo "✅ Backend başlatıldı! PID: $BACKEND_PID"
echo "📄 Logları görmek için: tail -f backend.log"

# 5 saniye bekle ve kontrol et
sleep 5

if ps -p $BACKEND_PID > /dev/null; then
    echo "✅ Backend başarıyla çalışıyor!"
    
    # Health check
    if curl -s http://localhost:$PORT/api/ >/dev/null 2>&1; then
        echo "✅ API erişilebilir!"
    else
        echo "⚠️  API henüz yanıt vermiyor, birkaç saniye bekleyin..."
    fi
else
    echo "❌ Backend başlatılamadı! Log dosyasını kontrol edin:"
    echo "   tail -30 backend.log"
    exit 1
fi


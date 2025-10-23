#!/bin/bash

# ============================================================================
# AI Öğretmen - Demo Başlatma Script'i
# ============================================================================

clear

echo "╔════════════════════════════════════════════════════════════╗"
echo "║                                                            ║"
echo "║          🎓 AI ÖĞRETMEN - DEMO BAŞLATMA 🚀               ║"
echo "║                                                            ║"
echo "║     Ticari Eğitim Platformu - Okullara Satılabilir       ║"
echo "║                                                            ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""
echo "Sistem kontrol ediliyor..."
echo ""

# Renk kodları
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# ============================================================================
# BACKEND KONTROLÜ
# ============================================================================

echo "📦 1. BACKEND KONTROLÜ"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

cd yapayzekaogretmen_python/backend

if [ ! -d "venv" ]; then
    echo -e "${RED}❌ Virtual environment bulunamadı!${NC}"
    echo "   Çözüm: python3 -m venv venv"
    exit 1
fi

if [ ! -f ".env" ]; then
    echo -e "${YELLOW}⚠️  .env dosyası bulunamadı, oluşturuluyor...${NC}"
    cp env.example .env
fi

# Backend başlat
echo -e "${BLUE}🚀 Backend başlatılıyor (Port 8000)...${NC}"

source venv/bin/activate

# Port kontrolü
if lsof -Pi :8000 -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo -e "${YELLOW}⚠️  Port 8000 kullanımda, process sonlandırılıyor...${NC}"
    kill $(lsof -t -i:8000) 2>/dev/null || true
    sleep 2
fi

# Backend'i arka planda başlat
nohup python run.py > backend_demo.log 2>&1 &
BACKEND_PID=$!

echo -e "${GREEN}✅ Backend başlatıldı (PID: $BACKEND_PID)${NC}"
echo ""

# Bekle ve kontrol et
echo "   Backend hazırlanıyor..."
sleep 5

if ps -p $BACKEND_PID > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Backend çalışıyor!${NC}"
    echo -e "   ${BLUE}📖 API Docs: http://localhost:8000/api/docs${NC}"
else
    echo -e "${RED}❌ Backend başlatılamadı!${NC}"
    echo "   Log: tail -50 backend_demo.log"
    exit 1
fi

cd ../..

# ============================================================================
# FRONTEND KONTROLÜ
# ============================================================================

echo ""
echo "📦 2. FRONTEND KONTROLÜ"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

cd frontend

if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}⚠️  node_modules bulunamadı, yükleniyor...${NC}"
    npm install
fi

if [ ! -f ".env" ]; then
    echo -e "${YELLOW}⚠️  .env dosyası bulunamadı, oluşturuluyor...${NC}"
    cp env.example .env
fi

echo -e "${BLUE}🚀 Frontend başlatılıyor (Port 3000)...${NC}"
echo ""
echo "   Tarayıcı otomatik açılacak..."
echo ""

# Frontend başlat (arka planda değil, bu terminal'de)
npm start &
FRONTEND_PID=$!

cd ..

# ============================================================================
# ÖZET
# ============================================================================

sleep 8

clear

echo "╔════════════════════════════════════════════════════════════╗"
echo "║                                                            ║"
echo "║          ✅ SİSTEM BAŞARILA BAŞLATILDI! ✅              ║"
echo "║                                                            ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""
echo -e "${GREEN}🌐 KULLANILABILIR URL'LER:${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo -e "   ${BLUE}Frontend:${NC}"
echo -e "   🏠 Ana Sayfa:    http://localhost:3000"
echo -e "   📖 Hakkımızda:   http://localhost:3000/about"
echo -e "   📧 İletişim:     http://localhost:3000/contact-new"
echo -e "   🔐 Login:        http://localhost:3000/login"
echo ""
echo -e "   ${BLUE}Backend:${NC}"
echo -e "   📚 API Docs:     http://localhost:8000/api/docs"
echo -e "   🤖 AI Test:      curl http://localhost:8000/api/ai/teach"
echo ""
echo -e "${YELLOW}📋 TEST SENARYOSU:${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "   1. Ana sayfayı gör:     http://localhost:3000"
echo "   2. Kayıt ol:            Sağ üst 'Kayıt Ol'"
echo "   3. Seviye testi:        /student/placement-test"
echo "   4. Admin onayla:        /admin/approvals"
echo "   5. İlerleme gör:        /student/progress-curriculum"
echo "   6. Derse başla:         İlk açık derse tıkla"
echo "   7. AI ile konuş:        Proaktif ders anlatımı"
echo ""
echo -e "${GREEN}🎯 DEMO ÖZELLİKLERİ:${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "   ✅ Profesyonel landing page"
echo "   ✅ Seviye belirleme testi (15 soru)"
echo "   ✅ Admin onay sistemi"
echo "   ✅ MEB uyumlu müfredat"
echo "   ✅ Proaktif AI öğretmen"
echo "   ✅ İlerleme barı ve raporlar"
echo ""
echo -e "${BLUE}💡 İPUÇLARI:${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "   • Browser console'u açık tutun (F12)"
echo "   • Demo hesap: student / password"
echo "   • Admin hesap: admin / admin"
echo ""
echo -e "${GREEN}📄 LOGLAR:${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "   Backend: tail -f yapayzekaogretmen_python/backend/backend_demo.log"
echo "   Frontend: Browser Console (F12)"
echo ""
echo -e "${YELLOW}⏹️  DURDURMAK İÇİN:${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "   Ctrl+C (Bu terminal'de)"
echo "   veya: pkill -f 'python run.py'"
echo ""
echo "╔════════════════════════════════════════════════════════════╗"
echo "║                 HAYIRLI İŞLER! 🎓💰                      ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# Frontend loglarını göster (background'da değil)
wait $FRONTEND_PID


#!/bin/bash

# =============================================================================
# Yapay Zeka Öğretmen - Otomatik Deployment Script
# =============================================================================
# Vercel (Frontend) + Railway (Backend) + MongoDB Atlas
# =============================================================================

# Renkler
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m'

# Banner
echo -e "${CYAN}"
cat << "EOF"
╔══════════════════════════════════════════════════════════════╗
║                                                              ║
║         🚀 YAPAY ZEKA ÖĞRETMEN - DEPLOYMENT SCRIPT          ║
║                                                              ║
║              Vercel + Railway + MongoDB Atlas                ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
EOF
echo -e "${NC}"

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo -e "${BLUE}📂 Proje Dizini: ${NC}$PROJECT_DIR\n"

# Komutları kontrol et
check_command() {
    if ! command -v $1 &> /dev/null; then
        echo -e "${RED}❌ $1 bulunamadı!${NC}"
        echo -e "${YELLOW}💡 Lütfen yükleyin: $2${NC}"
        return 1
    else
        echo -e "${GREEN}✅ $1 bulundu${NC}"
        return 0
    fi
}

echo -e "${PURPLE}═══════════════════════════════════════════════════════════${NC}"
echo -e "${PURPLE}  1. GEREKSİNİMLER KONTROL EDİLİYOR${NC}"
echo -e "${PURPLE}═══════════════════════════════════════════════════════════${NC}\n"

MISSING_DEPS=0

# Railway CLI
if ! check_command railway "npm i -g @railway/cli"; then
    ((MISSING_DEPS++))
fi

# Vercel CLI
if ! check_command vercel "npm i -g vercel"; then
    ((MISSING_DEPS++))
fi

# Git
if ! check_command git "brew install git"; then
    ((MISSING_DEPS++))
fi

if [ $MISSING_DEPS -gt 0 ]; then
    echo -e "\n${RED}❌ Eksik bağımlılıklar var!${NC}"
    echo -e "${YELLOW}💡 Önce gerekli CLI araçlarını yükleyin:${NC}\n"
    echo -e "  ${CYAN}npm i -g @railway/cli vercel${NC}\n"
    exit 1
fi

echo -e "\n${GREEN}✅ Tüm gereksinimler mevcut!${NC}\n"

# Environment değişkenlerini al
echo -e "${PURPLE}═══════════════════════════════════════════════════════════${NC}"
echo -e "${PURPLE}  2. YAPILANDIRMA BİLGİLERİ${NC}"
echo -e "${PURPLE}═══════════════════════════════════════════════════════════${NC}\n"

echo -e "${YELLOW}📝 Lütfen gerekli bilgileri girin:${NC}\n"

# MongoDB Atlas URL
if [ -z "$MONGODB_URL" ]; then
    echo -e "${CYAN}MongoDB Atlas Connection String:${NC}"
    echo -e "${YELLOW}   (örnek: mongodb+srv://user:pass@cluster.mongodb.net/db)${NC}"
    read -p "   > " MONGODB_URL
fi

# OpenAI API Key
if [ -z "$OPENAI_API_KEY" ]; then
    echo -e "\n${CYAN}OpenAI API Key:${NC}"
    echo -e "${YELLOW}   (sk-... ile başlar)${NC}"
    read -p "   > " OPENAI_API_KEY
fi

# JWT Secret
if [ -z "$JWT_SECRET" ]; then
    echo -e "\n${CYAN}JWT Secret Key (minimum 64 karakter):${NC}"
    echo -e "${YELLOW}   (Güvenli bir string girin)${NC}"
    read -p "   > " JWT_SECRET
fi

# Doğrulama
if [ -z "$MONGODB_URL" ] || [ -z "$OPENAI_API_KEY" ] || [ -z "$JWT_SECRET" ]; then
    echo -e "\n${RED}❌ Tüm bilgiler doldurulmalı!${NC}"
    exit 1
fi

echo -e "\n${GREEN}✅ Yapılandırma bilgileri alındı!${NC}"

# Backend Deployment
echo -e "\n${PURPLE}═══════════════════════════════════════════════════════════${NC}"
echo -e "${PURPLE}  3. BACKEND DEPLOYMENT (Railway)${NC}"
echo -e "${PURPLE}═══════════════════════════════════════════════════════════${NC}\n"

cd "$PROJECT_DIR/yapayzekaogretmen_python/backend"

echo -e "${YELLOW}🔐 Railway'e giriş yapın...${NC}"
railway login

echo -e "\n${YELLOW}📦 Railway projesi oluşturuluyor...${NC}"
railway init || railway link

echo -e "\n${YELLOW}⚙️  Environment variables ayarlanıyor...${NC}"
railway variables set MONGODB_URL="$MONGODB_URL"
railway variables set OPENAI_API_KEY="$OPENAI_API_KEY"
railway variables set JWT_SECRET="$JWT_SECRET"
railway variables set ENVIRONMENT="production"
railway variables set DEBUG="false"
railway variables set PORT="8000"

echo -e "\n${YELLOW}🚀 Backend deploy ediliyor...${NC}"
railway up

echo -e "\n${YELLOW}🔍 Backend URL'i alınıyor...${NC}"
sleep 5
BACKEND_URL=$(railway status --json | python3 -c "import sys, json; print(json.load(sys.stdin).get('deployments', [{}])[0].get('url', ''))" 2>/dev/null)

if [ -z "$BACKEND_URL" ]; then
    echo -e "${YELLOW}⚠️  URL otomatik alınamadı. Railway dashboard'dan alın:${NC}"
    echo -e "${CYAN}   https://railway.app/dashboard${NC}"
    read -p "   Backend URL'i girin: " BACKEND_URL
fi

echo -e "\n${GREEN}✅ Backend deployed!${NC}"
echo -e "${CYAN}   URL: $BACKEND_URL${NC}"

# Frontend Deployment
echo -e "\n${PURPLE}═══════════════════════════════════════════════════════════${NC}"
echo -e "${PURPLE}  4. FRONTEND DEPLOYMENT (Vercel)${NC}"
echo -e "${PURPLE}═══════════════════════════════════════════════════════════${NC}\n"

cd "$PROJECT_DIR/frontend"

# Production environment dosyası oluştur
echo -e "${YELLOW}📝 Production environment dosyası oluşturuluyor...${NC}"
cat > .env.production << EOF
REACT_APP_API_URL=${BACKEND_URL}/api
REACT_APP_WEBSOCKET_URL=${BACKEND_URL/https/wss}/ws
REACT_APP_ENVIRONMENT=production
NODE_ENV=production
EOF

echo -e "${GREEN}✅ .env.production oluşturuldu${NC}"

echo -e "\n${YELLOW}🔐 Vercel'e giriş yapın...${NC}"
vercel login

echo -e "\n${YELLOW}🚀 Frontend deploy ediliyor...${NC}"
vercel --prod --yes

echo -e "\n${GREEN}✅ Frontend deployed!${NC}"

# Özet
echo -e "\n${GREEN}═══════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}  🎉 DEPLOYMENT TAMAMLANDI!${NC}"
echo -e "${GREEN}═══════════════════════════════════════════════════════════${NC}\n"

echo -e "${CYAN}🔗 BAĞLANTILAR:${NC}\n"
echo -e "  ${YELLOW}Backend API:${NC}"
echo -e "    ${BLUE}$BACKEND_URL${NC}"
echo -e "    ${BLUE}$BACKEND_URL/api/docs${NC} (API Docs)"
echo -e "    ${BLUE}$BACKEND_URL/health${NC} (Health Check)\n"

echo -e "  ${YELLOW}Frontend:${NC}"
echo -e "    ${BLUE}[Vercel dashboard'dan URL'i alın]${NC}"
echo -e "    ${CYAN}https://vercel.com/dashboard${NC}\n"

echo -e "  ${YELLOW}Railway Dashboard:${NC}"
echo -e "    ${CYAN}https://railway.app/dashboard${NC}\n"

echo -e "${CYAN}📝 SONRAKİ ADIMLAR:${NC}\n"
echo -e "  1. ${YELLOW}Frontend URL'ini not alın${NC}"
echo -e "  2. ${YELLOW}Her iki URL'i test edin${NC}"
echo -e "  3. ${YELLOW}Login sayfasından giriş yapın${NC}"
echo -e "  4. ${YELLOW}AI Tahta özelliğini test edin${NC}\n"

echo -e "${CYAN}🧪 TEST KOMUTLARI:${NC}\n"
echo -e "  ${YELLOW}# Backend health check${NC}"
echo -e "  curl $BACKEND_URL/health\n"
echo -e "  ${YELLOW}# API test${NC}"
echo -e "  curl $BACKEND_URL/api/\n"

echo -e "${GREEN}═══════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}  🎊 BAŞARILAR! Uygulamanız canlıda!${NC}"
echo -e "${GREEN}═══════════════════════════════════════════════════════════${NC}\n"

# Deployment bilgilerini kaydet
cat > "$PROJECT_DIR/DEPLOYMENT_INFO.txt" << EOF
=============================================================================
YAPAY ZEKA ÖĞRETMEN - DEPLOYMENT BİLGİLERİ
=============================================================================

Deployment Tarihi: $(date)

Backend (Railway):
  URL: $BACKEND_URL
  API Docs: $BACKEND_URL/api/docs
  Health: $BACKEND_URL/health

Frontend (Vercel):
  [Vercel dashboard'dan alın]
  https://vercel.com/dashboard

Database (MongoDB Atlas):
  Connection: [Environment variable'da]

Dashboard'lar:
  Railway: https://railway.app/dashboard
  Vercel: https://vercel.com/dashboard
  MongoDB: https://cloud.mongodb.com/

Test Kullanıcıları:
  Admin: admin@aiogretmen.com / Admin123!
  Öğrenci: murat@student.com / Murat123!

=============================================================================
EOF

echo -e "${YELLOW}💾 Deployment bilgileri kaydedildi: DEPLOYMENT_INFO.txt${NC}\n"


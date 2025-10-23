#!/bin/bash

# =============================================================================
# Yapay Zeka Öğretmen - Hızlı Başlatma Scripti
# =============================================================================
# Bu script sistemi hızlıca başlatmanıza yardımcı olur.
# =============================================================================

# Renkler
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# ASCII Banner
echo -e "${CYAN}"
cat << "EOF"
╔══════════════════════════════════════════════════════════════╗
║                                                              ║
║         🤖 YAPAY ZEKA ÖĞRETMEN - BAŞLATMA SİSTEMİ 📚        ║
║                                                              ║
║              MEB Müfredatına Uygun Eğitim Platformu         ║
║                         Versiyon 1.0.0                       ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
EOF
echo -e "${NC}"

# Proje dizini
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$PROJECT_DIR/yapayzekaogretmen_python/backend"
FRONTEND_DIR="$PROJECT_DIR/frontend"

echo -e "${BLUE}📂 Proje Dizini: ${NC}$PROJECT_DIR\n"

# Fonksiyonlar
check_command() {
    if ! command -v $1 &> /dev/null; then
        echo -e "${RED}❌ $1 bulunamadı! Lütfen $1 yükleyin.${NC}"
        return 1
    else
        echo -e "${GREEN}✅ $1 bulundu${NC}"
        return 0
    fi
}

start_mongodb() {
    echo -e "\n${YELLOW}🔍 MongoDB kontrol ediliyor...${NC}"
    
    # MongoDB çalışıyor mu kontrol et
    if pgrep -x "mongod" > /dev/null; then
        echo -e "${GREEN}✅ MongoDB zaten çalışıyor${NC}"
    else
        echo -e "${YELLOW}📦 MongoDB başlatılıyor...${NC}"
        
        # macOS için
        if [[ "$OSTYPE" == "darwin"* ]]; then
            if command -v brew &> /dev/null; then
                brew services start mongodb-community@7.0 2>/dev/null || \
                brew services start mongodb/brew/mongodb-community 2>/dev/null || \
                mongod --config /usr/local/etc/mongod.conf --fork 2>/dev/null || \
                echo -e "${YELLOW}⚠️  MongoDB manuel olarak başlatılmalı: mongod${NC}"
            fi
        # Linux için
        else
            sudo systemctl start mongod 2>/dev/null || \
            sudo service mongod start 2>/dev/null || \
            mongod --fork --logpath /var/log/mongodb/mongod.log 2>/dev/null || \
            echo -e "${YELLOW}⚠️  MongoDB manuel olarak başlatılmalı: sudo systemctl start mongod${NC}"
        fi
        
        sleep 2
        
        if pgrep -x "mongod" > /dev/null; then
            echo -e "${GREEN}✅ MongoDB başlatıldı${NC}"
        else
            echo -e "${YELLOW}⚠️  MongoDB başlatılamadı (opsiyonel)${NC}"
        fi
    fi
}

start_redis() {
    echo -e "\n${YELLOW}🔍 Redis kontrol ediliyor...${NC}"
    
    # Redis çalışıyor mu kontrol et
    if pgrep -x "redis-server" > /dev/null; then
        echo -e "${GREEN}✅ Redis zaten çalışıyor${NC}"
    else
        echo -e "${YELLOW}📦 Redis başlatılıyor...${NC}"
        
        # macOS için
        if [[ "$OSTYPE" == "darwin"* ]]; then
            if command -v brew &> /dev/null; then
                brew services start redis 2>/dev/null || \
                redis-server --daemonize yes 2>/dev/null || \
                echo -e "${YELLOW}⚠️  Redis manuel olarak başlatılmalı: redis-server${NC}"
            fi
        # Linux için
        else
            sudo systemctl start redis 2>/dev/null || \
            sudo service redis start 2>/dev/null || \
            redis-server --daemonize yes 2>/dev/null || \
            echo -e "${YELLOW}⚠️  Redis manuel olarak başlatılmalı: sudo systemctl start redis${NC}"
        fi
        
        sleep 1
        
        if pgrep -x "redis-server" > /dev/null; then
            echo -e "${GREEN}✅ Redis başlatıldı${NC}"
        else
            echo -e "${YELLOW}⚠️  Redis başlatılamadı (opsiyonel)${NC}"
        fi
    fi
}

# Başlangıç Kontrolü
echo -e "${PURPLE}═══════════════════════════════════════════════════════════${NC}"
echo -e "${PURPLE}  1. SİSTEM GEREKSİNİMLERİ KONTROL EDİLİYOR${NC}"
echo -e "${PURPLE}═══════════════════════════════════════════════════════════${NC}\n"

MISSING_DEPS=0

# Python kontrolü
if check_command python3; then
    PYTHON_VERSION=$(python3 --version 2>&1 | cut -d' ' -f2)
    echo -e "   ${CYAN}Python Versiyon: $PYTHON_VERSION${NC}"
else
    ((MISSING_DEPS++))
fi

# Node.js kontrolü
if check_command node; then
    NODE_VERSION=$(node --version)
    echo -e "   ${CYAN}Node Versiyon: $NODE_VERSION${NC}"
else
    ((MISSING_DEPS++))
fi

# npm kontrolü
if check_command npm; then
    NPM_VERSION=$(npm --version)
    echo -e "   ${CYAN}npm Versiyon: $NPM_VERSION${NC}"
else
    ((MISSING_DEPS++))
fi

if [ $MISSING_DEPS -gt 0 ]; then
    echo -e "\n${RED}❌ Eksik bağımlılıklar var! Lütfen önce gerekli araçları yükleyin.${NC}"
    exit 1
fi

# Veritabanı servisleri
start_mongodb
start_redis

# Backend başlatma
echo -e "\n${PURPLE}═══════════════════════════════════════════════════════════${NC}"
echo -e "${PURPLE}  2. BACKEND SERVİSİ BAŞLATILIYOR${NC}"
echo -e "${PURPLE}═══════════════════════════════════════════════════════════${NC}\n"

cd "$BACKEND_DIR"

# Virtual environment kontrolü
if [ ! -d "venv" ]; then
    echo -e "${YELLOW}📦 Python virtual environment oluşturuluyor...${NC}"
    python3 -m venv venv
fi

# Virtual environment aktif et
source venv/bin/activate

# Gereksinimler yüklenmiş mi kontrol et
if [ ! -f "venv/.installed" ]; then
    echo -e "${YELLOW}📦 Backend gereksinimleri yükleniyor (bu ilk seferde zaman alabilir)...${NC}"
    pip install -r requirements.txt
    touch venv/.installed
    echo -e "${GREEN}✅ Backend gereksinimleri yüklendi${NC}"
fi

# .env dosyası kontrolü
if [ ! -f ".env" ]; then
    echo -e "${YELLOW}⚠️  .env dosyası bulunamadı, env.example kopyalanıyor...${NC}"
    cp env.example .env
    echo -e "${CYAN}💡 .env dosyasını düzenleyerek API anahtarlarınızı ekleyin!${NC}"
fi

# Backend başlat
echo -e "${GREEN}🚀 Backend başlatılıyor...${NC}"
echo -e "${CYAN}   Port: 8000${NC}"
echo -e "${CYAN}   Docs: http://localhost:8000/api/docs${NC}\n"

# Backend'i arka planda başlat
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload > backend.log 2>&1 &
BACKEND_PID=$!
echo $BACKEND_PID > .backend.pid

sleep 3

if ps -p $BACKEND_PID > /dev/null; then
    echo -e "${GREEN}✅ Backend başarıyla başlatıldı (PID: $BACKEND_PID)${NC}"
else
    echo -e "${RED}❌ Backend başlatılamadı! Loglara bakın: tail -f backend.log${NC}"
    exit 1
fi

# Frontend başlatma
echo -e "\n${PURPLE}═══════════════════════════════════════════════════════════${NC}"
echo -e "${PURPLE}  3. FRONTEND SERVİSİ BAŞLATILIYOR${NC}"
echo -e "${PURPLE}═══════════════════════════════════════════════════════════${NC}\n"

cd "$FRONTEND_DIR"

# node_modules kontrolü
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}📦 Frontend gereksinimleri yükleniyor (bu ilk seferde zaman alabilir)...${NC}"
    npm install
    echo -e "${GREEN}✅ Frontend gereksinimleri yüklendi${NC}"
fi

# .env dosyası kontrolü
if [ ! -f ".env" ]; then
    echo -e "${YELLOW}⚠️  .env dosyası bulunamadı, env.example kopyalanıyor...${NC}"
    cp env.example .env
fi

# Frontend başlat
echo -e "${GREEN}🚀 Frontend başlatılıyor...${NC}"
echo -e "${CYAN}   Port: 3000${NC}"
echo -e "${CYAN}   URL: http://localhost:3000${NC}\n"

# Frontend'i arka planda başlat
BROWSER=none npm start > frontend.log 2>&1 &
FRONTEND_PID=$!
echo $FRONTEND_PID > .frontend.pid

sleep 5

if ps -p $FRONTEND_PID > /dev/null; then
    echo -e "${GREEN}✅ Frontend başarıyla başlatıldı (PID: $FRONTEND_PID)${NC}"
else
    echo -e "${RED}❌ Frontend başlatılamadı! Loglara bakın: tail -f frontend.log${NC}"
    kill $BACKEND_PID 2>/dev/null
    exit 1
fi

# Başarı mesajı
echo -e "\n${GREEN}═══════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}  ✅ SİSTEM BAŞARIYLA BAŞLATILDI!${NC}"
echo -e "${GREEN}═══════════════════════════════════════════════════════════${NC}\n"

echo -e "${CYAN}🌐 Frontend URL:    ${NC}${BLUE}http://localhost:3000${NC}"
echo -e "${CYAN}🔌 Backend API:     ${NC}${BLUE}http://localhost:8000/api${NC}"
echo -e "${CYAN}📚 API Docs:        ${NC}${BLUE}http://localhost:8000/api/docs${NC}"
echo -e "${CYAN}📊 GraphQL:         ${NC}${BLUE}http://localhost:8000/api/graphql${NC}"

echo -e "\n${YELLOW}📝 Not:${NC}"
echo -e "   • Backend PID: $BACKEND_PID (Kayıtlı: $BACKEND_DIR/.backend.pid)"
echo -e "   • Frontend PID: $FRONTEND_PID (Kayıtlı: $FRONTEND_DIR/.frontend.pid)"
echo -e "   • Backend log: $BACKEND_DIR/backend.log"
echo -e "   • Frontend log: $FRONTEND_DIR/frontend.log"

echo -e "\n${YELLOW}⏹  Durdurmak için:${NC}"
echo -e "   ${CYAN}./DURDUR.sh${NC} veya"
echo -e "   ${CYAN}kill $BACKEND_PID $FRONTEND_PID${NC}"

echo -e "\n${GREEN}═══════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}  🎉 İyi Çalışmalar! aiogretmen.com${NC}"
echo -e "${GREEN}═══════════════════════════════════════════════════════════${NC}\n"

# Durdurma scripti oluştur
cat > "$PROJECT_DIR/DURDUR.sh" << 'STOPEOF'
#!/bin/bash

# Renkler
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${YELLOW}🛑 Yapay Zeka Öğretmen durduruluyor...${NC}\n"

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$PROJECT_DIR/yapayzekaogretmen_python/backend"
FRONTEND_DIR="$PROJECT_DIR/frontend"

# Backend'i durdur
if [ -f "$BACKEND_DIR/.backend.pid" ]; then
    BACKEND_PID=$(cat "$BACKEND_DIR/.backend.pid")
    if ps -p $BACKEND_PID > /dev/null 2>&1; then
        kill $BACKEND_PID
        echo -e "${GREEN}✅ Backend durduruldu (PID: $BACKEND_PID)${NC}"
    fi
    rm "$BACKEND_DIR/.backend.pid"
fi

# Frontend'i durdur
if [ -f "$FRONTEND_DIR/.frontend.pid" ]; then
    FRONTEND_PID=$(cat "$FRONTEND_DIR/.frontend.pid")
    if ps -p $FRONTEND_PID > /dev/null 2>&1; then
        kill $FRONTEND_PID
        echo -e "${GREEN}✅ Frontend durduruldu (PID: $FRONTEND_PID)${NC}"
    fi
    rm "$FRONTEND_DIR/.frontend.pid"
fi

# Port 8000 ve 3000'de çalışan tüm processleri durdur
lsof -ti:8000 | xargs kill -9 2>/dev/null
lsof -ti:3000 | xargs kill -9 2>/dev/null

echo -e "\n${GREEN}✅ Tüm servisler durduruldu!${NC}\n"
STOPEOF

chmod +x "$PROJECT_DIR/DURDUR.sh"

# Tarayıcıyı aç (opsiyonel)
sleep 2
if command -v open &> /dev/null; then
    open http://localhost:3000
elif command -v xdg-open &> /dev/null; then
    xdg-open http://localhost:3000
fi


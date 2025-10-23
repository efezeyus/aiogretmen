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

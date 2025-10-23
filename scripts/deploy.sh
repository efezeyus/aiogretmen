#!/bin/bash

# Yapay Zeka Öğretmen - Deployment Script
# ----------------------------------------

set -e

echo "🚀 Yapay Zeka Öğretmen - Deployment Başlatılıyor..."

# Check if .env file exists
if [ ! -f .env ]; then
    echo "❌ .env dosyası bulunamadı. docker.env.example'dan kopyalayın."
    exit 1
fi

# Load environment variables
export $(cat .env | grep -v '#' | xargs)

# Function to check if service is healthy
check_service() {
    local service=$1
    local port=$2
    local max_attempts=30
    local attempt=0
    
    echo "⏳ $service servisinin başlaması bekleniyor..."
    
    while [ $attempt -lt $max_attempts ]; do
        if nc -z localhost $port 2>/dev/null; then
            echo "✅ $service servisi hazır!"
            return 0
        fi
        
        attempt=$((attempt + 1))
        sleep 2
    done
    
    echo "❌ $service servisi başlatılamadı!"
    return 1
}

# Build images
echo "🔨 Docker image'ları oluşturuluyor..."
docker-compose build --parallel

# Start infrastructure services first
echo "🏗️ Altyapı servisleri başlatılıyor..."
docker-compose up -d mongodb redis elasticsearch postgres

# Wait for infrastructure
check_service "MongoDB" 27017
check_service "Redis" 6379
check_service "Elasticsearch" 9200
check_service "PostgreSQL" 5432

# Run database migrations
echo "📊 Veritabanı migration'ları çalıştırılıyor..."
docker-compose run --rm backend python -m alembic upgrade head

# Start application services
echo "🚀 Uygulama servisleri başlatılıyor..."
docker-compose up -d backend frontend nginx celery celery-beat flower

# Wait for application services
check_service "Backend API" 8000
check_service "Frontend" 3000
check_service "Nginx" 80

echo "✅ Deployment tamamlandı!"
echo ""
echo "📌 Servis URL'leri:"
echo "   - Frontend: http://localhost"
echo "   - Backend API: http://localhost/api"
echo "   - API Docs: http://localhost/api/docs"
echo "   - Flower (Celery): http://localhost:5555"
echo ""
echo "📝 Log'ları görmek için: docker-compose logs -f [service-name]"
echo "🛑 Durdurmak için: docker-compose down"

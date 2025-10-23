# Yapay Zeka Öğretmen - Production Deployment Kılavuzu

## Sunucu Gereksinimleri

### Minimum Gereksinimler
- CPU: 4 vCPU
- RAM: 8 GB
- Disk: 50 GB SSD
- OS: Ubuntu 22.04 LTS veya CentOS 8+

### Önerilen Gereksinimler
- CPU: 8 vCPU
- RAM: 16 GB
- Disk: 100 GB SSD
- OS: Ubuntu 22.04 LTS

## Deployment Adımları

### 1. Sunucu Hazırlığı

```bash
# Sistem güncelleme
sudo apt update && sudo apt upgrade -y

# Gerekli paketleri yükle
sudo apt install -y \
    docker.io \
    docker-compose \
    nginx \
    certbot \
    python3-certbot-nginx \
    git \
    ufw

# Docker servisini başlat
sudo systemctl start docker
sudo systemctl enable docker

# Kullanıcıyı docker grubuna ekle
sudo usermod -aG docker $USER
```

### 2. Firewall Yapılandırması

```bash
# UFW'yi etkinleştir
sudo ufw enable

# Gerekli portları aç
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw allow 8000/tcp  # Backend API (gerekirse)
```

### 3. Projeyi Deploy Et

```bash
# Proje dizinini oluştur
sudo mkdir -p /opt/yapayzekaogretmen
cd /opt/yapayzekaogretmen

# Projeyi klonla
sudo git clone https://github.com/kullaniciadi/yapayzekaogretmen.git .

# Sahipliği ayarla
sudo chown -R $USER:$USER /opt/yapayzekaogretmen
```

### 4. Production Environment Dosyaları

Backend `.env.production`:
```env
# Sunucu Yapılandırması
APP_ENV=production
DEBUG=False
SECRET_KEY=<GÜÇLÜ_RASTGELE_ANAHTAR>
API_PREFIX=/api
PORT=8000
HOST=0.0.0.0

# PostgreSQL Veritabanı
POSTGRES_USER=yapayzekaogretmen_user
POSTGRES_PASSWORD=<GÜÇLÜ_PAROLA>
POSTGRES_SERVER=postgresql
POSTGRES_PORT=5432
POSTGRES_DB=yapayzekaogretmen_prod

# MongoDB Veritabanı
MONGODB_URL=mongodb://yapayzekaogretmen_user:<GÜÇLÜ_PAROLA>@mongodb:27017/yapayzekaogretmen_prod?authSource=admin

# JWT Kimlik Doğrulama
JWT_SECRET=<GÜÇLÜ_RASTGELE_JWT_ANAHTARI>
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7

# OpenAI API
OPENAI_API_KEY=<OPENAI_API_ANAHTARINIZ>

# E-posta
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=noreply@yapayzekaogretmen.com
SMTP_PASSWORD=<APP_PASSWORD>

# Stripe
STRIPE_API_KEY=<STRIPE_API_KEY>
STRIPE_WEBHOOK_SECRET=<STRIPE_WEBHOOK_SECRET>
```

### 5. Docker Compose Production

`docker-compose.production.yml`:
```yaml
version: '3.9'

services:
  mongodb:
    image: mongo:7.0
    container_name: yapayzekaogretmen_mongodb
    restart: always
    environment:
      MONGO_INITDB_ROOT_USERNAME: yapayzekaogretmen_user
      MONGO_INITDB_ROOT_PASSWORD: ${MONGO_PASSWORD}
      MONGO_INITDB_DATABASE: yapayzekaogretmen_prod
    volumes:
      - mongodb_data:/data/db
    networks:
      - internal

  postgresql:
    image: postgres:16-alpine
    container_name: yapayzekaogretmen_postgresql
    restart: always
    environment:
      POSTGRES_USER: yapayzekaogretmen_user
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
      POSTGRES_DB: yapayzekaogretmen_prod
    volumes:
      - postgres_data:/var/lib/postgresql/data
    networks:
      - internal

  backend:
    build:
      context: ./yapayzekaogretmen_python/backend
      dockerfile: Dockerfile.production
    container_name: yapayzekaogretmen_backend
    restart: always
    env_file:
      - .env.production
    depends_on:
      - mongodb
      - postgresql
    volumes:
      - backend_media:/app/media
      - backend_logs:/app/logs
    networks:
      - internal
      - web

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile.production
    container_name: yapayzekaogretmen_frontend
    restart: always
    networks:
      - web

volumes:
  mongodb_data:
  postgres_data:
  backend_media:
  backend_logs:

networks:
  internal:
  web:
    external: true
```

### 6. Nginx Yapılandırması

`/etc/nginx/sites-available/yapayzekaogretmen`:
```nginx
server {
    listen 80;
    server_name yapayzekaogretmen.com www.yapayzekaogretmen.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yapayzekaogretmen.com www.yapayzekaogretmen.com;

    ssl_certificate /etc/letsencrypt/live/yapayzekaogretmen.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yapayzekaogretmen.com/privkey.pem;

    # Frontend
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:8000;
        proxy_http_version 1.1;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # WebSocket
    location /ws {
        proxy_pass http://localhost:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
    }

    # Media files
    location /media {
        alias /opt/yapayzekaogretmen/backend_media;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }
}
```

### 7. SSL Sertifikası

```bash
# Let's Encrypt SSL sertifikası al
sudo certbot --nginx -d yapayzekaogretmen.com -d www.yapayzekaogretmen.com

# Otomatik yenileme için cron job
sudo crontab -e
# Ekle: 0 12 * * * /usr/bin/certbot renew --quiet
```

### 8. Deployment Başlat

```bash
# Production compose'u başlat
docker-compose -f docker-compose.production.yml up -d

# Logları kontrol et
docker-compose -f docker-compose.production.yml logs -f

# Nginx'i başlat
sudo systemctl restart nginx
```

## Monitoring ve Logging

### 1. Prometheus + Grafana

```yaml
# docker-compose.monitoring.yml
version: '3.9'

services:
  prometheus:
    image: prom/prometheus:latest
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml
      - prometheus_data:/prometheus
    ports:
      - "9090:9090"

  grafana:
    image: grafana/grafana:latest
    volumes:
      - grafana_data:/var/lib/grafana
    ports:
      - "3001:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin
```

### 2. ELK Stack (Elasticsearch, Logstash, Kibana)

Logların merkezi yönetimi için ELK stack kurulumu önerilir.

## Backup Stratejisi

### Otomatik Backup Script

`/opt/yapayzekaogretmen/scripts/backup.sh`:
```bash
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups/yapayzekaogretmen"

# MongoDB backup
docker exec yapayzekaogretmen_mongodb mongodump --out /backup/$DATE

# PostgreSQL backup
docker exec yapayzekaogretmen_postgresql pg_dump -U yapayzekaogretmen_user yapayzekaogretmen_prod > $BACKUP_DIR/postgres_$DATE.sql

# Media files backup
tar -czf $BACKUP_DIR/media_$DATE.tar.gz /opt/yapayzekaogretmen/backend_media

# S3'e yükle (opsiyonel)
aws s3 sync $BACKUP_DIR s3://yapayzekaogretmen-backups/
```

### Cron Job

```bash
# Her gün saat 02:00'da backup al
0 2 * * * /opt/yapayzekaogretmen/scripts/backup.sh
```

## Güvenlik Önlemleri

1. **Güçlü Parolalar**: Tüm servisler için güçlü parolalar kullanın
2. **Firewall**: Sadece gerekli portları açın
3. **SSL/TLS**: Her zaman HTTPS kullanın
4. **Rate Limiting**: API için rate limiting uygulayın
5. **CORS**: Production'da CORS'u sıkı tutun
6. **Secrets Management**: HashiCorp Vault veya AWS Secrets Manager kullanın

## Performans Optimizasyonu

1. **CDN**: Statik dosyalar için Cloudflare veya AWS CloudFront
2. **Redis Cache**: Sık kullanılan veriler için Redis cache
3. **Database Indexing**: Veritabanı sorgularını optimize edin
4. **Load Balancing**: Yük dengeleme için HAProxy veya Nginx
5. **Auto Scaling**: Kubernetes veya Docker Swarm ile auto scaling

## Sorun Giderme

### Container Logları
```bash
docker-compose logs -f backend
docker-compose logs -f frontend
```

### Sistem Kaynak Kullanımı
```bash
docker stats
htop
```

### Database Bağlantı Testi
```bash
docker exec -it yapayzekaogretmen_postgresql psql -U yapayzekaogretmen_user -d yapayzekaogretmen_prod
docker exec -it yapayzekaogretmen_mongodb mongosh
``` 
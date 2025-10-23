#!/usr/bin/env python
"""
Yapay Zeka Öğretmen - Uygulama Başlatma Betiği
--------------------------------------------
FastAPI uygulamasını başlatmak için kullanılan betik.
"""
import os
import uvicorn
import argparse
from dotenv import load_dotenv

# Çevre değişkenlerini yükle
load_dotenv()

# Argüman ayrıştırıcı
parser = argparse.ArgumentParser(description="Yapay Zeka Öğretmen API")
parser.add_argument(
    "--port", type=int, default=int(os.getenv("PORT", 8000)), help="Kullanılacak port"
)
parser.add_argument(
    "--host", type=str, default=os.getenv("HOST", "0.0.0.0"), help="Bağlanılacak host"
)
parser.add_argument(
    "--reload", action="store_true", help="Otomatik yeniden yükleme (geliştirme için)"
)
parser.add_argument(
    "--workers", type=int, default=1, help="Çalışan işlem sayısı"
)
parser.add_argument(
    "--log-level", type=str, default=os.getenv("LOG_LEVEL", "info").lower(),
    choices=["debug", "info", "warning", "error", "critical"],
    help="Günlükleme seviyesi"
)
args = parser.parse_args()

if __name__ == "__main__":
    """Uygulama başlatma"""
    print(f"""
    =================================================
    Yapay Zeka Öğretmen API Başlatılıyor
    -------------------------------------------------
    Host:       {args.host}
    Port:       {args.port}
    Reload:     {'Açık' if args.reload else 'Kapalı'}
    Workers:    {args.workers}
    Log Level:  {args.log_level.upper()}
    =================================================
    """)
    
    uvicorn.run(
        "app.main:app",
        host=args.host,
        port=args.port,
        reload=args.reload,
        workers=args.workers,
        log_level=args.log_level,
    ) 
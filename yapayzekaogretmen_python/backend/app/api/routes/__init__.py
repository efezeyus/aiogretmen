"""
Yapay Zeka Öğretmen - API Routes
-------------------------------
API endpoint'leri için route modülleri.
"""

# Route modüllerini import et
from . import auth, users, ai, curriculum, lessons, payments, admin_curriculum

# Tüm route'ları dışa aktar
__all__ = ["auth", "users", "ai", "curriculum", "lessons", "payments", "admin_curriculum"] 
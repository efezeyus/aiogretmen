"""
Yapay Zeka Öğretmen - Services
-----------------------------
İş mantığı servisleri.
"""

from . import (
    ai_service,
    course_service,
    curriculum_service,
    lesson_service,
    payment_service,
    user_service,
)

# Opsiyonel modüller
try:
    from . import pdf_service
except ImportError:
    pass

try:
    from . import vector_db_service
except ImportError:
    pass

try:
    # from . import rag_service  # Temporarily disabled
    pass
except ImportError:
    pass

try:
    from . import auto_learning_service
except ImportError:
    pass

try:
    from . import personalized_learning_engine
except ImportError:
    pass

try:
    from . import ai_study_buddy
except ImportError:
    pass

try:
    from . import learning_analytics_engine
except ImportError:
    pass

__all__ = [
    "ai_service",
    "course_service", 
    "curriculum_service",
    "lesson_service",
    "payment_service",
    "user_service",
    "pdf_service",
    "vector_db_service",
    # "rag_service",  # Temporarily disabled
    "auto_learning_service",
    "personalized_learning_engine",
    "ai_study_buddy",
    "learning_analytics_engine",
]

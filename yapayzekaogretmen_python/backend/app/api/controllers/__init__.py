"""
Yapay Zeka Öğretmen - Controller Modülleri
----------------------------------------
Controller modüllerini bir araya getirir.
"""

from . import (
    auth_controller,
    user_controller,
    curriculum_controller,
    personalized_curriculum_controller
)

__all__ = [
    "auth_controller",
    "user_controller", 
    "curriculum_controller",
    "personalized_curriculum_controller"
]

"""
Yapay Zeka Öğretmen - Temel Modeller
-----------------------------------
Veritabanı modelleri için temel sınıflar.
"""
from bson import ObjectId
from typing import Any, Optional
from pydantic import BaseModel, Field
from sqlalchemy.orm import declarative_base

# SQLAlchemy temel sınıfı
Base = declarative_base()


class PyObjectId(ObjectId):
    """MongoDB ObjectId için özel sınıf."""

    @classmethod
    def __get_validators__(cls):
        yield cls.validate

    @classmethod
    def validate(cls, v):
        if not ObjectId.is_valid(v):
            raise ValueError("Geçerli bir ObjectId değil")
        return ObjectId(v)

    @classmethod
    def __modify_schema__(cls, field_schema):
        field_schema.update(type="string") 
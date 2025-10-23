"""
Search API Routes
----------------
Elasticsearch powered search endpoints.
"""

from fastapi import APIRouter, Query, HTTPException, status, Depends
from typing import List, Optional, Dict
from datetime import datetime
from pydantic import BaseModel, Field

from app.core.logger import logger
from app.services.search_service import search_service
from app.models.user import User


# Basit auth kontrolü (gerçek uygulamada auth middleware kullanılmalı)
async def get_current_user():
    """Basit kullanıcı döndürme (demo için)"""
    return type('User', (), {
        'id': 'demo_user',
        'username': 'demo',
        'role': 'admin',
        'grade_level': 5
    })


router = APIRouter(
    prefix="/search",
    tags=["Search"]
)


# Request/Response Models
class SearchRequest(BaseModel):
    """Arama isteği modeli"""
    query: str = Field(..., min_length=1, description="Arama sorgusu")
    index_type: Optional[str] = Field(None, description="Index tipi: lessons, users, content, questions")
    filters: Optional[Dict] = Field(default_factory=dict, description="Filtreler")
    size: int = Field(10, ge=1, le=100, description="Sonuç sayısı")
    from_: int = Field(0, ge=0, description="Başlangıç offset'i", alias="from")
    highlight: bool = Field(True, description="Highlight aktif mi?")
    fuzzy: bool = Field(True, description="Fuzzy search aktif mi?")


class SearchHit(BaseModel):
    """Arama sonucu"""
    id: str
    index: str
    score: float
    source: Dict
    highlight: Optional[Dict] = None


class SearchResponse(BaseModel):
    """Arama yanıtı"""
    hits: List[SearchHit]
    total: int
    took: int
    aggregations: Optional[Dict] = None


class IndexDocumentRequest(BaseModel):
    """Doküman indeksleme isteği"""
    index_type: str = Field(..., description="Index tipi")
    document: Dict = Field(..., description="İndekslenecek doküman")
    doc_id: Optional[str] = Field(None, description="Doküman ID")


class AutocompleteResponse(BaseModel):
    """Otomatik tamamlama yanıtı"""
    suggestions: List[str]


@router.post("/", response_model=SearchResponse)
async def search(
    request: SearchRequest,
    current_user: User = Depends(get_current_user)
):
    """
    Gelişmiş arama endpoint'i
    
    Özellikler:
    - Fuzzy search (typo toleransı)
    - Highlighting
    - Filtreleme
    - Aggregation
    - Multi-index arama
    """
    try:
        # Kullanıcı seviyesine göre filtre ekle
        if request.index_type == "lessons" and hasattr(current_user, 'grade_level'):
            # Kullanıcının seviyesine uygun dersleri göster
            if "grade_level" not in request.filters:
                request.filters["grade_level"] = {
                    "gte": max(1, current_user.grade_level - 1),
                    "lte": min(12, current_user.grade_level + 1)
                }
        
        # Arama yap
        results = await search_service.search(
            query=request.query,
            index_type=request.index_type,
            filters=request.filters,
            size=request.size,
            from_=request.from_,
            highlight=request.highlight,
            fuzzy=request.fuzzy
        )
        
        # Response formatla
        hits = []
        for hit in results.get("hits", []):
            search_hit = SearchHit(
                id=hit["id"],
                index=hit["index"],
                score=hit["score"],
                source={k: v for k, v in hit.items() if k not in ["id", "index", "score", "highlight"]},
                highlight=hit.get("highlight")
            )
            hits.append(search_hit)
        
        return SearchResponse(
            hits=hits,
            total=results.get("total", 0),
            took=results.get("took", 0),
            aggregations=results.get("aggregations")
        )
        
    except Exception as e:
        logger.error(f"Arama hatası: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Arama işlemi başarısız"
        )


@router.get("/lessons", response_model=SearchResponse)
async def search_lessons(
    q: str = Query(..., description="Arama sorgusu"),
    subject: Optional[str] = Query(None, description="Ders konusu"),
    grade_level: Optional[int] = Query(None, ge=1, le=12, description="Sınıf seviyesi"),
    difficulty: Optional[str] = Query(None, description="Zorluk: easy, medium, hard"),
    limit: int = Query(10, ge=1, le=50, description="Sonuç limiti"),
    offset: int = Query(0, ge=0, description="Offset"),
    current_user: User = Depends(get_current_user)
):
    """Ders arama (özelleştirilmiş)"""
    filters = {}
    if subject:
        filters["subject"] = subject
    if grade_level:
        filters["grade_level"] = grade_level
    if difficulty:
        filters["difficulty"] = difficulty
    
    # Kullanıcının favori konularına göre boost (örnek)
    # TODO: Kullanıcı tercihlerini implement et
    
    results = await search_service.search(
        query=q,
        index_type="lessons",
        filters=filters,
        size=limit,
        from_=offset
    )
    
    # Format response
    hits = []
    for hit in results.get("hits", []):
        search_hit = SearchHit(
            id=hit["id"],
            index=hit["index"],
            score=hit["score"],
            source={k: v for k, v in hit.items() if k not in ["id", "index", "score", "highlight"]},
            highlight=hit.get("highlight")
        )
        hits.append(search_hit)
    
    return SearchResponse(
        hits=hits,
        total=results.get("total", 0),
        took=results.get("took", 0),
        aggregations=results.get("aggregations")
    )


@router.get("/autocomplete", response_model=AutocompleteResponse)
async def autocomplete(
    q: str = Query(..., min_length=2, description="Arama prefix'i"),
    index_type: str = Query("lessons", description="Index tipi"),
    size: int = Query(5, ge=1, le=10, description="Öneri sayısı")
):
    """
    Otomatik tamamlama
    
    Kullanıcı yazdıkça öneri gösterir.
    """
    suggestions = await search_service.autocomplete(
        prefix=q,
        index_type=index_type,
        size=size
    )
    
    return AutocompleteResponse(suggestions=suggestions)


@router.get("/similar/{index_type}/{doc_id}")
async def get_similar_documents(
    index_type: str,
    doc_id: str,
    size: int = Query(5, ge=1, le=20, description="Benzer doküman sayısı"),
    current_user: User = Depends(get_current_user)
):
    """
    Benzer dokümanları bul
    
    More Like This algoritması kullanır.
    """
    similar = await search_service.similar_documents(
        doc_id=doc_id,
        index_type=index_type,
        size=size
    )
    
    return {
        "similar_documents": similar,
        "count": len(similar)
    }


@router.post("/index")
async def index_document(
    request: IndexDocumentRequest,
    current_user: User = Depends(get_current_user)
):
    """
    Doküman indeksle
    
    Admin yetkisi gerektirir.
    """
    # Yetki kontrolü
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Bu işlem için admin yetkisi gereklidir"
        )
    
    # Metadata ekle
    request.document["indexed_by"] = str(current_user.id)
    request.document["indexed_at"] = datetime.utcnow().isoformat()
    
    success = await search_service.index_document(
        index_type=request.index_type,
        document=request.document,
        doc_id=request.doc_id
    )
    
    if success:
        return {"success": True, "message": "Doküman başarıyla indekslendi"}
    else:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Doküman indeksleme başarısız"
        )


@router.post("/bulk-index")
async def bulk_index_documents(
    index_type: str,
    documents: List[Dict],
    current_user: User = Depends(get_current_user)
):
    """
    Toplu doküman indeksleme
    
    Admin yetkisi gerektirir.
    """
    # Yetki kontrolü
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Bu işlem için admin yetkisi gereklidir"
        )
    
    # Metadata ekle
    for doc in documents:
        doc["indexed_by"] = str(current_user.id)
        doc["indexed_at"] = datetime.utcnow().isoformat()
    
    indexed_count = await search_service.bulk_index(
        index_type=index_type,
        documents=documents
    )
    
    return {
        "success": True,
        "indexed": indexed_count,
        "total": len(documents)
    }


@router.delete("/{index_type}/{doc_id}")
async def delete_document(
    index_type: str,
    doc_id: str,
    current_user: User = Depends(get_current_user)
):
    """
    Doküman sil
    
    Admin yetkisi gerektirir.
    """
    # Yetki kontrolü
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Bu işlem için admin yetkisi gereklidir"
        )
    
    success = await search_service.delete_document(
        doc_id=doc_id,
        index_type=index_type
    )
    
    if success:
        return {"success": True, "message": "Doküman başarıyla silindi"}
    else:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Doküman bulunamadı"
        )


@router.patch("/{index_type}/{doc_id}")
async def update_document(
    index_type: str,
    doc_id: str,
    updates: Dict,
    current_user: User = Depends(get_current_user)
):
    """
    Doküman güncelle
    
    Admin yetkisi gerektirir.
    """
    # Yetki kontrolü
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Bu işlem için admin yetkisi gereklidir"
        )
    
    # Metadata ekle
    updates["updated_by"] = str(current_user.id)
    updates["updated_at"] = datetime.utcnow().isoformat()
    
    success = await search_service.update_document(
        doc_id=doc_id,
        index_type=index_type,
        updates=updates
    )
    
    if success:
        return {"success": True, "message": "Doküman başarıyla güncellendi"}
    else:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Doküman bulunamadı"
        )


@router.get("/stats")
async def get_search_stats(
    index_type: Optional[str] = Query(None, description="Belirli bir index için"),
    current_user: User = Depends(get_current_user)
):
    """
    Arama istatistikleri
    
    Admin yetkisi gerektirir.
    """
    # Yetki kontrolü
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Bu işlem için admin yetkisi gereklidir"
        )
    
    stats = await search_service.get_stats(index_type)
    
    return {
        "stats": stats,
        "timestamp": datetime.utcnow().isoformat()
    }


@router.get("/trending")
async def get_trending_searches(
    period_days: int = Query(7, description="Trend periyodu (gün)"),
    limit: int = Query(10, description="Sonuç limiti")
):
    """
    Trend olan aramalar
    
    Son dönemde popüler olan arama terimleri.
    """
    # TODO: Arama loglarından trend analizi
    # Şimdilik örnek data
    
    trending = [
        {"term": "kesirler", "count": 245, "trend": "+15%"},
        {"term": "fotosintez", "count": 189, "trend": "+8%"},
        {"term": "ingilizce gramer", "count": 156, "trend": "+22%"},
        {"term": "coğrafya harita", "count": 134, "trend": "-5%"},
        {"term": "osmanlı tarihi", "count": 98, "trend": "+12%"}
    ]
    
    return {
        "trending": trending[:limit],
        "period_days": period_days,
        "generated_at": datetime.utcnow().isoformat()
    }

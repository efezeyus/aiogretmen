"""
Elasticsearch Service - Advanced Search Capabilities
---------------------------------------------------
Gelişmiş arama ve indeksleme servisi.
"""

from typing import List, Dict, Any, Optional, Union
from datetime import datetime
from elasticsearch import AsyncElasticsearch, helpers
import asyncio
import json
from loguru import logger

from app.core.config import settings
from app.core.logger import logger as app_logger


class SearchService:
    """Elasticsearch tabanlı arama servisi"""
    
    def __init__(self):
        self.es_url = getattr(settings, 'ELASTICSEARCH_URL', 'http://localhost:9200')
        self.client: Optional[AsyncElasticsearch] = None
        self.is_connected = False
        
        # Index isimleri
        self.indices = {
            "lessons": "yzogretmen_lessons",
            "users": "yzogretmen_users",
            "content": "yzogretmen_content",
            "questions": "yzogretmen_questions",
            "logs": "yzogretmen_logs"
        }
        
        logger.info("Search Service başlatıldı")
    
    async def connect(self):
        """Elasticsearch'e bağlan"""
        try:
            self.client = AsyncElasticsearch(
                [self.es_url],
                verify_certs=False,
                ssl_show_warn=False
            )
            
            # Bağlantı testi
            info = await self.client.info()
            self.is_connected = True
            logger.info(f"Elasticsearch bağlantısı başarılı: {info['version']['number']}")
            
            # Index'leri oluştur
            await self._create_indices()
            
        except Exception as e:
            logger.error(f"Elasticsearch bağlantı hatası: {e}")
            self.is_connected = False
    
    async def disconnect(self):
        """Elasticsearch bağlantısını kapat"""
        if self.client:
            await self.client.close()
            self.is_connected = False
            logger.info("Elasticsearch bağlantısı kapatıldı")
    
    async def _create_indices(self):
        """Index'leri oluştur"""
        # Lessons index
        lessons_mapping = {
            "mappings": {
                "properties": {
                    "title": {
                        "type": "text",
                        "analyzer": "turkish",
                        "fields": {
                            "keyword": {"type": "keyword"}
                        }
                    },
                    "content": {
                        "type": "text",
                        "analyzer": "turkish"
                    },
                    "subject": {"type": "keyword"},
                    "grade_level": {"type": "integer"},
                    "tags": {"type": "keyword"},
                    "created_at": {"type": "date"},
                    "updated_at": {"type": "date"},
                    "author_id": {"type": "keyword"},
                    "view_count": {"type": "integer"},
                    "rating": {"type": "float"},
                    "difficulty": {"type": "keyword"},
                    "duration_minutes": {"type": "integer"},
                    "objectives": {
                        "type": "text",
                        "analyzer": "turkish"
                    },
                    "prerequisites": {"type": "keyword"},
                    "resources": {
                        "type": "nested",
                        "properties": {
                            "type": {"type": "keyword"},
                            "url": {"type": "keyword"},
                            "title": {"type": "text"}
                        }
                    },
                    "suggest": {
                        "type": "completion",
                        "analyzer": "turkish"
                    }
                }
            },
            "settings": {
                "analysis": {
                    "analyzer": {
                        "turkish": {
                            "type": "custom",
                            "tokenizer": "standard",
                            "filter": ["lowercase", "turkish_stop", "turkish_stemmer"]
                        }
                    },
                    "filter": {
                        "turkish_stop": {
                            "type": "stop",
                            "stopwords": "_turkish_"
                        },
                        "turkish_stemmer": {
                            "type": "stemmer",
                            "language": "turkish"
                        }
                    }
                }
            }
        }
        
        # Users index
        users_mapping = {
            "mappings": {
                "properties": {
                    "username": {"type": "keyword"},
                    "full_name": {
                        "type": "text",
                        "analyzer": "turkish",
                        "fields": {
                            "keyword": {"type": "keyword"}
                        }
                    },
                    "email": {"type": "keyword"},
                    "role": {"type": "keyword"},
                    "grade_level": {"type": "integer"},
                    "subjects": {"type": "keyword"},
                    "created_at": {"type": "date"},
                    "last_active": {"type": "date"},
                    "is_active": {"type": "boolean"},
                    "achievements": {"type": "keyword"},
                    "skills": {
                        "type": "nested",
                        "properties": {
                            "subject": {"type": "keyword"},
                            "level": {"type": "integer"}
                        }
                    }
                }
            }
        }
        
        # Content index (PDF, dokümanlar)
        content_mapping = {
            "mappings": {
                "properties": {
                    "title": {
                        "type": "text",
                        "analyzer": "turkish"
                    },
                    "content": {
                        "type": "text",
                        "analyzer": "turkish"
                    },
                    "file_type": {"type": "keyword"},
                    "file_path": {"type": "keyword"},
                    "subject": {"type": "keyword"},
                    "grade_level": {"type": "integer"},
                    "chapter": {"type": "keyword"},
                    "page_number": {"type": "integer"},
                    "extracted_at": {"type": "date"},
                    "metadata": {"type": "object"}
                }
            }
        }
        
        # Questions index
        questions_mapping = {
            "mappings": {
                "properties": {
                    "question_text": {
                        "type": "text",
                        "analyzer": "turkish"
                    },
                    "answer": {
                        "type": "text",
                        "analyzer": "turkish"
                    },
                    "subject": {"type": "keyword"},
                    "grade_level": {"type": "integer"},
                    "topic": {"type": "keyword"},
                    "difficulty": {"type": "keyword"},
                    "type": {"type": "keyword"},  # multiple_choice, open_ended, etc.
                    "options": {"type": "keyword"},
                    "explanation": {
                        "type": "text",
                        "analyzer": "turkish"
                    },
                    "tags": {"type": "keyword"},
                    "usage_count": {"type": "integer"},
                    "success_rate": {"type": "float"}
                }
            }
        }
        
        # Index'leri oluştur
        indices_config = {
            self.indices["lessons"]: lessons_mapping,
            self.indices["users"]: users_mapping,
            self.indices["content"]: content_mapping,
            self.indices["questions"]: questions_mapping
        }
        
        for index_name, mapping in indices_config.items():
            try:
                exists = await self.client.indices.exists(index=index_name)
                if not exists:
                    await self.client.indices.create(index=index_name, body=mapping)
                    logger.info(f"Index oluşturuldu: {index_name}")
            except Exception as e:
                logger.error(f"Index oluşturma hatası ({index_name}): {e}")
    
    async def index_document(
        self,
        index_type: str,
        document: Dict[str, Any],
        doc_id: Optional[str] = None
    ) -> bool:
        """Doküman indeksle"""
        if not self.is_connected:
            return False
        
        try:
            index_name = self.indices.get(index_type)
            if not index_name:
                logger.error(f"Geçersiz index tipi: {index_type}")
                return False
            
            # Timestamp ekle
            document["indexed_at"] = datetime.utcnow()
            
            # Suggest field ekle (lessons için)
            if index_type == "lessons" and "title" in document:
                document["suggest"] = {
                    "input": [document["title"]],
                    "weight": document.get("view_count", 1)
                }
            
            result = await self.client.index(
                index=index_name,
                id=doc_id,
                body=document
            )
            
            return result["result"] in ["created", "updated"]
            
        except Exception as e:
            logger.error(f"Doküman indeksleme hatası: {e}")
            return False
    
    async def bulk_index(
        self,
        index_type: str,
        documents: List[Dict[str, Any]]
    ) -> int:
        """Toplu indeksleme"""
        if not self.is_connected or not documents:
            return 0
        
        try:
            index_name = self.indices.get(index_type)
            if not index_name:
                return 0
            
            # Bulk actions hazırla
            actions = []
            for doc in documents:
                doc["indexed_at"] = datetime.utcnow()
                
                action = {
                    "_index": index_name,
                    "_source": doc
                }
                
                if "_id" in doc:
                    action["_id"] = doc.pop("_id")
                
                actions.append(action)
            
            # Bulk index
            success, failed = await helpers.async_bulk(
                self.client,
                actions,
                raise_on_error=False
            )
            
            logger.info(f"Bulk index: {success} başarılı, {len(failed)} başarısız")
            return success
            
        except Exception as e:
            logger.error(f"Bulk index hatası: {e}")
            return 0
    
    async def search(
        self,
        query: str,
        index_type: Optional[str] = None,
        filters: Optional[Dict] = None,
        size: int = 10,
        from_: int = 0,
        highlight: bool = True,
        fuzzy: bool = True
    ) -> Dict[str, Any]:
        """Gelişmiş arama"""
        if not self.is_connected:
            return {"hits": [], "total": 0}
        
        try:
            # Index seçimi
            if index_type:
                index = self.indices.get(index_type)
            else:
                index = ",".join(self.indices.values())
            
            # Query oluştur
            must_queries = []
            
            # Ana arama query'si
            if query:
                if fuzzy:
                    # Fuzzy matching ile typo toleransı
                    must_queries.append({
                        "multi_match": {
                            "query": query,
                            "fields": [
                                "title^3",  # Title'a 3x ağırlık
                                "content^2",
                                "objectives",
                                "tags",
                                "full_name",
                                "question_text^2",
                                "answer"
                            ],
                            "type": "best_fields",
                            "fuzziness": "AUTO",
                            "prefix_length": 2
                        }
                    })
                else:
                    must_queries.append({
                        "multi_match": {
                            "query": query,
                            "fields": ["title^3", "content^2", "*"],
                            "type": "best_fields"
                        }
                    })
            
            # Filtreler
            filter_queries = []
            if filters:
                for field, value in filters.items():
                    if isinstance(value, list):
                        filter_queries.append({"terms": {field: value}})
                    elif isinstance(value, dict):
                        # Range query
                        filter_queries.append({"range": {field: value}})
                    else:
                        filter_queries.append({"term": {field: value}})
            
            # Final query
            search_body = {
                "query": {
                    "bool": {
                        "must": must_queries,
                        "filter": filter_queries
                    }
                },
                "size": size,
                "from": from_,
                "sort": [
                    {"_score": {"order": "desc"}},
                    {"created_at": {"order": "desc"}}
                ]
            }
            
            # Highlighting
            if highlight:
                search_body["highlight"] = {
                    "fields": {
                        "title": {},
                        "content": {"fragment_size": 150},
                        "objectives": {},
                        "question_text": {}
                    },
                    "pre_tags": ["<mark>"],
                    "post_tags": ["</mark>"]
                }
            
            # Aggregations
            search_body["aggs"] = {
                "subjects": {
                    "terms": {"field": "subject", "size": 10}
                },
                "grade_levels": {
                    "terms": {"field": "grade_level", "size": 12}
                },
                "types": {
                    "terms": {"field": "type", "size": 10}
                }
            }
            
            # Search
            result = await self.client.search(
                index=index,
                body=search_body
            )
            
            # Format results
            hits = []
            for hit in result["hits"]["hits"]:
                doc = {
                    "id": hit["_id"],
                    "index": hit["_index"],
                    "score": hit["_score"],
                    **hit["_source"]
                }
                
                # Highlight ekle
                if "highlight" in hit:
                    doc["highlight"] = hit["highlight"]
                
                hits.append(doc)
            
            return {
                "hits": hits,
                "total": result["hits"]["total"]["value"],
                "aggregations": result.get("aggregations", {}),
                "took": result["took"]
            }
            
        except Exception as e:
            logger.error(f"Arama hatası: {e}")
            return {"hits": [], "total": 0, "error": str(e)}
    
    async def autocomplete(
        self,
        prefix: str,
        index_type: str = "lessons",
        size: int = 5
    ) -> List[str]:
        """Otomatik tamamlama"""
        if not self.is_connected:
            return []
        
        try:
            index = self.indices.get(index_type)
            if not index:
                return []
            
            # Suggest query
            body = {
                "suggest": {
                    "autocomplete": {
                        "prefix": prefix,
                        "completion": {
                            "field": "suggest",
                            "size": size,
                            "skip_duplicates": True
                        }
                    }
                }
            }
            
            result = await self.client.search(index=index, body=body)
            
            suggestions = []
            for suggestion in result["suggest"]["autocomplete"][0]["options"]:
                suggestions.append(suggestion["text"])
            
            return suggestions
            
        except Exception as e:
            logger.error(f"Autocomplete hatası: {e}")
            return []
    
    async def similar_documents(
        self,
        doc_id: str,
        index_type: str,
        size: int = 5
    ) -> List[Dict]:
        """Benzer dokümanları bul"""
        if not self.is_connected:
            return []
        
        try:
            index = self.indices.get(index_type)
            if not index:
                return []
            
            # More Like This query
            body = {
                "query": {
                    "more_like_this": {
                        "fields": ["title", "content", "tags"],
                        "like": [
                            {
                                "_index": index,
                                "_id": doc_id
                            }
                        ],
                        "min_term_freq": 1,
                        "max_query_terms": 12,
                        "min_doc_freq": 1
                    }
                },
                "size": size
            }
            
            result = await self.client.search(index=index, body=body)
            
            similar = []
            for hit in result["hits"]["hits"]:
                similar.append({
                    "id": hit["_id"],
                    "score": hit["_score"],
                    **hit["_source"]
                })
            
            return similar
            
        except Exception as e:
            logger.error(f"Similar documents hatası: {e}")
            return []
    
    async def delete_document(
        self,
        doc_id: str,
        index_type: str
    ) -> bool:
        """Doküman sil"""
        if not self.is_connected:
            return False
        
        try:
            index = self.indices.get(index_type)
            if not index:
                return False
            
            result = await self.client.delete(index=index, id=doc_id)
            return result["result"] == "deleted"
            
        except Exception as e:
            logger.error(f"Doküman silme hatası: {e}")
            return False
    
    async def update_document(
        self,
        doc_id: str,
        index_type: str,
        updates: Dict[str, Any]
    ) -> bool:
        """Doküman güncelle"""
        if not self.is_connected:
            return False
        
        try:
            index = self.indices.get(index_type)
            if not index:
                return False
            
            # Update timestamp
            updates["updated_at"] = datetime.utcnow()
            
            result = await self.client.update(
                index=index,
                id=doc_id,
                body={"doc": updates}
            )
            
            return result["result"] in ["updated", "noop"]
            
        except Exception as e:
            logger.error(f"Doküman güncelleme hatası: {e}")
            return False
    
    async def get_stats(self, index_type: Optional[str] = None) -> Dict:
        """Index istatistikleri"""
        if not self.is_connected:
            return {}
        
        try:
            if index_type:
                index = self.indices.get(index_type)
            else:
                index = ",".join(self.indices.values())
            
            stats = await self.client.indices.stats(index=index)
            
            return {
                "indices": stats["indices"],
                "total": stats["_all"]["total"]
            }
            
        except Exception as e:
            logger.error(f"Stats hatası: {e}")
            return {}


# Global search service instance
search_service = SearchService()


# Helper functions
async def search_lessons(
    query: str,
    grade_level: Optional[int] = None,
    subject: Optional[str] = None,
    limit: int = 10
) -> List[Dict]:
    """Ders arama helper"""
    filters = {}
    if grade_level:
        filters["grade_level"] = grade_level
    if subject:
        filters["subject"] = subject
    
    results = await search_service.search(
        query=query,
        index_type="lessons",
        filters=filters,
        size=limit
    )
    
    return results["hits"]


async def search_users(
    query: str,
    role: Optional[str] = None,
    grade_level: Optional[int] = None,
    limit: int = 10
) -> List[Dict]:
    """Kullanıcı arama helper"""
    filters = {}
    if role:
        filters["role"] = role
    if grade_level:
        filters["grade_level"] = grade_level
    
    results = await search_service.search(
        query=query,
        index_type="users",
        filters=filters,
        size=limit
    )
    
    return results["hits"]


async def search_questions(
    query: str,
    subject: Optional[str] = None,
    difficulty: Optional[str] = None,
    limit: int = 20
) -> List[Dict]:
    """Soru arama helper"""
    filters = {}
    if subject:
        filters["subject"] = subject
    if difficulty:
        filters["difficulty"] = difficulty
    
    results = await search_service.search(
        query=query,
        index_type="questions",
        filters=filters,
        size=limit
    )
    
    return results["hits"]

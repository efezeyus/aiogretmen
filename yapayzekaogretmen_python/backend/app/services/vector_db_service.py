"""
Vektör Veritabanı Servisi
------------------------
ChromaDB ve FAISS kullanarak dokümanların vektörleştirilmesi ve aranması
"""

import os
from typing import List, Dict, Optional, Any
from pathlib import Path
import json
import pickle

# LangChain
from langchain_community.vectorstores import Chroma, FAISS
from langchain_community.embeddings import OpenAIEmbeddings, HuggingFaceEmbeddings
from langchain.schema import Document

# ChromaDB
import chromadb
from chromadb.config import Settings

from app.core.logger import logger
from app.core.config import settings


class VectorDBService:
    """Vektör veritabanı yönetimi servisi"""
    
    def __init__(self):
        self.db_path = settings.BASE_DIR / "vector_db"
        self.db_path.mkdir(parents=True, exist_ok=True)
        
        # Embedding modelini seç
        self._setup_embeddings()
        
        # ChromaDB client
        self.chroma_client = chromadb.PersistentClient(
            path=str(self.db_path / "chroma"),
            settings=Settings(
                anonymized_telemetry=False,
                allow_reset=True
            )
        )
        
        # FAISS yolu
        self.faiss_path = self.db_path / "faiss"
        self.faiss_path.mkdir(parents=True, exist_ok=True)
        
        # Koleksiyonlar
        self.collections = {}
        
        logger.info("Vector DB Service başlatıldı")
    
    def _setup_embeddings(self):
        """Embedding modelini ayarla"""
        try:
            if settings.OPENAI_API_KEY:
                # OpenAI embeddings (daha iyi sonuçlar)
                from langchain_openai import OpenAIEmbeddings
                self.embeddings = OpenAIEmbeddings(
                    openai_api_key=settings.OPENAI_API_KEY,
                    model="text-embedding-ada-002"
                )
                logger.info("OpenAI embeddings kullanılıyor")
            else:
                # Ücretsiz alternatif: HuggingFace embeddings
                self.embeddings = HuggingFaceEmbeddings(
                    model_name="sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2",
                    model_kwargs={'device': 'cpu'},
                    encode_kwargs={'normalize_embeddings': True}
                )
                logger.info("HuggingFace embeddings kullanılıyor")
        except Exception as e:
            # Varsayılan olarak HuggingFace kullan
            logger.warning(f"Embedding ayarı hatası: {e}. HuggingFace kullanılıyor.")
            self.embeddings = HuggingFaceEmbeddings(
                model_name="sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2",
                model_kwargs={'device': 'cpu'},
                encode_kwargs={'normalize_embeddings': True}
            )
    
    def create_or_update_collection(
        self, 
        collection_name: str, 
        documents: List[Document],
        use_faiss: bool = False
    ) -> bool:
        """Koleksiyon oluştur veya güncelle"""
        try:
            if use_faiss:
                return self._create_faiss_index(collection_name, documents)
            else:
                return self._create_chroma_collection(collection_name, documents)
        
        except Exception as e:
            logger.error(f"Koleksiyon oluşturma hatası: {e}")
            return False
    
    def _create_chroma_collection(self, collection_name: str, documents: List[Document]) -> bool:
        """ChromaDB koleksiyonu oluştur"""
        try:
            # Mevcut koleksiyonu sil
            try:
                self.chroma_client.delete_collection(collection_name)
            except:
                pass
            
            # Yeni koleksiyon oluştur
            vectorstore = Chroma.from_documents(
                documents=documents,
                embedding=self.embeddings,
                collection_name=collection_name,
                client=self.chroma_client,
                persist_directory=str(self.db_path / "chroma")
            )
            
            # Koleksiyonu kaydet
            self.collections[collection_name] = {
                "type": "chroma",
                "vectorstore": vectorstore,
                "document_count": len(documents)
            }
            
            logger.info(f"ChromaDB koleksiyonu oluşturuldu: {collection_name} ({len(documents)} doküman)")
            return True
            
        except Exception as e:
            logger.error(f"ChromaDB hatası: {e}")
            return False
    
    def _create_faiss_index(self, collection_name: str, documents: List[Document]) -> bool:
        """FAISS indeksi oluştur"""
        try:
            # FAISS vektör deposu oluştur
            vectorstore = FAISS.from_documents(
                documents=documents,
                embedding=self.embeddings
            )
            
            # İndeksi kaydet
            index_path = self.faiss_path / f"{collection_name}.faiss"
            vectorstore.save_local(str(index_path))
            
            # Koleksiyonu kaydet
            self.collections[collection_name] = {
                "type": "faiss",
                "vectorstore": vectorstore,
                "document_count": len(documents),
                "index_path": str(index_path)
            }
            
            logger.info(f"FAISS indeksi oluşturuldu: {collection_name} ({len(documents)} doküman)")
            return True
            
        except Exception as e:
            logger.error(f"FAISS hatası: {e}")
            return False
    
    def search_similar_documents(
        self, 
        collection_name: str, 
        query: str, 
        k: int = 5,
        filter_metadata: Dict = None
    ) -> List[Document]:
        """Benzer dokümanları ara"""
        try:
            if collection_name not in self.collections:
                # Koleksiyonu yükle
                if not self._load_collection(collection_name):
                    logger.error(f"Koleksiyon bulunamadı: {collection_name}")
                    return []
            
            collection = self.collections[collection_name]
            vectorstore = collection["vectorstore"]
            
            # Arama yap
            if filter_metadata:
                # Metadata filtresi ile
                results = vectorstore.similarity_search(
                    query=query,
                    k=k,
                    filter=filter_metadata
                )
            else:
                # Normal arama
                results = vectorstore.similarity_search(
                    query=query,
                    k=k
                )
            
            return results
            
        except Exception as e:
            logger.error(f"Doküman arama hatası: {e}")
            return []
    
    def search_with_score(
        self, 
        collection_name: str, 
        query: str, 
        k: int = 5,
        score_threshold: float = 0.7
    ) -> List[tuple]:
        """Benzerlik skoru ile doküman ara"""
        try:
            if collection_name not in self.collections:
                if not self._load_collection(collection_name):
                    return []
            
            collection = self.collections[collection_name]
            vectorstore = collection["vectorstore"]
            
            # Skorlu arama
            results = vectorstore.similarity_search_with_score(query, k=k)
            
            # Eşik değerini uygula
            filtered_results = [
                (doc, score) for doc, score in results 
                if score >= score_threshold
            ]
            
            return filtered_results
            
        except Exception as e:
            logger.error(f"Skorlu arama hatası: {e}")
            return []
    
    def _load_collection(self, collection_name: str) -> bool:
        """Koleksiyonu yükle"""
        try:
            # Önce ChromaDB'de ara
            collections = self.chroma_client.list_collections()
            for col in collections:
                if col.name == collection_name:
                    vectorstore = Chroma(
                        client=self.chroma_client,
                        collection_name=collection_name,
                        embedding_function=self.embeddings
                    )
                    self.collections[collection_name] = {
                        "type": "chroma",
                        "vectorstore": vectorstore
                    }
                    return True
            
            # FAISS'te ara
            index_path = self.faiss_path / f"{collection_name}.faiss"
            if index_path.exists():
                vectorstore = FAISS.load_local(
                    str(index_path),
                    self.embeddings
                )
                self.collections[collection_name] = {
                    "type": "faiss",
                    "vectorstore": vectorstore,
                    "index_path": str(index_path)
                }
                return True
            
            return False
            
        except Exception as e:
            logger.error(f"Koleksiyon yükleme hatası: {e}")
            return False
    
    def get_collection_info(self, collection_name: str) -> Dict[str, Any]:
        """Koleksiyon bilgilerini getir"""
        if collection_name not in self.collections:
            self._load_collection(collection_name)
        
        if collection_name in self.collections:
            collection = self.collections[collection_name]
            return {
                "name": collection_name,
                "type": collection["type"],
                "document_count": collection.get("document_count", "Unknown"),
                "exists": True
            }
        
        return {
            "name": collection_name,
            "exists": False
        }
    
    def list_collections(self) -> List[str]:
        """Tüm koleksiyonları listele"""
        collections = []
        
        # ChromaDB koleksiyonları
        try:
            chroma_collections = self.chroma_client.list_collections()
            collections.extend([col.name for col in chroma_collections])
        except:
            pass
        
        # FAISS indeksleri
        try:
            faiss_files = self.faiss_path.glob("*.faiss")
            collections.extend([f.stem for f in faiss_files])
        except:
            pass
        
        return list(set(collections))
    
    def delete_collection(self, collection_name: str) -> bool:
        """Koleksiyonu sil"""
        try:
            # ChromaDB'den sil
            try:
                self.chroma_client.delete_collection(collection_name)
            except:
                pass
            
            # FAISS'ten sil
            index_path = self.faiss_path / f"{collection_name}.faiss"
            if index_path.exists():
                index_path.unlink()
            
            # Önbellekten sil
            if collection_name in self.collections:
                del self.collections[collection_name]
            
            logger.info(f"Koleksiyon silindi: {collection_name}")
            return True
            
        except Exception as e:
            logger.error(f"Koleksiyon silme hatası: {e}")
            return False
    
    def get_retriever(
        self, 
        collection_name: str, 
        search_kwargs: Dict = None
    ):
        """LangChain retriever döndür"""
        if collection_name not in self.collections:
            self._load_collection(collection_name)
        
        if collection_name in self.collections:
            vectorstore = self.collections[collection_name]["vectorstore"]
            
            search_kwargs = search_kwargs or {"k": 5}
            return vectorstore.as_retriever(search_kwargs=search_kwargs)
        
        return None
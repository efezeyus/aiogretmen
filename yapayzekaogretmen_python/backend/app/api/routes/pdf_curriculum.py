"""
PDF Müfredat API Route'ları
--------------------------
PDF yükleme, işleme ve müfredat yönetimi endpoint'leri
"""

from fastapi import APIRouter, UploadFile, File, HTTPException, Depends, status
from typing import List, Dict, Optional
import shutil
from pathlib import Path

from app.services.pdf_service import PDFService
from app.services.vector_db_service import VectorDBService
from app.services.rag_service import RAGService
from app.api.middlewares.auth import get_current_user
from app.models.user import User
from app.core.logger import logger

router = APIRouter(
    prefix="/curriculum/pdf",
    tags=["PDF Curriculum"]
)

# Servis örnekleri
pdf_service = PDFService()
vector_service = VectorDBService()
rag_service = RAGService()


@router.post("/upload")
async def upload_curriculum_pdf(
    file: UploadFile = File(...),
    grade: int = None,
    subject: str = None,
    current_user: User = Depends(get_current_user)
):
    """
    Müfredat PDF'i yükle ve işle
    
    - **file**: PDF dosyası
    - **grade**: Sınıf seviyesi (1-12)
    - **subject**: Ders adı (matematik, fen, turkce vb.)
    """
    try:
        # Dosya türü kontrolü
        if not file.filename.lower().endswith('.pdf'):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Sadece PDF dosyaları kabul edilir"
            )
        
        # Dosyayı geçici olarak kaydet
        temp_path = Path(f"/tmp/{file.filename}")
        with open(temp_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        # PDF'i işle
        result = rag_service.process_curriculum_pdf(
            pdf_path=str(temp_path),
            grade=grade,
            subject=subject
        )
        
        # Geçici dosyayı sil
        temp_path.unlink()
        
        if result["success"]:
            return {
                "message": "PDF başarıyla işlendi",
                "collection_name": result["collection_name"],
                "document_count": result["document_count"],
                "topics": result["topics"]
            }
        else:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=result.get("error", "PDF işlenemedi")
            )
            
    except Exception as e:
        logger.error(f"PDF yükleme hatası: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


@router.post("/process-multiple")
async def process_multiple_pdfs(
    files: List[UploadFile] = File(...),
    grade: int = None,
    subject: str = None,
    current_user: User = Depends(get_current_user)
):
    """Birden fazla PDF'i toplu işle"""
    results = []
    
    for file in files:
        try:
            # Dosyayı geçici olarak kaydet
            temp_path = Path(f"/tmp/{file.filename}")
            with open(temp_path, "wb") as buffer:
                shutil.copyfileobj(file.file, buffer)
            
            # PDF'i işle
            result = rag_service.process_curriculum_pdf(
                pdf_path=str(temp_path),
                grade=grade,
                subject=subject
            )
            
            # Geçici dosyayı sil
            temp_path.unlink()
            
            results.append({
                "filename": file.filename,
                "success": result["success"],
                "collection_name": result.get("collection_name"),
                "error": result.get("error")
            })
            
        except Exception as e:
            results.append({
                "filename": file.filename,
                "success": False,
                "error": str(e)
            })
    
    return {
        "processed_count": len(results),
        "results": results
    }


@router.get("/collections")
async def list_collections(
    current_user: User = Depends(get_current_user)
):
    """Mevcut PDF koleksiyonlarını listele"""
    try:
        collections = vector_service.list_collections()
        
        # Her koleksiyon için detay bilgi al
        collection_details = []
        for col_name in collections:
            info = vector_service.get_collection_info(col_name)
            collection_details.append(info)
        
        return {
            "count": len(collections),
            "collections": collection_details
        }
        
    except Exception as e:
        logger.error(f"Koleksiyon listeleme hatası: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


@router.delete("/collections/{collection_name}")
async def delete_collection(
    collection_name: str,
    current_user: User = Depends(get_current_user)
):
    """Koleksiyonu sil"""
    try:
        success = vector_service.delete_collection(collection_name)
        
        if success:
            return {"message": f"{collection_name} koleksiyonu silindi"}
        else:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Koleksiyon bulunamadı"
            )
            
    except Exception as e:
        logger.error(f"Koleksiyon silme hatası: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


@router.post("/search")
async def search_documents(
    query: str,
    collection_name: Optional[str] = None,
    grade: Optional[int] = None,
    subject: Optional[str] = None,
    limit: int = 5,
    current_user: User = Depends(get_current_user)
):
    """PDF içeriklerinde arama yap"""
    try:
        # Koleksiyon belirtilmemişse, uygun olanı bul
        if not collection_name and grade and subject:
            collections = vector_service.list_collections()
            for col in collections:
                if f"grade_{grade}_{subject}" in col:
                    collection_name = col
                    break
        
        if not collection_name:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Koleksiyon adı veya sınıf/ders bilgisi gerekli"
            )
        
        # Arama yap
        results = vector_service.search_similar_documents(
            collection_name=collection_name,
            query=query,
            k=limit
        )
        
        # Sonuçları formatla
        formatted_results = []
        for doc in results:
            formatted_results.append({
                "content": doc.page_content,
                "metadata": doc.metadata
            })
        
        return {
            "query": query,
            "collection": collection_name,
            "count": len(formatted_results),
            "results": formatted_results
        }
        
    except Exception as e:
        logger.error(f"Arama hatası: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )
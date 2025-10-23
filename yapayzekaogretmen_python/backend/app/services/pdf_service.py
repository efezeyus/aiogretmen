"""
PDF İşleme Servisi
-----------------
PDF dosyalarından metin çıkarma, işleme ve yapılandırma
"""

import os
import io
from typing import List, Dict, Optional, Any
from pathlib import Path
import hashlib
import json

# PDF işleme
import PyPDF2
import pdfplumber
from pdf2image import convert_from_path, convert_from_bytes
import pytesseract
from PIL import Image

# Metin işleme
import re
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain.schema import Document

from app.core.logger import logger
from app.core.config import settings


class PDFService:
    """PDF dosyalarını işleme ve metin çıkarma servisi"""
    
    def __init__(self):
        self.upload_dir = settings.MEDIA_ROOT / "pdfs"
        self.upload_dir.mkdir(parents=True, exist_ok=True)
        
        # Metin bölücü ayarları
        self.text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=1000,
            chunk_overlap=200,
            length_function=len,
            separators=["\n\n", "\n", " ", ""]
        )
        
        # Desteklenen dosya formatları
        self.supported_formats = ['.pdf']
        
        logger.info("PDF Service başlatıldı")
    
    def extract_text_from_pdf(self, pdf_path: str) -> Dict[str, Any]:
        """PDF dosyasından metin çıkar"""
        try:
            text_content = ""
            metadata = {
                "file_path": pdf_path,
                "page_count": 0,
                "extraction_method": []
            }
            
            # Önce PyPDF2 ile dene
            try:
                with open(pdf_path, 'rb') as file:
                    pdf_reader = PyPDF2.PdfReader(file)
                    metadata["page_count"] = len(pdf_reader.pages)
                    
                    for page_num, page in enumerate(pdf_reader.pages):
                        page_text = page.extract_text()
                        if page_text.strip():
                            text_content += f"\n--- Sayfa {page_num + 1} ---\n{page_text}"
                            metadata["extraction_method"].append("PyPDF2")
            except Exception as e:
                logger.warning(f"PyPDF2 ile metin çıkarılamadı: {e}")
            
            # Eğer metin bulunamadıysa pdfplumber dene
            if not text_content.strip():
                try:
                    with pdfplumber.open(pdf_path) as pdf:
                        for page_num, page in enumerate(pdf.pages):
                            page_text = page.extract_text()
                            if page_text:
                                text_content += f"\n--- Sayfa {page_num + 1} ---\n{page_text}"
                                metadata["extraction_method"].append("pdfplumber")
                except Exception as e:
                    logger.warning(f"pdfplumber ile metin çıkarılamadı: {e}")
            
            # Hala metin yoksa OCR kullan
            if not text_content.strip():
                logger.info("PDF'den metin çıkarılamadı, OCR deneniyor...")
                text_content = self._extract_text_with_ocr(pdf_path)
                metadata["extraction_method"].append("OCR")
            
            # Metni temizle
            text_content = self._clean_text(text_content)
            
            return {
                "text": text_content,
                "metadata": metadata,
                "success": bool(text_content.strip())
            }
            
        except Exception as e:
            logger.error(f"PDF işleme hatası: {e}")
            return {
                "text": "",
                "metadata": {"error": str(e)},
                "success": False
            }
    
    def _extract_text_with_ocr(self, pdf_path: str) -> str:
        """OCR kullanarak PDF'den metin çıkar"""
        try:
            # PDF'i resimlere dönüştür
            images = convert_from_path(pdf_path)
            text_content = ""
            
            for i, image in enumerate(images):
                # OCR uygula (Türkçe desteği ile)
                text = pytesseract.image_to_string(image, lang='tur')
                text_content += f"\n--- Sayfa {i + 1} ---\n{text}"
            
            return text_content
            
        except Exception as e:
            logger.error(f"OCR hatası: {e}")
            return ""
    
    def _clean_text(self, text: str) -> str:
        """Metni temizle ve düzenle"""
        # Fazla boşlukları temizle
        text = re.sub(r'\s+', ' ', text)
        
        # Sayfa numaralarını koru ama düzenle
        text = re.sub(r'--- Sayfa (\d+) ---', r'\n\n[SAYFA \1]\n', text)
        
        # Başlıkları algıla ve işaretle
        text = re.sub(r'\n([A-ZĞÜŞİÖÇ][A-ZĞÜŞİÖÇ\s]+)\n', r'\n\n## \1\n\n', text)
        
        return text.strip()
    
    def split_text_into_chunks(self, text: str, metadata: Dict = None) -> List[Document]:
        """Metni anlamlı parçalara böl"""
        # Önce sayfalara göre böl
        pages = re.split(r'\[SAYFA \d+\]', text)
        documents = []
        
        for page_num, page_content in enumerate(pages):
            if not page_content.strip():
                continue
            
            # Her sayfayı daha küçük parçalara böl
            chunks = self.text_splitter.split_text(page_content)
            
            for chunk_num, chunk in enumerate(chunks):
                doc_metadata = {
                    "page": page_num + 1,
                    "chunk": chunk_num + 1,
                    **(metadata or {})
                }
                
                documents.append(Document(
                    page_content=chunk,
                    metadata=doc_metadata
                ))
        
        return documents
    
    def process_curriculum_pdf(self, pdf_path: str, grade: int, subject: str) -> Dict[str, Any]:
        """Müfredat PDF'ini işle ve yapılandır"""
        try:
            # Metin çıkar
            extraction_result = self.extract_text_from_pdf(pdf_path)
            
            if not extraction_result["success"]:
                return {
                    "success": False,
                    "error": "PDF'den metin çıkarılamadı"
                }
            
            # Metni parçalara böl
            metadata = {
                "grade": grade,
                "subject": subject,
                "source": os.path.basename(pdf_path),
                **extraction_result["metadata"]
            }
            
            documents = self.split_text_into_chunks(
                extraction_result["text"], 
                metadata
            )
            
            # Konuları ve başlıkları çıkar
            topics = self._extract_topics(extraction_result["text"])
            
            # Benzersiz ID oluştur
            content_hash = hashlib.md5(extraction_result["text"].encode()).hexdigest()
            
            return {
                "success": True,
                "documents": documents,
                "topics": topics,
                "metadata": metadata,
                "content_hash": content_hash,
                "text_length": len(extraction_result["text"]),
                "chunk_count": len(documents)
            }
            
        except Exception as e:
            logger.error(f"Müfredat PDF işleme hatası: {e}")
            return {
                "success": False,
                "error": str(e)
            }
    
    def _extract_topics(self, text: str) -> List[Dict[str, str]]:
        """Metinden konu başlıklarını çıkar"""
        topics = []
        
        # Başlık desenlerini ara
        # Örnek: "1. ÜNİTE: SAYILAR VE İŞLEMLER"
        unit_pattern = r'(\d+)\.\s*ÜNİTE[:：]\s*([^\n]+)'
        topic_pattern = r'(?:Konu|KONU)\s*[:：]\s*([^\n]+)'
        
        # Üniteleri bul
        for match in re.finditer(unit_pattern, text, re.IGNORECASE):
            unit_num = match.group(1)
            unit_name = match.group(2).strip()
            topics.append({
                "type": "unit",
                "number": unit_num,
                "name": unit_name
            })
        
        # Alt konuları bul
        for match in re.finditer(topic_pattern, text, re.IGNORECASE):
            topic_name = match.group(1).strip()
            topics.append({
                "type": "topic",
                "name": topic_name
            })
        
        return topics
    
    def save_uploaded_pdf(self, file_content: bytes, filename: str) -> Optional[str]:
        """Yüklenen PDF'i kaydet"""
        try:
            # Güvenli dosya adı oluştur
            safe_filename = self._make_safe_filename(filename)
            file_path = self.upload_dir / safe_filename
            
            # Dosyayı kaydet
            with open(file_path, 'wb') as f:
                f.write(file_content)
            
            logger.info(f"PDF kaydedildi: {file_path}")
            return str(file_path)
            
        except Exception as e:
            logger.error(f"PDF kaydetme hatası: {e}")
            return None
    
    def _make_safe_filename(self, filename: str) -> str:
        """Güvenli dosya adı oluştur"""
        # Türkçe karakterleri koru ama güvenli hale getir
        safe_chars = re.sub(r'[^\w\s.-]', '', filename)
        safe_chars = safe_chars.replace(' ', '_')
        
        # Benzersiz hale getir
        name, ext = os.path.splitext(safe_chars)
        timestamp = hashlib.md5(str(os.times()).encode()).hexdigest()[:8]
        
        return f"{name}_{timestamp}{ext}"
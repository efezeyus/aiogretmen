"""
RAG (Retrieval Augmented Generation) Servisi
-------------------------------------------
PDF tabanlı içeriklerden yapay zeka destekli ders anlatımı
"""

from typing import List, Dict, Optional, Any
import json
from datetime import datetime

# LangChain
from langchain.chains import RetrievalQA, ConversationalRetrievalChain
from langchain.chains.question_answering import load_qa_chain
from langchain.prompts import PromptTemplate
from langchain.memory import ConversationBufferMemory, ChatMessageHistory
from langchain.schema import Document
from langchain.llms import OpenAI
from langchain.chat_models import ChatOpenAI

# Servisler
from app.services.vector_db_service import VectorDBService
from app.services.pdf_service import PDFService
from app.services.ai_service import AIService

from app.core.logger import logger
from app.core.config import settings


class RAGService:
    """RAG tabanlı ders anlatım servisi"""
    
    def __init__(self):
        self.vector_service = VectorDBService()
        self.pdf_service = PDFService()
        self.ai_service = AIService()
        
        # Konuşma geçmişi
        self.conversations = {}
        
        # Prompt şablonları
        self._setup_prompts()
        
        logger.info("RAG Service başlatıldı")
    
    def _setup_prompts(self):
        """Prompt şablonlarını ayarla"""
        
        # Ders anlatım promptu
        self.lesson_prompt = PromptTemplate(
            template="""Sen MEB müfredatına uygun ders anlatan yapay zeka öğretmenisin.
            
Aşağıdaki bağlam bilgilerini kullanarak, {grade}. sınıf {subject} dersinde {topic} konusunu anlat.

Bağlam Bilgileri:
{context}

Öğrenci Sorusu: {question}

Ders anlatımında şu kurallara uy:
1. Yaş grubuna ({grade}. sınıf) uygun, anlaşılır bir dil kullan
2. Örneklerle konuyu pekiştir
3. Görsel betimlemeler kullan
4. Adım adım açıkla
5. Öğrencinin anlayıp anlamadığını kontrol edecek sorular sor
6. MEB müfredatına tamamen uygun ol
7. Verilen bağlam bilgilerinden yararlan, ancak kendi bilgilerinle de destekle

Yanıt:""",
            input_variables=["grade", "subject", "topic", "context", "question"]
        )
        
        # Soru-cevap promptu
        self.qa_prompt = PromptTemplate(
            template="""Aşağıdaki bağlam bilgilerini kullanarak soruyu cevapla.
            
Bağlam:
{context}

Soru: {question}

Eğer bağlamda cevap yoksa, genel bilgilerinle cevap ver ama bunu belirt.

Cevap:""",
            input_variables=["context", "question"]
        )
        
        # Konu özeti promptu
        self.summary_prompt = PromptTemplate(
            template="""Aşağıdaki ders içeriğinin {grade}. sınıf seviyesine uygun bir özetini hazırla:
            
{content}

Özet şu başlıkları içersin:
1. Konunun Ana Hatları
2. Önemli Kavramlar
3. Formüller/Kurallar (varsa)
4. Örnek Sorular
5. Dikkat Edilmesi Gerekenler

Özet:""",
            input_variables=["grade", "content"]
        )
    
    def process_curriculum_pdf(
        self, 
        pdf_path: str, 
        grade: int, 
        subject: str,
        collection_name: str = None
    ) -> Dict[str, Any]:
        """Müfredat PDF'ini işle ve vektör veritabanına ekle"""
        try:
            # PDF'i işle
            result = self.pdf_service.process_curriculum_pdf(pdf_path, grade, subject)
            
            if not result["success"]:
                return result
            
            # Koleksiyon adı oluştur
            if not collection_name:
                collection_name = f"grade_{grade}_{subject}_{result['content_hash'][:8]}"
            
            # Vektör veritabanına ekle
            success = self.vector_service.create_or_update_collection(
                collection_name=collection_name,
                documents=result["documents"]
            )
            
            if success:
                logger.info(f"PDF başarıyla işlendi: {collection_name}")
                return {
                    "success": True,
                    "collection_name": collection_name,
                    "document_count": len(result["documents"]),
                    "topics": result["topics"],
                    "metadata": result["metadata"]
                }
            else:
                return {
                    "success": False,
                    "error": "Vektör veritabanına eklenemedi"
                }
                
        except Exception as e:
            logger.error(f"PDF işleme hatası: {e}")
            return {
                "success": False,
                "error": str(e)
            }
    
    def teach_lesson(
        self,
        student_id: str,
        grade: int,
        subject: str,
        topic: str,
        question: str = "Bu konuyu anlatır mısın?",
        collection_name: str = None
    ) -> Dict[str, Any]:
        """Ders anlat"""
        try:
            # Koleksiyon adını belirle
            if not collection_name:
                collections = self.vector_service.list_collections()
                # İlgili koleksiyonu bul
                for col in collections:
                    if f"grade_{grade}_{subject}" in col:
                        collection_name = col
                        break
            
            if not collection_name:
                return {
                    "success": False,
                    "error": f"{grade}. sınıf {subject} dersi için içerik bulunamadı"
                }
            
            # İlgili dokümanları bul
            relevant_docs = self.vector_service.search_similar_documents(
                collection_name=collection_name,
                query=f"{topic} {question}",
                k=5,
                filter_metadata={"grade": grade, "subject": subject}
            )
            
            # Bağlam oluştur
            context = "\n\n".join([doc.page_content for doc in relevant_docs])
            
            # LLM ile ders anlat
            if self.ai_service.current_provider == "deepseek":
                response = self._teach_with_deepseek(
                    grade, subject, topic, context, question
                )
            else:
                response = self._teach_with_openai(
                    grade, subject, topic, context, question
                )
            
            # Konuşma geçmişine ekle
            self._save_conversation(student_id, question, response["content"])
            
            return response
            
        except Exception as e:
            logger.error(f"Ders anlatım hatası: {e}")
            return {
                "success": False,
                "error": str(e)
            }
    
    def _teach_with_deepseek(
        self, 
        grade: int, 
        subject: str, 
        topic: str, 
        context: str, 
        question: str
    ) -> Dict[str, Any]:
        """DeepSeek ile ders anlat"""
        try:
            prompt = self.lesson_prompt.format(
                grade=grade,
                subject=subject,
                topic=topic,
                context=context,
                question=question
            )
            
            # DeepSeek API'yi kullan
            response = self.ai_service.generate_response(
                prompt=prompt,
                max_tokens=2000,
                temperature=0.7
            )
            
            return {
                "success": True,
                "content": response,
                "model": "deepseek",
                "sources": self._format_sources(context)
            }
            
        except Exception as e:
            logger.error(f"DeepSeek hatası: {e}")
            return {
                "success": False,
                "error": str(e)
            }
    
    def _teach_with_openai(
        self, 
        grade: int, 
        subject: str, 
        topic: int, 
        context: str, 
        question: str
    ) -> Dict[str, Any]:
        """OpenAI ile ders anlat"""
        try:
            if not settings.OPENAI_API_KEY:
                return self._teach_with_deepseek(grade, subject, topic, context, question)
            
            # ChatOpenAI modeli
            llm = ChatOpenAI(
                openai_api_key=settings.OPENAI_API_KEY,
                model_name=settings.OPENAI_MODEL_NAME,
                temperature=0.7,
                max_tokens=2000
            )
            
            prompt = self.lesson_prompt.format(
                grade=grade,
                subject=subject,
                topic=topic,
                context=context,
                question=question
            )
            
            response = llm.predict(prompt)
            
            return {
                "success": True,
                "content": response,
                "model": settings.OPENAI_MODEL_NAME,
                "sources": self._format_sources(context)
            }
            
        except Exception as e:
            logger.error(f"OpenAI hatası: {e}")
            # Fallback to DeepSeek
            return self._teach_with_deepseek(grade, subject, topic, context, question)
    
    def answer_question(
        self,
        student_id: str,
        question: str,
        grade: int = None,
        subject: str = None,
        use_conversation_history: bool = True
    ) -> Dict[str, Any]:
        """Öğrenci sorusunu cevapla"""
        try:
            # Konuşma geçmişini al
            history = ""
            if use_conversation_history and student_id in self.conversations:
                history = self._get_conversation_history(student_id)
            
            # İlgili koleksiyonları bul
            collections = []
            if grade and subject:
                pattern = f"grade_{grade}_{subject}"
                collections = [
                    col for col in self.vector_service.list_collections() 
                    if pattern in col
                ]
            
            if not collections:
                # Tüm koleksiyonlarda ara
                collections = self.vector_service.list_collections()
            
            # Tüm koleksiyonlardan ilgili dokümanları topla
            all_docs = []
            for collection in collections[:3]:  # En fazla 3 koleksiyon
                docs = self.vector_service.search_similar_documents(
                    collection_name=collection,
                    query=question,
                    k=3
                )
                all_docs.extend(docs)
            
            # Bağlam oluştur
            context = "\n\n".join([doc.page_content for doc in all_docs])
            
            # Soruyu cevapla
            if history:
                full_question = f"Geçmiş Konuşma:\n{history}\n\nYeni Soru: {question}"
            else:
                full_question = question
            
            response = self.ai_service.generate_response(
                prompt=self.qa_prompt.format(
                    context=context,
                    question=full_question
                ),
                max_tokens=1000
            )
            
            # Konuşma geçmişine ekle
            self._save_conversation(student_id, question, response)
            
            return {
                "success": True,
                "answer": response,
                "sources": [doc.metadata for doc in all_docs[:3]]
            }
            
        except Exception as e:
            logger.error(f"Soru cevaplama hatası: {e}")
            return {
                "success": False,
                "error": str(e)
            }
    
    def generate_topic_summary(
        self,
        grade: int,
        subject: str,
        topic: str,
        collection_name: str = None
    ) -> Dict[str, Any]:
        """Konu özeti oluştur"""
        try:
            # İlgili dokümanları bul
            if not collection_name:
                collections = self.vector_service.list_collections()
                for col in collections:
                    if f"grade_{grade}_{subject}" in col:
                        collection_name = col
                        break
            
            if not collection_name:
                return {
                    "success": False,
                    "error": "İlgili içerik bulunamadı"
                }
            
            # Konu ile ilgili dokümanları al
            docs = self.vector_service.search_similar_documents(
                collection_name=collection_name,
                query=topic,
                k=10
            )
            
            # İçeriği birleştir
            content = "\n\n".join([doc.page_content for doc in docs])
            
            # Özet oluştur
            summary = self.ai_service.generate_response(
                prompt=self.summary_prompt.format(
                    grade=grade,
                    content=content
                ),
                max_tokens=1500
            )
            
            return {
                "success": True,
                "summary": summary,
                "topic": topic,
                "grade": grade,
                "subject": subject
            }
            
        except Exception as e:
            logger.error(f"Özet oluşturma hatası: {e}")
            return {
                "success": False,
                "error": str(e)
            }
    
    def _save_conversation(self, student_id: str, question: str, answer: str):
        """Konuşma geçmişini kaydet"""
        if student_id not in self.conversations:
            self.conversations[student_id] = []
        
        self.conversations[student_id].append({
            "timestamp": datetime.now().isoformat(),
            "question": question,
            "answer": answer
        })
        
        # Son 20 mesajı tut
        if len(self.conversations[student_id]) > 20:
            self.conversations[student_id] = self.conversations[student_id][-20:]
    
    def _get_conversation_history(self, student_id: str, last_n: int = 5) -> str:
        """Son n konuşmayı getir"""
        if student_id not in self.conversations:
            return ""
        
        history = self.conversations[student_id][-last_n:]
        
        formatted = []
        for conv in history:
            formatted.append(f"Soru: {conv['question']}")
            formatted.append(f"Cevap: {conv['answer'][:200]}...")
        
        return "\n".join(formatted)
    
    def _format_sources(self, context: str) -> List[str]:
        """Kaynak bilgilerini formatla"""
        # Basit bir kaynak listesi
        sources = []
        if "[SAYFA" in context:
            import re
            pages = re.findall(r'\[SAYFA (\d+)\]', context)
            sources = [f"Sayfa {p}" for p in set(pages)]
        
        return sources
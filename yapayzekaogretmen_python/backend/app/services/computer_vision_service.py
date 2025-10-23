"""
Computer Vision Service - Homework Analysis & OCR
------------------------------------------------
Ödev fotoğraf analizi, el yazısı tanıma ve otomatik değerlendirme.
"""

from typing import Dict, List, Optional, Any, Tuple, Union
from datetime import datetime
from enum import Enum
import asyncio
import base64
import io
import re
from pathlib import Path
from dataclasses import dataclass, field
import numpy as np
from PIL import Image, ImageEnhance, ImageFilter
import cv2
import pytesseract

from loguru import logger

from app.core.config import settings
from app.db.mongodb import get_database
from app.services.cache_service import cache
from app.services.ai_service import ai_service


class ImageType(str, Enum):
    """Görüntü tipleri"""
    HOMEWORK = "homework"
    EXAM_PAPER = "exam"
    NOTEBOOK = "notebook"
    WHITEBOARD = "whiteboard"
    BOOK_PAGE = "book"
    DRAWING = "drawing"


class SubjectType(str, Enum):
    """Ders tipleri"""
    MATHEMATICS = "mathematics"
    LANGUAGE = "language"
    SCIENCE = "science"
    SOCIAL = "social"
    ART = "art"
    GENERAL = "general"


class AnalysisType(str, Enum):
    """Analiz tipleri"""
    OCR_TEXT = "ocr_text"              # Metin tanıma
    MATH_FORMULA = "math_formula"       # Matematik formül tanıma
    HANDWRITING = "handwriting"         # El yazısı analizi
    DIAGRAM = "diagram"                 # Diyagram/şekil analizi
    QUALITY = "quality"                 # Kalite ve düzen analizi
    ANSWER_CHECK = "answer_check"       # Cevap kontrolü


@dataclass
class HomeworkAnalysis:
    """Ödev analiz sonucu"""
    id: str
    user_id: str
    image_url: str
    subject: SubjectType
    analysis_date: datetime
    extracted_text: str
    detected_formulas: List[Dict] = field(default_factory=list)
    detected_shapes: List[Dict] = field(default_factory=list)
    quality_score: float = 0.0
    handwriting_score: float = 0.0
    organization_score: float = 0.0
    completeness_score: float = 0.0
    answers: List[Dict] = field(default_factory=list)
    corrections: List[Dict] = field(default_factory=list)
    feedback: str = ""
    overall_score: float = 0.0
    metadata: Dict = field(default_factory=dict)


@dataclass
class MathProblem:
    """Matematik problemi"""
    problem_text: str
    problem_type: str  # equation, word_problem, geometry, etc.
    student_solution: str
    is_correct: bool
    correct_solution: Optional[str] = None
    error_type: Optional[str] = None
    hint: Optional[str] = None


@dataclass
class HandwritingMetrics:
    """El yazısı metrikleri"""
    legibility_score: float      # Okunabilirlik
    consistency_score: float     # Tutarlılık
    spacing_score: float         # Boşluk kullanımı
    alignment_score: float       # Hizalama
    size_uniformity: float       # Boyut tutarlılığı
    pressure_consistency: float  # Basınç tutarlılığı
    overall_score: float


class ComputerVisionService:
    """Computer Vision servisi"""
    
    def __init__(self):
        self.db = get_database()
        
        # OCR ayarları
        self.ocr_config = {
            "language": "tur+eng",  # Türkçe + İngilizce
            "oem": 3,  # OCR Engine Mode
            "psm": 6   # Page Segmentation Mode
        }
        
        # OpenAI Vision API ayarları
        self.vision_api_config = {
            "api_key": settings.OPENAI_API_KEY,
            "model": "gpt-4-vision-preview",
            "max_tokens": 1000
        }
        
        # Görüntü işleme parametreleri
        self.image_processing = {
            "max_size": (2048, 2048),
            "quality": 85,
            "enhance_contrast": 1.2,
            "enhance_brightness": 1.1,
            "denoise_strength": 3
        }
        
        # Matematik sembolleri regex
        self.math_patterns = {
            "equation": r"[\d\+\-\*\/\=\(\)\^]+",
            "fraction": r"\d+\/\d+",
            "exponent": r"\d+\^\d+",
            "sqrt": r"√\d+",
            "geometry": r"[△□○∠∥⊥°]"
        }
        
        # Değerlendirme ağırlıkları
        self.scoring_weights = {
            "content_accuracy": 0.4,
            "handwriting_quality": 0.2,
            "organization": 0.2,
            "completeness": 0.2
        }
        
        logger.info("Computer Vision Service başlatıldı")
    
    async def analyze_homework_image(
        self,
        image_data: Union[bytes, str],
        user_id: str,
        subject: SubjectType,
        assignment_id: Optional[str] = None,
        expected_answers: Optional[List[Dict]] = None
    ) -> HomeworkAnalysis:
        """
        Ödev fotoğrafını analiz et
        
        Args:
            image_data: Görüntü verisi (base64 veya bytes)
            user_id: Kullanıcı ID
            subject: Ders tipi
            assignment_id: Ödev ID (varsa)
            expected_answers: Beklenen cevaplar (varsa)
        """
        # Base64'ten decode et
        if isinstance(image_data, str):
            image_data = base64.b64decode(image_data)
        
        # Görüntüyü işle
        processed_image = await self._preprocess_image(image_data)
        
        # Analiz ID oluştur
        analysis_id = f"hw_analysis_{user_id}_{datetime.utcnow().timestamp()}"
        
        # Paralel analizler
        tasks = [
            self._extract_text(processed_image),
            self._analyze_handwriting(processed_image),
            self._analyze_quality(processed_image),
            self._detect_shapes_and_diagrams(processed_image)
        ]
        
        results = await asyncio.gather(*tasks)
        
        extracted_text = results[0]
        handwriting_metrics = results[1]
        quality_metrics = results[2]
        shapes = results[3]
        
        # Matematik formülleri tespit et
        formulas = []
        if subject == SubjectType.MATHEMATICS:
            formulas = await self._detect_math_formulas(extracted_text, processed_image)
        
        # Cevapları kontrol et
        answers = []
        corrections = []
        if expected_answers:
            answers, corrections = await self._check_answers(
                extracted_text,
                formulas,
                expected_answers,
                subject
            )
        
        # Genel değerlendirme
        scores = await self._calculate_scores(
            extracted_text,
            handwriting_metrics,
            quality_metrics,
            answers,
            subject
        )
        
        # AI ile detaylı analiz
        ai_feedback = await self._get_ai_feedback(
            extracted_text,
            formulas,
            corrections,
            subject,
            user_id
        )
        
        # Analiz sonucu oluştur
        analysis = HomeworkAnalysis(
            id=analysis_id,
            user_id=user_id,
            image_url=f"homework/{analysis_id}.jpg",  # S3'e yüklenecek
            subject=subject,
            analysis_date=datetime.utcnow(),
            extracted_text=extracted_text,
            detected_formulas=formulas,
            detected_shapes=shapes,
            quality_score=scores["quality"],
            handwriting_score=scores["handwriting"],
            organization_score=scores["organization"],
            completeness_score=scores["completeness"],
            answers=answers,
            corrections=corrections,
            feedback=ai_feedback,
            overall_score=scores["overall"],
            metadata={
                "assignment_id": assignment_id,
                "processing_time": datetime.utcnow().isoformat()
            }
        )
        
        # Veritabanına kaydet
        if self.db:
            await self.db.homework_analyses.insert_one(analysis.__dict__)
        
        # Cache'e kaydet
        cache_key = f"hw_analysis:{analysis_id}"
        await cache.set(cache_key, analysis.__dict__, ttl=86400, namespace="vision")
        
        return analysis
    
    async def _preprocess_image(self, image_data: bytes) -> np.ndarray:
        """Görüntü ön işleme"""
        # PIL Image olarak aç
        image = Image.open(io.BytesIO(image_data))
        
        # RGB'ye dönüştür
        if image.mode != 'RGB':
            image = image.convert('RGB')
        
        # Boyutlandır
        image.thumbnail(self.image_processing["max_size"], Image.Resampling.LANCZOS)
        
        # Kontrast ve parlaklık ayarla
        enhancer_contrast = ImageEnhance.Contrast(image)
        image = enhancer_contrast.enhance(self.image_processing["enhance_contrast"])
        
        enhancer_brightness = ImageEnhance.Brightness(image)
        image = enhancer_brightness.enhance(self.image_processing["enhance_brightness"])
        
        # Numpy array'e dönüştür
        img_array = np.array(image)
        
        # OpenCV işlemleri
        # Gri tonlama
        gray = cv2.cvtColor(img_array, cv2.COLOR_RGB2GRAY)
        
        # Gürültü azaltma
        denoised = cv2.fastNlMeansDenoising(
            gray,
            None,
            self.image_processing["denoise_strength"],
            7,
            21
        )
        
        # Adaptif threshold (el yazısı için)
        thresh = cv2.adaptiveThreshold(
            denoised,
            255,
            cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
            cv2.THRESH_BINARY,
            11,
            2
        )
        
        return thresh
    
    async def _extract_text(self, image: np.ndarray) -> str:
        """OCR ile metin çıkarma"""
        try:
            # Tesseract OCR
            custom_config = f'--oem {self.ocr_config["oem"]} --psm {self.ocr_config["psm"]}'
            text = pytesseract.image_to_string(
                image,
                lang=self.ocr_config["language"],
                config=custom_config
            )
            
            # Temizle
            text = text.strip()
            text = re.sub(r'\n+', '\n', text)  # Çoklu satır sonlarını temizle
            
            return text
            
        except Exception as e:
            logger.error(f"OCR hatası: {e}")
            return ""
    
    async def _analyze_handwriting(self, image: np.ndarray) -> HandwritingMetrics:
        """El yazısı analizi"""
        # Kontur analizi
        contours, _ = cv2.findContours(
            image,
            cv2.RETR_EXTERNAL,
            cv2.CHAIN_APPROX_SIMPLE
        )
        
        # Karakter boyutları
        char_sizes = []
        char_positions = []
        
        for contour in contours:
            area = cv2.contourArea(contour)
            if area > 10:  # Küçük gürültüleri filtrele
                x, y, w, h = cv2.boundingRect(contour)
                char_sizes.append((w, h))
                char_positions.append((x, y))
        
        # Metrikler hesapla
        if char_sizes:
            # Boyut tutarlılığı
            widths = [s[0] for s in char_sizes]
            heights = [s[1] for s in char_sizes]
            size_uniformity = 1 - (np.std(heights) / np.mean(heights)) if heights else 0
            
            # Hizalama (y pozisyonları)
            y_positions = [p[1] for p in char_positions]
            alignment_score = 1 - (np.std(y_positions) / image.shape[0]) if y_positions else 0
            
            # Boşluk tutarlılığı (x pozisyonları arası fark)
            x_positions = sorted([p[0] for p in char_positions])
            if len(x_positions) > 1:
                spacings = [x_positions[i+1] - x_positions[i] for i in range(len(x_positions)-1)]
                spacing_score = 1 - (np.std(spacings) / np.mean(spacings)) if spacings else 0
            else:
                spacing_score = 0.5
        else:
            size_uniformity = 0
            alignment_score = 0
            spacing_score = 0
        
        # Okunabilirlik (OCR güven skoru simülasyonu)
        legibility_score = 0.7  # TODO: Gerçek OCR güven skorundan al
        
        # Genel skor
        overall_score = (
            legibility_score * 0.3 +
            size_uniformity * 0.2 +
            spacing_score * 0.2 +
            alignment_score * 0.2 +
            0.1  # Consistency placeholder
        )
        
        return HandwritingMetrics(
            legibility_score=legibility_score,
            consistency_score=0.7,  # Placeholder
            spacing_score=spacing_score,
            alignment_score=alignment_score,
            size_uniformity=size_uniformity,
            pressure_consistency=0.7,  # Placeholder
            overall_score=min(1.0, overall_score)
        )
    
    async def _analyze_quality(self, image: np.ndarray) -> Dict[str, float]:
        """Görüntü kalitesi analizi"""
        # Netlik (Laplacian variance)
        laplacian = cv2.Laplacian(image, cv2.CV_64F)
        sharpness = laplacian.var()
        sharpness_score = min(1.0, sharpness / 1000)  # Normalize
        
        # Kontrast
        contrast = image.std()
        contrast_score = min(1.0, contrast / 100)
        
        # Parlaklık dengesi
        brightness = image.mean()
        brightness_score = 1 - abs(brightness - 128) / 128
        
        # Gürültü seviyesi (basit tahmin)
        noise_score = 0.8  # Placeholder
        
        return {
            "sharpness": sharpness_score,
            "contrast": contrast_score,
            "brightness": brightness_score,
            "noise": noise_score,
            "overall": (sharpness_score + contrast_score + brightness_score + noise_score) / 4
        }
    
    async def _detect_shapes_and_diagrams(self, image: np.ndarray) -> List[Dict]:
        """Şekil ve diyagram tespiti"""
        shapes = []
        
        # Hough dönüşümü ile çizgi tespiti
        lines = cv2.HoughLinesP(
            image,
            1,
            np.pi/180,
            threshold=50,
            minLineLength=30,
            maxLineGap=10
        )
        
        if lines is not None:
            for line in lines:
                x1, y1, x2, y2 = line[0]
                shapes.append({
                    "type": "line",
                    "coordinates": [(x1, y1), (x2, y2)],
                    "length": np.sqrt((x2-x1)**2 + (y2-y1)**2)
                })
        
        # Daire tespiti
        circles = cv2.HoughCircles(
            image,
            cv2.HOUGH_GRADIENT,
            1,
            20,
            param1=50,
            param2=30,
            minRadius=10,
            maxRadius=100
        )
        
        if circles is not None:
            circles = np.uint16(np.around(circles))
            for circle in circles[0, :]:
                shapes.append({
                    "type": "circle",
                    "center": (int(circle[0]), int(circle[1])),
                    "radius": int(circle[2])
                })
        
        # Dikdörtgen tespiti (kontur bazlı)
        contours, _ = cv2.findContours(
            image,
            cv2.RETR_EXTERNAL,
            cv2.CHAIN_APPROX_SIMPLE
        )
        
        for contour in contours:
            area = cv2.contourArea(contour)
            if area > 100:  # Minimum alan filtresi
                approx = cv2.approxPolyDP(
                    contour,
                    0.02 * cv2.arcLength(contour, True),
                    True
                )
                
                if len(approx) == 4:  # Dikdörtgen
                    x, y, w, h = cv2.boundingRect(approx)
                    shapes.append({
                        "type": "rectangle",
                        "coordinates": [(x, y), (x+w, y+h)],
                        "area": w * h
                    })
                elif len(approx) == 3:  # Üçgen
                    shapes.append({
                        "type": "triangle",
                        "vertices": approx.tolist()
                    })
        
        return shapes
    
    async def _detect_math_formulas(
        self,
        text: str,
        image: np.ndarray
    ) -> List[Dict]:
        """Matematik formüllerini tespit et"""
        formulas = []
        
        # Regex ile basit formül tespiti
        for pattern_name, pattern in self.math_patterns.items():
            matches = re.finditer(pattern, text)
            for match in matches:
                formulas.append({
                    "type": pattern_name,
                    "text": match.group(),
                    "position": (match.start(), match.end())
                })
        
        # AI Vision API ile gelişmiş formül tanıma
        if settings.get("USE_VISION_API", False):
            # Görüntüyü base64'e çevir
            _, buffer = cv2.imencode('.png', image)
            img_base64 = base64.b64encode(buffer).decode()
            
            vision_formulas = await self._detect_formulas_with_ai(img_base64)
            formulas.extend(vision_formulas)
        
        return formulas
    
    async def _detect_formulas_with_ai(self, image_base64: str) -> List[Dict]:
        """AI Vision API ile formül tespiti"""
        try:
            prompt = """
            Bu görüntüdeki tüm matematik formüllerini, denklemleri ve sembolleri tespit et.
            Her birini LaTeX formatında ver.
            """
            
            # OpenAI Vision API çağrısı
            # TODO: Implement actual API call
            
            return []
            
        except Exception as e:
            logger.error(f"Vision API hatası: {e}")
            return []
    
    async def _check_answers(
        self,
        extracted_text: str,
        formulas: List[Dict],
        expected_answers: List[Dict],
        subject: SubjectType
    ) -> Tuple[List[Dict], List[Dict]]:
        """Cevapları kontrol et"""
        answers = []
        corrections = []
        
        # Her beklenen cevap için kontrol
        for expected in expected_answers:
            question_num = expected.get("question_number")
            correct_answer = expected.get("answer")
            answer_type = expected.get("type", "text")
            
            # Öğrenci cevabını bul
            student_answer = await self._find_student_answer(
                extracted_text,
                formulas,
                question_num,
                answer_type
            )
            
            # Cevabı değerlendir
            is_correct = False
            feedback = ""
            
            if answer_type == "math":
                is_correct, feedback = await self._check_math_answer(
                    student_answer,
                    correct_answer
                )
            elif answer_type == "multiple_choice":
                is_correct = student_answer.lower() == correct_answer.lower()
                feedback = "Doğru!" if is_correct else f"Doğru cevap: {correct_answer}"
            else:  # text
                is_correct, feedback = await self._check_text_answer(
                    student_answer,
                    correct_answer,
                    subject
                )
            
            # Sonuçları kaydet
            answer_result = {
                "question_number": question_num,
                "student_answer": student_answer,
                "is_correct": is_correct,
                "feedback": feedback
            }
            answers.append(answer_result)
            
            if not is_correct:
                corrections.append({
                    "question_number": question_num,
                    "error_type": "incorrect_answer",
                    "student_answer": student_answer,
                    "correct_answer": correct_answer,
                    "explanation": feedback
                })
        
        return answers, corrections
    
    async def _find_student_answer(
        self,
        text: str,
        formulas: List[Dict],
        question_num: int,
        answer_type: str
    ) -> str:
        """Metinden öğrenci cevabını bul"""
        # Soru numarası pattern'leri
        patterns = [
            rf"{question_num}\s*[\.)\-]\s*(.+?)(?:\n|$)",
            rf"Soru\s*{question_num}\s*[:\-]\s*(.+?)(?:\n|$)",
            rf"S{question_num}\s*[:\-]\s*(.+?)(?:\n|$)"
        ]
        
        for pattern in patterns:
            match = re.search(pattern, text, re.IGNORECASE | re.MULTILINE)
            if match:
                return match.group(1).strip()
        
        # Formüllerde ara
        if answer_type == "math":
            for formula in formulas:
                if f"{question_num}" in formula.get("text", ""):
                    return formula["text"]
        
        return ""
    
    async def _check_math_answer(
        self,
        student_answer: str,
        correct_answer: str
    ) -> Tuple[bool, str]:
        """Matematik cevabını kontrol et"""
        try:
            # Basit sayısal karşılaştırma
            student_val = eval(student_answer.replace("^", "**"))
            correct_val = eval(correct_answer.replace("^", "**"))
            
            if abs(student_val - correct_val) < 0.001:
                return True, "Doğru! Harika çözüm!"
            else:
                return False, f"Yanlış. Doğru cevap: {correct_answer}"
                
        except:
            # Metin bazlı karşılaştırma
            if student_answer.strip() == correct_answer.strip():
                return True, "Doğru!"
            else:
                return False, f"Yanlış. Doğru cevap: {correct_answer}"
    
    async def _check_text_answer(
        self,
        student_answer: str,
        correct_answer: str,
        subject: SubjectType
    ) -> Tuple[bool, str]:
        """Metin cevabını kontrol et (AI destekli)"""
        # AI ile benzerlik kontrolü
        prompt = f"""
        Öğrenci cevabı: {student_answer}
        Doğru cevap: {correct_answer}
        Ders: {subject}
        
        Öğrenci cevabının doğru olup olmadığını değerlendir.
        Cevap özünde doğruysa, küçük yazım hatalarını göz ardı et.
        
        Değerlendirme:
        - Doğru mu? (Evet/Hayır)
        - Kısa açıklama
        """
        
        try:
            response, _ = await ai_service.get_ai_response(
                prompt=prompt,
                grade_level=5,
                subject=subject,
                max_tokens=200
            )
            
            # AI yanıtını parse et
            is_correct = "evet" in response.lower()[:20]
            feedback = response.split("\n")[-1] if "\n" in response else response
            
            return is_correct, feedback
            
        except:
            # Basit karşılaştırma
            similarity = self._calculate_text_similarity(student_answer, correct_answer)
            is_correct = similarity > 0.8
            feedback = "Doğru!" if is_correct else "Yanlış. Cevabını tekrar gözden geçir."
            
            return is_correct, feedback
    
    def _calculate_text_similarity(self, text1: str, text2: str) -> float:
        """Metin benzerliği hesapla"""
        from difflib import SequenceMatcher
        
        # Normalize
        text1 = text1.lower().strip()
        text2 = text2.lower().strip()
        
        return SequenceMatcher(None, text1, text2).ratio()
    
    async def _calculate_scores(
        self,
        extracted_text: str,
        handwriting: HandwritingMetrics,
        quality: Dict[str, float],
        answers: List[Dict],
        subject: SubjectType
    ) -> Dict[str, float]:
        """Skorları hesapla"""
        # İçerik doğruluğu
        if answers:
            correct_count = sum(1 for a in answers if a["is_correct"])
            content_accuracy = correct_count / len(answers)
        else:
            content_accuracy = 0.7  # Default
        
        # Tamamlanma oranı
        completeness = 1.0 if len(extracted_text) > 50 else len(extracted_text) / 50
        
        # Organizasyon (basit tahmin)
        organization = 0.8 if "\n" in extracted_text else 0.6
        
        # Genel skor
        overall = (
            content_accuracy * self.scoring_weights["content_accuracy"] +
            handwriting.overall_score * self.scoring_weights["handwriting_quality"] +
            organization * self.scoring_weights["organization"] +
            completeness * self.scoring_weights["completeness"]
        )
        
        return {
            "content_accuracy": content_accuracy,
            "handwriting": handwriting.overall_score,
            "quality": quality["overall"],
            "organization": organization,
            "completeness": completeness,
            "overall": min(1.0, overall)
        }
    
    async def _get_ai_feedback(
        self,
        text: str,
        formulas: List[Dict],
        corrections: List[Dict],
        subject: SubjectType,
        user_id: str
    ) -> str:
        """AI ile detaylı geri bildirim"""
        # Kullanıcı bilgilerini al (yaş, seviye vs.)
        user_info = ""
        if self.db:
            user = await self.db.users.find_one({"_id": user_id})
            if user:
                user_info = f"Öğrenci: {user.get('grade_level', 5)}. sınıf"
        
        prompt = f"""
        {user_info}
        Ders: {subject}
        
        Öğrencinin ödevini değerlendir ve yapıcı geri bildirim ver.
        
        Tespit edilen hatalar:
        {corrections}
        
        Değerlendirme kriterleri:
        1. İçerik doğruluğu
        2. El yazısı kalitesi
        3. Düzen ve organizasyon
        4. Çaba ve özen
        
        Öğrenciyi motive edici, yaşına uygun bir dille geri bildirim yaz.
        """
        
        try:
            feedback, _ = await ai_service.get_ai_response(
                prompt=prompt,
                grade_level=5,
                subject=subject,
                max_tokens=300
            )
            
            return feedback
            
        except Exception as e:
            logger.error(f"AI feedback hatası: {e}")
            return "Ödevini aldım! Çok güzel çalışmışsın. Birkaç küçük hata var ama genel olarak başarılı. Devam et! 👏"
    
    async def analyze_exam_paper(
        self,
        image_data: Union[bytes, str],
        exam_template: Dict,
        user_id: str
    ) -> Dict[str, Any]:
        """Sınav kağıdı analizi"""
        # Görüntüyü işle
        if isinstance(image_data, str):
            image_data = base64.b64decode(image_data)
        
        processed_image = await self._preprocess_image(image_data)
        
        # OMR (Optical Mark Recognition) için
        if exam_template.get("type") == "multiple_choice":
            answers = await self._detect_omr_answers(processed_image, exam_template)
        else:
            # Klasik sınav
            text = await self._extract_text(processed_image)
            answers = await self._extract_exam_answers(text, exam_template)
        
        # Puanlama
        score, details = await self._calculate_exam_score(answers, exam_template)
        
        return {
            "user_id": user_id,
            "exam_id": exam_template.get("id"),
            "answers": answers,
            "score": score,
            "details": details,
            "analyzed_at": datetime.utcnow()
        }
    
    async def _detect_omr_answers(
        self,
        image: np.ndarray,
        template: Dict
    ) -> List[Dict]:
        """OMR cevap kağıdı okuma"""
        answers = []
        
        # Daire tespiti ile işaretleri bul
        circles = cv2.HoughCircles(
            image,
            cv2.HOUGH_GRADIENT,
            1,
            20,
            param1=50,
            param2=30,
            minRadius=5,
            maxRadius=15
        )
        
        if circles is not None:
            # Template'e göre cevapları eşleştir
            # TODO: Implement OMR matching logic
            pass
        
        return answers
    
    async def _extract_exam_answers(
        self,
        text: str,
        template: Dict
    ) -> List[Dict]:
        """Klasik sınav cevaplarını çıkar"""
        answers = []
        
        for question in template.get("questions", []):
            q_num = question["number"]
            answer = await self._find_student_answer(
                text,
                [],
                q_num,
                question.get("type", "text")
            )
            
            answers.append({
                "question_number": q_num,
                "answer": answer,
                "max_points": question.get("points", 10)
            })
        
        return answers
    
    async def _calculate_exam_score(
        self,
        answers: List[Dict],
        template: Dict
    ) -> Tuple[float, List[Dict]]:
        """Sınav puanı hesapla"""
        total_score = 0
        max_score = 0
        details = []
        
        for answer in answers:
            q_num = answer["question_number"]
            correct_answer = template.get("answer_key", {}).get(str(q_num))
            max_points = answer["max_points"]
            
            if correct_answer:
                is_correct = answer["answer"] == correct_answer
                points = max_points if is_correct else 0
            else:
                # Açık uçlu soru - kısmi puan
                points = max_points * 0.7  # Placeholder
            
            total_score += points
            max_score += max_points
            
            details.append({
                "question": q_num,
                "earned": points,
                "max": max_points
            })
        
        percentage = (total_score / max_score * 100) if max_score > 0 else 0
        
        return percentage, details
    
    async def get_homework_history(
        self,
        user_id: str,
        subject: Optional[SubjectType] = None,
        limit: int = 20
    ) -> List[HomeworkAnalysis]:
        """Ödev geçmişini getir"""
        if not self.db:
            return []
        
        query = {"user_id": user_id}
        if subject:
            query["subject"] = subject
        
        analyses = []
        cursor = self.db.homework_analyses.find(query)\
            .sort("analysis_date", -1)\
            .limit(limit)
        
        async for analysis_data in cursor:
            analyses.append(HomeworkAnalysis(**analysis_data))
        
        return analyses
    
    async def get_progress_report(
        self,
        user_id: str,
        subject: SubjectType,
        days: int = 30
    ) -> Dict[str, Any]:
        """İlerleme raporu"""
        if not self.db:
            return {}
        
        # Son X gün
        start_date = datetime.utcnow() - timedelta(days=days)
        
        # Ödev analizlerini getir
        analyses = await self.db.homework_analyses.find({
            "user_id": user_id,
            "subject": subject,
            "analysis_date": {"$gte": start_date}
        }).to_list(100)
        
        if not analyses:
            return {
                "message": "Bu dönemde analiz edilmiş ödev yok"
            }
        
        # İstatistikler
        scores = [a["overall_score"] for a in analyses]
        handwriting_scores = [a["handwriting_score"] for a in analyses]
        
        # Hata analizi
        all_corrections = []
        for analysis in analyses:
            all_corrections.extend(analysis.get("corrections", []))
        
        # En sık yapılan hatalar
        error_types = defaultdict(int)
        for correction in all_corrections:
            error_types[correction.get("error_type", "other")] += 1
        
        return {
            "period_days": days,
            "total_homeworks": len(analyses),
            "average_score": np.mean(scores),
            "score_trend": "improving" if scores[-1] > scores[0] else "stable",
            "handwriting_improvement": np.mean(handwriting_scores[-3:]) - np.mean(handwriting_scores[:3]),
            "common_errors": dict(error_types),
            "best_homework": max(analyses, key=lambda x: x["overall_score"])["id"],
            "latest_feedback": analyses[0].get("feedback", "")
        }


# Global computer vision service instance
computer_vision_service = ComputerVisionService()


# Helper functions
async def analyze_homework(
    image_data: Union[bytes, str],
    user_id: str,
    subject: str = "mathematics"
) -> HomeworkAnalysis:
    """Basit ödev analizi"""
    return await computer_vision_service.analyze_homework_image(
        image_data=image_data,
        user_id=user_id,
        subject=SubjectType(subject)
    )


async def check_math_solution(
    problem_image: bytes,
    correct_answer: str
) -> Dict[str, Any]:
    """Matematik çözümü kontrolü"""
    # OCR ile çözümü oku
    image = await computer_vision_service._preprocess_image(problem_image)
    extracted_text = await computer_vision_service._extract_text(image)
    
    # Cevabı kontrol et
    is_correct, feedback = await computer_vision_service._check_math_answer(
        extracted_text,
        correct_answer
    )
    
    return {
        "student_solution": extracted_text,
        "is_correct": is_correct,
        "feedback": feedback
    }

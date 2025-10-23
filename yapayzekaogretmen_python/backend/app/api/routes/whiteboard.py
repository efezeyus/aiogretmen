"""
AI Whiteboard API Routes
------------------------
AI öğretmenin interaktif tahta üzerinde öğretim yapması için endpoint'ler.
"""

from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends, HTTPException
from typing import Dict, List, Optional, Any
from pydantic import BaseModel
from datetime import datetime
import asyncio
import json
import re

from app.core.logger import logger
from app.models.user import User
from app.api.middlewares.auth import get_current_user
from app.services.ai_service import ai_service


router = APIRouter(
    prefix="/whiteboard",
    tags=["AI Whiteboard"]
)


# Request/Response Models
class WhiteboardProblemRequest(BaseModel):
    """Tahta üzerinde çözülecek problem"""
    problem: str
    lesson_id: Optional[str] = None
    subject: str = "matematik"
    grade: int = 6
    detailed: bool = True


class WhiteboardStep(BaseModel):
    """Çözüm adımı"""
    number: int
    explanation: str
    expression: Optional[str] = None
    visual: Optional[Dict[str, Any]] = None


class WhiteboardSolutionResponse(BaseModel):
    """Tahta çözüm yanıtı"""
    problem: str
    steps: List[WhiteboardStep]
    total_time_estimate: int  # saniye
    difficulty: str


# WebSocket bağlantı yöneticisi
class WhiteboardConnectionManager:
    """WebSocket bağlantılarını yönetir"""
    
    def __init__(self):
        self.active_connections: Dict[str, List[WebSocket]] = {}
    
    async def connect(self, lesson_id: str, websocket: WebSocket):
        """Yeni bağlantı ekle"""
        await websocket.accept()
        if lesson_id not in self.active_connections:
            self.active_connections[lesson_id] = []
        self.active_connections[lesson_id].append(websocket)
        logger.info(f"Whiteboard WebSocket bağlantısı: {lesson_id}")
    
    def disconnect(self, lesson_id: str, websocket: WebSocket):
        """Bağlantıyı kaldır"""
        if lesson_id in self.active_connections:
            self.active_connections[lesson_id].remove(websocket)
            if not self.active_connections[lesson_id]:
                del self.active_connections[lesson_id]
        logger.info(f"Whiteboard WebSocket bağlantısı kesildi: {lesson_id}")
    
    async def broadcast(self, lesson_id: str, message: dict):
        """Tüm bağlantılara mesaj gönder"""
        if lesson_id in self.active_connections:
            disconnected = []
            for connection in self.active_connections[lesson_id]:
                try:
                    await connection.send_json(message)
                except Exception as e:
                    logger.error(f"Broadcast hatası: {e}")
                    disconnected.append(connection)
            
            # Bağlantısı kesilenleri temizle
            for conn in disconnected:
                self.disconnect(lesson_id, conn)


manager = WhiteboardConnectionManager()


# AI Problem Çözücü
class AIWhiteboardSolver:
    """AI'ın tahta üzerinde problem çözmesi"""
    
    @staticmethod
    def detect_problem_type(problem: str) -> str:
        """Problem tipini tespit et"""
        problem = problem.lower()
        
        if any(word in problem for word in ['denklem', 'equation', '=', 'x', 'y']):
            return 'equation'
        elif any(word in problem for word in ['toplama', '+', 'topla', 'addition']):
            return 'addition'
        elif any(word in problem for word in ['çıkarma', '-', 'subtract', 'çıkar']):
            return 'subtraction'
        elif any(word in problem for word in ['çarpma', '×', 'x', '*', 'multiply', 'çarp']):
            return 'multiplication'
        elif any(word in problem for word in ['bölme', '÷', '/', 'divide', 'böl']):
            return 'division'
        elif any(word in problem for word in ['kesir', 'fraction']):
            return 'fraction'
        elif any(word in problem for word in ['yüzde', '%', 'percent']):
            return 'percentage'
        elif any(word in problem for word in ['alan', 'çevre', 'area', 'perimeter']):
            return 'geometry'
        else:
            return 'general'
    
    @staticmethod
    async def solve_equation(problem: str) -> List[WhiteboardStep]:
        """Denklem çözümü adımları"""
        steps = []
        
        # Basit doğrusal denklem çözümü (2x + 5 = 15 gibi)
        match = re.search(r'(\d*)x\s*([+-])\s*(\d+)\s*=\s*(\d+)', problem)
        
        if match:
            a = int(match.group(1)) if match.group(1) else 1
            sign = match.group(2)
            b = int(match.group(3))
            c = int(match.group(4))
            
            # Adım 1: Problemi yaz
            steps.append(WhiteboardStep(
                number=1,
                explanation="Denklemi yazalım",
                expression=f"{a}x {sign} {b} = {c}",
                visual=None
            ))
            
            # Adım 2: Sabiti karşı tarafa geçir
            if sign == '+':
                new_c = c - b
                steps.append(WhiteboardStep(
                    number=2,
                    explanation=f"{b}'i her iki taraftan çıkaralım",
                    expression=f"{a}x = {c} - {b} = {new_c}",
                    visual=None
                ))
            else:
                new_c = c + b
                steps.append(WhiteboardStep(
                    number=2,
                    explanation=f"{b}'i her iki tarafa ekleyelim",
                    expression=f"{a}x = {c} + {b} = {new_c}",
                    visual=None
                ))
            
            # Adım 3: x'i bul
            x = new_c / a
            steps.append(WhiteboardStep(
                number=3,
                explanation=f"Her iki tarafı {a}'e bölelim",
                expression=f"x = {new_c} ÷ {a} = {x}",
                visual=None
            ))
            
            # Adım 4: Kontrol
            steps.append(WhiteboardStep(
                number=4,
                explanation="Sonucu kontrol edelim",
                expression=f"{a} × {x} {sign} {b} = {c} ✓",
                visual=None
            ))
            
            # Sayı doğrusunda gösterim
            steps.append(WhiteboardStep(
                number=5,
                explanation="Sayı doğrusunda gösterelim",
                expression=None,
                visual={
                    "type": "number_line",
                    "data": {
                        "min": int(x) - 5,
                        "max": int(x) + 5,
                        "highlight": x
                    },
                    "height": 100
                }
            ))
        
        return steps
    
    @staticmethod
    async def solve_arithmetic(problem: str, operation: str) -> List[WhiteboardStep]:
        """Aritmetik işlem çözümü"""
        steps = []
        
        # Sayıları bul
        numbers = re.findall(r'\d+', problem)
        if len(numbers) < 2:
            return steps
        
        a, b = int(numbers[0]), int(numbers[1])
        
        if operation == 'addition':
            # Toplama
            steps.append(WhiteboardStep(
                number=1,
                explanation="Sayıları alt alta yazalım",
                expression=f"  {a}\n+ {b}\n----",
                visual=None
            ))
            
            result = a + b
            steps.append(WhiteboardStep(
                number=2,
                explanation=f"{a} + {b} = {result}",
                expression=f"  {a}\n+ {b}\n----\n {result}",
                visual=None
            ))
        
        elif operation == 'multiplication':
            # Çarpma
            steps.append(WhiteboardStep(
                number=1,
                explanation=f"{a} sayısını {b} kere toplayacağız",
                expression=f"{a} × {b}",
                visual=None
            ))
            
            # Adım adım toplama
            total = 0
            for i in range(1, b + 1):
                total += a
                steps.append(WhiteboardStep(
                    number=i + 1,
                    explanation=f"{i}. adım",
                    expression=f"{a} × {i} = {total}",
                    visual=None
                ))
            
            steps.append(WhiteboardStep(
                number=b + 2,
                explanation="Sonuç",
                expression=f"{a} × {b} = {total} ✓",
                visual=None
            ))
        
        return steps
    
    @staticmethod
    async def solve_geometry(problem: str) -> List[WhiteboardStep]:
        """Geometri problemi çözümü"""
        steps = []
        
        # Alan hesaplama
        if 'kare' in problem.lower() or 'square' in problem.lower():
            numbers = re.findall(r'\d+', problem)
            if numbers:
                side = int(numbers[0])
                
                steps.append(WhiteboardStep(
                    number=1,
                    explanation="Karenin kenar uzunluğu veriliyor",
                    expression=f"Kenar = {side} cm",
                    visual={
                        "type": "diagram",
                        "data": {
                            "shape": "square",
                            "side": side
                        }
                    }
                ))
                
                steps.append(WhiteboardStep(
                    number=2,
                    explanation="Karenin alanı = Kenar × Kenar",
                    expression=f"Alan = {side} × {side}",
                    visual=None
                ))
                
                area = side * side
                steps.append(WhiteboardStep(
                    number=3,
                    explanation="Sonuç",
                    expression=f"Alan = {area} cm²",
                    visual=None
                ))
        
        return steps
    
    @staticmethod
    async def solve_with_ai(problem: str, subject: str, grade: int) -> List[WhiteboardStep]:
        """AI ile genel problem çözümü"""
        steps = []
        
        try:
            # AI'dan adım adım çözüm iste
            prompt = f"""
Sen bir matematik öğretmenisin ve {grade}. sınıf öğrencisine tahta üzerinde problem çözüyorsun.

Problem: {problem}

Lütfen bu problemi aşağıdaki formatta adım adım çöz:

1. ADIM: [Açıklama]
   İfade: [Matematiksel ifade]

2. ADIM: [Açıklama]
   İfade: [Matematiksel ifade]

...

Her adımı çok açık ve anlaşılır bir şekilde açıkla.
Öğrenci tahta üzerinde seni izleyecek.
"""
            
            response = await ai_service.get_completion(prompt)
            
            # AI yanıtını parse et
            lines = response.split('\n')
            current_step = 0
            current_explanation = ""
            current_expression = ""
            
            for line in lines:
                line = line.strip()
                if not line:
                    continue
                
                # Adım numarası tespit et
                step_match = re.match(r'(\d+)\.\s*ADIM:', line, re.IGNORECASE)
                if step_match:
                    # Önceki adımı kaydet
                    if current_step > 0:
                        steps.append(WhiteboardStep(
                            number=current_step,
                            explanation=current_explanation,
                            expression=current_expression if current_expression else None,
                            visual=None
                        ))
                    
                    current_step = int(step_match.group(1))
                    current_explanation = line.split(':', 1)[1].strip() if ':' in line else ""
                    current_expression = ""
                
                elif 'İfade:' in line or 'Expression:' in line:
                    current_expression = line.split(':', 1)[1].strip()
                
                elif current_step > 0:
                    # Açıklamaya devam
                    if current_explanation:
                        current_explanation += " " + line
                    else:
                        current_explanation = line
            
            # Son adımı kaydet
            if current_step > 0:
                steps.append(WhiteboardStep(
                    number=current_step,
                    explanation=current_explanation,
                    expression=current_expression if current_expression else None,
                    visual=None
                ))
        
        except Exception as e:
            logger.error(f"AI çözüm hatası: {e}")
            # Fallback
            steps.append(WhiteboardStep(
                number=1,
                explanation="Bu problemi birlikte çözelim",
                expression=problem,
                visual=None
            ))
        
        return steps


solver = AIWhiteboardSolver()


@router.post("/solve", response_model=WhiteboardSolutionResponse)
async def solve_problem_on_whiteboard(
    request: WhiteboardProblemRequest,
    current_user: User = Depends(get_current_user)
):
    """
    AI öğretmen tahtada problem çözer
    """
    try:
        # Problem tipini tespit et
        problem_type = solver.detect_problem_type(request.problem)
        logger.info(f"Problem tipi: {problem_type} - Problem: {request.problem}")
        
        # Problem tipine göre çöz
        steps = []
        
        if problem_type == 'equation':
            steps = await solver.solve_equation(request.problem)
        elif problem_type in ['addition', 'subtraction', 'multiplication', 'division']:
            steps = await solver.solve_arithmetic(request.problem, problem_type)
        elif problem_type == 'geometry':
            steps = await solver.solve_geometry(request.problem)
        
        # Eğer özel çözüm bulunamadıysa AI kullan
        if not steps or request.detailed:
            ai_steps = await solver.solve_with_ai(
                request.problem,
                request.subject,
                request.grade
            )
            if ai_steps:
                steps = ai_steps
        
        # Toplam süre tahmini (her adım için 3 saniye)
        total_time = len(steps) * 3
        
        # Zorluk seviyesi
        difficulty = "kolay" if len(steps) <= 3 else "orta" if len(steps) <= 5 else "zor"
        
        return WhiteboardSolutionResponse(
            problem=request.problem,
            steps=steps,
            total_time_estimate=total_time,
            difficulty=difficulty
        )
    
    except Exception as e:
        logger.error(f"Whiteboard çözüm hatası: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.websocket("/ws/{lesson_id}")
async def whiteboard_websocket(websocket: WebSocket, lesson_id: str):
    """
    Whiteboard WebSocket bağlantısı
    Real-time tahta senkronizasyonu
    """
    await manager.connect(lesson_id, websocket)
    
    try:
        while True:
            # Mesaj al
            data = await websocket.receive_json()
            
            # Mesajı tüm bağlantılara yayınla
            await manager.broadcast(lesson_id, {
                "type": data.get("type"),
                "data": data,
                "timestamp": datetime.now().isoformat()
            })
            
            # AI yardım isteği
            if data.get("type") == "request_ai_help":
                # Arka planda AI'dan yardım al
                asyncio.create_task(
                    handle_ai_help_request(lesson_id, data.get("problem"))
                )
    
    except WebSocketDisconnect:
        manager.disconnect(lesson_id, websocket)
    except Exception as e:
        logger.error(f"WebSocket hatası: {e}")
        manager.disconnect(lesson_id, websocket)


async def handle_ai_help_request(lesson_id: str, problem: str):
    """AI yardım isteğini işle"""
    try:
        # Problem çöz
        problem_type = solver.detect_problem_type(problem)
        steps = []
        
        if problem_type == 'equation':
            steps = await solver.solve_equation(problem)
        elif problem_type in ['addition', 'subtraction', 'multiplication', 'division']:
            steps = await solver.solve_arithmetic(problem, problem_type)
        elif problem_type == 'geometry':
            steps = await solver.solve_geometry(problem)
        else:
            steps = await solver.solve_with_ai(problem, "matematik", 6)
        
        # Adımları sırayla yayınla
        for step in steps:
            await manager.broadcast(lesson_id, {
                "type": "ai_step",
                "step": step.dict(),
                "timestamp": datetime.now().isoformat()
            })
            
            # Her adım arası bekleme
            await asyncio.sleep(3)
        
        # Çözüm tamamlandı
        await manager.broadcast(lesson_id, {
            "type": "ai_complete",
            "message": "Çözüm tamamlandı! ✓",
            "timestamp": datetime.now().isoformat()
        })
    
    except Exception as e:
        logger.error(f"AI yardım işleme hatası: {e}")
        await manager.broadcast(lesson_id, {
            "type": "ai_error",
            "message": "Üzgünüm, bir hata oluştu.",
            "timestamp": datetime.now().isoformat()
        })


@router.get("/examples")
async def get_whiteboard_examples():
    """Örnek problemler"""
    return {
        "examples": [
            {
                "category": "Denklem",
                "problems": [
                    "2x + 5 = 15",
                    "3x - 7 = 20",
                    "5x + 10 = 35"
                ]
            },
            {
                "category": "Toplama",
                "problems": [
                    "123 + 456",
                    "789 + 234",
                    "1500 + 2500"
                ]
            },
            {
                "category": "Çarpma",
                "problems": [
                    "12 × 8",
                    "15 × 6",
                    "25 × 4"
                ]
            },
            {
                "category": "Geometri",
                "problems": [
                    "Kenar uzunluğu 5 cm olan bir karenin alanını bulunuz",
                    "Uzun kenarı 8 cm, kısa kenarı 5 cm olan dikdörtgenin çevresini bulunuz"
                ]
            }
        ]
    }


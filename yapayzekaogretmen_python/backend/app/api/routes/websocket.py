"""
WebSocket API Routes
-------------------
Real-time communication endpoints.
"""

from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends, Query
from typing import Optional
import json

from app.core.logger import logger
from app.services.websocket_manager import manager, websocket_service
from app.utils.auth import get_current_user_ws


router = APIRouter()


@router.websocket("/ws/{user_id}")
async def websocket_endpoint(
    websocket: WebSocket,
    user_id: str,
    token: Optional[str] = Query(None)
):
    """
    WebSocket bağlantı endpoint'i
    
    Kullanım:
    ```javascript
    const ws = new WebSocket('ws://localhost:8000/api/ws/user123?token=JWT_TOKEN');
    
    ws.onopen = () => {
        console.log('Bağlantı kuruldu');
        
        // Mesaj gönder
        ws.send(JSON.stringify({
            type: 'chat',
            room_id: 'room123',
            message: 'Merhaba!'
        }));
    };
    
    ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        console.log('Mesaj alındı:', data);
    };
    ```
    """
    try:
        # Token doğrulama (basitleştirilmiş)
        # Gerçek uygulamada JWT token doğrulaması yapılmalı
        if not token:
            await websocket.close(code=4001, reason="Authentication required")
            return
        
        # Bağlantıyı kabul et
        await manager.connect(websocket, user_id)
        
        try:
            while True:
                # Mesaj bekle
                data = await websocket.receive_text()
                
                # JSON parse
                try:
                    message = json.loads(data)
                except json.JSONDecodeError:
                    await websocket.send_json({
                        "type": "error",
                        "message": "Invalid JSON format"
                    })
                    continue
                
                # Mesajı işle
                await websocket_service.handle_message(websocket, user_id, message)
                
        except WebSocketDisconnect:
            await manager.disconnect(websocket, user_id)
            logger.info(f"WebSocket bağlantısı kesildi: {user_id}")
        
    except Exception as e:
        logger.error(f"WebSocket hatası: {e}")
        await manager.disconnect(websocket, user_id)


@router.websocket("/ws/classroom/{classroom_id}")
async def classroom_websocket(
    websocket: WebSocket,
    classroom_id: str,
    user_id: str = Query(...),
    token: Optional[str] = Query(None)
):
    """
    Sınıf odası WebSocket bağlantısı
    
    Öğretmen ve öğrencilerin gerçek zamanlı etkileşimi için.
    """
    try:
        # Authentication
        if not token:
            await websocket.close(code=4001, reason="Authentication required")
            return
        
        # Kullanıcıyı bağla
        await manager.connect(websocket, user_id)
        
        # Sınıf odasına katıl
        room_id = f"classroom_{classroom_id}"
        await manager.join_room(user_id, room_id)
        
        try:
            while True:
                data = await websocket.receive_text()
                
                try:
                    message = json.loads(data)
                    message["room_id"] = room_id  # Otomatik oda atama
                    
                    # Mesajı işle
                    await websocket_service.handle_message(websocket, user_id, message)
                    
                except json.JSONDecodeError:
                    await websocket.send_json({
                        "type": "error",
                        "message": "Invalid JSON format"
                    })
                    
        except WebSocketDisconnect:
            await manager.leave_room(user_id, room_id)
            await manager.disconnect(websocket, user_id)
            
    except Exception as e:
        logger.error(f"Classroom WebSocket hatası: {e}")
        await manager.disconnect(websocket, user_id)


@router.websocket("/ws/ai-assistant/{session_id}")
async def ai_assistant_websocket(
    websocket: WebSocket,
    session_id: str,
    user_id: str = Query(...),
    token: Optional[str] = Query(None)
):
    """
    AI Asistan WebSocket bağlantısı
    
    Gerçek zamanlı AI etkileşimi için streaming desteği.
    """
    try:
        # Authentication
        if not token:
            await websocket.close(code=4001, reason="Authentication required")
            return
        
        await manager.connect(websocket, user_id)
        
        # AI oturumu için özel oda
        room_id = f"ai_session_{session_id}"
        await manager.join_room(user_id, room_id)
        
        # Hoşgeldin mesajı
        await websocket.send_json({
            "type": "ai_ready",
            "message": "AI asistan hazır. Size nasıl yardımcı olabilirim?",
            "session_id": session_id
        })
        
        try:
            while True:
                data = await websocket.receive_text()
                
                try:
                    message = json.loads(data)
                    
                    if message.get("type") == "ai_question":
                        # AI'ya soru gönder (streaming)
                        await _handle_ai_streaming(
                            websocket,
                            user_id,
                            message.get("question", ""),
                            message.get("context", {})
                        )
                    else:
                        # Diğer mesajları işle
                        await websocket_service.handle_message(websocket, user_id, message)
                        
                except json.JSONDecodeError:
                    await websocket.send_json({
                        "type": "error",
                        "message": "Invalid JSON format"
                    })
                    
        except WebSocketDisconnect:
            await manager.leave_room(user_id, room_id)
            await manager.disconnect(websocket, user_id)
            
    except Exception as e:
        logger.error(f"AI Assistant WebSocket hatası: {e}")
        await manager.disconnect(websocket, user_id)


async def _handle_ai_streaming(websocket: WebSocket, user_id: str, question: str, context: dict):
    """AI yanıtını streaming olarak gönder"""
    try:
        # AI servisi import
        from app.services.ai_service import ai_service
        
        # Başlangıç bildirimi
        await websocket.send_json({
            "type": "ai_stream_start",
            "message": "Yanıt hazırlanıyor..."
        })
        
        # AI yanıtı al (gerçek uygulamada streaming API kullanılmalı)
        response, metadata = await ai_service.get_ai_response(
            prompt=question,
            grade_level=context.get("grade_level", 5),
            subject=context.get("subject", "genel"),
            user_name=user_id
        )
        
        # Yanıtı parçalara böl ve gönder (streaming simülasyonu)
        words = response.split()
        chunk_size = 5
        
        for i in range(0, len(words), chunk_size):
            chunk = " ".join(words[i:i+chunk_size])
            
            await websocket.send_json({
                "type": "ai_stream_chunk",
                "chunk": chunk + " ",
                "is_final": i + chunk_size >= len(words)
            })
            
            # Gerçekçi olması için küçük gecikme
            import asyncio
            await asyncio.sleep(0.1)
        
        # Tamamlandı bildirimi
        await websocket.send_json({
            "type": "ai_stream_complete",
            "full_response": response,
            "metadata": metadata
        })
        
    except Exception as e:
        logger.error(f"AI streaming hatası: {e}")
        await websocket.send_json({
            "type": "ai_error",
            "message": "AI yanıtı alınamadı",
            "error": str(e)
        })


# Yardımcı WebSocket endpoint'leri

@router.get("/ws/online-users")
async def get_online_users():
    """Çevrimiçi kullanıcı listesini getir"""
    return {
        "online_users": manager.get_online_users(),
        "count": len(manager.get_online_users())
    }


@router.get("/ws/room-users/{room_id}")
async def get_room_users(room_id: str):
    """Odadaki kullanıcıları getir"""
    return {
        "room_id": room_id,
        "users": manager.get_room_users(room_id),
        "count": len(manager.get_room_users(room_id))
    }

"""
WebSocket Manager - Real-time Communication
------------------------------------------
Gerçek zamanlı iletişim için WebSocket yönetimi.
"""

from typing import Dict, List, Set, Optional
from fastapi import WebSocket, WebSocketDisconnect
from datetime import datetime
import json
import asyncio
from loguru import logger

from app.core.logger import logger as app_logger
from app.db.mongodb import get_database


class ConnectionManager:
    """WebSocket bağlantı yöneticisi"""
    
    def __init__(self):
        # Aktif bağlantılar: {user_id: [websocket1, websocket2, ...]}
        self.active_connections: Dict[str, List[WebSocket]] = {}
        
        # Oda sistemi: {room_id: set(user_ids)}
        self.rooms: Dict[str, Set[str]] = {}
        
        # Kullanıcı odaları: {user_id: set(room_ids)}
        self.user_rooms: Dict[str, Set[str]] = {}
        
        # Çevrimiçi kullanıcılar
        self.online_users: Set[str] = set()
        
        logger.info("WebSocket Manager başlatıldı")
    
    async def connect(self, websocket: WebSocket, user_id: str):
        """Yeni WebSocket bağlantısı ekle"""
        await websocket.accept()
        
        # Kullanıcı bağlantılarına ekle
        if user_id not in self.active_connections:
            self.active_connections[user_id] = []
        self.active_connections[user_id].append(websocket)
        
        # Çevrimiçi kullanıcılara ekle
        self.online_users.add(user_id)
        
        # Hoşgeldin mesajı gönder
        await self.send_personal_message(
            message={
                "type": "connection",
                "status": "connected",
                "timestamp": datetime.utcnow().isoformat(),
                "message": "WebSocket bağlantısı kuruldu"
            },
            user_id=user_id,
            websocket=websocket
        )
        
        # Diğer kullanıcılara bildir
        await self.broadcast_user_status(user_id, "online")
        
        logger.info(f"Kullanıcı bağlandı: {user_id}")
    
    async def disconnect(self, websocket: WebSocket, user_id: str):
        """WebSocket bağlantısını kaldır"""
        if user_id in self.active_connections:
            self.active_connections[user_id].remove(websocket)
            
            # Kullanıcının başka bağlantısı yoksa
            if not self.active_connections[user_id]:
                del self.active_connections[user_id]
                self.online_users.discard(user_id)
                
                # Odalardan çıkar
                await self.leave_all_rooms(user_id)
                
                # Diğer kullanıcılara bildir
                await self.broadcast_user_status(user_id, "offline")
        
        logger.info(f"Kullanıcı ayrıldı: {user_id}")
    
    async def send_personal_message(self, message: dict, user_id: str, websocket: Optional[WebSocket] = None):
        """Belirli bir kullanıcıya mesaj gönder"""
        if user_id in self.active_connections:
            connections = [websocket] if websocket else self.active_connections[user_id]
            
            for connection in connections:
                try:
                    await connection.send_json(message)
                except Exception as e:
                    logger.error(f"Mesaj gönderme hatası: {e}")
    
    async def broadcast(self, message: dict, exclude_user: Optional[str] = None):
        """Tüm bağlı kullanıcılara mesaj gönder"""
        for user_id, connections in self.active_connections.items():
            if user_id != exclude_user:
                for connection in connections:
                    try:
                        await connection.send_json(message)
                    except Exception as e:
                        logger.error(f"Broadcast hatası: {e}")
    
    async def broadcast_to_room(self, room_id: str, message: dict, exclude_user: Optional[str] = None):
        """Belirli bir odadaki kullanıcılara mesaj gönder"""
        if room_id in self.rooms:
            for user_id in self.rooms[room_id]:
                if user_id != exclude_user and user_id in self.active_connections:
                    for connection in self.active_connections[user_id]:
                        try:
                            await connection.send_json(message)
                        except Exception as e:
                            logger.error(f"Room broadcast hatası: {e}")
    
    async def join_room(self, user_id: str, room_id: str):
        """Kullanıcıyı odaya ekle"""
        # Odayı oluştur
        if room_id not in self.rooms:
            self.rooms[room_id] = set()
        
        # Kullanıcıyı odaya ekle
        self.rooms[room_id].add(user_id)
        
        # Kullanıcının odalarına ekle
        if user_id not in self.user_rooms:
            self.user_rooms[user_id] = set()
        self.user_rooms[user_id].add(room_id)
        
        # Odadaki diğer kullanıcılara bildir
        await self.broadcast_to_room(
            room_id,
            {
                "type": "room_event",
                "event": "user_joined",
                "room_id": room_id,
                "user_id": user_id,
                "timestamp": datetime.utcnow().isoformat()
            },
            exclude_user=user_id
        )
        
        logger.info(f"Kullanıcı {user_id} odaya katıldı: {room_id}")
    
    async def leave_room(self, user_id: str, room_id: str):
        """Kullanıcıyı odadan çıkar"""
        if room_id in self.rooms and user_id in self.rooms[room_id]:
            self.rooms[room_id].discard(user_id)
            
            # Oda boşsa sil
            if not self.rooms[room_id]:
                del self.rooms[room_id]
            else:
                # Odadaki diğer kullanıcılara bildir
                await self.broadcast_to_room(
                    room_id,
                    {
                        "type": "room_event",
                        "event": "user_left",
                        "room_id": room_id,
                        "user_id": user_id,
                        "timestamp": datetime.utcnow().isoformat()
                    }
                )
        
        # Kullanıcının odalarından çıkar
        if user_id in self.user_rooms:
            self.user_rooms[user_id].discard(room_id)
        
        logger.info(f"Kullanıcı {user_id} odadan ayrıldı: {room_id}")
    
    async def leave_all_rooms(self, user_id: str):
        """Kullanıcıyı tüm odalardan çıkar"""
        if user_id in self.user_rooms:
            rooms = list(self.user_rooms[user_id])
            for room_id in rooms:
                await self.leave_room(user_id, room_id)
            del self.user_rooms[user_id]
    
    async def broadcast_user_status(self, user_id: str, status: str):
        """Kullanıcı durumunu yayınla"""
        await self.broadcast(
            {
                "type": "user_status",
                "user_id": user_id,
                "status": status,
                "timestamp": datetime.utcnow().isoformat()
            },
            exclude_user=user_id
        )
    
    def get_online_users(self) -> List[str]:
        """Çevrimiçi kullanıcı listesini getir"""
        return list(self.online_users)
    
    def get_room_users(self, room_id: str) -> List[str]:
        """Odadaki kullanıcıları getir"""
        return list(self.rooms.get(room_id, set()))


# Global connection manager instance
manager = ConnectionManager()


class WebSocketService:
    """WebSocket servis katmanı"""
    
    def __init__(self):
        self.manager = manager
        self.db = get_database()
    
    async def handle_message(self, websocket: WebSocket, user_id: str, data: dict):
        """Gelen WebSocket mesajlarını işle"""
        message_type = data.get("type")
        
        try:
            if message_type == "chat":
                await self._handle_chat_message(user_id, data)
            
            elif message_type == "typing":
                await self._handle_typing_indicator(user_id, data)
            
            elif message_type == "ai_interaction":
                await self._handle_ai_interaction(user_id, data)
            
            elif message_type == "lesson_progress":
                await self._handle_lesson_progress(user_id, data)
            
            elif message_type == "join_room":
                room_id = data.get("room_id")
                if room_id:
                    await self.manager.join_room(user_id, room_id)
            
            elif message_type == "leave_room":
                room_id = data.get("room_id")
                if room_id:
                    await self.manager.leave_room(user_id, room_id)
            
            elif message_type == "get_online_users":
                await self.manager.send_personal_message(
                    {
                        "type": "online_users",
                        "users": self.manager.get_online_users(),
                        "timestamp": datetime.utcnow().isoformat()
                    },
                    user_id,
                    websocket
                )
            
            else:
                logger.warning(f"Bilinmeyen mesaj tipi: {message_type}")
        
        except Exception as e:
            logger.error(f"Mesaj işleme hatası: {e}")
            await self.manager.send_personal_message(
                {
                    "type": "error",
                    "message": "Mesaj işlenemedi",
                    "error": str(e)
                },
                user_id,
                websocket
            )
    
    async def _handle_chat_message(self, user_id: str, data: dict):
        """Chat mesajını işle"""
        room_id = data.get("room_id")
        message = data.get("message")
        
        if not room_id or not message:
            return
        
        # Mesajı veritabanına kaydet
        if self.db:
            chat_message = {
                "room_id": room_id,
                "user_id": user_id,
                "message": message,
                "timestamp": datetime.utcnow(),
                "type": "text"
            }
            await self.db.chat_messages.insert_one(chat_message)
        
        # Odadaki kullanıcılara yayınla
        await self.manager.broadcast_to_room(
            room_id,
            {
                "type": "chat_message",
                "room_id": room_id,
                "user_id": user_id,
                "message": message,
                "timestamp": datetime.utcnow().isoformat()
            }
        )
    
    async def _handle_typing_indicator(self, user_id: str, data: dict):
        """Yazıyor göstergesini işle"""
        room_id = data.get("room_id")
        is_typing = data.get("is_typing", False)
        
        if room_id:
            await self.manager.broadcast_to_room(
                room_id,
                {
                    "type": "typing_indicator",
                    "room_id": room_id,
                    "user_id": user_id,
                    "is_typing": is_typing,
                    "timestamp": datetime.utcnow().isoformat()
                },
                exclude_user=user_id
            )
    
    async def _handle_ai_interaction(self, user_id: str, data: dict):
        """AI etkileşimini gerçek zamanlı yayınla"""
        interaction_type = data.get("interaction_type")
        
        # AI yanıtı başladığında
        if interaction_type == "started":
            await self.manager.send_personal_message(
                {
                    "type": "ai_status",
                    "status": "thinking",
                    "message": "AI düşünüyor...",
                    "timestamp": datetime.utcnow().isoformat()
                },
                user_id
            )
        
        # AI yanıtı tamamlandığında
        elif interaction_type == "completed":
            response = data.get("response")
            await self.manager.send_personal_message(
                {
                    "type": "ai_response",
                    "response": response,
                    "timestamp": datetime.utcnow().isoformat()
                },
                user_id
            )
    
    async def _handle_lesson_progress(self, user_id: str, data: dict):
        """Ders ilerleme güncellemelerini işle"""
        lesson_id = data.get("lesson_id")
        progress = data.get("progress", 0)
        
        # İlerlemeyi veritabanına kaydet
        if self.db and lesson_id:
            await self.db.lesson_progress.update_one(
                {"user_id": user_id, "lesson_id": lesson_id},
                {
                    "$set": {
                        "progress": progress,
                        "last_updated": datetime.utcnow()
                    }
                },
                upsert=True
            )
        
        # Öğretmene/veliye bildir (eğer izliyorlarsa)
        await self._notify_progress_watchers(user_id, lesson_id, progress)
    
    async def _notify_progress_watchers(self, student_id: str, lesson_id: str, progress: int):
        """İlerleme izleyicilerine bildirim gönder"""
        # Öğrenci takip odası
        tracking_room = f"student_progress_{student_id}"
        
        await self.manager.broadcast_to_room(
            tracking_room,
            {
                "type": "student_progress",
                "student_id": student_id,
                "lesson_id": lesson_id,
                "progress": progress,
                "timestamp": datetime.utcnow().isoformat()
            }
        )
    
    async def send_notification(self, user_id: str, notification: dict):
        """Kullanıcıya bildirim gönder"""
        await self.manager.send_personal_message(
            {
                "type": "notification",
                **notification,
                "timestamp": datetime.utcnow().isoformat()
            },
            user_id
        )
    
    async def broadcast_announcement(self, announcement: dict, target_users: Optional[List[str]] = None):
        """Duyuru yayınla"""
        message = {
            "type": "announcement",
            **announcement,
            "timestamp": datetime.utcnow().isoformat()
        }
        
        if target_users:
            # Belirli kullanıcılara
            for user_id in target_users:
                await self.manager.send_personal_message(message, user_id)
        else:
            # Tüm kullanıcılara
            await self.manager.broadcast(message)


# Global WebSocket service instance
websocket_service = WebSocketService()

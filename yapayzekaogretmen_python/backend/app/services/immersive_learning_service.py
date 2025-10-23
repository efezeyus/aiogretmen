"""
Immersive Learning Service - AR/VR/3D Educational Experience
-----------------------------------------------------------
3D, AR ve VR teknolojileri ile zenginleştirilmiş öğrenme deneyimi.
"""

from typing import Dict, List, Optional, Any, Tuple
from datetime import datetime, timedelta
from enum import Enum
import asyncio
import json
import uuid
from dataclasses import dataclass, field
import numpy as np

from loguru import logger

from app.core.config import settings
from app.db.mongodb import get_database
from app.services.cache_service import cache
from app.services.gamification_service import gamification_service


class ImmersiveType(str, Enum):
    """İmmersive içerik tipleri"""
    AR = "ar"                    # Augmented Reality
    VR = "vr"                    # Virtual Reality
    MIXED_REALITY = "mr"         # Mixed Reality
    THREE_D = "3d"               # 3D Model/Animation
    INTERACTIVE_360 = "360"      # 360° İnteraktif Video
    HOLOGRAM = "hologram"        # Holografik İçerik


class ExperienceLevel(str, Enum):
    """Deneyim seviyeleri"""
    TUTORIAL = "tutorial"        # Başlangıç/Öğretici
    GUIDED = "guided"           # Rehberli
    EXPLORATION = "exploration"  # Keşif
    CHALLENGE = "challenge"      # Meydan okuma
    CREATIVE = "creative"        # Yaratıcı mod


class DeviceType(str, Enum):
    """Desteklenen cihazlar"""
    SMARTPHONE = "smartphone"
    TABLET = "tablet"
    VR_HEADSET = "vr_headset"
    AR_GLASSES = "ar_glasses"
    DESKTOP = "desktop"
    HOLOLENS = "hololens"


@dataclass
class ImmersiveContent:
    """İmmersive içerik"""
    id: str
    title: str
    description: str
    type: ImmersiveType
    subject: str
    topic: str
    grade_level: int
    duration_minutes: int
    required_devices: List[DeviceType]
    content_url: str
    preview_url: Optional[str] = None
    markers: List[Dict] = field(default_factory=list)  # AR markers
    interactions: List[Dict] = field(default_factory=list)
    learning_objectives: List[str] = field(default_factory=list)
    prerequisites: List[str] = field(default_factory=list)
    metadata: Dict = field(default_factory=dict)


@dataclass
class ImmersiveSession:
    """İmmersive öğrenme oturumu"""
    id: str
    user_id: str
    content_id: str
    started_at: datetime
    ended_at: Optional[datetime] = None
    device_type: DeviceType = DeviceType.DESKTOP
    experience_level: ExperienceLevel = ExperienceLevel.GUIDED
    interactions: List[Dict] = field(default_factory=list)
    achievements: List[str] = field(default_factory=list)
    metrics: Dict = field(default_factory=dict)
    session_data: Dict = field(default_factory=dict)


@dataclass
class AR_Marker:
    """AR işaretçi"""
    id: str
    marker_type: str  # image, qr, nft
    target_url: str
    position: Dict[str, float]  # x, y, z
    rotation: Dict[str, float]  # x, y, z
    scale: Dict[str, float]    # x, y, z
    content: Dict  # 3D model, video, text vb.


@dataclass
class VR_Scene:
    """VR sahne"""
    id: str
    name: str
    environment: str  # classroom, lab, space, etc.
    objects: List[Dict]
    interactions: List[Dict]
    navigation_points: List[Dict]
    ambient_audio: Optional[str] = None
    lighting: Dict = field(default_factory=dict)


class ImmersiveLearningService:
    """İmmersive öğrenme servisi"""
    
    def __init__(self):
        self.db = get_database()
        
        # WebXR konfigürasyonu
        self.webxr_config = {
            "ar_enabled": True,
            "vr_enabled": True,
            "hand_tracking": True,
            "eye_tracking": False,
            "spatial_audio": True,
            "haptic_feedback": True
        }
        
        # 3D içerik şablonları
        self.content_templates = self._load_content_templates()
        
        # Performans metrikleri
        self.performance_thresholds = {
            "min_fps": 30,
            "max_latency_ms": 50,
            "min_interaction_accuracy": 0.8
        }
        
        logger.info("Immersive Learning Service başlatıldı")
    
    def _load_content_templates(self) -> Dict[str, Dict]:
        """İçerik şablonlarını yükle"""
        return {
            "chemistry_lab": {
                "type": ImmersiveType.VR,
                "environment": "laboratory",
                "objects": ["periodic_table", "beakers", "bunsen_burner", "molecules"],
                "interactions": ["mix_chemicals", "observe_reactions", "measure_ph"]
            },
            "solar_system": {
                "type": ImmersiveType.THREE_D,
                "environment": "space",
                "objects": ["sun", "planets", "asteroids", "comets"],
                "interactions": ["orbit_simulation", "planet_info", "scale_comparison"]
            },
            "human_anatomy": {
                "type": ImmersiveType.AR,
                "markers": ["body_marker"],
                "objects": ["skeleton", "organs", "circulatory_system"],
                "interactions": ["layer_toggle", "organ_info", "system_animation"]
            },
            "historical_sites": {
                "type": ImmersiveType.INTERACTIVE_360,
                "locations": ["pyramids", "colosseum", "great_wall"],
                "interactions": ["time_travel", "artifact_inspection", "guided_tour"]
            },
            "math_geometry": {
                "type": ImmersiveType.MIXED_REALITY,
                "objects": ["3d_shapes", "coordinates", "transformations"],
                "interactions": ["shape_manipulation", "measurement", "construction"]
            }
        }
    
    async def get_immersive_content(
        self,
        subject: str,
        topic: Optional[str] = None,
        grade_level: Optional[int] = None,
        device_type: Optional[DeviceType] = None
    ) -> List[ImmersiveContent]:
        """İmmersive içerikleri getir"""
        if not self.db:
            return self._get_demo_content(subject)
        
        # Query oluştur
        query = {"subject": subject}
        if topic:
            query["topic"] = topic
        if grade_level:
            query["grade_level"] = {"$lte": grade_level + 1, "$gte": grade_level - 1}
        if device_type:
            query["required_devices"] = device_type
        
        # İçerikleri getir
        contents = await self.db.immersive_content.find(query).limit(20).to_list(20)
        
        immersive_contents = []
        for content in contents:
            immersive_contents.append(ImmersiveContent(
                id=content["id"],
                title=content["title"],
                description=content["description"],
                type=ImmersiveType(content["type"]),
                subject=content["subject"],
                topic=content["topic"],
                grade_level=content["grade_level"],
                duration_minutes=content["duration_minutes"],
                required_devices=[DeviceType(d) for d in content["required_devices"]],
                content_url=content["content_url"],
                preview_url=content.get("preview_url"),
                markers=content.get("markers", []),
                interactions=content.get("interactions", []),
                learning_objectives=content.get("learning_objectives", []),
                prerequisites=content.get("prerequisites", []),
                metadata=content.get("metadata", {})
            ))
        
        return immersive_contents
    
    def _get_demo_content(self, subject: str) -> List[ImmersiveContent]:
        """Demo içerikler"""
        demo_contents = {
            "fen": [
                ImmersiveContent(
                    id="demo_solar_system",
                    title="Güneş Sistemi Keşfi",
                    description="3D güneş sistemi simülasyonu ile gezegenleri keşfet",
                    type=ImmersiveType.THREE_D,
                    subject="fen",
                    topic="uzay",
                    grade_level=5,
                    duration_minutes=20,
                    required_devices=[DeviceType.DESKTOP, DeviceType.TABLET],
                    content_url="/3d/solar_system",
                    preview_url="/previews/solar_system.jpg",
                    interactions=[
                        {"type": "rotate", "target": "planets"},
                        {"type": "zoom", "target": "sun"},
                        {"type": "info", "target": "all"}
                    ],
                    learning_objectives=[
                        "Güneş sistemindeki gezegenleri tanıma",
                        "Gezegenlerin boyut karşılaştırması",
                        "Yörünge hareketlerini anlama"
                    ]
                ),
                ImmersiveContent(
                    id="demo_chemistry_vr",
                    title="Sanal Kimya Laboratuvarı",
                    description="VR ile güvenli kimya deneyleri yap",
                    type=ImmersiveType.VR,
                    subject="fen",
                    topic="kimya",
                    grade_level=7,
                    duration_minutes=30,
                    required_devices=[DeviceType.VR_HEADSET],
                    content_url="/vr/chemistry_lab",
                    interactions=[
                        {"type": "grab", "target": "equipment"},
                        {"type": "mix", "target": "chemicals"},
                        {"type": "observe", "target": "reactions"}
                    ],
                    learning_objectives=[
                        "Laboratuvar güvenlik kuralları",
                        "Kimyasal reaksiyonları gözlemleme",
                        "Deney düzeneği kurma"
                    ]
                )
            ],
            "matematik": [
                ImmersiveContent(
                    id="demo_geometry_ar",
                    title="AR Geometri Dünyası",
                    description="Gerçek dünyada 3D şekiller oluştur ve incele",
                    type=ImmersiveType.AR,
                    subject="matematik",
                    topic="geometri",
                    grade_level=6,
                    duration_minutes=15,
                    required_devices=[DeviceType.SMARTPHONE, DeviceType.TABLET],
                    content_url="/ar/geometry",
                    markers=[
                        {
                            "id": "shape_marker",
                            "type": "image",
                            "url": "/markers/geometry.jpg"
                        }
                    ],
                    interactions=[
                        {"type": "place", "target": "shapes"},
                        {"type": "measure", "target": "dimensions"},
                        {"type": "transform", "target": "objects"}
                    ],
                    learning_objectives=[
                        "3D şekillerin özelliklerini tanıma",
                        "Hacim ve alan hesaplama",
                        "Uzaysal düşünme becerisi"
                    ]
                )
            ]
        }
        
        return demo_contents.get(subject, [])
    
    async def start_immersive_session(
        self,
        user_id: str,
        content_id: str,
        device_type: DeviceType,
        experience_level: ExperienceLevel = ExperienceLevel.GUIDED
    ) -> ImmersiveSession:
        """İmmersive oturum başlat"""
        session = ImmersiveSession(
            id=f"session_{uuid.uuid4().hex}",
            user_id=user_id,
            content_id=content_id,
            started_at=datetime.utcnow(),
            device_type=device_type,
            experience_level=experience_level,
            metrics={
                "fps": [],
                "latency": [],
                "interaction_count": 0,
                "accuracy_scores": []
            }
        )
        
        # Oturumu kaydet
        if self.db:
            await self.db.immersive_sessions.insert_one(session.__dict__)
        
        # Cache'e kaydet (gerçek zamanlı erişim için)
        cache_key = f"immersive_session:{session.id}"
        await cache.set(cache_key, session.__dict__, ttl=7200, namespace="immersive")
        
        # Başlangıç telemetrisi
        await self._log_telemetry(session.id, "session_start", {
            "device": device_type,
            "experience_level": experience_level
        })
        
        return session
    
    async def update_session_metrics(
        self,
        session_id: str,
        metrics: Dict[str, Any]
    ):
        """Oturum metriklerini güncelle"""
        # Cache'den oturumu al
        cache_key = f"immersive_session:{session_id}"
        session_data = await cache.get(cache_key, namespace="immersive")
        
        if not session_data:
            logger.error(f"Session bulunamadı: {session_id}")
            return
        
        # Metrikleri güncelle
        if "fps" in metrics:
            session_data["metrics"]["fps"].append(metrics["fps"])
        
        if "latency" in metrics:
            session_data["metrics"]["latency"].append(metrics["latency"])
        
        if "interaction" in metrics:
            session_data["interactions"].append({
                **metrics["interaction"],
                "timestamp": datetime.utcnow().isoformat()
            })
            session_data["metrics"]["interaction_count"] += 1
        
        if "accuracy" in metrics:
            session_data["metrics"]["accuracy_scores"].append(metrics["accuracy"])
        
        # Cache'i güncelle
        await cache.set(cache_key, session_data, ttl=7200, namespace="immersive")
        
        # Performans kontrolü
        await self._check_performance(session_data)
    
    async def _check_performance(self, session_data: Dict):
        """Performans kontrolü ve optimizasyon"""
        metrics = session_data["metrics"]
        
        # FPS kontrolü
        if metrics["fps"]:
            avg_fps = np.mean(metrics["fps"][-10:])  # Son 10 örnek
            if avg_fps < self.performance_thresholds["min_fps"]:
                await self._optimize_content(session_data["id"], "low_fps", avg_fps)
        
        # Latency kontrolü
        if metrics["latency"]:
            avg_latency = np.mean(metrics["latency"][-10:])
            if avg_latency > self.performance_thresholds["max_latency_ms"]:
                await self._optimize_content(session_data["id"], "high_latency", avg_latency)
    
    async def _optimize_content(
        self,
        session_id: str,
        issue_type: str,
        metric_value: float
    ):
        """İçerik optimizasyonu"""
        optimizations = {
            "low_fps": {
                "reduce_polygon_count": True,
                "lower_texture_resolution": True,
                "disable_shadows": True,
                "reduce_particle_effects": True
            },
            "high_latency": {
                "enable_predictive_tracking": True,
                "reduce_network_calls": True,
                "cache_more_content": True
            }
        }
        
        # Optimizasyon önerilerini oturuma ekle
        cache_key = f"immersive_session:{session_id}"
        session_data = await cache.get(cache_key, namespace="immersive")
        
        if session_data:
            if "optimizations" not in session_data:
                session_data["optimizations"] = []
            
            session_data["optimizations"].append({
                "issue": issue_type,
                "value": metric_value,
                "suggestions": optimizations.get(issue_type, {}),
                "timestamp": datetime.utcnow().isoformat()
            })
            
            await cache.set(cache_key, session_data, ttl=7200, namespace="immersive")
    
    async def track_interaction(
        self,
        session_id: str,
        interaction: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Etkileşim takibi
        
        Args:
            interaction: {
                "type": "grab|touch|gaze|voice",
                "target": "object_id",
                "position": {"x": 0, "y": 0, "z": 0},
                "duration": 1.5,
                "success": true,
                "data": {...}
            }
        """
        # Metrikleri güncelle
        await self.update_session_metrics(session_id, {
            "interaction": interaction,
            "accuracy": 1.0 if interaction.get("success") else 0.0
        })
        
        # Başarı analizi
        result = {
            "tracked": True,
            "feedback": await self._generate_interaction_feedback(interaction)
        }
        
        # Gamification entegrasyonu
        if interaction.get("success"):
            # TODO: Session'dan user_id al
            pass
        
        return result
    
    async def _generate_interaction_feedback(
        self,
        interaction: Dict
    ) -> Dict[str, Any]:
        """Etkileşim geri bildirimi oluştur"""
        feedback = {
            "success": interaction.get("success", False),
            "message": "",
            "hints": []
        }
        
        if feedback["success"]:
            feedback["message"] = "Harika! Doğru etkileşim 🎯"
        else:
            interaction_type = interaction.get("type")
            if interaction_type == "grab":
                feedback["message"] = "Nesneyi tutmak için daha yakın ol"
                feedback["hints"] = ["Elini nesneye doğru uzat", "Tetik düğmesine bas"]
            elif interaction_type == "touch":
                feedback["message"] = "Dokunma noktası biraz kaçtı"
                feedback["hints"] = ["Hedefi ortala", "Daha yavaş hareket et"]
        
        return feedback
    
    async def end_immersive_session(
        self,
        session_id: str
    ) -> Dict[str, Any]:
        """İmmersive oturumu bitir"""
        # Cache'den oturumu al
        cache_key = f"immersive_session:{session_id}"
        session_data = await cache.get(cache_key, namespace="immersive")
        
        if not session_data:
            return {"success": False, "error": "Session not found"}
        
        # Bitiş zamanı
        session_data["ended_at"] = datetime.utcnow().isoformat()
        
        # Özet istatistikler
        metrics = session_data["metrics"]
        summary = {
            "duration_minutes": (
                datetime.fromisoformat(session_data["ended_at"]) - 
                datetime.fromisoformat(session_data["started_at"])
            ).total_seconds() / 60,
            "total_interactions": metrics["interaction_count"],
            "average_accuracy": np.mean(metrics["accuracy_scores"]) if metrics["accuracy_scores"] else 0,
            "average_fps": np.mean(metrics["fps"]) if metrics["fps"] else 0,
            "achievements_unlocked": []
        }
        
        # Başarıları kontrol et
        achievements = await self._check_session_achievements(session_data, summary)
        summary["achievements_unlocked"] = achievements
        
        # Veritabanına kaydet
        if self.db:
            await self.db.immersive_sessions.update_one(
                {"id": session_id},
                {
                    "$set": {
                        "ended_at": session_data["ended_at"],
                        "summary": summary
                    }
                }
            )
        
        # Cache'den temizle
        await cache.delete(cache_key, namespace="immersive")
        
        # Gamification puanları
        if achievements:
            await gamification_service.add_points(
                user_id=session_data["user_id"],
                action="immersive_achievement",
                metadata={"achievements": achievements, "session_id": session_id}
            )
        
        return {
            "success": True,
            "summary": summary,
            "session_id": session_id
        }
    
    async def _check_session_achievements(
        self,
        session_data: Dict,
        summary: Dict
    ) -> List[str]:
        """Oturum başarılarını kontrol et"""
        achievements = []
        
        # İlk immersive deneyim
        if self.db:
            user_sessions = await self.db.immersive_sessions.count_documents({
                "user_id": session_data["user_id"]
            })
            if user_sessions == 1:
                achievements.append("first_immersive_experience")
        
        # Mükemmel doğruluk
        if summary["average_accuracy"] >= 0.95:
            achievements.append("perfect_accuracy")
        
        # Uzun oturum
        if summary["duration_minutes"] >= 30:
            achievements.append("immersive_marathon")
        
        # Yüksek etkileşim
        if summary["total_interactions"] >= 50:
            achievements.append("interaction_master")
        
        return achievements
    
    async def create_ar_marker(
        self,
        marker_type: str,
        content: Dict,
        metadata: Optional[Dict] = None
    ) -> AR_Marker:
        """AR marker oluştur"""
        marker = AR_Marker(
            id=f"marker_{uuid.uuid4().hex}",
            marker_type=marker_type,
            target_url=f"/markers/{marker_type}_{uuid.uuid4().hex}.jpg",
            position={"x": 0, "y": 0, "z": 0},
            rotation={"x": 0, "y": 0, "z": 0},
            scale={"x": 1, "y": 1, "z": 1},
            content=content
        )
        
        # Marker'ı kaydet
        if self.db:
            await self.db.ar_markers.insert_one({
                **marker.__dict__,
                "created_at": datetime.utcnow(),
                "metadata": metadata or {}
            })
        
        return marker
    
    async def create_vr_scene(
        self,
        name: str,
        environment: str,
        objects: List[Dict],
        interactions: List[Dict]
    ) -> VR_Scene:
        """VR sahne oluştur"""
        scene = VR_Scene(
            id=f"scene_{uuid.uuid4().hex}",
            name=name,
            environment=environment,
            objects=objects,
            interactions=interactions,
            navigation_points=[
                {"id": "spawn", "position": {"x": 0, "y": 0, "z": 0}},
                {"id": "center", "position": {"x": 0, "y": 0, "z": -5}}
            ],
            lighting={
                "ambient": {"color": "#ffffff", "intensity": 0.5},
                "directional": {"color": "#ffffff", "intensity": 0.8, "position": {"x": 1, "y": 1, "z": 1}}
            }
        )
        
        # Sahneyi kaydet
        if self.db:
            await self.db.vr_scenes.insert_one({
                **scene.__dict__,
                "created_at": datetime.utcnow()
            })
        
        return scene
    
    async def get_webxr_config(
        self,
        device_type: DeviceType
    ) -> Dict[str, Any]:
        """WebXR konfigürasyonu getir"""
        base_config = self.webxr_config.copy()
        
        # Cihaza özel ayarlar
        device_configs = {
            DeviceType.SMARTPHONE: {
                "ar_enabled": True,
                "vr_enabled": False,
                "hand_tracking": False,
                "max_polygon_count": 50000
            },
            DeviceType.VR_HEADSET: {
                "ar_enabled": False,
                "vr_enabled": True,
                "hand_tracking": True,
                "max_polygon_count": 200000
            },
            DeviceType.AR_GLASSES: {
                "ar_enabled": True,
                "vr_enabled": False,
                "hand_tracking": True,
                "max_polygon_count": 100000
            }
        }
        
        if device_type in device_configs:
            base_config.update(device_configs[device_type])
        
        return base_config
    
    async def get_3d_model_library(
        self,
        subject: str,
        search_query: Optional[str] = None
    ) -> List[Dict]:
        """3D model kütüphanesi"""
        models = {
            "fen": [
                {
                    "id": "dna_helix",
                    "name": "DNA Sarmalı",
                    "url": "/models/biology/dna_helix.glb",
                    "thumbnail": "/thumbnails/dna.jpg",
                    "animations": ["rotate", "unwind"],
                    "scale": 0.01
                },
                {
                    "id": "atom_model",
                    "name": "Atom Modeli",
                    "url": "/models/chemistry/atom.glb",
                    "thumbnail": "/thumbnails/atom.jpg",
                    "animations": ["electron_orbit"],
                    "scale": 10
                }
            ],
            "matematik": [
                {
                    "id": "cube",
                    "name": "Küp",
                    "url": "/models/geometry/cube.glb",
                    "thumbnail": "/thumbnails/cube.jpg",
                    "animations": ["rotate", "unfold"],
                    "scale": 1
                },
                {
                    "id": "pyramid",
                    "name": "Piramit",
                    "url": "/models/geometry/pyramid.glb",
                    "thumbnail": "/thumbnails/pyramid.jpg",
                    "animations": ["rotate"],
                    "scale": 1
                }
            ]
        }
        
        subject_models = models.get(subject, [])
        
        # Arama filtresi
        if search_query:
            search_lower = search_query.lower()
            subject_models = [
                m for m in subject_models
                if search_lower in m["name"].lower()
            ]
        
        return subject_models
    
    async def _log_telemetry(
        self,
        session_id: str,
        event_type: str,
        data: Dict
    ):
        """Telemetri kaydı"""
        if self.db:
            await self.db.immersive_telemetry.insert_one({
                "session_id": session_id,
                "event_type": event_type,
                "data": data,
                "timestamp": datetime.utcnow()
            })


# Global immersive learning service instance
immersive_learning_service = ImmersiveLearningService()


# Helper functions
async def start_ar_experience(
    user_id: str,
    content_id: str,
    device_type: DeviceType = DeviceType.SMARTPHONE
) -> ImmersiveSession:
    """AR deneyimi başlat"""
    return await immersive_learning_service.start_immersive_session(
        user_id=user_id,
        content_id=content_id,
        device_type=device_type,
        experience_level=ExperienceLevel.GUIDED
    )


async def start_vr_experience(
    user_id: str,
    content_id: str
) -> ImmersiveSession:
    """VR deneyimi başlat"""
    return await immersive_learning_service.start_immersive_session(
        user_id=user_id,
        content_id=content_id,
        device_type=DeviceType.VR_HEADSET,
        experience_level=ExperienceLevel.EXPLORATION
    )

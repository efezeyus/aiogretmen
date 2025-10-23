"""
Müfredat Yönetimi Servisi
Tüm sınıflar ve dersler için kapsamlı müfredat yönetimi
"""

from typing import Dict, List, Any, Optional
from ..data.meb_curriculum_structure import (
    MEB_CURRICULUM_STRUCTURE,
    get_all_subjects_by_grade,
    get_subject_info
)
from ..data.curriculums.grade_1 import get_grade_1_curriculum
from ..data.curriculums.grades_2_4 import get_grade_2_curriculum, get_grade_3_curriculum, get_grade_4_curriculum
from ..data.curriculums.grade_5 import get_grade_5_curriculum
from ..data.curriculums.grade_6 import get_grade_6_curriculum
from ..data.curriculums.grades_7_8 import get_grade_7_curriculum, get_grade_8_curriculum
from ..data.curriculums.grade_9 import get_grade_9_curriculum
from ..data.curriculums.grades_10_12 import get_grade_10_curriculum, get_grade_11_curriculum, get_grade_12_curriculum
from ..data.curriculums.all_grades import ALL_GRADE_STRUCTURES


class CurriculumManager:
    """Müfredat yönetim sınıfı"""
    
    def __init__(self):
        """Müfredat yöneticisini başlat"""
        # Detaylı müfredat verilerini yükle - TÜM SINIFLAR (1 hariç)
        self.detailed_curriculums = {
            1: get_grade_1_curriculum(),
            2: get_grade_2_curriculum(),   # ← YENİ!
            3: get_grade_3_curriculum(),   # ← YENİ!
            4: get_grade_4_curriculum(),   # ← YENİ!
            5: get_grade_5_curriculum(),
            6: get_grade_6_curriculum(),
            7: get_grade_7_curriculum(),   # ← YENİ!
            8: get_grade_8_curriculum(),   # ← YENİ!
            9: get_grade_9_curriculum(),
            10: get_grade_10_curriculum(), # ← YENİ!
            11: get_grade_11_curriculum(), # ← YENİ!
            12: get_grade_12_curriculum()  # ← YENİ!
        }
        
        # Yapısal veriler (diğer sınıflar)
        self.structural_curriculums = ALL_GRADE_STRUCTURES
    
    def get_education_levels(self) -> List[Dict[str, Any]]:
        """Tüm eğitim seviyelerini döndürür"""
        return [
            {
                "level": "ilkokul",
                "name": "İlkokul",
                "grades": [1, 2, 3, 4],
                "description": "Temel eğitim dönemi"
            },
            {
                "level": "ortaokul",
                "name": "Ortaokul",
                "grades": [5, 6, 7, 8],
                "description": "Ortaokul eğitim dönemi"
            },
            {
                "level": "lise",
                "name": "Lise",
                "grades": [9, 10, 11, 12],
                "description": "Lise eğitim dönemi"
            }
        ]
    
    def get_subjects_by_grade(self, grade: int) -> List[Dict[str, Any]]:
        """Belirli bir sınıf için tüm dersleri döndürür"""
        return get_all_subjects_by_grade(grade)
    
    def get_subject_structure(self, grade: int, subject: str) -> Optional[Dict[str, Any]]:
        """Belirli bir ders için yapıyı döndürür"""
        return get_subject_info(subject, grade)
    
    def get_detailed_curriculum(self, grade: int, subject: str = None) -> Optional[Dict[str, Any]]:
        """Detaylı müfredat içeriğini döndürür"""
        if grade in self.detailed_curriculums:
            curriculum_data = self.detailed_curriculums[grade]
            if subject:
                return curriculum_data.get(subject)
            return curriculum_data
        
        # Detaylı yoksa yapısal veriyi döndür
        if grade in self.structural_curriculums:
            return self.structural_curriculums[grade]
        
        return None
    
    def get_curriculum_statistics(self, grade: int, subject: str = None) -> Dict[str, Any]:
        """Müfredat istatistiklerini döndürür"""
        curriculum = self.get_detailed_curriculum(grade, subject)
        
        if not curriculum:
            return {
                "total_subjects": 0,
                "total_units": 0,
                "total_topics": 0,
                "estimated_hours": 0
            }
        
        # Tek ders için istatistik
        if subject:
            total_units = 0
            total_topics = 0
            estimated_hours = 0
            
            for learning_area in curriculum.get("learning_areas", []):
                for unit in learning_area.get("units", []):
                    total_units += 1
                    estimated_hours += unit.get("estimated_hours", 0)
                    total_topics += len(unit.get("topics", []))
            
            return {
                "subject": curriculum.get("subject_name"),
                "grade": grade,
                "total_units": total_units,
                "total_topics": total_topics,
                "estimated_hours": estimated_hours,
                "learning_areas": len(curriculum.get("learning_areas", []))
            }
        
        # Tüm dersler için istatistik
        total_subjects = len(curriculum)
        total_units = 0
        total_topics = 0
        estimated_hours = 0
        
        for subject_curriculum in curriculum.values():
            for learning_area in subject_curriculum.get("learning_areas", []):
                for unit in learning_area.get("units", []):
                    total_units += 1
                    estimated_hours += unit.get("estimated_hours", 0)
                    total_topics += len(unit.get("topics", []))
        
        return {
            "grade": grade,
            "total_subjects": total_subjects,
            "total_units": total_units,
            "total_topics": total_topics,
            "estimated_hours": estimated_hours
        }
    
    def search_curriculum(self, keyword: str, grade: Optional[int] = None) -> List[Dict[str, Any]]:
        """Müfredatta arama yapar"""
        results = []
        
        # Hangi sınıflarda arama yapılacak
        grades_to_search = [grade] if grade else self.detailed_curriculums.keys()
        
        for search_grade in grades_to_search:
            curriculum = self.get_detailed_curriculum(search_grade)
            if not curriculum:
                continue
            
            for subject_key, subject_data in curriculum.items():
                # Ders adında ara
                if keyword.lower() in subject_data.get("subject_name", "").lower():
                    results.append({
                        "type": "subject",
                        "grade": search_grade,
                        "subject": subject_key,
                        "subject_name": subject_data.get("subject_name"),
                        "match": "Ders Adı"
                    })
                
                # Öğrenme alanlarında ve ünitelerde ara
                for learning_area in subject_data.get("learning_areas", []):
                    for unit in learning_area.get("units", []):
                        if keyword.lower() in unit.get("title", "").lower():
                            results.append({
                                "type": "unit",
                                "grade": search_grade,
                                "subject": subject_key,
                                "subject_name": subject_data.get("subject_name"),
                                "learning_area": learning_area.get("name"),
                                "unit_title": unit.get("title"),
                                "match": "Ünite Başlığı"
                            })
                        
                        # Konularda ara
                        for topic in unit.get("topics", []):
                            if keyword.lower() in topic.get("title", "").lower():
                                results.append({
                                    "type": "topic",
                                    "grade": search_grade,
                                    "subject": subject_key,
                                    "subject_name": subject_data.get("subject_name"),
                                    "unit_title": unit.get("title"),
                                    "topic_title": topic.get("title"),
                                    "match": "Konu Başlığı"
                                })
        
        return results
    
    def get_learning_path(self, grade: int, subject: str) -> Dict[str, Any]:
        """Belirli bir ders için öğrenme yolu oluşturur"""
        curriculum = self.get_detailed_curriculum(grade, subject)
        
        if not curriculum:
            return {"error": "Müfredat bulunamadı"}
        
        learning_path = {
            "grade": grade,
            "subject": subject,
            "subject_name": curriculum.get("subject_name"),
            "description": curriculum.get("description"),
            "path": []
        }
        
        step = 1
        for learning_area in curriculum.get("learning_areas", []):
            for unit in learning_area.get("units", []):
                learning_path["path"].append({
                    "step": step,
                    "learning_area": learning_area.get("name"),
                    "unit_title": unit.get("title"),
                    "estimated_hours": unit.get("estimated_hours"),
                    "topics_count": len(unit.get("topics", [])),
                    "description": unit.get("description")
                })
                step += 1
        
        total_hours = sum(item["estimated_hours"] for item in learning_path["path"])
        learning_path["total_estimated_hours"] = total_hours
        learning_path["total_steps"] = len(learning_path["path"])
        
        return learning_path
    
    def get_ai_teaching_recommendations(self, grade: int, subject: str, topic_title: str) -> Optional[Dict[str, Any]]:
        """Belirli bir konu için yapay zeka öğretim önerilerini döndürür"""
        curriculum = self.get_detailed_curriculum(grade, subject)
        
        if not curriculum:
            return None
        
        for learning_area in curriculum.get("learning_areas", []):
            for unit in learning_area.get("units", []):
                for topic in unit.get("topics", []):
                    if topic.get("title") == topic_title:
                        return {
                            "topic": topic_title,
                            "unit": unit.get("title"),
                            "learning_area": learning_area.get("name"),
                            "objectives": topic.get("objectives", []),
                            "activities": topic.get("activities", []),
                            "ai_teaching_tips": topic.get("ai_teaching_tips", ""),
                            "estimated_hours": unit.get("estimated_hours")
                        }
        
        return None
    
    def generate_curriculum_summary(self) -> Dict[str, Any]:
        """Tüm müfredat için özet rapor oluşturur"""
        summary = {
            "total_grades": 12,
            "total_detailed_curriculums": len(self.detailed_curriculums),
            "education_levels": self.get_education_levels(),
            "grade_statistics": {}
        }
        
        for grade in range(1, 13):
            subjects = self.get_subjects_by_grade(grade)
            stats = self.get_curriculum_statistics(grade)
            
            summary["grade_statistics"][f"grade_{grade}"] = {
                "grade": grade,
                "total_subjects": len(subjects),
                "subjects": [s["name"] for s in subjects],
                "detailed_curriculum_available": grade in self.detailed_curriculums,
                **stats
            }
        
        return summary


# Global instance
curriculum_manager = CurriculumManager()


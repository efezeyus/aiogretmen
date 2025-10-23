"""
Translation Service - Multi-language Support System
--------------------------------------------------
Çoklu dil desteği ve çeviri sistemi.
"""

from typing import Dict, List, Optional, Any, Tuple
from datetime import datetime
from enum import Enum
import asyncio
import json
import os
from pathlib import Path
from dataclasses import dataclass, field
import httpx
from functools import lru_cache

from loguru import logger
from babel import Locale
from babel.support import Translations

from app.core.config import settings
from app.db.mongodb import get_database
from app.services.cache_service import cache
from app.services.ai_service import ai_service


class Language(str, Enum):
    """Desteklenen diller"""
    TURKISH = "tr"
    ENGLISH = "en"
    ARABIC = "ar"
    GERMAN = "de"
    FRENCH = "fr"
    SPANISH = "es"
    RUSSIAN = "ru"
    CHINESE = "zh"
    JAPANESE = "ja"
    KOREAN = "ko"
    ITALIAN = "it"
    PORTUGUESE = "pt"
    DUTCH = "nl"
    POLISH = "pl"
    UKRAINIAN = "uk"


class TranslationProvider(str, Enum):
    """Çeviri sağlayıcıları"""
    LOCAL = "local"          # Yerel çeviri dosyaları
    GOOGLE = "google"        # Google Translate API
    DEEPL = "deepl"          # DeepL API
    OPENAI = "openai"        # OpenAI GPT
    MICROSOFT = "microsoft"  # Microsoft Translator


@dataclass
class LanguageInfo:
    """Dil bilgileri"""
    code: str
    name: str
    native_name: str
    direction: str  # ltr veya rtl
    flag: str       # Emoji bayrak
    locale: str     # tr_TR formatında
    date_format: str
    time_format: str
    number_format: Dict
    currency: str
    supported: bool = True


@dataclass
class Translation:
    """Çeviri objesi"""
    key: str
    language: str
    value: str
    context: Optional[str] = None
    plural_forms: Optional[Dict[str, str]] = None
    variables: List[str] = field(default_factory=list)
    last_updated: datetime = field(default_factory=datetime.utcnow)
    verified: bool = False
    
    
@dataclass
class TranslationRequest:
    """Çeviri isteği"""
    text: str
    source_lang: str
    target_lang: str
    context: Optional[str] = None
    preserve_formatting: bool = True
    use_cache: bool = True


class TranslationService:
    """Çeviri servisi"""
    
    def __init__(self):
        self.db = get_database()
        
        # Dil bilgileri
        self.languages = self._initialize_languages()
        
        # Varsayılan dil
        self.default_language = Language.TURKISH
        
        # Çeviri dosyaları dizini
        self.translations_dir = Path("app/translations")
        self.translations_dir.mkdir(exist_ok=True)
        
        # Çeviri cache'i
        self._translation_cache = {}
        
        # AI çeviri prompt şablonu
        self.ai_translation_prompt = """
Sen profesyonel bir çevirmensin. Eğitim içeriğini çeviriyorsun.

Kaynak Dil: {source_lang}
Hedef Dil: {target_lang}
Bağlam: {context}

Çeviri kuralları:
1. Anlamı koru, kelimesi kelimesine çevirme
2. Eğitim terminolojisine uygun çevir
3. Kültürel hassasiyetlere dikkat et
4. Teknik terimleri doğru kullan
5. Format ve değişkenleri ({variable}) koru

Çevrilecek metin:
{text}

Sadece çeviriyi döndür, açıklama yapma.
"""
        
        # Özel terimler sözlüğü
        self.terminology = self._load_terminology()
        
        logger.info("Translation Service başlatıldı")
    
    def _initialize_languages(self) -> Dict[str, LanguageInfo]:
        """Dil bilgilerini başlat"""
        return {
            Language.TURKISH: LanguageInfo(
                code="tr",
                name="Turkish",
                native_name="Türkçe",
                direction="ltr",
                flag="🇹🇷",
                locale="tr_TR",
                date_format="%d.%m.%Y",
                time_format="%H:%M",
                number_format={"decimal": ",", "thousands": "."},
                currency="₺"
            ),
            Language.ENGLISH: LanguageInfo(
                code="en",
                name="English",
                native_name="English",
                direction="ltr",
                flag="🇬🇧",
                locale="en_US",
                date_format="%m/%d/%Y",
                time_format="%I:%M %p",
                number_format={"decimal": ".", "thousands": ","},
                currency="$"
            ),
            Language.ARABIC: LanguageInfo(
                code="ar",
                name="Arabic",
                native_name="العربية",
                direction="rtl",
                flag="🇸🇦",
                locale="ar_SA",
                date_format="%d/%m/%Y",
                time_format="%H:%M",
                number_format={"decimal": "٫", "thousands": "٬"},
                currency="ر.س"
            ),
            Language.GERMAN: LanguageInfo(
                code="de",
                name="German",
                native_name="Deutsch",
                direction="ltr",
                flag="🇩🇪",
                locale="de_DE",
                date_format="%d.%m.%Y",
                time_format="%H:%M",
                number_format={"decimal": ",", "thousands": "."},
                currency="€"
            ),
            Language.FRENCH: LanguageInfo(
                code="fr",
                name="French",
                native_name="Français",
                direction="ltr",
                flag="🇫🇷",
                locale="fr_FR",
                date_format="%d/%m/%Y",
                time_format="%H:%M",
                number_format={"decimal": ",", "thousands": " "},
                currency="€"
            ),
            Language.SPANISH: LanguageInfo(
                code="es",
                name="Spanish",
                native_name="Español",
                direction="ltr",
                flag="🇪🇸",
                locale="es_ES",
                date_format="%d/%m/%Y",
                time_format="%H:%M",
                number_format={"decimal": ",", "thousands": "."},
                currency="€"
            ),
            Language.RUSSIAN: LanguageInfo(
                code="ru",
                name="Russian",
                native_name="Русский",
                direction="ltr",
                flag="🇷🇺",
                locale="ru_RU",
                date_format="%d.%m.%Y",
                time_format="%H:%M",
                number_format={"decimal": ",", "thousands": " "},
                currency="₽"
            ),
            Language.CHINESE: LanguageInfo(
                code="zh",
                name="Chinese",
                native_name="中文",
                direction="ltr",
                flag="🇨🇳",
                locale="zh_CN",
                date_format="%Y年%m月%d日",
                time_format="%H:%M",
                number_format={"decimal": ".", "thousands": ","},
                currency="¥"
            ),
            Language.JAPANESE: LanguageInfo(
                code="ja",
                name="Japanese",
                native_name="日本語",
                direction="ltr",
                flag="🇯🇵",
                locale="ja_JP",
                date_format="%Y年%m月%d日",
                time_format="%H:%M",
                number_format={"decimal": ".", "thousands": ","},
                currency="¥"
            ),
            Language.KOREAN: LanguageInfo(
                code="ko",
                name="Korean",
                native_name="한국어",
                direction="ltr",
                flag="🇰🇷",
                locale="ko_KR",
                date_format="%Y년 %m월 %d일",
                time_format="%H:%M",
                number_format={"decimal": ".", "thousands": ","},
                currency="₩"
            )
        }
    
    def _load_terminology(self) -> Dict[str, Dict[str, str]]:
        """Eğitim terminolojisi sözlüğü"""
        return {
            "lesson": {
                "tr": "ders",
                "en": "lesson",
                "ar": "درس",
                "de": "Lektion",
                "fr": "leçon",
                "es": "lección",
                "ru": "урок"
            },
            "homework": {
                "tr": "ödev",
                "en": "homework",
                "ar": "واجب منزلي",
                "de": "Hausaufgabe",
                "fr": "devoir",
                "es": "tarea",
                "ru": "домашнее задание"
            },
            "quiz": {
                "tr": "sınav",
                "en": "quiz",
                "ar": "اختبار",
                "de": "Quiz",
                "fr": "quiz",
                "es": "cuestionario",
                "ru": "тест"
            },
            "teacher": {
                "tr": "öğretmen",
                "en": "teacher",
                "ar": "معلم",
                "de": "Lehrer",
                "fr": "professeur",
                "es": "profesor",
                "ru": "учитель"
            },
            "student": {
                "tr": "öğrenci",
                "en": "student",
                "ar": "طالب",
                "de": "Schüler",
                "fr": "étudiant",
                "es": "estudiante",
                "ru": "студент"
            },
            "grade": {
                "tr": "not",
                "en": "grade",
                "ar": "درجة",
                "de": "Note",
                "fr": "note",
                "es": "calificación",
                "ru": "оценка"
            },
            "achievement": {
                "tr": "başarı",
                "en": "achievement",
                "ar": "إنجاز",
                "de": "Erfolg",
                "fr": "réussite",
                "es": "logro",
                "ru": "достижение"
            }
        }
    
    async def translate(
        self,
        text: str,
        target_lang: str,
        source_lang: Optional[str] = None,
        context: Optional[str] = None,
        use_cache: bool = True
    ) -> str:
        """
        Metin çevirisi yap
        
        Args:
            text: Çevrilecek metin
            target_lang: Hedef dil kodu
            source_lang: Kaynak dil kodu (None ise otomatik algıla)
            context: Çeviri bağlamı
            use_cache: Cache kullan
        """
        # Kaynak dili algıla
        if not source_lang:
            source_lang = await self.detect_language(text)
        
        # Aynı dil kontrolü
        if source_lang == target_lang:
            return text
        
        # Cache kontrolü
        if use_cache:
            cache_key = f"translation:{source_lang}:{target_lang}:{hash(text)}"
            cached = await cache.get(cache_key, namespace="translations")
            if cached:
                return cached
        
        # Önce yerel çevirilere bak
        local_translation = await self._get_local_translation(
            text, target_lang, context
        )
        if local_translation:
            if use_cache:
                await cache.set(cache_key, local_translation, ttl=86400, namespace="translations")
            return local_translation
        
        # AI ile çevir
        translated = await self._translate_with_ai(
            text, source_lang, target_lang, context
        )
        
        # Cache'e kaydet
        if use_cache and translated:
            await cache.set(cache_key, translated, ttl=86400, namespace="translations")
        
        # Veritabanına kaydet (gelecek kullanım için)
        await self._save_translation(
            text, source_lang, target_lang, translated, context
        )
        
        return translated
    
    async def translate_batch(
        self,
        texts: List[str],
        target_lang: str,
        source_lang: Optional[str] = None,
        context: Optional[str] = None
    ) -> List[str]:
        """Toplu çeviri"""
        translations = []
        
        # Paralel çeviri
        tasks = [
            self.translate(text, target_lang, source_lang, context)
            for text in texts
        ]
        
        translations = await asyncio.gather(*tasks)
        
        return translations
    
    async def detect_language(self, text: str) -> str:
        """Dil algılama"""
        # Basit dil algılama (karakterlere göre)
        # Arapça karakterler
        if any('\u0600' <= char <= '\u06FF' for char in text):
            return Language.ARABIC
        
        # Kiril alfabesi
        if any('\u0400' <= char <= '\u04FF' for char in text):
            return Language.RUSSIAN
        
        # Çince karakterler
        if any('\u4E00' <= char <= '\u9FFF' for char in text):
            return Language.CHINESE
        
        # Japonca karakterler
        if any('\u3040' <= char <= '\u309F' or '\u30A0' <= char <= '\u30FF' for char in text):
            return Language.JAPANESE
        
        # Korece karakterler
        if any('\uAC00' <= char <= '\uD7AF' for char in text):
            return Language.KOREAN
        
        # Türkçe özel karakterler
        turkish_chars = set('çğıöşüÇĞİÖŞÜ')
        if any(char in turkish_chars for char in text):
            return Language.TURKISH
        
        # Varsayılan İngilizce
        return Language.ENGLISH
    
    async def get_available_languages(self) -> List[Dict[str, Any]]:
        """Mevcut dilleri getir"""
        languages = []
        
        for lang_code, lang_info in self.languages.items():
            if lang_info.supported:
                languages.append({
                    "code": lang_code,
                    "name": lang_info.name,
                    "native_name": lang_info.native_name,
                    "flag": lang_info.flag,
                    "direction": lang_info.direction
                })
        
        return languages
    
    async def get_user_language(self, user_id: str) -> str:
        """Kullanıcının dil tercihini getir"""
        # Cache'den kontrol
        cache_key = f"user_language:{user_id}"
        cached = await cache.get(cache_key, namespace="translations")
        if cached:
            return cached
        
        # Veritabanından al
        if self.db:
            user = await self.db.users.find_one({"_id": user_id})
            if user and "language" in user:
                language = user["language"]
                await cache.set(cache_key, language, ttl=3600, namespace="translations")
                return language
        
        return self.default_language
    
    async def set_user_language(self, user_id: str, language: str) -> bool:
        """Kullanıcının dil tercihini ayarla"""
        if language not in self.languages:
            return False
        
        # Veritabanında güncelle
        if self.db:
            await self.db.users.update_one(
                {"_id": user_id},
                {"$set": {"language": language}}
            )
        
        # Cache'i güncelle
        cache_key = f"user_language:{user_id}"
        await cache.set(cache_key, language, ttl=3600, namespace="translations")
        
        return True
    
    async def get_translations(
        self,
        keys: List[str],
        language: str,
        namespace: Optional[str] = None
    ) -> Dict[str, str]:
        """Çoklu çeviri anahtarlarını getir"""
        translations = {}
        
        for key in keys:
            # Namespace'li anahtar
            full_key = f"{namespace}.{key}" if namespace else key
            
            # Önce cache'e bak
            cache_key = f"trans_key:{language}:{full_key}"
            cached = await cache.get(cache_key, namespace="translations")
            
            if cached:
                translations[key] = cached
            else:
                # Yerel dosyadan al
                trans = await self._get_translation_by_key(full_key, language)
                if trans:
                    translations[key] = trans
                    await cache.set(cache_key, trans, ttl=3600, namespace="translations")
                else:
                    # Varsayılan dilde dene
                    if language != self.default_language:
                        trans = await self._get_translation_by_key(
                            full_key, self.default_language
                        )
                        if trans:
                            # AI ile çevir
                            translated = await self.translate(
                                trans, language, self.default_language
                            )
                            translations[key] = translated
                        else:
                            translations[key] = key  # Anahtar döndür
                    else:
                        translations[key] = key
        
        return translations
    
    def format_number(
        self,
        number: float,
        language: str,
        decimal_places: int = 2
    ) -> str:
        """Sayı formatlama"""
        lang_info = self.languages.get(language, self.languages[self.default_language])
        
        # Format ayarları
        decimal_sep = lang_info.number_format["decimal"]
        thousand_sep = lang_info.number_format["thousands"]
        
        # Formatlama
        formatted = f"{number:,.{decimal_places}f}"
        formatted = formatted.replace(",", "TEMP")
        formatted = formatted.replace(".", decimal_sep)
        formatted = formatted.replace("TEMP", thousand_sep)
        
        return formatted
    
    def format_date(
        self,
        date: datetime,
        language: str,
        format_type: str = "date"  # date, time, datetime
    ) -> str:
        """Tarih formatlama"""
        lang_info = self.languages.get(language, self.languages[self.default_language])
        
        if format_type == "date":
            return date.strftime(lang_info.date_format)
        elif format_type == "time":
            return date.strftime(lang_info.time_format)
        else:  # datetime
            return f"{date.strftime(lang_info.date_format)} {date.strftime(lang_info.time_format)}"
    
    def format_currency(
        self,
        amount: float,
        language: str
    ) -> str:
        """Para birimi formatlama"""
        lang_info = self.languages.get(language, self.languages[self.default_language])
        
        formatted_number = self.format_number(amount, language)
        return f"{lang_info.currency}{formatted_number}"
    
    async def translate_content(
        self,
        content: Dict[str, Any],
        target_lang: str,
        fields_to_translate: List[str]
    ) -> Dict[str, Any]:
        """İçerik objesini çevir"""
        translated_content = content.copy()
        
        for field in fields_to_translate:
            if field in content and isinstance(content[field], str):
                translated_content[field] = await self.translate(
                    content[field],
                    target_lang
                )
            elif field in content and isinstance(content[field], list):
                # Liste içindeki stringleri çevir
                translated_list = []
                for item in content[field]:
                    if isinstance(item, str):
                        translated_list.append(
                            await self.translate(item, target_lang)
                        )
                    else:
                        translated_list.append(item)
                translated_content[field] = translated_list
        
        return translated_content
    
    async def create_translation_key(
        self,
        key: str,
        translations: Dict[str, str],
        namespace: Optional[str] = None,
        context: Optional[str] = None
    ):
        """Yeni çeviri anahtarı oluştur"""
        if not self.db:
            return
        
        full_key = f"{namespace}.{key}" if namespace else key
        
        # Her dil için kaydet
        for lang, value in translations.items():
            translation = Translation(
                key=full_key,
                language=lang,
                value=value,
                context=context,
                verified=False
            )
            
            await self.db.translations.update_one(
                {"key": full_key, "language": lang},
                {"$set": translation.__dict__},
                upsert=True
            )
            
            # Cache'i temizle
            cache_key = f"trans_key:{lang}:{full_key}"
            await cache.delete(cache_key, namespace="translations")
    
    async def export_translations(
        self,
        language: str,
        format: str = "json"  # json, po, csv
    ) -> bytes:
        """Çevirileri export et"""
        if not self.db:
            return b""
        
        translations = {}
        async for trans in self.db.translations.find({"language": language}):
            translations[trans["key"]] = trans["value"]
        
        if format == "json":
            return json.dumps(translations, ensure_ascii=False, indent=2).encode('utf-8')
        elif format == "csv":
            # CSV formatı
            import csv
            import io
            
            output = io.StringIO()
            writer = csv.writer(output)
            writer.writerow(["key", "value"])
            
            for key, value in translations.items():
                writer.writerow([key, value])
            
            return output.getvalue().encode('utf-8')
        else:
            # PO format (gettext)
            po_content = self._generate_po_file(translations, language)
            return po_content.encode('utf-8')
    
    async def import_translations(
        self,
        language: str,
        file_content: bytes,
        format: str = "json"
    ) -> int:
        """Çevirileri import et"""
        count = 0
        
        if format == "json":
            translations = json.loads(file_content.decode('utf-8'))
            
            for key, value in translations.items():
                await self.create_translation_key(
                    key=key,
                    translations={language: value}
                )
                count += 1
        
        return count
    
    # Yardımcı metodlar
    
    async def _get_local_translation(
        self,
        text: str,
        target_lang: str,
        context: Optional[str]
    ) -> Optional[str]:
        """Yerel çeviri dosyalarından çeviri al"""
        # Önce terminoloji sözlüğüne bak
        lower_text = text.lower()
        if lower_text in self.terminology:
            if target_lang in self.terminology[lower_text]:
                return self.terminology[lower_text][target_lang]
        
        # Çeviri dosyasından ara
        translation_file = self.translations_dir / f"{target_lang}.json"
        if translation_file.exists():
            with open(translation_file, 'r', encoding='utf-8') as f:
                translations = json.load(f)
                
            # Tam eşleşme
            if text in translations:
                return translations[text]
            
            # Context'li arama
            if context:
                context_key = f"{context}.{text}"
                if context_key in translations:
                    return translations[context_key]
        
        return None
    
    async def _translate_with_ai(
        self,
        text: str,
        source_lang: str,
        target_lang: str,
        context: Optional[str]
    ) -> str:
        """AI ile çeviri yap"""
        # Dil adlarını al
        source_name = self.languages.get(source_lang, {"name": source_lang}).name
        target_name = self.languages.get(target_lang, {"name": target_lang}).name
        
        # Prompt oluştur
        prompt = self.ai_translation_prompt.format(
            source_lang=source_name,
            target_lang=target_name,
            context=context or "Genel eğitim içeriği",
            text=text
        )
        
        try:
            # AI'dan çeviri al
            response, _ = await ai_service.get_ai_response(
                prompt=prompt,
                grade_level=5,  # Dummy
                subject="translation",
                max_tokens=len(text) * 2  # Çeviri genelde daha uzun olabilir
            )
            
            return response.strip()
            
        except Exception as e:
            logger.error(f"AI çeviri hatası: {e}")
            return text  # Hata durumunda orijinal metni döndür
    
    async def _save_translation(
        self,
        original: str,
        source_lang: str,
        target_lang: str,
        translated: str,
        context: Optional[str]
    ):
        """Çeviriyi veritabanına kaydet"""
        if not self.db:
            return
        
        await self.db.translation_history.insert_one({
            "original": original,
            "source_lang": source_lang,
            "target_lang": target_lang,
            "translated": translated,
            "context": context,
            "timestamp": datetime.utcnow(),
            "provider": TranslationProvider.OPENAI
        })
    
    async def _get_translation_by_key(
        self,
        key: str,
        language: str
    ) -> Optional[str]:
        """Anahtar ile çeviri getir"""
        if not self.db:
            return None
        
        trans = await self.db.translations.find_one({
            "key": key,
            "language": language
        })
        
        if trans:
            return trans["value"]
        
        return None
    
    def _generate_po_file(
        self,
        translations: Dict[str, str],
        language: str
    ) -> str:
        """PO dosyası oluştur"""
        po_header = f"""# Yapay Zeka Öğretmen Translations
# Language: {language}
# Generated: {datetime.utcnow().isoformat()}

msgid ""
msgstr ""
"Content-Type: text/plain; charset=UTF-8\\n"
"Language: {language}\\n"

"""
        
        po_content = po_header
        
        for key, value in translations.items():
            po_content += f'msgid "{key}"\n'
            po_content += f'msgstr "{value}"\n\n'
        
        return po_content
    
    def get_rtl_languages(self) -> List[str]:
        """RTL (sağdan sola) dilleri getir"""
        rtl_langs = []
        for lang_code, lang_info in self.languages.items():
            if lang_info.direction == "rtl":
                rtl_langs.append(lang_code)
        return rtl_langs
    
    def is_rtl_language(self, language: str) -> bool:
        """Dil RTL mi kontrol et"""
        lang_info = self.languages.get(language)
        return lang_info.direction == "rtl" if lang_info else False


# Global translation service instance
translation_service = TranslationService()


# Helper functions
async def t(
    key: str,
    language: Optional[str] = None,
    **kwargs
) -> str:
    """
    Çeviri helper fonksiyonu
    
    Kullanım:
        await t("welcome_message", language="tr", name="Ahmet")
    """
    if not language:
        language = translation_service.default_language
    
    # Çeviriyi al
    translations = await translation_service.get_translations(
        [key],
        language
    )
    
    text = translations.get(key, key)
    
    # Değişkenleri yerleştir
    for var_name, var_value in kwargs.items():
        text = text.replace(f"{{{var_name}}}", str(var_value))
    
    return text


async def translate_text(
    text: str,
    target_lang: str,
    source_lang: Optional[str] = None
) -> str:
    """Metin çevirisi"""
    return await translation_service.translate(
        text=text,
        target_lang=target_lang,
        source_lang=source_lang
    )


async def get_user_locale_info(user_id: str) -> Dict[str, Any]:
    """Kullanıcı locale bilgilerini getir"""
    language = await translation_service.get_user_language(user_id)
    lang_info = translation_service.languages.get(language)
    
    if lang_info:
        return {
            "language": language,
            "locale": lang_info.locale,
            "direction": lang_info.direction,
            "date_format": lang_info.date_format,
            "time_format": lang_info.time_format,
            "currency": lang_info.currency
        }
    
    return {
        "language": translation_service.default_language,
        "locale": "tr_TR",
        "direction": "ltr"
    }

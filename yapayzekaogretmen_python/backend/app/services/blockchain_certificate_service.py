"""
Blockchain Certificate Service - NFT-based Achievement Certificates
------------------------------------------------------------------
Blockchain tabanlı başarı sertifikaları ve NFT rozetler.
"""

from typing import Dict, List, Optional, Any, Tuple
from datetime import datetime, timedelta
from enum import Enum
import hashlib
import json
import uuid
from dataclasses import dataclass, field
import asyncio
from loguru import logger

# Web3 isteğe bağlı
try:
    from web3 import Web3
    WEB3_AVAILABLE = True
except ImportError:
    WEB3_AVAILABLE = False
    logger.warning("Web3 bulunamadı, blockchain sertifika servisi devre dışı")
    Web3 = None

# eth_account isteğe bağlı
try:
    from eth_account import Account
    ETH_ACCOUNT_AVAILABLE = True
except ImportError:
    ETH_ACCOUNT_AVAILABLE = False
    logger.warning("eth_account bulunamadı")
    Account = None

from app.core.config import settings
from app.db.mongodb import get_database
from app.services.cache_service import cache


class CertificateType(str, Enum):
    """Sertifika tipleri"""
    COURSE_COMPLETION = "course_completion"
    ACHIEVEMENT = "achievement"
    SKILL_MASTERY = "skill_mastery"
    COMPETITION_WINNER = "competition_winner"
    PROJECT_COMPLETION = "project_completion"
    MILESTONE = "milestone"
    HONOR_ROLL = "honor_roll"


class BlockchainNetwork(str, Enum):
    """Blockchain ağları"""
    ETHEREUM = "ethereum"
    POLYGON = "polygon"
    BINANCE_SMART_CHAIN = "bsc"
    AVALANCHE = "avalanche"
    LOCAL = "local"  # Test için


@dataclass
class Certificate:
    """Dijital sertifika"""
    id: str
    recipient_id: str
    recipient_name: str
    type: CertificateType
    title: str
    description: str
    issued_date: datetime
    issuer: str = "Yapay Zeka Öğretmen"
    metadata: Dict = field(default_factory=dict)
    skills: List[str] = field(default_factory=list)
    grade: Optional[str] = None
    score: Optional[float] = None
    blockchain_tx: Optional[str] = None
    token_id: Optional[int] = None
    ipfs_hash: Optional[str] = None


@dataclass
class NFTMetadata:
    """NFT metadata standardı (OpenSea compatible)"""
    name: str
    description: str
    image: str
    external_url: str
    attributes: List[Dict[str, Any]]
    properties: Dict[str, Any] = field(default_factory=dict)
    

@dataclass
class VerificationResult:
    """Sertifika doğrulama sonucu"""
    is_valid: bool
    certificate: Optional[Certificate] = None
    blockchain_verified: bool = False
    message: str = ""
    verification_data: Dict = field(default_factory=dict)


class BlockchainCertificateService:
    """Blockchain sertifika servisi"""
    
    def __init__(self):
        self.db = get_database()
        
        # Blockchain konfigürasyonu
        self.networks = {
            BlockchainNetwork.POLYGON: {
                "rpc_url": "https://polygon-rpc.com",
                "chain_id": 137,
                "contract_address": getattr(settings, "POLYGON_CONTRACT_ADDRESS", ""),
                "gas_price": "standard"
            },
            BlockchainNetwork.LOCAL: {
                "rpc_url": "http://localhost:8545",
                "chain_id": 1337,
                "contract_address": "0x0000000000000000000000000000000000000000",
                "gas_price": "low"
            }
        }
        
        # Aktif network (production'da Polygon öneriliyor - düşük gas fee)
        self.active_network = BlockchainNetwork.LOCAL
        
        # Smart contract ABI (basitleştirilmiş)
        self.contract_abi = [
            {
                "name": "mintCertificate",
                "type": "function",
                "inputs": [
                    {"name": "to", "type": "address"},
                    {"name": "tokenURI", "type": "string"}
                ],
                "outputs": [{"name": "", "type": "uint256"}]
            },
            {
                "name": "verifyCertificate",
                "type": "function",
                "inputs": [{"name": "tokenId", "type": "uint256"}],
                "outputs": [{"name": "", "type": "bool"}]
            },
            {
                "name": "getCertificateURI",
                "type": "function",
                "inputs": [{"name": "tokenId", "type": "uint256"}],
                "outputs": [{"name": "", "type": "string"}]
            }
        ]
        
        # IPFS gateway (metadata storage)
        self.ipfs_gateway = "https://ipfs.io/ipfs/"
        
        # Certificate templates
        self.templates = self._load_certificate_templates()
        
        logger.info("Blockchain Certificate Service başlatıldı")
    
    def _load_certificate_templates(self) -> Dict[str, Dict]:
        """Sertifika şablonları"""
        return {
            CertificateType.COURSE_COMPLETION: {
                "title_template": "{course_name} Kursu Tamamlandı",
                "description_template": "{student_name}, {course_name} kursunu başarıyla tamamladı.",
                "image_template": "course_completion",
                "attributes": [
                    {"trait_type": "Kurs", "value": "{course_name}"},
                    {"trait_type": "Tamamlanma Tarihi", "value": "{date}"},
                    {"trait_type": "Başarı Oranı", "value": "{score}%"}
                ]
            },
            CertificateType.ACHIEVEMENT: {
                "title_template": "{achievement_name} Başarısı",
                "description_template": "{student_name}, {achievement_name} başarısını kazandı.",
                "image_template": "achievement",
                "attributes": [
                    {"trait_type": "Başarı", "value": "{achievement_name}"},
                    {"trait_type": "Seviye", "value": "{level}"},
                    {"trait_type": "Nadir", "value": "{rarity}"}
                ]
            },
            CertificateType.SKILL_MASTERY: {
                "title_template": "{skill_name} Ustalığı",
                "description_template": "{student_name}, {skill_name} konusunda ustalık seviyesine ulaştı.",
                "image_template": "skill_mastery",
                "attributes": [
                    {"trait_type": "Beceri", "value": "{skill_name}"},
                    {"trait_type": "Ustalık Seviyesi", "value": "{mastery_level}"},
                    {"trait_type": "Deneyim Puanı", "value": "{xp}"}
                ]
            }
        }
    
    async def issue_certificate(
        self,
        recipient_id: str,
        recipient_name: str,
        certificate_type: CertificateType,
        title: str,
        description: str,
        metadata: Optional[Dict] = None,
        mint_nft: bool = True
    ) -> Certificate:
        """
        Sertifika oluştur ve blockchain'e kaydet
        
        Args:
            recipient_id: Alıcı kullanıcı ID
            recipient_name: Alıcı adı
            certificate_type: Sertifika tipi
            title: Sertifika başlığı
            description: Açıklama
            metadata: Ek veriler
            mint_nft: NFT olarak mint edilsin mi?
        """
        # Sertifika oluştur
        certificate = Certificate(
            id=f"cert_{uuid.uuid4().hex}",
            recipient_id=recipient_id,
            recipient_name=recipient_name,
            type=certificate_type,
            title=title,
            description=description,
            issued_date=datetime.utcnow(),
            metadata=metadata or {}
        )
        
        # Metadata'dan ek bilgileri al
        if metadata:
            certificate.skills = metadata.get("skills", [])
            certificate.grade = metadata.get("grade")
            certificate.score = metadata.get("score")
        
        # Veritabanına kaydet
        if self.db:
            await self.db.certificates.insert_one(certificate.__dict__)
        
        # NFT mint et
        if mint_nft:
            try:
                nft_metadata = await self._create_nft_metadata(certificate)
                ipfs_hash = await self._upload_to_ipfs(nft_metadata)
                certificate.ipfs_hash = ipfs_hash
                
                # Blockchain'e mint et
                if self.active_network != BlockchainNetwork.LOCAL:
                    tx_hash, token_id = await self._mint_certificate_nft(
                        recipient_id,
                        ipfs_hash
                    )
                    certificate.blockchain_tx = tx_hash
                    certificate.token_id = token_id
                else:
                    # Test için sahte değerler
                    certificate.blockchain_tx = f"0x{uuid.uuid4().hex}"
                    certificate.token_id = hash(certificate.id) % 1000000
                
                # Veritabanını güncelle
                await self._update_certificate_blockchain_data(certificate)
                
            except Exception as e:
                logger.error(f"NFT mint hatası: {e}")
                # NFT mint başarısız olsa bile sertifika geçerli
        
        # Cache'e kaydet
        cache_key = f"certificate:{certificate.id}"
        await cache.set(cache_key, certificate.__dict__, ttl=86400, namespace="certificates")
        
        # Event log
        await self._log_certificate_event(certificate, "issued")
        
        return certificate
    
    async def _create_nft_metadata(self, certificate: Certificate) -> NFTMetadata:
        """NFT metadata oluştur"""
        # Template'i al
        template = self.templates.get(
            certificate.type,
            self.templates[CertificateType.COURSE_COMPLETION]
        )
        
        # Dinamik değerleri doldur
        format_data = {
            "student_name": certificate.recipient_name,
            "course_name": certificate.metadata.get("course_name", ""),
            "achievement_name": certificate.metadata.get("achievement_name", ""),
            "skill_name": certificate.metadata.get("skill_name", ""),
            "date": certificate.issued_date.strftime("%d.%m.%Y"),
            "score": certificate.score or 100,
            "level": certificate.metadata.get("level", 1),
            "rarity": certificate.metadata.get("rarity", "Common"),
            "mastery_level": certificate.metadata.get("mastery_level", "Expert"),
            "xp": certificate.metadata.get("xp", 0)
        }
        
        # Attributes oluştur
        attributes = []
        for attr_template in template.get("attributes", []):
            attribute = {
                "trait_type": attr_template["trait_type"],
                "value": attr_template["value"].format(**format_data)
            }
            attributes.append(attribute)
        
        # Standart attributes ekle
        attributes.extend([
            {"trait_type": "Kurum", "value": certificate.issuer},
            {"trait_type": "Tip", "value": certificate.type},
            {"trait_type": "Tarih", "value": certificate.issued_date.isoformat()},
            {"trait_type": "Doğrulanmış", "value": "Evet"}
        ])
        
        # NFT metadata
        metadata = NFTMetadata(
            name=certificate.title,
            description=certificate.description,
            image=await self._generate_certificate_image(certificate),
            external_url=f"https://yapayzekaogretmen.com/certificates/{certificate.id}",
            attributes=attributes,
            properties={
                "category": "certificate",
                "issuer": certificate.issuer,
                "recipient": {
                    "id": certificate.recipient_id,
                    "name": certificate.recipient_name
                },
                "verification": {
                    "hash": self._calculate_certificate_hash(certificate),
                    "signature": await self._sign_certificate(certificate)
                }
            }
        )
        
        return metadata
    
    async def _generate_certificate_image(self, certificate: Certificate) -> str:
        """Sertifika görseli oluştur"""
        # TODO: Gerçek görsel oluşturma servisi entegrasyonu
        # Şimdilik placeholder
        template_name = self.templates.get(
            certificate.type, {}
        ).get("image_template", "default")
        
        return f"https://yapayzekaogretmen.com/certificate-images/{template_name}.png"
    
    def _calculate_certificate_hash(self, certificate: Certificate) -> str:
        """Sertifika hash'i hesapla"""
        data = {
            "id": certificate.id,
            "recipient_id": certificate.recipient_id,
            "type": certificate.type,
            "title": certificate.title,
            "issued_date": certificate.issued_date.isoformat(),
            "issuer": certificate.issuer
        }
        
        data_str = json.dumps(data, sort_keys=True)
        return hashlib.sha256(data_str.encode()).hexdigest()
    
    async def _sign_certificate(self, certificate: Certificate) -> str:
        """Sertifikayı dijital olarak imzala"""
        # TODO: Gerçek dijital imza implementasyonu
        # Şimdilik basit bir imza
        hash_value = self._calculate_certificate_hash(certificate)
        signature = hashlib.sha256(
            f"{hash_value}:{settings.SECRET_KEY}".encode()
        ).hexdigest()
        
        return signature
    
    async def _upload_to_ipfs(self, metadata: NFTMetadata) -> str:
        """IPFS'e yükle"""
        # TODO: Gerçek IPFS entegrasyonu (Pinata, Infura, vs.)
        # Şimdilik sahte hash
        metadata_dict = {
            "name": metadata.name,
            "description": metadata.description,
            "image": metadata.image,
            "external_url": metadata.external_url,
            "attributes": metadata.attributes,
            "properties": metadata.properties
        }
        
        metadata_str = json.dumps(metadata_dict)
        ipfs_hash = f"Qm{hashlib.sha256(metadata_str.encode()).hexdigest()[:44]}"
        
        # Cache'e kaydet (IPFS simülasyonu)
        await cache.set(
            f"ipfs:{ipfs_hash}",
            metadata_dict,
            ttl=0,  # Kalıcı
            namespace="ipfs"
        )
        
        return ipfs_hash
    
    async def _mint_certificate_nft(
        self,
        recipient_id: str,
        ipfs_hash: str
    ) -> Tuple[str, int]:
        """Blockchain'de NFT mint et"""
        if self.active_network == BlockchainNetwork.LOCAL:
            # Test için sahte değerler
            tx_hash = f"0x{uuid.uuid4().hex}"
            token_id = hash(ipfs_hash) % 1000000
            return tx_hash, token_id
        
        # Web3 bağlantısı
        network_config = self.networks[self.active_network]
        w3 = Web3(Web3.HTTPProvider(network_config["rpc_url"]))
        
        # Contract instance
        contract_address = Web3.toChecksumAddress(network_config["contract_address"])
        contract = w3.eth.contract(
            address=contract_address,
            abi=self.contract_abi
        )
        
        # Recipient adresi (kullanıcının wallet adresi olmalı)
        # TODO: Kullanıcı wallet bağlantısı
        recipient_address = await self._get_user_wallet_address(recipient_id)
        
        if not recipient_address:
            raise ValueError("Kullanıcı wallet adresi bulunamadı")
        
        # Transaction oluştur
        account = Account.from_key(settings.BLOCKCHAIN_PRIVATE_KEY)
        nonce = w3.eth.get_transaction_count(account.address)
        
        # Token URI (IPFS URL)
        token_uri = f"{self.ipfs_gateway}{ipfs_hash}"
        
        # Transaction
        transaction = contract.functions.mintCertificate(
            recipient_address,
            token_uri
        ).build_transaction({
            'chainId': network_config["chain_id"],
            'gas': 200000,
            'gasPrice': w3.toWei('20', 'gwei'),
            'nonce': nonce,
        })
        
        # İmzala ve gönder
        signed_txn = w3.eth.account.sign_transaction(transaction, account.key)
        tx_hash = w3.eth.send_raw_transaction(signed_txn.rawTransaction)
        
        # Transaction receipt bekle
        receipt = w3.eth.wait_for_transaction_receipt(tx_hash)
        
        # Token ID'yi event'ten al
        # TODO: Event parsing
        token_id = 1  # Placeholder
        
        return tx_hash.hex(), token_id
    
    async def _get_user_wallet_address(self, user_id: str) -> Optional[str]:
        """Kullanıcının wallet adresini getir"""
        if not self.db:
            return None
        
        user = await self.db.users.find_one({"_id": user_id})
        if user and "wallet_address" in user:
            return user["wallet_address"]
        
        # Wallet yoksa demo adres
        return "0x0000000000000000000000000000000000000001"
    
    async def _update_certificate_blockchain_data(self, certificate: Certificate):
        """Sertifika blockchain verilerini güncelle"""
        if self.db:
            await self.db.certificates.update_one(
                {"id": certificate.id},
                {
                    "$set": {
                        "blockchain_tx": certificate.blockchain_tx,
                        "token_id": certificate.token_id,
                        "ipfs_hash": certificate.ipfs_hash,
                        "updated_at": datetime.utcnow()
                    }
                }
            )
    
    async def verify_certificate(
        self,
        certificate_id: Optional[str] = None,
        token_id: Optional[int] = None,
        tx_hash: Optional[str] = None
    ) -> VerificationResult:
        """
        Sertifikayı doğrula
        
        En az bir parametre gerekli.
        """
        # Sertifikayı bul
        certificate = None
        
        if certificate_id:
            # Cache'den kontrol et
            cache_key = f"certificate:{certificate_id}"
            cached = await cache.get(cache_key, namespace="certificates")
            
            if cached:
                certificate = Certificate(**cached)
            elif self.db:
                cert_data = await self.db.certificates.find_one({"id": certificate_id})
                if cert_data:
                    certificate = Certificate(**cert_data)
        
        elif token_id and self.db:
            cert_data = await self.db.certificates.find_one({"token_id": token_id})
            if cert_data:
                certificate = Certificate(**cert_data)
        
        elif tx_hash and self.db:
            cert_data = await self.db.certificates.find_one({"blockchain_tx": tx_hash})
            if cert_data:
                certificate = Certificate(**cert_data)
        
        if not certificate:
            return VerificationResult(
                is_valid=False,
                message="Sertifika bulunamadı"
            )
        
        # Hash doğrulama
        expected_hash = self._calculate_certificate_hash(certificate)
        
        # İmza doğrulama
        expected_signature = await self._sign_certificate(certificate)
        
        # Blockchain doğrulama
        blockchain_verified = False
        if certificate.token_id and self.active_network != BlockchainNetwork.LOCAL:
            blockchain_verified = await self._verify_on_blockchain(certificate.token_id)
        elif self.active_network == BlockchainNetwork.LOCAL:
            blockchain_verified = True  # Test ortamında her zaman geçerli
        
        # IPFS doğrulama
        ipfs_verified = False
        if certificate.ipfs_hash:
            ipfs_verified = await self._verify_ipfs_content(
                certificate.ipfs_hash,
                expected_hash
            )
        
        # Sonuç
        is_valid = blockchain_verified or ipfs_verified  # En az biri doğrulanmış olmalı
        
        return VerificationResult(
            is_valid=is_valid,
            certificate=certificate,
            blockchain_verified=blockchain_verified,
            message="Sertifika doğrulandı" if is_valid else "Sertifika doğrulanamadı",
            verification_data={
                "hash": expected_hash,
                "signature": expected_signature,
                "blockchain_verified": blockchain_verified,
                "ipfs_verified": ipfs_verified,
                "verification_time": datetime.utcnow().isoformat()
            }
        )
    
    async def _verify_on_blockchain(self, token_id: int) -> bool:
        """Blockchain'de doğrula"""
        try:
            network_config = self.networks[self.active_network]
            w3 = Web3(Web3.HTTPProvider(network_config["rpc_url"]))
            
            contract_address = Web3.toChecksumAddress(network_config["contract_address"])
            contract = w3.eth.contract(
                address=contract_address,
                abi=self.contract_abi
            )
            
            # Token var mı kontrol et
            is_valid = contract.functions.verifyCertificate(token_id).call()
            
            return is_valid
            
        except Exception as e:
            logger.error(f"Blockchain doğrulama hatası: {e}")
            return False
    
    async def _verify_ipfs_content(self, ipfs_hash: str, expected_hash: str) -> bool:
        """IPFS içeriğini doğrula"""
        # Cache'den al (IPFS simülasyonu)
        cached_data = await cache.get(f"ipfs:{ipfs_hash}", namespace="ipfs")
        
        if cached_data:
            # Verification hash'i kontrol et
            if "properties" in cached_data and "verification" in cached_data["properties"]:
                stored_hash = cached_data["properties"]["verification"].get("hash")
                return stored_hash == expected_hash
        
        return False
    
    async def get_user_certificates(
        self,
        user_id: str,
        certificate_type: Optional[CertificateType] = None,
        limit: int = 20,
        offset: int = 0
    ) -> List[Certificate]:
        """Kullanıcının sertifikalarını getir"""
        if not self.db:
            return []
        
        # Query oluştur
        query = {"recipient_id": user_id}
        if certificate_type:
            query["type"] = certificate_type
        
        # Sertifikaları getir
        cursor = self.db.certificates.find(query)\
            .sort("issued_date", -1)\
            .skip(offset)\
            .limit(limit)
        
        certificates = []
        async for cert_data in cursor:
            certificates.append(Certificate(**cert_data))
        
        return certificates
    
    async def get_certificate_stats(self, user_id: str) -> Dict[str, Any]:
        """Kullanıcı sertifika istatistikleri"""
        if not self.db:
            return {}
        
        # Toplam sertifika sayısı
        total_count = await self.db.certificates.count_documents({
            "recipient_id": user_id
        })
        
        # Tip bazında dağılım
        pipeline = [
            {"$match": {"recipient_id": user_id}},
            {"$group": {
                "_id": "$type",
                "count": {"$sum": 1}
            }}
        ]
        
        type_distribution = {}
        async for result in self.db.certificates.aggregate(pipeline):
            type_distribution[result["_id"]] = result["count"]
        
        # NFT sertifikalar
        nft_count = await self.db.certificates.count_documents({
            "recipient_id": user_id,
            "token_id": {"$exists": True}
        })
        
        # En son sertifika
        latest_cert = await self.db.certificates.find_one(
            {"recipient_id": user_id},
            sort=[("issued_date", -1)]
        )
        
        return {
            "total_certificates": total_count,
            "nft_certificates": nft_count,
            "type_distribution": type_distribution,
            "latest_certificate": Certificate(**latest_cert) if latest_cert else None,
            "blockchain_verified_count": nft_count,
            "unique_skills": await self._get_unique_skills(user_id)
        }
    
    async def _get_unique_skills(self, user_id: str) -> List[str]:
        """Kullanıcının benzersiz becerilerini getir"""
        if not self.db:
            return []
        
        pipeline = [
            {"$match": {"recipient_id": user_id}},
            {"$unwind": "$skills"},
            {"$group": {"_id": "$skills"}},
            {"$project": {"skill": "$_id", "_id": 0}}
        ]
        
        skills = []
        async for result in self.db.certificates.aggregate(pipeline):
            skills.append(result["skill"])
        
        return skills
    
    async def _log_certificate_event(self, certificate: Certificate, event_type: str):
        """Sertifika olayını logla"""
        if self.db:
            await self.db.certificate_events.insert_one({
                "certificate_id": certificate.id,
                "event_type": event_type,
                "timestamp": datetime.utcnow(),
                "data": {
                    "recipient_id": certificate.recipient_id,
                    "type": certificate.type,
                    "blockchain_tx": certificate.blockchain_tx
                }
            })
    
    async def export_certificate_pdf(self, certificate_id: str) -> bytes:
        """Sertifikayı PDF olarak export et"""
        # TODO: PDF generation implementasyonu
        # ReportLab veya WeasyPrint kullanılabilir
        
        verification_result = await self.verify_certificate(certificate_id)
        if not verification_result.is_valid:
            raise ValueError("Geçersiz sertifika")
        
        certificate = verification_result.certificate
        
        # Basit PDF içeriği (placeholder)
        pdf_content = f"""
        BAŞARI SERTİFİKASI
        
        {certificate.title}
        
        {certificate.recipient_name}
        
        {certificate.description}
        
        Tarih: {certificate.issued_date.strftime('%d.%m.%Y')}
        Kurum: {certificate.issuer}
        
        Doğrulama Kodu: {certificate.id}
        Blockchain TX: {certificate.blockchain_tx or 'N/A'}
        """.encode('utf-8')
        
        return pdf_content
    
    async def create_certificate_collection(
        self,
        name: str,
        description: str,
        symbol: str,
        max_supply: Optional[int] = None
    ) -> Dict[str, Any]:
        """Yeni sertifika koleksiyonu oluştur (Smart Contract deploy)"""
        # TODO: Smart contract deployment
        # OpenZeppelin ERC-721 template kullanılabilir
        
        collection = {
            "id": f"collection_{uuid.uuid4().hex}",
            "name": name,
            "description": description,
            "symbol": symbol,
            "max_supply": max_supply,
            "created_at": datetime.utcnow(),
            "contract_address": f"0x{uuid.uuid4().hex[:40]}",  # Placeholder
            "network": self.active_network
        }
        
        if self.db:
            await self.db.certificate_collections.insert_one(collection)
        
        return collection


# Global blockchain certificate service instance
blockchain_certificate_service = BlockchainCertificateService()


# Helper functions
async def issue_course_certificate(
    user_id: str,
    user_name: str,
    course_name: str,
    score: float,
    skills: List[str]
) -> Certificate:
    """Kurs tamamlama sertifikası ver"""
    return await blockchain_certificate_service.issue_certificate(
        recipient_id=user_id,
        recipient_name=user_name,
        certificate_type=CertificateType.COURSE_COMPLETION,
        title=f"{course_name} Kursu Tamamlandı",
        description=f"{user_name}, {course_name} kursunu %{int(score)} başarı ile tamamladı.",
        metadata={
            "course_name": course_name,
            "score": score,
            "skills": skills,
            "completion_date": datetime.utcnow().isoformat()
        }
    )


async def issue_achievement_certificate(
    user_id: str,
    user_name: str,
    achievement_name: str,
    level: int,
    rarity: str = "Common"
) -> Certificate:
    """Başarı sertifikası ver"""
    return await blockchain_certificate_service.issue_certificate(
        recipient_id=user_id,
        recipient_name=user_name,
        certificate_type=CertificateType.ACHIEVEMENT,
        title=f"{achievement_name} Başarısı",
        description=f"{user_name}, {achievement_name} başarısını kazandı!",
        metadata={
            "achievement_name": achievement_name,
            "level": level,
            "rarity": rarity,
            "unlocked_date": datetime.utcnow().isoformat()
        }
    )

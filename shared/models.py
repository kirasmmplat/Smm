"""Database Models - نماذج قاعدة البيانات"""

from dataclasses import dataclass, asdict
from datetime import datetime
from typing import Optional, Dict, Any
import uuid


@dataclass
class Secret:
    """نموذج السر"""
    id: str = None
    secret: str = ""
    service: str = ""
    source: str = ""
    url: str = ""
    discovered_at: datetime = None
    validated: bool = False
    notified: bool = False
    validated_at: Optional[datetime] = None
    notified_at: Optional[datetime] = None
    metadata: Dict[str, Any] = None

    def __post_init__(self):
        if self.id is None:
            self.id = str(uuid.uuid4())
        if self.discovered_at is None:
            self.discovered_at = datetime.now()
        if self.metadata is None:
            self.metadata = {}

    def to_dict(self) -> dict:
        """تحويل إلى قاموس"""
        return asdict(self)


@dataclass
class ScanResult:
    """نموذج نتيجة المسح"""
    id: str = None
    scan_id: str = ""
    source: str = ""
    secret: str = ""
    service: str = ""
    url: str = ""
    found_at: datetime = None
    metadata: Dict[str, Any] = None

    def __post_init__(self):
        if self.id is None:
            self.id = str(uuid.uuid4())
        if self.found_at is None:
            self.found_at = datetime.now()
        if self.metadata is None:
            self.metadata = {}

    def to_dict(self) -> dict:
        """تحويل إلى قاموس"""
        return asdict(self)


@dataclass
class ValidationResult:
    """نموذج نتيجة التحقق"""
    id: str = None
    secret_id: str = ""
    is_valid: bool = False
    service: str = ""
    validated_at: datetime = None
    error_message: Optional[str] = None
    metadata: Dict[str, Any] = None

    def __post_init__(self):
        if self.id is None:
            self.id = str(uuid.uuid4())
        if self.validated_at is None:
            self.validated_at = datetime.now()
        if self.metadata is None:
            self.metadata = {}

    def to_dict(self) -> dict:
        """تحويل إلى قاموس"""
        return asdict(self)

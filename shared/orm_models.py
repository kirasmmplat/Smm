"""SQLAlchemy ORM Models - نماذج ORM لقاعدة البيانات"""

from sqlalchemy import Column, String, Boolean, DateTime, JSON, Text
from sqlalchemy.ext.declarative import declarative_base
from datetime import datetime
import uuid

Base = declarative_base()


class SecretORM(Base):
    """نموذج جدول الأسرار"""
    __tablename__ = "secrets"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    secret = Column(Text, nullable=False)
    service = Column(String, nullable=False)
    source = Column(String, nullable=False)  # github, pastebin
    url = Column(String, nullable=True)
    discovered_at = Column(DateTime, default=datetime.utcnow)
    validated = Column(Boolean, default=False)
    notified = Column(Boolean, default=False)
    validated_at = Column(DateTime, nullable=True)
    notified_at = Column(DateTime, nullable=True)
    metadata = Column(JSON, default={})


class ScanResultORM(Base):
    """نموذج جدول نتائج المسح"""
    __tablename__ = "scan_results"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    scan_id = Column(String, nullable=False, index=True)
    source = Column(String, nullable=False)
    secret = Column(Text, nullable=False)
    service = Column(String, nullable=False)
    url = Column(String, nullable=True)
    found_at = Column(DateTime, default=datetime.utcnow)
    metadata = Column(JSON, default={})


class ValidationResultORM(Base):
    """نموذج جدول نتائج التحقق"""
    __tablename__ = "validation_results"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    secret_id = Column(String, nullable=False, index=True)
    is_valid = Column(Boolean, default=False)
    service = Column(String, nullable=False)
    validated_at = Column(DateTime, default=datetime.utcnow)
    error_message = Column(Text, nullable=True)
    metadata = Column(JSON, default={})


class ScanORM(Base):
    """نموذج جدول المسحات"""
    __tablename__ = "scans"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    source = Column(String, nullable=False)
    status = Column(String, default="pending")  # pending, running, completed, failed
    started_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)
    total_found = Column(String, default=0)
    metadata = Column(JSON, default={})

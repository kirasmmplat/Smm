"""Database Configuration and Connection - إعدادات وإدارة قاعدة البيانات"""

import os
from typing import Optional
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.ext.declarative import declarative_base
import logging

logger = logging.getLogger(__name__)

Base = declarative_base()


class DatabaseConfig:
    """إعدادات قاعدة البيانات"""

    def __init__(
        self,
        database_url: Optional[str] = None,
        turso_url: Optional[str] = None,
        turso_token: Optional[str] = None,
    ):
        self.database_url = database_url or os.getenv(
            "DATABASE_URL", "sqlite:///./kashef.db"
        )
        self.turso_url = turso_url or os.getenv("TURSO_URL", "")
        self.turso_token = turso_token or os.getenv("TURSO_TOKEN", "")

        # استخدام Turso إذا كانت المتغيرات موجودة
        if self.turso_url and self.turso_token:
            self.use_turso = True
            # تنسيق Turso URL
            self.url = f"sqlite+libsql://{self.turso_url}?authToken={self.turso_token}"
        else:
            self.use_turso = False
            self.url = self.database_url


class Database:
    """فئة إدارة قاعدة البيانات"""

    def __init__(self, config: DatabaseConfig):
        self.config = config
        self.engine = None
        self.SessionLocal = None
        self._initialize()

    def _initialize(self):
        """تهيئة قاعدة البيانات"""
        try:
            logger.info(f"الاتصال بقاعدة البيانات: {self.config.url}")
            self.engine = create_engine(
                self.config.url,
                echo=False,
                connect_args={"check_same_thread": False}
                if "sqlite" in self.config.url
                else {},
            )
            self.SessionLocal = sessionmaker(
                autocommit=False, autoflush=False, bind=self.engine
            )
            logger.info("✅ تم الاتصال بقاعدة البيانات بنجاح")
        except Exception as e:
            logger.error(f"❌ خطأ في الاتصال بقاعدة البيانات: {e}")
            raise

    def create_tables(self):
        """إنشاء الجداول"""
        try:
            Base.metadata.create_all(bind=self.engine)
            logger.info("✅ تم إنشاء الجداول بنجاح")
        except Exception as e:
            logger.error(f"❌ خطأ في إنشاء الجداول: {e}")
            raise

    def get_session(self) -> Session:
        """الحصول على جلسة جديدة"""
        return self.SessionLocal()

    def close(self):
        """إغلاق الاتصال"""
        if self.engine:
            self.engine.dispose()
            logger.info("✅ تم إغلاق الاتصال بقاعدة البيانات")


# متغير عام لقاعدة البيانات
_db: Optional[Database] = None


def initialize_database(config: Optional[DatabaseConfig] = None):
    """تهيئة قاعدة البيانات العامة"""
    global _db
    if _db is None:
        if config is None:
            config = DatabaseConfig()
        _db = Database(config)
        _db.create_tables()


def get_db() -> Database:
    """الحصول على قاعدة البيانات"""
    global _db
    if _db is None:
        initialize_database()
    return _db

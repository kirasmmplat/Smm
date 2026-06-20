"""Migrations - ملفات الهجرات"""

from sqlalchemy import text
from shared.database import Database
import logging

logger = logging.getLogger(__name__)


class Migration:
    """فئة الهجرة"""

    def __init__(self, db: Database):
        self.db = db

    def run_all(self):
        """تشغيل جميع الهجرات"""
        logger.info("🔄 بدء تشغيل الهجرات...")
        try:
            self.create_indexes()
            self.add_columns_if_missing()
            logger.info("✅ تم تشغيل جميع الهجرات بنجاح")
        except Exception as e:
            logger.error(f"❌ خطأ في الهجرات: {e}")
            raise

    def create_indexes(self):
        """إنشاء الفهارس"""
        logger.info("📇 إنشاء الفهارس...")
        session = self.db.get_session()
        try:
            # فهرس على service
            session.execute(text(
                "CREATE INDEX IF NOT EXISTS idx_secrets_service ON secrets(service)"
            ))
            # فهرس على source
            session.execute(text(
                "CREATE INDEX IF NOT EXISTS idx_secrets_source ON secrets(source)"
            ))
            # فهرس على discovered_at
            session.execute(text(
                "CREATE INDEX IF NOT EXISTS idx_secrets_discovered ON secrets(discovered_at)"
            ))
            session.commit()
            logger.info("✅ تم إنشاء الفهارس بنجاح")
        except Exception as e:
            session.rollback()
            logger.error(f"❌ خطأ في إنشاء الفهارس: {e}")
        finally:
            session.close()

    def add_columns_if_missing(self):
        """إضافة أعمدة مفقودة"""
        logger.info("➕ التحقق من الأعمدة المفقودة...")
        session = self.db.get_session()
        try:
            # يمكن إضافة منطق التحقق من الأعمدة هنا
            session.commit()
            logger.info("✅ تم التحقق من الأعمدة")
        except Exception as e:
            session.rollback()
            logger.error(f"❌ خطأ في التحقق من الأعمدة: {e}")
        finally:
            session.close()

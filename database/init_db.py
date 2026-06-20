"""Database initialization script"""

import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from shared.database import DatabaseConfig, Database
from shared.orm_models import Base
from shared.migrations import Migration
from shared.logger import setup_logger

logger = setup_logger('database_init')


def init_database():
    """
    تهيئة قاعدة البيانات
    
    الخطوات:
    1. إنشاء الاتصال
    2. إنشاء الجداول
    3. تشغيل الهجرات
    """
    logger.info("🚀 بدء تهيئة قاعدة البيانات...")

    try:
        # إنشاء التكوين
        config = DatabaseConfig()
        logger.info(f"📝 التكوين: {config.url}")

        # إنشاء قاعدة البيانات
        db = Database(config)

        # إنشاء الجداول
        logger.info("📊 إنشاء الجداول...")
        db.engine.execute("PRAGMA foreign_keys = ON")
        Base.metadata.create_all(bind=db.engine)
        logger.info("✅ تم إنشاء الجداول بنجاح")

        # تشغيل الهجرات
        migration = Migration(db)
        migration.run_all()

        logger.info("\n" + "="*50)
        logger.info("✅ تم تهيئة قاعدة البيانات بنجاح!")
        logger.info("="*50)
        logger.info(f"📁 موقع قاعدة البيانات: {config.url}")
        logger.info("✨ المشروع جاهز للعمل!")

    except Exception as e:
        logger.error(f"❌ خطأ في تهيئة قاعدة البيانات: {e}")
        sys.exit(1)


if __name__ == "__main__":
    init_database()

"""Logger Configuration - إعدادات التسجيل"""

import logging
from logging.handlers import RotatingFileHandler
import os


def setup_logger(name: str, level=logging.INFO) -> logging.Logger:
    """
    إعداد logger مع ملفات
    
    Args:
        name: اسم الـ logger
        level: مستوى التسجيل
        
    Returns:
        logger مُعد
    """
    logger = logging.getLogger(name)
    logger.setLevel(level)

    # إنشاء مجلد logs إذا لم يكن موجوداً
    os.makedirs("logs", exist_ok=True)

    # معالج للملفات
    file_handler = RotatingFileHandler(
        f"logs/{name}.log",
        maxBytes=10485760,  # 10MB
        backupCount=5
    )
    file_handler.setLevel(level)

    # معالج للـ console
    console_handler = logging.StreamHandler()
    console_handler.setLevel(level)

    # صيغة التسجيل
    formatter = logging.Formatter(
        '%(asctime)s - %(name)s - %(levelname)s - %(message)s',
        datefmt='%Y-%m-%d %H:%M:%S'
    )

    file_handler.setFormatter(formatter)
    console_handler.setFormatter(formatter)

    logger.addHandler(file_handler)
    logger.addHandler(console_handler)

    return logger

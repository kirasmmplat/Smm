"""Utilities - أدوات مساعدة"""

import re
import hashlib
from typing import List, Optional


def hash_secret(secret: str) -> str:
    """
    حساب hash للسر (لا نخزن السر الأصلي كاملاً)
    
    Args:
        secret: السر
        
    Returns:
        hash من السر
    """
    return hashlib.sha256(secret.encode()).hexdigest()


def mask_secret(secret: str, visible_chars: int = 4) -> str:
    """
    إخفاء السر مع إظهار عدد قليل من الأحرف
    
    Args:
        secret: السر
        visible_chars: عدد الأحرف المرئية
        
    Returns:
        السر المخفي
    """
    if len(secret) <= visible_chars:
        return "*" * len(secret)
    
    visible = secret[:visible_chars]
    hidden = "*" * (len(secret) - visible_chars)
    return f"{visible}{hidden}"


def extract_domain(url: str) -> Optional[str]:
    """
    استخراج النطاق من URL
    
    Args:
        url: الرابط
        
    Returns:
        النطاق أو None
    """
    try:
        # إزالة البروتوكول
        url = url.replace('http://', '').replace('https://', '')
        # الحصول على أول جزء
        domain = url.split('/')[0]
        return domain
    except Exception:
        return None


def validate_email(email: str) -> bool:
    """
    التحقق من صحة البريد الإلكتروني
    
    Args:
        email: البريد الإلكتروني
        
    Returns:
        True إذا كان صحيحاً
    """
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return re.match(pattern, email) is not None


def batch_items(items: List, batch_size: int = 100) -> List[List]:
    """
    تقسيم قائمة إلى دفعات
    
    Args:
        items: القائمة
        batch_size: حجم الدفعة
        
    Returns:
        قائمة الدفعات
    """
    return [items[i:i + batch_size] for i in range(0, len(items), batch_size)]

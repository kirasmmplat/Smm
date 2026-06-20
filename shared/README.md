"""Shared Module README"""

# Shared Module - وحدة مشتركة

وحدة مشتركة تحتوي على:

## النماذج (Models)
- `Secret` - نموذج السر
- `ScanResult` - نموذج نتيجة المسح
- `ValidationResult` - نموذج نتيجة التحقق

## قاعدة البيانات (Database)
- `DatabaseConfig` - إعدادات الاتصال
- `Database` - إدارة الاتصال
- `initialize_database()` - تهيئة قاعدة البيانات
- `get_db()` - الحصول على قاعدة البيانات

## ORM Models
- `SecretORM` - جدول الأسرار
- `ScanResultORM` - جدول نتائج المسح
- `ValidationResultORM` - جدول نتائج التحقق
- `ScanORM` - جدول المسحات

## الأدوات (Utils)
- `hash_secret()` - حساب hash للسر
- `mask_secret()` - إخفاء السر
- `extract_domain()` - استخراج النطاق
- `validate_email()` - التحقق من البريد
- `batch_items()` - تقسيم القوائم

## التسجيل (Logger)
- `setup_logger()` - إعداد نظام التسجيل

## الهجرات (Migrations)
- `Migration` - فئة الهجرة
- `create_indexes()` - إنشاء الفهارس

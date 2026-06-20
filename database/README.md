# Kashef Database Configuration

## ملف الإعدادات الرئيسي

### SQLite (محلي - للتطوير)
```python
from shared.database import DatabaseConfig, Database

config = DatabaseConfig(
    database_url="sqlite:///./kashef.db"
)
db = Database(config)
```

### Turso (الإنتاج)
```python
config = DatabaseConfig(
    turso_url="your-turso-url",
    turso_token="your-token"
)
db = Database(config)
```

## المتغيرات البيئية

```env
# SQLite (locally)
DATABASE_URL=sqlite:///./kashef.db

# أو Turso (production)
TURSO_URL=your-database-url
TURSO_TOKEN=your-auth-token
```

## الجداول

### secrets
- `id` (UUID) - المعرف الفريد
- `secret` - السر
- `service` - الخدمة (aws, openai, etc.)
- `source` - المصدر (github, pastebin)
- `url` - الرابط
- `discovered_at` - تاريخ الاكتشاف
- `validated` - هل تم التحقق
- `notified` - هل تم الإشعار
- `validated_at` - تاريخ التحقق
- `notified_at` - تاريخ الإشعار
- `metadata` - بيانات إضافية

### scan_results
- `id` (UUID)
- `scan_id` - معرف المسح
- `source` - المصدر
- `secret` - السر
- `service` - الخدمة
- `url` - الرابط
- `found_at` - تاريخ الاكتشاف
- `metadata` - بيانات إضافية

### validation_results
- `id` (UUID)
- `secret_id` - معرف السر
- `is_valid` - هل صحيح
- `service` - الخدمة
- `validated_at` - تاريخ التحقق
- `error_message` - رسالة الخطأ
- `metadata` - بيانات إضافية

### scans
- `id` (UUID)
- `source` - المصدر
- `status` - الحالة (pending, running, completed, failed)
- `started_at` - وقت البدء
- `completed_at` - وقت الانتهاء
- `total_found` - العدد المكتشف
- `metadata` - بيانات إضافية

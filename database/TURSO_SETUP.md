"""Turso Database Setup Instructions"""

# إعداد Turso

## 1. التثبيت
```bash
install the CLI from https://docs.turso.tech/cli/installation
```

## 2. إنشاء حساب
```bash
turso auth signup
```

## 3. إنشاء قاعدة بيانات
```bash
turso db create kashef
```

## 4. الحصول على بيانات الاتصال
```bash
turso db show --url kashef
turso db tokens create kashef
```

## 5. إضافة المتغيرات البيئية
```env
TURSO_URL=libsql://kashef-xxxxx.turso.io
TURSO_TOKEN=your-token-here
```

## 6. التشغيل
```bash
python database/init_db.py
```

## النسخ الاحتياطية
```bash
turso db dump kashef > kashef_backup.sql
```

## الحذف
```bash
turso db destroy kashef
```

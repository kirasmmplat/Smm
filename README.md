# كاشِف — Secrets Exposure Monitoring

مسح مستمر للإنترنت العام لاكتشاف المفاتيح والأسرار المكشوفة والتحقق من صحتها، ثم إبلاغ أصحابها.

## الهيكل
```
kashef/
├── scanner/        # محرك المسح — يزحف على الإنترنت العام
├── validator/      # التحقق من صحة المفاتيح المكتشفة
├── api/            # REST API
├── dashboard/      # لوحة التحكم
└── shared/         # أدوات مشتركة
```

## التقنيات
- Scanner & Validator: Python
- API: Python (FastAPI)
- Dashboard: React/Next.js
- Database: Turso (SQLite)

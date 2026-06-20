# محرك المسح - كاشف (Kashef Scanner Engine)

[English below]

## نظرة عامة
هذا المجلد يحتوي على محرك المسح الأساسي لمشروع "كاشف". تم تطويره بلغة Python نظراً لقوتها في التعامل مع التعبيرات النمطية (Regex) وعمليات الزحف (Crawling).

يتمثل دور هذا المحرك في:
1. البحث المستمر في مصادر الإنترنت العامة (GitHub, Pastebin حالياً) عن الأسرار والمفاتيح المسربة.
2. استخدام أنماط كشف دقيقة للتعرف على مفاتيح API لخدمات مشهورة (AWS, OpenAI, Stripe, إلخ).
3. تخزين النتائج المكتشفة في قاعدة البيانات المشتركة (`team-db`) ليقوم فريق التحقق بمراجعتها.

## هيكلة المجلد
- `main.py`: المنسق الأساسي لعمليات المسح.
- `detector.py`: يحتوي على منطق الكشف والأنماط (Regex).
- `sources/`: يحتوي على وحدات منفصلة لكل مصدر (GitHub, Pastebin).
- `requirements.txt`: المكتبات المطلوبة.

## كيفية التشغيل
للتشغيل السريع، يمكنك استخدام النص البرمجي `run.sh`:
```bash
bash scanner/run.sh
```

---

## Overview
This directory contains the core scanner engine for the "Kashef" project. It is developed in Python due to its efficiency in handling regular expressions (Regex) and crawling operations.

The engine's role is to:
1. Continuously search public internet sources (currently GitHub and Pastebin) for leaked secrets and keys.
2. Use precise detection patterns to identify API keys for popular services (AWS, OpenAI, Stripe, etc.).
3. Store discovered findings in the shared database (`team-db`) for the validation team to review.

## Directory Structure
- `main.py`: The main orchestrator for scanning operations.
- `detector.py`: Contains the detection logic and patterns (Regex).
- `sources/`: Contains separate modules for each source (GitHub, Pastebin).
- `requirements.txt`: Required Python libraries.

## How to Run
For quick execution, you can use the `run.sh` script:
```bash
bash scanner/run.sh
```

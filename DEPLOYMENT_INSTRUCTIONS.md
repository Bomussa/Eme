# 🚀 دليل النشر - MMC-MMS System

## ✅ التحديثات الرئيسية

### 1. نظام API الجديد
تم استبدال نظام Cloudflare Workers بـ **Vercel Edge Functions + Supabase**

### 2. Endpoints الجاهزة:
```
✅ GET  /api/v1/health          - Health check
✅ GET  /api/v1/status          - Simple status
✅ GET  /api/v1/maintenance     - Maintenance mode
✅ GET  /api/v1/pin/status      - PINs for all clinics
✅ GET  /api/v1/queue/status    - Queue status
✅ POST /api/v1/patient/login   - Patient registration
✅ POST /api/v1/queue/enter     - Enter queue
✅ GET  /api/v1/events/stream   - SSE events
✅ GET  /api/v1/admin/status    - Admin dashboard data
```

## 📋 متطلبات النشر

### 1. إعداد Supabase Database
قم بتشغيل Schema SQL في Supabase Dashboard:

```bash
# الملف: /app/supabase/schema.sql
```

الخطوات:
1. اذهب إلى Supabase Dashboard
2. اختر مشروعك
3. SQL Editor → New Query
4. الصق محتوى `schema.sql`
5. Run

### 2. متغيرات البيئة في Vercel

يجب إضافة المتغيرات التالية في Vercel Dashboard:

```env
# Supabase Configuration
VITE_SUPABASE_URL=https://rujwuruuosffcxazymit.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbG...  (من الصور المرفقة)
NEXT_PUBLIC_SUPABASE_URL=https://rujwuruuosffcxazymit.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbG...

# PostgreSQL (optional - for direct connection)
POSTGRES_URL=postgres://rujwuruuosffcxazymit...
POSTGRES_HOST=db.rujwuruuosffcxazymit.supabase.co
POSTGRES_USER=postgres
POSTGRES_PASSWORD=Bomussa@1984
POSTGRES_DATABASE=postgres

# Maintenance Mode (optional)
MAINTENANCE_MODE=false
```

### 3. إعدادات Vercel Project

في Vercel Dashboard → Project Settings:

**Build & Development Settings:**
- Framework Preset: `Vite`
- Build Command: `npm run build`
- Output Directory: `dist`
- Install Command: `npm install`

**Root Directory:** `/` (leave empty)

## 🔧 خطوات النشر

### الطريقة 1: النشر عبر Git (موصى به)

```bash
# 1. Commit التغييرات
cd /app
git add .
git commit -m "feat: Add Supabase API endpoints and fix all issues"
git push origin main

# 2. Vercel ينشر تلقائياً
# تابع على: https://vercel.com/dashboard
```

### الطريقة 2: النشر اليدوي عبر Vercel CLI

```bash
# 1. تثبيت Vercel CLI
npm i -g vercel

# 2. تسجيل الدخول
vercel login

# 3. النشر
cd /app
vercel --prod
```

## 🧪 الاختبار بعد النشر

```bash
# اختبار سريع
node test-live-api.js

# أو
curl https://www.mmc-mms.com/api/v1/health
curl https://www.mmc-mms.com/api/v1/pin/status
```

## 📊 التحقق من نجاح النشر

### ✅ علامات النجاح:
1. `/api/v1/health` يرجع JSON (ليس HTML)
2. `/api/v1/pin/status` يرجع PINs لجميع العيادات
3. `/api/v1/queue/status?clinic=lab` يرجع بيانات الطابور
4. Admin Panel يعرض PINs بدون أخطاء
5. Patient Login يعمل بشكل صحيح

### ❌ علامات الفشل:
1. يرجع HTML بدلاً من JSON
2. 404 على جميع الـ endpoints
3. "UPSTREAM_API_BASE not configured"

## 🔍 استكشاف الأخطاء

### المشكلة: 404 على جميع API endpoints
**الحل:**
- تأكد من أن ملفات `/api/v1/*.ts` موجودة في المشروع
- تحقق من `vercel.json` و settings في Vercel Dashboard
- أعد بناء ونشر المشروع

### المشكلة: "Supabase configuration missing"
**الحل:**
- تأكد من إضافة متغيرات البيئة في Vercel
- اسم المتغيرات يجب أن يكون بالضبط كما هو مكتوب

### المشكلة: Database errors
**الحل:**
- تأكد من تشغيل schema.sql في Supabase
- تحقق من صحة connection string

## 📞 الدعم

في حالة وجود مشاكل:
1. تحقق من Vercel Deployment Logs
2. تحقق من Supabase Database Logs
3. جرب الاختبار المحلي أولاً

## ✨ الميزات الجديدة

### 1. نظام PIN محسّن
- توليد تلقائي لـ PINs
- تخزين في Supabase
- تحديث يومي

### 2. نظام Queue محسّن
- عرض ديناميكي للموقع
- أرقام ثابتة في DB
- إشعارات لحظية

### 3. المسارات الديناميكية
- حساب حسب الأوزان
- sticky routing
- تخزين في Supabase

---

**آخر تحديث:** 7 ديسمبر 2025
**الحالة:** ✅ جاهز للنشر

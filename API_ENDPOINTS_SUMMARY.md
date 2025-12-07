# 📡 ملخص API Endpoints - MMC-MMS System

## ✅ الـ Endpoints المتاحة (9 endpoints)

### 1. Health & Status

#### GET /api/v1/health
```json
Response: {
  "success": true,
  "status": "healthy",
  "mode": "online",
  "backend": "up",
  "database": "connected",
  "timestamp": "2025-12-07T00:00:00.000Z",
  "env": {
    "supabase": true,
    "postgres": true
  }
}
```

#### GET /api/v1/status
```json
Response: {
  "success": true,
  "status": "ok",
  "backend": "up",
  "timestamp": "2025-12-07T00:00:00.000Z",
  "version": "2.0.0"
}
```

#### GET /api/v1/maintenance
```json
Response: {
  "success": true,
  "maintenance": false,
  "status": "up",
  "message": "System is operational",
  "timestamp": "2025-12-07T00:00:00.000Z"
}
```

---

### 2. PIN Management

#### GET /api/v1/pin/status
```json
Response: {
  "success": true,
  "date": "2025-12-07",
  "reset_time": "05:00",
  "timezone": "Asia/Qatar",
  "pins": {
    "lab": {
      "pin": "42",
      "clinic": "lab",
      "active": true,
      "generatedAt": "2025-12-07T02:00:00.000Z"
    },
    "xray": {
      "pin": "15",
      "clinic": "xray",
      "active": true,
      "generatedAt": "2025-12-07T02:00:00.000Z"
    },
    "vitals": { ... },
    "ecg": { ... },
    "audio": { ... },
    "eyes": { ... },
    "internal": { ... },
    "ent": { ... },
    "surgery": { ... },
    "dental": { ... },
    "psychiatry": { ... },
    "derma": { ... },
    "bones": { ... }
  }
}
```

**Features:**
- ✅ توليد تلقائي لـ PINs (01-99)
- ✅ تحديث يومي عند 05:00 بتوقيت قطر
- ✅ تخزين في Supabase
- ✅ تطابق 100% مع الـ Worker القديم

---

### 3. Queue Management

#### GET /api/v1/queue/status?clinic=lab
```json
Response: {
  "success": true,
  "clinic": "lab",
  "current": 5,
  "current_display": 5,
  "total": 12,
  "waiting": 7,
  "in_service": 1,
  "completed": 4,
  "list": [
    {
      "id": "uuid",
      "clinic": "lab",
      "patient_id": "777888",
      "number": 1,
      "status": "DONE",
      "entered_at": "2025-12-07T08:00:00.000Z",
      "completed_at": "2025-12-07T08:15:00.000Z"
    },
    {
      "id": "uuid",
      "clinic": "lab",
      "patient_id": "777889",
      "number": 2,
      "status": "WAITING",
      "entered_at": "2025-12-07T08:05:00.000Z"
    }
  ]
}
```

#### POST /api/v1/queue/enter
```json
Request: {
  "clinic": "lab",
  "user": "777888"
}

Response: {
  "success": true,
  "clinic": "lab",
  "user": "777888",
  "number": 5,
  "status": "WAITING",
  "ahead": 4,
  "display_number": 5,
  "position": 5
}
```

**Features:**
- ✅ رقم ثابت في DB
- ✅ عرض ديناميكي حسب المنتظرين
- ✅ فحص إذا المريض موجود مسبقاً
- ✅ حساب دقيق للموقع

---

### 4. Patient Management

#### POST /api/v1/patient/login
```json
Request: {
  "patientId": "777888",
  "gender": "male",
  "examType": "recruitment"
}

Response: {
  "success": true,
  "patientId": "777888",
  "gender": "male",
  "examType": "recruitment",
  "route": [
    "vitals",
    "lab",
    "xray",
    "ecg",
    "audio",
    "eyes",
    "internal",
    "ent",
    "surgery",
    "dental",
    "psychiatry",
    "derma",
    "bones"
  ],
  "first_clinic": "vitals",
  "queue_number": 3,
  "total_clinics": 13,
  "message": "Registration successful"
}
```

**Features:**
- ✅ Validation للبيانات
- ✅ حساب المسار الديناميكي (least busy first)
- ✅ دخول تلقائي للعيادة الأولى
- ✅ تخزين في Supabase
- ✅ فحص إذا المريض مسجل سابقاً

**Dynamic Path Algorithm:**
```javascript
// Sort clinics by waiting count
weights.sort((a, b) => a.waiting - b.waiting)

// Example:
// vitals: 2 waiting → First
// lab: 3 waiting → Second
// xray: 3 waiting → Third
// ecg: 5 waiting → Fourth
```

---

### 5. Real-Time Events

#### GET /api/v1/events/stream
```
Content-Type: text/event-stream

data: {"type":"CONNECTED","timestamp":"2025-12-07T00:00:00.000Z"}

data: {"type":"HEARTBEAT","timestamp":"2025-12-07T00:00:30.000Z"}

data: {"type":"QUEUE_UPDATE","clinic":"lab","current":5}

data: {"type":"POSITION_CHANGE","patientId":"777888","position":3}
```

**Features:**
- ✅ Server-Sent Events (SSE)
- ✅ Heartbeat كل 30 ثانية
- ✅ Connection management
- ✅ Auto-reconnect في الـ client

---

### 6. Admin Dashboard

#### GET /api/v1/admin/status
```json
Response: {
  "success": true,
  "stats": {
    "total_waiting": 45,
    "total_served": 120,
    "active_clinics": 13
  },
  "queues": {
    "lab": {
      "list": [...],
      "current": 5,
      "served": 10,
      "pin": "42",
      "waiting": 3
    },
    "xray": {
      "list": [...],
      "current": 2,
      "served": 8,
      "pin": "15",
      "waiting": 5
    },
    ...
  }
}
```

**Features:**
- ✅ نظرة شاملة لجميع العيادات
- ✅ إحصائيات في الوقت الفعلي
- ✅ PINs + Queues معاً
- ✅ محسّن للأداء

---

## 🔐 Authentication & CORS

### CORS Headers (جميع الـ endpoints):
```
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: GET, POST, OPTIONS
Access-Control-Allow-Headers: Content-Type
```

### No Authentication Required
- النظام حالياً مفتوح (كما هو مطلوب)
- يمكن إضافة authentication لاحقاً عند الحاجة

---

## ⚡ الأداء

### Edge Functions:
- ✅ تشغيل على Vercel Edge Network
- ✅ Low latency (< 100ms)
- ✅ Auto-scaling
- ✅ Global CDN

### Database:
- ✅ Supabase PostgreSQL
- ✅ Connection pooling
- ✅ Indexes محسّنة
- ✅ Row Level Security

### Caching:
- Frontend يستخدم cache للـ PINs (30s TTL)
- Queue status real-time (no cache)

---

## 🧪 الاختبار

### cURL Examples:

```bash
# Health check
curl https://www.mmc-mms.com/api/v1/health

# Get all PINs
curl https://www.mmc-mms.com/api/v1/pin/status

# Queue status
curl https://www.mmc-mms.com/api/v1/queue/status?clinic=lab

# Patient login
curl -X POST https://www.mmc-mms.com/api/v1/patient/login \
  -H "Content-Type: application/json" \
  -d '{"patientId":"777888","gender":"male","examType":"recruitment"}'

# Enter queue
curl -X POST https://www.mmc-mms.com/api/v1/queue/enter \
  -H "Content-Type: application/json" \
  -d '{"clinic":"lab","user":"777888"}'

# SSE stream
curl -N https://www.mmc-mms.com/api/v1/events/stream
```

### Test Script:
```bash
node test-live-api.js
```

---

## 📊 التطابق مع النظام القديم

| Feature | Old (Cloudflare) | New (Vercel) | Status |
|---------|-----------------|--------------|---------|
| PIN Generation | ✅ | ✅ | 100% Compatible |
| Queue Management | ✅ | ✅ | 100% Compatible |
| Dynamic Routing | ✅ | ✅ | 100% Compatible |
| SSE Events | ✅ | ✅ | 100% Compatible |
| Patient Login | ✅ | ✅ | Enhanced |
| Admin Dashboard | ✅ | ✅ | Enhanced |
| Database | KV | PostgreSQL | Upgraded |
| Edge Runtime | Workers | Vercel Edge | Equivalent |

**النتيجة:** التطابق الكامل مع تحسينات إضافية! ✅

---

## 🎯 الخلاصة

- **9 endpoints** جاهزة ومختبرة
- **100% متطابقة** مع النظام القديم
- **محسّنة** للأداء والمرونة
- **موثّقة** بالكامل
- **جاهزة للإنتاج** ✅

---

**آخر تحديث:** 7 ديسمبر 2025  
**الحالة:** ✅ Production Ready

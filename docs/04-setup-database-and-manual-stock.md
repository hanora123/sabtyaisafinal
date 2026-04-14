# إعداد قاعدة البيانات من الصفر + إدخال المخزون يدويًا

## 1) إنشاء قاعدة بيانات PostgreSQL
قم بإنشاء قاعدة بيانات جديدة (مثال: `alhanora_trading`).

## 2) ضبط الاتصال في الـBackend
افتح الملف:
- `backend/.env`

وضع قيمة صحيحة لـ `DATABASE_URL` مثل:
- `postgresql://USER:PASSWORD@localhost:5432/alhanora_trading?schema=public`

## 3) إنشاء الجداول (Prisma)
من داخل مجلد `backend`:
- `npx prisma migrate dev --name init`

هذا ينشئ كل الجداول بناءً على `backend/prisma/schema.prisma`.

## 4) تشغيل الخادم
من داخل `backend`:
- `npm run start:dev`

المسارات تكون تحت:
- `/v1`

## 5) تهيئة أولية (مطلوب مرة واحدة)
1) إنشاء Admin (مرة واحدة فقط إذا كانت قاعدة البيانات فارغة):
- `POST /v1/auth/seed-default-admin`

2) إنشاء الحسابات الافتراضية للمحاسبة:
- `POST /v1/accounting/seed-default-accounts`

3) إنشاء المخازن الافتراضية:
- `POST /v1/inventories/seed-default`

## 6) إدخال المخزون يدويًا (لأن النظام ورقي حاليًا)
### الطريقة (A): من لوحة الإدارة/أدوات API
1) أنشئ المنتج:
- `POST /v1/products`

2) أضف كمية للمخزون:
- `POST /v1/inventories/:inventoryId/stock/add`

### الطريقة (B): من شاشة نقطة البيع (أسرع)
في صفحة نقطة البيع يوجد قسم:
- **إنشاء صنف جديد**

اختر **كمية مبدئية للمخزون** ثم اضغط:
- **إنشاء وإضافة للسلة**

هذا ينشئ المنتج + يضيف الكمية للمخزون المحدد مباشرة.


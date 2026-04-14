# النور للتجارة (واجهة ويب فقط)

هيكل جاهز لتطبيق ويب يشمل:
- واجهة نقطة البيع (POS / Checkout)
- بنية الخادم لإدارة مخزون متعدد
- بنية الخادم للمحاسبة بقيد مزدوج + التقارير

## التوثيق
- [المتطلبات الوظيفية](docs/01-functional-requirements.md)
- [المتطلبات غير الوظيفية](docs/02-non-functional-requirements.md)
- [منطق العمل ووحدات النظام](docs/03-business-logic-and-modules.md)
- [إعداد قاعدة البيانات وإدخال المخزون يدويًا](docs/04-setup-database-and-manual-stock.md)

## التشغيل محليًا (local dev)
الخادم (Backend):
- `cd backend`
- `npm install`
- `npm run start:dev`

الواجهة (Frontend):
- `cd frontend`
- `npm install`
- `npm run dev`

مسار الخادم الأساسي هو `/v1`.
الواجهة حاليًا لا تستدعي أي APIs (صفحات POS/الإدارة/تسجيل الدخول هي واجهات تجريبية فقط).


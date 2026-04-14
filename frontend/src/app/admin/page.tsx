export default function AdminPage() {
  return (
    <div style={{ maxWidth: 1120, margin: "0 auto", padding: 16 }}>
      <h1 style={{ marginBottom: 12 }}>لوحة الإدارة - الحنوره للتجارة (واجهة تجريبية)</h1>
      <p style={{ marginBottom: 18, color: "rgba(0,0,0,0.65)" }}>
        هذه الصفحة هي هيكل جاهز للوحات: المنتجات/المخزون/المبيعات/المحاسبة.
        الخطوة التالية: ربطها بواجهات الخادم (APIs).
      </p>

      <div
        style={{
          display: "grid",
          gap: 12,
          gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
        }}
      >
        <section style={{ border: "1px solid var(--border)", borderRadius: 14, padding: 14, background: "var(--surface)" }}>
          <div style={{ fontWeight: 800, marginBottom: 6 }}>المنتجات</div>
          <div style={{ color: "rgba(0,0,0,0.65)", fontSize: 13 }}>
            إنشاء/تعديل/تعطيل، التصنيفات، الموردين، تعطيل المنتجات بدل الحذف،
            استيراد/تصدير جماعي.
          </div>
          <div style={{ marginTop: 10, display: "flex", gap: 10, flexWrap: "wrap" }}>
            <a className="pill-link" href="/admin/products">المنتجات</a>
          </div>
        </section>

        <section style={{ border: "1px solid var(--border)", borderRadius: 14, padding: 14, background: "var(--surface)" }}>
          <div style={{ fontWeight: 800, marginBottom: 6 }}>الموردين / العملاء</div>
          <div style={{ color: "rgba(0,0,0,0.65)", fontSize: 13 }}>
            إضافة الموردين والعملاء لاستخدامهم في التوريد وعروض الأسعار وكشف الحساب.
          </div>
          <div style={{ marginTop: 10, display: "flex", gap: 10, flexWrap: "wrap" }}>
            <a className="pill-link" href="/admin/suppliers">الموردين</a>
            <a className="pill-link" href="/admin/customers">العملاء</a>
          </div>
        </section>

        <section style={{ border: "1px solid var(--border)", borderRadius: 14, padding: 14, background: "var(--surface)" }}>
          <div style={{ fontWeight: 800, marginBottom: 6 }}>المخزون</div>
          <div style={{ color: "rgba(0,0,0,0.65)", fontSize: 13 }}>
            مخزون متعدد، حركات المخزون، التحويلات، المخزون المحجوز، تنبيهات
            نقص المخزون.
          </div>
          <div style={{ marginTop: 10 }}>
            <a
              href="/admin/inventory"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "10px 12px",
                borderRadius: 12,
                background: "linear-gradient(135deg, var(--brand-blue), var(--brand-green))",
                color: "#fff",
                fontWeight: 900,
              }}
            >
              إدخال المخزون يدويًا
            </a>
          </div>
        </section>

        <section style={{ border: "1px solid var(--border)", borderRadius: 14, padding: 14, background: "var(--surface)" }}>
          <div style={{ fontWeight: 800, marginBottom: 6 }}>التوريد</div>
          <div style={{ color: "rgba(0,0,0,0.65)", fontSize: 13 }}>
            تسجيل عمليات التوريد من الموردين وزيادة المخزون وإنشاء القيود المحاسبية.
          </div>
          <div style={{ marginTop: 10 }}>
            <a
              href="/admin/purchases"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "10px 12px",
                borderRadius: 12,
                background: "linear-gradient(135deg, var(--brand-blue), var(--brand-green))",
                color: "#fff",
                fontWeight: 900,
              }}
            >
              إنشاء توريد
            </a>
          </div>
        </section>

        <section style={{ border: "1px solid var(--border)", borderRadius: 14, padding: 14, background: "var(--surface)" }}>
          <div style={{ fontWeight: 800, marginBottom: 6 }}>عروض الأسعار</div>
          <div style={{ color: "rgba(0,0,0,0.65)", fontSize: 13 }}>
            إنشاء عروض أسعار بسرعة وإرسالها للعميل.
          </div>
          <div style={{ marginTop: 10 }}>
            <a className="pill-link" href="/admin/quotes">فتح عروض الأسعار</a>
          </div>
        </section>

        <section style={{ border: "1px solid var(--border)", borderRadius: 14, padding: 14, background: "var(--surface)" }}>
          <div style={{ fontWeight: 800, marginBottom: 6 }}>كشف الحساب</div>
          <div style={{ color: "rgba(0,0,0,0.65)", fontSize: 13 }}>
            كشف حساب مورد/عميل (توريدات/سداد) و(مبيعات/تحصيل).
          </div>
          <div style={{ marginTop: 10 }}>
            <a className="pill-link" href="/admin/statements">فتح كشف الحساب</a>
          </div>
        </section>

        <section style={{ border: "1px solid var(--border)", borderRadius: 14, padding: 14, background: "var(--surface)" }}>
          <div style={{ fontWeight: 800, marginBottom: 6 }}>المبيعات</div>
          <div style={{ color: "rgba(0,0,0,0.65)", fontSize: 13 }}>
            تسجيل المبيعات، المرتجعات/استرداد المبالغ، ملخص يومي، قيود محاسبية.
          </div>
          <div style={{ marginTop: 10 }}>
            <a className="pill-link" href="/admin/sales">سجل المبيعات</a>
          </div>
        </section>

        <section style={{ border: "1px solid var(--border)", borderRadius: 14, padding: 14, background: "var(--surface)" }}>
          <div style={{ fontWeight: 800, marginBottom: 6 }}>المحاسبة</div>
          <div style={{ color: "rgba(0,0,0,0.65)", fontSize: 13 }}>
            محاسبة قيد مزدوج، دليل الحسابات، قائمة الأرباح والخسائر، الميزانية،
            التدفقات النقدية.
          </div>
          <div style={{ marginTop: 10 }}>
            <a className="pill-link" href="/admin/accounting">ميزان المراجعة</a>
          </div>
        </section>

        <section style={{ border: "1px solid var(--border)", borderRadius: 14, padding: 14, background: "var(--surface)" }}>
          <div style={{ fontWeight: 800, marginBottom: 6 }}>التقارير</div>
          <div style={{ color: "rgba(0,0,0,0.65)", fontSize: 13 }}>
            تحليلات الإيرادات/الأرباح، أفضل المنتجات، تقارير حركة المخزون.
          </div>
          <div style={{ marginTop: 10 }}>
            <a className="pill-link" href="/admin/reporting">فتح التقارير</a>
          </div>
        </section>

        <section style={{ border: "1px solid var(--border)", borderRadius: 14, padding: 14, background: "var(--surface)" }}>
          <div style={{ fontWeight: 800, marginBottom: 6 }}>الإشعارات</div>
          <div style={{ color: "rgba(0,0,0,0.65)", fontSize: 13 }}>
            تنبيهات نقص المخزون، مستحقات الموردين، ملخص يومي.
          </div>
          <div style={{ marginTop: 10 }}>
            <a className="pill-link" href="/admin/notifications">فتح الإشعارات</a>
          </div>
        </section>

        <section style={{ border: "1px solid var(--border)", borderRadius: 14, padding: 14, background: "var(--surface)" }}>
          <div style={{ fontWeight: 800, marginBottom: 6 }}>المستخدمين</div>
          <div style={{ color: "rgba(0,0,0,0.65)", fontSize: 13 }}>
            إدارة حسابات المستخدمين، الأدوار، الصلاحيات.
          </div>
          <div style={{ marginTop: 10 }}>
            <a className="pill-link" href="/admin/users">إدارة المستخدمين</a>
          </div>
        </section>

        <section style={{ border: "1px solid var(--border)", borderRadius: 14, padding: 14, background: "var(--surface)" }}>
          <div style={{ fontWeight: 800, marginBottom: 6 }}>سجل النظام</div>
          <div style={{ color: "rgba(0,0,0,0.65)", fontSize: 13 }}>
            مراقبة جميع العمليات، أحداث الدخول، التعديلات الحساسة.
          </div>
          <div style={{ marginTop: 10 }}>
            <a className="pill-link" href="/admin/audit">عرض السجلات</a>
          </div>
        </section>
      </div>
    </div>
  );
}


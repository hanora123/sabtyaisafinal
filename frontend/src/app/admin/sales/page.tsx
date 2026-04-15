"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Sale = {
  id: string;
  saleNumber: string;
  grandTotal: number;
  status: string;
  soldAt: string;
  customer?: { name: string };
  cashier?: { fullName: string };
  inventory?: { name: string };
};

export default function SalesPage() {
  const router = useRouter();
  const apiBase = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

  const [sales, setSales] = useState<Sale[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  async function loadSales() {
    setIsLoading(true);
    try {
      const res = await fetch(`${apiBase}/v1/sales`, { credentials: "include" });
      if (res.status === 401) {
        router.push("/login");
        return;
      }
      if (res.ok) {
        const data = await res.json();
        setSales(data);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadSales();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function voidSale(id: string) {
    if (!confirm("هل أنت متأكد من إلغاء هذه العملية؟ لا يمكن التراجع عن ذلك.")) return;
    try {
      const res = await fetch(`${apiBase}/v1/sales/${id}/void`, {
        method: "POST",
        credentials: "include",
      });
      if (res.ok) {
        alert("تم إلغاء العملية بنجاح");
        loadSales();
      } else {
        const err = await res.text();
        alert("فشل الإلغاء: " + err);
      }
    } catch (error) {
      console.error(error);
    }
  }

  return (
    <div style={{ maxWidth: 1120, margin: "0 auto", padding: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <h1>سجل المبيعات</h1>
      </div>

      <div style={{ marginBottom: 16 }}>
        <a href="/admin" style={{ color: "var(--brand-blue)", textDecoration: "none" }}>&larr; العودة للوحة الإدارة</a>
      </div>

      {isLoading ? (
        <p>جاري تحميل البيانات...</p>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 800 }}>
            <thead>
              <tr style={{ background: "var(--surface-2)", textAlign: "right" }}>
                <th style={{ padding: 12, borderBottom: "2px solid var(--border)" }}>رقم الفاتورة</th>
                <th style={{ padding: 12, borderBottom: "2px solid var(--border)" }}>التاريخ</th>
                <th style={{ padding: 12, borderBottom: "2px solid var(--border)" }}>العميل</th>
                <th style={{ padding: 12, borderBottom: "2px solid var(--border)" }}>الإجمالي</th>
                <th style={{ padding: 12, borderBottom: "2px solid var(--border)" }}>الحالة</th>
                <th style={{ padding: 12, borderBottom: "2px solid var(--border)" }}>إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {sales.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: 16, textAlign: "center", color: "rgba(0,0,0,0.5)" }}>
                    لا توجد عمليات بيع حالياً.
                  </td>
                </tr>
              ) : (
                sales.map(s => (
                  <tr key={s.id} style={{ borderBottom: "1px solid var(--border)", opacity: s.status === 'VOIDED' ? 0.6 : 1 }}>
                    <td style={{ padding: 12, fontWeight: 500 }}>{s.saleNumber}</td>
                    <td style={{ padding: 12 }}>{new Date(s.soldAt).toLocaleString('ar-EG')}</td>
                    <td style={{ padding: 12 }}>{s.customer?.name || "عميل نقدي"}</td>
                    <td style={{ padding: 12 }}>{Number(s.grandTotal).toFixed(2)}</td>
                    <td style={{ padding: 12 }}>
                      <span style={{
                        padding: "2px 8px",
                        borderRadius: 4,
                        fontSize: 12,
                        background: s.status === 'COMPLETED' ? "#e6f4ea" : s.status === 'VOIDED' ? "#fce8e6" : "#fef7e0",
                        color: s.status === 'COMPLETED' ? "#1e8e3e" : s.status === 'VOIDED' ? "#d93025" : "#f29900"
                      }}>
                        {s.status === 'COMPLETED' ? "مكتمل" : s.status === 'VOIDED' ? "ملغي" : s.status}
                      </span>
                    </td>
                    <td style={{ padding: 12, display: "flex", gap: 8 }}>
                      {s.status === 'COMPLETED' && (
                        <button onClick={() => voidSale(s.id)} style={{ cursor: "pointer", padding: "4px 8px", borderRadius: 4, border: "none", background: "#fee", color: "#c00" }}>
                          إلغاء
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

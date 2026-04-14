"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type SalesReport = {
  count: number;
  revenue: number;
  cost: number;
  profit: number;
};

type StockReport = {
  totalValuation: number;
  items: any[];
};

export default function ReportingPage() {
  const router = useRouter();
  const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3000";

  const [salesReport, setSalesReport] = useState<SalesReport | null>(null);
  const [stockReport, setStockReport] = useState<StockReport | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  async function loadData() {
    setIsLoading(true);
    try {
      const [salesRes, stockRes] = await Promise.all([
        fetch(`${apiBase}/v1/reporting/sales`, { credentials: "include" }),
        fetch(`${apiBase}/v1/reporting/stock`, { credentials: "include" }),
      ]);

      if (salesRes.status === 401 || stockRes.status === 401) {
        router.push("/login");
        return;
      }

      if (salesRes.ok) setSalesReport(await salesRes.json());
      if (stockRes.ok) setStockReport(await stockRes.json());
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div style={{ maxWidth: 1120, margin: "0 auto", padding: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <h1>التقارير والتحليلات</h1>
      </div>

      <div style={{ marginBottom: 16 }}>
        <a href="/admin" style={{ color: "var(--brand-blue)", textDecoration: "none" }}>&larr; العودة للوحة الإدارة</a>
      </div>

      {isLoading ? (
        <p>جاري تحميل البيانات...</p>
      ) : (
        <div style={{ display: "grid", gap: 16, gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))" }}>
          <section style={{ border: "1px solid var(--border)", borderRadius: 14, padding: 20, background: "var(--surface)" }}>
            <h2 style={{ marginBottom: 16 }}>ملخص المبيعات (الكل)</h2>
            <div style={{ display: "grid", gap: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span>عدد العمليات:</span>
                <span style={{ fontWeight: "bold" }}>{salesReport?.count || 0}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span>إجمالي الإيرادات:</span>
                <span style={{ fontWeight: "bold", color: "var(--brand-blue)" }}>{Number(salesReport?.revenue || 0).toFixed(2)}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span>إجمالي التكلفة:</span>
                <span style={{ fontWeight: "bold" }}>{Number(salesReport?.cost || 0).toFixed(2)}</span>
              </div>
              <hr style={{ border: "none", borderTop: "1px solid var(--border)" }} />
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 18 }}>
                <span>صافي الربح:</span>
                <span style={{ fontWeight: "bold", color: "var(--brand-green)" }}>{Number(salesReport?.profit || 0).toFixed(2)}</span>
              </div>
            </div>
          </section>

          <section style={{ border: "1px solid var(--border)", borderRadius: 14, padding: 20, background: "var(--surface)" }}>
            <h2 style={{ marginBottom: 16 }}>ملخص المخزون</h2>
            <div style={{ display: "grid", gap: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span>عدد الأصناف في المخزن:</span>
                <span style={{ fontWeight: "bold" }}>{stockReport?.items?.length || 0}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span>إجمالي قيمة المخزون (تكلفة):</span>
                <span style={{ fontWeight: "bold", color: "var(--brand-blue)" }}>{Number(stockReport?.totalValuation || 0).toFixed(2)}</span>
              </div>
            </div>
            <div style={{ marginTop: 20 }}>
              <a href="/admin/inventory" className="pill-link">إدارة المخزون تفصيلياً</a>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function StatementsPage() {
  const router = useRouter();
  const apiBase = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

  const [type, setType] = useState<"supplier" | "customer">("supplier");
  const [list, setList] = useState<any[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [statement, setStatement] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function loadList() {
    try {
      const endpoint = type === "supplier" ? "suppliers" : "customers";
      const resp = await fetch(`${apiBase}/v1/${endpoint}`, { credentials: "include" });
      if (resp.ok) setList(await resp.json());
    } catch (e) { console.error(e); }
  }

  async function loadStatement() {
    if (!selectedId) return;
    setIsLoading(true);
    try {
      const endpoint = type === "supplier" ? `accounting/suppliers/${selectedId}/statement` : `accounting/customers/${selectedId}/statement`;
      const resp = await fetch(`${apiBase}/v1/${endpoint}`, { credentials: "include" });
      if (resp.ok) setStatement(await resp.json());
    } catch (e) { console.error(e); }
    finally { setIsLoading(false); }
  }

  useEffect(() => { loadList(); setStatement(null); setSelectedId(""); }, [type]);
  useEffect(() => { loadStatement(); }, [selectedId]);

  const formatCur = (n: number) => new Intl.NumberFormat("ar-SA", { style: "currency", currency: "SAR" }).format(n);

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: 16, direction: "rtl" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <h1 style={{ margin: 0 }}>كشف الحساب</h1>
        <button onClick={() => router.push("/admin")} style={{ padding: "8px 16px", borderRadius: 10, cursor: "pointer", border: "1px solid var(--border)", background: "var(--surface)" }}>
          العودة للوحة الإدارة
        </button>
      </div>

      <div style={{ background: "var(--surface)", padding: 20, borderRadius: 12, border: "1px solid var(--border)", marginBottom: 20 }}>
        <div style={{ display: "flex", gap: 20, alignItems: "center" }}>
          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={() => setType("supplier")} style={{ padding: "8px 16px", borderRadius: 8, border: "none", background: type === "supplier" ? "var(--brand-blue)" : "var(--surface-2)", color: type === "supplier" ? "#fff" : "inherit", cursor: "pointer" }}>موردين</button>
            <button onClick={() => setType("customer")} style={{ padding: "8px 16px", borderRadius: 8, border: "none", background: type === "customer" ? "var(--brand-blue)" : "var(--surface-2)", color: type === "customer" ? "#fff" : "inherit", cursor: "pointer" }}>عملاء</button>
          </div>
          
          <select value={selectedId} onChange={(e) => setSelectedId(e.target.value)} style={{ padding: 10, borderRadius: 8, flex: 1 }}>
            <option value="">-- اختر {type === "supplier" ? "المورد" : "العميل"} --</option>
            {list.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}
          </select>

          {statement && (
             <button onClick={() => window.print()} style={{ padding: "10px 20px", borderRadius: 10, background: "#000", color: "#fff", cursor: "pointer" }}>طباعة كشف الحساب</button>
          )}
        </div>
      </div>

      {isLoading ? (
        <div style={{ textAlign: "center", padding: 40 }}>جاري تحميل الكشف...</div>
      ) : statement ? (
        <div id="print-area" style={{ background: "#fff", padding: 30, borderRadius: 12, border: "1px solid var(--border)" }}>
          <div style={{ textAlign: "center", marginBottom: 30 }}>
            <h2 style={{ margin: 0 }}>كشف حساب تفصيلي</h2>
            <div style={{ marginTop: 10 }}>{type === "supplier" ? "المورد" : "العميل"}: {list.find(l => l.id === selectedId)?.name}</div>
            <div style={{ fontSize: 13, color: "#666" }}>تاريخ الاستخراج: {new Date().toLocaleString("ar-SA")}</div>
          </div>

          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#f8f9fa", borderBottom: "2px solid #dee2e6", textAlign: "right" }}>
                <th style={{ padding: 12 }}>التاريخ</th>
                <th style={{ padding: 12 }}>العملية</th>
                <th style={{ padding: 12 }}>المرجع</th>
                <th style={{ padding: 12 }}>المبلغ</th>
                <th style={{ padding: 12 }}>الرصيد المتراكم</th>
              </tr>
            </thead>
            <tbody>
              {statement.rows.map((row: any, idx: number) => (
                <tr key={idx} style={{ borderBottom: "1px solid #eee" }}>
                  <td style={{ padding: 12 }}>{new Date(row.date).toLocaleDateString("ar-SA")}</td>
                  <td style={{ padding: 12 }}>{row.type === 'PURCHASE' ? 'فاتورة مشتريات' : row.type === 'SALE' ? 'فاتورة مبيعات' : 'سند صرف/قبض'}</td>
                  <td style={{ padding: 12 }}>{row.reference}</td>
                  <td style={{ padding: 12, color: row.impact === 'DEBT' ? 'red' : 'green' }}>
                    {row.impact === 'DEBT' ? '+' : '-'} {formatCur(row.amount)}
                  </td>
                  <td style={{ padding: 12, fontWeight: 700 }}>{formatCur(row.balance)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div style={{ marginTop: 30, textAlign: "left", padding: 20, background: "#f8f9fa", borderRadius: 10 }}>
            <span style={{ fontSize: 18, fontWeight: 800 }}>الرصيد النهائي المستحق: {formatCur(statement.finalBalance)}</span>
          </div>
        </div>
      ) : (
        <div style={{ textAlign: "center", color: "#666", padding: 40 }}>يرجى اختيار اسم لعرض كشف الحساب</div>
      )}

      <style jsx global>{`
        @media print {
          body * { visibility: hidden; }
          #print-area, #print-area * { visibility: visible; }
          #print-area { position: absolute; left: 0; top: 0; width: 100%; }
        }
      `}</style>
    </div>
  );
}

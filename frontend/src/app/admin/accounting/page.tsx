"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type ReportType = "trial" | "pnl" | "balance" | "journals" | "vat";

export default function AccountingReportsPage() {
  const router = useRouter();
  const apiBase = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

  const [activeReport, setActiveReport] = useState<ReportType>("trial");
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  async function fetchReport() {
    setIsLoading(true);
    try {
      let endpoint = "";
      if (activeReport === "trial") endpoint = "trial-balance";
      else if (activeReport === "pnl") endpoint = `income-statement?startDate=${startDate}&endDate=${endDate}`;
      else if (activeReport === "balance") endpoint = `balance-sheet?date=${endDate}`;

      const resp = await fetch(`${apiBase}/v1/accounting/${endpoint}`, {
        credentials: "include",
      });

      if (resp.status === 401) {
        router.push("/login");
        return;
      }

      if (resp.ok) {
        const json = await resp.json();
        setData(json);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    fetchReport();
  }, [activeReport, startDate, endDate]);

  const formatCur = (n: number) => new Intl.NumberFormat("ar-SA", { style: "currency", currency: "SAR" }).format(n);

  return (
    <div style={{ maxWidth: 1120, margin: "0 auto", padding: 16, direction: "rtl" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <h1 style={{ margin: 0 }}>التقارير المحاسبية</h1>
        <button 
          onClick={() => router.push("/admin")}
          style={{ padding: "8px 16px", borderRadius: 10, cursor: "pointer", border: "1px solid var(--border)", background: "var(--surface)" }}
        >
          العودة للوحة الإدارة
        </button>
      </div>

      <div style={{ display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap" }}>
        <button 
          onClick={() => setActiveReport("trial")}
          style={{ padding: "10px 20px", borderRadius: 10, cursor: "pointer", background: activeReport === "trial" ? "var(--brand-blue)" : "var(--surface)", color: activeReport === "trial" ? "#fff" : "inherit" }}
        >
          ميزان المراجعة
        </button>
        <button 
          onClick={() => setActiveReport("pnl")}
          style={{ padding: "10px 20px", borderRadius: 10, cursor: "pointer", background: activeReport === "pnl" ? "var(--brand-blue)" : "var(--surface)", color: activeReport === "pnl" ? "#fff" : "inherit" }}
        >
          قائمة الأرباح والخسائر
        </button>
        <button 
          onClick={() => setActiveReport("balance")}
          style={{ padding: "10px 20px", borderRadius: 10, cursor: "pointer", background: activeReport === "balance" ? "var(--brand-blue)" : "var(--surface)", color: activeReport === "balance" ? "#fff" : "inherit" }}
        >
          الميزانية العمومية
        </button>
        <button 
          onClick={() => setActiveReport("journals")}
          style={{ padding: "10px 20px", borderRadius: 10, cursor: "pointer", background: activeReport === "journals" ? "var(--brand-blue)" : "var(--surface)", color: activeReport === "journals" ? "#fff" : "inherit" }}
        >
          القيود اليومية
        </button>
      </div>

      {(activeReport === "pnl" || activeReport === "balance" || activeReport === "journals") && (
        <div style={{ display: "flex", gap: 10, marginBottom: 20, alignItems: "center", background: "var(--surface-2)", padding: 15, borderRadius: 12 }}>
          {(activeReport === "pnl" || activeReport === "journals") && (
            <>
              <label>من: </label>
              <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} style={{ padding: 8, borderRadius: 8, border: "1px solid var(--border)" }} />
            </>
          )}
          <label>{activeReport === "balance" ? "بتاريخ: " : "إلى: "}</label>
          <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} style={{ padding: 8, borderRadius: 8, border: "1px solid var(--border)" }} />
        </div>
      )}

      <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, padding: 20 }}>
        {isLoading ? (
          <div style={{ textAlign: "center", padding: 40 }}>جاري تحميل التقرير...</div>
        ) : !data ? (
          <div style={{ textAlign: "center", padding: 40 }}>لا توجد بيانات متاحة</div>
        ) : (
          <>
            {activeReport === "trial" && (
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ borderBottom: "2px solid var(--border)", textAlign: "right" }}>
                    <th style={{ padding: 12 }}>كود الحساب</th>
                    <th style={{ padding: 12 }}>اسم الحساب</th>
                    <th style={{ padding: 12 }}>مدين</th>
                    <th style={{ padding: 12 }}>دائن</th>
                    <th style={{ padding: 12 }}>الرصيد</th>
                  </tr>
                </thead>
                <tbody>
                  {data.map((acc: any) => (
                    <tr key={acc.id} style={{ borderBottom: "1px solid var(--border)" }}>
                      <td style={{ padding: 12 }}>{acc.code}</td>
                      <td style={{ padding: 12 }}>{acc.name}</td>
                      <td style={{ padding: 12, color: "green" }}>{formatCur(acc.debit)}</td>
                      <td style={{ padding: 12, color: "red" }}>{formatCur(acc.credit)}</td>
                      <td style={{ padding: 12, fontWeight: 700 }}>{formatCur(acc.balance)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {activeReport === "pnl" && (
              <div>
                <h3 style={{ borderBottom: "1px solid var(--border)", paddingBottom: 10 }}>الإيرادات</h3>
                {data.revenue.map((r: any, i: number) => (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0" }}>
                    <span>{r.name}</span>
                    <span style={{ color: "green" }}>{formatCur(r.amount)}</span>
                  </div>
                ))}
                <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 800, padding: "10px 0", borderTop: "1px solid var(--border)" }}>
                  <span>إجمالي الإيرادات</span>
                  <span>{formatCur(data.totalRevenue)}</span>
                </div>

                <h3 style={{ borderBottom: "1px solid var(--border)", paddingBottom: 10, marginTop: 30 }}>المصروفات</h3>
                {data.expenses.map((e: any, i: number) => (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0" }}>
                    <span>{e.name}</span>
                    <span style={{ color: "red" }}>{formatCur(e.amount)}</span>
                  </div>
                ))}
                <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 800, padding: "10px 0", borderTop: "1px solid var(--border)" }}>
                  <span>إجمالي المصروفات</span>
                  <span>{formatCur(data.totalExpenses)}</span>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 900, fontSize: 20, marginTop: 40, padding: "20px 0", borderTop: "2px double var(--border)", background: "var(--surface-2)" }}>
                  <span>صافي الربح / الخسارة</span>
                  <span style={{ color: data.netIncome >= 0 ? "green" : "red" }}>{formatCur(data.netIncome)}</span>
                </div>
              </div>
            )}

            {activeReport === "balance" && (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 40 }}>
                <div>
                  <h3 style={{ borderBottom: "1px solid var(--border)", paddingBottom: 10 }}>الأصول</h3>
                  {data.assets.map((a: any, i: number) => (
                    <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0" }}>
                      <span>{a.name}</span>
                      <span>{formatCur(a.amount)}</span>
                    </div>
                  ))}
                  <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 800, padding: "10px 0", borderTop: "2px solid var(--border)", marginTop: 10 }}>
                    <span>إجمالي الأصول</span>
                    <span>{formatCur(data.totalAssets)}</span>
                  </div>
                </div>

                <div>
                  <h3 style={{ borderBottom: "1px solid var(--border)", paddingBottom: 10 }}>الخصوم</h3>
                  {data.liabilities.map((l: any, i: number) => (
                    <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0" }}>
                      <span>{l.name}</span>
                      <span>{formatCur(l.amount)}</span>
                    </div>
                  ))}
                  <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 800, padding: "10px 0", borderTop: "1px solid var(--border)", marginTop: 10 }}>
                    <span>إجمالي الخصوم</span>
                    <span>{formatCur(data.totalLiabilities)}</span>
                  </div>

                  <h3 style={{ borderBottom: "1px solid var(--border)", paddingBottom: 10, marginTop: 30 }}>حقوق الملكية</h3>
                  {data.equity.map((e: any, i: number) => (
                    <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0" }}>
                      <span>{e.name}</span>
                      <span>{formatCur(e.amount)}</span>
                    </div>
                  ))}
                  <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 800, padding: "10px 0", borderTop: "1px solid var(--border)", marginTop: 10 }}>
                    <span>إجمالي حقوق الملكية</span>
                    <span>{formatCur(data.totalEquity)}</span>
                  </div>

                  <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 900, padding: "15px 0", borderTop: "2px solid var(--border)", marginTop: 20, background: "var(--surface-2)" }}>
                    <span>إجمالي الخصوم وحقوق الملكية</span>
                    <span>{formatCur(data.totalLiabilitiesAndEquity)}</span>
                  </div>
                </div>
              </div>
            )}

            {activeReport === "journals" && (
              <div style={{ display: "grid", gap: 20 }}>
                {data.map((entry: any) => (
                  <div key={entry.id} style={{ border: "1px solid var(--border)", borderRadius: 10, padding: 15 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10, borderBottom: "1px solid var(--border)", paddingBottom: 5 }}>
                      <span style={{ fontWeight: 800 }}>رقم القيد: {entry.entryNumber}</span>
                      <span>التاريخ: {new Date(entry.entryDate).toLocaleDateString("ar-SA")}</span>
                    </div>
                    <div style={{ marginBottom: 10 }}>الوصف: {entry.description || "بدون وصف"}</div>
                    <table style={{ width: "100%", borderCollapse: "collapse" }}>
                      <thead>
                        <tr style={{ textAlign: "right", background: "var(--surface-2)" }}>
                          <th style={{ padding: 8 }}>الحساب</th>
                          <th style={{ padding: 8 }}>مدين</th>
                          <th style={{ padding: 8 }}>دائن</th>
                          <th style={{ padding: 8 }}>ملاحظات</th>
                        </tr>
                      </thead>
                      <tbody>
                        {entry.lines.map((line: any) => (
                          <tr key={line.id} style={{ borderBottom: "1px solid var(--border)" }}>
                            <td style={{ padding: 8 }}>{line.account.name}</td>
                            <td style={{ padding: 8, color: Number(line.debit) > 0 ? "green" : "inherit" }}>{Number(line.debit) > 0 ? formatCur(Number(line.debit)) : "-"}</td>
                            <td style={{ padding: 8, color: Number(line.credit) > 0 ? "red" : "inherit" }}>{Number(line.credit) > 0 ? formatCur(Number(line.credit)) : "-"}</td>
                            <td style={{ padding: 8, fontSize: 12 }}>{line.memo}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
, margin: "0 auto" }}>
                <h3 style={{ textAlign: "center", marginBottom: 30 }}>ملخص ضريبة القيمة المضافة</h3>
                <div style={{ display: "grid", gap: 16 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", padding: 15, background: "var(--surface-2)", borderRadius: 10 }}>
                    <span>الضريبة المحصلة (مبيعات):</span>
                    <span style={{ fontWeight: 700, color: "green" }}>{formatCur(data.outputVat)}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", padding: 15, background: "var(--surface-2)", borderRadius: 10 }}>
                    <span>الضريبة المدفوعة (مشتريات):</span>
                    <span style={{ fontWeight: 700, color: "red" }}>{formatCur(data.inputVat)}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", padding: 20, background: "var(--brand-blue)", color: "#fff", borderRadius: 10, marginTop: 10 }}>
                    <span style={{ fontWeight: 800 }}>صافي الضريبة المستحقة:</span>
                    <span style={{ fontWeight: 900, fontSize: 18 }}>{formatCur(data.netVat)}</span>
                  </div>
                  <p style={{ fontSize: 12, color: "#666", textAlign: "center", marginTop: 10 }}>
                    * هذا الملخص للأغراض الاسترشادية فقط بناءً على الفواتير المسجلة في النظام.
                  </p>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

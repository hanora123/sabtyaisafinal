"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ExpensesPage() {
  const router = useRouter();
  const apiBase = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

  const [desc, setDesc] = useState("");
  const [amount, setAmount] = useState(0);
  const [category, setCategory] = useState("عام");
  const [method, setMethod] = useState("CASH");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (amount <= 0) return alert("يرجى إدخال مبلغ صحيح");

    setIsSubmitting(true);
    try {
      const res = await fetch(`${apiBase}/v1/accounting/expenses`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ description: desc, amount, category, paymentMethod: method }),
      });

      if (res.ok) {
        alert("تم تسجيل المصروف بنجاح");
        setDesc(""); setAmount(0);
      } else {
        alert("فشل التسجيل");
      }
    } catch (err) { alert("خطأ في الاتصال"); }
    finally { setIsSubmitting(false); }
  }

  return (
    <div style={{ maxWidth: 600, margin: "0 auto", padding: 16, direction: "rtl" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <h1>تسجيل مصروفات</h1>
        <button onClick={() => router.push("/admin/accounting")} style={{ padding: "8px 16px", borderRadius: 10, cursor: "pointer", border: "1px solid var(--border)", background: "var(--surface)" }}>العودة للتقارير</button>
      </div>

      <form onSubmit={handleSubmit} style={{ background: "var(--surface)", padding: 25, borderRadius: 12, border: "1px solid var(--border)", display: "grid", gap: 20 }}>
        <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <span>وصف المصروف:</span>
          <input required value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="مثلاً: فاتورة كهرباء شهر أبريل" style={{ padding: 10, borderRadius: 8 }} />
        </label>

        <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <span>المبلغ (ر.س):</span>
          <input type="number" step="0.01" required value={amount} onChange={(e) => setAmount(Number(e.target.value))} style={{ padding: 10, borderRadius: 8 }} />
        </label>

        <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <span>التصنيف:</span>
          <select value={category} onChange={(e) => setCategory(e.target.value)} style={{ padding: 10, borderRadius: 8 }}>
            <option value="RENT">إيجار</option>
            <option value="UTILITIES">مرافق (كهرباء/ماء)</option>
            <option value="SALARIES">رواتب</option>
            <option value="MARKETING">تسويق</option>
            <option value="OFFICE">أدوات مكتبية</option>
            <option value="OTHER">عام / أخرى</option>
          </select>
        </label>

        <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <span>طريقة الدفع:</span>
          <select value={method} onChange={(e) => setMethod(e.target.value)} style={{ padding: 10, borderRadius: 8 }}>
            <option value="CASH">نقداً (الصندوق)</option>
            <option value="BANK_TRANSFER">بنكي / بطاقة</option>
          </select>
        </label>

        <button type="submit" disabled={isSubmitting} style={{ padding: 14, borderRadius: 10, border: "none", background: "var(--brand-blue)", color: "#fff", fontWeight: 800, cursor: "pointer" }}>
          {isSubmitting ? "جاري الحفظ..." : "تسجيل المصروف"}
        </button>
      </form>
    </div>
  );
}

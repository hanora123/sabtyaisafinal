"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Customer = {
  id: string;
  name: string;
};

type Product = {
  id: string;
  name: string;
  sku: string;
  sellingPrice: number;
};

type QuoteItem = {
  productId?: string;
  description?: string;
  quantity: number;
  unitPrice: number;
};

type Quote = {
  id: string;
  quoteNumber: string;
  customerName: string | null;
  grandTotal: number;
  status: string;
  createdAt: string;
};

export default function QuotesPage() {
  const router = useRouter();
  const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3000";

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [quotes, setQuotes] = useState<Quote[]>([]);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [customerId, setCustomerId] = useState<string>("");
  const [customerName, setCustomerName] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [items, setItems] = useState<QuoteItem[]>([]);
  const [discountTotal, setDiscountTotal] = useState<number>(0);
  const [taxTotal, setTaxTotal] = useState<number>(0);

  async function loadData() {
    setIsLoading(true);
    try {
      const [custRes, prodRes, quoteRes] = await Promise.all([
        fetch(`${apiBase}/v1/customers`, { credentials: "include" }),
        fetch(`${apiBase}/v1/products`, { credentials: "include" }),
        fetch(`${apiBase}/v1/quotes`, { credentials: "include" }),
      ]);

      if (custRes.status === 401) {
        router.push("/login");
        return;
      }

      if (custRes.ok) setCustomers(await custRes.json());
      if (prodRes.ok) setProducts(await prodRes.json());
      if (quoteRes.ok) setQuotes(await quoteRes.json());
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

  function openForm() {
    setCustomerId("");
    setCustomerName("");
    setNotes("");
    setItems([]);
    setDiscountTotal(0);
    setTaxTotal(0);
    setIsFormOpen(true);
  }

  function closeForm() {
    setIsFormOpen(false);
  }

  function addItem() {
    setItems([...items, { quantity: 1, unitPrice: 0, description: "" }]);
  }

  function updateItem(index: number, field: keyof QuoteItem, value: any) {
    const newItems = [...items];

    if (field === "productId" && value) {
      const prod = products.find(p => p.id === value);
      if (prod) {
        newItems[index] = { 
          ...newItems[index], 
          productId: value, 
          unitPrice: Number(prod.sellingPrice),
          description: prod.name
        };
        setItems(newItems);
        return;
      }
    }

    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
  }

  function removeItem(index: number) {
    setItems(items.filter((_, i) => i !== index));
  }

  const subTotal = items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
  const grandTotal = Math.max(0, subTotal - discountTotal + taxTotal);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!customerId && !customerName.trim()) {
      return alert("يرجى اختيار عميل مسجل أو كتابة اسم العميل");
    }
    if (items.length === 0) return alert("يجب إضافة عنصر واحد على الأقل لعرض السعر");

    setIsSubmitting(true);
    try {
      const payload = {
        customerId: customerId || undefined,
        customerName: customerName.trim() || undefined,
        notes: notes.trim() || undefined,
        items: items.map(i => ({
          productId: i.productId || undefined,
          description: i.description?.trim() || undefined,
          quantity: Number(i.quantity),
          unitPrice: Number(i.unitPrice),
        })),
        discountTotal: Number(discountTotal),
        taxTotal: Number(taxTotal),
      };

      const res = await fetch(`${apiBase}/v1/quotes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.text();
        alert("حدث خطأ: " + err);
        return;
      }

      await loadData();
      closeForm();
      alert("تم إنشاء عرض السعر بنجاح!");
    } catch (error) {
      console.error(error);
      alert("حدث خطأ أثناء الحفظ");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div style={{ maxWidth: 1000, margin: "0 auto", padding: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <h1>عروض الأسعار</h1>
        <button
          onClick={openForm}
          style={{
            padding: "10px 16px",
            borderRadius: 8,
            border: "none",
            background: "linear-gradient(135deg, var(--brand-blue), var(--brand-green))",
            color: "#fff",
            fontWeight: "bold",
            cursor: "pointer",
          }}
        >
          + إنشاء عرض سعر
        </button>
      </div>

      <div style={{ marginBottom: 16 }}>
        <a href="/admin" style={{ color: "var(--brand-blue)", textDecoration: "none" }}>&larr; العودة للوحة الإدارة</a>
      </div>

      {isFormOpen && (
        <div style={{
          marginBottom: 24, padding: 20, borderRadius: 12,
          border: "1px solid var(--border)", background: "var(--surface)"
        }}>
          <h2 style={{ marginBottom: 16 }}>إنشاء عرض سعر جديد</h2>
          <form onSubmit={handleSubmit} style={{ display: "grid", gap: 20 }}>
            
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <span style={{ fontWeight: 600 }}>العميل (مسجل)</span>
                <select
                  value={customerId} onChange={(e) => setCustomerId(e.target.value)}
                  style={{ padding: 10, borderRadius: 8, border: "1px solid var(--border)" }}
                >
                  <option value="">-- عميل غير مسجل --</option>
                  {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </label>

              <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <span style={{ fontWeight: 600 }}>أو اسم العميل (غير مسجل)</span>
                <input
                  value={customerName} onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="اكتب اسم العميل إذا لم يكن مسجلاً"
                  style={{ padding: 10, borderRadius: 8, border: "1px solid var(--border)" }}
                  disabled={!!customerId}
                />
              </label>
            </div>

            <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <span style={{ fontWeight: 600 }}>ملاحظات</span>
              <textarea
                value={notes} onChange={(e) => setNotes(e.target.value)}
                style={{ padding: 10, borderRadius: 8, border: "1px solid var(--border)", minHeight: 60 }}
              />
            </label>

            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <h3 style={{ margin: 0 }}>العناصر</h3>
                <button
                  type="button" onClick={addItem}
                  style={{
                    padding: "6px 12px", borderRadius: 8, border: "1px solid var(--brand-blue)",
                    background: "transparent", color: "var(--brand-blue)", fontWeight: "bold", cursor: "pointer"
                  }}
                >
                  + إضافة سطر
                </button>
              </div>

              {items.length === 0 ? (
                <p style={{ color: "rgba(0,0,0,0.5)", textAlign: "center", padding: 10 }}>أضف عناصر لعرض السعر</p>
              ) : (
                <div style={{ display: "grid", gap: 12 }}>
                  {items.map((item, idx) => (
                    <div key={idx} style={{ display: "grid", gridTemplateColumns: "2fr 2fr 1fr 1fr auto", gap: 12, alignItems: "end" }}>
                      <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                        <span style={{ fontSize: 13, fontWeight: 600 }}>المنتج (مسجل)</span>
                        <select
                          value={item.productId || ""} onChange={(e) => updateItem(idx, "productId", e.target.value)}
                          style={{ padding: 10, borderRadius: 8, border: "1px solid var(--border)" }}
                        >
                          <option value="">-- منتج غير مسجل --</option>
                          {products.map(p => <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>)}
                        </select>
                      </label>
                      
                      <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                        <span style={{ fontSize: 13, fontWeight: 600 }}>الوصف (أو اسم منتج حر)</span>
                        <input
                          value={item.description || ""} onChange={(e) => updateItem(idx, "description", e.target.value)}
                          style={{ padding: 10, borderRadius: 8, border: "1px solid var(--border)" }}
                        />
                      </label>

                      <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                        <span style={{ fontSize: 13, fontWeight: 600 }}>الكمية</span>
                        <input
                          type="number" min={1} step={1} required
                          value={item.quantity} onChange={(e) => updateItem(idx, "quantity", Number(e.target.value))}
                          style={{ padding: 10, borderRadius: 8, border: "1px solid var(--border)" }}
                        />
                      </label>

                      <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                        <span style={{ fontSize: 13, fontWeight: 600 }}>سعر الوحدة</span>
                        <input
                          type="number" min={0} step={0.01} required
                          value={item.unitPrice} onChange={(e) => updateItem(idx, "unitPrice", Number(e.target.value))}
                          style={{ padding: 10, borderRadius: 8, border: "1px solid var(--border)" }}
                        />
                      </label>

                      <button
                        type="button" onClick={() => removeItem(idx)}
                        style={{ padding: 10, borderRadius: 8, border: "none", background: "#fee", color: "#c00", cursor: "pointer", height: 40 }}
                      >
                        حذف
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div style={{ display: "flex", gap: 32, flexWrap: "wrap", marginTop: 8 }}>
              <div style={{ flex: "1 1 200px", display: "grid", gap: 16 }}>
                <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <span style={{ fontWeight: 600 }}>إجمالي الخصم (مبلغ)</span>
                  <input
                    type="number" min={0} step={0.01}
                    value={discountTotal} onChange={(e) => setDiscountTotal(Number(e.target.value))}
                    style={{ padding: 10, borderRadius: 8, border: "1px solid var(--border)" }}
                  />
                </label>

                <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <span style={{ fontWeight: 600 }}>الضريبة</span>
                  <input
                    type="number" min={0} step={0.01}
                    value={taxTotal} onChange={(e) => setTaxTotal(Number(e.target.value))}
                    style={{ padding: 10, borderRadius: 8, border: "1px solid var(--border)" }}
                  />
                </label>
              </div>

              <div style={{ flex: "1 1 300px", padding: 16, background: "var(--surface-2)", borderRadius: 8, border: "1px solid var(--border)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                  <span>المجموع الفرعي:</span>
                  <span style={{ fontWeight: "bold" }}>{subTotal.toFixed(2)}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8, color: "#d32f2f" }}>
                  <span>الخصم:</span>
                  <span>-{discountTotal.toFixed(2)}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                  <span>الضريبة:</span>
                  <span>+{taxTotal.toFixed(2)}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: 12, paddingTop: 12, borderTop: "2px solid var(--border)", fontSize: 18, fontWeight: 800 }}>
                  <span>الإجمالي النهائي:</span>
                  <span>{grandTotal.toFixed(2)}</span>
                </div>
              </div>
            </div>

            <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
              <button
                type="button" onClick={closeForm}
                style={{ padding: "12px 20px", borderRadius: 8, border: "1px solid var(--border)", background: "transparent", cursor: "pointer" }}
              >
                إلغاء
              </button>
              <button
                type="submit" disabled={isSubmitting}
                style={{
                  padding: "12px 20px", borderRadius: 8, border: "none",
                  background: "var(--brand-blue)", color: "#fff", fontWeight: "bold", cursor: "pointer"
                }}
              >
                {isSubmitting ? "جاري الحفظ..." : "حفظ عرض السعر"}
              </button>
            </div>
          </form>
        </div>
      )}

      {isLoading ? (
        <p>جاري تحميل البيانات...</p>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 600 }}>
            <thead>
              <tr style={{ background: "var(--surface-2)", textAlign: "right" }}>
                <th style={{ padding: 12, borderBottom: "2px solid var(--border)" }}>رقم العرض</th>
                <th style={{ padding: 12, borderBottom: "2px solid var(--border)" }}>تاريخ الإنشاء</th>
                <th style={{ padding: 12, borderBottom: "2px solid var(--border)" }}>العميل</th>
                <th style={{ padding: 12, borderBottom: "2px solid var(--border)" }}>الإجمالي</th>
                <th style={{ padding: 12, borderBottom: "2px solid var(--border)" }}>الحالة</th>
              </tr>
            </thead>
            <tbody>
              {quotes.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ padding: 16, textAlign: "center", color: "rgba(0,0,0,0.5)" }}>
                    لا توجد عروض أسعار حالياً.
                  </td>
                </tr>
              ) : (
                quotes.map(q => (
                  <tr key={q.id} style={{ borderBottom: "1px solid var(--border)" }}>
                    <td style={{ padding: 12, fontWeight: 500 }}>{q.quoteNumber}</td>
                    <td style={{ padding: 12 }}>{new Date(q.createdAt).toLocaleDateString("ar-EG")}</td>
                    <td style={{ padding: 12 }}>{q.customerName || "—"}</td>
                    <td style={{ padding: 12, fontWeight: "bold" }}>{Number(q.grandTotal).toFixed(2)}</td>
                    <td style={{ padding: 12 }}>
                      <span style={{ 
                        padding: "4px 8px", borderRadius: 4, fontSize: 12, fontWeight: "bold",
                        background: q.status === "DRAFT" ? "#f5f5f5" : q.status === "SENT" ? "#e3f2fd" : "#e8f5e9",
                        color: q.status === "DRAFT" ? "#666" : q.status === "SENT" ? "#1565c0" : "#2e7d32"
                      }}>
                        {q.status}
                      </span>
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

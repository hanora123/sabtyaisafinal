"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Inventory = { id: string; name: string };
type Supplier = { id: string; name: string };
type Product = { id: string; name: string; sku: string; costPrice: number };
type PurchaseItem = { productId: string; quantity: number; unitCost: number };

export default function PurchasesPage() {
  const router = useRouter();
  const apiBase = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

  const [inventories, setInventories] = useState<Inventory[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [recentPurchases, setRecentPurchases] = useState<any[]>([]);

  const [inventoryId, setInventoryId] = useState<string>("");
  const [supplierId, setSupplierId] = useState<string>("");
  const [items, setItems] = useState<PurchaseItem[]>([]);

  const [discountTotal, setDiscountTotal] = useState<number>(0);
  const [taxTotal, setTaxTotal] = useState<number>(0);
  const [paidNow, setPaidNow] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<string>("CASH");

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const formatCur = (n: number) => new Intl.NumberFormat("ar-SA", { style: "currency", currency: "SAR" }).format(n);

  async function loadData() {
    setIsLoading(true);
    try {
      const [invRes, supRes, prodRes, purRes] = await Promise.all([
        fetch(`${apiBase}/v1/inventories`, { credentials: "include" }),
        fetch(`${apiBase}/v1/suppliers`, { credentials: "include" }),
        fetch(`${apiBase}/v1/products`, { credentials: "include" }),
        fetch(`${apiBase}/v1/purchases`, { credentials: "include" }),
      ]);

      if (invRes.status === 401) { router.push("/login"); return; }

      if (invRes.ok) {
        const data = await invRes.json();
        setInventories(data);
        if (data.length > 0) setInventoryId(data[0].id);
      }
      if (supRes.ok) setSuppliers(await supRes.json());
      if (prodRes.ok) setProducts(await prodRes.json());
      if (purRes.ok) setRecentPurchases(await purRes.json());
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  function addItem() {
    setItems([...items, { productId: "", quantity: 1, unitCost: 0 }]);
  }

  function updateItem(index: number, field: keyof PurchaseItem, value: any) {
    const newItems = [...items];
    if (field === "productId" && value) {
      const prod = products.find(p => p.id === value);
      if (prod) {
        newItems[index] = { ...newItems[index], productId: value, unitCost: Number(prod.costPrice) };
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

  const subTotal = items.reduce((sum, item) => sum + (item.quantity * item.unitCost), 0);
  const grandTotal = Math.max(0, subTotal - discountTotal + taxTotal);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!supplierId) return alert("يرجى اختيار المورد");
    if (!inventoryId) return alert("يرجى اختيار المخزون");
    if (items.length === 0) return alert("يجب إضافة منتج واحد على الأقل");
    if (items.some(i => !i.productId)) return alert("يرجى تحديد المنتج في جميع الأسطر");

    setIsSubmitting(true);
    try {
      const payload = {
        supplierId,
        inventoryId,
        items,
        discountTotal: Number(discountTotal),
        taxTotal: Number(taxTotal),
        paidNow: Number(paidNow),
        paymentMethod: paidNow > 0 ? paymentMethod : undefined,
      };

      const res = await fetch(`${apiBase}/v1/purchases`, {
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

      alert("تم تسجيل التوريد بنجاح!");
      setItems([]);
      setDiscountTotal(0);
      setTaxTotal(0);
      setPaidNow(0);
      loadData(); // Refresh list
    } catch (error) {
      alert("حدث خطأ أثناء الحفظ");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto", padding: 16, direction: "rtl" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <h1 style={{ margin: 0 }}>إدارة المشتريات والتوريد</h1>
        <button 
          onClick={() => router.push("/admin")}
          style={{ padding: "8px 16px", borderRadius: 10, cursor: "pointer", border: "1px solid var(--border)", background: "var(--surface)" }}
        >
          العودة للوحة الإدارة
        </button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: 24 }}>
        {/* Form Section */}
        <section>
          <form onSubmit={handleSubmit} style={{ display: "grid", gap: 20 }}>
            <div style={{ padding: 20, borderRadius: 12, border: "1px solid var(--border)", background: "var(--surface)" }}>
              <h3 style={{ marginTop: 0, marginBottom: 16 }}>إنشاء طلب توريد جديد</h3>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <span style={{ fontWeight: 600 }}>المورد *</span>
                  <select required value={supplierId} onChange={(e) => setSupplierId(e.target.value)} style={{ padding: 10, borderRadius: 8, border: "1px solid var(--border)" }}>
                    <option value="">-- اختر المورد --</option>
                    {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </label>
                <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <span style={{ fontWeight: 600 }}>المخزون الوجهة *</span>
                  <select required value={inventoryId} onChange={(e) => setInventoryId(e.target.value)} style={{ padding: 10, borderRadius: 8, border: "1px solid var(--border)" }}>
                    <option value="">-- اختر المخزون --</option>
                    {inventories.map(inv => <option key={inv.id} value={inv.id}>{inv.name}</option>)}
                  </select>
                </label>
              </div>
            </div>

            <div style={{ padding: 20, borderRadius: 12, border: "1px solid var(--border)", background: "var(--surface)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <h3 style={{ margin: 0 }}>الأصناف الموردة</h3>
                <button type="button" onClick={addItem} style={{ padding: "6px 12px", borderRadius: 8, border: "1px solid var(--brand-blue)", background: "none", color: "var(--brand-blue)", fontWeight: "bold", cursor: "pointer" }}>
                  + إضافة صنف
                </button>
              </div>
              {items.length === 0 ? (
                <p style={{ textAlign: "center", color: "#666", padding: "20px 0" }}>لا توجد أصناف مضافة بعد.</p>
              ) : (
                <div style={{ display: "grid", gap: 12 }}>
                  {items.map((item, idx) => (
                    <div key={idx} style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr auto", gap: 10, alignItems: "end", background: "var(--surface-2)", padding: 10, borderRadius: 8 }}>
                      <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                        <span style={{ fontSize: 12, fontWeight: 600 }}>المنتج</span>
                        <select required value={item.productId} onChange={(e) => updateItem(idx, "productId", e.target.value)} style={{ padding: 8, borderRadius: 6, border: "1px solid var(--border)" }}>
                          <option value="">-- اختر --</option>
                          {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                        </select>
                      </label>
                      <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                        <span style={{ fontSize: 12, fontWeight: 600 }}>الكمية</span>
                        <input type="number" min={1} value={item.quantity} onChange={(e) => updateItem(idx, "quantity", Number(e.target.value))} style={{ padding: 8, borderRadius: 6, border: "1px solid var(--border)" }} />
                      </label>
                      <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                        <span style={{ fontSize: 12, fontWeight: 600 }}>سعر التكلفة</span>
                        <input type="number" step="0.01" value={item.unitCost} onChange={(e) => updateItem(idx, "unitCost", Number(e.target.value))} style={{ padding: 8, borderRadius: 6, border: "1px solid var(--border)" }} />
                      </label>
                      <button type="button" onClick={() => removeItem(idx)} style={{ padding: "8px", borderRadius: 6, border: "none", background: "#fee", color: "red", cursor: "pointer" }}>حذف</button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div style={{ padding: 20, borderRadius: 12, border: "1px solid var(--border)", background: "var(--surface)" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 40 }}>
                <div style={{ display: "grid", gap: 12 }}>
                  <label style={{ display: "flex", justifyContent: "space-between" }}>
                    <span>إجمالي الخصم:</span>
                    <input type="number" value={discountTotal} onChange={(e) => setDiscountTotal(Number(e.target.value))} style={{ width: 100, padding: 5 }} />
                  </label>
                  <label style={{ display: "flex", justifyContent: "space-between" }}>
                    <span>الضريبة:</span>
                    <input type="number" value={taxTotal} onChange={(e) => setTaxTotal(Number(e.target.value))} style={{ width: 100, padding: 5 }} />
                  </label>
                  <label style={{ display: "flex", justifyContent: "space-between", marginTop: 10, borderTop: "1px solid #ddd", paddingTop: 10 }}>
                    <span style={{ fontWeight: 800 }}>الإجمالي النهائي:</span>
                    <span style={{ fontWeight: 800, color: "var(--brand-blue)" }}>{formatCur(grandTotal)}</span>
                  </label>
                </div>
                <div style={{ display: "grid", gap: 12 }}>
                  <label style={{ display: "flex", justifyContent: "space-between" }}>
                    <span>المدفوع نقداً:</span>
                    <input type="number" value={paidNow} onChange={(e) => setPaidNow(Number(e.target.value))} style={{ width: 100, padding: 5 }} />
                  </label>
                  {paidNow > 0 && (
                    <label style={{ display: "flex", justifyContent: "space-between" }}>
                      <span>طريقة الدفع:</span>
                      <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} style={{ width: 106, padding: 5 }}>
                        <option value="CASH">كاش</option>
                        <option value="BANK_TRANSFER">تحويل</option>
                      </select>
                    </label>
                  )}
                  <div style={{ fontSize: 12, color: "#666", textAlign: "left" }}>المتبقي كمديونية: {formatCur(grandTotal - paidNow)}</div>
                </div>
              </div>
              <button type="submit" disabled={isSubmitting} style={{ width: "100%", marginTop: 20, padding: 14, borderRadius: 10, border: "none", background: "var(--brand-blue)", color: "#fff", fontWeight: 800, cursor: "pointer" }}>
                {isSubmitting ? "جاري الحفظ..." : "حفظ التوريد"}
              </button>
            </div>
          </form>
        </section>

        {/* History Section */}
        <aside>
          <div style={{ padding: 20, borderRadius: 12, border: "1px solid var(--border)", background: "var(--surface)", height: "100%" }}>
            <h3 style={{ marginTop: 0, marginBottom: 16 }}>آخر عمليات التوريد</h3>
            <div style={{ display: "grid", gap: 12 }}>
              {recentPurchases.map((pur: any) => (
                <div key={pur.id} style={{ padding: 12, borderRadius: 10, background: "var(--surface-2)", border: "1px solid var(--border)", fontSize: 13 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 700, marginBottom: 4 }}>
                    <span>{pur.purchaseNumber}</span>
                    <span style={{ color: "var(--brand-blue)" }}>{formatCur(Number(pur.grandTotal))}</span>
                  </div>
                  <div style={{ color: "#666" }}>المورد: {pur.supplier.name}</div>
                  <div style={{ color: "#666" }}>المخزون: {pur.inventory.name}</div>
                  <div style={{ fontSize: 11, marginTop: 4 }}>{new Date(pur.createdAt).toLocaleString("ar-SA")}</div>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

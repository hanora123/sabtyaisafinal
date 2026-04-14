"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Inventory = { id: string; name: string; code: string };
type StockItem = {
  productId: string;
  onHandQty: number;
  reservedQty: number;
  product: { name: string; sku: string; costPrice: number };
};

export default function InventoryAdminPage() {
  const router = useRouter();
  const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3000";

  const [tab, setTab] = useState<"view" | "transfer">("view");
  const [inventories, setInventories] = useState<Inventory[]>([]);
  const [selectedInventory, setSelectedInventory] = useState("");
  const [stock, setStock] = useState<StockItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Transfer state
  const [fromInv, setFromInv] = useState("");
  const [toInv, setToInv] = useState("");
  const [targetProduct, setTargetProduct] = useState("");
  const [transferQty, setTransferQty] = useState(1);
  const [notes, setNotes] = useState("");

  async function loadInventories() {
    try {
      const resp = await fetch(`${apiBase}/v1/inventories`, { credentials: "include" });
      if (resp.status === 401) { router.push("/login"); return; }
      if (resp.ok) {
        const data = await resp.json();
        setInventories(data);
        if (data.length > 0) {
          setSelectedInventory(data[0].id);
          setFromInv(data[0].id);
          if (data.length > 1) setToInv(data[1].id);
        }
      }
    } catch (err) { console.error(err); }
  }

  async function loadStock(invId: string) {
    if (!invId) return;
    setIsLoading(true);
    try {
      const resp = await fetch(`${apiBase}/v1/inventories/${invId}/stock`, { credentials: "include" });
      if (resp.ok) setStock(await resp.json());
    } catch (err) { console.error(err); }
    finally { setIsLoading(false); }
  }

  useEffect(() => { loadInventories(); }, []);
  useEffect(() => { if (tab === "view") loadStock(selectedInventory); }, [selectedInventory, tab]);

  async function handleTransfer(e: React.FormEvent) {
    e.preventDefault();
    if (fromInv === toInv) return alert("لا يمكن التحويل لنفس المخزن");
    if (!targetProduct) return alert("يرجى اختيار المنتج");

    try {
      const res = await fetch(`${apiBase}/v1/inventories/${fromInv}/stock/transfer/${toInv}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ productId: targetProduct, quantity: transferQty, notes }),
      });

      if (res.ok) {
        alert("تم التحويل بنجاح");
        setTargetProduct(""); setTransferQty(1); setNotes("");
      } else {
        const txt = await res.text();
        alert("فشل التحويل: " + txt);
      }
    } catch (err) { alert("خطأ في الاتصال"); }
  }

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: 16, direction: "rtl" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <h1 style={{ margin: 0 }}>إدارة المخزون</h1>
        <button onClick={() => router.push("/admin")} style={{ padding: "8px 16px", borderRadius: 10, cursor: "pointer", border: "1px solid var(--border)", background: "var(--surface)" }}>
          العودة للوحة الإدارة
        </button>
      </div>

      <div style={{ display: "flex", gap: 10, marginBottom: 24 }}>
        <button onClick={() => setTab("view")} style={{ padding: "10px 20px", borderRadius: 10, border: "none", background: tab === "view" ? "var(--brand-blue)" : "var(--surface)", color: tab === "view" ? "#fff" : "inherit", cursor: "pointer" }}>عرض المخزون</button>
        <button onClick={() => setTab("transfer")} style={{ padding: "10px 20px", borderRadius: 10, border: "none", background: tab === "transfer" ? "var(--brand-blue)" : "var(--surface)", color: tab === "transfer" ? "#fff" : "inherit", cursor: "pointer" }}>تحويل بين المخازن</button>
      </div>

      {tab === "view" ? (
        <div style={{ background: "var(--surface)", padding: 20, borderRadius: 12, border: "1px solid var(--border)" }}>
          <div style={{ marginBottom: 20 }}>
            <label style={{ fontWeight: 700, marginLeft: 10 }}>اختر المخزن:</label>
            <select value={selectedInventory} onChange={(e) => setSelectedInventory(e.target.value)} style={{ padding: 8, borderRadius: 8 }}>
              {inventories.map(inv => <option key={inv.id} value={inv.id}>{inv.name}</option>)}
            </select>
          </div>

          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "2px solid var(--border)", textAlign: "right" }}>
                <th style={{ padding: 12 }}>المنتج</th>
                <th style={{ padding: 12 }}>SKU</th>
                <th style={{ padding: 12 }}>الكمية المتاحة</th>
                <th style={{ padding: 12 }}>المحجوز</th>
                <th style={{ padding: 12 }}>التكلفة</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={5} style={{ padding: 20, textAlign: "center" }}>جاري التحميل...</td></tr>
              ) : stock.length === 0 ? (
                <tr><td colSpan={5} style={{ padding: 20, textAlign: "center" }}>لا يوجد مخزون في هذا الموقع</td></tr>
              ) : (
                stock.map((s, idx) => (
                  <tr key={idx} style={{ borderBottom: "1px solid var(--border)" }}>
                    <td style={{ padding: 12 }}>{s.product.name}</td>
                    <td style={{ padding: 12 }}>{s.product.sku}</td>
                    <td style={{ padding: 12, fontWeight: 700, color: s.onHandQty > 0 ? "green" : "red" }}>{s.onHandQty}</td>
                    <td style={{ padding: 12 }}>{s.reservedQty}</td>
                    <td style={{ padding: 12 }}>{new Intl.NumberFormat("ar-SA").format(s.product.costPrice)} ر.س</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      ) : (
        <form onSubmit={handleTransfer} style={{ background: "var(--surface)", padding: 25, borderRadius: 12, border: "1px solid var(--border)", display: "grid", gap: 20, maxWidth: 600 }}>
          <h3 style={{ marginTop: 0 }}>إنشاء تحويل مخزني</h3>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <span>من مخزن:</span>
              <select value={fromInv} onChange={(e) => setFromInv(e.target.value)} style={{ padding: 10, borderRadius: 8 }}>
                {inventories.map(inv => <option key={inv.id} value={inv.id}>{inv.name}</option>)}
              </select>
            </label>
            <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <span>إلى مخزن:</span>
              <select value={toInv} onChange={(e) => setToInv(e.target.value)} style={{ padding: 10, borderRadius: 8 }}>
                {inventories.map(inv => <option key={inv.id} value={inv.id}>{inv.name}</option>)}
              </select>
            </label>
          </div>

          <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <span>المنتج:</span>
            <select required value={targetProduct} onChange={(e) => setTargetProduct(e.target.value)} style={{ padding: 10, borderRadius: 8 }}>
              <option value="">-- اختر المنتج --</option>
              {/* Note: Ideally we'd only list products that actually have stock in fromInv */}
              {/* For now, we'll list items from the loaded stock of fromInv if available */}
              {stock.filter(s => s.onHandQty > 0).map(s => (
                <option key={s.productId} value={s.productId}>{s.product.name} (المتاح: {s.onHandQty})</option>
              ))}
            </select>
          </label>

          <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <span>الكمية المحولة:</span>
            <input type="number" min={1} value={transferQty} onChange={(e) => setTransferQty(Number(e.target.value))} style={{ padding: 10, borderRadius: 8 }} />
          </label>

          <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <span>ملاحظات:</span>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} style={{ padding: 10, borderRadius: 8, minHeight: 80 }} placeholder="سبب التحويل..." />
          </label>

          <button type="submit" style={{ padding: 14, borderRadius: 10, border: "none", background: "var(--brand-blue)", color: "#fff", fontWeight: 800, cursor: "pointer" }}>تنفيذ التحويل</button>
        </form>
      )}
    </div>
  );
}

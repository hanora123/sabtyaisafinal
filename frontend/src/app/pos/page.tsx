"use client";

import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";
import { useRouter } from "next/navigation";

type Inventory = {
  id: string;
  name: string;
  code: string;
  isActive: boolean;
};
type Customer = { id: string; name: string };

type Product = {
  id: string;
  name: string;
  sku: string;
  barcode: string | null;
  sellingPrice: number;
  costPrice: number;
  minStockLevel: number;
};

type CartItem = {
  product: Product;
  qty: number;
};

type PaymentMethod = "CASH" | "CARD" | "WALLET";

type OfflineSale = {
  id: string;
  payload: any;
  timestamp: number;
};

function formatMoney(n: number) {
  return new Intl.NumberFormat(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n);
}

function getPaymentLabel(method: PaymentMethod) {
  switch (method) {
    case "CASH":
      return "كاش";
    case "CARD":
      return "بطاقة";
    case "WALLET":
      return "محفظة";
  }
}

export default function PosPage() {
  const router = useRouter();
  const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3000";

  const [inventories, setInventories] = useState<Inventory[]>([]);
  const [inventoryId, setInventoryId] = useState<string>("");
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [customerId, setCustomerId] = useState<string>("");

  const [query, setQuery] = useState("");
  const [quickAdd, setQuickAdd] = useState("");

  const [products, setProducts] = useState<Product[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);

  const [discountMode, setDiscountMode] = useState<"fixed" | "percent">("fixed");
  const [discountValue, setDiscountValue] = useState<number>(0);

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("CASH");
  const [isCheckoutLoading, setIsCheckoutLoading] = useState(false);

  const [newProductName, setNewProductName] = useState("");
  const [newProductSku, setNewProductSku] = useState("");
  const [newProductBarcode, setNewProductBarcode] = useState("");
  const [newProductSellingPrice, setNewProductSellingPrice] = useState<number>(0);
  const [newProductCostPrice, setNewProductCostPrice] = useState<number>(0);
  const [newProductMinStockLevel, setNewProductMinStockLevel] = useState<number>(0);
  const [isCreatingProduct, setIsCreatingProduct] = useState(false);
  const [newProductInitialStockQty, setNewProductInitialStockQty] = useState<number>(0);

  const [cart, setCart] = useState<CartItem[]>([]);
  const [isOnline, setIsOnline] = useState(true);
  const checkoutBtnRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    const handleOnline = () => { setIsOnline(true); syncOfflineSales(); };
    const handleOffline = () => { setIsOnline(false); };
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    setIsOnline(navigator.onLine);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  async function syncOfflineSales() {
    const offlineData = localStorage.getItem("offline_sales");
    if (!offlineData) return;
    const sales: OfflineSale[] = JSON.parse(offlineData);
    if (sales.length === 0) return;

    const remaining: OfflineSale[] = [];
    for (const sale of sales) {
      try {
        const resp = await fetch(`${apiBase}/v1/pos/sales`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(sale.payload),
        });
        if (!resp.ok) remaining.push(sale);
      } catch (e) {
        remaining.push(sale);
      }
    }
    localStorage.setItem("offline_sales", JSON.stringify(remaining));
  }

  async function loadInventories() {
    const [invResp, custResp] = await Promise.all([
      fetch(`${apiBase}/v1/inventories`, { credentials: "include" }),
      fetch(`${apiBase}/v1/customers`, { credentials: "include" }),
    ]);

    if (invResp.status === 401 || custResp.status === 401) {
      router.push("/login");
      return;
    }

    if (invResp.ok) {
      const data = await invResp.json();
      setInventories(data);
      if (!inventoryId && data.length > 0) setInventoryId(data[0].id);
    }
    if (custResp.ok) {
      const data = await custResp.json();
      setCustomers(data);
    }
  }

  function normalizeProduct(p: any): Product {
    return {
      id: String(p.id),
      name: String(p.name),
      sku: String(p.sku),
      barcode: p.barcode ?? null,
      sellingPrice: Number(p.sellingPrice),
      costPrice: Number(p.costPrice),
      minStockLevel: Number(p.minStockLevel ?? 0),
    };
  }

  async function searchProducts(q?: string) {
    setIsLoadingProducts(true);
    try {
      const url = q?.trim()
        ? `${apiBase}/v1/pos/products/search?q=${encodeURIComponent(q.trim())}`
        : `${apiBase}/v1/pos/products/search`;
      const resp = await fetch(url, { credentials: "include" });
      if (resp.status === 401) { router.push("/login"); return; }
      if (resp.ok) {
        const data = await resp.json();
        setProducts(data.map(normalizeProduct));
      }
    } finally {
      setIsLoadingProducts(false);
    }
  }

  useEffect(() => { loadInventories(); }, []);
  useEffect(() => {
    const t = setTimeout(() => searchProducts(query), 350);
    return () => clearTimeout(t);
  }, [query]);

  const subTotal = useMemo(() => cart.reduce((sum, it) => sum + it.product.sellingPrice * it.qty, 0), [cart]);
  const discountTotal = useMemo(() => {
    if (discountMode === "fixed") return Math.min(subTotal, discountValue);
    return subTotal * (discountValue / 100);
  }, [discountMode, discountValue, subTotal]);
  const grandTotal = useMemo(() => Math.max(0, subTotal - discountTotal), [subTotal, discountTotal]);

  function addToCart(product: Product, qty = 1) {
    setCart((prev) => {
      const idx = prev.findIndex((x) => x.product.id === product.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = { ...next[idx], qty: next[idx].qty + qty };
        return next;
      }
      return [...prev, { product, qty }];
    });
  }

  function changeQty(productId: string, delta: number) {
    setCart((prev) => prev.map((x) => (x.product.id === productId ? { ...x, qty: x.qty + delta } : x)).filter((x) => x.qty > 0));
  }

  async function applyQuickAdd(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key !== "Enter") return;
    const code = quickAdd.trim();
    if (!code) return;
    setIsLoadingProducts(true);
    try {
      const resp = await fetch(`${apiBase}/v1/pos/products/search?q=${encodeURIComponent(code)}`, { credentials: "include" });
      if (resp.ok) {
        const data = await resp.json();
        if (data[0]) {
          addToCart(normalizeProduct(data[0]), 1);
          setQuickAdd("");
        } else {
          alert("المنتج غير موجود");
        }
      }
    } finally {
      setIsLoadingProducts(false);
    }
  }

  async function checkout() {
    if (cart.length === 0 || !inventoryId) return;
    setIsCheckoutLoading(true);
    const payload = {
      inventoryId,
      customerId: customerId || undefined,
      items: cart.map((it) => ({ productId: it.product.id, quantity: it.qty })),
      discountMode: discountValue > 0 ? discountMode : undefined,
      discountValue: discountValue > 0 ? discountValue : undefined,
      taxTotal: 0,
      payments: [{ method: paymentMethod, amount: grandTotal }],
    };

    try {
      const resp = await fetch(`${apiBase}/v1/pos/sales`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      if (resp.ok) {
        const receipt = await resp.json();
        alert(`تمت العملية بنجاح.\nرقم الفاتورة: ${receipt.saleNumber}`);
        setCart([]); setDiscountValue(0);
      } else {
        alert("فشل إتمام الدفع");
      }
    } catch (err) {
      const existing = JSON.parse(localStorage.getItem("offline_sales") || "[]");
      localStorage.setItem("offline_sales", JSON.stringify([...existing, { id: Date.now(), payload, timestamp: Date.now() }]));
      alert("تم حفظ العملية محلياً (أوفلاين)");
      setCart([]); setDiscountValue(0);
    } finally {
      setIsCheckoutLoading(false);
    }
  }

  const selectedInventory = inventories.find((i) => i.id === inventoryId);

  return (
    <div style={{ padding: 16, maxWidth: 1120, margin: "0 auto", direction: "rtl" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <h1>إتمام البيع - الحنوره للتجارة</h1>
        {!isOnline && <span style={{ color: "orange", fontWeight: 800 }}>⚠️ وضع الأوفلاين نشط</span>}
      </div>

      <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
        <section style={{ flex: "1 1 520px", border: "1px solid var(--border)", borderRadius: 12, padding: 16, background: "var(--surface)" }}>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center", marginBottom: 12 }}>
            <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <span>المخزون</span>
              <select value={inventoryId} onChange={(e) => setInventoryId(e.target.value)} style={{ padding: 10, borderRadius: 10 }}>
                {inventories.map((inv) => <option key={inv.id} value={inv.id}>{inv.name}</option>)}
              </select>
            </label>

            <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <span>العميل</span>
              <select value={customerId} onChange={(e) => setCustomerId(e.target.value)} style={{ padding: 10, borderRadius: 10 }}>
                <option value="">بدون عميل</option>
                {customers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </label>

            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="بحث..." style={{ padding: 10, borderRadius: 10, flex: 1 }} />
            <input value={quickAdd} onChange={(e) => setQuickAdd(e.target.value)} onKeyDown={applyQuickAdd} placeholder="إضافة سريعة..." style={{ padding: 10, borderRadius: 10, width: 150 }} />
          </div>

          <div style={{ display: "grid", gap: 10, gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))" }}>
            {products.map((p) => (
              <div key={p.id} style={{ border: "1px solid var(--border)", borderRadius: 10, padding: 12, background: "var(--surface-2)" }}>
                <div style={{ fontWeight: 700 }}>{p.name}</div>
                <div>{formatMoney(p.sellingPrice)} ر.س</div>
                <button onClick={() => addToCart(p, 1)} style={{ width: "100%", marginTop: 8, padding: 8, borderRadius: 8, background: "var(--brand-blue)", color: "#fff", border: "none", cursor: "pointer" }}>إضافة</button>
              </div>
            ))}
          </div>
        </section>

        <aside style={{ flex: "1 1 420px", border: "1px solid var(--border)", borderRadius: 12, padding: 16, background: "var(--surface)" }}>
          <h2 style={{ marginBottom: 10 }}>سلة الطلب</h2>
          <div style={{ display: "grid", gap: 10, maxHeight: 400, overflowY: "auto" }}>
            {cart.map((item) => (
              <div key={item.product.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: 10, background: "var(--surface-2)", borderRadius: 10 }}>
                <div>
                  <div style={{ fontWeight: 700 }}>{item.product.name}</div>
                  <div style={{ fontSize: 13 }}>{formatMoney(item.product.sellingPrice)} x {item.qty}</div>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button onClick={() => changeQty(item.product.id, -1)}>-</button>
                  <span>{item.qty}</span>
                  <button onClick={() => changeQty(item.product.id, 1)}>+</button>
                </div>
              </div>
            ))}
          </div>

          <div style={{ marginTop: 20, borderTop: "1px solid var(--border)", paddingTop: 20 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}><span>المجموع:</span><span>{formatMoney(subTotal)}</span></div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}><span>الخصم:</span><span>- {formatMoney(discountTotal)}</span></div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 20, fontWeight: 900 }}><span>الإجمالي:</span><span>{formatMoney(grandTotal)} ر.س</span></div>

            <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)} style={{ width: "100%", marginTop: 15, padding: 10, borderRadius: 8 }}>
              <option value="CASH">كاش</option>
              <option value="CARD">بطاقة</option>
              <option value="WALLET">محفظة</option>
            </select>

            <button
              onClick={checkout}
              disabled={cart.length === 0 || isCheckoutLoading}
              style={{ width: "100%", marginTop: 15, padding: 14, borderRadius: 10, background: "var(--brand-green)", color: "#fff", border: "none", cursor: "pointer", fontWeight: 800 }}
            >
              {isCheckoutLoading ? "جاري المعالجة..." : "إتمام الدفع"}
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
}

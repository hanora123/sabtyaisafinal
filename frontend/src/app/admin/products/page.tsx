"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Product = {
  id: string;
  name: string;
  sku: string;
  barcode: string | null;
  sellingPrice: number;
  costPrice: number;
  minStockLevel: number;
  status: string;
};

export default function ProductsAdminPage() {
  const router = useRouter();
  const apiBase = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function loadProducts() {
    setIsLoading(true);
    try {
      const resp = await fetch(`${apiBase}/v1/products/active`, {
        credentials: "include",
      });

      if (resp.status === 401) {
        router.push("/login");
        return;
      }

      if (!resp.ok) {
        throw new Error("فشل تحميل المنتجات");
      }

      const data = await resp.json();
      setProducts(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadProducts();
  }, []);

  async function deactivateProduct(id: string) {
    if (!confirm("هل أنت متأكد من تعطيل هذا المنتج؟")) return;

    try {
      const resp = await fetch(`${apiBase}/v1/products/${id}/deactivate`, {
        method: "POST",
        credentials: "include",
      });

      if (resp.ok) {
        loadProducts();
      } else {
        alert("فشل تعطيل المنتج");
      }
    } catch (err) {
      alert("خطأ في الاتصال");
    }
  }

  return (
    <div style={{ maxWidth: 1120, margin: "0 auto", padding: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <h1 style={{ margin: 0 }}>إدارة المنتجات</h1>
        <div style={{ display: "flex", gap: 10 }}>
          <button 
            onClick={() => router.push("/admin")}
            style={{ padding: "8px 16px", borderRadius: 10, cursor: "pointer", border: "1px solid var(--border)", background: "var(--surface)" }}
          >
            العودة للوحة الإدارة
          </button>
        </div>
      </div>

      {error && <div style={{ color: "red", marginBottom: 10 }}>{error}</div>}

      <div style={{ overflowX: "auto", border: "1px solid var(--border)", borderRadius: 12 }}>
        <table style={{ width: "100%", borderCollapse: "collapse", background: "var(--surface)" }}>
          <thead>
            <tr style={{ background: "var(--surface-2)", borderBottom: "1px solid var(--border)" }}>
              <th style={{ padding: 12, textAlign: "right" }}>اسم المنتج</th>
              <th style={{ padding: 12, textAlign: "right" }}>رمز الصنف (SKU)</th>
              <th style={{ padding: 12, textAlign: "right" }}>الباركود</th>
              <th style={{ padding: 12, textAlign: "right" }}>التكلفة</th>
              <th style={{ padding: 12, textAlign: "right" }}>سعر البيع</th>
              <th style={{ padding: 12, textAlign: "right" }}>الحد الأدنى</th>
              <th style={{ padding: 12, textAlign: "center" }}>إجراءات</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={7} style={{ padding: 20, textAlign: "center" }}>جاري التحميل...</td></tr>
            ) : products.length === 0 ? (
              <tr><td colSpan={7} style={{ padding: 20, textAlign: "center" }}>لا يوجد منتجات حالياً</td></tr>
            ) : (
              products.map((p) => (
                <tr key={p.id} style={{ borderBottom: "1px solid var(--border)" }}>
                  <td style={{ padding: 12 }}>{p.name}</td>
                  <td style={{ padding: 12 }}>{p.sku}</td>
                  <td style={{ padding: 12 }}>{p.barcode || "-"}</td>
                  <td style={{ padding: 12 }}>{p.costPrice}</td>
                  <td style={{ padding: 12 }}>{p.sellingPrice}</td>
                  <td style={{ padding: 12 }}>{p.minStockLevel}</td>
                  <td style={{ padding: 12, textAlign: "center" }}>
                    <button 
                      onClick={() => deactivateProduct(p.id)}
                      style={{ padding: "4px 8px", borderRadius: 6, color: "red", border: "1px solid red", background: "none", cursor: "pointer" }}
                    >
                      تعطيل
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

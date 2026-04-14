"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Supplier = {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  address: string | null;
};

export default function SuppliersAdminPage() {
  const router = useRouter();
  const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3000";

  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");

  async function loadSuppliers() {
    setIsLoading(true);
    try {
      const resp = await fetch(`${apiBase}/v1/suppliers`, { credentials: "include" });
      if (resp.status === 401) { router.push("/login"); return; }
      if (resp.ok) setSuppliers(await resp.json());
    } catch (err) { console.error(err); }
    finally { setIsLoading(false); }
  }

  useEffect(() => { loadSuppliers(); }, []);

  function resetForm() {
    setName(""); setPhone(""); setEmail(""); setAddress("");
    setEditingId(null); setShowForm(false);
  }

  function handleEdit(s: Supplier) {
    setName(s.name); setPhone(s.phone || ""); setEmail(s.email || ""); setAddress(s.address || "");
    setEditingId(s.id); setShowForm(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const url = editingId ? `${apiBase}/v1/suppliers/${editingId}` : `${apiBase}/v1/suppliers`;
    const method = editingId ? "PATCH" : "POST";

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ name, phone, email, address }),
      });

      if (res.ok) {
        alert("تم الحفظ بنجاح");
        resetForm();
        loadSuppliers();
      } else {
        alert("فشل الحفظ");
      }
    } catch (err) { alert("خطأ في الاتصال"); }
  }

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: 16, direction: "rtl" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <h1 style={{ margin: 0 }}>إدارة الموردين</h1>
        <div style={{ display: "flex", gap: 10 }}>
          <button 
            onClick={() => { resetForm(); setShowForm(!showForm); }}
            style={{ padding: "8px 16px", borderRadius: 10, cursor: "pointer", background: "var(--brand-blue)", color: "#fff", border: "none" }}
          >
            {showForm ? "إلغاء" : "+ إضافة مورد"}
          </button>
          <button 
            onClick={() => router.push("/admin")}
            style={{ padding: "8px 16px", borderRadius: 10, cursor: "pointer", border: "1px solid var(--border)", background: "var(--surface)" }}
          >
            العودة للوحة الإدارة
          </button>
        </div>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} style={{ background: "var(--surface)", padding: 20, borderRadius: 12, border: "1px solid var(--border)", marginBottom: 24, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <span>اسم المورد *</span>
            <input required value={name} onChange={(e) => setName(e.target.value)} style={{ padding: 10, borderRadius: 8, border: "1px solid var(--border)" }} />
          </label>
          <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <span>رقم الهاتف</span>
            <input value={phone} onChange={(e) => setPhone(e.target.value)} style={{ padding: 10, borderRadius: 8, border: "1px solid var(--border)" }} />
          </label>
          <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <span>البريد الإلكتروني</span>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} style={{ padding: 10, borderRadius: 8, border: "1px solid var(--border)" }} />
          </label>
          <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <span>العنوان</span>
            <input value={address} onChange={(e) => setAddress(e.target.value)} style={{ padding: 10, borderRadius: 8, border: "1px solid var(--border)" }} />
          </label>
          <button type="submit" style={{ gridColumn: "span 2", padding: 12, borderRadius: 10, background: "var(--brand-blue)", color: "#fff", border: "none", fontWeight: 800, cursor: "pointer" }}>
            {editingId ? "تحديث المورد" : "حفظ المورد"}
          </button>
        </form>
      )}

      <div style={{ overflowX: "auto", border: "1px solid var(--border)", borderRadius: 12 }}>
        <table style={{ width: "100%", borderCollapse: "collapse", background: "var(--surface)" }}>
          <thead style={{ background: "var(--surface-2)", borderBottom: "1px solid var(--border)" }}>
            <tr>
              <th style={{ padding: 12, textAlign: "right" }}>اسم المورد</th>
              <th style={{ padding: 12, textAlign: "right" }}>الهاتف</th>
              <th style={{ padding: 12, textAlign: "right" }}>البريد الإلكتروني</th>
              <th style={{ padding: 12, textAlign: "right" }}>العنوان</th>
              <th style={{ padding: 12, textAlign: "center" }}>إجراءات</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={5} style={{ padding: 20, textAlign: "center" }}>جاري التحميل...</td></tr>
            ) : suppliers.length === 0 ? (
              <tr><td colSpan={5} style={{ padding: 20, textAlign: "center" }}>لا يوجد موردين</td></tr>
            ) : (
              suppliers.map((s) => (
                <tr key={s.id} style={{ borderBottom: "1px solid var(--border)" }}>
                  <td style={{ padding: 12 }}>{s.name}</td>
                  <td style={{ padding: 12 }}>{s.phone || "-"}</td>
                  <td style={{ padding: 12 }}>{s.email || "-"}</td>
                  <td style={{ padding: 12 }}>{s.address || "-"}</td>
                  <td style={{ padding: 12, textAlign: "center" }}>
                    <button onClick={() => handleEdit(s)} style={{ padding: "4px 8px", borderRadius: 6, color: "var(--brand-blue)", border: "1px solid var(--brand-blue)", background: "none", cursor: "pointer" }}>
                      تعديل
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

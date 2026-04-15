"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type User = {
  id: string;
  email: string;
  username: string;
  fullName: string;
  status: string;
  userRoles: { role: { name: string } }[];
};

export default function UsersPage() {
  const router = useRouter();
  const apiBase = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  async function loadData() {
    setIsLoading(true);
    try {
      const res = await fetch(`${apiBase}/v1/users`, { credentials: "include" });
      if (res.status === 401) {
        router.push("/login");
        return;
      }
      if (res.ok) setUsers(await res.json());
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
        <h1>إدارة المستخدمين</h1>
      </div>

      <div style={{ marginBottom: 16 }}>
        <a href="/admin" style={{ color: "var(--brand-blue)", textDecoration: "none" }}>&larr; العودة للوحة الإدارة</a>
      </div>

      {isLoading ? (
        <p>جاري تحميل البيانات...</p>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 800 }}>
            <thead>
              <tr style={{ background: "var(--surface-2)", textAlign: "right" }}>
                <th style={{ padding: 12, borderBottom: "2px solid var(--border)" }}>الاسم</th>
                <th style={{ padding: 12, borderBottom: "2px solid var(--border)" }}>اسم المستخدم</th>
                <th style={{ padding: 12, borderBottom: "2px solid var(--border)" }}>البريد</th>
                <th style={{ padding: 12, borderBottom: "2px solid var(--border)" }}>الأدوار</th>
                <th style={{ padding: 12, borderBottom: "2px solid var(--border)" }}>الحالة</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id} style={{ borderBottom: "1px solid var(--border)" }}>
                  <td style={{ padding: 12, fontWeight: 500 }}>{u.fullName}</td>
                  <td style={{ padding: 12 }}>{u.username}</td>
                  <td style={{ padding: 12 }}>{u.email}</td>
                  <td style={{ padding: 12 }}>
                    {u.userRoles.map(ur => ur.role.name).join(", ")}
                  </td>
                  <td style={{ padding: 12 }}>
                    <span style={{
                      padding: "2px 8px",
                      borderRadius: 4,
                      fontSize: 12,
                      background: u.status === 'ACTIVE' ? "#e6f4ea" : "#fce8e6",
                      color: u.status === 'ACTIVE' ? "#1e8e3e" : "#d93025"
                    }}>
                      {u.status === 'ACTIVE' ? "نشط" : "معطل"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

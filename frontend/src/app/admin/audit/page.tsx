"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type AuditLog = {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  createdAt: string;
  ipAddress: string;
  user?: { fullName: string };
  metadata: any;
};

export default function AuditPage() {
  const router = useRouter();
  const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3000";

  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  async function loadData() {
    setIsLoading(true);
    try {
      const res = await fetch(`${apiBase}/v1/audit`, { credentials: "include" });
      if (res.status === 401) {
        router.push("/login");
        return;
      }
      if (res.ok) setLogs(await res.json());
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
        <h1>سجل النظام (Audit Log)</h1>
      </div>

      <div style={{ marginBottom: 16 }}>
        <a href="/admin" style={{ color: "var(--brand-blue)", textDecoration: "none" }}>&larr; العودة للوحة الإدارة</a>
      </div>

      {isLoading ? (
        <p>جاري تحميل البيانات...</p>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 900 }}>
            <thead>
              <tr style={{ background: "var(--surface-2)", textAlign: "right" }}>
                <th style={{ padding: 12, borderBottom: "2px solid var(--border)" }}>التاريخ</th>
                <th style={{ padding: 12, borderBottom: "2px solid var(--border)" }}>المستخدم</th>
                <th style={{ padding: 12, borderBottom: "2px solid var(--border)" }}>الإجراء</th>
                <th style={{ padding: 12, borderBottom: "2px solid var(--border)" }}>الكيان</th>
                <th style={{ padding: 12, borderBottom: "2px solid var(--border)" }}>IP</th>
                <th style={{ padding: 12, borderBottom: "2px solid var(--border)" }}>تفاصيل</th>
              </tr>
            </thead>
            <tbody>
              {logs.map(l => (
                <tr key={l.id} style={{ borderBottom: "1px solid var(--border)", fontSize: 13 }}>
                  <td style={{ padding: 12 }}>{new Date(l.createdAt).toLocaleString('ar-EG')}</td>
                  <td style={{ padding: 12 }}>{l.user?.fullName || "—"}</td>
                  <td style={{ padding: 12, fontWeight: "bold" }}>{l.action}</td>
                  <td style={{ padding: 12 }}>{l.entityType} ({l.entityId})</td>
                  <td style={{ padding: 12 }}>{l.ipAddress}</td>
                  <td style={{ padding: 12 }}>
                    <pre style={{ fontSize: 10, margin: 0, maxHeight: 60, overflow: "auto" }}>
                      {JSON.stringify(l.metadata, null, 2)}
                    </pre>
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

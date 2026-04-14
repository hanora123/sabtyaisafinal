"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Notification = {
  id: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
};

export default function NotificationsPage() {
  const router = useRouter();
  const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3000";

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  async function loadData() {
    setIsLoading(true);
    try {
      const res = await fetch(`${apiBase}/v1/notifications`, { credentials: "include" });
      if (res.status === 401) {
        router.push("/login");
        return;
      }
      if (res.ok) setNotifications(await res.json());
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

  async function markAsRead(id: string) {
    try {
      await fetch(`${apiBase}/v1/notifications/${id}/read`, {
        method: "POST",
        credentials: "include",
      });
      loadData();
    } catch (error) {
      console.error(error);
    }
  }

  async function markAllRead() {
    try {
      await fetch(`${apiBase}/v1/notifications/read-all`, {
        method: "POST",
        credentials: "include",
      });
      loadData();
    } catch (error) {
      console.error(error);
    }
  }

  return (
    <div style={{ maxWidth: 1120, margin: "0 auto", padding: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <h1>الإشعارات والتنبيهات</h1>
        {notifications.some(n => !n.isRead) && (
          <button onClick={markAllRead} style={{ padding: "8px 12px", borderRadius: 8, border: "1px solid var(--border)", background: "transparent", cursor: "pointer" }}>
            تم قراءة الكل
          </button>
        )}
      </div>

      <div style={{ marginBottom: 16 }}>
        <a href="/admin" style={{ color: "var(--brand-blue)", textDecoration: "none" }}>&larr; العودة للوحة الإدارة</a>
      </div>

      {isLoading ? (
        <p>جاري تحميل البيانات...</p>
      ) : (
        <div style={{ display: "grid", gap: 12 }}>
          {notifications.length === 0 ? (
            <p style={{ textAlign: "center", color: "rgba(0,0,0,0.5)", padding: 40 }}>لا توجد إشعارات حالياً.</p>
          ) : (
            notifications.map(n => (
              <div
                key={n.id}
                onClick={() => !n.isRead && markAsRead(n.id)}
                style={{
                  padding: 16,
                  borderRadius: 12,
                  border: "1px solid var(--border)",
                  background: n.isRead ? "var(--surface)" : "var(--surface-2)",
                  cursor: n.isRead ? "default" : "pointer",
                  display: "flex",
                  flexDirection: "column",
                  gap: 4,
                  position: "relative"
                }}
              >
                {!n.isRead && (
                  <div style={{
                    position: "absolute",
                    top: 16,
                    left: 16,
                    width: 10,
                    height: 10,
                    borderRadius: "50%",
                    background: "var(--brand-blue)"
                  }} />
                )}
                <div style={{ fontWeight: "bold", fontSize: 16 }}>{n.title}</div>
                <div style={{ color: "rgba(0,0,0,0.7)" }}>{n.message}</div>
                <div style={{ fontSize: 12, color: "rgba(0,0,0,0.5)", marginTop: 4 }}>
                  {new Date(n.createdAt).toLocaleString('ar-EG')}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

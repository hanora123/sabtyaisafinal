"use client";

import Link from "next/link";
import { AuthProvider, useAuth } from "./auth-context";
import { RealtimeProvider, useRealtime } from "./realtime-context";
import "./globals.css";

function AppHeader() {
  const { user, logout } = useAuth();
  const { notifications } = useRealtime() || { notifications: [] };
  const unreadCount = notifications.length;

  return (
    <header
      className="app-header"
      style={{
        padding: "16px 20px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: 12,
        borderBottom: "1px solid var(--border)",
        background: "var(--surface)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: 12,
            background: "linear-gradient(135deg, var(--brand-blue), var(--brand-green))",
          }}
          aria-hidden
        />
        <div>
          <div style={{ fontWeight: 900, letterSpacing: -0.2 }}>الحنوره للتجارة</div>
          <div style={{ fontSize: 12, color: "var(--muted)" }}>نقطة البيع • المخزون • المحاسبة</div>
        </div>
      </div>
      
      <nav style={{ display: "flex", gap: 12, alignItems: "center" }}>
        <Link className="pill-link" href="/">الرئيسية</Link>
        <Link className="pill-link" href="/pos">نقطة البيع</Link>
        <Link className="pill-link" href="/admin">لوحة الإدارة</Link>
        
        {user ? (
          <div style={{ display: "flex", alignItems: "center", gap: 12, borderRight: "1px solid var(--border)", paddingRight: 12, marginRight: 12 }}>
            <div style={{ fontSize: 13, display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
              <span style={{ fontWeight: 800 }}>{user.fullName}</span>
              <span style={{ fontSize: 11, color: "var(--brand-blue)" }}>{user.roles.join(", ")}</span>
            </div>
            
            <div style={{ position: "relative" }}>
               <span style={{ fontSize: 20 }}>🔔</span>
               {unreadCount > 0 && (
                 <span style={{ position: "absolute", top: -5, right: -5, background: "red", color: "#fff", fontSize: 10, padding: "2px 5px", borderRadius: "50%" }}>{unreadCount}</span>
               )}
            </div>

            <button onClick={logout} style={{ padding: "6px 12px", borderRadius: 8, background: "#fee", color: "red", border: "none", cursor: "pointer", fontWeight: "bold" }}>خروج</button>
          </div>
        ) : (
          <Link className="pill-link" href="/login">تسجيل الدخول</Link>
        )}
      </nav>
    </header>
  );
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl">
      <body>
        <AuthProvider>
          <RealtimeProvider>
            <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
              <AppHeader />
              <main style={{ flex: 1 }}>{children}</main>
            </div>
          </RealtimeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}

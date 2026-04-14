"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      if (!email || !password) {
        setError("يرجى إدخال البريد الإلكتروني وكلمة المرور.");
        return;
      }

      const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3000";
      const resp = await fetch(`${apiBase}/v1/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, password }),
      });

      if (!resp.ok) {
        const text = await resp.text();
        setError(text || "فشل تسجيل الدخول. تأكد من البيانات.");
        return;
      }

      router.push("/pos");
    } catch {
      setError("تعذر الاتصال بالخادم. حاول مرة أخرى.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div style={{ maxWidth: 520, margin: "40px auto", padding: "0 16px" }}>
      <h1 style={{ marginBottom: 8 }}>تسجيل الدخول - الحنوره للتجارة</h1>
      <p style={{ marginBottom: 24, color: "rgba(0,0,0,0.65)" }}>
        هذه واجهة تجريبية. سيتم ربطها بمصادقة الخادم عند الجاهزية.
      </p>

      <form
        onSubmit={onSubmit}
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 12,
          border: "1px solid var(--border)",
          borderRadius: 12,
          padding: 16,
          background: "var(--surface)",
        }}
      >
        <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <span>البريد الإلكتروني</span>
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            type="email"
            autoComplete="email"
            style={{ padding: 10, borderRadius: 10, border: "1px solid var(--border)" }}
          />
        </label>

        <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <span>كلمة المرور</span>
          <input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            type="password"
            autoComplete="current-password"
            style={{ padding: 10, borderRadius: 10, border: "1px solid var(--border)" }}
          />
        </label>

        {error ? (
          <div style={{ color: "#b00020", fontWeight: 600 }}>{error}</div>
        ) : null}

        <button
          type="submit"
          disabled={isSubmitting}
          style={{
            marginTop: 6,
            padding: "12px 14px",
            borderRadius: 10,
            border: "none",
            background: "linear-gradient(135deg, var(--brand-blue), var(--brand-green))",
            color: "#fff",
            cursor: isSubmitting ? "not-allowed" : "pointer",
            fontWeight: 800,
          }}
        >
          {isSubmitting ? "جارٍ تسجيل الدخول..." : "دخول"}
        </button>
      </form>
    </div>
  );
}


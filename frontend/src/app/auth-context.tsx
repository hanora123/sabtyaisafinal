"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";

type User = { id: string; email: string; role: string; fullName: string };
type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  login: (user: User) => void;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();
  const apiBase = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

  async function checkAuth() {
    try {
      const res = await fetch(`${apiBase}/v1/auth/me`, { credentials: "include" });
      if (res.ok) {
        setUser(await res.json());
      } else {
        setUser(null);
        if (pathname !== "/login") router.push("/login");
      }
    } catch (e) {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    checkAuth();
  }, [pathname]);

  const login = (u: User) => setUser(u);
  const logout = async () => {
    await fetch(`${apiBase}/v1/auth/logout`, { method: "POST", credentials: "include" });
    setUser(null);
    router.push("/login");
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout }}>
      {isLoading ? (
        <div style={{ display: "flex", height: "100vh", alignItems: "center", justifyContent: "center", direction: "rtl" }}>
          جاري التحقق من الهوية...
        </div>
      ) : (
        children
      )}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};

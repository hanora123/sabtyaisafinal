"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";
import { useAuth } from "./auth-context";

type RealtimeContextType = {
  socket: Socket | null;
  notifications: any[];
};

const RealtimeContext = createContext<RealtimeContextType | undefined>(undefined);

export function RealtimeProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [notifications, setNotifications] = useState<any[]>([]);
  const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3000";

  useEffect(() => {
    if (user) {
      const s = io(apiBase, { withCredentials: true });
      
      s.on("connect", () => console.log("Connected to WebSocket"));
      
      s.on("stockUpdated", (data) => {
        // Show a temporary alert or update local state if needed
        console.log("Stock updated for inventory:", data);
      });

      s.on("notification", (notif) => {
        setNotifications(prev => [notif, ...prev]);
        // Simple browser notification if permitted
        if (Notification.permission === "granted") {
          new Notification(notif.title, { body: notif.message });
        }
      });

      setSocket(s);
      return () => { s.disconnect(); };
    }
  }, [user]);

  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

  return (
    <RealtimeContext.Provider value={{ socket, notifications }}>
      {children}
    </RealtimeContext.Provider>
  );
}

export const useRealtime = () => useContext(RealtimeContext);

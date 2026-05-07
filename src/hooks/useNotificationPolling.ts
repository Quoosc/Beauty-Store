"use client";
import { useEffect } from "react";
import { useNotificationStore } from "@/stores/notification.store";
import { useAuthStore } from "@/stores/auth.store";

export function useNotificationPolling() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const { startPolling, stopPolling } = useNotificationStore();

  useEffect(() => {
    if (!isAuthenticated) return;

    startPolling();

    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        stopPolling();
      } else {
        startPolling();
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      stopPolling();
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [isAuthenticated, startPolling, stopPolling]);
}

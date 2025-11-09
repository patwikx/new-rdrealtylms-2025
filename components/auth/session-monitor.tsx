"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";

interface SessionMonitorProps {
  checkInterval?: number; // in milliseconds, default 30 seconds
}

export function SessionMonitor({ checkInterval = 30000 }: SessionMonitorProps) {
  const router = useRouter();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const checkSession = async () => {
      try {
        const response = await fetch("/api/auth/validate-session", {
          method: "GET",
          cache: "no-store",
        });

        if (!response.ok) {
          // Session is invalid, force logout
          await signOut({ redirect: false });
          router.push("/auth/sign-in?error=SessionExpired");
        }
      } catch (error) {
        console.error("Session check failed:", error);
      }
    };

    // Initial check
    checkSession();

    // Set up periodic checks
    intervalRef.current = setInterval(checkSession, checkInterval);

    // Cleanup on unmount
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [checkInterval, router]);

  return null; // This component doesn't render anything
}

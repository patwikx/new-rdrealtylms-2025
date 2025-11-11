"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { toast } from "sonner";

interface SecurityMonitorProps {
  userBusinessUnitId: string;
  userRole: string;
}

export function SecurityMonitor({ userBusinessUnitId, userRole }: SecurityMonitorProps) {
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    // Extract business unit ID from pathname
    const pathSegments = pathname.split('/');
    const currentBusinessUnitId = pathSegments[1];

    // Security checks
    const performSecurityCheck = async () => {
      let shouldLogout = false;
      let reason = "";

      // Check if business unit ID is missing from URL
      if (!currentBusinessUnitId) {
        shouldLogout = true;
        reason = "Invalid URL structure detected";
      }
      // Check if business unit ID format is invalid
      else if (currentBusinessUnitId.length < 10 || !currentBusinessUnitId.startsWith('cm')) {
        shouldLogout = true;
        reason = "Invalid business unit format detected";
      }
      // Check if user is accessing unauthorized business unit
      // Only ADMIN and HR can access different business units
      else if (userRole !== "ADMIN" && userRole !== "HR" && currentBusinessUnitId !== userBusinessUnitId) {
        shouldLogout = true;
        reason = "Unauthorized business unit access detected";
      }

      if (shouldLogout) {
        try {
          toast.error(reason + ". Logging out for security.");
          await signOut({ 
            callbackUrl: "/auth/sign-in?error=SecurityViolation&logout=true",
            redirect: true 
          });
        } catch (error) {
          console.error("Security logout error:", error);
          router.push("/auth/sign-in?error=SecurityViolation&logout=true");
        }
      }
    };

    performSecurityCheck();
  }, [pathname, userBusinessUnitId, userRole, router]);

  // Don't render anything
  return null;
}
"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { toast } from "sonner";

interface SecurityMonitorProps {
  userBusinessUnitId: string;
  userRole: string;
  isAcctg?: boolean;
  isPurchaser?: boolean;
}

export function SecurityMonitor({ userBusinessUnitId, userRole, isAcctg, isPurchaser }: SecurityMonitorProps) {
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
      // ADMIN, HR, Accounting, and Purchasing users can access different business units
      else if (
        userRole !== "ADMIN" && 
        userRole !== "HR" && 
        !isAcctg && 
        !isPurchaser && 
        currentBusinessUnitId !== userBusinessUnitId
      ) {
        // Redirect to unauthorized page instead of logging out
        toast.error("You don't have access to this business unit");
        router.push(`/${userBusinessUnitId}/unauthorized`);
        return;
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
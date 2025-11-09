import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { headers } from 'next/headers';
import type { BusinessUnitItem } from '@/types/business-unit-types';
import { prisma } from '@/lib/prisma';
import "../globals.css";
import { Toaster } from 'sonner';
import { BusinessUnitProvider } from '@/context/business-unit-context';
import { SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import { SidebarWrapper } from '@/components/sidebar/sidebar-wrapper';
import type { Session } from 'next-auth';
import { AppSidebar } from '@/components/sidebar/app-sidebar';
import { Separator } from '@/components/ui/separator';
import { DynamicBreadcrumbs } from '@/components/dynamic-breadcurmbs';
import { SecurityMonitor } from '@/components/auth/security-monitor';
import { SessionMonitor } from '@/components/auth/session-monitor';

export const metadata = {
  title: "Dashboard | Leave Management System",
  description: "Leave Management System for RD Realty Group",
};

// Type guard to ensure we have a complete user session
function isValidUserSession(session: Session | null): session is Session & {
  user: NonNullable<Session['user']> & {
    businessUnit: NonNullable<Session['user']['businessUnit']>;
    role: NonNullable<Session['user']['role']>;
  }
} {
  return !!(
    session?.user?.id &&
    session.user.businessUnit?.id &&
    session.user.role
  );
}

// Helper function to check if user is admin based on role
function isUserAdmin(role: string): boolean {
  const adminRoles = ['ADMIN', 'HR'] as const;
  return adminRoles.includes(role as typeof adminRoles[number]);
}

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const headersList = await headers();
  const businessUnitId = headersList.get("x-business-unit-id");
  const session = await auth();

  // Redirect to sign-in if there's no session or user
  if (!session?.user) {
    redirect("/auth/sign-in");
  }

  // Note: User active status check removed as it's not in the current schema
  // If you need this functionality, add an 'isActive' field to your User model

  // Ensure we have a complete user session
  if (!isValidUserSession(session)) {
    redirect("/auth/sign-in?error=IncompleteProfile");
  }

  // Force logout if no business unit in URL - this indicates a malformed URL or tampering
  if (!businessUnitId) {
    redirect("/auth/sign-in?error=InvalidAccess&logout=true");
  }

  // Validate that the business unit ID is a valid format (basic validation)
  if (businessUnitId.length < 10 || !businessUnitId.startsWith('cm')) {
    redirect("/auth/sign-in?error=InvalidBusinessUnit&logout=true");
  }

  // Check if user is admin based on their role
  const isAdmin = isUserAdmin(session.user.role);

  // Check if user is authorized for the requested business unit
  // Admins can access any unit, regular users can only access their assigned unit
  const isAuthorizedForUnit = isAdmin || session.user.businessUnit.id === businessUnitId;

  // Force logout if user is not authorized for the requested unit
  if (!isAuthorizedForUnit) {
    redirect("/auth/sign-in?error=UnauthorizedAccess&logout=true");
  }

  let businessUnits: BusinessUnitItem[] = [];

  // If the user is an admin, fetch all business units from the database
  if (isAdmin) {
    try {
      businessUnits = await prisma.businessUnit.findMany({
        orderBy: { name: "asc" },
        select: {
          id: true,
          code: true,
          name: true,
          image: true,
        },
      });
    } catch (error) {
      console.error("Failed to fetch business units:", error);
      // Fallback to user's own business unit
      businessUnits = [{
        id: session.user.businessUnit.id,
        code: session.user.businessUnit.code,
        name: session.user.businessUnit.name,
        image: null,
      }];
    }
  } else {
    // Regular users only see their assigned business unit, but they should still see the logo
    try {
      const userBusinessUnit = await prisma.businessUnit.findUnique({
        where: { id: session.user.businessUnit.id },
        select: {
          id: true,
          code: true,
          name: true,
          image: true,
        },
      });

      businessUnits = [{
        id: userBusinessUnit?.id || session.user.businessUnit.id,
        code: userBusinessUnit?.code || session.user.businessUnit.code,
        name: userBusinessUnit?.name || session.user.businessUnit.name,
        image: userBusinessUnit?.image || null,
      }];
    } catch (error) {
      console.error("Failed to fetch user's business unit:", error);
      // Fallback without image
      businessUnits = [{
        id: session.user.businessUnit.id,
        code: session.user.businessUnit.code,
        name: session.user.businessUnit.name,
        image: null,
      }];
    }
  }

  // Fetch complete user data including profile picture
  let completeUserData = null;
  try {
    completeUserData = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        employeeId: true,
        role: true,
        classification: true,
        profilePicture: true,
        businessUnit: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        department: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
  } catch (error) {
    console.error("Failed to fetch complete user data:", error);
  }

  // Create enhanced session with profile picture
  const enhancedSession = {
    ...session,
    user: {
      ...session.user,
      profilePicture: completeUserData?.profilePicture || null,
    },
  };

  return (
    <SidebarWrapper>
      {/* Security Monitor - Client-side security checks */}
      <SecurityMonitor 
        userBusinessUnitId={session.user.businessUnit.id}
        userRole={session.user.role}
      />
      
      {/* Session Monitor - Hybrid JWT + Database session validation */}
      <SessionMonitor checkInterval={30000} />
      
      <div className="min-h-screen flex w-full">
        {/* App Sidebar */}
        <AppSidebar 
          session={enhancedSession}
          businessUnits={businessUnits}
          currentBusinessUnitId={businessUnitId}
        />
        
        {/* Main Content Area */}
        <SidebarInset className="flex-1">
       {/* Header with breadcrumb */}
          <header className="flex h-16 shrink-0 items-center gap-2 px-4 border-b">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <DynamicBreadcrumbs businessUnitId={businessUnitId} />
          </header>

          {/* Main Content */}
          <main className="flex-1 p-4">
            <BusinessUnitProvider businessUnitId={businessUnitId}>
              {children}
            </BusinessUnitProvider>
          </main>
        </SidebarInset>

        {/* Toast Notifications */}
        <Toaster />
      </div>
    </SidebarWrapper>
  )
}
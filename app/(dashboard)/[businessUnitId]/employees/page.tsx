import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getUsers } from "@/lib/actions/user-management-actions";
import { UsersManagementView } from "@/components/users/users-management-view";

interface EmployeesPageProps {
  params: Promise<{
    businessUnitId: string;
  }>;
  searchParams: Promise<{
    role?: string;
    department?: string;
    status?: string;
    search?: string;
    page?: string;
  }>;
}

export default async function EmployeesPage({ params, searchParams }: EmployeesPageProps) {
  const session = await auth();
  
  if (!session?.user?.id) {
    redirect("/auth/sign-in");
  }
  
  // Check if user has employee management permissions (HR or ADMIN)
  if (session.user.role !== "ADMIN" && session.user.role !== "HR") {
    redirect("/unauthorized");
  }

  const { businessUnitId } = await params;
  const { role, department, status, search, page = "1" } = await searchParams;
  
  try {
    const usersData = await getUsers({
      businessUnitId,
      role,
      department,
      status,
      search,
      page: parseInt(page),
      limit: 10
    });
    
    return (
      <div className="space-y-6">
        <UsersManagementView 
          usersData={usersData}
          businessUnitId={businessUnitId}
          currentFilters={{
            role,
            department,
            status,
            search,
            page: parseInt(page)
          }}
          isAdmin={session.user.role === "ADMIN"}
          pageType="employees" // Add this to differentiate from admin users page
        />
      </div>
    );
  } catch (error) {
    console.error("Error loading employees:", error);
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Employee Management</h1>
          </div>
        </div>
        
        <div className="text-center py-12">
          <p className="text-muted-foreground">Unable to load employees. Please try again later.</p>
        </div>
      </div>
    );
  }
}
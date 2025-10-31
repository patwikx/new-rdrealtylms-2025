import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getLeaveTypes } from "@/lib/actions/leave-type-actions";
import { LeaveTypesManagementView } from "@/components/admin/leave-types-management-view";

interface LeaveTypesPageProps {
  params: {
    businessUnitId: string;
  };
  searchParams: Promise<{
    page?: string;
    search?: string;
  }>;
}

export default async function LeaveTypesPage({ 
  params, 
  searchParams 
}: LeaveTypesPageProps) {
  const session = await auth();
  
  if (!session?.user) {
    redirect("/auth/sign-in");
  }
  
  // Only admins can access leave types management
  if (session.user.role !== "ADMIN") {
    redirect(`/${params.businessUnitId}`);
  }
  
  const resolvedSearchParams = await searchParams;
  const page = resolvedSearchParams.page ? parseInt(resolvedSearchParams.page) : 1;
  const search = resolvedSearchParams.search || "";
  
  try {
    const leaveTypesData = await getLeaveTypes({
      businessUnitId: params.businessUnitId,
      page,
      search,
      limit: 20
    });
    
    return (
      <LeaveTypesManagementView
        leaveTypesData={leaveTypesData}
        businessUnitId={params.businessUnitId}
        currentPage={page}
        searchTerm={search}
      />
    );
  } catch (error) {
    console.error("Error loading leave types:", error);
    redirect(`/${params.businessUnitId}`);
  }
}
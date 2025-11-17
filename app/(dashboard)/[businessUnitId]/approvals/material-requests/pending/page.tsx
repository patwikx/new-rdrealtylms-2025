import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getPendingMaterialRequests } from "@/lib/actions/mrs-actions/material-request-approval-actions";
import { PendingMaterialRequestsView } from "@/components/approvals/pending-material-requests-view";

interface PendingMaterialRequestsPageProps {
  params: Promise<{
    businessUnitId: string;
  }>;
  searchParams: Promise<{
    status?: string;
    type?: string;
    page?: string;
  }>;
}

export default async function PendingMaterialRequestsPage({ 
  params, 
  searchParams 
}: PendingMaterialRequestsPageProps) {
  const session = await auth();
  
  if (!session?.user?.id) {
    redirect("/auth/sign-in");
  }
  
  const { businessUnitId } = await params;
  
  // Check if user has approval permissions
if (session.user.role !== "ADMIN" && session.user.role !== "HR" && session.user.role !== "MANAGER" && session.user.role !== "ACCTG_MANAGER" && session.user.role !== "PURCHASING_MANAGER") {
    redirect(`/${businessUnitId}/unauthorized`);
  }
  const { status, type, page = "1" } = await searchParams;
  
  try {
    const pendingRequestsData = await getPendingMaterialRequests({
      businessUnitId,
      status,
      type,
      page: parseInt(page),
      limit: 10
    });
    
    return (
      <div className="space-y-6">
        <PendingMaterialRequestsView 
          requestsData={pendingRequestsData}
          businessUnitId={businessUnitId}
          currentFilters={{
            status,
            type,
            page: parseInt(page)
          }}
          currentUserRole={session.user.role}
        />
      </div>
    );
  } catch (error) {
    console.error("Error loading pending material requests:", error);
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Pending Material Request Approvals</h1>
          </div>
        </div>
        
        <div className="text-center py-12">
          <p className="text-muted-foreground">Unable to load pending requests. Please try again later.</p>
        </div>
      </div>
    );
  }
}
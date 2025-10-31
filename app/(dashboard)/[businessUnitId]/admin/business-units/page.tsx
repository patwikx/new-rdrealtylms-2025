import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { BusinessUnitManagement } from "@/components/admin/business-unit-management";
import { getBusinessUnits, getUnassignedUsers } from "@/lib/actions/business-unit-actions";

interface BusinessUnitsPageProps {
  params: Promise<{
    businessUnitId: string;
  }>;
}

export default async function BusinessUnitsPage({ params }: BusinessUnitsPageProps) {
  const session = await auth();
  
  // Check if user is authenticated and is admin
  if (!session?.user) {
    redirect("/auth/sign-in");
  }
  
  if (session.user.role !== "ADMIN") {
    redirect("/unauthorized");
  }

  const { businessUnitId } = await params;

  // Fetch data for the admin interface
  const [businessUnits, unassignedUsers] = await Promise.all([
    getBusinessUnits(),
    getUnassignedUsers(),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Business Unit Management</h1>
          <p className="text-muted-foreground">
            Create business units and assign users to them.
          </p>
        </div>
      </div>
      
      <BusinessUnitManagement 
        businessUnits={businessUnits}
        unassignedUsers={unassignedUsers}
        businessUnitId={businessUnitId}
      />
    </div>
  );
}
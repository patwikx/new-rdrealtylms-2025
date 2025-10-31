import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getBusinessUnitById } from "@/lib/actions/business-unit-actions";
import { EditBusinessUnitForm } from "@/components/admin/edit-business-unit-form";

interface EditBusinessUnitPageProps {
  params: Promise<{
    businessUnitId: string;
    id: string;
  }>;
}

export default async function EditBusinessUnitPage({ params }: EditBusinessUnitPageProps) {
  const session = await auth();
  
  // Check if user is authenticated and is admin
  if (!session?.user) {
    redirect("/auth/sign-in");
  }
  
  if (session.user.role !== "ADMIN") {
    redirect("/unauthorized");
  }

  const { businessUnitId, id } = await params;
  
  try {
    const businessUnit = await getBusinessUnitById(id);
    
    if (!businessUnit) {
      redirect(`/${businessUnitId}/admin/business-units`);
    }
    
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Edit Business Unit</h1>
            <p className="text-muted-foreground">
              Update business unit information and manage employees.
            </p>
          </div>
        </div>
        
        <EditBusinessUnitForm 
          businessUnit={businessUnit} 
          businessUnitId={businessUnitId}
        />
      </div>
    );
  } catch (error) {
    console.error("Error loading business unit:", error);
    redirect(`/${businessUnitId}/admin/business-units`);
  }
}
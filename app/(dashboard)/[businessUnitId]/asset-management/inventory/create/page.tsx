import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { getAvailableEmployees, getAvailableLocations, getAvailableCategories } from "@/lib/actions/inventory-verification-actions"
import { CreateVerificationView } from "@/components/asset-management/create-verification-view"

interface CreateVerificationPageProps {
  params: Promise<{
    businessUnitId: string
  }>
}

export default async function CreateVerificationPage({ params }: CreateVerificationPageProps) {
  const session = await auth()
  
  if (!session?.user?.id) {
    redirect("/auth/sign-in")
  }
  
  // Check if user has asset management permissions
  if (!["ADMIN", "MANAGER", "HR"].includes(session.user.role)) {
    redirect("/unauthorized")
  }

  const { businessUnitId } = await params
  
  try {
    // Get business unit info
    const businessUnit = await getBusinessUnit(businessUnitId)
    
    if (!businessUnit) {
      redirect("/unauthorized")
    }

    // Load form data
    const [employees, locations, categories] = await Promise.all([
      getAvailableEmployees(businessUnitId),
      getAvailableLocations(businessUnitId),
      getAvailableCategories(businessUnitId)
    ])
    
    return (
      <div className="space-y-6">
        <CreateVerificationView 
          businessUnit={businessUnit}
          businessUnitId={businessUnitId}
          employees={employees}
          locations={locations}
          categories={categories}
        />
      </div>
    )
  } catch (error) {
    console.error("Error loading create verification page:", error)
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Create Verification</h1>
          </div>
        </div>
        
        <div className="text-center py-12">
          <p className="text-muted-foreground">Unable to load form data. Please try again later.</p>
        </div>
      </div>
    )
  }
}

async function getBusinessUnit(businessUnitId: string) {
  try {
    const { prisma } = await import("@/lib/prisma")
    return await prisma.businessUnit.findUnique({
      where: { id: businessUnitId },
      select: {
        id: true,
        name: true,
        code: true
      }
    })
  } catch (error) {
    console.error("Error fetching business unit:", error)
    return null
  }
}
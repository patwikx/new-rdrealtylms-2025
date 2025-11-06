import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { getCategoryDetails } from "@/lib/actions/asset-categories-actions"
import { CategoryDetailsView } from "@/components/asset-management/category-details-view"

interface CategoryDetailsPageProps {
  params: Promise<{
    businessUnitId: string
    id: string
  }>
}

export default async function CategoryDetailsPage({ params }: CategoryDetailsPageProps) {
  const session = await auth()
  
  if (!session?.user?.id) {
    redirect("/auth/sign-in")
  }
  
  // Check if user has asset management permissions
  if (!["ADMIN", "MANAGER", "HR"].includes(session.user.role)) {
    redirect("/unauthorized")
  }

  const { businessUnitId, id } = await params
  
  try {
    // Get business unit info
    const businessUnit = await getBusinessUnit(businessUnitId)
    
    if (!businessUnit) {
      redirect("/unauthorized")
    }

    // Get category details
    const category = await getCategoryDetails(id, businessUnitId)
    
    return (
      <div className="space-y-6">
        <CategoryDetailsView 
          category={category}
          businessUnit={businessUnit}
          businessUnitId={businessUnitId}
        />
      </div>
    )
  } catch (error) {
    console.error("Error loading category details:", error)
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Category Details</h1>
          </div>
        </div>
        
        <div className="text-center py-12">
          <p className="text-muted-foreground">Category not found or unable to load details.</p>
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
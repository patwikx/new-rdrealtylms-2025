import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { getRetirableAssets } from "@/lib/actions/asset-retirement-actions"
import { AssetRetirementView } from "@/components/asset-management/asset-retirement-view"

interface AssetRetirementPageProps {
  params: Promise<{
    businessUnitId: string
  }>
  searchParams: Promise<{
    categoryId?: string
    search?: string
    page?: string
  }>
}

export default async function AssetRetirementPage({ params, searchParams }: AssetRetirementPageProps) {
  const session = await auth()
  
  if (!session?.user?.id) {
    redirect("/auth/sign-in")
  }
  
  // Check if user has asset management permissions
  if (!["ADMIN", "MANAGER", "HR"].includes(session.user.role)) {
    redirect("/unauthorized")
  }

  const { businessUnitId } = await params
  const { categoryId, search, page = "1" } = await searchParams
  
  try {
    // Get business unit info
    const businessUnit = await getBusinessUnit(businessUnitId)
    
    if (!businessUnit) {
      redirect("/unauthorized")
    }

    // Get assets available for retirement
    const retirableAssetsData = await getRetirableAssets({
      businessUnitId,
      categoryId,
      search,
      page: parseInt(page),
      limit: 100
    })
    
    return (
      <div className="space-y-6">
        <AssetRetirementView 
          retirableAssetsData={retirableAssetsData}
          businessUnit={businessUnit}
          businessUnitId={businessUnitId}
          currentFilters={{
            categoryId,
            search,
            page: parseInt(page)
          }}
        />
      </div>
    )
  } catch (error) {
    console.error("Error loading asset retirement page:", error)
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Asset Retirements</h1>
          </div>
        </div>
        
        <div className="text-center py-12">
          <p className="text-muted-foreground">Unable to load assets. Please try again later.</p>
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
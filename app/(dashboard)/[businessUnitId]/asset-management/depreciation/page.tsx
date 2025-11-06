import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { getDepreciationData } from "@/lib/actions/asset-depreciation-actions"
import { AssetDepreciationView } from "@/components/asset-management/asset-depreciation-view"

interface AssetDepreciationPageProps {
  params: Promise<{
    businessUnitId: string
  }>
  searchParams: Promise<{
    categoryId?: string
    search?: string
    page?: string
    view?: 'overview' | 'schedule' | 'history'
    period?: string
  }>
}

export default async function AssetDepreciationPage({ params, searchParams }: AssetDepreciationPageProps) {
  const session = await auth()
  
  if (!session?.user?.id) {
    redirect("/auth/sign-in")
  }
  
  // Check if user has asset management permissions
  if (!["ADMIN", "MANAGER", "HR"].includes(session.user.role)) {
    redirect("/unauthorized")
  }

  const { businessUnitId } = await params
  const { categoryId, search, page = "1", view = "overview", period } = await searchParams
  
  try {
    // Get business unit info
    const businessUnit = await getBusinessUnit(businessUnitId)
    
    if (!businessUnit) {
      redirect("/unauthorized")
    }

    // Get depreciation data based on view
    const depreciationData = await getDepreciationData({
      businessUnitId,
      categoryId,
      search,
      page: parseInt(page),
      limit: 100,
      view,
      period
    })
    
    return (
      <div className="space-y-6">
        <AssetDepreciationView 
          depreciationData={depreciationData}
          businessUnit={businessUnit}
          businessUnitId={businessUnitId}
          currentFilters={{
            categoryId,
            search,
            page: parseInt(page),
            view,
            period
          }}
        />
      </div>
    )
  } catch (error) {
    console.error("Error loading asset depreciation page:", error)
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Asset Depreciation</h1>
          </div>
        </div>
        
        <div className="text-center py-12">
          <p className="text-muted-foreground">Unable to load depreciation data. Please try again later.</p>
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
import { auth } from "@/auth"
import { CreateAssetForm } from "@/components/asset-management/create-asset-form"
import { redirect } from "next/navigation"


interface CreateAssetPageProps {
  params: Promise<{
    businessUnitId: string
  }>
}

export default async function CreateAssetPage({ params }: CreateAssetPageProps) {
  const session = await auth()
  
  if (!session?.user?.id) {
    redirect("/auth/sign-in")
  }
  
  // Check if user has asset management permissions
  if (!["ADMIN", "MANAGER", "HR"].includes(session.user.role)) {
    redirect("/unauthorized")
  }

  const { businessUnitId } = await params
  
  return (
    <div className="space-y-6">
      <CreateAssetForm businessUnitId={businessUnitId} />
    </div>
  )
}
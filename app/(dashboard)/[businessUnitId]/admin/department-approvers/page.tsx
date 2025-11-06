import { DepartmentApproversClient } from "@/components/department-approvers/department-approvers-client"

interface DepartmentApproversPageProps {
  params: Promise<{
    businessUnitId: string
  }>
}

export default async function DepartmentApproversPage({
  params,
}: DepartmentApproversPageProps) {
  const { businessUnitId } = await params

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Department Approvers</h2>
      </div>
      <DepartmentApproversClient businessUnitId={businessUnitId} />
    </div>
  )
}
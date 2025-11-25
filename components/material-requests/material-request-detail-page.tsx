/* eslint-disable @typescript-eslint/no-unused-vars */
"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Edit, X, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { MaterialRequest } from "@/types/material-request-types"
import { REQUEST_STATUS_COLORS, REQUEST_STATUS_LABELS } from "@/types/material-request-types"
import { MRSRequestStatus, ApprovalStatus } from "@prisma/client"
import { MaterialRequestEditForm } from "./material-request-edit-form"
import { MaterialRequestViewContent } from "./material-request-view-content"
import { MaterialRequestEditDescriptions } from "./material-request-edit-descriptions"

interface MaterialRequestDetailPageProps {
  materialRequest: MaterialRequest
  businessUnitId: string
  currentUserId: string
  isPurchaser: boolean
}

export function MaterialRequestDetailPage({
  materialRequest,
  currentUserId,
  isPurchaser,
}: MaterialRequestDetailPageProps) {
  const router = useRouter()
  const [isEditing, setIsEditing] = useState(false)
  const [isEditingDescriptions, setIsEditingDescriptions] = useState(false)

  // Check if any approval has been made (including budget approval)
  const hasAnyApproval = 
    materialRequest.budgetApprovalStatus === ApprovalStatus.APPROVED ||
    materialRequest.recApprovalStatus === ApprovalStatus.APPROVED || 
    materialRequest.finalApprovalStatus === ApprovalStatus.APPROVED

  // Requestor can edit if:
  // 1. They are the original requestor
  // 2. AND no approvals have been made yet (budget, rec, or final)
  // 3. AND status is not DISAPPROVED, POSTED, or DEPLOYED
  const isRequestor = materialRequest.requestedById === currentUserId
  const canEditAsRequestor = isRequestor && !hasAnyApproval && 
    materialRequest.status !== MRSRequestStatus.DISAPPROVED &&
    materialRequest.status !== MRSRequestStatus.POSTED &&
    materialRequest.status !== MRSRequestStatus.DEPLOYED

  // Purchaser can always prompt for edit (via mark for edit feature)
  // But for full edit, only if marked for edit by themselves
  const canEdit = canEditAsRequestor

  // Can edit descriptions if marked for edit by purchaser
  const canEditDescriptions = materialRequest.isMarkedForEdit && !materialRequest.editCompletedAt && isRequestor

  const handleEditSuccess = () => {
    setIsEditing(false)
    router.refresh()
  }

  const handleDescriptionEditSuccess = () => {
    setIsEditingDescriptions(false)
    router.refresh()
  }

  return (
    <div className="w-full max-w-none px-4 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className="h-6 w-px bg-border" />
          <div>
            <h1 className="text-2xl font-bold">{materialRequest.docNo}</h1>
            <p className="text-muted-foreground">
              {materialRequest.type === "ITEM" ? "Item Request" : "Service Request"}
            </p>
          </div>
          <Badge 
            variant="secondary" 
            className={REQUEST_STATUS_COLORS[materialRequest.status]}
          >
            {REQUEST_STATUS_LABELS[materialRequest.status]}
          </Badge>
          {materialRequest.isStoreUse && (
            <Badge variant="outline" className="gap-1 bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800">
              Store Use
            </Badge>
          )}
          {materialRequest.isWithinBudget !== null && (
            <Badge 
              variant="outline" 
              className={materialRequest.isWithinBudget 
                ? "gap-1 bg-green-50 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-300 dark:border-green-800"
                : "gap-1 bg-red-50 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-300 dark:border-red-800"
              }
            >
              {materialRequest.isWithinBudget ? "Within Budget" : "Not Within Budget"}
            </Badge>
          )}
          {materialRequest.isMarkedForEdit && !materialRequest.editCompletedAt && (
            <Badge variant="destructive" className="gap-1">
              <AlertCircle className="h-3 w-3" />
              Needs Edit
            </Badge>
          )}
        </div>
        
        <div className="flex gap-2">
          {isEditing ? (
            <Button
              variant="outline"
              onClick={() => setIsEditing(false)}
              className="gap-2"
            >
              <X className="h-4 w-4" />
              Cancel Edit
            </Button>
          ) : isEditingDescriptions ? (
            <Button
              variant="outline"
              onClick={() => setIsEditingDescriptions(false)}
              className="gap-2"
            >
              <X className="h-4 w-4" />
              Cancel
            </Button>
          ) : (
            <>
              {canEditDescriptions && (
                <Button
                  onClick={() => setIsEditingDescriptions(true)}
                  variant="destructive"
                  className="gap-2"
                >
                  <Edit className="h-4 w-4" />
                  Edit Descriptions
                </Button>
              )}
              {canEdit && (
                <Button
                  onClick={() => setIsEditing(true)}
                  className="gap-2"
                >
                  <Edit className="h-4 w-4" />
                  Edit Request
                </Button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Alert for marked for edit */}
      {materialRequest.isMarkedForEdit && !materialRequest.editCompletedAt && !isEditingDescriptions && (
        <div className="mb-6 p-4 border-l-4 border-destructive bg-destructive/10 rounded">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
            <div className="flex-1 space-y-1">
              <p className="font-semibold text-destructive">This request has been marked for edit by the purchaser</p>
              {materialRequest.markedForEditReason && (() => {
                const parts = materialRequest.markedForEditReason.split('\n\nItems to edit:\n')
                const reason = parts[0]
                const items = parts[1]
                
                return (
                  <div className="text-sm space-y-1">
                    {reason && reason !== 'Items to edit:' && (
                      <p><span className="font-medium">Reason:</span> {reason}</p>
                    )}
                    {items && (
                      <p><span className="font-medium">Items to edit:</span> {items}</p>
                    )}
                  </div>
                )
              })()}
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      {isEditing ? (
        <MaterialRequestEditForm
          materialRequest={materialRequest}
          onSuccess={handleEditSuccess}
          onCancel={() => setIsEditing(false)}
        />
      ) : isEditingDescriptions ? (
        <MaterialRequestEditDescriptions
          materialRequest={materialRequest}
          onSuccess={handleDescriptionEditSuccess}
          onCancel={() => setIsEditingDescriptions(false)}
        />
      ) : (
        <MaterialRequestViewContent materialRequest={materialRequest} />
      )}
    </div>
  )
}
"use server"

import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { MRSRequestStatus, ApprovalStatus } from "@prisma/client"
import { revalidatePath } from "next/cache"

export interface PendingMaterialRequest {
  id: string
  docNo: string
  series: string
  type: "ITEM" | "SERVICE"
  status: MRSRequestStatus
  datePrepared: Date
  dateRequired: Date
  total: number
  purpose: string | null
  deliverTo: string | null
  remarks: string | null
  createdAt: Date
  requestedBy: {
    id: string
    name: string
    employeeId: string
    profilePicture?: string | null
  }
  businessUnit: {
    id: string
    name: string
  }
  department: {
    id: string
    name: string
  } | null
  items: {
    id: string
    description: string
    quantity: number
    uom: string
    unitPrice: number | null
  }[]
  recApprovalStatus: ApprovalStatus | null
  finalApprovalStatus: ApprovalStatus | null
}

export interface PendingMaterialRequestsResponse {
  materialRequests: PendingMaterialRequest[]
  pagination: {
    currentPage: number
    totalPages: number
    totalCount: number
    hasNext: boolean
    hasPrev: boolean
  }
}

interface GetPendingMaterialRequestsParams {
  businessUnitId: string
  status?: string
  type?: string
  page?: number
  limit?: number
}

export async function getPendingMaterialRequests({
  businessUnitId,
  status,
  type,
  page = 1,
  limit = 10
}: GetPendingMaterialRequestsParams): Promise<PendingMaterialRequestsResponse> {
  const session = await auth()
  
  if (!session?.user?.id) {
    throw new Error("Unauthorized")
  }

  const userId = session.user.id
  const userEmployeeId = session.user.employeeId

  try {
    // Special case: If user is C-002, show all requests across all business units
    const isSpecialApprover = userEmployeeId === 'C-002'
    
    // Build where clause for pending requests assigned to the current user
    const whereClause: any = {
      // Only filter by businessUnitId if NOT the special approver
      ...(isSpecialApprover ? {} : { businessUnitId }),
      OR: [
        // For recommending approval - user is the recommending approver and status is FOR_REC_APPROVAL
        {
          AND: [
            { recApproverId: userId },
            { status: MRSRequestStatus.FOR_REC_APPROVAL },
            {
              OR: [
                { recApprovalStatus: null },
                { recApprovalStatus: ApprovalStatus.PENDING }
              ]
            }
          ]
        },
        // For final approval - user is the final approver, rec approval is done, and status is FOR_FINAL_APPROVAL
        {
          AND: [
            { finalApproverId: userId },
            { status: MRSRequestStatus.FOR_FINAL_APPROVAL },
            { recApprovalStatus: ApprovalStatus.APPROVED },
            {
              OR: [
                { finalApprovalStatus: null },
                { finalApprovalStatus: ApprovalStatus.PENDING }
              ]
            }
          ]
        }
      ]
    }


    // Add status filter if provided
    if (status && status !== "all-status") {
      whereClause.status = status as MRSRequestStatus
    }

    // Add type filter if provided
    if (type && type !== "all-types") {
      whereClause.type = type
    }

    // Get total count
    const totalCount = await prisma.materialRequest.count({
      where: whereClause
    })


    // Calculate pagination
    const totalPages = Math.ceil(totalCount / limit)
    const skip = (page - 1) * limit

    // Get paginated results
    const materialRequests = await prisma.materialRequest.findMany({
      where: whereClause,
      include: {
        requestedBy: {
          select: {
            id: true,
            name: true,
            employeeId: true,
            profilePicture: true
          }
        },
        businessUnit: {
          select: {
            id: true,
            name: true
          }
        },
        department: {
          select: {
            id: true,
            name: true
          }
        },
        items: {
          select: {
            id: true,
            description: true,
            quantity: true,
            uom: true,
            unitPrice: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      skip,
      take: limit
    })

    return {
      materialRequests: materialRequests.map(request => ({
        ...request,
        freight: Number(request.freight),
        discount: Number(request.discount),
        total: Number(request.total),
        items: request.items.map(item => ({
          ...item,
          quantity: Number(item.quantity),
          unitPrice: item.unitPrice ? Number(item.unitPrice) : null
        }))
      })),
      pagination: {
        currentPage: page,
        totalPages,
        totalCount,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    }
  } catch (error) {
    console.error("Error fetching pending material requests:", error)
    throw new Error("Failed to fetch pending material requests")
  }
}

export async function approveMaterialRequest(
  requestId: string,
  businessUnitId: string,
  comments?: string
) {
  const session = await auth()
  
  if (!session?.user?.id) {
    return { error: "Unauthorized" }
  }

  const userId = session.user.id

  try {
    // Get the material request
    const materialRequest = await prisma.materialRequest.findUnique({
      where: { id: requestId },
      include: {
        requestedBy: true
      }
    })

    if (!materialRequest) {
      return { error: "Material request not found" }
    }

    if (materialRequest.businessUnitId !== businessUnitId) {
      return { error: "Unauthorized" }
    }

    // Determine approval type based on current status and user role
    let updateData: any = {}
    
    if (materialRequest.status === MRSRequestStatus.FOR_REC_APPROVAL && 
        materialRequest.recApproverId === userId) {
      // Recommending approval
      updateData = {
        recApprovalStatus: ApprovalStatus.APPROVED,
        recApprovalDate: new Date(),
        recApprovalRemarks: comments || null,
        status: MRSRequestStatus.REC_APPROVED
      }
      
      // If there's a final approver, move to final approval
      if (materialRequest.finalApproverId) {
        updateData.status = MRSRequestStatus.FOR_FINAL_APPROVAL
      } else {
        // No final approver, move directly to final approved
        updateData.status = MRSRequestStatus.FINAL_APPROVED
      }
    } else if (materialRequest.status === MRSRequestStatus.FOR_FINAL_APPROVAL && 
               materialRequest.finalApproverId === userId &&
               materialRequest.recApprovalStatus === ApprovalStatus.APPROVED) {
      // Final approval - move to FOR_SERVING so purchaser can serve it
      updateData = {
        finalApprovalStatus: ApprovalStatus.APPROVED,
        finalApprovalDate: new Date(),
        finalApprovalRemarks: comments || null,
        status: MRSRequestStatus.FOR_SERVING, // Changed from POSTED to FOR_SERVING
        dateApproved: new Date()
      }
    } else {
      return { error: "You are not authorized to approve this request" }
    }

    // Update the material request
    await prisma.materialRequest.update({
      where: { id: requestId },
      data: updateData
    })

    // Check if this was a final approval that moves to serving
    const isFinalApproval = materialRequest.status === MRSRequestStatus.FOR_FINAL_APPROVAL && 
                           materialRequest.finalApproverId === userId &&
                           materialRequest.recApprovalStatus === ApprovalStatus.APPROVED

    revalidatePath(`/${businessUnitId}/approvals/material-requests/pending`)
    revalidatePath(`/${businessUnitId}/mrs-coordinator/to-serve`)
    
    if (isFinalApproval) {
      return { success: "Material request approved and ready for serving!", isPosting: false }
    }
    
    return { success: "Material request approved successfully" }
  } catch (error) {
    console.error("Error approving material request:", error)
    return { error: "Failed to approve material request" }
  }
}

export async function rejectMaterialRequest(
  requestId: string,
  businessUnitId: string,
  comments: string
) {
  const session = await auth()
  
  if (!session?.user?.id) {
    return { error: "Unauthorized" }
  }

  const userId = session.user.id

  try {
    // Get the material request
    const materialRequest = await prisma.materialRequest.findUnique({
      where: { id: requestId },
      include: {
        requestedBy: true
      }
    })

    if (!materialRequest) {
      return { error: "Material request not found" }
    }

    if (materialRequest.businessUnitId !== businessUnitId) {
      return { error: "Unauthorized" }
    }

    // Determine rejection type based on current status and user role
    let updateData: any = {
      status: MRSRequestStatus.DISAPPROVED
    }
    
    if (materialRequest.status === MRSRequestStatus.FOR_REC_APPROVAL && 
        materialRequest.recApproverId === userId) {
      // Recommending rejection
      updateData.recApprovalStatus = ApprovalStatus.DISAPPROVED
      updateData.recApprovalDate = new Date()
      updateData.recApprovalRemarks = comments
    } else if (materialRequest.status === MRSRequestStatus.FOR_FINAL_APPROVAL && 
               materialRequest.finalApproverId === userId) {
      // Final rejection
      updateData.finalApprovalStatus = ApprovalStatus.DISAPPROVED
      updateData.finalApprovalDate = new Date()
      updateData.finalApprovalRemarks = comments
    } else {
      return { error: "You are not authorized to reject this request" }
    }

    // Update the material request
    await prisma.materialRequest.update({
      where: { id: requestId },
      data: updateData
    })

    revalidatePath(`/${businessUnitId}/approvals/material-requests/pending`)
    
    return { success: "Material request rejected successfully" }
  } catch (error) {
    console.error("Error rejecting material request:", error)
    return { error: "Failed to reject material request" }
  }
}
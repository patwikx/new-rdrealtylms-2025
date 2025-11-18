"use server"

import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/prisma"
import { MRSRequestStatus, RequestType, ApprovalStatus, ApproverType } from "@prisma/client"
import { z } from "zod"
import { auth } from "@/auth"
import { Decimal } from "@prisma/client/runtime/library"

// Validation schemas
const MaterialRequestItemSchema = z.object({
  itemCode: z.string().optional(),
  description: z.string().min(1, "Description is required"),
  uom: z.string().min(1, "Unit of measurement is required"),
  quantity: z.number().positive("Quantity must be positive"),
  unitPrice: z.number().optional(),
  remarks: z.string().optional(),
  isNew: z.boolean().default(true),
}).refine((data) => {
  if (!data.isNew && !data.itemCode) {
    return false
  }
  return true
}, {
  message: "Item code is required for existing items",
  path: ["itemCode"]
})

const CreateMaterialRequestSchema = z.object({
  docNo: z.string().optional(), // Will be generated server-side
  series: z.string().min(1, "Series is required"),
  type: z.nativeEnum(RequestType),
  status: z.nativeEnum(MRSRequestStatus).default(MRSRequestStatus.DRAFT),
  datePrepared: z.date(),
  dateRequired: z.date(),
  businessUnitId: z.string().min(1, "Business unit is required"),
  departmentId: z.string().optional(),
  recApproverId: z.string().optional(),
  finalApproverId: z.string().optional(),
  chargeTo: z.string().optional(),
  purpose: z.string().optional(),
  remarks: z.string().optional(),
  deliverTo: z.string().optional(),
  freight: z.number().default(0),
  discount: z.number().default(0),
  items: z.array(MaterialRequestItemSchema).min(1, "At least one item is required"),
})

const UpdateMaterialRequestSchema = z.object({
  id: z.string(),
  type: z.nativeEnum(RequestType),
  datePrepared: z.date(),
  dateRequired: z.date(),
  businessUnitId: z.string().min(1, "Business unit is required"),
  departmentId: z.string().optional(),
  recApproverId: z.string().optional(),
  finalApproverId: z.string().optional(),
  chargeTo: z.string().optional(),
  purpose: z.string().optional(),
  remarks: z.string().optional(),
  deliverTo: z.string().optional(),
  freight: z.number().default(0),
  discount: z.number().default(0),
  items: z.array(MaterialRequestItemSchema).min(1, "At least one item is required"),
})

const ApprovalSchema = z.object({
  requestId: z.string(),
  status: z.nativeEnum(ApprovalStatus),
  remarks: z.string().optional(),
})

export type CreateMaterialRequestInput = z.infer<typeof CreateMaterialRequestSchema>
export type UpdateMaterialRequestInput = z.infer<typeof UpdateMaterialRequestSchema>
export type ApprovalInput = z.infer<typeof ApprovalSchema>

export interface ActionResult {
  success: boolean
  message: string
  data?: {
    autoPosted?: boolean
    [key: string]: unknown
  }
}

// Generate document number
async function generateDocumentNumber(series: string): Promise<string> {
  const currentYear = new Date().getFullYear()
  const yearSuffix = currentYear.toString().slice(-2)
  
  // Get the latest document number for this series
  const latestRequest = await prisma.materialRequest.findFirst({
    where: {
      series: series,
      docNo: {
        contains: `-${yearSuffix}-`
      }
    },
    orderBy: {
      docNo: 'desc'
    }
  })

  let nextNumber = 1
  if (latestRequest) {
    const parts = latestRequest.docNo.split('-')
    if (parts.length >= 3) {
      const lastNumber = parseInt(parts[2])
      if (!isNaN(lastNumber)) {
        nextNumber = lastNumber + 1
      }
    }
  }

  return `${series}-${yearSuffix}-${nextNumber.toString().padStart(5, '0')}`
}

export async function createMaterialRequest(input: CreateMaterialRequestInput): Promise<ActionResult> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, message: "Unauthorized" }
    }

    const validatedData = CreateMaterialRequestSchema.parse(input)
    


    // Generate document number automatically
    const docNo = await generateDocumentNumber(validatedData.series)

    // Calculate total
    const total = validatedData.items.reduce((sum, item) => {
      const itemTotal = (item.unitPrice || 0) * item.quantity
      return sum + itemTotal
    }, 0) + validatedData.freight - validatedData.discount

    // Create the material request with items
    const materialRequest = await prisma.materialRequest.create({
      data: {
        docNo: docNo,
        series: validatedData.series,
        type: validatedData.type,
        status: validatedData.status,
        datePrepared: validatedData.datePrepared,
        dateRequired: validatedData.dateRequired,
        businessUnitId: validatedData.businessUnitId,
        departmentId: validatedData.departmentId || null,
        recApproverId: validatedData.recApproverId || null,
        finalApproverId: validatedData.finalApproverId || null,
        chargeTo: validatedData.chargeTo || null,
        purpose: validatedData.purpose || null,
        remarks: validatedData.remarks || null,
        deliverTo: validatedData.deliverTo || null,
        freight: new Decimal(validatedData.freight),
        discount: new Decimal(validatedData.discount),
        total: new Decimal(total),
        requestedById: session.user.id,
        items: {
          create: validatedData.items.map(item => ({
            itemCode: item.itemCode || null,
            description: item.description,
            uom: item.uom,
            quantity: new Decimal(item.quantity),
            unitPrice: item.unitPrice ? new Decimal(item.unitPrice) : null,
            totalPrice: item.unitPrice ? new Decimal(item.unitPrice * item.quantity) : null,
            remarks: item.remarks || null,
          }))
        }
      },
      include: {
        items: true,
        businessUnit: true,
        department: true,
        requestedBy: {
          select: {
            id: true,
            name: true,
            email: true,
            employeeId: true,
          }
        },
      }
    })

    // Convert Decimal fields to numbers for client serialization
    const serializedMaterialRequest = {
      ...materialRequest,
      freight: Number(materialRequest.freight),
      discount: Number(materialRequest.discount),
      total: Number(materialRequest.total),
      items: materialRequest.items.map(item => ({
        ...item,
        quantity: Number(item.quantity),
        unitPrice: item.unitPrice ? Number(item.unitPrice) : null,
        totalPrice: item.totalPrice ? Number(item.totalPrice) : null,
      }))
    }

    revalidatePath("/material-requests")
    
    return {
      success: true,
      message: "Material request created successfully",
      data: serializedMaterialRequest
    }
  } catch (error) {
    console.error("Error creating material request:", error)
    
    if (error instanceof z.ZodError) {
      const firstError = error.issues[0]
      const fieldPath = firstError.path.join('.')
      return {
        success: false,
        message: `Validation error in ${fieldPath}: ${firstError.message}`
      }
    }

    return {
      success: false,
      message: "Failed to create material request"
    }
  }
}

export async function updateMaterialRequest(input: UpdateMaterialRequestInput): Promise<ActionResult> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, message: "Unauthorized" }
    }

    const validatedData = UpdateMaterialRequestSchema.parse(input)

    // Check if user can edit this request
    const existingRequest = await prisma.materialRequest.findUnique({
      where: { id: validatedData.id },
      include: { items: true }
    })

    if (!existingRequest) {
      return { success: false, message: "Material request not found" }
    }

    if (existingRequest.requestedById !== session.user.id && !["ADMIN", "MANAGER"].includes(session.user.role)) {
      return { success: false, message: "You can only edit your own requests" }
    }

    if (existingRequest.status !== MRSRequestStatus.DRAFT && existingRequest.status !== MRSRequestStatus.FOR_EDIT) {
      return { success: false, message: "Cannot edit request in current status" }
    }

    // Calculate total
    const total = validatedData.items.reduce((sum, item) => {
      const itemTotal = (item.unitPrice || 0) * item.quantity
      return sum + itemTotal
    }, 0) + validatedData.freight - validatedData.discount

    // Update the material request
    const materialRequest = await prisma.$transaction(async (tx) => {
      // Delete existing items
      await tx.materialRequestItem.deleteMany({
        where: { materialRequestId: validatedData.id }
      })

      // Update request and create new items
      return await tx.materialRequest.update({
        where: { id: validatedData.id },
        data: {
          type: validatedData.type,
          datePrepared: validatedData.datePrepared,
          dateRequired: validatedData.dateRequired,
          businessUnitId: validatedData.businessUnitId,
          departmentId: validatedData.departmentId || null,
          chargeTo: validatedData.chargeTo || null,
          purpose: validatedData.purpose || null,
          remarks: validatedData.remarks || null,
          deliverTo: validatedData.deliverTo || null,
          freight: new Decimal(validatedData.freight),
          discount: new Decimal(validatedData.discount),
          total: new Decimal(total),
          status: MRSRequestStatus.DRAFT, // Reset to draft when edited
          items: {
            create: validatedData.items.map(item => ({
              itemCode: item.itemCode || null,
              description: item.description,
              uom: item.uom,
              quantity: new Decimal(item.quantity),
              unitPrice: item.unitPrice ? new Decimal(item.unitPrice) : null,
              totalPrice: item.unitPrice ? new Decimal(item.unitPrice * item.quantity) : null,
              remarks: item.remarks || null,
            }))
          }
        },
        include: {
          items: true,
          businessUnit: true,
          department: true,
          requestedBy: {
            select: {
              id: true,
              name: true,
              email: true,
              employeeId: true,
            }
          },
        }
      })
    })

    // Convert Decimal fields to numbers for client serialization
    const serializedMaterialRequest = {
      ...materialRequest,
      freight: Number(materialRequest.freight),
      discount: Number(materialRequest.discount),
      total: Number(materialRequest.total),
      items: materialRequest.items.map(item => ({
        ...item,
        quantity: Number(item.quantity),
        unitPrice: item.unitPrice ? Number(item.unitPrice) : null,
        totalPrice: item.totalPrice ? Number(item.totalPrice) : null,
      }))
    }

    revalidatePath("/material-requests")
    
    return {
      success: true,
      message: "Material request updated successfully",
      data: serializedMaterialRequest
    }
  } catch (error) {
    console.error("Error updating material request:", error)
    
    if (error instanceof z.ZodError) {
      return {
        success: false,
        message: error.message || "Validation error"
      }
    }

    return {
      success: false,
      message: "Failed to update material request"
    }
  }
}

export async function deleteMaterialRequest(requestId: string): Promise<ActionResult> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, message: "Unauthorized" }
    }

    const existingRequest = await prisma.materialRequest.findUnique({
      where: { id: requestId }
    })

    if (!existingRequest) {
      return { success: false, message: "Material request not found" }
    }

    if (existingRequest.requestedById !== session.user.id && !["ADMIN", "MANAGER"].includes(session.user.role)) {
      return { success: false, message: "You can only delete your own requests" }
    }

    if (existingRequest.status !== MRSRequestStatus.DRAFT) {
      return { success: false, message: "Cannot delete request in current status" }
    }

    await prisma.materialRequest.delete({
      where: { id: requestId }
    })

    revalidatePath("/material-requests")
    
    return {
      success: true,
      message: "Material request deleted successfully"
    }
  } catch (error) {
    console.error("Error deleting material request:", error)
    
    return {
      success: false,
      message: "Failed to delete material request"
    }
  }
}

export async function submitForApproval(requestId: string): Promise<ActionResult> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, message: "Unauthorized" }
    }

    const existingRequest = await prisma.materialRequest.findUnique({
      where: { id: requestId },
      include: {
        department: {
          include: {
            approvers: {
              where: { 
                isActive: true,
                approverType: ApproverType.RECOMMENDING 
              },
              include: { employee: true }
            }
          }
        }
      }
    })

    if (!existingRequest) {
      return { success: false, message: "Material request not found" }
    }

    if (existingRequest.requestedById !== session.user.id) {
      return { success: false, message: "You can only submit your own requests" }
    }

    if (existingRequest.status !== MRSRequestStatus.DRAFT) {
      return { success: false, message: "Request is not in draft status" }
    }

    // Check if approvers are assigned
    if (!existingRequest.recApproverId && !existingRequest.finalApproverId) {
      return { success: false, message: "No approvers assigned to this request" }
    }

    await prisma.materialRequest.update({
      where: { id: requestId },
      data: {
        status: MRSRequestStatus.FOR_REC_APPROVAL,
        recApprovalStatus: ApprovalStatus.PENDING,
      }
    })

    revalidatePath("/material-requests")
    
    return {
      success: true,
      message: "Material request submitted for approval successfully"
    }
  } catch (error) {
    console.error("Error submitting for approval:", error)
    
    return {
      success: false,
      message: "Failed to submit for approval"
    }
  }
}

// Get functions with proper typing
export async function getMaterialRequests(filters?: {
  status?: MRSRequestStatus
  businessUnitId?: string
  departmentId?: string
  requestedById?: string
  type?: RequestType
}) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return []
    }

    const whereClause: {
      status?: MRSRequestStatus
      businessUnitId?: string
      departmentId?: string
      requestedById?: string
      type?: RequestType
    } = {}

    if (filters?.status) {
      whereClause.status = filters.status
    }

    if (filters?.businessUnitId) {
      whereClause.businessUnitId = filters.businessUnitId
    }

    if (filters?.departmentId) {
      whereClause.departmentId = filters.departmentId
    }

    if (filters?.requestedById) {
      whereClause.requestedById = filters.requestedById
    }

    if (filters?.type) {
      whereClause.type = filters.type
    }

    const requests = await prisma.materialRequest.findMany({
      where: whereClause,
      include: {
        items: true,
        businessUnit: true,
        department: true,
        requestedBy: {
          select: {
            id: true,
            name: true,
            email: true,
            employeeId: true,
          }
        },
        recApprover: {
          select: {
            id: true,
            name: true,
            email: true,
            employeeId: true,
          }
        },
        finalApprover: {
          select: {
            id: true,
            name: true,
            email: true,
            employeeId: true,
          }
        },
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Convert Decimal fields to numbers for client serialization
    const serializedRequests = requests.map(request => ({
      ...request,
      freight: Number(request.freight),
      discount: Number(request.discount),
      total: Number(request.total),
      items: request.items.map(item => ({
        ...item,
        quantity: Number(item.quantity),
        unitPrice: item.unitPrice ? Number(item.unitPrice) : null,
        totalPrice: item.totalPrice ? Number(item.totalPrice) : null,
      }))
    }))

    return serializedRequests
  } catch (error) {
    console.error("Error fetching material requests:", error)
    return []
  }
}

export async function getMaterialRequestById(requestId: string) {
  try {
    const request = await prisma.materialRequest.findUnique({
      where: { id: requestId },
      include: {
        items: true,
        businessUnit: true,
        department: true,
        requestedBy: {
          select: {
            id: true,
            name: true,
            email: true,
            employeeId: true,
          }
        },
        recApprover: {
          select: {
            id: true,
            name: true,
            email: true,
            employeeId: true,
          }
        },
        finalApprover: {
          select: {
            id: true,
            name: true,
            email: true,
            employeeId: true,
          }
        },
      }
    })

    if (!request) return null

    // Convert Decimal fields to numbers for client serialization
    const serializedRequest = {
      ...request,
      freight: Number(request.freight),
      discount: Number(request.discount),
      total: Number(request.total),
      items: request.items.map(item => ({
        ...item,
        quantity: Number(item.quantity),
        unitPrice: item.unitPrice ? Number(item.unitPrice) : null,
        totalPrice: item.totalPrice ? Number(item.totalPrice) : null,
      }))
    }

    return serializedRequest
  } catch (error) {
    console.error("Error fetching material request:", error)
    return null
  }
}

export async function getNextDocumentNumber(series: string): Promise<string> {
  try {
    return await generateDocumentNumber(series)
  } catch (error) {
    console.error("Error generating document number:", error)
    const currentYear = new Date().getFullYear()
    const yearSuffix = currentYear.toString().slice(-2)
    return `${series}-${yearSuffix}-00001`
  }
}

export async function saveAcknowledgement(requestId: string, signatureData: string): Promise<ActionResult> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, message: "Unauthorized" }
    }

    const existingRequest = await prisma.materialRequest.findUnique({
      where: { id: requestId }
    })

    if (!existingRequest) {
      return { success: false, message: "Material request not found" }
    }

    // Update the material request with acknowledgement data
    await prisma.materialRequest.update({
      where: { id: requestId },
      data: {
        acknowledgedAt: new Date(),
        acknowledgedById: session.user.id,
        signatureData: signatureData,
      }
    })

    revalidatePath("/material-requests")
    
    return {
      success: true,
      message: "Acknowledgement saved successfully"
    }
  } catch (error) {
    console.error("Error saving acknowledgement:", error)
    
    return {
      success: false,
      message: "Failed to save acknowledgement"
    }
  }
}

export async function getForPostingRequests(filters?: {
  businessUnitId?: string
  status?: MRSRequestStatus
  search?: string
}) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return []
    }

    const whereClause: any = {
      status: MRSRequestStatus.FOR_POSTING
    }

    if (filters?.businessUnitId) {
      whereClause.businessUnitId = filters.businessUnitId
    }

    if (filters?.search) {
      whereClause.OR = [
        { docNo: { contains: filters.search, mode: 'insensitive' } },
        { purpose: { contains: filters.search, mode: 'insensitive' } },
        { requestedBy: { name: { contains: filters.search, mode: 'insensitive' } } }
      ]
    }

    const requests = await prisma.materialRequest.findMany({
      where: whereClause,
      include: {
        items: true,
        businessUnit: true,
        department: true,
        requestedBy: {
          select: {
            id: true,
            name: true,
            email: true,
            employeeId: true,
            profilePicture: true,
          }
        },
        recApprover: {
          select: {
            id: true,
            name: true,
            email: true,
            employeeId: true,
          }
        },
        finalApprover: {
          select: {
            id: true,
            name: true,
            email: true,
            employeeId: true,
          }
        },
      },
      orderBy: {
        datePosted: 'desc'
      }
    })

    // Convert Decimal fields to numbers for client serialization
    const serializedRequests = requests.map(request => ({
      ...request,
      freight: Number(request.freight),
      discount: Number(request.discount),
      total: Number(request.total),
      items: request.items.map(item => ({
        ...item,
        quantity: Number(item.quantity),
        unitPrice: item.unitPrice ? Number(item.unitPrice) : null,
        totalPrice: item.totalPrice ? Number(item.totalPrice) : null,
      }))
    }))

    return serializedRequests
  } catch (error) {
    console.error("Error fetching posted requests:", error)
    return []
  }
}

export async function markAsReceived(requestId: string): Promise<ActionResult> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, message: "Unauthorized" }
    }

    // Check if user has permission to receive (PURCHASER, STOCKROOM, ADMIN, MANAGER)
    if (!["ADMIN", "MANAGER", "PURCHASER", "STOCKROOM"].includes(session.user.role)) {
      return { success: false, message: "You don't have permission to receive material requests" }
    }

    const existingRequest = await prisma.materialRequest.findUnique({
      where: { id: requestId }
    })

    if (!existingRequest) {
      return { success: false, message: "Material request not found" }
    }

    if (existingRequest.status !== MRSRequestStatus.POSTED) {
      return { success: false, message: "Request must be posted before marking as received" }
    }

    await prisma.materialRequest.update({
      where: { id: requestId },
      data: {
        status: MRSRequestStatus.RECEIVED,
        dateReceived: new Date(),
      }
    })

    revalidatePath("/mrs-coordinator")
    
    return {
      success: true,
      message: "Material request marked as received successfully"
    }
  } catch (error) {
    console.error("Error marking request as received:", error)
    return {
      success: false,
      message: "Failed to mark request as received"
    }
  }
}

export async function getApprovedRequestsForAcknowledgement(filters?: {
  businessUnitId?: string
}) {
  try {
    const requests = await prisma.materialRequest.findMany({
      where: {
        businessUnitId: filters?.businessUnitId,
        status: MRSRequestStatus.POSTED,
        // Only show requests that don't have an e-signature yet
        signatureData: null,
      },
      include: {
        requestedBy: {
          select: {
            id: true,
            name: true,
            email: true,
            employeeId: true,
          }
        },
        department: {
          select: {
            id: true,
            name: true,
            code: true,
            businessUnitId: true,
            createdAt: true,
            updatedAt: true,
            isActive: true,
            description: true,
          }
        },
        businessUnit: {
          select: {
            id: true,
            name: true,
            code: true,
          }
        },
        items: true,
        recApprover: {
          select: {
            id: true,
            name: true,
            email: true,
            employeeId: true,
          }
        },
        finalApprover: {
          select: {
            id: true,
            name: true,
            email: true,
            employeeId: true,
          }
        },
        acknowledgmentForm: true,
      },
      orderBy: {
        finalApprovalDate: 'desc'
      }
    })

    // Transform the data to match the MaterialRequest type
    return requests.map(request => ({
      ...request,
      total: request.items.reduce((sum, item) => {
        const unitPrice = item.unitPrice ? Number(item.unitPrice) : 0
        const quantity = Number(item.quantity)
        return sum + (unitPrice * quantity)
      }, 0) + Number(request.freight || 0) - Number(request.discount || 0),
      freight: request.freight ? Number(request.freight) : 0,
      discount: request.discount ? Number(request.discount) : 0,
      items: request.items.map(item => ({
        ...item,
        quantity: Number(item.quantity),
        unitPrice: item.unitPrice ? Number(item.unitPrice) : 0,
        totalPrice: item.totalPrice ? Number(item.totalPrice) : 0,
      }))
    }))
  } catch (error) {
    console.error("Error fetching approved requests for acknowledgement:", error)
    return []
  }
}

export async function getDoneRequests(filters?: {
  businessUnitId?: string
  search?: string
}) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return []
    }

    const whereClause: any = {
      status: MRSRequestStatus.POSTED
    }

    if (filters?.businessUnitId) {
      whereClause.businessUnitId = filters.businessUnitId
    }

    if (filters?.search) {
      whereClause.OR = [
        { docNo: { contains: filters.search, mode: 'insensitive' } },
        { purpose: { contains: filters.search, mode: 'insensitive' } },
        { confirmationNo: { contains: filters.search, mode: 'insensitive' } },
        { supplierName: { contains: filters.search, mode: 'insensitive' } },
        { purchaseOrderNumber: { contains: filters.search, mode: 'insensitive' } },
        { requestedBy: { name: { contains: filters.search, mode: 'insensitive' } } }
      ]
    }

    const requests = await prisma.materialRequest.findMany({
      where: whereClause,
      include: {
        items: true,
        businessUnit: {
          select: {
            id: true,
            name: true,
            code: true,
          }
        },
        department: {
          select: {
            id: true,
            name: true,
            code: true,
            businessUnitId: true,
            createdAt: true,
            updatedAt: true,
            isActive: true,
            description: true,
          }
        },
        requestedBy: {
          select: {
            id: true,
            name: true,
            email: true,
            employeeId: true,
            profilePicture: true,
          }
        },
        recApprover: {
          select: {
            id: true,
            name: true,
            email: true,
            employeeId: true,
          }
        },
        finalApprover: {
          select: {
            id: true,
            name: true,
            email: true,
            employeeId: true,
          }
        },
        acknowledgmentForm: true,
      },
      orderBy: {
        datePosted: 'desc'
      }
    })

    // Convert Decimal fields to numbers for client serialization
    const serializedRequests = requests.map(request => ({
      ...request,
      freight: Number(request.freight),
      discount: Number(request.discount),
      total: Number(request.total),
      items: request.items.map(item => ({
        ...item,
        quantity: Number(item.quantity),
        unitPrice: item.unitPrice ? Number(item.unitPrice) : null,
        totalPrice: item.totalPrice ? Number(item.totalPrice) : null,
      }))
    }))

    return serializedRequests
  } catch (error) {
    console.error("Error fetching done requests:", error)
    return []
  }
}

// Get requests that are ready to be served (FOR_SERVING status)
export async function getRequestsToServe(filters?: {
  businessUnitId?: string
  search?: string
}) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return []
    }

    const whereClause: Record<string, unknown> = {
      status: MRSRequestStatus.FOR_SERVING
    }

    if (filters?.businessUnitId) {
      whereClause.businessUnitId = filters.businessUnitId
    }

    if (filters?.search) {
      whereClause.OR = [
        { docNo: { contains: filters.search, mode: 'insensitive' } },
        { purpose: { contains: filters.search, mode: 'insensitive' } },
        { requestedBy: { name: { contains: filters.search, mode: 'insensitive' } } }
      ]
    }

    const requests = await prisma.materialRequest.findMany({
      where: whereClause,
      include: {
        items: true,
        businessUnit: true,
        department: true,
        requestedBy: {
          select: {
            id: true,
            name: true,
            email: true,
            employeeId: true,
            profilePicture: true,
          }
        },
        recApprover: {
          select: {
            id: true,
            name: true,
            email: true,
            employeeId: true,
          }
        },
        finalApprover: {
          select: {
            id: true,
            name: true,
            email: true,
            employeeId: true,
          }
        },
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Convert Decimal fields to numbers for client serialization
    const serializedRequests = requests.map(request => ({
      ...request,
      freight: Number(request.freight),
      discount: Number(request.discount),
      total: Number(request.total),
      items: request.items.map(item => ({
        ...item,
        quantity: Number(item.quantity),
        unitPrice: item.unitPrice ? Number(item.unitPrice) : null,
        totalPrice: item.totalPrice ? Number(item.totalPrice) : null,
      }))
    }))

    return serializedRequests
  } catch (error) {
    console.error("Error fetching requests to serve:", error)
    return []
  }
}

// Mark a request as served and move it to FOR_POSTING status
export async function markRequestAsServed(params: {
  requestId: string
  businessUnitId: string
  notes?: string
  supplierBPCode?: string
  supplierName?: string
  purchaseOrderNumber?: string
  servedQuantities?: Record<string, number>
}): Promise<{ success: boolean; message?: string; error?: string }> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: "Not authenticated" }
    }

    // Check if user has permission to mark as served
    const isPurchaser = session.user.isPurchaser || false
    if (session.user.role !== "ADMIN" && !isPurchaser) {
      return { success: false, error: "You don't have permission to mark requests as served" }
    }

    // Verify the request exists and is in FOR_SERVING status
    const request = await prisma.materialRequest.findFirst({
      where: {
        id: params.requestId,
        businessUnitId: params.businessUnitId,
        status: MRSRequestStatus.FOR_SERVING
      },
      include: {
        items: true
      }
    })

    if (!request) {
      return { success: false, error: "Request not found or not in FOR_SERVING status" }
    }

    // Update item quantities served
    if (params.servedQuantities) {
      for (const item of request.items) {
        const servedQty = params.servedQuantities[item.id]
        if (servedQty !== undefined && servedQty > 0) {
          await prisma.materialRequestItem.update({
            where: { id: item.id },
            data: {
              quantityServed: (item.quantityServed?.toNumber() || 0) + servedQty
            }
          })
        }
      }
    }

    // Check if all items are fully served
    const updatedRequest = await prisma.materialRequest.findUnique({
      where: { id: params.requestId },
      include: { items: true }
    })

    const allItemsFullyServed = updatedRequest?.items.every(item => {
      const served = item.quantityServed?.toNumber() || 0
      const requested = item.quantity.toNumber()
      return served >= requested
    })

    // Determine the new status
    const newStatus = allItemsFullyServed ? MRSRequestStatus.FOR_POSTING : MRSRequestStatus.FOR_SERVING

    // Update the request
    await prisma.materialRequest.update({
      where: { id: params.requestId },
      data: {
        status: newStatus,
        servedAt: new Date(),
        servedBy: session.user.id,
        servedNotes: params.notes,
        supplierBPCode: params.supplierBPCode,
        supplierName: params.supplierName,
        purchaseOrderNumber: params.purchaseOrderNumber,
        updatedAt: new Date()
      }
    })

    // Revalidate relevant paths
    revalidatePath(`/${params.businessUnitId}/mrs-coordinator/to-serve`)
    revalidatePath(`/${params.businessUnitId}/mrs-coordinator/for-serving`)
    revalidatePath(`/${params.businessUnitId}/mrs-coordinator/for-posting`)
    revalidatePath(`/${params.businessUnitId}/material-requests/${params.requestId}`)

    const statusMessage = allItemsFullyServed 
      ? "has been fully served and is now ready for posting"
      : "has been partially served and remains in 'For Serving' status"

    return {
      success: true,
      message: `Request ${request.docNo} ${statusMessage}`
    }
  } catch (error) {
    console.error("Error marking request as served:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to mark request as served"
    }
  }
}


export async function markAsPosted(requestId: string) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, message: "Unauthorized" }
    }

    // Check if user has permission (ADMIN or users with isAcctg permission)
    if (session.user.role !== "ADMIN" && !session.user.isAcctg) {
      return { success: false, message: "You don't have permission to mark requests as posted" }
    }

    // Get the request
    const request = await prisma.materialRequest.findUnique({
      where: { id: requestId }
    })

    if (!request) {
      return { success: false, message: "Request not found" }
    }

    // Check if request is in FOR_POSTING status
    if (request.status !== MRSRequestStatus.FOR_POSTING) {
      return { success: false, message: "Request must be in FOR_POSTING status" }
    }

    // Update the request status to POSTED
    await prisma.materialRequest.update({
      where: { id: requestId },
      data: {
        status: MRSRequestStatus.POSTED,
        datePosted: new Date(),
        processedBy: session.user.id,
        processedAt: new Date(),
      }
    })

    revalidatePath("/")
    return { success: true, message: "Request marked as posted successfully" }
  } catch (error) {
    console.error("Error marking request as posted:", error)
    return { success: false, message: "Failed to mark request as posted" }
  }
}

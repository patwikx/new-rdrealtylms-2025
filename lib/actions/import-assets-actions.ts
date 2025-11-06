"use server"

import { prisma } from "@/lib/prisma"
import { DepreciationMethod, AssetStatus } from "@prisma/client"
import { revalidatePath } from "next/cache"
import { generateQRCode } from "@/lib/utils/qr-code-generator"

export interface ImportAssetRow {
  itemCode: string
  description: string
  categoryCode: string
  serialNumber?: string
  modelNumber?: string
  brand?: string
  purchaseDate?: string
  purchasePrice?: number
  warrantyExpiry?: string
  departmentCode?: string
  location?: string
  notes?: string
  status?: string
  usefulLifeYears?: number
  usefulLifeMonths?: number
  salvageValue?: number
  depreciationMethod?: string
  depreciationStartDate?: string
  assetAccountCode?: string
  depreciationExpenseAccountCode?: string
  accumulatedDepAccountCode?: string
}

export interface ImportError {
  row: number
  itemCode: string
  error: string
}

export interface ImportResult {
  success: boolean
  message: string
  totalRows: number
  successCount: number
  errorCount: number
  errors: ImportError[]
}

export async function downloadImportTemplate(): Promise<string> {
  const headers = [
    'itemCode',
    'description', 
    'categoryCode',
    'serialNumber',
    'modelNumber',
    'brand',
    'purchaseDate',
    'purchasePrice',
    'warrantyExpiry',
    'departmentCode',
    'location',
    'notes',
    'status',
    'usefulLifeYears',
    'usefulLifeMonths',
    'salvageValue',
    'depreciationMethod',
    'depreciationStartDate',
    'assetAccountCode',
    'depreciationExpenseAccountCode',
    'accumulatedDepAccountCode'
  ]

  const exampleRows = [
    [
      'COMP001',
      'Dell Laptop Inspiron 15',
      'COMP',
      'DL123456789',
      'Inspiron 15 3000',
      'Dell',
      '2024-01-15',
      '45000',
      '2027-01-15',
      'IT',
      'IT Office - Floor 2',
      'Standard office laptop',
      'AVAILABLE',
      '3',
      '0',
      '5000',
      'STRAIGHT_LINE',
      '2024-01-15',
      '1200',
      '5120',
      '1210'
    ],
    [
      'FURN001',
      'Office Desk Executive',
      'FURN',
      'OD987654321',
      'Executive Pro',
      'Steelcase',
      '2024-02-01',
      '25000',
      '',
      'HR',
      'HR Office - Floor 1',
      'Executive office desk',
      'DEPLOYED',
      '5',
      '0',
      '2000',
      'STRAIGHT_LINE',
      '2024-02-01',
      '1300',
      '5130',
      '1310'
    ]
  ]

  const csvContent = [
    headers.join(','),
    ...exampleRows.map(row => row.join(','))
  ].join('\n')

  return csvContent
}

export async function validateAndImportAssets(
  data: ImportAssetRow[], 
  businessUnitId: string
): Promise<ImportResult> {
  try {
    const { auth } = await import("@/auth")
    const session = await auth()
    
    if (!session?.user?.id) {
      return {
        success: false,
        message: "Unauthorized",
        totalRows: 0,
        successCount: 0,
        errorCount: 0,
        errors: []
      }
    }

    const errors: ImportError[] = []
    const validAssets: any[] = []
    let rowIndex = 2 // Start from row 2 (after header)

    // Get reference data for validation
    const [categories, departments, glAccounts] = await Promise.all([
      prisma.assetCategory.findMany({
        where: { isActive: true },
        select: { id: true, code: true, name: true }
      }),
      prisma.department.findMany({
        where: { isActive: true },
        select: { id: true, code: true, name: true }
      }),
      prisma.gLAccount.findMany({
        where: { isActive: true },
        select: { id: true, accountCode: true }
      })
    ])

    // Create lookup maps
    const categoryMap = new Map(categories.map(c => [c.code, c]))
    const departmentMap = new Map(departments.map(d => [d.code, d]))
    const glAccountMap = new Map(glAccounts.map(a => [a.accountCode, a]))

    // Get existing item codes to check for duplicates
    const existingItemCodes = new Set(
      (await prisma.asset.findMany({
        select: { itemCode: true }
      })).map(a => a.itemCode)
    )

    // Track item codes in current import to prevent duplicates within the same import
    const importItemCodes = new Set<string>()

    for (const row of data) {
      const rowErrors: string[] = []

      // Validate required fields
      if (!row.itemCode?.trim()) {
        rowErrors.push("Item code is required")
      } else if (existingItemCodes.has(row.itemCode) || importItemCodes.has(row.itemCode)) {
        rowErrors.push("Item code already exists")
      } else {
        importItemCodes.add(row.itemCode)
      }

      if (!row.description?.trim()) {
        rowErrors.push("Description is required")
      }

      if (!row.categoryCode?.trim()) {
        rowErrors.push("Category code is required")
      } else if (!categoryMap.has(row.categoryCode)) {
        rowErrors.push(`Category code '${row.categoryCode}' not found`)
      }

      // Validate optional department code
      if (row.departmentCode && !departmentMap.has(row.departmentCode)) {
        rowErrors.push(`Department code '${row.departmentCode}' not found`)
      }

      // Validate status
      const validStatuses = Object.values(AssetStatus)
      if (row.status && !validStatuses.includes(row.status as AssetStatus)) {
        rowErrors.push(`Invalid status '${row.status}'. Valid values: ${validStatuses.join(', ')}`)
      }

      // Validate depreciation method
      const validMethods = Object.values(DepreciationMethod)
      if (row.depreciationMethod && !validMethods.includes(row.depreciationMethod as DepreciationMethod)) {
        rowErrors.push(`Invalid depreciation method '${row.depreciationMethod}'. Valid values: ${validMethods.join(', ')}`)
      }

      // Validate GL account codes
      if (row.assetAccountCode && !glAccountMap.has(row.assetAccountCode)) {
        rowErrors.push(`Asset account code '${row.assetAccountCode}' not found`)
      }
      if (row.depreciationExpenseAccountCode && !glAccountMap.has(row.depreciationExpenseAccountCode)) {
        rowErrors.push(`Depreciation expense account code '${row.depreciationExpenseAccountCode}' not found`)
      }
      if (row.accumulatedDepAccountCode && !glAccountMap.has(row.accumulatedDepAccountCode)) {
        rowErrors.push(`Accumulated depreciation account code '${row.accumulatedDepAccountCode}' not found`)
      }

      // Validate dates
      if (row.purchaseDate && !isValidDate(row.purchaseDate)) {
        rowErrors.push("Invalid purchase date format. Use YYYY-MM-DD")
      }
      if (row.warrantyExpiry && !isValidDate(row.warrantyExpiry)) {
        rowErrors.push("Invalid warranty expiry date format. Use YYYY-MM-DD")
      }
      if (row.depreciationStartDate && !isValidDate(row.depreciationStartDate)) {
        rowErrors.push("Invalid depreciation start date format. Use YYYY-MM-DD")
      }

      // Validate numeric fields
      if (row.purchasePrice !== undefined && (isNaN(row.purchasePrice) || row.purchasePrice < 0)) {
        rowErrors.push("Purchase price must be a valid positive number")
      }
      if (row.salvageValue !== undefined && (isNaN(row.salvageValue) || row.salvageValue < 0)) {
        rowErrors.push("Salvage value must be a valid positive number")
      }
      if (row.usefulLifeYears !== undefined && (isNaN(row.usefulLifeYears) || row.usefulLifeYears <= 0)) {
        rowErrors.push("Useful life years must be a positive number")
      }
      if (row.usefulLifeMonths !== undefined && (isNaN(row.usefulLifeMonths) || row.usefulLifeMonths < 0 || row.usefulLifeMonths > 11)) {
        rowErrors.push("Useful life months must be between 0 and 11")
      }

      if (rowErrors.length > 0) {
        errors.push({
          row: rowIndex,
          itemCode: row.itemCode || 'N/A',
          error: rowErrors.join('; ')
        })
      } else {
        // Prepare valid asset data
        const category = categoryMap.get(row.categoryCode)!
        const department = row.departmentCode ? departmentMap.get(row.departmentCode) : null
        
        const assetData = {
          itemCode: row.itemCode,
          description: row.description,
          serialNumber: row.serialNumber || null,
          modelNumber: row.modelNumber || null,
          brand: row.brand || null,
          categoryId: category.id,
          businessUnitId,
          departmentId: department?.id || null,
          location: row.location || null,
          notes: row.notes || null,
          status: (row.status as AssetStatus) || AssetStatus.AVAILABLE,
          purchaseDate: row.purchaseDate ? new Date(row.purchaseDate) : null,
          purchasePrice: row.purchasePrice || null,
          warrantyExpiry: row.warrantyExpiry ? new Date(row.warrantyExpiry) : null,
          usefulLifeYears: row.usefulLifeYears || null,
          usefulLifeMonths: row.usefulLifeMonths || 0,
          salvageValue: row.salvageValue || 0,
          depreciationMethod: (row.depreciationMethod as DepreciationMethod) || DepreciationMethod.STRAIGHT_LINE,
          depreciationStartDate: row.depreciationStartDate ? new Date(row.depreciationStartDate) : null,
          assetAccountId: row.assetAccountCode ? glAccountMap.get(row.assetAccountCode)?.id : null,
          depreciationExpenseAccountId: row.depreciationExpenseAccountCode ? glAccountMap.get(row.depreciationExpenseAccountCode)?.id : null,
          accumulatedDepAccountId: row.accumulatedDepAccountCode ? glAccountMap.get(row.accumulatedDepAccountCode)?.id : null,
          createdById: session.user.id,
          isActive: true,
          quantity: 1
        }

        // Calculate depreciation values if applicable
        if (assetData.purchasePrice && assetData.usefulLifeYears) {
          const depreciationCalc = calculateDepreciation(
            assetData.purchasePrice,
            assetData.salvageValue,
            assetData.usefulLifeYears,
            assetData.usefulLifeMonths,
            assetData.depreciationMethod
          )
          
          Object.assign(assetData, depreciationCalc)
        }

        validAssets.push(assetData)
      }

      rowIndex++
    }

    // If there are validation errors, return them without importing
    if (errors.length > 0) {
      return {
        success: false,
        message: `Validation failed. ${errors.length} error(s) found.`,
        totalRows: data.length,
        successCount: 0,
        errorCount: errors.length,
        errors
      }
    }

    // Import valid assets
    let successCount = 0
    const importErrors: ImportError[] = []

    for (const assetData of validAssets) {
      try {
        // Create the asset (QR code generated on-demand to avoid database size issues)
        const asset = await prisma.asset.create({
          data: {
            ...assetData,
            barcodeValue: assetData.itemCode, // Store item code as barcode value for reference
            barcodeType: 'QR_CODE',
            barcodeGenerated: new Date()
          }
        })

        successCount++
      } catch (error) {
        console.error("Error creating asset:", error)
        importErrors.push({
          row: validAssets.indexOf(assetData) + 2,
          itemCode: assetData.itemCode,
          error: "Failed to create asset in database"
        })
      }
    }

    // Revalidate the assets page
    revalidatePath(`/${businessUnitId}/asset-management/assets`)

    return {
      success: successCount > 0,
      message: successCount > 0 
        ? `Successfully imported ${successCount} asset(s)${importErrors.length > 0 ? ` with ${importErrors.length} error(s)` : ''}`
        : "No assets were imported",
      totalRows: data.length,
      successCount,
      errorCount: importErrors.length,
      errors: importErrors
    }

  } catch (error) {
    console.error("Import error:", error)
    return {
      success: false,
      message: "An unexpected error occurred during import",
      totalRows: data.length,
      successCount: 0,
      errorCount: data.length,
      errors: [{
        row: 0,
        itemCode: 'System Error',
        error: 'An unexpected error occurred during import'
      }]
    }
  }
}

function isValidDate(dateString: string): boolean {
  const regex = /^\d{4}-\d{2}-\d{2}$/
  if (!regex.test(dateString)) return false
  
  const date = new Date(dateString)
  return date instanceof Date && !isNaN(date.getTime())
}

function calculateDepreciation(
  purchasePrice: number,
  salvageValue: number,
  usefulLifeYears: number,
  usefulLifeMonths: number,
  method: DepreciationMethod
) {
  const totalMonths = (usefulLifeYears * 12) + usefulLifeMonths
  const depreciableAmount = purchasePrice - salvageValue

  let monthlyDepreciation = 0
  let depreciationRate = 0

  switch (method) {
    case DepreciationMethod.STRAIGHT_LINE:
      monthlyDepreciation = totalMonths > 0 ? depreciableAmount / totalMonths : 0
      break
    case DepreciationMethod.DECLINING_BALANCE:
      // Using double declining balance (200% of straight line rate)
      depreciationRate = totalMonths > 0 ? (2 / totalMonths) : 0
      monthlyDepreciation = purchasePrice * depreciationRate
      break
    case DepreciationMethod.UNITS_OF_PRODUCTION:
      // Will be calculated based on actual usage
      monthlyDepreciation = 0
      break
    case DepreciationMethod.SUM_OF_YEARS_DIGITS:
      // Simplified calculation for monthly
      const sumOfYears = (usefulLifeYears * (usefulLifeYears + 1)) / 2
      monthlyDepreciation = totalMonths > 0 ? (depreciableAmount * usefulLifeYears) / (sumOfYears * 12) : 0
      break
  }

  return {
    currentBookValue: purchasePrice,
    monthlyDepreciation: Math.round(monthlyDepreciation * 100) / 100,
    depreciationRate: Math.round(depreciationRate * 10000) / 10000,
    nextDepreciationDate: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1)
  }
}
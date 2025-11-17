"use server"

import { prisma } from "@/lib/prisma"
import { DepreciationMethod, AssetStatus } from "@prisma/client"
import { revalidatePath } from "next/cache"
import { generateQRCode } from "@/lib/utils/qr-code-generator"

export interface ImportAssetRow {
  itemCode: string
  description: string
  categoryName: string
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

export async function downloadImportTemplate(
  businessUnitId: string, 
  categoryId?: string, 
  numberOfRows: number = 10,
  defaultDepartmentId?: string,
  defaultLocation?: string
): Promise<string> {
  try {
    // Get actual categories and departments from database
    const [categories, departments] = await Promise.all([
      prisma.assetCategory.findMany({
        where: { 
          businessUnitId,
          isActive: true,
          ...(categoryId ? { id: categoryId } : {})
        },
        select: { id: true, name: true, code: true }
      }),
      prisma.department.findMany({
        where: { 
          businessUnitId,
          isActive: true 
        },
        select: { code: true }
      })
    ])

  const headers = [
    'itemCode',
    'description', 
    'categoryName',
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
    'usefulLifeMonths',
    'salvageValue',
    'depreciationMethod',
    'depreciationStartDate',
    'assetAccountCode',
    'depreciationExpenseAccountCode',
    'accumulatedDepAccountCode'
  ]

  // Generate example rows with auto-generated item codes
  const exampleRows = []
  const selectedCategory = categories[0]
  
  if (selectedCategory) {
    // Get the next available item codes for this category
    const lastAsset = await prisma.asset.findFirst({
      where: {
        itemCode: {
          startsWith: `${selectedCategory.code}-`
        }
      },
      orderBy: {
        itemCode: 'desc'
      },
      select: {
        itemCode: true
      }
    })
    
    let nextNumber = 1
    if (lastAsset) {
      const parts = lastAsset.itemCode.split('-')
      if (parts.length >= 2) {
        const currentNumber = parseInt(parts[parts.length - 1]) || 0
        nextNumber = currentNumber + 1
      }
    }
    
    // Generate the requested number of rows
    for (let i = 0; i < numberOfRows; i++) {
      const itemCode = `${selectedCategory.code}-${(nextNumber + i).toString().padStart(5, '0')}`
      
      exampleRows.push([
        itemCode,
        `Sample Asset ${i + 1}`, // Generic description
        selectedCategory.name,
        '', // serialNumber - optional
        '', // modelNumber - optional  
        '', // brand - optional
        '2024-01-15', // purchaseDate
        '10000', // purchasePrice
        '', // warrantyExpiry - optional
        defaultDepartmentId || '', // departmentCode (actually department ID)
        defaultLocation || '', // location
        '', // notes - optional
        'AVAILABLE', // status
        '36', // usefulLifeMonths (3 years)
        '0', // salvageValue
        'STRAIGHT_LINE', // depreciationMethod
        '2024-01-15', // depreciationStartDate
        '', // assetAccountCode - optional
        '', // depreciationExpenseAccountCode - optional
        '' // accumulatedDepAccountCode - optional
      ])
    }
  } else {
    // Fallback if no category found
    exampleRows.push([
      'SAMPLE-00001',
      'Sample Asset 1',
      'Sample Category',
      '',
      '',
      '',
      '2024-01-15',
      '10000',
      '',
      '',
      '',
      '',
      'AVAILABLE',
      '36',
      '0',
      'STRAIGHT_LINE',
      '2024-01-15',
      '',
      '',
      ''
    ])
  }

  // Helper function to escape CSV values
  const escapeCSVValue = (value: string): string => {
    if (value.includes(',') || value.includes('"') || value.includes('\n')) {
      return `"${value.replace(/"/g, '""')}"`
    }
    return value
  }

  const csvContent = [
    headers.join(','),
    ...exampleRows.map(row => row.map(cell => escapeCSVValue(cell.toString())).join(','))
  ].join('\n')

  console.log('Generated CSV template:', csvContent)
  return csvContent
  
  } catch (error) {
    console.error('Error generating template:', error)
    
    // Fallback template with default values
    const fallbackHeaders = [
      'itemCode',
      'description', 
      'categoryName',
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
      'usefulLifeMonths',
      'salvageValue',
      'depreciationMethod',
      'depreciationStartDate',
      'assetAccountCode',
      'depreciationExpenseAccountCode',
      'accumulatedDepAccountCode'
    ]

    const fallbackRows = [
      [
        'COMP001',
        'Dell Laptop Inspiron 15',
        'Computer Equipment',
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
        '36',
        '5000',
        'STRAIGHT_LINE',
        '2024-01-15',
        '1200',
        '5120',
        '1210'
      ]
    ]

    const fallbackContent = [
      fallbackHeaders.join(','),
      ...fallbackRows.map(row => row.join(','))
    ].join('\n')

    return fallbackContent
  }
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
        where: { 
          businessUnitId,
          isActive: true 
        },
        select: { id: true, code: true, name: true }
      }),
      prisma.department.findMany({
        where: {
          OR: [
            { businessUnitId },
            { businessUnitId: null }
          ],
          isActive: { not: false } // This includes true and null values, same as UI
        },
        select: { id: true, code: true, name: true }
      }),
      prisma.gLAccount.findMany({
        where: { isActive: true },
        select: { id: true, accountCode: true }
      })
    ])

    // Create lookup maps - use category name instead of code
    const categoryMap = new Map(categories.map(c => [c.name, c]))
    const departmentMap = new Map(departments.map(d => [d.id, d])) // Use department ID instead of code
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

      if (!row.categoryName?.trim()) {
        rowErrors.push("Category name is required")
      } else if (!categoryMap.has(row.categoryName)) {
        rowErrors.push(`Category '${row.categoryName}' not found`)
      }

      // Validate optional department ID (only if provided)
      if (row.departmentCode && row.departmentCode.trim()) {
        console.log('Validating department ID:', row.departmentCode)
        console.log('Available department IDs:', Array.from(departmentMap.keys()))
        if (!departmentMap.has(row.departmentCode)) {
          rowErrors.push(`Department ID '${row.departmentCode}' not found`)
        }
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

      // Validate GL account codes (only if provided)
      if (row.assetAccountCode && row.assetAccountCode.trim() && !glAccountMap.has(row.assetAccountCode)) {
        rowErrors.push(`Asset account code '${row.assetAccountCode}' not found`)
      }
      if (row.depreciationExpenseAccountCode && row.depreciationExpenseAccountCode.trim() && !glAccountMap.has(row.depreciationExpenseAccountCode)) {
        rowErrors.push(`Depreciation expense account code '${row.depreciationExpenseAccountCode}' not found`)
      }
      if (row.accumulatedDepAccountCode && row.accumulatedDepAccountCode.trim() && !glAccountMap.has(row.accumulatedDepAccountCode)) {
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
      if (row.usefulLifeMonths !== undefined && (isNaN(row.usefulLifeMonths) || row.usefulLifeMonths <= 0)) {
        rowErrors.push("Useful life months must be a positive number")
      }

      if (rowErrors.length > 0) {
        errors.push({
          row: rowIndex,
          itemCode: row.itemCode || 'N/A',
          error: rowErrors.join('; ')
        })
      } else {
        // Prepare valid asset data
        const category = categoryMap.get(row.categoryName)!
        const department = (row.departmentCode && row.departmentCode.trim()) ? departmentMap.get(row.departmentCode) : null
        
        // Convert months to years and months for depreciation calculation
        const totalMonths = row.usefulLifeMonths || 0
        const usefulLifeYears = Math.floor(totalMonths / 12)
        const remainingMonths = totalMonths % 12
        
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
          usefulLifeYears: usefulLifeYears > 0 ? usefulLifeYears : null,
          usefulLifeMonths: remainingMonths,
          salvageValue: row.salvageValue || 0,
          depreciationMethod: (row.depreciationMethod as DepreciationMethod) || DepreciationMethod.STRAIGHT_LINE,
          depreciationStartDate: row.depreciationStartDate ? new Date(row.depreciationStartDate) : null,
          assetAccountId: (row.assetAccountCode && row.assetAccountCode.trim()) ? glAccountMap.get(row.assetAccountCode)?.id : null,
          depreciationExpenseAccountId: (row.depreciationExpenseAccountCode && row.depreciationExpenseAccountCode.trim()) ? glAccountMap.get(row.depreciationExpenseAccountCode)?.id : null,
          accumulatedDepAccountId: (row.accumulatedDepAccountCode && row.accumulatedDepAccountCode.trim()) ? glAccountMap.get(row.accumulatedDepAccountCode)?.id : null,
          createdById: session.user.id,
          isActive: true,
          quantity: 1
        }

        // Calculate depreciation values if applicable
        if (assetData.purchasePrice && totalMonths > 0) {
          const depreciationCalc = calculateDepreciation(
            assetData.purchasePrice,
            assetData.salvageValue,
            usefulLifeYears,
            remainingMonths,
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
            // Don't set barcodeValue - let it be generated on-demand
            barcodeType: 'QR_CODE',
            barcodeGenerated: null // Will be set when QR code is actually generated
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
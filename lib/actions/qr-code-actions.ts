"use server"

import { prisma } from "@/lib/prisma"
import { generateQRCode } from "@/lib/utils/qr-code-generator"

export async function generateAssetQRCode(assetId: string) {
  try {
    const asset = await prisma.asset.findUnique({
      where: { id: assetId },
      select: {
        id: true,
        itemCode: true,
        description: true,
        serialNumber: true,
        businessUnitId: true
      }
    })

    if (!asset) {
      throw new Error("Asset not found")
    }

    const qrCodeDataURL = await generateQRCode({
      itemCode: asset.itemCode,
      description: asset.description,
      serialNumber: asset.serialNumber || undefined,
      businessUnitId: asset.businessUnitId,
      assetId: asset.id
    })

    return { success: true, qrCode: qrCodeDataURL }
  } catch (error) {
    console.error("Error generating QR code:", error)
    return { error: "Failed to generate QR code" }
  }
}

export async function generateAssetQRCodeByItemCode(itemCode: string, businessUnitId: string) {
  try {
    const asset = await prisma.asset.findFirst({
      where: { 
        itemCode,
        businessUnitId
      },
      select: {
        id: true,
        itemCode: true,
        description: true,
        serialNumber: true,
        businessUnitId: true,
        barcodeValue: true
      }
    })

    if (!asset) {
      throw new Error("Asset not found")
    }

    // Use existing QR code if available, otherwise generate new one
    let qrCodeDataURL = asset.barcodeValue

    if (!qrCodeDataURL) {
      qrCodeDataURL = await generateQRCode({
        itemCode: asset.itemCode,
        description: asset.description,
        serialNumber: asset.serialNumber || undefined,
        businessUnitId: asset.businessUnitId,
        assetId: asset.id
      })

      // Update the asset with the generated QR code
      await prisma.asset.update({
        where: { id: asset.id },
        data: {
          barcodeValue: qrCodeDataURL,
          barcodeGenerated: new Date()
        }
      })
    }

    return { success: true, qrCode: qrCodeDataURL, assetData: asset }
  } catch (error) {
    console.error("Error generating QR code:", error)
    return { error: "Failed to generate QR code" }
  }
}

export async function downloadAssetQRCode(assetId: string) {
  try {
    const asset = await prisma.asset.findUnique({
      where: { id: assetId },
      select: {
        id: true,
        itemCode: true,
        description: true,
        serialNumber: true,
        businessUnitId: true,
        barcodeValue: true
      }
    })

    if (!asset) {
      throw new Error("Asset not found")
    }

    // Use existing QR code if available, otherwise generate new one
    let qrCodeDataURL = asset.barcodeValue

    if (!qrCodeDataURL) {
      qrCodeDataURL = await generateQRCode({
        itemCode: asset.itemCode,
        description: asset.description,
        serialNumber: asset.serialNumber || undefined,
        businessUnitId: asset.businessUnitId,
        assetId: asset.id
      })

      // Update the asset with the generated QR code
      await prisma.asset.update({
        where: { id: asset.id },
        data: {
          barcodeValue: qrCodeDataURL,
          barcodeGenerated: new Date()
        }
      })
    }

    return { success: true, qrCode: qrCodeDataURL, fileName: `${asset.itemCode}_QR.png` }
  } catch (error) {
    console.error("Error downloading QR code:", error)
    return { error: "Failed to download QR code" }
  }
}
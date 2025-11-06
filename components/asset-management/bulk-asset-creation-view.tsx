"use client"

import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { 
  Upload, 
  Download, 
  FileSpreadsheet, 
  AlertCircle, 
  CheckCircle, 
  XCircle, 
  ArrowLeft,
  RefreshCw,
  FileText,
  Package
} from "lucide-react"
import { toast } from "sonner"
import { validateAndImportAssets, downloadImportTemplate, ImportResult, ImportAssetRow } from "@/lib/actions/import-assets-actions"

interface BulkAssetCreationViewProps {
  businessUnitId: string
}

export function BulkAssetCreationView({ businessUnitId }: BulkAssetCreationViewProps) {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [importResult, setImportResult] = useState<ImportResult | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [uploadProgress, setUploadProgress] = useState(0)

  const handleDownloadTemplate = async () => {
    try {
      const template = await downloadImportTemplate()
      const blob = new Blob([template], { type: 'text/csv' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'asset-import-template.csv'
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
      toast.success("Template downloaded successfully")
    } catch (error) {
      toast.error("Failed to download template")
    }
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      if (!file.name.endsWith('.csv') && !file.name.endsWith('.xlsx')) {
        toast.error("Please select a CSV or Excel file")
        return
      }
      setSelectedFile(file)
      setImportResult(null)
      setUploadProgress(0)
    }
  }

  const parseCSV = (text: string): ImportAssetRow[] => {
    const lines = text.split('\n').filter(line => line.trim())
    if (lines.length < 2) return []

    const headers = lines[0].split(',').map(h => h.trim())
    const data: ImportAssetRow[] = []

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim())
      const row: ImportAssetRow = {
        itemCode: '',
        description: '',
        categoryCode: ''
      }

      headers.forEach((header, index) => {
        const value = values[index]
        switch (header) {
          case 'itemCode':
            row.itemCode = value
            break
          case 'description':
            row.description = value
            break
          case 'categoryCode':
            row.categoryCode = value
            break
          case 'serialNumber':
            row.serialNumber = value || undefined
            break
          case 'modelNumber':
            row.modelNumber = value || undefined
            break
          case 'brand':
            row.brand = value || undefined
            break
          case 'purchaseDate':
            row.purchaseDate = value || undefined
            break
          case 'purchasePrice':
            row.purchasePrice = value ? parseFloat(value) : undefined
            break
          case 'warrantyExpiry':
            row.warrantyExpiry = value || undefined
            break
          case 'departmentCode':
            row.departmentCode = value || undefined
            break
          case 'location':
            row.location = value || undefined
            break
          case 'notes':
            row.notes = value || undefined
            break
          case 'status':
            row.status = value || undefined
            break
          case 'usefulLifeYears':
            row.usefulLifeYears = value ? parseInt(value) : undefined
            break
          case 'usefulLifeMonths':
            row.usefulLifeMonths = value ? parseInt(value) : undefined
            break
          case 'salvageValue':
            row.salvageValue = value ? parseFloat(value) : undefined
            break
          case 'depreciationMethod':
            row.depreciationMethod = value || undefined
            break
          case 'depreciationStartDate':
            row.depreciationStartDate = value || undefined
            break
          case 'assetAccountCode':
            row.assetAccountCode = value || undefined
            break
          case 'depreciationExpenseAccountCode':
            row.depreciationExpenseAccountCode = value || undefined
            break
          case 'accumulatedDepAccountCode':
            row.accumulatedDepAccountCode = value || undefined
            break
        }
      })

      if (row.itemCode && row.description && row.categoryCode) {
        data.push(row)
      }
    }

    return data
  }

  const handleImport = async () => {
    if (!selectedFile) {
      toast.error("Please select a file to import")
      return
    }

    setIsLoading(true)
    setUploadProgress(10)
    
    try {
      const text = await selectedFile.text()
      setUploadProgress(30)
      
      const data = parseCSV(text)
      setUploadProgress(50)

      if (data.length === 0) {
        toast.error("No valid data found in the file")
        setIsLoading(false)
        setUploadProgress(0)
        return
      }

      setUploadProgress(70)
      const result = await validateAndImportAssets(data, businessUnitId)
      setUploadProgress(100)
      setImportResult(result)

      if (result.success) {
        toast.success(result.message)
        router.refresh()
      } else {
        toast.error(result.message)
      }

    } catch (error) {
      console.error("Import error:", error)
      toast.error("Failed to process import file")
    } finally {
      setIsLoading(false)
      setTimeout(() => setUploadProgress(0), 1000)
    }
  }

  const handleReset = () => {
    setSelectedFile(null)
    setImportResult(null)
    setUploadProgress(0)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleBackToAssets = () => {
    router.push(`/${businessUnitId}/asset-management/assets`)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">Bulk Asset Creation</h1>
          <p className="text-sm text-muted-foreground">
            Import multiple assets from Excel/CSV files with complete configuration
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="flex items-center gap-1">
            <Package className="h-3 w-3" />
            Import Mode
          </Badge>
        </div>
      </div>

      {/* Progress Bar */}
      {isLoading && (
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Processing import...</span>
                <span>{uploadProgress}%</span>
              </div>
              <Progress value={uploadProgress} className="w-full" />
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Left Column - Import Process */}
        <div className="space-y-6">
          {/* Step 1: Download Template */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-medium">
                  1
                </div>
                Download Template
              </CardTitle>
              <CardDescription>
                Get the Excel/CSV template with the required format and example data
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                variant="outline" 
                onClick={handleDownloadTemplate} 
                className="w-full"
                disabled={isLoading}
              >
                <Download className="h-4 w-4 mr-2" />
                Download Import Template
              </Button>
            </CardContent>
          </Card>

          {/* Step 2: Upload File */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-medium">
                  2
                </div>
                Upload Your File
              </CardTitle>
              <CardDescription>
                Select your completed CSV or Excel file for import
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="file-upload">Select CSV or Excel file</Label>
                  <Input
                    id="file-upload"
                    type="file"
                    accept=".csv,.xlsx"
                    ref={fileInputRef}
                    onChange={handleFileSelect}
                    disabled={isLoading}
                  />
                </div>
                
                {selectedFile && (
                  <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <div className="flex items-center gap-2 text-sm">
                      <FileSpreadsheet className="h-4 w-4 text-green-600" />
                      <span className="font-medium">{selectedFile.name}</span>
                      <Badge variant="outline">{(selectedFile.size / 1024).toFixed(1)} KB</Badge>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={handleReset}
                      disabled={isLoading}
                    >
                      <XCircle className="h-4 w-4" />
                    </Button>
                  </div>
                )}

                <div className="flex gap-2">
                  <Button 
                    onClick={handleImport} 
                    disabled={!selectedFile || isLoading}
                    className="flex-1"
                  >
                    {isLoading ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <Upload className="h-4 w-4 mr-2" />
                        Import Assets
                      </>
                    )}
                  </Button>
                  {importResult && (
                    <Button variant="outline" onClick={handleReset} disabled={isLoading}>
                      Import Another File
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Instructions & Results */}
        <div className="space-y-6">
          {/* Import Instructions */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Import Instructions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Required Information</AlertTitle>
                <AlertDescription className="text-sm space-y-2 mt-2">
                  <div className="space-y-1">
                    <p><strong>Required fields:</strong> itemCode, description, categoryCode</p>
                    <p><strong>Date format:</strong> YYYY-MM-DD (e.g., 2024-01-15)</p>
                    <p><strong>Codes:</strong> Use category codes and department codes, not names</p>
                    <p><strong>GL Accounts:</strong> Account codes must exist in the system</p>
                    <p><strong>Uniqueness:</strong> Item codes must be unique across all assets</p>
                  </div>
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>

          {/* Import Results */}
          {importResult && (
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="text-lg flex items-center gap-2">
                  {importResult.success ? (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-600" />
                  )}
                  Import Results
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Summary Stats */}
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center p-4 bg-muted rounded-lg">
                      <div className="text-2xl font-bold">{importResult.totalRows}</div>
                      <div className="text-xs text-muted-foreground">Total Rows</div>
                    </div>
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">{importResult.successCount}</div>
                      <div className="text-xs text-muted-foreground">Successful</div>
                    </div>
                    <div className="text-center p-4 bg-red-50 rounded-lg">
                      <div className="text-2xl font-bold text-red-600">{importResult.errorCount}</div>
                      <div className="text-xs text-muted-foreground">Errors</div>
                    </div>
                  </div>

                  {/* Success Message */}
                  {importResult.success && importResult.successCount > 0 && (
                    <Alert>
                      <CheckCircle className="h-4 w-4" />
                      <AlertTitle>Import Completed Successfully</AlertTitle>
                      <AlertDescription>
                        {importResult.successCount} asset(s) have been imported and are now available in your asset management system.
                      </AlertDescription>
                    </Alert>
                  )}

                  {/* Error Details */}
                  {importResult.errors.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                        <AlertCircle className="h-4 w-4 text-red-600" />
                        Import Errors ({importResult.errors.length})
                      </h4>
                      <ScrollArea className="h-48 w-full border rounded-md p-3">
                        <div className="space-y-2">
                          {importResult.errors.map((error: any, index: number) => (
                            <Alert key={index} variant="destructive" className="py-2">
                              <AlertCircle className="h-3 w-3" />
                              <AlertTitle className="text-xs">Row {error.row}</AlertTitle>
                              <AlertDescription className="text-xs">
                                <span className="font-medium">{error.itemCode}:</span> {error.error}
                              </AlertDescription>
                            </Alert>
                          ))}
                        </div>
                      </ScrollArea>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex gap-2 pt-2">
                    <Button 
                      variant="outline" 
                      onClick={handleBackToAssets}
                      className="flex-1"
                    >
                      View All Assets
                    </Button>
                    {importResult.success && (
                      <Button 
                        onClick={handleReset}
                        className="flex-1"
                      >
                        Import More Assets
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
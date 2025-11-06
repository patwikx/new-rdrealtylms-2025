"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { 
  Package, 
  Calendar, 
  DollarSign, 
  MapPin, 
  User, 
  Building, 
  Hash,
  FileText,
  Clock,
  Activity
} from "lucide-react"
import { format } from "date-fns"

interface PublicAssetDetailsViewProps {
  asset: any
}

export function PublicAssetDetailsView({ asset }: PublicAssetDetailsViewProps) {
  const formatCurrency = (amount: number | null) => {
    if (amount === null || amount === undefined) return "Not specified"
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP'
    }).format(amount)
  }

  const formatDate = (date: string | Date | null) => {
    if (!date) return "Not specified"
    return format(new Date(date), "MMM dd, yyyy")
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'bg-green-100 text-green-800'
      case 'INACTIVE': return 'bg-gray-100 text-gray-800'
      case 'MAINTENANCE': return 'bg-yellow-100 text-yellow-800'
      case 'DISPOSED': return 'bg-red-100 text-red-800'
      case 'LOST': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <Package className="h-8 w-8 text-blue-600" />
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{asset.itemCode}</h1>
            <p className="text-lg text-gray-600">{asset.description}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge className={getStatusColor(asset.status)}>
            {asset.status.replace(/_/g, ' ')}
          </Badge>
          {asset.isActive && (
            <Badge variant="outline" className="text-green-600 border-green-600">
              Active
            </Badge>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Basic Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Item Code</label>
                <p className="text-sm font-mono">{asset.itemCode}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Category</label>
                <p className="text-sm">{asset.category?.name || "Not specified"}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Serial Number</label>
                <p className="text-sm font-mono">{asset.serialNumber || "Not specified"}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Model Number</label>
                <p className="text-sm">{asset.modelNumber || "Not specified"}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Brand</label>
                <p className="text-sm">{asset.brand || "Not specified"}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Quantity</label>
                <p className="text-sm">{asset.quantity}</p>
              </div>
            </div>
            
            {asset.location && (
              <div>
                <label className="text-sm font-medium text-gray-500 flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  Location
                </label>
                <p className="text-sm">{asset.location}</p>
              </div>
            )}

            {asset.notes && (
              <div>
                <label className="text-sm font-medium text-gray-500">Notes</label>
                <p className="text-sm text-gray-700">{asset.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Financial Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Financial Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Purchase Price</label>
                <p className="text-sm font-semibold">{formatCurrency(asset.purchasePrice)}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Current Book Value</label>
                <p className="text-sm font-semibold">{formatCurrency(asset.currentBookValue)}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Accumulated Depreciation</label>
                <p className="text-sm">{formatCurrency(asset.accumulatedDepreciation)}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Purchase Date</label>
                <p className="text-sm flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  {formatDate(asset.purchaseDate)}
                </p>
              </div>
              {asset.warrantyExpiry && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Warranty Expiry</label>
                  <p className="text-sm flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    {formatDate(asset.warrantyExpiry)}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Organization Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building className="h-5 w-5" />
              Organization
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-500">Business Unit</label>
              <p className="text-sm">{asset.businessUnit?.name} ({asset.businessUnit?.code})</p>
            </div>
            {asset.department && (
              <div>
                <label className="text-sm font-medium text-gray-500">Department</label>
                <p className="text-sm">{asset.department.name}</p>
              </div>
            )}
            <div>
              <label className="text-sm font-medium text-gray-500">Created By</label>
              <p className="text-sm flex items-center gap-1">
                <User className="h-4 w-4" />
                {asset.createdBy?.name} ({asset.createdBy?.employeeId})
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Created Date</label>
              <p className="text-sm flex items-center gap-1">
                <Clock className="h-4 w-4" />
                {formatDate(asset.createdAt)}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Current Assignment */}
        {asset.currentDeployment && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Current Assignment
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Assigned To</label>
                <p className="text-sm font-semibold">
                  {asset.currentDeployment.employee.name} ({asset.currentDeployment.employee.employeeId})
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Transmittal Number</label>
                <p className="text-sm font-mono">{asset.currentDeployment.transmittalNumber}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Deployed Date</label>
                <p className="text-sm">{formatDate(asset.currentDeployment.deployedDate)}</p>
              </div>
              {asset.currentDeployment.expectedReturnDate && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Expected Return</label>
                  <p className="text-sm">{formatDate(asset.currentDeployment.expectedReturnDate)}</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Recent Activity */}
      {asset.recentHistory && asset.recentHistory.length > 0 && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {asset.recentHistory.slice(0, 10).map((history: any, index: number) => (
                <div key={history.id} className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-gray-900">
                        {history.action.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (l: string) => l.toUpperCase())}
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatDate(history.performedAt)}
                      </p>
                    </div>
                    {history.notes && (
                      <p className="text-sm text-gray-600 mt-1">{history.notes}</p>
                    )}
                    {history.employee && (
                      <p className="text-xs text-gray-500 mt-1">
                        by {history.employee.name}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Footer */}
      <div className="mt-8 text-center text-sm text-gray-500">
        <p>Asset information accessed via QR code</p>
        <p>Last updated: {formatDate(asset.updatedAt)}</p>
      </div>
    </div>
  )
}
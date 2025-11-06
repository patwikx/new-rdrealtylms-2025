"use client"

import { useState, useMemo } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { 
  Search, 
  Trash2,
  CheckSquare,
  X,
  Package,
  AlertTriangle,
  DollarSign,
  Calendar,
  MapPin,
  User
} from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useRouter } from "next/navigation"
import { DisposableAssetsResponse, DisposableAssetData } from "@/lib/actions/asset-disposal-actions"
import { AssetDisposalDialog } from "./asset-disposal-dialog"
import { toast } from "sonner"
import { format } from "date-fns"

// Helper functions
function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount)
}

function getStatusColor(status: string): "default" | "secondary" | "destructive" | "outline" {
  switch (status) {
    case 'AVAILABLE': return 'default'
    case 'DEPLOYED': return 'secondary'
    case 'IN_MAINTENANCE': return 'outline'
    case 'DAMAGED': return 'destructive'
    default: return 'outline'
  }
}

function getStatusLabel(status: string): string {
  switch (status) {
    case 'AVAILABLE': return 'Available'
    case 'DEPLOYED': return 'Deployed'
    case 'IN_MAINTENANCE': return 'In Maintenance'
    case 'DAMAGED': return 'Damaged'
    default: return status
  }
}

interface AssetDisposalViewProps {
  disposableAssetsData: DisposableAssetsResponse
  businessUnit: {
    id: string
    name: string
    code: string
  }
  businessUnitId: string
  currentFilters: {
    categoryId?: string
    search?: string
    page: number
  }
}

export function AssetDisposalView({ 
  disposableAssetsData, 
  businessUnit,
  businessUnitId, 
  currentFilters 
}: AssetDisposalViewProps) {
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState(currentFilters.search || "")
  const [selectedAssets, setSelectedAssets] = useState<Set<string>>(new Set())
  const [showDisposalDialog, setShowDisposalDialog] = useState(false)

  const filteredAssets = useMemo(() => {
    if (!searchTerm) return disposableAssetsData.assets
    
    const term = searchTerm.toLowerCase()
    return disposableAssetsData.assets.filter(asset => 
      asset.itemCode.toLowerCase().includes(term) ||
      asset.description.toLowerCase().includes(term) ||
      asset.serialNumber?.toLowerCase().includes(term) ||
      asset.brand?.toLowerCase().includes(term)
    )
  }, [disposableAssetsData.assets, searchTerm])

  const handleSearch = () => {
    const params = new URLSearchParams()
    if (searchTerm) params.set('search', searchTerm)
    if (currentFilters.categoryId) params.set('categoryId', currentFilters.categoryId)
    
    router.push(`/${businessUnitId}/asset-management/disposals?${params.toString()}`)
  }

  const handleSelectAsset = (assetId: string, checked: boolean) => {
    const newSelected = new Set(selectedAssets)
    if (checked) {
      newSelected.add(assetId)
    } else {
      newSelected.delete(assetId)
    }
    setSelectedAssets(newSelected)
  }

  const handleSelectAll = () => {
    if (selectedAssets.size === filteredAssets.length) {
      // Deselect all
      setSelectedAssets(new Set())
    } else {
      // Select all visible assets
      setSelectedAssets(new Set(filteredAssets.map(asset => asset.id)))
    }
  }

  const handleClearSelection = () => {
    setSelectedAssets(new Set())
  }

  const handleDisposeAssets = () => {
    if (selectedAssets.size === 0) {
      toast.error("Please select at least one asset to dispose")
      return
    }
    setShowDisposalDialog(true)
  }

  const selectedAssetsData = useMemo(() => {
    return disposableAssetsData.assets.filter(asset => selectedAssets.has(asset.id))
  }, [disposableAssetsData.assets, selectedAssets])

  const handleDisposalSuccess = () => {
    setSelectedAssets(new Set())
    setShowDisposalDialog(false)
    // Refresh the page to show updated asset status
    router.refresh()
  }

  return (
    <div className="flex-1 space-y-6 px-2 sm:px-0">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">Asset Disposals</h1>
          <p className="text-sm text-muted-foreground">
            Dispose of assets that are no longer needed or functional
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="font-mono">
            {selectedAssets.size} selected
          </Badge>
          {selectedAssets.size > 0 && (
            <>
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleClearSelection}
              >
                <X className="h-4 w-4 mr-2" />
                Clear
              </Button>
              <Button onClick={handleDisposeAssets} variant="destructive">
                <Trash2 className="h-4 w-4 mr-2" />
                Dispose Assets
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search by item code, description, serial number..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            className="pl-10"
          />
          {searchTerm !== (currentFilters.search || "") && (
            <Button
              size="sm"
              className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6"
              onClick={handleSearch}
            >
              Search
            </Button>
          )}
        </div>
        
        <Select 
          value={currentFilters.categoryId || "all"} 
          onValueChange={(value) => {
            const params = new URLSearchParams()
            if (searchTerm) params.set('search', searchTerm)
            if (value !== "all") params.set('categoryId', value)
            router.push(`/${businessUnitId}/asset-management/disposals?${params.toString()}`)
          }}
        >
          <SelectTrigger className="w-[250px]">
            <div className="flex items-center gap-2">
              <Package className="h-4 w-4 text-muted-foreground" />
              <SelectValue placeholder="All Categories" />
            </div>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {disposableAssetsData.categories.map((category) => (
              <SelectItem key={category.id} value={category.id}>
                {category.name} ({category.count} assets)
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Results count and bulk actions */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          Showing {filteredAssets.length} of {disposableAssetsData.totalCount} assets available for disposal
        </div>
        {filteredAssets.length > 0 && (
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleSelectAll}
          >
            <CheckSquare className="h-4 w-4 mr-2" />
            {selectedAssets.size === filteredAssets.length ? 'Deselect All' : 'Select All'}
          </Button>
        )}
      </div>

      {/* Assets Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]">
                <Checkbox
                  checked={filteredAssets.length > 0 && selectedAssets.size === filteredAssets.length}
                  onCheckedChange={handleSelectAll}
                  aria-label="Select all assets"
                />
              </TableHead>
              <TableHead>Item Code</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Serial Number</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Purchase Info</TableHead>
              <TableHead>Book Value</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Assigned To</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredAssets.length === 0 ? (
              <TableRow>
                <TableCell colSpan={10} className="text-center py-8">
                  <div className="flex flex-col items-center gap-2">
                    <Trash2 className="h-8 w-8 text-muted-foreground" />
                    <p className="text-muted-foreground">
                      {searchTerm ? "No assets match your search criteria" : "No assets available for disposal"}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Only available, deployed, in maintenance, or damaged assets can be disposed
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredAssets.map((asset) => (
                <TableRow 
                  key={asset.id}
                  className={`cursor-pointer ${selectedAssets.has(asset.id) ? 'bg-muted/50' : ''}`}
                  onClick={() => handleSelectAsset(asset.id, !selectedAssets.has(asset.id))}
                >
                  <TableCell>
                    <Checkbox
                      checked={selectedAssets.has(asset.id)}
                      onCheckedChange={(checked) => handleSelectAsset(asset.id, checked === true)}
                      aria-label={`Select ${asset.itemCode}`}
                      onClick={(e) => e.stopPropagation()}
                    />
                  </TableCell>
                  <TableCell>
                    <div className="font-mono text-sm font-medium">{asset.itemCode}</div>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">{asset.description}</div>
                    {asset.brand && (
                      <div className="text-xs text-muted-foreground mt-1">
                        {asset.brand}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="font-mono text-sm">
                      {asset.serialNumber || <span className="text-muted-foreground">N/A</span>}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {asset.category.name}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      {asset.purchasePrice && (
                        <div className="flex items-center gap-1 text-sm">
                          <DollarSign className="h-3 w-3 text-muted-foreground" />
                          <span>{formatCurrency(Number(asset.purchasePrice))}</span>
                        </div>
                      )}
                      {asset.purchaseDate && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          <span>{format(new Date(asset.purchaseDate), 'MMM dd, yyyy')}</span>
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 text-sm">
                      <DollarSign className="h-3 w-3 text-muted-foreground" />
                      <span>
                        {asset.currentBookValue ? formatCurrency(Number(asset.currentBookValue)) : 'N/A'}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 text-sm">
                      <MapPin className="h-3 w-3 text-muted-foreground" />
                      <span>Not specified</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {asset.assignedEmployee ? (
                      <div className="flex items-center gap-1 text-sm">
                        <User className="h-3 w-3 text-muted-foreground" />
                        <span>{asset.assignedEmployee.name}</span>
                      </div>
                    ) : (
                      <span className="text-muted-foreground text-sm">Unassigned</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <Badge variant={getStatusColor(asset.status)}>
                        {getStatusLabel(asset.status)}
                      </Badge>
                      {asset.status === 'DAMAGED' && (
                        <Badge variant="destructive" className="text-xs">
                          <AlertTriangle className="h-3 w-3 mr-1" />
                          Damaged
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {disposableAssetsData.totalCount > 100 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {((currentFilters.page - 1) * 100) + 1} to {Math.min(currentFilters.page * 100, disposableAssetsData.totalCount)} of {disposableAssetsData.totalCount} assets
          </p>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const params = new URLSearchParams()
                if (searchTerm) params.set('search', searchTerm)
                if (currentFilters.categoryId) params.set('categoryId', currentFilters.categoryId)
                params.set('page', (currentFilters.page - 1).toString())
                router.push(`/${businessUnitId}/asset-management/disposals?${params.toString()}`)
              }}
              disabled={currentFilters.page <= 1}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const params = new URLSearchParams()
                if (searchTerm) params.set('search', searchTerm)
                if (currentFilters.categoryId) params.set('categoryId', currentFilters.categoryId)
                params.set('page', (currentFilters.page + 1).toString())
                router.push(`/${businessUnitId}/asset-management/disposals?${params.toString()}`)
              }}
              disabled={currentFilters.page * 100 >= disposableAssetsData.totalCount}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Disposal Dialog */}
      {showDisposalDialog && (
        <AssetDisposalDialog
          assets={selectedAssetsData}
          businessUnitId={businessUnitId}
          open={showDisposalDialog}
          onOpenChange={setShowDisposalDialog}
          onSuccess={handleDisposalSuccess}
        />
      )}
    </div>
  )
}

// Removed AssetDisposalCard - now using table layout
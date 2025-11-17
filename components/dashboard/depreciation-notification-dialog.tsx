"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { AlertTriangle, Calendar, DollarSign, Package, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { format } from "date-fns"
import { getAssetsNeedingDepreciation, AssetNeedingDepreciation } from "@/lib/actions/depreciation-notification-actions"

interface DepreciationNotificationDialogProps {
  businessUnitId: string
  initialCount: number
  userRole: string
}

export function DepreciationNotificationDialog({ 
  businessUnitId, 
  initialCount,
  userRole 
}: DepreciationNotificationDialogProps) {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [assets, setAssets] = useState<AssetNeedingDepreciation[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [hasShownToday, setHasShownToday] = useState(false)

  // Check if we should show the notification
  useEffect(() => {
    // Only show to users who can manage assets
    if (!["ADMIN", "MANAGER", "ACCTG"].includes(userRole)) {
      return
    }

    // Check if we've already shown the notification today
    const today = new Date().toDateString()
    const lastShown = localStorage.getItem(`depreciation-notification-${businessUnitId}`)
    
    if (initialCount > 0 && lastShown !== today) {
      setIsOpen(true)
      localStorage.setItem(`depreciation-notification-${businessUnitId}`, today)
    }
  }, [initialCount, businessUnitId, userRole])

  // Load assets when dialog opens
  useEffect(() => {
    if (isOpen && assets.length === 0) {
      loadAssets()
    }
  }, [isOpen])

  const loadAssets = async () => {
    setIsLoading(true)
    try {
      const assetsData = await getAssetsNeedingDepreciation(businessUnitId)
      setAssets(assetsData)
    } catch (error) {
      console.error("Error loading assets:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleViewDepreciation = () => {
    setIsOpen(false)
    router.push(`/${businessUnitId}/asset-management/depreciation`)
  }

  const handleDismiss = () => {
    setIsOpen(false)
  }

  const formatCurrency = (amount: number) => {
    return `₱${amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}`
  }

  const getOverdueDays = (date: Date) => {
    const today = new Date()
    const diffTime = today.getTime() - date.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  if (initialCount === 0) {
    return null
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900/20">
              <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <DialogTitle className="text-xl">Depreciation Required</DialogTitle>
              <p className="text-sm text-muted-foreground">
                {initialCount} asset{initialCount !== 1 ? 's' : ''} need{initialCount === 1 ? 's' : ''} depreciation processing
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDismiss}
            className="h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </DialogHeader>

        <div className="flex-1 overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-muted-foreground">Loading assets...</div>
            </div>
          ) : (
            <div className="overflow-y-auto max-h-[400px]">
              <Table>
                <TableHeader className="sticky top-0 bg-background">
                  <TableRow>
                    <TableHead>Asset</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Monthly Depreciation</TableHead>
                    <TableHead className="text-right">Current Book Value</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {assets.map((asset) => {
                    const overdueDays = getOverdueDays(asset.nextDepreciationDate)
                    
                    return (
                      <TableRow key={asset.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{asset.itemCode}</div>
                            <div className="text-sm text-muted-foreground truncate max-w-[200px]">
                              {asset.description}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">
                            {asset.category.name}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">
                              {format(asset.nextDepreciationDate, "MMM dd, yyyy")}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant={overdueDays > 30 ? "destructive" : overdueDays > 7 ? "secondary" : "outline"}
                            className="text-xs"
                          >
                            {overdueDays === 0 ? "Due Today" : 
                             overdueDays === 1 ? "1 day overdue" :
                             `${overdueDays} days overdue`}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <DollarSign className="h-3 w-3 text-muted-foreground" />
                            <span className="font-medium">
                              {formatCurrency(asset.monthlyDepreciation)}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <span className="font-medium">
                            {formatCurrency(asset.currentBookValue)}
                          </span>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between pt-4 border-t">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Package className="h-4 w-4" />
            <span>
              Total: {assets.length} asset{assets.length !== 1 ? 's' : ''} requiring depreciation
            </span>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleDismiss}>
              Dismiss
            </Button>
            <Button onClick={handleViewDepreciation} className="gap-2">
              <AlertTriangle className="h-4 w-4" />
              Process Depreciation
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
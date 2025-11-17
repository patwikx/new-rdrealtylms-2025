"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { ShoppingCart, Calendar, DollarSign, Package, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { format } from "date-fns"
import { getMRSNeedingPurchasing, MRSNeedingPurchasing } from "@/lib/actions/mrs-notification-actions"

interface MRSNotificationDialogProps {
  businessUnitId: string
  initialCount: number
  userRole: string
}

export function MRSNotificationDialog({ 
  businessUnitId, 
  initialCount,
  userRole 
}: MRSNotificationDialogProps) {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [mrsRequests, setMrsRequests] = useState<MRSNeedingPurchasing[]>([])
  const [isLoading, setIsLoading] = useState(false)

  // Check if we should show the notification
  useEffect(() => {
    // Only show to users who can handle purchasing
    if (!["PURCHASER", "PURCHASING_MANAGER"].includes(userRole)) {
      return
    }

    // Check if we've shown the notification in the last 5 minutes
    const now = new Date().getTime()
    const lastShownTime = localStorage.getItem(`mrs-notification-time-${businessUnitId}`)
    const fiveMinutesAgo = now - (5 * 60 * 1000) // 5 minutes in milliseconds
    
    // Only show if there are MRS needing serving and it's been more than 5 minutes since last shown
    if (initialCount > 0 && (!lastShownTime || parseInt(lastShownTime) < fiveMinutesAgo)) {
      setIsOpen(true)
    }
  }, [initialCount, businessUnitId, userRole])

  // Set up interval to check and show notification every 5 minutes
  useEffect(() => {
    if (!["PURCHASER", "PURCHASING_MANAGER"].includes(userRole) || initialCount === 0) {
      return
    }

    const interval = setInterval(() => {
      const now = new Date().getTime()
      const lastShownTime = localStorage.getItem(`mrs-notification-time-${businessUnitId}`)
      const fiveMinutesAgo = now - (5 * 60 * 1000)
      
      // Show notification if it's been more than 5 minutes since last shown
      if (!lastShownTime || parseInt(lastShownTime) < fiveMinutesAgo) {
        setIsOpen(true)
      }
    }, 5 * 60 * 1000) // Check every 5 minutes

    return () => clearInterval(interval)
  }, [initialCount, businessUnitId, userRole])

  // Load MRS requests when dialog opens
  useEffect(() => {
    if (isOpen && mrsRequests.length === 0) {
      loadMRSRequests()
    }
  }, [isOpen])

  const loadMRSRequests = async () => {
    setIsLoading(true)
    try {
      const mrsData = await getMRSNeedingPurchasing(businessUnitId)
      setMrsRequests(mrsData)
    } catch (error) {
      console.error("Error loading MRS requests:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleViewMRS = () => {
    setIsOpen(false)
    // Mark the current time as last shown
    const now = new Date().getTime()
    localStorage.setItem(`mrs-notification-time-${businessUnitId}`, now.toString())
    router.push(`/${businessUnitId}/material-requests`)
  }

  const handleDismiss = () => {
    setIsOpen(false)
    // Mark the current time as last shown
    const now = new Date().getTime()
    localStorage.setItem(`mrs-notification-time-${businessUnitId}`, now.toString())
  }

  const formatCurrency = (amount: number) => {
    return `₱${amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}`
  }

  const getDaysUntilRequired = (date: Date) => {
    const today = new Date()
    const diffTime = date.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  if (initialCount === 0) {
    return null
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="max-w-5xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/20">
              <ShoppingCart className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <DialogTitle className="text-xl">Material Requests Ready for Serving</DialogTitle>
              <p className="text-sm text-muted-foreground">
                {initialCount} material request{initialCount !== 1 ? 's' : ''} ready for serving
              </p>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-muted-foreground">Loading material requests...</div>
            </div>
          ) : (
            <div className="overflow-y-auto max-h-[400px]">
              <Table>
                <TableHeader className="sticky top-0 bg-background">
                  <TableRow>
                    <TableHead>MRS Number</TableHead>
                    <TableHead>Purpose</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Requested By</TableHead>
                    <TableHead>Required Date</TableHead>
                    <TableHead>Items</TableHead>
                    <TableHead className="text-right">Total Amount</TableHead>
                    <TableHead>Priority</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mrsRequests.map((mrs) => {
                    const daysUntilRequired = getDaysUntilRequired(mrs.dateRequired)
                    
                    return (
                      <TableRow key={mrs.id}>
                        <TableCell>
                          <div className="font-medium font-mono">{mrs.docNo}</div>
                        </TableCell>
                        <TableCell>
                          <div className="max-w-[200px] truncate" title={mrs.purpose || 'No purpose specified'}>
                            {mrs.purpose || 'No purpose specified'}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">{mrs.department?.name || 'No department'}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm">{mrs.requestedBy?.name || 'Unknown'}</span>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">
                              {format(mrs.dateRequired, "MMM dd, yyyy")}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">
                            {mrs.itemsCount} item{mrs.itemsCount !== 1 ? 's' : ''}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <DollarSign className="h-3 w-3 text-muted-foreground" />
                            <span className="font-medium">
                              {formatCurrency(mrs.totalAmount)}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant={
                              daysUntilRequired < 0 ? "destructive" : 
                              daysUntilRequired <= 3 ? "secondary" : 
                              "outline"
                            }
                            className="text-xs"
                          >
                            {daysUntilRequired < 0 ? `${Math.abs(daysUntilRequired)} days overdue` :
                             daysUntilRequired === 0 ? "Due today" :
                             daysUntilRequired === 1 ? "Due tomorrow" :
                             `${daysUntilRequired} days left`}
                          </Badge>
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
              Total: {mrsRequests.length} material request{mrsRequests.length !== 1 ? 's' : ''} ready for serving
            </span>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleDismiss}>
              Dismiss
            </Button>
            <Button onClick={handleViewMRS} className="gap-2">
              <ShoppingCart className="h-4 w-4" />
              View Material Requests
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Loader2, CheckCircle, AlertCircle, Building, FileText, Check, ChevronsUpDown } from "lucide-react"
import { toast } from "sonner"
import { markRequestAsServed } from "@/lib/actions/mrs-actions/material-request-actions"
import { MaterialRequest } from "@/types/material-request-types"
import { format } from "date-fns"
import { cn } from "@/lib/utils"

interface Supplier {
  cardCode: string
  cardName: string
}

interface MarkAsServedDialogProps {
  request: MaterialRequest
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
  businessUnitId: string
}

export function MarkAsServedDialog({
  request,
  open,
  onOpenChange,
  onSuccess,
  businessUnitId
}: MarkAsServedDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [notes, setNotes] = useState("")
  const [supplierBPCode, setSupplierBPCode] = useState("")
  const [supplierName, setSupplierName] = useState("")
  const [purchaseOrderNumber, setPurchaseOrderNumber] = useState("")
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [isLoadingSuppliers, setIsLoadingSuppliers] = useState(false)
  const [supplierSearchTerm, setSupplierSearchTerm] = useState("")
  const [isSupplierPopoverOpen, setIsSupplierPopoverOpen] = useState(false)

  // Fetch suppliers when popover opens or search term changes
  useEffect(() => {
    const fetchSuppliers = async () => {
      if (!isSupplierPopoverOpen && !supplierSearchTerm) return
      
      setIsLoadingSuppliers(true)
      try {
        const searchParam = supplierSearchTerm ? `?search=${encodeURIComponent(supplierSearchTerm)}` : ""
        const response = await fetch(`/api/suppliers${searchParam}`)
        const data = await response.json()
        
        if (data.success) {
          setSuppliers(data.data)
        } else {
          toast.error("Failed to load suppliers")
        }
      } catch (error) {
        console.error("Error fetching suppliers:", error)
        toast.error("Failed to load suppliers")
      } finally {
        setIsLoadingSuppliers(false)
      }
    }

    const debounceTimer = setTimeout(fetchSuppliers, 300)
    return () => clearTimeout(debounceTimer)
  }, [supplierSearchTerm, isSupplierPopoverOpen])

  const handleSupplierSelect = (supplier: Supplier) => {
    setSupplierBPCode(supplier.cardCode)
    setSupplierName(supplier.cardName)
    setIsSupplierPopoverOpen(false)
    setSupplierSearchTerm("")
  }

  const clearSupplier = () => {
    setSupplierBPCode("")
    setSupplierName("")
  }

  const getSelectedSupplierDisplay = () => {
    if (supplierBPCode && supplierName) {
      return `${supplierBPCode} - ${supplierName}`
    }
    return "Select supplier"
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validate required fields
    if (!supplierBPCode || supplierBPCode.trim() === "") {
      toast.error("Supplier is required")
      return
    }

    if (!purchaseOrderNumber || purchaseOrderNumber.trim() === "") {
      toast.error("Purchase Order Number is required")
      return
    }
    
    setIsSubmitting(true)
    
    try {
      const result = await markRequestAsServed({
        requestId: request.id,
        businessUnitId,
        notes: notes.trim() || undefined,
        supplierBPCode: supplierBPCode.trim(),
        supplierName: supplierName.trim(),
        purchaseOrderNumber: purchaseOrderNumber.trim()
      })
      
      if (result.success) {
        toast.success(result.message || "Request marked as served successfully")
        onSuccess()
        onOpenChange(false)
        setNotes("")
        setSupplierBPCode("")
        setSupplierName("")
        setPurchaseOrderNumber("")
      } else {
        toast.error(result.error || "Failed to mark request as served")
      }
    } catch (error) {
      console.error("Error marking request as served:", error)
      toast.error("An unexpected error occurred")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              Mark Request as Served
            </DialogTitle>
            <DialogDescription>
              Confirm that this material request has been served and is ready for posting.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Request Details */}
            <div className="bg-muted/50 rounded-lg p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Document No:</span>
                <span className="font-mono font-semibold">{request.docNo}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Requested By:</span>
                <span className="text-sm">{request.requestedBy.name}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Department:</span>
                <span className="text-sm">{request.department?.name || "N/A"}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Date Requested:</span>
                <span className="text-sm">{format(new Date(request.createdAt), "MMM dd, yyyy")}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Items:</span>
                <span className="text-sm font-semibold">
                  {request.items?.length || 0} {(request.items?.length || 0) === 1 ? 'item' : 'items'}
                </span>
              </div>
            </div>

            {/* Items List */}
            {request.items && request.items.length > 0 && (
              <div className="space-y-2">
                <Label className="text-sm font-medium">Items to Serve</Label>
                <div className="border rounded-lg max-h-[300px] overflow-y-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[50px]">#</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead className="text-right">Quantity</TableHead>
                        <TableHead>UOM</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {request.items.map((item, index) => (
                        <TableRow key={item.id}>
                          <TableCell className="text-muted-foreground">{index + 1}</TableCell>
                          <TableCell>
                            <div className="font-medium">{item.description}</div>
                            {item.remarks && (
                              <div className="text-xs text-muted-foreground mt-1">{item.remarks}</div>
                            )}
                          </TableCell>
                          <TableCell className="text-right font-semibold">{item.quantity}</TableCell>
                          <TableCell>{item.uom}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}

            {/* Supplier Selection */}
            <div className="space-y-2">
              <Label htmlFor="supplier" className="flex items-center gap-2">
                <Building className="h-4 w-4" />
                Supplier <span className="text-red-500">*</span>
              </Label>
              <Popover open={isSupplierPopoverOpen} onOpenChange={setIsSupplierPopoverOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={isSupplierPopoverOpen}
                    className="w-full justify-between"
                  >
                    <span className="truncate">
                      {getSelectedSupplierDisplay()}
                    </span>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0" align="start">
                  <Command>
                    <CommandInput 
                      placeholder="Search suppliers..." 
                      value={supplierSearchTerm}
                      onValueChange={setSupplierSearchTerm}
                    />
                    <CommandList>
                      <CommandEmpty>
                        {isLoadingSuppliers ? "Loading suppliers..." : "No suppliers found."}
                      </CommandEmpty>
                      <CommandGroup>
                        {supplierBPCode && (
                          <CommandItem
                            onSelect={clearSupplier}
                            className="text-muted-foreground"
                          >
                            <Check className="mr-2 h-4 w-4 opacity-0" />
                            Clear selection
                          </CommandItem>
                        )}
                        {suppliers.map((supplier) => (
                          <CommandItem
                            key={supplier.cardCode}
                            onSelect={() => handleSupplierSelect(supplier)}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                supplierBPCode === supplier.cardCode ? "opacity-100" : "opacity-0"
                              )}
                            />
                            <div className="flex flex-col">
                              <span className="font-medium">BP Code: {supplier.cardCode}</span>
                              <span className="text-sm text-muted-foreground">
                                Supplier: {supplier.cardName}
                              </span>
                            </div>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
              {supplierBPCode && (
                <div className="p-2 border rounded-lg bg-muted/50 text-sm">
                  <div><strong>BP Code:</strong> {supplierBPCode}</div>
                  <div><strong>Supplier:</strong> {supplierName}</div>
                </div>
              )}
            </div>

            {/* Purchase Order Number */}
            <div className="space-y-2">
              <Label htmlFor="purchaseOrderNumber" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Purchase Order Number <span className="text-red-500">*</span>
              </Label>
              <Input
                id="purchaseOrderNumber"
                placeholder="Enter PO number from SAP"
                value={purchaseOrderNumber}
                onChange={(e) => setPurchaseOrderNumber(e.target.value)}
                required
              />
              <p className="text-xs text-muted-foreground">
                Enter the purchase order number from SAP system.
              </p>
            </div>

            {/* Warning Message */}
            <div className="flex items-start gap-3 p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg">
              <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
              <div className="text-sm">
                <p className="font-medium text-amber-900 dark:text-amber-100 mb-1">Important</p>
                <p className="text-amber-800 dark:text-amber-200">
                  By marking this request as served, it will move to "For Posting" status and will be ready for the next step in the process.
                </p>
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes">
                Notes <span className="text-muted-foreground">(Optional)</span>
              </Label>
              <Textarea
                id="notes"
                placeholder="Add any notes about serving this request..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                className="resize-none"
              />
              <p className="text-xs text-muted-foreground">
                These notes will be recorded with the status change.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Mark as Served
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
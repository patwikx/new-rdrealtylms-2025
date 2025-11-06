"use client"

import { format } from "date-fns"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Separator } from "@/components/ui/separator"
import { MaterialRequest } from "@/types/material-request-types"
import { 
  FileText, 
  Building2, 
  User, 
  Calendar, 
  Package, 
  DollarSign,
  CheckCircle2,
  Clock
} from "lucide-react"

interface MaterialRequestViewContentProps {
  materialRequest: MaterialRequest
}

export function MaterialRequestViewContent({ materialRequest }: MaterialRequestViewContentProps) {
  return (
    <div className="space-y-8 px-2 sm:px-0">
      {/* Header Section with Key Info */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Document Info */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-lg font-semibold border-b pb-2">
            <FileText className="h-5 w-5 text-blue-500" />
            Document Details
          </div>
          <div className="space-y-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Document No.</label>
              <p className="mt-1 text-lg font-bold text-foreground">{materialRequest.docNo}</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Series</label>
                <p className="mt-1 font-semibold">{materialRequest.series}</p>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Type</label>
                <Badge variant="outline" className="mt-1">
                  {materialRequest.type === "ITEM" ? "Item" : "Service"}
                </Badge>
              </div>
            </div>
          </div>
        </div>

        {/* Organization Info */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-lg font-semibold border-b pb-2">
            <Building2 className="h-5 w-5 text-green-500" />
            Organization
          </div>
          <div className="space-y-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Business Unit</label>
              <p className="mt-1 font-semibold">{materialRequest.businessUnit.name}</p>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Department</label>
              <p className="mt-1 font-semibold">
                {materialRequest.department?.name || (
                  <span className="text-muted-foreground italic">No Department</span>
                )}
              </p>
            </div>
            {materialRequest.chargeTo && (
              <div>
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Charge To</label>
                <p className="mt-1 font-semibold">{materialRequest.chargeTo}</p>
              </div>
            )}
          </div>
        </div>

        {/* Request Info */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-lg font-semibold border-b pb-2">
            <User className="h-5 w-5 text-purple-500" />
            Request Details
          </div>
          <div className="space-y-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Requested By</label>
              <p className="mt-1 font-semibold">{materialRequest.requestedBy.name}</p>
              <p className="text-sm text-muted-foreground">{materialRequest.requestedBy.employeeId}</p>
            </div>
            <div className="grid grid-cols-1 gap-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Date Prepared</label>
                <p className="mt-1 font-semibold flex items-center gap-1">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  {format(new Date(materialRequest.datePrepared), "MMM dd, yyyy")}
                </p>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Date Required</label>
                <p className="mt-1 font-semibold flex items-center gap-1">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  {format(new Date(materialRequest.dateRequired), "MMM dd, yyyy")}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Additional Information */}
      {(materialRequest.purpose || materialRequest.deliverTo || materialRequest.remarks) && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold border-b pb-2">Additional Information</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {materialRequest.purpose && (
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Purpose</label>
                <div className="p-3 bg-muted/30 rounded-md border">
                  <p className="text-sm">{materialRequest.purpose}</p>
                </div>
              </div>
            )}
            {materialRequest.deliverTo && (
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Deliver To</label>
                <div className="p-3 bg-muted/30 rounded-md border">
                  <p className="text-sm">{materialRequest.deliverTo}</p>
                </div>
              </div>
            )}
            {materialRequest.remarks && (
              <div className="sm:col-span-2 space-y-2">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Remarks</label>
                <div className="p-3 bg-muted/30 rounded-md border">
                  <p className="text-sm">{materialRequest.remarks}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Items Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-lg font-semibold border-b pb-2">
          <Package className="h-5 w-5 text-orange-500" />
          Items
          <Badge variant="secondary" className="ml-2">
            {materialRequest.items.length} {materialRequest.items.length === 1 ? 'item' : 'items'}
          </Badge>
        </div>
        {/* Mobile Card View */}
        <div className="block sm:hidden">
          <div className="space-y-3">
              {materialRequest.items.map((item, index) => {
                const itemTotal = (item.unitPrice || 0) * item.quantity
                return (
                  <div key={item.id} className="border rounded-lg p-4 space-y-4 bg-gradient-to-r from-muted/20 to-muted/10 hover:shadow-sm transition-shadow">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-sm font-semibold text-primary">
                            {index + 1}
                          </div>
                          <Badge 
                            variant={item.itemCode ? "secondary" : "default"}
                            className="font-medium text-xs px-2 py-1"
                          >
                            {item.itemCode ? "Existing Item" : "New Item"}
                          </Badge>
                        </div>
                        <div className="text-right">
                          <div className="text-xs text-muted-foreground">Total</div>
                          <div className="font-bold text-lg">₱{itemTotal.toLocaleString()}</div>
                        </div>
                      </div>
                      
                      <div className="space-y-3">
                        <div className="grid grid-cols-1 gap-3">
                          <div>
                            <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Item Code</div>
                            <div className="font-semibold">
                              {item.itemCode || (
                                <span className="text-muted-foreground italic">Auto-generated</span>
                              )}
                            </div>
                          </div>
                          
                          <div>
                            <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Description</div>
                            <div className="font-semibold">{item.description}</div>
                            {item.remarks && (
                              <div className="text-xs text-muted-foreground mt-1 p-2 bg-muted/50 rounded">
                                {item.remarks}
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <Separator />
                        
                        <div className="grid grid-cols-3 gap-3 text-center">
                          <div className="p-2 bg-blue-50 dark:bg-blue-950/30 rounded">
                            <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">UOM</div>
                            <div className="font-bold text-blue-700 dark:text-blue-300">{item.uom}</div>
                          </div>
                          <div className="p-2 bg-green-50 dark:bg-green-950/30 rounded">
                            <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Quantity</div>
                            <div className="font-bold text-green-700 dark:text-green-300">{item.quantity}</div>
                          </div>
                          <div className="p-2 bg-purple-50 dark:bg-purple-950/30 rounded">
                            <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Unit Price</div>
                            <div className="font-bold text-purple-700 dark:text-purple-300">₱{(item.unitPrice || 0).toLocaleString()}</div>
                          </div>
                        </div>
                      </div>
                  </div>
                )
              })}
            </div>
        </div>
        
        {/* Desktop Table View */}
        <div className="hidden sm:block overflow-hidden">
          <div className="rounded-lg border border-border bg-card overflow-x-auto">
              <Table>
                <TableHeader className="bg-muted/50">
                  <TableRow className="border-b border-border hover:bg-transparent">
                    <TableHead className="h-12 px-4 text-left align-middle font-semibold text-muted-foreground">
                      #
                    </TableHead>
                    <TableHead className="h-12 px-4 text-left align-middle font-semibold text-muted-foreground">
                      Item Code
                    </TableHead>
                    <TableHead className="h-12 px-4 text-left align-middle font-semibold text-muted-foreground">
                      Description
                    </TableHead>
                    <TableHead className="h-12 px-4 text-left align-middle font-semibold text-muted-foreground">
                      UOM
                    </TableHead>
                    <TableHead className="h-12 px-4 text-left align-middle font-semibold text-muted-foreground">
                      Quantity
                    </TableHead>
                    <TableHead className="h-12 px-4 text-left align-middle font-semibold text-muted-foreground">
                      Unit Price
                    </TableHead>
                    <TableHead className="h-12 px-4 text-left align-middle font-semibold text-muted-foreground">
                      Total
                    </TableHead>
                    <TableHead className="h-12 px-4 text-left align-middle font-semibold text-muted-foreground">
                      Type
                    </TableHead>
                  </TableRow>
                </TableHeader>
              <TableBody>
                {materialRequest.items.map((item, index) => {
                  const itemTotal = (item.unitPrice || 0) * item.quantity
                  return (
                    <TableRow 
                      key={item.id} 
                      className="border-b border-border hover:bg-muted/50 transition-colors"
                    >
                      <TableCell className="h-14 px-4 align-middle">
                        <div className="flex items-center justify-center w-6 h-6 rounded-full bg-muted text-xs font-medium">
                          {index + 1}
                        </div>
                      </TableCell>
                      <TableCell className="h-14 px-4 align-middle">
                        <div className="font-medium">
                          {item.itemCode || (
                            <span className="text-muted-foreground italic">Auto-generated</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="h-14 px-4 align-middle">
                        <div className="max-w-[200px]">
                          <div className="font-medium">{item.description}</div>
                          {item.remarks && (
                            <div className="text-xs text-muted-foreground mt-1">
                              {item.remarks}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="h-14 px-4 align-middle">
                        <span className="font-medium">{item.uom}</span>
                      </TableCell>
                      <TableCell className="h-14 px-4 align-middle">
                        <span className="font-medium">{item.quantity}</span>
                      </TableCell>
                      <TableCell className="h-14 px-4 align-middle">
                        <span className="font-medium">₱{(item.unitPrice || 0).toLocaleString()}</span>
                      </TableCell>
                      <TableCell className="h-14 px-4 align-middle">
                        <span className="font-semibold">₱{itemTotal.toLocaleString()}</span>
                      </TableCell>
                      <TableCell className="h-14 px-4 align-middle">
                        <Badge 
                          variant={item.itemCode ? "secondary" : "default"}
                          className="font-medium"
                        >
                          {item.itemCode ? "Existing" : "New"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  )
                })}
                </TableBody>
              </Table>
            </div>
        </div>
      </div>

      {/* Financial Summary */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-lg font-semibold border-b pb-2">
          <DollarSign className="h-5 w-5 text-emerald-500" />
          Financial Summary
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="text-center p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Freight</label>
            <p className="mt-2 text-xl font-bold text-blue-700 dark:text-blue-300">₱{materialRequest.freight.toLocaleString()}</p>
          </div>
          <div className="text-center p-4 bg-red-50 dark:bg-red-950/30 rounded-lg">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Discount</label>
            <p className="mt-2 text-xl font-bold text-red-700 dark:text-red-300">₱{materialRequest.discount.toLocaleString()}</p>
          </div>
          <div className="text-center p-4 bg-emerald-50 dark:bg-emerald-950/30 rounded-lg border-2 border-emerald-200 dark:border-emerald-800">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Total Amount</label>
            <p className="mt-2 text-2xl font-bold text-emerald-700 dark:text-emerald-300">₱{materialRequest.total.toLocaleString()}</p>
          </div>
        </div>
      </div>

      {/* Approval Information */}
      {(materialRequest.recApprover || materialRequest.finalApprover) && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-lg font-semibold border-b pb-2">
            <CheckCircle2 className="h-5 w-5 text-indigo-500" />
            Approval Information
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {materialRequest.recApprover && (
              <div className="p-4 bg-indigo-50 dark:bg-indigo-950/30 rounded-lg border">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Recommending Approver</label>
                <p className="mt-2 font-bold text-indigo-700 dark:text-indigo-300">
                  {materialRequest.recApprover.name}
                </p>
                <p className="text-sm text-muted-foreground">
                  {materialRequest.recApprover.employeeId}
                </p>
                {materialRequest.recApprovalDate && (
                  <p className="text-sm text-muted-foreground mt-2 flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {format(new Date(materialRequest.recApprovalDate), "MMM dd, yyyy")}
                  </p>
                )}
              </div>
            )}
            {materialRequest.finalApprover && (
              <div className="p-4 bg-emerald-50 dark:bg-emerald-950/30 rounded-lg border">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Final Approver</label>
                <p className="mt-2 font-bold text-emerald-700 dark:text-emerald-300">
                  {materialRequest.finalApprover.name}
                </p>
                <p className="text-sm text-muted-foreground">
                  {materialRequest.finalApprover.employeeId}
                </p>
                {materialRequest.finalApprovalDate && (
                  <p className="text-sm text-muted-foreground mt-2 flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {format(new Date(materialRequest.finalApprovalDate), "MMM dd, yyyy")}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
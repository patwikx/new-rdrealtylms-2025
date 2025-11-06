"use client"

import { useState, useMemo } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Search, Package, Eye, CheckCircle2 } from "lucide-react"
import { format } from "date-fns"
import Link from "next/link"
import { MaterialRequest } from "@/types/material-request-types"

interface DoneRequestsClientProps {
  initialRequests: MaterialRequest[]
  userRole: string
  businessUnitId: string
}

export function DoneRequestsClient({ 
  initialRequests, 
  businessUnitId 
}: DoneRequestsClientProps) {
  const [requests] = useState<MaterialRequest[]>(initialRequests)
  const [searchTerm, setSearchTerm] = useState("")

  const filteredRequests = useMemo(() => {
    if (!searchTerm) return requests
    
    return requests.filter(request => 
      request.docNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.purpose?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.confirmationNo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.requestedBy.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.supplierName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.purchaseOrderNumber?.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }, [requests, searchTerm])

  return (
    <div className="flex-1 space-y-6 px-2 sm:px-0">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">Done Requests</h1>
          <p className="text-sm text-muted-foreground">
            Material requests that have been completed and marked as received
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search by document number, purpose, confirmation number, requester, supplier, or PO number..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Results count */}
      <div className="text-sm text-muted-foreground">
        Showing {filteredRequests.length} of {requests.length} completed requests
      </div>

      {/* Desktop Table */}
      <div className="rounded-md border hidden sm:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Document No.</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Requested By</TableHead>
              <TableHead>Department</TableHead>
              <TableHead>Date Received</TableHead>
              <TableHead>Supplier</TableHead>
              <TableHead>PO Number</TableHead>
              <TableHead>Total Amount</TableHead>
              <TableHead>Items</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredRequests.length === 0 ? (
              <TableRow>
                <TableCell colSpan={10} className="text-center py-8">
                  <div className="flex flex-col items-center gap-2">
                    <Package className="h-8 w-8 text-muted-foreground" />
                    <p className="text-muted-foreground">No completed requests found</p>
                    <p className="text-xs text-muted-foreground">
                      Requests appear here when they have been marked as received
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredRequests.map((request) => (
                <TableRow key={request.id}>
                  <TableCell className="font-medium">{request.docNo}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{request.type}</Badge>
                  </TableCell>
                  <TableCell>
                    {request.requestedBy.name}
                  </TableCell>
                  <TableCell>{request.department?.name || "N/A"}</TableCell>
                  <TableCell>
                    {request.dateReceived ? format(new Date(request.dateReceived), "MMM dd, yyyy") : "N/A"}
                  </TableCell>
                  <TableCell>{request.supplierName || "N/A"}</TableCell>
                  <TableCell>{request.purchaseOrderNumber || "N/A"}</TableCell>
                  <TableCell>₱{request.total.toLocaleString()}</TableCell>
                  <TableCell>{request.items.length} items</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        asChild
                      >
                        <Link href={`/${businessUnitId}/material-requests/${request.id}`}>
                          <Eye className="h-4 w-4" />
                        </Link>
                      </Button>
                      <Badge variant="secondary" className="text-xs">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Completed
                      </Badge>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Mobile Cards */}
      <div className="sm:hidden space-y-4">
        {filteredRequests.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-8">
              <Package className="h-8 w-8 text-muted-foreground mb-2" />
              <p className="text-muted-foreground">No completed requests found</p>
              <p className="text-xs text-muted-foreground text-center mt-1">
                Requests appear here when they have been marked as received
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredRequests.map((request) => (
            <Card key={request.id}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <Package className="h-4 w-4" />
                    <CardTitle className="text-base">{request.docNo}</CardTitle>
                  </div>
                  <div className="flex flex-col gap-1">
                    <Badge variant="outline">{request.type}</Badge>
                    <Badge variant="secondary" className="text-xs">
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      Completed
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-muted-foreground">Requested by:</span>
                    <p className="font-medium">
                      {request.requestedBy.name}
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Department:</span>
                    <p className="font-medium">{request.department?.name || "N/A"}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Date Received:</span>
                    <p className="font-medium">
                      {request.dateReceived ? format(new Date(request.dateReceived), "MMM dd, yyyy") : "N/A"}
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Supplier:</span>
                    <p className="font-medium">{request.supplierName || "N/A"}</p>
                  </div>
                </div>

                {request.purchaseOrderNumber && (
                  <div className="text-sm">
                    <span className="text-muted-foreground">PO Number:</span>
                    <p className="font-medium">{request.purchaseOrderNumber}</p>
                  </div>
                )}

                <div className="bg-muted/30 rounded-md p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Total Amount</span>
                    <span className="text-lg font-semibold">₱{request.total.toLocaleString()}</span>
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {request.items.length} items
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    asChild
                  >
                    <Link href={`/${businessUnitId}/material-requests/${request.id}`}>
                      <Eye className="h-4 w-4 mr-2" />
                      View Details
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
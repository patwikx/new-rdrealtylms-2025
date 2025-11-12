"use client"

import { useState, useMemo } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Search, Package, Eye, CheckCircle, Truck } from "lucide-react"
import { format } from "date-fns"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { MarkAsServedDialog } from "./mark-as-served-dialog"
import { MaterialRequest } from "@/types/material-request-types"

interface ToServeRequestsClientProps {
  initialRequests: MaterialRequest[]
  userRole: string
  businessUnitId: string
}

export function ToServeRequestsClient({ initialRequests, userRole, businessUnitId }: ToServeRequestsClientProps) {
  const [requests, setRequests] = useState<MaterialRequest[]>(initialRequests)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedRequest, setSelectedRequest] = useState<MaterialRequest | null>(null)
  const [isMarkAsServedDialogOpen, setIsMarkAsServedDialogOpen] = useState(false)
  const router = useRouter()

  const filteredRequests = useMemo(() => {
    if (!searchTerm) return requests
    
    return requests.filter(request => 
      request.docNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.purpose?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.requestedBy.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.department?.name.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }, [requests, searchTerm])

  const handleMarkAsServed = (request: MaterialRequest) => {
    setSelectedRequest(request)
    setIsMarkAsServedDialogOpen(true)
  }

  const handleMarkAsServedSuccess = () => {
    if (selectedRequest) {
      // Remove the request from the list since it's now served
      setRequests(prev => prev.filter(req => req.id !== selectedRequest.id))
      router.refresh()
    }
    setSelectedRequest(null)
  }

  const canMarkAsServed = (role: string): boolean => {
    return ["ADMIN", "PURCHASER"].includes(role)
  }

  const getRequestTypeBadge = (type: string) => {
    const typeMap: Record<string, { label: string; variant: "default" | "secondary" | "outline" }> = {
      PURCHASE: { label: "Purchase", variant: "default" },
      STOCK: { label: "Stock", variant: "secondary" },
      BOTH: { label: "Both", variant: "outline" }
    }
    
    const config = typeMap[type] || { label: type, variant: "outline" as const }
    return <Badge variant={config.variant}>{config.label}</Badge>
  }

  return (
    <div className="flex-1 space-y-6 px-2 sm:px-0">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">Requests to Serve</h1>
          <p className="text-sm text-muted-foreground">
            Material requests ready to be served by the purchaser
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search by document number, purpose, requester, or department..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Results count */}
      <div className="text-sm text-muted-foreground">
        Showing {filteredRequests.length} of {requests.length} requests to serve
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
              <TableHead>Date Requested</TableHead>
              <TableHead>Purpose</TableHead>
              <TableHead>Items</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredRequests.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8">
                  <div className="flex flex-col items-center gap-2">
                    <Package className="h-8 w-8 text-muted-foreground" />
                    <p className="text-muted-foreground">
                      {searchTerm ? "No requests match your search criteria" : "No requests to serve"}
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredRequests.map((request) => (
                <TableRow key={request.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Package className="h-4 w-4 text-muted-foreground" />
                      <span className="font-mono font-medium">{request.docNo}</span>
                    </div>
                  </TableCell>
                  <TableCell>{getRequestTypeBadge(request.type)}</TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{request.requestedBy.name}</div>
                      <div className="text-sm text-muted-foreground">{request.requestedBy.employeeId}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {request.department ? (
                      <span className="font-medium">{request.department.name}</span>
                    ) : (
                      <span className="text-muted-foreground">N/A</span>
                    )}
                  </TableCell>
                  <TableCell>{format(new Date(request.createdAt), "MMM dd, yyyy")}</TableCell>
                  <TableCell>
                    <div className="max-w-[200px] truncate" title={request.purpose || undefined}>
                      {request.purpose || <span className="text-muted-foreground">No purpose specified</span>}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {request.items?.length || 0} {(request.items?.length || 0) === 1 ? 'item' : 'items'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        asChild
                      >
                        <Link href={`/${businessUnitId}/material-requests/${request.id}`}>
                          <Eye className="h-4 w-4" />
                        </Link>
                      </Button>
                      {canMarkAsServed(userRole) && (
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => handleMarkAsServed(request)}
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Mark as Served
                        </Button>
                      )}
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
              <p className="text-muted-foreground">
                {searchTerm ? "No requests match your search criteria" : "No requests to serve"}
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredRequests.map((request) => (
            <Card key={request.id}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <Package className="h-4 w-4 text-muted-foreground" />
                    <CardTitle className="text-base font-mono">{request.docNo}</CardTitle>
                  </div>
                  {getRequestTypeBadge(request.type)}
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-muted-foreground">Requested By:</span>
                    <p className="font-medium">{request.requestedBy.name}</p>
                    <p className="text-xs text-muted-foreground">{request.requestedBy.employeeId}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Department:</span>
                    <p className="font-medium">
                      {request.department?.name || <span className="text-muted-foreground">N/A</span>}
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Date Requested:</span>
                    <p className="font-medium">{format(new Date(request.createdAt), "MMM dd, yyyy")}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Items:</span>
                    <p className="font-medium">
                      {request.items?.length || 0} {(request.items?.length || 0) === 1 ? 'item' : 'items'}
                    </p>
                  </div>
                </div>

                {request.purpose && (
                  <div>
                    <span className="text-muted-foreground text-sm">Purpose:</span>
                    <p className="text-sm mt-1">{request.purpose}</p>
                  </div>
                )}

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
                  {canMarkAsServed(userRole) && (
                    <Button
                      variant="default"
                      size="sm"
                      className="flex-1"
                      onClick={() => handleMarkAsServed(request)}
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Mark as Served
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Mark as Served Dialog */}
      {selectedRequest && (
        <MarkAsServedDialog
          request={selectedRequest}
          open={isMarkAsServedDialogOpen}
          onOpenChange={setIsMarkAsServedDialogOpen}
          onSuccess={handleMarkAsServedSuccess}
          businessUnitId={businessUnitId}
        />
      )}
    </div>
  )
}
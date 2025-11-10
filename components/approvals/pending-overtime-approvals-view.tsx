"use client";

import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  Search, 
  Calendar, 
  Clock3,
  Filter,
  User
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { format } from "date-fns";
import { useRouter, useSearchParams } from "next/navigation";
import { PendingOvertimeApprovalsResponse } from "@/lib/actions/approval-actions";
import { OvertimeApprovalActions } from "@/components/approvals/overtime-approval-actions";

interface PendingOvertimeApprovalsViewProps {
  approvalsData: PendingOvertimeApprovalsResponse;
  businessUnitId: string;
  currentUserRole: string;
  currentFilters: {
    status?: string;
    page: number;
  };
}

function formatRequestStatus(status: string): string {
  switch (status.toUpperCase()) {
    case 'PENDING_MANAGER':
      return 'Pending Manager';
    case 'PENDING_HR':
      return 'Pending HR';
    default:
      return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
  }
}

function getStatusVariant(status: string) {
  switch (status.toUpperCase()) {
    case 'PENDING_MANAGER':
    case 'PENDING_HR':
      return 'secondary';
    default:
      return 'outline';
  }
}

const statusOptions = [
  { value: 'PENDING_MANAGER', label: 'Pending Manager', icon: Clock3 },
  { value: 'PENDING_HR', label: 'Pending HR', icon: Clock3 }
];

export function PendingOvertimeApprovalsView({ 
  approvalsData, 
  businessUnitId,
  currentUserRole,
  currentFilters 
}: PendingOvertimeApprovalsViewProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const requests = approvalsData.overtimeRequests;
  const [searchTerm, setSearchTerm] = useState("");

  // Helper function to extract time without timezone conversion
  const extractTimeFromDateTime = (dateTime: Date | string): string => {
    let isoString: string;
    
    // Handle both Date objects and ISO strings
    if (typeof dateTime === 'string') {
      isoString = dateTime;
    } else {
      // If it's a Date object, convert to ISO string but we'll extract the UTC time
      isoString = dateTime.toISOString();
    }
    
    // Extract the time portion from ISO string (e.g., "2025-11-08T13:00:00.000Z" -> "13:00")
    const timePart = isoString.split('T')[1]?.split('.')[0] || isoString.split('T')[1]?.split('Z')[0];
    if (!timePart) return "";
    
    const [hours, minutes] = timePart.split(':');
    const hour24 = parseInt(hours, 10);
    const minute = minutes;
    
    // Convert to 12-hour format
    let hour12: number;
    let period: string;
    
    if (hour24 === 0) {
      hour12 = 12;
      period = "AM";
    } else if (hour24 < 12) {
      hour12 = hour24;
      period = "AM";
    } else if (hour24 === 12) {
      hour12 = 12;
      period = "PM";
    } else {
      hour12 = hour24 - 12;
      period = "PM";
    }
    
    return `${hour12}:${minute} ${period}`;
  };

  const updateFilter = (key: string, value: string | undefined) => {
    const params = new URLSearchParams(searchParams.toString());
    
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    
    // Reset to first page when filters change
    params.delete('page');
    
    router.push(`/${businessUnitId}/approvals/overtime/pending?${params.toString()}`);
  };

  const filteredRequests = useMemo(() => {
    let filtered = requests;

    // Apply search term filter
    if (searchTerm) {
      filtered = filtered.filter(request => 
        request.reason.toLowerCase().includes(searchTerm.toLowerCase()) ||
        request.user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        request.user.employeeId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        formatRequestStatus(request.status).toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    return filtered;
  }, [requests, searchTerm]);

  const goToPage = (page: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', page.toString());
    router.push(`/${businessUnitId}/approvals/overtime/pending?${params.toString()}`);
  };

  return (
    <div className="flex-1 space-y-6 px-2 sm:px-0">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">Pending Overtime Approvals</h1>
          <p className="text-sm text-muted-foreground">
            Review and approve overtime requests from your team
          </p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search by employee, reason, or status..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        {/* Status Filter */}
        <Select
          value={currentFilters.status || ""}
          onValueChange={(value) => updateFilter('status', value || undefined)}
        >
          <SelectTrigger className="w-[180px]">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <SelectValue placeholder="All statuses" />
            </div>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all-status">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <span>All statuses</span>
              </div>
            </SelectItem>
            {statusOptions.map((option) => {
              const Icon = option.icon;
              return (
                <SelectItem key={option.value} value={option.value}>
                  <div className="flex items-center gap-2">
                    <Icon className="h-4 w-4 text-muted-foreground" />
                    <span>{option.label}</span>
                  </div>
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>
      </div>

      {/* Results count */}
      <div className="text-sm text-muted-foreground">
        Showing {filteredRequests.length} of {requests.length} pending requests
      </div>

      {/* Desktop Table */}
      <div className="rounded-md border hidden sm:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Employee</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Date & Time</TableHead>
              <TableHead>Hours</TableHead>
              <TableHead>Submitted</TableHead>
              <TableHead>Reason</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredRequests.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8">
                  <div className="flex flex-col items-center gap-2">
                    <Calendar className="h-8 w-8 text-muted-foreground" />
                    <p className="text-muted-foreground">No pending overtime requests found</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredRequests.map((request) => {
                return (
                  <TableRow key={request.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <div className="font-medium">{request.user.name}</div>
                          <div className="text-sm text-muted-foreground">{request.user.employeeId}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusVariant(request.status)}>
                        {formatRequestStatus(request.status)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="font-medium">{format(new Date(request.startTime), 'MMM dd, yyyy')}</div>
                        <div className="text-sm text-muted-foreground">
                          {extractTimeFromDateTime(request.startTime)} - {extractTimeFromDateTime(request.endTime)}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">
                      {request.hours} hours
                    </TableCell>
                    <TableCell>{format(new Date(request.createdAt), "MMM dd, yyyy")}</TableCell>
                    <TableCell>
                      <div className="max-w-[200px] truncate" title={request.reason}>
                        {request.reason}
                      </div>
                    </TableCell>
                    <TableCell>
                      <OvertimeApprovalActions 
                        request={request} 
                        businessUnitId={businessUnitId}
                        currentUserRole={currentUserRole}
                      />
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Mobile Cards */}
      <div className="sm:hidden space-y-4">
        {filteredRequests.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-8">
              <Calendar className="h-8 w-8 text-muted-foreground mb-2" />
              <p className="text-muted-foreground">No pending overtime requests found</p>
            </CardContent>
          </Card>
        ) : (
          filteredRequests.map((request) => {
            return (
              <Card key={request.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <CardTitle className="text-base">{request.user.name}</CardTitle>
                      </div>
                      <p className="text-sm text-muted-foreground">{request.user.employeeId}</p>
                    </div>
                    <Badge variant={getStatusVariant(request.status)}>
                      {formatRequestStatus(request.status)}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-muted-foreground">Date:</span>
                      <p className="font-medium">{format(new Date(request.startTime), 'MMM dd, yyyy')}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Time:</span>
                      <p className="font-medium">
                        {extractTimeFromDateTime(request.startTime)} - {extractTimeFromDateTime(request.endTime)}
                      </p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Hours:</span>
                      <p className="font-medium">{request.hours} hours</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Submitted:</span>
                      <p className="font-medium">{format(new Date(request.createdAt), "MMM dd, yyyy")}</p>
                    </div>
                  </div>

                  <div>
                    <span className="text-muted-foreground text-sm">Reason:</span>
                    <p className="text-sm mt-1">{request.reason}</p>
                  </div>

                  {(request.managerComments || request.hrComments) && (
                    <div className="bg-muted/50 border rounded-md p-3">
                      {request.managerComments && (
                        <div className="text-xs">
                          <span className="font-medium">Manager:</span> {request.managerComments}
                        </div>
                      )}
                      {request.hrComments && (
                        <div className="text-xs">
                          <span className="font-medium">HR:</span> {request.hrComments}
                        </div>
                      )}
                    </div>
                  )}

                  <div className="pt-2">
                    <OvertimeApprovalActions 
                      request={request} 
                      businessUnitId={businessUnitId}
                      currentUserRole={currentUserRole}
                      isMobile={true}
                    />
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Pagination */}
      {approvalsData.pagination.totalPages > 1 && (
        <div className="flex items-center justify-between pt-4">
          <div className="text-sm text-muted-foreground">
            Showing {((approvalsData.pagination.currentPage - 1) * 10) + 1} to{' '}
            {Math.min(approvalsData.pagination.currentPage * 10, approvalsData.pagination.totalCount)} of{' '}
            {approvalsData.pagination.totalCount} requests
          </div>
          
          <div className="flex gap-2">
            {approvalsData.pagination.hasPrev && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => goToPage(approvalsData.pagination.currentPage - 1)}
              >
                Previous
              </Button>
            )}
            
            {approvalsData.pagination.hasNext && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => goToPage(approvalsData.pagination.currentPage + 1)}
              >
                Next
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
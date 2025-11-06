"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Search, Save, Users } from "lucide-react"
import { toast } from "sonner"
import { getDepartmentApprovers, createDepartmentApprover } from "@/lib/actions/mrs-actions/department-approver-actions"
import { getUsers } from "@/lib/actions/mrs-actions/user-actions"
import { ApproverType, UserRole } from "@prisma/client"
import { cn } from "@/lib/utils"

interface User {
  id: string
  name: string
  email: string | null
  employeeId: string
  role: UserRole
}

interface DepartmentApprover {
  id: string
  departmentId: string
  employeeId: string
  approverType: ApproverType
  isActive: boolean
  employee: User
}

interface DepartmentApproversDialogProps {
  departmentId: string
  departmentName: string
  onSuccess: () => void
  onCancel: () => void
}

export function DepartmentApproversDialog({ 
  departmentId, 
  onSuccess,
  onCancel
}: DepartmentApproversDialogProps) {
  const [users, setUsers] = useState<User[]>([])
  const [approvers, setApprovers] = useState<DepartmentApprover[]>([])
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set())
  const [approverType, setApproverType] = useState<ApproverType>("RECOMMENDING")
  const [searchTerm, setSearchTerm] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  const loadData = async () => {
    setIsLoading(true)
    try {
      const [usersData, approversData] = await Promise.all([
        getUsers(),
        getDepartmentApprovers(departmentId)
      ])
      setUsers(usersData)
      setApprovers(approversData)
    } catch (error) {
      console.error("Error loading data:", error)
      toast.error("Failed to load data")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [departmentId])

  // Get currently assigned approver user IDs
  const assignedUserIds = new Set(approvers.map(a => a.employeeId))

  // Filter users based on search term
  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.employeeId.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.role.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleUserSelect = (userId: string, checked: boolean) => {
    const newSelected = new Set(selectedUsers)
    if (checked) {
      newSelected.add(userId)
    } else {
      newSelected.delete(userId)
    }
    setSelectedUsers(newSelected)
  }

  const handleRowClick = (userId: string) => {
    // Don't toggle if user is already an approver
    if (assignedUserIds.has(userId)) return
    
    const isSelected = selectedUsers.has(userId)
    handleUserSelect(userId, !isSelected)
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      // Select all non-assigned users
      const availableUserIds = filteredUsers
        .filter(user => !assignedUserIds.has(user.id))
        .map(user => user.id)
      setSelectedUsers(new Set(availableUserIds))
    } else {
      setSelectedUsers(new Set())
    }
  }

  const handleSaveApprovers = async () => {
    if (selectedUsers.size === 0) {
      toast.error("Please select at least one user")
      return
    }

    setIsSaving(true)
    try {
      const promises = Array.from(selectedUsers).map(userId =>
        createDepartmentApprover({
          departmentId,
          employeeId: userId,
          approverType
        })
      )

      const results = await Promise.all(promises)
      const failedResults = results.filter(r => !r.success)
      
      if (failedResults.length > 0) {
        toast.error(`Failed to assign ${failedResults.length} approver(s)`)
      } else {
        toast.success(`Successfully assigned ${selectedUsers.size} ${approverType.toLowerCase()} approver(s)`)
        setSelectedUsers(new Set())
        onSuccess()
      }
    } catch (error) {
      console.error("Error saving approvers:", error)
      toast.error("Failed to save approvers")
    } finally {
      setIsSaving(false)
    }
  }

  const availableUsers = filteredUsers.filter(user => !assignedUserIds.has(user.id))
  const allAvailableSelected = availableUsers.length > 0 && availableUsers.every(user => selectedUsers.has(user.id))
  const someAvailableSelected = availableUsers.some(user => selectedUsers.has(user.id))

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-muted-foreground">Loading employees...</div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Current Approvers Summary - Compact */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-3 bg-muted/30 rounded-md">
        <div className="space-y-1">
          <Badge variant="secondary" className="text-xs">
            Recommending ({approvers.filter(a => a.approverType === "RECOMMENDING").length})
          </Badge>
          <div className="text-xs space-y-0.5 max-h-16 overflow-y-auto">
            {approvers.filter(a => a.approverType === "RECOMMENDING").map((approver) => (
              <div key={approver.id} className="flex items-center gap-1 truncate">
                <span className="font-medium truncate">{approver.employee.name}</span>
                <span className="text-muted-foreground">({approver.employee.employeeId})</span>
              </div>
            ))}
            {approvers.filter(a => a.approverType === "RECOMMENDING").length === 0 && (
              <span className="text-muted-foreground">None assigned</span>
            )}
          </div>
        </div>

        <div className="space-y-1">
          <Badge variant="default" className="text-xs">
            Final ({approvers.filter(a => a.approverType === "FINAL").length})
          </Badge>
          <div className="text-xs space-y-0.5 max-h-16 overflow-y-auto">
            {approvers.filter(a => a.approverType === "FINAL").map((approver) => (
              <div key={approver.id} className="flex items-center gap-1 truncate">
                <span className="font-medium truncate">{approver.employee.name}</span>
                <span className="text-muted-foreground">({approver.employee.employeeId})</span>
              </div>
            ))}
            {approvers.filter(a => a.approverType === "FINAL").length === 0 && (
              <span className="text-muted-foreground">None assigned</span>
            )}
          </div>
        </div>
      </div>

      {/* Add New Approvers Section - Compact */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center justify-between">
          <h3 className="text-base font-medium">Add New Approvers</h3>
          <div className="flex gap-2">
            <Select value={approverType} onValueChange={(value: ApproverType) => setApproverType(value)}>
              <SelectTrigger className="w-40 h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="RECOMMENDING">Recommending</SelectItem>
                <SelectItem value="FINAL">Final</SelectItem>
              </SelectContent>
            </Select>
            <Button
              onClick={handleSaveApprovers}
              disabled={selectedUsers.size === 0 || isSaving}
              size="sm"
              className="gap-1"
            >
              <Save className="h-3 w-3" />
              {isSaving ? "Saving..." : `Add ${selectedUsers.size}`}
            </Button>
          </div>
        </div>

        {/* Search - Compact */}
        <div className="relative">
          <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-muted-foreground h-3 w-3" />
          <Input
            placeholder="Search employees..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-7 h-8 text-sm"
          />
        </div>

        {/* Users Table - Compact */}
        <div className="border rounded-md max-h-80 overflow-y-auto">
          <Table>
            <TableHeader className="sticky top-0 bg-background">
              <TableRow className="h-8">
                <TableHead className="w-8 p-2">
                  <Checkbox
                    checked={allAvailableSelected}
                    onCheckedChange={handleSelectAll}
                    className={cn(
                      "h-3 w-3",
                      someAvailableSelected && !allAvailableSelected && "data-[state=checked]:bg-primary/50"
                    )}
                  />
                </TableHead>
                <TableHead className="p-2 text-xs">Employee</TableHead>
                <TableHead className="p-2 text-xs">Role</TableHead>
                <TableHead className="p-2 text-xs">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.length > 0 ? (
                filteredUsers.map((user) => {
                  const isAssigned = assignedUserIds.has(user.id)
                  const isSelected = selectedUsers.has(user.id)
                  
                  return (
                    <TableRow
                      key={user.id}
                      className={cn(
                        "cursor-pointer transition-colors h-10",
                        isAssigned && "opacity-50 cursor-not-allowed",
                        isSelected && !isAssigned && "bg-muted/50",
                        !isAssigned && "hover:bg-muted/30"
                      )}
                      onClick={() => handleRowClick(user.id)}
                    >
                      <TableCell className="p-2">
                        <Checkbox
                          checked={isSelected}
                          disabled={isAssigned}
                          onCheckedChange={(checked) => handleUserSelect(user.id, checked as boolean)}
                          onClick={(e) => e.stopPropagation()}
                          className="h-3 w-3"
                        />
                      </TableCell>
                      <TableCell className="p-2">
                        <div>
                          <div className="font-medium text-sm truncate">{user.name}</div>
                          {user.employeeId && (
                            <div className="text-xs text-muted-foreground truncate">{user.employeeId}</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="p-2">
                        <Badge variant="outline" className="text-xs px-1 py-0">{user.role}</Badge>
                      </TableCell>
                      <TableCell className="p-2">
                        {isAssigned ? (
                          <Badge variant="secondary" className="text-xs px-1 py-0">Assigned</Badge>
                        ) : isSelected ? (
                          <Badge variant="default" className="text-xs px-1 py-0">Selected</Badge>
                        ) : (
                          <Badge variant="outline" className="text-xs px-1 py-0">Available</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  )
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-6">
                    <Users className="h-6 w-6 text-muted-foreground mx-auto mb-1" />
                    <p className="text-sm text-muted-foreground">
                      {searchTerm ? "No employees found" : "No employees available"}
                    </p>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {selectedUsers.size > 0 && (
          <div className="flex items-center justify-between p-2 bg-muted/50 rounded-md">
            <span className="text-xs font-medium">
              {selectedUsers.size} selected as {approverType.toLowerCase()} approver(s)
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedUsers(new Set())}
              className="h-6 text-xs px-2"
            >
              Clear
            </Button>
          </div>
        )}
      </div>

      {/* Dialog Actions - Compact */}
      <div className="flex justify-end pt-2 border-t">
        <Button variant="outline" onClick={onCancel} size="sm">
          Close
        </Button>
      </div>
    </div>
  )
}
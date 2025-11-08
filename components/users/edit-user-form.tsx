"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon } from "lucide-react";
import { format as formatDate } from "date-fns";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { 
  updateUser, 
  resetUserPassword, 
  updateUserBusinessUnit,
  UserWithDetails 
} from "@/lib/actions/user-management-actions";
import { UserRole } from "@prisma/client";
import { Shield, User, UserCheck, Key, Building } from "lucide-react";

interface EditUserFormProps {
  user: UserWithDetails;
  businessUnitId: string;
  managers: {
    id: string;
    name: string;
    employeeId: string;
    businessUnit?: string;
  }[];
  businessUnits: {
    id: string;
    name: string;
  }[];
  departments: {
    id: string;
    name: string;
  }[];
  roles: {
    id: string;
    name: string;
    code: string;
    isActive: boolean;
  }[];
  isAdmin: boolean;
  pageType?: "admin" | "employees";
}

export function EditUserForm({ 
  user, 
  businessUnitId, 
  managers, 
  businessUnits,
  departments,
  roles,
  isAdmin,
  pageType = "admin"
}: EditUserFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [businessUnitDialogOpen, setBusinessUnitDialogOpen] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [selectedBusinessUnit, setSelectedBusinessUnit] = useState(user.businessUnit?.id || "");
  
  const [formData, setFormData] = useState({
    name: user.name,
    email: user.email || "",
    employeeId: user.employeeId,
    role: user.role,
    roleId: user.roleId || (roles.length > 0 ? roles[0].id : ""),
    departmentId: user.department?.id || (departments.length > 0 ? departments[0].id : ""),
    approverId: user.approver?.id || (managers.length > 0 ? managers[0].id : ""),
    isActive: user.isActive ?? true,
    terminateDate: user.terminateDate || null,
  });

  // Debug: Log initial values (remove in production)
  useEffect(() => {
    console.log("User role:", user.role, "Form role:", formData.role);
    console.log("User approver:", user.approver?.id, "Form approver:", formData.approverId);
    console.log("User roleId:", user.roleId, "Form roleId:", formData.roleId);
    console.log("Available managers:", managers.length);
  }, [user, formData, managers]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.employeeId || !formData.role) {
      toast.error("Please fill in all required fields");
      return;
    }

    if (!formData.departmentId) {
      toast.error("Department is required");
      return;
    }

    if (!formData.roleId) {
      toast.error("System Permissions is required");
      return;
    }

    if (!formData.approverId) {
      toast.error("Manager/Approver is required");
      return;
    }

    setIsLoading(true);
    
    try {
      const result = await updateUser(user.id, {
        name: formData.name,
        email: formData.email,
        employeeId: formData.employeeId,
        role: formData.role as UserRole,
        roleId: formData.roleId,
        departmentId: formData.departmentId,
        approverId: formData.approverId,
        isActive: formData.isActive,
        terminateDate: formData.terminateDate,
      });

      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success(result.success || "User updated successfully");
        router.refresh();
      }
    } catch (error) {
      toast.error("Failed to update user");
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordReset = async () => {
    if (!newPassword.trim()) {
      toast.error("Please enter a new password");
      return;
    }

    if (newPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    setIsLoading(true);
    
    try {
      const result = await resetUserPassword(user.id, newPassword);

      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success(result.success || "Password reset successfully");
        setPasswordDialogOpen(false);
        setNewPassword("");
      }
    } catch (error) {
      toast.error("Failed to reset password");
    } finally {
      setIsLoading(false);
    }
  };

  const handleBusinessUnitUpdate = async () => {
    if (!selectedBusinessUnit) {
      toast.error("Please select a business unit");
      return;
    }

    if (selectedBusinessUnit === user.businessUnit?.id) {
      toast.error("User is already in this business unit");
      return;
    }

    setIsLoading(true);
    
    try {
      const result = await updateUserBusinessUnit(user.id, selectedBusinessUnit);

      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success(result.success || "Business unit updated successfully");
        setBusinessUnitDialogOpen(false);
        router.refresh();
      }
    } catch (error) {
      toast.error("Failed to update business unit");
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string | boolean | Date | null) => {
    setFormData(prev => ({
      ...prev,
      [field]: field === "isActive" ? value === "true" || value === true : value
    }));
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return Shield;
      case 'HR':
        return UserCheck;
      case 'MANAGER':
        return User;
      default:
        return User;
    }
  };

  const RoleIcon = getRoleIcon(user.role);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-3">
            <RoleIcon className="h-6 w-6 text-muted-foreground" />
            <div>
              <h1 className="text-xl font-semibold">{user.name}</h1>
              <p className="text-sm text-muted-foreground">{user.employeeId} • {user.role}</p>
            </div>
          </div>
        </div>
        <div className="text-right text-sm">
          <div className="font-medium">{user.businessUnit?.name || "—"}</div>
          <div className="text-muted-foreground">{user.department?.name || "No Department"}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Form */}
        <div className="lg:col-span-2 space-y-6">

          {/* Edit Form */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b">
              <User className="h-4 w-4 text-muted-foreground" />
              <h2 className="font-medium">User Information</h2>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Basic Information - 2 Column Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-sm font-medium">
                    Full Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleInputChange("name", e.target.value)}
                    className="h-9"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="employeeId" className="text-sm font-medium">
                    Employee ID <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="employeeId"
                    value={formData.employeeId}
                    onChange={(e) => handleInputChange("employeeId", e.target.value)}
                    className="h-9"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  className="h-9"
                />
              </div>

              {/* Active Status and Terminate Date */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="isActive" className="text-sm font-medium">Account Status</Label>
                  <div className="flex items-center space-x-2 h-9">
                    <Switch
                      id="isActive"
                      checked={formData.isActive}
                      onCheckedChange={(checked) => handleInputChange("isActive", checked.toString())}
                    />
                    <span className="text-sm text-muted-foreground">
                      {formData.isActive ? "Active" : "Inactive"}
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="terminateDate" className="text-sm font-medium">Terminate Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        id="terminateDate"
                        variant="outline"
                        className={cn(
                          "w-full h-9 justify-start text-left font-normal",
                          !formData.terminateDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {formData.terminateDate ? (
                          formatDate(new Date(formData.terminateDate), "PPP")
                        ) : (
                          <span>Pick a date</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={formData.terminateDate ? new Date(formData.terminateDate) : undefined}
                        onSelect={(date) => handleInputChange("terminateDate", date ? date.toISOString() : "")}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              {/* Department */}
              <div className="space-y-2">
                <Label htmlFor="department" className="text-sm font-medium">Department <span className="text-red-500">*</span></Label>
                <Select
                  value={formData.departmentId}
                  onValueChange={(value) => handleInputChange("departmentId", value)}
                >
                  <SelectTrigger className="h-9 w-full">
                    <SelectValue placeholder="Select department" />
                  </SelectTrigger>
                  <SelectContent>
                    {departments.map((dept) => (
                      <SelectItem key={dept.id} value={dept.id}>
                        {dept.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* System Role and System Permissions - 2 Column Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="role" className="text-sm font-medium">
                    System Role <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={formData.role}
                    onValueChange={(value) => handleInputChange("role", value)}
                  >
                    <SelectTrigger className="h-9 w-full">
                      <SelectValue placeholder="Select system role" />
                    </SelectTrigger>
                    <SelectContent>
                  <SelectItem value="USER">User</SelectItem>
                  <SelectItem value="MANAGER">Approver</SelectItem>
                  <SelectItem value="HR">PMD</SelectItem>
                  <SelectItem value="PURCHASER">Purchaser</SelectItem>
                  <SelectItem value="MRS_COORDINATOR">MRS Coordinator</SelectItem>
                  <SelectItem value="ADMIN">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="systemPermissions" className="text-sm font-medium">
                    System Permissions <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={formData.roleId}
                    onValueChange={(value) => handleInputChange("roleId", value)}
                  >
                    <SelectTrigger className="h-9 w-full">
                      <SelectValue placeholder="Select system permissions (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      {roles.filter(role => role.isActive).map((role) => (
                        <SelectItem key={role.id} value={role.id}>
                          {role.name} ({role.code})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Manager */}
              <div className="space-y-2">
                <Label htmlFor="manager" className="text-sm font-medium">Manager/Approver <span className="text-red-500">*</span></Label>
                <Select
                  value={formData.approverId}
                  onValueChange={(value) => handleInputChange("approverId", value)}
                >
                  <SelectTrigger className="h-9 w-full">
                    <SelectValue placeholder="Select manager" />
                  </SelectTrigger>
                  <SelectContent>
                    {managers.map((manager) => (
                      <SelectItem key={manager.id} value={manager.id}>
                        {manager.name} ({manager.employeeId})
                        {manager.businessUnit && (
                          <span className="text-muted-foreground ml-2">
                            - {manager.businessUnit}
                          </span>
                        )}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push(`/${businessUnitId}/${pageType === "employees" ? "employees" : "admin/users"}`)}
                  disabled={isLoading}
                  className="h-9"
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isLoading} className="h-9">
                  {isLoading ? "Updating..." : "Update User"}
                </Button>
              </div>
            </form>
          </div>
        </div>

        {/* Right Column - Actions & Info */}
        <div className="space-y-6">
          {/* Quick Stats */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 pb-2 border-b">
              <Shield className="h-4 w-4 text-muted-foreground" />
              <h2 className="font-medium">Quick Info</h2>
            </div>
            
            <div className="space-y-3 p-3 bg-muted/20 rounded-md">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Account Status:</span>
                <span className={cn(
                  "font-medium",
                  user.isActive ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
                )}>
                  {user.isActive ? "Active" : "Inactive"}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Last Login:</span>
                <span className="font-medium text-right">
                  {user.lastLoginAt ? formatDate(new Date(user.lastLoginAt), "MMM dd, yyyy HH:mm") : "Never"}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Direct Reports:</span>
                <span className="font-medium">{user.directReportsCount || "0"}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Business Unit:</span>
                <span className="font-medium text-right">{user.businessUnit?.name || "—"}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Department:</span>
                <span className="font-medium text-right">{user.department?.name || "—"}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">System Permissions:</span>
                <span className="font-medium text-right">
                  {roles.find(r => r.id === user.roleId)?.name || "None"}
                </span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 pb-2 border-b">
              <Key className="h-4 w-4 text-muted-foreground" />
              <h2 className="font-medium">Actions</h2>
            </div>

            <div className="space-y-2">
              {/* Reset Password */}
              <Dialog open={passwordDialogOpen} onOpenChange={setPasswordDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="w-full justify-start h-9">
                    <Key className="h-4 w-4 mr-2" />
                    Reset Password
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Reset Password</DialogTitle>
                    <DialogDescription>
                      Enter a new password for {user.name}. The user will need to use this password to log in.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="newPassword" className="mb-1">New Password</Label>
                      <Input
                        id="newPassword"
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Enter new password (min 6 characters)"
                        minLength={6}
                        className="w-full"
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setPasswordDialogOpen(false);
                        setNewPassword("");
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handlePasswordReset}
                      disabled={isLoading || !newPassword.trim()}
                    >
                      {isLoading ? "Resetting..." : "Reset Password"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              {/* Change Business Unit (Admin only) */}
              {isAdmin && (
                <Dialog open={businessUnitDialogOpen} onOpenChange={setBusinessUnitDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm" className="w-full justify-start h-9">
                      <Building className="h-4 w-4 mr-2" />
                      Change Business Unit
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Change Business Unit</DialogTitle>
                      <DialogDescription>
                        Select a new business unit for {user.name}. This will affect their access and reporting structure.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="businessUnit" className="mb-1">Business Unit</Label>
                        <Select
                          value={selectedBusinessUnit}
                          onValueChange={setSelectedBusinessUnit}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select business unit" />
                          </SelectTrigger>
                          <SelectContent>
                            {businessUnits.map((unit) => (
                              <SelectItem key={unit.id} value={unit.id}>
                                {unit.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setBusinessUnitDialogOpen(false);
                          setSelectedBusinessUnit(user.businessUnit?.id || "");
                        }}
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={handleBusinessUnitUpdate}
                        disabled={isLoading || !selectedBusinessUnit}
                      >
                        {isLoading ? "Updating..." : "Update Business Unit"}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
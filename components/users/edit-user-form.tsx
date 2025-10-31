"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  isAdmin: boolean;
  pageType?: "admin" | "employees";
}

export function EditUserForm({ 
  user, 
  businessUnitId, 
  managers, 
  businessUnits,
  departments,
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
    departmentId: user.department?.id || "no-department",
    approverId: user.approver?.id || "no-manager",
  });

  // Debug: Log initial values (remove in production)
  useEffect(() => {
    console.log("User role:", user.role, "Form role:", formData.role);
    console.log("User approver:", user.approver?.id, "Form approver:", formData.approverId);
  }, [user, formData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.employeeId || !formData.role) {
      toast.error("Please fill in all required fields");
      return;
    }

    setIsLoading(true);
    
    try {
      const result = await updateUser(user.id, {
        name: formData.name,
        email: formData.email,
        employeeId: formData.employeeId,
        role: formData.role as UserRole,
        departmentId: formData.departmentId === "no-department" ? undefined : formData.departmentId,
        approverId: formData.approverId === "no-manager" ? undefined : formData.approverId,
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

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
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
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Left Column - User Info & Form */}
      <div className="lg:col-span-2 space-y-6">
        {/* User Overview - Compact */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <RoleIcon className="h-8 w-8 text-muted-foreground" />
              <div className="flex-1">
                <h2 className="text-xl font-semibold">{user.name}</h2>
                <p className="text-sm text-muted-foreground">{user.employeeId} • {user.role}</p>
              </div>
              <div className="text-right text-sm">
                <div className="font-medium">{user.businessUnit?.name || "—"}</div>
                <div className="text-muted-foreground">{user.department?.name || "No Department"}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Edit Form - Compact Layout */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-lg">Edit User Information</CardTitle>
          </CardHeader>
          <CardContent>
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

              {/* Department */}
              <div className="space-y-2">
                <Label htmlFor="department" className="text-sm font-medium">Department</Label>
                <Select
                  value={formData.departmentId}
                  onValueChange={(value) => handleInputChange("departmentId", value)}
                >
                  <SelectTrigger className="h-9 w-full">
                    <SelectValue placeholder="Select department" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="no-department">No department</SelectItem>
                    {departments.map((dept) => (
                      <SelectItem key={dept.id} value={dept.id}>
                        {dept.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Role and Manager - 2 Column Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="role" className="text-sm font-medium">
                    Role <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={formData.role}
                    defaultValue={user.role}
                    onValueChange={(value) => handleInputChange("role", value)}
                  >
                    <SelectTrigger className="h-9 w-full">
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USER">User</SelectItem>
                      <SelectItem value="MANAGER">Manager</SelectItem>
                      <SelectItem value="HR">HR</SelectItem>
                      <SelectItem value="ADMIN">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="manager" className="text-sm font-medium">Manager/Approver</Label>
                  <Select
                    value={formData.approverId}
                    defaultValue={user.approver?.id || "no-manager"}
                    onValueChange={(value) => handleInputChange("approverId", value)}
                  >
                    <SelectTrigger className="h-9 w-full">
                      <SelectValue placeholder="Select manager" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="no-manager">No manager</SelectItem>
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
          </CardContent>
        </Card>
      </div>

      {/* Right Column - Actions & Info */}
      <div className="space-y-6">
        {/* Quick Stats */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Quick Info</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
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
          </CardContent>
        </Card>

        {/* Actions */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
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
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
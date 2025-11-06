"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { toast } from "sonner"
import { createDepartmentApprover, updateDepartmentApprover } from "@/lib/actions/mrs-actions/department-approver-actions"
import { getDepartments, getUsers } from "@/lib/actions/mrs-actions/user-actions"
import { DepartmentApprover } from "@/types/department-approver-types"

const formSchema = z.object({
  departmentId: z.string().min(1, "Department is required"),
  employeeId: z.string().min(1, "Employee is required"),
  approverType: z.enum(["RECOMMENDING", "FINAL"]),
  isActive: z.boolean(),
})

type FormData = z.infer<typeof formSchema>

interface Department {
  id: string
  name: string
  code: string | null
  businessUnitId: string | null
}

interface User {
  id: string
  name: string
  email: string | null
  employeeId: string
  role: string
}

interface DepartmentApproverFormProps {
  businessUnitId: string
  approver?: DepartmentApprover
  onSuccess: () => void
  onCancel: () => void
}

export function DepartmentApproverForm({
  businessUnitId,
  approver,
  onSuccess,
  onCancel,
}: DepartmentApproverFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [departments, setDepartments] = useState<Department[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [loadingData, setLoadingData] = useState(true)

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      departmentId: approver?.departmentId || "",
      employeeId: approver?.employeeId || "",
      approverType: approver?.approverType || "RECOMMENDING",
      isActive: approver?.isActive ?? true,
    },
  })

  useEffect(() => {
    const loadData = async () => {
      setLoadingData(true)
      try {
        const [departmentsData, usersData] = await Promise.all([
          getDepartments(),
          getUsers(),
        ])
        
        // Filter departments by business unit
        const filteredDepartments = departmentsData.filter(
          dept => dept.businessUnitId === businessUnitId
        )
        
        setDepartments(filteredDepartments)
        setUsers(usersData)
      } catch (error) {
        console.error("Error loading data:", error)
        toast.error("Failed to load form data")
      } finally {
        setLoadingData(false)
      }
    }

    loadData()
  }, [businessUnitId])

  const onSubmit = async (data: FormData) => {
    setIsLoading(true)
    try {
      let result
      
      if (approver) {
        // Update existing approver
        result = await updateDepartmentApprover({
          id: approver.id,
          ...data,
        })
      } else {
        // Create new approver
        result = await createDepartmentApprover(data)
      }

      if (result.success) {
        toast.success(result.message)
        onSuccess()
      } else {
        toast.error(result.message)
      }
    } catch (error) {
      console.error("Error submitting form:", error)
      toast.error("Failed to save department approver")
    } finally {
      setIsLoading(false)
    }
  }

  if (loadingData) {
    return (
      <div className="flex items-center justify-center p-6">
        <div className="text-muted-foreground">Loading form data...</div>
      </div>
    )
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="departmentId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Department *</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select department" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {departments.map((dept) => (
                      <SelectItem key={dept.id} value={dept.id}>
                        {dept.name} {dept.code && `(${dept.code})`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="employeeId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Employee *</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select employee" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {users.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.name} ({user.employeeId}) - {user.role}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="approverType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Approver Type *</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select approver type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="RECOMMENDING">Recommending Approver</SelectItem>
                    <SelectItem value="FINAL">Final Approver</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {approver && (
            <FormField
              control={form.control}
              name="isActive"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Active Status</FormLabel>
                    <div className="text-sm text-muted-foreground">
                      Enable or disable this approver
                    </div>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          )}
        </div>

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Saving..." : approver ? "Update Approver" : "Create Approver"}
          </Button>
        </div>
      </form>
    </Form>
  )
}
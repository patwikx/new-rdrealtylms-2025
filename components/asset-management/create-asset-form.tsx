"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { useRouter } from "next/navigation"
import { CalendarIcon, Calculator, Package, DollarSign, Settings } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"

import { toast } from "sonner"
import { AccountType } from "@prisma/client"
import { 
  createAsset, 
  getAssetCategories, 
  getDepartments, 
  getGLAccounts, 
  generateItemCode,
  CreateAssetData 
} from "@/lib/actions/create-asset-actions"


interface CreateAssetFormProps {
  businessUnitId: string
}

interface AssetCategory {
  id: string
  name: string
  code: string
  defaultAssetAccountId: string | null
  defaultDepreciationExpenseAccountId: string | null
  defaultAccumulatedDepAccountId: string | null
  defaultAssetAccount: { id: string; accountCode: string; accountName: string } | null
  defaultDepExpAccount: { id: string; accountCode: string; accountName: string } | null
  defaultAccDepAccount: { id: string; accountCode: string; accountName: string } | null
}

interface Department {
  id: string
  name: string
  code: string | null
}

interface GLAccount {
  id: string
  accountCode: string
  accountName: string
  accountType: AccountType
}

export function CreateAssetForm({ businessUnitId }: CreateAssetFormProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [categories, setCategories] = useState<AssetCategory[]>([])
  const [departments, setDepartments] = useState<Department[]>([])
  const [glAccounts, setGLAccounts] = useState<GLAccount[]>([])
  const [selectedCategory, setSelectedCategory] = useState<AssetCategory | null>(null)
  const [autoGenerateCode, setAutoGenerateCode] = useState(true)


  const form = useForm<CreateAssetData>({
    defaultValues: {
      itemCode: "",
      description: "",
      serialNumber: "",
      modelNumber: "",
      brand: "",
      categoryId: "",
      departmentId: "",
      quantity: 1,
      location: "",
      notes: "",
      purchasePrice: undefined,
      salvageValue: 0,
      usefulLifeYears: undefined,
      usefulLifeMonths: 0,
      depreciationMethod: "STRAIGHT_LINE",
      status: "AVAILABLE",
      isActive: true
    }
  })

  const watchedCategoryId = form.watch("categoryId")
  const watchedDepreciationMethod = form.watch("depreciationMethod")
  const watchedPurchasePrice = form.watch("purchasePrice")
  const watchedUsefulLifeYears = form.watch("usefulLifeYears")
  const watchedSalvageValue = form.watch("salvageValue")

  // Load initial data
  useEffect(() => {
    const loadData = async () => {
      try {
        const [categoriesData, departmentsData, accountsData] = await Promise.all([
          getAssetCategories(businessUnitId),
          getDepartments(businessUnitId),
          getGLAccounts()
        ])
        
        setCategories(categoriesData)
        setDepartments(departmentsData)
        setGLAccounts(accountsData)
      } catch (error) {
        console.error("Error loading data:", error)
        toast.error("Failed to load form data")
      }
    }
    
    loadData()
  }, [businessUnitId])

  // Handle category selection
  useEffect(() => {
    if (watchedCategoryId) {
      const category = categories.find(c => c.id === watchedCategoryId)
      setSelectedCategory(category || null)
      
      if (category) {
        // Auto-populate GL accounts from category defaults
        if (category.defaultAssetAccountId) {
          form.setValue("assetAccountId", category.defaultAssetAccountId)
        }
        if (category.defaultDepreciationExpenseAccountId) {
          form.setValue("depreciationExpenseAccountId", category.defaultDepreciationExpenseAccountId)
        }
        if (category.defaultAccumulatedDepAccountId) {
          form.setValue("accumulatedDepAccountId", category.defaultAccumulatedDepAccountId)
        }
        
        // Generate item code if auto-generate is enabled
        if (autoGenerateCode) {
          generateItemCode(category.id).then(code => {
            form.setValue("itemCode", code)
          }).catch(error => {
            console.error("Error generating item code:", error)
          })
        }
      }
    }
  }, [watchedCategoryId, categories, form, autoGenerateCode])

  // Calculate estimated monthly depreciation
  const calculateMonthlyDepreciation = () => {
    if (!watchedPurchasePrice || !watchedUsefulLifeYears || !watchedDepreciationMethod) {
      return 0
    }
    
    const purchasePrice = watchedPurchasePrice
    const salvageValue = watchedSalvageValue || 0
    const depreciableAmount = purchasePrice - salvageValue
    const totalMonths = watchedUsefulLifeYears * 12
    
    switch (watchedDepreciationMethod) {
      case 'STRAIGHT_LINE':
        return totalMonths > 0 ? depreciableAmount / totalMonths : 0
      case 'DECLINING_BALANCE':
        // Assuming 200% declining balance (double declining)
        const rate = (2 / watchedUsefulLifeYears) * 100
        return (purchasePrice * rate / 100) / 12
      default:
        return 0
    }
  }

  const onSubmit = async (data: CreateAssetData) => {
    setIsLoading(true)
    try {
      const result = await createAsset(data, businessUnitId)
      
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success(result.success)
        
        // Redirect to the asset details page where QR code will be automatically displayed
        if (result.data?.id) {
          router.push(`/${businessUnitId}/asset-management/assets/${result.data.id}`)
        } else {
          // Fallback to assets list
          router.push(`/${businessUnitId}/asset-management/assets`)
        }
      }
    } catch (error) {
      toast.error("Failed to create asset")
    } finally {
      setIsLoading(false)
    }
  }



  const assetAccounts = glAccounts.filter(acc => acc.accountType === 'ASSET')
  const expenseAccounts = glAccounts.filter(acc => acc.accountType === 'EXPENSE')

  return (
    <div className="w-full max-w-none px-2 sm:px-4">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="space-y-1">
              <h1 className="text-2xl font-semibold tracking-tight">Create New Asset</h1>
              <p className="text-sm text-muted-foreground">
                Add a new asset to the system with complete configuration
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Creating..." : "Create Asset"}
              </Button>
            </div>
          </div>

          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Basic Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="categoryId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category <span className="text-red-500">*</span></FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {categories.filter(category => category.id && category.id.trim() !== '').map((category) => (
                            <SelectItem key={category.id} value={category.id}>
                              {category.name} ({category.code})
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
                  name="itemCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center justify-between">
                        Item Code <span className="text-red-500">*</span>
                        <div className="flex items-center space-x-2">
                          <Switch
                            checked={autoGenerateCode}
                            onCheckedChange={setAutoGenerateCode}
                            disabled={!selectedCategory}
                          />
                          <span className="text-xs text-muted-foreground">Auto-generate</span>
                        </div>
                      </FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          disabled={autoGenerateCode}
                          placeholder="Enter item code"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status <span className="text-red-500">*</span></FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="AVAILABLE">
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 rounded-full bg-green-500"></div>
                              Available
                            </div>
                          </SelectItem>
                          <SelectItem value="DEPLOYED">
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                              Deployed
                            </div>
                          </SelectItem>
                          <SelectItem value="IN_MAINTENANCE">
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                              In Maintenance
                            </div>
                          </SelectItem>
                          <SelectItem value="RETIRED">
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 rounded-full bg-gray-500"></div>
                              Retired
                            </div>
                          </SelectItem>
                          <SelectItem value="LOST">
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 rounded-full bg-red-500"></div>
                              Lost
                            </div>
                          </SelectItem>
                          <SelectItem value="DAMAGED">
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 rounded-full bg-orange-500"></div>
                              Damaged
                            </div>
                          </SelectItem>
                          <SelectItem value="FULLY_DEPRECIATED">
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 rounded-full bg-purple-500"></div>
                              Fully Depreciated
                            </div>
                          </SelectItem>
                          <SelectItem value="DISPOSED">
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 rounded-full bg-black"></div>
                              Disposed
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description <span className="text-red-500">*</span></FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Enter asset description" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <FormField
                  control={form.control}
                  name="serialNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Serial Number</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Enter serial number" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="brand"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Brand</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Enter brand" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="modelNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Model Number</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Enter model number" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="quantity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Quantity <span className="text-red-500">*</span></FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          min="1" 
                          {...field} 
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="departmentId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Department</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select department" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {departments.filter(dept => dept.id && dept.id.trim() !== '').map((dept) => (
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
                  name="location"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Location</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Enter location" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes</FormLabel>
                    <FormControl>
                      <Textarea {...field} placeholder="Enter additional notes" rows={3} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex items-center space-x-2">
                <FormField
                  control={form.control}
                  name="isActive"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center space-x-2 space-y-0">
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <FormLabel className="text-sm font-normal">
                        Active Asset
                      </FormLabel>
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* Purchase Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Purchase Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="purchaseDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Purchase Date</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              className={cn(
                                "w-full pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value ? (
                                format(field.value, "PPP")
                              ) : (
                                <span>Pick a date</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) => date > new Date()}
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="purchasePrice"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Purchase Price</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="0.00"
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || undefined)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="warrantyExpiry"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Warranty Expiry</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              className={cn(
                                "w-full pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value ? (
                                format(field.value, "PPP")
                              ) : (
                                <span>Pick a date</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) => date < new Date()}
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* Financial Configuration */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Financial Configuration
              </CardTitle>
              {selectedCategory && (
                <div className="text-sm text-muted-foreground">
                  Default accounts from category: {selectedCategory.name}
                </div>
              )}
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="assetAccountId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Asset Account</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select asset account" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {assetAccounts.filter(account => account.id && account.id.trim() !== '').map((account) => (
                            <SelectItem key={account.id} value={account.id}>
                              {account.accountCode} - {account.accountName}
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
                  name="depreciationExpenseAccountId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Depreciation Expense Account</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select expense account" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {expenseAccounts.filter(account => account.id && account.id.trim() !== '').map((account) => (
                            <SelectItem key={account.id} value={account.id}>
                              {account.accountCode} - {account.accountName}
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
                  name="accumulatedDepAccountId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Accumulated Depreciation Account</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select accumulated dep. account" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {assetAccounts.filter(account => account.id && account.id.trim() !== '').map((account) => (
                            <SelectItem key={account.id} value={account.id}>
                              {account.accountCode} - {account.accountName}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* Depreciation Configuration */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="h-5 w-5" />
                Depreciation Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="depreciationMethod"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Depreciation Method</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select method" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="STRAIGHT_LINE">Straight Line</SelectItem>
                          <SelectItem value="DECLINING_BALANCE">Declining Balance</SelectItem>
                          <SelectItem value="UNITS_OF_PRODUCTION">Units of Production</SelectItem>
                          <SelectItem value="SUM_OF_YEARS_DIGITS">Sum of Years Digits</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="depreciationStartDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Depreciation Start Date</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              className={cn(
                                "w-full pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value ? (
                                format(field.value, "PPP")
                              ) : (
                                <span>Pick a date</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="usefulLifeYears"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Useful Life (Years)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="1"
                          placeholder="0"
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || undefined)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="usefulLifeMonths"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Additional Months</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="0"
                          max="11"
                          placeholder="0"
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="salvageValue"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Salvage Value</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="0.00"
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Method-specific fields */}
              {watchedDepreciationMethod === 'DECLINING_BALANCE' && (
                <FormField
                  control={form.control}
                  name="depreciationRate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Depreciation Rate (%)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          max="100"
                          placeholder="0.00"
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || undefined)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {watchedDepreciationMethod === 'UNITS_OF_PRODUCTION' && (
                <FormField
                  control={form.control}
                  name="totalExpectedUnits"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Total Expected Units</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="1"
                          placeholder="0"
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || undefined)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {/* Depreciation Preview */}
              {watchedPurchasePrice && watchedUsefulLifeYears && (
                <div className="mt-4 p-4 bg-muted/50 rounded-lg">
                  <h4 className="text-sm font-medium mb-2">Depreciation Preview</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Purchase Price:</span>
                      <p className="font-medium">₱{watchedPurchasePrice.toLocaleString()}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Salvage Value:</span>
                      <p className="font-medium">₱{(watchedSalvageValue || 0).toLocaleString()}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Depreciable Amount:</span>
                      <p className="font-medium">₱{(watchedPurchasePrice - (watchedSalvageValue || 0)).toLocaleString()}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Est. Monthly Depreciation:</span>
                      <p className="font-medium">₱{calculateMonthlyDepreciation().toLocaleString()}</p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </form>
      </Form>


    </div>
  )
}
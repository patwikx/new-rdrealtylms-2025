"use client"

import { useState, useMemo } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { 
  Search, 
  Plus,
  MoreHorizontal,
  Edit,
  Trash2,
  Eye,
  Power,
  Package
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { toast } from "sonner"
import { format } from "date-fns"
import { 
  CategoriesResponse, 
  AssetCategoryWithDetails,
  deleteAssetCategory,
  toggleCategoryStatus
} from "@/lib/actions/asset-categories-actions"
import { CreateCategoryDialog } from "./create-category-dialog"
import { EditCategoryDialog } from "./edit-category-dialog"
// Removed dialog import - using dedicated page now

interface AssetCategoriesViewProps {
  categoriesData: CategoriesResponse
  businessUnitId: string
  currentFilters: {
    search?: string
    page: number
  }
}

export function AssetCategoriesView({ 
  categoriesData, 
  businessUnitId, 
  currentFilters 
}: AssetCategoriesViewProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [searchTerm, setSearchTerm] = useState(currentFilters.search || "")
  const [isLoading, setIsLoading] = useState(false)
  const [deletingCategory, setDeletingCategory] = useState<AssetCategoryWithDetails | null>(null)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [editingCategory, setEditingCategory] = useState<AssetCategoryWithDetails | null>(null)
  // Removed dialog state - using navigation instead

  const handleSearch = () => {
    const params = new URLSearchParams(searchParams.toString())
    if (searchTerm) {
      params.set('search', searchTerm)
    } else {
      params.delete('search')
    }
    params.set('page', '1')
    router.push(`/${businessUnitId}/asset-management/categories?${params.toString()}`)
  }



  const handleToggleStatus = async (category: AssetCategoryWithDetails) => {
    setIsLoading(true)
    try {
      const result = await toggleCategoryStatus(category.id)
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success(result.success)
        router.refresh()
      }
    } catch (error) {
      toast.error("Failed to update category status")
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!deletingCategory) return

    setIsLoading(true)
    try {
      const result = await deleteAssetCategory(deletingCategory.id)
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success(result.success)
        router.refresh()
      }
    } catch (error) {
      toast.error("Failed to delete category")
    } finally {
      setIsLoading(false)
      setDeletingCategory(null)
    }
  }

  const getStatusBadge = (isActive: boolean) => {
    return (
      <Badge variant={isActive ? "default" : "secondary"}>
        {isActive ? "Active" : "Inactive"}
      </Badge>
    )
  }

  const filteredCategories = useMemo(() => {
    return categoriesData.categories
  }, [categoriesData.categories])

  return (
    <div className="flex-1 space-y-6 px-2 sm:px-0">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">Asset Categories</h1>
          <p className="text-sm text-muted-foreground">
            Manage asset categories and their default account configurations
          </p>
        </div>
        
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Category
        </Button>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search categories by name, code, or description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            className="pl-10"
          />
          {searchTerm !== (currentFilters.search || "") && (
            <Button
              size="sm"
              className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6"
              onClick={handleSearch}
            >
              Search
            </Button>
          )}
        </div>
      </div>

      {/* Results count */}
      <div className="text-sm text-muted-foreground">
        Showing {filteredCategories.length} of {categoriesData.totalCount} categories
      </div>

      {/* Categories Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Category</TableHead>
              <TableHead>Code</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Assets</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="w-[70px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredCategories.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8">
                  <div className="flex flex-col items-center gap-2">
                    <Package className="h-8 w-8 text-muted-foreground" />
                    <p className="text-muted-foreground">
                      {searchTerm ? "No categories match your search criteria" : "No categories found"}
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredCategories.map((category) => (
                <TableRow key={category.id}>
                  <TableCell>
                    <div className="font-medium">{category.name}</div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="font-mono">
                      {category.code}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="max-w-[200px] truncate text-sm text-muted-foreground">
                      {category.description || "No description"}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{category._count.assets}</span>
                      {category._count.assets > 0 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => router.push(`/${businessUnitId}/asset-management/categories/${category.id}`)}
                          className="h-6 px-2 text-xs"
                        >
                          View
                        </Button>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(category.isActive)}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {format(new Date(category.createdAt), 'MMM dd, yyyy')}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 w-8 p-0"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setEditingCategory(category)}>
                          <Edit className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        {category._count.assets > 0 && (
                          <DropdownMenuItem onClick={() => router.push(`/${businessUnitId}/asset-management/categories/${category.id}`)}>
                            <Eye className="mr-2 h-4 w-4" />
                            View Assets ({category._count.assets})
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem 
                          onClick={() => handleToggleStatus(category)}
                          disabled={isLoading}
                        >
                          <Power className="mr-2 h-4 w-4" />
                          {category.isActive ? 'Deactivate' : 'Activate'}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          onClick={() => setDeletingCategory(category)}
                          className="text-red-600"
                          disabled={category._count.assets > 0}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {categoriesData.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {((currentFilters.page - 1) * 20) + 1} to {Math.min(currentFilters.page * 20, categoriesData.totalCount)} of {categoriesData.totalCount} categories
          </p>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const params = new URLSearchParams(searchParams.toString())
                params.set('page', (currentFilters.page - 1).toString())
                router.push(`/${businessUnitId}/asset-management/categories?${params.toString()}`)
              }}
              disabled={currentFilters.page <= 1}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const params = new URLSearchParams(searchParams.toString())
                params.set('page', (currentFilters.page + 1).toString())
                router.push(`/${businessUnitId}/asset-management/categories?${params.toString()}`)
              }}
              disabled={currentFilters.page >= categoriesData.totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deletingCategory} onOpenChange={(open) => !open && setDeletingCategory(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Category</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the category "{deletingCategory?.name}"? 
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={isLoading}>
              {isLoading ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Create Category Dialog */}
      <CreateCategoryDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        businessUnitId={businessUnitId}
      />

      {/* Edit Category Dialog */}
      {editingCategory && (
        <EditCategoryDialog
          open={!!editingCategory}
          onOpenChange={(open) => !open && setEditingCategory(null)}
          category={editingCategory}
          businessUnitId={businessUnitId}
        />
      )}

      {/* Category Assets Dialog removed - using dedicated page */}
    </div>
  )
}
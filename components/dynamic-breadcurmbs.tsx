'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { 
  Users, 
  FileText, 
  ChartBar as BarChart3, 
  Settings, 
  Building2, 
  FolderOpen, 
  UserCheck, 
  Activity, 
  Home, 
  Calculator, 
  Calendar, 
  Plus, 
  Eye, 
  UserPlus, 
  HelpCircle, 
  Mail, 
  Phone, 
  User,
  Package,
  ClipboardCheck,
  Clock,
  CheckCircle2,
  Edit,
  UserCog,
  Shield
} from 'lucide-react';
import { SystemUpdateNotes } from "@/components/ui/system-update-notes";

interface DynamicBreadcrumbsProps {
  businessUnitId: string;
}

interface BreadcrumbItem {
  label: string;
  href?: string;
  icon?: React.ComponentType<{ className?: string }>;
  isCurrentPage?: boolean;
}

const routeConfig: Record<string, { label: string; icon?: React.ComponentType<{ className?: string }> }> = {
  '': { label: 'Dashboard', icon: Home },
  
  // Employee Management
  'employees': { label: 'Employees', icon: Users },
  'employees/create': { label: 'Create Employee', icon: UserPlus },
  
  // Department Management
  'departments': { label: 'Departments', icon: Building2 },
  'departments/create': { label: 'Create Department', icon: Plus },
  
  // Business Unit Management
  'business-units': { label: 'Business Units', icon: Building2 },
  'business-units/create': { label: 'Create Business Unit', icon: Plus },
  
  // Leave Management
  'leave-requests': { label: 'Leave Requests', icon: Calendar },
  'leave-requests/create': { label: 'Submit Leave Request', icon: Plus },
  'overtime-requests': { label: 'Overtime Requests', icon: Activity },
  'overtime-requests/create': { label: 'Submit Overtime Request', icon: Plus },
  'leave-types': { label: 'Leave Types', icon: FolderOpen },
  'leave-types/create': { label: 'Create Leave Type', icon: Plus },
  'leave-balances': { label: 'Leave Balances', icon: Calculator },
  
  // Material Request System (MRS)
  'material-requests': { label: 'Material Requests', icon: Package },
  'material-requests/create': { label: 'Create Material Request', icon: Plus },
  
  // MRS Coordinator
  'mrs-coordinator': { label: 'MRS Coordinator', icon: UserCog },
  'mrs-coordinator/posted': { label: 'Posted Requests', icon: CheckCircle2 },
  'mrs-coordinator/acknowledgement': { label: 'Create Acknowledgements', icon: FileText },
  'mrs-coordinator/done-requests': { label: 'Done Requests', icon: CheckCircle2 },
  
  // Approvals
  'approvals': { label: 'Approvals', icon: ClipboardCheck },
  'approvals/leave': { label: 'Leave Approvals', icon: Calendar },
  'approvals/leave/pending': { label: 'Pending Leave Approvals', icon: Clock },
  'approvals/overtime': { label: 'Overtime Approvals', icon: Activity },
  'approvals/overtime/pending': { label: 'Pending Overtime Approvals', icon: Clock },
  'approvals/material-requests': { label: 'Material Request Approvals', icon: Package },
  'approvals/material-requests/pending': { label: 'Pending Material Request Approvals', icon: Clock },
  
  // Reports
  'reports': { label: 'Reports', icon: FileText },
  'reports/leave': { label: 'Leave Reports', icon: FileText },
  'reports/overtime': { label: 'Overtime Reports', icon: FileText },
  'reports/employees': { label: 'Employee Reports', icon: FileText },
  'reports/depreciation': { label: 'Depreciation Reports', icon: Calculator },
  'reports/depreciation/schedule': { label: 'Depreciation Schedule', icon: Calendar },
  'reports/depreciation/schedule/preview': { label: 'Schedule Preview', icon: Eye },
  'reports/depreciation/netbook': { label: 'Net Book Value', icon: BarChart3 },
  'reports/depreciation/netbook/preview': { label: 'Net Book Value Preview', icon: Eye },
  'reports/depreciation/damaged-loss': { label: 'Damaged & Loss', icon: FileText },
  'reports/depreciation/damaged-loss/preview': { label: 'Damaged & Loss Preview', icon: Eye },
  
  // Analytics
  'analytics': { label: 'Analytics', icon: BarChart3 },
  
  // Asset Management
  'asset-management': { label: 'Asset Management', icon: Package },
  'asset-management/assets': { label: 'All Assets', icon: Package },
  'asset-management/assets/create': { label: 'Create Asset', icon: Plus },
  'asset-management/deployments': { label: 'Deployments', icon: User },
  'asset-management/returns': { label: 'Asset Returns', icon: Package },
  'asset-management/asset-printing': { label: 'Asset QR Printing', icon: Package },
  'asset-management/asset-printing/preview': { label: 'QR Code Preview', icon: Eye },
  'asset-management/transfers': { label: 'Transfers', icon: Package },
  'asset-management/retirements': { label: 'Retirements', icon: Package },
  'asset-management/disposals': { label: 'Disposals', icon: Package },
  'asset-management/categories': { label: 'Categories', icon: FolderOpen },
  'asset-management/depreciation': { label: 'Depreciation', icon: Calculator },
  'asset-management/inventory': { label: 'Inventory Verification', icon: ClipboardCheck },
  'asset-management/inventory/create': { label: 'Create Verification', icon: Plus },

  // Administration
  'admin': { label: 'Administration', icon: Settings },
  'admin/users': { label: 'User Management', icon: Users },
  'admin/users/create': { label: 'Create User', icon: UserPlus },
  'admin/departments': { label: 'Department Management', icon: Building2 },
  'admin/department-approvers': { label: 'Department Approvers', icon: UserCog },
  'admin/business-units': { label: 'Business Unit Management', icon: Building2 },
  'admin/leave-types': { label: 'Leave Type Management', icon: FolderOpen },
  'admin/gl-accounts': { label: 'GL Accounts', icon: Calculator },
  'admin/system-settings': { label: 'System Settings', icon: Settings },

  // Roles Management
  'roles': { label: 'Roles', icon: Shield },
  'roles/create': { label: 'Create Role', icon: Plus },
  
  // System Permissions (Admin)
  'admin/system-permissions': { label: 'System Permissions', icon: Shield },
  
  // Profile & Settings
  'profile': { label: 'Profile', icon: UserCheck },
  'settings': { label: 'Settings', icon: Settings },
  'settings/profile': { label: 'Profile Settings', icon: UserCheck },
  'settings/preferences': { label: 'Preferences', icon: Settings },
};

export function DynamicBreadcrumbs({ businessUnitId }: DynamicBreadcrumbsProps) {
  const pathname = usePathname();
  
  const generateBreadcrumbs = (): BreadcrumbItem[] => {
    const pathSegments = pathname.split('/').filter(Boolean);
    const breadcrumbs: BreadcrumbItem[] = [];
    
    // Always start with Dashboard
    breadcrumbs.push({
      label: 'Dashboard',
      href: `/${businessUnitId}`,
      icon: Home
    });

    // Skip the business unit ID segment (index 0)
    let currentPath = '';
    let actualPath = ''; // Track the actual path with UUIDs for href generation
    
    for (let i = 1; i < pathSegments.length; i++) {
      const segment = pathSegments[i];
      
      // Build the actual path (including UUIDs)
      actualPath = actualPath ? `${actualPath}/${segment}` : segment;
      
      // Check if this is a dynamic route (UUID or CUID pattern)
      const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
      const cuidPattern = /^c[a-z0-9]{24}$/i
      const isIdPattern = uuidPattern.test(segment) || cuidPattern.test(segment);
      
      if (isIdPattern) {
        // For UUID segments, use the parent route's label + "Details"
        const parentPath = currentPath;
        const parentConfig = routeConfig[parentPath];
        
        breadcrumbs.push({
          label: parentConfig ? `${parentConfig.label} Details` : 'Details',
          href: i === pathSegments.length - 1 ? undefined : `/${businessUnitId}/${actualPath}`,
          icon: parentConfig?.icon || Eye,
          isCurrentPage: i === pathSegments.length - 1
        });
      } else {
        // For non-UUID segments, build the currentPath for config lookup
        currentPath = currentPath ? `${currentPath}/${segment}` : segment;
        
        // Regular route handling
        const config = routeConfig[currentPath];
        const isLastSegment = i === pathSegments.length - 1;
        
        breadcrumbs.push({
          label: config?.label || segment.charAt(0).toUpperCase() + segment.slice(1).replace('-', ' '),
          href: isLastSegment ? undefined : `/${businessUnitId}/${actualPath}`,
          icon: config?.icon,
          isCurrentPage: isLastSegment
        });
      }
    }

    return breadcrumbs;
  };

  const breadcrumbs = generateBreadcrumbs();

  return (
    <div className="flex items-center justify-between w-full">
      <Breadcrumb>
        <BreadcrumbList>
          {breadcrumbs.map((crumb, index) => (
            <React.Fragment key={index}>
              <BreadcrumbItem className={crumb.isCurrentPage ? "" : "hidden md:block"}>
                {crumb.isCurrentPage ? (
                  <BreadcrumbPage className="flex items-center gap-2">
                    {crumb.icon && <crumb.icon className="h-4 w-4" />}
                    {crumb.label}
                  </BreadcrumbPage>
                ) : (
                  <BreadcrumbLink asChild>
                    <Link href={crumb.href!} className="flex items-center gap-2">
                      {crumb.icon && <crumb.icon className="h-4 w-4" />}
                      {crumb.label}
                    </Link>
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
              {index < breadcrumbs.length - 1 && (
                <BreadcrumbSeparator className="hidden md:block" />
              )}
            </React.Fragment>
          ))}
        </BreadcrumbList>
      </Breadcrumb>
      
      {/* Version & Developer Info */}
      <div className="flex items-center gap-2">
        <SystemUpdateNotes />
        
        <TooltipProvider>
          <Popover>
            <Tooltip>
              <TooltipTrigger asChild>
                <PopoverTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <HelpCircle className="h-4 w-4" />
                    <span className="sr-only">Developer Information</span>
                  </Button>
                </PopoverTrigger>
              </TooltipTrigger>
              <TooltipContent>
                <p>Developer Information</p>
              </TooltipContent>
            </Tooltip>
          <PopoverContent className="w-80" align="end">
            <div className="space-y-4">
              <div className="space-y-2">
                <h4 className="font-medium leading-none flex items-center gap-2">
                  <User className="h-4 w-4" />
                  System Developer
                </h4>
                <p className="text-sm text-muted-foreground">
                  RDRDC Group Leave Management System
                </p>
              </div>
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Developer:</span>
                  <span>Patrick L. Miranda</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Email:</span>
                  <a 
                    href="mailto:patricklacapmiranda@gmail.com" 
                    className="text-blue-600 hover:underline"
                  >
                    patricklacapmiranda@gmail.com
                  </a>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Contact:</span>
                  <a 
                    href="tel:+639273623310" 
                    className="text-blue-600 hover:underline"
                  >
                    +63 927 362 3310
                  </a>
                </div>
              </div>
              <div className="pt-2 border-t">
                <p className="text-xs text-muted-foreground">
                  For technical support or system inquiries
                </p>
              </div>
            </div>
          </PopoverContent>
          </Popover>
        </TooltipProvider>
      </div>
    </div>
  );
}
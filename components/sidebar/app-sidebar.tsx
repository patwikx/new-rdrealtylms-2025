// app-sidebar.tsx
"use client"

import * as React from "react"
import { Users, Calendar, Settings, ChartBar as BarChart3, FileText, Shield, CheckSquare, Clock, Package, ClipboardList, Truck } from "lucide-react"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar"
import type { BusinessUnitItem } from "@/types/business-unit-types"
import type { Session } from "next-auth"
import BusinessUnitSwitcher from "../business-unit-swticher"
import { NavMain } from "./nav-main"
import { NavUser } from "./nav-user"

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  session: Session
  businessUnits: BusinessUnitItem[]
  currentBusinessUnitId: string
}



// Helper function to check if user is an approver
const isApprover = (userRole: string) => {
  // Users who can be approvers (this should match your department approver logic)
  const approverRoles = ['ADMIN', 'MANAGER', 'HR', 'SUPERVISOR', 'DEPARTMENT_HEAD']
  return approverRoles.includes(userRole)
}

// Define navigation items based on your hybrid LMS + Asset Management system
const getNavigationItems = (businessUnitId: string, userRole: string) => {
  // Define roles that can access MRS Coordinator functions
  const mrsCoordinatorRoles = ['ADMIN', 'PURCHASER', 'MRS_COORDINATOR']
  
  // Base items for all users (Dashboard, Leave Requests, Overtime Requests, Assets, MRS)
  const baseItems = [
    {
      title: "Dashboard",
      url: `/${businessUnitId}`,
      icon: BarChart3,
      isActive: true,
      items: [
        {
          title: "LMS Dashboard",
          url: `/${businessUnitId}`,
        },
        // Only show Asset Management Dashboard for ADMIN and ACCTG users
        ...(userRole === "ADMIN" || userRole === "ACCTG" ? [{
          title: "Asset Mngt. Dashboard",
          url: `/${businessUnitId}/asset-management`,
        }] : []),
      ],
    },
    {
      title: "Leave Requests",
      url: `/${businessUnitId}/leave-requests`,
      icon: Calendar,
      items: [
        {
          title: "My Requests",
          url: `/${businessUnitId}/leave-requests`,
        },
        {
          title: "Submit Request",
          url: `/${businessUnitId}/leave-requests/create`,
        },
        {
          title: "Leave Balance",
          url: `/${businessUnitId}/leave-balances`,
        },
      ],
    },
    {
      title: "Overtime Requests",
      url: `/${businessUnitId}/overtime-requests`,
      icon: Clock,
      items: [
        {
          title: "My Overtime",
          url: `/${businessUnitId}/overtime-requests`,
        },
        {
          title: "Submit Request",
          url: `/${businessUnitId}/overtime-requests/create`,
        },
      ],
    },
    {
      title: "Material Requests",
      url: `/${businessUnitId}/material-requests`,
      icon: ClipboardList,
      items: [
        {
          title: "My Requests",
          url: `/${businessUnitId}/material-requests`,
        },
        {
          title: "Create Request",
          url: `/${businessUnitId}/material-requests/create`,
        },
      ],
    },
  ];

  // Add approver-specific items (Leave, Overtime, Asset, MRS approvals)
  if (isApprover(userRole)) {
    baseItems.push({
      title: "Approvals",
      url: `/${businessUnitId}/approvals`,
      icon: CheckSquare,
      items: [
        {
          title: "Pending Leave",
          url: `/${businessUnitId}/approvals/leave/pending`,
        },
        {
          title: "Pending Overtime",
          url: `/${businessUnitId}/approvals/overtime/pending`,
        },
              {
          title: "Material Requests",
          url: `/${businessUnitId}/approvals/material-requests/pending`,
        },
      ],
    });
  }

  // Add MRS Coordinator section for authorized roles
  if (mrsCoordinatorRoles.includes(userRole)) {
    baseItems.push({
      title: "MRS Coordinator",
      url: `/${businessUnitId}/mrs-coordinator`,
      icon: Truck,
      items: [
        {
          title: "For Serving - MRS",
          url: `/${businessUnitId}/mrs-coordinator/for-serving`,
        },
        {
          title: "For Posting Requests",
          url: `/${businessUnitId}/mrs-coordinator/for-posting`,
        },
        {
          title: "Done Requests",
          url: `/${businessUnitId}/mrs-coordinator/done-requests`,
        }
      ],
    });
  }

  

  // Add management items for ADMIN and HR roles
  if (userRole === "ADMIN" || userRole === "ACCTG" || userRole === "HR") {
    baseItems.push(
      {
        title: "Asset Management",
        url: `/${businessUnitId}/asset-management`,
        icon: Package,
        items: [
          {
            title: "All Assets",
            url: `/${businessUnitId}/asset-management/assets`,
          },
          {
            title: "Deployments",
            url: `/${businessUnitId}/asset-management/deployments`,
          },
                    {
            title: "Asset Return",
            url: `/${businessUnitId}/asset-management/returns`,
          },
                    {
            title: "Asset QR Printing",
            url: `/${businessUnitId}/asset-management/asset-printing`,
          },
          {
            title: "Transfers",
            url: `/${businessUnitId}/asset-management/transfers`,
          },
          {
            title: "Retirements",
            url: `/${businessUnitId}/asset-management/retirements`,
          },
          {
            title: "Disposals",
            url: `/${businessUnitId}/asset-management/disposals`,
          },
          {
            title: "Categories",
            url: `/${businessUnitId}/asset-management/categories`,
          },
          {
            title: "Depreciation",
            url: `/${businessUnitId}/asset-management/depreciation`,
          },
          {
            title: "Inventory Verification",
            url: `/${businessUnitId}/asset-management/inventory`,
          },
        ],
      },
      {
        title: "Reports",
        url: `/${businessUnitId}/reports`,
        icon: FileText,
        items: [
          {
            title: "Leave Reports",
            url: `/${businessUnitId}/reports/leave`,
          },
          {
            title: "Overtime Reports",
            url: `/${businessUnitId}/reports/overtime`,
          },
          {
            title: "Asset Reports",
            url: `/${businessUnitId}/reports/assets`,
          },
                    {
            title: "Depreciation Reports",
            url: `/${businessUnitId}/reports/depreciation`,
          },
          {
            title: "Deployment Reports",
            url: `/${businessUnitId}/reports/deployments`,
          },
          {
            title: "MRS Reports",
            url: `/${businessUnitId}/reports/material-requests`,
          },
          {
            title: "Employee Reports",
            url: `/${businessUnitId}/reports/employees`,
          },
          {
            title: "Audit Logs",
            url: `/${businessUnitId}/audit-logs`,
          },
        ],
      }
    );
  }

  // Add admin-only items
  const adminRoles = ['ADMIN', 'HR']
  if (adminRoles.includes(userRole)) {
    baseItems.push({
      title: "Administration",
      url: `/${businessUnitId}/admin`,
      icon: Shield,
      items: [
        {
          title: "Leave Types",
          url: `/${businessUnitId}/admin/leave-types`,
        },
        {
          title: "Leave Balances",
          url: `/${businessUnitId}/admin/leave-balances`,
        },
        {
          title: "Business Units",
          url: `/${businessUnitId}/admin/business-units`,
        },
        {
          title: "GL Accounts",
          url: `/${businessUnitId}/admin/gl-accounts`,
        },
        {
          title: "User Management",
          url: `/${businessUnitId}/admin/users`,
        },
        {
            title: "Departments",
            url: `/${businessUnitId}/departments`,
          },
          {
            title: "System Permissions",
            url: `/${businessUnitId}/admin/system-permissions`,
          },
        {
          title: "Audit Logs",
          url: `/${businessUnitId}/admin/audit-logs`,
        },
      ],
    });
  }

  // Settings for all users
  baseItems.push({
    title: "Settings",
    url: `/${businessUnitId}/settings`,
    icon: Settings,
    items: [
      {
        title: "Profile",
        url: `/${businessUnitId}/profile`,
      },
    ],
  });

  return baseItems;
}



export function AppSidebar({ 
  session, 
  businessUnits, 
  currentBusinessUnitId,
  ...props 
}: AppSidebarProps) {
  const navItems = React.useMemo(() => 
    getNavigationItems(currentBusinessUnitId, session.user.role),
    [currentBusinessUnitId, session.user.role]
  )



  const userData = React.useMemo(() => ({
    id: session.user.id,
    name: session.user.name,
    email: session.user.email ?? '',
    avatar: '', // No avatar field in current schema
    employeeId: session.user.employeeId,
    position: session.user.classification ?? 'Employee', // Use classification as position
    businessUnit: session.user.businessUnit?.name ?? 'No Business Unit',
    role: session.user.role, // Role is already a string enum value
    profilePicture: (session.user as any).profilePicture || null,
  }), [session.user])

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <BusinessUnitSwitcher 
          items={businessUnits}
          className="px-2"
          userRole={session.user.role}
        />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navItems} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={userData} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
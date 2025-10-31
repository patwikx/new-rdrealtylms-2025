// app-sidebar.tsx
"use client"

import * as React from "react"
import { Users, Calendar, Settings, ChartBar as BarChart3, FileText, Shield, CheckSquare, Clock } from "lucide-react"
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



// Define navigation items based on your leave management system
const getNavigationItems = (businessUnitId: string, userRole: string) => {
  // Base items for all users (Dashboard, Leave Requests, Overtime Requests, Settings)
  const baseItems = [
    {
      title: "Dashboard",
      url: `/${businessUnitId}`,
      icon: BarChart3,
      isActive: true,
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
  ];

  // Add approvals for MANAGER and ADMIN roles
  if (userRole === "MANAGER" || userRole === "ADMIN" || userRole === "HR") {
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
          title: "Approval History",
          url: `/${businessUnitId}/approvals/history`,
        },
      ],
    });
  }

  // Add additional items for ADMIN role only
  if (userRole === "ADMIN" ||  userRole === "HR") {
    baseItems.push(
      {
        title: "Employees",
        url: `/${businessUnitId}/employees`,
        icon: Users,
        items: [
          {
            title: "All Employees",
            url: `/${businessUnitId}/employees`,
          },
          {
            title: "Departments",
            url: `/${businessUnitId}/departments`,
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
            title: "Employee Reports",
            url: `/${businessUnitId}/reports/employees`,
          },
        ],
      },
      {
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
            title: "User Management",
            url: `/${businessUnitId}/admin/users`,
          },
        ],
      }
    );
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
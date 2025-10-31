"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { UserRole, RequestStatus } from "@prisma/client";

// Types for dashboard data
export interface DashboardStats {
  totalEmployees: number;
  totalLeaveRequests: number;
  pendingLeaveRequests: number;
  totalOvertimeRequests: number;
  pendingOvertimeRequests: number;
  totalDepartments: number;
}

export interface RecentLeaveRequest {
  id: string;
  startDate: Date;
  endDate: Date;
  status: RequestStatus;
  session: string;
  reason: string;
  user: {
    id: string;
    name: string;
    employeeId: string;
  };
  leaveType: {
    id: string;
    name: string;
  };
}

export interface RecentOvertimeRequest {
  id: string;
  startTime: Date;
  endTime: Date;
  status: RequestStatus;
  reason: string;
  user: {
    id: string;
    name: string;
    employeeId: string;
  };
}

export interface LeaveBalance {
  id: string;
  allocatedDays: number;
  usedDays: number;
  leaveType: {
    id: string;
    name: string;
  };
}

// Check if user has access to business unit
async function checkBusinessUnitAccess(businessUnitId: string) {
  const session = await auth();
  
  if (!session?.user) {
    throw new Error("Not authenticated");
  }
  

  
  // Admins and HR can access any business unit
  if (session.user.role === "ADMIN" || session.user.role === "HR") {
    return session.user;
  }
  
  // Regular users and managers can only access their own business unit
  if (!session.user.businessUnit?.id) {
    throw new Error("User not assigned to any business unit");
  }
  
  if (session.user.businessUnit.id !== businessUnitId) {
    throw new Error(`Access denied: User business unit ${session.user.businessUnit.id} does not match requested ${businessUnitId}`);
  }
  
  return session.user;
}

// Get dashboard statistics
export async function getDashboardStats(businessUnitId: string): Promise<DashboardStats> {
  try {
    await checkBusinessUnitAccess(businessUnitId);
    
    const [
      totalEmployees,
      totalLeaveRequests,
      pendingLeaveRequests,
      totalOvertimeRequests,
      pendingOvertimeRequests,
      totalDepartments,
    ] = await Promise.all([
      // Total employees in business unit
      prisma.user.count({
        where: { businessUnitId },
      }),
      
      // Total leave requests in business unit
      prisma.leaveRequest.count({
        where: {
          user: { businessUnitId },
        },
      }),
      
      // Pending leave requests
      prisma.leaveRequest.count({
        where: {
          user: { businessUnitId },
          status: {
            in: ["PENDING_MANAGER", "PENDING_HR"],
          },
        },
      }),
      
      // Total overtime requests
      prisma.overtimeRequest.count({
        where: {
          user: { businessUnitId },
        },
      }),
      
      // Pending overtime requests
      prisma.overtimeRequest.count({
        where: {
          user: { businessUnitId },
          status: {
            in: ["PENDING_MANAGER", "PENDING_HR"],
          },
        },
      }),
      
      // Total departments with employees in this business unit
      prisma.department.count({
        where: {
          members: {
            some: { businessUnitId },
          },
        },
      }),
    ]);

    return {
      totalEmployees,
      totalLeaveRequests,
      pendingLeaveRequests,
      totalOvertimeRequests,
      pendingOvertimeRequests,
      totalDepartments,
    };
  } catch (error) {
    console.error("Get dashboard stats error:", error);
    return {
      totalEmployees: 0,
      totalLeaveRequests: 0,
      pendingLeaveRequests: 0,
      totalOvertimeRequests: 0,
      pendingOvertimeRequests: 0,
      totalDepartments: 0,
    };
  }
}

// Get recent leave requests
export async function getRecentLeaveRequests(businessUnitId: string): Promise<RecentLeaveRequest[]> {
  try {
    const user = await checkBusinessUnitAccess(businessUnitId);
    
    let whereClause = {};
    
    // If user is not admin/HR, only show their own requests
    if (user.role !== "ADMIN" && user.role !== "HR" && user.role !== "MANAGER") {
      whereClause = { userId: user.id };
    } else {
      // Managers, HR, and Admins see all requests in their business unit
      whereClause = { user: { businessUnitId } };
    }
    
    const requests = await prisma.leaveRequest.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            employeeId: true,
          },
        },
        leaveType: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 5,
    });

    return requests;
  } catch (error) {
    console.error("Get recent leave requests error:", error);
    return [];
  }
}

// Get recent overtime requests
export async function getRecentOvertimeRequests(businessUnitId: string): Promise<RecentOvertimeRequest[]> {
  try {
    const user = await checkBusinessUnitAccess(businessUnitId);
    
    let whereClause = {};
    
    // If user is not admin/HR, only show their own requests
    if (user.role !== "ADMIN" && user.role !== "HR" && user.role !== "MANAGER") {
      whereClause = { userId: user.id };
    } else {
      // Managers, HR, and Admins see all requests in their business unit
      whereClause = { user: { businessUnitId } };
    }
    
    const requests = await prisma.overtimeRequest.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            employeeId: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 5,
    });

    return requests;
  } catch (error) {
    console.error("Get recent overtime requests error:", error);
    return [];
  }
}

// Get user's leave balances
export async function getUserLeaveBalances(businessUnitId: string): Promise<LeaveBalance[]> {
  try {
    const user = await checkBusinessUnitAccess(businessUnitId);
    
    const currentYear = new Date().getFullYear();
    
    const balances = await prisma.leaveBalance.findMany({
      where: {
        userId: user.id,
        year: currentYear,
      },
      include: {
        leaveType: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        leaveType: { name: "asc" },
      },
    });

    return balances;
  } catch (error) {
    console.error("Get user leave balances error:", error);
    return [];
  }
}

// Get pending approvals assigned to the logged-in user
export async function getPendingApprovals(businessUnitId: string) {
  try {
    const user = await checkBusinessUnitAccess(businessUnitId);
    
    // Only managers, HR, and admins can see pending approvals
    if (user.role !== "ADMIN" && user.role !== "HR" && user.role !== "MANAGER") {
      return { leaveRequests: [], overtimeRequests: [] };
    }
    
    let leaveWhereClause = {};
    let overtimeWhereClause = {};
    
    if (user.role === "ADMIN") {
      // Admins can see all pending requests in the business unit
      leaveWhereClause = {
        user: { businessUnitId },
        status: {
          in: ["PENDING_MANAGER", "PENDING_HR"],
        },
      };
      overtimeWhereClause = {
        user: { businessUnitId },
        status: {
          in: ["PENDING_MANAGER", "PENDING_HR"],
        },
      };
    } else if (user.role === "HR") {
      // HR sees requests that are pending HR approval
      leaveWhereClause = {
        user: { businessUnitId },
        status: "PENDING_HR",
      };
      overtimeWhereClause = {
        user: { businessUnitId },
        status: "PENDING_HR",
      };
    } else if (user.role === "MANAGER") {
      // Managers see requests from their direct reports that are pending manager approval
      leaveWhereClause = {
        user: { 
          businessUnitId,
          approverId: user.id, // Only requests from their direct reports
        },
        status: "PENDING_MANAGER",
      };
      overtimeWhereClause = {
        user: { 
          businessUnitId,
          approverId: user.id, // Only requests from their direct reports
        },
        status: "PENDING_MANAGER",
      };
    }
    
    const [pendingLeaveRequests, pendingOvertimeRequests] = await Promise.all([
      // Pending leave requests assigned to this user
      prisma.leaveRequest.findMany({
        where: leaveWhereClause,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              employeeId: true,
            },
          },
          leaveType: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: { createdAt: "asc" },
        take: 10,
      }),
      
      // Pending overtime requests assigned to this user
      prisma.overtimeRequest.findMany({
        where: overtimeWhereClause,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              employeeId: true,
            },
          },
        },
        orderBy: { createdAt: "asc" },
        take: 10,
      }),
    ]);

    return {
      leaveRequests: pendingLeaveRequests,
      overtimeRequests: pendingOvertimeRequests,
    };
  } catch (error) {
    console.error("Get pending approvals error:", error);
    return { leaveRequests: [], overtimeRequests: [] };
  }
}
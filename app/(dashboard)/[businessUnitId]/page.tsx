import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { 
  getDashboardStats, 
  getRecentLeaveRequests, 
  getRecentOvertimeRequests, 
  getUserLeaveBalances,
  getPendingApprovals
} from "@/lib/actions/dashboard-actions";
import { StatsCards } from "@/components/dashboard/stats-cards";
import { RecentRequests } from "@/components/dashboard/recent-requests";
import { LeaveBalanceCard } from "@/components/dashboard/leave-balance";
import { PendingForApproval } from "@/components/dashboard/pending-for-approval";

interface DashboardPageProps {
  params: Promise<{
    businessUnitId: string;
  }>;
}

export default async function DashboardPage({ params }: DashboardPageProps) {
  const session = await auth();
  
  // Redirect if not authenticated
  if (!session?.user) {
    redirect("/");
  }

  const { businessUnitId } = await params;

  // Check if user can see approvals
  const canApprove = session.user.role === "ADMIN" || 
                    session.user.role === "HR" || 
                    session.user.role === "MANAGER";

  // Fetch all dashboard data in parallel
  const [
    stats,
    recentLeaveRequests,
    recentOvertimeRequests,
    leaveBalances,
    pendingApprovals,
  ] = await Promise.all([
    getDashboardStats(businessUnitId),
    getRecentLeaveRequests(businessUnitId),
    getRecentOvertimeRequests(businessUnitId),
    getUserLeaveBalances(businessUnitId),
    canApprove ? getPendingApprovals(businessUnitId) : Promise.resolve({ leaveRequests: [], overtimeRequests: [] }),
  ]);

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            Welcome back, {session.user.name}!
          </h1>
          <p className="text-muted-foreground">
            Here's what's happening in your workspace today.
          </p>
        </div>
        <div className="text-right">
          <p className="text-sm text-muted-foreground">
            {session.user.businessUnit?.name}
          </p>
          <p className="text-xs text-muted-foreground">
            {session.user.employeeId} • {session.user.role}
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <StatsCards stats={stats} businessUnitId={businessUnitId} />

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Leave Balance */}
        <LeaveBalanceCard 
          balances={leaveBalances}
          businessUnitId={businessUnitId}
        />
        
        {/* Recent Requests - Takes 2 columns */}
        <div className="lg:col-span-2">
          <RecentRequests 
            leaveRequests={recentLeaveRequests}
            overtimeRequests={recentOvertimeRequests}
            businessUnitId={businessUnitId}
          />
        </div>
      </div>

      {/* Pending Approvals (Full Width for Managers/Admins) */}
      {canApprove && (
        <PendingForApproval 
          leaveRequests={pendingApprovals.leaveRequests}
          overtimeRequests={pendingApprovals.overtimeRequests}
          businessUnitId={businessUnitId}
        />
      )}
    </div>
  );
}
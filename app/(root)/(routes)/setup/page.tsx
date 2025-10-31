import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { SetupPageClient } from "@/components/setup/setup-page-client";

export default async function SetupPage() {
  const session = await auth();
  
  // If no session, redirect to login
  if (!session?.user) {
    redirect("/");
  }
  
  // If user is admin, redirect to admin business unit management
  if (session.user.role === "ADMIN") {
    redirect("/admin/business-units");
  }
  
  // If user already has business unit, redirect to their dashboard
  if (session.user.businessUnit?.id) {
    redirect(`/${session.user.businessUnit.id}`);
  }

  // Users without business units should wait for admin assignment

  // Show setup page for regular users without business unit
  return <SetupPageClient user={session.user} />;
}
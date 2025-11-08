import { redirect } from "next/navigation";
import { auth, signOut } from "@/auth";
import { prisma } from "@/lib/prisma";

export default async function SetupPage() {
  const session = await auth();
  
  // If no session, redirect to login
  if (!session?.user) {
    redirect("/auth/sign-in");
  }
  
  // If user is ADMIN, redirect to admin business unit management
  if (session.user.role === "ADMIN") {
    redirect("/admin/business-units");
  }
  
  // Fetch user's business unit from database
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      businessUnitId: true,
    },
  });
  
  // If user has a business unit, redirect to their dashboard
  if (user?.businessUnitId) {
    redirect(`/${user.businessUnitId}`);
  }
  
  // If user has no business unit, force logout
  await signOut({ redirectTo: "/auth/sign-in?error=NoBusinessUnit&logout=true" });
}

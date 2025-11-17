import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertTriangle, ArrowLeft, Shield, Mail } from "lucide-react"
import Link from "next/link"

interface UnauthorizedPageProps {
  params: Promise<{
    businessUnitId: string
  }>
}

export default async function UnauthorizedPage({ params }: UnauthorizedPageProps) {
  const session = await auth()
  
  if (!session) {
    redirect("/auth/sign-in")
  }

  const { businessUnitId } = await params

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-6">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="flex items-center justify-center w-16 h-16 rounded-full bg-destructive/10">
              <Shield className="h-8 w-8 text-destructive" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-destructive">Access Denied</CardTitle>
          <CardDescription className="text-base">
            You don't have permission to access this page
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <div className="bg-muted/50 rounded-lg p-4 space-y-3">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
              <div className="space-y-1">
                <h4 className="font-medium text-sm">Insufficient Permissions</h4>
                <p className="text-sm text-muted-foreground">
                  Your current role ({session.user.role}) doesn't have access to this resource. 
                  Contact your administrator if you believe this is an error.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="font-medium text-sm">What you can do:</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-primary"></div>
                Go back to your dashboard
              </li>
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-primary"></div>
                Contact your system administrator
              </li>
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-primary"></div>
                Check if you're using the correct account
              </li>
            </ul>
          </div>

          <div className="flex flex-col gap-3 pt-4">
            <Button asChild className="w-full">
              <Link href={`/${businessUnitId}`}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Link>
            </Button>
            
            <Button variant="outline" asChild className="w-full">
              <Link href="mailto:mis@rdrealty.com.ph">
                <Mail className="h-4 w-4 mr-2" />
                Contact MIS Department
              </Link>
            </Button>
          </div>

          <div className="text-center pt-4 border-t">
            <div className="text-xs text-muted-foreground space-y-1">
              <p>User: {session.user.name}</p>
              <p>Employee ID: {session.user.employeeId}</p>
              <p>Role: {session.user.role}</p>
              <p>Business Unit: {session.user.businessUnit?.name || 'Not assigned'}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
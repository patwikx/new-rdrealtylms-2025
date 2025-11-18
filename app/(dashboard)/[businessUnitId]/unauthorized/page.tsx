import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { Button } from "@/components/ui/button"
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
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-2xl space-y-8">
        {/* Header */}
        <div className="text-center space-y-6">
          {/* Animated Icons - White/Light Gray */}
          <div className="flex justify-center items-center gap-6">
            <Shield 
              className="h-20 w-20 text-gray-300 dark:text-gray-400 stroke-[1.5]" 
              style={{ 
                animation: 'bounce 2s ease-in-out infinite',
                animationDelay: '0s'
              }} 
            />
            <AlertTriangle 
              className="h-16 w-16 text-gray-300 dark:text-gray-400 stroke-[1.5]" 
              style={{ 
                animation: 'bounce 2s ease-in-out infinite',
                animationDelay: '0.3s'
              }} 
            />
            <Shield 
              className="h-20 w-20 text-gray-300 dark:text-gray-400 stroke-[1.5]" 
              style={{ 
                animation: 'bounce 2s ease-in-out infinite',
                animationDelay: '0.6s'
              }} 
            />
          </div>
          
          {/* Title */}
          <div className="space-y-4">
            <h1 className="text-4xl font-bold text-foreground">Access Denied</h1>
            <p className="text-base text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              We're sorry, but you don't have permission to access this page. 
              This page is currently restricted and will be available soon.
            </p>
          </div>
          
          {/* Status Badge */}
          <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-black/80 dark:bg-black/60 border border-gray-700">
            <div className="w-2 h-2 rounded-full bg-white animate-pulse"></div>
            <span className="text-sm text-gray-300">In Progress</span>
          </div>
        </div>
        
        {/* Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
          <Button 
            asChild 
            variant="secondary"
            className="w-full sm:w-auto px-6 py-5 text-base bg-white hover:bg-gray-100 text-black border-0"
          >
            <Link href={`/${businessUnitId}`}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Home
            </Link>
          </Button>
          
          <Button 
            asChild 
            variant="outline"
            className="w-full sm:w-auto px-6 py-5 text-base bg-transparent hover:bg-white/10 text-foreground border-gray-700"
          >
            <Link href="mailto:mis@rdrealty.com.ph">
              Contact MIS Department
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
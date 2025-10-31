// nav-user.tsx with theme toggle
"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  BadgeCheck,
  Bell,
  ChevronsUpDown,
  LogOut,
  Settings,
  User,
  Building,
  Moon,
  Sun,
} from "lucide-react"
import { signOut } from "next-auth/react"
import { useTheme } from "next-themes"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import { toast } from "sonner"

interface NavUserProps {
  user: {
    name: string
    email: string
    avatar: string
    employeeId: string
    position: string
    businessUnit: string
    role: string
    profilePicture?: string | null
  }
}

// Helper function to get user initials for avatar fallback
function getUserInitials(name: string): string {
  return name
    .split(' ')
    .map(part => part.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

export function NavUser({ user }: NavUserProps) {
  const { isMobile } = useSidebar()
  const { setTheme } = useTheme()
  const pathname = usePathname()
  const businessUnitId = pathname.split('/')[1]
  const [profileImageUrl, setProfileImageUrl] = React.useState<string | null>(null)
  const [mounted, setMounted] = React.useState(false)

  // Handle hydration
  React.useEffect(() => {
    setMounted(true)
  }, [])

  // Load profile picture on mount
  React.useEffect(() => {
    if (!mounted) return

    const loadProfilePicture = async () => {
      if (user.profilePicture) {
        try {
          const response = await fetch(`/api/profile-picture/${encodeURIComponent(user.profilePicture)}`);
          const result = await response.json();
          
          if (result.success && result.fileUrl) {
            setProfileImageUrl(result.fileUrl);
          }
        } catch (error) {
          console.error('Error loading profile picture in nav:', error);
        }
      }
    };

    loadProfilePicture();
  }, [user.profilePicture, mounted]);

  const handleSignOut = React.useCallback(async () => {
    try {
      await signOut({ 
        callbackUrl: '/auth/sign-in',
        redirect: true 
      })
    } catch (error) {
      toast.error(`Sign out error: ${error}`)
    }
  }, [])

  const userInitials = React.useMemo(() => getUserInitials(user.name), [user.name])
  const avatarSrc = mounted ? (profileImageUrl || user.avatar) : user.avatar

  // Don't render until mounted to prevent hydration issues
  if (!mounted) {
    return (
      <SidebarMenu>
        <SidebarMenuItem>
          <div className="flex items-center gap-2 px-2 py-1.5">
            <div className="h-8 w-8 rounded-lg bg-muted animate-pulse" />
            <div className="flex-1 space-y-1">
              <div className="h-4 bg-muted rounded animate-pulse" />
              <div className="h-3 bg-muted rounded animate-pulse w-3/4" />
            </div>
          </div>
        </SidebarMenuItem>
      </SidebarMenu>
    )
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <div className="h-8 w-8 rounded-lg overflow-hidden bg-muted/50 flex items-center justify-center">
                {avatarSrc ? (
                  <img 
                    src={avatarSrc} 
                    alt={user.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-medium">
                    {userInitials}
                  </div>
                )}
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{user.name}</span>
                <span className="truncate text-xs text-muted-foreground">
                  {user.employeeId} • {user.businessUnit}
                </span>
              </div>
              <ChevronsUpDown className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <div className="h-8 w-8 rounded-lg overflow-hidden bg-muted/50 flex items-center justify-center">
                  {avatarSrc ? (
                    <img 
                      src={avatarSrc} 
                      alt={user.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-medium">
                      {userInitials}
                    </div>
                  )}
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">{user.name}</span>
                  <span className="truncate text-xs text-muted-foreground">
                    {user.email}
                  </span>
                </div>
              </div>
            </DropdownMenuLabel>

            {/* Employee Info Section */}
            <DropdownMenuLabel className="px-2 py-1.5 text-xs text-muted-foreground">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <BadgeCheck className="h-3 w-3" />
                  <span>ID: {user.employeeId}</span>
                </div>
                {user.position && (
                  <div className="flex items-center gap-2">
                    <User className="h-3 w-3" />
                    <span>{user.position}</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Building className="h-3 w-3" />
                  <span>{user.businessUnit}</span>
                </div>
              </div>
            </DropdownMenuLabel>

            <DropdownMenuSeparator />

            <DropdownMenuGroup>
              <DropdownMenuItem asChild>
                <Link href={`/${businessUnitId}/profile`}>
                  <User className="mr-2 h-4 w-4" />
                  <span>Profile</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Settings className="mr-2 h-4 w-4" />
                <span>Settings</span>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Bell className="mr-2 h-4 w-4" />
                <span>Notifications</span>
              </DropdownMenuItem>
            </DropdownMenuGroup>

            <DropdownMenuSeparator />

            {/* Theme Toggle Section */}
            <DropdownMenuGroup>
              <DropdownMenuLabel className="text-xs text-muted-foreground">
                Theme
              </DropdownMenuLabel>
              <DropdownMenuItem onClick={() => setTheme("light")}>
                <Sun className="mr-2 h-4 w-4" />
                <span>Light</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme("dark")}>
                <Moon className="mr-2 h-4 w-4" />
                <span>Dark</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme("system")}>
                <Settings className="mr-2 h-4 w-4" />
                <span>System</span>
              </DropdownMenuItem>
            </DropdownMenuGroup>

            <DropdownMenuSeparator />

            <DropdownMenuItem onClick={handleSignOut}>
              <LogOut className="mr-2 h-4 w-4" />
              <span>Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
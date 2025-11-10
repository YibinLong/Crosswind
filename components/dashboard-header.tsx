"use client"

import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Bell, Plus, Plane } from "lucide-react"
import Link from "next/link"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useAuth } from "@/lib/authContext"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { BookFlightDialog } from "@/components/book-flight-dialog"
import { useState } from "react"

export function DashboardHeader() {
  const { user } = useAuth()
  const router = useRouter()
  const [bookFlightOpen, setBookFlightOpen] = useState(false)

  const handleLogout = async () => {
    try {
      // Clear auth context and redirect to login
      // Note: You'll need to implement logout in auth context
      router.push("/login")
      toast.success("Logged out successfully")
    } catch (error) {
      toast.error("Failed to log out")
    }
  }
  return (
    <>
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-blue-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2">
              <Plane className="h-8 w-8 text-blue-600" />
              <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                Crosswind
              </span>
            </Link>

            {/* Navigation */}
            <nav className="hidden md:flex items-center gap-6">
              <Link href="/dashboard" className="text-slate-900 font-semibold">
                Dashboard
              </Link>
              <Link href="/flights" className="text-slate-600 hover:text-blue-600 transition-colors font-medium">
                Flights
              </Link>
              <Link href="/analytics" className="text-slate-600 hover:text-blue-600 transition-colors font-medium">
                Analytics
              </Link>
            </nav>

            {/* Actions */}
            <div className="flex items-center gap-4">
              <Button
                className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 gap-2 shadow-lg shadow-blue-200"
                onClick={() => setBookFlightOpen(true)}
              >
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">Book Flight</span>
              </Button>

              <Link href="/flights?filter=conflicts">
                <Button variant="ghost" size="icon" className="relative hover:bg-blue-50">
                  <Bell className="h-5 w-5 text-slate-700" />
                  <span className="absolute top-1 right-1 h-2 w-2 bg-red-500 rounded-full" title="Weather conflicts detected" />
                </Button>
              </Link>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-10 w-10 rounded-full hover:bg-blue-50">
                    <Avatar>
                      <AvatarImage src="/placeholder.svg?height=40&width=40" />
                      <AvatarFallback className="bg-blue-600 text-white">
                        {user?.name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56 bg-white border-blue-200 shadow-xl" align="end">
                  <DropdownMenuLabel className="text-slate-900">
                    {user?.name || 'User'}
                    {user?.email && (
                      <div className="text-xs text-slate-500 font-normal">{user.email}</div>
                    )}
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator className="bg-blue-200" />
                  <DropdownMenuItem className="text-slate-700 hover:bg-blue-50">
                    <Link href="/profile" className="w-full">Profile</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem className="text-slate-700 hover:bg-blue-50">
                    <Link href="/settings" className="w-full">Settings</Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-blue-200" />
                  <DropdownMenuItem
                    className="text-slate-700 hover:bg-blue-50 cursor-pointer"
                    onClick={handleLogout}
                  >
                    Log out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </header>

      <BookFlightDialog
        open={bookFlightOpen}
        onOpenChange={setBookFlightOpen}
      />
    </>
  )
}

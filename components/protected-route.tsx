"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/authContext"
import { Plane } from "lucide-react"

interface ProtectedRouteProps {
  children: React.ReactNode
  requiredRole?: string[]
}

export function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [isChecking, setIsChecking] = useState(true)

  useEffect(() => {
    const checkAuth = async () => {
      // If still loading auth context, wait
      if (loading) return

      // If no user, redirect to login
      if (!user) {
        router.push("/login")
        return
      }

      // If specific roles are required, check them
      if (requiredRole && requiredRole.length > 0) {
        const hasRequiredRole = requiredRole.includes(user.role)
        if (!hasRequiredRole) {
          router.push("/unauthorized")
          return
        }
      }

      setIsChecking(false)
    }

    checkAuth()
  }, [user, loading, router, requiredRole])

  // Show loading spinner while checking authentication
  if (loading || isChecking) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-cyan-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="mb-8">
            <Plane className="h-12 w-12 text-blue-600 animate-pulse" />
          </div>
          <div className="text-xl text-slate-600 font-medium">Loading...</div>
          <div className="text-sm text-slate-500 mt-2">Please wait while we verify your access</div>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
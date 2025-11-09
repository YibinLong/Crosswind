import { NextRequest, NextResponse } from 'next/server'
import { verifyToken, getUserById } from '../auth'

/**
 * Middleware to verify JWT token and attach user to request
 */
export async function authenticate(req: NextRequest) {
  const authHeader = req.headers.get('authorization')

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return NextResponse.json(
      { error: 'Authentication required. No token provided.' },
      { status: 401 }
    )
  }

  const token = authHeader.substring(7) // Remove 'Bearer ' prefix

  const payload = verifyToken(token)
  if (!payload) {
    return NextResponse.json(
      { error: 'Invalid or expired token.' },
      { status: 401 }
    )
  }

  const user = await getUserById(payload.userId)
  if (!user) {
    return NextResponse.json(
      { error: 'User not found.' },
      { status: 401 }
    )
  }

  // Attach user to request for use in route handlers
  ;(req as any).user = user
  return null // No error, authentication successful
}

/**
 * Higher-order function to protect API routes
 */
export function withAuth(handler: (req: NextRequest, ...args: any[]) => Promise<NextResponse>) {
  return async (req: NextRequest, ...args: any[]) => {
    const authError = await authenticate(req)
    if (authError) return authError

    return handler(req, ...args)
  }
}

/**
 * Check if user has required role
 */
export function hasRole(user: any, requiredRole: string): boolean {
  if (!user) return false

  const roleHierarchy = {
    'ADMIN': 3,
    'INSTRUCTOR': 2,
    'STUDENT': 1
  }

  const userRoleLevel = roleHierarchy[user.role as keyof typeof roleHierarchy] || 0
  const requiredRoleLevel = roleHierarchy[requiredRole as keyof typeof roleHierarchy] || 0

  return userRoleLevel >= requiredRoleLevel
}

/**
 * Middleware for role-based access control
 */
export function requireRole(requiredRole: string) {
  return (handler: (req: NextRequest, ...args: any[]) => Promise<NextResponse>) => {
    return async (req: NextRequest, ...args: any[]) => {
      const authError = await authenticate(req)
      if (authError) return authError

      const user = (req as any).user
      if (!hasRole(user, requiredRole)) {
        return NextResponse.json(
          { error: `Access denied. Required role: ${requiredRole}` },
          { status: 403 }
        )
      }

      return handler(req, ...args)
    }
  }
}
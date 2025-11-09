import { NextRequest, NextResponse } from 'next/server'
import { verifyToken, getUserById } from '../auth'

/**
 * Middleware to verify JWT token and attach user to request
 */
export async function authenticate(req: NextRequest) {
  console.log('🔍 [AUTH DEBUG] Authentication middleware started')

  const authHeader = req.headers.get('authorization')
  console.log('🔍 [AUTH DEBUG] Authorization header:', authHeader ? `Bearer ${authHeader.substring(7, 27)}...` : 'NOT FOUND')

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    console.log('🔍 [AUTH DEBUG] No valid Bearer token found - returning 401')
    return NextResponse.json(
      {
        error: 'Authentication required. No token provided.',
        debug: {
          hasAuthHeader: !!authHeader,
          authHeaderPrefix: authHeader?.substring(0, 10) || null
        }
      },
      { status: 401 }
    )
  }

  const token = authHeader.substring(7) // Remove 'Bearer ' prefix
  console.log('🔍 [AUTH DEBUG] Extracted token length:', token.length)

  const payload = verifyToken(token)
  console.log('🔍 [AUTH DEBUG] Token verification result:', !!payload)

  if (!payload) {
    console.log('🔍 [AUTH DEBUG] Token verification failed - returning 401')
    return NextResponse.json(
      {
        error: 'Invalid or expired token.',
        debug: {
          tokenLength: token.length,
          tokenPrefix: token.substring(0, 10)
        }
      },
      { status: 401 }
    )
  }

  console.log('🔍 [AUTH DEBUG] Token payload:', { userId: payload.userId, email: payload.email })

  const user = await getUserById(payload.userId)
  console.log('🔍 [AUTH DEBUG] Retrieved user:', user ? {
    id: user.id,
    email: user.email,
    role: (user as any).role
  } : 'NOT FOUND')

  if (!user) {
    console.log('🔍 [AUTH DEBUG] User not found in database - returning 401')
    return NextResponse.json(
      {
        error: 'User not found.',
        debug: {
          tokenUserId: payload.userId
        }
      },
      { status: 401 }
    )
  }

  // Attach user to request for use in route handlers
  // Normalize role to lowercase to avoid case-sensitivity bugs across routes
  const userRole = (user as any).role ? String((user as any).role).toLowerCase() : undefined
  console.log('🔍 [AUTH DEBUG] Normalized user role:', userRole)

  ;(req as any).user = {
    ...user,
    role: userRole,
  }

  console.log('🔍 [AUTH DEBUG] Authentication successful - user attached to request')
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

  // Make role checks case-insensitive by normalizing to uppercase internally
  const roleHierarchy = {
    'ADMIN': 3,
    'INSTRUCTOR': 2,
    'STUDENT': 1
  }

  const userRoleLevel = roleHierarchy[String(user.role || '').toUpperCase() as keyof typeof roleHierarchy] || 0
  const requiredRoleLevel = roleHierarchy[String(requiredRole || '').toUpperCase() as keyof typeof roleHierarchy] || 0

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
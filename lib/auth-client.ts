export interface AuthUser {
  id: number
  email: string
  role: string
}

export interface JWTPayload {
  userId: number
  email: string
  role: string
}

/**
 * Verify a JWT token on the client side (without bcrypt)
 * This is a simplified verification for client-side use only
 * The actual verification happens on the server side
 */
export function verifyToken(token: string): JWTPayload | null {
  try {
    // Split the token and decode the payload
    const parts = token.split('.')
    if (parts.length !== 3) return null

    const payload = parts[1]
    const decoded = JSON.parse(atob(payload))

    // Check if token is expired
    if (decoded.exp && decoded.exp < Date.now() / 1000) {
      return null
    }

    return {
      userId: decoded.userId,
      email: decoded.email,
      role: decoded.role
    }
  } catch (error) {
    console.error('Token verification failed:', error)
    return null
  }
}
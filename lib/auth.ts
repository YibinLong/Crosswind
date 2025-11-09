import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import { prisma } from './prisma'

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-change-in-production'
const JWT_EXPIRES_IN = '24h'

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
 * Hash a password using bcrypt
 */
export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 12
  return bcrypt.hash(password, saltRounds)
}

/**
 * Compare a password with a hashed password
 */
export async function comparePassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword)
}

/**
 * Generate a JWT token for a user
 */
export function generateToken(user: AuthUser): string {
  const payload: JWTPayload = {
    userId: user.id,
    email: user.email,
    role: user.role
  }

  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN })
}

/**
 * Verify a JWT token and return the payload
 */
export function verifyToken(token: string): JWTPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload
    return decoded
  } catch (error) {
    console.error('JWT verification failed:', error)
    return null
  }
}

/**
 * Get user from database by email
 */
export async function getUserByEmail(email: string) {
  return prisma.user.findUnique({
    where: { email },
    include: {
      student: true
    }
  })
}

/**
 * Get user from database by ID
 */
export async function getUserById(id: number) {
  return prisma.user.findUnique({
    where: { id },
    include: {
      student: true
    }
  })
}

/**
 * Create a new user with associated student profile
 */
export async function createUser(email: string, password: string, name: string) {
  const hashedPassword = await hashPassword(password)

  const user = await prisma.user.create({
    data: {
      email,
      password: hashedPassword,
      name,
      role: 'STUDENT',
      student: {
        create: {
          name,
          email,
          phone: null,
          trainingLevel: 'PRIVATE'
        }
      }
    },
    include: {
      student: true
    }
  })

  return user
}
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getUserByEmail, createUser, generateToken } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// Simple validation schema
const testSignupSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters long'),
  name: z.string().min(2, 'Name must be at least 2 characters long'),
})

export async function POST(req: NextRequest) {
  try {
    console.log('🧪 Test signup API called')

    const body = await req.json()
    console.log('🧪 Request body:', { ...body, password: '[REDACTED]' })

    // Validate input
    const validation = testSignupSchema.safeParse(body)
    if (!validation.success) {
      console.log('🧪 Validation failed:', validation.error.errors)
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: validation.error.errors
        },
        { status: 400 }
      )
    }

    const { email, password, name } = validation.data
    console.log('🧪 Validated input:', { email, name })

    // Check if user already exists
    const existingUser = await getUserByEmail(email)
    if (existingUser) {
      console.log('🧪 User already exists:', email)
      return NextResponse.json(
        {
          error: 'User with this email already exists',
        },
        { status: 409 }
      )
    }

    console.log('🧪 Creating new user...')

    // Create new user WITHOUT sample data generation
    const user = await createUser(email, password, name, 'PRIVATE', 'STUDENT')
    console.log('🧪 User created:', { id: user.id, email: user.email, role: user.role })

    // Generate JWT token
    const token = generateToken({
      id: user.id,
      email: user.email,
      role: user.role
    })
    console.log('🧪 Token generated successfully')

    // Return user data (without password) and token
    const { password: _, ...userWithoutPassword } = user

    const response = {
      message: 'Test user created successfully (no sample data)',
      user: userWithoutPassword,
      token,
    }

    console.log('🧪 Returning response:', { ...response, token: '[REDACTED]' })

    return NextResponse.json(response, { status: 201 })

  } catch (error) {
    console.error('🧪 Test signup error:', error)
    return NextResponse.json(
      {
        error: 'Internal server error during test signup',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// Handle other HTTP methods
export async function GET() {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  )
}
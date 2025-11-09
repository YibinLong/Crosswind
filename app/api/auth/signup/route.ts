import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getUserByEmail, createUser, generateToken } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { generateSampleDataForStudent } from '@/lib/sampleDataGenerator'

// Validation schema for signup
const signupSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters long'),
  name: z.string().min(2, 'Name must be at least 2 characters long'),
  trainingLevel: z.enum(['student-pilot', 'private-pilot', 'instrument-rated', 'commercial-pilot', 'instructor']).default('student-pilot')
})

// Map frontend training levels to database values
const mapTrainingLevel = (level: string): string => {
  switch (level) {
    case 'student-pilot':
      return 'STUDENT'
    case 'private-pilot':
      return 'PRIVATE'
    case 'instrument-rated':
      return 'INSTRUMENT'
    case 'commercial-pilot':
      return 'COMMERCIAL'
    case 'instructor':
      return 'INSTRUCTOR'
    default:
      return 'STUDENT'
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    // Validate input
    const validation = signupSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: validation.error.errors
        },
        { status: 400 }
      )
    }

    const { email, password, name, trainingLevel } = validation.data

    // Check if user already exists
    const existingUser = await getUserByEmail(email)
    if (existingUser) {
      console.log(`🔍 [SIGNUP DEBUG] User already exists: ${email}, role: ${existingUser.role}`)
      return NextResponse.json(
        {
          error: 'User with this email already exists',
          details: {
            email,
            existingRole: existingUser.role,
            suggestion: 'Try logging in instead of creating a new account'
          }
        },
        { status: 409 }
      )
    }

    // Map training level for database and user role
    const dbTrainingLevel = mapTrainingLevel(trainingLevel)
    const userRole = trainingLevel === 'instructor' ? 'INSTRUCTOR' : 'STUDENT'

    // Create new user
    const user = await createUser(email, password, name, dbTrainingLevel, userRole)

    // Generate sample data for new students (4 flights, 3 alerts)
    let sampleDataInfo = null
    if (userRole === 'STUDENT' && user.student) {
      try {
        sampleDataInfo = await generateSampleDataForStudent(
          user.student.id,
          user.student.email,
          user.student.name
        )
        console.log(`🎉 Generated sample data for new student: ${user.student.name}`)
      } catch (error) {
        console.error('⚠️ Failed to generate sample data for new student:', error)
        // Don't fail the signup if sample data generation fails
      }
    }

    // Generate JWT token
    const token = generateToken({
      id: user.id,
      email: user.email,
      role: user.role
    })

    // Return user data (without password) and token
    const { password: _, ...userWithoutPassword } = user

    return NextResponse.json({
      message: 'User created successfully',
      user: userWithoutPassword,
      token,
      sampleData: sampleDataInfo
    }, { status: 201 })

  } catch (error) {
    console.error('Signup error:', error)
    return NextResponse.json(
      { error: 'Internal server error during signup' },
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
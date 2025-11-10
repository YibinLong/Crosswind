export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

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

// Basic CORS headers to satisfy potential preflight requests in some prod setups
const corsHeaders: Record<string, string> = {
  'Access-Control-Allow-Origin': process.env.NEXT_PUBLIC_SITE_URL || '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

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
  const startTime = Date.now()
  const timestamp = new Date().toISOString()

  console.log(`🚀 [SIGNUP POST] ${timestamp} - Starting signup process`)
  console.log(`🔍 [SIGNUP DEBUG] Request headers:`, Object.fromEntries(req.headers.entries()))

  try {
    const body = await req.json()
    console.log(`📥 [SIGNUP DEBUG] Request body:`, {
      email: body.email,
      passwordLength: body.password?.length,
      name: body.name,
      trainingLevel: body.trainingLevel
    })

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

    const endTime = Date.now()
    const duration = endTime - startTime
    console.log(`✅ [SIGNUP SUCCESS] User created in ${duration}ms - ${email} (${userRole})`)

    const response = NextResponse.json({
      message: 'User created successfully',
      user: userWithoutPassword,
      token,
      sampleData: sampleDataInfo,
      debugInfo: {
        timestamp,
        duration: `${duration}ms`,
        role: userRole,
        hasSampleData: !!sampleDataInfo
      }
    }, { status: 201 })
    // Add CORS headers (harmless for same-origin, fixes strict environments)
    Object.entries(corsHeaders).forEach(([k, v]) => response.headers.set(k, v))
    return response

  } catch (error) {
    const endTime = Date.now()
    const duration = endTime - startTime
    console.error(`❌ [SIGNUP ERROR] Failed after ${duration}ms:`, error)

    // Enhanced error logging
    if (error instanceof Error) {
      console.error(`🔍 [SIGNUP ERROR] Details:`, {
        name: error.name,
        message: error.message,
        stack: error.stack
      })
    }

    // Try to get request body for debugging even if parsing failed
    let requestBodyInfo = 'Unable to log body'
    try {
      const clonedReq = req.clone()
      requestBodyInfo = await clonedReq.text()
    } catch (bodyError) {
      console.error('Could not log request body:', bodyError)
    }

    console.error(`📄 [SIGNUP ERROR] Request body (attempted):`, requestBodyInfo.substring(0, 500))

    return NextResponse.json(
      {
        error: 'Internal server error during signup',
        debugInfo: {
          timestamp,
          duration: `${duration}ms`,
          errorType: error?.constructor?.name || 'Unknown',
          errorMessage: error instanceof Error ? error.message : 'Unknown error'
        }
      },
      { status: 500 }
    )
  }
}

// Handle other HTTP methods with detailed debugging
export async function GET(req: NextRequest) {
  const timestamp = new Date().toISOString()
  const url = req.url
  const method = req.method
  const userAgent = req.headers.get('user-agent')
  const referer = req.headers.get('referer')
  const origin = req.headers.get('origin')

  console.log(`🚨 [SIGNUP 405 ERROR] ${timestamp}`)
  console.log(`📍 URL: ${url}`)
  console.log(`🔧 Method: ${method}`)
  console.log(`🌐 Origin: ${origin}`)
  console.log(`📄 Referer: ${referer}`)
  console.log(`👤 User-Agent: ${userAgent}`)
  console.log(`🔍 Headers:`, Object.fromEntries(req.headers.entries()))

  return NextResponse.json({
    error: 'Method not allowed - Use POST for signup',
    debugInfo: {
      timestamp,
      method,
      url,
      userAgent,
      origin,
      referer,
      allowedMethods: ['POST'],
      correctUsage: {
        method: 'POST',
        contentType: 'application/json',
        body: {
          email: 'string',
          password: 'string',
          name: 'string',
          trainingLevel: 'string (optional)'
        }
      }
    }
  }, {
    status: 405,
    headers: {
      'Allow': 'POST, OPTIONS',
      ...corsHeaders,
    }
  })
}

// Handle all other HTTP methods
export async function PUT(req: NextRequest) {
  const timestamp = new Date().toISOString()
  console.log(`🚨 [SIGNUP 405 ERROR] PUT request received at ${timestamp}`)
  console.log(`📄 Body:`, await req.text())

  return NextResponse.json({
    error: 'Method not allowed - Use POST for signup',
    debugInfo: { timestamp, method: 'PUT' }
  }, { status: 405 })
}

export async function DELETE(req: NextRequest) {
  const timestamp = new Date().toISOString()
  console.log(`🚨 [SIGNUP 405 ERROR] DELETE request received at ${timestamp}`)

  return NextResponse.json({
    error: 'Method not allowed - Use POST for signup',
    debugInfo: { timestamp, method: 'DELETE' }
  }, { status: 405 })
}

export async function PATCH(req: NextRequest) {
  const timestamp = new Date().toISOString()
  console.log(`🚨 [SIGNUP 405 ERROR] PATCH request received at ${timestamp}`)

  return NextResponse.json({
    error: 'Method not allowed - Use POST for signup',
    debugInfo: { timestamp, method: 'PATCH' }
  }, { status: 405 })
}

// Explicitly handle OPTIONS for CORS/preflight in production environments
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      ...corsHeaders,
    },
  })
}
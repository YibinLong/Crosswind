import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const envVars = {
      DATABASE_URL: process.env.DATABASE_URL ? 'SET' : 'MISSING',
      JWT_SECRET: process.env.JWT_SECRET ? 'SET' : 'MISSING',
      WEATHER_API_KEY: process.env.WEATHER_API_KEY ? 'SET' : 'MISSING',
      OPENAI_API_KEY: process.env.OPENAI_API_KEY ? 'SET' : 'MISSING',
      EMAIL_USER: process.env.EMAIL_USER ? 'SET' : 'MISSING',
      EMAIL_PASS: process.env.EMAIL_PASS ? 'SET' : 'MISSING',
      EMAIL_SMTP_SERVER: process.env.EMAIL_SMTP_SERVER ? 'SET' : 'MISSING',
      EMAIL_SMTP_PORT: process.env.EMAIL_SMTP_PORT ? 'SET' : 'MISSING',
      NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET ? 'SET' : 'MISSING',
      NODE_ENV: process.env.NODE_ENV,
    }

    return NextResponse.json({
      message: 'Environment variables check',
      envVars,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    return NextResponse.json({
      error: 'Failed to check environment variables',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
import { NextRequest, NextResponse } from 'next/server'
import { runAlertsJob } from '@/lib/notifications'
import { logger } from '@/lib/logger'

export async function POST(req: NextRequest) {
  try {
    // Optional protection via secret header for hosted crons
    const configuredSecret = process.env.CRON_SECRET
    if (configuredSecret) {
      const provided = req.headers.get('x-cron-secret')
      if (!provided || provided !== configuredSecret) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
    }

    const startedAt = Date.now()
    const result = await runAlertsJob()
    const durationMs = Date.now() - startedAt

    return NextResponse.json({
      ok: true,
      startedAt: new Date(startedAt).toISOString(),
      durationMs,
      result
    })
  } catch (error) {
    logger.error('Cron run failed', {
      error: error instanceof Error ? error.message : 'Unknown error'
    })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}






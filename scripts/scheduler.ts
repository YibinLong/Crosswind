import 'dotenv/config'
import cron from 'node-cron'
import { runAlertsJob } from '../lib/notifications'
import { logger } from '../lib/logger'

async function runOnce() {
  try {
    logger.info('Scheduler: running alerts job now')
    const result = await runAlertsJob()
    logger.info('Scheduler: job finished', {
      totalBookings: result.totalBookings,
      bookingsChecked: result.bookingsChecked,
      conflictsDetected: result.conflictsDetected,
      executionTimeMs: result.executionTime
    })
  } catch (error) {
    logger.error('Scheduler: job failed', {
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}

// Run immediately on startup (useful for local testing)
runOnce()

// Schedule to run at the top of every hour
cron.schedule('0 * * * *', async () => {
  logger.info('Scheduler: hourly tick - starting job')
  await runOnce()
})

logger.info('Scheduler started. Next run at the top of the hour.')






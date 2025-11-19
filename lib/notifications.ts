import { logger } from './logger'
import { weatherMonitorService } from './services/weatherMonitor'

/**
 * Runs the alerts job:
 * - Checks upcoming bookings
 * - Generates/updates weather reports
 * - Updates booking status to 'conflict' when unsafe
 * - Sends notification emails via the notification service
 */
export async function runAlertsJob() {
  logger.info('Alerts job started')
  const result = await weatherMonitorService.checkAllUpcomingBookings()
  logger.info('Alerts job completed', {
    totalBookings: result.totalBookings,
    bookingsChecked: result.bookingsChecked,
    conflictsDetected: result.conflictsDetected,
    executionTimeMs: result.executionTime
  })
  return result
}







"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { AlertTriangle, Cloud, Wind, CloudRain, RefreshCw, Loader2 } from "lucide-react"
import { useEffect, useState } from "react"
import { api, Booking } from "@/lib/api"
import { RescheduleDialog } from "./reschedule-dialog"
import { REFRESH_INTERVALS } from "@/lib/config"
import {
  formatWeatherNumber,
  formatVisibility,
  formatCeiling,
  formatViolatedMinimums,
  formatAircraftLabel
} from "@/lib/utils"
import { FlightInfoGrid } from "./flight-info-grid"

interface Alert {
  id: number
  type: 'weather_conflict' | 'reminder'
  severity: 'high' | 'medium' | 'low'
  title: string
  message: string
  flight: {
    id: number
    student: {
      id: number
      name: string
      trainingLevel: string
      email?: string
    }
    instructor?: {
      id: number
      name: string
      email: string
    }
    aircraft?: {
      id: number
      tailNumber: string
      model: string
    }
    scheduledDate: string
    status: string
    departure?: {
      lat: number
      lon: number
    }
    arrival?: {
      lat: number
      lon: number
    }
  }
  weather?: {
    windKts: number
    windGustKts?: number
    visibility: number
    ceilingFt: number
    condition: string
    temperature?: number
    isSafe: boolean
    violatedMinimums: string[]
    reportTime: string
  }
  reschedule?: {
    availableOptions: number
    suggestions: Array<{
      id: number
      proposedDate: string
      proposedTime: string
      weatherSummary: string
      confidence: number
      reason: string
    }>
  }
  actions: Array<{
    label: string
    action: string
    url: string
  }>
  timestamp: string
  createdAt: string
}

interface AlertsResponse {
  success: boolean
  alerts: Alert[]
  summary: {
    totalAlerts: number
    conflictCount: number
    reminderCount: number
    pendingReschedules: number
    hasRescheduleOptions: boolean
  }
}

export function WeatherAlerts() {
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  const [summary, setSummary] = useState<AlertsResponse['summary'] | null>(null)
  const [rescheduleDialogOpen, setRescheduleDialogOpen] = useState(false)
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null)

  const fetchAlerts = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true)
      } else {
        setLoading(true)
      }
      setError(null)

      const response = await api.alerts.getAll({
        status: 'conflict',
        limit: 10
      })

      // The API client returns the response data directly
      if (response.data.success) {
        setAlerts(response.data.alerts)
        setSummary(response.data.summary)
      } else {
        throw new Error('Invalid response format')
      }
    } catch (err: any) {
      console.error('Error fetching alerts:', err)
      // Handle authentication errors specifically
      if (err.response?.status === 401) {
        setError('Authentication required. Please log in again.')
      } else {
        setError(err.response?.data?.error || err.message || 'Unknown error')
      }
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    fetchAlerts()

    // No auto-refresh - only manual refresh via button
  }, [rescheduleDialogOpen])

  const handleRefresh = () => {
    fetchAlerts(true)
  }

  const handleReschedule = (alert: Alert) => {
    setSelectedAlert(alert)
    setRescheduleDialogOpen(true)
  }

  const handleRescheduleSuccess = () => {
    setRescheduleDialogOpen(false)
    setSelectedAlert(null)
    fetchAlerts() // Refresh the alerts list
  }

  // Convert Alert to Booking for RescheduleDialog
  const alertToBooking = (alert: Alert): Booking => {
    const departureLat = alert.flight.departure?.lat ?? 0
    const departureLon = alert.flight.departure?.lon ?? 0
    const arrivalLat = alert.flight.arrival?.lat ?? departureLat
    const arrivalLon = alert.flight.arrival?.lon ?? departureLon

    return {
      id: alert.flight.id,
      studentId: alert.flight.student?.id || 0,
      instructorId: alert.flight.instructor?.id || 0,
      aircraftId: alert.flight.aircraft?.id || 0,
      scheduledDate: alert.flight.scheduledDate,
      departureLat,
      departureLon,
      arrivalLat,
      arrivalLon,
      status: alert.flight.status as Booking['status'],
      createdAt: alert.createdAt,
      updatedAt: alert.createdAt,
      student: alert.flight.student,
      instructor: alert.flight.instructor,
      aircraft: alert.flight.aircraft,
      weatherReports: alert.weather
        ? [{
            id: alert.id,
            windKts: alert.weather.windKts,
            windGustKts: alert.weather.windGustKts,
            visibility: alert.weather.visibility,
            ceilingFt: alert.weather.ceilingFt,
            condition: alert.weather.condition,
            temperature: alert.weather.temperature,
            isSafe: alert.weather.isSafe,
            violatedMinimums: alert.weather.violatedMinimums,
            createdAt: alert.weather.reportTime
          }]
        : [],
      rescheduleSuggestions: alert.reschedule?.suggestions?.map((suggestion) => ({
        ...suggestion,
        selected: false,
        createdAt: alert.createdAt
      })) || []
    }
  }

  const handleAction = (action: { url: string } | undefined) => {
    if (!action || !action.url) {
      console.warn('Action or action.url is undefined')
      return
    }

    if (action.url.startsWith('mailto:')) {
      window.location.href = action.url
    } else {
      window.location.href = action.url
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high':
        return 'bg-red-50 border-red-300'
      case 'medium':
        return 'bg-yellow-50 border-yellow-300'
      case 'low':
        return 'bg-blue-50 border-blue-300'
      default:
        return 'bg-gray-50 border-gray-300'
    }
  }

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'high':
        return <Wind className="h-4 w-4 text-red-600" />
      case 'medium':
        return <CloudRain className="h-4 w-4 text-yellow-600" />
      case 'low':
        return <Cloud className="h-4 w-4 text-blue-600" />
      default:
        return <AlertTriangle className="h-4 w-4 text-gray-600" />
    }
  }
  if (loading) {
    return (
      <Card className="bg-white border-blue-200 shadow-lg">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              <CardTitle className="text-slate-900">Active Weather Alerts</CardTitle>
              <Badge variant="destructive" className="ml-2 bg-red-100 text-red-700 border-red-300">
                <Loader2 className="h-3 w-3 animate-spin" />
              </Badge>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="border-blue-300 text-slate-700 hover:bg-blue-50 bg-transparent"
              disabled
            >
              <Loader2 className="h-3 w-3 animate-spin mr-2" />
              Loading...
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-slate-500">
            <Loader2 className="h-8 w-8 mx-auto mb-2 animate-spin" />
            <p>Loading weather alerts...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="bg-white border-red-200 shadow-lg">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              <CardTitle className="text-slate-900">Weather Alerts Error</CardTitle>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              className="border-blue-300 text-slate-700 hover:bg-blue-50 bg-transparent"
            >
              <RefreshCw className="h-3 w-3 mr-2" />
              Retry
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-red-500">
            <AlertTriangle className="h-8 w-8 mx-auto mb-2" />
            <p>Failed to load weather alerts</p>
            <p className="text-sm">{error}</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
    <Card className="bg-white border-blue-200 shadow-lg">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            <CardTitle className="text-slate-900">Active Weather Alerts</CardTitle>
            {summary && (
              <Badge variant="destructive" className="ml-2 bg-red-100 text-red-700 border-red-300">
                {summary.conflictCount} Conflict{summary.conflictCount !== 1 ? 's' : ''}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={refreshing || rescheduleDialogOpen}
              className="border-blue-300 text-slate-700 hover:bg-blue-50 bg-transparent"
            >
              <RefreshCw className={`h-3 w-3 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {alerts.length === 0 ? (
          <div className="text-center py-8 text-slate-500">
            <Cloud className="h-12 w-12 mx-auto mb-2 opacity-30" />
            <p>No active weather alerts</p>
            <p className="text-sm">All flights are clear for takeoff</p>
          </div>
        ) : (
          alerts.map((alert) => {
            const normalizedFlight = {
              ...alert.flight,
              departureLat: alert.flight.departure?.lat,
              departureLon: alert.flight.departure?.lon,
              arrivalLat: alert.flight.arrival?.lat,
              arrivalLon: alert.flight.arrival?.lon
            }

            return (
            <Alert
              key={alert.id}
              className={`border-2 ${getSeverityColor(alert.severity)}`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <AlertTitle className="text-slate-900 flex items-center gap-2 mb-2">
                    {getSeverityIcon(alert.severity)}
                    {alert.title}
                  </AlertTitle>
                  <AlertDescription className="text-slate-700 space-y-2">
                    <div className="mb-3">
                      <FlightInfoGrid flight={normalizedFlight} />
                    </div>

                    {alert.weather && (
                      <div className="flex items-start gap-2 pt-2 border-t border-slate-300">
                        <AlertTriangle
                          className={`h-4 w-4 mt-0.5 ${alert.severity === "high" ? "text-red-600" : "text-yellow-600"}`}
                        />
                        <div>
                          <p className="font-medium text-slate-900">
                            {formatWeatherNumber(alert.weather.windKts)} kt wind{alert.weather.windGustKts ? ` gusting to ${formatWeatherNumber(alert.weather.windGustKts)} kt` : ''}
                          </p>
                          <p className="text-xs text-slate-500">
                            Visibility: {formatVisibility(alert.weather.visibility)} • Ceiling: {formatCeiling(alert.weather.ceilingFt)}
                          </p>
                          {alert.weather.violatedMinimums.length > 0 && (
                            <p className="text-xs text-red-600">
                              Violated Minimums: {formatViolatedMinimums(alert.weather.violatedMinimums)}
                            </p>
                          )}
                        </div>
                      </div>
                    )}

                    <div className="flex gap-2 pt-3">
                      {alert.reschedule?.availableOptions ? (
                        <Button
                          size="sm"
                          onClick={() => handleReschedule(alert)}
                          className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 shadow-lg shadow-blue-200"
                          data-testid={`alert-reschedule-button-${alert.id}`}
                        >
                          AI Reschedule ({alert.reschedule.availableOptions} options)
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          onClick={() => handleReschedule(alert)}
                          className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 shadow-lg shadow-blue-200"
                          data-testid={`alert-reschedule-button-${alert.id}`}
                        >
                          AI Reschedule
                        </Button>
                      )}
                      {alert.flight.instructor && alert.actions && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleAction(alert.actions?.find(a => a.action === 'contact_instructor'))}
                          className="text-slate-600 hover:bg-slate-100"
                        >
                          Contact Instructor
                        </Button>
                      )}
                    </div>
                  </AlertDescription>
                </div>
              </div>
            </Alert>
          )})
        )}

        </CardContent>
    </Card>

    <RescheduleDialog
      open={rescheduleDialogOpen}
      onOpenChange={setRescheduleDialogOpen}
      flight={selectedAlert ? alertToBooking(selectedAlert) : null}
      onSuccess={handleRescheduleSuccess}
    />
  </>
)
}

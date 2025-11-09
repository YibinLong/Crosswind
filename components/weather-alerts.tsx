import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { AlertTriangle, Cloud, Wind, CloudRain, RefreshCw, Loader2 } from "lucide-react"
import { useEffect, useState } from "react"

interface Alert {
  id: number
  type: 'weather_conflict' | 'reminder'
  severity: 'high' | 'medium' | 'low'
  title: string
  message: string
  flight: {
    id: number
    student: {
      name: string
      trainingLevel: string
    }
    instructor?: {
      name: string
      email: string
    }
    aircraft: {
      tailNumber: string
      model: string
    }
    scheduledDate: string
    status: string
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

  const fetchAlerts = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true)
      } else {
        setLoading(true)
      }
      setError(null)

      const response = await fetch('/api/alerts?status=conflict&limit=10')

      if (!response.ok) {
        throw new Error('Failed to fetch alerts')
      }

      const data: AlertsResponse = await response.json()

      if (data.success) {
        setAlerts(data.alerts)
        setSummary(data.summary)
      } else {
        throw new Error('Invalid response format')
      }
    } catch (err) {
      console.error('Error fetching alerts:', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    fetchAlerts()

    // Set up polling for real-time updates (every 30 seconds)
    const interval = setInterval(() => {
      fetchAlerts()
    }, 30000)

    return () => clearInterval(interval)
  }, [])

  const handleRefresh = () => {
    fetchAlerts(true)
  }

  const formatScheduledTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const hoursUntil = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60))

    if (hoursUntil < 24) {
      return date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      })
    } else {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      })
    }
  }

  const handleAction = (action: { url: string }) => {
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
              disabled={refreshing}
              className="border-blue-300 text-slate-700 hover:bg-blue-50 bg-transparent"
            >
              <RefreshCw className={`h-3 w-3 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="border-blue-300 text-slate-700 hover:bg-blue-50 bg-transparent"
              onClick={() => window.location.href = '/dashboard/flights'}
            >
              View All
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
          alerts.map((alert) => (
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
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-slate-500">Student:</span>
                        <span className="ml-2 font-medium text-slate-900">{alert.flight.student.name}</span>
                      </div>
                      <div>
                        <span className="text-slate-500">Scheduled:</span>
                        <span className="ml-2 font-medium text-slate-900">{formatScheduledTime(alert.flight.scheduledDate)}</span>
                      </div>
                      <div>
                        <span className="text-slate-500">Aircraft:</span>
                        <span className="ml-2 font-medium text-slate-900">{alert.flight.aircraft.tailNumber} ({alert.flight.aircraft.model})</span>
                      </div>
                      <div>
                        <span className="text-slate-500">Level:</span>
                        <span className="ml-2 font-medium text-slate-900">{alert.flight.student.trainingLevel}</span>
                      </div>
                    </div>

                    {alert.weather && (
                      <div className="flex items-start gap-2 pt-2 border-t border-slate-300">
                        <AlertTriangle
                          className={`h-4 w-4 mt-0.5 ${alert.severity === "high" ? "text-red-600" : "text-yellow-600"}`}
                        />
                        <div>
                          <p className="font-medium text-slate-900">
                            {alert.weather.windKts}kt wind{alert.weather.windGustKts ? ` gusting to ${alert.weather.windGustKts}kt` : ''}
                          </p>
                          <p className="text-xs text-slate-500">
                            Visibility: {alert.weather.visibility}mi • Ceiling: {alert.weather.ceilingFt}ft
                          </p>
                          {alert.weather.violatedMinimums.length > 0 && (
                            <p className="text-xs text-red-600">
                              Violated minimums: {alert.weather.violatedMinimums.join(', ')}
                            </p>
                          )}
                        </div>
                      </div>
                    )}

                    <div className="flex gap-2 pt-3">
                      {alert.reschedule?.availableOptions ? (
                        <Button
                          size="sm"
                          onClick={() => handleAction(alert.actions.find(a => a.action === 'view_reschedule')!)}
                          className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 shadow-lg shadow-blue-200"
                        >
                          AI Reschedule ({alert.reschedule.availableOptions} options)
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          onClick={() => handleAction(alert.actions.find(a => a.action === 'view_reschedule')!)}
                          className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 shadow-lg shadow-blue-200"
                        >
                          AI Reschedule
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleAction(alert.actions.find(a => a.action === 'view_details')!)}
                        className="border-blue-300 text-slate-700 hover:bg-blue-50 bg-transparent"
                      >
                        View Details
                      </Button>
                      {alert.flight.instructor && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleAction(alert.actions.find(a => a.action === 'contact_instructor')!)}
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
          ))
        )}

        {/* Summary stats at the bottom */}
        {summary && summary.hasRescheduleOptions && (
          <div className="mt-4 pt-4 border-t border-slate-200">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-600">
                {summary.pendingReschedules} flight{summary.pendingReschedules !== 1 ? 's' : ''} have AI reschedule options available
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.location.href = '/dashboard/flights?filter=pending_reschedule'}
                className="border-blue-300 text-blue-700 hover:bg-blue-50"
              >
                View All Options
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

'use client'

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { CheckCircle2, Clock, AlertCircle, Calendar, XCircle, Info } from "lucide-react"
import { useEffect, useState } from "react"
import { api, AuditLog } from "@/lib/api"
import { formatDistanceToNow } from "date-fns"

export function RecentActivity() {
  const [activities, setActivities] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchActivities()

    // Refresh every 3 minutes
    const interval = setInterval(fetchActivities, 3 * 60 * 1000)

    return () => clearInterval(interval)
  }, [])

  const fetchActivities = async () => {
    try {
      setError(null)
      const response = await api.activity.getRecent({ limit: 10 })
      // Handle different response format
      const data = Array.isArray(response.data) ? response.data : response.data.data || []
      setActivities(data)
    } catch (err: any) {
      console.error('Failed to fetch recent activity:', err)
      setError('Failed to load recent activity')
    } finally {
      setLoading(false)
    }
  }

  const getActivityIcon = (action: string) => {
    const actionLower = action.toLowerCase()

    if (actionLower.includes('complet') || actionLower.includes('success')) {
      return { icon: CheckCircle2, color: 'text-green-500' }
    } else if (actionLower.includes('cancel') || actionLower.includes('delete')) {
      return { icon: XCircle, color: 'text-red-500' }
    } else if (actionLower.includes('reschedule') || actionLower.includes('schedule')) {
      return { icon: Calendar, color: 'text-blue-500' }
    } else if (actionLower.includes('conflict') || actionLower.includes('alert') || actionLower.includes('weather')) {
      return { icon: AlertCircle, color: 'text-yellow-500' }
    } else if (actionLower.includes('create') || actionLower.includes('book')) {
      return { icon: Clock, color: 'text-cyan-500' }
    } else {
      return { icon: Info, color: 'text-gray-500' }
    }
  }

  const formatActivityMessage = (activity: AuditLog) => {
    const studentName = activity.booking?.student?.name || 'Unknown Student'
    const flightId = activity.bookingId ? `FL-${String(activity.bookingId).padStart(4, '0')}` : 'Unknown Flight'

    // Customize message based on action type
    if (activity.action.toLowerCase().includes('complet')) {
      return `Flight ${flightId} completed successfully for ${studentName}`
    } else if (activity.action.toLowerCase().includes('cancel')) {
      return `Flight ${flightId} cancelled for ${studentName}`
    } else if (activity.action.toLowerCase().includes('reschedule')) {
      return `Flight ${flightId} rescheduled for ${studentName}`
    } else if (activity.action.toLowerCase().includes('conflict')) {
      return `Weather conflict detected for ${flightId} - ${studentName}`
    } else if (activity.action.toLowerCase().includes('create') || activity.action.toLowerCase().includes('book')) {
      return `New flight booked: ${flightId} - ${studentName}`
    } else {
      return activity.details || `${activity.action} - ${flightId}`
    }
  }

  if (loading) {
    return (
      <Card className="bg-white border-blue-200 shadow-lg">
        <CardHeader>
          <CardTitle className="text-slate-900">Recent Activity</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-start gap-3">
              <Skeleton className="h-5 w-5 rounded" />
              <div className="flex-1">
                <Skeleton className="h-4 w-full mb-1" />
                <Skeleton className="h-3 w-20" />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-white border-blue-200 shadow-lg">
      <CardHeader>
        <CardTitle className="text-slate-900">Recent Activity</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {error ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-600 text-sm">{error}</p>
            <button
              onClick={fetchActivities}
              className="mt-2 text-sm text-red-700 underline hover:no-underline"
            >
              Try again
            </button>
          </div>
        ) : activities.length === 0 ? (
          <div className="text-center py-8">
            <Clock className="h-12 w-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500">No recent activity</p>
          </div>
        ) : (
          activities.map((activity) => {
            const { icon: Icon, color } = getActivityIcon(activity.action)

            return (
              <div key={activity.id} className="flex items-start gap-3">
                <div className={`mt-0.5 ${color}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-slate-700 leading-relaxed">
                    {formatActivityMessage(activity)}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    {formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true })}
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    by {activity.performedBy}
                  </p>
                </div>
              </div>
            )
          })
        )}
      </CardContent>
    </Card>
  )
}

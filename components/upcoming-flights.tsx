'use client'

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Calendar, MapPin, User, Clock, Plane, AlertTriangle } from "lucide-react"
import { useEffect, useState } from "react"
import { api, Booking } from "@/lib/api"
import { format } from "date-fns"
import { RescheduleDialog } from "./reschedule-dialog"
import { formatShortRoute } from "@/lib/utils"
import { REFRESH_INTERVALS } from "@/lib/config"

export function UpcomingFlights() {
  const [flights, setFlights] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [rescheduleDialogOpen, setRescheduleDialogOpen] = useState(false)
  const [selectedFlight, setSelectedFlight] = useState<Booking | null>(null)

  useEffect(() => {
    fetchFlights()

    // Refresh periodically
    const interval = setInterval(fetchFlights, REFRESH_INTERVALS.FLIGHTS_DATA)

    return () => clearInterval(interval)
  }, [])

  const fetchFlights = async () => {
    try {
      setError(null)
      const response = await api.bookings.getAll({
        upcoming: true,
        limit: 5
      })
      setFlights(response.data.bookings || response.data)
    } catch (err: any) {
      console.error('Failed to fetch upcoming flights:', err)
      setError('Failed to load upcoming flights')
    } finally {
      setLoading(false)
    }
  }

  
  const handleReschedule = (flight: Booking) => {
    setSelectedFlight(flight)
    setRescheduleDialogOpen(true)
  }

  const handleRescheduleSuccess = () => {
    setRescheduleDialogOpen(false)
    setSelectedFlight(null)
    fetchFlights() // Refresh the flights list
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const today = new Date()
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    if (date.toDateString() === today.toDateString()) {
      return `Today, ${format(date, 'h:mm a')}`
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return `Tomorrow, ${format(date, 'h:mm a')}`
    } else {
      return format(date, 'MMM d, h:mm a')
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 text-green-700 border-green-300'
      case 'conflict':
        return 'bg-red-100 text-red-700 border-red-300'
      case 'scheduled':
        return 'bg-blue-100 text-blue-700 border-blue-300'
      default:
        return 'bg-yellow-100 text-yellow-700 border-yellow-300'
    }
  }

  const hasWeatherConflict = (booking: Booking) => {
    return booking.status === 'conflict' &&
           booking.weatherReports &&
           booking.weatherReports.length > 0 &&
           !booking.weatherReports[0].isSafe
  }

  if (loading) {
    return (
      <Card className="bg-white border-blue-200 shadow-lg">
        <CardHeader>
          <CardTitle className="text-slate-900 flex items-center gap-2">
            <Calendar className="h-5 w-5 text-blue-600" />
            Upcoming Flights
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="p-4 rounded-lg bg-blue-50/50 border border-blue-200">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-10 w-10 rounded-lg" />
                  <div>
                    <Skeleton className="h-4 w-24 mb-1" />
                    <Skeleton className="h-3 w-32" />
                  </div>
                </div>
                <Skeleton className="h-6 w-16 rounded" />
              </div>
              <div className="grid grid-cols-2 gap-3 mb-4">
                {[1, 2, 3, 4].map((j) => (
                  <Skeleton key={j} className="h-4 w-full" />
                ))}
              </div>
              <div className="flex gap-2">
                <Skeleton className="h-8 flex-1" />
                <Skeleton className="h-8 w-24" />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card className="bg-white border-blue-200 shadow-lg">
        <CardHeader>
          <CardTitle className="text-slate-900 flex items-center gap-2">
            <Calendar className="h-5 w-5 text-blue-600" />
            Upcoming Flights
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {error ? (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-600 text-sm">{error}</p>
              <button
                onClick={fetchFlights}
                className="mt-2 text-sm text-red-700 underline hover:no-underline"
              >
                Try again
              </button>
            </div>
          ) : flights.length === 0 ? (
            <div className="text-center py-8">
              <Plane className="h-12 w-12 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500">No upcoming flights scheduled</p>
            </div>
          ) : (
            flights.map((flight) => (
              <div
                key={flight.id}
                className={`p-4 rounded-lg border transition-all ${
                  hasWeatherConflict(flight)
                    ? 'bg-red-50/50 border-red-200 hover:border-red-300'
                    : 'bg-blue-50/50 border-blue-200 hover:border-blue-300'
                } hover:shadow-md`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`h-10 w-10 rounded-lg flex items-center justify-center shadow-lg ${
                      hasWeatherConflict(flight)
                        ? 'bg-gradient-to-br from-red-600 to-orange-600 shadow-red-300/50'
                        : 'bg-gradient-to-br from-blue-600 to-cyan-600 shadow-blue-300/50'
                    }`}>
                      {hasWeatherConflict(flight) ? (
                        <AlertTriangle className="h-5 w-5 text-white" />
                      ) : (
                        <Plane className="h-5 w-5 text-white" />
                      )}
                    </div>
                    <div>
                      <p className="text-slate-900 font-semibold">FL-{String(flight.id).padStart(4, '0')}</p>
                      <p className="text-sm text-slate-600">{flight.student?.name || 'Unknown Student'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {hasWeatherConflict(flight) && (
                      <AlertTriangle className="h-4 w-4 text-red-500" />
                    )}
                    <Badge
                      variant="default"
                      className={getStatusColor(flight.status)}
                    >
                      {flight.status}
                    </Badge>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 text-sm mb-4">
                  <div className="flex items-center gap-2 text-slate-700">
                    <Clock className="h-4 w-4 text-slate-500" />
                    {formatDate(flight.scheduledDate)}
                  </div>
                  <div className="flex items-center gap-2 text-slate-700">
                    <MapPin className="h-4 w-4 text-slate-500" />
                    <span className="text-sm">
                      {formatShortRoute(flight.departureLat, flight.departureLon, flight.arrivalLat, flight.arrivalLon)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-700">
                    <User className="h-4 w-4 text-slate-500" />
                    {flight.instructor?.name || 'Unassigned'}
                  </div>
                  <div className="flex items-center gap-2 text-slate-700">
                    <Plane className="h-4 w-4 text-slate-500" />
                    {flight.aircraft?.tailNumber || 'Unassigned'}
                  </div>
                </div>

                {hasWeatherConflict(flight) && (
                  <div className="mb-4 p-2 bg-red-100 border border-red-200 rounded text-sm text-red-700">
                    <AlertTriangle className="h-3 w-3 inline mr-1" />
                    Weather conflict detected - needs rescheduling
                  </div>
                )}

                {flight.status === 'conflict' && (
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full border-red-300 text-red-700 hover:bg-red-50 bg-transparent"
                      onClick={() => handleReschedule(flight)}
                    >
                      Reschedule
                    </Button>
                  </div>
                )}
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <RescheduleDialog
        open={rescheduleDialogOpen}
        onOpenChange={setRescheduleDialogOpen}
        flight={selectedFlight}
        onSuccess={handleRescheduleSuccess}
      />
    </>
  )
}

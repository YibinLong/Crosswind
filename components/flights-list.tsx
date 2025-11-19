"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { Search, Plane, AlertTriangle, RefreshCw } from "lucide-react"
import { useState, useEffect } from "react"
import { RescheduleDialog } from "@/components/reschedule-dialog"
import { api, Booking } from "@/lib/api"
import { formatWeatherConflictMessage, formatAircraftLabel } from "@/lib/utils"
import { REFRESH_INTERVALS, PAGINATION } from "@/lib/config"
import { FlightInfoGrid } from "./flight-info-grid"

export function FlightsList() {
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [rescheduleOpen, setRescheduleOpen] = useState(false)
  const [selectedFlight, setSelectedFlight] = useState<Booking | null>(null)
  const [flights, setFlights] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)

  useEffect(() => {
    fetchFlights()
  }, [searchQuery, statusFilter, page])

  const fetchFlights = async () => {
    try {
      setError(null)
      setLoading(true)

      const params: any = {
        page,
        limit: PAGINATION.DEFAULT_LIMIT
      }

      if (searchQuery) {
        params.search = searchQuery
      }

      if (statusFilter !== 'all') {
        params.status = statusFilter
      }

      const response = await api.bookings.getAll(params)
      const responseData = response.data

      // Handle both paginated and direct array responses
      let flights: Booking[] = []
      if (Array.isArray(responseData)) {
        flights = responseData
      } else if (responseData.bookings) {
        flights = responseData.bookings
      } else if (responseData.data) {
        flights = responseData.data
      } else {
        flights = []
      }

      // Sort flights chronologically (earliest first) to ensure correct order
      flights = flights.sort((a, b) => {
        const dateA = new Date(a.scheduledDate)
        const dateB = new Date(b.scheduledDate)
        return dateA.getTime() - dateB.getTime()
      })

      setFlights(flights)

      // Calculate total pages if pagination info is available
      if (responseData.pagination) {
        setTotalPages(responseData.pagination.pages)
        setTotalCount(responseData.pagination.total)
      } else if (response.headers?.['x-total-count']) {
        const headerTotalCount = parseInt(response.headers['x-total-count'])
        setTotalPages(Math.ceil(headerTotalCount / 20))
        setTotalCount(headerTotalCount)
      } else if (Array.isArray(responseData)) {
        setTotalPages(Math.ceil(responseData.length / 20))
        setTotalCount(responseData.length)
      }

    } catch (err: any) {
      console.error('Failed to fetch flights:', err)
      setError('Failed to load flights')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await fetchFlights()
  }

  const handleReschedule = (flight: Booking) => {
    setSelectedFlight(flight)
    setRescheduleOpen(true)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 text-green-700 border-green-300'
      case 'conflict':
        return 'bg-red-100 text-red-700 border-red-300'
      case 'scheduled':
        return 'bg-blue-100 text-blue-700 border-blue-300'
      case 'cancelled':
        return 'bg-gray-100 text-gray-700 border-gray-300'
      case 'completed':
        return 'bg-emerald-100 text-emerald-700 border-emerald-300'
      default:
        return 'bg-yellow-100 text-yellow-700 border-yellow-300'
    }
  }

  const hasWeatherConflict = (booking: Booking) => {
    if (booking.status === 'conflict') {
      return true
    }
    return Boolean(
      booking.weatherReports &&
      booking.weatherReports.length > 0 &&
      booking.weatherReports.some(report => report && report.isSafe === false)
    )
  }

  const getWeatherConflictMessage = (booking: Booking) => {
    return formatWeatherConflictMessage(booking)
  }

  // Loading state
  if (loading && page === 1) {
    return (
      <Card className="bg-white border-blue-200 shadow-lg">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <CardTitle className="text-slate-900 flex items-center gap-2">
              <Plane className="h-6 w-6 text-blue-600" />
              All Flights
            </CardTitle>
            <div className="flex items-center gap-2">
              <Skeleton className="h-10 w-64" />
              <Skeleton className="h-10 w-10" />
              <Skeleton className="h-10 w-24" />
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="p-6 rounded-lg border-2 bg-blue-50/30 border-blue-200">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-4">
                  <Skeleton className="h-12 w-12 rounded-lg" />
                  <div>
                    <Skeleton className="h-6 w-24 mb-2" />
                    <Skeleton className="h-4 w-32" />
                  </div>
                </div>
                <Skeleton className="h-6 w-20 rounded" />
              </div>
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                {[1, 2, 3, 4].map((j) => (
                  <div key={j} className="flex items-center gap-2">
                    <Skeleton className="h-4 w-4" />
                    <div className="flex-1">
                      <Skeleton className="h-3 w-12 mb-1" />
                      <Skeleton className="h-4 w-20" />
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-between pt-4 border-t border-slate-300">
                <Skeleton className="h-4 w-48" />
                <div className="flex gap-2">
                  <Skeleton className="h-8 w-24" />
                  <Skeleton className="h-8 w-32" />
                </div>
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
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <CardTitle className="text-slate-900 flex items-center gap-2">
              <Plane className="h-6 w-6 text-blue-600" />
              All Flights ({flights.length})
            </CardTitle>
            <div className="flex items-center gap-2">
              <div className="relative flex-1 sm:w-64">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Search flights..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value)
                    setPage(1) // Reset page when searching
                  }}
                  className="pl-10 bg-white border-blue-200 text-slate-900"
                />
              </div>
              <Select value={statusFilter} onValueChange={(value) => {
                setStatusFilter(value)
                setPage(1) // Reset page when filtering
              }}>
                <SelectTrigger className="w-32 border-blue-300 text-slate-700 bg-white">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="confirmed">Confirmed</SelectItem>
                  <SelectItem value="conflict">Conflict</SelectItem>
                  <SelectItem value="scheduled">Scheduled</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                size="icon"
                className="border-blue-300 text-slate-700 hover:bg-blue-50 bg-transparent"
                onClick={handleRefresh}
                disabled={refreshing}
              >
                <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </div>
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
            <div className="text-center py-12">
              <Plane className="h-16 w-16 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500 text-lg">No flights found</p>
              <p className="text-slate-400 text-sm mt-2">
                {searchQuery || statusFilter !== 'all'
                  ? 'Try adjusting your search or filters'
                  : 'No flights scheduled'
                }
              </p>
            </div>
          ) : (
            <>
              {flights.map((flight) => (
                <div
                  key={flight.id}
                  className={`p-6 rounded-lg border-2 transition-all ${
                    hasWeatherConflict(flight)
                      ? "bg-red-50 border-red-300 hover:border-red-400 shadow-md"
                      : "bg-blue-50/30 border-blue-200 hover:border-blue-300 hover:shadow-md"
                  }`}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-4">
                      <div
                        className={`h-12 w-12 rounded-lg flex items-center justify-center shadow-lg ${
                          hasWeatherConflict(flight)
                            ? "bg-gradient-to-br from-red-600 to-orange-600 shadow-red-300/50"
                            : "bg-gradient-to-br from-blue-600 to-cyan-600 shadow-blue-300/50"
                        }`}
                      >
                        {hasWeatherConflict(flight) ? (
                          <AlertTriangle className="h-6 w-6 text-white" />
                        ) : (
                          <Plane className="h-6 w-6 text-white" />
                        )}
                      </div>
                      <div>
                        <p className="text-xl font-semibold text-slate-900">
                          FL-{String(flight.id).padStart(4, '0')}
                        </p>
                        <p className="text-sm text-slate-600">
                          {flight.student?.name || 'Unknown Student'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {hasWeatherConflict(flight) && (
                        <AlertTriangle className="h-4 w-4 text-red-500" />
                      )}
                      <Badge className={getStatusColor(flight.status)}>
                        {flight.status}
                      </Badge>
                    </div>
                  </div>

                  {hasWeatherConflict(flight) && (
                    <div className="mb-4 p-3 bg-red-100 border border-red-300 rounded-lg">
                      <p className="text-sm text-red-700 font-medium">
                        Weather Conflict:{' '}
                        {getWeatherConflictMessage(flight) || 'Weather conflict detected — awaiting detailed report.'}
                      </p>
                    </div>
                  )}

                  <div className="mb-4">
                    <FlightInfoGrid flight={flight} />
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-slate-300">
                    <div className="text-sm text-slate-600">
                      <span className="text-slate-900 font-medium">
                        {formatAircraftLabel(flight.aircraft)}
                      </span>
                      {' • '}
                      <span className="text-slate-700">
                        {flight.student?.trainingLevel || 'Unknown Level'}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 shadow-lg shadow-blue-200"
                        onClick={() => handleReschedule(flight)}
                        data-testid={`reschedule-button-${flight.id}`}
                      >
                        AI Reschedule
                      </Button>
                    </div>
                  </div>
                </div>
              ))}

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between pt-4 border-t border-slate-200">
                  <p className="text-sm text-slate-600">
                    Showing {flights.length} of {totalCount || totalPages * 20} flights
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(page - 1)}
                      disabled={page === 1}
                      className="border-blue-300 text-slate-700 hover:bg-blue-50 bg-transparent"
                    >
                      Previous
                    </Button>
                    <span className="text-sm text-slate-600 px-2">
                      Page {page} of {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(page + 1)}
                      disabled={page === totalPages}
                      className="border-blue-300 text-slate-700 hover:bg-blue-50 bg-transparent"
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      <RescheduleDialog open={rescheduleOpen} onOpenChange={setRescheduleOpen} flight={selectedFlight} onSuccess={fetchFlights} />
    </>
  )
}

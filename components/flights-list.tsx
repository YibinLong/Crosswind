"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Search, Plus, Filter, Plane, MapPin, Clock, User, Calendar } from "lucide-react"
import { useState } from "react"
import { BookFlightDialog } from "@/components/book-flight-dialog"
import { RescheduleDialog } from "@/components/reschedule-dialog"

// Mock flight data
const mockFlights = [
  {
    id: "FL-2024-001",
    student: "Sarah Johnson",
    trainingLevel: "Student Pilot",
    date: "2024-01-15",
    time: "2:00 PM",
    location: "KJFK - KTEB",
    instructor: "Capt. James Miller",
    aircraft: "Cessna 172 (N12345)",
    status: "conflict",
    weatherIssue: "Crosswinds 15kt gusting 22kt",
  },
  {
    id: "FL-2024-002",
    student: "Emma Wilson",
    trainingLevel: "Private Pilot",
    date: "2024-01-15",
    time: "10:00 AM",
    location: "KLAX - KSNA",
    instructor: "Capt. Sarah Davis",
    aircraft: "Piper PA-28 (N67890)",
    status: "confirmed",
  },
  {
    id: "FL-2024-003",
    student: "Mike Chen",
    trainingLevel: "Instrument Rated",
    date: "2024-01-16",
    time: "9:00 AM",
    location: "KORD - KMDW",
    instructor: "Capt. Robert Lee",
    aircraft: "Cessna 172 (N24680)",
    status: "pending",
  },
]

export function FlightsList() {
  const [searchQuery, setSearchQuery] = useState("")
  const [bookFlightOpen, setBookFlightOpen] = useState(false)
  const [rescheduleOpen, setRescheduleOpen] = useState(false)
  const [selectedFlight, setSelectedFlight] = useState<(typeof mockFlights)[0] | null>(null)

  const handleReschedule = (flight: (typeof mockFlights)[0]) => {
    setSelectedFlight(flight)
    setRescheduleOpen(true)
  }

  return (
    <>
      <Card className="bg-white border-blue-200 shadow-lg">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <CardTitle className="text-slate-900 flex items-center gap-2">
              <Plane className="h-6 w-6 text-blue-600" />
              All Flights
            </CardTitle>
            <div className="flex items-center gap-2">
              <div className="relative flex-1 sm:w-64">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Search flights..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-white border-blue-200 text-slate-900"
                />
              </div>
              <Button
                variant="outline"
                size="icon"
                className="border-blue-300 text-slate-700 hover:bg-blue-50 bg-transparent"
              >
                <Filter className="h-4 w-4" />
              </Button>
              <Button
                className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 gap-2 shadow-lg shadow-blue-200"
                onClick={() => setBookFlightOpen(true)}
              >
                <Plus className="h-4 w-4" />
                Book Flight
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {mockFlights.map((flight) => (
            <div
              key={flight.id}
              className={`p-6 rounded-lg border-2 transition-all ${
                flight.status === "conflict"
                  ? "bg-red-50 border-red-300 hover:border-red-400 shadow-md"
                  : "bg-blue-50/30 border-blue-200 hover:border-blue-300 hover:shadow-md"
              }`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-4">
                  <div
                    className={`h-12 w-12 rounded-lg flex items-center justify-center shadow-lg ${
                      flight.status === "conflict"
                        ? "bg-gradient-to-br from-red-600 to-orange-600 shadow-red-300/50"
                        : "bg-gradient-to-br from-blue-600 to-cyan-600 shadow-blue-300/50"
                    }`}
                  >
                    <Plane className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <p className="text-xl font-semibold text-slate-900">{flight.id}</p>
                    <p className="text-sm text-slate-600">{flight.student}</p>
                  </div>
                </div>
                <Badge
                  variant={
                    flight.status === "confirmed"
                      ? "default"
                      : flight.status === "conflict"
                        ? "destructive"
                        : "secondary"
                  }
                  className={
                    flight.status === "confirmed"
                      ? "bg-green-100 text-green-700 border-green-300"
                      : flight.status === "conflict"
                        ? "bg-red-100 text-red-700 border-red-300"
                        : "bg-yellow-100 text-yellow-700 border-yellow-300"
                  }
                >
                  {flight.status}
                </Badge>
              </div>

              {flight.weatherIssue && (
                <div className="mb-4 p-3 bg-red-100 border border-red-300 rounded-lg">
                  <p className="text-sm text-red-700 font-medium">Weather Conflict: {flight.weatherIssue}</p>
                </div>
              )}

              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-slate-500" />
                  <div>
                    <p className="text-xs text-slate-500">Date</p>
                    <p className="text-sm text-slate-700">{flight.date}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-slate-500" />
                  <div>
                    <p className="text-xs text-slate-500">Time</p>
                    <p className="text-sm text-slate-700">{flight.time}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-slate-500" />
                  <div>
                    <p className="text-xs text-slate-500">Route</p>
                    <p className="text-sm text-slate-700">{flight.location}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-slate-500" />
                  <div>
                    <p className="text-xs text-slate-500">Instructor</p>
                    <p className="text-sm text-slate-700">{flight.instructor}</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-slate-300">
                <div className="text-sm text-slate-600">
                  <span className="text-slate-900 font-medium">{flight.aircraft}</span> • {flight.trainingLevel}
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-blue-300 text-slate-700 hover:bg-blue-50 bg-transparent"
                  >
                    View Details
                  </Button>
                  {flight.status === "conflict" && (
                    <Button
                      size="sm"
                      className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 shadow-lg shadow-blue-200"
                      onClick={() => handleReschedule(flight)}
                    >
                      AI Reschedule
                    </Button>
                  )}
                  {flight.status !== "conflict" && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-blue-300 text-slate-700 hover:bg-blue-50 bg-transparent"
                      onClick={() => handleReschedule(flight)}
                    >
                      Reschedule
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <BookFlightDialog open={bookFlightOpen} onOpenChange={setBookFlightOpen} />
      <RescheduleDialog open={rescheduleOpen} onOpenChange={setRescheduleOpen} flight={selectedFlight} />
    </>
  )
}

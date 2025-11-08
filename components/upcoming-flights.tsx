import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Calendar, MapPin, User, Clock, Plane } from "lucide-react"

const mockFlights = [
  {
    id: "FL-2024-005",
    student: "Emma Wilson",
    trainingLevel: "Private Pilot",
    date: "Today, 10:00 AM",
    location: "KJFK - KTEB",
    instructor: "Capt. James Miller",
    aircraft: "Cessna 172 (N12345)",
    status: "confirmed",
  },
  {
    id: "FL-2024-006",
    student: "David Brown",
    trainingLevel: "Student Pilot",
    date: "Today, 1:00 PM",
    location: "KLAX - KSNA",
    instructor: "Capt. Sarah Davis",
    aircraft: "Piper PA-28 (N67890)",
    status: "confirmed",
  },
  {
    id: "FL-2024-007",
    student: "Lisa Anderson",
    trainingLevel: "Instrument Rated",
    date: "Tomorrow, 9:00 AM",
    location: "KORD - KMDW",
    instructor: "Capt. Robert Lee",
    aircraft: "Cessna 172 (N24680)",
    status: "pending",
  },
]

export function UpcomingFlights() {
  return (
    <Card className="bg-white border-blue-200 shadow-lg">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-slate-900 flex items-center gap-2">
            <Calendar className="h-5 w-5 text-blue-600" />
            Upcoming Flights
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            className="border-blue-300 text-slate-700 hover:bg-blue-50 bg-transparent"
          >
            View All
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {mockFlights.map((flight) => (
          <div
            key={flight.id}
            className="p-4 rounded-lg bg-blue-50/50 border border-blue-200 hover:border-blue-300 hover:shadow-md transition-all"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-blue-600 to-cyan-600 flex items-center justify-center shadow-lg shadow-blue-300/50">
                  <Plane className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-slate-900 font-semibold">{flight.id}</p>
                  <p className="text-sm text-slate-600">{flight.student}</p>
                </div>
              </div>
              <Badge
                variant={flight.status === "confirmed" ? "default" : "secondary"}
                className={
                  flight.status === "confirmed"
                    ? "bg-green-100 text-green-700 border-green-300"
                    : "bg-yellow-100 text-yellow-700 border-yellow-300"
                }
              >
                {flight.status}
              </Badge>
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm mb-4">
              <div className="flex items-center gap-2 text-slate-700">
                <Clock className="h-4 w-4 text-slate-500" />
                {flight.date}
              </div>
              <div className="flex items-center gap-2 text-slate-700">
                <MapPin className="h-4 w-4 text-slate-500" />
                {flight.location}
              </div>
              <div className="flex items-center gap-2 text-slate-700">
                <User className="h-4 w-4 text-slate-500" />
                {flight.instructor}
              </div>
              <div className="flex items-center gap-2 text-slate-700">
                <Plane className="h-4 w-4 text-slate-500" />
                {flight.aircraft}
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                className="border-blue-300 text-slate-700 flex-1 hover:bg-blue-50 bg-transparent"
              >
                View Details
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="border-blue-300 text-slate-700 hover:bg-blue-50 bg-transparent"
              >
                Reschedule
              </Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

import { format } from "date-fns"
import { Hash, User, MapPin, Clock, Plane, UserCheck, GraduationCap } from "lucide-react"
import { formatAircraftLabel, formatRouteLocations } from "@/lib/utils"

interface FlightInfoStudent {
  name?: string | null
  trainingLevel?: string | null
}

interface FlightInfoInstructor {
  name?: string | null
}

interface FlightInfoAircraft {
  model?: string | null
  tailNumber?: string | null
}

export interface FlightInfoData {
  id: number | string
  scheduledDate?: string
  student?: FlightInfoStudent | null
  instructor?: FlightInfoInstructor | null
  aircraft?: FlightInfoAircraft | null
  departureLat?: number | null
  departureLon?: number | null
  arrivalLat?: number | null
  arrivalLon?: number | null
}

interface FlightInfoGridProps {
  flight: FlightInfoData
}

const formatSchedule = (date?: string) => {
  if (!date) return "TBD"
  try {
    return format(new Date(date), "MMM d, h:mm a")
  } catch {
    return "TBD"
  }
}

const formatFlightNumber = (id: number | string | undefined) => {
  if (typeof id === "number") {
    return `FL-${String(id).padStart(4, "0")}`
  }
  if (!id) return "TBD"
  return String(id).startsWith("FL-") ? String(id) : `FL-${id}`
}

export function FlightInfoGrid({ flight }: FlightInfoGridProps) {
  const items = [
    {
      label: "Flight",
      value: formatFlightNumber(flight.id),
      icon: Hash
    },
    {
      label: "Student",
      value: flight.student?.name || "Unknown Student",
      icon: User
    },
    {
      label: "Route",
      value: formatRouteLocations(
        flight.departureLat ?? (flight as any).departure?.lat,
        flight.departureLon ?? (flight as any).departure?.lon,
        flight.arrivalLat ?? (flight as any).arrival?.lat,
        flight.arrivalLon ?? (flight as any).arrival?.lon
      ),
      icon: MapPin
    },
    {
      label: "Scheduled",
      value: formatSchedule(flight.scheduledDate),
      icon: Clock
    },
    {
      label: "Aircraft",
      value: formatAircraftLabel(flight.aircraft),
      icon: Plane
    },
    {
      label: "Instructor",
      value: flight.instructor?.name || "Unassigned",
      icon: UserCheck
    },
    {
      label: "Level",
      value: flight.student?.trainingLevel || "Unknown",
      icon: GraduationCap
    }
  ]

  return (
    <div className="grid sm:grid-cols-2 gap-4 text-sm">
      {items.map((item) => (
        <div key={item.label} className="flex items-center gap-2">
          <item.icon className="h-4 w-4 text-slate-500" />
          <div>
            <p className="text-xs text-slate-500">{item.label}</p>
            <p className="text-sm text-slate-700">{item.value}</p>
          </div>
        </div>
      ))}
    </div>
  )
}

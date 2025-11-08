import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { AlertTriangle, Cloud, Wind, CloudRain } from "lucide-react"

// Mock data - will be replaced with real API data
const mockAlerts = [
  {
    id: 1,
    severity: "high",
    flightId: "FL-2024-001",
    studentName: "Sarah Johnson",
    scheduledTime: "2:00 PM Today",
    location: "KJFK",
    issue: "Crosswinds 15kt gusting 22kt",
    trainingLevel: "Student Pilot",
    weatherMinimums: "Max 10kt crosswind",
  },
  {
    id: 2,
    severity: "medium",
    flightId: "FL-2024-003",
    studentName: "Mike Chen",
    scheduledTime: "4:30 PM Today",
    location: "KLAX",
    issue: "Visibility 2.5 SM in haze",
    trainingLevel: "Private Pilot",
    weatherMinimums: "Min 3 SM visibility",
  },
]

export function WeatherAlerts() {
  return (
    <Card className="bg-white border-blue-200 shadow-lg">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            <CardTitle className="text-slate-900">Active Weather Alerts</CardTitle>
            <Badge variant="destructive" className="ml-2 bg-red-100 text-red-700 border-red-300">
              {mockAlerts.length}
            </Badge>
          </div>
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
        {mockAlerts.length === 0 ? (
          <div className="text-center py-8 text-slate-500">
            <Cloud className="h-12 w-12 mx-auto mb-2 opacity-30" />
            <p>No active weather alerts</p>
            <p className="text-sm">All flights are clear for takeoff</p>
          </div>
        ) : (
          mockAlerts.map((alert) => (
            <Alert
              key={alert.id}
              className={`border-2 ${
                alert.severity === "high" ? "bg-red-50 border-red-300" : "bg-yellow-50 border-yellow-300"
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <AlertTitle className="text-slate-900 flex items-center gap-2 mb-2">
                    {alert.severity === "high" ? (
                      <Wind className="h-4 w-4 text-red-600" />
                    ) : (
                      <CloudRain className="h-4 w-4 text-yellow-600" />
                    )}
                    Flight {alert.flightId} - Weather Conflict Detected
                  </AlertTitle>
                  <AlertDescription className="text-slate-700 space-y-2">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-slate-500">Student:</span>
                        <span className="ml-2 font-medium text-slate-900">{alert.studentName}</span>
                      </div>
                      <div>
                        <span className="text-slate-500">Scheduled:</span>
                        <span className="ml-2 font-medium text-slate-900">{alert.scheduledTime}</span>
                      </div>
                      <div>
                        <span className="text-slate-500">Location:</span>
                        <span className="ml-2 font-medium text-slate-900">{alert.location}</span>
                      </div>
                      <div>
                        <span className="text-slate-500">Level:</span>
                        <span className="ml-2 font-medium text-slate-900">{alert.trainingLevel}</span>
                      </div>
                    </div>
                    <div className="flex items-start gap-2 pt-2 border-t border-slate-300">
                      <AlertTriangle
                        className={`h-4 w-4 mt-0.5 ${alert.severity === "high" ? "text-red-600" : "text-yellow-600"}`}
                      />
                      <div>
                        <p className="font-medium text-slate-900">{alert.issue}</p>
                        <p className="text-xs text-slate-500">Exceeds minimums: {alert.weatherMinimums}</p>
                      </div>
                    </div>
                    <div className="flex gap-2 pt-3">
                      <Button
                        size="sm"
                        className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 shadow-lg shadow-blue-200"
                      >
                        AI Reschedule
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-blue-300 text-slate-700 hover:bg-blue-50 bg-transparent"
                      >
                        View Details
                      </Button>
                      <Button size="sm" variant="ghost" className="text-slate-600 hover:bg-slate-100">
                        Dismiss
                      </Button>
                    </div>
                  </AlertDescription>
                </div>
              </div>
            </Alert>
          ))
        )}
      </CardContent>
    </Card>
  )
}

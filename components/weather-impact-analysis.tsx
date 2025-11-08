import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Cloud, Wind, CloudRain, CloudSnow, Thermometer } from "lucide-react"

const weatherFactors = [
  {
    factor: "Crosswinds",
    incidents: 12,
    percentage: 35,
    icon: Wind,
    color: "text-cyan-400",
  },
  {
    factor: "Low Visibility",
    incidents: 9,
    percentage: 26,
    icon: Cloud,
    color: "text-slate-400",
  },
  {
    factor: "Thunderstorms",
    incidents: 7,
    percentage: 21,
    icon: CloudRain,
    color: "text-yellow-400",
  },
  {
    factor: "Temperature",
    incidents: 4,
    percentage: 12,
    icon: Thermometer,
    color: "text-orange-400",
  },
  {
    factor: "Icing Conditions",
    incidents: 2,
    percentage: 6,
    icon: CloudSnow,
    color: "text-blue-400",
  },
]

const topAirports = [
  { code: "KJFK", name: "JFK International", conflicts: 8, total: 45 },
  { code: "KLAX", name: "Los Angeles Intl", conflicts: 6, total: 38 },
  { code: "KORD", name: "O'Hare International", conflicts: 5, total: 32 },
  { code: "KSFO", name: "San Francisco Intl", conflicts: 4, total: 28 },
]

export function WeatherImpactAnalysis() {
  return (
    <div className="grid lg:grid-cols-2 gap-6">
      {/* Weather Factors */}
      <Card className="bg-white border-blue-200 shadow-lg">
        <CardHeader>
          <CardTitle className="text-slate-900">Top Weather Conflict Factors</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {weatherFactors.map((factor, index) => (
            <div key={index} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <factor.icon className={`h-5 w-5 ${factor.color}`} />
                  <span className="text-slate-700 font-medium">{factor.factor}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-slate-600">{factor.incidents} incidents</span>
                  <Badge variant="secondary" className="bg-blue-100 text-blue-700 border-blue-300">
                    {factor.percentage}%
                  </Badge>
                </div>
              </div>
              <Progress value={factor.percentage} className="h-2" />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Airport Impact */}
      <Card className="bg-white border-blue-200 shadow-lg">
        <CardHeader>
          <CardTitle className="text-slate-900">Airports with Most Weather Conflicts</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {topAirports.map((airport, index) => (
            <div
              key={index}
              className="p-4 rounded-lg bg-blue-50/50 border border-blue-200 hover:shadow-md transition-all"
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="text-slate-900 font-semibold">{airport.code}</p>
                  <p className="text-sm text-slate-600">{airport.name}</p>
                </div>
                <Badge className="bg-orange-100 text-orange-700 border-orange-300">{airport.conflicts} conflicts</Badge>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-600">Conflict Rate</span>
                  <span className="text-slate-900 font-medium">
                    {Math.round((airport.conflicts / airport.total) * 100)}%
                  </span>
                </div>
                <Progress value={(airport.conflicts / airport.total) * 100} className="h-2" />
                <div className="text-xs text-slate-500">
                  {airport.conflicts} of {airport.total} flights affected
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}

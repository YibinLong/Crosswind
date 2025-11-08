import { Card, CardContent } from "@/components/ui/card"
import { TrendingUp, TrendingDown, Calendar, AlertTriangle, CheckCircle2, Clock } from "lucide-react"

const metrics = [
  {
    label: "Total Flights Booked",
    value: "247",
    change: "+12.3%",
    trend: "up",
    icon: Calendar,
    color: "from-blue-600 to-cyan-600",
  },
  {
    label: "Weather Conflicts Detected",
    value: "34",
    change: "+8.1%",
    trend: "up",
    icon: AlertTriangle,
    color: "from-orange-600 to-red-600",
  },
  {
    label: "Successful Reschedules",
    value: "31",
    change: "91.2% success rate",
    trend: "neutral",
    icon: CheckCircle2,
    color: "from-green-600 to-emerald-600",
  },
  {
    label: "Avg Reschedule Time",
    value: "3.2 min",
    change: "-15.4%",
    trend: "down",
    icon: Clock,
    color: "from-purple-600 to-pink-600",
  },
]

export function AnalyticsOverview() {
  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {metrics.map((metric, index) => (
        <Card
          key={index}
          className="bg-white border-blue-200 shadow-md hover:shadow-xl hover:border-blue-300 transition-all"
        >
          <CardContent className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-sm text-slate-600 mb-1">{metric.label}</p>
                <p className="text-3xl font-bold text-slate-900">{metric.value}</p>
              </div>
              <div
                className={`h-12 w-12 rounded-lg bg-gradient-to-br ${metric.color} flex items-center justify-center shadow-lg`}
              >
                <metric.icon className="h-6 w-6 text-white" />
              </div>
            </div>
            <div className="flex items-center gap-2">
              {metric.trend === "up" && <TrendingUp className="h-4 w-4 text-green-600" />}
              {metric.trend === "down" && <TrendingDown className="h-4 w-4 text-green-600" />}
              <span className={`text-sm ${metric.trend === "neutral" ? "text-slate-600" : "text-green-600"}`}>
                {metric.change}
              </span>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

import { Card, CardContent } from "@/components/ui/card"
import { Plane, Calendar, AlertTriangle, TrendingUp } from "lucide-react"

const stats = [
  {
    label: "Today's Flights",
    value: "8",
    change: "+2 from yesterday",
    icon: Plane,
    color: "from-blue-600 to-cyan-600",
  },
  {
    label: "Scheduled This Week",
    value: "42",
    change: "6 pending confirmation",
    icon: Calendar,
    color: "from-purple-600 to-pink-600",
  },
  {
    label: "Active Alerts",
    value: "2",
    change: "Needs attention",
    icon: AlertTriangle,
    color: "from-orange-600 to-red-600",
  },
  {
    label: "Completion Rate",
    value: "94%",
    change: "+3% this month",
    icon: TrendingUp,
    color: "from-green-600 to-emerald-600",
  },
]

export function QuickStats() {
  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat, index) => (
        <Card
          key={index}
          className="bg-white border-blue-200 shadow-md hover:shadow-xl hover:border-blue-300 transition-all"
        >
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 mb-1">{stat.label}</p>
                <p className="text-3xl font-bold text-slate-900">{stat.value}</p>
                <p className="text-xs text-slate-500 mt-2">{stat.change}</p>
              </div>
              <div
                className={`h-12 w-12 rounded-lg bg-gradient-to-br ${stat.color} flex items-center justify-center shadow-lg`}
              >
                <stat.icon className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

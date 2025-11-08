import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle2, Clock, AlertCircle, Calendar } from "lucide-react"

const activities = [
  {
    id: 1,
    type: "completed",
    message: "Flight FL-2024-004 completed successfully",
    time: "2 hours ago",
    icon: CheckCircle2,
    color: "text-green-400",
  },
  {
    id: 2,
    type: "rescheduled",
    message: "FL-2024-001 rescheduled due to weather",
    time: "4 hours ago",
    icon: Calendar,
    color: "text-blue-400",
  },
  {
    id: 3,
    type: "alert",
    message: "Weather alert for FL-2024-003",
    time: "5 hours ago",
    icon: AlertCircle,
    color: "text-yellow-400",
  },
  {
    id: 4,
    type: "scheduled",
    message: "New flight booked: FL-2024-008",
    time: "Yesterday",
    icon: Clock,
    color: "text-cyan-400",
  },
]

export function RecentActivity() {
  return (
    <Card className="bg-white border-blue-200 shadow-lg">
      <CardHeader>
        <CardTitle className="text-slate-900">Recent Activity</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {activities.map((activity) => (
          <div key={activity.id} className="flex items-start gap-3">
            <div className={`mt-0.5 ${activity.color}`}>
              <activity.icon className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <p className="text-sm text-slate-700 leading-relaxed">{activity.message}</p>
              <p className="text-xs text-slate-500 mt-1">{activity.time}</p>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

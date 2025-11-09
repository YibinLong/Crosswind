"use client"

import { Card, CardContent } from "@/components/ui/card"
import { TrendingUp, TrendingDown, Calendar, AlertTriangle, CheckCircle2, Clock } from "lucide-react"
import { useEffect, useState } from "react"
import { api } from "@/lib/api"

interface OverviewMetric {
  label: string
  value: string
  change: string
  trend: "up" | "down" | "neutral"
  icon: any
  color: string
}

export function AnalyticsOverview() {
  const [metrics, setMetrics] = useState<OverviewMetric[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchOverviewData = async () => {
      try {
        const response = await api.analytics.getOverview()
        if (response.data.success) {
          const data = response.data.data

          const overviewMetrics: OverviewMetric[] = [
            {
              label: "Total Flights Booked",
              value: data.totalFlights.toString(),
              change: data.trends.totalFlightsChange,
              trend: data.trends.totalFlightsChange.startsWith('-') ? "down" : "up",
              icon: Calendar,
              color: "from-blue-600 to-cyan-600",
            },
            {
              label: "Weather Conflicts Detected",
              value: data.weatherConflicts.toString(),
              change: data.trends.conflictsChange,
              trend: data.trends.conflictsChange.startsWith('-') ? "down" : "up",
              icon: AlertTriangle,
              color: "from-orange-600 to-red-600",
            },
            {
              label: "Successful Reschedules",
              value: data.successfulReschedules.toString(),
              change: data.successRate,
              trend: "neutral",
              icon: CheckCircle2,
              color: "from-green-600 to-emerald-600",
            },
            {
              label: "Avg Reschedule Time",
              value: `${data.avgRescheduleTime} min`,
              change: data.trends.rescheduleTimeChange,
              trend: data.trends.rescheduleTimeChange.startsWith('-') ? "down" : "up",
              icon: Clock,
              color: "from-purple-600 to-pink-600",
            },
          ]

          setMetrics(overviewMetrics)
        }
      } catch (err) {
        console.error('Error fetching analytics overview:', err)
        setError('Failed to load analytics data')
      } finally {
        setLoading(false)
      }
    }

    fetchOverviewData()
  }, [])

  if (loading) {
    return (
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((index) => (
          <Card key={index} className="bg-white border-blue-200 shadow-md">
            <CardContent className="p-6">
              <div className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded mb-2 w-24"></div>
                <div className="h-8 bg-gray-200 rounded mb-4 w-16"></div>
                <div className="h-4 bg-gray-200 rounded w-20"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600">{error}</p>
      </div>
    )
  }

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

'use client'

import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Plane, Calendar, AlertTriangle, TrendingUp } from "lucide-react"
import { useEffect, useState } from "react"
import { api, DashboardStats } from "@/lib/api"

interface StatConfig {
  label: string
  value: string | number
  change: string
  icon: any
  color: string
}

export function QuickStats() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchStats()

    // Refresh stats every 5 minutes
    const interval = setInterval(fetchStats, 5 * 60 * 1000)

    return () => clearInterval(interval)
  }, [])

  const fetchStats = async () => {
    try {
      setError(null)
      const response = await api.dashboard.getStats()
      setStats(response.data)
    } catch (err: any) {
      console.error('Failed to fetch dashboard stats:', err)
      setError('Failed to load statistics')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="bg-white border-blue-200 shadow-md">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <Skeleton className="h-4 w-24 mb-2" />
                  <Skeleton className="h-8 w-16 mb-2" />
                  <Skeleton className="h-3 w-20" />
                </div>
                <Skeleton className="h-12 w-12 rounded-lg" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (error || !stats) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-600 text-sm">{error || 'Failed to load statistics'}</p>
        <button
          onClick={fetchStats}
          className="mt-2 text-sm text-red-700 underline hover:no-underline"
        >
          Try again
        </button>
      </div>
    )
  }

  const statConfigs: StatConfig[] = [
    {
      label: "Today's Flights",
      value: stats.todayFlights,
      change: `${stats.weeklyScheduled} scheduled this week`,
      icon: Plane,
      color: "from-blue-600 to-cyan-600",
    },
    {
      label: "Scheduled This Week",
      value: stats.weeklyScheduled,
      change: `${stats.totalStudents} students active`,
      icon: Calendar,
      color: "from-purple-600 to-pink-600",
    },
    {
      label: "Active Alerts",
      value: stats.activeConflicts,
      change: stats.activeConflicts > 0 ? "Needs attention" : "All clear",
      icon: AlertTriangle,
      color: stats.activeConflicts > 0 ? "from-orange-600 to-red-600" : "from-green-600 to-emerald-600",
    },
    {
      label: "Completion Rate",
      value: `${stats.completionRate}%`,
      change: `${stats.totalAircraft} aircraft available`,
      icon: TrendingUp,
      color: "from-green-600 to-emerald-600",
    },
  ]

  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {statConfigs.map((stat, index) => (
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

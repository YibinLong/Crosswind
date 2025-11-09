"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Line, LineChart, Bar, BarChart, XAxis, YAxis, CartesianGrid, Legend, ResponsiveContainer } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { useEffect, useState } from "react"
import { api } from "@/lib/api"

interface FlightActivityData {
  month: string
  booked: number
  completed: number
  cancelled: number
}

interface WeatherConflictData {
  week: string
  conflicts: number
}

interface PerformanceData {
  flightActivity: FlightActivityData[]
  weatherConflicts: WeatherConflictData[]
}

export function PerformanceCharts() {
  const [data, setData] = useState<PerformanceData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchPerformanceData = async () => {
      try {
        const response = await api.analytics.getPerformance()
        if (response.data.success) {
          setData(response.data.data)
        }
      } catch (err) {
        console.error('Error fetching performance data:', err)
        setError('Failed to load performance data')
      } finally {
        setLoading(false)
      }
    }

    fetchPerformanceData()
  }, [])

  if (loading) {
    return (
      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="bg-white border-blue-200 shadow-lg">
          <CardHeader>
            <CardTitle className="text-slate-900">Flight Activity Trends</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] animate-pulse">
              <div className="h-full bg-gray-200 rounded"></div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white border-blue-200 shadow-lg">
          <CardHeader>
            <CardTitle className="text-slate-900">Weather Conflicts Over Time</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] animate-pulse">
              <div className="h-full bg-gray-200 rounded"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="bg-white border-blue-200 shadow-lg">
          <CardContent className="p-6 text-center">
            <p className="text-red-600">{error}</p>
          </CardContent>
        </Card>
        <Card className="bg-white border-blue-200 shadow-lg">
          <CardContent className="p-6 text-center">
            <p className="text-red-600">{error}</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!data) {
    return null
  }

  return (
    <div className="grid lg:grid-cols-2 gap-6">
      {/* Flight Activity Chart */}
      <Card className="bg-white border-blue-200 shadow-lg">
        <CardHeader>
          <CardTitle className="text-slate-900">Flight Activity Trends</CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer
            config={{
              booked: {
                label: "Booked",
                color: "hsl(200, 100%, 50%)",
              },
              completed: {
                label: "Completed",
                color: "hsl(140, 70%, 45%)",
              },
              cancelled: {
                label: "Cancelled",
                color: "hsl(0, 70%, 55%)",
              },
            }}
            className="h-[300px]"
          >
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.flightActivity}>
                <CartesianGrid strokeDasharray="3 3" stroke="#cbd5e1" />
                <XAxis dataKey="month" stroke="#475569" />
                <YAxis stroke="#475569" />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Legend />
                <Line type="monotone" dataKey="booked" stroke="hsl(200, 100%, 50%)" strokeWidth={2} name="Booked" />
                <Line
                  type="monotone"
                  dataKey="completed"
                  stroke="hsl(140, 70%, 45%)"
                  strokeWidth={2}
                  name="Completed"
                />
                <Line type="monotone" dataKey="cancelled" stroke="hsl(0, 70%, 55%)" strokeWidth={2} name="Cancelled" />
              </LineChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Weather Conflicts Chart */}
      <Card className="bg-white border-blue-200 shadow-lg">
        <CardHeader>
          <CardTitle className="text-slate-900">Weather Conflicts Over Time</CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer
            config={{
              conflicts: {
                label: "Conflicts",
                color: "hsl(30, 90%, 55%)",
              },
            }}
            className="h-[300px]"
          >
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.weatherConflicts}>
                <CartesianGrid strokeDasharray="3 3" stroke="#cbd5e1" />
                <XAxis dataKey="week" stroke="#475569" />
                <YAxis stroke="#475569" />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Legend />
                <Bar dataKey="conflicts" fill="hsl(30, 90%, 55%)" name="Conflicts" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  )
}
